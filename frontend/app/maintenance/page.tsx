/**
 * Maintenance page shown when the app is under scheduled maintenance.
 * Route: /maintenance
 *
 * Redirect (runtime, no rebuild): set MAINTENANCE_MODE=true in App Service (or server env).
 * Middleware redirects all traffic to this page when MAINTENANCE_MODE is set.
 *
 * Optional env (build-time for custom copy):
 * - NEXT_PUBLIC_MAINTENANCE_MESSAGE: custom message.
 * - NEXT_PUBLIC_MAINTENANCE_ESTIMATED_END: e.g. "2:00 PM UTC".
 * Contact link uses NEXT_PUBLIC_FEEDBACK_CONTACT_URL when set.
 */
import { Bot, Database, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { appConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: `Maintenance | ${appConfig.metadata.title}`,
  description:
    "Data360 Chat is currently under maintenance. Please check back later.",
  robots: "noindex, nofollow",
};

/** Optional maintenance message override via env. */
function getMaintenanceMessage(): string {
  const v = process.env.NEXT_PUBLIC_MAINTENANCE_MESSAGE;
  if (typeof v === "string" && v.trim().length > 0) return v.trim();
  return "We're currently performing scheduled maintenance to improve your experience. Please check back shortly.";
}

/** Optional estimated end time (e.g. "2:00 PM UTC" or "in about 1 hour"). */
function getEstimatedEnd(): string | null {
  const v = process.env.NEXT_PUBLIC_MAINTENANCE_ESTIMATED_END;
  if (typeof v === "string" && v.trim().length > 0) return v.trim();
  return null;
}

export default function MaintenancePage() {
  const message = getMaintenanceMessage();
  const estimatedEnd = getEstimatedEnd();
  const contact = appConfig.feedbackContact;

  return (
    <main className="relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Subtle grid background (data vibe) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
        aria-hidden
      >
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `
              linear-gradient(to right, var(--foreground) 1px, transparent 1px),
              linear-gradient(to bottom, var(--foreground) 1px, transparent 1px)
            `,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative flex w-full max-w-lg flex-col items-center gap-10 text-center">
        {/* Animated hero: bot + data sparkles */}
        <div className="flex flex-col items-center gap-6">
          <div
            className="maintenance-float relative flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-2 border-[var(--home-accent)] bg-gradient-to-br from-[var(--home-accent)]/15 to-[var(--home-accent)]/5 text-[var(--home-accent)] shadow-lg"
            aria-hidden
          >
            <Bot size={44} strokeWidth={1.5} aria-hidden className="shrink-0" />
            <span
              className="maintenance-pulse-soft absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--home-accent)]/20"
              aria-hidden
            >
              <Sparkles
                size={14}
                className="text-[var(--home-accent)]"
                aria-hidden
              />
            </span>
            <span
              className="maintenance-pulse-soft absolute -bottom-0.5 -left-1 flex h-5 w-5 items-center justify-center rounded bg-[var(--home-accent)]/10"
              aria-hidden
            >
              <Database
                size={12}
                className="text-[var(--home-accent)]"
                aria-hidden
              />
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="font-semibold text-2xl tracking-tight text-foreground sm:text-3xl">
              Recharging my data brain
            </h1>
            <p className="flex items-center justify-center gap-1 text-muted-foreground text-base">
              <span className="sr-only">Loading</span>
              <span
                className="maintenance-dot h-2 w-2 rounded-full bg-[var(--home-accent)]"
                aria-hidden
              />
              <span
                className="maintenance-dot h-2 w-2 rounded-full bg-[var(--home-accent)]"
                aria-hidden
              />
              <span
                className="maintenance-dot h-2 w-2 rounded-full bg-[var(--home-accent)]"
                aria-hidden
              />
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-muted-foreground text-base leading-relaxed">
            {message}
          </p>
          {estimatedEnd ? (
            <p className="text-muted-foreground text-sm">
              Estimated completion: {estimatedEnd}
            </p>
          ) : null}
        </div>

        <p className="text-muted-foreground text-sm">
          Thank you for your patience. I’ll be back with better data answers
          soon.
        </p>

        {contact ? (
          <a
            href={contact.url}
            className="font-medium text-[var(--home-accent)] underline underline-offset-4 outline-none transition-colors hover:text-[var(--home-accent)]/80 focus-visible:ring-2 focus-visible:ring-[var(--home-accent)] focus-visible:ring-offset-2 rounded"
          >
            {contact.label}
          </a>
        ) : null}
      </div>
    </main>
  );
}
