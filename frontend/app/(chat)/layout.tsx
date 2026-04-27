import { cookies } from "next/headers";
import Script from "next/script";
import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { DataStreamProvider } from "@/components/data-stream-provider";
import { PcnProviderClient } from "@/components/data360/pcn-provider-client";
import { HomeConfigProvider } from "@/components/home-config-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { authProvider } from "@/lib/auth/config";
import { getCurrentUser } from "@/lib/auth-service";
import type { User } from "@/lib/auth-service-client";
import { TokenUsageVisibilityProvider } from "@/contexts/token-usage-visibility";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <DataStreamProvider>
        <PcnProviderClient>
          <Suspense fallback={<div className="flex h-dvh" />}>
            <HomeConfigProvider>
              <SidebarWrapper>{children}</SidebarWrapper>
            </HomeConfigProvider>
          </Suspense>
        </PcnProviderClient>
      </DataStreamProvider>
    </>
  );
}

async function SidebarWrapper({ children }: { children: React.ReactNode }) {
  // MSAL/data360: token is in session storage (MSAL) or cookie (data360); server may not have it. Skip server fetch and let the client sidebar fetch via /api/auth/me.
  const user =
    authProvider === "msal" || authProvider === "data360"
      ? null
      : await getCurrentUser();

  // Get sidebar state from cookies (handle prerendering gracefully)
  let isCollapsed = true; // Default to collapsed
  try {
    const cookieStore = await cookies();
    isCollapsed = cookieStore.get("sidebar_state")?.value !== "true";
  } catch {
    // During prerendering, cookies() may fail - use default value
    // This is expected and handled gracefully
  }

  // If no user, we'll let the proxy middleware handle guest creation
  // The proxy will redirect to /api/auth/guest which sets cookies properly
  // For now, we'll just pass the user (or undefined) to the sidebar
  // The sidebar will show "Login to your account" for guest users
  const currentUser: User | null = user;

  // Derive canViewTokenUsage from the server-resolved user.
  // For MSAL/data360 providers where user is null at server time, we default to false
  // (token usage stays hidden until the user is fully resolved via /api/auth/me on the client).
  const canViewTokenUsage = currentUser?.canViewTokenUsage ?? false;

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <TokenUsageVisibilityProvider canViewTokenUsage={canViewTokenUsage}>
        <AppSidebar user={currentUser ?? undefined} />
        <SidebarInset>{children}</SidebarInset>
      </TokenUsageVisibilityProvider>
    </SidebarProvider>
  );
}
