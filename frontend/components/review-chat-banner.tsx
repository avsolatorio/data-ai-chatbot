"use client";

type ReviewChatBannerProps = {
  chatTitle: string;
  highlightMessageId?: string | null;
};

/** Read-only context strip; navigation is in {@link ChatHeader} reviewMode. */
export function ReviewChatBanner({
  chatTitle,
  highlightMessageId,
}: ReviewChatBannerProps) {
  return (
    <div className="shrink-0 border-b border-border bg-muted/40 px-4 py-3">
      <p className="font-medium text-foreground text-sm">
        Read-only review
        {chatTitle ? (
          <>
            {" "}
            · <span className="font-normal text-muted-foreground">{chatTitle}</span>
          </>
        ) : null}
      </p>
      <p className="mt-0.5 text-muted-foreground text-xs">
        You cannot send messages or change votes on this page.
        {highlightMessageId
          ? " Scrolled to the message flagged in feedback."
          : null}
      </p>
    </div>
  );
}
