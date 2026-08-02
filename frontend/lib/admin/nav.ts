/**
 * Build the admin sidebar nav items, conditionally including the
 * "Review feedback" link for users with `canViewTokenUsage === true`.
 * Kept side-effect free so it can be unit tested without rendering React.
 */

export type AdminNavItem = {
  href: string;
  label: string;
  icon: "bar-chart" | "shield" | "activity" | "message-square";
};

const BASE_ITEMS: AdminNavItem[] = [
  { href: "/admin/analytics", label: "Analytics", icon: "bar-chart" },
  { href: "/admin/moderation", label: "Moderation", icon: "shield" },
  { href: "/admin/health", label: "Health", icon: "activity" },
];

export const REVIEW_FEEDBACK_ITEM: AdminNavItem = {
  href: "/review/feedback",
  label: "Review feedback",
  icon: "message-square",
};

export function buildAdminNavItems(opts: {
  canViewTokenUsage?: boolean;
}): AdminNavItem[] {
  const items: AdminNavItem[] = [...BASE_ITEMS];
  if (opts.canViewTokenUsage === true) {
    items.push(REVIEW_FEEDBACK_ITEM);
  }
  return items;
}
