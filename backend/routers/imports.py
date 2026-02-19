from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import csv
import io
from datetime import datetime
from .. import database, schemas_transaction, crud, auth as auth_service, models
from ..smart_categorization import categorizer

router = APIRouter(
    prefix="/imports",
    tags=["Imports"]
)

def parse_date(date_str: str) -> datetime:
    """Parse date string trying common Brazilian formats."""
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%d/%m/%y"):
        try:
            return datetime.strptime(date_str.strip(), fmt)
        except ValueError:
            continue
    return datetime.now()

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
        text = content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(text))
        
        # Normalize column names
        if reader.fieldnames is None:
            raise HTTPException(status_code=400, detail="CSV vazio ou sem cabeçalho.")
        
        # Create normalized mapping: original -> lowercase stripped
        col_map = {col: col.strip().lower() for col in reader.fieldnames}
        
        # Find required columns
        has_data = any(v == 'data' for v in col_map.values())
        has_valor = any(v == 'valor' for v in col_map.values())
        has_desc = any(v in ('descrição', 'descricao', 'description') for v in col_map.values())
        
        if not (has_data and has_valor and has_desc):
            raise HTTPException(
                status_code=400, 
                detail="Formato do CSV não reconhecido. Certifique-se que é um CSV do Nubank (colunas: Data, Valor, Descrição)."
            )
        
        # Build reverse map: normalized -> original column name
        norm_to_orig = {v: k for k, v in col_map.items()}
        data_col = norm_to_orig.get('data', 'data')
        valor_col = norm_to_orig.get('valor', 'valor')
        desc_col = norm_to_orig.get('descrição') or norm_to_orig.get('descricao') or norm_to_orig.get('description', 'descrição')
        
        rows = list(reader)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao ler CSV: {str(e)}")

    # Get user categories for mapping
    user_cats = crud.get_categories(db, current_user.id)
    cat_map = {c.name.lower(): {'id': c.id, 'name': c.name} for c in user_cats}
    
    preview_transactions = []
    
    for row in rows:
        description = row.get(desc_col, '').strip()
        
        try:
            amount = float(row.get(valor_col, '0').replace(',', '.').strip())
        except ValueError:
            amount = 0.0
            
        date_str = row.get(data_col, '')
        date_obj = parse_date(date_str)

        transaction_type = "income" if amount > 0 else "expense"
        
        # Categorization logic
        desc_upper = description.upper()
        target_category_name = "Outros"
        
        if 'UBER' in desc_upper or 'BARBEARIA' in desc_upper or 'PISTA' in desc_upper:
             target_category_name = "Alimentação"
        elif 'TRANSFERÊNCIA ENVIADA' in desc_upper or 'TRANSFERÊNCIA RECEBIDA' in desc_upper:
             target_category_name = "Transferências"
        elif 'APLICAÇÃO RDB' in desc_upper or 'RESGATE RDB' in desc_upper:
             target_category_name = "Investimentos"
        elif 'PAGAMENTO DE BOLETO' in desc_upper:
             target_category_name = "Boletos"
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
        
        if not cat_id and target_category_name != "Não categorizado":
             cat_data = cat_map.get('outros')
             if cat_data:
                  cat_id = cat_data['id']
                  target_category_name = "Outros"
        
        preview_transactions.append({
            "date": date_obj,
            "description": description,
            "amount": amount,
            "type": transaction_type,
            "category_id": cat_id,
            "category_name": target_category_name if not cat_id else cat_data['name']
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
        new_tx = crud.create_user_transaction(db, tx_data, current_user.id, workspace_id=workspace_id)
        created_txs.append(new_tx)
        
    return created_txs
