import type { UIMessage } from "ai";
import { z } from "zod";
import type { ArtifactKind } from "@/components/artifact";
import type { Suggestion } from "./db/schema";
import type { AppUsage } from "./usage";

export type DataPart = { type: "append-message"; message: string };

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

// Tool type definitions (tools are now implemented in Python/FastAPI)
// These types are kept for TypeScript type inference in ChatMessage
// Using z.any() for tool inputs/outputs since tools are handled by backend
const weatherToolInput = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  city: z.string().optional(),
});

const createDocumentToolInput = z.object({
  title: z.string(),
  kind: z.enum(["text", "code", "image", "sheet"]),
});

const updateDocumentToolInput = z.object({
  id: z.string(),
  description: z.string(),
});

const requestSuggestionsToolInput = z.object({
  documentId: z.string(),
});

// Define tool types that match the structure expected by UIMessage
// These match what InferUITool would generate from the tool definitions
// Tools are now implemented in Python/FastAPI, so output types are any
type weatherTool = {
  input: z.infer<typeof weatherToolInput>;
  output: any; // Weather data structure
};

type createDocumentTool = {
  input: z.infer<typeof createDocumentToolInput>;
  output: any; // Document creation result
};

type updateDocumentTool = {
  input: z.infer<typeof updateDocumentToolInput>;
  output: any; // Document update result
};

type requestSuggestionsTool = {
  input: z.infer<typeof requestSuggestionsToolInput>;
  output: any; // Suggestions result
};

export type ChatTools = {
  getWeather: weatherTool;
  createDocument: createDocumentTool;
  updateDocument: updateDocumentTool;
  requestSuggestions: requestSuggestionsTool;
};

export type CustomUIDataTypes = {
  textDelta: string;
  imageDelta: string;
  sheetDelta: string;
  codeDelta: string;
  suggestion: Suggestion;
  appendMessage: string;
  id: string;
  title: string;
  kind: ArtifactKind;
  clear: null;
  finish: null;
  usage: AppUsage;
  // Quick-answer visual card — persisted as a message part so it survives
  // page reloads and chat history navigation.
  quickAnswerCard: QuickAnswerCardData;
};

export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
>;

export type Attachment = {
  name: string;
  url: string;
  contentType: string;
};

// Stream event types that are not part of the final message parts
export type StreamEventPart =
  | { type: "text-start"; id?: string }
  | { type: "text-delta"; delta: string; id?: string }
  | { type: "text-end"; id?: string }
  | { type: "step-start" }
  | { type: "start" }
  | { type: "finish" };

// Union type that includes both message parts and stream events
export type MessagePartOrStreamEvent =
  | ChatMessage["parts"][number]
  | StreamEventPart;

// Data-thinking part structure
export type DataThinkingPart = {
  type: string;
  id: string;
  data: MessagePartOrStreamEvent;
};

// Accumulated tool part state (mirrors backend app/ai/protocols/stream.py)
export type ToolPartState =
  | ""
  | "input-streaming"
  | "input-available"
  | "output-available"
  | "output-error";

// Text part state (mirrors backend app/ai/protocols/stream.py)
export type TextPartState = "" | "streaming" | "done";

// Streaming thinking part with state tracking
export type StreamingThinkingPart = {
  type: "text";
  text: string;
  state: TextPartState;
  providerMetadata?: Record<string, unknown>;
};

// Node-progress part — emitted by preprocessing nodes (transformer / scout / planner).
// "running" arrives when the node starts; "done" overwrites it when the node finishes.
// Both events share the same stable `id` so the frontend Map entry transitions in-place.
export type NodeProgressPart = {
  type: "node-progress";
  id: string;
  node: "transformer" | "scout" | "planner" | string;
  status: "running" | "done";
  message: string;
};

// Helper to check if a part is a non-renderable stream event
export function isNonRenderableStreamEvent(
  data: unknown,
): data is StreamEventPart {
  if (!data || typeof data !== "object" || !("type" in data)) {
    return false;
  }
  const type = (data as { type: unknown }).type;
  return (
    typeof type === "string" &&
    (type === "text-start" ||
      type === "text-delta" ||
      type === "text-end" ||
      type === "step-start" ||
      // TODO: Check if we need to render data-usage events
      type === "data-usage" ||
      type === "finish")
  );
}

// Type guard for data-thinking events from the stream
export function isDataThinkingEvent(part: unknown): part is {
  type: "data-thinking";
  id: string;
  data: MessagePartOrStreamEvent;
} {
  if (!part || typeof part !== "object") {
    return false;
  }
  const p = part as { type?: unknown; id?: unknown; data?: unknown };
  return (
    p.type === "data-thinking" &&
    typeof p.id === "string" &&
    p.data !== undefined
  );
}

// ---------------------------------------------------------------------------
// Quick Answer card payload types
// ---------------------------------------------------------------------------

/** A single data-point card — derived from data360_get_data tool output. */
export type SingleFactCard = {
  card_type: "single_fact";
  database_name?: string;
  indicator_name: string;
  indicator_id?: string;
  country_name: string;
  unit: string;
  value: number | string | null;
  year: number | string | null;
  claim_id: string;
};

/** A group entry within a trend or comparison card. */
export type TrendGroupEntry = {
  ref_area: string;
  ref_area_name: string;
  latest_value: number | null;
  earliest_value: number | null;
  latest_year: number | null;
  earliest_year: number | null;
  total_change: number | null;
  pct_change: number | null;
  trend_direction: string;
  latest_claim_id: string;
  earliest_claim_id: string;
};

/** A trend card — derived from data360_summarize_data tool output. */
export type TrendCard = {
  card_type: "trend";
  database_name?: string;
  indicator_name: string;
  indicator_id?: string;
  country_name: string;
  unit: string;
  latest_value: number | null;
  earliest_value: number | null;
  latest_year: number | null;
  earliest_year: number | null;
  total_change: number | null;
  pct_change: number | null;
  trend_direction: string;
  latest_claim_id: string;
  earliest_claim_id: string;
  groups: TrendGroupEntry[];
  /** WBG-themed Vega-Lite chart URL, injected by the synthesizer via data360_get_viz_spec. */
  viz_url?: string | null;
};

/** A ranked-comparison entry within a comparison card. */
export type ComparisonEntry = {
  ref_area: string;
  country_name: string;
  value: number | string | null;
  claim_id: string;
  rank: number | null;
};

/** A comparison card — derived from data360_compare_countries tool output. */
export type ComparisonCard = {
  card_type: "comparison";
  database_name?: string;
  indicator_name: string;
  indicator_id?: string;
  unit: string;
  year: number | null;
  entries: ComparisonEntry[];
  delta: number | null;
};

/** Union of all quick-answer card variants. */
export type QuickAnswerCardData =
  | SingleFactCard
  | TrendCard
  | ComparisonCard;
