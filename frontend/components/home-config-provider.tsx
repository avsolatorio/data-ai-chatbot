"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getBasePath } from "@/lib/config";

export type NarrativePart = {
  text: string;
  emphasis?: boolean;
};

export type InsightCardStatConfig = {
  type: "stat";
  question: string;
  metricLabel: string;
  metricValue: string;
  source: string;
};

export type InsightCardChartConfig = {
  type: "chart";
  question: string;
  chartTitle: string;
  chartImage?: string;
  narrativeParts: NarrativePart[];
  source: string;
};

export type InsightCardTextConfig = {
  type: "text";
  question: string;
  answer: string;
  source: string;
};

export type InsightCardConfig =
  | InsightCardStatConfig
  | InsightCardChartConfig
  | InsightCardTextConfig;

export type HomeInsightsConfig = {
  eyebrow: string;
  title: string;
  subtitle: string;
  cards: InsightCardConfig[];
};

export type HomeConfig = {
  greeting: {
    eyebrow?: string;
    title: string;
    subtitle: string;
  };
  suggestions: string[];
  /** When true (default), clicking a follow-up suggestion fills the input for editing; when false, it submits immediately. */
  followUpSuggestionsPopulateInput: boolean;
  insights: HomeInsightsConfig;
};

const DEFAULT_INSIGHTS: HomeInsightsConfig = {
  eyebrow: "Did you know...?",
  title: "Insights of the week",
  subtitle:
    "Sample questions with simple answers from the same data that the chat has access to",
  cards: [
    {
      type: "stat",
      question: "What share of the world's adults are now literate?",
      metricLabel: "Global adult literacy rate, 2022",
      metricValue: "87%",
      source: "Worldbank - World Development Indicators (WDI)",
    },
    {
      type: "chart",
      question: "How has the unemployment rate in Ghana changed since 2010?",
      chartTitle: "Prevalence of undernourishment (% of population)",
      chartImage: "/images/landing/ghana-unemployment-chart.svg",
      narrativeParts: [
        { text: "After climbing through the pandemic, " },
        { text: "Ghana's unemployment rate", emphasis: true },
        { text: " has fallen back to roughly " },
        { text: "3.4%", emphasis: true },
        { text: " in 2023 — its lowest level in the period." },
      ],
      source: "Worldbank - World Development Indicators (WDI)",
    },
    {
      type: "text",
      question:
        "Which region has seen the biggest jump in internet use over the last decade?",
      answer:
        "Sub-Saharan Africa added +49 percentage points of internet users between 2013 and 2023 — the largest gain of any region.",
      source: "Worldbank - World Development Indicators (WDI)",
    },
  ],
};

const DEFAULT_CONFIG: HomeConfig = {
  greeting: {
    eyebrow: "Data 360 Chat",
    title: "What would you like to explore?",
    subtitle:
      "Ask a question, get insights, or try one of the suggestions below.",
  },
  suggestions: [
    "Summarize the key trends in this document",
    "Explain this in simpler terms",
    "What are the main takeaways?",
    "Suggest next steps or recommendations",
  ],
  followUpSuggestionsPopulateInput: true,
  insights: DEFAULT_INSIGHTS,
};

function parseFollowUpSuggestionsPopulateInput(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  return DEFAULT_CONFIG.followUpSuggestionsPopulateInput;
}

function parseGreeting(value: unknown): HomeConfig["greeting"] {
  if (value === null || typeof value !== "object") {
    return DEFAULT_CONFIG.greeting;
  }

  const g = value as Record<string, unknown>;
  const title =
    typeof g.title === "string" && g.title.trim().length > 0
      ? g.title.trim()
      : DEFAULT_CONFIG.greeting.title;
  const subtitle =
    typeof g.subtitle === "string"
      ? g.subtitle.trim()
      : DEFAULT_CONFIG.greeting.subtitle;
  const eyebrow =
    typeof g.eyebrow === "string" && g.eyebrow.trim().length > 0
      ? g.eyebrow.trim()
      : DEFAULT_CONFIG.greeting.eyebrow;

  return { eyebrow, title, subtitle };
}

function parseSuggestions(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return DEFAULT_CONFIG.suggestions;
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0,
    )
    .map((s) => s.trim());
}

