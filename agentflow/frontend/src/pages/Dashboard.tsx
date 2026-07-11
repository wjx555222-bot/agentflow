import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bot, Wrench, MessageSquare, GitBranch, Plus, ArrowRight, Loader2, TrendingUp, Activity, Zap } from "lucide-react";
import { api } from "@/api/client";
import type { Agent, Conversation, Tool } from "@/types";

interface Stats { agents: { total: number; active: number }; conversations: { total: number }; tools: { total: number }; }

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.listAgents().then((r) => setAgents(r.agents)),
      api.listConversations().then((r) => setConversations(r.conversations)),
      fetch("/api/stats").then((r) => r.json()).then(setStats),
    ]).finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: "AI Agents", value: stats?.agents.total ?? agents.length, sub: `${stats?.agents.active ?? 0} active`, icon: Bot, color: "from-blue-500 to-cyan-500", bg: "bg-blue-50 dark:bg-blue-950" },
    { label: "Tools", value: stats?.tools.total ?? 6, sub: "6 built-in", icon: Wrench, color: "from-amber-500 to-orange-500", bg: "bg-amber-50 dark:bg-amber-950" },
    { label: "Conversations", value: stats?.conversations.total ?? conversations.length, sub: "Across all agents", icon: MessageSquare, color: "from-emerald-500 to-teal-500", bg: "bg-emerald-50 dark:bg-emerald-950" },
    { label: "Workflows", value: "0", sub: "Coming in v1.2", icon: GitBranch, color: "from-violet-500 to-purple-500", bg: "bg-violet-50 dark:bg-violet-950" },
  ];

  if (loading) {
    return (
      <div className="space-y-6 page-enter">
        <div className="skeleton h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => <div key={i} className="skeleton h-32" />)}
        </div>
        <div className="skeleton h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-8 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Welcome to <span className="gradient-heading">AgentFlow</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1.5">Build, configure, and orchestrate your AI agents</p>
        </div>
        <Link to="/agents" className="btn-primary self-start">
          <Plus className="w-4 h-4" />
          Create Agent
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className="card animate-fade-slide-up overflow-hidden relative"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <div className="absolute top-0 right-0 w-20 h-20 -mr-6 -mt-6 rounded-full opacity-10">
              <div className={`w-full h-full rounded-full bg-gradient-to-br ${card.color}`} />
            </div>
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.label}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1 tracking-tight">{card.value}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{card.sub}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 bg-gradient-to-br ${card.color} bg-clip-text text-transparent`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-500" /> Recent Agents
            </h2>
            <Link to="/agents" className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {agents.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Bot className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No agents yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {agents.slice(0, 5).map((agent) => (
                <Link
                  key={agent.id}
                  to={`/agents/${agent.id}`}
                  className="flex items-center gap-4 p-3.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/40 dark:to-primary-800/40 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Bot className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{agent.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{agent.description || agent.model}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{agent.tool_ids.length} tools</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-primary-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" /> Quick Start
          </h2>
          <div className="space-y-3">
            {[
              { step: "1", title: "Create an Agent", desc: "Define your AI agent with a name, system prompt, and choose a model", to: "/agents" },
              { step: "2", title: "Add Tools", desc: "Equip your agent with tools like web search, calculator, or code execution", to: "/tools" },
              { step: "3", title: "Start Chatting", desc: "Open a conversation and watch your agent use tools autonomously", to: "/agents" },
              { step: "4", title: "Build Workflows", desc: "Orchestrate multiple agents together for complex tasks (coming soon)", to: "/workflows" },
            ].map((item) => (
              <Link
                key={item.step}
                to={item.to}
                className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 text-sm font-bold text-gray-600 dark:text-gray-400 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {item.step}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{item.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
