from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
from . import models, schemas_investment

def get_assets(db: Session, user_id: Optional[int] = None, workspace_id: Optional[int] = None):
    query = db.query(models.InvestmentAsset)
    if workspace_id:
        query = query.filter(models.InvestmentAsset.workspace_id == workspace_id)
    elif user_id:
        query = query.filter(models.InvestmentAsset.user_id == user_id)
    return query.all()

def get_asset(db: Session, asset_id: int):
    return db.query(models.InvestmentAsset).filter(models.InvestmentAsset.id == asset_id).first()

def create_asset(db: Session, asset: schemas_investment.InvestmentAssetCreate, user_id: int, workspace_id: Optional[int] = None):
    # Check if asset already exists in this context to avoid duplicates (optional, based on symbol)
    # For now allow multiples or handle via logic
    
    db_asset = models.InvestmentAsset(
        symbol=asset.symbol,
        name=asset.name,
        asset_type=asset.asset_type,
        market=asset.market,
        sector=asset.sector,
        dividend_yield=asset.dividend_yield,
        user_id=user_id,
        workspace_id=workspace_id,
        quantity=0,
        average_price=0
    )
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    return db_asset

def create_transaction(db: Session, asset_id: int, transaction: schemas_investment.InvestmentTransactionCreate):
    return add_transaction_to_asset(db, asset_id, transaction)

def add_transaction_to_asset(db: Session, asset_id: int, transaction: schemas_investment.InvestmentTransactionCreate):
    asset = get_asset(db, asset_id)
    if not asset:
        return None

    db_transaction = models.InvestmentTransaction(
        asset_id=asset_id,
        transaction_type=transaction.transaction_type,
        quantity=transaction.quantity,
        price=transaction.price,
        total_value=transaction.total_value,
        fees=transaction.fees,
        date=transaction.date,
        broker=transaction.broker,
        notes=transaction.notes
    )
    db.add(db_transaction)
    db.commit() # Commit transaction first
    
    # Recalculate stats
    recalculate_asset_stats(db, asset_id)
    
    db.refresh(db_transaction)
    return db_transaction

def update_asset(db: Session, asset_id: int, asset_update: schemas_investment.InvestmentAssetUpdate):
    db_asset = get_asset(db, asset_id)
    if not db_asset:
        return None
    
    update_data = asset_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_asset, key, value)
    
    db.commit()
    db.refresh(db_asset)
    return db_asset

def delete_asset(db: Session, asset_id: int):
    db_asset = get_asset(db, asset_id)
    if not db_asset:
        return False
    
    db.delete(db_asset)
    db.commit()
    return True

def delete_transaction(db: Session, transaction_id: int):
    db_transaction = db.query(models.InvestmentTransaction).filter(models.InvestmentTransaction.id == transaction_id).first()
    if not db_transaction:
        return False
    
    asset_id = db_transaction.asset_id
    db.delete(db_transaction)
    db.commit()
    
    # Recalculate stats for the asset
    recalculate_asset_stats(db, asset_id)
    return True

def get_asset_transactions(db: Session, asset_id: int):
    return db.query(models.InvestmentTransaction).filter(models.InvestmentTransaction.id == asset_id).order_by(models.InvestmentTransaction.date.desc()).all()

