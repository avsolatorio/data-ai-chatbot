import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto('http://localhost:3001')

        await page.wait_for_timeout(3000)

        agent_actions = page.locator('text="Show agent actions"').last
        if await agent_actions.count() > 0:
            await agent_actions.click()
            await page.wait_for_timeout(2000)
            await page.screenshot(path='/Users/rafaelmacalaba/.gemini/antigravity/brain/45ebbdfd-8957-4e42-b4ed-b99f92049cff/proof.png')
            print("Screenshot saved to proof.png")
        else:
            print("Could not find 'Show agent actions'")
            await page.screenshot(path='/Users/rafaelmacalaba/.gemini/antigravity/brain/45ebbdfd-8957-4e42-b4ed-b99f92049cff/proof.png')

        await browser.close()

asyncio.run(main())
