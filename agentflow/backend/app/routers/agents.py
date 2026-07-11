from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.core.database import get_db
from app.models.agent import Agent
from app.models.tool import Tool
from app.schemas.agent import (
    AgentCreate, AgentUpdate, AgentResponse, AgentListResponse, AgentToolLink,
)

router = APIRouter(prefix="/api/agents", tags=["agents"])


def _agent_to_response(agent: Agent) -> AgentResponse:
    tool_ids = [t.id for t in agent.tools] if agent.tools else []
    return AgentResponse(
        id=agent.id, name=agent.name, description=agent.description,
        system_prompt=agent.system_prompt, model=agent.model,
        temperature=agent.temperature, max_tokens=agent.max_tokens,
        is_active=agent.is_active, created_at=agent.created_at,
        updated_at=agent.updated_at, tool_ids=tool_ids,
    )


@router.get("", response_model=AgentListResponse)
async def list_agents(
    search: str = Query(default="", description="Search by name or description"),
    model: str = Query(default="", description="Filter by model name"),
    db: AsyncSession = Depends(get_db),
):
    query = select(Agent)
    if search:
        query = query.where(or_(
            Agent.name.ilike(f"%{search}%"),
            Agent.description.ilike(f"%{search}%"),
        ))
    if model:
        query = query.where(Agent.model == model)
    query = query.order_by(Agent.updated_at.desc())
    result = await db.execute(query)
    agents = result.scalars().all()
    return AgentListResponse(
        agents=[_agent_to_response(a) for a in agents],
        total=len(agents),
    )


@router.post("", response_model=AgentResponse, status_code=201)
async def create_agent(agent_in: AgentCreate, db: AsyncSession = Depends(get_db)):
    agent = Agent(**agent_in.model_dump())
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    return _agent_to_response(agent)


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return _agent_to_response(agent)


@router.put("/{agent_id}", response_model=AgentResponse)
async def update_agent(agent_id: str, agent_in: AgentUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    update_data = agent_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(agent, key, value)
    await db.commit()
    await db.refresh(agent)
    return _agent_to_response(agent)


@router.delete("/{agent_id}", status_code=204)
async def delete_agent(agent_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    await db.delete(agent)
    await db.commit()


@router.post("/{agent_id}/tools", response_model=AgentResponse)
async def link_tools_to_agent(agent_id: str, link: AgentToolLink, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    tool_result = await db.execute(select(Tool).where(Tool.id.in_(link.tool_ids)))
    tools = tool_result.scalars().all()
    agent.tools = tools
    await db.commit()
    await db.refresh(agent)
    return _agent_to_response(agent)
