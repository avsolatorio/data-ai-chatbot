import equal from "fast-deep-equal";
import { memo, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { useCopyToClipboard } from "usehooks-ts";
import { apiFetch } from "@/lib/api-client";
import type { Vote } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";
import type { AppUsage } from "@/lib/usage";
import { Action, Actions } from "./elements/actions";
import { CopyIcon, FeedbackIcon, PencilEditIcon, ThumbDownIcon, ThumbUpIcon } from "./icons";
import { MessageFeedback } from "./message-feedback";
import { MessageTokenUsage } from "./message-token-usage";

export function PureMessageActions({
  chatId,
  message,
  vote,
  isLoading,
  setMode,
}: {
  chatId: string;
  message: ChatMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMode?: (mode: "view" | "edit") => void;
}) {
  const { mutate } = useSWRConfig();
  const [_, copyToClipboard] = useCopyToClipboard();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  if (isLoading) {
    return null;
  }

  const textFromParts = message.parts
    ?.filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();

  // Extract usage data from message parts
  // The data-usage event is stored in parts with structure: { type: "data-usage", data: {...} }
  const usagePart = message.parts?.find(
    (part) => part.type === "data-usage"
  );
  const usageData: AppUsage | undefined = usagePart
    ? (usagePart as { type: string; data?: AppUsage }).data
    : undefined;

  const handleCopy = async () => {
    if (!textFromParts) {
      toast.error("There's no text to copy!");
      return;
    }

    await copyToClipboard(textFromParts);
    toast.success("Copied to clipboard!");
  };

  // User messages get edit (on hover) and copy actions
  if (message.role === "user") {
    return (
      <Actions className="-mr-0.5 shrink-0 justify-end">
        <div className="relative">
          {setMode && (
            <Action
              className="-left-10 absolute top-0 opacity-0 transition-opacity focus-visible:opacity-100 group-hover/message:opacity-100"
              data-testid="message-edit-button"
              onClick={() => setMode("edit")}
              tooltip="Edit"
            >
              <PencilEditIcon />
            </Action>
          )}
          <Action onClick={handleCopy} tooltip="Copy">
            <CopyIcon />
          </Action>
        </div>
      </Actions>
    );
  }

  return (
    <>
      <Actions className="-ml-0.5 shrink-0">
        <Action onClick={handleCopy} tooltip="Copy">
          <CopyIcon />
        </Action>

        <Action
          data-testid="message-upvote"
          disabled={vote?.isUpvoted === true}
          onClick={() => {
            const upvote = apiFetch("/api/vote", {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                chatId,
                messageId: message.id,
                type: "up",
              }),
            });

            toast.promise(upvote, {
              loading: "Upvoting Response...",
              success: () => {
                mutate<Vote[]>(
                  `/api/vote?chatId=${chatId}`,
                  (currentVotes) => {
                    if (!currentVotes) {
                      const now = new Date();

                      const newVote: Vote = {
                        chatId,
                        messageId: message.id,
                        isUpvoted: true,
                        feedback: null,
                        createdAt: now,
                        updatedAt: now,
                        voteCreatedAt: now,
                        voteUpdatedAt: now,
                        feedbackCreatedAt: null,
                        feedbackUpdatedAt: null,
                      };

                      return [newVote];
                    }

                    const votesWithoutCurrent = currentVotes.filter(
                      (currentVote) => currentVote.messageId !== message.id
                    );

                    const existingVote = currentVotes.find(
                      (currentVote) => currentVote.messageId === message.id
                    );

                    const now = new Date();

                    const updatedVote: Vote = existingVote
                      ? {
                          ...existingVote,
                          isUpvoted: true,
                          updatedAt: now,
                          voteUpdatedAt: now,
                          voteCreatedAt:
                            existingVote.voteCreatedAt ?? existingVote.createdAt,
                        }
                      : {
                          chatId,
                          messageId: message.id,
                          isUpvoted: true,
                          feedback: null,
                          createdAt: now,
                          updatedAt: now,
                          voteCreatedAt: now,
                          voteUpdatedAt: now,
                          feedbackCreatedAt: null,
                          feedbackUpdatedAt: null,
                        };

                    return [...votesWithoutCurrent, updatedVote];
                  },
                  { revalidate: false }
                );

                return "Upvoted Response!";
              },
              error: "Failed to upvote response.",
            });
          }}
          tooltip="Upvote Response"
        >
          <ThumbUpIcon />
        </Action>

        <Action
          data-testid="message-downvote"
          disabled={vote?.isUpvoted === false}
          onClick={() => {
            const downvote = apiFetch("/api/vote", {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                chatId,
                messageId: message.id,
                type: "down",
              }),
            });

            toast.promise(downvote, {
              loading: "Downvoting Response...",
              success: () => {
                mutate<Vote[]>(
                  `/api/vote?chatId=${chatId}`,
                  (currentVotes) => {
                    if (!currentVotes) {
                      const now = new Date();

                      const newVote: Vote = {
                        chatId,
                        messageId: message.id,
                        isUpvoted: false,
                        feedback: null,
                        createdAt: now,
                        updatedAt: now,
                        voteCreatedAt: now,
                        voteUpdatedAt: now,
                        feedbackCreatedAt: null,
                        feedbackUpdatedAt: null,
                      };

                      return [newVote];
                    }

                    const votesWithoutCurrent = currentVotes.filter(
                      (currentVote) => currentVote.messageId !== message.id
                    );

                    const existingVote = currentVotes.find(
                      (currentVote) => currentVote.messageId === message.id
                    );

                    const now = new Date();

                    const updatedVote: Vote = existingVote
                      ? {
                          ...existingVote,
                          isUpvoted: false,
                          updatedAt: now,
                          voteUpdatedAt: now,
                          voteCreatedAt:
                            existingVote.voteCreatedAt ?? existingVote.createdAt,
                        }
                      : {
                          chatId,
                          messageId: message.id,
                          isUpvoted: false,
                          feedback: null,
                          createdAt: now,
                          updatedAt: now,
                          voteCreatedAt: now,
                          voteUpdatedAt: now,
                          feedbackCreatedAt: null,
                          feedbackUpdatedAt: null,
                        };

                    return [...votesWithoutCurrent, updatedVote];
                  },
                  { revalidate: false }
                );

                return "Downvoted Response!";
              },
              error: "Failed to downvote response.",
            });
          }}
          tooltip="Downvote Response"
        >
          <ThumbDownIcon />
        </Action>

        <Action
          className={vote?.feedback ? "text-foreground" : undefined}
          data-testid="message-feedback"
          onClick={() => setIsFeedbackOpen(true)}
          tooltip={vote?.feedback ? "View/Edit Feedback" : "Provide Feedback"}
        >
          <div className="relative">
            <FeedbackIcon />
            {vote?.feedback && (
              <span
                aria-label="Feedback provided"
                className="absolute -right-0.5 -top-0.5 inline-flex size-2 rounded-full bg-primary"
              />
            )}
          </div>
        </Action>

        {usageData && (
          <MessageTokenUsage usage={usageData} />
        )}
      </Actions>
      <MessageFeedback
        chatId={chatId}
        messageId={message.id}
        onOpenChange={setIsFeedbackOpen}
        open={isFeedbackOpen}
        vote={vote}
      />
    </>
  );
}

export const MessageActions = memo(
  PureMessageActions,
  (prevProps, nextProps) => {
    if (!equal(prevProps.vote, nextProps.vote)) {
      return false;
    }
    if (prevProps.isLoading !== nextProps.isLoading) {
      return false;
    }

    return true;
  }
);
