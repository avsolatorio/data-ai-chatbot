"use client";
import type { UseChatHelpers } from "@ai-sdk/react";
import {
  type Data360VizToolResult,
  isData360VizToolSuccess,
  parseData360VizToolResult,
} from "@data360/tool-types";
import { DATA360_GET_DATA_TOOL } from "@pcn-js/data360";
import { IngestToolOutput } from "@pcn-js/ui";
import type { ToolUIPart } from "ai";
import equal from "fast-deep-equal";
import { MessageSquare } from "lucide-react";
import { type Dispatch, memo, type SetStateAction, useState } from "react";
import { useArtifact } from "@/hooks/use-artifact";
import type { ProcessingStage } from "@/hooks/use-data-thinking-stream";
import {
  buildChartUrlRegexes,
  splitAssistantTextIntoChartSegments,
} from "@/lib/chart-url";
import { getBasePath } from "@/lib/config";
import {
  type Data360SourceEntry,
  findVizOutputMatchingChartUrl,
  getData360SourcesFromParts,
  isIndicatorUrl,
} from "@/lib/data360";
import type { Vote } from "@/lib/db/schema";
import { parseFollowUps } from "@/lib/parse-follow-ups";
import { splitDataThinkingPrefixParts } from "@/lib/split-thinking-parts";
import { defaultOpenForData360Tool } from "@/lib/tool-display";
import {
  type ChatMessage,
  isNonRenderableStreamEvent,
  type NodeProgressPart,
  type StreamingThinkingPart,
} from "@/lib/types";
import type { AppUsage } from "@/lib/usage";
import { cn, sanitizeText } from "@/lib/utils";
import { ASK_ABOUT_SELECTION_CONTEXT_ATTR } from "./ask-about-selection-toolbar";
import { useDataStream } from "./data-stream-provider";
import { ChartPreview } from "./data360/chart-preview";
import { GetData, GetDataRequestSummary } from "./data360/get-data";
import { GetWdiData } from "./data360/get-wdi-data";
import { SearchIndicators } from "./data360/search-indicators";
import { SearchRelevantIndicators } from "./data360/search-relevant-indicators";
import {
  RankCountries,
  type CompactRankingOutput,
} from "./data360/rank-countries";
import {
  SummarizeData,
  type CompactSummaryOutput,
} from "./data360/summarize-data";
import {
  CompareCountries,
  type CompactComparisonOutput,
} from "./data360/compare-countries";
import { DocumentToolResult } from "./document";
import { DocumentPreview } from "./document-preview";
import { CodeBlock } from "./elements/code-block";
import { MessageContent } from "./elements/message";
import { NodeProgress } from "./elements/node-progress";
import { Response } from "./elements/response";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "./elements/source";
import { Suggestion } from "./elements/suggestion";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "./elements/tool";
import { LoaderIcon, SparklesIcon } from "./icons";
import { MessageActions } from "./message-actions";
import { MessageEditor } from "./message-editor";
import { MessageReasoning } from "./message-reasoning";
import { MessageThinking } from "./message-thinking";
import { PreviewAttachment } from "./preview-attachment";
import {
  parseRegardingPrompt,
  QuotedContextBlock,
  scrollToAndHighlightMessage,
} from "./quoted-context-block";
import { Weather } from "./weather";

const CHART_URL_REGEXES = buildChartUrlRegexes();

// Maximum characters of generic JSON tool output to render in the UI.
// Prevents react-syntax-highlighter from blocking the main thread on large payloads.
const MAX_GENERIC_OUTPUT_CHARS = 5000;

