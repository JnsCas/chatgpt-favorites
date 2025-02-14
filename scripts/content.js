console.log("✅ ChatGPT Favorites started");

const CHAT_GPT_RESPONSE_SELECTOR = '.markdown'
const DATA_FAV_ID_ATTRIBUTE = "data-fav-id";
const STARRED = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
const STAR = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>'

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "unstarButton") {
    console.log("Message received from background:", message.id);
    removeFavoriteHandler(message.id);
  }
});


function createStarButtonElement() {
  const button = document.createElement("button");
  button.innerHTML = STAR;
  button.classList.add("favorite-btn");

  button.style.marginLeft = "10px";
  button.style.cursor = "pointer";
  button.style.border = "none";
  button.style.background = "transparent";
  button.style.fontSize = "18px";
  button.style.transition = "transform 0.2s ease";
  button.style.color = "#10a37f";

  button.addEventListener("mouseover", () => {
    button.style.transform = "scale(1.2)";
  });

  button.addEventListener("mouseout", () => {
    button.style.transform = "scale(1)";
  });
  return button;
}

function addStarButton(responseNode) {
  if (responseNode.querySelector(".favorite-btn")) return; // avoid duplicates

  const starButtonElement = createStarButtonElement()
  responseNode.prepend(starButtonElement);

  starButtonElement.addEventListener("click", (event) => {
    event.stopPropagation();
    const isMarkedAsFavorite = starButtonElement.innerHTML === STARRED
    if (isMarkedAsFavorite) {
      const favAttributeId = responseNode.getAttribute(DATA_FAV_ID_ATTRIBUTE);
      chrome.runtime.sendMessage({ action: "removeFavoriteFromStorage", source: 'content', id: favAttributeId }, () =>
        removeFavoriteHandler(favAttributeId)
      );
    } else {
      showFavoritePopover(starButtonElement, responseNode);
    }
  });


  // Verify if the response is already marked as favorite and update the icon
  chrome.storage.local.get({ favorites: [] }, (data) => {
    const fav = data.favorites.find((fav) => fav.text.trim() === responseNode.innerText.trim());
    if (fav) {
      responseNode.setAttribute(DATA_FAV_ID_ATTRIBUTE, fav.id);
      starButtonElement.innerHTML = STARRED;
    }
  });
}

// Save responses in `chrome.storage.local`
function saveFavorite(responseNode, name = '') {
  const text = responseNode.innerText.substring(0, 50);
  const id = `fav-${Date.now()}`;
  responseNode.setAttribute(DATA_FAV_ID_ATTRIBUTE, id);

  chrome.storage.local.get({ favorites: [] }, (data) => {
    const favorites = data.favorites;
    favorites.push({ id, name, text });
    chrome.storage.local.set({ favorites }, () => {
      console.log("✅ ChatGPT response saved as favorite.");
    });
  });
}

// observer to detect new ChatGPT responses
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1 && node.matches(".markdown")) {
        console.log("📩 New ChatGPT response detected.");
        addStarButton(node);
      }
    });
  });
});

observer.observe(document.body, { childList: true, subtree: true });

// wait until chat is loaded
window.addEventListener("load", () => {
  const checkInterval = setInterval(() => {
    const responses = document.querySelectorAll(CHAT_GPT_RESPONSE_SELECTOR);
    if (responses && responses.length > 0) {
      responses.forEach(addStarButton);
      clearInterval(checkInterval);
    }
  }, 500);
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    const responses = document.querySelectorAll(CHAT_GPT_RESPONSE_SELECTOR);
    responses.forEach(addStarButton);
  }
});

function removeFavoriteHandler(id) {
  const element = document.querySelector(`[data-fav-id="${id}"]`);
  if (element) {
    element.removeAttribute(DATA_FAV_ID_ATTRIBUTE);
    const button = element.querySelector(".favorite-btn");
    if (button) {
      button.innerHTML = STAR;
      console.log("Reset button id: ", id);
    }
  } else {
    console.log("Element not found, data-fav-id", id);
  }
}

