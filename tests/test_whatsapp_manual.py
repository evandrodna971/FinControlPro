import sys
import os
from unittest.mock import MagicMock

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from backend.services.whatsapp_agent import WhatsappAgent
from backend import models

def test_agent_logic():
    print("Iniciando teste do Agente WhatsApp...")

    # Mock DB and dependencies
    mock_db = MagicMock()
    mock_user = models.User(id=1, full_name="Test User", role="individual")
    workspace_id = 1
    
    agent = WhatsappAgent(mock_db, mock_user, workspace_id)

    # Test Cases
    test_cases = [
        ("Gastei 50 no Uber", "expense", 50.0, "Uber"),
        ("Almoço 45,90", "expense", 45.9, "Almoço"),
        ("Recebi 1500 de Pix", "income", 1500.0, "Pix"),
        ("Ganhei 50.00 aposta", "income", 50.0, "aposta"),
        ("Saldo", "balance", 0, ""),
        ("Abacaxi", "error", 0, "")
    ]

    for msg, expected_type, expected_amount, expected_desc_part in test_cases:
        print(f"\nTestando mensagem: '{msg}'")
        response = agent.process_message(msg)
        print(f"Resposta: {response}")
        
        if expected_type == "balance":
            if "Resumo" in response:
                print("✅ Passou (Sintaxe de Saldo)")
            else:
                print("❌ Falhou (Esperava Saldo)")
        elif expected_type == "error":
            if "Desculpe" in response:
                print("✅ Passou (Erro esperado)")
            else:
                print("❌ Falhou (Esperava mensagem de erro)")
        else:
            if expected_type == "expense":
                if "Despesa" in response and str(expected_amount) in response.replace(',', '.'):
                    print("✅ Passou (Despesa detectada)")
                else:
                    print(f"❌ Falhou. Resposta: {response}")
            elif expected_type == "income":
                if "Receita" in response and str(expected_amount) in response.replace(',', '.'):
                    print("✅ Passou (Receita detectada)")
                else:
                    print(f"❌ Falhou. Resposta: {response}")

if __name__ == "__main__":
    test_agent_logic()
