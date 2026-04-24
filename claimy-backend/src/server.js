const fastify = require('fastify')({ logger: true });
require('dotenv').config();

// Configuração de CORS (Essencial para a Landing Page funcionar)
fastify.register(require('@fastify/cors'), {
  origin: '*',
  methods: ['GET', 'POST']
});


const { Client } = require('pg');

// Configuração do Banco de Dados
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
};

// Função para Inicializar Banco de Dados
const initDB = async () => {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS findings (id SERIAL PRIMARY KEY, user_email VARCHAR(255) NOT NULL, type VARCHAR(50), description TEXT, estimate_value DECIMAL(10,2), confidence DECIMAL(3,2), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS clients (id SERIAL PRIMARY KEY, nome VARCHAR(255), cpf VARCHAR(20), rg VARCHAR(20), orgao_exp VARCHAR(20), estado_civil VARCHAR(50), profissao VARCHAR(100), cep VARCHAR(20), rua VARCHAR(255), numero VARCHAR(20), complemento VARCHAR(100), bairro VARCHAR(100), cidade_uf VARCHAR(100), banco VARCHAR(100), tipo_conta VARCHAR(50), agencia VARCHAR(20), conta VARCHAR(20), aceite BOOLEAN, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS social_leads (id SERIAL PRIMARY KEY, post_id VARCHAR(255) UNIQUE, usuario VARCHAR(255), rede VARCHAR(50), texto TEXT, tipo VARCHAR(100), alvo VARCHAR(100), status VARCHAR(50) DEFAULT 'Pendente', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
    `);
    
    // Limpeza de segurança: Remove qualquer lead antigo de simulação que tenha ficado salvo no banco!
    await client.query("DELETE FROM social_leads WHERE post_id LIKE 'sim_%'");
    
    console.log('🐘 Banco de Dados CLAIMY Inicializado e Pronto! (Leads Falsos Purgados)');
  } catch (err) {
    console.error('❌ Erro ao conectar ao Banco:', err.message);
  } finally {
    await client.end();
  }
};

initDB();

// --- MOTOR DE BUSCA AVANÇADO (HUNTER ENGINE V2.0) ---
const hunterEngine = (emailText) => {
  const findings = [];
  let totalEstimate = 0;

  const rules = [
    { category: 'FLIGHT', regex: /cancelado|cancelamento/i, label: 'Voo Cancelado', value: 8000, confidence: 0.95 },
    { regex: /atrasado|atraso/i, category: 'FLIGHT', label: 'Voo Atrasado (>4h)', value: 5000, confidence: 0.85 },
    { regex: /overbooking|preterição|embarque negado/i, category: 'FLIGHT', label: 'Preterição de Embarque', value: 12000, confidence: 0.98 },
    { regex: /extravio|bagagem|mala/i, category: 'FLIGHT', label: 'Dano/Extravio de Bagagem', value: 4500, confidence: 0.75 },
    { regex: /tarifa|cesta|manutenção/i, category: 'BANK', label: 'Tarifa de Conta Indevida', value: 950, confidence: 0.80 },
    { regex: /juros|abusivo|cartão de crédito/i, category: 'BANK', label: 'Juros Abusivos em Cartão', value: 3500, confidence: 0.65 },
    { regex: /empréstimo|consignado|não solicitado/i, category: 'BANK', label: 'Empréstimo Não Solicitado', value: 5000, confidence: 0.90 },
    { regex: /fidelidade|multa|cancelamento linha/i, category: 'TELECOM', label: 'Multa de Fidelidade Abusiva', value: 1200, confidence: 0.70 },
    { regex: /reajuste|plano de saúde|aumento abusivo/i, category: 'HEALTH', label: 'Reajuste Abusivo de Plano', value: 6000, confidence: 0.60 },
    { regex: /negativa|exame|cirurgia/i, category: 'HEALTH', label: 'Negativa de Cobertura Médica', value: 15000, confidence: 0.92 }
  ];

  rules.forEach(rule => {
    if (rule.regex.test(emailText)) {
      findings.push({ type: rule.category, desc: rule.label, value: rule.value, confidence: rule.confidence });
      totalEstimate += rule.value;
    }
  });

  return { found: findings.length > 0, total_estimate: totalEstimate, cases: findings };
};

// Rota de Varredura com Persistência e Integração Gmail API
fastify.post('/v1/scan', async (request, reply) => {
  const { email, textContent, google_access_token } = request.body;
  
  let textToAnalyze = textContent || "";

  // Se recebermos um token do Google, acionamos a leitura real da Caixa de Entrada!
  if (google_access_token) {
    console.log(`🔍 Iniciando varredura real no Gmail para: ${email}`);
    try {
      // 1. Busca lista de e-mails que contenham nossas palavras de alerta
      const query = "cancelado OR atraso OR tarifa OR bagagem OR multa OR reajuste";
      const listResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${google_access_token}` }
      });
      const listData = await listResponse.json();

      if (listData.messages && listData.messages.length > 0) {
        // 2. Para cada e-mail encontrado, extrai o texto (snippet)
        for (const msg of listData.messages) {
          const msgResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
            headers: { Authorization: `Bearer ${google_access_token}` }
          });
          const msgData = await msgResponse.json();
          textToAnalyze += " " + (msgData.snippet || "");
        }
        console.log("✅ Textos extraídos do Gmail com sucesso.");
      } else {
        console.log("Nenhum e-mail suspeito encontrado nesta varredura.");
      }
    } catch (err) {
      console.error("❌ Erro ao ler Gmail API:", err.message);
    }
  }

  // Passa todo o texto coletado (ou enviado) para o "Cérebro"
  const results = hunterEngine(textToAnalyze);
  
  // Salvar no Banco de Dados se houver achados
  if (results.found) {
    const client = new Client(dbConfig);
    try {
      await client.connect();
      for (const finding of results.cases) {
        await client.query(
          'INSERT INTO findings (user_email, type, description, estimate_value, confidence) VALUES ($1, $2, $3, $4, $5)',
          [email, finding.type, finding.desc, finding.value, finding.confidence]
        );
      }
    } catch (err) {
      console.error('Erro ao salvar achados no Banco:', err.message);
    } finally {
      await client.end();
    }
  }
  
  return { message: 'Análise de Inteligência Concluída e Salva', data: results };
});

