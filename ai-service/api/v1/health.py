from fastapi import APIRouter
from api.dependencies import SettingsDep
from models.chat import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health")
def health_check(settings: SettingsDep) -> HealthResponse:
    """Returns the health status and runtime environment configuration."""
    return HealthResponse(
        status="ok",
        environment=settings.environment,
        llm_provider=settings.llm_provider,
    )
