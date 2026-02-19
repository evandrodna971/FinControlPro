import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def test_brapi(symbol="PETR4"):
    print(f"\n--- TESTING BRAPI ({symbol}) ---")
    token = "vaojuu2uNboDzmhHXP6Sjg"
    url = f"https://brapi.dev/api/quote/{symbol}?token={token}"
    try:
        with urllib.request.urlopen(url, context=ctx) as response:
            data = json.loads(response.read().decode())
            if 'results' in data and data['results']:
                res = data['results'][0]
                print(f"SUCCESS: {res.get('symbol')} - R$ {res.get('regularMarketPrice')}")
            else:
                print("FAILED: No results")
    except Exception as e:
        print(f"ERROR: {e}")

def test_coingecko(id="bitcoin"):
    print(f"\n--- TESTING COINGECKO ({id}) ---")
    url = f"https://api.coingecko.com/api/v3/simple/price?ids={id}&vs_currencies=usd,brl"
    try:
        with urllib.request.urlopen(url, context=ctx) as response:
            data = json.loads(response.read().decode())
            if id in data:
                print(f"SUCCESS: {id} - $ {data[id]['usd']} / R$ {data[id]['brl']}")
            else:
                print("FAILED: ID not found")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_brapi("PETR4")
    test_brapi("AAPL")
    test_coingecko("bitcoin")
    test_coingecko("ethereum")
