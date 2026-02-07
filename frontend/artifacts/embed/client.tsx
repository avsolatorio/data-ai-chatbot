"use client";

import { Artifact } from "@/components/create-artifact";
import { ExternalLinkIcon } from "@/components/icons";

const DATA360_INDICATOR_URL =
  "https://data360.worldbank.org/en/int/indicator/WB_CCKP_HURS";

/** Hosts that set X-Frame-Options (e.g. sameorigin) or CSP frame-ancestors and cannot be embedded. */
const BLOCKED_EMBED_HOSTS = new Set([
  "data360.worldbank.org",
  "www.data360.worldbank.org",
]);

/** Only allow https URLs for embedding. */
function isAllowedEmbedUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/** True if the URL's host is known to block being displayed in a frame. */
function isHostBlockingEmbed(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return BLOCKED_EMBED_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export const embedArtifact = new Artifact({
  kind: "embed",
  description: "Embed an external page (e.g. Data 360) in the artifact panel.",
  onStreamPart: () => {},
  content: ({ content, isLoading }) => {
    const url = (content || DATA360_INDICATOR_URL).trim();
    const allowed = isAllowedEmbedUrl(url);

    if (isLoading) {
      return (
        <div className="flex h-full min-h-[320px] w-full items-center justify-center bg-muted/30">
          <div className="h-8 w-48 animate-pulse rounded-md bg-muted-foreground/20" />
        </div>
      );
    }

    if (!allowed) {
      return (
        <div className="flex h-full min-h-[320px] w-full flex-col items-center justify-center gap-2 px-4 text-center text-muted-foreground">
          <p>Only https URLs can be embedded.</p>
          <a
            className="text-primary underline underline-offset-2 hover:no-underline"
            href={url.startsWith("http") ? url : "#"}
            rel="noopener noreferrer"
            target="_blank"
          >
            Open in new tab
          </a>
        </div>
      );
    }

    if (isHostBlockingEmbed(url)) {
      return (
        <div className="flex h-full min-h-[320px] w-full flex-col items-center justify-center gap-3 px-4 text-center text-muted-foreground">
          <p>
            This site can&apos;t be shown here because it doesn&apos;t allow
            embedding (X-Frame-Options).
          </p>
          <a
            className="text-primary inline-flex items-center gap-2 rounded-md border border-current px-4 py-2 underline-offset-2 hover:bg-muted hover:no-underline"
            href={url}
            rel="noopener noreferrer"
            target="_blank"
          >
            Open in new tab
          </a>
        </div>
      );
    }

    return (
      <div className="flex h-full min-h-0 w-full flex-1 flex-col">
        <iframe
          className="h-full min-h-0 w-full flex-1 border-0"
          src={url}
          title="Embedded content"
        />
      </div>
    );
  },
  actions: [
    {
      icon: <ExternalLinkIcon size={18} />,
      description: "Open in new tab",
      onClick: ({ content }) => {
        const url = (content || DATA360_INDICATOR_URL).trim();
        if (isAllowedEmbedUrl(url)) {
          window.open(url, "_blank", "noopener,noreferrer");
        }
      },
    },
  ],
  toolbar: [],
});
