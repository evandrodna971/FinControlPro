from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import crud, models, schemas_gains, database, auth as auth_service
from sqlalchemy import func

router = APIRouter(prefix="/gains", tags=["gains"])

@router.post("/planned", response_model=schemas_gains.PlannedIncomeResponse)
def create_planned_income(
    income: schemas_gains.PlannedIncomeCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    return crud.create_planned_income(db=db, income=income, user_id=current_user.id)

@router.get("/planned", response_model=List[schemas_gains.PlannedIncomeResponse])
def read_planned_incomes(
    year: int,
    month: int = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    return crud.get_planned_incomes(db, user_id=current_user.id, year=year, month=month)

@router.get("/compare", response_model=schemas_gains.GainComparison)
def compare_gains(
    year: int,
    month: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    # Projected
    projected = db.query(func.sum(models.PlannedIncome.amount)).filter(
        models.PlannedIncome.user_id == current_user.id,
        models.PlannedIncome.year == year,
        models.PlannedIncome.month == month
    ).scalar() or 0.0
    
    # Realized
    realized = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.user_id == current_user.id,
        models.Transaction.type == "income",
        func.strftime('%Y', models.Transaction.date) == str(year),
        func.strftime('%m', models.Transaction.date) == str(month).zfill(2)
    ).scalar() or 0.0
    
    return {
        "month": month,
        "year": year,
        "projected": projected,
        "realized": realized
    }
