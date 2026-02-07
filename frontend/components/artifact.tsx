import type { UseChatHelpers } from "@ai-sdk/react";
import { formatDistance } from "date-fns";
import equal from "fast-deep-equal";
import { AnimatePresence, motion } from "framer-motion";
import type { ComponentType } from "react";
import {
  type Dispatch,
  memo,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import useSWR, { useSWRConfig } from "swr";
import { useDebounceCallback, useWindowSize } from "usehooks-ts";
import { chartArtifact } from "@/artifacts/chart/client";
import { codeArtifact } from "@/artifacts/code/client";
import { embedArtifact } from "@/artifacts/embed/client";
import { imageArtifact } from "@/artifacts/image/client";
import { sheetArtifact } from "@/artifacts/sheet/client";
import { textArtifact } from "@/artifacts/text/client";
import { useArtifact } from "@/hooks/use-artifact";
import { apiFetch } from "@/lib/api-client";
import type { Document, Vote } from "@/lib/db/schema";
import type { Attachment, ChatMessage } from "@/lib/types";
import { cn, fetcher } from "@/lib/utils";
import { ArtifactActions } from "./artifact-actions";
import { ArtifactCloseButton } from "./artifact-close-button";
import { ArtifactMessages } from "./artifact-messages";
import type { ArtifactContent } from "./create-artifact";
import { MultimodalInput } from "./multimodal-input";
import { Toolbar } from "./toolbar";
import { useSidebar } from "./ui/sidebar";
import { VersionFooter } from "./version-footer";
import type { VisibilityType } from "./visibility-selector";

export const artifactDefinitions = [
  textArtifact,
  codeArtifact,
  imageArtifact,
  sheetArtifact,
  chartArtifact,
  embedArtifact,
];
export type ArtifactKind = (typeof artifactDefinitions)[number]["kind"];

const DEFAULT_CHAT_PANEL_WIDTH = 400;
const MIN_CHAT_PANEL_WIDTH = 400;
const MIN_ARTIFACT_PANEL_WIDTH = 320;
const RESIZE_HANDLE_WIDTH = 8;
/** Hit area width for easier grabbing; visual indicator stays 8px */
const RESIZE_HANDLE_HIT_WIDTH = 16;
const ARTIFACT_PANEL_WIDTH_KEY = "artifact-chat-panel-width";

/** Tailwind classes so artifact overlay and panels sit below the data header */
const ARTIFACT_BELOW_HEADER =
  "top-[var(--header-height,0)] h-[calc(100dvh-var(--header-height,0))]";

export type UIArtifact = {
  title: string;
  documentId: string;
  kind: ArtifactKind;
  content: string;
  isVisible: boolean;
  status: "streaming" | "idle";
  boundingBox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  /** When set, chat can scroll to this message when using "trigger" scroll behavior. */
  triggerMessageId?: string;
};

function PureArtifact({
  chatId,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  sendMessage,
  messages,
  setMessages,
  regenerate,
  votes,
  isReadonly,
  selectedVisibilityType,
  selectedModelId,
}: {
  chatId: string;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  status: UseChatHelpers<ChatMessage>["status"];
  stop: UseChatHelpers<ChatMessage>["stop"];
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  messages: ChatMessage[];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  votes: Vote[] | undefined;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  isReadonly: boolean;
  selectedVisibilityType: VisibilityType;
  selectedModelId: string;
}) {
  const { artifact, setArtifact, metadata, setMetadata } = useArtifact();

  const {
    data: documents,
    isLoading: isDocumentsFetching,
    mutate: mutateDocuments,
  } = useSWR<Document[]>(
    artifact.documentId !== "init" && artifact.status !== "streaming"
      ? `/api/document?id=${artifact.documentId}`
      : null,
    fetcher,
  );

  const [mode, setMode] = useState<"edit" | "diff">("edit");
  const [document, setDocument] = useState<Document | null>(null);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(-1);

  const [chatPanelWidth, setChatPanelWidth] = useState(
    DEFAULT_CHAT_PANEL_WIDTH,
  );
  const [quotedText, setQuotedText] = useState<string | null>(null);
  const [quotedSourceMessageId, setQuotedSourceMessageId] = useState<
    string | null
  >(null);
  const [isResizing, setIsResizing] = useState(false);
  const lastWidthRef = useRef(chatPanelWidth);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(ARTIFACT_PANEL_WIDTH_KEY);
    if (stored !== null) {
      const parsed = Number.parseInt(stored, 10);
      if (Number.isFinite(parsed) && parsed >= MIN_CHAT_PANEL_WIDTH) {
        setChatPanelWidth(parsed);
        lastWidthRef.current = parsed;
      }
    }
  }, []);

  const maxChatPanelWidth =
    typeof window !== "undefined"
      ? window.innerWidth - MIN_ARTIFACT_PANEL_WIDTH - RESIZE_HANDLE_WIDTH
      : 800;
  const clampedChatPanelWidth = Math.min(
    Math.max(chatPanelWidth, MIN_CHAT_PANEL_WIDTH),
    Math.max(maxChatPanelWidth, MIN_CHAT_PANEL_WIDTH),
  );
  lastWidthRef.current = clampedChatPanelWidth;

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const body =
      typeof globalThis.document !== "undefined" &&
      globalThis.document?.body != null
        ? globalThis.document.body
        : null;
    if (body) {
      body.style.userSelect = "none";
    }
    setIsResizing(true);
    const onMove = (moveEvent: MouseEvent) => {
      const maxW =
        typeof window !== "undefined"
          ? window.innerWidth - MIN_ARTIFACT_PANEL_WIDTH - RESIZE_HANDLE_WIDTH
          : 800;
      const next = Math.min(
        Math.max(moveEvent.clientX, MIN_CHAT_PANEL_WIDTH),
        Math.max(maxW, MIN_CHAT_PANEL_WIDTH),
      );
      setChatPanelWidth(next);
      lastWidthRef.current = next;
    };
    const onUp = () => {
      setIsResizing(false);
      if (body) {
        body.style.userSelect = "";
      }
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          ARTIFACT_PANEL_WIDTH_KEY,
          String(lastWidthRef.current),
        );
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

  const { open: isSidebarOpen } = useSidebar();

  useEffect(() => {
    if (documents && documents.length > 0) {
      const mostRecentDocument = documents.at(-1);

      if (mostRecentDocument) {
        setDocument(mostRecentDocument);
        setCurrentVersionIndex(documents.length - 1);
        setArtifact((currentArtifact) => ({
          ...currentArtifact,
          content: mostRecentDocument.content ?? "",
        }));
      }
    }
  }, [documents, setArtifact]);

  useEffect(() => {
    mutateDocuments();
  }, [mutateDocuments]);

  const { mutate } = useSWRConfig();
  const [isContentDirty, setIsContentDirty] = useState(false);

  const handleContentChange = useCallback(
    (updatedContent: string) => {
      if (!artifact) {
        return;
      }

      mutate<Document[]>(
        `/api/document?id=${artifact.documentId}`,
        async (currentDocuments) => {
          if (!currentDocuments) {
            return [];
          }

          const currentDocument = currentDocuments.at(-1);

          if (!currentDocument || !currentDocument.content) {
            setIsContentDirty(false);
            return currentDocuments;
          }

          if (currentDocument.content !== updatedContent) {
            await apiFetch(`/api/document?id=${artifact.documentId}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                title: artifact.title,
                content: updatedContent,
                kind: artifact.kind,
              }),
            });

            setIsContentDirty(false);

            const newDocument = {
              ...currentDocument,
              content: updatedContent,
              createdAt: new Date(),
            };

            return [...currentDocuments, newDocument];
          }
          return currentDocuments;
        },
        { revalidate: false },
      );
    },
    [artifact, mutate],
  );

  const debouncedHandleContentChange = useDebounceCallback(
    handleContentChange,
    2000,
  );

  const saveContent = useCallback(
    (updatedContent: string, debounce: boolean) => {
      if (document && updatedContent !== document.content) {
        setIsContentDirty(true);

        if (debounce) {
          debouncedHandleContentChange(updatedContent);
        } else {
          handleContentChange(updatedContent);
        }
      }
    },
    [document, debouncedHandleContentChange, handleContentChange],
  );

  function getDocumentContentById(index: number) {
    if (!documents) {
      return "";
    }
    if (!documents[index]) {
      return "";
    }
    return documents[index].content ?? "";
  }

  const handleVersionChange = (type: "next" | "prev" | "toggle" | "latest") => {
    if (!documents) {
      return;
    }

    if (type === "latest") {
      setCurrentVersionIndex(documents.length - 1);
      setMode("edit");
    }

    if (type === "toggle") {
      setMode((currentMode) => (currentMode === "edit" ? "diff" : "edit"));
    }

    if (type === "prev") {
      if (currentVersionIndex > 0) {
        setCurrentVersionIndex((index) => index - 1);
      }
    } else if (type === "next" && currentVersionIndex < documents.length - 1) {
      setCurrentVersionIndex((index) => index + 1);
    }
  };

  const [isToolbarVisible, setIsToolbarVisible] = useState(false);

  /*
   * NOTE: if there are no documents, or if
   * the documents are being fetched, then
   * we mark it as the current version.
   */

  const isCurrentVersion =
    documents && documents.length > 0
      ? currentVersionIndex === documents.length - 1
      : true;

  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const isMobile = windowWidth ? windowWidth < 768 : false;

  const artifactDefinition = artifactDefinitions.find(
    (definition) => definition.kind === artifact.kind,
  );

  if (!artifactDefinition) {
    throw new Error("Artifact definition not found!");
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: only init when documentId changes; full deps re-trigger getSuggestions on drag
  useEffect(() => {
    if (artifact.documentId !== "init" && artifactDefinition.initialize) {
      artifactDefinition.initialize({
        documentId: artifact.documentId,
        setMetadata,
      });
    }
  }, [artifact.documentId]);

  return (
    <AnimatePresence>
      {artifact.isVisible && (
        <motion.div
          animate={{ opacity: 1 }}
          className={cn(
            "fixed left-0 z-50 flex w-dvw flex-row bg-transparent",
            ARTIFACT_BELOW_HEADER,
          )}
          data-testid="artifact"
          exit={{ opacity: 0, transition: { delay: 0.4 } }}
          initial={{ opacity: 1 }}
        >
          {!isMobile && (
            <motion.div
              animate={{ width: windowWidth, right: 0 }}
              className={cn("fixed bg-background", ARTIFACT_BELOW_HEADER)}
              exit={{
                width: isSidebarOpen ? windowWidth - 256 : windowWidth,
                right: 0,
              }}
              initial={{
                width: isSidebarOpen ? windowWidth - 256 : windowWidth,
                right: 0,
              }}
            />
          )}

          {!isMobile && (
            <motion.div
              animate={{
                opacity: 1,
                x: 0,
                scale: 1,
                width: clampedChatPanelWidth,
                transition: isResizing
                  ? { duration: 0 }
                  : {
                      delay: 0.1,
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    },
              }}
              className="relative h-full shrink-0 bg-muted dark:bg-background"
              exit={{
                opacity: 0,
                x: 0,
                scale: 1,
                transition: { duration: 0 },
              }}
              initial={{ opacity: 0, x: 10, scale: 1 }}
              style={{ width: clampedChatPanelWidth }}
            >
              <AnimatePresence>
                {!isCurrentVersion && (
                  <motion.div
                    animate={{ opacity: 1 }}
                    className="absolute top-0 left-0 z-50 h-full bg-zinc-900/50"
                    exit={{ opacity: 0 }}
                    initial={{ opacity: 0 }}
                    style={{ width: clampedChatPanelWidth }}
                  />
                )}
              </AnimatePresence>

              <div className="flex h-full flex-col items-center justify-between">
                <ArtifactMessages
                  artifactStatus={artifact.status}
                  chatId={chatId}
                  isReadonly={isReadonly}
                  messages={messages}
                  regenerate={regenerate}
                  setMessages={setMessages}
                  status={status}
                  triggerMessageId={artifact.triggerMessageId}
                  votes={votes}
                />

                <div className="relative flex w-full flex-row items-end gap-2 px-4 pb-4">
                  <MultimodalInput
                    attachments={attachments}
                    chatId={chatId}
                    className="bg-background dark:bg-muted"
                    input={input}
                    messages={messages}
                    onAskAboutClear={() => {
                      setQuotedText(null);
                      setQuotedSourceMessageId(null);
                    }}
                    quotedSourceMessageId={quotedSourceMessageId}
                    quotedText={quotedText}
                    selectedModelId={selectedModelId}
                    selectedVisibilityType={selectedVisibilityType}
                    sendMessage={sendMessage}
                    setAttachments={setAttachments}
                    setQuotedSourceMessageId={setQuotedSourceMessageId}
                    setQuotedText={setQuotedText}
                    setInput={setInput}
                    setMessages={setMessages}
                    status={status}
                    stop={stop}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {!isMobile && (
            <button
              aria-label="Resize artifact panel"
              className={cn(
                "fixed z-[70] flex shrink-0 cursor-col-resize items-center justify-center border-0 bg-transparent hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50",
                ARTIFACT_BELOW_HEADER,
              )}
              data-testid="artifact-resize-handle"
              onMouseDown={handleResizeStart}
              style={{
                left:
                  clampedChatPanelWidth -
                  (RESIZE_HANDLE_HIT_WIDTH - RESIZE_HANDLE_WIDTH) / 2,
                width: RESIZE_HANDLE_HIT_WIDTH,
              }}
              type="button"
            >
              <span
                aria-hidden
                className="h-12 w-1 rounded-full bg-zinc-300 dark:bg-zinc-600"
              />
            </button>
          )}

          <motion.div
            animate={
              isMobile
                ? {
                    opacity: 1,
                    x: 0,
                    y: 0,
                    height: windowHeight,
                    width: windowWidth ? windowWidth : "calc(100dvw)",
                    borderRadius: 0,
                    transition: {
                      delay: 0,
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                      duration: 0.8,
                    },
                  }
                : {
                    opacity: 1,
                    x: clampedChatPanelWidth + RESIZE_HANDLE_WIDTH,
                    y: 0,
                    height: windowHeight,
                    width: windowWidth
                      ? windowWidth -
                        clampedChatPanelWidth -
                        RESIZE_HANDLE_WIDTH
                      : `calc(100dvw - ${clampedChatPanelWidth + RESIZE_HANDLE_WIDTH}px)`,
                    borderRadius: 0,
                    transition: isResizing
                      ? { duration: 0 }
                      : {
                          delay: 0,
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                          duration: 0.8,
                        },
                  }
            }
            className={cn(
              "fixed z-40 flex flex-col overflow-y-scroll border-zinc-200 bg-background md:border-l dark:border-zinc-700 dark:bg-muted",
              ARTIFACT_BELOW_HEADER,
            )}
            exit={{
              opacity: 0,
              scale: 0.5,
              transition: {
                delay: 0.1,
                type: "spring",
                stiffness: 600,
                damping: 30,
              },
            }}
            initial={
              isMobile
                ? {
                    opacity: 1,
                    x: artifact.boundingBox.left,
                    y: artifact.boundingBox.top,
                    height: artifact.boundingBox.height,
                    width: artifact.boundingBox.width,
                    borderRadius: 50,
                  }
                : {
                    opacity: 1,
                    x: artifact.boundingBox.left,
                    y: artifact.boundingBox.top,
                    height: artifact.boundingBox.height,
                    width: artifact.boundingBox.width,
                    borderRadius: 50,
                  }
            }
          >
            <div className="flex flex-row items-start justify-between p-2">
              <div className="flex flex-row items-start gap-4">
                <ArtifactCloseButton />

                <div className="flex flex-col">
                  <div className="font-medium">{artifact.title}</div>

                  {isContentDirty ? (
                    <div className="text-muted-foreground text-sm">
                      Saving changes...
                    </div>
                  ) : document ? (
                    <div className="text-muted-foreground text-sm">
                      {`Updated ${formatDistance(
                        new Date(document.createdAt),
                        new Date(),
                        {
                          addSuffix: true,
                        },
                      )}`}
                    </div>
                  ) : artifact.kind === "chart" ? (
                    <div className="text-muted-foreground text-sm">
                      Vega-Lite chart
                    </div>
                  ) : artifact.kind === "embed" ? (
                    <div className="text-muted-foreground text-sm">
                      Embedded page
                    </div>
                  ) : (
                    <div className="mt-2 h-3 w-32 animate-pulse rounded-md bg-muted-foreground/20" />
                  )}
                </div>
              </div>

              <ArtifactActions
                artifact={artifact}
                currentVersionIndex={currentVersionIndex}
                handleVersionChange={handleVersionChange}
                isCurrentVersion={isCurrentVersion}
                metadata={metadata}
                mode={mode}
                setMetadata={setMetadata}
              />
            </div>

            <div className="flex min-h-0 min-w-0 flex-1 flex-col w-full max-w-full! overflow-y-scroll bg-background dark:bg-muted">
              <div
                className={`flex min-h-0 min-w-0 flex-1 flex-col ${artifact.kind === "chart" || artifact.kind === "embed" ? "overflow-hidden" : "min-h-0 overflow-y-auto"}`}
              >
                {(() => {
                  const ContentComponent =
                    artifactDefinition.content as ComponentType<
                      ArtifactContent<unknown>
                    >;
                  const contentProps: ArtifactContent<unknown> = {
                    content:
                      artifact.kind === "chart" || artifact.kind === "embed"
                        ? artifact.content
                        : isCurrentVersion
                          ? artifact.content
                          : getDocumentContentById(currentVersionIndex),
                    currentVersionIndex,
                    getDocumentContentById,
                    isCurrentVersion,
                    isInline: false,
                    isLoading:
                    artifact.kind === "embed"
                      ? false
                      : isDocumentsFetching && !artifact.content,
                    metadata,
                    mode,
                    onSaveContent: saveContent,
                    setMetadata,
                    status: artifact.status,
                    suggestions: [],
                    title: artifact.title,
                  };
                  return <ContentComponent {...contentProps} />;
                })()}
              </div>

              <AnimatePresence>
                {isCurrentVersion && (
                  <Toolbar
                    artifactKind={artifact.kind}
                    isToolbarVisible={isToolbarVisible}
                    sendMessage={sendMessage}
                    setIsToolbarVisible={setIsToolbarVisible}
                    setMessages={setMessages}
                    status={status}
                    stop={stop}
                  />
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {!isCurrentVersion && (
                <VersionFooter
                  currentVersionIndex={currentVersionIndex}
                  documents={documents}
                  handleVersionChange={handleVersionChange}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const Artifact = memo(PureArtifact, (prevProps, nextProps) => {
  if (prevProps.status !== nextProps.status) {
    return false;
  }
  if (!equal(prevProps.votes, nextProps.votes)) {
    return false;
  }
  if (prevProps.input !== nextProps.input) {
    return false;
  }
  if (!equal(prevProps.messages, nextProps.messages)) {
    return false;
  }
  if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
    return false;
  }

  return true;
});
