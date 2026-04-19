const { chromium } = require('playwright');
const path = require('path');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const searchQuery = 'top trending movies right now';
    const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;
    
    console.log(`Navigating to: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'networkidle' });
    
    const screenshotPath = path.join(__dirname, 'debug_screenshot.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`Screenshot saved to: ${screenshotPath}`);
    
    console.log('Page Title:', await page.title());
    await browser.close();
})();