def recalculate_asset_stats(db: Session, asset_id: int):
    """
    Recalculate quantity and average price based on ALL transactions of the asset.
    This follows the Weighted Average Price rule:
    - BUY: (old_qty * old_avg + new_qty * new_price) / (old_qty + new_qty)
    - SELL: Only decreases quantity, average price stays the same.
    - DIVIDEND: Does not change qty or avg price (usually kept as income elsewhere, or reduces cost basis if so desired).
    """
    asset = get_asset(db, asset_id)
    if not asset:
        return
    
    # Get all transactions for this asset, ordered by date
    transactions = db.query(models.InvestmentTransaction).filter(models.InvestmentTransaction.asset_id == asset_id).order_by(models.InvestmentTransaction.date.asc()).all()
    
    current_qty = 0.0
    current_avg_price = 0.0
    
    for tx in transactions:
        if tx.transaction_type == 'buy':
            total_cost_old = current_qty * current_avg_price
            total_cost_new = tx.quantity * tx.price
            
            new_qty = current_qty + tx.quantity
            if new_qty > 0:
                current_avg_price = (total_cost_old + total_cost_new) / new_qty
            current_qty = new_qty
            
        elif tx.transaction_type == 'sell':
            current_qty -= tx.quantity
            if current_qty < 0:
                current_qty = 0.0 # Prevent negative qty
        
        elif tx.transaction_type == 'split':
            # tx.quantity is the multiplier (e.g. 10 for 1:10 split)
            # Both quantity and average price are adjusted to maintain same total cost
            if tx.quantity > 0:
                current_qty = current_qty * tx.quantity
                current_avg_price = current_avg_price / tx.quantity
        
        # Note: 'dividend' is currently ignored in basis calculation. 
        # If user wants dividends to reduce cost basis, logic should be added here.

    asset.quantity = current_qty
    asset.average_price = current_avg_price
    db.commit()
    db.refresh(asset)

def get_portfolio_summary(db: Session, user_id: int, workspace_id: Optional[int] = None):
    assets = get_assets(db, user_id, workspace_id)
    
    total_invested = 0.0
    total_balance = 0.0
    
    asset_allocation = {}
    
    for asset in assets:
        # Invested
        invested = asset.quantity * asset.average_price
        total_invested += invested
        
        # Current Value
        price = asset.current_price if asset.current_price else asset.average_price
        value = asset.quantity * price
        total_balance += value
        
        # Allocation
        if asset.asset_type not in asset_allocation:
            asset_allocation[asset.asset_type] = 0.0
        asset_allocation[asset.asset_type] += value
        
    total_profit = total_balance - total_invested
    profit_percentage = (total_profit / total_invested * 100) if total_invested > 0 else 0.0
    
    # Format allocation
    allocation_list = [{"name": k, "value": v} for k, v in asset_allocation.items()]
    
    # Calculate 30-day evolution (mock data for now - would need historical tracking)
    # Using Transaction Replay Real Data Logic
    evolution_data = get_portfolio_evolution(db, user_id, workspace_id, days=30)
    
    # Calculate variations (simplified - using mock data)
    balance_variation_30d = 5.2  # Mock: would calculate from historical data
    invested_variation_30d = 2.1  # Mock: would calculate from historical data
    profit_variation_30d = 8.5  # Mock: would calculate from historical data
    
    # Performance comparison (mock data - would integrate with real market data)
    performance_vs_cdi = profit_percentage - 0.95  # Mock CDI rate
    performance_vs_ibov = profit_percentage - 1.2  # Mock IBOV rate
    
    return {
        "total_balance": total_balance,
        "total_invested": total_invested,
        "total_profit": total_profit,
        "profit_percentage": profit_percentage,
        "balance_variation_30d": balance_variation_30d,
        "invested_variation_30d": invested_variation_30d,
        "profit_variation_30d": profit_variation_30d,
        "performance_vs_cdi": performance_vs_cdi,
        "performance_vs_ibov": performance_vs_ibov,
        "asset_allocation": allocation_list,
        "performance_history": evolution_data
    }


