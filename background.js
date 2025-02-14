chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("🗑️ Background received the message:", JSON.stringify(message));
  if (message.action === "getExtensionPosition") {
    chrome.windows.getCurrent({ populate: true }, (window) => {
      chrome.tabs.query({active: true, windowId: window.id}, (tabs) => {
        const tab = tabs[0];
        chrome.action.getBadgeText({tabId: tab.id}, (result) => {
          const iconInfo = {
            left: window.width - 30,
            top: 5
          };
          sendResponse(iconInfo);
        });
      });
    });
    return true;
  } else if (message.action === "removeFavoriteFromStorage") {
    removeFavoriteFromStorage(message);
    console.log('Favorite removed')
  }
});

function removeFavoriteFromStorage(message) {
  const { source, id } = message;
  chrome.storage.local.get({ favorites: [] }, (data) => {
    const updatedFavorites = data.favorites.filter((fav) => fav.id !== id);
    chrome.storage.local.set({ favorites: updatedFavorites }, () => {
      if (source === 'popup') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "unstarButton", id });
          }
        });
      }
    });
  });
}
