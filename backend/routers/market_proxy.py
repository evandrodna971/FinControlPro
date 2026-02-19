import logging
import time
import httpx
import yfinance as yf
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import json

router = APIRouter()
logger = logging.getLogger(__name__)

# Yahoo Finance Autocomplete API
YAHOO_SEARCH_URL = "https://query2.finance.yahoo.com/v1/finance/search"

@router.get("/api/proxy/market/search")
async def search_assets(query: str):
    """
    Proxy for Yahoo Finance Autocomplete API.
    Used for searching US stocks and other international assets.
    """
    try:
        async with httpx.AsyncClient() as client:
            # Adding user-agent to avoid being blocked
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
            response = await client.get(
                YAHOO_SEARCH_URL, 
                params={"q": query, "lang": "en-US", "region": "US", "quotesCount": 10, "newsCount": 0},
                headers=headers
            )
            data = response.json()
            
            # Formata o retorno para ser consistente
            results = []
            if "quotes" in data:
                for quote in data["quotes"]:
                    # IsStockType or ETF or MutualFund
                    if quote.get("quoteType") in ["EQUITY", "ETF", "MUTUALFUND", "INDEX"]:
                        results.append({
                            "symbol": quote["symbol"],
                            "name": quote.get("shortname", quote.get("longname", quote["symbol"])),
                            "type": quote["quoteType"],
                            "exchDisp": quote.get("exchDisp", ""),
                            "market": "US"  # Marcador para o frontend saber a origem
                        })
            return results

    except Exception as e:
        logger.error(f"Error searching Yahoo: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/proxy/market/quote")
def get_quotes(symbols: str = Query(..., description="Comma separated list of symbols")):
    """
    Get current quotes for a list of symbols using yfinance.
    """
    try:
        symbol_list = symbols.split(',')
        # Fetch data
        # using Tickers is more efficient for multiple symbols
        tickers = yf.Tickers(" ".join(symbol_list))
        
        results = []
        for symbol in symbol_list:
            try:
                ticker = tickers.tickers[symbol]
                # fast_info is faster than info
                price = ticker.fast_info.last_price
                prev_close = ticker.fast_info.previous_close
                change = 0
                change_pct = 0
                
                if prev_close and price:
                    change = price - prev_close
                    change_pct = (change / prev_close) * 100
                
                results.append({
                    "symbol": symbol,
                    "price": price,
                    "change": change_pct,
                    "currency": ticker.fast_info.currency,
                    "market": "US"
                })
            except Exception as e:
                logger.warning(f"Error fetching quote for {symbol}: {e}")
                # Return null or verify if valid
                continue
                
        return results

    except Exception as e:
        logger.error(f"Error fetching quotes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/proxy/market/history")
