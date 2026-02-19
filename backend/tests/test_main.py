import pytest
from fastapi.testclient import TestClient
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from main import app
from database import Base, engine, get_db
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Setup test DB
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Create tables in test DB
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to FinControl Pro API", "status": "active"}

def test_register_user():
    # Helper to generate unique emails
    import random
    email = f"testuser{random.randint(1,10000)}@example.com"
    response = client.post(
        "/register",
        json={"email": email, "password": "password123", "full_name": "Test User"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == email
    assert "id" in data

def test_login_and_get_token():
    # Register first
    email = "login_test@example.com"
    client.post(
        "/register",
        json={"email": email, "password": "password123", "full_name": "Login Test"}
    )
    # Login
    response = client.post(
        "/token",
        data={"username": email, "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    return data["access_token"]

def test_create_transaction():
    token = test_login_and_get_token()
    headers = {"Authorization": f"Bearer {token}"}
    response = client.post(
        "/transactions/",
        json={
            "amount": 100.50,
            "description": "Groceries",
            "category": "Food",
            "type": "expense"
        },
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["amount"] == 100.50
    assert data["description"] == "Groceries"
