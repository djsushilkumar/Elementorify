import { ExtensionMessage, ElementData } from '../shared/types';
import { serializeForClipboard } from './elementor-exporter';

let isActive = false;
let overlayElement: HTMLDivElement | null = null;

function createInspectorOverlay() {
  if (overlayElement) return overlayElement;

  overlayElement = document.createElement('div');
  overlayElement.id = 'elementorify-inspector-overlay';
  Object.assign(overlayElement.style, {
    position: 'fixed',
    pointerEvents: 'none',
    border: '2px solid #a855f7',
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    boxShadow: '0 0 12px rgba(168, 85, 247, 0.4)',
    zIndex: '999999',
    transition: 'all 0.1s ease',
    display: 'none',
    borderRadius: '4px',
  });
  document.body.appendChild(overlayElement);
  return overlayElement;
}

function showToast(message: string, type: 'success' | 'error' = 'success') {
  const toast = document.createElement('div');
  toast.id = 'elementorify-toast';
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    padding: '12px 20px',
    borderRadius: '10px',
    backgroundColor: type === 'success' ? '#1e1b4b' : '#450a0a',
    color: '#ffffff',
    border: type === 'success' ? '1px solid #a855f7' : '1px solid #ef4444',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5), 0 0 12px rgba(168, 85, 247, 0.3)',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '13px',
    fontWeight: '600',
    zIndex: '9999999',
    opacity: '0',
    transform: 'translateY(10px)',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    pointerEvents: 'none',
  });
  toast.innerText = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

function extractElementData(el: HTMLElement): ElementData {
  const rect = el.getBoundingClientRect();
  const computed = window.getComputedStyle(el);
  const attributes: Record<string, string> = {};

  Array.from(el.attributes).forEach(attr => {
    attributes[attr.name] = attr.value;
  });

  return {
    tagName: el.tagName,
    className: el.className,
    id: el.id,
    innerText: el.innerText ? el.innerText.substring(0, 300) : '',
    innerHTML: el.innerHTML ? el.innerHTML.substring(0, 500) : '',
    computedStyles: {
      color: computed.color,
      backgroundColor: computed.backgroundColor,
      fontSize: computed.fontSize,
      fontWeight: computed.fontWeight,
      display: computed.display,
      flexDirection: computed.flexDirection,
      textAlign: computed.textAlign,
      padding: computed.padding,
      paddingTop: computed.paddingTop,
      paddingRight: computed.paddingRight,
      paddingBottom: computed.paddingBottom,
      paddingLeft: computed.paddingLeft,
      margin: computed.margin,
      marginTop: computed.marginTop,
      marginRight: computed.marginRight,
      marginBottom: computed.marginBottom,
      marginLeft: computed.marginLeft,
      borderRadius: computed.borderRadius,
      height: computed.height,
    },
    attributes,
    childrenCount: el.children.length,
    rect: {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      top: Math.round(rect.top),
      left: Math.round(rect.left),
    },
  };
}

function handleMouseOver(e: MouseEvent) {
  if (!isActive) return;
  const target = e.target as HTMLElement;
  if (!target || target.id === 'elementorify-inspector-overlay') return;

  const rect = target.getBoundingClientRect();
  const overlay = createInspectorOverlay();
  overlay.style.display = 'block';
  overlay.style.top = `${rect.top}px`;
  overlay.style.left = `${rect.left}px`;
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;
}

function handleClick(e: MouseEvent) {
  if (!isActive) return;
  const target = e.target as HTMLElement;
  if (!target || target.id === 'elementorify-inspector-overlay') return;

  e.preventDefault();
  e.stopPropagation();

  const data = extractElementData(target);
  const jsonString = serializeForClipboard(data);

  // Copy to clipboard and show toast
  navigator.clipboard.writeText(jsonString)
    .then(() => {
      showToast('✅ Elementor JSON copied!', 'success');
      console.log('[Elementorify] Widget JSON copied to clipboard!');
    })
    .catch(err => {
      showToast('❌ Clipboard write failed', 'error');
      console.error('[Elementorify] Clipboard write failed:', err);
    });

  // Notify background script
  chrome.runtime.sendMessage({
    action: 'elementClicked',
    data,
  });

  // Disable capture mode after selection
  toggleCaptureMode(false);
}

function toggleCaptureMode(enable?: boolean) {
  isActive = enable !== undefined ? enable : !isActive;
  if (isActive) {
    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('click', handleClick, true);
  } else {
    document.removeEventListener('mouseover', handleMouseOver, true);
    document.removeEventListener('click', handleClick, true);
    if (overlayElement) {
      overlayElement.style.display = 'none';
    }
  }
}

chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
  if (message.action === 'enableCaptureData') {
    toggleCaptureMode(true);
  }
});
