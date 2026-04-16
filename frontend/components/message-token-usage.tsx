"use client";

import type { ComponentProps } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import type { AppUsage, NodeUsage } from "@/lib/usage";
import { cn } from "@/lib/utils";

export type MessageTokenUsageProps = ComponentProps<"button"> & {
  /** Usage data for this message */
  usage?: AppUsage;
};

// Display name + emoji for known node names
const NODE_DISPLAY: Record<string, { label: string; icon: string }> = {
  research: { label: "Research", icon: "🔍" },
  explain: { label: "Explain", icon: "📖" },
  narrator: { label: "Narrator", icon: "✍️" },
  followup: { label: "Follow-up", icon: "💬" },
  router: { label: "Router", icon: "🧭" },
  direct: { label: "Response", icon: "⚡" },
  clarifier: { label: "Clarifier", icon: "❓" },
  suggester: { label: "Suggester", icon: "💡" },
  summarizer: { label: "Summarizer", icon: "📝" },
};

function nodeDisplayName(name: string): string {
  const entry = NODE_DISPLAY[name];
  if (entry) return `${entry.icon} ${entry.label}`;
  return `⚙️ ${name}`;
}

function InfoRow({
  label,
  tokens,
  costText,
}: {
  label: string;
  tokens?: number;
  costText?: string;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 font-mono">
        <span className="min-w-[4ch] text-right">
          {tokens === undefined ? "—" : tokens.toLocaleString()}
        </span>
        {costText !== undefined &&
          costText !== null &&
          !Number.isNaN(Number.parseFloat(costText)) && (
            <span className="text-muted-foreground">
              ${Number.parseFloat(costText).toFixed(6)}
            </span>
          )}
      </div>
    </div>
  );
}

function formatTokenCount(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k`;
  }
  return tokens.toString();
}

function formatCost(cost: number | undefined | null): string | undefined {
  if (cost === undefined || cost === null || cost === 0) {
    return "";
  }
  return cost.toString();
}

function AgentBreakdownSection({
  byNode,
}: {
  byNode: Record<string, NodeUsage>;
}) {
  const rows = Object.entries(byNode).sort(
    ([, a], [, b]) => (b.inputTokens ?? 0) - (a.inputTokens ?? 0),
  );

  const hasCost = rows.some(
    ([, n]) => n.costUSD?.totalUSD != null && n.costUSD.totalUSD > 0,
  );

  return (
    <div className="space-y-1">
      <div className="pb-1 text-xs font-medium text-muted-foreground">
        Agent Breakdown
      </div>
      <div className="space-y-0.5">
        {/* Header row */}
        <div
          className={cn(
            "grid text-[10px] font-medium uppercase tracking-wide text-muted-foreground",
            hasCost ? "grid-cols-4" : "grid-cols-3",
          )}
        >
          <span>Agent</span>
          <span className="text-right font-mono">Input</span>
          <span className="text-right font-mono">Output</span>
          {hasCost && <span className="text-right font-mono">Cost</span>}
        </div>
        {rows.map(([nodeName, nodeData]) => {
          const totalCost = nodeData.costUSD?.totalUSD ?? 0;
          return (
            <div
              key={nodeName}
              className={cn(
                "grid items-center text-xs",
                hasCost ? "grid-cols-4" : "grid-cols-3",
              )}
            >
              <span className="truncate text-muted-foreground">
                {nodeDisplayName(nodeName)}
              </span>
              <span className="text-right font-mono">
                {(nodeData.inputTokens ?? 0).toLocaleString()}
              </span>
              <span className="text-right font-mono">
                {(nodeData.outputTokens ?? 0).toLocaleString()}
              </span>
              {hasCost && (
                <span className="text-right font-mono text-muted-foreground">
                  {totalCost > 0 ? `$${totalCost.toFixed(6)}` : "—"}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MessageTokenUsage({
  className,
  usage,
  ...props
}: MessageTokenUsageProps) {
  if (!usage || !usage.totalTokens) {
    return null;
  }

  const totalTokens = usage.totalTokens ?? 0;
  const displayText = formatTokenCount(totalTokens);

  const byNodeEntries = usage.byNode ? Object.keys(usage.byNode) : [];
  const showAgentBreakdown = byNodeEntries.length >= 2;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "inline-flex select-none items-center gap-1 rounded-md text-xs",
            "cursor-pointer bg-background text-muted-foreground",
            "outline-none ring-offset-background transition-colors",
            "hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "shrink-0",
            className,
          )}
          type="button"
          {...props}
        >
          <span className="font-mono">{displayText}</span>
          <span className="text-[10px] opacity-60">tokens</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-fit p-3" side="top">
        <div className="min-w-[280px] space-y-2">
          {/* Section 1: Agent Breakdown (only when ≥2 nodes) */}
          {showAgentBreakdown && usage.byNode && (
            <>
              <AgentBreakdownSection byNode={usage.byNode} />
              <Separator />
            </>
          )}

          {/* Section 2: Totals */}
          <div className="space-y-1">
            {showAgentBreakdown && (
              <div className="pb-1 text-xs font-medium text-muted-foreground">
                Totals
              </div>
            )}
            <div className="flex items-start justify-between text-sm">
              <span className="font-medium">Token Usage</span>
              <span className="font-mono text-muted-foreground">
                {totalTokens.toLocaleString()}
              </span>
            </div>
            <div className="mt-1 space-y-1">
              <InfoRow
                costText={formatCost(usage?.costUSD?.cacheReadUSD)}
                label="Cache Hits"
                tokens={usage?.cachedInputTokens}
              />
              <InfoRow
                costText={formatCost(usage?.costUSD?.inputUSD)}
                label="Input"
                tokens={usage?.inputTokens}
              />
              <InfoRow
                costText={formatCost(usage?.costUSD?.outputUSD)}
                label="Output"
                tokens={usage?.outputTokens}
              />
              <InfoRow
                costText={formatCost(usage?.costUSD?.reasoningUSD)}
                label="Reasoning"
                tokens={usage?.reasoningTokens}
              />
              {usage?.costUSD?.totalUSD != null &&
                usage.costUSD.totalUSD > 0 && (
                  <>
                    <Separator className="mt-1" />
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-muted-foreground">Total cost</span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="min-w-[4ch] text-right" />
                        <span>
                          {Number.isNaN(
                            Number.parseFloat(
                              usage.costUSD.totalUSD.toString(),
                            ),
                          )
                            ? "—"
                            : `$${Number.parseFloat(usage.costUSD.totalUSD.toString()).toFixed(6)}`}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              {usage?.modelId && (
                <>
                  <Separator className="mt-1" />
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-muted-foreground">Model</span>
                    <span className="font-mono text-muted-foreground">
                      {usage.modelId}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
