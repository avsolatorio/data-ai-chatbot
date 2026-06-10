"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { memo } from "react";
import { getBasePath } from "@/lib/config";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Suggestion } from "./elements/suggestion";
import type { VisibilityType } from "./visibility-selector";

const DEFAULT_SUGGESTIONS = [
  "Summarize the key trends in this document",
  "Explain this in simpler terms",
  "What are the main takeaways?",
  "Suggest next steps or recommendations",
] as const;

const SUGGESTIONS_LABEL = "Suggested questions";
const LANDING_SUGGESTIONS_LABEL = "Suggested Questions";

type SuggestedActionsProps = {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  selectedVisibilityType: VisibilityType;
  suggestions?: string[];
  /** Optional label shown above the suggestion chips. */
  label?: string;
  variant?: "default" | "landing";
};

function PureSuggestedActions({
  chatId,
  label,
  sendMessage,
  suggestions: suggestionsProp,
  variant = "default",
}: SuggestedActionsProps) {
  const suggestions = suggestionsProp?.length
    ? suggestionsProp
    : [...DEFAULT_SUGGESTIONS];
  const resolvedLabel =
    label ??
    (variant === "landing" ? LANDING_SUGGESTIONS_LABEL : SUGGESTIONS_LABEL);

  return (
    <div
      className={cn(
        "flex w-full flex-col",
        variant === "landing" ? "gap-6" : "gap-3",
      )}
      data-testid="suggested-actions"
    >
      <motion.p
        animate={{ opacity: 1 }}
        className={cn(
          variant === "landing"
            ? "text-xl font-semibold uppercase tracking-[1px] text-white"
            : "home-suggestions-label text-xs font-medium uppercase tracking-wider",
        )}
        initial={{ opacity: 0 }}
        transition={{ delay: 0.4, duration: 0.25 }}
      >
        {resolvedLabel}
      </motion.p>
      <div
        className={cn(
          "grid w-full gap-2",
          variant === "landing"
            ? "gap-x-5 gap-y-8 sm:grid-cols-2"
            : "sm:grid-cols-2",
        )}
      >
        {suggestions.map((suggestedAction, index) => (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            initial={{ opacity: 0, y: 20 }}
            key={suggestedAction}
            transition={{ delay: 0.45 + 0.04 * index, duration: 0.25 }}
          >
            <Suggestion
              className={cn(
                "h-auto w-full whitespace-normal text-left transition-colors",
                variant === "landing"
                  ? "home-landing-suggestion-chip border border-white/50 px-5 py-3.5 text-white"
                  : "home-suggestion-chip rounded-lg border py-3 text-center text-sm",
              )}
              onClick={(suggestion) => {
                window.history.pushState(
                  {},
                  "",
                  `${getBasePath()}/chat/${chatId}`,
                );
                sendMessage({
                  role: "user",
                  parts: [{ type: "text", text: suggestion }],
                });
              }}
              suggestion={suggestedAction}
              variant="ghost"
            >
              {suggestedAction}
            </Suggestion>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) {
      return false;
    }
    if (prevProps.label !== nextProps.label) {
      return false;
    }
    if (prevProps.variant !== nextProps.variant) {
      return false;
    }
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
      return false;
    }
    if (
      (prevProps.suggestions?.length ?? 0) !== (nextProps.suggestions?.length ?? 0)
    ) {
      return false;
    }
    if (
      prevProps.suggestions?.some((s, i) => s !== nextProps.suggestions?.[i])
    ) {
      return false;
    }

    return true;
  },
);
