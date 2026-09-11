from typing import Annotated, Any
from fastapi import Depends, Request, HTTPException, status
from langchain_community.utilities.sql_database import SQLDatabase
from config import Settings, get_settings


def get_app_settings() -> Settings:
    """Dependency provider for application settings."""
    return get_settings()

def get_db(request: Request) -> SQLDatabase:
    """Dependency provider for database connection."""
    db = getattr(request.app.state, "db", None)
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not initialized",
        )
    return db

def get_agent(request: Request) -> Any:
    """Dependency provider for compiled LangGraph agent."""
    agent = getattr(request.app.state, "agent", None)
    if agent is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI Agent is not initialized",
        )
    return agent

SettingsDep = Annotated[Settings, Depends(get_settings)]
DbDep = Annotated[SQLDatabase, Depends(get_db)]
AgentDep = Annotated[Any, Depends(get_agent)]
