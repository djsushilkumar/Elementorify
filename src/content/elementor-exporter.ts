import { ElementData } from '../shared/types';

// ─────────────────────────────────────────────
// Elementor Data Structures
// ─────────────────────────────────────────────

export interface ElementorWidget {
  id: string;
  elType: 'widget' | 'section' | 'column' | 'container';
  isInner?: boolean;
  widgetType?: string;
  settings: Record<string, unknown>;
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

function parseColor(value: string | undefined): Record<string, unknown> | undefined {
  if (!value) return undefined;
  return { color: value };
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
    settings: {
      title: data.innerText || 'Heading',
      header_size: headingSize[tag as keyof typeof headingSize] || 'h2',
      align: data.computedStyles.textAlign || 'left',
      title_color: data.computedStyles.color || '',
      typography_typography: 'custom',
      typography_font_size: { unit: 'px', size: cssUnit(data.computedStyles.fontSize) || '24' },
      typography_font_weight: data.computedStyles.fontWeight || '600',
      _css_classes: data.className || '',
    },
    elements: [],
  };
}

function buildTextWidget(data: ElementData): ElementorWidget {
  return {
    id: uid(),
    elType: 'widget',
    widgetType: 'text-editor',
    settings: {
      editor: data.innerHTML || `<p>${data.innerText}</p>`,
      text_color: data.computedStyles.color || '',
      typography_typography: 'custom',
      typography_font_size: { unit: 'px', size: cssUnit(data.computedStyles.fontSize) || '16' },
      typography_font_weight: data.computedStyles.fontWeight || '400',
      _css_classes: data.className || '',
    },
    elements: [],
  };
}

function buildButtonWidget(data: ElementData): ElementorWidget {
  const href = data.attributes['href'] || '#';
  return {
    id: uid(),
    elType: 'widget',
    widgetType: 'button',
    settings: {
      text: data.innerText || 'Button',
      link: { url: href, is_external: href.startsWith('http') ? 'yes' : '', nofollow: '' },
      align: 'center',
      button_type: 'default',
      border_radius: { unit: 'px', top: cssUnit(data.computedStyles.borderRadius) || '4', right: cssUnit(data.computedStyles.borderRadius) || '4', bottom: cssUnit(data.computedStyles.borderRadius) || '4', left: cssUnit(data.computedStyles.borderRadius) || '4', isLinked: true },
      background_color: data.computedStyles.backgroundColor || '#a855f7',
      button_text_color: data.computedStyles.color || '#ffffff',
      typography_font_size: { unit: 'px', size: cssUnit(data.computedStyles.fontSize) || '14' },
      _css_classes: data.className || '',
    },
    elements: [],
  };
}

