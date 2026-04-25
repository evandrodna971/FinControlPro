from sqlalchemy import create_engine, text, inspect
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Render provides DATABASE_URL, fallback to local sqlite
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'fincontrol.db')}")

# Fix for Render: SQLAlchemy requires 'postgresql://', but Render provides 'postgres://'
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

if "sqlite" in SQLALCHEMY_DATABASE_URL:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # Log the connection URL (hiding password) for debugging
    hostname = "unknown"
    try:
        from urllib.parse import urlparse
        import socket
        parsed = urlparse(SQLALCHEMY_DATABASE_URL)
        hostname = parsed.hostname
        safe_url = f"{parsed.scheme}://{parsed.username}:****@{parsed.hostname}:{parsed.port}{parsed.path}"
        print(f"Connecting to database: {safe_url}")
        
        # DNS Diagnosis
        print(f"Diagnosing DNS for {hostname}...")
        try:
            ip = socket.gethostbyname(hostname)
            print(f"DNS Success: {hostname} resolved to {ip}")
        except Exception as dns_err:
            print(f"DNS FAILURE: Could not resolve {hostname}: {dns_err}")
            print("TIP: If you are using 'Internal Database URL', try switching to 'External Database URL' in Render settings.")
            
    except Exception as e:
        print(f"Error during connection diagnosis: {e}")
        
    engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    try:
        print("Checking/Creating tables...")
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"CRITICAL ERROR: Failed to connect to database or create tables: {e}")
        # Re-raise to ensure the app doesn't start in an inconsistent state
        raise e
    
    # Auto-migration for new columns
    try:
        inspector = inspect(engine)
        
        # Categories table migrations
        columns_cat = [col['name'] for col in inspector.get_columns("categories")]
        if 'icon' not in columns_cat:
            print("Migrating: Adding 'icon' column to categories table...")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE categories ADD COLUMN icon VARCHAR"))
                conn.commit()
            print("Migration successful.")

        # Users table migrations
        columns_users = [col['name'] for col in inspector.get_columns("users")]
        user_migrations = [
            ('subscription_plan', "ALTER TABLE users ADD COLUMN subscription_plan VARCHAR DEFAULT 'free'"),
            ('subscription_status', "ALTER TABLE users ADD COLUMN subscription_status VARCHAR DEFAULT 'trial'"),
            ('trial_start_date', "ALTER TABLE users ADD COLUMN trial_start_date TIMESTAMP"),
            ('subscription_end_date', "ALTER TABLE users ADD COLUMN subscription_end_date TIMESTAMP"),
        ]

        for col_name, sql in user_migrations:
            if col_name not in columns_users:
                print(f"Migrating: Adding '{col_name}' column to users table...")
                with engine.connect() as conn:
                    conn.execute(text(sql))
                    # For trial_start_date, we might want to populate it if missing
                    if col_name == 'trial_start_date':
                        conn.execute(text("UPDATE users SET trial_start_date = CURRENT_TIMESTAMP WHERE trial_start_date IS NULL"))
                    conn.commit()
                print(f"Migration for '{col_name}' successful.")
                
    except Exception as e:
        print(f"Migration check failed: {e}")
