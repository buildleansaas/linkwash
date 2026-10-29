chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || msg.type !== "offscreen-copy") return;
  const box = document.getElementById("buffer");
  box.value = msg.text;
  box.select();
  document.execCommand("copy");
  sendResponse(true);
});
