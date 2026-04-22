# CLAIMY - Technical Implementation Plan

Este documento detalha a construção do motor de busca de indenizações e a infraestrutura da plataforma.

## 1. Arquitetura do Hunter Engine (O Cérebro)
O motor será dividido em 4 módulos principais:

### A. Módulo de Ingestão (Connectors)
*   **Email Sync:** Integração via OAuth2 (Google Cloud Console / Azure AD). Não armazenamos senhas, apenas tokens de acesso restritos a leitura.
*   **Bank Sync:** Uso de APIs de Open Finance (ex: Pluggy ou Belvo) para captura de extratos e tarifas.

### B. Módulo de Parsing (IA Analysis)
*   **Prompt Engineering:** Uso de LLMs (Gemini/GPT-4) para filtrar e-mails.
    *   *Filtro 1:* Identificar palavras-chave (Voo, Confirmação, Tarifa, Cobrança, Vazamento).
    *   *Filtro 2:* Extrair dados (Número do voo, Data, Valor da tarifa, Nome da empresa).

### C. Módulo de Jurisprudência (Rule Engine)
*   **Regras ANAC:** Checagem automática de atrasos > 4h via APIs de status de voos.
*   **Regras BACEN:** Identificação de tarifas proibidas em contas salário ou serviços essenciais.

### D. Módulo de Evidência (The Package)
*   Geração automática de um "Dossiê de Prova" em PDF contendo o e-mail original, o comprovante do erro e a fundamentação legal.

## 2. Stack Tecnológica Sugerida
*   **Backend:** Node.js (Fastify/Express) ou Python (FastAPI) - pela facilidade com IAs.
*   **Banco de Dados:** PostgreSQL (Dados estruturados) + Redis (Cache de varredura).
*   **Infraestrutura:** Vercel (Frontend) + AWS Lambda (Background jobs para varredura).

## 3. Roadmap de Desenvolvimento (MVP)

### Fase 1: Fundação (Semana 1-2)
*   Configuração do banco de dados e autenticação segura.
*   Criação da API de conexão com e-mail (OAuth2).

### Fase 2: O Caçador Aéreo (Semana 3)
*   Implementação do parser de e-mails de voo.
*   Integração com API de histórico de voos.

### Fase 3: O Caçador Bancário (Semana 4)
*   Conexão via Open Finance.
*   Identificação automática de tarifas indevidas.

### Fase 4: Portal da Advogada (Semana 5)
*   Interface para revisão e assinatura digital de documentos.

---

## 4. Segurança e Privacidade (Ponto Crítico)
Como lidamos com dados sensíveis, a CLAIMY deve seguir:
*   **LGPD:** Consentimento explícito para cada fonte de dados.
*   **Encryption:** Dados criptografados em repouso (AES-256).
*   **Auto-Delete:** Opção do usuário de deletar todos os dados e revogar tokens a qualquer momento.
