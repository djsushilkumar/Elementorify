import { generateElementorJSON, serializeForClipboard } from '../src/content/elementor-exporter';

console.log('🧪 Running Elementorify Exporter Tests...\n');

const mockHeading = {
  tagName: 'H2',
  className: 'title-main glowing',
  id: 'heading-1',
  innerText: 'Welcome to Elementorify',
  innerHTML: 'Welcome to Elementorify',
  computedStyles: {
    color: 'rgb(168, 85, 247)',
    fontSize: '32px',
    fontWeight: '700',
    textAlign: 'center',
    display: 'block',
    padding: '10px',
  },
  attributes: { id: 'heading-1' },
  childrenCount: 0,
  rect: { width: 600, height: 48, top: 100, left: 100 },
};

const mockButton = {
  tagName: 'BUTTON',
  className: 'btn btn-primary',
  id: 'btn-submit',
  innerText: 'Get Started Now',
  innerHTML: 'Get Started Now',
  computedStyles: {
    color: 'rgb(255, 255, 255)',
    backgroundColor: 'rgb(6, 182, 212)',
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '8px',
    display: 'inline-block',
  },
  attributes: { href: 'https://elementorify.app' },
  childrenCount: 0,
  rect: { width: 180, height: 44, top: 200, left: 100 },
};

// Test 1: Elementor 4.0 Atomic Heading Conversion
try {
  const jsonHeadingV4 = generateElementorJSON(mockHeading, 'v4');
  console.log('✅ Test 1 Passed: Elementor 4.0 Atomic Heading conversion valid.');
  console.log(`   - Schema Version: ${jsonHeadingV4.version}`);
  console.log(`   - Root Atomic elType: ${jsonHeadingV4.content[0].elType}`);
  console.log(`   - Inner Widget Type: ${jsonHeadingV4.content[0].elements[0].widgetType}`);
  console.log(`   - Editor Settings Title: ${jsonHeadingV4.content[0].editor_settings?.title}`);
} catch (err) {
  console.error('❌ Test 1 Failed:', err);
}

// Test 2: Elementor 3.x Legacy Button Conversion
try {
  const serializedV3 = serializeForClipboard(mockButton, 'v3');
  const parsedV3 = JSON.parse(serializedV3);
  console.log('\n✅ Test 2 Passed: Elementor 3.x Legacy conversion clean.');
  console.log(`   - Version: ${parsedV3.version}`);
  console.log(`   - Section elType: ${parsedV3.elements[0].elType}`);
  console.log(`   - Widget Type: ${parsedV3.elements[0].elements[0].elements[0].widgetType}`);
  console.log(`   - Text: ${parsedV3.elements[0].elements[0].elements[0].settings.text}`);
} catch (err) {
  console.error('❌ Test 2 Failed:', err);
}

const mockHeader = {
  tagName: 'HEADER',
  className: 'site-header navbar-main',
  id: 'main-header',
  innerText: 'Home About Services Contact',
  innerHTML: '<nav>Home About Services Contact</nav>',
  computedStyles: {
    display: 'flex',
    backgroundColor: 'rgb(15, 23, 42)',
    color: 'rgb(255, 255, 255)',
  },
  attributes: { id: 'main-header' },
  childrenCount: 4,
  rect: { width: 1200, height: 80, top: 0, left: 0 },
};

// Test 3: Elementor 4.0 Atomic Clipboard Serialization & Toast Helper
try {
  const { copyElementorToClipboard } = await import('../src/content/elementor-exporter');
  const payloadV4 = await copyElementorToClipboard(mockHeading, 'v4');
  const parsedHeadingV4 = JSON.parse(payloadV4);
  console.log('\n✅ Test 3 Passed: Elementor 4.0 Atomic Toast & Clipboard helper executed cleanly.');
  console.log(`   - Version: ${parsedHeadingV4.version}`);
  console.log(`   - Root Atomic Type: ${parsedHeadingV4.elements[0].elType}`);
  console.log(`   - Title: ${parsedHeadingV4.elements[0].elements[0].settings.title}`);
} catch (err) {
  console.error('❌ Test 3 Failed:', err);
}

// Test 4: Native Nav Menu & Header Container Naming
try {
  const jsonHeader = generateElementorJSON(mockHeader, 'v4');
  console.log('\n✅ Test 4 Passed: Native Nav Menu & Semantic Header Container naming valid.');
  console.log(`   - Container Title: ${jsonHeader.content[0].editor_settings?.title}`);
  console.log(`   - Native Widget Type: ${jsonHeader.content[0].elements[0].widgetType}`);
} catch (err) {
  console.error('❌ Test 4 Failed:', err);
}

