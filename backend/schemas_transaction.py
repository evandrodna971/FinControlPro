from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CreditCardBase(BaseModel):
    name: str
    closing_day: int
    due_day: int

class CreditCardCreate(CreditCardBase):
    pass

class CreditCard(CreditCardBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class TransactionBase(BaseModel):
    amount: float
    description: str
    date: datetime = datetime.now()
    type: str # income / expense
    payment_method: Optional[str] = None
    tags: Optional[str] = None
    location: Optional[str] = None
    category_id: Optional[int] = None
    
    # Status & Scheduling
    status: str = "paid"
    paid_at: Optional[datetime] = None
    due_date: Optional[datetime] = None

    # Recurrence & Installments
    is_recurring: bool = False
    recurrence_period: Optional[str] = None # daily, weekly, monthly, yearly
    recurrence_end_date: Optional[datetime] = None
    reminder: bool = False
    installment_count: int = 1
    installment_number: int = 1
    parent_id: Optional[int] = None
    credit_card_id: Optional[int] = None

class TransactionCreate(TransactionBase):
    pass

class Transaction(TransactionBase):
    id: int
    user_id: int
    category_name: Optional[str] = None
    category_icon: Optional[str] = None
    category_color: Optional[str] = None
    created_at: Optional[datetime] = None
    
    # Status for response (explicitly included)
    status: str
    paid_at: Optional[datetime] = None
    due_date: Optional[datetime] = None
    total_value: Optional[float] = None # For summary views

    class Config:
        from_attributes = True

class MonthlyData(BaseModel):
    name: Optional[str] = "Unknown"
    value: float

class CategoryBreakdown(BaseModel):
    name: Optional[str] = "Outros"
    value: float
    percentage: float
    limit: Optional[float] = 0.0
    icon: Optional[str] = None

class DashboardSummary(BaseModel):
    total_balance: float
    total_income: float
    total_expenses: float
    income_trend: list[MonthlyData]
    expense_trend: list[MonthlyData]
    category_breakdown: list[CategoryBreakdown]
    income_category_breakdown: list[CategoryBreakdown]

class TransactionImportPreview(BaseModel):
    date: datetime
    description: str
    amount: float
    type: str # income / expense
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    
    class Config:
        from_attributes = True
