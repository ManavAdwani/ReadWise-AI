let chatHistory = "You are a helpful assistant answering questions about webpages.\n\n";

document.getElementById("summarize").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const tabUrl = tab?.url || "";
  if (!/^https?:\/\//i.test(tabUrl)) {
    document.getElementById("summary").innerText = "This page type isn't supported. Open a normal website and try again.";
    return;
  }

  chrome.tabs.sendMessage(tab.id, { action: "getPageText" }, async (response) => {
    if (chrome.runtime.lastError) {
      console.error("SendMessage error:", chrome.runtime.lastError);
      document.getElementById("summary").innerText = "Couldn't read the page. Try reloading the tab and the extension.";
      return;
    }

    if (!response || typeof response.text !== "string") {
      document.getElementById("summary").innerText = "No readable text found on this page.";
      return;
    }

    document.getElementById("summary").innerText = "Summarizing...";

    const pageText = response.text.slice(0, 5000);
    const prompt = `Summarize this webpage:\n\n${pageText}`;

    chrome.runtime.sendMessage({ action: "groq_query", prompt }, (res) => {
      if (chrome.runtime.lastError) {
        document.getElementById("summary").innerText = "Error connecting to background.";
        return;
      }
      const summary = res?.answer || "No response received.";
      document.getElementById("summary").innerText = summary;
      localStorage.setItem("pageSummary", summary);
      chatHistory += `Summary: ${summary}\n\n`;
    });
  });
});

document.getElementById("ask").addEventListener("click", async () => {
  const question = document.getElementById("question").value;
  const chatDiv = document.getElementById("chat");
  chatDiv.innerHTML += `<p><strong>You:</strong> ${question}</p>`;

  chatHistory += `User: ${question}\nAssistant:`;

  chrome.runtime.sendMessage(
    { action: "groq_query", prompt: chatHistory },
    (res) => {
      if (chrome.runtime.lastError) {
        chatDiv.innerHTML += `<p><strong>AI:</strong> Error connecting to background.</p>`;
        return;
      }

      if (!res || !res.answer) {
        chatDiv.innerHTML += `<p><strong>AI:</strong> No response received.</p>`;
        return;
      }

      const answer = res.answer;
      chatHistory += ` ${answer}\n`;
      chatDiv.innerHTML += `<p><strong>AI:</strong> ${answer}</p>`;
      document.getElementById("question").value = "";
      localStorage.setItem("chatHistory", chatHistory);
    }
  );
});

// Load saved history on reopen
window.onload = () => {
  const saved = localStorage.getItem("chatHistory");
  if (saved) chatHistory = saved;
};
