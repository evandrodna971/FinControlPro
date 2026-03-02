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
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    Base.metadata.create_all(bind=engine)
    
    # Auto-migration for new columns
    try:
        from sqlalchemy import inspect # Import here is fine if indented, but better at top. 
        # Actually I will keep it inside but indented correctly this time, 
        # or just use inspect since I will add it to top imports.
        # Let's clean up the duplicate try/except block that appeared in the view_file output too.
        
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
            ('trial_start_date', "ALTER TABLE users ADD COLUMN trial_start_date DATETIME"),
            ('subscription_end_date', "ALTER TABLE users ADD COLUMN subscription_end_date DATETIME"),
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
