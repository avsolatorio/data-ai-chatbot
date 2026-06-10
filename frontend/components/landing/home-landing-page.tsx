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
      className="home-landing-insights px-4 py-12 sm:px-6 lg:px-[72px] lg:py-[72px]"
    >
      <div className="mx-auto flex max-w-[1304px] flex-col gap-10">
        <div className="flex flex-col gap-2.5">
          <p className="text-xl font-semibold uppercase tracking-[1px] text-[#003d72]">
            {insights.eyebrow}
          </p>
          <h2
            className="text-3xl font-bold tracking-[-1.04px] text-[rgba(0,0,0,0.87)] md:text-[40px] md:leading-[48px]"
            id="landing-insights-title"
          >
            {insights.title}
          </h2>
          <p className="max-w-[1304px] text-lg text-[#6b7581] md:text-xl">
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
      className="home-landing-hero relative overflow-hidden px-4 pb-12 pt-8 sm:px-6 lg:min-h-[999px] lg:px-[72px] lg:pb-16 lg:pt-10"
    >
      <div
        aria-hidden
        className="home-landing-hero__wave pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `url("${getBasePath()}/images/landing/hero-wave-dots.png")`,
        }}
      />
      <div className="relative mx-auto flex w-full max-w-[858px] flex-col gap-8">
        <div className="flex flex-col gap-4 text-left">
          {greeting.eyebrow ? (
            <p className="text-xl font-semibold uppercase tracking-[1px] text-white">
              {greeting.eyebrow}
            </p>
          ) : null}
          <h1
            className="max-w-[640px] text-4xl font-bold leading-tight text-white md:text-[48px]"
            id="landing-hero-title"
          >
            {greeting.title}
          </h1>
          <p className="max-w-[645px] text-lg text-white/95 md:text-xl">
            {greeting.subtitle}
          </p>
        </div>
        {children}
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
    <div className="home-landing flex min-h-0 flex-1 flex-col overflow-y-auto">
      <LandingHero greeting={greeting}>{children}</LandingHero>
      <LandingInsightsSection
        chatId={chatId}
        insights={insights}
        sendMessage={sendMessage}
      />
    </div>
  );
}
