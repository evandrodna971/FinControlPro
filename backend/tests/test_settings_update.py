
import requests
import json

# Assuming the backend is running on localhost:8000
# We need a valid token. Since we can't easily get one without login, 
# I will try to inspect the logs by asking the user to retry, OR
# I can write a script that imports the app functions and calls them directly to test the logic.

import sys
import os

# Add backend to path
# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import WorkspaceSettings, Workspace, User, UserWorkspace
from routers import couples
from schemas_workspace import WorkspaceSettingsUpdate

DB_PATH = f"sqlite:///{os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'fincontrol.db')}"
engine = create_engine(DB_PATH)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test_update():
    db = SessionLocal()
    try:
        # Find a workspace
        ws = db.query(Workspace).first()
        if not ws:
            print("No workspace found")
            return

        print(f"Testing with Workspace ID: {ws.id}")
        
        # Check current settings
        current_settings = db.query(WorkspaceSettings).filter(WorkspaceSettings.workspace_id == ws.id).first()
        print(f"Current Settings: {current_settings.monthly_savings_goal if current_settings else 'None'}")

        # Update
        new_goal = 6000.0
        update_data = WorkspaceSettingsUpdate(monthly_savings_goal=new_goal)
        
        # Simulate router call logic (direct crud call)
        from crud import update_workspace_settings
        updated = update_workspace_settings(db, ws.id, monthly_savings_goal=new_goal)
        
        print(f"Updated Settings: {updated.monthly_savings_goal}")
        
        if updated.monthly_savings_goal == new_goal:
            print("SUCCESS: Logic works correctly.")
        else:
            print("FAILURE: Value did not update.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_update()
