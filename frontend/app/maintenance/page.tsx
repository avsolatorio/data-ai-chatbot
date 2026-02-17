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
import { Construction } from "lucide-react";
import type { Metadata } from "next";
import { appConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: `Maintenance | ${appConfig.metadata.title}`,
  description: "Data360 Chat is currently under maintenance. Please check back later.",
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
    <main className="flex min-h-dvh w-full flex-col items-center justify-center bg-background px-4 py-12">
      <div className="flex w-full max-w-lg flex-col items-center gap-8 text-center">
        <div
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-[var(--home-accent)] bg-[var(--home-accent)]/10 text-[var(--home-accent)]"
          aria-hidden
        >
          <Construction
            size={40}
            strokeWidth={1.5}
            aria-hidden
            className="shrink-0"
          />
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="font-semibold text-2xl tracking-tight text-foreground sm:text-3xl">
            Under maintenance
          </h1>
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
          Thank you for your patience.
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