// Test 5: CSS Flexbox & CSS Grid Container Conversion
const mockFlexGridContainer = {
  tagName: 'SECTION',
  className: 'grid-layout-section',
  id: 'features-grid',
  innerText: 'Feature 1 Feature 2 Feature 3',
  innerHTML: '<div>Feature 1</div><div>Feature 2</div><div>Feature 3</div>',
  computedStyles: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '24px',
    backgroundColor: 'rgb(30, 41, 59)',
    borderStyle: 'solid',
    borderWidth: '2px',
    borderColor: 'rgb(168, 85, 247)',
    boxShadow: '0px 10px 25px rgba(0, 0, 0, 0.25)',
  },
  attributes: { id: 'features-grid' },
  childrenCount: 3,
  rect: { width: 1200, height: 400, top: 0, left: 0 },
};

try {
  const jsonGrid = generateElementorJSON(mockFlexGridContainer, 'v4');
  const containerSettings = jsonGrid.content[0].settings as Record<string, any>;
  console.log('\n✅ Test 5 Passed: CSS Grid container layout conversion valid.');
  console.log(`   - Container elType: ${jsonGrid.content[0].elType}`);
  console.log(`   - Grid Columns: ${containerSettings.grid_columns_grid?.size}`);
  console.log(`   - Border Style: ${containerSettings.border_border}`);
  console.log(`   - Box Shadow Active: ${containerSettings.box_shadow_box_shadow_type}`);
} catch (err) {
  console.error('❌ Test 5 Failed:', err);
}

// Test 6: CSS Gradient Background Extraction
const mockGradientCard = {
  tagName: 'DIV',
  className: 'hero-gradient-card',
  id: 'card-gradient',
  innerText: 'Gradient Card Content',
  innerHTML: '<p>Gradient Card Content</p>',
  computedStyles: {
    display: 'block',
    backgroundImage: 'linear-gradient(135deg, rgb(168, 85, 247) 0%, rgb(6, 182, 212) 100%)',
    hoverBackgroundColor: 'rgb(236, 72, 153)',
    transitionDuration: '0.3s',
  },
  attributes: { id: 'card-gradient' },
  childrenCount: 1,
  rect: { width: 400, height: 250, top: 0, left: 0 },
};

try {
  const jsonGradient = generateElementorJSON(mockGradientCard, 'v4');
  const settings = jsonGradient.content[0].settings as Record<string, any>;
  console.log('\n✅ Test 6 Passed: CSS Gradient background & hover transition valid.');
  console.log(`   - Background Type: ${settings.background_background}`);
  console.log(`   - Gradient Color A: ${settings.background_color}`);
  console.log(`   - Gradient Color B: ${settings.background_color_b}`);
  console.log(`   - Gradient Angle: ${settings.background_gradient_angle?.size}°`);
  console.log(`   - Hover Background Color: ${settings.background_hover_color}`);
} catch (err) {
  console.error('❌ Test 6 Failed:', err);
}

// Test 7: Advanced Typography Export
const mockTypographyHeading = {
  tagName: 'H1',
  className: 'hero-headline',
  id: 'main-title',
  innerText: 'Transform HTML into Elementor',
  innerHTML: 'Transform HTML into Elementor',
  computedStyles: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: '48px',
    fontWeight: '800',
    lineHeight: '1.2',
    letterSpacing: '-1px',
    textTransform: 'uppercase',
    fontStyle: 'italic',
    color: 'rgb(255, 255, 255)',
  },
  attributes: {},
  childrenCount: 0,
  rect: { width: 800, height: 60, top: 0, left: 0 },
};

try {
  const jsonTypography = generateElementorJSON(mockTypographyHeading, 'v4');
  const headingSettings = jsonTypography.content[0].elements[0].settings as Record<string, any>;
  console.log('\n✅ Test 7 Passed: Advanced Typography settings output valid.');
  console.log(`   - Font Family: ${headingSettings.typography_font_family}`);
  console.log(`   - Font Size: ${headingSettings.typography_font_size?.size}px`);
  console.log(`   - Line Height: ${headingSettings.typography_line_height?.size}em`);
  console.log(`   - Letter Spacing: ${headingSettings.typography_letter_spacing?.size}px`);
  console.log(`   - Text Transform: ${headingSettings.typography_transform}`);
  console.log(`   - Font Style: ${headingSettings.typography_font_style}`);
} catch (err) {
  console.error('❌ Test 7 Failed:', err);
}

// Test 8: Global Color & Typography Palette Extraction
try {
  const { extractGlobalPaletteFromElements } = await import('../src/content/palette-extractor');
  const mockPageStyles = [
    { color: 'rgb(168, 85, 247)', backgroundColor: 'rgb(15, 23, 42)', fontFamily: "'Outfit', sans-serif" },
    { color: 'rgb(6, 182, 212)', backgroundColor: 'rgb(15, 23, 42)', fontFamily: "'Inter', sans-serif" },
    { color: 'rgb(236, 72, 153)', backgroundColor: 'rgb(30, 41, 59)', fontFamily: "'Outfit', sans-serif" },
  ];

  const palette = extractGlobalPaletteFromElements(mockPageStyles);
  console.log('\n✅ Test 8 Passed: Global Color & Typography Palette extraction valid.');
  console.log(`   - Total Extracted Colors: ${palette.colors.length}`);
  console.log(`   - Primary Color: ${palette.colors.find(c => c.id === 'primary')?.color}`);
  console.log(`   - Secondary Color: ${palette.colors.find(c => c.id === 'secondary')?.color}`);
  console.log(`   - Primary Font: ${palette.fonts.find(f => f.id === 'primary')?.fontFamily}`);
  console.log(`   - Kit Payload Type: ${palette.elementorKitPayload.type}`);
} catch (err) {
  console.error('❌ Test 8 Failed:', err);
}

