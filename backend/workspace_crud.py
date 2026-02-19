from sqlalchemy.orm import Session
from . import models, schemas_workspace
from datetime import datetime

def create_workspace(db: Session, workspace: schemas_workspace.WorkspaceCreate, user_id: int):
    # Create the workspace
    db_workspace = models.Workspace(name=workspace.name, type=workspace.type)
    db.add(db_workspace)
    db.commit()
    db.refresh(db_workspace)
    
    # Set the creator as Owner
    membership = models.UserWorkspace(
        user_id=user_id,
        workspace_id=db_workspace.id,
        role="owner"
    )
    db.add(membership)
    db.commit()
    return db_workspace

def get_user_workspaces(db: Session, user_id: int):
    return db.query(models.Workspace).join(models.UserWorkspace).filter(
        models.UserWorkspace.user_id == user_id,
        models.UserWorkspace.status == "active"
    ).all()

def get_pending_invites(db: Session, user_id: int):
    return db.query(models.UserWorkspace, models.Workspace.name).join(
        models.Workspace, models.UserWorkspace.workspace_id == models.Workspace.id
    ).filter(
        models.UserWorkspace.user_id == user_id,
        models.UserWorkspace.status == "pending"
    ).all()

def add_team_member(db: Session, workspace_id: int, email: str, role: str):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        return None
    
    # Check if already a member
    existing = db.query(models.UserWorkspace).filter(
        models.UserWorkspace.user_id == user.id,
        models.UserWorkspace.workspace_id == workspace_id
    ).first()
    if existing:
        return existing

    membership = models.UserWorkspace(
        user_id=user.id,
        workspace_id=workspace_id,
        role=role,
        status="pending"
    )
    db.add(membership)
    
    # Create Notification
    workspace = db.query(models.Workspace).filter(models.Workspace.id == workspace_id).first()
    notification = models.Notification(
        user_id=user.id,
        content=f"Você foi convidado para o workspace '{workspace.name}'",
        type="invite",
        link_id=workspace_id
    )
    db.add(notification)
    
    db.commit()
    return membership

def respond_to_invite(db: Session, user_id: int, workspace_id: int, accept: bool):
    membership = db.query(models.UserWorkspace).filter(
        models.UserWorkspace.user_id == user_id,
        models.UserWorkspace.workspace_id == workspace_id
    ).first()
    
    if not membership:
        return None
    
    if accept:
        membership.status = "active"
    else:
        db.delete(membership)
    
    db.commit()
    return membership

def get_team_members(db: Session, workspace_id: int):
    results = db.query(models.User, models.UserWorkspace.role, models.UserWorkspace.status).join(
        models.UserWorkspace, models.User.id == models.UserWorkspace.user_id
    ).filter(models.UserWorkspace.workspace_id == workspace_id).all()
    
    return [
        {
            "user_id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": role,
            "status": status
        } for user, role, status in results
    ]



def update_membership_role(db: Session, workspace_id: int, user_id: int, new_role: str):
    membership = db.query(models.UserWorkspace).filter(
        models.UserWorkspace.user_id == user_id,
        models.UserWorkspace.workspace_id == workspace_id
    ).first()
    if not membership:
        return None
    
    membership.role = new_role
    db.commit()
    db.refresh(membership)
    return membership

def remove_membership(db: Session, workspace_id: int, user_id: int):
    membership = db.query(models.UserWorkspace).filter(
        models.UserWorkspace.user_id == user_id,
        models.UserWorkspace.workspace_id == workspace_id
    ).first()
    if not membership:
        return False
    
    db.delete(membership)
    db.commit()
    return True

def delete_workspace(db: Session, workspace_id: int, user_id: int):
    # Check if user is owner
    membership = db.query(models.UserWorkspace).filter(
        models.UserWorkspace.workspace_id == workspace_id,
        models.UserWorkspace.user_id == user_id,
        models.UserWorkspace.role == "owner"
    ).first()
    
    if not membership:
        return False
        
    workspace = db.query(models.Workspace).filter(models.Workspace.id == workspace_id).first()
    if not workspace:
        return False

    # Delete related data (manually if cascades aren't set, or just to be safe)
    # 1. Delete all memberships
    db.query(models.UserWorkspace).filter(models.UserWorkspace.workspace_id == workspace_id).delete()
    
    # 2. Delete transactions
    db.query(models.Transaction).filter(models.Transaction.workspace_id == workspace_id).delete()
    
    # 3. Delete categories
    db.query(models.Category).filter(models.Category.workspace_id == workspace_id).delete()
    
    # 4. Delete workspace
    db.delete(workspace)
    db.commit()
    return True
