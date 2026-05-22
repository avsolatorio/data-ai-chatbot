"use client";

/**
 * Feedback review page. Only users listed in FEEDBACK_REVIEWER_EMAILS can access.
 * Route: /review/feedback
 */

import {
  AlertCircle,
  ArrowLeft,
  Lock,
  MessageCircle,
  MessageSquare,
  Star,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { PreviewMessage } from "@/components/message";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiFetch, getApiUrl } from "@/lib/api-client";
import type { Vote } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";

type FeedbackItem = {
  id: string;
  rating: number;
  feedback: string | null;
  user_id: string | null;
  user_name: string | null;
  created_at: string;
};

type ReviewResponse = {
  items: FeedbackItem[];
  total: number;
  limit: number;
  offset: number;
};

type VoteReviewItem = {
  chat_id: string;
  message_id: string;
  chat_title: string;
  message_preview: string;
  user_name: string | null;
  is_upvoted: boolean | null;
  feedback: string | null;
  updated_at: string;
  feedback_updated_at: string | null;
};

type VoteReviewResponse = {
  items: VoteReviewItem[];
  total: number;
  limit: number;
  offset: number;
};

type TabKind = "app" | "response";

type ChatPreviewMessage = {
  id: string;
  chatId: string;
  role: string;
  parts: Array<{ type?: string; text?: string }>;
  attachments: unknown[];
  createdAt: string;
};

type ChatPreviewResponse = {
  title: string;
  messages: ChatPreviewMessage[];
};

const PAGE_SIZE = 25;

