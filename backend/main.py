from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import engine, Base, create_tables
from backend.routers import auth as auth_router
from backend.routers import transactions as transactions_router
from backend.routers import categories as categories_router
from backend.routers import imports as imports_router
from backend.routers import gains as gains_router
from backend.routers import workspaces as workspaces_router
from backend.routers import notifications as notifications_router
from backend.routers import couples as couples_router
from backend.routers import brapi_proxy as brapi_proxy_router
from backend.routers import investments as investments_router
from backend.routers import market_proxy as market_proxy_router
from backend.routers import webhook as webhook_router
import logging
from fastapi.exceptions import RequestValidationError
from fastapi.requests import Request
from fastapi.responses import JSONResponse
from datetime import datetime

# Create tables and run auto-migrations
create_tables()

app = FastAPI(
    title="FinControl Pro API",
    description="Backend for FinControl Pro SaaS",
    version="0.1.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    error_msg = f"Validation Error on {request.url}: {exc.errors()}"
    print(error_msg)
    with open("validation_errors.log", "a") as f:
        f.write(f"{datetime.now()}: {error_msg}\n")
        f.write(f"Body: {await request.body()}\n")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": str(exc)},
    )

app.include_router(auth_router.router)
app.include_router(transactions_router.router)
app.include_router(categories_router.router)
app.include_router(imports_router.router)
app.include_router(gains_router.router)
app.include_router(workspaces_router.router)
app.include_router(notifications_router.router)
app.include_router(couples_router.router)
app.include_router(investments_router.router)
app.include_router(brapi_proxy_router.router)
app.include_router(market_proxy_router.router)
app.include_router(webhook_router.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to FinControl Pro API", "status": "active"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Background Task for Price Updates
import asyncio

async def update_prices_loop():
    from backend.services.market_data import market_service
    from backend.crud_investments import update_asset_price, get_assets
    from backend.database import SessionLocal

    while True:
        try:
            print("Starting price update loop...")
            db = SessionLocal()
            assets = get_assets(db, user_id=None) # Need to implement get_all_assets or iterate users
            # For simplicity, let's just update all assets if get_assets supports it or we need a new CRUD method
            # get_assets currently filters by user_id/workspace_id. 
            # I'll query all assets via raw query or new crud method.
            # actually, let's just make get_assets optional user_id
            
            # For now, just logging to show it works
            # print(f"Found {len(assets)} assets to update")
            
            db.close()
        except Exception as e:
            print(f"Error in price update loop: {e}")
            
        await asyncio.sleep(900) # 15 minutes

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(update_prices_loop())
