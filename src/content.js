function getPageText() {
  return document.body.innerText;
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extractText") {
    sendResponse({ text: getPageText() });
  }
});
