from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    role = Column(String, default="individual") # individual, business, admin
    display_color = Column(String, default="#3b82f6")  # User's badge color
    avatar_emoji = Column(String, default="👤")  # User's emoji
    phone_number = Column(String, unique=True, nullable=True, index=True) # WhatsApp number

    transactions = relationship("Transaction", foreign_keys="Transaction.user_id", back_populates="owner")
    categories = relationship("Category", back_populates="owner")
    bills = relationship("Bill", back_populates="owner")
    workspaces = relationship("UserWorkspace", back_populates="user")
    created_transactions = relationship("Transaction", foreign_keys="Transaction.created_by_user_id", back_populates="created_by")

class Workspace(Base):
    __tablename__ = "workspaces"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    type = Column(String) # personal, family, business
    created_at = Column(DateTime, default=datetime.now)

    members = relationship("UserWorkspace", back_populates="workspace")
    categories = relationship("Category", back_populates="workspace")
    transactions = relationship("Transaction", back_populates="workspace")
    bills = relationship("Bill", back_populates="workspace")
    joint_goals = relationship("JointGoal", back_populates="workspace")
    settings = relationship("WorkspaceSettings", back_populates="workspace", uselist=False)
    monthly_goals = relationship("MonthlyFinancialGoal", back_populates="workspace")
    # cost_centers = relationship("CostCenter", back_populates="workspace") # REMOVED

class UserWorkspace(Base):
    __tablename__ = "user_workspaces"
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), primary_key=True)
    role = Column(String) # owner, admin, member, observer
    status = Column(String, default="active") # active, pending

    user = relationship("User", back_populates="workspaces")
    workspace = relationship("Workspace", back_populates="members")



class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    type = Column(String) # income, expense
    color = Column(String, default="#000000")
    icon = Column(String, nullable=True) # Icon name (e.g., "Home", "Car")
    budget_limit = Column(Float, default=0.0)
    user_id = Column(Integer, ForeignKey("users.id"))
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=True)

    owner = relationship("User", back_populates="categories")
    workspace = relationship("Workspace", back_populates="categories")
    transactions = relationship("Transaction", back_populates="category_rel")
    
class Bill(Base):
    __tablename__ = "bills"
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float)
    description = Column(String)
    due_date = Column(DateTime)
    type = Column(String) # payable / receivable
    status = Column(String, default="pending") # pending, paid, overdue
    is_recurring = Column(Boolean, default=False)
    settled_at = Column(DateTime, nullable=True)
    
    category_id = Column(Integer, ForeignKey("categories.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=True)

    owner = relationship("User", back_populates="bills")
    workspace = relationship("Workspace", back_populates="bills")
    category = relationship("Category")

class CreditCard(Base):
    __tablename__ = "credit_cards"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    closing_day = Column(Integer)
    due_day = Column(Integer)
    user_id = Column(Integer, ForeignKey("users.id"))
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=True)

    owner = relationship("User")
    workspace = relationship("Workspace")
    transactions = relationship("Transaction", back_populates="credit_card")

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float)
    description = Column(String)
    date = Column(DateTime)
    category_id = Column(Integer, ForeignKey("categories.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=True)
    # cost_center_id = Column(Integer, ForeignKey("cost_centers.id"), nullable=True) # REMOVED
    type = Column(String) # income or expense
    payment_method = Column(String, default="Credit Card")
    tags = Column(String, nullable=True) # Workaround for SQLite lack of JSON array
    location = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.now)
    
    # User Identification for Couples
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Who created it
    is_joint = Column(Boolean, default=False)  # Joint expense flag
    
    # Status for Bills/Scheduled Transactions
    status = Column(String, default="paid") # paid, pending, overdue, pending_approval
    paid_at = Column(DateTime, nullable=True)
    due_date = Column(DateTime, nullable=True) # For pending transactions (bills)
    
    # Recurrence & Installments
    is_recurring = Column(Boolean, default=False)
    recurrence_period = Column(String, nullable=True) # daily, weekly, monthly, yearly
    recurrence_end_date = Column(DateTime, nullable=True)
    installment_count = Column(Integer, default=1)
    installment_number = Column(Integer, default=1)
    parent_id = Column(Integer, ForeignKey("transactions.id"), nullable=True)
    credit_card_id = Column(Integer, ForeignKey("credit_cards.id"), nullable=True)

    owner = relationship("User", foreign_keys=[user_id], back_populates="transactions")
    workspace = relationship("Workspace", back_populates="transactions")
    category_rel = relationship("Category", back_populates="transactions")
    # cost_center = relationship("CostCenter", back_populates="transactions") # REMOVED
    # approval = relationship("ExpenseApproval", back_populates="transaction", uselist=False) # REMOVED
    credit_card = relationship("CreditCard", back_populates="transactions")
    created_by = relationship("User", foreign_keys=[created_by_user_id], back_populates="created_transactions")
    
    # Relationship to children (installments)
    parent = relationship("Transaction", remote_side=[id], back_populates="children")
    children = relationship("Transaction", back_populates="parent")

class PlannedIncome(Base):
    __tablename__ = "planned_incomes"
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float)
    description = Column(String)
    month = Column(Integer) # 1-12
    year = Column(Integer)
    category_id = Column(Integer, ForeignKey("categories.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    is_recurring = Column(Boolean, default=False)
    
    owner = relationship("User")
    category = relationship("Category")

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    content = Column(String)
    type = Column(String) # invite, system
    link_id = Column(Integer, nullable=True) # workspace_id for invites
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now)

    user = relationship("User")

class JointGoal(Base):
    __tablename__ = "joint_goals"
    
    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"))
    title = Column(String)
    description = Column(String, nullable=True)
    target_amount = Column(Float)
    current_amount = Column(Float, default=0.0)
    deadline = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.now)
    
    # Relationships
    workspace = relationship("Workspace", back_populates="joint_goals")

