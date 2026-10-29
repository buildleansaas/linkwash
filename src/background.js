importScripts("clean.js");

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: "linkwash-link", title: "Copy clean link", contexts: ["link"] });
    chrome.contextMenus.create({ id: "linkwash-page", title: "Copy clean link to this page", contexts: ["page"] });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const url = info.menuItemId === "linkwash-link" ? info.linkUrl : tab && tab.url;
  if (url) copyClean(url).catch(() => {});
});

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "copy-clean-page-link" && tab && tab.url) copyClean(tab.url).catch(() => {});
});

async function copyClean(url) {
  const cleaned = LinkWash.cleanUrl(url).trim();
  await writeClipboard(cleaned);
  if (cleaned !== url.trim()) {
    const { count = 0 } = await chrome.storage.local.get("count");
    await chrome.storage.local.set({ count: count + 1 });
  }
  flashBadge();
  return cleaned;
}

// A service worker has no clipboard, so copying goes through a hidden offscreen page.
let creating = null;
async function writeClipboard(text) {
  const existing = await chrome.runtime.getContexts({ contextTypes: ["OFFSCREEN_DOCUMENT"] });
  if (existing.length === 0) {
    // Two quick shortcut presses must not both try to create it.
    creating ??= chrome.offscreen
      .createDocument({
        url: "src/offscreen.html",
        reasons: ["CLIPBOARD"],
        justification: "Write the cleaned link to the clipboard.",
      })
      .finally(() => (creating = null));
    await creating;
  }
  const ok = await chrome.runtime.sendMessage({ type: "offscreen-copy", text });
  if (!ok) throw new Error("clipboard write failed");
}

function flashBadge() {
  chrome.action.setBadgeBackgroundColor({ color: "#16a34a" });
  chrome.action.setBadgeText({ text: "✓" });
  setTimeout(() => chrome.action.setBadgeText({ text: "" }), 1500);
}
