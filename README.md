# agentflow
# AgentFlow

AI Agent workflow platform — build, configure, and orchestrate AI agents with a visual interface.

## Features

- **Multi-Provider LLM Support** — OpenAI, DeepSeek, Qwen (通义千问), GLM (智谱), Moonshot (月之暗面)
- **6 Built-in Tools** — Web search, calculator, HTTP requests, date/time, file reader, code executor
- **Streaming Chat** — Real-time SSE streaming with Markdown rendering and tool call visualization
- **Agent Management** — Create, edit, delete agents; configure model, temperature, system prompt
- **Conversation System** — Multi-conversation support, rename, export (JSON / Markdown)
- **Dark Mode** — Full light/dark theme with smooth transitions
- **Production Ready** — Logging, error handling, request timing, CORS, Docker Compose

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python + FastAPI + SQLAlchemy (async) + SQLite |
| AI Engine | LangChain + LangGraph (React Agent) |
| Frontend | React 18 + TypeScript + Tailwind CSS + Zustand |
| Deployment | Docker Compose |

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- OpenAI API key (or DeepSeek / Qwen / GLM / Moonshot)

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env and set OPENAI_API_KEY=sk-xxx
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### 3. Docker

```bash
OPENAI_API_KEY=sk-xxx docker-compose up
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/stats` | System statistics |
| GET | `/api/providers` | Available LLM providers |
| GET/POST | `/api/agents` | List / Create agents |
| GET/PUT/DELETE | `/api/agents/:id` | Get / Update / Delete agent |
| POST | `/api/agents/:id/tools` | Link tools to agent |
| GET | `/api/tools` | List built-in tools |
| GET/POST | `/api/conversations` | List / Create conversations |
| PATCH/DELETE | `/api/conversations/:id` | Rename / Delete conversation |
| POST | `/api/conversations/:id/chat` | Send message (SSE stream) |
| GET | `/api/conversations/:id/export` | Export conversation (JSON/Markdown) |
| GET/POST | `/api/workflows` | List / Create workflows |

## Project Structure

```
agentflow/
├── backend/
│   ├── app/
│   │   ├── core/               # Config, database, logging, middleware, seed data
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic request/response validation
│   │   ├── services/           # LangChain agent engine + tool definitions
│   │   ├── routers/            # REST API routers
│   │   └── main.py             # FastAPI entry point
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/                # API client
│   │   ├── components/         # Layout, Toast
│   │   ├── pages/              # Dashboard, Agents, Tools, Workflows
│   │   └── types/              # TypeScript type definitions
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Supported Models

| Provider | Models | API Key Env |
|----------|--------|-------------|
| OpenAI | gpt-4o, gpt-4o-mini, gpt-4-turbo | `OPENAI_API_KEY` |
| DeepSeek | deepseek-chat, deepseek-reasoner | `DEEPSEEK_API_KEY` |
| Qwen | qwen-plus, qwen-max, qwen-turbo | `QWEN_API_KEY` |
| GLM | glm-4-flash, glm-4, glm-4-plus | `ZHIPU_API_KEY` |
| Moonshot | moonshot-v1-8k, moonshot-v1-32k | `MOONSHOT_API_KEY` |

Set the corresponding environment variable in `.env` to enable each provider. Falls back to `OPENAI_API_KEY` if provider-specific key is not set.

## Tools

| Tool | Type | Description |
|------|------|-------------|
| Web Search | `web_search` | Search the internet (Tavily integration supported) |
| Calculator | `calculator` | Evaluate mathematical expressions |
| HTTP Request | `http_request` | Make HTTP GET/POST requests |
| Date & Time | `datetime_tool` | Get current date and time |
| File Reader | `file_reader` | Read local file contents |
| Code Executor | `code_executor` | Execute Python code |

Set `TAVILY_API_KEY` in `.env` to enable real web search results.

## License

MIT
