document.addEventListener("DOMContentLoaded", () => {
  updateFavoritesList();
});

function updateFavoritesList() {
  const list = document.getElementById("favorites-list");
  list.innerHTML = "";

  chrome.storage.local.get({ favorites: [] }, (data) => {
    data.favorites.forEach((fav) => {
      const li = document.createElement("li");
      li.innerText = fav.text.substring(0, 50) + "..."; // Mostrar solo una parte
      li.style.cursor = "pointer";

      // Al hacer clic, hacemos scroll hasta la respuesta
      li.addEventListener("click", () => scrollToFavorite(fav.id));

      // Botón para eliminar
      const deleteButton = document.createElement("button");
      deleteButton.innerText = "🗑️";
      deleteButton.style.marginLeft = "10px";
      deleteButton.addEventListener("click", (e) => {
        e.stopPropagation(); // Evita que haga scroll si queremos eliminar
        removeFavorite(fav.id);
      });

      li.appendChild(deleteButton);
      list.appendChild(li);
    });
  });
}

// Hacer scroll a la respuesta favorita en la página de ChatGPT
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

// Eliminar favorito
function removeFavorite(id) {
  chrome.storage.local.get({ favorites: [] }, (data) => {
    const updatedFavorites = data.favorites.filter((fav) => fav.id !== id);
    chrome.storage.local.set({ favorites: updatedFavorites }, () => {
      console.log("🗑️ Favorito eliminado.");
      updateFavoritesList();

      // Enviar mensaje al content script para actualizar la UI
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "removeFavoriteUI", id: id });
        }
      });
    });
  });
}
