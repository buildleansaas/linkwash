// Isolated-world content script: owns the on/off setting and does the cleaning.
let enabled = true;

chrome.storage.local.get({ enabled: true }, (s) => {
  enabled = s.enabled;
});
chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled) enabled = changes.enabled.newValue;
});

function countOne() {
  chrome.storage.local.get({ count: 0 }, (s) => chrome.storage.local.set({ count: s.count + 1 }));
}

function selectedText() {
  const el = document.activeElement;
  if (el && (el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && /^(text|url|search)$/i.test(el.type)))) {
    try {
      return el.value.substring(el.selectionStart, el.selectionEnd);
    } catch {
      return "";
    }
  }
  return String(window.getSelection() || "");
}

// Ctrl/Cmd+C, Edit > Copy, and sites that copy through a hidden text box.
window.addEventListener("copy", (e) => {
  if (!enabled || !e.clipboardData) return;
  const text = e.defaultPrevented ? e.clipboardData.getData("text/plain") : selectedText();
  if (!LinkWash.isSingleUrl(text)) return;
  const cleaned = LinkWash.cleanUrl(text);
  if (cleaned === text) return;
  e.clipboardData.clearData();
  e.clipboardData.setData("text/plain", cleaned);
  e.preventDefault();
  countOne();
});

// Share buttons that call navigator.clipboard.writeText (see page-hook.js).
document.addEventListener("linkwash:clean", (e) => {
  const text = e.detail;
  let reply = text;
  if (enabled && typeof text === "string") {
    reply = LinkWash.cleanUrl(text);
    if (reply !== text) countOne();
  }
  document.dispatchEvent(new CustomEvent("linkwash:cleaned", { detail: reply }));
});
