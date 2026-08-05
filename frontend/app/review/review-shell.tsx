"use client";

/**
 * Auth-gated shell for /review/*.
 * Mirrors the visual style of app/(admin)/layout.tsx, but the access gate
 * is `canViewTokenUsage === true` (not `canViewAdmin`) so that users listed
 * in FEEDBACK_REVIEWER_EMAILS — but not ADMIN_EMAILS — can reach the page.
 *
 * Server layout (app/review/layout.tsx) keeps the `metadata` export and
 * the Pcn/HomeConfig providers, then wraps its children in this client shell.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageSquare } from "lucide-react";

interface UserInfo {
  id: string;
  email: string;
  type: string;
  canViewAdmin?: boolean;
  canViewTokenUsage?: boolean;
}

export function ReviewShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user?.canViewTokenUsage) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">403</h1>
          <p className="text-muted-foreground">
            You do not have access to feedback review.
          </p>
          <Link
            href="/"
            className="text-primary hover:underline mt-4 inline-block"
          >
            Back to Chat
          </Link>
        </div>
      </div>
    );
  }

  const isAlsoAdmin =
    user.canViewAdmin === true && user.canViewTokenUsage === true;

  const baseNavItems: { href: string; label: string; icon: typeof MessageSquare }[] = [
    { href: "/review/feedback", label: "Feedback", icon: MessageSquare },
  ];
  const adminNavItem = isAlsoAdmin
    ? [
        {
          href: "/admin/analytics",
          label: "Admin Dashboard",
          icon: LayoutDashboard,
        },
      ]
    : [];

  const navItems = [...baseNavItems, ...adminNavItem];

  return (
    <div className="flex h-dvh">
      {/* Sidebar */}
      <aside className="w-60 bg-zinc-900 text-zinc-300 flex flex-col shrink-0">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-100">Review</h2>
          <p className="text-xs text-zinc-500 mt-1 truncate">{user.email}</p>
        </div>
        <nav className="flex-1 p-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm mb-1 transition-colors ${
                  isActive
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t border-zinc-800">
          <Link
            href="/"
            className="block px-3 py-2 rounded-md text-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"
          >
            Back to Chat
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-zinc-950">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