function buildImageWidget(data: ElementData): ElementorWidget {
  const src = data.attributes['src'] || '';
  const alt = data.attributes['alt'] || 'Image';
  return {
    id: uid(),
    elType: 'widget',
    widgetType: 'image',
    settings: {
      image: { url: src, alt },
      image_size: 'full',
      align: 'center',
      width: { unit: 'px', size: data.rect.width || '' },
      height: { unit: 'px', size: data.rect.height || '' },
      _css_classes: data.className || '',
    },
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
  const src = data.attributes['src'] || data.attributes['data-src'] || '';
  return {
    id: uid(),
    elType: 'widget',
    widgetType: 'video',
    settings: {
      video_type: 'hosted',
      hosted_url: { url: src },
      autoplay: '',
      mute: '',
      _css_classes: data.className || '',
    },
    elements: [],
  };
}

function buildIconBoxWidget(data: ElementData): ElementorWidget {
  return {
    id: uid(),
    elType: 'widget',
    widgetType: 'icon-box',
    settings: {
      title_text: data.innerText || 'Icon Box',
      description_text: '',
      _css_classes: data.className || '',
    },
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
// Widget Selector
// ─────────────────────────────────────────────

function buildWidget(data: ElementData): ElementorWidget {
  const tag = data.tagName.toUpperCase();

  if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(tag)) return buildHeadingWidget(data);
  if (['P', 'SPAN', 'BLOCKQUOTE', 'PRE', 'STRONG', 'EM'].includes(tag)) return buildTextWidget(data);
  if (tag === 'BUTTON' || tag === 'A') return buildButtonWidget(data);
  if (tag === 'IMG' || tag === 'PICTURE') return buildImageWidget(data);
  if (tag === 'VIDEO' || tag === 'IFRAME') return buildVideoWidget(data);
  if (tag === 'HR') return buildDividerWidget();
  if (tag === 'I' || tag === 'SVG') return buildIconBoxWidget(data);
  if (['DIV', 'SECTION', 'ARTICLE', 'MAIN', 'ASIDE', 'HEADER', 'FOOTER'].includes(tag)) {
    // Layout container — detect as a spacer if it has no text content
    if (!data.innerText.trim()) return buildSpacerWidget(data);
    return buildTextWidget(data);
  }

  return buildTextWidget(data);
}

// ─────────────────────────────────────────────
// Column & Section Wrappers
// ─────────────────────────────────────────────

function buildColumn(widgets: ElementorWidget[], widthPercent = 100): ElementorWidget {
  const isFlexLayout = widthPercent < 100;
  return {
    id: uid(),
    elType: 'column',
    settings: {
      _column_size: widthPercent,
      _inline_size: null,
      background_background: 'classic',
      padding: { unit: 'px', top: '10', right: '10', bottom: '10', left: '10', isLinked: false },
    },
    elements: widgets,
  };
}

function buildSection(columns: ElementorWidget[], data: ElementData): ElementorWidget {
  const isFlexDisplay = data.computedStyles.display?.includes('flex');
  const isGridDisplay = data.computedStyles.display?.includes('grid');

  return {
    id: uid(),
    elType: 'section',
    isInner: false,
    settings: {
      layout: isFlexDisplay ? 'flexbox' : 'default',
      gap: 'default',
      structure: `${columns.length}0`,
      background_background: 'classic',
      background_color: data.computedStyles.backgroundColor !== 'rgba(0, 0, 0, 0)' ? data.computedStyles.backgroundColor : '',
      padding: {
        unit: 'px',
        top: cssUnit(data.computedStyles.paddingTop) || '20',
        right: cssUnit(data.computedStyles.paddingRight) || '20',
        bottom: cssUnit(data.computedStyles.paddingBottom) || '20',
        left: cssUnit(data.computedStyles.paddingLeft) || '20',
        isLinked: false,
      },
      content_width: { unit: 'px', size: Math.min(data.rect.width || 1200, 1200) },
    },
    elements: columns,
  };
}

// ─────────────────────────────────────────────
// Main Exporter — Full Layout-Aware
// ─────────────────────────────────────────────

export function generateElementorJSON(data: ElementData): ElementorExport {
  const tag = data.tagName.toUpperCase();
  const isLayoutContainer = ['DIV', 'SECTION', 'ARTICLE', 'MAIN', 'ASIDE', 'HEADER', 'FOOTER', 'FORM', 'NAV'].includes(tag);

  let sections: ElementorWidget[];

  if (isLayoutContainer && data.childrenCount > 1) {
    // Multi-column layout: split children proportionally if flex/grid
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
    // Single widget
    const widget = buildWidget(data);
    const column = buildColumn([widget], 100);
    sections = [buildSection([column], data)];
  }

  return {
    version: '0.4',
    title: `Elementorify Export — ${data.tagName.toLowerCase()}`,
    type: 'page',
    content: sections,
  };
}

// ─────────────────────────────────────────────
// Clipboard Serializer
// ─────────────────────────────────────────────

export function serializeForClipboard(data: ElementData): string {
  const exportData = generateElementorJSON(data);
  const elementorPayload = {
    type: 'elementor',
    siteurl: '',
    elements: exportData.content,
  };
  return JSON.stringify(elementorPayload, null, 2);
}
