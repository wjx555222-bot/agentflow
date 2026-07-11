from datetime import datetime
from pydantic import BaseModel, Field


class WorkflowCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str = ""
    nodes: str = "[]"
    edges: str = "[]"


class WorkflowUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = None
    nodes: str | None = None
    edges: str | None = None


class WorkflowResponse(BaseModel):
    id: str
    name: str
    description: str
    nodes: str
    edges: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WorkflowListResponse(BaseModel):
    workflows: list[WorkflowResponse]
    total: int
