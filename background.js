import { GROQ_API_KEY, API_URL } from "./config.js";

console.log("✅ Background service worker loaded");

async function queryGroq(prompt) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // ✅ Working model
        messages: [
          { role: "user", content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    });

    const data = await response.json();
    console.log("Groq response:", data);

    return data?.choices?.[0]?.message?.content || "No response";

  } catch (error) {
    console.error("Groq API error:", error);
    return "Network error.";
  }
}

// Listen for messages from the popup/content script
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  console.log("📩 Received request:", req);

  if (req.action === "groq_query") {
    queryGroq(req.prompt).then(answer => {
      console.log("✅ Sending response:", answer);
      sendResponse({ answer });
    });
    return true; // keeps message channel alive
  }
});
