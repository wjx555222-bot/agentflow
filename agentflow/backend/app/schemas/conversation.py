from datetime import datetime
from pydantic import BaseModel, Field


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    tool_calls: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationCreate(BaseModel):
    agent_id: str
    title: str = "New Conversation"


class ConversationUpdate(BaseModel):
    title: str | None = None


class ConversationResponse(BaseModel):
    id: str
    agent_id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: list[MessageResponse] = []

    model_config = {"from_attributes": True}


class ConversationListResponse(BaseModel):
    conversations: list[ConversationResponse]
    total: int


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)


class ChatStreamChunk(BaseModel):
    type: str
    content: str = ""
    tool_call: dict | None = None
