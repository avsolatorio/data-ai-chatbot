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
import type { User } from "@/lib/auth-service-client";
import { appConfig } from "@/lib/config";
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
  // MSAL: token lives in session storage; server has no cookie, so resolve user client-side.
  const [msalUser, setMsalUser] = useState<User | null>(null);
  const effectiveUser = user ?? msalUser ?? undefined;

  useEffect(() => {
    if (authProvider !== "msal" || user !== undefined) return;
    let cancelled = false;
    apiFetch("/api/auth/me", { credentials: "include" })
      .then((res) => {
        if (cancelled || !res.ok) return;
        return res.json() as Promise<User>;
      })
      .then((data) => {
        if (!cancelled && data) setMsalUser(data);
      })
      .catch(() => {
        // Ignore; user remains undefined
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
            <SidebarUserNav user={effectiveUser} />
          ) : (
            <SidebarUserNav
              isLoading={true}
              user={{
                id: "guest-temp",
                email: null,
                type: "guest",
              }}
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
