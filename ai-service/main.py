import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langchain_community.utilities.sql_database import SQLDatabase

from config import get_settings
from api import api_router
from services import create_chat_agent

# Configure logging
settings = get_settings()
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ai_service")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI Lifespan Context Manager.
    Initializes database connections, builds the AI Agent graph, and manages clean shutdown.
    """
    logger.info("Initializing AI Service...")
    settings_provider = app.dependency_overrides.get(get_settings, get_settings)
    current_settings = settings_provider()

    # Initialize SQLDatabase connection
    if current_settings.environment != "test":
        try:
            db = SQLDatabase.from_uri(current_settings.database_url)
            app.state.db = db
            logger.info("Database connection successfully established.")
        except Exception as e:
            logger.warning(f"Database connection could not be established at startup: {e}")
            app.state.db = None

        # Instantiate and compile LangGraph Chat Agent
        if app.state.db is not None:
            try:
                agent = create_chat_agent(current_settings, app.state.db)
                app.state.agent = agent
                logger.info("Chat agent compiled and ready.")
            except Exception as e:
                logger.error(f"Failed to create chat agent at startup: {e}")
                app.state.agent = None
        else:
            app.state.agent = None
    else:
        logger.info("Test environment active: Skipping real DB and agent initialization in lifespan.")

    yield

    # Clean shutdown logic
    logger.info("Shutting down AI Service...")
    app.state.db = None
    app.state.agent = None


app = FastAPI(
    title="Logistics AI Service",
    description="Intelligent Conversational Agent & Route Optimization Assistant",
    version="0.1.0",
    lifespan=lifespan,
)

# Configure CORS Middleware
origins = settings.allowed_origins
allow_credentials = False if "*" in origins else True

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include All API Routers
app.include_router(api_router)


@app.get("/", tags=["General"])
def root():
    return {
        "service": "Logistics AI Service",
        "status": "online",
        "docs": "/docs",
    }
