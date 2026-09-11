from typing import Any
from config import Settings
from prompts.agent_template import AGENT_TEMPLATE
from tools import use_tools
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_ollama import ChatOllama
from langchain_community.utilities.sql_database import SQLDatabase
from langchain_community.agent_toolkits import SQLDatabaseToolkit
from langchain.agents import create_agent, AgentState
from langchain.agents.middleware import before_model
from langchain_core.messages import RemoveMessage, trim_messages as lc_trim_messages
from langgraph.graph.message import REMOVE_ALL_MESSAGES
from langgraph.checkpoint.memory import InMemorySaver


def build_llm(settings: Settings):
    """Instantiate configured LLM provider."""
    if settings.llm_provider == "ollama":
        return ChatOllama(
            model=settings.ollama_model,
            base_url=settings.ollama_base_url,
            keep_alive="5m",
        )
    return ChatGoogleGenerativeAI(
        model=settings.gemini_model,
        google_api_key=settings.google_api_key,
        temperature=0,
    )


def create_trim_middleware(max_tokens: int):
    """Creates a @before_model middleware to keep messages within token budget."""
    @before_model
    def trim_messages(state: AgentState, runtime: Any) -> dict | None:
        messages = state.get("messages", [])
        trimmed_messages = lc_trim_messages(
            messages,
            max_tokens=max_tokens,
            strategy="last",
            token_counter="approximate",
            start_on="human",
            include_system=True,
            allow_partial=False,
        )
        if len(trimmed_messages) == len(messages):
            return None
        return {
            "messages": [
                RemoveMessage(id=REMOVE_ALL_MESSAGES),
                *trimmed_messages,
            ]
        }
    return trim_messages


def create_chat_agent(settings: Settings, db: SQLDatabase):
    """Assembles tools, SQL toolkit, memory, and compiles the LangGraph agent."""
    llm = build_llm(settings)
    custom_tools = use_tools(db)
    toolkit = SQLDatabaseToolkit(db=db, llm=llm)
    all_tools = custom_tools + toolkit.get_tools()
    
    trim_middleware = create_trim_middleware(settings.agent_max_tokens)
    memory = InMemorySaver()

    agent = create_agent(
        model=llm,
        tools=all_tools,
        system_prompt=AGENT_TEMPLATE,
        middleware=[trim_middleware],
        checkpointer=memory,
        debug=(settings.environment == "development" and settings.log_level == "DEBUG"),
    )
    return agent
