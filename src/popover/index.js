import { createFlyingStar } from "./flyingStar";
import { saveFavorite } from "../chrome/localStorage";
import { ICONS } from "../icons";

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

export function showFavoritePopover(button, responseNode) {
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
  currentFavoriteButton.innerHTML = ICONS.STARRED;
  currentFavoriteButton.style.color = "#10a37f";
  createFlyingStar(currentFavoriteButton);
  hideFavoritePopover();
}

function initializePopover() {
  injectPopover();
  injectStyles();

  document.getElementById('confirm-favorite').addEventListener('click', confirmFavorite);
  document.getElementById('cancel-favorite').addEventListener('click', hideFavoritePopover);

  document.addEventListener('keydown', (event) => {
    const popover = document.getElementById('favorite-popover');

    if (popover.style.display === 'block') {
      if (event.key === 'Enter') {
        event.preventDefault();
        confirmFavorite();
      } else if (event.key === 'Escape') {
        hideFavoritePopover();
      }
    }
  });

  document.addEventListener('click', (event) => {
    const popover = document.getElementById('favorite-popover');
    if (popover.style.display === 'block' && !popover.contains(event.target) && !event.target.classList.contains('favorite-btn')) {
      hideFavoritePopover();
    }
  });
}

initializePopover();