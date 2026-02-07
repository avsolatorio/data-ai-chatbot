"use client";
import type { UseChatHelpers } from "@ai-sdk/react";
import type { ToolUIPart } from "ai";
import equal from "fast-deep-equal";
import { type Dispatch, memo, type SetStateAction, useState } from "react";
import type { ProcessingStage } from "@/hooks/use-data-thinking-stream";
import type { Vote } from "@/lib/db/schema";
import type { ChatMessage, StreamingThinkingPart } from "@/lib/types";
import { isNonRenderableStreamEvent } from "@/lib/types";
import { cn, sanitizeText } from "@/lib/utils";
import { useDataStream } from "./data-stream-provider";
import { ChartPreview } from "./data360/chart-preview";
import { GetData } from "./data360/get-data";
import { DATA360_GET_DATA_TOOL } from "@pcn-js/data360";
import { IngestToolOutput } from "@pcn-js/ui";
import { GetWdiData } from "./data360/get-wdi-data";
import { SearchIndicators } from "./data360/search-indicators";
import { SearchRelevantIndicators } from "./data360/search-relevant-indicators";
import { DocumentToolResult } from "./document";
import { DocumentPreview } from "./document-preview";
import { CodeBlock } from "./elements/code-block";
import { MessageContent } from "./elements/message";
import { Response } from "./elements/response";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "./elements/source";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "./elements/tool";
import {
  getData360SourcesFromParts,
  type Data360SourceEntry,
} from "@/lib/data360";
import { SparklesIcon } from "./icons";
import { parseFollowUps } from "@/lib/parse-follow-ups";
import { ASK_ABOUT_SELECTION_CONTEXT_ATTR } from "./ask-about-selection-toolbar";
import { MessageActions } from "./message-actions";
import {
  parseRegardingPrompt,
  QuotedContextBlock,
  scrollToAndHighlightMessage,
} from "./quoted-context-block";
import { MessageEditor } from "./message-editor";
import { MessageReasoning } from "./message-reasoning";
import { MessageThinking } from "./message-thinking";
import { PreviewAttachment } from "./preview-attachment";
import { Suggestion } from "./elements/suggestion";
import { Weather } from "./weather";

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
                "w-fit break-words rounded-2xl px-3 py-2 text-right text-white":
                  message.role === "user",
                "bg-transparent px-0 py-0 text-left":
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

  if ((type as string) === "tool-data360_get_viz_spec") {
    const toolPart = part as {
      toolCallId: string;
      state:
        | "input-available"
        | "output-available"
        | "input-streaming"
        | "output-error";
      input?: unknown;
      output?: { url: string | null; error: string | null };
    };
    const { toolCallId, state } = toolPart;
    const output = toolPart.output;

    if (output?.error) {
      return (
        <Tool defaultOpen={true} key={toolCallId}>
          <ToolHeader state={state} type="tool-data360_get_viz_spec" />
          <ToolContent>
            {state === "output-available" && (
              <ToolOutput
                errorText={output.error}
                output={null}
                useDefaultFormat={true}
              />
            )}
          </ToolContent>
        </Tool>
      );
    }

    return (
      <Tool defaultOpen={true} key={toolCallId}>
        <ToolHeader state={state} type="tool-data360_get_viz_spec" />
        <ToolContent>
          {state === "input-available" && toolPart.input !== undefined && (
            <ToolInput input={toolPart.input as ToolUIPart["input"]} />
          )}
          {state === "output-available" && output?.url && (
            <ToolOutput
              errorText={undefined}
              output={
                <ChartPreview chartUrl={output.url} isReadonly={isReadonly} />
              }
              useDefaultFormat={false}
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
      <Tool defaultOpen={true} key={toolPart.toolCallId}>
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
      <Tool defaultOpen={true} key={toolPart.toolCallId}>
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
      input: unknown;
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
    return (
      <Tool defaultOpen={true} key={toolPart.toolCallId}>
        <ToolHeader state={toolPart.state} type={type as `tool-${string}`} />
        <ToolContent>
          {toolPart.state === "input-available" && (
            <ToolInput input={toolPart.input} />
          )}
          {toolPart.state === "output-available" && (
            <ToolOutput
              errorText={undefined}
              useDefaultFormat={false}
              output={
                <IngestToolOutput toolName={DATA360_GET_DATA_TOOL} output={toolPart.output}>
                  <GetData output={toolPart.output} />
                </IngestToolOutput>
              }
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
      state: "input-available" | "output-available";
      input: unknown;
      output: {
        count: number;
        total_count: number;
        offset: number;
        has_more: boolean;
        next_offset: number;
        indicators: Array<{
          idno: string;
          name: string;
          database_id: string;
          truncated_definition: string;
          periodicity: string;
          latest_data: string;
          time_period_range: string;
          covers_country: string | null;
          dimensions: string[] | null;
        }>;
        required_country: string | null;
        error: string | null;
      };
    };
    return (
      <Tool defaultOpen={true} key={toolPart.toolCallId}>
        <ToolHeader state={toolPart.state} type={type as `tool-${string}`} />
        <ToolContent>
          {toolPart.state === "input-available" && (
            <ToolInput input={toolPart.input} />
          )}
          {toolPart.state === "output-available" && (
            <ToolOutput
              errorText={undefined}
              useDefaultFormat={false}
              output={<SearchIndicators output={toolPart.output} />}
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
        const jsonOutput = JSON.stringify(output, null, 2);
        outputNode = <CodeBlock code={jsonOutput} language="json" />;
      }
    }

    return (
      <Tool defaultOpen={false} key={toolPart.toolCallId}>
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
}) => {
  const [mode, setMode] = useState<"view" | "edit">("view");

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
          className={cn("flex min-w-0 flex-col", {
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
            // Find the split point: first non-data-thinking part
            // Assumption: data-thinking parts always come first
            const parts = message.parts ?? [];
            const firstRegularPartIndex = parts.findIndex(
              (part) =>
                typeof part.type !== "string" ||
                !part.type.startsWith("data-thinking"),
            );

            // Split parts: thinking parts come first, then regular parts
            const savedThinkingParts =
              firstRegularPartIndex === -1
                ? parts
                : parts.slice(0, firstRegularPartIndex);
            const regularParts =
              firstRegularPartIndex === -1
                ? []
                : parts.slice(firstRegularPartIndex);

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

                {/* Data360 sources: show when assistant used Data360 tools */}
                {message.role === "assistant" && (() => {
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
                        {data360Sources.map((entry: Data360SourceEntry, i) => {
                          const truncated =
                            entry.title.length > MAX_SOURCE_TITLE_LENGTH;
                          const displayTitle = truncated
                            ? `${entry.title
                                .slice(0, MAX_SOURCE_TITLE_LENGTH)
                                .trim()}...`
                            : entry.title;
                          return (
                            <Source
                              href={entry.href ?? "#"}
                              key={`${entry.title}-${i}`}
                              onClick={
                                entry.href
                                  ? undefined
                                  : (e: React.MouseEvent<HTMLAnchorElement>) =>
                                      e.preventDefault()
                              }
                              title={displayTitle}
                              titleAttribute={
                                truncated ? entry.title : undefined
                              }
                            />
                          );
                        })}
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
                          className="h-auto whitespace-normal px-3 py-1.5 text-left text-sm"
                          onClick={() => {
                            window.history.pushState(
                              {},
                              "",
                              `/chat/${chatId}`,
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
                          {suggestion}
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
    if (
      prevProps.followUpSuggestionsPopulateInput !==
      nextProps.followUpSuggestionsPopulateInput
    ) {
      return false;
    }
    if (prevProps.onFollowUpPopulateInput !== nextProps.onFollowUpPopulateInput) {
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
