import type {
  CoreAssistantMessage,
  CoreToolMessage,
  UIMessage,
  UIMessagePart,
} from 'ai';
import { type ClassValue, clsx } from 'clsx';
import { formatISO } from 'date-fns';
import { twMerge } from 'tailwind-merge';
import type { DBMessage, Document } from '@/lib/db/schema';
import { authProvider } from '@/lib/auth/config';
import { getEnv } from '@/lib/env';
import { ChatSDKError, type ErrorCode } from './errors';
import type { ChatMessage, ChatTools, CustomUIDataTypes } from './types';
import { apiFetch } from './api-client';

/** Redirect to Data360 auth URL on 401 (token refresh flow). */
function redirectToData360AuthOn401(): void {
  if (typeof window === 'undefined' || authProvider !== 'data360') return;
  const authUrl = getEnv().NEXT_PUBLIC_DATA360_AUTH_URL;
  if (!authUrl) return;
  const returnTo = encodeURIComponent(window.location.href);
  const redirectUrl = `${authUrl}${authUrl.includes('?') ? '&' : '?'}returnTo=${returnTo}`;
  window.location.href = redirectUrl;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Fetcher for useSWR; pass raw paths (e.g. "/api/vote?chatId=123"). Uses apiFetch which applies basePath. */
export const fetcher = async (url: string) => {
  const response = await apiFetch(url);

  if (!response.ok) {
    if (response.status === 401) redirectToData360AuthOn401();
    const { code, cause } = await response.json();
    throw new ChatSDKError(code as ErrorCode, cause);
  }

  return response.json();
};

/** Like apiFetch but throws ChatSDKError on non-ok. Pass raw paths (e.g. "/api/chat/123"). */
export async function fetchWithErrorHandlers(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  try {
    const response = await apiFetch(input, init);

    if (!response.ok) {
      if (response.status === 401) redirectToData360AuthOn401();
      const body = await response.json().catch(() => ({})) as {
        code?: string;
        cause?: string;
        errorId?: string;
      };
      const { code, cause, errorId } = body;
      if (code) {
        const err = new ChatSDKError(code as ErrorCode, cause);
        if (errorId) err.errorId = errorId;
        throw err;
      }
      // Backend 5xx with { detail, errorId } (no code)
      const err = new ChatSDKError('internal:api');
      if (errorId) err.errorId = errorId;
      throw err;
    }

    return response;
  } catch (error: unknown) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ChatSDKError('offline:chat');
    }

    throw error;
  }
}

/** Allowed localStorage keys for getLocalStorage (non-sensitive UI/preferences only). Do not add tokens or PII. */
const ALLOWED_LOCAL_STORAGE_KEYS = new Set<string>(["input"]);

export function getLocalStorage(key: string): unknown[] {
  if (typeof window === "undefined") return [];
  if (!ALLOWED_LOCAL_STORAGE_KEYS.has(key)) return [];
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as unknown[]) : [];
  } catch {
    return [];
  }
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

type ResponseMessageWithoutId = CoreToolMessage | CoreAssistantMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

export function getMostRecentUserMessage(messages: UIMessage[]) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

export function getDocumentTimestampByIndex(
  documents: Document[],
  index: number,
) {
  if (!documents) { return new Date(); }
  if (index > documents.length) { return new Date(); }

  return documents[index].createdAt;
}

export function getTrailingMessageId({
  messages,
}: {
  messages: ResponseMessage[];
}): string | null {
  const trailingMessage = messages.at(-1);

  if (!trailingMessage) { return null; }

  return trailingMessage.id;
}

export function sanitizeText(text: string) {
  return text
    .replace('<has_function_call>', '')
    // Escape invalid HTML-like tags that React might interpret as components
    // This prevents tags like <blank> from causing React errors
    // Common invalid tags that might appear in AI responses
    .replace(/<blank\b[^>]*>/gi, '&lt;blank&gt;')
    .replace(/<\/blank>/gi, '&lt;/blank&gt;');
}

export function convertToUIMessages(messages: DBMessage[]): ChatMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role as 'user' | 'assistant' | 'system',
    parts: message.parts as UIMessagePart<CustomUIDataTypes, ChatTools>[],
    metadata: {
      createdAt: formatISO(message.createdAt),
    },
  }));
}

export function getTextFromMessage(message: ChatMessage | UIMessage): string {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => (part as { type: 'text'; text: string}).text)
    .join('');
}
