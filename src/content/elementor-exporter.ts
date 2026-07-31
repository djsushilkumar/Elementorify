import { ElementData } from '../shared/types';

export interface ElementorWidget {
  id: string;
  elType: 'widget' | 'section' | 'column' | 'container';
  isInner?: boolean;
  widgetType?: string;
  settings: Record<string, any>;
  elements: ElementorWidget[];
}

export function generateElementorJSON(elementData: ElementData): ElementorWidget {
  const elementId = Math.random().toString(36).substring(2, 9);
  
  // Determine widget type based on tag
  let widgetType = 'heading';
  let titleText = elementData.innerText || 'Captured Element';

  if (elementData.tagName === 'IMG') {
    widgetType = 'image';
  } else if (elementData.tagName === 'BUTTON' || elementData.tagName === 'A') {
    widgetType = 'button';
  } else if (elementData.tagName === 'P' || elementData.tagName === 'SPAN') {
    widgetType = 'text-editor';
  }

  const settings: Record<string, any> = {
    title: titleText,
    editor: `<p>${titleText}</p>`,
    _css_classes: elementData.className || '',
  };

  if (elementData.computedStyles.color) {
    settings.custom_css = `selector { color: ${elementData.computedStyles.color}; }`;
  }

  return {
    id: elementId,
    elType: 'container',
    isInner: false,
    settings: settings,
    elements: [
      {
        id: Math.random().toString(36).substring(2, 9),
        elType: 'widget',
        widgetType: widgetType,
        settings: settings,
        elements: [],
      },
    ],
  };
}
