from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.models.agent import Agent
from app.models.conversation import Conversation
from app.models.tool import Tool
from app.services.agent_service import MODEL_PROVIDERS

router = APIRouter(prefix="/api", tags=["system"])


@router.get("/health")
async def health_check():
    return {"status": "ok", "version": "1.1.0"}


@router.get("/providers")
async def list_providers():
    return {"providers": MODEL_PROVIDERS}


@router.get("/stats")
async def system_stats(db: AsyncSession = Depends(get_db)):
    agent_count = await db.scalar(select(func.count(Agent.id)))
    conv_count = await db.scalar(select(func.count(Conversation.id)))
    tool_count = await db.scalar(select(func.count(Tool.id)))
    active_agent_count = await db.scalar(
        select(func.count(Agent.id)).where(Agent.is_active == True)
    )

    return {
        "agents": {"total": agent_count, "active": active_agent_count},
        "conversations": {"total": conv_count},
        "tools": {"total": tool_count},
    }
