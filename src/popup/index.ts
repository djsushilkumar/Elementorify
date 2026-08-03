import { ElementData, GlobalPaletteData } from '../shared/types';

document.addEventListener('DOMContentLoaded', () => {
  const btnInspect = document.getElementById('btn-inspect');
  const vpDesktop = document.getElementById('vp-desktop');
  const vpTablet = document.getElementById('vp-tablet');
  const vpMobile = document.getElementById('vp-mobile');
  const elementDetails = document.getElementById('element-details');
  const swatches = document.querySelectorAll<HTMLButtonElement>('.swatch');
  const btnScanPalette = document.getElementById('btn-scan-palette');
  const paletteCard = document.getElementById('palette-card');
  const paletteColors = document.getElementById('palette-colors');
  const paletteFonts = document.getElementById('palette-fonts');
  const btnCopyKit = document.getElementById('btn-copy-kit');
  let currentKitPayload: string = '';

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

  // Global Palette Scanner
  btnScanPalette?.addEventListener('click', async () => {
    const tab = await getActiveTab();
    if (!tab?.id) return;
    try {
      await chrome.tabs.sendMessage(tab.id, { action: 'extractGlobalPalette', tabId: tab.id });
    } catch (_err) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content-ui/index.iife.js'],
        });
        await chrome.tabs.sendMessage(tab.id, { action: 'extractGlobalPalette', tabId: tab.id });
      } catch (_injectErr) {
        alert('Cannot extract palette on restricted Chrome pages.');
      }
    }
  });

  function renderPaletteData(data: GlobalPaletteData) {
    if (!paletteCard || !paletteColors || !paletteFonts) return;
    paletteCard.style.display = 'block';

    paletteColors.innerHTML = data.colors
      .map(
        c =>
          `<div style="width: 22px; height: 22px; border-radius: 6px; background: ${c.color}; border: 1px solid rgba(255,255,255,0.2);" title="${c.title}: ${c.color}"></div>`
      )
      .join('');

    paletteFonts.innerHTML = `Fonts: <strong>${data.fonts.map(f => f.fontFamily).join(', ')}</strong>`;
    currentKitPayload = JSON.stringify(data.elementorKitPayload, null, 2);
  }

  btnCopyKit?.addEventListener('click', () => {
    if (currentKitPayload) {
      navigator.clipboard.writeText(currentKitPayload);
      if (btnCopyKit) {
        btnCopyKit.innerText = '✅ Kit JSON Copied!';
        setTimeout(() => {
          btnCopyKit.innerText = '📋 Copy Elementor Kit JSON';
        }, 2000);
      }
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
    if (message.action === 'globalPaletteExtracted') {
      renderPaletteData(message.data);
    }
  });
});
