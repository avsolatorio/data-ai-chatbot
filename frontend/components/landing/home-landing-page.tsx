"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import type { ReactNode } from "react";
import type {
  HomeInsightsConfig,
  HomeConfig,
} from "@/components/home-config-provider";
import { InsightCard } from "@/components/landing/insight-card";
import { getBasePath } from "@/lib/config";

type LandingInsightsSectionProps = {
  insights: HomeInsightsConfig;
  chatId: string;
  sendMessage: UseChatHelpers<import("@/lib/types").ChatMessage>["sendMessage"];
};

export function LandingInsightsSection({
  insights,
  chatId,
  sendMessage,
}: LandingInsightsSectionProps) {
  const [statCard, chartCard, textCard] = insights.cards;

  return (
    <section
      aria-labelledby="landing-insights-title"
      className="home-landing-insights shrink-0 px-4 py-10 sm:px-6 sm:py-12 lg:px-[72px] lg:py-[72px]"
    >
      <div className="mx-auto flex max-w-[1304px] flex-col gap-8 sm:gap-10">
        <div className="flex flex-col gap-2 sm:gap-2.5">
          <p className="text-base font-semibold uppercase tracking-[1px] text-[#003d72] sm:text-xl">
            {insights.eyebrow}
          </p>
          <h2
            className="text-2xl font-bold tracking-[-0.5px] text-[rgba(0,0,0,0.87)] sm:text-3xl md:text-[40px] md:leading-[48px] md:tracking-[-1.04px]"
            id="landing-insights-title"
          >
            {insights.title}
          </h2>
          <p className="max-w-[1304px] text-base text-[#6b7581] sm:text-lg md:text-xl">
            {insights.subtitle}
          </p>
        </div>

        <div className="home-insights-grid grid gap-5 lg:grid-cols-2 lg:grid-rows-[auto_auto]">
          {statCard ? (
            <InsightCard
              card={statCard}
              chatId={chatId}
              sendMessage={sendMessage}
            />
          ) : null}
          {chartCard ? (
            <InsightCard
              card={chartCard}
              chatId={chatId}
              sendMessage={sendMessage}
            />
          ) : null}
          {textCard ? (
            <InsightCard
              card={textCard}
              chatId={chatId}
              sendMessage={sendMessage}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}

type LandingHeroProps = {
  greeting: HomeConfig["greeting"];
  children: ReactNode;
};

export function LandingHero({ greeting, children }: LandingHeroProps) {
  return (
    <section
      aria-labelledby="landing-hero-title"
      className="home-landing-hero relative shrink-0 overflow-x-hidden px-4 pb-14 pt-6 sm:px-6 sm:pt-8 lg:min-h-[999px] lg:px-[72px] lg:pb-16 lg:pt-10"
    >
      <div
        aria-hidden
        className="home-landing-hero__wave pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `url("${getBasePath()}/images/landing/hero-wave-dots.png")`,
        }}
      />
      <div className="relative z-10 mx-auto flex w-full max-w-[858px] flex-col">
        <div className="flex flex-col gap-2 text-left sm:gap-0">
          {greeting.eyebrow ? (
            <p className="text-base font-semibold uppercase tracking-[1px] text-white sm:text-xl">
              {greeting.eyebrow}
            </p>
          ) : null}
          <h1
            className="max-w-[640px] text-[28px] font-bold leading-[1.15] text-white sm:text-4xl sm:leading-tight md:text-[48px]"
            id="landing-hero-title"
          >
            {greeting.title}
          </h1>
          <p className="max-w-[645px] text-base text-white/95 sm:mt-[19px] sm:text-lg md:text-xl">
            {greeting.subtitle}
          </p>
        </div>
        <div className="mt-8 sm:mt-12 md:mt-[72px]">{children}</div>
      </div>
    </section>
  );
}

type HomeLandingPageProps = {
  greeting: HomeConfig["greeting"];
  insights: HomeInsightsConfig;
  chatId: string;
  sendMessage: UseChatHelpers<import("@/lib/types").ChatMessage>["sendMessage"];
  children: ReactNode;
};

export function HomeLandingPage({
  greeting,
  insights,
  chatId,
  sendMessage,
  children,
}: HomeLandingPageProps) {
  return (
    <div className="home-landing min-h-0 flex-1 overflow-y-auto">
      <LandingHero greeting={greeting}>{children}</LandingHero>
      <LandingInsightsSection
        chatId={chatId}
        insights={insights}
        sendMessage={sendMessage}
      />
    </div>
  );
}