class ApprovalRequest(Base):
    __tablename__ = "approval_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"))
    requested_by_user_id = Column(Integer, ForeignKey("users.id"))
    approver_user_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="pending")  # pending, approved, rejected
    created_at = Column(DateTime, default=datetime.now)
    responded_at = Column(DateTime, nullable=True)
    
    # Relationships
    transaction = relationship("Transaction")
    requested_by = relationship("User", foreign_keys=[requested_by_user_id])
    approver = relationship("User", foreign_keys=[approver_user_id])

class WorkspaceSettings(Base):
    __tablename__ = "workspace_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), unique=True)
    approval_threshold = Column(Float, default=500.0)  # Require approval above this
    require_both_approval = Column(Boolean, default=False)
    monthly_savings_goal = Column(Float, default=5000.0) # Goal for Financial Health

    
    workspace = relationship("Workspace", back_populates="settings")

# ==================== INVESTMENTS ====================

class InvestmentAsset(Base):
    """Individual investment asset (stock, crypto, bond, etc.)"""
    __tablename__ = "investment_assets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    workspace_id = Column(Integer, ForeignKey('workspaces.id'), nullable=True)
    
    # Asset identification
    symbol = Column(String)  # AAPL, BTC-USD, LTN-2025, etc.
    name = Column(String)
    asset_type = Column(String)  # stock, crypto, bond, fund, reit
    market = Column(String, default="BR")  # US, BR, CRYPTO
    sector = Column(String, nullable=True)  # Technology, Finance, etc.
    dividend_yield = Column(Float, default=0.0)
    
    # Purchase info
    quantity = Column(Float, default=0.0)
    average_price = Column(Float, default=0.0)
    
    # Current data (cached from API)
    current_price = Column(Float, nullable=True)
    last_updated = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.now)

    # Relationships
    user = relationship("User")
    workspace = relationship("Workspace")
    transactions = relationship("InvestmentTransaction", back_populates="asset", cascade="all, delete-orphan")
    alerts = relationship("PriceAlert", back_populates="asset", cascade="all, delete-orphan")

class InvestmentTransaction(Base):
    """Buy/sell transactions for investments"""
    __tablename__ = "investment_transactions"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey('investment_assets.id'))
    
    transaction_type = Column(String)  # buy, sell, dividend
    quantity = Column(Float)
    price = Column(Float)
    total_value = Column(Float)
    fees = Column(Float, default=0.0)
    broker = Column(String, nullable=True)  # Name of the brokerage firm
    date = Column(DateTime, default=datetime.now)
    notes = Column(String, nullable=True)

    # Relationships
    asset = relationship("InvestmentAsset", back_populates="transactions")

class PriceAlert(Base):
    """Price alerts for assets"""
    __tablename__ = "price_alerts"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey('investment_assets.id'))
    user_id = Column(Integer, ForeignKey('users.id'))
    
    alert_type = Column(String)  # price_target, percent_change
    target_value = Column(Float, nullable=True) # Price target or % change
    condition = Column(String)  # above, below
    is_active = Column(Boolean, default=True)
    triggered_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.now)

    # Relationships
    asset = relationship("InvestmentAsset", back_populates="alerts")
    user = relationship("User")

class MonthlyFinancialGoal(Base):
    __tablename__ = "monthly_financial_goals"
    
    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"))
    month = Column(Integer) # 1-12
    year = Column(Integer)
    target_amount = Column(Float)
    created_at = Column(DateTime, default=datetime.now)

    workspace = relationship("Workspace", back_populates="monthly_goals")
