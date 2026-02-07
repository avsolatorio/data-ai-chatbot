/**
 * Application configuration
 *
 * This file contains all configurable metadata and settings for the application.
 * Modify these values to customize your application's metadata.
 */

/** Application lifecycle status shown in the UI when set. */
export type ApplicationStatus = "pre-alpha" | "alpha" | "beta";

/** Feedback contact shown in the feedback pop-up. */
export type FeedbackContact = {
  label: string;
  url: string;
};

function getApplicationStatus(): ApplicationStatus | null {
  const v = process.env.NEXT_PUBLIC_APPLICATION_STATUS;
  if (v === "pre-alpha" || v === "alpha" || v === "beta") return v;
  // Show banner in development when not set so you can verify placement
  if (process.env.NODE_ENV === "development") return "alpha";
  return null;
}

function getFeedbackContact(): FeedbackContact | null {
  const url = process.env.NEXT_PUBLIC_FEEDBACK_CONTACT_URL;
  const label =
    process.env.NEXT_PUBLIC_FEEDBACK_CONTACT_LABEL || "Contact us for feedback";
  if (url && url.trim().length > 0) {
    return { label: label.trim(), url: url.trim() };
  }
  return null;
}

/**
 * When artifact panel closes with no trigger message (e.g. opened by stream):
 * - "bottom": scroll main chat to latest message.
 * - "trigger": do not scroll (leave position as-is).
 * When there is a trigger message we always scroll to it; this flag does not apply.
 */
export type ArtifactScrollBehavior = "bottom" | "trigger";

function getArtifactScrollBehavior(): ArtifactScrollBehavior {
  const v = process.env.NEXT_PUBLIC_ARTIFACT_SCROLL_BEHAVIOR;
  if (v === "trigger" || v === "bottom") return v;
  return "bottom";
}

function getShowReasoningPartType(): boolean {
  const v = process.env.NEXT_PUBLIC_SHOW_REASONING_PART_TYPE;
  if (v === "true" || v === "1") return true;
  if (v === "false" || v === "0") return false;
  return false;
}

export const appConfig = {
  /**
   * When set (e.g. "alpha", "beta"), a status badge is shown so users know the app is not stable.
   * Set via NEXT_PUBLIC_APPLICATION_STATUS.
   */
  applicationStatus: getApplicationStatus(),

  /**
   * When set, a "Give feedback" entry point and pop-up are shown.
   * Set via NEXT_PUBLIC_FEEDBACK_CONTACT_URL and optionally NEXT_PUBLIC_FEEDBACK_CONTACT_LABEL.
   */
  feedbackContact: getFeedbackContact(),

  metadata: {
    /**
     * The base URL for your application.
     * Used for generating absolute URLs in metadata.
     *
     * Examples:
     * - Production: "https://yourdomain.com"
     * - Development: "http://localhost:3000"
     * - Vercel: "https://your-app.vercel.app"
     */
    baseUrl:
      process.env.NEXT_PUBLIC_APP_URL || "https://data360chat.worldbank.org",

    /**
     * The title of your application.
     * This appears in:
     * - Browser tab title
     * - Search engine results
     * - Social media shares (if not overridden)
     */
    title: "Data360 Chat",

    /**
     * A brief description of your application.
     * This appears in:
     * - Search engine results
     * - Social media shares (if not overridden)
     * - Browser bookmarks
     */
    description:
      "Data360 Chat is a chatbot that uses the Data360 MCP tools to answer questions about the Data360 dataset.",
  },
  /**
   * Application display name shown in the UI.
   * This appears in:
   * - Sidebar header
   * - Navigation elements
   * - Other UI components that display the app name
   */
  sidebar: {
    appName: "Data360 Chat",
  },

  /**
   * When artifact closes with no trigger message: "bottom" scrolls chat to latest; "trigger" leaves scroll as-is.
   * Set via NEXT_PUBLIC_ARTIFACT_SCROLL_BEHAVIOR.
   */
  artifactScrollBehavior: getArtifactScrollBehavior(),

  /**
   * When true, show the part type (e.g. "text", "tool-xyz") beside each step in the Reasoning block.
   * Default false. Set via NEXT_PUBLIC_SHOW_REASONING_PART_TYPE=true.
   */
  showReasoningPartType: getShowReasoningPartType(),
};
