console.log("Background service worker loaded ✅");

const HF_API_KEY = "";
const API_URL = "https://router.huggingface.co/hf-inference";

async function queryHuggingFace(prompt) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta-llama/Llama-3.1-8B-Instruct",
        inputs: prompt,
        parameters: { max_new_tokens: 200, temperature: 0.7 }
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("HF API error:", text);
      return `Error: ${text}`;
    }

    const result = await response.json();
    console.log("Raw HF result:", result);

    if (Array.isArray(result) && result[0]?.generated_text) {
      return result[0].generated_text;
    } else if (result?.generated_text) {
      return result.generated_text;
    } else if (result?.outputs?.[0]?.text) {
      return result.outputs[0].text;
    } else {
      return JSON.stringify(result);
    }

  } catch (err) {
    console.error("Fetch failed:", err);
    return "Network error.";
  }
}

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  console.log("📩 Received message in background:", req);

  if (req.action === "huggingface_query") {
    queryHuggingFace(req.prompt).then(answer => {
      console.log("✅ Sending back answer:", answer);
      sendResponse({ answer });
    });
    return true;
  }
});
