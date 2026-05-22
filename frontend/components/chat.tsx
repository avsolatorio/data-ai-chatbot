"use client";

import { useChat } from "@ai-sdk/react";
import { IngestSessionData360 } from "@pcn-js/data360";
import { DefaultChatTransport } from "ai";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { ChatHeader } from "@/components/chat-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useArtifactSelector } from "@/hooks/use-artifact";
import { useAutoResume } from "@/hooks/use-auto-resume";
import { useChatVisibility } from "@/hooks/use-chat-visibility";
import { useDataThinkingStream } from "@/hooks/use-data-thinking-stream";
import { useHomeConfig } from "@/hooks/use-home-config";
import { getApiUrl } from "@/lib/api-client";
import { getBasePath } from "@/lib/config";
import type { DBMessage, Vote } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";
import type { Attachment, ChatMessage } from "@/lib/types";
import {
  type AppUsage,
  aggregateUsage,
  getLatestUsage,
  getUsageByMessageId,
  type LastContext,
} from "@/lib/usage";
import {
  cn,
  convertToUIMessages,
  fetcher,
  fetchWithErrorHandlers,
  generateUUID,
} from "@/lib/utils";
import { Artifact } from "./artifact";
import { AskAboutSelectionToolbar } from "./ask-about-selection-toolbar";
import { useDataStream } from "./data-stream-provider";
import { Greeting } from "./greeting";
import { Messages } from "./messages";
import {
  MultimodalInput,
  type MultimodalInputHandle,
} from "./multimodal-input";
import { PcnManagerDebug } from "./pcn-manager-debug";
import { PreIngestSessionClaims } from "./data360/pcn-provider-client";
import { getChatHistoryPaginationKey } from "./sidebar-history";
import { toast } from "./toast";
import type { VisibilityType } from "./visibility-selector";

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  autoResume,
  lastContext,
  fillParentHeight = false,
  reviewMode = false,
}: {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  autoResume: boolean;
  /** From API: { latest, byMessageId } or legacy plain usage */
  lastContext?: LastContext | null;
  fillParentHeight?: boolean;
  reviewMode?: boolean;
}) {
  const router = useRouter();

  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

  const { mutate } = useSWRConfig();

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      // When user navigates back/forward, refresh to sync with URL
      router.refresh();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [router]);
  const { setDataStream } = useDataStream();

  const [input, setInput] = useState<string>("");
  const [usage, setUsage] = useState<AppUsage | undefined>(() =>
    getLatestUsage(lastContext),
  );
  const latestUsageRef = useRef<AppUsage | undefined>(undefined);
  const [showCreditCardAlert, setShowCreditCardAlert] = useState(false);
  const [currentModelId, setCurrentModelId] = useState(initialChatModel);
  const currentModelIdRef = useRef(currentModelId);
  // Track if we're waiting for saved parts to arrive after streaming finishes
  // Use ref for synchronous access, state for reactivity
  // Note: We keep streaming parts visible indefinitely - they're saved by backend for page refresh
  const isWaitingForSavedPartsRef = useRef(false);
  const [isWaitingForSavedParts, setIsWaitingForSavedParts] = useState(false);
  // lastContext is the canonical usage source (latest + byMessageId). We keep it in state so we can
  // update it after refetch when a stream completes; otherwise we only have the initial load value.
  const [lastContextState, setLastContextState] = useState<
    LastContext | null | undefined
  >(() => lastContext ?? undefined);


  useEffect(() => {
    currentModelIdRef.current = currentModelId;
  }, [currentModelId]);

  // When navigating to a different chat (lastContext from server changes), sync state and reset usage
  useEffect(() => {
    setLastContextState(lastContext ?? undefined);
    const latest = getLatestUsage(lastContext);
    setUsage(latest);
    latestUsageRef.current = undefined;
  }, [lastContext]);

  // Hook to handle streaming data-thinking events
  const dataThinkingStream = useDataThinkingStream();
  // Extract stable functions/values to avoid infinite loops in useEffect dependencies
  const {
    clear: clearThinkingStream,
    clearStage: clearThinkingStage,
    streamingParts,
    streamingPartsCount,
    streamingQuickAnswerCard,
  } = dataThinkingStream;

  // Preserve streaming parts in a ref to prevent loss during re-renders
  const preservedStreamingPartsRef = useRef<
    Array<{
      type: string;
      id: string;
      data: ChatMessage["parts"][number];
    }>
  >([]);

  // Ref to clear the "refetch latest message" timeout on unmount (avoids setState after unmount)
  const refetchLatestTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Update preserved parts whenever streaming parts change
  useEffect(() => {
    if (streamingParts.length > 0) {
      preservedStreamingPartsRef.current = streamingParts.map((part) => ({
        type: part.type,
        id: part.id,
        data: part.data as ChatMessage["parts"][number],
      }));
    }
  }, [streamingParts]);

  // Clear refetch timeout on unmount so we don't call setState after unmount
  useEffect(() => {
    return () => {
      if (refetchLatestTimeoutRef.current !== null) {
        clearTimeout(refetchLatestTimeoutRef.current);
        refetchLatestTimeoutRef.current = null;
      }
    };
  }, []);

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
  } = useChat<ChatMessage>({
    id,
    messages: initialMessages,
    experimental_throttle: 100,
    generateId: generateUUID,
    transport: new DefaultChatTransport({
      api: getApiUrl("/api/chat"),
      fetch: fetchWithErrorHandlers,
      prepareSendMessagesRequest(request) {
        return {
          body: {
            id: request.id,
            message: request.messages.at(-1),
            selectedChatModel: currentModelIdRef.current,
            selectedVisibilityType: visibilityType,
            ...request.body,
          },
        };
      },
    }),
    onData: (dataPart) => {
      // Guard: SDK may occasionally call onData with undefined or non-object (e.g. parse edge cases)
      if (dataPart == null || typeof dataPart !== "object") return;

      // Handle data-thinking events - accumulate them and add to message parts
      // Note: useChat's onData type doesn't include data-thinking, so we use a type assertion
      // with runtime validation for safety
      const part = dataPart as { type?: string; id?: string; data?: unknown };
      if (
        part.type === "data-thinking" &&
        typeof part.id === "string" &&
        part.data !== undefined
      ) {
        // Accumulate the thinking part
        dataThinkingStream.handleDataThinkingEvent({
          type: part.type,
          id: part.id,
          data: part.data,
        });

        // Don't add data-thinking events to dataStream - they're handled separately
        // Streaming parts will be displayed via streamingThinkingParts prop
        return;
      }

      // data-quickAnswerCard — extract for live rendering during stream.
      // It will also be persisted to the DB and reloaded with chat history.
      if (part.type === "data-quickAnswerCard" && part.data !== undefined) {
        dataThinkingStream.setStreamingQuickAnswerCard(part.data);
        return;
      }

      // Handle data-stage events (processing stage: interpreting / retrieving / generating)
      if (
        part.type === "data-stage" &&
        part.data !== null &&
        typeof part.data === "object" &&
        "stage" in part.data &&
        typeof (part.data as { stage: unknown }).stage === "string"
      ) {
        dataThinkingStream.setStreamingStage(
          (part.data as { stage: string }).stage,
        );
        return;
      }

      // Add non-data-thinking events to dataStream for artifact handling
      setDataStream((ds) => (ds ? [...ds, dataPart] : [dataPart]));

      // Usage from stream (data-usage part or finish.messageMetadata)
      const partWithFinish = dataPart as {
        type?: string;
        data?: unknown;
        messageMetadata?: { usage?: unknown };
        "data-finish"?: { messageMetadata?: { usage?: unknown } };
      };
      if (partWithFinish.type === "data-usage" && "data" in dataPart) {
        const rawData = (dataPart as { data?: AppUsage }).data;
        if (rawData != null && typeof rawData === "object") {
          latestUsageRef.current = rawData;
          setUsage(rawData);
        }
        return;
      }
      const finishPayload =
        partWithFinish["data-finish"] ??
        (partWithFinish.type === "finish" ? partWithFinish : null);
      const meta = finishPayload?.messageMetadata;
      if (
        meta &&
        typeof meta === "object" &&
        "usage" in meta &&
        meta.usage != null
      ) {
        const raw = meta.usage as AppUsage | { type?: string; data?: AppUsage };
        const usagePayload =
          typeof raw === "object" && "data" in raw && raw.data != null
            ? raw.data
            : raw;
        if (usagePayload != null && typeof usagePayload === "object") {
          latestUsageRef.current = usagePayload as AppUsage;
          setUsage(usagePayload as AppUsage);
        }
      }
    },
    onFinish: () => {
      // Mark as waiting to keep streaming parts visible (prevents flicker when isLoading becomes false)
      const lastMessage = messages[messages.length - 1];
      if (lastMessage) {
        streamingPartsMessageIdRef.current = lastMessage.id;
      }
      isWaitingForSavedPartsRef.current = true;
      setIsWaitingForSavedParts(true);
      mutate(unstable_serialize(getChatHistoryPaginationKey));
      // Refetch is scheduled in useEffect when status leaves "streaming" (onFinish may not be called by SDK with custom backend)
    },
    onError: (error) => {
      // Clear streaming parts on error to prevent stale state
      clearThinkingStream();

      if (error instanceof ChatSDKError) {
        // Only show allowlisted user-facing messages; never expose internal/API details
        if (
          error.message?.includes("AI Gateway requires a valid credit card")
        ) {
          setShowCreditCardAlert(true);
        } else {
          const ref = error.errorId ? ` Reference: ${error.errorId}.` : "";
          toast({
            type: "error",
            description: `Something went wrong. Please try again.${ref}`,
          });
        }
      }
    },
  });

  // Track the message ID that the current streaming parts belong to
  // This prevents clearing parts that belong to previous messages
  const streamingPartsMessageIdRef = useRef<string | null>(null);

  // Clear streaming parts when a new message starts, and schedule refetch when stream ends
  // Refetch is triggered by status leaving "streaming" (onFinish may not be called with custom backend)
  const prevStatusRef = useRef(status);
  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = status;

    // When stream ends: status was "streaming" and is no longer, clear stage and schedule refetch of latest message for saved thinking parts
    if (prevStatus === "streaming" && status !== "streaming") {
      clearThinkingStage();
      isWaitingForSavedPartsRef.current = true;
      setIsWaitingForSavedParts(true);
      mutate(unstable_serialize(getChatHistoryPaginationKey));
      refetchLatestTimeoutRef.current = setTimeout(async () => {
        refetchLatestTimeoutRef.current = null;
        try {
          const response = await fetchWithErrorHandlers(
            `/api/chat/${id}/messages/latest?limit=1`,
          );
          if (!response.ok) {
            isWaitingForSavedPartsRef.current = false;
            setIsWaitingForSavedParts(false);
            return;
          }
          const data = await response.json();
          const { messages: latestMessages } = data as {
            messages: Array<{
              id: string;
              role: string;
              parts: unknown[];
              attachments: unknown[];
              createdAt: string | Date;
            }>;
          };
          if (latestMessages.length === 0) {
            isWaitingForSavedPartsRef.current = false;
            setIsWaitingForSavedParts(false);
            return;
          }
          const latestMessageFromDb: DBMessage = {
            id: latestMessages[0].id,
            chatId: id,
            role: latestMessages[0].role as "user" | "assistant" | "system",
            parts: latestMessages[0].parts ?? [],
            attachments: latestMessages[0].attachments ?? [],
            createdAt:
              typeof latestMessages[0].createdAt === "string"
                ? new Date(latestMessages[0].createdAt)
                : latestMessages[0].createdAt,
          };
          const refetchedCreatedAt =
            latestMessageFromDb.createdAt instanceof Date
              ? latestMessageFromDb.createdAt
              : new Date(latestMessageFromDb.createdAt);
          const fiveSecondsAgo = Date.now() - 10 * 1000;
          if (refetchedCreatedAt.getTime() < fiveSecondsAgo) {
            isWaitingForSavedPartsRef.current = false;
            setIsWaitingForSavedParts(false);
            return;
          }
          const uiMessage = convertToUIMessages([latestMessageFromDb])[0];
          isWaitingForSavedPartsRef.current = false;
          setIsWaitingForSavedParts(false);
          preservedStreamingPartsRef.current = [];
          clearThinkingStream();
          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (
              lastIndex >= 0 &&
              updated[lastIndex].role === "assistant" &&
              uiMessage.role === "assistant"
            ) {
              updated[lastIndex] = {
                ...uiMessage,
                vote: votes ? votes.find((v) => v.messageId === uiMessage.id) : undefined,
              };
            }
            return updated;
          });
          // Refetch chat so lastContext (latest + byMessageId) is up to date; use it as primary usage source
          try {
            const chatRes = await fetchWithErrorHandlers(`/api/chat/${id}`);
            if (chatRes.ok) {
              const chatData = (await chatRes.json()) as {
                chat?: { lastContext?: LastContext | null };
              };
              const next = chatData.chat?.lastContext ?? undefined;
              setLastContextState(next);
            }
          } catch {
            // Non-fatal: we still have lastContextState from before; stream usage is already in state
          }
        } catch {
          isWaitingForSavedPartsRef.current = false;
          setIsWaitingForSavedParts(false);
        }
      }, 3000);
    }

    // Detect when a new message starts: status changes from non-submitted to "submitted"
    if (
      prevStatus !== "submitted" &&
      status === "submitted" &&
      (streamingPartsCount > 0 || streamingQuickAnswerCard != null)
    ) {
      preservedStreamingPartsRef.current = [];
      isWaitingForSavedPartsRef.current = false;
      setIsWaitingForSavedParts(false);
      streamingPartsMessageIdRef.current = null;
      clearThinkingStream();
    }
  }, [
    status,
    streamingPartsCount,
    streamingQuickAnswerCard,
    clearThinkingStage,
    clearThinkingStream,
    id,
    mutate,
    setMessages,
  ]);

  // Clear streaming parts when saved parts are confirmed in the last message
  // This happens naturally when the page is refreshed and initialMessages includes saved parts
  useEffect(() => {
    if (
      messages.length === 0 ||
      status === "streaming" ||
      status === "submitted"
    ) {
      return;
    }

    const lastMessage = messages.at(-1);
    if (!lastMessage) {
      return;
    }

    const hasSavedThinkingParts =
      lastMessage.parts?.some(
        (part) =>
          typeof part.type === "string" &&
          part.type.startsWith("data-thinking"),
      ) ?? false;

    // Only clear if we have saved parts AND we're not waiting for them
    // This handles the case where user refreshes and initialMessages has saved parts
    if (
      hasSavedThinkingParts &&
      streamingPartsCount > 0 &&
      !isWaitingForSavedParts &&
      !isWaitingForSavedPartsRef.current
    ) {
      // Clear streaming parts when saved parts are present (e.g. after refresh).
      // No client-side logging of internal state to avoid leaking implementation details.
      preservedStreamingPartsRef.current = [];
      clearThinkingStream();
    }
  }, [
    messages,
    streamingPartsCount,
    clearThinkingStream,
    status,
    isWaitingForSavedParts,
  ]);

  // Cleanup streaming parts on unmount to prevent memory leaks
  // Use the stable clear function directly to avoid infinite loops
  useEffect(() => {
    return () => {
      clearThinkingStream();
    };
  }, [clearThinkingStream]);

  const searchParams = useSearchParams();
  const query = searchParams.get("query");

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      sendMessage({
        role: "user" as const,
        parts: [{ type: "text", text: query }],
      });

      setHasAppendedQuery(true);
      window.history.replaceState({}, "", `${getBasePath()}/chat/${id}`);
    }
  }, [query, sendMessage, hasAppendedQuery, id]);

  const { data: votes } = useSWR<Vote[]>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [quotedText, setQuotedText] = useState<string | null>(null);
  const [quotedSourceMessageId, setQuotedSourceMessageId] = useState<
    string | null
  >(null);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);
  const inputFocusRef = useRef<MultimodalInputHandle | null>(null);

  const onFollowUpPopulateInput = useCallback((text: string) => {
    setInput(text);
    setTimeout(() => {
      inputFocusRef.current?.focus();
    }, 0);
  }, []);

  const onAskAboutSelection = useCallback(
    (selectedText: string, sourceMessageId?: string | null) => {
      setQuotedText(selectedText);
      setQuotedSourceMessageId(sourceMessageId ?? null);
      setInput("");
      setTimeout(() => {
        inputFocusRef.current?.focus();
      }, 0);
    },
    [],
  );

  useAutoResume({
    autoResume,
    initialMessages,
    resumeStream,
    setMessages,
  });

  const isEmpty = messages.length === 0;
  const homeConfig = useHomeConfig();

  const usageByMessageId = useMemo(
    () => getUsageByMessageId(lastContextState) ?? {},
    [lastContextState],
  );

  // Full-chat usage: lastContext (byMessageId); stream for last message until refetch.
  const fullChatUsage = useMemo(() => {
    const assistantMessages = messages.filter((m) => m.role === "assistant");
    const usages: AppUsage[] = [];
    const lastMessageUsage = usage ?? latestUsageRef.current;
    for (let i = 0; i < assistantMessages.length; i++) {
      const msg = assistantMessages[i];
      const isLast = i === assistantMessages.length - 1;
      const fromByMsg = usageByMessageId[msg.id];
      const fromStream = isLast ? lastMessageUsage : undefined;
      const u = fromByMsg ?? fromStream;
      if (u != null) usages.push(u);
    }
    if (usages.length === 0) return undefined;
    return aggregateUsage(usages);
  }, [usageByMessageId, messages, usage]);

  const inputComponent = !isReadonly ? (
    <MultimodalInput
      ref={inputFocusRef}
      attachments={attachments}
      chatId={id}
      input={input}
      messages={messages}
      onAskAboutClear={() => {
        setQuotedText(null);
        setQuotedSourceMessageId(null);
      }}
      onModelChange={setCurrentModelId}
      quotedSourceMessageId={quotedSourceMessageId}
      quotedText={quotedText}
      selectedModelId={currentModelId}
      selectedVisibilityType={visibilityType}
      sendMessage={sendMessage}
      setAttachments={setAttachments}
      setInput={setInput}
      setMessages={setMessages}
      setQuotedSourceMessageId={setQuotedSourceMessageId}
      setQuotedText={setQuotedText}
      status={status}
      stop={stop}
      suggestions={isEmpty ? homeConfig.suggestions : undefined}
      usage={fullChatUsage}
    />
  ) : null;

  return (
    <>
      <IngestSessionData360
        messages={messages}
        initialMessages={initialMessages}
      />
      <PreIngestSessionClaims
        messages={messages}
        initialMessages={initialMessages}
      />
      <PcnManagerDebug />
      <div
        className={cn(
          "overscroll-behavior-contain flex min-w-0 touch-pan-y flex-col bg-background",
          fillParentHeight ? "h-full min-h-0" : "h-dvh",
          {
            hidden: isArtifactVisible,
          },
        )}
      >
        <ChatHeader
          chatId={id}
          isReadonly={isReadonly}
          reviewMode={reviewMode}
          selectedVisibilityType={initialVisibilityType}
        />

        {isEmpty ? (
          <div className="flex flex-1 flex-col px-4 pt-16 pb-10 sm:px-6 md:pt-20 md:pb-14">
            <div className="flex min-h-0 flex-[0.42] flex-col justify-end pb-24 md:pb-32">
              <div className="mx-auto w-full max-w-2xl">
                <Greeting
                  subtitle={homeConfig.greeting.subtitle}
                  title={homeConfig.greeting.title}
                />
              </div>
            </div>
            <div className="mx-auto w-full max-w-3xl shrink-0">
              {inputComponent}
            </div>
            <div className="flex min-h-0 flex-[0.58] flex-col justify-start gap-6 pt-6">
              <p
                className="text-muted-foreground mx-auto text-xs"
                aria-label="Powered by Data360 MCP"
              >
                Powered by Data360 MCP
              </p>
            </div>
          </div>
        ) : (
          <>
            {!isReadonly && (
              <AskAboutSelectionToolbar
                disabled={status !== "ready"}
                onAskAbout={onAskAboutSelection}
              />
            )}
            <Messages
              chatId={id}
              followUpSuggestionsPopulateInput={
                homeConfig.followUpSuggestionsPopulateInput
              }
              isArtifactVisible={isArtifactVisible}
              isReadonly={isReadonly}
              isWaitingForSavedParts={
                isWaitingForSavedParts || isWaitingForSavedPartsRef.current
              }
              lastMessageUsage={usage}
              messages={messages}
              usageByMessageId={usageByMessageId}
              onFollowUpPopulateInput={onFollowUpPopulateInput}
              regenerate={regenerate}
              selectedModelId={initialChatModel}
              sendMessage={sendMessage}
              setMessages={setMessages}
              status={status}
              streamingThinkingStage={dataThinkingStream.streamingStage}
              streamingQuickAnswerCard={
                isWaitingForSavedParts
                  ? streamingQuickAnswerCard
                  : null
              }
              streamingThinkingParts={
                isWaitingForSavedParts &&
                dataThinkingStream.streamingParts.length === 0 &&
                preservedStreamingPartsRef.current.length > 0
                  ? preservedStreamingPartsRef.current
                  : dataThinkingStream.streamingParts.map((part) => ({
                      type: part.type,
                      id: part.id,
                      data: part.data as ChatMessage["parts"][number],
                    }))
              }
              votes={votes}
            />

            <div className="sticky bottom-0 z-1 mx-auto flex w-full max-w-4xl gap-2 border-t-0 bg-background px-2 pb-3 md:px-4 md:pb-4">
              {inputComponent}
            </div>
          </>
        )}
      </div>

      <Artifact
        attachments={attachments}
        chatId={id}
        input={input}
        isReadonly={isReadonly}
        messages={messages}
        regenerate={regenerate}
        selectedModelId={currentModelId}
        selectedVisibilityType={visibilityType}
        sendMessage={sendMessage}
        setAttachments={setAttachments}
        setInput={setInput}
        setMessages={setMessages}
        status={status}
        stop={stop}
        votes={votes}
      />

      <AlertDialog
        onOpenChange={setShowCreditCardAlert}
        open={showCreditCardAlert}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate AI Gateway</AlertDialogTitle>
            <AlertDialogDescription>
              This application requires{" "}
              {process.env.NODE_ENV === "production" ? "the owner" : "you"} to
              activate Vercel AI Gateway.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                window.open(
                  "https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%3Fmodal%3Dadd-credit-card",
                  "_blank",
                );
                window.location.href = `${getBasePath()}/`;
              }}
            >
              Activate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
