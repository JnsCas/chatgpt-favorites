import { showFavoritePopover } from './popover'
import { ICONS } from "./icons";
import { ATTRIBUTES, SELECTORS } from "./utils";

console.log("✅ ChatGPT Favorites started");

// wait until chat is loaded
window.addEventListener("load", () => {
  const checkInterval = setInterval(() => {
    const responses = document.querySelectorAll(SELECTORS.CHAT_GPT_RESPONSE);
    if (responses && responses.length > 0) {
      responses.forEach(addStarButton);
      clearInterval(checkInterval);
    }
  }, 500);
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    const responses = document.querySelectorAll(SELECTORS.CHAT_GPT_RESPONSE);
    responses.forEach(addStarButton);
  }
});

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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "unstarButton") {
    console.log("Message received from background:", message.id);
    unstarButtonHandler(message.id);
  }
});

function addStarButton(responseNode) {
  if (responseNode.querySelector(".favorite-btn")) return; // avoid duplicates

  const starButtonElement = document.createElement("starButtonElement");
  starButtonElement.innerHTML = ICONS.STAR;
  starButtonElement.classList.add("favorite-btn");

  starButtonElement.style.marginLeft = "10px";
  starButtonElement.style.cursor = "pointer";
  starButtonElement.style.border = "none";
  starButtonElement.style.background = "transparent";
  starButtonElement.style.fontSize = "18px";
  starButtonElement.style.transition = "transform 0.2s ease";
  starButtonElement.style.color = "#10a37f";

  starButtonElement.addEventListener("mouseover", () => {
    starButtonElement.style.transform = "scale(1.2)";
  });

  starButtonElement.addEventListener("mouseout", () => {
    starButtonElement.style.transform = "scale(1)";
  });

  responseNode.prepend(starButtonElement);

  starButtonElement.addEventListener("click", (event) => {
    event.stopPropagation();
    const isMarkedAsFavorite = starButtonElement.innerHTML === ICONS.STARRED
    if (isMarkedAsFavorite) {
      const favAttributeId = responseNode.getAttribute(ATTRIBUTES.DATA_FAV_ID);
      chrome.runtime.sendMessage({ action: "removeFavoriteFromStorage", source: 'content', id: favAttributeId }, () =>
        unstarButtonHandler(favAttributeId)
      );
    } else {
      showFavoritePopover(starButtonElement, responseNode);
    }
  });


  // Verify if the response is already marked as favorite and update the icon
  chrome.storage.local.get({ favorites: [] }, (data) => {
    const fav = data.favorites.find((fav) => fav.text.trim() === responseNode.innerText.trim());
    if (fav) {
      responseNode.setAttribute(ATTRIBUTES.DATA_FAV_ID, fav.id);
      starButtonElement.innerHTML = ICONS.STARRED;
    }
  });
}

function unstarButtonHandler(id) {
  const element = document.querySelector(`[data-fav-id="${id}"]`);
  if (element) {
    element.removeAttribute(ATTRIBUTES.DATA_FAV_ID);
    const button = element.querySelector(".favorite-btn");
    if (button) {
      button.innerHTML = ICONS.STAR;
      console.log("Reset button id: ", id);
    }
  } else {
    console.log("Element not found, data-fav-id", id);
  }
}



