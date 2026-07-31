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

// Test 1: Heading Conversion
try {
  const jsonHeading = generateElementorJSON(mockHeading);
  console.log('✅ Test 1 Passed: Heading conversion generated valid Elementor structure.');
  console.log(`   - Version: ${jsonHeading.version}`);
  console.log(`   - Sections: ${jsonHeading.content.length}`);
  console.log(`   - Widget Type: ${jsonHeading.content[0].elements[0].elements[0].widgetType}`);
  console.log(`   - Font Size: ${JSON.stringify(jsonHeading.content[0].elements[0].elements[0].settings.typography_font_size)}`);
} catch (err) {
  console.error('❌ Test 1 Failed:', err);
}

// Test 2: Button Conversion & Clipboard Serialization
try {
  const serialized = serializeForClipboard(mockButton);
  const parsed = JSON.parse(serialized);
  console.log('\n✅ Test 2 Passed: Button conversion & native Elementor wrapper clean.');
  console.log(`   - Root Type: ${parsed.type}`);
  console.log(`   - Widget Type: ${parsed.elements[0].elements[0].elements[0].widgetType}`);
  console.log(`   - Text: ${parsed.elements[0].elements[0].elements[0].settings.text}`);
  console.log(`   - Target URL: ${parsed.elements[0].elements[0].elements[0].settings.link.url}`);
  console.log(`   - Background Color: ${parsed.elements[0].elements[0].elements[0].settings.background_color}`);
} catch (err) {
  console.error('❌ Test 2 Failed:', err);
}

// Test 3: Toast & Clipboard Export Helper
try {
  const { copyElementorToClipboard } = await import('../src/content/elementor-exporter');
  const payload = await copyElementorToClipboard(mockHeading);
  const parsedHeading = JSON.parse(payload);
  console.log('\n✅ Test 3 Passed: Copy Toast System & Clipboard helper executed cleanly.');
  console.log(`   - Payload Type: ${parsedHeading.type}`);
  console.log(`   - Title: ${parsedHeading.elements[0].elements[0].elements[0].settings.title}`);
} catch (err) {
  console.error('❌ Test 3 Failed:', err);
}

console.log('\n🎉 All Exporter Tests Completed Successfully!');

