import puppeteer = require('puppeteer');

// Puppeteer example
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://sj.se');
  await page.screenshot({ path: 'example.png' });

  await browser.close();
})();
