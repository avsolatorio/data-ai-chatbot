"use client";

/**
 * Data360 auth provider wrapper.
 * Uses only the searchToken cookie for authentication.
 * If no searchToken: redirects to NEXT_PUBLIC_DATA360_AUTH_URL with returnTo.
 * No MSAL, no UIT, no session storage.
 */

import { useEffect, useState } from "react";
import { getAuthTokenFromDocument } from "@/lib/auth/cookies";
import { getPublicReturnUrl } from "@/lib/config";
import { getEnv } from "@/lib/env";

export function Data360ProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const searchToken = getAuthTokenFromDocument();
    if (searchToken && searchToken.length > 0) {
      setReady(true);
      return;
    }

    const authUrl = getEnv().NEXT_PUBLIC_DATA360_AUTH_URL;
    if (!authUrl) {
      setReady(true);
      return;
    }

    const returnTo = encodeURIComponent(getPublicReturnUrl());
    const redirectUrl = `${authUrl}${authUrl.includes("?") ? "&" : "?"}returnTo=${returnTo}`;
    window.location.href = redirectUrl;
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
        <p>Redirecting to sign in...</p>
      </div>
    );
  }

  return <>{children}</>;
}
