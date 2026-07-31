# Elementorify - HTML to Elementor Converter

**Elementorify** is a powerful Chrome Extension (Manifest V3) designed to help developers and site builders convert any HTML web page element, section, or layout directly into Elementor widget JSON format for WordPress.

![Elementorify Icon](icon-256.png)

## ✨ Features

- **Visual Element Picker**: Hover and select any DOM element directly on any live website.
- **Computed CSS & Layout Conversion**: Automatically parses flexbox/grid containers, typography, background colors, images, and dimensions.
- **Elementor JSON Export**: Directly serializes captured elements into Elementor-compatible JSON structures.
- **One-Click Clipboard Copy**: Effortlessly copy widget data and paste it straight into WordPress Elementor.
- **Responsive Viewport Simulation**: Simulates custom device width and height via Chrome Debugger protocol (`Emulation.setDeviceMetricsOverride`).

## 🚀 Installation (Unpacked Extension)

1. Clone or download this repository.
2. Open Google Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked** and select this directory (`uploaded_html`).
5. Click the **Elementorify** icon in your browser toolbar to activate the inspector!

## 🛠️ Project Structure

- `manifest.json` - Extension V3 configuration & permissions
- `background.iife.js` - Service worker for message handling & Chrome Debugger emulation
- `content-ui/index.iife.js` - Shadow DOM overlay and DOM parser content script
- `icon-256.png` - App icon
- `_locales/en/messages.json` - English localization strings

## 📄 License

MIT License
