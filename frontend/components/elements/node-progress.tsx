"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NodeProgressPart } from "@/lib/types";

/** Human-readable labels for each preprocessing node. */
const NODE_LABELS: Record<string, string> = {
  transformer: "Analyzing question",
  scout: "Checking data availability",
  planner: "Building research plan",
};

type NodeProgressProps = {
  part: NodeProgressPart;
  className?: string;
};

/**
 * Renders a single preprocessing-node progress item in the data-thinking panel.
 *
 * While status === "running":  animated spinner + label text
 * When  status === "done":     green checkmark + result summary
 *
 * The backend emits paired events with the same `id`, so the streaming hook
 * overwrites the running entry in-place — the transition appears as an
 * in-place animation from spinner to checkmark.
 */
export function NodeProgress({ part, className }: NodeProgressProps) {
  const { node, status, message } = part;
  const label = NODE_LABELS[node] ?? node;
  const isRunning = status === "running";

  return (
    <div
      className={cn(
        "flex items-start gap-2 py-0.5",
        isRunning ? "text-muted-foreground" : "text-muted-foreground",
        className,
      )}
      aria-live={isRunning ? "polite" : undefined}
      aria-label={isRunning ? `${label}…` : message}
    >
      <span className="mt-0.5 shrink-0">
        {isRunning ? (
          <Loader2
            className="size-3 animate-spin text-primary/70"
            aria-hidden
          />
        ) : (
          <CheckCircle2
            className="size-3 text-emerald-500 dark:text-emerald-400"
            aria-hidden
          />
        )}
      </span>
      <span className="min-w-0 text-xs leading-relaxed">
        {isRunning ? (
          // Show the node label while running, not the technical message
          <span className="animate-pulse">{label}…</span>
        ) : (
          // Show the result summary when done
          message
        )}
      </span>
    </div>
  );
}
