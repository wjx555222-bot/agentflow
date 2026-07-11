import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Agent(Base):
    __tablename__ = "agents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    system_prompt: Mapped[str] = mapped_column(Text, default="You are a helpful AI assistant.")
    model: Mapped[str] = mapped_column(String(50), default="gpt-4o-mini")
    temperature: Mapped[float] = mapped_column(default=0.7)
    max_tokens: Mapped[int] = mapped_column(default=2048)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    tools: Mapped[list["Tool"]] = relationship(
        "Tool", secondary="agent_tools", back_populates="agents", lazy="selectin"
    )
    conversations: Mapped[list["Conversation"]] = relationship(
        "Conversation", back_populates="agent", lazy="selectin", cascade="all, delete-orphan"
    )
