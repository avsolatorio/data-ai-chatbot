"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { memo } from "react";
import type { ChatMessage } from "@/lib/types";
import { Suggestion } from "./elements/suggestion";
import type { VisibilityType } from "./visibility-selector";

const DEFAULT_SUGGESTIONS = [
  "Summarize the key trends in this document",
  "Explain this in simpler terms",
  "What are the main takeaways?",
  "Suggest next steps or recommendations",
] as const;

type SuggestedActionsProps = {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  selectedVisibilityType: VisibilityType;
  suggestions?: string[];
};

function PureSuggestedActions({
  chatId,
  sendMessage,
  suggestions: suggestionsProp,
}: SuggestedActionsProps) {
  const suggestions = suggestionsProp?.length
    ? suggestionsProp
    : [...DEFAULT_SUGGESTIONS];

  return (
    <div
      className="grid w-full gap-2 sm:grid-cols-2"
      data-testid="suggested-actions"
    >
      {suggestions.map((suggestedAction, index) => (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          initial={{ opacity: 0, y: 20 }}
          key={suggestedAction}
          transition={{ delay: 0.05 * index, duration: 0.25 }}
        >
          <Suggestion
            className="h-auto w-full whitespace-normal p-3 text-center text-sm"
            onClick={(suggestion) => {
              window.history.pushState({}, "", `/chat/${chatId}`);
              sendMessage({
                role: "user",
                parts: [{ type: "text", text: suggestion }],
              });
            }}
            suggestion={suggestedAction}
          >
            {suggestedAction}
          </Suggestion>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) {
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
