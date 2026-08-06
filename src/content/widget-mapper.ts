import { ElementData, ElementorWidget } from '../shared/types';

/**
 * Smart Widget Auto-Mapper Engine for Elementorify
 * Detects complex HTML patterns (Tabs, Accordion, Counter, Testimonial, Icon-Box)
 * from both live DOM elements and captured ElementData objects.
 */

export interface MapWidgetOptions {
  exportVersion?: 'v3' | 'v4';
}

function uid(): string {
  return Math.random().toString(36).substring(2, 9);
}

function getElementClassName(element: any): string {
  return (element?.className || '').toLowerCase();
}

function getElementInnerHTML(element: any): string {
  return element?.innerHTML || '';
}

function getElementText(element: any): string {
  return (element?.innerText || element?.textContent || '').trim();
}

/**
 * Detects HTML <details><summary> or .accordion-item / .faq-item elements
 * and maps to native Elementor Accordion widget.
 */
export function detectAccordionWidget(element: HTMLElement | ElementData): ElementorWidget | null {
  let isAccordion = false;
  let tabs: Array<{ tab_title: string; tab_content: string }> = [];

  if ('tagName' in element && !('nodeType' in element)) {
    // ElementData object
    const tag = (element.tagName || '').toUpperCase();
    const cls = getElementClassName(element);
    const html = getElementInnerHTML(element);

    if (tag === 'DETAILS' || cls.includes('accordion') || cls.includes('faq')) {
      isAccordion = true;
      if (typeof document !== 'undefined') {
        const div = document.createElement('div');
        div.innerHTML = html;
        const detailsItems = Array.from(div.querySelectorAll('details'));
        const items = Array.from(div.querySelectorAll('.accordion-item, .faq-item, .accordion-card'));

        if (detailsItems.length > 0) {
          detailsItems.forEach((d, idx) => {
            const summary = d.querySelector('summary')?.innerText || `FAQ Item #${idx + 1}`;
            const clone = d.cloneNode(true) as HTMLElement;
            clone.querySelector('summary')?.remove();
            tabs.push({ tab_title: summary.trim(), tab_content: clone.innerHTML.trim() || 'Details content.' });
          });
        } else if (items.length > 0) {
          items.forEach((item, idx) => {
            const titleEl = item.querySelector('h1, h2, h3, h4, h5, h6, .accordion-header, .faq-question, .accordion-title');
            const contentEl = item.querySelector('.accordion-body, .faq-answer, .accordion-content, p');
            tabs.push({
              tab_title: (titleEl?.textContent || `FAQ Item #${idx + 1}`).trim(),
              tab_content: (contentEl?.innerHTML || 'Description content.').trim(),
            });
          });
        }
      }

      if (tabs.length === 0) {
        tabs.push({
          tab_title: element.innerText?.slice(0, 40) || 'FAQ Question Item',
          tab_content: element.innerText || 'Detailed FAQ answer content for Elementor accordion.',
        });
      }
    }
  } else {
    // HTMLElement
    const el = element as HTMLElement;
    const detailsItems = Array.from(el.querySelectorAll('details'));
    const accordionItems = Array.from(el.querySelectorAll('.accordion-item, .faq-item, .accordion-card'));

    if (el.tagName === 'DETAILS' || detailsItems.length > 0 || accordionItems.length > 0) {
      isAccordion = true;
      if (el.tagName === 'DETAILS') {
        const summary = el.querySelector('summary')?.innerText || 'FAQ Item';
        const clone = el.cloneNode(true) as HTMLElement;
        clone.querySelector('summary')?.remove();
        tabs.push({ tab_title: summary.trim(), tab_content: clone.innerHTML.trim() || 'Details content.' });
      } else if (detailsItems.length > 0) {
        detailsItems.forEach((d, idx) => {
          const summary = d.querySelector('summary')?.innerText || `FAQ Item #${idx + 1}`;
          const clone = d.cloneNode(true) as HTMLElement;
          clone.querySelector('summary')?.remove();
          tabs.push({ tab_title: summary.trim(), tab_content: clone.innerHTML.trim() || 'Details content.' });
        });
      } else {
        accordionItems.forEach((item, idx) => {
          const titleEl = item.querySelector('h1, h2, h3, h4, h5, h6, .accordion-header, .faq-question, .accordion-title');
          const contentEl = item.querySelector('.accordion-body, .faq-answer, .accordion-content, p');
          tabs.push({
            tab_title: (titleEl?.textContent || `FAQ Item #${idx + 1}`).trim(),
            tab_content: (contentEl?.innerHTML || 'Description content.').trim(),
          });
        });
      }
    }
  }

  if (isAccordion && tabs.length > 0) {
    return {
      id: `acc_${uid()}`,
      elType: 'widget',
      widgetType: 'accordion',
      isInner: false,
      settings: {
        tabs,
        icon: 'fas fa-plus',
        icon_active: 'fas fa-minus',
        icon_align: 'left',
      },
      elements: [],
    };
  }

  return null;
}

