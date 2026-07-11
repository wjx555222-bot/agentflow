import { useEffect, useState } from "react";
import { GitBranch, Plus, Trash2 } from "lucide-react";
import { api } from "@/api/client";
import type { Workflow } from "@/types";

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);

  const fetchWorkflows = async () => {
    const r = await api.listWorkflows();
    setWorkflows(r.workflows);
  };

  useEffect(() => { fetchWorkflows(); }, []);

  const handleDelete = async (id: string) => {
    await api.deleteWorkflow(id);
    fetchWorkflows();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workflows</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Orchestrate multi-agent workflows</p>
        </div>
      </div>

      {workflows.length === 0 ? (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          <GitBranch className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg">No workflows yet</p>
          <p className="text-sm mt-1">Workflow orchestration (visual editor) coming in v1.2</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows.map((wf) => (
            <div key={wf.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <GitBranch className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{wf.name}</h3>
                    <p className="text-xs text-gray-400">Workflow</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{wf.description || "No description"}</p>
              <div className="flex justify-end">
                <button onClick={() => handleDelete(wf.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
