// Renders Chrome Web Store images (1280x800 screenshots, 440x280 promo tile) from HTML.
// Needs store/shots-tmp/popup-on.png from `node test/e2e.mjs --shots store/shots-tmp`.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const b64 = (p) => "data:image/png;base64," + fs.readFileSync(path.join(root, p)).toString("base64");
const icon = b64("icons/512.png");
const popup = b64("store/shots-tmp/popup-on.png");

const base = `<style>
*{box-sizing:border-box;margin:0}
body{font-family:-apple-system,"Segoe UI",system-ui,sans-serif;color:#0f172a;background:linear-gradient(160deg,#e0f2fe,#f8fafc 60%);}
.url{font:500 22px ui-monospace,Menlo,monospace;background:#fff;border:1px solid #cbd5e1;border-radius:12px;padding:16px 20px;word-break:break-all}
.junk{background:#fee2e2;color:#b91c1c;text-decoration:line-through;border-radius:4px}
.lab{font-weight:700;font-size:16px;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin:0 0 8px}
</style>`;

const DIRTY = 'https://x.com/someone/status/2115497330082504960<span class="junk">?a=jTJ6AphNO7lStihknsk&amp;s=20</span>';
const CLEAN = "https://x.com/someone/status/2115497330082504960";

const pages = {
  "screenshot-1-before-after": `${base}<body style="width:1280px;height:800px;padding:70px 80px;display:flex;gap:60px;align-items:center">
    <div style="flex:1">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:28px"><img src="${icon}" width="64"><b style="font-size:34px">LinkWash</b></div>
      <h1 style="font-size:52px;line-height:1.1;margin-bottom:36px">Copy a link.<br>Paste a clean one.</h1>
      <p class="lab">You copy</p><div class="url" style="margin-bottom:24px">${DIRTY}</div>
      <p class="lab">You paste</p><div class="url" style="border-color:#16a34a">${CLEAN}</div>
    </div>
    <img src="${popup}" width="380" style="border-radius:14px;box-shadow:0 20px 50px rgba(15,23,42,.25)">
  </body>`,
  "screenshot-2-sites": `${base}<body style="width:1280px;height:800px;padding:70px 90px">
    <h1 style="font-size:46px;margin-bottom:12px">Removes trackers, keeps what the link needs</h1>
    <p style="font-size:22px;color:#475569;margin-bottom:40px">Not "delete everything after the ?". That breaks YouTube and Google links.</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;font-size:20px">
      ${[
        ["X / Twitter", "?s=20&t=… &a=…", "removed"],
        ["YouTube", "si=, feature=", "keeps v= and t="],
        ["Amazon", "ref=, crid=, qid=…", "→ amazon.com/dp/ASIN"],
        ["Spotify", "si=", "removed"],
        ["TikTok, Instagram, Reddit", "share and app codes", "removed"],
        ["Google search", "ved=, ei=, oq=…", "keeps q="],
        ["Every site", "utm_*, fbclid, gclid, msclkid +40", "removed"],
        ["A sentence with a link", "", "left alone"],
      ].map(([s, j, k]) => `<div style="background:#fff;border:1px solid #cbd5e1;border-radius:12px;padding:18px 22px"><b>${s}</b><div style="color:#b91c1c;font-family:ui-monospace,monospace;font-size:17px;margin-top:6px">${j}</div><div style="color:#15803d;margin-top:4px">${k}</div></div>`).join("")}
    </div>
  </body>`,
  "screenshot-3-ways": `${base}<body style="width:1280px;height:800px;padding:80px 90px;display:flex;gap:70px;align-items:center">
    <div style="flex:1">
      <h1 style="font-size:46px;margin-bottom:36px">Works however you copy</h1>
      <ol style="font-size:26px;line-height:1.9;padding-left:30px">
        <li>Ctrl/Cmd+C on a link</li>
        <li>A site's own <b>Copy link</b> or <b>Share</b> button</li>
        <li>Right-click a link → <b>Copy clean link</b></li>
        <li><b>Alt+Shift+C</b> for the page you're on</li>
      </ol>
      <p style="font-size:22px;color:#475569;margin-top:36px">No data collected. No network requests. Open source.</p>
    </div>
    <img src="${popup}" width="380" style="border-radius:14px;box-shadow:0 20px 50px rgba(15,23,42,.25)">
  </body>`,
  "promo-marquee": `${base}<body style="width:1400px;height:560px;padding:80px 90px;display:flex;align-items:center;gap:70px;background:linear-gradient(160deg,#0ea5e9,#0369a1);color:#fff">
    <div style="flex:1">
      <div style="display:flex;align-items:center;gap:20px;margin-bottom:34px"><img src="${icon}" width="84" style="filter:drop-shadow(0 4px 10px rgba(0,0,0,.25))"><b style="font-size:46px">LinkWash</b></div>
      <p style="font-size:54px;font-weight:800;line-height:1.08">Copy links without<br>the trackers.</p>
      <p style="font-size:24px;margin-top:22px;opacity:.92">?s=20, si=, utm_, fbclid: gone. Free and open source.</p>
    </div>
    <div style="width:520px;font:500 21px ui-monospace,Menlo,monospace">
      <div style="background:rgba(255,255,255,.14);border-radius:14px;padding:18px 20px;margin-bottom:16px;word-break:break-all">x.com/someone/status/1849<span style="background:#fee2e2;color:#b91c1c;text-decoration:line-through;border-radius:4px">?s=20&amp;t=Xy7Q</span></div>
      <div style="background:#fff;color:#0f172a;border-radius:14px;padding:18px 20px">x.com/someone/status/1849 ✓</div>
    </div>
  </body>`,
  "promo-small": `${base}<body style="width:440px;height:280px;padding:34px;background:linear-gradient(160deg,#0ea5e9,#0284c7);color:#fff">
    <div style="display:flex;align-items:center;gap:14px"><img src="${icon}" width="56" style="filter:drop-shadow(0 2px 6px rgba(0,0,0,.2))"><b style="font-size:32px">LinkWash</b></div>
    <p style="font-size:27px;font-weight:700;line-height:1.2;margin-top:26px">Copy links without the trackers.</p>
    <p style="font-size:17px;margin-top:12px;opacity:.9">?s=20, si=, utm_, fbclid: gone.</p>
  </body>`,
};

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, html] of Object.entries(pages)) {
  const [w, h] = { "promo-small": [440, 280], "promo-marquee": [1400, 560] }[name] ?? [1280, 800];
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(html);
  await page.screenshot({ path: path.join(root, "store", `${name}.png`) });
  console.log(`store/${name}.png`);
}
await browser.close();