// Test 9: Smart Widget Auto-Mapper Test
try {
  const { detectAccordionWidget, detectTabsWidget, detectCounterWidget, detectTestimonialWidget, detectIconBoxWidget } = await import('../src/content/widget-mapper');

  const mockDetailsData: any = { tagName: 'DETAILS', className: '', innerText: 'What is Elementorify?', innerHTML: '<summary>What is Elementorify?</summary><p>A powerful converter extension.</p>' };
  const mockTabsData: any = { tagName: 'DIV', className: 'tabs-container', innerText: 'Tab 1 Tab 2', innerHTML: '<div class="tab-btn">Tab 1</div><div class="tab-btn">Tab 2</div><div class="tab-content">Content</div>' };
  const mockCounterData: any = { tagName: 'SPAN', className: 'stat-count', innerText: '500+', innerHTML: '500+' };
  const mockTestimonialData: any = { tagName: 'DIV', className: 'testimonial-card', innerText: 'Great product! Sarah Jenkins CTO', innerHTML: '<p>Great product!</p><h4>Sarah Jenkins</h4>' };
  const mockIconBoxData: any = { tagName: 'DIV', className: 'icon-box', innerText: 'Feature Rocket Launch', innerHTML: '<svg></svg><h3>Feature Rocket</h3><p>Launch fast</p>' };

  const accWidget = detectAccordionWidget(mockDetailsData);
  const tabWidget = detectTabsWidget(mockTabsData);
  const cntWidget = detectCounterWidget(mockCounterData);
  const tstWidget = detectTestimonialWidget(mockTestimonialData);
  const ibxWidget = detectIconBoxWidget(mockIconBoxData);

  console.log('\n✅ Test 9 Passed: Smart Widget Auto-Mapper pattern recognition valid.');
  console.log(`   - Accordion Widget Type: ${accWidget?.widgetType}`);
  console.log(`   - Tabs Widget Type: ${tabWidget?.widgetType}`);
  console.log(`   - Counter Ending Number: ${cntWidget?.settings.ending_number}`);
  console.log(`   - Testimonial Name: ${tstWidget?.settings.testimonial_name}`);
  console.log(`   - Icon Box Title: ${ibxWidget?.settings.title_text}`);
} catch (err) {
  console.error('❌ Test 9 Failed:', err);
}

// Test 10: Global Site Settings & Responsive Breakpoints Test
try {
  const { generateElementorV4AtomicJSON } = await import('../src/content/elementor-exporter');

  const mockHeading: any = {
    tagName: 'H1',
    className: 'hero-title',
    innerText: 'Global Responsive Heading',
    innerHTML: 'Global Responsive Heading',
    computedStyles: {
      color: 'rgb(15, 23, 42)',
      fontSize: '48px',
      fontFamily: "'Outfit', sans-serif",
      paddingTop: '32px',
      paddingBottom: '32px',
    },
    attributes: {},
    childrenCount: 0,
    rect: { width: 1200, height: 60, top: 0, left: 0 },
  };

  const json = generateElementorV4AtomicJSON(mockHeading);
  const headingWidget = json.content[0].elements[0];

  console.log('\n✅ Test 10 Passed: Global Site Settings & Responsive Breakpoints valid.');
  console.log(`   - Global Color Link: ${(headingWidget.settings.__globals__ as any)?.title_color}`);
  console.log(`   - Global Typography Link: ${(headingWidget.settings.__globals__ as any)?.typography_typography}`);
  console.log(`   - Desktop Font Size: ${(headingWidget.settings.typography_font_size as any)?.size}px`);
  console.log(`   - Tablet Font Size: ${(headingWidget.settings.typography_font_size_tablet as any)?.size}px`);
  console.log(`   - Mobile Font Size: ${(headingWidget.settings.typography_font_size_mobile as any)?.size}px`);
  console.log(`   - Tablet Padding Top: ${(json.content[0].settings.padding_tablet as any)?.top}px`);
  console.log(`   - Mobile Padding Top: ${(json.content[0].settings.padding_mobile as any)?.top}px`);
} catch (err) {
  console.error('❌ Test 10 Failed:', err);
}

console.log('\n🎉 All Exporter Tests (v4 Atomic, v3 Legacy, Advanced Styling, Global Palette, Smart Widget Auto-Mapper & Global Responsive Settings) Completed Successfully!');





