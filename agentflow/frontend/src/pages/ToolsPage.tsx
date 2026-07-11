import { useEffect, useState } from "react";
import { Wrench, Trash2, Globe, Code, Terminal, Clock, FileText, Calculator } from "lucide-react";
import { api } from "@/api/client";
import type { Tool } from "@/types";

const TOOL_META: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  web_search: { icon: <Globe className="w-5 h-5" />, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950" },
  calculator: { icon: <Calculator className="w-5 h-5" />, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950" },
  http_request: { icon: <Terminal className="w-5 h-5" />, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950" },
  datetime_tool: { icon: <Clock className="w-5 h-5" />, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950" },
  file_reader: { icon: <FileText className="w-5 h-5" />, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950" },
  code_executor: { icon: <Code className="w-5 h-5" />, color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-950" },
};

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listTools().then((r) => setTools(r.tools)).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    await api.deleteTool(id);
    setTools((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Tools</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Extensions that empower your agents with real capabilities</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="card">
              <div className="flex items-start gap-3 mb-4">
                <div className="skeleton w-10 h-10 rounded-xl" />
                <div className="flex-1"><div className="skeleton h-5 w-28 mb-2" /><div className="skeleton h-3 w-16" /></div>
              </div>
              <div className="skeleton h-4 w-full mb-3" />
              <div className="skeleton h-4 w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool, i) => {
            const meta = TOOL_META[tool.tool_type] || { icon: <Wrench className="w-5 h-5" />, color: "text-gray-600", bg: "bg-gray-50 dark:bg-gray-800" };
            return (
              <div key={tool.id} className="card animate-fade-slide-up group" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                      <div className={meta.color}>{meta.icon}</div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{tool.display_name}</h3>
                      <p className="text-[11px] text-gray-400 font-mono">{tool.tool_type}</p>
                    </div>
                  </div>
                  {tool.is_builtin && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">Built-in</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{tool.description}</p>
                {!tool.is_builtin && (
                  <div className="flex justify-end mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
                    <button onClick={() => handleDelete(tool.id)} className="btn-ghost !p-2 !text-red-500 !text-xs">
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