/**
 * Detects tab navigation ([role="tablist"], .tabs, .tab-buttons) and panels ([role="tabpanel"])
 * and maps to native Elementor Tabs widget.
 */
export function detectTabsWidget(element: HTMLElement | ElementData): ElementorWidget | null {
  const cls = getElementClassName(element);
  const html = getElementInnerHTML(element);

  if (cls.includes('tab') || html.includes('tablist') || html.includes('tabpanel') || html.includes('tab-btn')) {
    const tabs: Array<{ tab_title: string; tab_content: string }> = [];

    if (typeof document !== 'undefined') {
      const div = document.createElement('div');
      div.innerHTML = html;

      const tabTriggers = Array.from(div.querySelectorAll('[role="tab"], .tab-btn, .tab-title, .tab-header, .tab-link'));
      const tabPanels = Array.from(div.querySelectorAll('[role="tabpanel"], .tab-content, .tab-pane, .tab-panel'));

      if (tabTriggers.length >= 2) {
        tabTriggers.forEach((trig, idx) => {
          const title = trig.textContent?.trim() || `Tab #${idx + 1}`;
          const panel = tabPanels[idx] || tabPanels[0];
          const content = panel ? panel.innerHTML.trim() : `Content for ${title}`;
          tabs.push({ tab_title: title, tab_content: content });
        });
      }
    }

    if (tabs.length === 0 && cls.includes('tab')) {
      tabs.push({ tab_title: 'Tab #1', tab_content: 'Tab panel content #1' });
      tabs.push({ tab_title: 'Tab #2', tab_content: 'Tab panel content #2' });
    }

    if (tabs.length > 0) {
      return {
        id: `tab_${uid()}`,
        elType: 'widget',
        widgetType: 'tabs',
        isInner: false,
        settings: {
          tabs,
          type: 'horizontal',
        },
        elements: [],
      };
    }
  }

  return null;
}

/**
 * Detects stat counters (500+, 99%, 10k+) and maps to native Elementor Counter widget.
 */
export function detectCounterWidget(element: HTMLElement | ElementData): ElementorWidget | null {
  const cls = getElementClassName(element);
  const text = getElementText(element);

  const isCounterClass = /count|stat|number|metric/i.test(cls);
  const match = text.match(/^([^\d]*)(\d+[\d,.]*)([^\d]*)$/);

  if ((isCounterClass || (match && parseInt(match[2]) > 5)) && text.length < 40) {
    let startingNumber = 0;
    let endingNumber = 100;
    let prefix = '';
    let suffix = '';

    if (match) {
      prefix = match[1] || '';
      endingNumber = parseInt(match[2].replace(/,/g, '')) || 100;
      suffix = match[3] || '';
    }

    return {
      id: `cnt_${uid()}`,
      elType: 'widget',
      widgetType: 'counter',
      isInner: false,
      settings: {
        starting_number: startingNumber,
        ending_number: endingNumber,
        prefix,
        suffix,
        title: 'Project Statistics',
        duration: 2000,
        thousand_separator: 'yes',
      },
      elements: [],
    };
  }

  return null;
}

/**
 * Detects review/testimonial cards with quote, author name, job title, and avatar.
 * Maps to native Elementor Testimonial widget.
 */
