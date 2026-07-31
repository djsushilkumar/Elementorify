import { ElementData } from '../shared/types';

document.addEventListener('DOMContentLoaded', () => {
  const btnInspect = document.getElementById('btn-inspect');
  const vpDesktop = document.getElementById('vp-desktop');
  const vpTablet = document.getElementById('vp-tablet');
  const vpMobile = document.getElementById('vp-mobile');
  const elementDetails = document.getElementById('element-details');

  // Trigger Inspect Element
  btnInspect?.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'enableCaptureData', tabId: tab.id }).catch(() => {
        alert('Please refresh the page or make sure you are on a valid web page.');
      });
      window.close(); // Close popup so user can pick element
    }
  });

  // Viewport Emulation helper
  async function setViewport(width: number, height: number) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    if (width === 0) {
      chrome.runtime.sendMessage({ action: 'restoreViewport', tabId: tab.id });
    } else {
      chrome.runtime.sendMessage({
        action: 'setViewport',
        tabId: tab.id,
        data: { width, height, deviceScaleFactor: 1, mobile: width < 600 },
      });
    }
  }

  vpDesktop?.addEventListener('click', () => setViewport(0, 0)); // Restore desktop
  vpTablet?.addEventListener('click', () => setViewport(768, 1024));
  vpMobile?.addEventListener('click', () => setViewport(375, 812));

  // Render element info
  function displayElementData(data?: ElementData) {
    if (!elementDetails) return;
    if (!data) {
      elementDetails.innerHTML = `
        <div class="empty-state">
          No element selected yet.<br>Click "Inspect & Pick Element" above.
        </div>
      `;
      return;
    }

    elementDetails.innerHTML = `
      <div class="element-info">
        <div class="info-row">
          <span class="info-label">Tag:</span>
          <span class="info-val">&lt;${data.tagName.toLowerCase()}&gt;</span>
        </div>
        <div class="info-row">
          <span class="info-label">Class:</span>
          <span class="info-val">${data.className || 'None'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Size:</span>
          <span class="info-val">${data.rect.width}px × ${data.rect.height}px</span>
        </div>
      </div>
    `;
  }

  // Load initial data from storage
  chrome.storage.local.get(['lastClickedElementData'], result => {
    displayElementData(result.lastClickedElementData);
  });

  // Listen for runtime updates
  chrome.runtime.onMessage.addListener(message => {
    if (message.action === 'updatePopup') {
      displayElementData(message.data);
    }
  });
});
