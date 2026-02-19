from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from .. import crud, models, schemas, schemas_workspace, database, auth as auth_service

router = APIRouter(prefix="/couples", tags=["couples"])

# ==================== JOINT GOALS ====================

@router.post("/joint-goals/")
def create_joint_goal(
    title: str,
    target_amount: float,
    description: Optional[str] = None,
    deadline: Optional[datetime] = None,
    current_user: models.User = Depends(auth_service.get_current_active_user),
    db: Session = Depends(database.get_db),
    workspace_id: int = Depends(auth_service.get_current_workspace)
):
    """Create a new joint financial goal for the workspace"""
    if not workspace_id:
        raise HTTPException(status_code=400, detail="No active workspace")
    
    return crud.create_joint_goal(
        db=db,
        title=title,
        target_amount=target_amount,
        workspace_id=workspace_id,
        description=description,
        deadline=deadline
    )

@router.get("/joint-goals/")
def get_joint_goals(
    current_user: models.User = Depends(auth_service.get_current_active_user),
    db: Session = Depends(database.get_db),
    workspace_id: int = Depends(auth_service.get_current_workspace)
):
    """Get all joint goals for the current workspace"""
    if not workspace_id:
        return []
    
    return crud.get_joint_goals(db=db, workspace_id=workspace_id)

@router.put("/joint-goals/{goal_id}")
def update_joint_goal(
    goal_id: int,
    current_amount: float,
    current_user: models.User = Depends(auth_service.get_current_active_user),
    db: Session = Depends(database.get_db)
):
    """Update the progress of a joint goal"""
    goal = crud.update_joint_goal_progress(db=db, goal_id=goal_id, amount=current_amount)
    if not goal:
        raise HTTPException(status_code=404, detail="Joint goal not found")
    return goal

@router.delete("/joint-goals/{goal_id}")
def delete_joint_goal(
    goal_id: int,
    current_user: models.User = Depends(auth_service.get_current_active_user),
    db: Session = Depends(database.get_db)
):
    """Delete a joint goal"""
    result = crud.delete_joint_goal(db=db, goal_id=goal_id)
    if not result:
        raise HTTPException(status_code=404, detail="Joint goal not found")
    return result



# ==================== WORKSPACE SETTINGS ====================

@router.get("/settings")
def get_workspace_settings(
    current_user: models.User = Depends(auth_service.get_current_active_user),
    db: Session = Depends(database.get_db),
    workspace_id: int = Depends(auth_service.get_current_workspace)
):
    """Get workspace settings for approval thresholds"""
    if not workspace_id:
        raise HTTPException(status_code=400, detail="No active workspace")
    
    return crud.get_workspace_settings(db=db, workspace_id=workspace_id)

@router.put("/settings")
def update_workspace_settings(
    settings: schemas_workspace.WorkspaceSettingsUpdate,
    current_user: models.User = Depends(auth_service.get_current_active_user),
    db: Session = Depends(database.get_db),
    workspace_id: int = Depends(auth_service.get_current_workspace)
):
    """Update workspace settings"""
    if not workspace_id:
        raise HTTPException(status_code=400, detail="No active workspace")
    
    return crud.update_workspace_settings(
        db=db,
        workspace_id=workspace_id,
        approval_threshold=settings.approval_threshold,
        require_both_approval=settings.require_both_approval,
        monthly_savings_goal=settings.monthly_savings_goal
    )
