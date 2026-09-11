import logging
from fastapi import APIRouter
from api.dependencies import AgentDep, DbDep
from models.chat import ChatRequest, ChatResponse
from services.agent_service import execute_chat
from context import set_request_context

logger = logging.getLogger("ai_service.api.chat")
router = APIRouter(tags=["Chat"])


@router.post("/chat")
async def chat_endpoint(
    request: ChatRequest,
    agent: AgentDep,
    db: DbDep,
) -> ChatResponse:
    """Chat endpoint for interacting with the logistic AI Agent."""
    token = request.user_context.token if request.user_context else None
    dc_id = request.user_context.dc_id if request.user_context else None
    role = request.user_context.role if request.user_context else None

    with set_request_context(token=token, dc_id=dc_id, role=role):
        try:
            return await execute_chat(agent=agent, request=request, db=db)
        except Exception as e:
            logger.exception(f"Unhandled error in chat endpoint for session {request.session_id}: {e}")
            return ChatResponse(
                reply="Maaf, terjadi kesalahan saat memproses permintaan Anda.",
                error=str(e),
            )
