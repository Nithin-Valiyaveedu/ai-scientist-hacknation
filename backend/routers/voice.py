import os
import logging
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()
logger = logging.getLogger(__name__)

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
ELEVENLABS_BASE = "https://api.elevenlabs.io/v1"

# Cached agent ID — created once per process lifetime.
# Set to None to force recreation on next request (e.g. after prompt change).
_agent_id: str | None = None


# ── Agent bootstrap ────────────────────────────────────────────────────────────

async def _get_or_create_agent() -> str:
    """Return the cached ElevenLabs agent ID, creating it on first call."""
    global _agent_id
    if _agent_id:
        return _agent_id

    agent_payload = {
        "name": "LabAgent",
        "conversation_config": {
            "agent": {
                "prompt": {
                    "prompt": (
                        "You are an expert scientific voice assistant embedded in LabAgent platform. "
                        "You help researchers understand scientific literature, experimental protocols, reagents, "
                        "and methodology. Speak in natural, conversational sentences — this is a voice call, "
                        "so avoid bullet points or lists. Be concise and precise. "
                        "When you receive a [Research context] message, use it to ground all your answers. "
                        "If asked to look up more papers, use the search_literature tool."
                    ),
                    "tools": [
                        {
                            "type": "client",
                            "name": "search_literature",
                            "description": (
                                "Search for scientific papers and literature on a given topic. "
                                "Use this when the user wants to know about a specific research area, "
                                "asks for more papers, or wants deeper information beyond what's already loaded."
                            ),
                            "parameters": {
                                "type": "object",
                                "properties": {
                                    "query": {
                                        "type": "string",
                                        "description": "The scientific question or topic to search for in the literature database."
                                    }
                                },
                                "required": ["query"]
                            },
                            "expects_response": True,
                        }
                    ],
                },
                "first_message": (
                    "Hello! I'm your AI research assistant. I can help you understand the literature, "
                    "discuss methodology, and search for more papers. What would you like to explore?"
                ),
                "language": "en",
            },
            "tts": {
                "model_id": "eleven_turbo_v2",
            },
        },
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{ELEVENLABS_BASE}/convai/agents/create",
            headers={"xi-api-key": ELEVENLABS_API_KEY},
            json=agent_payload,
        )
        if not resp.is_success:
            raise RuntimeError(f"ElevenLabs agent create failed: {resp.status_code} {resp.text}")

        data = resp.json()
        _agent_id = data["agent_id"]
        logger.info("Created ElevenLabs agent: %s", _agent_id)
        return _agent_id


# ── Request model ──────────────────────────────────────────────────────────────

class VoiceSessionRequest(BaseModel):
    context: dict = {}


# ── Endpoint ───────────────────────────────────────────────────────────────────

@router.post("/voice-session")
async def voice_session(body: VoiceSessionRequest):
    """
    Returns a signed ElevenLabs WebSocket URL for a voice conversation.

    The client uses this URL to start a session with the ElevenLabs
    Conversational AI SDK, passing context overrides and registering
    client-side tool handlers (e.g. search_literature).
    """
    if not ELEVENLABS_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="ELEVENLABS_API_KEY is not configured on the server."
        )

    try:
        agent_id = await _get_or_create_agent()

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{ELEVENLABS_BASE}/convai/conversation/get_signed_url",
                headers={"xi-api-key": ELEVENLABS_API_KEY},
                params={"agent_id": agent_id},
            )
            if not resp.is_success:
                raise RuntimeError(f"Signed URL failed: {resp.status_code} {resp.text}")

            data = resp.json()

        return {
            "signed_url": data["signed_url"],
            "agent_id": agent_id,
        }

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="ElevenLabs API timed out.")
    except RuntimeError as exc:
        logger.error("Voice session error: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception as exc:
        logger.exception("Unexpected voice session error")
        raise HTTPException(status_code=500, detail=str(exc))
