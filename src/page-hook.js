// Runs in the page's own JavaScript world so it can see share buttons that call
// navigator.clipboard.writeText(). It holds no settings and no cleaning rules:
// it asks content.js (the extension's isolated world) through a DOM event, and
// content.js answers synchronously.
(() => {
  const clipboard = navigator.clipboard;
  if (!clipboard || typeof clipboard.writeText !== "function") return;

  const original = clipboard.writeText;
  let answer = null;
  document.addEventListener("linkwash:cleaned", (e) => {
    answer = typeof e.detail === "string" ? e.detail : null;
  });

  function wash(text) {
    if (typeof text !== "string" || !/^\s*https?:\/\/\S+\s*$/i.test(text)) return text;
    answer = null;
    document.dispatchEvent(new CustomEvent("linkwash:clean", { detail: text }));
    return answer ?? text;
  }

  clipboard.writeText = function writeText(...args) {
    if (args.length === 0) return original.apply(this, args);
    return original.call(this, wash(args[0]));
  };
})();
