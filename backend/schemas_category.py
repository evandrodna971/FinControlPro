from pydantic import BaseModel
from typing import Optional

class CategoryBase(BaseModel):
    name: str
    type: str # income, expense
    color: Optional[str] = "#000000"
    icon: Optional[str] = "Circle"
    budget_limit: Optional[float] = 0.0

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True
