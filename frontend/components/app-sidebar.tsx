"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { PlusIcon, TrashIcon } from "@/components/icons";
import {
  getChatHistoryPaginationKey,
  SidebarHistory,
} from "@/components/sidebar-history";
import { SidebarUserNav } from "@/components/sidebar-user-nav";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from "@/components/ui/sidebar";
import { apiFetch } from "@/lib/api-client";
import { authProvider } from "@/lib/auth/config";
import {
  clearAuthSessionStorage,
  type User,
} from "@/lib/auth-service-client";
import { appConfig } from "@/lib/config";
import { sessionStorageKeys } from "@/lib/constants";
import { ApplicationStatusBanner } from "@/components/application-status-banner";
import { FeedbackDialog } from "@/components/feedback-dialog";
import { useAutoRefreshToken } from "@/hooks/use-auto-refresh-token";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function AppSidebar({ user }: { user: User | undefined }) {
  // Automatically refresh tokens before they expire
  useAutoRefreshToken();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const { mutate } = useSWRConfig();
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  // MSAL/data360: token in session storage (MSAL) or cookie (data360); server may not have it. Resolve user client-side.
  const [msalUser, setMsalUser] = useState<User | null>(null);
  // Only true while /api/auth/me is in flight; false once we get 200 or 401 so we don't spin forever.
  const [msalAuthChecking, setMsalAuthChecking] = useState(false);
  const effectiveUser = user ?? msalUser ?? undefined;

  useEffect(() => {
    // For MSAL/data360 we pass user=null/undefined from layout (no server cookie). Run fetch when we don't have a user yet.
    const needsClientFetch =
      (authProvider === "msal" || authProvider === "data360") && user == null;
    if (!needsClientFetch) {
      setMsalAuthChecking(false);
      return;
    }
    let cancelled = false;
    setMsalAuthChecking(true);
    apiFetch("/api/auth/me", { credentials: "include" })
      .then((res) => {
        if (cancelled) return;
        const newVersion = res.headers.get("X-Session-Version");
        if (typeof newVersion === "string" && newVersion.length > 0) {
          try {
            const stored = sessionStorage.getItem(sessionStorageKeys.sessionVersion);
            if (stored !== null && stored.length > 0 && stored !== newVersion) {
              clearAuthSessionStorage();
              sessionStorage.removeItem(sessionStorageKeys.sessionVersion);
              setMsalUser(null);
            }
            sessionStorage.setItem(sessionStorageKeys.sessionVersion, newVersion);
          } catch {
            // Ignore quota or security errors
          }
        }
        if (!res.ok) {
          setMsalAuthChecking(false);
          return;
        }
        return res.json() as Promise<User>;
      })
      .then((data) => {
        if (!cancelled && data) setMsalUser(data);
        if (!cancelled) setMsalAuthChecking(false);
      })
      .catch(() => {
        if (!cancelled) setMsalAuthChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);


  const handleDeleteAll = () => {
    const deletePromise = apiFetch("/api/history", {
      method: "DELETE",
    });

    toast.promise(deletePromise, {
      loading: "Deleting all chats...",
      success: () => {
        mutate(unstable_serialize(getChatHistoryPaginationKey));
        router.push("/");
        setShowDeleteAllDialog(false);
        return "All chats deleted successfully";
      },
      error: "Failed to delete all chats",
    });
  };

  return (
    <>
      <Sidebar className="group-data-[side=left]:border-r-0">
        <SidebarHeader>
          <SidebarMenu>
            <div className="flex flex-row items-center justify-between">
              <Link
                className="flex flex-row items-center gap-3"
                href="/"
                onClick={() => {
                  setOpenMobile(false);
                }}
              >
                <span className="cursor-pointer rounded-md px-2 font-semibold text-lg hover:bg-muted">
                  {appConfig.sidebar.appName}
                </span>
              </Link>
              <div className="flex flex-row gap-1">
                {effectiveUser && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        className="h-8 p-1 md:h-fit md:p-2"
                        onClick={() => setShowDeleteAllDialog(true)}
                        type="button"
                        variant="ghost"
                      >
                        <TrashIcon />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent align="end" className="hidden md:block">
                      Delete All Chats
                    </TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className="h-8 p-1 md:h-fit md:p-2"
                      onClick={() => {
                        setOpenMobile(false);
                        router.push("/");
                        router.refresh();
                      }}
                      type="button"
                      variant="ghost"
                    >
                      <PlusIcon />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent align="end" className="hidden md:block">
                    New Chat
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </SidebarMenu>
        </SidebarHeader>
        <ApplicationStatusBanner
          onOpenFeedback={() => setFeedbackOpen(true)}
          variant="sidebar"
        />
        <SidebarContent>
          <SidebarHistory user={effectiveUser} />
        </SidebarContent>
        <SidebarFooter>
          <FeedbackDialog
            onOpenChange={setFeedbackOpen}
            open={feedbackOpen}
          />
          {effectiveUser ? (
            <SidebarUserNav user={effectiveUser} authProvider={authProvider} />
          ) : (
            <SidebarUserNav
              isLoading={msalAuthChecking}
              user={{
                id: "guest-temp",
                email: null,
                type:
                  authProvider === "msal" || authProvider === "data360"
                    ? "regular"
                    : "guest",
              }}
              placeholderLabel={
                authProvider === "msal" || authProvider === "data360"
                  ? "Sign in"
                  : undefined
              }
              authProvider={authProvider}
            />
          )}
        </SidebarFooter>
      </Sidebar>

      <AlertDialog
        onOpenChange={setShowDeleteAllDialog}
        open={showDeleteAllDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all chats?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all
              your chats and remove them from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll}>
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
