import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.agent import Agent
from app.models.conversation import Conversation, Message
from app.schemas.conversation import (
    ConversationCreate, ConversationResponse, ConversationListResponse,
    ConversationUpdate, ChatRequest,
)
from app.services.agent_service import stream_agent_response

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


@router.get("", response_model=ConversationListResponse)
async def list_conversations(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Conversation).order_by(Conversation.updated_at.desc()))
    conversations = result.scalars().all()
    return ConversationListResponse(
        conversations=[ConversationResponse.model_validate(c) for c in conversations],
        total=len(conversations),
    )


@router.post("", response_model=ConversationResponse, status_code=201)
async def create_conversation(conv_in: ConversationCreate, db: AsyncSession = Depends(get_db)):
    agent_result = await db.execute(select(Agent).where(Agent.id == conv_in.agent_id))
    if not agent_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Agent not found")
    conversation = Conversation(**conv_in.model_dump())
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)
    return ConversationResponse.model_validate(conversation)


@router.get("/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(conversation_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return ConversationResponse.model_validate(conversation)


@router.patch("/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(conversation_id: str, conv_in: ConversationUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    update_data = conv_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(conversation, key, value)
    await db.commit()
    await db.refresh(conversation)
    return ConversationResponse.model_validate(conversation)


@router.delete("/{conversation_id}", status_code=204)
async def delete_conversation(conversation_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    await db.delete(conversation)
    await db.commit()


@router.get("/{conversation_id}/export")
async def export_conversation(conversation_id: str, format: str = "json", db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    messages = conversation.messages or []
    if format == "markdown":
        lines = [f"# {conversation.title}", "", f"Agent: {conversation.agent.name if conversation.agent else 'N/A'}", ""]
        for msg in messages:
            role = "**User**" if msg.role == "user" else "**Assistant**"
            lines.append(f"### {role}")
            lines.append(msg.content)
            lines.append("")
        content = "\n".join(lines)
        return {"format": "markdown", "content": content}
    export_data = {
        "title": conversation.title,
        "agent_id": conversation.agent_id,
        "created_at": conversation.created_at.isoformat(),
        "messages": [
            {"role": msg.role, "content": msg.content, "created_at": msg.created_at.isoformat()}
            for msg in messages
        ],
    }
    return {"format": "json", "content": json.dumps(export_data, indent=2, ensure_ascii=False)}


@router.post("/{conversation_id}/chat")
async def chat(conversation_id: str, chat_req: ChatRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    agent_result = await db.execute(select(Agent).where(Agent.id == conversation.agent_id))
    agent = agent_result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    user_msg = Message(conversation_id=conversation_id, role="user", content=chat_req.message)
    db.add(user_msg)
    await db.commit()

    messages_result = await db.execute(
        select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at)
    )
    messages = messages_result.scalars().all()

    history = [{"role": "system", "content": agent.system_prompt}] if agent.system_prompt else []
    for msg in messages:
        history.append({"role": msg.role, "content": msg.content, "tool_calls": msg.tool_calls})

    tool_configs = []
    if agent.tools:
        tool_configs = [
            {"tool_type": t.tool_type, "config": t.config, "name": t.name,
             "display_name": t.display_name, "description": t.description}
            for t in agent.tools
        ]

    accumulated_content = ""
    tool_calls_list = []

    async def event_generator():
        nonlocal accumulated_content, tool_calls_list
        try:
            async for chunk in stream_agent_response(
                system_prompt=agent.system_prompt, model=agent.model,
                temperature=agent.temperature, history=history, tool_configs=tool_configs,
            ):
                chunk_type = chunk.get("type", "")
                chunk_content = chunk.get("content", "")
                if chunk_type == "text":
                    accumulated_content += chunk_content
                elif chunk_type in ("tool_start", "tool_call"):
                    tool_calls_list.append({"type": chunk_type, "name": chunk_content})
                elif chunk_type == "tool_result":
                    tool_calls_list.append({"type": chunk_type, "content": chunk_content})
                yield f"data: {json.dumps(chunk)}\n\n"

            assistant_msg = Message(
                conversation_id=conversation_id, role="assistant",
                content=accumulated_content,
                tool_calls=json.dumps(tool_calls_list) if tool_calls_list else "[]",
            )
            db.add(assistant_msg)
            await db.commit()
            yield f"data: {json.dumps({'type': 'done', 'content': ''})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(), media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )
