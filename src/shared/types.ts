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
  computedStyles: Record<string, string> & {
    // Flexbox & Grid
    flexDirection?: string;
    flexWrap?: string;
    justifyContent?: string;
    alignItems?: string;
    gap?: string;
    rowGap?: string;
    columnGap?: string;
    gridTemplateColumns?: string;
    gridTemplateRows?: string;
    // Typography
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
    lineHeight?: string;
    letterSpacing?: string;
    textTransform?: string;
    fontStyle?: string;
    textDecoration?: string;
    textAlign?: string;
    color?: string;
    // Backgrounds & Gradients
    backgroundColor?: string;
    backgroundImage?: string;
    // Borders & Shadows
    borderRadius?: string;
    borderStyle?: string;
    borderColor?: string;
    borderWidth?: string;
    boxShadow?: string;
    // Hover & Transitions
    hoverBackgroundColor?: string;
    hoverColor?: string;
    hoverBorderColor?: string;
    transitionDuration?: string;
    hoverAnimation?: string;
  };
  attributes: Record<string, string>;
  childrenCount: number;
  rect: {
    width: number;
    height: number;
    top: number;
    left: number;
  };
}

export interface GlobalColorItem {
  id: string;
  title: string;
  color: string;
  count: number;
}

export interface GlobalFontItem {
  id: string;
  title: string;
  fontFamily: string;
  count: number;
}

export interface GlobalPaletteData {
  colors: GlobalColorItem[];
  fonts: GlobalFontItem[];
  elementorKitPayload: Record<string, any>;
}

export interface ElementorWidget {
  id: string;
  version?: string;
  elType: 'widget' | 'section' | 'column' | 'container' | 'e-div-block' | 'e-flexbox' | 'e-grid' | string;
  isInner?: boolean;
  widgetType?: string;
  settings: Record<string, unknown>;
  editor_settings?: Record<string, unknown>;
  interactions?: unknown[];
  styles?: unknown[];
  elements: ElementorWidget[];
}

export interface ElementorExport {
  version: string;
  title: string;
  type: string;
  content: ElementorWidget[];
  page_settings?: Record<string, unknown>;
}

export type ExportVersion = 'v3' | 'v4';

export interface PageSectionInfo {
  id: string;
  tagName: string;
  className: string;
  title: string;
  rect: {
    width: number;
    height: number;
    top: number;
    left: number;
  };
}

export interface FullPageExportResult {
  title: string;
  sectionCount: number;
  exportVersion: ExportVersion;
  downloaded: boolean;
  jsonPayload: string;
}

export type ExtensionMessage =
  | { action: 'elementClicked'; data: ElementData }
  | { action: 'updatePopup'; data: ElementData }
  | { action: 'setViewport'; tabId: number; data: ViewportData }
  | { action: 'restoreViewport'; tabId: number }
  | { action: 'enableCaptureData'; tabId: number; exportVersion?: ExportVersion }
  | { action: 'extractGlobalPalette'; tabId: number }
  | { action: 'globalPaletteExtracted'; data: GlobalPaletteData }
  | { action: 'exportFullPageTemplate'; tabId: number; exportVersion?: ExportVersion; mode?: 'download' | 'copy' }
  | { action: 'fullPageExportCompleted'; result: FullPageExportResult }
  | { action: 'getPageSectionSummary'; tabId: number }
  | { action: 'pageSectionSummaryExtracted'; count: number; sections: PageSectionInfo[] }
  | { action: 'DEBUGGER_ATTACHED' }
  | { action: 'DEBUGGER_DETACHED' }
  | { action: 'VIEWPORT_CHANGED'; viewport: ViewportData; error?: boolean }
  | { action: 'VIEWPORT_RESTORED'; error?: boolean };



