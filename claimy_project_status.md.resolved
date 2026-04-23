# Projeto CLAIMY - Status de Desenvolvimento

## 🎯 Objetivo
Plataforma legal-tech autônoma para identificação e recuperação de indenizações.

## 🏗️ Arquitetura Atual
- **Frontend:** HTML/CSS/JS hospedado na **Vercel** ([claimy-app.vercel.app](https://claimy-app.vercel.app)).
- **Backend:** Node.js/Fastify hospedado no **Render** ([claimy-app.onrender.com](https://claimy-app.onrender.com)).
- **Database:** PostgreSQL no **Render** (`claimy-db`).
- **Engine:** Hunter Engine V2.0 com suporte a RegEx avançado para Aviação, Bancos, Telecom e Saúde.

## ✅ Concluído Hoje
1.  **Deploy Full-Stack:** Integração completa entre Frontend, Backend e Banco de Dados.
2.  **Pattern Matching:** IA que analisa textos de e-mails e gera estimativas de valores e confiança.
3.  **Persistência:** Lógica de salvamento em banco de dados (`findings` table) implementada.
4.  **Branding:** Identidade visual "Justice in Autopilot" consolidada.

## 🚀 Próximos Passos (Pendentes)
1.  **OAuth2 Google:** Implementar conexão real com a API do Gmail.
2.  **Portal Jurídico:** Interface para visualização de casos e geração de PDF/Petição automática.
3.  **Dashboard Histórico:** Consumir a rota de listagem do banco de dados para exibir casos antigos.
4.  **Variável de Ambiente:** O usuário precisa inserir a `DATABASE_URL` no painel do Render (Environment) para ativar a persistência.

## 🗄️ Esquema do Banco (PostgreSQL)
- `users`: email (PK), name, created_at.
- `findings`: user_email, type, description, estimate_value, confidence, status.
- `claims`: finding_id, status (draft/filed/won), legal_fee_estimate.