def get_portfolio_evolution(db: Session, user_id: int, workspace_id: Optional[int] = None, days: int = 30, current_balance: Optional[float] = None):
    """
    Get portfolio value evolution over the last N days by replaying transactions.
    """
    from datetime import datetime, timedelta, date as date_obj
    
    # 1. Get ALL transactions for the user/workspace, ordered by date
    query = db.query(models.InvestmentTransaction).join(models.InvestmentAsset).filter(models.InvestmentAsset.user_id == user_id)
    if workspace_id:
        query = query.filter(models.InvestmentAsset.workspace_id == workspace_id)
    
    # We need transactions ordered by date ASC to replay them
    transactions = query.order_by(models.InvestmentTransaction.date.asc()).all()
    
    # 2. Setup date range
    today = datetime.now().date()
    start_date = today - timedelta(days=days-1)
    
    evolution_points = []
    
    # 3. Replay State
    # Map of asset_id -> { quantity: float, avg_price: float }
    portfolio_state = {} 
    
    # Helper to calculate total value of portfolio at a given state
    # Note: idealmente teríamos histórico de preços. Como não temos,
    # vamos usar o valor investido (Cost Basis) ou uma interpolação.
    # Para ser consistente com "Saldo Atual", o ideal seria Market Value.
    # Fallback: Usar (Quantity * Current Price) mas ajustar o Price linearmente?
    # Simplificação robusta: Mostrar evolucão do VALOR INVESTIDO + LUCRO REALIZADO?
    # O usuário quer ver o saldo total.
    # Vamos usar uma aproximação:
    # - Sabemos o preço de compra de cada tx.
    # - Sabemos o preço ATUAL de cada ativo (no banco).
    # - Para datas passadas, se não temos histórico, assumimos linearidade entre Compra e Hoje?
    # - ISSO É COMPLEXO.
    # 
    # ABORDAGEM SIMPLIFICADA PARA PROTÓTIPO ROBUSTO:
    # O gráfico mostrará a evolução do COST BASIS (Valor Investido) + CAIXA (se houver).
    # Se o usuário quiser ver valor de mercado, precisaria de histórico de preços.
    # Mas o requisito é "não aleatório". O Valor Investido é um dado REAL e sólido.
    # Vamos tentar melhorar: Usar o preço da transação como "valor de mercado" na data da tx.
    
    # Vamos criar um mapa de precos diarios conhecidos (apenas dias de tx)
    price_history_cache = {} # asset_id -> { date -> price }
    for tx in transactions:
        if tx.asset_id not in price_history_cache:
            price_history_cache[tx.asset_id] = {}
        # Na data da transação, o preço era tx.price
        tx_date_str = tx.date.strftime("%Y-%m-%d") if isinstance(tx.date, (datetime, date_obj)) else str(tx.date)
        price_history_cache[tx.asset_id][tx_date_str] = tx.price

    # Preço atual dos ativos para ancorar o fim
    current_prices = {}
    assets = get_assets(db, user_id, workspace_id)
    for asset in assets:
        current_prices[asset.id] = asset.current_price if asset.current_price else asset.average_price

    # 4. Iterate day by day from FIRST transaction date (or start_date, whichever is earlier) to Today
    # But we only care about outputting from start_date
    
    # Find first tx date
    first_tx_date = transactions[0].date if transactions else today
    if isinstance(first_tx_date, datetime):
        first_tx_date = first_tx_date.date()
    elif isinstance(first_tx_date, str):
         first_tx_date = datetime.strptime(first_tx_date, "%Y-%m-%d").date()

    # Simulation cursor
    cutoff_date = start_date if start_date < first_tx_date else min(start_date, first_tx_date) # We might need to start earlier to build state
    current_sim_date = cutoff_date
    
    # Filter txs that happened BEFORE the simulation start to build initial state
    # Actually, easiest is to replay ALL from beginning if count is low, or optimize.
    # Let's replay ALL from beginning of time (transactions list) but only save points >= days.
    
    tx_idx = 0
    total_txs = len(transactions)
    
    # Replay loop covering full history range up to today
    # We iterate through DATES from first_tx to today
    
    # Optimization: Just iterate the requested 'days' range, but calculate INITIAL state first.
    
    # 3a. Calculate Initial State (Pre-Start Date)
    for i in range(total_txs):
        tx = transactions[i]
        t_date = tx.date
        if isinstance(t_date, datetime): t_date = t_date.date()
        elif isinstance(t_date, str): t_date = datetime.strptime(t_date, "%Y-%m-%d").date()
            
        if t_date < start_date:
            # Process TX
            _apply_transaction_to_portfolio(portfolio_state, tx)
        else:
            # We reached the start of our window
            tx_idx = i
            break
            
    # 3b. Iterate requested window
    
    for day_offset in range(days):
        current_day = start_date + timedelta(days=day_offset)
        
        # Apply transactions for this day
        while tx_idx < total_txs:
            tx = transactions[tx_idx]
            t_date = tx.date
            if isinstance(t_date, datetime): t_date = t_date.date()
            elif isinstance(t_date, str): t_date = datetime.strptime(t_date, "%Y-%m-%d").date()
            
            if t_date <= current_day:
                _apply_transaction_to_portfolio(portfolio_state, tx)
                tx_idx += 1
            else:
                break
        
        # Calculate Total Value for this day
        daily_total = 0.0
        
        for asset_id, state in portfolio_state.items():
             qty = state['quantity']
             if qty > 0:
                 # Price estimation:
                 # If we have a transaction today, use that price.
                 # Else, interpolate between Last Known Price and Current Price?
                 # Or just use Average Price (Cost Basis)?
                 # Using Cost Basis is consistently "Real" regarding money spent.
                 # Using Current Price is "Real" regarding wealth, but we lack history.
                 # Let's use AVG PRICE (Invested Value) as the base line for "Evolution" 
                 # if we lack data, but since user requested "Real Data", maybe they prefer
                 # to see the value fluctuations. Without API history, we can't show fluctuations.
                 # BETTER: Show Invested Value (sólido) vs Market Value (interpolation).
                 # For now, let's use a simple linear interpolation for price logic if possible,
                 # otherwise fallback to Average Price (Cost).
                 
                 # Let's stick to Invested Value (avg_price) for consistency with "backend generation" capabilities
                 # unless we fetch history. But wait, we passed 'current_balance' (Market Value) to this func before.
                 # To match that anchor, we must trend towards Current Price.
                 
                 current_p = current_prices.get(asset_id, 0)
                 avg_p = state['avg_price']
                 
                 # Linear interpolation factor (0.0 to 1.0) based on time
                 # This is a hack to make the graph connect "Avg Price" at purchase to "Current Price" today
                 # smoothly, instead of a random walk.
                 total_days_span = (today - first_tx_date).days
                 if total_days_span == 0: total_days_span = 1
                 
                 days_passed = (current_day - first_tx_date).days
                 progress = max(0, min(1, days_passed / total_days_span))
                 
                 # Estimated price = AvgPrice + (CurrentPrice - AvgPrice) * Progress
                 # This assumes linear growth/drop from purchase to now. Better than random.
                 estimated_price = avg_p + (current_p - avg_p) * progress
                 
                 daily_total += qty * estimated_price

        evolution_points.append({
            "date": current_day.strftime("%Y-%m-%d"),
            "value": round(daily_total, 2)
        })
        
    return evolution_points

