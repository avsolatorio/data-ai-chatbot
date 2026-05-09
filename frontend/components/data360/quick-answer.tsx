/**
 * Quick Answer Card renderer.
 *
 * Renders one of three styled card variants based on the `card_type` field
 * synthesised by the backend `quick_answer_node`:
 *
 *   single_fact  — one country, one indicator, one year
 *   comparison   — two countries side-by-side with delta
 *   trend        — single-indicator time range with change display
 *
 * Each variant supports two visual modes:
 *   "typographic" — large headline number on a transparent background
 *   "highlight"   — boxed card with a subtle tinted background
 *
 * The `ClaimMark` component is used for all primary observed values so the
 * provenance tooltip works the same way as in the aggregation renderers.
 */
"use client";

import { ClaimMark } from "@pcn-js/ui";
import { ArrowDown, ArrowRight, ArrowUp, Minus } from "lucide-react";
import type {
  ComparisonCard,
  QuickAnswerCardData,
  SingleFactCard,
  TrendCard,
  TrendGroupEntry,
} from "@/lib/types";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Format a numeric value for display. Preserves integer form if no decimals needed. */
function fmt(
  v: number | string | null | undefined,
  maxDecimals = 2,
): string {
  if (v === null || v === undefined || v === "") return "—";
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (!isFinite(n)) return String(v);
  if (Math.abs(n) >= 1_000_000_000) {
    return `${(n / 1_000_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 })}B`;
  }
  if (Math.abs(n) >= 1_000_000) {
    return `${(n / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 })}M`;
  }
  return n.toLocaleString(undefined, {
    maximumFractionDigits: maxDecimals,
    minimumFractionDigits: 0,
  });
}

function fmtPct(v: number | null | undefined, signed = true): string {
  if (v === null || v === undefined) return "—";
  const prefix = signed && v > 0 ? "+" : "";
  return `${prefix}${v.toFixed(1)}%`;
}

type StyleVariant = "typographic" | "highlight";

interface TrendBadgeProps {
  direction: string;
  pct: number | null;
}

