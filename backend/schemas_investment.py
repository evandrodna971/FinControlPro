from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# ==================== TRANSACTIONS ====================

class InvestmentTransactionBase(BaseModel):
    transaction_type: str  # buy, sell, dividend, split
    quantity: float
    price: float
    total_value: float
    fees: Optional[float] = 0.0
    broker: Optional[str] = None
    date: datetime
    notes: Optional[str] = None

class InvestmentTransactionCreate(InvestmentTransactionBase):
    pass

class InvestmentTransaction(InvestmentTransactionBase):
    id: int
    asset_id: int
    
    class Config:
        from_attributes = True

# ==================== ALERTS ====================

class PriceAlertBase(BaseModel):
    alert_type: str  # price_target, percent_change
    target_value: Optional[float] = None
    condition: str  # above, below
    is_active: bool = True

class PriceAlertCreate(PriceAlertBase):
    pass

class PriceAlertUpdate(BaseModel):
    is_active: Optional[bool] = None
    triggered_at: Optional[datetime] = None


class PriceAlert(PriceAlertBase):
    id: int
    asset_id: int
    user_id: int
    triggered_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class PriceAlertWithAsset(PriceAlert):
    symbol: Optional[str] = None
    asset_name: Optional[str] = None

# ==================== ASSETS ====================

class InvestmentAssetBase(BaseModel):
    symbol: str
    name: str
    asset_type: str  # stock, crypto, bond, fund, reit
    market: str = "BR"
    sector: Optional[str] = None
    dividend_yield: Optional[float] = 0.0

class InvestmentAssetCreate(InvestmentAssetBase):
    pass

class InvestmentAssetUpdate(BaseModel):
    symbol: Optional[str] = None
    name: Optional[str] = None
    asset_type: Optional[str] = None
    market: Optional[str] = None
    sector: Optional[str] = None
    dividend_yield: Optional[float] = None
    quantity: Optional[float] = None
    average_price: Optional[float] = None
    current_price: Optional[float] = None
    last_updated: Optional[datetime] = None

class InvestmentTransactionUpdate(BaseModel):
    transaction_type: Optional[str] = None
    quantity: Optional[float] = None
    price: Optional[float] = None
    total_value: Optional[float] = None
    fees: Optional[float] = None
    date: Optional[datetime] = None
    notes: Optional[str] = None

class InvestmentAsset(InvestmentAssetBase):
    id: int
    user_id: int
    workspace_id: Optional[int]
    quantity: float
    average_price: float
    current_price: Optional[float]
    last_updated: Optional[datetime]
    created_at: datetime
    
    transactions: List[InvestmentTransaction] = []
    alerts: List[PriceAlert] = []
    
    class Config:
        from_attributes = True

class PortfolioSummary(BaseModel):
    total_balance: float
    total_invested: float
    total_profit: float
    profit_percentage: float
    balance_variation_30d: Optional[float] = 0.0  # Variação do patrimônio em 30 dias (%)
    invested_variation_30d: Optional[float] = 0.0  # Variação do investido em 30 dias (%)
    profit_variation_30d: Optional[float] = 0.0  # Variação do lucro em 30 dias (%)
    performance_vs_cdi: Optional[float] = 0.0  # Performance vs CDI (%)
    performance_vs_ibov: Optional[float] = 0.0  # Performance vs IBOVESPA (%)
    asset_allocation: List[dict]
    performance_history: List[dict]
