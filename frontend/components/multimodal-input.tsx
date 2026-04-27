"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { Trigger } from "@radix-ui/react-select";
import type { UIMessage } from "ai";
import equal from "fast-deep-equal";
import {
  type ChangeEvent,
  type Dispatch,
  forwardRef,
  memo,
  type SetStateAction,
  startTransition,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { useLocalStorage, useWindowSize } from "usehooks-ts";
import { saveChatModelAsCookie } from "@/app/(chat)/actions";
import { useAvailableChatModels } from "@/hooks/use-available-chat-models";
import { SelectItem } from "@/components/ui/select";
import { apiFetch } from "@/lib/api-client";
import { appConfig, getBasePath } from "@/lib/config";
import type { Attachment, ChatMessage } from "@/lib/types";
import type { AppUsage } from "@/lib/usage";
import { cn } from "@/lib/utils";
import { useCanViewTokenUsage } from "@/contexts/token-usage-visibility";
import { Context } from "./elements/context";
import {
  PromptInput,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "./elements/prompt-input";
import {
  ArrowUpIcon,
  ChevronDownIcon,
  CpuIcon,
  PaperclipIcon,
  StopIcon,
} from "./icons";
import { QuotedContextBlock } from "./quoted-context-block";
import { PreviewAttachment } from "./preview-attachment";
import { SuggestedActions } from "./suggested-actions";
import { Button } from "./ui/button";
import type { VisibilityType } from "./visibility-selector";

export type MultimodalInputHandle = { focus: () => void };

const DEFAULT_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const DEFAULT_ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png"] as const;

/** Max upload size. From NEXT_PUBLIC_MAX_FILE_SIZE_BYTES; must match backend MAX_UPLOAD_FILE_SIZE_BYTES. */
const MAX_FILE_SIZE_BYTES = (() => {
  const v = process.env.NEXT_PUBLIC_MAX_FILE_SIZE_BYTES;
  if (v === undefined || v === "") return DEFAULT_MAX_FILE_SIZE_BYTES;
  const n = Number.parseInt(v, 10);
  return Number.isNaN(n) || n <= 0 ? DEFAULT_MAX_FILE_SIZE_BYTES : n;
})();

/** Allowed image MIME types. From NEXT_PUBLIC_ALLOWED_IMAGE_TYPES (comma-separated); must match backend ALLOWED_UPLOAD_IMAGE_TYPES. */
const ALLOWED_IMAGE_TYPES: readonly string[] = (() => {
  const v = process.env.NEXT_PUBLIC_ALLOWED_IMAGE_TYPES;
  if (v === undefined || v === "") return [...DEFAULT_ALLOWED_IMAGE_TYPES];
  return v.split(",").map((t) => t.trim()).filter(Boolean);
})();

const PureMultimodalInput = forwardRef<
  MultimodalInputHandle,
  {
    chatId: string;
    input: string;
    setInput: Dispatch<SetStateAction<string>>;
    status: UseChatHelpers<ChatMessage>["status"];
    stop: () => void;
    attachments: Attachment[];
    setAttachments: Dispatch<SetStateAction<Attachment[]>>;
    messages: UIMessage[];
    setMessages: UseChatHelpers<ChatMessage>["setMessages"];
    sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
    className?: string;
    quotedText: string | null;
    quotedSourceMessageId: string | null;
    setQuotedText: Dispatch<SetStateAction<string | null>>;
    setQuotedSourceMessageId: Dispatch<SetStateAction<string | null>>;
    onAskAboutClear?: () => void;
    selectedVisibilityType: VisibilityType;
    selectedModelId: string;
    onModelChange?: (modelId: string) => void;
    usage?: AppUsage;
    suggestions?: string[];
  }
>(function PureMultimodalInput(
  {
    chatId,
    input,
    setInput,
    status,
    stop,
    attachments,
    setAttachments,
    messages,
    setMessages,
    sendMessage,
    className,
    quotedText,
    quotedSourceMessageId,
    setQuotedText,
    setQuotedSourceMessageId,
    onAskAboutClear,
    selectedVisibilityType,
    selectedModelId,
    onModelChange,
    usage,
    suggestions: suggestionsProp,
  },
  ref,
) {
  const imageUploadEnabled = appConfig.enableImageUpload;
  const suggestions = suggestionsProp ?? [];
  const clearQuoted = onAskAboutClear ?? (() => setQuotedText(null));
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();

  useImperativeHandle(
    ref,
    () => ({
      focus() {
        textareaRef.current?.focus();
      },
    }),
    [],
  );

  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
    }
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, [adjustHeight]);

  const resetHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
    }
  }, []);

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    "input",
    "",
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || "";
      setInput(finalValue);
      adjustHeight();
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adjustHeight, localStorageInput, setInput]);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<string[]>([]);

  const submitForm = useCallback(() => {
    window.history.pushState({}, "", `${getBasePath()}/chat/${chatId}`);

    const hasQuoted = quotedText != null && quotedText.trim().length > 0;
    const messageText = hasQuoted
      ? quotedSourceMessageId
        ? `Regarding: "${quotedText.trim()}"\n\n[ref:${quotedSourceMessageId}]\n\n${input}`
        : `Regarding: "${quotedText.trim()}"\n\n${input}`
      : input;

    const fileParts = imageUploadEnabled
      ? attachments.map((attachment) => ({
          type: "file" as const,
          url: attachment.url,
          name: attachment.name,
          mediaType: attachment.contentType,
        }))
      : [];

    sendMessage({
      role: "user",
      parts: [
        ...fileParts,
        {
          type: "text",
          text: messageText,
        },
      ],
    });

    setAttachments([]);
    setQuotedText(null);
    setQuotedSourceMessageId(null);
    setLocalStorageInput("");
    resetHeight();
    setInput("");

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    input,
    quotedText,
    quotedSourceMessageId,
    setInput,
    setQuotedText,
    setQuotedSourceMessageId,
    attachments,
    sendMessage,
    setAttachments,
    setLocalStorageInput,
    width,
    chatId,
    resetHeight,
    imageUploadEnabled,
  ]);

  const uploadFile = useCallback(
    async (file: File): Promise<Attachment | undefined> => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(
          `"${file.name}" is too large. Maximum size is 5MB.`,
        );
        return undefined;
      }
      const type = (file.type?.toLowerCase() ?? "") as string;
      if (
        !ALLOWED_IMAGE_TYPES.includes(type)
      ) {
        toast.error(
          `"${file.name}" is not a supported type. Please use JPEG or PNG.`,
        );
        return undefined;
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await apiFetch("/api/files/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = (await response.json()) as {
            url: string;
            pathname: string;
            contentType: string;
          };
          const { url, pathname, contentType } = data;

          return {
            url,
            name: pathname,
            contentType,
          };
        }
        let message = "Upload failed";
        try {
          const body = (await response.json()) as {
            detail?: string;
            error?: string;
          };
          message = body.detail ?? body.error ?? message;
        } catch {
          // Non-JSON response (e.g. 502 HTML); keep default message
        }
        toast.error(message);
        return undefined;
      } catch (_error) {
        toast.error("Failed to upload file, please try again!");
        return undefined;
      }
    },
    [],
  );

  const canViewTokenUsage = useCanViewTokenUsage();

  const contextProps = useMemo(
    () => ({
      usage: canViewTokenUsage ? usage : undefined,
    }),
    [usage, canViewTokenUsage],
  );

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      const validFiles = files.filter((file) => {
        if (file.size > MAX_FILE_SIZE_BYTES) {
          toast.error(
            `"${file.name}" is too large (max 5MB). Skipped.`,
          );
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) {
        event.target.value = "";
        return;
      }

      setUploadQueue(validFiles.map((file) => file.name));

      try {
        const uploadPromises = validFiles.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment): attachment is Attachment => attachment !== undefined,
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error("Error uploading files!", error);
      } finally {
        setUploadQueue([]);
        event.target.value = "";
      }
    },
    [setAttachments, uploadFile],
  );

  const handlePaste = useCallback(
    async (event: ClipboardEvent) => {
      if (!imageUploadEnabled) {
        return;
      }
      const items = event.clipboardData?.items;
      if (!items) {
        return;
      }

      const imageItems = Array.from(items).filter((item) =>
        item.type.startsWith("image/"),
      );

      if (imageItems.length === 0) {
        return;
      }

      // Prevent default paste behavior for images
      event.preventDefault();

      setUploadQueue((prev) => [...prev, "Pasted image"]);

      try {
        const uploadPromises = imageItems
          .map((item) => item.getAsFile())
          .filter((file): file is File => file !== null)
          .map((file) => uploadFile(file));

        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) =>
            attachment !== undefined &&
            attachment.url !== undefined &&
            attachment.contentType !== undefined,
        );

        setAttachments((curr) => [
          ...curr,
          ...(successfullyUploadedAttachments as Attachment[]),
        ]);
      } catch (error) {
        console.error("Error uploading pasted images:", error);
        toast.error("Failed to upload pasted image(s)");
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments, uploadFile, imageUploadEnabled],
  );

  // Add paste event listener to textarea
  useEffect(() => {
    if (!imageUploadEnabled) {
      return;
    }
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.addEventListener("paste", handlePaste);
    return () => textarea.removeEventListener("paste", handlePaste);
  }, [handlePaste, imageUploadEnabled]);

  const showSuggestions =
    messages.length === 0 &&
    (!imageUploadEnabled || attachments.length === 0) &&
    uploadQueue.length === 0;

  return (
    <div className={cn("relative flex w-full flex-col gap-4", className)}>
      {imageUploadEnabled ? (
        <input
          accept="image/jpeg,image/png,.jpg,.jpeg,.png"
          aria-label="Upload image (JPEG or PNG, max 5MB)"
          className="-top-4 -left-4 pointer-events-none fixed size-0.5 opacity-0"
          multiple
          onChange={handleFileChange}
          ref={fileInputRef}
          tabIndex={-1}
          type="file"
        />
      ) : null}

      <PromptInput
        className={cn(
          "rounded-xl border bg-background transition-all duration-200",
          suggestions.length > 0
            ? "home-input-prominent p-4 shadow-xs"
            : "border-border p-3 shadow-xs focus-within:border-border hover:border-muted-foreground/50"
        )}
        onSubmit={(event) => {
          event.preventDefault();
          if (status !== "ready") {
            toast.error("Please wait for the model to finish its response!");
          } else {
            submitForm();
          }
        }}
      >
        {quotedText != null && quotedText.trim().length > 0 && (
          <QuotedContextBlock
            onDismiss={() => clearQuoted()}
            quotedText={quotedText.trim()}
          />
        )}
        {imageUploadEnabled &&
          (attachments.length > 0 || uploadQueue.length > 0) && (
          <div
            className="flex flex-row items-end gap-2 overflow-x-scroll"
            data-testid="attachments-preview"
          >
            {attachments.map((attachment) => (
              <PreviewAttachment
                attachment={attachment}
                key={attachment.url}
                onRemove={() => {
                  setAttachments((currentAttachments) =>
                    currentAttachments.filter((a) => a.url !== attachment.url),
                  );
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
              />
            ))}

            {uploadQueue.map((filename) => (
              <PreviewAttachment
                attachment={{
                  url: "",
                  name: filename,
                  contentType: "",
                }}
                isUploading={true}
                key={filename}
              />
            ))}
          </div>
          )}
        <div className="flex flex-row items-start gap-1 sm:gap-2">
          <PromptInputTextarea
            autoFocus
            className="grow resize-none border-0! border-none! bg-transparent p-2 text-sm outline-none ring-0 [-ms-overflow-style:none] [scrollbar-width:none] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-scrollbar]:hidden"
            data-testid="multimodal-input"
            disableAutoResize={true}
            maxHeight={200}
            minHeight={44}
            onChange={handleInput}
            placeholder={
              quotedText?.trim()
                ? "Ask a follow-up question..."
                : "Ask a question here..."
            }
            ref={textareaRef}
            rows={1}
            value={input}
          />{" "}
          <Context {...contextProps} />
        </div>
        <PromptInputToolbar className="!border-top-0 border-t-0! p-0 shadow-none dark:border-0 dark:border-transparent!">
          <PromptInputTools className="gap-0 sm:gap-0.5">
            {imageUploadEnabled ? (
              <AttachmentsButton
                fileInputRef={fileInputRef}
                selectedModelId={selectedModelId}
                status={status}
              />
            ) : null}
            <ModelSelectorCompact
              onModelChange={onModelChange}
              selectedModelId={selectedModelId}
            />
          </PromptInputTools>

          {status === "submitted" ? (
            <StopButton setMessages={setMessages} stop={stop} />
          ) : (
            <PromptInputSubmit
              className="size-8 rounded-full bg-primary text-primary-foreground transition-colors duration-200 hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
              data-testid="send-button"
              disabled={!input.trim() || uploadQueue.length > 0}
              status={status}
            >
              <ArrowUpIcon size={14} />
            </PromptInputSubmit>
          )}
        </PromptInputToolbar>
      </PromptInput>

      {showSuggestions && (
        <SuggestedActions
          chatId={chatId}
          selectedVisibilityType={selectedVisibilityType}
          sendMessage={sendMessage}
          suggestions={suggestions}
        />
      )}
    </div>
  );
});

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) {
      return false;
    }
    if (prevProps.status !== nextProps.status) {
      return false;
    }
    if (prevProps.quotedText !== nextProps.quotedText) {
      return false;
    }
    if (prevProps.quotedSourceMessageId !== nextProps.quotedSourceMessageId) {
      return false;
    }
    if (!equal(prevProps.attachments, nextProps.attachments)) {
      return false;
    }
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
      return false;
    }
    if (prevProps.selectedModelId !== nextProps.selectedModelId) {
      return false;
    }
    if (!equal(prevProps.suggestions, nextProps.suggestions)) {
      return false;
    }

    return true;
  },
);

