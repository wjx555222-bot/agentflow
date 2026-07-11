from datetime import datetime
from pydantic import BaseModel, Field


class AgentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str = ""
    system_prompt: str = "You are a helpful AI assistant."
    model: str = "gpt-4o-mini"
    temperature: float = Field(default=0.7, ge=0, le=2)
    max_tokens: int = Field(default=2048, ge=1, le=128000)


class AgentUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = None
    system_prompt: str | None = None
    model: str | None = None
    temperature: float | None = Field(None, ge=0, le=2)
    max_tokens: int | None = Field(None, ge=1, le=128000)
    is_active: bool | None = None


class AgentToolLink(BaseModel):
    tool_ids: list[str]


class AgentResponse(BaseModel):
    id: str
    name: str
    description: str
    system_prompt: str
    model: str
    temperature: float
    max_tokens: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    tool_ids: list[str] = []

    model_config = {"from_attributes": True}


class AgentListResponse(BaseModel):
    agents: list[AgentResponse]
    total: int
