"use client";

import { ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useContext } from "react";
import { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { MsalInstanceContext } from "@/components/auth/msal/msal-provider-wrapper";
import type { User } from "@/lib/auth-service-client";
import { logoutClient } from "@/lib/auth-service-client";
import { getApiUrl } from "@/lib/api-client";
import { getBasePath } from "@/lib/config";
import { authProvider, skipLoginPage } from "@/lib/auth/config";
import { sessionStorageKeys } from "@/lib/constants";
import { loginRequest } from "@/lib/auth/msal/msal-config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getChatHistoryPaginationKey } from "./sidebar-history";
import { LoaderIcon } from "./icons";
import { toast } from "./toast";

export type SidebarUserNavProps = {
  user: User;
  isLoading?: boolean;
  /** When set, show this label instead of Guest/email (e.g. "Sign in" for MSAL when not logged in). */
  placeholderLabel?: string;
  /** When "guest", do not show "Login to your account" for guest users (login page is Try as guest only). */
  authProvider?: "guest" | "msal" | "user";
};

export function SidebarUserNav({
  user,
  isLoading,
  placeholderLabel,
  authProvider: authProviderProp,
}: SidebarUserNavProps) {
  const showLoginOption = authProviderProp !== "guest" || !(user.type === "guest");
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const { mutate } = useSWRConfig();
  const msalInstance = useContext(MsalInstanceContext);

  const isGuest = user.type === "guest";
  const displayLabel = placeholderLabel ?? (isGuest ? "Guest" : user?.email || "User");
  const avatarLetter = placeholderLabel ? placeholderLabel.charAt(0).toUpperCase() : (isGuest ? "G" : (user.email ?? "U").charAt(0).toUpperCase());

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {isLoading ? (
              <SidebarMenuButton className="h-10 justify-between bg-background data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                <div className="flex flex-row gap-2">
                  <div className="size-6 animate-pulse rounded-full bg-zinc-500/30" />
                  <span className="animate-pulse rounded-md bg-zinc-500/30 text-transparent">
                    Loading auth status
                  </span>
                </div>
                <div className="animate-spin text-zinc-500">
                  <LoaderIcon />
                </div>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                className="h-10 bg-background data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                data-testid="user-nav-button"
              >
                <Avatar className="size-6">
                  <AvatarFallback
                    className="text-xs"
                    title={placeholderLabel ?? (isGuest ? "Guest User" : (user.email ?? "User"))}
                  >
                    {avatarLetter}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate" data-testid="user-email">
                  {displayLabel}
                </span>
                <ChevronUp className="ml-auto" />
              </SidebarMenuButton>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-popper-anchor-width)"
            data-testid="user-nav-menu"
            side="top"
          >
            <DropdownMenuItem
              className="cursor-pointer"
              data-testid="user-nav-item-theme"
              onSelect={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              {`Toggle ${resolvedTheme === "light" ? "dark" : "light"} mode`}
            </DropdownMenuItem>
            {isGuest && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  data-testid="user-nav-item-reset-guest"
                  onSelect={async () => {
                    if (isLoading) return;
                    try {
                      const resetUrl = getApiUrl("/api/auth/guest/reset");
                      const res = await fetch(resetUrl, {
                        method: "POST",
                        credentials: "include",
                      });
                      if (!res.ok) throw new Error("Reset failed");
                      mutate(unstable_serialize(getChatHistoryPaginationKey));
                      window.location.href = getApiUrl("/api/auth/guest");
                    } catch {
                      toast({
                        type: "error",
                        description: "Failed to start over. Please try again.",
                      });
                    }
                  }}
                >
                  Start over (new guest session)
                </DropdownMenuItem>
              </>
            )}
            {showLoginOption && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild data-testid="user-nav-item-auth">
              <button
                className="w-full cursor-pointer"
                onClick={async () => {
                  if (isLoading) {
                    toast({
                      type: "error",
                      description:
                        "Checking authentication status, please try again!",
                    });

                    return;
                  }

                  if (isGuest) {
                    if (
                      skipLoginPage &&
                      authProvider === "msal" &&
                      msalInstance
                    ) {
                      try {
                        await msalInstance.loginRedirect(loginRequest);
                      } catch {
                        toast({
                          type: "error",
                          description:
                            "Failed to start sign in. Please try again.",
                        });
                      }
                    } else {
                      router.push("/login");
                    }
                  } else if (authProvider === "msal" && msalInstance) {
                    try {
                      await logoutClient();
                      mutate(unstable_serialize(getChatHistoryPaginationKey));
                      // MSAL logout clears its cache and redirects to Azure logout, then to postLogoutRedirectUri.
                      // That ensures the next app load shows the Microsoft sign-in page instead of cached state.
                      const basePath = getBasePath();
                      const postLogoutRedirectUri =
                        typeof window !== "undefined"
                          ? `${window.location.origin}${basePath}/login`
                          : `${basePath}/login`;
                      await msalInstance.logoutRedirect({
                        postLogoutRedirectUri,
                      });
                    } catch {
                      toast({
                        type: "error",
                        description: "Failed to sign out. Please try again.",
                      });
                    }
                  } else {
                    try {
                      await logoutClient();
                      mutate(unstable_serialize(getChatHistoryPaginationKey));

                      // searchToken integration: clear cookie via API and redirect to login
                      if (authProvider === "msal" && !msalInstance) {
                        sessionStorage.removeItem(
                          sessionStorageKeys.msalUserImpersonationToken,
                        );
                        const loginPath = `${getBasePath()}/login`;
                        window.location.href = getApiUrl(
                          `/api/auth/clear-search-token?redirect=${encodeURIComponent(loginPath)}`,
                        );
                        return;
                      }

                      let isLoggedOut = false;
                      for (let i = 0; i < 5; i++) {
                        await new Promise((resolve) => {
                          setTimeout(resolve, 50);
                        });

                        const verifyUrl = getApiUrl("/api/auth/me");
                        const verifyResponse = await fetch(verifyUrl, {
                          credentials: "include",
                          cache: "no-store",
                        });

                        if (verifyResponse.status === 401) {
                          isLoggedOut = true;
                          break;
                        }
                      }

                      const loginPath = `${getBasePath()}/login`;
                      if (isLoggedOut) {
                        window.location.replace(loginPath);
                      } else {
                        console.warn("Logout verification failed, but proceeding with navigation");
                        window.location.replace(loginPath);
                      }
                    } catch {
                      toast({
                        type: "error",
                        description: "Failed to sign out. Please try again.",
                      });
                    }
                  }
                }}
                type="button"
              >
                {isGuest ? "Login to your account" : "Sign out"}
              </button>
            </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
