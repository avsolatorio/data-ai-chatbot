"use client";

import { isToday, subMonths } from "date-fns";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import useSWRInfinite from "swr/infinite";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  useSidebar,
} from "@/components/ui/sidebar";
import { apiFetch } from "@/lib/api-client";
import type { User } from "@/lib/auth-service-client";
import type { Chat } from "@/lib/db/schema";
import { fetcher } from "@/lib/utils";
import { LoaderIcon } from "./icons";
import { ChatItem } from "./sidebar-history-item";

type GroupedChats = {
  today: Chat[];
  last30Days: Chat[];
  older: Chat[];
};

export type ChatHistory = {
  chats: Chat[];
  hasMore: boolean;
};

const PAGE_SIZE = 20;

const SECTION_LABEL_CLASS = "text-xs font-normal text-[#ced4de]";
const EMPTY_MESSAGE_CLASS =
  "flex w-full flex-row items-center justify-center gap-2 px-2 text-sm text-[#ced4de]";
const HISTORY_SECTION_CLASS =
  "border-t border-[rgba(158,158,166,0.2)] pb-6 pt-3.5";

/** Last activity for ordering and sidebar sections (message activity, context updates). */
function chatActivityTimeMs(chat: Chat): number {
  const raw = chat.updatedAt ?? chat.createdAt;
  return new Date(raw).getTime();
}

const groupChatsByDate = (chats: Chat[]): GroupedChats => {
  const now = new Date();
  const oneMonthAgo = subMonths(now, 1);

  return chats.reduce(
    (groups, chat) => {
      const chatDate = new Date(chat.updatedAt ?? chat.createdAt);

      if (isToday(chatDate)) {
        groups.today.push(chat);
      } else if (chatDate >= oneMonthAgo) {
        groups.last30Days.push(chat);
      } else {
        groups.older.push(chat);
      }

      return groups;
    },
    {
      today: [],
      last30Days: [],
      older: [],
    } as GroupedChats,
  );
};

export function getChatHistoryPaginationKey(
  pageIndex: number,
  previousPageData: ChatHistory,
) {
  if (previousPageData && previousPageData.hasMore === false) {
    return null;
  }

  if (pageIndex === 0) {
    return `/api/history?limit=${PAGE_SIZE}`;
  }

  const firstChatFromPage = previousPageData.chats.at(-1);

  if (!firstChatFromPage) {
    return null;
  }

  return `/api/history?ending_before=${firstChatFromPage.id}&limit=${PAGE_SIZE}`;
}

type HistorySectionProps = {
  label: string;
  chats: Chat[];
  activeChatId: string | string[] | undefined;
  onDelete: (chatId: string) => void;
  setOpenMobile: (open: boolean) => void;
};

function HistorySection({
  label,
  chats,
  activeChatId,
  onDelete,
  setOpenMobile,
}: HistorySectionProps) {
  if (chats.length === 0) {
    return null;
  }

  return (
    <div className={HISTORY_SECTION_CLASS}>
      <div className={SECTION_LABEL_CLASS}>{label}</div>
      <div className="mt-2 flex flex-col gap-3.5">
        {chats.map((chat) => (
          <ChatItem
            chat={chat}
            isActive={chat.id === activeChatId}
            key={chat.id}
            onDelete={onDelete}
            setOpenMobile={setOpenMobile}
          />
        ))}
      </div>
    </div>
  );
}

