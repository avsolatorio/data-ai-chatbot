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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (authProvider === "msal") {
    return <MsalProviderWrapper>{children}</MsalProviderWrapper>;
  }
  return <>{children}</>;
}
