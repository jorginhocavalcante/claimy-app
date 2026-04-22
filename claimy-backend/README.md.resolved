# CLAIMY Backend - Guia de Operação

Este é o motor central da CLAIMY. Siga os passos abaixo para rodar o servidor localmente.

## 1. Pré-requisitos
*   **Node.js** instalado (Versão 18 ou superior).
*   **NPM** ou **Yarn**.

## 2. Instalação
No terminal, dentro da pasta `claimy-backend`, execute:
```bash
npm install
```

## 3. Configuração
Crie um arquivo chamado `.env` na raiz da pasta com as seguintes chaves (exemplo):
```env
PORT=3000
DATABASE_URL=postgres://usuario:senha@localhost:5432/claimy
SECRET_KEY=sua_chave_secreta_para_ia
```

## 4. Rodando o Servidor
Para desenvolvimento com auto-reload:
```bash
npm run dev
```

O servidor estará disponível em: `http://localhost:3000`

## 5. Endpoints Principais
*   `GET /status`: Verifica se a CLAIMY está online.
*   `POST /v1/scan`: Inicia a varredura (Requer JSON com `{ "email": "..." }`).
