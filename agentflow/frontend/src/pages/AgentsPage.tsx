import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Bot, Plus, Trash2, Settings, Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { api } from "@/api/client";
import { useToastStore } from "@/components/Toast";
import type { Agent } from "@/types";

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", system_prompt: "You are a helpful AI assistant." });
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const toast = useToastStore((s) => s.addToast);

  const fetchAgents = useCallback(async () => {
    try {
      const r = await api.listAgents();
      setAgents(r.agents);
    } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      await api.createAgent(form);
      setForm({ name: "", description: "", system_prompt: "You are a helpful AI assistant." });
      setShowCreate(false);
      toast("Agent created successfully", "success");
      fetchAgents();
    } catch {
      toast("Failed to create agent", "error");
    }
    setCreating(false);
  };

  const handleDelete = async (id: string, name: string) => {
    setDeleting(id);
    try {
      await api.deleteAgent(id);
      toast(`"${name}" deleted`, "success");
      fetchAgents();
    } catch {
      toast("Failed to delete", "error");
    }
    setDeleting(null);
  };

  const filtered = agents.filter((a) =>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Agents</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Create and manage your AI agents</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Create Agent
        </button>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input-field pl-10"
            placeholder="Search agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {search && (
          <span className="text-sm text-gray-500 dark:text-gray-400">{filtered.length} of {agents.length} agents</span>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-gray-850 rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-gray-100 dark:border-gray-800 animate-fade-slide-up" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New Agent</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
                <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Code Reviewer" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                <input className="input-field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What does this agent do?" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">System Prompt</label>
                <textarea className="input-field resize-none" rows={4} value={form.system_prompt} onChange={(e) => setForm({ ...form, system_prompt: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleCreate} disabled={creating} className="btn-primary">{creating ? "Creating..." : "Create Agent"}</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card">
              <div className="flex items-start gap-3 mb-4">
                <div className="skeleton w-10 h-10 rounded-xl" />
                <div className="flex-1">
                  <div className="skeleton h-5 w-32 mb-2" />
                  <div className="skeleton h-3 w-20" />
                </div>
              </div>
              <div className="skeleton h-4 w-full mb-3" />
              <div className="skeleton h-4 w-3/4 mb-4" />
              <div className="flex justify-between">
                <div className="skeleton h-5 w-16" />
                <div className="skeleton h-8 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-5">
            <Bot className="w-10 h-10 text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-lg font-medium text-gray-500 dark:text-gray-400">{search ? "No agents match your search" : "No agents yet"}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{search ? "Try a different keyword" : "Create your first AI agent to get started"}</p>
          {!search && (
            <button onClick={() => setShowCreate(true)} className="btn-primary mt-5">
              <Plus className="w-4 h-4" /> Create Your First Agent
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((agent, i) => (
            <div key={agent.id} className="card animate-fade-slide-up group" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/40 dark:to-primary-800/40 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Bot className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{agent.name}</h3>
                    <p className="text-[11px] text-gray-400 font-mono">{agent.model}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${agent.is_active ? "bg-emerald-400 animate-pulse-glow" : "bg-gray-300 dark:bg-gray-600"}`} />
                  <span className="text-[10px] text-gray-400">{agent.is_active ? "Active" : "Inactive"}</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">{agent.description || "No description"}</p>
              <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-800">
                <span className="text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">{agent.tool_ids.length} tools</span>
                <div className="flex items-center gap-1.5">
                  <Link to={`/agents/${agent.id}`} className="btn-ghost !px-3 !py-1.5 text-xs">
                    <Settings className="w-3 h-3" /> Configure
                  </Link>
                  <button
                    onClick={() => handleDelete(agent.id, agent.name)}
                    disabled={deleting === agent.id}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    {deleting === agent.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
