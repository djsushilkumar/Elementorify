import { ElementData, ExportVersion, FullPageExportResult, PageSectionInfo } from '../shared/types';
import { generateElementorJSON, serializeForClipboard } from './elementor-exporter';

/**
 * Page & Multi-Section Exporter Engine for Elementorify
 * Scans webpage for semantic layout sections and exports complete page templates.
 */

function extractElementDataFromNode(element: HTMLElement): ElementData {
  const rect = element.getBoundingClientRect();
  const computed = typeof window !== 'undefined' ? window.getComputedStyle(element) : ({} as any);

  const computedStyles: Record<string, string> = {
    display: computed.display || 'block',
    flexDirection: computed.flexDirection || 'row',
    flexWrap: computed.flexWrap || 'nowrap',
    justifyContent: computed.justifyContent || 'flex-start',
    alignItems: computed.alignItems || 'stretch',
    gap: computed.gap || '0px',
    gridTemplateColumns: computed.gridTemplateColumns || 'none',
    fontFamily: computed.fontFamily || 'Inter, sans-serif',
    fontSize: computed.fontSize || '16px',
    fontWeight: computed.fontWeight || '400',
    lineHeight: computed.lineHeight || '1.5',
    color: computed.color || 'rgb(0, 0, 0)',
    backgroundColor: computed.backgroundColor || 'rgba(0, 0, 0, 0)',
    backgroundImage: computed.backgroundImage || 'none',
    borderRadius: computed.borderRadius || '0px',
    borderStyle: computed.borderStyle || 'none',
    borderColor: computed.borderColor || 'rgb(0, 0, 0)',
    borderWidth: computed.borderWidth || '0px',
    boxShadow: computed.boxShadow || 'none',
    paddingTop: computed.paddingTop || '0px',
    paddingRight: computed.paddingRight || '0px',
    paddingBottom: computed.paddingBottom || '0px',
    paddingLeft: computed.paddingLeft || '0px',
    marginTop: computed.marginTop || '0px',
    marginRight: computed.marginRight || '0px',
    marginBottom: computed.marginBottom || '0px',
    marginLeft: computed.marginLeft || '0px',
  };

  return {
    tagName: element.tagName,
    className: element.className || '',
    id: element.id || '',
    innerText: element.innerText || element.textContent || '',
    innerHTML: element.innerHTML || '',
    computedStyles,
    attributes: Array.from(element.attributes || []).reduce((acc, attr) => {
      acc[attr.name] = attr.value;
      return acc;
    }, {} as Record<string, string>),
    childrenCount: element.children.length,
    rect: {
      width: rect.width || 1200,
      height: rect.height || 400,
      top: rect.top || 0,
      left: rect.left || 0,
    },
  };
}

export function findPageSections(): HTMLElement[] {
  if (typeof document === 'undefined') return [];

  const selectors = [
    'header',
    'footer',
    'main',
    'nav',
    'section',
    'article',
    '.hero',
    '.container',
    '.section',
    '[data-section]',
  ];

  const found = Array.from(document.querySelectorAll<HTMLElement>(selectors.join(',')));
  const uniqueSections: HTMLElement[] = [];

  for (const el of found) {
    if (el.id === 'html-to-elementor-content-root' || el.closest('#html-to-elementor-content-root')) {
      continue;
    }
    const rect = el.getBoundingClientRect();
    if (rect.width > 200 && rect.height > 60) {
      if (!uniqueSections.some(parent => parent.contains(el))) {
        uniqueSections.push(el);
      }
    }
  }

  if (uniqueSections.length === 0 && document.body) {
    uniqueSections.push(document.body);
  }

  return uniqueSections;
}

export function getPageSectionSummary(): PageSectionInfo[] {
  const sections = findPageSections();
  return sections.map((el, idx) => {
    const rect = el.getBoundingClientRect();
    const tag = el.tagName.toLowerCase();
    const cls = el.className ? `.${el.className.split(' ')[0]}` : '';
    const title = el.querySelector('h1, h2, h3, h4, h5, h6')?.textContent?.trim() || `${tag}${cls} (Section #${idx + 1})`;

    return {
      id: el.id || `sec_${idx + 1}`,
      tagName: el.tagName,
      className: el.className || '',
      title,
      rect: {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        top: Math.round(rect.top),
        left: Math.round(rect.left),
      },
    };
  });
}

export function generateFullPageTemplateJSON(options: { exportVersion?: ExportVersion } = {}): {
  version: string;
  title: string;
  type: string;
  content: any[];
} {
  const version = options.exportVersion || 'v4';
  const sections = findPageSections();

  const allSectionElements: any[] = [];

  for (const sectionEl of sections) {
    const elementData = extractElementDataFromNode(sectionEl);
    const json = generateElementorJSON(elementData, version);
    if (json.content && json.content.length > 0) {
      allSectionElements.push(...json.content);
    }
  }

  const pageTitle = typeof document !== 'undefined' ? document.title || 'Full Page Export' : 'Full Page Export';

  return {
    version: version === 'v4' ? '0.0' : '0.4',
    title: `Elementorify Export — ${pageTitle}`,
    type: 'page',
    content: allSectionElements,
  };
}

export function downloadTemplateJSON(jsonPayload: string, filename = 'elementor-template.json'): void {
  if (typeof document === 'undefined' || typeof Blob === 'undefined') return;

  const blob = new Blob([jsonPayload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportFullPageTemplate(
  exportVersion: ExportVersion = 'v4',
  mode: 'download' | 'copy' = 'download'
): Promise<FullPageExportResult> {
  const sections = findPageSections();
  const templateJSON = generateFullPageTemplateJSON({ exportVersion });

  const pageTitle = typeof document !== 'undefined' ? document.title || 'Page' : 'Page';
  const sanitizedTitle = pageTitle.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30);
  const filename = `elementor-template-${sanitizedTitle}-${Date.now()}.json`;

  const clipboardPayload = {
    type: 'elementor',
    version: exportVersion === 'v4' ? '0.0' : '0.4',
    siteurl: typeof window !== 'undefined' ? window.location.origin : '',
    elements: templateJSON.content,
  };

  const jsonPayload = JSON.stringify(clipboardPayload, null, 2);

  let downloaded = false;

  if (mode === 'download') {
    downloadTemplateJSON(jsonPayload, filename);
    downloaded = true;
  } else if (mode === 'copy') {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(jsonPayload);
    }
  }

  return {
    title: pageTitle,
    sectionCount: sections.length,
    exportVersion,
    downloaded,
    jsonPayload,
  };
}
