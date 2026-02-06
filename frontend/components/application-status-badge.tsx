"use client";

import { appConfig, type ApplicationStatus } from "@/lib/config";
import { cn } from "@/lib/utils";

const statusVariant: Record<
  ApplicationStatus,
  "destructive" | "secondary" | "outline"
> = {
  "pre-alpha": "destructive",
  alpha: "secondary",
  beta: "outline",
};

const statusLabel: Record<ApplicationStatus, string> = {
  "pre-alpha": "Pre-alpha",
  alpha: "Alpha",
  beta: "Beta",
};

export function ApplicationStatusBadge({
  className,
  showTooltip = true,
}: {
  className?: string;
  showTooltip?: boolean;
}) {
  const status = appConfig.applicationStatus;
  if (!status) return null;

  const label = statusLabel[status];
  const variant = statusVariant[status];

  const badge = (
    <span
      className={cn(
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-2 py-0.5 font-semibold text-xs transition-colors",
        variant === "destructive" &&
          "border-amber-500/50 bg-amber-500/15 text-amber-700 dark:text-amber-400",
        variant === "secondary" &&
          "border-blue-500/50 bg-blue-500/15 text-blue-700 dark:text-blue-400",
        variant === "outline" &&
          "border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
        className
      )}
      title={showTooltip ? "This application is not stable yet." : undefined}
    >
      {label}
    </span>
  );

  return badge;
}
