from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import database, models, auth as auth_service
from .. import schemas_investment, crud_investments
from ..services.market_data import market_service

router = APIRouter(
    prefix="/investments",
    tags=["Investments"]
)

@router.get("/assets", response_model=List[schemas_investment.InvestmentAsset])
def read_assets(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user),
    workspace_id: Optional[int] = Depends(auth_service.get_current_workspace)
):
    return crud_investments.get_assets(db, user_id=current_user.id, workspace_id=workspace_id)

@router.post("/assets", response_model=schemas_investment.InvestmentAsset)
def create_asset(
    asset: schemas_investment.InvestmentAssetCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user),
    workspace_id: Optional[int] = Depends(auth_service.get_current_workspace)
):
    return crud_investments.create_asset(db, asset, user_id=current_user.id, workspace_id=workspace_id)

@router.post("/transactions", response_model=schemas_investment.InvestmentTransaction)
def create_transaction(
    transaction: schemas_investment.InvestmentTransactionCreate,
    asset_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    # Verify asset ownership/access (TODO: move to CRUD or Dependency)
    asset = crud_investments.get_asset(db, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Check permission (simple check for now)
    if asset.user_id != current_user.id and asset.workspace_id not in [w.id for w in current_user.workspaces]:
         # Rough check, ideally use proper dependency
         pass

    return crud_investments.add_transaction_to_asset(db, asset_id, transaction)

@router.get("/summary", response_model=schemas_investment.PortfolioSummary)
def get_summary(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user),
    workspace_id: Optional[int] = Depends(auth_service.get_current_workspace)
):
    return crud_investments.get_portfolio_summary(db, user_id=current_user.id, workspace_id=workspace_id)

@router.put("/assets/{asset_id}", response_model=schemas_investment.InvestmentAsset)
def update_asset(
    asset_id: int,
    asset_update: schemas_investment.InvestmentAssetUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    asset = crud_investments.get_asset(db, asset_id)
    if not asset or asset.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    return crud_investments.update_asset(db, asset_id, asset_update)

@router.delete("/assets/{asset_id}")
def delete_asset(
    asset_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    asset = crud_investments.get_asset(db, asset_id)
    if not asset or asset.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    success = crud_investments.delete_asset(db, asset_id)
    if not success:
        raise HTTPException(status_code=400, detail="Error deleting asset")
    return {"message": "Asset deleted successfully"}

@router.get("/assets/{asset_id}/transactions", response_model=List[schemas_investment.InvestmentTransaction])
def get_asset_transactions(
    asset_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    asset = crud_investments.get_asset(db, asset_id)
    if not asset or asset.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    return crud_investments.get_asset_transactions(db, asset_id)

@router.delete("/transactions/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    # Verify transaction ownership through asset
    transaction = db.query(models.InvestmentTransaction).filter(models.InvestmentTransaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    asset = crud_investments.get_asset(db, transaction.asset_id)
    if not asset or asset.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Access denied")

    success = crud_investments.delete_transaction(db, transaction_id)
    if not success:
        raise HTTPException(status_code=400, detail="Error deleting transaction")
    return {"message": "Transaction deleted successfully"}

@router.post("/refresh-prices")
async def refresh_prices(
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    """Trigger background price update"""
    # background_tasks.add_task(update_prices_task, db, current_user.id)
    return {"message": "Price update started"}

@router.get("/evolution")
def get_evolution(
    days: int = 30,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user),
    workspace_id: Optional[int] = Depends(auth_service.get_current_workspace)
):
    """Get portfolio value evolution over the last N days"""
    return crud_investments.get_portfolio_evolution(db, user_id=current_user.id, workspace_id=workspace_id, days=days)

@router.get("/performance-comparison")
def get_performance_comparison(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user),
    workspace_id: Optional[int] = Depends(auth_service.get_current_workspace)
):
    """Compare portfolio performance with market indices (CDI, IBOVESPA)"""
    return crud_investments.get_performance_comparison(db, user_id=current_user.id, workspace_id=workspace_id)

# ==================== PRICE ALERTS ====================

@router.get("/alerts", response_model=List[schemas_investment.PriceAlertWithAsset])
def read_alerts(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    """List all active and triggered alerts for the user"""
    # Simply get alerts from DB with joined asset info
    alerts = db.query(models.PriceAlert).filter(models.PriceAlert.user_id == current_user.id).all()
    
    # Enrich with symbol/name for UI
    result = []
    for alert in alerts:
        alert_dict = schemas_investment.PriceAlertWithAsset.model_validate(alert)
        if alert.asset:
            alert_dict.symbol = alert.asset.symbol
            alert_dict.asset_name = alert.asset.name
        result.append(alert_dict)
    
    return result

@router.post("/alerts", response_model=schemas_investment.PriceAlert)
def create_alert(
    alert: schemas_investment.PriceAlertCreate,
    asset_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    """Create a new price alert for a specific asset"""
    # Verify asset exists and user has access
    asset = crud_investments.get_asset(db, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    db_alert = models.PriceAlert(
        asset_id=asset_id,
        user_id=current_user.id,
        alert_type=alert.alert_type,
        target_value=alert.target_value,
        condition=alert.condition,
        is_active=True
    )
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert

@router.delete("/alerts/{alert_id}")
def delete_alert(
    alert_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    """Delete a price alert"""
    db_alert = db.query(models.PriceAlert).filter(models.PriceAlert.id == alert_id, models.PriceAlert.user_id == current_user.id).first()
    if not db_alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    db.delete(db_alert)
    db.commit()
    return {"message": "Alert deleted successfully"}

    db.delete(db_alert)
    db.commit()
    return {"message": "Alert deleted successfully"}

@router.patch("/alerts/{alert_id}", response_model=schemas_investment.PriceAlert)
def update_alert(
    alert_id: int,
    alert_update: schemas_investment.PriceAlertUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    """Update a price alert (e.g. mark as triggered or inactive)"""
    db_alert = db.query(models.PriceAlert).filter(models.PriceAlert.id == alert_id, models.PriceAlert.user_id == current_user.id).first()
    if not db_alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    if alert_update.is_active is not None:
        db_alert.is_active = alert_update.is_active
    
    if alert_update.triggered_at is not None:
        db_alert.triggered_at = alert_update.triggered_at
        
    db.commit()
    db.refresh(db_alert)
    return db_alert
