import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Send, Bot, User, Wrench, Loader2, ArrowLeft, Plus, Trash2, Download, MessageSquare,
  Settings2, Check, X, Pencil, Sparkles, Brain, Code, Globe, Terminal, FileText, Clock, ChevronRight
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { api } from "@/api/client";
import { useToastStore } from "@/components/Toast";
import type { Agent, Conversation, Message, Tool } from "@/types";

interface ProviderInfo { label: string; base_url: string; models: string[]; }

const TOOL_ICONS: Record<string, React.ReactNode> = {
  web_search: <Globe className="w-3.5 h-3.5" />,
  calculator: <Code className="w-3.5 h-3.5" />,
  http_request: <Terminal className="w-3.5 h-3.5" />,
  datetime_tool: <Clock className="w-3.5 h-3.5" />,
  file_reader: <FileText className="w-3.5 h-3.5" />,
  code_executor: <Code className="w-3.5 h-3.5" />,
};

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToastStore((s) => s.addToast);

  const [agent, setAgent] = useState<Agent | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [toolLogs, setToolLogs] = useState<{ name: string; input: string; output: string; state: "running" | "done" }[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [providers, setProviders] = useState<Record<string, ProviderInfo>>({});
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "", system_prompt: "", model: "", temperature: 0.7, max_tokens: 2048 });
  const [saving, setSaving] = useState(false);
  const [renamingConv, setRenamingConv] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const fetchAgent = useCallback(async () => {
    if (!id) return;
    const a = await api.getAgent(id);
    setAgent(a);
    setEditForm({ name: a.name, description: a.description, system_prompt: a.system_prompt, model: a.model, temperature: a.temperature, max_tokens: a.max_tokens });
  }, [id]);

  const fetchConversations = useCallback(async () => {
    const r = await api.listConversations();
    setConversations(r.conversations.filter((c: Conversation) => c.agent_id === id));
  }, [id]);

  useEffect(() => {
    fetchAgent(); fetchConversations();
    api.listTools().then((r) => setTools(r.tools));
    api.listProviders().then((r) => setProviders(r.providers));
  }, [fetchAgent, fetchConversations]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streamText, toolLogs]);

  const startConversation = async () => {
    if (!id) return;
    const conv = await api.createConversation({ agent_id: id, title: `Chat ${conversations.length + 1}` });
    setConversations((prev) => [conv, ...prev]);
    setActiveConvId(conv.id);
    setMessages([]);
    setToolLogs([]);
    setStreamText("");
  };

  const selectConversation = async (convId: string) => {
    const conv = await api.getConversation(convId);
    setActiveConvId(convId);
    setMessages(conv.messages || []);
    setToolLogs([]);
    setStreamText("");
  };

  const deleteConversation = async (convId: string) => {
    await api.deleteConversation(convId);
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    if (activeConvId === convId) { setActiveConvId(null); setMessages([]); }
    toast("Conversation deleted", "success");
  };

  const renameConversation = async (convId: string) => {
    if (!renameTitle.trim()) return;
    await api.updateConversation(convId, { title: renameTitle });
    setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, title: renameTitle } : c)));
    setRenamingConv(null);
    toast("Renamed", "success");
  };

  const exportConversation = async (convId: string, format: "json" | "markdown") => {
    const result = await api.exportConversation(convId, format);
    const blob = new Blob([result.content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `conversation.${format === "json" ? "json" : "md"}`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast(`Exported as ${format.toUpperCase()}`, "success");
  };

  const handleSaveAgent = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const updated = await api.updateAgent(id, editForm);
      setAgent(updated);
      setEditing(false);
      toast("Agent settings saved", "success");
    } catch { toast("Failed to save", "error"); }
    setSaving(false);
  };

  const handleSend = async () => {
    if (!input.trim() || streaming) return;
    let convId = activeConvId;
    if (!convId) {
      if (!id) return;
      const conv = await api.createConversation({ agent_id: id, title: `Chat ${conversations.length + 1}` });
      setConversations((prev) => [conv, ...prev]);
      convId = conv.id;
      setActiveConvId(convId);
    }

    const userMsg: Message = { id: Date.now().toString(), conversation_id: convId, role: "user", content: input, tool_calls: "[]", created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setStreaming(true);
    setStreamText("");
    setToolLogs([]);

    try {
      const res = await fetch(`/api/conversations/${convId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.content }),
      });
      if (!res.ok) throw new Error("Chat request failed");
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const chunk = JSON.parse(line.slice(6));
            if (chunk.type === "text") { fullText += chunk.content; setStreamText(fullText); }
            else if (chunk.type === "tool_call" || chunk.type === "tool_start") {
              let name = chunk.content;
              try { const p = JSON.parse(chunk.content); name = p.name; } catch {}
              setToolLogs((prev) => [...prev, { name, input: "", output: "", state: "running" }]);
            } else if (chunk.type === "tool_result") {
              setToolLogs((prev) => {
                const updated = [...prev];
                const last = updated.findLast((t) => t.state === "running");
                if (last) { last.output = chunk.content?.slice(0, 300) || ""; last.state = "done"; }
                return updated;
              });
            } else if (chunk.type === "done") {
              setMessages((prev) => [...prev, { id: Date.now().toString(), conversation_id: convId!, role: "assistant", content: fullText, tool_calls: "[]", created_at: new Date().toISOString() }]);
              setStreamText("");
            }
          } catch { /* skip */ }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) toast(err.message, "error");
    }
    setStreaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const toggleTool = async (toolId: string) => {
    if (!agent) return;
    const hasTool = agent.tool_ids.includes(toolId);
    const newIds = hasTool ? agent.tool_ids.filter((tid) => tid !== toolId) : [...agent.tool_ids, toolId];
    const updated = await api.linkTools(agent.id, newIds);
    setAgent(updated);
    toast(hasTool ? "Tool removed" : "Tool added", "success");
  };

  const allModels = Object.values(providers).flatMap((p) => p.models);

  if (!agent) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;

  return (
    <div className="flex h-[calc(100vh-5rem)] gap-4 page-enter">
      {/* Left: Conversation List */}
      <div className="w-60 flex-shrink-0 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => navigate("/agents")} className="btn-ghost !p-2"><ArrowLeft className="w-4 h-4" /></button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">{agent.name}</h1>
        </div>
        <button onClick={startConversation} className="btn-primary w-full mb-3 text-sm !py-2"><Plus className="w-4 h-4" />New Chat</button>
        <div className="flex-1 overflow-y-auto space-y-0.5">
          {conversations.map((conv) => (
            <div key={conv.id} className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${activeConvId === conv.id ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"}`}>
              {renamingConv === conv.id ? (
                <div className="flex-1 flex items-center gap-1">
                  <input className="input-field !py-1 !text-xs !rounded-lg" value={renameTitle} onChange={(e) => setRenameTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") renameConversation(conv.id); if (e.key === "Escape") setRenamingConv(null); }} autoFocus />
                  <button onClick={() => renameConversation(conv.id)} className="p-1 text-green-500"><Check className="w-3 h-3" /></button>
                  <button onClick={() => setRenamingConv(null)} className="p-1 text-gray-400"><X className="w-3 h-3" /></button>
                </div>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 truncate" onClick={() => selectConversation(conv.id)}>{conv.title}</span>
                  <div className="hidden group-hover:flex items-center gap-0.5">
                    <button onClick={(e) => { e.stopPropagation(); setRenamingConv(conv.id); setRenameTitle(conv.title); }} className="p-1 text-gray-400 hover:text-gray-600 rounded"><Pencil className="w-3 h-3" /></button>
                    <button onClick={(e) => { e.stopPropagation(); exportConversation(conv.id, "markdown"); }} className="p-1 text-gray-400 hover:text-primary-600 rounded"><Download className="w-3 h-3" /></button>
                    <button onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Center: Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 mb-4">
          {!activeConvId && (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-100 to-violet-100 dark:from-primary-900/30 dark:to-violet-900/30 flex items-center justify-center mb-5">
                <Sparkles className="w-10 h-10 text-primary-500 dark:text-primary-400" />
              </div>
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">{agent.name}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 text-center max-w-xs">{agent.description || "Start a conversation with this AI agent"}</p>
              <button onClick={startConversation} className="btn-primary mt-6"><Plus className="w-4 h-4" />New Conversation</button>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 mb-6 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role !== "user" && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-400 to-violet-400 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Brain className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={`max-w-[78%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-md shadow-primary-600/20" : "bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"}`}>
                {msg.role === "user" ? (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-code:text-primary-600 dark:prose-code:text-primary-400 prose-headings:text-gray-900 dark:prose-headings:text-white">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-500 dark:text-gray-300" />
                </div>
              )}
            </div>
          ))}

          {streaming && streamText && (
            <div className="flex gap-3 mb-6">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-400 to-violet-400 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div className="max-w-[78%] rounded-2xl px-4 py-3 bg-gray-50 dark:bg-gray-800">
                <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-gray-900 prose-pre:text-gray-100">
                  <ReactMarkdown>{streamText}</ReactMarkdown>
                </div>
                <span className="inline-block w-2 h-4 bg-primary-500 animate-pulse ml-0.5 rounded-sm align-text-bottom" />
              </div>
            </div>
          )}

          {toolLogs.length > 0 && (
            <div className="mx-12 mb-4 space-y-2">
              {toolLogs.map((log, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border text-sm transition-all ${
                  log.state === "running"
                    ? "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20"
                    : "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
                }`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${log.state === "running" ? "bg-amber-200 dark:bg-amber-800 text-amber-700" : "bg-green-200 dark:bg-green-800 text-green-700"}`}>
                    {log.state === "running" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Wrench className="w-3 h-3 text-gray-400" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">{log.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500">{log.state === "running" ? "Running..." : "Done"}</span>
                    </div>
                    {log.output && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-3 font-mono">{log.output}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        <div className="flex gap-3">
          <textarea
            ref={inputRef}
            className="input-field flex-1 resize-none !rounded-2xl !py-3"
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${agent.name} anything... (Enter to send)`}
            disabled={streaming}
          />
          <button onClick={handleSend} disabled={streaming || !input.trim()} className="btn-primary self-end !rounded-2xl !px-4">
            {streaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Right: Settings */}
      <div className="w-[260px] flex-shrink-0 space-y-4 overflow-y-auto">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-sm"><Settings2 className="w-4 h-4 text-gray-400" />Settings</h3>
            <button onClick={() => setEditing(!editing)} className="text-xs font-medium text-primary-600 hover:text-primary-700">{editing ? "Cancel" : "Edit"}</button>
          </div>
          {editing ? (
            <div className="space-y-3">
              <div><label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">Name</label><input className="input-field !text-xs" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
              <div><label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">Description</label><input className="input-field !text-xs" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} /></div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">Model</label>
                <select className="input-field !text-xs" value={editForm.model} onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}>
                  {Object.entries(providers).map(([pid, pinfo]) => (
                    <optgroup key={pid} label={pinfo.label}>{pinfo.models.map((m) => <option key={m} value={m}>{m}</option>)}</optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">Temperature: <span className="text-primary-600">{editForm.temperature}</span></label>
                <input type="range" min="0" max="2" step="0.1" value={editForm.temperature} onChange={(e) => setEditForm({ ...editForm, temperature: parseFloat(e.target.value) })} className="w-full accent-primary-600" />
              </div>
              <div><label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">System Prompt</label><textarea className="input-field !text-xs" rows={5} value={editForm.system_prompt} onChange={(e) => setEditForm({ ...editForm, system_prompt: e.target.value })} /></div>
              <button onClick={handleSaveAgent} disabled={saving} className="btn-primary w-full !text-xs !py-2">{saving ? "Saving..." : "Save Changes"}</button>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div><label className="text-[11px] font-medium text-gray-400">Name</label><p className="text-gray-900 dark:text-white font-medium">{agent.name}</p></div>
              <div><label className="text-[11px] font-medium text-gray-400">Model</label><p className="text-gray-700 dark:text-gray-300 text-xs font-mono">{agent.model}</p></div>
              <div><label className="text-[11px] font-medium text-gray-400">Temperature</label><p className="text-gray-700 dark:text-gray-300">{agent.temperature}</p></div>
              <div><label className="text-[11px] font-medium text-gray-400">System Prompt</label><p className="text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-2 max-h-24 overflow-y-auto text-xs leading-relaxed">{agent.system_prompt}</p></div>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm"><Wrench className="w-4 h-4 text-gray-400" />Tools ({agent.tool_ids.length})</h3>
          <div className="space-y-1.5">
            {tools.map((tool) => {
              const isLinked = agent.tool_ids.includes(tool.id);
              return (
                <label key={tool.id} className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${isLinked ? "border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/20 shadow-sm" : "border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700"}`}>
                  <input type="checkbox" checked={isLinked} onChange={() => toggleTool(tool.id)} className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 w-4 h-4" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400">{TOOL_ICONS[tool.tool_type] || <Wrench className="w-3 h-3" />}</span>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{tool.display_name}</p>
                    </div>
                    <p className="text-[10px] text-gray-400 truncate mt-0.5">{tool.description}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
