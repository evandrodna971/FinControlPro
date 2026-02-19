import re
import unicodedata


def normalize(text: str) -> str:
    """Remove accents and lowercase for matching."""
    nfkd = unicodedata.normalize("NFKD", text.lower())
    return "".join(c for c in nfkd if not unicodedata.combining(c))


class SmartCategorizer:
    def __init__(self):
        # Keywords in Portuguese mapped to common category names
        self.rules = {
            # --- DESPESAS ---
            "Alimentação": [
                "almoco", "almoço", "janta", "jantar", "cafe", "café",
                "lanche", "restaurante", "padaria", "pizza", "hamburguer",
                "hamburger", "sushi", "acai", "açaí", "marmita", "marmitex",
                "ifood", "uber eats", "rappi", "comida", "refeicao",
                "refeição", "coxinha", "pastel", "salgado", "sorvete",
                "doceria", "confeitaria", "churrascaria", "rodizio",
                "buffet", "bar", "boteco", "cerveja", "bebida",
            ],
            "Transporte": [
                "uber", "99", "taxi", "táxi", "gasolina", "combustivel",
                "combustível", "estacionamento", "pedagio", "pedágio",
                "metro", "metrô", "onibus", "ônibus", "passagem",
                "trem", "brt", "moto", "carro", "oficina", "mecanico",
                "mecânico", "pneu", "oleo", "óleo", "lavagem", "ipva",
                "multa", "seguro auto", "seguro carro",
            ],
            "Moradia": [
                "aluguel", "condominio", "condomínio", "iptu", "luz",
                "energia", "agua", "água", "gas", "gás", "internet",
                "wifi", "celular", "telefone", "conta de luz",
                "conta de agua", "conta de água", "fatura",
            ],
            "Saúde": [
                "farmacia", "farmácia", "remedio", "remédio", "medico",
                "médico", "consulta", "exame", "hospital", "dentista",
                "psicólogo", "psicologo", "terapia", "academia",
                "plano de saude", "plano de saúde", "unimed",
                "droga", "drogaria", "suplemento", "vitamina",
            ],
            "Educação": [
                "escola", "faculdade", "curso", "livro", "udemy",
                "alura", "mensalidade", "material escolar", "apostila",
                "cursinho", "universidade", "aula",
            ],
            "Lazer": [
                "netflix", "spotify", "cinema", "filme", "jogo", "game",
                "show", "teatro", "parque", "viagem", "hotel", "airbnb",
                "passeio", "diversao", "diversão", "festa", "balada",
                "disney", "prime", "hbo", "globoplay", "youtube premium",
                "xbox", "playstation", "steam", "twitch",
            ],
            "Compras": [
                "roupa", "sapato", "tenis", "tênis", "camisa", "calça",
                "calcado", "calçado", "shopping", "loja", "amazon",
                "mercado livre", "shopee", "shein", "magalu",
                "americanas", "casas bahia", "renner", "riachuelo",
                "presente", "eletrônico", "eletronico", "celular",
            ],
            "Mercado": [
                "mercado", "supermercado", "feira", "hortifruti",
                "atacado", "atacadao", "atacadão", "assai", "assaí",
                "carrefour", "pão de acucar", "guanabara", "extra",
                "compras do mes", "compras do mês", "rancho",
            ],
            "Pet": [
                "pet", "ração", "racao", "veterinario", "veterinário",
                "petshop", "pet shop", "banho e tosa", "vacina pet",
            ],
            "Assinatura": [
                "assinatura", "mensalidade", "plano mensal",
                "icloud", "google one", "chatgpt", "notion",
            ],
            "Outros": [
                "despesa", "gasto", "pagamento",
            ],

            # --- RECEITAS ---
            "Salário": [
                "salario", "salário", "pagamento", "holerite",
                "contracheque", "folha", "adiantamento",
            ],
            "Freelance": [
                "freelance", "freela", "serviço", "servico",
                "bico", "consultoria", "projeto",
            ],
            "Investimentos": [
                "dividendo", "rendimento", "juros", "yield",
                "proventos", "resgate", "aplicacao", "aplicação",
            ],
            "Pix": [
                "pix", "transferencia", "transferência",
                "ted", "doc",
            ],
            "Vendas": [
                "venda", "vendido", "vendi",
            ],
        }

    def predict(self, description: str, transaction_type: str = "expense") -> str:
        """Predict category based on description and transaction type."""
        desc_normalized = normalize(description)

        # Filter relevant categories based on transaction type
        income_categories = {"Salário", "Freelance", "Investimentos", "Pix", "Vendas"}
        expense_categories = {k for k in self.rules.keys() if k not in income_categories}

        relevant = income_categories if transaction_type == "income" else expense_categories

        for category, keywords in self.rules.items():
            if category not in relevant:
                continue
            for keyword in keywords:
                if normalize(keyword) in desc_normalized:
                    return category

        return "Outros" if transaction_type == "expense" else "Receita"

    def find_category_id(self, db, user_id: int, predicted_name: str, workspace_id: int = None):  # type: ignore
        """Try to find existing user category by name similarity."""
        from . import models

        query = db.query(models.Category).filter(
            models.Category.user_id == user_id
        )

        categories = query.all()
        predicted_lower = normalize(predicted_name)

        for cat in categories:
            if normalize(cat.name) == predicted_lower:
                return cat.id

        # Partial match
        for cat in categories:
            if predicted_lower in normalize(cat.name) or normalize(cat.name) in predicted_lower:
                return cat.id

        return None


categorizer = SmartCategorizer()
