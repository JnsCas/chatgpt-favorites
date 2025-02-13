console.log("✅ ChatGPT Favorites iniciado");

// Función para agregar botones de favorito y eliminar
function addFavoriteButton(responseNode) {
  if (responseNode.querySelector(".favorite-btn")) return; // Evita duplicados

  const button = document.createElement("button");
  button.innerText = "⭐";
  button.classList.add("favorite-btn");
  button.style.marginLeft = "10px";
  button.style.cursor = "pointer";
  button.style.border = "none";
  button.style.background = "transparent";
  button.style.fontSize = "18px";

  button.addEventListener("click", () => {
    saveFavorite(responseNode);
    button.innerText = "✅"; // Cambia a checkmark cuando se guarda
  });

  responseNode.prepend(button);

  // Verificar si la respuesta ya está guardada y actualizar el icono
  chrome.storage.local.get({ favorites: [] }, (data) => {
    const fav = data.favorites.find((fav) => fav.text === responseNode.innerText);
    if (fav) {
      responseNode.setAttribute("data-fav-id", fav.id);
      button.innerText = "✅"; // Mostrar que ya está guardado
    }
  });
}

// Guardar respuesta en `chrome.storage.local`
function saveFavorite(responseNode) {
  const text = responseNode.innerText;
  const id = `fav-${Date.now()}`; // ID único
  responseNode.setAttribute("data-fav-id", id); // Marca el nodo con el ID

  chrome.storage.local.get({ favorites: [] }, (data) => {
    const favorites = data.favorites;
    favorites.push({ id, text });
    chrome.storage.local.set({ favorites }, () => {
      console.log("✅ Respuesta guardada como favorita.");
    });
  });
}

// Restaurar el estado de los favoritos al cargar la página
function restoreFavoriteStates() {
  chrome.storage.local.get({ favorites: [] }, (data) => {
    document.querySelectorAll('.markdown').forEach((node) => {
      const nodeText = node.innerText.trim();
      // Buscamos un favorito que coincida (puede que necesitemos ajustar la comparación)
      const matchingFav = data.favorites.find((fav) => fav.text.trim() === nodeText);
      if (matchingFav) {
        node.setAttribute('data-fav-id', matchingFav.id);
        let btn = node.querySelector('.favorite-btn');
        if (!btn) {
          addFavoriteButton(node);
          btn = node.querySelector('.favorite-btn');
        }
        btn.innerText = "✅";
      }
    });
  });
}

// Observador para detectar nuevas respuestas
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1 && node.matches(".markdown")) {
        console.log("📩 Nueva respuesta detectada.");
        addFavoriteButton(node);
      }
    });
  });
});

observer.observe(document.body, { childList: true, subtree: true });

// Esperar a que se cargue el contenido del chat
window.addEventListener("load", () => {
  const checkInterval = setInterval(() => {
    const responses = document.querySelectorAll('.markdown');
    if (responses && responses.length > 0) {
      responses.forEach(addFavoriteButton);
      restoreFavoriteStates();
      clearInterval(checkInterval);
    }
  }, 500);
});

// Escuchar mensajes para actualizar la UI (por ejemplo, remover el favorito)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "removeFavoriteUI") {
    const favId = message.id;
    const element = document.querySelector(`[data-fav-id="${favId}"]`);
    if (element) {
      element.removeAttribute("data-fav-id");
      const button = element.querySelector(".favorite-btn");
      if (button) {
        button.innerText = "⭐"; // Restablecer el botón
        console.log("Actualizado el botón de favorito para", favId);
      }
    } else {
      console.log("No se encontró elemento con data-fav-id", favId);
    }
  }
});
