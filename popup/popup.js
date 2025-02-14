document.addEventListener("DOMContentLoaded", () => {
  refreshFavoritesList();
});

function createFavoriteElement(favorite) {
  const li = document.createElement("li");

  const favoriteText = document.createElement("span");
  favoriteText.classList.add("favorite-text");
  if (favorite.name !== '') {
    favoriteText.style.fontWeight = "bold";
    favoriteText.innerText = favorite.name;
  } else {
    favoriteText.innerText = favorite.text.substring(0, 50) + "...";
  }
  li.appendChild(favoriteText);

  li.addEventListener("click", () => scrollToFavorite(favorite.id));

  const deleteButton = document.createElement("button");
  deleteButton.classList.add("delete-btn");
  deleteButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
  li.appendChild(deleteButton);
  deleteButton.addEventListener("click", (e) => {
    e.stopPropagation();
    chrome.runtime.sendMessage({ action: "removeFavoriteFromStorage", source: 'popup', id: favorite.id }, () =>
      refreshFavoritesList()
    );
  });

  li.appendChild(deleteButton);
  return li
}

function refreshFavoritesList() {
  const list = document.getElementById("favorites-list");
  list.innerHTML = "";

  chrome.storage.local.get({ favorites: [] }, (data) => {
    data.favorites.forEach((favorite) => {
      const newFavoriteElement = createFavoriteElement(favorite)
      list.appendChild(newFavoriteElement);
    });
  });
}

function scrollToFavorite(id) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: (favId) => {
        const element = document.querySelector(`[data-fav-id="${favId}"]`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      },
      args: [id]
    });
  });
}
