chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "summarize") {
    let pageText = document.body.innerText;

    if (!pageText.trim()) {
      chrome.runtime.sendMessage({ action: "summaryResult", summary: "No readable content found on this page." });
      return;
    }

    pageText = pageText.substring(0, 5000); // Limit size for API request

    console.log("Extracted page text:", pageText); // Check what text is being passed
    chrome.runtime.sendMessage({ action: "summarize", text: pageText });
  }
});
