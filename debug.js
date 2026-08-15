const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    // Check if modal opens
    console.log('Clicking Admin...');
    await page.click('#btn-admin-toggle');
    
    // Check if modal has hidden class
    const isHidden = await page.$eval('#modal-admin', el => el.classList.contains('hidden'));
    console.log('Modal is hidden:', isHidden);
    
    await browser.close();
})();
