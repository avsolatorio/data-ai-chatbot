"use client";

import {
  type ComponentProps,
  type ReactNode,
  Children,
  isValidElement,
  memo,
  useEffect,
  useRef,
} from "react";
import type { Components } from "react-markdown";
import { ClaimMarkStreamdown, streamdownClaimComponents } from "@pcn-js/ui";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";

const PCN_LOG_PREFIX = "[PCN claim]";

/** Log text that contains <claim> before and after Streamdown/PCN processing (frontend-only diagnostic). */
function useClaimDiagnosticLog(children: string) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hadClaimInInput = children.includes("<claim");

  useEffect(() => {
    if (!hadClaimInInput) return;
    const logAfter = () => {
      const el = containerRef.current;
      if (!el) return;
      const after = el.querySelectorAll("[data-pcn-claim-id], .pcn-claim");
      const count = after.length;
      const firstId =
        after.length > 0
          ? (after[0].getAttribute("data-pcn-claim-id") ?? after[0].id ?? "—")
          : null;
      if (typeof console !== "undefined" && console.info) {
        console.info(
          `${PCN_LOG_PREFIX} after: DOM has ${count} claim node(s)`,
          firstId != null ? { firstClaimId: firstId } : {}
        );
      }
    };
    logAfter();
    const t = setTimeout(logAfter, 150);
    return () => clearTimeout(t);
  }, [hadClaimInInput]);

  return containerRef;
}

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
    const containerRef = useClaimDiagnosticLog(children);

    if (children.includes("<claim") && typeof console !== "undefined" && console.info) {
      const snippet = children.length > 400 ? `${children.slice(0, 400)}…` : children;
      console.info(
        `${PCN_LOG_PREFIX} before: length=${children.length}, snippet=`,
        snippet
      );
    }

    return (
      <div
        ref={containerRef}
        className="response-markdown-wrapper"
        style={{ display: "contents" }}
      >
        <Streamdown
          className={cn(streamdownClassName, className)}
          components={responseComponents}
        >
          {children}
        </Streamdown>
      </div>
    );
  },
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = "Response";
