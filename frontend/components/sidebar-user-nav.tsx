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
import { authProvider } from "@/lib/auth/config";
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

export function SidebarUserNav({
  user,
  isLoading,
}: {
  user: User;
  isLoading?: boolean;
}) {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const { mutate } = useSWRConfig();
  const msalInstance = useContext(MsalInstanceContext);

  const isGuest = user.type === "guest";

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
                    title={isGuest ? "Guest User" : (user.email ?? "User")}
                  >
                    {isGuest
                      ? "G"
                      : (user.email ?? "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate" data-testid="user-email">
                  {isGuest ? "Guest" : user?.email || "User"}
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
                    router.push("/login");
                  } else if (authProvider === "msal" && msalInstance) {
                    try {
                      await logoutClient();
                      mutate(unstable_serialize(getChatHistoryPaginationKey));
                      // MSAL logout clears its cache and redirects to Azure logout, then to postLogoutRedirectUri.
                      // That ensures the next app load shows the Microsoft sign-in page instead of cached state.
                      const postLogoutRedirectUri =
                        typeof window !== "undefined"
                          ? `${window.location.origin}/login`
                          : "/login";
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

                      if (isLoggedOut) {
                        window.location.replace("/login");
                      } else {
                        console.warn("Logout verification failed, but proceeding with navigation");
                        window.location.replace("/login");
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
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
