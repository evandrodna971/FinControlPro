import re

class SmartCategorizer:
    def __init__(self):
        # Keywords mapping (Simple Rule-based AI)
        self.rules = {
            "Food": ["restaurant", "food", "burger", "pizza", "lunch", "dinner", "cafe", "coffee", "ifood", "uber eats"],
            "Transport": ["uber", "99", "taxi", "gas", "fuel", "parking", "subway", "bus"],
            "Shopping": ["amazon", "store", "mall", "market", "walmart"],
            "Utilities": ["electric", "water", "internet", "phone", "bill"],
            "Salary": ["salary", "payroll", "deposit"],
            "Entertainment": ["netflix", "spotify", "movie", "cinema", "game"]
        }

    def predict(self, description: str) -> str:
        description = description.lower()
        for category, keywords in self.rules.items():
            for keyword in keywords:
                if keyword in description:
                    return category
        return "Uncategorized"

categorizer = SmartCategorizer()
