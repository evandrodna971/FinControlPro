from pydantic import BaseModel
from typing import Optional

class PlannedIncomeBase(BaseModel):
    amount: float
    description: str
    month: int
    year: int
    category_id: int
    is_recurring: bool = False

class PlannedIncomeCreate(PlannedIncomeBase):
    pass

class PlannedIncomeResponse(PlannedIncomeBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class GainComparison(BaseModel):
    month: int
    year: int
    projected: float
    realized: float
