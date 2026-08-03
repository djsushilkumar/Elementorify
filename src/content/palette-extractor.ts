import { GlobalPaletteData, GlobalColorItem, GlobalFontItem } from '../shared/types';

function normalizeColor(colorStr: string): string {
  if (!colorStr || colorStr === 'transparent' || colorStr === 'rgba(0, 0, 0, 0)') return '';
  const trimmed = colorStr.trim();
  if (trimmed.startsWith('rgb')) {
    const numbers = trimmed.match(/\d+/g);
    if (numbers && numbers.length >= 3) {
      const [r, g, b] = numbers.map(Number);
      return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    }
  }
  return trimmed;
}

function cleanFontName(fontStr: string): string {
  if (!fontStr || fontStr === 'inherit' || fontStr === 'initial') return '';
  const firstFont = fontStr.split(',')[0].trim().replace(/['"]/g, '');
  if (['sans-serif', 'serif', 'monospace', 'cursive', 'system-ui', '-apple-system', 'blinkmacsystemfont'].includes(firstFont.toLowerCase())) {
    return '';
  }
  return firstFont;
}

export function extractGlobalPaletteFromElements(stylesList: Array<{ color?: string; backgroundColor?: string; borderColor?: string; fontFamily?: string }>): GlobalPaletteData {
  const colorCounts = new Map<string, number>();
  const fontCounts = new Map<string, number>();

  for (const style of stylesList) {
    // Process Colors
    [style.color, style.backgroundColor, style.borderColor].forEach(rawCol => {
      if (!rawCol) return;
      const normalized = normalizeColor(rawCol);
      if (normalized && normalized.length >= 4) {
        colorCounts.set(normalized, (colorCounts.get(normalized) || 0) + 1);
      }
    });

    // Process Fonts
    if (style.fontFamily) {
      const fontName = cleanFontName(style.fontFamily);
      if (fontName) {
        fontCounts.set(fontName, (fontCounts.get(fontName) || 0) + 1);
      }
    }
  }

  // Sort Colors by frequency
  const sortedColors = Array.from(colorCounts.entries())
    .map(([color, count]) => ({ color, count }))
    .sort((a, b) => b.count - a.count);

  // Assign System Roles
  const primaryColor = sortedColors[0]?.color || '#a855f7';
  const secondaryColor = sortedColors[1]?.color || '#06b6d4';
  const textColor = sortedColors.find(c => c.color.startsWith('#1') || c.color.startsWith('#0') || c.color.startsWith('#2'))?.color || '#1e293b';
  const accentColor = sortedColors.find(c => c.color !== primaryColor && c.color !== secondaryColor && c.color !== textColor)?.color || '#ec4899';

  const systemColors: GlobalColorItem[] = [
    { id: 'primary', title: 'Primary', color: primaryColor, count: sortedColors[0]?.count || 1 },
    { id: 'secondary', title: 'Secondary', color: secondaryColor, count: sortedColors[1]?.count || 1 },
    { id: 'text', title: 'Text', color: textColor, count: 1 },
    { id: 'accent', title: 'Accent', color: accentColor, count: 1 },
  ];

  const customColors: GlobalColorItem[] = sortedColors
    .slice(2, 8)
    .filter(c => !systemColors.some(s => s.color === c.color))
    .map((c, idx) => ({
      id: `custom_${idx + 1}`,
      title: `Color ${idx + 1}`,
      color: c.color,
      count: c.count,
    }));

  // Sort Fonts by frequency
  const sortedFonts = Array.from(fontCounts.entries())
    .map(([fontFamily, count]) => ({ fontFamily, count }))
    .sort((a, b) => b.count - a.count);

  const primaryFont = sortedFonts[0]?.fontFamily || 'Inter';
  const secondaryFont = sortedFonts[1]?.fontFamily || 'Outfit';

  const systemTypography: GlobalFontItem[] = [
    { id: 'primary', title: 'Primary Font', fontFamily: primaryFont, count: sortedFonts[0]?.count || 1 },
    { id: 'secondary', title: 'Secondary Font', fontFamily: secondaryFont, count: sortedFonts[1]?.count || 1 },
  ];

  const elementorKitPayload = {
    type: 'elementor-kit',
    version: '0.4',
    title: 'Elementorify Extracted Global Palette',
    settings: {
      system_colors: systemColors.map(c => ({ _id: c.id, title: c.title, color: c.color })),
      custom_colors: customColors.map(c => ({ _id: c.id, title: c.title, color: c.color })),
      system_typography: systemTypography.map(f => ({
        _id: f.id,
        title: f.title,
        typography_font_family: f.fontFamily,
      })),
    },
  };

  return {
    colors: [...systemColors, ...customColors],
    fonts: systemTypography,
    elementorKitPayload,
  };
}

export function extractPageGlobalPalette(): GlobalPaletteData {
  if (typeof document === 'undefined') {
    return extractGlobalPaletteFromElements([]);
  }

  const elements = Array.from(document.querySelectorAll('header, nav, main, section, footer, h1, h2, h3, p, a, button, div'));
  const stylesList = elements.slice(0, 100).map(el => {
    const computed = window.getComputedStyle(el);
    return {
      color: computed.color,
      backgroundColor: computed.backgroundColor,
      borderColor: computed.borderColor,
      fontFamily: computed.fontFamily,
    };
  });

  return extractGlobalPaletteFromElements(stylesList);
}