function parseNarrativeParts(value: unknown): NarrativePart[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        item !== null && typeof item === "object",
    )
    .map((item) => ({
      text: typeof item.text === "string" ? item.text : "",
      emphasis: item.emphasis === true,
    }))
    .filter((part) => part.text.length > 0);
}

function parseInsightCard(value: unknown): InsightCardConfig | null {
  if (value === null || typeof value !== "object") {
    return null;
  }

  const card = value as Record<string, unknown>;
  const type = card.type;
  const question =
    typeof card.question === "string" ? card.question.trim() : "";
  const source = typeof card.source === "string" ? card.source.trim() : "";

  if (!question) {
    return null;
  }

  if (type === "stat") {
    const metricLabel =
      typeof card.metricLabel === "string" ? card.metricLabel.trim() : "";
    const metricValue =
      typeof card.metricValue === "string" ? card.metricValue.trim() : "";
    if (!metricLabel || !metricValue) {
      return null;
    }
    return { type: "stat", question, metricLabel, metricValue, source };
  }

  if (type === "chart") {
    const chartTitle =
      typeof card.chartTitle === "string" ? card.chartTitle.trim() : "";
    const narrativeParts = parseNarrativeParts(card.narrativeParts);
    if (!chartTitle || narrativeParts.length === 0) {
      return null;
    }
    const chartImage =
      typeof card.chartImage === "string" ? card.chartImage.trim() : undefined;
    return {
      type: "chart",
      question,
      chartTitle,
      chartImage,
      narrativeParts,
      source,
    };
  }

  if (type === "text") {
    const answer = typeof card.answer === "string" ? card.answer.trim() : "";
    if (!answer) {
      return null;
    }
    return { type: "text", question, answer, source };
  }

  return null;
}

function parseInsights(value: unknown): HomeInsightsConfig {
  if (value === null || typeof value !== "object") {
    return DEFAULT_INSIGHTS;
  }

  const insights = value as Record<string, unknown>;
  const eyebrow =
    typeof insights.eyebrow === "string" && insights.eyebrow.trim().length > 0
      ? insights.eyebrow.trim()
      : DEFAULT_INSIGHTS.eyebrow;
  const title =
    typeof insights.title === "string" && insights.title.trim().length > 0
      ? insights.title.trim()
      : DEFAULT_INSIGHTS.title;
  const subtitle =
    typeof insights.subtitle === "string"
      ? insights.subtitle.trim()
      : DEFAULT_INSIGHTS.subtitle;

  const cards = Array.isArray(insights.cards)
    ? insights.cards
        .map(parseInsightCard)
        .filter((card): card is InsightCardConfig => card !== null)
    : [];

  return {
    eyebrow,
    title,
    subtitle,
    cards: cards.length > 0 ? cards : DEFAULT_INSIGHTS.cards,
  };
}

function parseHomeConfig(data: unknown): HomeConfig {
  if (data === null || typeof data !== "object") {
    return DEFAULT_CONFIG;
  }

  const obj = data as Record<string, unknown>;
  const greeting = parseGreeting(obj.greeting);
  const suggestions = parseSuggestions(obj.suggestions);
  const followUpSuggestionsPopulateInput =
    parseFollowUpSuggestionsPopulateInput(obj.followUpSuggestionsPopulateInput);
  const insights = parseInsights(obj.insights);

  return {
    greeting,
    suggestions:
      suggestions.length > 0 ? suggestions : DEFAULT_CONFIG.suggestions,
    followUpSuggestionsPopulateInput,
    insights,
  };
}

const HomeConfigContext = createContext<HomeConfig | null>(null);

export function useHomeConfig(): HomeConfig {
  const context = useContext(HomeConfigContext);
  if (context === null) {
    throw new Error("useHomeConfig must be used within HomeConfigProvider");
  }
  return context;
}

export function HomeConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<HomeConfig>(DEFAULT_CONFIG);
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") return;

    let cancelled = false;

    fetch(`${getBasePath()}/json/home-config.json`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Home config not found");
        }
        return res.json();
      })
      .then((data: unknown) => {
        if (cancelled) {
          return;
        }
        const parsed = parseHomeConfig(data);
        setConfig(parsed);
      })
      .catch(() => {
        if (!cancelled) {
          setConfig(DEFAULT_CONFIG);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <HomeConfigContext.Provider value={config}>
      {children}
    </HomeConfigContext.Provider>
  );
}
