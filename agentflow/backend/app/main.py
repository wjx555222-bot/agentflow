from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from app.core.config import settings
from app.core.database import init_db
from app.core.seed import seed_builtin_tools, seed_demo_data
from app.core.logging import setup_logging, get_logger
from app.core.middleware import LoggingMiddleware, validation_error_handler, global_exception_handler
from app.routers import agents, tools, workflows, conversations, system
from app.services.agent_service import MODEL_PROVIDERS

setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("AgentFlow starting up...")
    await init_db()
    await seed_builtin_tools()
    await seed_demo_data()
    logger.info("AgentFlow ready")
    yield
    logger.info("AgentFlow shutting down...")


app = FastAPI(
    title="AgentFlow",
    description="AI Agent Workflow Platform - Build, configure, and orchestrate AI agents with a visual interface",
    version="1.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(LoggingMiddleware)

app.add_exception_handler(RequestValidationError, validation_error_handler)
app.add_exception_handler(Exception, global_exception_handler)

app.include_router(system.router)
app.include_router(agents.router)
app.include_router(tools.router)
app.include_router(workflows.router)
app.include_router(conversations.router)
