import json
from sqlalchemy import select
from app.core.database import async_session
from app.models.agent import Agent
from app.models.tool import Tool

BUILTIN_TOOLS = [
    {
        "name": "web_search",
        "display_name": "Web Search",
        "description": "Search the internet for information using keywords",
        "tool_type": "web_search",
        "config": json.dumps({"max_results": 5}),
        "is_builtin": True,
    },
    {
        "name": "calculator",
        "display_name": "Calculator",
        "description": "Evaluate mathematical expressions",
        "tool_type": "calculator",
        "config": "{}",
        "is_builtin": True,
    },
    {
        "name": "http_request",
        "display_name": "HTTP Request",
        "description": "Make HTTP requests to fetch data from APIs or websites",
        "tool_type": "http_request",
        "config": json.dumps({"timeout": 10}),
        "is_builtin": True,
    },
    {
        "name": "datetime_tool",
        "display_name": "Date & Time",
        "description": "Get the current date and time",
        "tool_type": "datetime_tool",
        "config": "{}",
        "is_builtin": True,
    },
    {
        "name": "file_reader",
        "display_name": "File Reader",
        "description": "Read contents of files from the local filesystem",
        "tool_type": "file_reader",
        "config": "{}",
        "is_builtin": True,
    },
    {
        "name": "code_executor",
        "display_name": "Code Executor",
        "description": "Execute Python code and return the output",
        "tool_type": "code_executor",
        "config": "{}",
        "is_builtin": True,
    },
]


async def seed_builtin_tools():
    async with async_session() as session:
        for tool_data in BUILTIN_TOOLS:
            result = await session.execute(select(Tool).where(Tool.name == tool_data["name"]))
            existing = result.scalar_one_or_none()
            if not existing:
                tool = Tool(**tool_data)
                session.add(tool)
        await session.commit()


DEMO_AGENTS = [
    {
        "name": "Code Assistant",
        "description": "Expert programming assistant that helps with code review, debugging, and writing clean code",
        "system_prompt": "You are an expert software engineer. Help users write clean, efficient code. Review code, suggest improvements, explain concepts, and help debug issues. Always explain your reasoning.",
        "model": "gpt-4o-mini",
        "temperature": 0.3,
    },
    {
        "name": "Research Analyst",
        "description": "Analyzes topics in depth, searches for information, and produces structured research reports",
        "system_prompt": "You are a research analyst. When asked about a topic, break it down systematically. Search for relevant information, analyze it critically, and present findings in a well-structured format with clear sections.",
        "model": "gpt-4o-mini",
        "temperature": 0.5,
    },
    {
        "name": "Creative Writer",
        "description": "Generates creative content including stories, articles, marketing copy, and poetry",
        "system_prompt": "You are a creative writer with a flair for engaging prose. Generate original, compelling content tailored to the user's needs. Adapt your tone and style based on the context.",
        "model": "gpt-4o-mini",
        "temperature": 0.9,
    },
]


async def seed_demo_data():
    async with async_session() as session:
        for agent_data in DEMO_AGENTS:
            result = await session.execute(select(Agent).where(Agent.name == agent_data["name"]))
            existing = result.scalar_one_or_none()
            if not existing:
                agent = Agent(**agent_data)
                session.add(agent)
                await session.flush()

                tool_result = await session.execute(select(Tool).limit(3))
                tools = tool_result.scalars().all()
                if tools:
                    agent.tools = tools
        await session.commit()
