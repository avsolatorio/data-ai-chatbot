"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  MessageSquare,
  Shield,
} from "lucide-react";
import { buildAdminNavItems } from "@/lib/admin/nav";

interface UserInfo {
  id: string;
  email: string;
  type: string;
  canViewAdmin?: boolean;
  canViewTokenUsage?: boolean;
}

const ICONS = {
  "bar-chart": BarChart3,
  shield: Shield,
  activity: Activity,
  "message-square": MessageSquare,
} as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  if (!user?.canViewAdmin) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">403</h1>
          <p className="text-muted-foreground">
            You do not have admin access.
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

  const navItems = buildAdminNavItems({
    canViewTokenUsage: user?.canViewTokenUsage,
  });

  return (
    <div className="flex h-dvh">
      {/* Sidebar */}
      <aside className="w-60 bg-zinc-900 text-zinc-300 flex flex-col shrink-0">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-100">
            Admin Dashboard
          </h2>
          <p className="text-xs text-zinc-500 mt-1 truncate">{user.email}</p>
        </div>
        <nav className="flex-1 p-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = ICONS[item.icon];
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
                {Icon && <Icon className="size-4 shrink-0" />}
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
