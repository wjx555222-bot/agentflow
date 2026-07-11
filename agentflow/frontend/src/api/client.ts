const BASE_URL = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || "Request failed");
  }
  return res.json();
}

export const api = {
  listProviders: () =>
    request<{ providers: Record<string, { label: string; base_url: string; models: string[] }> }>("/providers"),

  // Agents
  listAgents: () => request<{ agents: import("@/types").Agent[]; total: number }>("/agents"),
  createAgent: (data: Partial<import("@/types").Agent>) =>
    request<import("@/types").Agent>("/agents", { method: "POST", body: JSON.stringify(data) }),
  getAgent: (id: string) => request<import("@/types").Agent>(`/agents/${id}`),
  updateAgent: (id: string, data: Partial<import("@/types").Agent>) =>
    request<import("@/types").Agent>(`/agents/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteAgent: (id: string) => request<void>(`/agents/${id}`, { method: "DELETE" }),
  linkTools: (agentId: string, toolIds: string[]) =>
    request<import("@/types").Agent>(`/agents/${agentId}/tools`, {
      method: "POST", body: JSON.stringify({ tool_ids: toolIds }),
    }),

  // Tools
  listTools: () => request<{ tools: import("@/types").Tool[]; total: number }>("/tools"),
  createTool: (data: Partial<import("@/types").Tool>) =>
    request<import("@/types").Tool>("/tools", { method: "POST", body: JSON.stringify(data) }),
  deleteTool: (id: string) => request<void>(`/tools/${id}`, { method: "DELETE" }),

  // Workflows
  listWorkflows: () => request<{ workflows: import("@/types").Workflow[]; total: number }>("/workflows"),
  createWorkflow: (data: Partial<import("@/types").Workflow>) =>
    request<import("@/types").Workflow>("/workflows", { method: "POST", body: JSON.stringify(data) }),
  getWorkflow: (id: string) => request<import("@/types").Workflow>(`/workflows/${id}`),
  updateWorkflow: (id: string, data: Partial<import("@/types").Workflow>) =>
    request<import("@/types").Workflow>(`/workflows/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteWorkflow: (id: string) => request<void>(`/workflows/${id}`, { method: "DELETE" }),

  // Conversations
  listConversations: () =>
    request<{ conversations: import("@/types").Conversation[]; total: number }>("/conversations"),
  createConversation: (data: { agent_id: string; title?: string }) =>
    request<import("@/types").Conversation>("/conversations", { method: "POST", body: JSON.stringify(data) }),
  getConversation: (id: string) => request<import("@/types").Conversation>(`/conversations/${id}`),
  updateConversation: (id: string, data: { title: string }) =>
    request<import("@/types").Conversation>(`/conversations/${id}`, {
      method: "PATCH", body: JSON.stringify(data),
    }),
  deleteConversation: (id: string) => request<void>(`/conversations/${id}`, { method: "DELETE" }),
  exportConversation: (id: string, format: "json" | "markdown" = "json") =>
    request<{ format: string; content: string }>(`/conversations/${id}/export?format=${format}`),
};
