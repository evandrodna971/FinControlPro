from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from . import models, schemas, schemas_transaction, schemas_category, schemas_workspace
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def update_user_password(db: Session, user: models.User, new_password: str):
    user.hashed_password = get_password_hash(new_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_transactions(db: Session, user_id: int, workspace_id: Optional[int] = None, skip: int = 0, limit: int = 100, summary_view: bool = False, filter_by: Optional[str] = None):
    query = db.query(
        models.Transaction, 
        models.Category.name.label("category_name"),
        models.Category.icon.label("category_icon"),
        models.Category.color.label("category_color")
    ).outerjoin(models.Category, models.Transaction.category_id == models.Category.id)
    
    if workspace_id:
        query = query.filter(models.Transaction.workspace_id == workspace_id)
        
        # Apply person filter
        if filter_by == "mine":
            query = query.filter(models.Transaction.created_by_user_id == user_id)
        elif filter_by == "partner":
            # Get workspace members excluding current user
            workspace = db.query(models.Workspace).filter(models.Workspace.id == workspace_id).first()
            if workspace:
                partner_ids = [uw.user_id for uw in workspace.members if uw.user_id != user_id]
                query = query.filter(models.Transaction.created_by_user_id.in_(partner_ids))
        elif filter_by == "joint":
            query = query.filter(models.Transaction.is_joint == True)
        # filter_by == "all" or None: no additional filter
    else:
        query = query.filter(models.Transaction.user_id == user_id)

    if summary_view:
        # 1. Filter out future transactions (hides future recurring)
        # REMOVED: query = query.filter(models.Transaction.date <= datetime.now())
        # We need to show future parents if they become the head of the group.
        
        # 2. Filter for PARENTS only (root of the recurrence group)
        # Previously we used installment_number == 1, but if #1 is deleted, we lost the group.
        # Now we ensure one is always the parent (parent_id is NULL).
        query = query.filter(models.Transaction.parent_id == None)
        
        # Sort by ID desc (inclusion order) for Recent Transactions
        results = query.order_by(models.Transaction.id.desc())\
            .offset(skip).limit(limit).all()
    else:
        # Default sort by Date for Statement
        results = query.order_by(models.Transaction.date.desc())\
            .offset(skip).limit(limit).all()
    
    output = []
    for row in results:
        t = row[0]
        # Map the category name, icon, and color explicitly
        t_dict = {c.name: getattr(t, c.name) for c in t.__table__.columns}
        t_dict['category_name'] = row[1]
        t_dict['category_icon'] = row[2]
        t_dict['category_color'] = row[3]

        # Calculate Total Value for grouped installments (Dynamic Calculation)
        if summary_view and t.installment_count and t.installment_count > 1:
            # Sum this transaction + all its children ONLY for Installments
            children_sum = sum(child.amount for child in t.children)
            t_dict['total_value'] = round(t.amount + children_sum, 2)
        else:
            # For simple recurring (subscription) or single transaction, just show its own amount
            t_dict['total_value'] = t.amount

        output.append(t_dict)
    return output

def create_user_transaction(db: Session, transaction: schemas_transaction.TransactionCreate, user_id: int, workspace_id: Optional[int] = None):
    # Handle Installments
    # Determine Status and Approvals for Expenses
    approval_status = transaction.status if transaction.status else "paid"
    approver_id = None
    
    if workspace_id and transaction.type == "expense":
        settings = db.query(models.WorkspaceSettings).filter(models.WorkspaceSettings.workspace_id == workspace_id).first()
        if settings and transaction.amount > settings.approval_threshold:
             # Find a partner to approve
             # We pick the first active member who is NOT the creator
             partner_membership = db.query(models.UserWorkspace).filter(
                 models.UserWorkspace.workspace_id == workspace_id,
                 models.UserWorkspace.user_id != user_id,
                 models.UserWorkspace.status == 'active'
             ).first()
             
             if partner_membership:
                 approval_status = "pending_approval"
                 approver_id = partner_membership.user_id

    
    # Handle Installments
    if transaction.installment_count > 1:
        first_transaction = None
        
        # Calculate base installment amount (rounded down/nearest 2 decimals)
        total_amount = transaction.amount
        base_amount = round(total_amount / transaction.installment_count, 2)
        
        for i in range(1, transaction.installment_count + 1):
            # Accurate month shift
            installment_date = transaction.date + relativedelta(months=i - 1)
            
            # Update Due Date if it exists (shift it as well)
            installment_due_date = None
            if transaction.due_date:
                installment_due_date = transaction.due_date + relativedelta(months=i - 1)

            # Determine amount for this installment
            if i == transaction.installment_count:
                amount = total_amount - (base_amount * (transaction.installment_count - 1))
                amount = round(amount, 2)
            else:
                amount = base_amount

            db_transaction = models.Transaction(
                **transaction.model_dump(exclude={"installment_number", "parent_id", "date", "amount", "due_date", "reminder", "status"}),
                user_id=user_id,
                workspace_id=workspace_id,
                installment_number=i,
                date=installment_date,
                due_date=installment_due_date,
                amount=amount,
                status=transaction.status
            )
            if first_transaction:
                db_transaction.parent_id = first_transaction.id
            
            db.add(db_transaction)
            db.flush() # Get ID
            if i == 1:
                first_transaction = db_transaction
        
        db.commit()
        db.refresh(first_transaction)
        return first_transaction

    # Handle Simple Recurrence (Simple approach: generate first 12 if monthly)
    if transaction.is_recurring and transaction.recurrence_period == "monthly":
        first_transaction = None
        for i in range(1, 13): # Generate 1 year
            recur_date = transaction.date + relativedelta(months=i - 1)
            
            recur_due_date = None
            if transaction.due_date:
                recur_due_date = transaction.due_date + relativedelta(months=i - 1)

            db_transaction = models.Transaction(
                **transaction.model_dump(exclude={"date", "due_date", "reminder", "status"}),
                user_id=user_id,
                workspace_id=workspace_id,
                date=recur_date,
                due_date=recur_due_date,
                status=transaction.status
            )
            
            if first_transaction:
                db_transaction.parent_id = first_transaction.id

            db.add(db_transaction)
            if i == 1:
                db.flush()
                first_transaction = db_transaction
        
        db.commit()
        db.refresh(first_transaction)
        return first_transaction

    # Default Single Transaction
    db_transaction = models.Transaction(
        **transaction.model_dump(exclude={"installment_number", "parent_id", "reminder", "status"}),
        user_id=user_id,
        workspace_id=workspace_id,
        status=transaction.status
    )
        
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    
    return db_transaction

def get_transaction(db: Session, transaction_id: int):
    return db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()

def update_user_transaction(db: Session, transaction_id: int, transaction: schemas_transaction.TransactionCreate):
    db_transaction = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    if not db_transaction:
        return None
    
    # Update fields
    for key, value in transaction.model_dump(exclude={"installment_number", "parent_id", "reminder"}).items():
        setattr(db_transaction, key, value)
    
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

def delete_user_transaction(db: Session, transaction_id: int, delete_type: str = "single", month: Optional[int] = None, year: Optional[int] = None):
    print(f"DEBUG CRUD: Searching for transaction {transaction_id}, type={delete_type}, month={month}")
    
    # 1. Get the target transaction
    db_transaction = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    if not db_transaction:
        print("DEBUG CRUD: Not found")
        return None

    try:
        if delete_type == "all":
            # DELETE ALL RECURRENCES
            # Strategy: If it has a parent_id, the parent is the anchor. If it IS the parent, it is the anchor.
            # Then delete all that share that anchor.
            
            parent_id = db_transaction.parent_id if db_transaction.parent_id else db_transaction.id
            
            # Delete children (linked by parent_id)
            db.query(models.Transaction).filter(models.Transaction.parent_id == parent_id).delete()
            
            # Delete the parent itself
            db.query(models.Transaction).filter(models.Transaction.id == parent_id).delete()
            
            db.commit()
            print("DEBUG CRUD: Deleted all recurrences")
            return db_transaction 
            
        elif delete_type == "single" and month is not None and year is not None:
             # DELETE SPECIFIC MONTH INSTANCE
             # We need to find the specific transaction in this recurrence group that matches the date.
             # The 'transaction_id' passed might be the generic 'parent' or just one of them.
             # We assume users click on a "Summary" row which often represents the group or the latest/parent.
             
             parent_id = db_transaction.parent_id if db_transaction.parent_id else db_transaction.id
             
             # Find transaction in this group matching month/year
             target_to_delete = db.query(models.Transaction).filter(
                 (models.Transaction.id == parent_id) | (models.Transaction.parent_id == parent_id),
                 func.extract('month', models.Transaction.date) == month,
                 func.extract('year', models.Transaction.date) == year
             ).first()
             
             if target_to_delete:
                 # Check if this transaction is a Parent (has children linked to it)
                 # We use the new 'children' relationship.
                 # Note: children is a list of Transaction objects.
                 # Make a copy of the list because we will modify the relationship
                 children = list(target_to_delete.children)
                 
                 if children:
                     # Identify the new parent (the next installment)
                     new_parent = children[0]
                     print(f"DEBUG CRUD: Promoting transaction {new_parent.id} to new Parent")
                     
                     # 0. Decouple ALL children from the current parent to avoid interference during delete
                     # This sets parent_id=None for all of them
                     target_to_delete.children = []
                     db.flush()
                     
                     # 1. Promote new parent
                     new_parent.parent_id = None
                     # Inherit key properties to maintain group identity if needed
                     new_parent.is_recurring = target_to_delete.is_recurring
                     new_parent.recurrence_period = target_to_delete.recurrence_period
                     # Update count: Old count - 1
                     if target_to_delete.installment_count and target_to_delete.installment_count > 1:
                         new_parent.installment_count = target_to_delete.installment_count - 1
                     else:
                         new_parent.installment_count = target_to_delete.installment_count
                     
                     # 2. Re-link other children to the new parent
                     for child in children[1:]:
                         child.parent_id = new_parent.id
                         db.add(child)
                     
                     # Flush changes before deleting the old parent to avoid constraint violations
                     db.add(new_parent)
                     db.flush()

                 db.delete(target_to_delete)
                 db.commit()
                 print(f"DEBUG CRUD: Deleted specific instance for {month}/{year}")
                 return target_to_delete
             else:
                 # It is a child being deleted.
                 # We need to decrement the parent's installment_count
                 parent = target_to_delete.parent
                 if parent and parent.installment_count and parent.installment_count > 1:
                     parent.installment_count -= 1
                     db.add(parent)
                 
                 db.delete(target_to_delete)
                 db.commit()
                 print(f"DEBUG CRUD: Deleted specific child instance {target_to_delete.id}")
                 return target_to_delete
                 
        else:
            # DELETE SINGLE (Default behavior - just this ID)
            # This handles cases where we delete by ID directly (e.g. from a list where we know the ID)
            
            # Check if it is a Parent (has children)
            children = list(db_transaction.children)
            if children:
                # Promote logic (same as specific instance)
                new_parent = children[0]
                print(f"DEBUG CRUD: Promoting transaction {new_parent.id} to new Parent (Direct Delete)")
                
                db_transaction.children = []
                db.flush()
                
                new_parent.parent_id = None
                new_parent.is_recurring = db_transaction.is_recurring
                new_parent.recurrence_period = db_transaction.recurrence_period
                
                # Update count
                if db_transaction.installment_count and db_transaction.installment_count > 1:
                    new_parent.installment_count = db_transaction.installment_count - 1
                else:
                    new_parent.installment_count = db_transaction.installment_count

                for child in children[1:]:
                    child.parent_id = new_parent.id
                    db.add(child)
                
                db.add(new_parent)
                db.flush()
                
                db.delete(db_transaction)
                db.commit()
                return db_transaction

            else:
                # Check if it is a Child
                parent = db_transaction.parent
                if parent and parent.installment_count and parent.installment_count > 1:
                     parent.installment_count -= 1
                     db.add(parent)
                
                db.delete(db_transaction)
                db.commit()
                print("DEBUG CRUD: Delete committed (single/direct)")
                return db_transaction

    except Exception as e:
        print(f"DEBUG CRUD: Exception during delete: {e}")
        db.rollback()
        raise e

def delete_user_transactions(db: Session, transaction_ids: List[int]):
    print(f"DEBUG CRUD: Bulk delete request for {transaction_ids}")
    
    # Cascade delete for all selected transactions
    try:
        # Delete children
        db.query(models.Transaction).filter(models.Transaction.parent_id.in_(transaction_ids)).delete(synchronize_session=False)
        
        # Delete transactions
        result = db.query(models.Transaction).filter(models.Transaction.id.in_(transaction_ids)).delete(synchronize_session=False)
        db.commit()
        print(f"DEBUG CRUD: Bulk delete committed, {result} rows affected")
        return result
    except Exception as e:
        print(f"DEBUG CRUD: Bulk delete error: {e}")
        db.rollback()
        raise e

def create_credit_card(db: Session, card: schemas_transaction.CreditCardCreate, user_id: int, workspace_id: Optional[int] = None):
    db_card = models.CreditCard(**card.model_dump(), user_id=user_id, workspace_id=workspace_id)
    db.add(db_card)
    db.commit()
    db.refresh(db_card)
    return db_card

def get_credit_cards(db: Session, user_id: int, workspace_id: Optional[int] = None):
    query = db.query(models.CreditCard)
    if workspace_id:
        query = query.filter(models.CreditCard.workspace_id == workspace_id)
    else:
        query = query.filter(models.CreditCard.user_id == user_id)
    return query.all()

def delete_category(db: Session, category_id: int):
    category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if category:
        db.delete(category)
        db.commit()
    return category

from . import schemas_gains

def create_planned_income(db: Session, income: schemas_gains.PlannedIncomeCreate, user_id: int):
    db_income = models.PlannedIncome(**income.model_dump(), user_id=user_id)
    db.add(db_income)
    db.commit()
    db.refresh(db_income)
    return db_income

def get_dashboard_summary(db: Session, user_id: int, workspace_id: Optional[int] = None, month: Optional[int] = None, year: Optional[int] = None, interval: str = "monthly"):
    # Use current month/year if not specified
    now = datetime.now()
    target_month = month if month is not None else now.month
    target_year = year if year is not None else now.year
    
    # Calculate target date based on inputs
    # We use 00:00:00 as the base for all calculations to avoid filtering by current time
    try:
        target_date = datetime(target_year, target_month, 1, 0, 0, 0)
    except ValueError:
        target_date = datetime(target_year, target_month, 1, 0, 0, 0)

    # Determine Summary Period Range based on interval
    # This range applies to "Summary Cards" and "Category Breakdown"
    if interval == "monthly":
        period_start = target_date.replace(day=1)
        period_end = period_start + relativedelta(months=1) - timedelta(days=1)
    elif interval == "yearly":
        period_start = target_date.replace(month=1, day=1)
        period_end = target_date.replace(month=12, day=31)
    elif interval == "weekly":
        period_start = target_date - timedelta(days=target_date.weekday())
        period_end = period_start + timedelta(days=6)
    elif interval == "biweekly":
        period_start = target_date - timedelta(days=target_date.weekday())
        period_end = period_start + timedelta(days=13)
    else:
        # Default to monthly
        period_start = target_date.replace(day=1)
        period_end = period_start + relativedelta(months=1) - timedelta(days=1)

    print(f"DEBUG Dashboard: User={user_id}, Workspace={workspace_id}, Period={period_start} to {period_end}")

    # 1. Overall Totals for the specified PERIOD
    # Use < period_end + 1 day to ensure full month coverage on PostgreSQL
    next_month_start = period_end + timedelta(days=1)

    income_query = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.type == "income",
        models.Transaction.status == "paid",
        models.Transaction.date >= period_start,
        models.Transaction.date < next_month_start
    )
    expense_query = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.type == "expense",
        models.Transaction.status == "paid",
        models.Transaction.date >= period_start,
        models.Transaction.date < next_month_start
    )

    if workspace_id:
        income_query = income_query.filter(models.Transaction.workspace_id == workspace_id)
        expense_query = expense_query.filter(models.Transaction.workspace_id == workspace_id)
    else:
        income_query = income_query.filter(models.Transaction.user_id == user_id)
        expense_query = expense_query.filter(models.Transaction.user_id == user_id)

    # Explicit cast to float for PostgreSQL compatibility (Decimal -> float)
    income = float(income_query.scalar() or 0.0)
    expenses = float(expense_query.scalar() or 0.0)
    
    # 2. Trend Data Calculation (remains trend-focused context)
    income_trend = []
    expense_trend = []
    
    # Define range based on interval (centered on target date)
    points_before = 1
    points_after = 2
    
    ranges = []
    
    if interval == "monthly":
        # -3 months to +3 months
        for i in range(-points_before, points_after + 1):
            date_point = target_date + relativedelta(months=i)
            ranges.append({
                "label": date_point.strftime("%b %Y"), # Jan 2024
                "start": date_point.replace(day=1),
                "end": date_point.replace(day=1) + relativedelta(months=1) - timedelta(days=1)
            })
            
    elif interval == "yearly":
        # -2 years to +2 years (5 points total to keep it clean)
        for i in range(-2, 3):
            date_point = target_date + relativedelta(years=i)
            ranges.append({
                "label": date_point.strftime("%Y"),
                "start": date_point.replace(month=1, day=1),
                "end": date_point.replace(month=12, day=31)
            })
            
    elif interval == "weekly":
        # -3 weeks to +3 weeks
        start_of_current_week = target_date - timedelta(days=target_date.weekday())
        for i in range(-points_before, points_after + 1):
            week_start = start_of_current_week + timedelta(weeks=i)
            week_end = week_start + timedelta(days=6)
            ranges.append({
                "label": f"{week_start.strftime('%d/%m')} - {week_end.strftime('%d/%m')}",
                "start": week_start,
                "end": week_end
            })

    elif interval == "biweekly":
        # -3 biweeks to +3 biweeks (fortnights)
        start_of_current_period = target_date - timedelta(days=target_date.weekday())
        for i in range(-points_before, points_after + 1):
            period_start_range = start_of_current_period + timedelta(weeks=i*2)
            period_end_range = period_start_range + timedelta(days=13)
            ranges.append({
                "label": f"{period_start_range.strftime('%d/%m')} - {period_end_range.strftime('%d/%m')}",
                "start": period_start_range,
                "end": period_end_range
            })
    
    # Query data for each range
    for r in ranges:
        inc_q = db.query(func.sum(models.Transaction.amount)).filter(
            models.Transaction.type == "income",
            models.Transaction.status == "paid",
            models.Transaction.date >= r["start"],
            models.Transaction.date <= r["end"]
        )
        exp_q = db.query(func.sum(models.Transaction.amount)).filter(
            models.Transaction.type == "expense",
            models.Transaction.status == "paid",
            models.Transaction.date >= r["start"],
            models.Transaction.date <= r["end"]
        )
        
        if workspace_id:
            inc_q = inc_q.filter(models.Transaction.workspace_id == workspace_id)
            exp_q = exp_q.filter(models.Transaction.workspace_id == workspace_id)
        else:
            inc_q = inc_q.filter(models.Transaction.user_id == user_id)
            exp_q = exp_q.filter(models.Transaction.user_id == user_id)
            
        income_trend.append({"name": r["label"], "value": inc_q.scalar() or 0.0})
        expense_trend.append({"name": r["label"], "value": exp_q.scalar() or 0.0})

    
    # Category breakdown for current PERIOD (expenses only)
    category_query = db.query(
        models.Category.name,
        models.Category.icon,
        models.Category.budget_limit,
        func.sum(models.Transaction.amount).label('total')
    ).join(
        models.Transaction, models.Transaction.category_id == models.Category.id
    ).filter(
        models.Transaction.type == "expense",
        models.Transaction.status == "paid",
        models.Transaction.date >= period_start,
        models.Transaction.date <= period_end
    )
    
    if workspace_id:
        category_query = category_query.filter(models.Transaction.workspace_id == workspace_id)
    else:
        category_query = category_query.filter(models.Transaction.user_id == user_id)
    
    category_data = category_query.group_by(models.Category.name, models.Category.icon).all()
    
    category_breakdown = []
    total_expenses_for_percentage = float(sum([cat.total for cat in category_data]))
    
    for cat in category_data:
        percentage = (cat.total / total_expenses_for_percentage * 100) if total_expenses_for_percentage > 0 else 0
        category_breakdown.append({
            "name": cat.name,
            "value": cat.total,
            "percentage": round(percentage, 1),
            "limit": cat.budget_limit or 0.0,
            "icon": cat.icon
        })

    # Income Category Breakdown
    income_category_query = db.query(
        models.Category.name,
        models.Category.icon,
        models.Category.budget_limit,
        func.sum(models.Transaction.amount).label('total')
    ).join(
        models.Transaction, models.Transaction.category_id == models.Category.id
    ).filter(
        models.Transaction.type == "income",
        models.Transaction.status == "paid",
        models.Transaction.date >= period_start,
        models.Transaction.date <= period_end
    )
    
    if workspace_id:
        income_category_query = income_category_query.filter(models.Transaction.workspace_id == workspace_id)
    else:
        income_category_query = income_category_query.filter(models.Transaction.user_id == user_id)
        
    income_category_data = income_category_query.group_by(models.Category.name, models.Category.icon).all()
    
    income_category_breakdown = []
    total_income_for_percentage = float(sum([cat.total for cat in income_category_data]))
    
    for cat in income_category_data:
        percentage = (cat.total / total_income_for_percentage * 100) if total_income_for_percentage > 0 else 0
        income_category_breakdown.append({
            "name": cat.name,
            "value": cat.total,
            "percentage": round(percentage, 1),
            "limit": cat.budget_limit or 0.0,
            "icon": cat.icon
        })

    return {
        "total_balance": income - expenses,
        "total_income": income,
        "total_expenses": expenses,
        "income_trend": income_trend,
        "expense_trend": expense_trend,
        "category_breakdown": category_breakdown,
        "income_category_breakdown": income_category_breakdown
    }

