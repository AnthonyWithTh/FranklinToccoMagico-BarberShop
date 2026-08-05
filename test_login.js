const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Raccogli log della console
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.error('PAGE ERROR:', error.message));
    page.on('response', response => {
        if (!response.ok()) {
            console.log('FAILED REQUEST:', response.url(), response.status());
        }
    });

    try {
        await page.goto('http://localhost:3000/admin/login.html', { waitUntil: 'networkidle0' });
        console.log("Pagina caricata!");
        
        await page.type('#username', 'admin');
        await page.type('#password', 'franklin2026');
        
        console.log("Clicco il bottone...");
        await page.click('button[type="submit"]');
        
        // Aspetta un po' per vedere cosa succede
        await new Promise(r => setTimeout(r, 2000));
        
        console.log("Finito!");
    } catch (e) {
        console.error("ERRORE:", e);
    } finally {
        await browser.close();
    }
})();
