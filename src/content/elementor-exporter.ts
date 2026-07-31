import { ElementData, ExportVersion } from '../shared/types';
import { showCopyToast } from './toast';

// ─────────────────────────────────────────────
// Elementor Data Structures
// ─────────────────────────────────────────────

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
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).substring(2, 9);
}

function cssUnit(value: string | undefined): string {
  if (!value || value === 'auto' || value === 'none') return '';
  return value.replace('px', '').trim();
}

function normalizeColor(colorStr: string | undefined): string {
  if (!colorStr || colorStr === 'rgba(0, 0, 0, 0)' || colorStr === 'transparent') return '';

  if (colorStr.startsWith('oklab') || colorStr.startsWith('oklch') || colorStr.startsWith('color(')) {
    if (typeof document !== 'undefined') {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = colorStr;
          ctx.fillRect(0, 0, 1, 1);
          const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
          if (a === 0) return '';
          if (a === 255) {
            return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
          }
          return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(2)})`;
        }
      } catch {
        // Ignore canvas error
      }
    }
  }
  return colorStr;
}

function makeAbsoluteURL(url: string | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  try {
    const baseUrl = typeof window !== 'undefined' ? window.location.href : 'https://example.com';
    return new URL(url, baseUrl).href;
  } catch {
    return url;
  }
}

function processHTMLUrls(html: string): string {
  if (!html) return '';
  return html.replace(/(src|href)=["']([^"']+)["']/gi, (_match, p1, p2) => {
    const abs = makeAbsoluteURL(p2);
    return `${p1}="${abs}"`;
  });
}

function cleanSettings(settings: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(settings)) {
    if (val !== null && val !== undefined && val !== '') {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

// ─────────────────────────────────────────────
// Widget Builders
// ─────────────────────────────────────────────

function buildHeadingWidget(data: ElementData): ElementorWidget {
  const tag = data.tagName.toLowerCase();
  const headingSize = { h1: 'xxl', h2: 'xl', h3: 'large', h4: 'medium', h5: 'small', h6: 'small' };
  return {
    id: uid(),
    elType: 'widget',
    widgetType: 'heading',
    settings: cleanSettings({
      title: data.innerText || 'Heading',
      header_size: headingSize[tag as keyof typeof headingSize] || 'h2',
      align: data.computedStyles.textAlign || 'left',
      title_color: normalizeColor(data.computedStyles.color),
      typography_typography: 'custom',
      typography_font_size: { unit: 'px', size: cssUnit(data.computedStyles.fontSize) || '24' },
      typography_font_weight: data.computedStyles.fontWeight || '600',
      _css_classes: data.className || '',
    }),
    elements: [],
  };
}

function buildTextWidget(data: ElementData): ElementorWidget {
  const cleanHTML = processHTMLUrls(data.innerHTML || `<p>${data.innerText}</p>`);
  return {
    id: uid(),
    elType: 'widget',
    widgetType: 'text-editor',
    settings: cleanSettings({
      editor: cleanHTML,
      text_color: normalizeColor(data.computedStyles.color),
      typography_typography: 'custom',
      typography_font_size: { unit: 'px', size: cssUnit(data.computedStyles.fontSize) || '16' },
      typography_font_weight: data.computedStyles.fontWeight || '400',
      _css_classes: data.className || '',
    }),
    elements: [],
  };
}

function buildButtonWidget(data: ElementData): ElementorWidget {
  const rawHref = data.attributes['href'] || '#';
  const href = makeAbsoluteURL(rawHref);
  return {
    id: uid(),
    elType: 'widget',
    widgetType: 'button',
    settings: cleanSettings({
      text: data.innerText || 'Button',
      link: { url: href, is_external: href.startsWith('http') ? 'yes' : '', nofollow: '' },
      align: 'center',
      button_type: 'default',
      border_radius: { unit: 'px', top: cssUnit(data.computedStyles.borderRadius) || '4', right: cssUnit(data.computedStyles.borderRadius) || '4', bottom: cssUnit(data.computedStyles.borderRadius) || '4', left: cssUnit(data.computedStyles.borderRadius) || '4', isLinked: true },
      background_color: normalizeColor(data.computedStyles.backgroundColor) || '#a855f7',
      button_text_color: normalizeColor(data.computedStyles.color) || '#ffffff',
      typography_font_size: { unit: 'px', size: cssUnit(data.computedStyles.fontSize) || '14' },
      _css_classes: data.className || '',
    }),
    elements: [],
  };
}

function buildImageWidget(data: ElementData): ElementorWidget {
  const rawSrc = data.attributes['src'] || '';
  const src = makeAbsoluteURL(rawSrc);
  const alt = data.attributes['alt'] || 'Image';
  return {
    id: uid(),
    elType: 'widget',
    widgetType: 'image',
    settings: cleanSettings({
      image: { url: src, alt },
      image_size: 'full',
      align: 'center',
      width: { unit: 'px', size: data.rect.width || '' },
      height: { unit: 'px', size: data.rect.height || '' },
      _css_classes: data.className || '',
    }),
    elements: [],
  };
}

function buildDividerWidget(): ElementorWidget {
  return {
    id: uid(),
    elType: 'widget',
    widgetType: 'divider',
    settings: { gap: 'medium', color: 'rgba(0,0,0,0.2)' },
    elements: [],
  };
}

function buildVideoWidget(data: ElementData): ElementorWidget {
  const rawSrc = data.attributes['src'] || data.attributes['data-src'] || '';
  const src = makeAbsoluteURL(rawSrc);
  return {
    id: uid(),
    elType: 'widget',
    widgetType: 'video',
    settings: cleanSettings({
      video_type: 'hosted',
      hosted_url: { url: src },
      _css_classes: data.className || '',
    }),
    elements: [],
  };
}

function buildIconBoxWidget(data: ElementData): ElementorWidget {
  return {
    id: uid(),
    elType: 'widget',
    widgetType: 'icon-box',
    settings: cleanSettings({
      title_text: data.innerText || 'Icon Box',
      description_text: '',
      _css_classes: data.className || '',
    }),
    elements: [],
  };
}

function buildNavMenuWidget(data: ElementData): ElementorWidget {
  return {
    id: uid(),
    elType: 'widget',
    widgetType: 'nav-menu',
    settings: cleanSettings({
      layout: 'horizontal',
      align_items: 'center',
      pointer: 'underline',
      _css_classes: data.className || '',
      typography_font_size: { unit: 'px', size: cssUnit(data.computedStyles.fontSize) || '16' },
      typography_font_weight: data.computedStyles.fontWeight || '500',
      color: normalizeColor(data.computedStyles.color) || '#1e293b',
    }),
    elements: [],
  };
}

function buildAccordionWidget(data: ElementData): ElementorWidget {
  return {
    id: uid(),
    elType: 'widget',
    widgetType: 'accordion',
    settings: cleanSettings({
      tabs: [
        { tab_title: data.innerText.slice(0, 40) || 'FAQ Item', tab_content: data.innerText || 'Description' }
      ],
      _css_classes: data.className || '',
    }),
    elements: [],
  };
}

function buildFormWidget(data: ElementData): ElementorWidget {
  return {
    id: uid(),
    elType: 'widget',
    widgetType: 'form',
    settings: cleanSettings({
      form_name: 'Contact Form',
      form_fields: [
        { _id: uid(), field_type: 'text', field_label: 'Name', placeholder: 'Your Name' },
        { _id: uid(), field_type: 'email', field_label: 'Email', placeholder: 'Your Email' },
        { _id: uid(), field_type: 'textarea', field_label: 'Message', placeholder: 'Your Message' },
      ],
      button_text: 'Send Message',
      _css_classes: data.className || '',
    }),
    elements: [],
  };
}

function buildImageBoxWidget(data: ElementData): ElementorWidget {
  const rawSrc = data.attributes['src'] || '';
  const src = makeAbsoluteURL(rawSrc);
  return {
    id: uid(),
    elType: 'widget',
    widgetType: 'image-box',
    settings: cleanSettings({
      image: { url: src },
      title_text: data.innerText || 'Image Box',
      description_text: '',
      image_size: 'full',
      position: 'top',
      _css_classes: data.className || '',
    }),
    elements: [],
  };
}

function buildSpacerWidget(data: ElementData): ElementorWidget {
  const height = cssUnit(data.computedStyles.height) || '50';
  return {
    id: uid(),
    elType: 'widget',
    widgetType: 'spacer',
    settings: { space: { unit: 'px', size: height } },
    elements: [],
  };
}

// ─────────────────────────────────────────────
// Semantic Container / Section Naming Helper
// ─────────────────────────────────────────────

function getSemanticContainerTitle(data: ElementData): string {
  const tag = data.tagName.toUpperCase();
  const cls = (data.className || '').toLowerCase();
  
  if (tag === 'HEADER' || cls.includes('header') || cls.includes('navbar') || cls.includes('nav-bar')) {
    return 'Header Section';
  }
  if (tag === 'NAV' || cls.includes('nav') || cls.includes('menu')) {
    return 'Nav Menu Container';
  }
  if (tag === 'FOOTER' || cls.includes('footer')) {
    return 'Footer Section';
  }
  if (tag === 'MAIN' || cls.includes('main') || cls.includes('hero')) {
    return 'Main Content Section';
  }
  if (tag === 'ASIDE' || cls.includes('sidebar')) {
    return 'Sidebar Container';
  }
  if (tag === 'FORM' || cls.includes('form')) {
    return 'Contact Form Section';
  }
  return `Container — ${data.tagName.toLowerCase()}`;
}

// ─────────────────────────────────────────────
// Widget Selector
// ─────────────────────────────────────────────

function buildWidget(data: ElementData): ElementorWidget {
  const tag = data.tagName.toUpperCase();
  const cls = (data.className || '').toLowerCase();

  if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(tag)) return buildHeadingWidget(data);
  if (tag === 'NAV' || cls.includes('nav') || cls.includes('menu')) return buildNavMenuWidget(data);
  if (tag === 'FORM' || cls.includes('form')) return buildFormWidget(data);
  if (tag === 'DETAILS' || cls.includes('faq') || cls.includes('accordion')) return buildAccordionWidget(data);
  if (tag === 'BUTTON' || tag === 'A') return buildButtonWidget(data);
  if (tag === 'IMG' || tag === 'PICTURE') {
    if (cls.includes('box') || cls.includes('card')) return buildImageBoxWidget(data);
    return buildImageWidget(data);
  }
  if (tag === 'VIDEO' || tag === 'IFRAME') return buildVideoWidget(data);
  if (tag === 'HR') return buildDividerWidget();
  if (tag === 'I' || tag === 'SVG' || cls.includes('icon')) return buildIconBoxWidget(data);
  if (['P', 'SPAN', 'BLOCKQUOTE', 'PRE', 'STRONG', 'EM'].includes(tag)) return buildTextWidget(data);
  if (['DIV', 'SECTION', 'ARTICLE', 'MAIN', 'ASIDE', 'HEADER', 'FOOTER'].includes(tag)) {
    if (!data.innerText.trim()) return buildSpacerWidget(data);
    return buildTextWidget(data);
  }

  return buildTextWidget(data);
}

// ─────────────────────────────────────────────
// Column & Section Wrappers
// ─────────────────────────────────────────────

function buildColumn(widgets: ElementorWidget[], widthPercent = 100): ElementorWidget {
  return {
    id: uid(),
    elType: 'column',
    settings: cleanSettings({
      _column_size: widthPercent,
      background_background: 'classic',
      padding: { unit: 'px', top: '10', right: '10', bottom: '10', left: '10', isLinked: false },
    }),
    elements: widgets,
  };
}

function buildSection(columns: ElementorWidget[], data: ElementData): ElementorWidget {
  const isFlexDisplay = data.computedStyles.display?.includes('flex');
  const bgColor = normalizeColor(data.computedStyles.backgroundColor);
  const containerTitle = getSemanticContainerTitle(data);

  return {
    id: uid(),
    elType: 'section',
    isInner: false,
    settings: cleanSettings({
      _title: containerTitle,
      layout: isFlexDisplay ? 'flexbox' : 'default',
      gap: 'default',
      structure: `${columns.length}0`,
      background_background: bgColor ? 'classic' : '',
      background_color: bgColor,
      padding: {
        unit: 'px',
        top: cssUnit(data.computedStyles.paddingTop) || '20',
        right: cssUnit(data.computedStyles.paddingRight) || '20',
        bottom: cssUnit(data.computedStyles.paddingBottom) || '20',
        left: cssUnit(data.computedStyles.paddingLeft) || '20',
        isLinked: false,
      },
      content_width: { unit: 'px', size: Math.min(data.rect.width || 1200, 1200) },
    }),
    elements: columns,
  };
}

// ─────────────────────────────────────────────
// Atomic Elementor 4.0 Block Builder
// ─────────────────────────────────────────────

function buildAtomicBlock(childWidgets: ElementorWidget[], data: ElementData): ElementorWidget {
  const isFlex = data.computedStyles.display?.includes('flex') || data.computedStyles.display?.includes('grid');
  const containerTitle = getSemanticContainerTitle(data);
  return {
    id: uid(),
    version: '0.0',
    elType: isFlex ? 'e-flexbox' : 'e-div-block',
    isInner: false,
    settings: cleanSettings({
      _title: containerTitle,
      _css_classes: data.className || '',
      background_color: normalizeColor(data.computedStyles.backgroundColor),
      padding: {
        unit: 'px',
        top: cssUnit(data.computedStyles.paddingTop) || '0',
        right: cssUnit(data.computedStyles.paddingRight) || '0',
        bottom: cssUnit(data.computedStyles.paddingBottom) || '0',
        left: cssUnit(data.computedStyles.paddingLeft) || '0',
        isLinked: false,
      },
    }),
    editor_settings: {
      title: containerTitle,
    },
    interactions: [],
    styles: [],
    elements: childWidgets,
  };
}

// ─────────────────────────────────────────────
// Main Exporters (v4 Atomic & v3 Legacy)
// ─────────────────────────────────────────────

export function generateElementorV4AtomicJSON(data: ElementData): ElementorExport {
  const tag = data.tagName.toUpperCase();
  const isLayoutContainer = ['DIV', 'SECTION', 'ARTICLE', 'MAIN', 'ASIDE', 'HEADER', 'FOOTER', 'FORM', 'NAV'].includes(tag);

  let atomicContent: ElementorWidget[];

  if (isLayoutContainer && data.childrenCount > 1) {
    const childWidgets: ElementorWidget[] = Array.from({ length: Math.min(data.childrenCount, 6) }).map(() =>
      buildWidget(data)
    );
    atomicContent = [buildAtomicBlock(childWidgets, data)];
  } else {
    const widget = buildWidget(data);
    atomicContent = [buildAtomicBlock([widget], data)];
  }

  return {
    version: '0.0',
    title: `Elementorify v4 Atomic Export — ${data.tagName.toLowerCase()}`,
    type: 'page',
    content: atomicContent,
  };
}

export function generateElementorV3JSON(data: ElementData): ElementorExport {
  const tag = data.tagName.toUpperCase();
  const isLayoutContainer = ['DIV', 'SECTION', 'ARTICLE', 'MAIN', 'ASIDE', 'HEADER', 'FOOTER', 'FORM', 'NAV'].includes(tag);

  let sections: ElementorWidget[];

  if (isLayoutContainer && data.childrenCount > 1) {
    const isFlexLayout =
      data.computedStyles.display?.includes('flex') ||
      data.computedStyles.display?.includes('grid');

    const colWidth = isFlexLayout
      ? Math.floor(100 / Math.min(data.childrenCount, 6))
      : 100;

    const childWidgets: ElementorWidget[] = Array.from({ length: Math.min(data.childrenCount, 6) }).map(() =>
      buildWidget(data)
    );

    const columns: ElementorWidget[] = isFlexLayout
      ? childWidgets.map(w => buildColumn([w], colWidth))
      : [buildColumn(childWidgets, 100)];

    sections = [buildSection(columns, data)];
  } else {
    const widget = buildWidget(data);
    const column = buildColumn([widget], 100);
    sections = [buildSection([column], data)];
  }

  return {
    version: '0.4',
    title: `Elementorify v3 Export — ${data.tagName.toLowerCase()}`,
    type: 'page',
    content: sections,
  };
}

export function generateElementorJSON(data: ElementData, exportVersion: ExportVersion = 'v4'): ElementorExport {
  return exportVersion === 'v3' ? generateElementorV3JSON(data) : generateElementorV4AtomicJSON(data);
}

// ─────────────────────────────────────────────
// Clipboard Serializer (Native Elementor Payload)
// ─────────────────────────────────────────────

export function serializeForClipboard(data: ElementData, exportVersion: ExportVersion = 'v4'): string {
  const exportData = generateElementorJSON(data, exportVersion);
  const elementorPayload = {
    type: 'elementor',
    version: exportVersion === 'v4' ? '0.0' : '0.4',
    siteurl: typeof window !== 'undefined' ? window.location.origin : '',
    elements: exportData.content,
  };
  return JSON.stringify(elementorPayload, null, 2);
}

export async function copyElementorToClipboard(data: ElementData, exportVersion: ExportVersion = 'v4'): Promise<string> {
  const payload = serializeForClipboard(data, exportVersion);
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(payload);
  }
  
  const firstWidgetType = `${data.tagName.toLowerCase()} (${exportVersion.toUpperCase()} Atomic)`;
  showCopyToast(data.tagName, firstWidgetType);
  return payload;
}


