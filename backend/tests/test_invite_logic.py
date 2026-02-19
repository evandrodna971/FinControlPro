
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

# Add parent directory to path to allow importing backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import models
import workspace_crud
import database

# Setup DB connection
SQLALCHEMY_DATABASE_URL = "sqlite:///./fincontrol.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

email = "joice_silva_30@hotmail.com"
workspace_id = 1 # Assuming Evandro's workspace is 1

print(f"Testing invite for {email} to workspace {workspace_id}...")

# 1. Clean up any existing membership
user = db.query(models.User).filter(models.User.email == email).first()
if user:
    existing = db.query(models.UserWorkspace).filter(
        models.UserWorkspace.user_id == user.id, 
        models.UserWorkspace.workspace_id == workspace_id
    ).first()
    if existing:
        print(f"Found existing membership: {existing.status}. Deleting...")
        db.delete(existing)
        db.commit()

# 2. Call add_team_member
print("Calling add_team_member...")
new_member = workspace_crud.add_team_member(db, workspace_id, email, "member")

if new_member:
    print(f"Member added. Status: {new_member.status}")
    print(f"Role: {new_member.role}")
else:
    print("Failed to add member (User might not exist?)")

# 3. Verify in DB
print("Verifying in DB...")
if user:
    check = db.query(models.UserWorkspace).filter(
        models.UserWorkspace.user_id == user.id, 
        models.UserWorkspace.workspace_id == workspace_id
    ).first()
    if check:
        print(f"DB verification: Status = {check.status}")
    else:
        print("Member not found in DB after add!")

db.close()
