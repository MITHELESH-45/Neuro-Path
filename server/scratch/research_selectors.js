const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    console.log('--- Testing Bing ---');
    try {
        await page.goto('https://www.bing.com', { waitUntil: 'networkidle' });
        const bingSearchBox = await page.$('input[name="q"]');
        console.log('Bing Search Box found:', !!bingSearchBox);
        
        await page.goto('https://www.bing.com/search?q=trending+movies', { waitUntil: 'networkidle' });
        const bingResults = await page.$$eval('li.b_algo h2 a', els => els.map(el => el.href));
        console.log('Bing Results (example selector):', bingResults.length);
    } catch (e) {
        console.log('Bing research failed:', e.message);
    }
    
    console.log('--- Testing Google ---');
    try {
        await page.goto('https://www.google.com/search?q=trending+movies', { waitUntil: 'networkidle' });
        const googleResults = await page.$$eval('div.g a h3', els => els.map(el => el.parentElement.href));
        console.log('Google Results found:', googleResults.length);
    } catch (e) {
        console.log('Google research failed:', e.message);
    }
    
    await browser.close();
})();
