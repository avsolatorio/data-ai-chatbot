"use client";

import { type ComponentProps, memo } from "react";
import { streamdownClaimComponents } from "@pcn-js/ui";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";

type ResponseProps = ComponentProps<typeof Streamdown>;

const streamdownClassName =
  "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_code]:whitespace-pre-wrap [&_code]:break-words [&_pre]:max-w-full [&_pre]:overflow-x-auto";

export const Response = memo(
  ({ className, ...props }: ResponseProps) => {
    const children =
      typeof props.children === "string" ? props.children : "";
    return (
      <Streamdown
        className={cn(streamdownClassName, className)}
        components={streamdownClaimComponents}
      >
        {children}
      </Streamdown>
    );
  },
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = "Response";