def _apply_transaction_to_portfolio(state, tx):
    asset_id = tx.asset_id
    if asset_id not in state:
        state[asset_id] = {'quantity': 0.0, 'avg_price': 0.0}
        
    curr = state[asset_id]
    
    if tx.transaction_type == 'buy':
        total_cost = curr['quantity'] * curr['avg_price'] + tx.quantity * tx.price
        curr['quantity'] += tx.quantity
        if curr['quantity'] > 0:
            curr['avg_price'] = total_cost / curr['quantity']
            
    elif tx.transaction_type == 'sell':
        curr['quantity'] -= tx.quantity
        if curr['quantity'] < 0: curr['quantity'] = 0.0
        
    elif tx.transaction_type == 'split':
        if tx.quantity > 0:
            curr['quantity'] *= tx.quantity
            curr['avg_price'] /= tx.quantity

def get_performance_comparison(db: Session, user_id: int, workspace_id: Optional[int] = None):
    """
    Compare portfolio performance with market indices (CDI, IBOVESPA).
    Returns mock data for now.
    """
    summary = get_portfolio_summary(db, user_id, workspace_id)
    
    return {
        "portfolio_return": summary["profit_percentage"],
        "cdi_return": 0.95,  # Mock: 0.95% monthly CDI
        "ibov_return": 1.2,  # Mock: 1.2% monthly IBOVESPA
        "vs_cdi": summary["performance_vs_cdi"],
        "vs_ibov": summary["performance_vs_ibov"]
    }

def update_asset_price(db: Session, asset_id: int, price: float):
    db_asset = db.query(models.InvestmentAsset).filter(models.InvestmentAsset.id == asset_id).first()
    if db_asset:
        db_asset.current_price = price
        db_asset.last_updated = datetime.now()
        db.commit()
        db.refresh(db_asset)
        return db_asset
    return None

