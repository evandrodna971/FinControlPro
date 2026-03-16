import os
import sys

# Adapts Python Path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from backend import schemas

def run_tests():
    try:
        user = schemas.UserCreate(email="test@test.com", password="123")
        print("FAIL: Permitiu senha fraca")
    except Exception as e:
        print("PASS: Bloqueou senha fraca. Erro gerado:")
        print(e)
        
run_tests()
