from fastapi import APIRouter, Form, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from .. import database, models
from ..services.whatsapp_agent import WhatsappAgent
from fastapi.responses import Response
import logging
import re

# Configure logger
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/webhook",
    tags=["Webhook"]
)


@router.get("/whatsapp/status")
async def whatsapp_status():
    """Endpoint simplificado para verificar se o webhook está online."""
    return {"status": "online", "message": "FinControl Pro WhatsApp Webhook is active"}

@router.get("/whatsapp")
async def whatsapp_get_info():
    """Retorna uma instrução amigável se acessado via GET (navegador)."""
    return {
        "message": "Este endpoint espera uma requisição POST do Twilio.",
        "test_url": "/webhook/whatsapp/status"
    }

@router.post("/whatsapp")
async def whatsapp_webhook(
    request: Request,
    From: str = Form(...),
    Body: str = Form(...),
    db: Session = Depends(database.get_db)
):
    # Log raw info for debugging
    headers = dict(request.headers)
    logger.info(f"--- WhatsApp Webhook Received ---")
    logger.info(f"Headers: {headers}")
    
    # Clean phone number (remove 'whatsapp:' prefix)
    phone_number = From.replace("whatsapp:", "").strip()
    message_body = Body.strip()
    
    logger.info(f"📩 Webhook received from: {phone_number}, Body: {message_body}")

    # 1. Try to find user by phone number
    user = db.query(models.User).filter(models.User.phone_number == phone_number).first()
    
    # 2. If not found, check for LINKING command
    if not user:
        # Check if message is a linking command: "VINCULAR <EMAIL>"
        # Regex to capture email, handles 'vincular' with or without accent
        listing_pattern = r"^[Vv][ÍíIi][Nn][Cc][Uu][Ll][Aa][Rr]\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$"
        match = re.search(listing_pattern, message_body)
        
        if match:
            email = match.group(1)
            logger.info(f"Linking request for email: {email}")
            
            target_user = db.query(models.User).filter(models.User.email == email).first()
            
            if target_user:
                # Update user with phone number
                target_user.phone_number = phone_number
                db.commit()
                return Response(content=f"<?xml version='1.0' encoding='UTF-8'?><Response><Message>✅ Vinculado com sucesso! Olá, {target_user.full_name or target_user.email}. Agora você pode lançar despesas direto por aqui.</Message></Response>", media_type="application/xml")
            else:
                return Response(content="<?xml version='1.0' encoding='UTF-8'?><Response><Message>❌ E-mail não encontrado no sistema. Verifique e tente novamente: VINCULAR <SEU_EMAIL></Message></Response>", media_type="application/xml")
        
        # If not linking command and user not found
        return Response(content="<?xml version='1.0' encoding='UTF-8'?><Response><Message>👋 Olá! Não reconheci seu número. \n\nPara acessar seu financeiro, vincule sua conta enviando:\n*VINCULAR <SEU_EMAIL_DE_CADASTRO>*</Message></Response>", media_type="application/xml")

    # 3. User Found - Proceed to Agent logic
    logger.info(f"User identified by phone: {user.email} (ID: {user.id})")

    # Get active workspace (Linked to user)
    workspace_link = db.query(models.UserWorkspace).filter(models.UserWorkspace.user_id == user.id).first()
    
    if workspace_link:
        workspace_id = workspace_link.workspace_id
    else:
        # Fallback: Try to find ANY workspace (should ideally be handled better)
        workspace = db.query(models.Workspace).first()
        if workspace:
            workspace_id = workspace.id
        else:
             error_msg = "Erro: Você não tem nenhum workspace vinculado."
             return Response(content=f"<?xml version='1.0' encoding='UTF-8'?><Response><Message>{error_msg}</Message></Response>", media_type="application/xml")

    try:
        agent = WhatsappAgent(db, user, workspace_id)
        response_text = agent.process_message(message_body)
        logger.info(f"Agent response: {response_text}")
    except Exception as e:
        logger.error(f"Error processing message: {e}")
        response_text = "Desculpe, ocorreu um erro interno."
    
    # Return TwiML
    return Response(content=f"<?xml version='1.0' encoding='UTF-8'?><Response><Message>{response_text}</Message></Response>", media_type="application/xml")
