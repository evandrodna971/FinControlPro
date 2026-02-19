from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from .. import database, schemas, crud, auth as auth_service

router = APIRouter(
    tags=["Authentication"]
)

@router.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not crud.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth_service.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth_service.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@router.get("/users/me", response_model=schemas.UserResponse)
async def read_users_me(current_user: schemas.UserResponse = Depends(auth_service.get_current_active_user)):
    return current_user
@router.post("/forgot-password")
async def forgot_password(email_data: schemas.UserResetRequest, db: Session = Depends(database.get_db)):
    user = crud.get_user_by_email(db, email=email_data.email)
    if not user:
        # Don't reveal user existence, but in this case user wants it
        raise HTTPException(status_code=404, detail="Email not found")
    
    # Generate a temporary token (reuse JWT logic for simplicity)
    reset_token = auth_service.create_access_token(
        data={"sub": user.email, "purpose": "reset"}, 
        expires_delta=timedelta(minutes=30)
    )
    
    # MOCK EMAIL SENDING
    print(f"\n[MOCK EMAIL] To: {user.email}")
    print(f"[MOCK EMAIL] Subject: Password Reset Request")
    print(f"[MOCK EMAIL] Link: http://localhost:5173/reset-password?token={reset_token}\n")
    
    return {"message": "Reset link sent to email (check console/logs)"}

@router.post("/reset-password")
async def reset_password(reset_data: schemas.UserPasswordReset, db: Session = Depends(database.get_db)):
    email = auth_service.verify_token(reset_data.token) # Need to ensure verify_token handles this
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
        
    user = crud.get_user_by_email(db, email=email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    crud.update_user_password(db, user, reset_data.new_password)
    return {"message": "Password updated successfully"}

@router.post("/check-email", response_model=schemas.UserCheckResponse)
def check_email(check: schemas.UserCheckRequest, db: Session = Depends(database.get_db)):
    db_user = crud.get_user_by_email(db, email=check.email)
    if db_user:
        return {"exists": True, "message": "Email already registered"}
    return {"exists": False, "message": "Email available"}
