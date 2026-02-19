import httpx
import logging
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class MarketDataService:
    """
    Service to fetch market data from various APIs.
    Sources:
    - Alpha Vantage (Stocks - US/Global)
    - CoinGecko (Crypto)
    - BCB / Tesouro Direto (Brazil)
    - Yahoo Finance (via yfinance library if available, otherwise fallback)
    """
    
    def __init__(self):
        self.alpha_vantage_key = "DEMO" # User needs to provide this
        self.http_client = httpx.AsyncClient(timeout=10.0)

    async def close(self):
        await self.http_client.aclose()

    async def get_test_data(self):
        """Return mock data for testing/demo purposes"""
        return {
            "AAPL": 150.0,
            "BTC-USD": 45000.0,
            "PETR4": 35.0
        }

    async def get_crypto_price(self, symbol: str) -> Optional[float]:
        """
        Fetch crypto price from CoinGecko.
        Symbol should be the CoinGecko ID (e.g., 'bitcoin', 'ethereum').
        """
        try:
            # Simple price endpoint
            url = f"https://api.coingecko.com/api/v3/simple/price?ids={symbol.lower()}&vs_currencies=usd"
            response = await self.http_client.get(url)
            response.raise_for_status()
            data = response.json()
            
            if symbol.lower() in data:
                return data[symbol.lower()]['usd']
            return None
        except Exception as e:
            logger.error(f"Error fetching crypto price for {symbol}: {e}")
            return None

    async def get_stock_price(self, symbol: str) -> Optional[float]:
        """
        Fetch stock price. 
        For now, using a mock or free tier of Alpha Vantage.
        """
        # TODO: Implement real stock API (Alpha Vantage requires key)
        # For demonstration, we'll generic random-ish data or return None
        # In production, use yfinance or Alpha Vantage
        try:
             # Placeholder for Alpha Vantage
             # url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}&apikey={self.alpha_vantage_key}"
             pass
        except Exception as e:
            logger.error(f"Error fetching stock price: {e}")
        
        return None

    async def get_asset_price(self, symbol: str, asset_type: str) -> Optional[float]:
        """Unified method to get price based on asset type"""
        if asset_type == 'crypto':
            return await self.get_crypto_price(symbol)
        elif asset_type == 'stock':
            return await self.get_stock_price(symbol)
        
        return None

market_service = MarketDataService()
