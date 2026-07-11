import json
import os
from typing import AsyncIterator
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage, ToolMessage
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver
from app.core.config import settings


MODEL_PROVIDERS = {
    "openai": {
        "label": "OpenAI",
        "base_url": "https://api.openai.com/v1",
        "models": ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
    },
    "deepseek": {
        "label": "DeepSeek",
        "base_url": "https://api.deepseek.com/v1",
        "models": ["deepseek-chat", "deepseek-reasoner"],
    },
    "qwen": {
        "label": "Qwen (通义千问)",
        "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "models": ["qwen-plus", "qwen-max", "qwen-turbo"],
    },
    "zhipu": {
        "label": "GLM (智谱)",
        "base_url": "https://open.bigmodel.cn/api/paas/v4",
        "models": ["glm-4-flash", "glm-4", "glm-4-plus"],
    },
    "moonshot": {
        "label": "Moonshot (月之暗面)",
        "base_url": "https://api.moonshot.cn/v1",
        "models": ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"],
    },
    "custom": {
        "label": "Custom",
        "base_url": "https://api.openai.com/v1",
        "models": ["custom-model"],
    },
}


def get_provider_config(model: str) -> dict:
    """Detect the provider from model name and return base_url and api_key config."""
    for provider_id, config in MODEL_PROVIDERS.items():
        if model in config["models"]:
            env_api_key = os.getenv(f"{provider_id.upper()}_API_KEY", "")
            return {
                "provider": provider_id,
                "base_url": config["base_url"],
                "api_key": env_api_key or settings.openai_api_key,
            }
    return {
        "provider": "openai",
        "base_url": settings.openai_base_url,
        "api_key": settings.openai_api_key,
    }


def _build_tools_from_configs(tool_configs: list[dict]) -> list:
    built_tools = []

    for tc in tool_configs:
        tool_type = tc.get("tool_type", "")
        config = {}
        if tc.get("config"):
            try:
                config = json.loads(tc["config"])
            except (json.JSONDecodeError, TypeError):
                pass

        if tool_type == "web_search":
            built_tools.append(_create_web_search_tool(config))
        elif tool_type == "http_request":
            built_tools.append(_create_http_tool(config))
        elif tool_type == "calculator":
            built_tools.append(_create_calculator_tool())
        elif tool_type == "datetime_tool":
            built_tools.append(_create_datetime_tool())
        elif tool_type == "file_reader":
            built_tools.append(_create_file_reader_tool())
        elif tool_type == "code_executor":
            built_tools.append(_create_code_executor_tool())

    return built_tools


def _create_web_search_tool(config: dict):
    tavily_key = os.getenv("TAVILY_API_KEY", "")

    if tavily_key:
        @tool
        def web_search(query: str) -> str:
            """Search the web for real-time information. Use for current events and facts."""
            import httpx
            try:
                resp = httpx.post(
                    "https://api.tavily.com/search",
                    json={"query": query, "api_key": tavily_key, "max_results": 3},
                    timeout=15,
                )
                data = resp.json()
                results = data.get("results", [])
                if not results:
                    return f"No results found for '{query}'"
                return "\n\n".join(
                    f"[{r.get('title', 'N/A')}]\n{r.get('content', '')[:500]}\nURL: {r.get('url', '')}"
                    for r in results[:3]
                )
            except Exception as e:
                return f"Search failed: {e}"
        return web_search

    @tool
    def web_search(query: str) -> str:
        """Search the web for information. Configure Tavily API key for real search results."""
        return f'[Web search for: "{query}"] - Set TAVILY_API_KEY env variable for real search results.'
    return web_search


def _create_http_tool(config: dict):
    @tool
    def http_request(url: str, method: str = "GET") -> str:
        """Make an HTTP request. Useful for fetching data from APIs or websites."""
        import httpx
        try:
            if method.upper() == "GET":
                response = httpx.get(url, timeout=10, follow_redirects=True)
                return f"Status: {response.status_code}\n{response.text[:2000]}"
            elif method.upper() == "POST":
                response = httpx.post(url, timeout=10)
                return f"Status: {response.status_code}\n{response.text[:2000]}"
            return f"Method {method} not supported in this context."
        except Exception as e:
            return f"HTTP request failed: {str(e)}"
    return http_request


