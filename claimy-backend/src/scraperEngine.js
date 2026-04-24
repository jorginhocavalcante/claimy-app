const axios = require('axios');
const cheerio = require('cheerio');

const scrapeReclameAqui = async () => {
    const leads = [];
    const targets = ['gol-linhas-aereas', 'latam-airlines-br', 'nubank'];
    const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;

    if (!SCRAPER_API_KEY) {
        console.log("⚠️ Chave do ScraperAPI ausente! Crie uma conta no scraperapi.com e adicione SCRAPER_API_KEY nas variáveis de ambiente do Render.");
        return leads;
    }

    try {
        console.log("🕸️ Iniciando Extração em Nuvem (ScraperAPI) para Reclame Aqui...");
        
        for (const target of targets) {
            console.log(`🔎 Pescando reclamações de: ${target}...`);
            const targetUrl = `https://www.reclameaqui.com.br/empresa/${target}/lista-reclamacoes/`;
            
            // Bypass da Cloudflare através dos servidores de proxy do ScraperAPI
            const response = await axios.get(`http://api.scraperapi.com`, {
                params: {
                    api_key: SCRAPER_API_KEY,
                    url: targetUrl,
                    render: 'true' // O RA carrega dados em Javascript, precisamos renderizar a página
                },
                timeout: 60000 // Aumentamos o tempo pois o proxy precisa renderizar a página
            });

            // Carregamos o HTML da página no interpretador (Cheerio)
            const $ = cheerio.load(response.data);
            
            // Busca as reclamações (o Reclame Aqui agrupa os cards em links)
            $('a[href^="/"]').each((i, el) => {
                const textContent = $(el).text().trim().replace(/\s+/g, ' ');
                
                // Filtra apenas textos que pareçam reclamações não respondidas
                if(textContent.length > 30 && textContent.includes('Há') && !textContent.includes('Respondida')) {
                    const textLower = textContent.toLowerCase();
                    let type = "Reclamação Geral";
                    
                    // Nosso filtro de Inteligência
                    if (textLower.includes('cancelado') || textLower.includes('atraso') || textLower.includes('extravio') || textLower.includes('abusiva') || textLower.includes('venda casada') || textLower.includes('juros')) {
                        if (textLower.includes('atraso') || textLower.includes('cancelado')) type = "Atraso/Cancelamento Voo";
                        if (textLower.includes('mala') || textLower.includes('extravio')) type = "Bagagem Extraviada";
                        if (textLower.includes('cesta') || textLower.includes('juros')) type = "Taxa Abusiva Bancária";

                        let company = "Empresa";
                        if (target.includes('gol')) company = "GOL";
                        if (target.includes('latam')) company = "LATAM";
                        if (target.includes('nubank')) company = "Nubank";

                        leads.push({
                            post_id: `ra_scrapi_${target}_${Date.now()}_${i}`,
                            usuario: "Consumidor Oculto (RA)",
                            rede: "Reclame Aqui",
                            texto: textContent.substring(0, 200) + "...", // Pegamos o resumo
                            tipo: type,
                            alvo: company
                        });
                    }
                }
            });
        }
        console.log(`✅ Extração na nuvem concluída! ${leads.length} leads qualificados encontrados.`);
        return leads;
    } catch (error) {
        console.error("❌ Falha na comunicação com ScraperAPI:", error.message);
        return [];
    }
};

module.exports = { scrapeReclameAqui };
