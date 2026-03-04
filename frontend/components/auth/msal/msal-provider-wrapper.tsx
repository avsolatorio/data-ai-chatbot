"use client";

/**
 * MSAL provider wrapper for Next.js (client-side only).
 *
 * Implements the official pattern:
 * 1. Create PublicClientApplication and await initialize().
 * 2. Await handleRedirectPromise() before any other interactive API or render.
 *    (If user is returning from redirect, this processes the response and we set the account.)
 * 3. Only then render the app inside MsalProvider.
 * 4. Use MsalAuthenticationTemplate for unauthenticated users so the library
 *    triggers loginRedirect when inProgress is None (avoids interaction_in_progress).
 *
 * After storing the token in session storage (e.g. on return from redirect), we trigger
 * router.refresh(); the sidebar resolves the user client-side via /api/auth/me when using MSAL.
 *
 * @see https://learn.microsoft.com/en-us/entra/msal/javascript/browser/initialization
 * @see https://learn.microsoft.com/en-us/entra/msal/javascript/browser/errors
 */

import {
  type IPublicClientApplication,
  InteractionType,
  PublicClientApplication,
} from "@azure/msal-browser";
import {
  AuthenticatedTemplate,
  MsalAuthenticationTemplate,
  MsalProvider,
  UnauthenticatedTemplate,
} from "@azure/msal-react";
import { createContext } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { sessionStorageKeys } from "@/lib/constants";
import {
  devLog,
  fetchUserImpersonationToken,
  loginRequest,
  msalConfig,
} from "@/lib/auth/msal/msal-config";

/** Context so components like SidebarUserNav can call MSAL logoutRedirect on sign out. */
export const MsalInstanceContext = createContext<IPublicClientApplication | null>(
  null,
);

/** Routes where unauthenticated users see the page (e.g. "Login with MSAL" button) instead of auto-redirect. */
const UNAUTHENTICATED_ALLOWED_PATHS = ["/login", "/register"];

export function MsalProviderWrapper({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const initStartedRef = useRef(false);
  const router = useRouter();
  const pathname = usePathname();

  const msalInstance: IPublicClientApplication = useMemo(
    () => new PublicClientApplication(msalConfig),
    [],
  );

  useEffect(() => {
    if (initStartedRef.current) return;
    initStartedRef.current = true;

    /**
     * Returns true if we just processed a redirect and stored the token in session storage.
     * We refresh so the client sidebar can resolve the user via /api/auth/me.
     */
    async function runInit(): Promise<boolean> {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.removeItem(sessionStorageKeys.userData);
      }
      await msalInstance.initialize();
      devLog("info", "[MSAL] initialize() completed");

      let redirectResult: Awaited<ReturnType<typeof msalInstance.handleRedirectPromise>> = null;
      try {
        redirectResult = await msalInstance.handleRedirectPromise();
        devLog("info", "[MSAL] handleRedirectPromise result:", redirectResult?.account ? { name: redirectResult.account.name, username: redirectResult.account.username, homeAccountId: redirectResult.account.homeAccountId } : "no account (not from redirect)");
      } catch (e) {
        redirectResult = null;
        devLog("info", "[MSAL] handleRedirectPromise threw:", e instanceof Error ? e.message : String(e));
      }

      let hadRedirectAndSetCookie = false;

      if (redirectResult?.account) {
        msalInstance.setActiveAccount(redirectResult.account);
        devLog("info", "[MSAL] set active account from redirect:", redirectResult.account.username);
        try {
          await fetchUserImpersonationToken(msalInstance, redirectResult.account);
          devLog("info", "[MSAL] fetchUserImpersonationToken (redirect path) succeeded");
          hadRedirectAndSetCookie = true;
        } catch (e) {
          devLog("warn", "[MSAL] fetchUserImpersonationToken (redirect path) failed:", e instanceof Error ? e.message : String(e));
          // Token fetch failure: still set initialized so user is shown and can retry
        }
      } else {
        const cached = msalInstance.getActiveAccount();
        devLog("info", "[MSAL] no redirect account; cached active account:", cached ? { username: cached.username, name: cached.name } : null);
        if (cached) {
          try {
            await fetchUserImpersonationToken(msalInstance, cached);
            devLog("info", "[MSAL] fetchUserImpersonationToken (cached path) succeeded");
          } catch (e) {
            devLog("warn", "[MSAL] fetchUserImpersonationToken (cached path) failed:", e instanceof Error ? e.message : String(e));
            // Token fetch failure: still set initialized
          }
        }
      }

      const active = msalInstance.getActiveAccount();
      devLog("info", "[MSAL] init done; activeAccount:", active ? { username: active.username, name: active.name, environment: active.environment } : null);
      setInitialized(true);
      return hadRedirectAndSetCookie;
    }

    runInit().then((shouldRefresh) => {
      if (shouldRefresh) {
        router.refresh();
        // If user returned from MSAL redirect while on /login or /register, send them to home
        if (
          typeof window !== "undefined" &&
          UNAUTHENTICATED_ALLOWED_PATHS.includes(window.location.pathname)
        ) {
          router.replace("/");
        }
      }
    });
  }, [msalInstance, router]);

  if (!initialized) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
        <p>Loading authentication...</p>
      </div>
    );
  }

  const showAuthPageWithoutRedirect =
    UNAUTHENTICATED_ALLOWED_PATHS.includes(pathname ?? "");

  return (
    <MsalInstanceContext.Provider value={msalInstance}>
      <MsalProvider instance={msalInstance}>
        <AuthenticatedTemplate>{children}</AuthenticatedTemplate>
        <UnauthenticatedTemplate>
          {showAuthPageWithoutRedirect ? (
            children
          ) : (
            <MsalAuthenticationTemplate
              interactionType={InteractionType.Redirect}
              authenticationRequest={loginRequest}
              loadingComponent={function MsalRedirectLoading() {
                return (
                  <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
                    <p>Redirecting to sign in...</p>
                  </div>
                );
              }}
            />
          )}
        </UnauthenticatedTemplate>
      </MsalProvider>
    </MsalInstanceContext.Provider>
  );
}
