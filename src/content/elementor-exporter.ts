import { ElementData, ExportVersion } from '../shared/types';
import { showCopyToast } from './toast';
export { extractPageGlobalPalette, extractGlobalPaletteFromElements } from './palette-extractor';

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
// Advanced CSS Parsing Helpers
// ─────────────────────────────────────────────

function cleanFontFamily(fontStr: string | undefined): string {
  if (!fontStr || fontStr === 'inherit' || fontStr === 'initial') return '';
  const firstFont = fontStr.split(',')[0].trim().replace(/['"]/g, '');
  if (['sans-serif', 'serif', 'monospace', 'cursive', 'system-ui', '-apple-system', 'blinkmacsystemfont'].includes(firstFont.toLowerCase())) {
    return '';
  }
  return firstFont;
}

function parseTypographySettings(computedStyles: Record<string, string>): Record<string, any> {
  const fontFamily = cleanFontFamily(computedStyles.fontFamily);
  const fontSize = cssUnit(computedStyles.fontSize);
  const fontWeight = computedStyles.fontWeight;
  const lineHeight = computedStyles.lineHeight;
  const letterSpacing = computedStyles.letterSpacing;
  const textTransform = computedStyles.textTransform;
  const fontStyle = computedStyles.fontStyle;
  const textDecoration = computedStyles.textDecorationLine || computedStyles.textDecoration;

  const typography: Record<string, any> = {
    typography_typography: 'custom',
  };

  if (fontFamily) typography.typography_font_family = fontFamily;
  if (fontSize) typography.typography_font_size = { unit: 'px', size: fontSize };
  if (fontWeight && fontWeight !== 'normal') typography.typography_font_weight = fontWeight;

  if (lineHeight && lineHeight !== 'normal') {
    if (lineHeight.endsWith('px')) {
      typography.typography_line_height = { unit: 'px', size: cssUnit(lineHeight) };
    } else if (!isNaN(Number(lineHeight))) {
      typography.typography_line_height = { unit: 'em', size: lineHeight };
    }
  }

  if (letterSpacing && letterSpacing !== 'normal' && letterSpacing !== '0px') {
    typography.typography_letter_spacing = { unit: 'px', size: cssUnit(letterSpacing) };
  }

  if (textTransform && textTransform !== 'none') {
    typography.typography_transform = textTransform;
  }

  if (fontStyle && (fontStyle === 'italic' || fontStyle === 'oblique')) {
    typography.typography_font_style = fontStyle;
  }

  if (textDecoration && textDecoration !== 'none') {
    if (textDecoration.includes('underline')) typography.typography_text_decoration = 'underline';
    else if (textDecoration.includes('line-through')) typography.typography_text_decoration = 'line-through';
  }

  return typography;
}

function parseCSSGradient(bgImageStr: string | undefined): Record<string, any> {
  if (!bgImageStr || bgImageStr === 'none') return {};

  const isLinear = bgImageStr.includes('linear-gradient');
  const isRadial = bgImageStr.includes('radial-gradient');
  if (!isLinear && !isRadial) return {};

  const colorMatches = bgImageStr.match(/(?:rgba?\(.+?\)|#[0-9a-fA-F]{3,8}|[a-z]+)/gi);
  if (!colorMatches || colorMatches.length < 2) return {};

  const colors = colorMatches.filter(c => !['linear', 'radial', 'gradient', 'to', 'top', 'bottom', 'left', 'right', 'deg', 'circle', 'at', 'center'].includes(c.toLowerCase()));
  if (colors.length < 2) return {};

  const color1 = normalizeColor(colors[0]);
  const color2 = normalizeColor(colors[1]);

  let angle = '180';
  const angleMatch = bgImageStr.match(/(\d+)deg/i);
  if (angleMatch) {
    angle = angleMatch[1];
  } else if (bgImageStr.includes('to right')) {
    angle = '90';
  } else if (bgImageStr.includes('to bottom')) {
    angle = '180';
  } else if (bgImageStr.includes('to left')) {
    angle = '270';
  } else if (bgImageStr.includes('to top')) {
    angle = '0';
  }

  return cleanSettings({
    background_background: 'gradient',
    background_color: color1,
    background_color_b: color2,
    background_gradient_type: isRadial ? 'radial' : 'linear',
    background_gradient_angle: { unit: 'deg', size: angle },
    background_gradient_position: isRadial ? 'center center' : '',
  });
}

function parseBoxShadowSettings(shadowStr: string | undefined): Record<string, any> {
  if (!shadowStr || shadowStr === 'none') return {};

  const pxMatches = shadowStr.match(/(-?\d+px)/g);
  const colorMatch = shadowStr.match(/rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}/);

  if (!pxMatches || pxMatches.length < 2) return {};

  const horizontal = cssUnit(pxMatches[0]) || '0';
  const vertical = cssUnit(pxMatches[1]) || '0';
  const blur = pxMatches[2] ? cssUnit(pxMatches[2]) : '0';
  const spread = pxMatches[3] ? cssUnit(pxMatches[3]) : '0';
  const color = colorMatch ? normalizeColor(colorMatch[0]) : 'rgba(0,0,0,0.15)';

  return {
    box_shadow_box_shadow_type: 'yes',
    box_shadow_box_shadow: {
      horizontal,
      vertical,
      blur,
      spread,
      color,
      position: 'outline',
    },
  };
}

function parseBorderSettings(computedStyles: Record<string, string>): Record<string, any> {
  const borderStyle = computedStyles.borderStyle;
  const borderColor = normalizeColor(computedStyles.borderColor || computedStyles.borderTopColor);
  const borderWidth = cssUnit(computedStyles.borderWidth || computedStyles.borderTopWidth);
  const borderRadius = cssUnit(computedStyles.borderRadius || computedStyles.borderTopLeftRadius);

  const res: Record<string, any> = {};

  if (borderStyle && borderStyle !== 'none') {
    res.border_border = borderStyle;
    if (borderWidth) {
      res.border_width = { unit: 'px', top: borderWidth, right: borderWidth, bottom: borderWidth, left: borderWidth, isLinked: true };
    }
    if (borderColor) {
      res.border_color = borderColor;
    }
  }

  if (borderRadius && borderRadius !== '0') {
    res.border_radius = { unit: 'px', top: borderRadius, right: borderRadius, bottom: borderRadius, left: borderRadius, isLinked: true };
  }

  return res;
}

function parseFlexboxSettings(computedStyles: Record<string, string>): Record<string, any> {
  const flexDir = computedStyles.flexDirection;
  const flexWrap = computedStyles.flexWrap;
  const justify = computedStyles.justifyContent;
  const align = computedStyles.alignItems;
  const gapVal = cssUnit(computedStyles.gap || computedStyles.rowGap || computedStyles.columnGap);

  const flexSettings: Record<string, any> = {
    flex_direction: flexDir || 'row',
    flex_wrap: flexWrap === 'wrap' ? 'wrap' : 'nowrap',
  };

  if (justify) {
    if (justify.includes('flex-start') || justify === 'start') flexSettings.justify_content = 'start';
    else if (justify.includes('flex-end') || justify === 'end') flexSettings.justify_content = 'end';
    else if (justify === 'center') flexSettings.justify_content = 'center';
    else if (justify === 'space-between') flexSettings.justify_content = 'space-between';
    else if (justify === 'space-around') flexSettings.justify_content = 'space-around';
    else if (justify === 'space-evenly') flexSettings.justify_content = 'space-evenly';
  }

  if (align) {
    if (align.includes('flex-start') || align === 'start') flexSettings.align_items = 'start';
    else if (align.includes('flex-end') || align === 'end') flexSettings.align_items = 'end';
    else if (align === 'center') flexSettings.align_items = 'center';
    else if (align === 'baseline') flexSettings.align_items = 'baseline';
    else if (align === 'stretch') flexSettings.align_items = 'stretch';
  }

  if (gapVal) {
    flexSettings.gap = { unit: 'px', size: gapVal };
  }

  return flexSettings;
}

function parseGridSettings(computedStyles: Record<string, string>): Record<string, any> {
  const cols = computedStyles.gridTemplateColumns || 'repeat(3, 1fr)';
  const rows = computedStyles.gridTemplateRows || 'auto';
  const colGap = cssUnit(computedStyles.columnGap || computedStyles.gap) || '10';
  const rowGap = cssUnit(computedStyles.rowGap || computedStyles.gap) || '10';

  return {
    grid_columns_grid: { unit: 'custom', size: cols },
    grid_rows_grid: { unit: 'custom', size: rows },
    grid_gap: { unit: 'px', column: colGap, row: rowGap, isLinked: true },
  };
}

function parseHoverSettings(computedStyles: Record<string, string>): Record<string, any> {
  const hoverBg = normalizeColor(computedStyles.hoverBackgroundColor);
  const hoverColor = normalizeColor(computedStyles.hoverColor);
  const hoverBorderColor = normalizeColor(computedStyles.hoverBorderColor);
  const transitionDur = cssUnit(computedStyles.transitionDuration);
  const hoverAnim = computedStyles.hoverAnimation || (transitionDur ? 'grow' : '');

  const hoverRes: Record<string, any> = {};
  if (hoverBg) hoverRes.background_hover_color = hoverBg;
  if (hoverColor) hoverRes.button_hover_color = hoverColor;
  if (hoverBorderColor) hoverRes.border_hover_color = hoverBorderColor;
  if (hoverAnim) hoverRes.hover_animation = hoverAnim;
  if (transitionDur) hoverRes.hover_transition = { unit: 's', size: transitionDur };

  return hoverRes;
}

// ─────────────────────────────────────────────
// Widget Builders
// ─────────────────────────────────────────────

function buildHeadingWidget(data: ElementData): ElementorWidget {
  const tag = data.tagName.toLowerCase();
  const headingSize = { h1: 'xxl', h2: 'xl', h3: 'large', h4: 'medium', h5: 'small', h6: 'small' };
  const typography = parseTypographySettings(data.computedStyles);
  const boxShadow = parseBoxShadowSettings(data.computedStyles.boxShadow);

  return {
    id: uid(),
    elType: 'widget',
    widgetType: 'heading',
    settings: cleanSettings({
      title: data.innerText || 'Heading',
      header_size: headingSize[tag as keyof typeof headingSize] || 'h2',
      align: data.computedStyles.textAlign || 'left',
      title_color: normalizeColor(data.computedStyles.color),
      _css_classes: data.className || '',
      ...typography,
      ...boxShadow,
    }),
    elements: [],
  };
}

function buildTextWidget(data: ElementData): ElementorWidget {
  const cleanHTML = processHTMLUrls(data.innerHTML || `<p>${data.innerText}</p>`);
  const typography = parseTypographySettings(data.computedStyles);

  return {
    id: uid(),
    elType: 'widget',
    widgetType: 'text-editor',
    settings: cleanSettings({
      editor: cleanHTML,
      text_color: normalizeColor(data.computedStyles.color),
      _css_classes: data.className || '',
      ...typography,
    }),
    elements: [],
  };
}

function buildButtonWidget(data: ElementData): ElementorWidget {
  const rawHref = data.attributes['href'] || '#';
  const href = makeAbsoluteURL(rawHref);
  const typography = parseTypographySettings(data.computedStyles);
  const borders = parseBorderSettings(data.computedStyles);
  const boxShadow = parseBoxShadowSettings(data.computedStyles.boxShadow);
  const hovers = parseHoverSettings(data.computedStyles);

  return {
    id: uid(),
    elType: 'widget',
    widgetType: 'button',
    settings: cleanSettings({
      text: data.innerText || 'Button',
      link: { url: href, is_external: href.startsWith('http') ? 'yes' : '', nofollow: '' },
      align: 'center',
      button_type: 'default',
      background_color: normalizeColor(data.computedStyles.backgroundColor) || '#a855f7',
      button_text_color: normalizeColor(data.computedStyles.color) || '#ffffff',
      _css_classes: data.className || '',
      ...typography,
      ...borders,
      ...boxShadow,
      ...hovers,
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
  const typography = parseTypographySettings(data.computedStyles);
  const hovers = parseHoverSettings(data.computedStyles);

  return {
    id: uid(),
    elType: 'widget',
    widgetType: 'nav-menu',
    settings: cleanSettings({
      layout: 'horizontal',
      align_items: 'center',
      pointer: 'underline',
      _css_classes: data.className || '',
      color: normalizeColor(data.computedStyles.color) || '#1e293b',
      ...typography,
      ...hovers,
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
  const gradientSettings = parseCSSGradient(data.computedStyles.backgroundImage);
  const flexSettings = isFlexDisplay ? parseFlexboxSettings(data.computedStyles) : {};
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
      background_background: gradientSettings.background_background || (bgColor ? 'classic' : ''),
      background_color: bgColor,
      ...gradientSettings,
      ...flexSettings,
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
  const isGrid = data.computedStyles.display?.includes('grid');
  const isFlex = data.computedStyles.display?.includes('flex');
  const containerTitle = getSemanticContainerTitle(data);

  const elType = isGrid ? 'e-grid' : (isFlex ? 'e-flexbox' : 'e-div-block');

  const gradientSettings = parseCSSGradient(data.computedStyles.backgroundImage);
  const flexSettings = isFlex ? parseFlexboxSettings(data.computedStyles) : {};
  const gridSettings = isGrid ? parseGridSettings(data.computedStyles) : {};
  const borderSettings = parseBorderSettings(data.computedStyles);
  const boxShadowSettings = parseBoxShadowSettings(data.computedStyles.boxShadow);
  const hoverSettings = parseHoverSettings(data.computedStyles);

  const bgColor = normalizeColor(data.computedStyles.backgroundColor);

  return {
    id: uid(),
    version: '0.0',
    elType,
    isInner: false,
    settings: cleanSettings({
      _title: containerTitle,
      _css_classes: data.className || '',
      background_color: bgColor,
      padding: {
        unit: 'px',
        top: cssUnit(data.computedStyles.paddingTop) || '0',
        right: cssUnit(data.computedStyles.paddingRight) || '0',
        bottom: cssUnit(data.computedStyles.paddingBottom) || '0',
        left: cssUnit(data.computedStyles.paddingLeft) || '0',
        isLinked: false,
      },
      ...gradientSettings,
      ...flexSettings,
      ...gridSettings,
      ...borderSettings,
      ...boxShadowSettings,
      ...hoverSettings,
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


