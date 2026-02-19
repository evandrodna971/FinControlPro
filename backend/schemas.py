from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str
    full_name: Optional[str] = None
    role: str = "individual"

class UserResponse(UserBase):
    id: int
    full_name: Optional[str] = None
    role: str
    is_active: bool

    class Config:
        from_attributes = True

class UserResetRequest(BaseModel):
    email: EmailStr

class UserPasswordReset(BaseModel):
    token: str
    new_password: str

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