function PureAttachmentsButton({
  fileInputRef,
  status,
  selectedModelId,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers<ChatMessage>["status"];
  selectedModelId: string;
}) {
  const isReasoningModel = selectedModelId === "chat-model-reasoning";

  return (
    <Button
      className="aspect-square h-8 rounded-lg p-1 transition-colors hover:bg-accent"
      data-testid="attachments-button"
      disabled={status !== "ready" || isReasoningModel}
      onClick={(event) => {
        event.preventDefault();
        fileInputRef.current?.click();
      }}
      variant="ghost"
    >
      <PaperclipIcon size={14} style={{ width: 14, height: 14 }} />
    </Button>
  );
}

const AttachmentsButton = memo(PureAttachmentsButton);

function PureModelSelectorCompact({
  selectedModelId,
  onModelChange,
}: {
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
}) {
  const [optimisticModelId, setOptimisticModelId] = useState(selectedModelId);
  const { models: chatModels } = useAvailableChatModels();

  useEffect(() => {
    setOptimisticModelId(selectedModelId);
  }, [selectedModelId]);

  const selectedModel = chatModels.find(
    (model) => model.id === optimisticModelId,
  );

  // Select value must be non-empty (Radix reserves "" for clearing). Use id when name is empty.
  const selectValue = (model: (typeof chatModels)[number]) => model.name || model.id;

  return (
    <PromptInputModelSelect
      onValueChange={(value) => {
        const model = chatModels.find(
          (m) => m.name === value || m.id === value,
        );
        if (model) {
          setOptimisticModelId(model.id);
          onModelChange?.(model.id);
          startTransition(() => {
            saveChatModelAsCookie(model.id);
          });
        }
      }}
      value={selectedModel ? selectValue(selectedModel) : undefined}
    >
      <Trigger asChild>
        <Button
          className="h-8 px-2"
          data-testid="model-selector"
          variant="ghost"
        >
          <CpuIcon size={16} />
          <span className="hidden font-medium text-xs sm:block">
            {selectedModel ? selectValue(selectedModel) : null}
          </span>
          <ChevronDownIcon size={16} />
        </Button>
      </Trigger>
      <PromptInputModelSelectContent className="min-w-[260px] p-0">
        <div className="flex flex-col gap-px">
          {chatModels.map((model) => (
            <SelectItem
              key={model.id}
              data-testid={`model-selector-item-${model.id}`}
              value={selectValue(model)}
            >
              <div className="truncate font-medium text-xs">
                {model.name || model.id}
              </div>
              <div className="mt-px truncate text-[10px] text-muted-foreground leading-tight">
                {model.description}
              </div>
            </SelectItem>
          ))}
        </div>
      </PromptInputModelSelectContent>
    </PromptInputModelSelect>
  );
}

const ModelSelectorCompact = memo(PureModelSelectorCompact);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
}) {
  return (
    <Button
      className="size-7 rounded-full bg-foreground p-1 text-background transition-colors duration-200 hover:bg-foreground/90 disabled:bg-muted disabled:text-muted-foreground"
      data-testid="stop-button"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => messages);
      }}
    >
      <StopIcon size={14} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);