def get_history(symbol: str, range: str = "3mo", interval: str = "1d"):
    """
    Get historical data for a symbol using yfinance.
    Mappings:
    Frontend Range -> Yahoo Range
    1D -> 1d (interval 15m or 5m)
    1M -> 1mo (interval 1d)
    3M -> 3mo (interval 1d)
    1Y -> 1y (interval 1d)
    5Y -> 5y
    """
    try:
        # Map frontend interval if needed
        yf_interval = interval
        yf_range = range
        
        # Adjust for intraday
        if range == '1d':
             yf_range = '1d'
             yf_interval = '15m'
        elif range == '5d':
            yf_interval = '15m'
            
        ticker = yf.Ticker(symbol)
        history = ticker.history(period=yf_range, interval=yf_interval)
        
        # Format for frontend: [{date: 'ISO/String', value: 100.0}]
        data = []
        for index, row in history.iterrows():
            # Date index is Timestamp
            date_str = index.isoformat()
            data.append({
                "date": date_str,
                "value": row["Close"]
            })
            
        return data

    except Exception as e:
        logger.error(f"Error fetching history for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== COINGECKO PROXY ====================
# Proxy para evitar rate limit e CORS ao buscar cotações de criptomoedas diretamente do browser

COINGECKO_BASE = "https://api.coingecko.com/api/v3"

# Cache in-memory para cotações de cripto (igual ao padrão do brapi_proxy)
# Key: ids_param (string de IDs separados por vírgula)
# Value: {timestamp: float, data: dict}
CRYPTO_CACHE: dict = {}
CRYPTO_CACHE_TTL = 300  # 5 minutos — suficiente para não sobrecarregar a API

# Mapeamento de símbolo/nome para CoinGecko ID
CRYPTO_ID_MAP = {
    'btc': 'bitcoin', 'bitcoin': 'bitcoin',
    'eth': 'ethereum', 'ethereum': 'ethereum',
    'bnb': 'binancecoin', 'binancecoin': 'binancecoin',
    'sol': 'solana', 'solana': 'solana',
    'xrp': 'ripple', 'ripple': 'ripple',
    'doge': 'dogecoin', 'dogecoin': 'dogecoin',
    'ada': 'cardano', 'cardano': 'cardano',
    'avax': 'avalanche-2', 'avalanche': 'avalanche-2',
    'dot': 'polkadot', 'polkadot': 'polkadot',
    'matic': 'matic-network', 'polygon': 'matic-network',
    'link': 'chainlink', 'chainlink': 'chainlink',
    'ltc': 'litecoin', 'litecoin': 'litecoin',
    'uni': 'uniswap', 'uniswap': 'uniswap',
    'atom': 'cosmos', 'cosmos': 'cosmos',
}

@router.get("/api/proxy/market/crypto")
async def get_crypto_quotes(symbols: str = Query(..., description="Comma separated list of crypto symbols (e.g. BTC,ETH,SOL)")):
    """
    Proxy para CoinGecko Simple Price API com cache in-memory (TTL 5 min).
    Converte símbolos (BTC, ETH, etc.) para IDs do CoinGecko e retorna cotações em USD e BRL.
    """
    try:
        symbol_list = [s.strip().lower() for s in symbols.split(',')]
        
        # Mapeia símbolo -> CoinGecko ID
        entries = []
        for sym in symbol_list:
            cg_id = CRYPTO_ID_MAP.get(sym, sym)  # fallback: usa o próprio símbolo como ID
            entries.append({"original": sym, "id": cg_id})
        
        unique_ids = sorted(set(e["id"] for e in entries))  # sorted para cache key consistente
        ids_param = ",".join(unique_ids)
        
        now = time.time()
        
        # 1. Verifica cache
        if ids_param in CRYPTO_CACHE:
            cached = CRYPTO_CACHE[ids_param]
            if now - cached["timestamp"] < CRYPTO_CACHE_TTL:
                logger.info(f"CRYPTO CACHE HIT: {ids_param}")
                data = cached["data"]
            else:
                # Cache expirado — busca novamente
                data = None
        else:
            data = None
        
        # 2. Cache miss ou expirado — busca na CoinGecko
        if data is None:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{COINGECKO_BASE}/simple/price",
                    params={
                        "ids": ids_param,
                        "vs_currencies": "usd,brl",
                        "include_24hr_change": "true"
                    },
                    headers={"User-Agent": "FinControlPro/1.0"}
                )
                
                if response.status_code == 429:
                    # Rate limit — retorna cache expirado se disponível, senão erro
                    if ids_param in CRYPTO_CACHE:
                        logger.warning("CoinGecko rate limited — serving stale cache")
                        data = CRYPTO_CACHE[ids_param]["data"]
                    else:
                        logger.warning("CoinGecko rate limited and no cache available")
                        raise HTTPException(status_code=429, detail="CoinGecko rate limit exceeded")
                elif response.status_code != 200:
                    logger.warning(f"CoinGecko returned {response.status_code}")
                    raise HTTPException(status_code=response.status_code, detail="CoinGecko API error")
                else:
                    data = response.json()
                    # Armazena no cache
                    CRYPTO_CACHE[ids_param] = {"timestamp": now, "data": data}
                    logger.info(f"CRYPTO CACHE STORE: {ids_param}")
        
        # 3. Monta resultado
        results = []
        for entry in entries:
            sym = entry["original"]
            cg_id = entry["id"]
            coin_data = data.get(cg_id, {})
            
            if not coin_data:
                logger.warning(f"No data for {sym} (id: {cg_id})")
                continue
            
            results.append({
                "symbol": sym.upper(),
                "id": cg_id,
                "price_usd": coin_data.get("usd", 0),
                "price_brl": coin_data.get("brl", 0),
                "change_24h": coin_data.get("usd_24h_change", 0),
            })
        
        return results

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching crypto quotes: {e}")
        raise HTTPException(status_code=500, detail=str(e))
