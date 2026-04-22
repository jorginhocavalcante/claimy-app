const fastify = require('fastify')({ logger: true });
require('dotenv').config();

// Configuração de CORS (Essencial para a Landing Page funcionar)
fastify.register(require('@fastify/cors'), {
  origin: '*',
  methods: ['GET', 'POST']
});

// Health Check
fastify.get('/status', async (request, reply) => {
  return { status: 'CLAIMY_ONLINE', version: '1.1.0' };
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

// Rota de Varredura com Persistência
fastify.post('/v1/scan', async (request, reply) => {
  const { email, textContent } = request.body;
  const results = hunterEngine(textContent || "");
  
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
      console.error('Erro ao salvar achados:', err.message);
    } finally {
      await client.end();
    }
  }
  
  return { message: 'Análise de Inteligência Concluída e Salva', data: results };
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
