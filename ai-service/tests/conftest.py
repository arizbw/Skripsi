import pytest
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient
from main import app
from config import Settings, get_settings
from api.dependencies import get_db, get_agent


@pytest.fixture
def test_settings():
    return Settings(
        environment="test",
        llm_provider="gemini",
        google_api_key="test_api_key",
        database_url="sqlite:///:memory:",
    )


@pytest.fixture
def mock_db():
    db = MagicMock()
    db._engine.connect.return_value.__enter__.return_value.execute.return_value.fetchone.return_value = (1, "DC Jakarta")
    return db


@pytest.fixture
def mock_agent():
    agent = AsyncMock()
    
    # Default behavior: conversational reply
    ai_msg = MagicMock()
    ai_msg.type = "ai"
    ai_msg.content = "Berikut adalah informasi pengiriman Anda."
    ai_msg.tool_calls = []
    
    agent.ainvoke.return_value = {"messages": [ai_msg]}
    return agent


@pytest.fixture
def client(test_settings, mock_db, mock_agent):
    app.dependency_overrides[get_settings] = lambda: test_settings
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_agent] = lambda: mock_agent

    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client

    app.dependency_overrides.clear()
