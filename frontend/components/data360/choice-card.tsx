"use client";

import { ChoiceCard } from "@data360/mcp-ui/choice-card";
import type { ChoiceCardPayload } from "@data360/mcp-ui/choice-card";

export type InteractiveChoicesOutput = {
  prompt: string;
  options: string[];
  title?: string | null;
};

function isValidPayload(raw: unknown): raw is InteractiveChoicesOutput {
  if (typeof raw !== "object" || raw === null) return false;
  const r = raw as Record<string, unknown>;
  return (
    typeof r.prompt === "string" &&
    Array.isArray(r.options) &&
    r.options.every((o) => typeof o === "string")
  );
}

export function InteractiveChoicesCard({
  output,
  onSelect,
  theme = "light",
}: {
  output: unknown;
  onSelect: (text: string) => void;
  theme?: "light" | "dark";
}) {
  if (!isValidPayload(output)) return null;

  const payload: ChoiceCardPayload = {
    prompt: output.prompt,
    options: output.options,
    title: output.title ?? undefined,
  };

  return <ChoiceCard payload={payload} onSelect={onSelect} theme={theme} />;
}
