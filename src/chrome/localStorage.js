import { ATTRIBUTES } from "../utils";

export function saveFavorite(responseNode, name = '') {
  const text = responseNode.innerText.substring(0, 50);
  const id = `fav-${Date.now()}`;
  responseNode.setAttribute(ATTRIBUTES.DATA_FAV_ID, id);

  chrome.storage.local.get({ favorites: [] }, (data) => {
    const favorites = data.favorites;
    favorites.push({ id, name, text });
    chrome.storage.local.set({ favorites }, () => {
      console.log("✅ ChatGPT response saved as favorite.");
    });
  });
}