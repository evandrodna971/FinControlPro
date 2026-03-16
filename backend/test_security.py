import os
import sys
from fastapi.testclient import TestClient

# Adapts Python Path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from backend.main import app
from backend.database import Base, engine, SessionLocal

# Recreate tables for testing
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def run_tests():
    print("----- TESTANDO POLICY DE SENHA -----")
    # Testa submeter senha curta
    response = client.post("/register", json={
        "email": "testeseguranca@test.com",
        "password": "123",
        "full_name": "Teste Seguranca"
    })
    
    if response.status_code == 422:
        print("[PASS] Bloqueou criação de conta com senha curta.")
    else:
        print(f"[FAIL] Resposta diferente da esperada (422): {response.status_code}")
        print(response.json())

    print("\n----- TESTANDO RATE LIMIT E ENUMERATION -----")
    # Testa 5 tentativas de recuperar de senha
    for i in range(5):
        res = client.post("/forgot-password", json={"email": "naoexiste@test.com"})
        
        if i < 3:
            if res.status_code == 200:
                print(f"[{i+1}/3] [PASS] Retornou 200 para e-mail falso. Evitando enumeration.")
            else:
                print(f"[{i+1}/3] [FAIL] Código incorreto na enumeracao: {res.status_code}. Resposta: {res.text}")
        else:
            if res.status_code == 429:
                print(f"[{i+1}/5] [PASS] SlowAPI detectou e bloqueou Rate Limit (429 Too Many Requests).")
            else:
                 print(f"[{i+1}/5] [FAIL] Nao bloqueou por rate limit: {res.status_code}. Resposta: {res.text}")


if __name__ == "__main__":
    run_tests()
