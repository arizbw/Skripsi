from unittest.mock import MagicMock


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "Logistics AI Service"
    assert data["status"] == "online"


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["environment"] == "test"
    assert data["llm_provider"] == "gemini"


def test_chat_conversational_reply(client, mock_agent):
    ai_msg = MagicMock()
    ai_msg.type = "ai"
    ai_msg.content = "Berikut adalah informasi pengiriman Anda."
    ai_msg.tool_calls = []
    mock_agent.ainvoke.return_value = {"messages": [ai_msg]}

    payload = {
        "query": "Bisa tolong cek status pengiriman?",
        "session_id": "test_session_123",
        "user_context": {
            "role": "Admin DC",
            "dc_id": 1,
            "dc_name": "DC Jakarta",
            "token": "mock_jwt_token",
        },
    }
    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["reply"] == "Berikut adalah informasi pengiriman Anda."
    assert data["command"] is None
    assert data["error"] is None


def test_chat_with_ui_navigation_command(client, mock_agent):
    tool_msg = MagicMock()
    tool_msg.type = "tool"
    tool_msg.name = "system_control"
    tool_msg.content = {
        "status": "success",
        "ui_action": "NAVIGATE",
        "target": "trucks_list",
        "entity_id": None,
        "message": "Mengarahkan ke halaman daftar truk...",
    }

    ai_msg = MagicMock()
    ai_msg.type = "ai"
    ai_msg.content = "Saya akan mengarahkan Anda ke daftar armada truk."
    ai_msg.tool_calls = []

    mock_agent.ainvoke.return_value = {"messages": [tool_msg, ai_msg]}

    payload = {
        "query": "Buka daftar truk",
        "session_id": "test_session_nav",
    }
    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["reply"] == "Saya akan mengarahkan Anda ke daftar armada truk."
    assert data["command"] is not None
    assert data["command"]["type"] == "NAVIGATE"
    assert data["command"]["target"] == "trucks_list"


def test_chat_validation_error_empty_query(client):
    # Empty query should fail Pydantic min_length=1 validation
    payload = {
        "query": "",
        "session_id": "test_empty",
    }
    response = client.post("/chat", json=payload)
    assert response.status_code == 422


def test_chat_agent_error_graceful_handling(client, mock_agent):
    mock_agent.ainvoke.side_effect = RuntimeError("Ollama connection timed out")

    payload = {
        "query": "Buat rute pengiriman",
        "session_id": "test_err",
    }
    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "terjadi kesalahan" in data["reply"].lower()
    assert "Ollama connection timed out" in data["error"]
