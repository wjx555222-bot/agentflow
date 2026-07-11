import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, func, Column, Table, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

agent_tools = Table(
    "agent_tools",
    Base.metadata,
    Column("agent_id", ForeignKey("agents.id", ondelete="CASCADE"), primary_key=True),
    Column("tool_id", ForeignKey("tools.id", ondelete="CASCADE"), primary_key=True),
)


class Tool(Base):
    __tablename__ = "tools"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    tool_type: Mapped[str] = mapped_column(String(30), nullable=False)
    config: Mapped[str] = mapped_column(Text, default="{}")
    is_builtin: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    agents: Mapped[list["Agent"]] = relationship(
        "Agent", secondary=agent_tools, back_populates="tools", lazy="selectin"
    )
