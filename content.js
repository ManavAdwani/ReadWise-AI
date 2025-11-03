function getPageText() {
  const textNodes = Array.from(document.body.querySelectorAll("p, h1, h2, h3, h4, h5, h6"));
  return textNodes.map(node => node.innerText).join("\n\n");
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPageText") {
    sendResponse({ text: getPageText() });
  }
});
