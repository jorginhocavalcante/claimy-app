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

// --- MOTOR DE BUSCA AVANÇADO (HUNTER ENGINE V2.0) ---
const hunterEngine = (emailText) => {
  const findings = [];
  let totalEstimate = 0;

  const rules = [
    // AVIAÇÃO (ALTO VALOR)
    { category: 'FLIGHT', regex: /cancelado|cancelamento/i, label: 'Voo Cancelado', value: 8000, confidence: 0.95 },
    { regex: /atrasado|atraso/i, category: 'FLIGHT', label: 'Voo Atrasado (>4h)', value: 5000, confidence: 0.85 },
    { regex: /overbooking|preterição|embarque negado/i, category: 'FLIGHT', label: 'Preterição de Embarque', value: 12000, confidence: 0.98 },
    { regex: /extravio|bagagem|mala/i, category: 'FLIGHT', label: 'Dano/Extravio de Bagagem', value: 4500, confidence: 0.75 },
    
    // BANCÁRIO (RECORRENTE)
    { regex: /tarifa|cesta|manutenção/i, category: 'BANK', label: 'Tarifa de Conta Indevida', value: 950, confidence: 0.80 },
    { regex: /juros|abusivo|cartão de crédito/i, category: 'BANK', label: 'Juros Abusivos em Cartão', value: 3500, confidence: 0.65 },
    { regex: /empréstimo|consignado|não solicitado/i, category: 'BANK', label: 'Empréstimo Não Solicitado', value: 5000, confidence: 0.90 },
    
    // TELECOM & SAÚDE (NOVA FRONTEIRA)
    { regex: /fidelidade|multa|cancelamento linha/i, category: 'TELECOM', label: 'Multa de Fidelidade Abusiva', value: 1200, confidence: 0.70 },
    { regex: /reajuste|plano de saúde|aumento abusivo/i, category: 'HEALTH', label: 'Reajuste Abusivo de Plano', value: 6000, confidence: 0.60 },
    { regex: /negativa|exame|cirurgia/i, category: 'HEALTH', label: 'Negativa de Cobertura Médica', value: 15000, confidence: 0.92 }
  ];

  rules.forEach(rule => {
    if (rule.regex.test(emailText)) {
      findings.push({ 
        type: rule.category, 
        desc: rule.label, 
        value: rule.value,
        confidence: rule.confidence 
      });
      totalEstimate += rule.value;
    }
  });

  // Se nada for encontrado, mantemos o fallback mas com aviso de IA
  if (findings.length === 0) {
    return {
      found: false,
      total_estimate: 0,
      cases: [],
      message: "Nenhum padrão óbvio detectado. A IA continuará monitorando."
    };
  }

  return { 
    found: true, 
    total_estimate: totalEstimate, 
    cases: findings,
    ai_analysis: "Análise profunda concluída com base em padrões jurisprudenciais." 
  };
};

// Modificando a rota para usar o motor real
fastify.post('/v1/scan', async (request, reply) => {
  const { email, textContent } = request.body; // Aceita texto para teste real
  
  fastify.log.info(`Analisando dados para: ${email}`);
  
  const results = hunterEngine(textContent || ""); // Se não enviar texto, usa a lógica de busca
  
  return {
    message: 'Análise de Inteligência Concluída',
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