function TrendBadge({ direction, pct }: TrendBadgeProps) {
  const isUp = direction === "increasing";
  const isDown = direction === "decreasing";
  const isFlat = !isUp && !isDown;

  const colorClass = isUp
    ? "text-emerald-600 dark:text-emerald-400"
    : isDown
      ? "text-rose-500 dark:text-rose-400"
      : "text-muted-foreground";

  const Icon = isUp ? ArrowUp : isDown ? ArrowDown : Minus;

  return (
    <span className={cn("inline-flex items-center gap-0.5 font-medium text-sm", colorClass)}>
      <Icon className="size-3.5" />
      {isFlat ? "Flat" : fmtPct(pct)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper — shared by all card types
// ---------------------------------------------------------------------------

interface CardWrapperProps {
  variant: StyleVariant;
  children: React.ReactNode;
  className?: string;
}

function CardWrapper({ variant, children, className }: CardWrapperProps) {
  if (variant === "highlight") {
    return (
      <div
        className={cn(
          "rounded-xl border border-border/60 bg-muted/40 px-5 py-4 shadow-sm",
          "dark:bg-muted/20 dark:border-border/30",
          className,
        )}
      >
        {children}
      </div>
    );
  }
  // typographic: no box, just spacing
  return (
    <div className={cn("py-2", className)}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-label / indicator name
// ---------------------------------------------------------------------------

function IndicatorLabel({ name, year }: { name: string; year?: string | number | null }) {
  if (!name) return null;
  return (
    <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase mb-1">
      {name}{year ? ` · ${year}` : ""}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Single Fact Card
// ---------------------------------------------------------------------------

function SingleFactCardRenderer({
  card,
  variant,
}: {
  card: SingleFactCard;
  variant: StyleVariant;
}) {
  const isHighlight = variant === "highlight";
  return (
    <CardWrapper variant={variant}>
      {card.country_name && (
        <p className={cn(
          "font-semibold mb-0.5",
          isHighlight ? "text-sm text-foreground" : "text-base text-foreground/80",
        )}>
          {card.country_name}
        </p>
      )}
      <IndicatorLabel name={card.indicator_name} year={card.year} />
      <div className={cn(
        "font-bold leading-none tracking-tight",
        isHighlight ? "text-4xl mt-2" : "text-5xl mt-1",
      )}>
        {card.claim_id ? (
          <ClaimMark policy={{ type: "rounded", decimals: 2 }} id={card.claim_id}>
            {fmt(card.value)}
          </ClaimMark>
        ) : (
          fmt(card.value)
        )}
        {card.unit && (
          <span className="ml-2 text-lg font-normal text-muted-foreground align-baseline">
            {card.unit}
          </span>
        )}
      </div>
    </CardWrapper>
  );
}

// ---------------------------------------------------------------------------
// Comparison Card
// ---------------------------------------------------------------------------

function ComparisonCardRenderer({
  card,
  variant,
}: {
  card: ComparisonCard;
  variant: StyleVariant;
}) {
  const isHighlight = variant === "highlight";
  const [a, b] = card.entries;
  if (!a || !b) return null;

  const aVal = typeof a.value === "string" ? parseFloat(a.value) : (a.value ?? NaN);
  const bVal = typeof b.value === "string" ? parseFloat(b.value) : (b.value ?? NaN);
  const delta = isFinite(aVal) && isFinite(bVal) ? aVal - bVal : null;

  return (
    <CardWrapper variant={variant}>
      <IndicatorLabel name={card.indicator_name} year={card.year} />
      {/* Delta row */}
      {delta !== null && (
        <div className={cn(
          "font-bold leading-none tracking-tight",
          isHighlight ? "text-4xl mt-2 mb-3" : "text-5xl mt-1 mb-4",
        )}>
          <span className={delta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}>
            {delta >= 0 ? "+" : ""}{fmt(delta)}
          </span>
          {card.unit && (
            <span className="ml-2 text-lg font-normal text-muted-foreground align-baseline">
              {card.unit}
            </span>
          )}
        </div>
      )}
      {/* Country rows */}
      <div className="flex flex-col gap-2 mt-1">
        {card.entries.map((entry) => (
          <div
            key={entry.ref_area}
            className="flex items-center justify-between gap-4"
          >
            <span className="text-sm font-medium text-foreground/80 min-w-0 truncate">
              {entry.country_name || entry.ref_area}
            </span>
            <span className="text-sm font-semibold tabular-nums shrink-0">
              {entry.claim_id ? (
                <ClaimMark policy={{ type: "rounded", decimals: 2 }} id={entry.claim_id}>
                  {fmt(entry.value)} {card.unit}
                </ClaimMark>
              ) : (
                <>{fmt(entry.value)} {card.unit}</>
              )}
            </span>
          </div>
        ))}
      </div>
      {card.entries.length === 2 && (
        <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
          <span className="font-medium">{card.entries[0].country_name || card.entries[0].ref_area}</span>
          <ArrowRight className="size-3" />
          <span className="font-medium">{card.entries[1].country_name || card.entries[1].ref_area}</span>
        </div>
      )}
    </CardWrapper>
  );
}

// ---------------------------------------------------------------------------
// Trend Card — single or multi-group
// ---------------------------------------------------------------------------

function TrendGroupRow({ group, unit }: { group: TrendGroupEntry; unit: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border/40 bg-background/60 p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">
          {group.ref_area_name || group.ref_area}
        </span>
        <TrendBadge direction={group.trend_direction} pct={group.pct_change} />
      </div>
      <div className="flex items-baseline gap-2 mt-0.5">
        <span className="text-2xl font-bold tracking-tight">
          {group.latest_claim_id ? (
            <ClaimMark policy={{ type: "rounded", decimals: 2 }} id={group.latest_claim_id}>
              {fmt(group.latest_value)}
            </ClaimMark>
          ) : (
            fmt(group.latest_value)
          )}
        </span>
        <span className="text-xs text-muted-foreground">{unit} · {group.latest_year}</span>
      </div>
      {group.earliest_value !== null && group.earliest_year !== null && (
        <p className="text-xs text-muted-foreground">
          From{" "}
          {group.earliest_claim_id ? (
            <ClaimMark policy={{ type: "rounded", decimals: 2 }} id={group.earliest_claim_id}>
              {fmt(group.earliest_value)}
            </ClaimMark>
          ) : (
            fmt(group.earliest_value)
          )}{" "}
          in {group.earliest_year}
        </p>
      )}
    </div>
  );
}

function TrendCardRenderer({
  card,
  variant,
}: {
  card: TrendCard;
  variant: StyleVariant;
}) {
  const isHighlight = variant === "highlight";
  const multiGroup = card.groups.length > 1;

  if (multiGroup) {
    // Multi-group: render compact rows inside a wrapper
    return (
      <CardWrapper variant={variant}>
        <IndicatorLabel
          name={card.indicator_name}
          year={
            card.earliest_year && card.latest_year
              ? `${card.earliest_year}–${card.latest_year}`
              : undefined
          }
        />
        <div className="flex flex-col gap-2 mt-2">
          {card.groups.map((g) => (
            <TrendGroupRow key={g.ref_area} group={g} unit={card.unit} />
          ))}
        </div>
      </CardWrapper>
    );
  }

  // Single group: show prominent change number
  const changePct = card.pct_change;
  const totalChange = card.total_change;

  return (
    <CardWrapper variant={variant}>
      {card.country_name && (
        <p className={cn(
          "font-semibold mb-0.5",
          isHighlight ? "text-sm text-foreground" : "text-base text-foreground/80",
        )}>
          {card.country_name}
        </p>
      )}
      <IndicatorLabel
        name={card.indicator_name}
        year={
          card.earliest_year && card.latest_year
            ? `${card.earliest_year}–${card.latest_year}`
            : undefined
        }
      />
      {/* Big change number */}
      <div className={cn(
        "font-bold leading-none tracking-tight",
        isHighlight ? "text-4xl mt-2" : "text-5xl mt-1",
        changePct !== null && changePct >= 0
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-rose-500 dark:text-rose-400",
      )}>
        {totalChange !== null && changePct !== null ? (
          <>
            {totalChange >= 0 ? "+" : ""}
            {fmt(totalChange)}
            <span className="ml-2 text-xl font-semibold align-baseline opacity-70">
              {fmtPct(changePct)}
            </span>
          </>
        ) : (
          fmt(card.latest_value)
        )}
        {card.unit && totalChange === null && (
          <span className="ml-2 text-lg font-normal text-muted-foreground align-baseline">
            {card.unit}
          </span>
        )}
      </div>
      {/* From → To sub-line */}
      {card.earliest_value !== null && card.latest_value !== null && (
        <p className="mt-2 text-sm text-muted-foreground">
          From{" "}
          {card.earliest_claim_id ? (
            <ClaimMark policy={{ type: "rounded", decimals: 2 }} id={card.earliest_claim_id}>
              {fmt(card.earliest_value)} {card.unit}
            </ClaimMark>
          ) : (
            <>{fmt(card.earliest_value)} {card.unit}</>
          )}{" "}
          ({card.earliest_year}) to{" "}
          {card.latest_claim_id ? (
            <ClaimMark policy={{ type: "rounded", decimals: 2 }} id={card.latest_claim_id}>
              {fmt(card.latest_value)} {card.unit}
            </ClaimMark>
          ) : (
            <>{fmt(card.latest_value)} {card.unit}</>
          )}{" "}
          ({card.latest_year})
        </p>
      )}
    </CardWrapper>
  );
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

export interface QuickAnswerCardProps {
  card: QuickAnswerCardData;
  /**
   * "typographic" — large number, transparent background (default for single_fact)
   * "highlight"   — boxed card with tinted background
   */
  variant?: StyleVariant;
}

export function QuickAnswerCard({ card, variant = "typographic" }: QuickAnswerCardProps) {
  switch (card.card_type) {
    case "single_fact":
      return <SingleFactCardRenderer card={card} variant={variant} />;
    case "comparison":
      return <ComparisonCardRenderer card={card} variant={variant} />;
    case "trend":
      return <TrendCardRenderer card={card} variant={variant} />;
    default:
      return null;
  }
}
