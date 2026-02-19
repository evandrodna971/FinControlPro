import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

token = "vaojuu2uNboDzmhHXP6Sjg"
url = f"https://brapi.dev/api/quote/AAPL?token={token}"

try:
    with urllib.request.urlopen(url, context=ctx) as response:
        data = json.loads(response.read().decode())
        if 'results' in data and data['results']:
            res = data['results'][0]
            print(f"SYMBOL: {res.get('symbol')}")
            print(f"PRICE: {res.get('regularMarketPrice')}")
            print(f"CURRENCY: {res.get('currency')}")
            print(f"TIME: {res.get('regularMarketTime')}")
        else:
            print("No results found")
except Exception as e:
    print(f"Error: {e}")
