import re
import json
from datetime import datetime

class ClaimyHunter:
    def __init__(self):
        # Regras simplificadas da ANAC 400
        self.RULES = {
            "flight_delay_threshold_hours": 4,
            "indemnity_estimate_min": 3000,
            "indemnity_estimate_max": 10000
        }

    def analyze_email_content(self, email_body):
        """
        Simula a análise de IA sobre o corpo de um e-mail.
        Em produção, aqui entraría uma chamada ao Gemini/GPT-4.
        """
        print(f"\n[CLAIMY] Analisando novo e-mail...")

        # Padrões de busca (RegEx) para demonstração
        patterns = {
            "flight_number": r"(?:Voo|Flight|Vôo)\s*([A-Z0-9]{2,6})",
            "date": r"(\d{2}/\d{2}/\d{4})",
            "delay_notice": r"(atrasado|atraso|cancelado|delayed|cancelled|reacomodação)",
            "airline": r"(LATAM|GOL|AZUL|TAP|AIR FRANCE|EMIRATES)"
        }

        found_data = {}
        for key, pattern in patterns.items():
            match = re.search(pattern, email_body, re.IGNORECASE)
            if match:
                found_data[key] = match.group(1)

        if "delay_notice" in found_data and "flight_number" in found_data:
            return self.create_finding(found_data)
        
        return None

    def create_finding(self, data):
        """Transforma dados brutos em uma oportunidade de negócio."""
        finding = {
            "id": "fnd_778291",
            "category": "FLIGHT_DELAY",
            "company": data.get("airline", "Desconhecida"),
            "evidence_ref": data.get("flight_number"),
            "estimated_recovery": self.RULES["indemnity_estimate_min"], # Valor base
            "confidence_score": 0.92,
            "status": "DETECTED",
            "description": f"Potencial indenização por atraso/cancelamento no voo {data.get('flight_number')}."
        }
        return finding

# --- TESTE DO MOTOR ---

sample_email = """
Prezado passageiro, 
Informamos que o seu Voo LA8023 com destino a Paris no dia 22/03/2026 foi CANCELADO devido a problemas técnicos.
Sua reacomodação foi feita para o voo do dia seguinte. 
Pedimos desculpas pelo transtorno.
Atenciosamente, LATAM Airlines.
"""

hunter = ClaimyHunter()
result = hunter.analyze_email_content(sample_email)

if result:
    print("\n✅ MÁQUINA DE DINHEIRO ATIVADA!")
    print(json.dumps(result, indent=4, ensure_ascii=False))
    print(f"\n[AÇÃO]: Enviar notificação para o usuário: 'Jorge, encontramos R$ {result['estimated_recovery']} para você!'")
else:
    print("\n❌ Nenhum direito violado detectado neste e-mail.")
