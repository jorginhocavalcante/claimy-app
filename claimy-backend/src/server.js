const fastify = require('fastify')({ logger: true });
require('dotenv').config();

// Configuração de CORS (Essencial para a Landing Page funcionar)
fastify.register(require('@fastify/cors'), {
  origin: '*',
  methods: ['GET', 'POST']
});

// Mock da Lógica do Hunter Engine
const hunterLogic = async (email) => {
  // Aqui simulamos a varredura que leva alguns segundos
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        found: true,
        total_estimate: 14250.00,
        cases: [
          { type: 'FLIGHT', desc: 'Voo LATAM Atrasado', value: 6500.00 },
          { type: 'BANK', desc: 'Tarifa Indevida Itaú', value: 1240.00 },
          { type: 'LGPD', desc: 'Vazamento E-commerce', value: 3000.00 }
        ]
      });
    }, 2000);
  });
};

// --- ROTAS ---

// Health Check
fastify.get('/status', async (request, reply) => {
  return { status: 'CLAIMY_ONLINE', version: '1.0.0' };
});

// Iniciar Varredura
fastify.post('/v1/scan', async (request, reply) => {
  const { email } = request.body;
  
  fastify.log.info(`Iniciando varredura para: ${email}`);
  
  const results = await hunterLogic(email);
  
  return {
    message: 'Scan concluído com sucesso',
    data: results
  };
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