def get_planned_incomes(db: Session, user_id: int, year: int, month: Optional[int] = None):
    query = db.query(models.PlannedIncome).filter(models.PlannedIncome.user_id == user_id, models.PlannedIncome.year == year)
    if month:
        query = query.filter(models.PlannedIncome.month == month)
    return query.all()

def get_categories(db: Session, user_id: int, workspace_id: Optional[int] = None):
    query = db.query(models.Category)
    if workspace_id:
        query = query.filter(models.Category.workspace_id == workspace_id)
    else:
        query = query.filter(models.Category.user_id == user_id)
    return query.all()

def create_user_category(db: Session, category: schemas_category.CategoryCreate, user_id: int, workspace_id: Optional[int] = None):
    db_category = models.Category(**category.model_dump(), user_id=user_id, workspace_id=workspace_id)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def update_user_category(db: Session, category_id: int, category: schemas_category.CategoryCreate):
    db_category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not db_category:
        return None
    
    for key, value in category.model_dump().items():
        setattr(db_category, key, value)
    
    db.commit()
    db.refresh(db_category)
    return db_category


def get_upcoming_transactions(db: Session, user_id: int, workspace_id: Optional[int] = None, limit: int = 10, month: Optional[int] = None, year: Optional[int] = None):
    # Use Coalesce to default to 'date' if 'due_date' is null
    effective_date = func.coalesce(models.Transaction.due_date, models.Transaction.date)
    
    query = db.query(models.Transaction).filter(
        models.Transaction.status == "pending"
    )
    
    if workspace_id:
        query = query.filter(models.Transaction.workspace_id == workspace_id)
    else:
        query = query.filter(models.Transaction.user_id == user_id)

    if month and year:
        # Filter by specific month and year using effective_date
        try:
            start_date = datetime(year, month, 1)
            # End date is start of next month
            end_date = start_date + relativedelta(months=1)
            query = query.filter(
                effective_date >= start_date,
                effective_date < end_date
            )
        except ValueError:
            pass # Invalid date, ignore filter
        
    return query.order_by(effective_date.asc()).limit(limit).all()

