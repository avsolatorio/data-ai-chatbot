"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { memo } from "react";
import { getBasePath } from "@/lib/config";
import type { ChatMessage } from "@/lib/types";
import { Suggestion } from "./elements/suggestion";
import type { VisibilityType } from "./visibility-selector";

const DEFAULT_SUGGESTIONS = [
  "Summarize the key trends in this document",
  "Explain this in simpler terms",
  "What are the main takeaways?",
  "Suggest next steps or recommendations",
] as const;

const SUGGESTIONS_LABEL = "Suggested questions";

type SuggestedActionsProps = {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  selectedVisibilityType: VisibilityType;
  suggestions?: string[];
  /** Optional label shown above the suggestion chips. */
  label?: string;
};

function PureSuggestedActions({
  chatId,
  label = SUGGESTIONS_LABEL,
  sendMessage,
  suggestions: suggestionsProp,
}: SuggestedActionsProps) {
  const suggestions = suggestionsProp?.length
    ? suggestionsProp
    : [...DEFAULT_SUGGESTIONS];

  return (
    <div className="flex w-full flex-col gap-3" data-testid="suggested-actions">
      <motion.p
        animate={{ opacity: 1 }}
        className="home-suggestions-label text-xs font-medium uppercase tracking-wider"
        initial={{ opacity: 0 }}
        transition={{ delay: 0.4, duration: 0.25 }}
      >
        {label}
      </motion.p>
      <div className="grid w-full gap-2 sm:grid-cols-2">
        {suggestions.map((suggestedAction, index) => (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            initial={{ opacity: 0, y: 20 }}
            key={suggestedAction}
            transition={{ delay: 0.45 + 0.04 * index, duration: 0.25 }}
          >
            <Suggestion
              className="home-suggestion-chip h-auto w-full whitespace-normal rounded-lg border py-3 text-center text-sm transition-colors"
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
  }
);
