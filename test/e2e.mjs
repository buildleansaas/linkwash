// Loads the real unpacked extension into Chromium and checks what lands on the clipboard.
// Usage: node test/e2e.mjs [--shots <dir>]   (--shots also saves store screenshots)
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const shotsIdx = process.argv.indexOf("--shots");
const shotsDir = shotsIdx > -1 ? path.resolve(process.argv[shotsIdx + 1]) : null;

const DIRTY = "https://x.com/Ihyvd014/status/2115497330082504960?a=jTJ6AphNO7lStihknsk&s=20";
const CLEAN = "https://x.com/Ihyvd014/status/2115497330082504960";

const page = `<!doctype html><meta charset="utf-8"><title>Share test</title>
<body style="font:16px system-ui;padding:40px">
<p id="plain">${DIRTY}</p>
<button id="share" onclick="navigator.clipboard.writeText(document.getElementById('plain').textContent)">Copy link</button>
<button id="share-legacy" onclick="(()=>{const t=document.createElement('textarea');t.value=document.getElementById('plain').textContent;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove()})()">Copy link (old way)</button>
<p id="mixed">Read this: ${DIRTY}</p>
</body>`;

const server = http.createServer((_req, res) => {
  res.writeHead(200, { "content-type": "text/html" });
  res.end(page);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = `http://127.0.0.1:${server.address().port}`;

const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "linkwash-e2e-"));
const context = await chromium.launchPersistentContext(userDataDir, {
  channel: "chromium",
  headless: !process.env.HEADED,
  permissions: ["clipboard-read", "clipboard-write"],
  args: [`--disable-extensions-except=${root}`, `--load-extension=${root}`],
});

let failures = 0;
async function check(name, fn) {
  try {
    await fn();
    console.log(`ok - ${name}`);
  } catch (err) {
    failures++;
    console.log(`not ok - ${name}\n  ${err.message.split("\n").join("\n  ")}`);
  }
}

try {
  let [worker] = context.serviceWorkers();
  if (!worker) worker = await context.waitForEvent("serviceworker");
  const extId = new URL(worker.url()).host;

  const tab = await context.newPage();
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin });
  await tab.goto(origin);
  const readClipboard = () => tab.evaluate(() => navigator.clipboard.readText());
  const resetClipboard = () => tab.evaluate(() => navigator.clipboard.writeText("reset"));
  const mod = process.platform === "darwin" ? "Meta" : "Control";

  async function selectAndCopy(id) {
    await tab.evaluate((id) => {
      const r = document.createRange();
      r.selectNodeContents(document.getElementById(id));
      const s = getSelection();
      s.removeAllRanges();
      s.addRange(r);
    }, id);
    await tab.keyboard.press(`${mod}+KeyC`);
  }

  await check("share button (navigator.clipboard.writeText) copies the clean link", async () => {
    await resetClipboard();
    await tab.click("#share");
    assert.equal(await readClipboard(), CLEAN);
  });

  await check("old-style share button (hidden text box + execCommand) copies the clean link", async () => {
    await resetClipboard();
    await tab.click("#share-legacy");
    assert.equal(await readClipboard(), CLEAN);
  });

  await check("selecting a link and pressing copy gives the clean link", async () => {
    await resetClipboard();
    await selectAndCopy("plain");
    assert.equal((await readClipboard()).trim(), CLEAN);
  });

  await check("a sentence with a link in it is left alone", async () => {
    await resetClipboard();
    await selectAndCopy("mixed");
    assert.equal((await readClipboard()).trim(), `Read this: ${DIRTY}`);
  });

  await check("right-click menu and shortcut path (offscreen copy) copies the clean link", async () => {
    await resetClipboard();
    const result = await worker.evaluate((url) => copyClean(url), DIRTY);
    assert.equal(result, CLEAN);
    await tab.bringToFront();
    assert.equal(await readClipboard(), CLEAN);
  });

  const popup = await context.newPage();
  await popup.setViewportSize({ width: 320, height: 330 });
  await popup.goto(`chrome-extension://${extId}/src/popup.html`);

  await check("popup counts washed links", async () => {
    await popup.waitForFunction(() => document.getElementById("count").textContent !== "0");
    assert.equal(await popup.textContent("#count"), "4");
  });

  if (shotsDir) {
    fs.mkdirSync(shotsDir, { recursive: true });
    await popup.locator("body").screenshot({ path: path.join(shotsDir, "popup-on.png") });
  }

  await check("turning it off copies links exactly as they are", async () => {
    await popup.click(".switch span");
    await tab.waitForTimeout(150);
    await resetClipboard();
    await tab.click("#share");
    assert.equal(await readClipboard(), DIRTY);
    await resetClipboard();
    await selectAndCopy("plain");
    assert.equal((await readClipboard()).trim(), DIRTY);
    await resetClipboard();
    await tab.click("#share-legacy");
    assert.equal(await readClipboard(), DIRTY);
  });

  if (shotsDir) await popup.locator("body").screenshot({ path: path.join(shotsDir, "popup-off.png") });

  await check("turning it back on cleans again", async () => {
    await popup.click(".switch span");
    await tab.waitForTimeout(150);
    await resetClipboard();
    await tab.click("#share");
    assert.equal(await readClipboard(), CLEAN);
  });
} finally {
  await context.close();
  server.close();
  fs.rmSync(userDataDir, { recursive: true, force: true });
}

console.log(failures ? `\n${failures} failed` : "\nall e2e checks passed");
process.exit(failures ? 1 : 0);