def settle_transaction(db: Session, transaction_id: int, user_id: int):
    db_transaction = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    if not db_transaction:
        return None
    
    # Permission check: User must be owner OR member of the workspace
    if db_transaction.user_id != user_id:
        if db_transaction.workspace_id:
            # Check if user is in the workspace
            is_member = db.query(models.UserWorkspace).filter(
                models.UserWorkspace.user_id == user_id,
                models.UserWorkspace.workspace_id == db_transaction.workspace_id
            ).first()
            if not is_member:
                return None
        else:
            # Personal transaction of another user
            return None

    if db_transaction.status == "paid":
        return db_transaction

    db_transaction.status = "paid"
    db_transaction.paid_at = datetime.now()
    
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

def get_workspace_settings(db: Session, workspace_id: int):
    settings = db.query(models.WorkspaceSettings).filter(models.WorkspaceSettings.workspace_id == workspace_id).first()
    if not settings:
        # Create default settings if not exist
        settings = models.WorkspaceSettings(workspace_id=workspace_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

def update_workspace_settings(db: Session, workspace_id: int, approval_threshold: Optional[float] = None, require_both_approval: Optional[bool] = None, monthly_savings_goal: Optional[float] = None):
    settings = db.query(models.WorkspaceSettings).filter(models.WorkspaceSettings.workspace_id == workspace_id).first()
    
    if not settings:
        settings = models.WorkspaceSettings(
            workspace_id=workspace_id,
            approval_threshold=approval_threshold if approval_threshold is not None else 500.0,
            require_both_approval=require_both_approval if require_both_approval is not None else False,
            monthly_savings_goal=monthly_savings_goal if monthly_savings_goal is not None else 5000.0
        )
        db.add(settings)
    else:
        if approval_threshold is not None:
            settings.approval_threshold = approval_threshold
        if require_both_approval is not None:
            settings.require_both_approval = require_both_approval
        if monthly_savings_goal is not None:
            settings.monthly_savings_goal = monthly_savings_goal
            
    db.commit()
    db.refresh(settings)
    return settings

# ==================== JOINT GOALS ====================

def create_joint_goal(db: Session, title: str, target_amount: float, workspace_id: int, description: Optional[str] = None, deadline: Optional[datetime] = None):
    db_goal = models.JointGoal(
        title=title,
        target_amount=target_amount,
        workspace_id=workspace_id,
        description=description,
        deadline=deadline
    )
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal

def get_joint_goals(db: Session, workspace_id: int):
    return db.query(models.JointGoal).filter(models.JointGoal.workspace_id == workspace_id).all()

def update_joint_goal_progress(db: Session, goal_id: int, amount: float):
    goal = db.query(models.JointGoal).filter(models.JointGoal.id == goal_id).first()
    if not goal:
        return None
    goal.current_amount = amount
    db.commit()
    db.refresh(goal)
    return goal

def delete_joint_goal(db: Session, goal_id: int):
    goal = db.query(models.JointGoal).filter(models.JointGoal.id == goal_id).first()
    if not goal:
        return None
    db.delete(goal)
    db.commit()
    return goal


