"use client";

import {
  type ComponentProps,
  type ReactNode,
  Children,
  isValidElement,
  memo,
} from "react";
import type { Components } from "react-markdown";
import { ClaimMarkStreamdown, streamdownClaimComponents } from "@pcn-js/ui";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";

type ResponseProps = ComponentProps<typeof Streamdown>;

const streamdownClassName =
  "response-markdown size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_code]:whitespace-pre-wrap [&_code]:break-words [&_pre]:max-w-full [&_pre]:overflow-x-auto";

const DATA_LABELS = ["Data", "Analysis", "Note"] as const;
type DataLabel = (typeof DATA_LABELS)[number];

function getResultLabel(children: ReactNode): DataLabel | null {
  const arr = Children.toArray(children);
  const first = arr[0];
  if (!isValidElement(first) || first.type !== "strong") return null;
  const text =
    typeof first.props.children === "string"
      ? first.props.children
      : String(first.props.children ?? "");
  const match = DATA_LABELS.find((l) => text.startsWith(`${l}:`));
  return match ?? null;
}

/** Paragraph component: wrap **Data:**, **Analysis:**, **Note:** blocks with subtle styling. */
function ResponseParagraph({
  children,
  ...props
}: ComponentProps<"p">) {
  const label = getResultLabel(children);
  if (!label) {
    return <p {...props}>{children}</p>;
  }
  const labelKey = label.toLowerCase() as Lowercase<DataLabel>;
  return (
    <div
      className={cn(
        "my-1 rounded border-l-2 border-l-border pl-2",
        labelKey === "data" && "border-l-chart-2",
        labelKey === "analysis" && "border-l-chart-4",
        labelKey === "note" && "border-l-muted-foreground"
      )}
      data-result-label={labelKey}
    >
      <p className="mb-0 mt-0" {...props}>
        {children}
      </p>
    </div>
  );
}

/** Streamdown uses react-markdown + rehype-raw; custom `claim` is supported at runtime but not in Components type. */
const responseComponents = {
  ...streamdownClaimComponents,
  claim: ClaimMarkStreamdown,
  p: ResponseParagraph,
} as Partial<Components>;

export const Response = memo(
  ({ className, ...props }: ResponseProps) => {
    const children =
      typeof props.children === "string" ? props.children : "";
    return (
      <Streamdown
        className={cn(streamdownClassName, className)}
        components={responseComponents}
      >
        {children}
      </Streamdown>
    );
  },
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = "Response";
