/**
 * Elementorify Toast Notification System
 * High-performance, shadow DOM-isolated toast notifications for copy feedback.
 */

export interface ToastOptions {
  title: string;
  message: string;
  type?: 'success' | 'info' | 'error' | 'warning';
  duration?: number;
}

let toastContainer: HTMLElement | null = null;
let shadowRoot: ShadowRoot | null = null;

function getOrCreateToastContainer(): ShadowRoot | null {
  if (typeof document === 'undefined') return null;
  if (shadowRoot) return shadowRoot;

  const host = document.createElement('div');
  host.id = 'elementorify-toast-host';
  host.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 0;
    z-index: 2147483647;
    pointer-events: none;
  `;

  document.body.appendChild(host);

  shadowRoot = host.attachShadow({ mode: 'open' });

  const styleTag = document.createElement('style');
  styleTag.textContent = `
    .toast-wrapper {
      position: fixed;
      top: 20px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 400px;
      width: calc(100vw - 40px);
      pointer-events: none;
    }

    .toast-card {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 18px;
      background: rgba(15, 23, 42, 0.92);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(168, 85, 247, 0.4);
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(168, 85, 247, 0.25);
      color: #f8fafc;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      transform: translateY(-20px) scale(0.95);
      opacity: 0;
      transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .toast-card.show {
      transform: translateY(0) scale(1);
      opacity: 1;
    }

    .toast-icon {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      background: linear-gradient(135deg, #a855f7 0%, #06b6d4 100%);
      box-shadow: 0 2px 10px rgba(168, 85, 247, 0.4);
    }

    .toast-icon.error {
      background: linear-gradient(135deg, #ef4444 0%, #f97316 100%);
    }

    .toast-icon.warning {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    }

    .toast-body {
      flex-grow: 1;
    }

    .toast-title {
      font-weight: 700;
      font-size: 14px;
      color: #ffffff;
      margin-bottom: 2px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .toast-message {
      font-size: 12px;
      color: #cbd5e1;
    }

    .toast-close {
      flex-shrink: 0;
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 16px;
      padding: 4px;
      border-radius: 6px;
      transition: color 0.2s, background 0.2s;
    }

    .toast-close:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.1);
    }

    .toast-badge {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(168, 85, 247, 0.25);
      color: #c084fc;
      border: 1px solid rgba(168, 85, 247, 0.4);
    }
  `;

  shadowRoot.appendChild(styleTag);

  toastContainer = document.createElement('div');
  toastContainer.className = 'toast-wrapper';
  shadowRoot.appendChild(toastContainer);

  return shadowRoot;
}

export function showToast(options: ToastOptions): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  getOrCreateToastContainer();

  const card = document.createElement('div');
  card.className = 'toast-card';

  const type = options.type || 'success';
  const duration = options.duration || 3200;

  const iconSymbol = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '⚡';

  card.innerHTML = `
    <div class="toast-icon ${type}">${iconSymbol}</div>
    <div class="toast-body">
      <div class="toast-title">
        ${options.title}
        <span class="toast-badge">Elementorify</span>
      </div>
      <div class="toast-message">${options.message}</div>
    </div>
    <button class="toast-close" aria-label="Close">✕</button>
  `;

  const closeBtn = card.querySelector('.toast-close');
  closeBtn?.addEventListener('click', () => dismissToast(card));

  toastContainer?.appendChild(card);

  // Trigger animation next frame
  requestAnimationFrame(() => {
    card.classList.add('show');
  });

  // Auto dismiss
  setTimeout(() => {
    dismissToast(card);
  }, duration);

  return card;
}

export function dismissToast(card: HTMLElement) {
  card.classList.remove('show');
  setTimeout(() => {
    card.remove();
  }, 350);
}

/**
 * Convenience helper for Elementor element copy notification
 */
export function showCopyToast(tagName: string, widgetType?: string) {
  const widgetDisplay = widgetType ? widgetType.toUpperCase() : tagName.toUpperCase();
  showToast({
    title: `Copied <${widgetDisplay}> Element!`,
    message: `Native Elementor JSON ready. Press Ctrl + V in Elementor Editor to paste.`,
    type: 'success',
    duration: 3500,
  });
}
