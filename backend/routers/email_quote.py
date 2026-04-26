from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.email_agent import compose_and_send, SUPPLIER_EMAIL

router = APIRouter(tags=["email"])


class EmailQuoteRequest(BaseModel):
    supplier: str
    materials: list[dict]
    experiment_question: str
    sender_name: Optional[str] = "LabAgent Lab"


@router.post("/email-quote")
async def email_quote(req: EmailQuoteRequest):
    try:
        result = await compose_and_send(
            supplier=req.supplier,
            materials=req.materials,
            experiment_question=req.experiment_question,
            sender_name=req.sender_name or "LabAgent Lab",
        )
        return {
            "success": True,
            "recipient": SUPPLIER_EMAIL,
            "subject": result["subject"],
            "preview": result["body"][:300],
            "message_id": result["message_id"],
        }
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {e}")