// Helper function to render a single message part
// This is extracted to be reusable for nested parts in data-thinking
function renderMessagePart(
  part: ChatMessage["parts"][number],
  key: string,
  options: {
    mode: "view" | "edit";
    setMode: Dispatch<SetStateAction<"view" | "edit">>;
    message: ChatMessage;
    regenerate: UseChatHelpers<ChatMessage>["regenerate"];
    setMessages: UseChatHelpers<ChatMessage>["setMessages"];
    isReadonly: boolean;
    isLoading: boolean;
    onScrollToMessageId?: (messageId: string) => void;
  },
): React.ReactNode {
  const { type } = part;
  const {
    mode,
    setMode,
    message,
    regenerate,
    setMessages,
    isReadonly,
    isLoading,
    onScrollToMessageId,
  } = options;

  if (type === "reasoning" && part.text?.trim().length > 0) {
    return (
      <MessageReasoning isLoading={isLoading} key={key} reasoning={part.text} />
    );
  }

  if (type === "text") {
    if (mode === "view") {
      const isUserWithRegarding =
        message.role === "user" && parseRegardingPrompt(part.text);

      return (
        <div
          key={key}
          className={cn(
            message.role === "user" &&
              isUserWithRegarding &&
              "flex flex-col items-end gap-2",
          )}
          {...(message.role === "assistant"
            ? { [ASK_ABOUT_SELECTION_CONTEXT_ATTR]: "assistant" }
            : {})}
        >
          {isUserWithRegarding && (
            <QuotedContextBlock
              expand
              onQuoteClick={onScrollToMessageId ?? scrollToAndHighlightMessage}
              quotedText={isUserWithRegarding.quoted}
              sourceMessageId={isUserWithRegarding.sourceMessageId}
            />
          )}
          {(isUserWithRegarding
            ? isUserWithRegarding.question.length > 0
            : true) && (
            <MessageContent
              className={cn({
                // iMessage-style: soft corners except a tight bottom-right (anchor side)
                "w-fit break-words rounded-none rounded-br-[4px] rounded-bl-[20px] rounded-tl-[20px] rounded-tr-[20px] max-w-[40rem] px-3 py-3 text-left text-white":
                  message.role === "user",
                // Allow Vega-Lite / vega-embed tooltips to extend past the bubble (inline charts).
                "overflow-visible bg-transparent px-0 py-0 text-left":
                  message.role === "assistant",
              })}
              data-testid="message-content"
              style={
                message.role === "user"
                  ? { backgroundColor: "#006cff" }
                  : undefined
              }
            >
              {isUserWithRegarding ? (
                <Response>
                  {sanitizeText(isUserWithRegarding.question)}
                </Response>
              ) : message.role === "assistant" ? (
                (() => {
                  const segments = splitAssistantTextIntoChartSegments(
                    part.text,
                    CHART_URL_REGEXES,
                  );
                  const hasInlineChart = segments.some(
                    (s) => s.kind === "chart",
                  );
                  if (!hasInlineChart) {
                    return <Response>{sanitizeText(part.text)}</Response>;
                  }
                  return (
                    <>
                      {segments.map((segment) => {
                        if (segment.kind === "text") {
                          if (segment.text.trim().length === 0) {
                            return null;
                          }
                          return (
                            <Response key={`${key}-txt-${segment.startOffset}`}>
                              {sanitizeText(segment.text)}
                            </Response>
                          );
                        }
                        const matchedViz = findVizOutputMatchingChartUrl(
                          message.parts,
                          segment.chartUrl,
                        );
                        const inlineToolResult: Data360VizToolResult =
                          matchedViz != null
                            ? (matchedViz as Data360VizToolResult)
                            : { url: segment.chartUrl, error: null };
                        return (
                          <ChartPreview
                            isReadonly={isReadonly}
                            key={`${key}-chart-${segment.startOffset}`}
                            messageId={message.id}
                            toolResult={inlineToolResult}
                          />
                        );
                      })}
                    </>
                  );
                })()
              ) : (
                <Response>{sanitizeText(part.text)}</Response>
              )}
            </MessageContent>
          )}
        </div>
      );
    }

    if (mode === "edit") {
      return (
        <div className="flex w-full flex-row items-start gap-3" key={key}>
          <div className="size-8" />
          <div className="min-w-0 flex-1">
            <MessageEditor
              key={message.id}
              message={message}
              regenerate={regenerate}
              setMessages={setMessages}
              setMode={setMode}
            />
          </div>
        </div>
      );
    }
  }

  if (type === "tool-getWeather") {
    const { toolCallId, state } = part;

    return (
      <Tool defaultOpen={true} key={toolCallId}>
        <ToolHeader state={state} type="tool-getWeather" />
        <ToolContent>
          {state === "input-available" && <ToolInput input={part.input} />}
          {state === "output-available" && (
            <ToolOutput
              errorText={undefined}
              useDefaultFormat={true}
              output={<Weather weatherAtLocation={part.output} />}
            />
          )}
        </ToolContent>
      </Tool>
    );
  }

  if (type === "tool-createDocument") {
    const { toolCallId } = part;

    if (part.output && "error" in part.output) {
      return (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-500 dark:bg-red-950/50"
          key={toolCallId}
        >
          Error creating document: {String(part.output.error)}
        </div>
      );
    }

    return (
      <DocumentPreview
        isReadonly={isReadonly}
        key={toolCallId}
        messageId={message.id}
        result={part.output}
      />
    );
  }

  if (type === "tool-updateDocument") {
    const { toolCallId } = part;

    if (part.output && "error" in part.output) {
      return (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-500 dark:bg-red-950/50"
          key={toolCallId}
        >
          Error updating document: {String(part.output.error)}
        </div>
      );
    }

    return (
      <div className="relative" key={toolCallId}>
        <DocumentPreview
          args={{ ...part.output, isUpdate: true }}
          isReadonly={isReadonly}
          messageId={message.id}
          result={part.output}
        />
      </div>
    );
  }

  if (type === "tool-requestSuggestions") {
    const { toolCallId, state } = part;

    return (
      <Tool defaultOpen={true} key={toolCallId}>
        <ToolHeader state={state} type="tool-requestSuggestions" />
        <ToolContent>
          {state === "input-available" && <ToolInput input={part.input} />}
          {state === "output-available" && (
            <ToolOutput
              errorText={undefined}
              output={
                "error" in part.output ? (
                  <div className="rounded border p-2 text-red-500">
                    Error: {String(part.output.error)}
                  </div>
                ) : (
                  <DocumentToolResult
                    isReadonly={isReadonly}
                    result={part.output}
                    type="request-suggestions"
                  />
                )
              }
              useDefaultFormat={true}
            />
          )}
        </ToolContent>
      </Tool>
    );
  }

  if (
    (type as string) === "tool-data360_get_viz_spec" ||
    (type as string) === "tool-data360_get_multi_indicator_viz_spec"
  ) {
    const toolHeaderType =
      (type as string) === "tool-data360_get_multi_indicator_viz_spec"
        ? "tool-data360_get_multi_indicator_viz_spec"
        : "tool-data360_get_viz_spec";
    const toolPart = part as {
      toolCallId: string;
      state:
        | "input-available"
        | "output-available"
        | "input-streaming"
        | "output-error";
      input?: unknown;
      output?: unknown;
    };
    const { toolCallId, state } = toolPart;
    const parsed = parseData360VizToolResult(toolPart.output ?? {});
    const output = parsed.success ? parsed.data : null;

    return (
      <Tool
        defaultOpen={defaultOpenForData360Tool(toolHeaderType)}
        key={toolCallId}
      >
        <ToolHeader state={state} type={toolHeaderType} />
        <ToolContent className="ml-0 border-l-0 pl-0">
          {state === "input-available" && toolPart.input !== undefined && (
            <ToolInput input={toolPart.input as ToolUIPart["input"]} />
          )}
          {(state === "input-streaming" ||
            (state === "input-available" && toolPart.input === undefined)) && (
            <div className="flex items-center gap-2 px-1 py-2 text-muted-foreground text-sm">
              <span className="animate-spin">
                <LoaderIcon />
              </span>
              Preparing chart…
            </div>
          )}
          {state === "output-available" && !parsed.success && (
            <ToolOutput
              errorText="Invalid visualization tool output"
              output={null}
              useDefaultFormat={true}
            />
          )}
          {state === "output-available" && parsed.success && output?.error && (
            <ToolOutput
              errorText={output.error}
              output={null}
              useDefaultFormat={true}
            />
          )}
          {state === "output-available" &&
            parsed.success &&
            output &&
            !output.error &&
            isData360VizToolSuccess(output) && (
              <ToolOutput
                errorText={undefined}
                output={
                  <ChartPreview
                    isReadonly={isReadonly}
                    messageId={message.id}
                    toolResult={output}
                  />
                }
                useDefaultFormat={false}
              />
            )}
          {state === "output-available" &&
            parsed.success &&
            output &&
            !output.error &&
            !isData360VizToolSuccess(output) && (
              <ToolOutput
                errorText="Chart data unavailable."
                output={null}
                useDefaultFormat={true}
              />
            )}
        </ToolContent>
      </Tool>
    );
  }

  // Handle Data360 MCP tool outputs
  if ((type as string) === "tool-ai4data_ai4data_mcpget_wdi_data") {
    const toolPart = part as {
      toolCallId: string;
      state: "input-available" | "output-available";
      input: unknown;
      output: {
        data: Array<{
          indicator_id: string;
          indicator_name: string;
          data: Array<{
            country: string;
            date: string;
            value: number | null;
            claim_id: string;
          }>;
        }>;
        note?: Record<string, string>;
      };
    };
    return (
      <Tool
        defaultOpen={defaultOpenForData360Tool(
          "tool-ai4data_ai4data_mcpget_wdi_data",
        )}
        key={toolPart.toolCallId}
      >
        <ToolHeader state={toolPart.state} type={type as `tool-${string}`} />
        <ToolContent>
          {toolPart.state === "input-available" && (
            <ToolInput input={toolPart.input} />
          )}
          {toolPart.state === "output-available" && (
            <ToolOutput
              errorText={undefined}
              useDefaultFormat={true}
              output={<GetWdiData output={toolPart.output} />}
            />
          )}
        </ToolContent>
      </Tool>
    );
  }

  // search_relevant_indicators tool
  if (
    (type as string) === "tool-ai4data_ai4data_mcpsearch_relevant_indicators"
  ) {
    const toolPart = part as {
      toolCallId: string;
      state: "input-available" | "output-available";
      input: unknown;
      output: {
        indicators: Array<{
          idno: string;
          name: string;
        }>;
        note?: string;
      };
    };
    return (
      <Tool
        defaultOpen={defaultOpenForData360Tool(
          "tool-ai4data_ai4data_mcpsearch_relevant_indicators",
        )}
        key={toolPart.toolCallId}
      >
        <ToolHeader state={toolPart.state} type={type as `tool-${string}`} />
        <ToolContent>
          {toolPart.state === "input-available" && (
            <ToolInput input={toolPart.input} />
          )}
          {toolPart.state === "output-available" && (
            <ToolOutput
              errorText={undefined}
              useDefaultFormat={true}
              output={<SearchRelevantIndicators output={toolPart.output} />}
            />
          )}
        </ToolContent>
      </Tool>
    );
  }

  // data360_get_data tool
  if ((type as string) === "tool-data360_get_data") {
    const toolPart = part as {
      toolCallId: string;
      state: "input-available" | "output-available";
      input: Record<string, unknown> | unknown;
      output: {
        count: number;
        total_count: number | null;
        offset: number;
        has_more: boolean;
        next_offset: number | null;
        data: Array<{
          OBS_VALUE: string;
          TIME_FORMAT: string;
          UNIT_MULT: number;
          COMMENT_OBS: string | null;
          OBS_STATUS: string;
          OBS_CONF: string;
          AGG_METHOD: string;
          DECIMALS: number | null;
          COMMENT_TS: string | null;
          DATA_SOURCE: string | null;
          LATEST_DATA: boolean;
          DATABASE_ID: string;
          INDICATOR: string;
          INDICATOR_NAME?: string;
          REF_AREA: string;
          SEX: string;
          AGE: string;
          URBANISATION: string;
          COMP_BREAKDOWN_1: string;
          COMP_BREAKDOWN_2: string;
          COMP_BREAKDOWN_3: string;
          TIME_PERIOD: string;
          FREQ: string;
          UNIT_MEASURE: string;
          UNIT_TYPE: string | null;
          claim_id: string;
        }>;
        error: string | null;
      };
    };
    const getDataInput =
      typeof toolPart.input === "object" && toolPart.input !== null
        ? (() => {
            const raw = toolPart.input as Record<string, unknown>;
            const disaggregation_filters = raw.disaggregation_filters as
              | Record<string, string | null>
              | undefined;
            return {
              database_id:
                typeof raw.database_id === "string"
                  ? raw.database_id
                  : undefined,
              indicator_id:
                typeof raw.indicator_id === "string"
                  ? raw.indicator_id
                  : undefined,
              disaggregation_filters:
                disaggregation_filters &&
                typeof disaggregation_filters === "object"
                  ? disaggregation_filters
                  : undefined,
              start_year:
                typeof raw.start_year === "number" &&
                Number.isFinite(raw.start_year)
                  ? raw.start_year
                  : undefined,
              end_year:
                typeof raw.end_year === "number" &&
                Number.isFinite(raw.end_year)
                  ? raw.end_year
                  : undefined,
              limit:
                typeof raw.limit === "number" && Number.isFinite(raw.limit)
                  ? raw.limit
                  : undefined,
              offset:
                typeof raw.offset === "number" && Number.isFinite(raw.offset)
                  ? raw.offset
                  : undefined,
            };
          })()
        : undefined;
    return (
      <Tool
        defaultOpen={defaultOpenForData360Tool("tool-data360_get_data")}
        key={toolPart.toolCallId}
      >
        <ToolHeader state={toolPart.state} type={type as `tool-${string}`} />
        {toolPart.state === "output-available" && (
          <IngestToolOutput
            output={toolPart.output}
            toolName={DATA360_GET_DATA_TOOL}
          >
            {null}
          </IngestToolOutput>
        )}
        <ToolContent>
          {toolPart.state === "input-available" &&
            (getDataInput != null ? (
              <GetDataRequestSummary input={getDataInput} />
            ) : (
              <ToolInput input={toolPart.input} />
            ))}
          {toolPart.state === "output-available" && (
            <ToolOutput
              errorText={undefined}
              useDefaultFormat={false}
              output={<GetData input={getDataInput} output={toolPart.output} />}
            />
          )}
        </ToolContent>
      </Tool>
    );
  }

  // data360_search_indicators tool
  if ((type as string) === "tool-data360_search_indicators") {
    const toolPart = part as {
      toolCallId: string;
      state:
        | "input-available"
        | "output-available"
        | "input-streaming"
        | "output-error";
      input?: unknown;
      output?: unknown;
    };
    const rawInput =
      typeof toolPart.input === "object" && toolPart.input !== null
        ? (toolPart.input as Record<string, unknown>)
        : null;
    return (
      <Tool
        defaultOpen={defaultOpenForData360Tool(
          "tool-data360_search_indicators",
        )}
        key={toolPart.toolCallId}
      >
        <ToolHeader state={toolPart.state} type={type as `tool-${string}`} />
        <ToolContent>
          {toolPart.state === "input-available" &&
            toolPart.input !== undefined && (
              <ToolInput input={toolPart.input as ToolUIPart["input"]} />
            )}
          {toolPart.state === "output-available" && (
            <ToolOutput
              errorText={undefined}
              useDefaultFormat={false}
              output={
                <SearchIndicators output={toolPart.output} input={rawInput} />
              }
            />
          )}
        </ToolContent>
      </Tool>
    );
  }

  const AGG_TOOL_MAP: Record<
    string,
    { component: React.FC<{ output: any }>; name: string }
  > = {
    "tool-data360_rank_countries": {
      component: RankCountries,
      name: "data360_rank_countries",
    },
    "tool-data360_summarize_data": {
      component: SummarizeData,
      name: "data360_summarize_data",
    },
    "tool-data360_compare_countries": {
      component: CompareCountries,
      name: "data360_compare_countries",
    },
  };

  if (typeof type === "string" && AGG_TOOL_MAP[type]) {
    const { component: Component, name } = AGG_TOOL_MAP[type];
    const toolPart = part as {
      toolCallId: string;
      state:
        | "input-available"
        | "output-available"
        | "input-streaming"
        | "output-error";
      input?: unknown;
      output?: unknown;
    };
    return (
      <Tool
        defaultOpen={defaultOpenForData360Tool(type)}
        key={toolPart.toolCallId}
      >
        <ToolHeader state={toolPart.state} type={type as `tool-${string}`} />
        {toolPart.state === "output-available" && toolPart.output != null && (
          <IngestToolOutput output={toolPart.output} toolName={name}>
            {null}
          </IngestToolOutput>
        )}
        <ToolContent>
          {toolPart.state === "input-available" &&
            toolPart.input !== undefined && (
              <ToolInput input={toolPart.input as ToolUIPart["input"]} />
            )}
          {toolPart.state === "output-available" && toolPart.output != null && (
            <ToolOutput
              errorText={undefined}
              useDefaultFormat={false}
              output={<Component output={toolPart.output} />}
            />
          )}
        </ToolContent>
      </Tool>
    );
  }

  // Generic fallback handler for any tool type starting with "tool-"
  if (typeof type === "string" && type.startsWith("tool-")) {
    const toolPart = part as {
      toolCallId: string;
      state:
        | "input-available"
        | "output-available"
        | "input-streaming"
        | "output-error";
      input?: unknown;
      output?: unknown;
      errorText?: string;
    };

    // Render output as ReactNode
    let outputNode: React.ReactNode = null;
    if (toolPart.output !== null && toolPart.output !== undefined) {
      const output: unknown = toolPart.output;
      if (typeof output === "string") {
        outputNode = <div className="whitespace-pre-wrap">{output}</div>;
      } else {
        let jsonOutput = JSON.stringify(output, null, 2);
        if (jsonOutput.length > MAX_GENERIC_OUTPUT_CHARS) {
          // Snap to the last newline within the limit so we don't split mid-token.
          const cutAt = jsonOutput.lastIndexOf("\n", MAX_GENERIC_OUTPUT_CHARS);
          jsonOutput =
            jsonOutput.slice(0, cutAt > 0 ? cutAt : MAX_GENERIC_OUTPUT_CHARS) +
            "\n\n... (truncated for display. Full output processed by agent)";
        }
        outputNode = <CodeBlock code={jsonOutput} language="json" />;
      }
    }

    const defaultOpenGeneric =
      typeof type === "string" && type.startsWith("tool-data360_")
        ? defaultOpenForData360Tool(type)
        : false;

    return (
      <Tool defaultOpen={defaultOpenGeneric} key={toolPart.toolCallId}>
        <ToolHeader state={toolPart.state} type={type as `tool-${string}`} />
        <ToolContent>
          {(toolPart.state === "input-available" ||
            toolPart.state === "input-streaming") &&
            toolPart.input !== undefined && (
              <ToolInput input={toolPart.input as ToolUIPart["input"]} />
            )}
          {(toolPart.state === "output-available" ||
            toolPart.state === "output-error") && (
            <ToolOutput
              errorText={toolPart.errorText}
              output={outputNode}
              useDefaultFormat={true}
            />
          )}
        </ToolContent>
      </Tool>
    );
  }

  // Preprocessing node progress — animated spinner (running) → checkmark (done)
  if ((type as string) === "node-progress") {
    return (
      <NodeProgress key={key} part={part as unknown as NodeProgressPart} />
    );
  }

  return null;
}

