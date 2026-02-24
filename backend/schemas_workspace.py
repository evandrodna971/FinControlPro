from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class WorkspaceBase(BaseModel):
    name: str
    type: str # personal, family, business

class WorkspaceCreate(WorkspaceBase):
    pass

class Workspace(WorkspaceBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class UserWorkspaceBase(BaseModel):
    workspace_id: int
    role: str

class UserWorkspace(UserWorkspaceBase):
    user_id: int

    class Config:
        from_attributes = True

class TeamMember(BaseModel):
    user_id: int
    email: str
    role: str
    status: str
    full_name: Optional[str] = None

class MemberUpdate(BaseModel):
    role: str


class InvitationResponse(BaseModel):
    accept: bool

class NotificationBase(BaseModel):
    content: str
    type: str
    link_id: Optional[int] = None

class Notification(NotificationBase):
    id: int
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class WorkspaceInvite(BaseModel):
    workspace_id: int
    workspace_name: str
    role: str
    status: str

class WorkspaceSettingsUpdate(BaseModel):
    monthly_savings_goal: Optional[float] = None

