
import requests
import json

url = "http://localhost:8000/register"
headers = {"Content-Type": "application/json"}
data = {
    "email": "teste@teste.com",
    "password": "password123",
    "full_name": "Usuario Teste"
}

try:
    response = requests.post(url, headers=headers, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200 or response.status_code == 201:
        print("User created successfully!")
    else:
        print("Failed to create user.")
except Exception as e:
    print(f"Error: {e}")
