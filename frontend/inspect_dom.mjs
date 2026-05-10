import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3001');

  // Wait for the chat input and submit a query
  await page.waitForSelector('textarea', { timeout: 10000 });
  await page.fill('textarea', 'What is the GDP for Japan?');
  await page.press('textarea', 'Enter');

  // Wait for the Search Result Card to appear (it should have 'Search Results' text)
  await page.waitForSelector('text="Search Results"', { timeout: 60000 });

  // Give it a second to fully render
  await page.waitForTimeout(2000);

  // Grab the outerHTML of the SearchResultCard
  const html = await page.$eval('[role="list"]', el => el.outerHTML).catch(() => 'no list found');
  console.log("HTML:", html.substring(0, 2000));

  await browser.close();
})();
