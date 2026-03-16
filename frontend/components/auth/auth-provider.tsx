"use client";

import dynamic from "next/dynamic";
import { authProvider } from "@/lib/auth/config";

const MsalProviderWrapper = dynamic(
  () =>
    import("@/components/auth/msal/msal-provider-wrapper").then((mod) => ({
      default: mod.MsalProviderWrapper,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
        <p>Loading...</p>
      </div>
    ),
  },
);

const Data360ProviderWrapper = dynamic(
  () =>
    import("@/components/auth/data360/data360-provider-wrapper").then((mod) => ({
      default: mod.Data360ProviderWrapper,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
        <p>Loading...</p>
      </div>
    ),
  },
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (authProvider === "msal") {
    return <MsalProviderWrapper>{children}</MsalProviderWrapper>;
  }
  if (authProvider === "data360") {
    return <Data360ProviderWrapper>{children}</Data360ProviderWrapper>;
  }
  return <>{children}</>;
}
