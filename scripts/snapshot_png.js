#!/usr/bin/env node
// Render an HTML file to PNG using Playwright (headless Chromium)
const { chromium } = require('playwright');
const path = require('path');

const input = process.argv[2];
const output = process.argv[3] || 'diagram.png';
if (!input) {
  console.error('Usage: node snapshot_png.js <input.html> <output.png?>');
  process.exit(1);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const url = path.isAbsolute(input) ? 'file://' + input : 'file://' + path.join(process.cwd(), input);
  await page.goto(url);
  await page.waitForTimeout(200);
  await page.screenshot({ path: output, fullPage: true });
  await browser.close();
  console.log(`Wrote ${output}`);
})();
