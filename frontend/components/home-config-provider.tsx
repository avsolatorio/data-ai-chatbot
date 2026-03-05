"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

export type HomeConfig = {
  greeting: {
    title: string;
    subtitle: string;
  };
  suggestions: string[];
  /** When true (default), clicking a follow-up suggestion fills the input for editing; when false, it submits immediately. */
  followUpSuggestionsPopulateInput: boolean;
};

const DEFAULT_CONFIG: HomeConfig = {
  greeting: {
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

  return { title, subtitle };
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

function parseHomeConfig(data: unknown): HomeConfig {
  if (data === null || typeof data !== "object") {
    return DEFAULT_CONFIG;
  }

  const obj = data as Record<string, unknown>;
  const greeting = parseGreeting(obj.greeting);
  const suggestions = parseSuggestions(obj.suggestions);
  const followUpSuggestionsPopulateInput =
    parseFollowUpSuggestionsPopulateInput(obj.followUpSuggestionsPopulateInput);

  return {
    greeting,
    suggestions:
      suggestions.length > 0 ? suggestions : DEFAULT_CONFIG.suggestions,
    followUpSuggestionsPopulateInput,
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
  const fetchStartedRef = useRef(false);

  useEffect(() => {
    if (fetchStartedRef.current) return;
    fetchStartedRef.current = true;
    let cancelled = false;

    fetch("/json/home-config.json")
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
  }, []);

  return (
    <HomeConfigContext.Provider value={config}>
      {children}
    </HomeConfigContext.Provider>
  );
}
