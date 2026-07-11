from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.tool import Tool
from app.schemas.tool import ToolCreate, ToolUpdate, ToolResponse, ToolListResponse

router = APIRouter(prefix="/api/tools", tags=["tools"])


@router.get("", response_model=ToolListResponse)
async def list_tools(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tool).order_by(Tool.created_at.desc()))
    tools = result.scalars().all()
    return ToolListResponse(
        tools=[ToolResponse.model_validate(t) for t in tools],
        total=len(tools),
    )


@router.post("", response_model=ToolResponse, status_code=201)
async def create_tool(tool_in: ToolCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Tool).where(Tool.name == tool_in.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Tool with name '{tool_in.name}' already exists")
    tool = Tool(**tool_in.model_dump())
    db.add(tool)
    await db.commit()
    await db.refresh(tool)
    return ToolResponse.model_validate(tool)


@router.get("/{tool_id}", response_model=ToolResponse)
async def get_tool(tool_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tool).where(Tool.id == tool_id))
    tool = result.scalar_one_or_none()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    return ToolResponse.model_validate(tool)


@router.put("/{tool_id}", response_model=ToolResponse)
async def update_tool(tool_id: str, tool_in: ToolUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tool).where(Tool.id == tool_id))
    tool = result.scalar_one_or_none()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    if tool.is_builtin:
        raise HTTPException(status_code=400, detail="Cannot modify built-in tools")

    update_data = tool_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(tool, key, value)

    await db.commit()
    await db.refresh(tool)
    return ToolResponse.model_validate(tool)


@router.delete("/{tool_id}", status_code=204)
async def delete_tool(tool_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tool).where(Tool.id == tool_id))
    tool = result.scalar_one_or_none()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    if tool.is_builtin:
        raise HTTPException(status_code=400, detail="Cannot delete built-in tools")
    await db.delete(tool)
    await db.commit()