function createFlyingStar(sourceElement) {
  const star = document.createElement('div');
  star.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#10a37f" stroke="#10a37f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
  star.style.position = 'fixed';
  star.style.zIndex = '9999';
  star.style.transition = 'all 1s ease-in-out';
  document.body.appendChild(star);

  const rect = sourceElement.getBoundingClientRect();
  star.style.left = `${rect.left}px`;
  star.style.top = `${rect.top}px`;

  chrome.runtime.sendMessage({ action: "getExtensionPosition" }, (response) => {
    if (response && response.left && response.top) {
      setTimeout(() => {
        star.style.left = `${response.left}px`;
        star.style.top = `${response.top}px`;
        star.style.transform = 'scale(0.1)';
        star.style.opacity = '0';
      }, 0);

      setTimeout(() => {
        document.body.removeChild(star);
      }, 1000);
    }
  });
}

// FIXME create popover module

function injectPopover() {
  const popoverHTML = `
    <div id="favorite-popover" class="favorite-popover">
      <div class="popover-content">
        <input type="text" id="favorite-name" placeholder="Name (optional)">
        <div class="popover-actions">
          <button id="confirm-favorite" class="confirm-btn">Confirm</button>
          <button id="cancel-favorite" class="cancel-btn">✕</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', popoverHTML);
}

function injectStyles() {
  const styles = `
    .favorite-popover {
      display: none;
      position: absolute;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      z-index: 1000;
      padding: 16px;
      width: 250px;
    }
    .favorite-popover .popover-content {
      display: flex;
      flex-direction: column;
    }
    .favorite-popover input {
      margin-bottom: 10px;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      color: #888;
    }
    .favorite-popover .popover-actions {
      display: flex;
      justify-content: space-between;
    }
    .favorite-popover .confirm-btn,
    .favorite-popover .cancel-btn {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .favorite-popover .confirm-btn {
      background-color: #10a37f;
      color: white;
    }
    .favorite-popover .cancel-btn {
      background-color: #f0f0f0;
      color: #333;
    }
  `;
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}

let currentFavoriteButton = null;
let currentResponseNode = null;

function showFavoritePopover(button, responseNode) {
  const popover = document.getElementById('favorite-popover');
  const rect = button.getBoundingClientRect();

  popover.style.display = 'block';
  popover.style.top = `${rect.bottom + window.scrollY + 5}px`;
  popover.style.left = `${rect.left + window.scrollX}px`;

  currentFavoriteButton = button;
  currentResponseNode = responseNode;

  document.getElementById('favorite-name').value = '';
}

function hideFavoritePopover() {
  document.getElementById('favorite-popover').style.display = 'none';
  currentFavoriteButton = null;
  currentResponseNode = null;
}

function confirmFavorite() {
  const name = document.getElementById('favorite-name').value;
  saveFavorite(currentResponseNode, name);
  currentFavoriteButton.innerHTML = STARRED;
  currentFavoriteButton.style.color = "#10a37f";
  createFlyingStar(currentFavoriteButton);
  hideFavoritePopover();
}

function initializePopover() {
  injectPopover();
  injectStyles();

  // Agregar eventos para los botones del popover
  document.getElementById('confirm-favorite').addEventListener('click', confirmFavorite);
  document.getElementById('cancel-favorite').addEventListener('click', hideFavoritePopover);

  document.addEventListener('keydown', (event) => {
    const popover = document.getElementById('favorite-popover');

    if (popover.style.display === 'block') {
      if (event.key === 'Enter') {
        event.preventDefault(); // Evita un submit accidental
        confirmFavorite();
      } else if (event.key === 'Escape') {
        hideFavoritePopover();
      }
    }
  });

  // Cerrar el popover si se hace clic fuera de él
  document.addEventListener('click', (event) => {
    const popover = document.getElementById('favorite-popover');
    if (popover.style.display === 'block' && !popover.contains(event.target) && !event.target.classList.contains('favorite-btn')) {
      hideFavoritePopover();
    }
  });
}

initializePopover();
