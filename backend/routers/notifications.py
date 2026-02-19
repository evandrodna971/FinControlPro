from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas_workspace, database, auth as auth_service

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("/", response_model=List[schemas_workspace.Notification])
def list_notifications(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    return db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False
    ).order_by(models.Notification.created_at.desc()).all()

@router.post("/{notification_id}/read")
def mark_read(
    notification_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    notif = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user.id
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"status": "ok"}

@router.post("/read-all")
def mark_all_read(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False
    ).update({"is_read": True})
    
    db.commit()
    return {"status": "ok"}
