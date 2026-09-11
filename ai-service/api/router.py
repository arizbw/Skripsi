from fastapi import APIRouter
from api.v1.health import router as health_router
from api.v1.chat import router as chat_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(chat_router)
