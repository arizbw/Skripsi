from typing import Any
from pydantic import BaseModel, Field


class UserContext(BaseModel):
    role: str | None = Field(default=None, description="User role name (e.g. 'Super', 'Admin DC')")
    dc_id: int | None = Field(default=None, description="Assigned Distribution Center ID")
    dc_name: str | None = Field(default=None, description="Assigned Distribution Center Name")
    token: str | None = Field(default=None, description="JWT Bearer Token")


class ChatRequest(BaseModel):
    query: str = Field(min_length=1, description="User prompt or query message")
    session_id: str = Field(default="default_session", description="Conversation session thread ID")
    user_context: UserContext | None = Field(default=None, description="User RBAC and DC context")


class CommandPayload(BaseModel):
    type: str = Field(description="Action type ('NAVIGATE', 'PREFILL')")
    target: str = Field(description="Target UI route or page name")
    data: Any = Field(default=None, description="Data payload for form prefill or route params")


class ChatResponse(BaseModel):
    reply: str = Field(description="Assistant natural language reply text")
    command: CommandPayload | None = Field(default=None, description="UI command payload if tool triggered navigation/prefill")
    error: str | None = Field(default=None, description="Error description if processing failed")


class HealthResponse(BaseModel):
    status: str = Field(default="ok", description="Service health status")
    environment: str = Field(description="Runtime environment")
    llm_provider: str = Field(description="Configured LLM provider")
