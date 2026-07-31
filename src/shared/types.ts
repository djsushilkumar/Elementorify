export interface ViewportData {
  width: number;
  height: number;
  deviceScaleFactor?: number;
  mobile?: boolean;
}

export interface ElementData {
  tagName: string;
  className: string;
  id: string;
  innerText: string;
  innerHTML: string;
  computedStyles: Record<string, string>;
  attributes: Record<string, string>;
  childrenCount: number;
  rect: {
    width: number;
    height: number;
    top: number;
    left: number;
  };
}

export type ExportVersion = 'v4' | 'v3';

export interface ExtensionMessage =
  | { action: 'elementClicked'; data: ElementData }
  | { action: 'updatePopup'; data: ElementData }
  | { action: 'setViewport'; tabId: number; data: ViewportData }
  | { action: 'restoreViewport'; tabId: number }
  | { action: 'enableCaptureData'; tabId: number; exportVersion?: ExportVersion }
  | { action: 'DEBUGGER_ATTACHED' }
  | { action: 'DEBUGGER_DETACHED' }
  | { action: 'VIEWPORT_CHANGED'; viewport: ViewportData; error?: boolean }
  | { action: 'VIEWPORT_RESTORED'; error?: boolean };

