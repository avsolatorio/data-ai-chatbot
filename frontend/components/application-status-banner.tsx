"use client";

import { appConfig, type ApplicationStatus } from "@/lib/config";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  "pre-alpha": "Pre-alpha",
  alpha: "Alpha",
  beta: "Beta",
};

type Variant = "sidebar" | "banner";

export function ApplicationStatusBanner({
  variant = "banner",
  onOpenFeedback,
}: { variant?: Variant; onOpenFeedback?: () => void }) {
  const status = appConfig.applicationStatus;
  const contact = appConfig.feedbackContact;

  if (!status) return null;

  const label = STATUS_LABEL[status];

  if (variant === "sidebar") {
    const shareFeedbackContent = "Share feedback";
    return (
      <div
        className={cn(
          "flex w-full flex-shrink-0 items-center justify-center border-b px-2 py-1.5 text-center text-xs",
          "bg-muted/60 text-muted-foreground",
          status === "pre-alpha" &&
            "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200",
          status === "alpha" &&
            "border-blue-500/30 bg-blue-500/10 text-blue-800 dark:text-blue-200",
          status === "beta" &&
            "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
        )}
      >
        <span className="truncate">
          <strong className="font-semibold">{label}</strong>
          {" · "}
          {onOpenFeedback ? (
            <button
              className="underline underline-offset-1 hover:no-underline"
              onClick={onOpenFeedback}
              type="button"
            >
              {shareFeedbackContent}
            </button>
          ) : contact ? (
            <a
              className="underline underline-offset-1 hover:no-underline"
              href={contact.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              {shareFeedbackContent}
            </a>
          ) : (
            shareFeedbackContent
          )}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full flex-shrink-0 items-center justify-center border-b px-2 py-1.5 text-center text-sm md:px-2",
        "bg-muted/60 text-muted-foreground",
        status === "pre-alpha" &&
          "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200",
        status === "alpha" &&
          "border-blue-500/30 bg-blue-500/10 text-blue-800 dark:text-blue-200",
        status === "beta" &&
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
      )}
    >
      <span>
        We&apos;re in <strong className="font-semibold">{label}</strong>! Help
        us improve by{" "}
        {contact ? (
          <a
            className="font-medium underline underline-offset-2 hover:no-underline"
            href={contact.url}
            rel="noopener noreferrer"
            target="_blank"
          >
            sharing your feedback
          </a>
        ) : (
          "sharing your feedback"
        )}
        .
      </span>
    </div>
  );
}