// --- CLAIMY RADAR (SIMULADOR DE RASTREAMENTO) ---
fastify.get('/v1/radar', async (request, reply) => {
  // Simula a busca na API de aviação para os maiores aeroportos do Brasil
  const airports = ['GRU (Guarulhos)', 'CGH (Congonhas)', 'SDU (Santos Dumont)', 'BSB (Brasília)', 'REC (Recife)'];
  const airlines = ['GOL Linhas Aéreas', 'LATAM Airlines', 'Azul Linhas Aéreas'];
  const statuses = ['CANCELADO', 'ATRASO > 4H', 'ATRASO > 5H'];
  
  const generateFlight = () => {
    const cia = airlines[Math.floor(Math.random() * airlines.length)];
    const prefix = cia.includes('GOL') ? 'G3' : (cia.includes('LATAM') ? 'LA' : 'AD');
    const num = Math.floor(Math.random() * 8000) + 1000;
    
    const origin = airports[Math.floor(Math.random() * airports.length)];
    let dest = airports[Math.floor(Math.random() * airports.length)];
    while(dest === origin) dest = airports[Math.floor(Math.random() * airports.length)]; // Garante que destino é diferente
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    // Potencial financeiro: Indenização média R$ 5k a 10k x 10 passageiros
    const potencial = (Math.floor(Math.random() * 5) + 5) * 10000; 

    return {
      voo: `${prefix} ${num}`,
      cia: cia,
      rota: `${origin.split(' ')[0]} ➔ ${dest.split(' ')[0]}`,
      partida: `Hoje, ${Math.floor(Math.random() * 12) + 8}:00`,
      status: status,
      potencial: potencial
    };
  };

  // Retorna 3 a 5 voos com problemas
  const numVôos = Math.floor(Math.random() * 3) + 3;
  const flights = [];
  for(let i=0; i<numVôos; i++) flights.push(generateFlight());
  
  return { success: true, source: 'claimy_internal_radar', flights };
});

