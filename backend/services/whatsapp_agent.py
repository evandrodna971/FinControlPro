import re
import logging
import random
from sqlalchemy.orm import Session
from datetime import datetime
from .. import models, crud, schemas_transaction
from ..smart_categorization import categorizer, normalize as from_smart_categorization_normalize

# Configure logger
logger = logging.getLogger(__name__)


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
        "🤖 *FinControl Pro — Assistente Inteligente*\n\n"
        "Posso registrar seus gastos e ganhos apenas conversando! Veja como:\n\n"
        "📝 *Registrar Transações:*\n"
        "• _Gastei 50 no Uber_ (Hoje, Pago)\n"
        "• _Vou pagar 150 Internet dia 10/03_ (Agendado, Pendente)\n"
        "• _Recebi 3500 salário ontem_ (Data retroativa)\n"
        "• _20 mercado_ (Atalho rápido para despesa)\n\n"
        "📊 *Consultas Rápidas:*\n"
        "• *saldo* — Resumo financeiro do mês atual\n"
        "• *ultimas* — Lista os últimos 5 registros\n"
        "• *meta* — Progresso da sua meta de economia\n"
        "• *categorias* — Ver suas categorias organizadas\n\n"
        "⚙️ *Comandos de Controle:*\n"
        "• *desfazer* — Apaga o último registro enviado\n"
        "• *ajuda* — Mostra este menu novamente\n\n"
        "💡 *Dica:* Eu entendo datas como 'ontem', 'amanhã' e formatos como '25/02'. Também percebo se você já pagou ou se vai pagar no futuro!"
    )

    def __init__(self, db: Session, user: models.User, workspace_id: int):
        self.db = db
        self.user = user
        self.workspace_id = workspace_id

    def process_message(self, message: str) -> str:
        """Main entry point for processing a WhatsApp message."""
        msg = message.strip()
        # Normalize: lowercase and remove accents for command matching
        msg_normalized = from_smart_categorization_normalize(msg)
        msg_lower = msg_normalized # Keep original name for compatibility with existing code

        # --- TIME & STATUS DETECTION ---
        # Look for future indicators: verbs in future or intent
        future_regex = r"(?:vou|irei|planejo|agendar|agendado[oa]?|vencimento|para|pro|previsto[oa]?|a pagar|a receber|amanh[aã]|amanha|boleto)"
        is_future = bool(re.search(future_regex, msg_lower))
        
        # Immediate indicators of "paid/received" status: past verbs or confirmation
        paid_regex = r"(?:paguei|recebi|gastei|ja|concluido|feito|pago|recebido|quitado|liquidado|hoje|ontem)"
        is_paid_explicit = bool(re.search(paid_regex, msg_lower))

        # Payment Methods
        payment_methods = {
            "pix": "Pix",
            "cartao": "Cartão",
            "transferencia": "Transferência",
            "boleto": "Boleto",
            "dinheiro": "Dinheiro",
            "debito": "Débito",
            "credito": "Crédito"
        }
        detected_payment_method = "Outros"
        for key, val in payment_methods.items():
            if key in msg_normalized:
                detected_payment_method = val
                break

        # Decision: If explicitly future verbs are used, it's pending unless explicitly confirmed as paid
        if is_future and not is_paid_explicit:
            status = "pending"
        elif is_paid_explicit:
            status = "paid"
        else:
            # Words like "pendente", "aberto", "devendo" always mean pending regardless of other words
            if re.search(r"(?:pendente|aberto|devendo|conta)", msg_lower):
                status = "pending"
            else:
                status = "paid" # Default for "50 uber"

        # --- DATE EXTRACTION ---
        target_date = datetime.now()
        # Look for DD/MM or DD/MM/YYYY (handles spaces around the slash/dash)
        date_match = re.search(r"(\d{1,2})\s*[/-]\s*(\d{1,2})(?:\s*[/-]\s*(\d{2,4}))?", msg)
        if date_match:
            day = int(date_match.group(1))
            month = int(date_match.group(2))
            year = int(date_match.group(3)) if date_match.group(3) else target_date.year
            # Basic validation
            try:
                if year < 100: year += 2000 # Handle 2-digit year
                target_date = target_date.replace(day=day, month=month, year=year)
            except ValueError:
                pass # Invalid date, keep current
        elif "amanha" in msg_normalized:
            from datetime import timedelta
            target_date += timedelta(days=1)
        elif "ontem" in msg_normalized:
            from datetime import timedelta
            target_date -= timedelta(days=1)

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

        # Verbs that can prefix a transaction command (optional)
        verb_prefixes = r"(?:vou|irei|quero|queria|planejo|agendar|agendado[oa]?|preciso|devo|tenho que)?\s*"

        # Patterns for expenses
        # "gastei 50 no uber", "vou pagar 120 luz", "pagar 30 farmacia"
        expense_keywords = r"(?:gastei|paguei|pagar|comprei|compra|pago|gastos|despesa|debito|debitei)"
        expense_match = re.match(
            rf"^{verb_prefixes}({expense_keywords})\s+R?\$?\s*(\d+(?:[.,]\d{{1,2}})?)\s*(?:no|na|em|com|de|do|da|pra|pro|para|at[eé]|no\(a\))?\s*(.*)",
            msg_lower
        )

        if expense_match:
            return self._create_transaction(
                amount_str=expense_match.group(2),
                description=expense_match.group(3),
                tx_type="expense",
                status=status,
                custom_date=target_date,
                payment_method=detected_payment_method
            )

        # Patterns for income
        # "recebi 3000 salario", "vou receber 150 freelance"
        income_keywords = r"(?:recebi|receber|ganhei|ganhar|entrada|entrou|ganho|receita|pix|credito|creditei)"
        income_match = re.match(
            rf"^{verb_prefixes}({income_keywords})\s+R?\$?\s*(\d+(?:[.,]\d{{1,2}})?)\s*(?:de|do|da|via|por|no|na)?\s*(.*)",
            msg_lower
        )

        if income_match:
            return self._create_transaction(
                amount_str=income_match.group(2),
                description=income_match.group(3),
                tx_type="income",
                status=status,
                custom_date=target_date,
                payment_method=detected_payment_method
            )

        # Fallback pattern: just a number + description (treated as expense)
        # "50 uber", "vou pagar 120,90 mercado", "R$ 45 almoço"
        simple_match = re.match(
            rf"^{verb_prefixes}R?\$?\s*(\d+(?:[.,]\d{{1,2}})?)\s+(.+)",
            msg_lower
        )

        if simple_match:
            # If it captures a future verb but no explicit income/expense keyword, we treat as expense
            return self._create_transaction(
                amount_str=simple_match.group(1),
                description=simple_match.group(2),
                tx_type="expense",
                status=status,
                custom_date=target_date,
                payment_method=detected_payment_method
            )

        # Nothing matched
        return (
            "🤔 Não consegui entender seu comando.\n\n"
            "Tente registrar assim:\n"
            "• _Gastei 50 no Uber_\n"
            "• _Recebi 3000 salário_\n"
            "• _50 mercado_\n\n"
            "Ou digite *ajuda* para ver todas as opções."
        )

    # ─────────────────────────────────────────────
    # TRANSACTION CREATION
    # ─────────────────────────────────────────────

    def _create_transaction(self, amount_str: str, description: str, tx_type: str, status: str = "paid", custom_date=None, payment_method: str = "Outros") -> str:
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
        
        # Remove "reais" or "real" if it's the first word after the amount
        description = re.sub(r"^(?:reais|real)\s*", "", description, flags=re.IGNORECASE).strip()
        
        # Remove relative date keywords (ontem, hoje, amanha)
        description = re.sub(r"\b(ontem|hoje|amanhã|amanha)\b", "", description, flags=re.IGNORECASE).strip()

        # Remove payment methods from description
        description = re.sub(r"\b(pix|cartão|cartao|tranferencia|transferencia|boleto|dinheiro|debito|débito|credito|crédito)\b", "", description, flags=re.IGNORECASE).strip()

        # Remove date mention if it's trailing like "dia 22/03", "para 25/02", "p/ 30/01"
        description = re.sub(r"\s+(?:no dia|dia|para|pro|p/|em)?\s*\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?$", "", description, flags=re.IGNORECASE).strip()

        # Extra cleanup: double spaces and common connecting words at the end
        description = re.sub(r"\s+", " ", description)
        description = re.sub(r"\s+(?:no|na|de|do|da|com|por|via|em)$", "", description, flags=re.IGNORECASE).strip()

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

        # If category does not exist, create it auto
        if not category_id:
            logger.info(f"Category '{category_name}' not found for user {self.user.id}. Creating it.")
            
            # Get default icon from rules
            cat_data = categorizer.rules.get(category_name, {})
            icon = cat_data.get("icon", "MoreHorizontal")
            
            # Random color generator
            colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"]
            rand_color = random.choice(colors)

            new_cat = models.Category(
                name=category_name,
                type=tx_type,
                user_id=self.user.id,
                workspace_id=self.workspace_id,
                color=rand_color,
                icon=icon
            )
            self.db.add(new_cat)
            self.db.commit()
            self.db.refresh(new_cat)
            category_id = new_cat.id

        # Create transaction
        now = datetime.now()
        tx_date = custom_date if custom_date else now
        
        transaction_data = schemas_transaction.TransactionCreate(
            amount=amount,
            description=description,
            date=tx_date,
            type=tx_type,
            category_id=category_id,
            payment_method=payment_method,
            status=status,
            paid_at=tx_date if status == "paid" else None
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
            f"📅 *Data:* {tx_date.strftime('%d/%m/%Y %H:%M')}\n\n"
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

        transactions = query.order_by(models.Transaction.created_at.desc()).limit(5).all()

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
