import logging
import time
import httpx
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import json

router = APIRouter()
logger = logging.getLogger(__name__)

# Yahoo Finance APIs (direct, no yfinance dependency)
YAHOO_SEARCH_URL = "https://query2.finance.yahoo.com/v1/finance/search"
YAHOO_QUOTE_URL = "https://query1.finance.yahoo.com/v7/finance/quote"
YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart"

YAHOO_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

# Cache for Yahoo quotes
QUOTE_CACHE: dict = {}
QUOTE_CACHE_TTL = 120  # 2 minutes


@router.get("/api/proxy/market/search")
async def search_assets(query: str):
    """
    Proxy for Yahoo Finance Autocomplete API.
    Used for searching US stocks and other international assets.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                YAHOO_SEARCH_URL, 
                params={"q": query, "lang": "en-US", "region": "US", "quotesCount": 10, "newsCount": 0},
                headers=YAHOO_HEADERS
            )
            data = response.json()
            
            results = []
            if "quotes" in data:
                for quote in data["quotes"]:
                    if quote.get("quoteType") in ["EQUITY", "ETF", "MUTUALFUND", "INDEX"]:
                        results.append({
                            "symbol": quote["symbol"],
                            "name": quote.get("shortname", quote.get("longname", quote["symbol"])),
                            "type": quote["quoteType"],
                            "exchDisp": quote.get("exchDisp", ""),
                            "market": "US"
                        })
            return results

    except Exception as e:
        logger.error(f"Error searching Yahoo: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/proxy/market/quote")
async def get_quotes(symbols: str = Query(..., description="Comma separated list of symbols")):
    """
    Get current quotes for a list of symbols using Yahoo Finance API directly.
    """
    try:
        symbol_list = [s.strip() for s in symbols.split(',') if s.strip()]
        symbols_key = ",".join(sorted(symbol_list))
        
        now = time.time()
        
        # Check cache
        if symbols_key in QUOTE_CACHE:
            cached = QUOTE_CACHE[symbols_key]
            if now - cached["timestamp"] < QUOTE_CACHE_TTL:
                return cached["data"]
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                YAHOO_QUOTE_URL,
                params={"symbols": ",".join(symbol_list)},
                headers=YAHOO_HEADERS
            )
            
            data = response.json()
            quotes = data.get("quoteResponse", {}).get("result", [])
            
            results = []
            for q in quotes:
                price = q.get("regularMarketPrice", 0)
                prev_close = q.get("regularMarketPreviousClose", 0)
                change_pct = 0
                if prev_close and price:
                    change_pct = ((price - prev_close) / prev_close) * 100
                
                results.append({
                    "symbol": q.get("symbol", ""),
                    "price": price,
                    "change": change_pct,
                    "currency": q.get("currency", "USD"),
                    "market": "US"
                })
            
            # Store in cache
            QUOTE_CACHE[symbols_key] = {"timestamp": now, "data": results}
            
            return results

    except Exception as e:
        logger.error(f"Error fetching quotes: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/proxy/market/history")
async def get_history(symbol: str, range: str = "3mo", interval: str = "1d"):
    """
    Get historical data for a symbol using Yahoo Finance Chart API directly.
    """
    try:
        yf_interval = interval
        yf_range = range
        
        if range == '1d':
            yf_range = '1d'
            yf_interval = '15m'
        elif range == '5d':
            yf_interval = '15m'
            
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{YAHOO_CHART_URL}/{symbol}",
                params={"range": yf_range, "interval": yf_interval, "includePrePost": "false"},
                headers=YAHOO_HEADERS
            )
            
            chart_data = response.json()
            result = chart_data.get("chart", {}).get("result", [])
            
            if not result:
                return []
            
            timestamps = result[0].get("timestamp", [])
            closes = result[0].get("indicators", {}).get("quote", [{}])[0].get("close", [])
            
            data = []
            for i, ts in enumerate(timestamps):
                if i < len(closes) and closes[i] is not None:
                    from datetime import datetime
                    date_str = datetime.fromtimestamp(ts).isoformat()
                    data.append({
                        "date": date_str,
                        "value": closes[i]
                    })
            
            return data

    except Exception as e:
        logger.error(f"Error fetching history for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== COINGECKO PROXY ====================
COINGECKO_BASE = "https://api.coingecko.com/api/v3"

CRYPTO_CACHE: dict = {}
CRYPTO_CACHE_TTL = 300  # 5 minutes

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
    """
    try:
        symbol_list = [s.strip().lower() for s in symbols.split(',')]
        
        entries = []
        for sym in symbol_list:
            cg_id = CRYPTO_ID_MAP.get(sym, sym)
            entries.append({"original": sym, "id": cg_id})
        
        unique_ids = sorted(set(e["id"] for e in entries))
        ids_param = ",".join(unique_ids)
        
        now = time.time()
        
        if ids_param in CRYPTO_CACHE:
            cached = CRYPTO_CACHE[ids_param]
            if now - cached["timestamp"] < CRYPTO_CACHE_TTL:
                logger.info(f"CRYPTO CACHE HIT: {ids_param}")
                data = cached["data"]
            else:
                data = None
        else:
            data = None
        
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
                    if ids_param in CRYPTO_CACHE:
                        logger.warning("CoinGecko rate limited — serving stale cache")
                        data = CRYPTO_CACHE[ids_param]["data"]
                    else:
                        raise HTTPException(status_code=429, detail="CoinGecko rate limit exceeded")
                elif response.status_code != 200:
                    raise HTTPException(status_code=response.status_code, detail="CoinGecko API error")
                else:
                    data = response.json()
                    CRYPTO_CACHE[ids_param] = {"timestamp": now, "data": data}
                    logger.info(f"CRYPTO CACHE STORE: {ids_param}")
        
        results = []
        for entry in entries:
            sym = entry["original"]
            cg_id = entry["id"]
            coin_data = data.get(cg_id, {})
            
            if not coin_data:
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
