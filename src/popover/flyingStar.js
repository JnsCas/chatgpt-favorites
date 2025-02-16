import { ICONS } from "../icons";

export function createFlyingStar(sourceElement) {
  const star = document.createElement('div');
  star.innerHTML = ICONS.FLYING_STAR;
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