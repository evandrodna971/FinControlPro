from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(min_length=8)
    full_name: Optional[str] = None
    role: str = "individual"

class UserResponse(UserBase):
    id: int
    full_name: Optional[str] = None
    role: str
    is_active: bool
    subscription_plan: str
    subscription_status: str
    trial_start_date: datetime
    subscription_end_date: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserResetRequest(BaseModel):
    email: EmailStr

class UserPasswordReset(BaseModel):
    token: str
    new_password: str = Field(min_length=8)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserCheckRequest(BaseModel):
    email: EmailStr

class UserCheckResponse(BaseModel):
    exists: bool
    message: str
