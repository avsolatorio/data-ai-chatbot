"use client";

import type { ComponentProps } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import type { AppUsage } from "@/lib/usage";
import { cn } from "@/lib/utils";

export type MessageTokenUsageProps = ComponentProps<"button"> & {
  /** Usage data for this message */
  usage?: AppUsage;
};

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
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}k`;
  }
  return tokens.toString();
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "inline-flex select-none items-center gap-1 rounded-md text-xs",
            "cursor-pointer bg-background text-muted-foreground",
            "outline-none ring-offset-background transition-colors",
            "hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            className
          )}
          type="button"
          {...props}
        >
          <span className="font-mono">{displayText}</span>
          <span className="text-[10px] opacity-60">tokens</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-fit p-3" side="top">
        <div className="min-w-[240px] space-y-2">
          <div className="flex items-start justify-between text-sm">
            <span className="font-medium">Token Usage</span>
            <span className="text-muted-foreground font-mono">
              {totalTokens.toLocaleString()}
            </span>
          </div>
          <div className="mt-1 space-y-1">
            {usage?.cachedInputTokens && usage.cachedInputTokens > 0 && (
              <InfoRow
                costText={usage?.costUSD?.cacheReadUSD?.toString()}
                label="Cache Hits"
                tokens={usage?.cachedInputTokens}
              />
            )}
            <InfoRow
              costText={usage?.costUSD?.inputUSD?.toString()}
              label="Input"
              tokens={usage?.inputTokens}
            />
            <InfoRow
              costText={usage?.costUSD?.outputUSD?.toString()}
              label="Output"
              tokens={usage?.outputTokens}
            />
            <InfoRow
              costText={usage?.costUSD?.reasoningUSD?.toString()}
              label="Reasoning"
              tokens={
                usage?.reasoningTokens && usage.reasoningTokens > 0
                  ? usage.reasoningTokens
                  : undefined
              }
            />
            {usage?.costUSD?.totalUSD !== undefined && (
              <>
                <Separator className="mt-1" />
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-muted-foreground">Total cost</span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="min-w-[4ch] text-right" />
                    <span>
                      {Number.isNaN(
                        Number.parseFloat(usage.costUSD.totalUSD.toString())
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
