export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

// Fallback when /api/models is not yet loaded. Names left empty until API responds.
export const chatModels: ChatModel[] = [
  { id: "chat-model", name: "", description: "chat-model" },
  { id: "chat-model-reasoning", name: "", description: "chat-model-reasoning" },
];
