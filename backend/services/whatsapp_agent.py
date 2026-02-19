import re
from sqlalchemy.orm import Session
from datetime import datetime
from .. import models, crud, schemas_transaction
from ..smart_categorization import categorizer


class WhatsappAgent:
    """
    Agente inteligente para WhatsApp do FinControl Pro.

    Comandos suportados:
        Despesas:  "gastei 50 no uber", "paguei 120 luz", "comprei 30 farmacia"
        Receitas:  "recebi 3000 salario", "ganhei 150 freelance"
        Saldo:     "saldo", "resumo"
        Últimas:   "ultimas", "últimas", "historico"
        Meta:      "meta"
        Categorias: "categorias", "minhas categorias"
        Ajuda:     "ajuda", "help", "menu", "oi", "olá"
        Desfazer:  "desfazer", "cancelar ultimo"
    """

    HELP_TEXT = (
        "🤖 *FinControl Pro — Assistente WhatsApp*\n\n"
        "📝 *Registrar Despesa:*\n"
        "   _Gastei 50 no Uber_\n"
        "   _Paguei 120 conta de luz_\n"
        "   _Comprei 30 farmácia_\n"
        "   _85,90 mercado_\n\n"
        "💰 *Registrar Receita:*\n"
        "   _Recebi 3000 salário_\n"
        "   _Ganhei 150 freelance_\n\n"
        "📊 *Consultas:*\n"
        "   *saldo* — Resumo do mês atual\n"
        "   *ultimas* — Últimas 5 transações\n"
        "   *meta* — Progresso da meta de economia\n"
        "   *categorias* — Suas categorias\n\n"
        "↩️ *Desfazer:*\n"
        "   *desfazer* — Cancela última transação\n\n"
        "❓ *ajuda* — Este menu"
    )

    def __init__(self, db: Session, user: models.User, workspace_id: int):
        self.db = db
        self.user = user
        self.workspace_id = workspace_id

    def process_message(self, message: str) -> str:
        """Main entry point for processing a WhatsApp message."""
        msg = message.strip()
        msg_lower = msg.lower().strip()

        # --- COMMAND ROUTING ---

        # Help / Greeting
        if msg_lower in ("ajuda", "help", "menu", "oi", "olá", "ola", "hey", "bom dia", "boa tarde", "boa noite", "oi!"):
            return self.HELP_TEXT

        # Balance
        if msg_lower in ("saldo", "resumo", "balanço", "balanco"):
            return self._get_balance()

        # Recent transactions
        if msg_lower in ("ultimas", "últimas", "historico", "histórico", "extrato", "recentes"):
            return self._get_recent_transactions()

        # Savings goal
        if msg_lower in ("meta", "metas", "objetivo"):
            return self._get_savings_goal()

        # Categories
        if msg_lower in ("categorias", "minhas categorias", "cats"):
            return self._get_categories()

        # Undo
        if msg_lower in ("desfazer", "cancelar", "cancelar ultimo", "cancelar última", "anular"):
            return self._undo_last_transaction()

        # --- TRANSACTION PARSING ---

        # Patterns for expenses
        # "gastei 50 no uber", "paguei 120,50 na luz", "comprei 30 farmacia"
        expense_keywords = r"(?:gastei|paguei|comprei|compra|pago)"
        expense_match = re.match(
            rf"^{expense_keywords}\s+R?\$?\s*(\d+(?:[.,]\d{{1,2}})?)\s*(?:no|na|em|com|de|do|da|pra|pro|para)?\s*(.*)",
            msg_lower
        )

        if expense_match:
            return self._create_transaction(
                amount_str=expense_match.group(1),
                description=expense_match.group(2),
                tx_type="expense"
            )

        # Patterns for income
        # "recebi 3000 salario", "ganhei 150 de freelance"
        income_keywords = r"(?:recebi|ganhei|entrada|entrou)"
        income_match = re.match(
            rf"^{income_keywords}\s+R?\$?\s*(\d+(?:[.,]\d{{1,2}})?)\s*(?:de|do|da|via|por)?\s*(.*)",
            msg_lower
        )

        if income_match:
            return self._create_transaction(
                amount_str=income_match.group(1),
                description=income_match.group(2),
                tx_type="income"
            )

        # Fallback pattern: just a number + description (treated as expense)
        # "50 uber", "120,90 mercado", "R$ 45 almoço"
        simple_match = re.match(
            r"^R?\$?\s*(\d+(?:[.,]\d{1,2})?)\s+(.+)",
            msg_lower
        )

        if simple_match:
            return self._create_transaction(
                amount_str=simple_match.group(1),
                description=simple_match.group(2),
                tx_type="expense"
            )

        # Nothing matched
        return (
            "🤔 Não entendi sua mensagem.\n\n"
            "Tente algo como:\n"
            "• _Gastei 50 no Uber_\n"
            "• _Recebi 3000 salário_\n"
            "• _Saldo_\n\n"
            "Digite *ajuda* para ver todos os comandos."
        )

    # ─────────────────────────────────────────────
    # TRANSACTION CREATION
    # ─────────────────────────────────────────────

    def _create_transaction(self, amount_str: str, description: str, tx_type: str) -> str:
        """Create a transaction from parsed message data."""
        # Parse amount
        amount_str = amount_str.replace(",", ".")
        try:
            amount = float(amount_str)
            if amount <= 0:
                return "⚠️ O valor precisa ser maior que zero."
        except ValueError:
            return "⚠️ Não consegui entender o valor. Use formato: 50 ou 50,90"

        # Clean description
        description = description.strip()
        if not description:
            description = "Despesa via WhatsApp" if tx_type == "expense" else "Receita via WhatsApp"
        else:
            # Capitalize first letter
            description = description[0].upper() + description[1:]

        # Auto categorize
        category_name = categorizer.predict(description, tx_type)
        category_id = categorizer.find_category_id(
            self.db, self.user.id, category_name, self.workspace_id
        )

        # Create transaction
        now = datetime.now()
        transaction_data = schemas_transaction.TransactionCreate(
            amount=amount,
            description=description,
            date=now,
            type=tx_type,
            category_id=category_id,
            payment_method="Outros",
            status="paid",
            paid_at=now
        )

        crud.create_user_transaction(
            db=self.db,
            transaction=transaction_data,
            user_id=self.user.id,
            workspace_id=self.workspace_id
        )

        # Build response
        type_emoji = "🔴" if tx_type == "expense" else "🟢"
        type_label = "Despesa" if tx_type == "expense" else "Receita"
        cat_label = f"📂 {category_name}" if category_id else f"📂 {category_name} _(sugerida)_"

        return (
            f"{type_emoji} *{type_label} registrada!*\n\n"
            f"💵 *Valor:* R$ {amount:,.2f}\n"
            f"📝 *Descrição:* {description}\n"
            f"{cat_label}\n"
            f"📅 *Data:* {now.strftime('%d/%m/%Y %H:%M')}\n\n"
            f"_Digite *desfazer* para cancelar._"
        )

    # ─────────────────────────────────────────────
    # BALANCE / SUMMARY
    # ─────────────────────────────────────────────

    def _get_balance(self) -> str:
        """Get current month balance summary."""
        now = datetime.now()
        first_day = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        query = self.db.query(models.Transaction).filter(
            models.Transaction.date >= first_day,
            models.Transaction.date <= now,
        )

        if self.workspace_id:
            query = query.filter(models.Transaction.workspace_id == self.workspace_id)
        else:
            query = query.filter(models.Transaction.user_id == self.user.id)

        transactions = query.all()

        income = sum(t.amount for t in transactions if t.type == "income")
        expense = sum(t.amount for t in transactions if t.type == "expense")
        balance = income - expense
        tx_count = len(transactions)

        # Balance emoji
        balance_emoji = "📈" if balance >= 0 else "📉"

        # Month name in Portuguese
        months_pt = [
            "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
        ]
        month_name = months_pt[now.month]

        return (
            f"💰 *Resumo de {month_name}/{now.year}*\n\n"
            f"🟢 Receitas: R$ {income:,.2f}\n"
            f"🔴 Despesas: R$ {expense:,.2f}\n"
            f"{balance_emoji} *Saldo: R$ {balance:,.2f}*\n\n"
            f"📊 Total de {tx_count} transações no mês."
        )

    # ─────────────────────────────────────────────
    # RECENT TRANSACTIONS
    # ─────────────────────────────────────────────

    def _get_recent_transactions(self) -> str:
        """Get the last 5 transactions."""
        query = self.db.query(models.Transaction)

        if self.workspace_id:
            query = query.filter(models.Transaction.workspace_id == self.workspace_id)
        else:
            query = query.filter(models.Transaction.user_id == self.user.id)

        transactions = query.order_by(models.Transaction.date.desc()).limit(5).all()

        if not transactions:
            return "📭 Nenhuma transação encontrada ainda."

        lines = ["📋 *Últimas 5 transações:*\n"]

        for t in transactions:
            emoji = "🔴" if t.type == "expense" else "🟢"
            date_str = t.date.strftime("%d/%m") if t.date else "—"
            lines.append(
                f"{emoji} {date_str} — {t.description} — R$ {t.amount:,.2f}"
            )

        return "\n".join(lines)

    # ─────────────────────────────────────────────
    # SAVINGS GOAL
    # ─────────────────────────────────────────────

    def _get_savings_goal(self) -> str:
        """Show progress towards monthly savings goal."""
        if not self.workspace_id:
            return "⚠️ Configure um workspace para usar metas."

        settings = self.db.query(models.WorkspaceSettings).filter(
            models.WorkspaceSettings.workspace_id == self.workspace_id
        ).first()

        if not settings or not settings.monthly_savings_goal or settings.monthly_savings_goal <= 0:
            return (
                "🎯 Nenhuma meta de economia definida.\n\n"
                "Acesse as *Configurações* no site para definir sua meta mensal."
            )

        goal = settings.monthly_savings_goal

        # Calculate current month savings
        now = datetime.now()
        first_day = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        query = self.db.query(models.Transaction).filter(
            models.Transaction.date >= first_day,
            models.Transaction.date <= now,
        )
        if self.workspace_id:
            query = query.filter(models.Transaction.workspace_id == self.workspace_id)

        transactions = query.all()
        income = sum(t.amount for t in transactions if t.type == "income")
        expense = sum(t.amount for t in transactions if t.type == "expense")
        saved = income - expense

        percentage = min((saved / goal) * 100, 100) if goal > 0 else 0
        remaining = max(goal - saved, 0)

        # Progress bar
        filled = int(percentage / 10)
        bar = "▓" * filled + "░" * (10 - filled)

        status_emoji = "🎉" if percentage >= 100 else "💪" if percentage >= 50 else "🏃"

        return (
            f"🎯 *Meta de Economia Mensal*\n\n"
            f"Meta: R$ {goal:,.2f}\n"
            f"Economizado: R$ {saved:,.2f}\n"
            f"Faltam: R$ {remaining:,.2f}\n\n"
            f"[{bar}] {percentage:.0f}%\n\n"
            f"{status_emoji} {'Meta atingida! Parabéns!' if percentage >= 100 else f'Continue assim! Faltam R$ {remaining:,.2f}'}"
        )

    # ─────────────────────────────────────────────
    # CATEGORIES
    # ─────────────────────────────────────────────

    def _get_categories(self) -> str:
        """List user's categories."""
        categories = self.db.query(models.Category).filter(
            models.Category.user_id == self.user.id
        ).all()

        if not categories:
            return "📂 Nenhuma categoria criada ainda.\nCrie categorias no site para uma melhor organização."

        expense_cats = [c for c in categories if c.type == "expense"]
        income_cats = [c for c in categories if c.type == "income"]

        lines = ["📂 *Suas Categorias:*\n"]

        if expense_cats:
            lines.append("🔴 *Despesas:*")
            for c in expense_cats:
                budget = f" (Limite: R$ {c.budget_limit:,.2f})" if c.budget_limit and c.budget_limit > 0 else ""
                lines.append(f"   • {c.name}{budget}")

        if income_cats:
            lines.append("\n🟢 *Receitas:*")
            for c in income_cats:
                lines.append(f"   • {c.name}")

        return "\n".join(lines)

    # ─────────────────────────────────────────────
    # UNDO LAST TRANSACTION
    # ─────────────────────────────────────────────

    def _undo_last_transaction(self) -> str:
        """Delete the most recent transaction created by this user."""
        query = self.db.query(models.Transaction)

        if self.workspace_id:
            query = query.filter(
                models.Transaction.workspace_id == self.workspace_id,
                models.Transaction.created_by_user_id == self.user.id
            )
        else:
            query = query.filter(models.Transaction.user_id == self.user.id)

        last_tx = query.order_by(models.Transaction.id.desc()).first()

        if not last_tx:
            return "📭 Nenhuma transação para desfazer."

        description = last_tx.description
        amount = last_tx.amount
        tx_type = "Despesa" if last_tx.type == "expense" else "Receita"

        self.db.delete(last_tx)
        self.db.commit()

        return (
            f"↩️ *Transação desfeita!*\n\n"
            f"Removida: {tx_type} de R$ {amount:,.2f}\n"
            f"Descrição: _{description}_"
        )