export function detectTestimonialWidget(element: HTMLElement | ElementData): ElementorWidget | null {
  const cls = getElementClassName(element);
  const html = getElementInnerHTML(element);

  const isTestimonialClass = /testimonial|review|quote-card/i.test(cls);

  if (isTestimonialClass || html.includes('blockquote') || (html.includes('author') && html.includes('review'))) {
    let testimonialContent = 'This product exceeded our expectations and delivered outstanding results.';
    let testimonialName = 'Sarah Jenkins';
    let testimonialJob = 'Chief Technology Officer';
    let imageSrc = 'https://via.placeholder.com/150';

    if (typeof document !== 'undefined') {
      const div = document.createElement('div');
      div.innerHTML = html;

      const quoteEl = div.querySelector('blockquote, .quote, .testimonial-text, .review-body, p');
      const authorEl = div.querySelector('.author, .author-name, .client-name, .reviewer-name, h4, strong');
      const jobEl = div.querySelector('.author-title, .client-role, .reviewer-title, .job-title, small, em');
      const imgEl = div.querySelector('img') as HTMLImageElement | null;

      if (quoteEl?.textContent?.trim()) testimonialContent = quoteEl.textContent.trim();
      if (authorEl?.textContent?.trim()) testimonialName = authorEl.textContent.trim();
      if (jobEl?.textContent?.trim()) testimonialJob = jobEl.textContent.trim();
      if (imgEl?.src) imageSrc = imgEl.src;
    }

    return {
      id: `tst_${uid()}`,
      elType: 'widget',
      widgetType: 'testimonial',
      isInner: false,
      settings: {
        testimonial_content: testimonialContent,
        testimonial_name: testimonialName,
        testimonial_job: testimonialJob,
        testimonial_image: {
          url: imageSrc,
        },
        testimonial_image_position: 'aside',
        alignment: 'left',
      },
      elements: [],
    };
  }

  return null;
}

/**
 * Detects feature cards with an icon/SVG, title, and descriptive text.
 * Maps to native Elementor Icon-Box widget.
 */
export function detectIconBoxWidget(element: HTMLElement | ElementData): ElementorWidget | null {
  const cls = getElementClassName(element);
  const html = getElementInnerHTML(element);

  const isIconBoxClass = /icon-box|feature-box|service-card|info-card/i.test(cls);
  const hasIcon = html.includes('<svg') || html.includes('fa-') || html.includes('icon');

  if (isIconBoxClass || (hasIcon && (html.includes('<h') || html.includes('title')) && html.includes('<p'))) {
    let titleText = 'Feature Title';
    let descText = 'High-performance optimized features designed to scale seamlessly.';

    if (typeof document !== 'undefined') {
      const div = document.createElement('div');
      div.innerHTML = html;

      const titleEl = div.querySelector('h1, h2, h3, h4, h5, h6, .feature-title, .box-title');
      const descEl = div.querySelector('p, .feature-desc, .box-desc');

      if (titleEl?.textContent?.trim()) titleText = titleEl.textContent.trim();
      if (descEl?.textContent?.trim()) descText = descEl.textContent.trim();
    }

    return {
      id: `ibx_${uid()}`,
      elType: 'widget',
      widgetType: 'icon-box',
      isInner: false,
      settings: {
        title_text: titleText,
        description_text: descText,
        icon: {
          value: 'fas fa-rocket',
          library: 'fa-solid',
        },
        position: 'top',
        title_size: 'h3',
      },
      elements: [],
    };
  }

  return null;
}

/**
 * Main auto-mapper router: Evaluates element against all smart pattern detectors.
 */
export function tryMapToNativeWidget(element: HTMLElement | ElementData, _options: MapWidgetOptions = {}): ElementorWidget | null {
  if (!element) return null;

  // 1. Accordion / FAQ Detection
  const accordion = detectAccordionWidget(element);
  if (accordion) return accordion;

  // 2. Tabs Detection
  const tabs = detectTabsWidget(element);
  if (tabs) return tabs;

  // 3. Testimonial Card Detection
  const testimonial = detectTestimonialWidget(element);
  if (testimonial) return testimonial;

  // 4. Icon Box Feature Card Detection
  const iconBox = detectIconBoxWidget(element);
  if (iconBox) return iconBox;

  // 5. Stat Counter Detection
  const counter = detectCounterWidget(element);
  if (counter) return counter;

  return null;
}
