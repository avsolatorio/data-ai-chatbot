import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://localhost:3001');
await page.waitForTimeout(2000);
await page.getByPlaceholder(/message/i).fill('What is the GDP for Japan and the Philippines?');
await page.getByPlaceholder(/message/i).press('Enter');
await page.waitForTimeout(15000); // wait for response
const html = await page.$eval('.bg-muted\\/40', el => el.innerHTML).catch(() => 'not found');
console.log(html);
await browser.close();
