export interface Agent {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  model: string;
  temperature: number;
  max_tokens: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tool_ids: string[];
}

export interface Tool {
  id: string;
  name: string;
  display_name: string;
  description: string;
  tool_type: string;
  config: string;
  is_builtin: boolean;
  created_at: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: string;
  edges: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  tool_calls: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  agent_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

export interface ChatChunk {
  type: "text" | "tool_start" | "tool_call" | "tool_result" | "done" | "error";
  content: string;
  tool_call?: Record<string, unknown>;
}
