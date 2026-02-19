from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import pandas as pd
import io
from datetime import datetime
# from ofxparse import OfxParser # Basic CSV first
from .. import database, schemas_transaction, crud, auth as auth_service, models
from ..smart_categorization import categorizer

router = APIRouter(
    prefix="/imports",
    tags=["Imports"]
)

@router.post("/preview", response_model=List[schemas_transaction.TransactionImportPreview])
async def preview_import_csv(
    file: UploadFile = File(...), 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Formato inválido. Por favor envie um arquivo CSV.")
    
    content = await file.read()
    try:
        # Nubank CSV Format: Data, Valor, Identificador, Descrição
        df = pd.read_csv(io.StringIO(content.decode('utf-8')))
        
        # Normalize columns
        df.columns = [c.strip().lower() for c in df.columns]
        
        # Map Nubank columns to our needs
        # Nubank: data, valor, identificador, descrição
        # We need to ensure these exist or map them
        
        # Check known columns
        if 'data' not in df.columns or 'valor' not in df.columns or 'descrição' not in df.columns:
             raise HTTPException(status_code=400, detail="Formato do CSV não reconhecido. Certifique-se que é um CSV do Nubank (colunas: Data, Valor, Descrição).")

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao ler CSV: {str(e)}")

    # Get user categories for mapping
    user_cats = crud.get_categories(db, current_user.id)
    # Create map: name.lower() -> {id, name}
    cat_map = {c.name.lower(): {'id': c.id, 'name': c.name} for c in user_cats}
    
    preview_transactions = []
    
    for _, row in df.iterrows():
        description = row['descrição']
        amount = float(row['valor'])
        date_str = row['data']
        
        # Parse date (Nubank usually DD/MM/YYYY)
        try:
            date_obj = pd.to_datetime(date_str, dayfirst=True).to_pydatetime()
        except:
            date_obj = datetime.now() # Fallback

        # Logic for Type
        # Nubank: Positive = Credit (Income/Refund), Negative = Debit (Expense)
        # However, sometimes they use positive for everything and -sign for expense.
        # Let's assume the prompt: "Entradas: valores positivos... Saídas: valores negativos"
        
        transaction_type = "income" if amount > 0 else "expense"
        
        # Logic for Categorization
        desc_upper = description.upper()
        target_category_name = "Outros" # Default
        
        if 'UBER' in desc_upper or 'BARBEARIA' in desc_upper or 'PISTA' in desc_upper: # PISTA added as per prompt example? Or maybe prompt meant Pizza? Assuming prompt is truth.
             target_category_name = "Alimentação" # Or Transport for Uber? Prompt said: Alimentação: if 'Uber'... wait.
             # Prompt says: "Alimentação: if 'Uber' in descrição or 'BARBEARIA' or 'PISTA'." -> This seems odd clustering (Uber in Food?), but I MUST FOLLOW PROMPT.
             pass
        elif 'TRANSFERÊNCIA ENVIADA' in desc_upper or 'TRANSFERÊNCIA RECEBIDA' in desc_upper:
             target_category_name = "Transferências"
        elif 'APLICAÇÃO RDB' in desc_upper or 'RESGATE RDB' in desc_upper:
             target_category_name = "Investimentos"
        elif 'PAGAMENTO DE BOLETO' in desc_upper:
             target_category_name = "Boletos" # Or Contas
        elif 'PAGAMENTO DE FATURA' in desc_upper:
             target_category_name = "Fatura"
        elif any(x in desc_upper for x in ['SYMPLA', 'UNIFIQUE', 'CELESC', 'ULTRAGAZ', 'AMBIENTAL']):
             target_category_name = "Serviços"
        elif 'UNINTER' in desc_upper:
             target_category_name = "Educação"
        elif 'DEPÓSITO DE EMPRÉSTIMO' in desc_upper:
             target_category_name = "Empréstimo"
        elif 'PIX' in desc_upper:
             target_category_name = "Pix"
        else:
             target_category_name = "Não categorizado"
        
        # Try to find category ID
        cat_data = cat_map.get(target_category_name.lower())
        cat_id = cat_data['id'] if cat_data else None
        # If not found, frontend will show "Name" but ID null, user must create or select.
        # Or, we can try to find "Outros" if the specific one fails.
        if not cat_id and target_category_name != "Não categorizado":
             # Fallback to see if "Outros" exists
             cat_data = cat_map.get('outros')
             if cat_data:
                  cat_id = cat_data['id']
                  target_category_name = "Outros" # Reset name to what we found
        
        preview_transactions.append({
            "date": date_obj,
            "description": description,
            "amount": amount,
            "type": transaction_type,
            "category_id": cat_id,
            "category_name": target_category_name if not cat_id else cat_data['name'] # Send suggested name if ID null
        })

    return preview_transactions

@router.post("/confirm", response_model=List[schemas_transaction.Transaction])
def confirm_import(
    transactions: List[schemas_transaction.TransactionCreate],
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user),
    workspace_id: Optional[int] = Depends(auth_service.get_current_workspace)
):
    """
    Receives a list of transactions (already reviewed by user) and saves them.
    """
    created_txs = []
    for tx_data in transactions:
        # Ensure category_id is present. If user didn't select, it might be None -> Error or default?
        # Schema requires category_id as Optional, but for logic we usually want one.
        # If None, it might go to "Outros" created on the fly? For now, assume frontend forces selection.
        
        new_tx = crud.create_user_transaction(db, tx_data, current_user.id, workspace_id=workspace_id)
        created_txs.append(new_tx)
        
    return created_txs
