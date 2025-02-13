console.log("✅ ChatGPT Favorites started");

const CHAT_GPT_RESPONSE_SELECTOR = '.markdown'
const DATA_FAV_ID_ATTRIBUTE = "data-fav-id";
const STARRED = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
const STAR = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>'

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

  starButtonElement.addEventListener("click", () => {
    saveFavorite(responseNode, starButtonElement);
    starButtonElement.innerHTML = STARRED;
  });

  responseNode.prepend(starButtonElement);

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
function saveFavorite(responseNode) {
  const text = responseNode.innerText;
  const id = `fav-${Date.now()}`;
  responseNode.setAttribute(DATA_FAV_ID_ATTRIBUTE, id);

  chrome.storage.local.get({ favorites: [] }, (data) => {
    const favorites = data.favorites;
    favorites.push({ id, text });
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


// listening messages to update UI
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "removeFavoriteUI") {
    removeFavoriteHandler(message.id);
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
