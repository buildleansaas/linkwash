const toggle = document.getElementById("enabled");
const status = document.getElementById("status");
const count = document.getElementById("count");
const countLabel = document.getElementById("count-label");
const copied = document.getElementById("copied");

document.getElementById("beer").href = BEER_URL;

function render({ enabled, count: n }) {
  toggle.checked = enabled;
  status.textContent = enabled ? "On. Links you copy lose their trackers." : "Off. Links copy exactly as they are.";
  document.body.classList.toggle("off", !enabled);
  count.textContent = n.toLocaleString();
  countLabel.textContent = n === 1 ? "link washed" : "links washed";
}

chrome.storage.local.get({ enabled: true, count: 0 }, render);
chrome.storage.onChanged.addListener(() => chrome.storage.local.get({ enabled: true, count: 0 }, render));

toggle.addEventListener("change", () => chrome.storage.local.set({ enabled: toggle.checked }));

document.getElementById("copy-page").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url || !/^https?:/.test(tab.url)) {
    copied.textContent = "This page has no web link to copy.";
    copied.hidden = false;
    return;
  }
  const cleaned = LinkWash.cleanUrl(tab.url).trim();
  await navigator.clipboard.writeText(cleaned);
  if (cleaned !== tab.url) {
    const { count: n = 0 } = await chrome.storage.local.get("count");
    await chrome.storage.local.set({ count: n + 1 });
  }
  copied.textContent = "Copied: " + cleaned;
  copied.hidden = false;
});
