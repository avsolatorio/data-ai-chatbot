"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { MessageCircle } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { getBasePath } from "@/lib/config";
import type { ChatMessage } from "@/lib/types";
import type {
  InsightCardChartConfig,
  InsightCardConfig,
  InsightCardStatConfig,
  InsightCardTextConfig,
  NarrativePart,
} from "@/components/home-config-provider";
import { cn } from "@/lib/utils";

type InsightCardShellProps = {
  question: string;
  source?: string;
  children: ReactNode;
  onTellMeMore: () => void;
  className?: string;
};

function InsightCardShell({
  question,
  source,
  children,
  onTellMeMore,
  className,
}: InsightCardShellProps) {
  return (
    <article
      className={cn(
        "home-insight-card flex flex-col overflow-hidden rounded-[15px] shadow-[0_2px_3px_rgba(0,0,0,0.08)]",
        className,
      )}
    >
      <div className="home-insight-card__header flex min-h-[83px] items-center px-5 py-3.5">
        <h3 className="text-[20px] font-semibold leading-snug text-white md:text-2xl">
          {question}
        </h3>
      </div>
      <div className="flex flex-1 flex-col bg-white pb-6">
        <div className="flex flex-1 flex-col px-8 pt-8">{children}</div>
        {source ? (
          <p className="mt-4 px-8 text-xs leading-5 text-[#6b7581]">
            <span className="font-bold">Source: </span>
            <span className="font-normal">{source}</span>
          </p>
        ) : null}
        <div className="mt-4 flex justify-end px-8">
          <button
            className="home-insight-card__cta inline-flex h-8 items-center gap-2 rounded-full border border-[rgba(158,158,166,0.2)] bg-white px-3 py-1 text-xs font-semibold text-[#0171bd] transition-colors hover:bg-[#0171bd]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0171bd] focus-visible:ring-offset-2"
            onClick={onTellMeMore}
            type="button"
          >
            <MessageCircle aria-hidden className="size-5" />
            Tell me more
          </button>
        </div>
      </div>
    </article>
  );
}

function NarrativeText({ parts }: { parts: NarrativePart[] }) {
  return (
    <p className="text-xl leading-[1.5] text-[rgba(0,0,0,0.87)]">
      {parts.map((part, index) =>
        part.emphasis ? (
          <span
            className="font-bold text-[#0171bd]"
            key={`${index}-${part.text}-emphasis`}
          >
            {part.text}
          </span>
        ) : (
          <span key={`${index}-${part.text}`}>{part.text}</span>
        ),
      )}
    </p>
  );
}

function InsightCardStat({
  card,
  onTellMeMore,
}: {
  card: InsightCardStatConfig;
  onTellMeMore: () => void;
}) {
  return (
    <InsightCardShell
      onTellMeMore={onTellMeMore}
      question={card.question}
      source={card.source}
    >
      <p className="text-xl font-bold tracking-[-0.4px] text-[rgba(0,0,0,0.87)]">
        {card.metricLabel}
      </p>
      <p className="mt-2 text-[64px] font-bold leading-[1.7] text-[#0171bd]">
        {card.metricValue}
      </p>
    </InsightCardShell>
  );
}

function InsightCardChart({
  card,
  onTellMeMore,
}: {
  card: InsightCardChartConfig;
  onTellMeMore: () => void;
}) {
  const chartSrc = card.chartImage?.startsWith("/")
    ? `${getBasePath()}${card.chartImage}`
    : card.chartImage;

  return (
    <InsightCardShell
      className="lg:row-span-2"
      onTellMeMore={onTellMeMore}
      question={card.question}
      source={card.source}
    >
      <p className="text-xl font-bold tracking-[-0.4px] text-[rgba(0,0,0,0.87)]">
        {card.chartTitle}
      </p>
      {chartSrc ? (
        <div className="mt-5 w-full max-w-[570px]">
          <Image
            alt=""
            className="h-auto w-full"
            height={243}
            src={chartSrc}
            unoptimized
            width={570}
          />
        </div>
      ) : null}
      <div className="mt-5">
        <NarrativeText parts={card.narrativeParts} />
      </div>
    </InsightCardShell>
  );
}

function InsightCardText({
  card,
  onTellMeMore,
}: {
  card: InsightCardTextConfig;
  onTellMeMore: () => void;
}) {
  return (
    <InsightCardShell
      onTellMeMore={onTellMeMore}
      question={card.question}
      source={card.source}
    >
      <p className="text-xl leading-[1.5] text-[rgba(0,0,0,0.87)]">
        {card.answer}
      </p>
    </InsightCardShell>
  );
}

type InsightCardProps = {
  card: InsightCardConfig;
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
};

export function InsightCard({ card, chatId, sendMessage }: InsightCardProps) {
  const onTellMeMore = () => {
    window.history.pushState({}, "", `${getBasePath()}/chat/${chatId}`);
    sendMessage({
      role: "user",
      parts: [{ type: "text", text: card.question }],
    });
  };

  if (card.type === "stat") {
    return <InsightCardStat card={card} onTellMeMore={onTellMeMore} />;
  }

  if (card.type === "chart") {
    return <InsightCardChart card={card} onTellMeMore={onTellMeMore} />;
  }

  return <InsightCardText card={card} onTellMeMore={onTellMeMore} />;
}
