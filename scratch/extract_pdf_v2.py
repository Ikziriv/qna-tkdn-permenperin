
import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        # Use absolute path with forward slashes
        abs_path = os.path.abspath("assets/qna/qna-01.pdf")
        url = f"file:///{abs_path.replace('\\', '/')}"
        print(f"Opening {url}")
        try:
            await page.goto(url, wait_until="networkidle")
            await asyncio.sleep(5)
            # PDF viewers (like Chrome's) are tricky. 
            # Often the text isn't directly in innerText of the body.
            # But let's try.
            content = await page.evaluate("document.body.innerText")
            if not content or len(content.strip()) < 10:
                # Try to find embed or object
                content = await page.content()
            print(content)
        except Exception as e:
            print(f"Error: {e}")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
