const apiToken = process.env.REACT_APP_HUGGINGFACE_API_KEY; // Replace with your actual API key

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "summarize") {
    console.log("Received text for summarization:", request.text); // Ensure text is passed

    fetch("https://api-inference.huggingface.co/models/facebook/bart-large-cnn", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`, // Replace with correct token
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: request.text })
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("API Response:", data); // Log response for debugging
        if (data.error) {
          console.error("API Error:", data.error);
          chrome.runtime.sendMessage({ action: "summaryResult", summary: "API error: " + data.error });
        } else {
          chrome.runtime.sendMessage({
            action: "summaryResult",
            summary: data[0]?.summary_text || "Failed to summarize."
          });
        }
      })
      .catch((error) => {
        console.error("Fetch error:", error);
        chrome.runtime.sendMessage({ action: "summaryResult", summary: "Error in API request." });
      });

    return true; // Keep sendResponse available
  }
});