const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  sendMessage,
  setMessages,
  regenerate,
  isReadonly,
  requiresScrollPadding: _requiresScrollPadding,
  isWaitingForSavedParts = false,
  streamingThinkingStage = null,
  streamingThinkingParts = [],
  followUpSuggestionsPopulateInput = true,
  onFollowUpPopulateInput,
  onScrollToMessageId,
  usageOverride,
}: {
  chatId: string;
  message: ChatMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  sendMessage?: UseChatHelpers<ChatMessage>["sendMessage"];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
  isWaitingForSavedParts?: boolean;
  streamingThinkingStage?: ProcessingStage | null;
  streamingThinkingParts?: Array<{
    type: string;
    id: string;
    data: ChatMessage["parts"][number];
  }>;
  followUpSuggestionsPopulateInput?: boolean;
  onFollowUpPopulateInput?: (text: string) => void;
  onScrollToMessageId?: (messageId: string) => void;
  /** Per-message usage from lastContext.byMessageId or stream for last message until refetch */
  usageOverride?: AppUsage;
}) => {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const { setArtifact } = useArtifact();

  const assistantText = message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("\n");
  const followUps = parseFollowUps(assistantText);

  const attachmentsFromMessage = message.parts.filter(
    (part) => part.type === "file",
  );

  useDataStream();

  return (
    <div
      className="group/message fade-in w-full animate-in duration-200"
      data-message-id={message.id}
      data-role={message.role}
      data-testid={`message-${message.role}`}
    >
      <div
        className={cn("flex w-full items-start gap-2 md:gap-3", {
          "justify-end": message.role === "user" && mode !== "edit",
          "justify-start": message.role === "assistant",
        })}
      >
        {message.role === "assistant" && (
          <div className="-mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
            <SparklesIcon size={14} />
          </div>
        )}

        <div
          className={cn("flex min-w-0 flex-col max-w-[50rem]", {
            "gap-2 md:gap-4": message.parts?.some(
              (p) => p.type === "text" && p.text?.trim(),
            ),
            "w-full":
              (message.role === "assistant" &&
                message.parts?.some(
                  (p) => p.type === "text" && p.text?.trim(),
                )) ||
              mode === "edit",
            "max-w-[calc(100%-2.5rem)] sm:max-w-[min(fit-content,80%)]":
              message.role === "user" && mode !== "edit",
          })}
        >
          {attachmentsFromMessage.length > 0 && (
            <div
              className="flex flex-row justify-end gap-2"
              data-testid={"message-attachments"}
            >
              {attachmentsFromMessage.map((attachment) => (
                <PreviewAttachment
                  attachment={{
                    name: attachment.filename ?? "file",
                    contentType: attachment.mediaType,
                    url: attachment.url,
                  }}
                  key={attachment.url}
                />
              ))}
            </div>
          )}

          {(() => {
            // First non-data-thinking part starts the main narrative (text, tools, …).
            const parts = message.parts ?? [];
            const {
              firstRegularPartIndex,
              thinkingParts: savedThinkingParts,
              regularParts,
            } = splitDataThinkingPrefixParts(parts);

            // Filter out non-renderable stream events from saved thinking parts
            const filteredSavedThinkingParts = savedThinkingParts
              .map((part) => {
                const thinkingPart = part as {
                  type: string;
                  id: string;
                  data: unknown;
                };
                return isNonRenderableStreamEvent(thinkingPart.data)
                  ? null
                  : {
                      type: thinkingPart.type,
                      id: thinkingPart.id,
                      data: thinkingPart.data as ChatMessage["parts"][number],
                    };
              })
              .filter(
                (
                  part,
                ): part is {
                  type: string;
                  id: string;
                  data: ChatMessage["parts"][number];
                } => part !== null,
              );

            // Decide whether to use streaming parts or saved parts
            // Use streaming parts if: we have them AND (we're loading OR no saved parts OR waiting for saved parts)
            const hasSavedThinkingParts = filteredSavedThinkingParts.length > 0;
            const shouldUseStreamingParts =
              streamingThinkingParts.length > 0 &&
              (isLoading || !hasSavedThinkingParts || isWaitingForSavedParts);

            // Process and normalize thinking parts (from either streaming or saved)
            const finalThinkingParts: Array<{
              type: string;
              id: string;
              data: ChatMessage["parts"][number];
            }> = [];

            if (shouldUseStreamingParts) {
              // Process streaming parts: filter and strip state property
              for (const part of streamingThinkingParts) {
                const partData = part.data;
                // Filter out non-renderable stream events
                if (isNonRenderableStreamEvent(partData)) {
                  continue;
                }
                // Strip state property from StreamingThinkingPart
                if (
                  typeof partData === "object" &&
                  partData !== null &&
                  "type" in partData &&
                  partData.type === "text" &&
                  "state" in partData
                ) {
                  const { state: _state, ...textPart } =
                    partData as StreamingThinkingPart;
                  finalThinkingParts.push({
                    type: part.type,
                    id: part.id,
                    data: textPart as ChatMessage["parts"][number],
                  });
                } else {
                  // Already a proper message part
                  finalThinkingParts.push({
                    type: part.type,
                    id: part.id,
                    data: partData as ChatMessage["parts"][number],
                  });
                }
              }
            } else {
              // Use saved parts as-is (already filtered above)
              finalThinkingParts.push(...filteredSavedThinkingParts);
            }

            return (
              <>
                {/* Render all nested parts from data-thinking in a single Reasoning component */}
                {finalThinkingParts.length > 0 && (
                  <MessageThinking
                    isLoading={isLoading}
                    isFromSavedParts={!shouldUseStreamingParts}
                    stage={streamingThinkingStage ?? undefined}
                    renderPart={(
                      nestedPart: ChatMessage["parts"][number],
                      nestedKey: string,
                    ) =>
                      renderMessagePart(nestedPart, nestedKey, {
                        mode,
                        setMode,
                        message,
                        regenerate,
                        setMessages,
                        isReadonly,
                        isLoading,
                        onScrollToMessageId,
                      })
                    }
                    thinkingParts={finalThinkingParts}
                  />
                )}

                {/* Render regular parts normally */}
                {regularParts.map((part, index) => {
                  const key = `message-${message.id}-part-${
                    firstRegularPartIndex + index
                  }`;
                  return renderMessagePart(part, key, {
                    mode,
                    setMode,
                    message,
                    regenerate,
                    setMessages,
                    isReadonly,
                    isLoading,
                    onScrollToMessageId,
                  });
                })}

                {message.role === "assistant" &&
                  regularParts.length === 0 &&
                  finalThinkingParts.length > 0 &&
                  !isLoading && (
                    <p
                      className="mt-2 text-muted-foreground text-sm"
                      data-testid="narrative-empty-thinking-only"
                    >
                      Full response is in the thinking panel above.
                    </p>
                  )}

                {/* Data360 sources: show when assistant used Data360 tools */}
                {message.role === "assistant" &&
                  (() => {
                    const MAX_SOURCE_TITLE_LENGTH = 50;
                    const allPartsForSources = [
                      ...finalThinkingParts.map((p) => p.data),
                      ...regularParts,
                    ];
                    const data360Sources =
                      getData360SourcesFromParts(allPartsForSources);
                    if (data360Sources.length === 0) {
                      return null;
                    }
                    return (
                      <Sources className="mt-2">
                        <SourcesTrigger count={data360Sources.length} />
                        <SourcesContent>
                          {data360Sources.map(
                            (entry: Data360SourceEntry, i) => {
                              const truncated =
                                entry.title.length > MAX_SOURCE_TITLE_LENGTH;
                              const displayTitle = truncated
                                ? `${entry.title
                                    .slice(0, MAX_SOURCE_TITLE_LENGTH)
                                    .trim()}...`
                                : entry.title;
                              const openInEmbed =
                                entry.href && isIndicatorUrl(entry.href);
                              return (
                                <Source
                                  href={entry.href ?? "#"}
                                  key={`${entry.title}-${i}`}
                                  onClick={
                                    openInEmbed
                                      ? (
                                          e: React.MouseEvent<HTMLAnchorElement>,
                                        ) => {
                                          e.preventDefault();
                                          setArtifact({
                                            boundingBox: {
                                              height: 300,
                                              left: 0,
                                              top: 0,
                                              width: 400,
                                            },
                                            content: entry.href as string,
                                            documentId: "init",
                                            isVisible: true,
                                            kind: "embed",
                                            status: "idle",
                                            title: entry.title,
                                            triggerMessageId: message.id,
                                          });
                                        }
                                      : entry.href
                                        ? undefined
                                        : (
                                            e: React.MouseEvent<HTMLAnchorElement>,
                                          ) => e.preventDefault()
                                  }
                                  title={displayTitle}
                                  titleAttribute={
                                    truncated ? entry.title : undefined
                                  }
                                />
                              );
                            },
                          )}
                        </SourcesContent>
                      </Sources>
                    );
                  })()}

                {/* Suggested follow-ups: parse from assistant text and render as clickable chips — only after response is complete to avoid distraction during streaming */}
                {message.role === "assistant" &&
                  followUps.length > 0 &&
                  sendMessage &&
                  !isReadonly &&
                  !isLoading && (
                    <div
                      className="mt-2 flex flex-wrap gap-2"
                      data-testid="follow-up-suggestions"
                    >
                      {followUps.map((suggestion) => (
                        <Suggestion
                          key={suggestion}
                          className="h-auto gap-2 whitespace-normal px-3 py-1.5 text-left text-sm"
                          onClick={() => {
                            window.history.pushState(
                              {},
                              "",
                              `${getBasePath()}/chat/${chatId}`,
                            );
                            if (
                              followUpSuggestionsPopulateInput &&
                              onFollowUpPopulateInput
                            ) {
                              onFollowUpPopulateInput(suggestion);
                            } else if (sendMessage) {
                              sendMessage({
                                role: "user",
                                parts: [{ type: "text", text: suggestion }],
                              });
                            }
                          }}
                          suggestion={suggestion}
                        >
                          <span className="inline-flex items-start gap-2">
                            <MessageSquare
                              aria-hidden
                              className="mt-0.5 size-4 shrink-0 opacity-70"
                            />
                            <span>{suggestion}</span>
                          </span>
                        </Suggestion>
                      ))}
                    </div>
                  )}
              </>
            );
          })()}

          {!isReadonly && (
            <MessageActions
              chatId={chatId}
              isLoading={isLoading}
              key={`action-${message.id}`}
              message={message}
              setMode={setMode}
              usageOverride={usageOverride}
              vote={vote}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) {
      return false;
    }
    if (prevProps.message.id !== nextProps.message.id) {
      return false;
    }
    if (prevProps.requiresScrollPadding !== nextProps.requiresScrollPadding) {
      return false;
    }
    if (!equal(prevProps.message.parts, nextProps.message.parts)) {
      return false;
    }
    if (!equal(prevProps.vote, nextProps.vote)) {
      return false;
    }
    if (
      !equal(prevProps.streamingThinkingParts, nextProps.streamingThinkingParts)
    ) {
      return false;
    }
    if (prevProps.streamingThinkingStage !== nextProps.streamingThinkingStage) {
      return false;
    }
    if (prevProps.sendMessage !== nextProps.sendMessage) {
      return false;
    }
    if (!equal(prevProps.usageOverride, nextProps.usageOverride)) {
      return false;
    }
    if (
      prevProps.followUpSuggestionsPopulateInput !==
      nextProps.followUpSuggestionsPopulateInput
    ) {
      return false;
    }
    if (
      prevProps.onFollowUpPopulateInput !== nextProps.onFollowUpPopulateInput
    ) {
      return false;
    }
    if (prevProps.onScrollToMessageId !== nextProps.onScrollToMessageId) {
      return false;
    }

    return true;
  },
);

export const ThinkingMessage = () => {
  return (
    <div
      className="group/message fade-in w-full animate-in duration-300"
      data-role="assistant"
      data-testid="message-assistant-loading"
    >
      <div className="flex items-start justify-start gap-3">
        <div className="-mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
          <div className="animate-pulse">
            <SparklesIcon size={14} />
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 md:gap-4">
          <div className="flex items-center gap-1 p-0 text-muted-foreground text-sm">
            <span className="animate-pulse">Thinking</span>
            <span className="inline-flex">
              <span className="animate-bounce [animation-delay:0ms]">.</span>
              <span className="animate-bounce [animation-delay:150ms]">.</span>
              <span className="animate-bounce [animation-delay:300ms]">.</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
