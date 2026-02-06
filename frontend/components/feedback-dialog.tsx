"use client";

import { MessageCircle, Star } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { apiFetch } from "@/lib/api-client";
import { appConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

const MAX_FEEDBACK_LENGTH = 2000;
const STAR_COUNT = 5;

type FeedbackDialogProps = {
  /** Controlled open state (e.g. from parent so "Share feedback" can open the same dialog). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function FeedbackDialog({
  open: controlledOpen,
  onOpenChange: controlledSetOpen,
}: FeedbackDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledSetOpen !== undefined;
  const open = isControlled ? (controlledOpen ?? false) : internalOpen;
  const setOpen = isControlled ? controlledSetOpen : setInternalOpen;
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contact = appConfig.feedbackContact;
  const showTrigger = contact ?? appConfig.applicationStatus;
  const feedbackId = useId();

  const resetForm = () => {
    setRating(null);
    setHoverRating(null);
    setFeedback("");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm();
    setOpen(next);
  };

  const handleSubmit = async () => {
    if (!rating) {
      toast.error("Please select a rating.");
      return;
    }
    const trimmed = feedback.trim();
    if (trimmed.length > MAX_FEEDBACK_LENGTH) {
      toast.error(
        `Feedback must be ${MAX_FEEDBACK_LENGTH} characters or less.`,
      );
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await apiFetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          feedback: trimmed || undefined,
        }),
      });
      if (!res.ok) throw new Error("Submit failed");
      toast.success("Thank you! Your feedback has been submitted.");
      handleOpenChange(false);
    } catch {
      toast.error("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showTrigger) return null;

  const displayRating = hoverRating ?? rating;

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="h-8 w-full justify-start gap-2 px-2 font-normal text-muted-foreground md:h-fit md:w-auto md:px-2"
            onClick={() => setOpen(true)}
            type="button"
            variant="ghost"
          >
            <MessageCircle className="h-4 w-4 shrink-0" />
            <span className="hidden md:inline">Give feedback</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent align="end" side="top">
          Give feedback
        </TooltipContent>
      </Tooltip>

      <AlertDialog onOpenChange={handleOpenChange} open={open}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Give feedback</AlertDialogTitle>
            <AlertDialogDescription>
              Rate the app and share your feedback to help us improve.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <fieldset aria-required="true" className="flex flex-col gap-2">
              <legend>Rating</legend>
              <div className="flex gap-1">
                {Array.from({ length: STAR_COUNT }, (_, i) => {
                  const value = i + 1;
                  const filled = value <= (displayRating ?? 0);
                  return (
                    <button
                      key={value}
                      aria-label={`${value} star${value === 1 ? "" : "s"}`}
                      className={cn(
                        "rounded p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                        filled
                          ? "text-amber-500 hover:text-amber-600"
                          : "text-muted-foreground hover:text-amber-500/80",
                      )}
                      onBlur={() => setHoverRating(null)}
                      onFocus={() => setHoverRating(value)}
                      onMouseEnter={() => setHoverRating(value)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setRating(value)}
                      type="button"
                    >
                      <Star
                        className={cn("h-8 w-8", filled && "fill-current")}
                        aria-hidden
                      />
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="flex flex-col gap-2">
              <Label htmlFor={feedbackId}>Feedback (optional)</Label>
              <Textarea
                className="min-h-[100px] resize-y"
                id={feedbackId}
                maxLength={MAX_FEEDBACK_LENGTH + 1}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="What could we do better?"
                value={feedback}
              />
              <span className="text-muted-foreground text-xs">
                {feedback.length}/{MAX_FEEDBACK_LENGTH}
              </span>
            </div>

            {contact && (
              <p className="text-muted-foreground text-sm">
                Or{" "}
                <a
                  className="font-medium text-primary underline underline-offset-2 hover:no-underline"
                  href={contact.url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {contact.label}
                </a>
              </p>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <Button
              disabled={isSubmitting || !rating}
              onClick={handleSubmit}
              type="button"
            >
              {isSubmitting ? "Submitting…" : "Submit"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
