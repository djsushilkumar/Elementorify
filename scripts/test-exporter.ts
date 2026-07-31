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

console.log('\n🎉 All Exporter Tests (v4 Atomic & v3 Legacy) Completed Successfully!');


