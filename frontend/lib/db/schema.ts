/**
 * TypeScript types for chat, messages, documents, suggestions, etc.
 * These match the backend DTOs and API responses.
 * The frontend no longer connects to the database; the FastAPI backend owns all DB operations.
 */

import type { LastContext } from "../usage";

export type User = {
  id: string;
  email: string;
  password: string | null;
};

export type Chat = {
  id: string;
  createdAt: Date | string;
  /** Last activity (messages, context, visibility); falls back to createdAt if absent (older API). */
  updatedAt?: Date | string;
  title: string;
  userId: string;
  visibility: "public" | "private";
  lastContext: LastContext | null;
};

/** @deprecated Use DBMessage. */
export type MessageDeprecated = {
  id: string;
  chatId: string;
  role: string;
  content: unknown;
  createdAt: Date | string;
};

export type DBMessage = {
  id: string;
  chatId: string;
  role: string;
  parts: unknown;
  attachments: unknown;
  createdAt: Date | string;
};

/** @deprecated Use Vote. */
export type VoteDeprecated = {
  chatId: string;
  messageId: string;
  isUpvoted: boolean;
};

export type Vote = {
  chatId: string;
  messageId: string;
  isUpvoted: boolean | null;
  feedback: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  voteCreatedAt: Date | string | null;
  voteUpdatedAt: Date | string | null;
  feedbackCreatedAt: Date | string | null;
  feedbackUpdatedAt: Date | string | null;
};

export type Document = {
  id: string;
  createdAt: Date | string;
  title: string;
  content: string | null;
  kind: "text" | "code" | "image" | "sheet";
  userId: string;
};

export type Suggestion = {
  id: string;
  documentId: string;
  documentCreatedAt?: Date | string;
  originalText: string;
  suggestedText: string;
  description: string | null;
  isResolved: boolean;
  userId: string;
  createdAt: Date | string;
};

export type Stream = {
  id: string;
  chatId: string;
  createdAt: Date | string;
};
