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
    `);
    console.log('🐘 Banco de Dados CLAIMY Inicializado e Pronto!');
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

// --- SOCIAL LISTENING (TWITTER & THREADS) ---
fastify.get('/v1/social-leads', async (request, reply) => {
  const nomes = ['@lucas_dev', '@mariana_silva', '@joao.pedro99', '@ana_clara', '@carlos_m'];
  const networks = ['Twitter', 'Threads'];
  const problemas = [
    { text: "Mais de 6 horas preso em Congonhas. Obrigado GOL por estragar minhas férias! 😡", type: "Voo Atrasado", target: "GOL" },
    { text: "Mala despachada pra Miami e chegou em Paris. Piada a LATAM.", type: "Bagagem Extraviada", target: "LATAM" },
    { text: "Alguém mais com cobrança 'Cesta de Serviços' no Nubank sem ter pedido nada?", type: "Cobrança Indevida", target: "Nubank" },
    { text: "Cancelei a internet da Claro faz 2 meses e meu nome foi pro Serasa por causa de multa de fidelidade falsa.", type: "Multa Indevida", target: "Claro" },
    { text: "Voo cancelado de última hora no Santos Dumont. Ninguém dá uma satisfação. Que descaso!", type: "Voo Cancelado", target: "Azul" }
  ];

  const generateLead = () => {
    const p = problemas[Math.floor(Math.random() * problemas.length)];
    const timeAgo = Math.floor(Math.random() * 15) + 1; // 1 a 15 min atrás
    return {
      usuario: nomes[Math.floor(Math.random() * nomes.length)],
      rede: networks[Math.floor(Math.random() * networks.length)],
      tempo: `Há ${timeAgo} min`,
      texto: p.text,
      tipo: p.type,
      alvo: p.target
    };
  };

  const numLeads = Math.floor(Math.random() * 4) + 2;
  const leads = [];
  for(let i=0; i<numLeads; i++) leads.push(generateLead());

  return { success: true, leads };
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
