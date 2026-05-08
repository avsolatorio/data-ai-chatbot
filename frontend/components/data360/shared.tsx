export function formatNum(
  v: number | null | undefined,
  decimals = 2,
  maxDecimalsForSmall = decimals
): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "\u2014";
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(decimals)}B`;
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(decimals)}M`;
  if (abs >= 1_000) {
    return v.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });
  }
  return v.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimalsForSmall,
  });
}

export function signedPct(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "\u2014";
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
      <div className="font-medium">Error</div>
      <div className="mt-1">{message}</div>
    </div>
  );
}