function Stars({ rating }: { rating: number }) {
  return (
    <span
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-muted-foreground/40"
          }`}
          aria-hidden
        />
      ))}
    </span>
  );
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function FeedbackReviewPage() {
  const [tab, setTab] = useState<TabKind>("app");
  const [data, setData] = useState<ReviewResponse | null>(null);
  const [status, setStatus] = useState<
    "loading" | "ok" | "forbidden" | "unauthorized" | "error"
  >("loading");
  const [offset, setOffset] = useState(0);
  const [ratingFilter, setRatingFilter] = useState<number | "all">("all");
  const ratingFilterId = useId();
  const tabAppId = useId();
  const tabResponseId = useId();
  const panelAppId = useId();
  const panelResponseId = useId();

  const [voteData, setVoteData] = useState<VoteReviewResponse | null>(null);
  const [voteLoading, setVoteLoading] = useState(false);
  const [voteOffset, setVoteOffset] = useState(0);
  const [voteHasFeedback, setVoteHasFeedback] = useState<
    "all" | "comments_only" | "votes_only"
  >("all");
  const voteFilterId = useId();

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null,
  );
  const [selectedFeedback, setSelectedFeedback] =
    useState<VoteReviewItem | null>(null);
  const [previewData, setPreviewData] = useState<ChatPreviewResponse | null>(
    null,
  );
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewScrollRef = useRef<HTMLDivElement>(null);

  const PREVIEW_PANEL_MIN = 280;
  const PREVIEW_PANEL_MAX = 640;
  const PREVIEW_PANEL_DEFAULT = 448; // 28rem
  const [previewPanelWidth, setPreviewPanelWidth] = useState(
    PREVIEW_PANEL_DEFAULT,
  );
  const [isResizingPreview, setIsResizingPreview] = useState(false);
  const resizeStartXRef = useRef(0);
  const resizeStartWidthRef = useRef(PREVIEW_PANEL_DEFAULT);

  const handlePreviewResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizingPreview(true);
      resizeStartXRef.current = e.clientX;
      resizeStartWidthRef.current = previewPanelWidth;
    },
    [previewPanelWidth],
  );

  useEffect(() => {
    if (!isResizingPreview) return;
    const onMove = (e: MouseEvent) => {
      const delta = resizeStartXRef.current - e.clientX; // drag left = panel wider
      const next = Math.min(
        PREVIEW_PANEL_MAX,
        Math.max(PREVIEW_PANEL_MIN, resizeStartWidthRef.current + delta),
      );
      setPreviewPanelWidth(next);
    };
    const onUp = () => setIsResizingPreview(false);
    const prevCursor = document.body.style.cursor;
    const prevUserSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = prevCursor;
      document.body.style.userSelect = prevUserSelect;
    };
  }, [isResizingPreview]);

  const fetchReview = useCallback(async () => {
    setStatus("loading");
    const params = new URLSearchParams();
    params.set("limit", String(PAGE_SIZE));
    params.set("offset", String(offset));
    if (ratingFilter !== "all") {
      params.set("rating_min", String(ratingFilter));
      params.set("rating_max", String(ratingFilter));
    }
    const url = getApiUrl(`/api/feedback/review?${params.toString()}`);
    const res = await apiFetch(url);
    if (res.status === 401) {
      setStatus("unauthorized");
      return;
    }
    if (res.status === 403) {
      setStatus("forbidden");
      return;
    }
    if (!res.ok) {
      setStatus("error");
      return;
    }
    const json = (await res.json()) as ReviewResponse;
    setData(json);
    setStatus("ok");
  }, [offset, ratingFilter]);

  const fetchVotes = useCallback(async () => {
    setVoteLoading(true);
    const params = new URLSearchParams();
    params.set("limit", String(PAGE_SIZE));
    params.set("offset", String(voteOffset));
    if (voteHasFeedback === "comments_only") params.set("has_feedback", "true");
    if (voteHasFeedback === "votes_only") params.set("has_feedback", "false");
    const url = getApiUrl(`/api/feedback/review/votes?${params.toString()}`);
    const res = await apiFetch(url);
    setVoteLoading(false);
    if (!res.ok) return;
    const json = (await res.json()) as VoteReviewResponse;
    setVoteData(json);
  }, [voteOffset, voteHasFeedback]);

  useEffect(() => {
    fetchReview();
  }, [fetchReview]);

  useEffect(() => {
    if (status === "ok" && tab === "response") {
      fetchVotes();
    }
  }, [status, tab, fetchVotes]);

  const fetchPreview = useCallback(async (chatId: string) => {
    setPreviewLoading(true);
    setPreviewData(null);
    const url = getApiUrl(
      `/api/feedback/review/preview?chat_id=${encodeURIComponent(chatId)}`,
    );
    const res = await apiFetch(url);
    setPreviewLoading(false);
    if (!res.ok) return;
    const json = (await res.json()) as ChatPreviewResponse;
    setPreviewData(json);
  }, []);

  useEffect(() => {
    if (selectedChatId) {
      fetchPreview(selectedChatId);
    } else {
      setPreviewData(null);
    }
  }, [selectedChatId, fetchPreview]);

  useEffect(() => {
    if (
      !previewData?.messages.length ||
      !selectedMessageId ||
      !previewScrollRef.current
    )
      return;
    const el = document.getElementById(`preview-msg-${selectedMessageId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [previewData, selectedMessageId]);

  const openPreview = useCallback(
    (chatId: string, messageId: string, feedbackItem?: VoteReviewItem) => {
      setSelectedChatId(chatId);
      setSelectedMessageId(messageId);
      setSelectedFeedback(feedbackItem ?? null);
    },
    [],
  );

  const closePreview = useCallback(() => {
    setSelectedChatId(null);
    setSelectedMessageId(null);
    setSelectedFeedback(null);
    setPreviewData(null);
  }, []);

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;
  const currentPage = data ? Math.floor(offset / data.limit) + 1 : 0;

  const showPreviewPanel =
    status === "ok" && tab === "response" && selectedChatId !== null;

  return (
    <main className="min-h-dvh bg-background">
      <div
        className={`w-full gap-0 px-4 py-8 ${showPreviewPanel ? "lg:grid" : ""}`}
        style={
          showPreviewPanel
            ? { gridTemplateColumns: `minmax(0,1fr) ${previewPanelWidth}px` }
            : undefined
        }
      >
        <div
          className={
            status === "ok"
              ? `mx-auto flex min-h-0 max-h-[calc(100dvh-var(--header-height,0)-2rem)] max-w-4xl flex-col overflow-hidden ${showPreviewPanel ? "min-w-0 lg:col-start-1 lg:row-start-1" : ""}`
              : "mx-auto max-w-4xl"
          }
        >
          <div className="mb-6 flex shrink-0 items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              asChild
              aria-label="Back to chat"
            >
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="font-semibold text-2xl tracking-tight text-foreground">
                Feedback review
              </h1>
              <p className="text-muted-foreground text-sm">
                User ratings and comments. Only authorized reviewers can view
                this page.
              </p>
            </div>
          </div>

          <div
            className={
              status === "ok"
                ? "min-h-0 flex-1 overflow-y-auto pb-4"
                : undefined
            }
          >
            {status === "loading" && (
              <Card>
                <CardContent className="flex items-center justify-center py-16">
                  <p className="text-muted-foreground text-sm">
                    Loading feedback…
                  </p>
                </CardContent>
              </Card>
            )}

            {status === "unauthorized" && (
              <Card className="border-amber-200 dark:border-amber-900/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-semibold text-lg">
                    <AlertCircle
                      className="h-5 w-5 text-amber-600"
                      aria-hidden
                    />
                    Sign in required
                  </CardTitle>
                  <CardDescription>
                    You need to be signed in to view feedback. Please log in and
                    try again.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild>
                    <Link href="/login">Go to login</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {status === "forbidden" && (
              <Card className="border-muted">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-semibold text-lg">
                    <Lock
                      className="h-5 w-5 text-muted-foreground"
                      aria-hidden
                    />
                    Access denied
                  </CardTitle>
                  <CardDescription>
                    You don’t have permission to view feedback. Access is
                    limited to designated reviewers.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" asChild>
                    <Link href="/">Back to chat</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {status === "error" && (
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="font-semibold text-lg text-destructive">
                    Something went wrong
                  </CardTitle>
                  <CardDescription>
                    We couldn’t load feedback. Please try again later.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" onClick={() => fetchReview()}>
                    Retry
                  </Button>
                </CardContent>
              </Card>
            )}

            {status === "ok" && data && (
              <>
                <div
                  className="mb-4 flex flex-wrap items-center gap-2 border-b border-border pb-3"
                  role="tablist"
                  aria-label="Feedback type"
                >
                  <Button
                    type="button"
                    variant={tab === "app" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTab("app")}
                    role="tab"
                    aria-selected={tab === "app"}
                    aria-controls={panelAppId}
                    id={tabAppId}
                  >
                    <Star className="mr-1.5 h-4 w-4" aria-hidden />
                    App feedback
                  </Button>
                  <Button
                    type="button"
                    variant={tab === "response" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTab("response")}
                    role="tab"
                    aria-selected={tab === "response"}
                    aria-controls={panelResponseId}
                    id={tabResponseId}
                  >
                    <MessageCircle className="mr-1.5 h-4 w-4" aria-hidden />
                    Response feedback
                  </Button>
                </div>

                {tab === "app" && (
                  <div
                    id={panelAppId}
                    role="tabpanel"
                    aria-labelledby={tabAppId}
                    className="space-y-4"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <label
                        htmlFor={ratingFilterId}
                        className="text-muted-foreground text-sm"
                      >
                        Filter by rating:
                      </label>
                      <select
                        id={ratingFilterId}
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        value={ratingFilter}
                        onChange={(e) => {
                          const v = e.target.value;
                          setRatingFilter(
                            v === "all" ? "all" : Number.parseInt(v, 10),
                          );
                          setOffset(0);
                        }}
                        aria-label="Filter by star rating"
                      >
                        <option value="all">All ratings</option>
                        {[5, 4, 3, 2, 1].map((r) => (
                          <option key={r} value={r}>
                            {r} star{r !== 1 ? "s" : ""}
                          </option>
                        ))}
                      </select>
                      <span className="text-muted-foreground text-sm">
                        {data.total} total · page {currentPage} of{" "}
                        {totalPages || 1}
                      </span>
                    </div>

                    <ul className="space-y-4">
                      {data.items.length === 0 ? (
                        <Card>
                          <CardContent className="py-12 text-center">
                            <MessageSquare
                              className="mx-auto mb-2 h-10 w-10 text-muted-foreground/60"
                              aria-hidden
                            />
                            <p className="text-muted-foreground text-sm">
                              No feedback yet.
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        data.items.map((item) => (
                          <li key={item.id}>
                            <Card className="overflow-hidden">
                              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Stars rating={item.rating} />
                                  <span className="text-muted-foreground text-xs">
                                    {formatDate(item.created_at)}
                                  </span>
                                  <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground text-xs">
                                    {item.user_name?.trim()
                                      ? item.user_name.trim()
                                      : "Anonymous"}
                                  </span>
                                </div>
                              </CardHeader>
                              {item.feedback?.trim() ? (
                                <CardContent className="pt-0">
                                  <p className="whitespace-pre-wrap text-foreground text-sm">
                                    {item.feedback}
                                  </p>
                                </CardContent>
                              ) : null}
                            </Card>
                          </li>
                        ))
                      )}
                    </ul>

                    {data.items.length > 0 && totalPages > 1 && (
                      <nav
                        className="mt-6 flex items-center justify-between"
                        aria-label="App feedback pagination"
                      >
                        <Button
                          type="button"
                          variant="outline"
                          disabled={offset === 0}
                          onClick={() =>
                            setOffset((o) => Math.max(0, o - PAGE_SIZE))
                          }
                        >
                          Previous
                        </Button>
                        <span className="text-muted-foreground text-sm">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={offset + data.items.length >= data.total}
                          onClick={() => setOffset((o) => o + PAGE_SIZE)}
                        >
                          Next
                        </Button>
                      </nav>
                    )}
                  </div>
                )}

                {tab === "response" && (
                  <div
                    id={panelResponseId}
                    role="tabpanel"
                    aria-labelledby={tabResponseId}
                    className="space-y-4"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <label
                        htmlFor={voteFilterId}
                        className="text-muted-foreground text-sm"
                      >
                        Filter:
                      </label>
                      <select
                        id={voteFilterId}
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        value={voteHasFeedback}
                        onChange={(e) => {
                          const v = e.target.value as typeof voteHasFeedback;
                          setVoteHasFeedback(v);
                          setVoteOffset(0);
                        }}
                        aria-label="Filter response feedback"
                      >
                        <option value="all">All (votes and comments)</option>
                        <option value="comments_only">
                          With comment text only
                        </option>
                        <option value="votes_only">
                          Vote only (no comment)
                        </option>
                      </select>
                      {voteData ? (
                        <span className="text-muted-foreground text-sm">
                          {voteData.total} total · page{" "}
                          {Math.floor(voteOffset / PAGE_SIZE) + 1} of{" "}
                          {Math.ceil(voteData.total / voteData.limit) || 1}
                        </span>
                      ) : null}
                    </div>

                    {voteLoading ? (
                      <Card>
                        <CardContent className="flex items-center justify-center py-16">
                          <p className="text-muted-foreground text-sm">
                            Loading response feedback…
                          </p>
                        </CardContent>
                      </Card>
                    ) : voteData?.items.length === 0 ? (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <MessageCircle
                            className="mx-auto mb-2 h-10 w-10 text-muted-foreground/60"
                            aria-hidden
                          />
                          <p className="text-muted-foreground text-sm">
                            No response feedback yet.
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <ul className="space-y-4">
                        {voteData?.items.map((item) => (
                          <li key={`${item.chat_id}-${item.message_id}`}>
                            <Card className="overflow-hidden">
                              <CardHeader className="space-y-0 pb-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  {item.is_upvoted === true ? (
                                    <span
                                      className="flex items-center gap-1 rounded bg-green-500/15 px-1.5 py-0.5 text-green-700 text-xs dark:text-green-400"
                                      role="img"
                                      aria-label="Upvoted"
                                    >
                                      <ThumbsUp
                                        className="h-3.5 w-3.5"
                                        aria-hidden
                                      />
                                      Helpful
                                    </span>
                                  ) : item.is_upvoted === false ? (
                                    <span
                                      className="flex items-center gap-1 rounded bg-red-500/15 px-1.5 py-0.5 text-red-700 text-xs dark:text-red-400"
                                      role="img"
                                      aria-label="Downvoted"
                                    >
                                      <ThumbsDown
                                        className="h-3.5 w-3.5"
                                        aria-hidden
                                      />
                                      Not helpful
                                    </span>
                                  ) : null}
                                  <span className="text-muted-foreground text-xs">
                                    {formatDate(
                                      item.feedback_updated_at ??
                                        item.updated_at,
                                    )}
                                  </span>
                                  <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground text-xs">
                                    {item.user_name?.trim()
                                      ? item.user_name.trim()
                                      : "Unknown user"}
                                  </span>
                                </div>
                                <CardTitle className="font-medium text-base">
                                  <Link
                                    href={`/chat/${item.chat_id}`}
                                    className="text-primary underline-offset-4 hover:underline"
                                  >
                                    {item.chat_title || "Untitled chat"}
                                  </Link>
                                </CardTitle>
                                {item.message_preview ? (
                                  <CardDescription className="line-clamp-2 pt-1 font-normal text-foreground/80">
                                    {item.message_preview}
                                  </CardDescription>
                                ) : null}
                              </CardHeader>
                              {item.feedback?.trim() ? (
                                <CardContent className="pt-0">
                                  <p className="whitespace-pre-wrap rounded bg-muted/50 p-3 text-foreground text-sm">
                                    {item.feedback}
                                  </p>
                                </CardContent>
                              ) : null}
                              <CardContent className="pt-0">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    openPreview(
                                      item.chat_id,
                                      item.message_id,
                                      item,
                                    )
                                  }
                                >
                                  View conversation
                                </Button>
                              </CardContent>
                            </Card>
                          </li>
                        ))}
                      </ul>
                    )}

                    {voteData &&
                      voteData.items.length > 0 &&
                      voteData.total > PAGE_SIZE && (
                        <nav
                          className="mt-6 flex items-center justify-between"
                          aria-label="Response feedback pagination"
                        >
                          <Button
                            type="button"
                            variant="outline"
                            disabled={voteOffset === 0}
                            onClick={() =>
                              setVoteOffset((o) => Math.max(0, o - PAGE_SIZE))
                            }
                          >
                            Previous
                          </Button>
                          <span className="text-muted-foreground text-sm">
                            Page {Math.floor(voteOffset / PAGE_SIZE) + 1} of{" "}
                            {Math.ceil(voteData.total / voteData.limit)}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={
                              voteOffset + voteData.items.length >=
                              voteData.total
                            }
                            onClick={() => setVoteOffset((o) => o + PAGE_SIZE)}
                          >
                            Next
                          </Button>
                        </nav>
                      )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {showPreviewPanel && (
          <aside
            ref={previewScrollRef}
            className="relative sticky top-4 flex h-[calc(100dvh-var(--header-height,0)-3rem)] min-h-[20rem] flex-col overflow-hidden border-border bg-muted/30 lg:col-start-2 lg:row-start-1 lg:min-h-[24rem] lg:min-w-0 lg:border-l"
            style={{ width: previewPanelWidth }}
            aria-label="Chat preview"
          >
            <button
              type="button"
              aria-label="Resize chat preview panel"
              className="absolute left-0 top-0 z-10 hidden h-full w-1.5 cursor-col-resize border-0 bg-transparent hover:bg-primary/20 lg:block"
              style={{ transform: "translateX(-50%)" }}
              onMouseDown={handlePreviewResizeStart}
            />
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-background px-4 py-3">
              <h2 className="truncate font-semibold text-sm text-foreground">
                {previewLoading
                  ? "Loading…"
                  : (previewData?.title ?? "Chat preview")}
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={closePreview}
                aria-label="Close chat preview"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {selectedFeedback ? (
              <div className="shrink-0 border-b border-border bg-muted/50 px-4 py-2">
                <p className="text-muted-foreground text-xs">
                  Selected feedback
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${
                      selectedFeedback.is_upvoted === true
                        ? "bg-green-500/15 text-green-700 dark:text-green-400"
                        : selectedFeedback.is_upvoted === false
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {selectedFeedback.is_upvoted === true ? (
                      <ThumbsUp className="size-3" aria-hidden />
                    ) : selectedFeedback.is_upvoted === false ? (
                      <ThumbsDown className="size-3" aria-hidden />
                    ) : null}
                    {selectedFeedback.is_upvoted === true
                      ? "Helpful"
                      : selectedFeedback.is_upvoted === false
                        ? "Not helpful"
                        : "No vote"}
                  </span>
                  {selectedFeedback.feedback?.trim() ? (
                    <span className="line-clamp-2 text-foreground text-xs">
                      “{selectedFeedback.feedback.trim()}”
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {previewLoading ? (
                <p className="py-8 text-center text-muted-foreground text-sm">
                  Loading conversation…
                </p>
              ) : previewData?.messages.length ? (
                <ul className="space-y-3">
                  {previewData.messages.map((msg) => {
                    const isTarget = msg.id === selectedMessageId;
                    const message: ChatMessage = {
                      id: msg.id,
                      role: msg.role as "user" | "assistant" | "system",
                      parts: msg.parts as ChatMessage["parts"],
                    };
                    const voteForMessage: Vote | undefined =
                      isTarget && selectedFeedback && selectedChatId
                        ? {
                            chatId: selectedChatId,
                            messageId: msg.id,
                            isUpvoted: selectedFeedback.is_upvoted ?? false,
                            feedback: selectedFeedback.feedback,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            voteCreatedAt: null,
                            voteUpdatedAt: null,
                            feedbackCreatedAt: null,
                            feedbackUpdatedAt: null,
                          }
                        : undefined;
                    const noopSync = () => {};
                    const noopAsync = async () => {};
                    return (
                      <li
                        key={msg.id}
                        id={`preview-msg-${msg.id}`}
                        className={
                          isTarget
                            ? "rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-background"
                            : undefined
                        }
                      >
                        <PreviewMessage
                          chatId={selectedChatId ?? ""}
                          message={message}
                          vote={voteForMessage}
                          isLoading={false}
                          setMessages={noopSync}
                          regenerate={noopAsync}
                          isReadonly
                          requiresScrollPadding={false}
                        />
                        {isTarget ? (
                          <p className="mt-1 px-1 text-primary text-xs">
                            ↑ Feedback on this message
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : previewData ? (
                <p className="py-8 text-center text-muted-foreground text-sm">
                  No messages in this chat.
                </p>
              ) : selectedChatId && !previewLoading ? (
                <p className="py-8 text-center text-muted-foreground text-sm">
                  Could not load conversation.
                </p>
              ) : null}
            </div>
            {previewData && selectedChatId ? (
              <div className="shrink-0 border-t border-border bg-background px-4 py-2">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link
                    href={`/chat/${selectedChatId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open full chat
                  </Link>
                </Button>
              </div>
            ) : null}
          </aside>
        )}
      </div>
    </main>
  );
}
