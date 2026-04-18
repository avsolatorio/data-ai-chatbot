"use client";

import type { ToolUIPart } from "ai";
import { ChevronDownIcon, WrenchIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { getToolDisplayName } from "@/lib/tool-display";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./code-block";

export type ToolProps = ComponentProps<typeof Collapsible>;

export const Tool = ({ className, ...props }: ToolProps) => (
  <Collapsible
    className={cn(
      "not-prose group min-w-0 w-full border-border/50 border-b last:border-b-0",
      className,
    )}
    {...props}
  />
);

export type ToolHeaderProps = {
  type: ToolUIPart["type"];
  state: ToolUIPart["state"];
  className?: string;
};

const STATUS_DOT: Record<
  ToolUIPart["state"],
  { label: string; className: string }
> = {
  "input-streaming": {
    label: "Pending",
    className: "bg-muted-foreground/50",
  },
  "input-available": {
    label: "Running",
    className: "animate-pulse bg-amber-500/80",
  },
  "output-available": {
    label: "Done",
    className: "bg-emerald-600/80 dark:bg-emerald-500/70",
  },
  "output-error": {
    label: "Error",
    className: "bg-destructive/80",
  },
};

const ToolStatus = ({ state }: { state: ToolUIPart["state"] }) => {
  const { label, className: dotClass } = STATUS_DOT[state];
  return (
    <span className="flex items-center gap-1.5">
      <span
        aria-hidden
        className={cn("size-1.5 shrink-0 rounded-full", dotClass)}
      />
      <span className="text-muted-foreground text-xs">{label}</span>
    </span>
  );
};

export const ToolHeader = ({
  className,
  type,
  state,
  ...props
}: ToolHeaderProps) => (
  <CollapsibleTrigger
    className={cn(
      "flex w-full min-w-0 items-center justify-between gap-2 py-1.5 pr-1 pl-0 text-left hover:bg-muted/30",
      className,
    )}
    {...props}
  >
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <WrenchIcon
        aria-hidden
        className="hidden size-3.5 shrink-0 text-muted-foreground/70 group-data-[state=open]:block"
      />
      <span className="truncate text-foreground text-sm">
        {getToolDisplayName(String(type))}
      </span>
    </div>
    <div className="flex shrink-0 items-center gap-1.5">
      <ToolStatus state={state} />
      <ChevronDownIcon
        aria-hidden
        className="size-3.5 shrink-0 text-muted-foreground/80 transition-transform group-data-[state=open]:rotate-180"
      />
    </div>
  </CollapsibleTrigger>
);

export type ToolContentProps = ComponentProps<typeof CollapsibleContent>;

export const ToolContent = ({ className, ...props }: ToolContentProps) => (
  <CollapsibleContent
    className={cn(
      "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground outline-hidden data-[state=closed]:animate-out data-[state=open]:animate-in",
      "ml-1 border-border/40 border-l pb-2 pl-2.5",
      className,
    )}
    {...props}
  />
);

export type ToolInputProps = ComponentProps<"div"> & {
  input: ToolUIPart["input"];
};

export const ToolInput = ({ className, input, ...props }: ToolInputProps) => (
  <div
    className={cn("min-w-0 space-y-1.5 overflow-hidden pt-0.5", className)}
    {...props}
  >
    <p className="text-muted-foreground text-xs">Parameters</p>
    <div className="min-w-0 rounded-md bg-muted/40">
      <CodeBlock code={JSON.stringify(input, null, 2)} language="json" />
    </div>
  </div>
);

export type ToolOutputProps = ComponentProps<"div"> & {
  output: ReactNode;
  errorText: ToolUIPart["errorText"];
  useDefaultFormat: boolean;
};

export const ToolOutput = ({
  className,
  output,
  errorText,
  useDefaultFormat = true,
  ...props
}: ToolOutputProps) => {
  if (!(output || errorText)) {
    return null;
  }

  if (useDefaultFormat || errorText !== undefined) {
    return (
      <div className={cn("min-w-0 space-y-1.5 pt-0.5", className)} {...props}>
        <p className="text-muted-foreground text-xs">
          {errorText ? "Error" : "Result"}
        </p>
        <div
          className={cn(
            "min-w-0 overflow-x-auto rounded-md text-xs [&_table]:w-full",
            errorText
              ? "bg-destructive/10 text-destructive"
              : "bg-muted/40 text-foreground",
          )}
        >
          {errorText && <div className="px-1 py-0.5">{errorText}</div>}
          {output && <div className="min-w-0">{output}</div>}
        </div>
      </div>
    );
  }
  return (
    <div className={cn("min-w-0 pt-0.5", className)} {...props}>
      {output && <div className="min-w-0">{output}</div>}
    </div>
  );
};
