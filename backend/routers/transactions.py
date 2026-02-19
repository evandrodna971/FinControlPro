from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import database, schemas_transaction, crud, auth as auth_service, models

router = APIRouter(
    prefix="/transactions",
    tags=["Transactions"]
)

@router.get("/", response_model=List[schemas_transaction.Transaction])
def read_transactions(
    skip: int = 0, 
    limit: int = 100, 
    summary_view: bool = False,
    filter_by: Optional[str] = None,  # mine, partner, joint, all
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth_service.get_current_active_user),
    workspace_id: Optional[int] = Depends(auth_service.get_current_workspace)
):
    return crud.get_transactions(
        db, 
        skip=skip, 
        limit=limit, 
        user_id=current_user.id, 
        workspace_id=workspace_id, 
        summary_view=summary_view,
        filter_by=filter_by
    )

@router.post("/", response_model=schemas_transaction.Transaction)
def create_transaction(
    transaction: schemas_transaction.TransactionCreate, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth_service.get_current_active_user),
    workspace_id: Optional[int] = Depends(auth_service.get_current_workspace)
):
    return crud.create_user_transaction(db=db, transaction=transaction, user_id=current_user.id, workspace_id=workspace_id)

@router.get("/summary", response_model=schemas_transaction.DashboardSummary)
def read_summary(
    month: Optional[int] = None,
    year: Optional[int] = None,
    interval: str = "monthly",
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth_service.get_current_active_user),
    workspace_id: Optional[int] = Depends(auth_service.get_current_workspace)
):
    return crud.get_dashboard_summary(db, user_id=current_user.id, workspace_id=workspace_id, month=month, year=year, interval=interval)

@router.get("/{transaction_id}", response_model=schemas_transaction.Transaction)
def read_transaction(
    transaction_id: int, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    transaction = crud.get_transaction(db, transaction_id=transaction_id)
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    return transaction

@router.put("/{transaction_id}", response_model=schemas_transaction.Transaction)
def update_transaction(
    transaction_id: int,
    transaction: schemas_transaction.TransactionCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    updated = crud.update_user_transaction(db, transaction_id, transaction)
    if updated is None:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    return updated

@router.delete("/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    delete_type: str = "single", # single | all
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    print(f"DEBUG: Request to delete transaction {transaction_id}")
    try:
        deleted = crud.delete_user_transaction(db, transaction_id, delete_type=delete_type, month=month, year=year)
        if deleted is None:
            print(f"DEBUG: Transaction {transaction_id} not found in DB")
            raise HTTPException(status_code=404, detail="Transação não encontrada")
        print(f"DEBUG: Transaction {transaction_id} deleted successfully")
        return {"message": "Transação removida com sucesso"}
    except Exception as e:
        print(f"DEBUG: Error deleting transaction {transaction_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/bulk-delete")
def bulk_delete_transactions(
    transaction_ids: List[int],
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    print(f"DEBUG: Bulk delete request for {transaction_ids}")
    try:
        count = crud.delete_user_transactions(db, transaction_ids)
        return {"message": f"{count} transações removidas com sucesso"}
    except Exception as e:
        print(f"DEBUG: Error in bulk delete: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{transaction_id}/pay", response_model=schemas_transaction.Transaction)
def pay_transaction(
    transaction_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    transaction = crud.settle_transaction(db, transaction_id=transaction_id, user_id=current_user.id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    return transaction

@router.get("/upcoming/list", response_model=List[schemas_transaction.Transaction])
def get_upcoming_transactions(
    limit: int = 10,
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user),
    workspace_id: Optional[int] = Depends(auth_service.get_current_workspace)
):
    return crud.get_upcoming_transactions(db, user_id=current_user.id, workspace_id=workspace_id, limit=limit, month=month, year=year)


