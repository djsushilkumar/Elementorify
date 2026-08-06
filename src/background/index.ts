import 'webextension-polyfill';
import { ExtensionMessage } from '../shared/types';

const debuggerState = new Map<number, boolean>();

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, _sendResponse) => {
  if (message.action === 'elementClicked') {
    chrome.storage.local.set({ lastClickedElementData: message.data }, () => {
      chrome.runtime.sendMessage({
        action: 'updatePopup',
        data: message.data,
      });
    });
  }

  if (message.action === 'setViewport') {
    const attachDebugger = () => {
      if (!debuggerState.get(message.tabId)) {
        return chrome.debugger.attach({ tabId: message.tabId }, '1.3').then(() => {
          debuggerState.set(message.tabId, true);
          chrome.tabs
            .sendMessage(message.tabId, {
              action: 'DEBUGGER_ATTACHED',
            })
            .catch(() => {});
        });
      } else {
        return Promise.resolve();
      }
    };

    attachDebugger()
      .then(() => {
        chrome.debugger
          .sendCommand({ tabId: message.tabId }, 'Emulation.setDeviceMetricsOverride', message.data)
          .then(() => {
            chrome.tabs
              .sendMessage(message.tabId, {
                action: 'VIEWPORT_CHANGED',
                viewport: { width: message.data.width, height: message.data.height },
              })
              .catch(() => {});
          })
          .catch(error => {
            console.error('Failed to set viewport:', error);
            chrome.tabs
              .sendMessage(message.tabId, {
                action: 'VIEWPORT_CHANGED',
                viewport: { width: message.data.width, height: message.data.height },
                error: true,
              })
              .catch(() => {});
          });
      })
      .catch(error => {
        console.error('Failed to attach debugger:', error);
        chrome.tabs
          .sendMessage(message.tabId, {
            action: 'VIEWPORT_CHANGED',
            viewport: { width: message.data.width, height: message.data.height },
            error: true,
          })
          .catch(() => {});
      });
  }

  if (message.action === 'restoreViewport') {
    chrome.debugger
      .sendCommand({ tabId: message.tabId }, 'Emulation.clearDeviceMetricsOverride')
      .then(() => {
        chrome.tabs
          .sendMessage(message.tabId, {
            action: 'VIEWPORT_RESTORED',
          })
          .catch(() => {});

        chrome.debugger.detach({ tabId: message.tabId }).then(() => {
          debuggerState.delete(message.tabId);
          chrome.tabs
            .sendMessage(message.tabId, {
              action: 'DEBUGGER_DETACHED',
            })
            .catch(() => {});
        });
      })
      .catch(error => {
        console.error('Failed to restore viewport:', error);
        chrome.tabs
          .sendMessage(message.tabId, {
            action: 'VIEWPORT_RESTORED',
            error: true,
          })
          .catch(() => {});
      });
  }

  if (message.action === 'extractGlobalPalette') {
    chrome.tabs.sendMessage(message.tabId, { action: 'extractGlobalPalette', tabId: message.tabId }).catch(() => {});
  }

  if (message.action === 'globalPaletteExtracted') {
    chrome.runtime.sendMessage({ action: 'globalPaletteExtracted', data: message.data }).catch(() => {});
  }

  if (message.action === 'exportFullPageTemplate') {
    chrome.tabs.sendMessage(message.tabId, message).catch(() => {});
  }

  if (message.action === 'getPageSectionSummary') {
    chrome.tabs.sendMessage(message.tabId, message).catch(() => {});
  }
});

function triggerInspectorOnActiveTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs.length > 0) {
      const tabId = tabs[0].id ?? 0;
      chrome.tabs.sendMessage(tabId, { action: 'enableCaptureData', tabId }).catch(() => {});
    }
  });
}

chrome.action.onClicked.addListener(_tab => {
  triggerInspectorOnActiveTab();
});

chrome.commands.onCommand.addListener(command => {
  if (command === 'toggle-inspector') {
    triggerInspectorOnActiveTab();
  }
});