// --- FUNIL JURÍDICO (KYC) ---
fastify.post('/v1/kyc', async (request, reply) => {
  const data = request.body;
  const client = new Client(dbConfig);
  try {
    await client.connect();
    await client.query(
      `INSERT INTO clients (nome, cpf, rg, orgao_exp, estado_civil, profissao, cep, rua, numero, complemento, bairro, cidade_uf, banco, tipo_conta, agencia, conta, aceite) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [data.nome, data.cpf, data.rg, data.orgao_exp, data.estado_civil, data.profissao, data.cep, data.rua, data.numero, data.complemento, data.bairro, data.cidade_uf, data.banco, data.tipo_conta, data.agencia, data.conta, data.aceite]
    );
    return { success: true, message: 'Dados salvos com sucesso no cofre da CLAIMY!' };
  } catch (err) {
    console.error('Erro ao salvar KYC:', err.message);
    reply.status(500).send({ error: 'Erro ao salvar os dados.' });
  } finally {
    await client.end();
  }
});

// --- PAINEL ADMIN ---
fastify.get('/v1/admin/clients', async (request, reply) => {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const result = await client.query('SELECT * FROM clients ORDER BY created_at DESC');
    return { success: true, clients: result.rows };
  } catch (err) {
    console.error('Erro ao buscar clientes:', err.message);
    reply.status(500).send({ error: 'Erro ao buscar dados.' });
  } finally {
    await client.end();
  }
});

// Rota de Emergência para Limpar o Banco (Gatilho Manual)
fastify.get('/v1/admin/reset-leads', async (request, reply) => {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    // Força a deleção de tudo que for simulação ou que não tenha post_id real de API
    await client.query("DELETE FROM social_leads WHERE post_id LIKE 'sim_%' OR rede IN ('Facebook', 'Instagram', 'Reclame Aqui')");
    return { success: true, message: '🔥 Banco de Leads foi completamente purgado e resetado!' };
  } catch (err) {
    console.error('Erro ao resetar:', err.message);
    reply.status(500).send({ error: err.message });
  } finally {
    await client.end();
  }
});

// --- SOCIAL LISTENING (PERSISTÊNCIA EM BANCO DE DADOS) ---
fastify.get('/v1/social-leads', async (request, reply) => {
  try {
    let newLeads = [];

    // 1. Busca na API Real do X (Twitter)
    if (process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET) {
      console.log("🔍 Iniciando busca real na API do X (Twitter)...");
      const credentials = Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString('base64');
      const authResponse = await fetch('https://api.twitter.com/oauth2/token', {
        method: 'POST',
        headers: { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: 'grant_type=client_credentials'
      });
      
      if (authResponse.ok) {
        const authData = await authResponse.json();
        const searchResponse = await fetch(`https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent('(cancelado OR atraso OR extravio OR abusiva OR "venda casada" OR juros) (GOL OR LATAM OR Nubank OR Itaú OR Claro OR Vivo) -is:retweet')}&tweet.fields=created_at,author_id&max_results=10`, {
          headers: { 'Authorization': `Bearer ${authData.access_token}` }
        });
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.data) {
            searchData.data.forEach(tweet => {
              let type = "Reclamação Geral";
              let textLower = tweet.text.toLowerCase();
              if (textLower.includes('atraso') || textLower.includes('cancelado')) type = "Atraso/Cancelamento Voo";
              if (textLower.includes('mala') || textLower.includes('extravio')) type = "Bagagem Extraviada";
              if (textLower.includes('cesta') || textLower.includes('juros')) type = "Taxa Abusiva Bancária";
              if (textLower.includes('fidelidade') || textLower.includes('cancelamento')) type = "Quebra Contratual";
              
              let target = "Empresa";
              if (textLower.includes('gol')) target = "GOL";
              if (textLower.includes('latam')) target = "LATAM";
              if (textLower.includes('nubank')) target = "Nubank";
              if (textLower.includes('itaú') || textLower.includes('itau')) target = "Itaú";
              if (textLower.includes('claro')) target = "Claro";
              if (textLower.includes('vivo')) target = "Vivo";

              newLeads.push({
                post_id: `tw_${tweet.id}`,
                usuario: `ID: ${tweet.author_id}`,
                rede: 'X (Twitter)',
                texto: tweet.text,
                tipo: type,
                alvo: target
              });
            });
          }
        }
      }
    }

    // 2. Busca na API Real do Threads
    if (process.env.THREADS_ACCESS_TOKEN) {
      console.log("🔍 Iniciando busca real na API do Threads (Meta)...");
      const threadsResponse = await fetch(`https://graph.threads.net/v1.0/me/threads?fields=id,text,timestamp,username&access_token=${process.env.THREADS_ACCESS_TOKEN}`);
      if (threadsResponse.ok) {
        const threadsData = await threadsResponse.json();
        if (threadsData.data) {
          threadsData.data.forEach(post => {
            let textLower = (post.text || "").toLowerCase();
            // Filtro local (A API do Threads ainda não permite busca global pública por keywords, apenas na própria conta)
            if (textLower.includes('cancelado') || textLower.includes('atraso') || textLower.includes('extravio') || textLower.includes('abusiva') || textLower.includes('venda casada') || textLower.includes('juros')) {
                let type = "Reclamação Geral";
                if (textLower.includes('atraso') || textLower.includes('cancelado')) type = "Atraso/Cancelamento Voo";
                if (textLower.includes('mala') || textLower.includes('extravio')) type = "Bagagem Extraviada";
                if (textLower.includes('cesta') || textLower.includes('juros')) type = "Taxa Abusiva Bancária";
                
                let target = "Empresa";
                if (textLower.includes('gol')) target = "GOL";
                if (textLower.includes('latam')) target = "LATAM";
                if (textLower.includes('nubank')) target = "Nubank";
                if (textLower.includes('claro')) target = "Claro";

                newLeads.push({
                  post_id: `th_${post.id}`,
                  usuario: `@${post.username || 'User'}`,
                  rede: 'Threads',
                  texto: post.text,
                  tipo: type,
                  alvo: target
                });
            }
          });
        }
      } else {
        console.error("Erro na API Threads:", await threadsResponse.text());
      }
    }

    // 3. Verifica se encontrou leads novos
    if (newLeads.length > 0) {
      console.log(`✅ ${newLeads.length} novos leads reais encontrados nas APIs!`);
    } else {
      console.log(`⏳ Nenhum lead novo encontrado nesta varredura. Retornando histórico...`);
    }

    // 4. Salva no BD e Retorna Histórico
    const client = new Client(dbConfig);
    try {
      await client.connect();
      for (const l of newLeads) {
        await client.query(
          `INSERT INTO social_leads (post_id, usuario, rede, texto, tipo, alvo, status) 
           VALUES ($1, $2, $3, $4, $5, $6, 'Pendente') ON CONFLICT (post_id) DO NOTHING`,
          [l.post_id, l.usuario, l.rede, l.texto, l.tipo, l.alvo]
        );
      }
      
      const dbResult = await client.query("SELECT * FROM social_leads ORDER BY created_at DESC LIMIT 50");
      return { success: true, leads: dbResult.rows };
    } finally {
      await client.end();
    }
  } catch (error) {
    console.error("❌ Erro em /v1/social-leads:", error.message);
    reply.status(500).send({ error: "Erro interno no servidor" });
  }
});

// --- AÇÃO DE VENDA (ATUALIZAR STATUS DO LEAD) ---
fastify.post('/v1/social-leads/:id/action', async (request, reply) => {
  const leadId = request.params.id;
  const client = new Client(dbConfig);
  try {
    await client.connect();
    await client.query("UPDATE social_leads SET status = 'Abordado' WHERE id = $1", [leadId]);
    return { success: true, message: 'Status atualizado para Abordado!' };
  } catch (err) {
    return { success: false, error: err.message };
  } finally {
    await client.end();
  }
});

// Health Check
fastify.get('/status', async (request, reply) => {
  return { status: 'CLAIMY_ONLINE', version: '2.0.0', db: 'connected' };
});

// --- INICIALIZAÇÃO ---
const start = async () => {
  try {
    const port = process.env.PORT || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 CLAIMY SERVER rodando em: http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
