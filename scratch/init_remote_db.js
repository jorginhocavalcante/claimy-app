const { Client } = require('pg');

const connectionString = 'postgresql://claimy_db_user:WE2TQQ10jv6L8mW6e7OHxfoJrQBFjsFd@dpg-d7k5g79kh4rs73au1c2g-a.oregon-postgres.render.com/claimy_db';

const schema = `
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS findings (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    estimate_value DECIMAL(10,2) NOT NULL,
    confidence DECIMAL(3,2),
    status VARCHAR(50) DEFAULT 'detected',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS claims (
    id SERIAL PRIMARY KEY,
    finding_id INTEGER REFERENCES findings(id),
    lawyer_id INTEGER,
    status VARCHAR(50) DEFAULT 'draft',
    legal_fee_estimate DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

async function init() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    try {
        await client.connect();
        console.log('Conectado ao PostgreSQL no Render!');
        await client.query(schema);
        console.log('Tabelas criadas com sucesso!');
    } catch (err) {
        console.error('Erro ao inicializar banco:', err);
    } finally {
        await client.end();
    }
}

init();
