const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const scrapeReclameAqui = async () => {
    let browser;
    try {
        console.log("🕸️ Iniciando Robô Extrator (Puppeteer Stealth) para Reclame Aqui...");
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();
        
        // Disfarça a navegação
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        const leads = [];
        const targets = ['gol-linhas-aereas', 'latam-airlines-br', 'nubank'];

        for (const target of targets) {
            console.log(`🔎 Pescando reclamações de: ${target}...`);
            const url = `https://www.reclameaqui.com.br/empresa/${target}/lista-reclamacoes/`;
            
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

            // Extrai as reclamações da lista
            const extracted = await page.evaluate(() => {
                const results = [];
                // O Reclame Aqui usa classes específicas, estamos buscando os cards de reclamação
                const cards = document.querySelectorAll('a[href^="/"]'); 
                
                cards.forEach(card => {
                    const textContent = card.innerText || "";
                    if(textContent.length > 30 && textContent.includes('Há') && !textContent.includes('Respondida')) {
                        results.push(textContent.replace(/\n/g, ' '));
                    }
                });
                return results;
            });

            // Analisa e formata os leads
            extracted.forEach((text, index) => {
                let type = "Reclamação Geral";
                let textLower = text.toLowerCase();
                
                if (textLower.includes('cancelado') || textLower.includes('atraso') || textLower.includes('extravio') || textLower.includes('abusiva') || textLower.includes('juros')) {
                    
                    if (textLower.includes('atraso') || textLower.includes('cancelado')) type = "Atraso/Cancelamento Voo";
                    if (textLower.includes('mala') || textLower.includes('extravio')) type = "Bagagem Extraviada";
                    if (textLower.includes('cesta') || textLower.includes('juros')) type = "Taxa Abusiva Bancária";

                    let company = "Empresa";
                    if (target.includes('gol')) company = "GOL";
                    if (target.includes('latam')) company = "LATAM";
                    if (target.includes('nubank')) company = "Nubank";

                    leads.push({
                        post_id: `ra_${target}_${Date.now()}_${index}`,
                        usuario: "Consumidor Oculto (RA)",
                        rede: "Reclame Aqui",
                        texto: text.substring(0, 200) + "...", // Resumo
                        tipo: type,
                        alvo: company
                    });
                }
            });
        }

        console.log(`✅ Extração concluída! ${leads.length} leads qualificados encontrados.`);
        return leads;

    } catch (error) {
        console.error("❌ Falha crítica no Web Scraper:", error.message);
        return [];
    } finally {
        if (browser) await browser.close();
    }
};

module.exports = { scrapeReclameAqui };
