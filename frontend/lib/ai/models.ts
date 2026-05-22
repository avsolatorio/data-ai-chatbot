export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

// Fallback when /api/models is not yet loaded.
export const chatModels: ChatModel[] = [
  { id: "chat-model", name: "Default model", description: "Standard" },
  { id: "chat-model-reasoning", name: "Reasoning model", description: "Reasoning" },
];
