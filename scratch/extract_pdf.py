
import asyncio
from playwright.async_api import async_playwright
import sys

async def extract_text(pdf_path):
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        # On Windows, file paths need careful handling
        url = f"file:///{pdf_path.replace('\\', '/')}"
        await page.goto(url)
        # Wait for potential rendering
        await asyncio.sleep(2)
        text = await page.evaluate("() => document.body.innerText")
        await browser.close()
        return text

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python extract_pdf.py <path_to_pdf>")
        sys.exit(1)
    
    path = sys.argv[1]
    result = asyncio.run(extract_text(path))
    print(result)
