export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

// Fallback when /api/models is not yet loaded.
export const chatModels: ChatModel[] = [
  { id: "chat-model", name: "gpt-5.2", description: "Standard" },
  { id: "chat-model-reasoning", name: "o1-mini", description: "Reasoning" },
];