export function SidebarHistory({ user }: { user: User | undefined }) {
  const { setOpenMobile } = useSidebar();
  const { id } = useParams();

  const {
    data: paginatedChatHistories,
    setSize,
    isValidating,
    isLoading,
    mutate,
  } = useSWRInfinite<ChatHistory>(getChatHistoryPaginationKey, fetcher, {
    fallbackData: [],
    // Avoid duplicate requests when React Strict Mode remounts the component.
    dedupingInterval: 5000,
  });

  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const hasReachedEnd = paginatedChatHistories
    ? paginatedChatHistories.some((page) => page.hasMore === false)
    : false;

  const hasEmptyChatHistory = paginatedChatHistories
    ? paginatedChatHistories.every((page) => page.chats.length === 0)
    : false;

  const handleDeleteRequest = (chatId: string) => {
    setDeleteId(chatId);
    setShowDeleteDialog(true);
  };

  const handleDelete = () => {
    const deletePromise = apiFetch(`/api/chat?id=${deleteId}`, {
      method: "DELETE",
    });

    toast.promise(deletePromise, {
      loading: "Deleting chat...",
      success: () => {
        mutate((chatHistories) => {
          if (chatHistories) {
            return chatHistories.map((chatHistory) => ({
              ...chatHistory,
              chats: chatHistory.chats.filter((chat) => chat.id !== deleteId),
            }));
          }
        });

        return "Chat deleted successfully";
      },
      error: "Failed to delete chat",
    });

    setShowDeleteDialog(false);

    if (deleteId === id) {
      router.push("/");
    }
  };

  if (!user) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className={EMPTY_MESSAGE_CLASS}>
            Login to save and revisit previous chats!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (isLoading) {
    return (
      <SidebarGroup>
        <div className={`${HISTORY_SECTION_CLASS} border-t-0 pt-0`}>
          <div className={SECTION_LABEL_CLASS}>Today</div>
          <SidebarGroupContent>
            <div className="mt-2 flex flex-col gap-3.5">
              {[44, 32, 28, 64, 52].map((item) => (
                <div
                  className="flex h-4 items-center gap-2 rounded-md"
                  key={item}
                >
                  <div
                    className="h-3 max-w-(--skeleton-width) flex-1 rounded-md bg-white/20"
                    style={
                      {
                        "--skeleton-width": `${item}%`,
                      } as React.CSSProperties
                    }
                  />
                </div>
              ))}
            </div>
          </SidebarGroupContent>
        </div>
      </SidebarGroup>
    );
  }

  if (hasEmptyChatHistory) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className={EMPTY_MESSAGE_CLASS}>
            Your conversations will appear here once you start chatting!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {paginatedChatHistories &&
              (() => {
                const chatsFromHistory = paginatedChatHistories.flatMap(
                  (paginatedChatHistory) => paginatedChatHistory.chats,
                );
                const sorted = [...chatsFromHistory].sort(
                  (a, b) => chatActivityTimeMs(b) - chatActivityTimeMs(a),
                );

                const groupedChats = groupChatsByDate(sorted);

                return (
                  <div className="flex flex-col">
                    <HistorySection
                      activeChatId={id}
                      chats={groupedChats.today}
                      label="Today"
                      onDelete={handleDeleteRequest}
                      setOpenMobile={setOpenMobile}
                    />
                    <HistorySection
                      activeChatId={id}
                      chats={groupedChats.last30Days}
                      label="Last 30 days"
                      onDelete={handleDeleteRequest}
                      setOpenMobile={setOpenMobile}
                    />
                    <HistorySection
                      activeChatId={id}
                      chats={groupedChats.older}
                      label="Older than last month"
                      onDelete={handleDeleteRequest}
                      setOpenMobile={setOpenMobile}
                    />
                  </div>
                );
              })()}
          </SidebarMenu>

          <motion.div
            onViewportEnter={() => {
              if (!isValidating && !hasReachedEnd) {
                setSize((size) => size + 1);
              }
            }}
          />

          {hasReachedEnd ? (
            <div className={`${EMPTY_MESSAGE_CLASS} mt-8`}>
              You have reached the end of your chat history.
            </div>
          ) : (
            <div className="mt-8 flex flex-row items-center gap-2 p-2 text-[#ced4de]">
              <div className="animate-spin">
                <LoaderIcon />
              </div>
              <div>Loading Chats...</div>
            </div>
          )}
        </SidebarGroupContent>
      </SidebarGroup>

      <AlertDialog onOpenChange={setShowDeleteDialog} open={showDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              chat and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
