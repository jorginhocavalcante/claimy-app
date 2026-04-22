# CLAIMY - Database Schema (V1.0)

Este esquema define como os dados serão estruturados para suportar a busca automática e a gestão jurídica.

```mermaid
erDiagram
    USER ||--o{ CONNECTION : "possui"
    USER ||--o{ FINDING : "gera"
    CONNECTION ||--o{ SCAN_LOG : "registra"
    FINDING ||--o| CLAIM : "transforma_em"
    CLAIM ||--o{ EVIDENCE : "contem"
    CLAIM }|--|| LAWYER : "assinada_por"

    USER {
        uuid id PK
        string name
        string email UK
        string pix_key
        string subscription_plan "FREE | VIP"
        datetime created_at
    }

    CONNECTION {
        uuid id PK
        uuid user_id FK
        string type "GMAIL | OUTLOOK | BANK"
        string access_token
        string refresh_token
        datetime expires_at
        string status "ACTIVE | EXPIRED"
    }

    FINDING {
        uuid id PK
        uuid user_id FK
        string category "FLIGHT | BANK | LGPD"
        json raw_data "Dados brutos do erro"
        decimal estimated_value
        string status "PENDING | APPROVED | DISCARDED"
        datetime detected_at
    }

    CLAIM {
        uuid id PK
        uuid finding_id FK
        uuid lawyer_id FK
        string legal_protocol "Número do processo"
        string status "DRAFT | FILED | WON | LOST"
        decimal final_value
        datetime updated_at
    }

    EVIDENCE {
        uuid id PK
        uuid claim_id FK
        string file_path
        string file_type "EMAIL_PDF | BANK_STMT | SCREENSHOT"
    }

    LAWYER {
        uuid id PK
        string name
        string oab_number
        decimal commission_rate "Padrão 30%"
    }
```

## Pontos Chave da Modelagem:
1.  **Separação entre Finding e Claim:** Nem todo erro detectado vira um processo. O usuário (ou você) aprova o `Finding` para ele virar uma `Claim`.
2.  **Criptografia:** Os campos `access_token` e `refresh_token` devem ser criptografados em nível de banco de dados (Vault).
3.  **JSON B:** O campo `raw_data` no `Finding` permite armazenar metadados flexíveis (ex: número do voo para ANAC ou nome do vazamento para LGPD).
