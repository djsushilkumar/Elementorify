import { ElementData } from '../shared/types';

document.addEventListener('DOMContentLoaded', () => {
  const btnInspect = document.getElementById('btn-inspect');
  const vpDesktop = document.getElementById('vp-desktop');
  const vpTablet = document.getElementById('vp-tablet');
  const vpMobile = document.getElementById('vp-mobile');
  const elementDetails = document.getElementById('element-details');
  const swatches = document.querySelectorAll<HTMLButtonElement>('.swatch');

  // Theme Accent Customizer Logic
  function applyTheme(themeName: string) {
    document.body.setAttribute('data-theme', themeName);
    swatches.forEach(swatch => {
      if (swatch.getAttribute('data-theme') === themeName) {
        swatch.classList.add('active');
      } else {
        swatch.classList.remove('active');
      }
    });
    chrome.storage.local.set({ popupTheme: themeName });
  }

  swatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      const theme = swatch.getAttribute('data-theme');
      if (theme) applyTheme(theme);
    });
  });

  // Load stored theme preference
  chrome.storage.local.get(['popupTheme'], result => {
    if (result.popupTheme) {
      applyTheme(result.popupTheme);
    }
  });

  async function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    return tabs[0] || (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
  }

  // Trigger Inspect Element with Script Injection Fallback
  btnInspect?.addEventListener('click', async () => {
    const tab = await getActiveTab();
    if (!tab?.id) return;

    const tabId = tab.id;
    const stored = await chrome.storage.local.get(['exportVersion']);
    const exportVersion = stored.exportVersion || 'v4';

    try {
      await chrome.tabs.sendMessage(tabId, { action: 'enableCaptureData', tabId, exportVersion });
    } catch (_err) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['content-ui/index.iife.js'],
        });
        await chrome.tabs.sendMessage(tabId, { action: 'enableCaptureData', tabId, exportVersion });
      } catch (injectErr) {
        console.error('Script injection failed:', injectErr);
        alert('Cannot inspect on this page (Chrome restricts extensions on chrome:// pages and store pages).');
      }
    } finally {
      window.close();
    }
  });

  // Viewport Emulation helper with active state toggle
  function setActiveVpBtn(activeBtn: HTMLElement | null) {
    [vpDesktop, vpTablet, vpMobile].forEach(btn => btn?.classList.remove('active'));
    activeBtn?.classList.add('active');
  }

  async function setViewport(width: number, height: number, btn: HTMLElement | null) {
    setActiveVpBtn(btn);
    const tab = await getActiveTab();
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

  vpDesktop?.addEventListener('click', () => setViewport(0, 0, vpDesktop));
  vpTablet?.addEventListener('click', () => setViewport(768, 1024, vpTablet));
  vpMobile?.addEventListener('click', () => setViewport(375, 812, vpMobile));

  // Render element info
  function displayElementData(data?: ElementData) {
    if (!elementDetails) return;
    if (!data) {
      elementDetails.innerHTML = `
        <div class="empty-info">
          No element captured yet.<br>Click <strong>"Inspect & Pick Element"</strong> above.
        </div>
      `;
      return;
    }

    const tagStr = data.tagName ? `<${data.tagName.toLowerCase()}>` : 'element';
    const classStr = data.className ? data.className.split(' ').slice(0, 3).join(' ') : 'None';
    const sizeStr = data.rect ? `${data.rect.width}px × ${data.rect.height}px` : 'Auto';

    elementDetails.innerHTML = `
      <div class="data-list">
        <div class="data-row">
          <span class="data-label">HTML Tag:</span>
          <span class="data-val">${tagStr}</span>
        </div>
        <div class="data-row">
          <span class="data-label">Classes:</span>
          <span class="data-val" title="${data.className || ''}">${classStr}</span>
        </div>
        <div class="data-row">
          <span class="data-label">Dimensions:</span>
          <span class="data-val">${sizeStr}</span>
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
