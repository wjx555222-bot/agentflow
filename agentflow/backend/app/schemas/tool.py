from datetime import datetime
from pydantic import BaseModel, Field


class ToolCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    display_name: str = Field(..., min_length=1, max_length=100)
    description: str = ""
    tool_type: str = Field(..., min_length=1, max_length=30)
    config: str = "{}"


class ToolUpdate(BaseModel):
    display_name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = None
    config: str | None = None


class ToolResponse(BaseModel):
    id: str
    name: str
    display_name: str
    description: str
    tool_type: str
    config: str
    is_builtin: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ToolListResponse(BaseModel):
    tools: list[ToolResponse]
    total: int
