import re
from sqlalchemy.orm import Session
from datetime import datetime
from .. import models, crud, schemas_transaction
from ..smart_categorization import categorizer

class WhatsappAgent:
    def __init__(self, db: Session, user: models.User, workspace_id: int):
        self.db = db
        self.user = user
        self.workspace_id = workspace_id

    def process_message(self, message: str) -> str:
        message = message.lower().strip()

        # Regex Patterns
        # Ex: "gastei 50 no uber", "gastei 50,00 almoço", "50 reais uber"
        expense_pattern = r"(gastei|paguei|compra)?\s*R?\$?\s*(\d+([.,]\d{2})?)\s*(no|na|em|com)?\s*(.*)"
        
        # Ex: "recebi 100", "ganhei 50 pix"
        income_pattern = r"(recebi|ganhei|entrada)?\s*R?\$?\s*(\d+([.,]\d{2})?)\s*(de|do|via)?\s*(.*)"

        # Check for commands
        if "saldo" in message or "resumo" in message:
            return self._get_balance()
        
        # Try processing as Expense (default if just number + text, or specific keywords)
        if "gastei" in message or "paguei" in message or "compra" in message:
            match = re.search(expense_pattern, message)
            if match:
                return self._create_transaction(match, "expense")
        
        # Try processing as Income
        if "recebi" in message or "ganhei" in message:
            match = re.search(income_pattern, message)
            if match:
                return self._create_transaction(match, "income")

        # Fallback: Message doesn't match known patterns
        return "Desculpe, não entendi. Tente: 'Gastei 50 no Uber' ou 'Recebi 100 de Pix' ou 'Saldo'."

    def _create_transaction(self, match, type_str: str) -> str:
        # Groups: 2 is amount, 5 is description
        amount_str = match.group(2).replace(',', '.')
        description = match.group(5).strip()
        
        if not description:
            description = "Despesa WhatsApp" if type_str == 'expense' else "Receita WhatsApp"

        try:
            amount = float(amount_str)
        except ValueError:
            return "Não consegui entender o valor."

        # Auto-categorize
        category_name = categorizer.predict(description)
        # Find category ID (simplified: fetch all and match name, or use default)
        # ideally we should have a utility to get-or-create category by name
        # For now, let's use a simple lookup or None
        
        # Create Transaction
        transaction_data = schemas_transaction.TransactionCreate(
            amount=amount,
            description=description,
            date=datetime.now(),
            type=type_str,
            category_id=None, # To be improved with real lookup
            payment_method="Outros",
            status="paid",
            paid_at=datetime.now()
        )
        
        crud.create_user_transaction(
            db=self.db, 
            transaction=transaction_data, 
            user_id=self.user.id,
            workspace_id=self.workspace_id
        )
        
        type_label = "Despesa" if type_str == "expense" else "Receita"
        return f"✅ {type_label} de R$ {amount:.2f} ('{description}') salva com sucesso! Categoria sugerida: {category_name}"

    def _get_balance(self) -> str:
        # Simple balance calculation for current month
        # This would require a crud method for balance or just sum transactions
        # Re-using existing logic or simple query
        txs = crud.get_transactions(self.db, self.user.id, self.workspace_id, skip=0, limit=1000)
        
        income = sum(t.amount for t in txs if t.type == 'income')
        expense = sum(t.amount for t in txs if t.type == 'expense')
        balance = income - expense
        
        return f"💰 Resumo:\nReceitas: R$ {income:.2f}\nDespesas: R$ {expense:.2f}\nSaldo: R$ {balance:.2f}"
