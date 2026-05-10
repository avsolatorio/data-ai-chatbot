const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://localhost:3001');
  await page.waitForTimeout(3000);
  console.log("Navigated to localhost:3001");
  await browser.close();
})();