def _create_calculator_tool():
    import math

    @tool
    def calculator(expression: str) -> str:
        """Evaluate a mathematical expression. Supports basic math and math module functions."""
        safe_dict = {
            "abs": abs, "round": round, "min": min, "max": max, "sum": sum,
            "int": int, "float": float, "str": str, "len": len, "range": range,
            "pow": pow, "sqrt": math.sqrt, "sin": math.sin, "cos": math.cos,
            "tan": math.tan, "log": math.log, "log10": math.log10, "exp": math.exp,
            "pi": math.pi, "e": math.e, "ceil": math.ceil, "floor": math.floor,
        }
        try:
            result = eval(expression, {"__builtins__": {}}, safe_dict)
            return str(result)
        except Exception as e:
            return f"Calculation error: {str(e)}"
    return calculator


def _create_datetime_tool():
    @tool
    def get_current_datetime() -> str:
        """Get the current date and time."""
        from datetime import datetime
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S %Z")
    return get_current_datetime


def _create_file_reader_tool():
    @tool
    def read_file(file_path: str) -> str:
        """Read the contents of a file. Provide the absolute path to the file."""
        try:
            if not os.path.exists(file_path):
                return f"File not found: {file_path}"
            if os.path.getsize(file_path) > 100_000:
                return f"File too large ({os.path.getsize(file_path)} bytes)"
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                return f.read()
        except Exception as e:
            return f"Error reading file: {str(e)}"
    return read_file


def _create_code_executor_tool():
    @tool
    def execute_python(code: str) -> str:
        """Execute Python code and return the output. Use for calculations, data processing, etc."""
        import io
        import sys
        old_stdout = sys.stdout
        sys.stdout = io.StringIO()
        try:
            exec(code, {"__builtins__": __builtins__}, {})
            output = sys.stdout.getvalue()
            return output if output else "(no output)"
        except Exception as e:
            return f"Error: {str(e)}"
        finally:
            sys.stdout = old_stdout
    return execute_python


def _langchain_messages_to_history(
    messages: list,
) -> list[SystemMessage | HumanMessage | AIMessage | ToolMessage]:
    lc_messages = []
    for msg in messages:
        role = msg["role"]
        content = msg["content"]
        tool_calls_str = msg.get("tool_calls", "[]")

        if role == "system":
            lc_messages.append(SystemMessage(content=content))
        elif role == "user":
            lc_messages.append(HumanMessage(content=content))
        elif role == "assistant":
            lc_msg = AIMessage(content=content)
            try:
                tc_list = json.loads(tool_calls_str) if isinstance(tool_calls_str, str) else tool_calls_str
                if tc_list:
                    lc_msg.tool_calls = tc_list
            except (json.JSONDecodeError, TypeError):
                pass
            lc_messages.append(lc_msg)
        elif role == "tool":
            lc_messages.append(ToolMessage(content=content, tool_call_id=msg.get("tool_call_id", "")))

    return lc_messages


async def stream_agent_response(
    system_prompt: str,
    model: str,
    temperature: float,
    history: list,
    tool_configs: list[dict],
) -> AsyncIterator[dict]:
    provider_cfg = get_provider_config(model)

    llm = ChatOpenAI(
        model=model,
        temperature=temperature,
        openai_api_key=provider_cfg["api_key"],
        base_url=provider_cfg["base_url"],
    )

    tools = _build_tools_from_configs(tool_configs)
    history_messages = _langchain_messages_to_history(history)

    memory = MemorySaver()
    agent = create_react_agent(
        llm, tools, checkpointer=memory, prompt=system_prompt if system_prompt else None
    )

    config = {"configurable": {"thread_id": "agentflow-session"}}
    inputs = {"messages": history_messages}

    try:
        async for event in agent.astream_events(inputs, config=config, version="v2"):
            kind = event.get("event", "")

            if kind == "on_chat_model_stream":
                chunk = event.get("data", {}).get("chunk", {})
                if hasattr(chunk, "content") and chunk.content:
                    yield {"type": "text", "content": chunk.content}
                if hasattr(chunk, "tool_call_chunks") and chunk.tool_call_chunks:
                    for tc in chunk.tool_call_chunks:
                        if tc.get("name"):
                            yield {"type": "tool_start", "content": tc["name"]}

            elif kind == "on_tool_start":
                tool_name = event.get("name", "")
                tool_input = event.get("data", {}).get("input", {})
                yield {"type": "tool_call", "content": json.dumps({"name": tool_name, "input": str(tool_input)})}

            elif kind == "on_tool_end":
                output = event.get("data", {}).get("output", "")
                yield {"type": "tool_result", "content": str(output)[:500] if output else ""}

    except Exception as e:
        yield {"type": "error", "content": str(e)}
