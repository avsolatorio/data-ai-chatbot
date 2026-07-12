"use client";

import { useRef, useState } from "react";

export type InteractiveChoicesOutput = {
  prompt: string;
  options: string[];
  title?: string | null;
};

type ChoiceCardProps = {
  payload: InteractiveChoicesOutput;
  onSelect: (text: string) => void;
  theme?: "light" | "dark";
  className?: string;
};

function isSpecifyOption(label: string): boolean {
  const t = label.toLowerCase();
  return (
    t.includes("specify") ||
    t.includes("other") ||
    t.includes("custom") ||
    t.includes("enter") ||
    label.endsWith("...")
  );
}

function ChoiceCard({
  payload,
  onSelect,
  theme = "light",
  className = "",
}: ChoiceCardProps) {
  const { prompt, options } = payload;
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [customValue, setCustomValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dark = theme === "dark";

  const handleOptionClick = (label: string, idx: number) => {
    if (activeIdx !== null) return;
    if (isSpecifyOption(label)) {
      setActiveIdx(idx);
      setCustomValue("");
      setTimeout(() => inputRef.current?.focus(), 10);
    } else {
      onSelect(label);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = customValue.trim();
    if (v) onSelect(v);
  };

  return (
    <div
      style={{
        padding: "8px 12px",
        fontFamily:
          '"Noto Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
      className={className}
    >
      {prompt && (
        <p
          style={{
            fontSize: "1.05rem",
            fontWeight: 500,
            marginBottom: "16px",
            color: dark ? "#cbd5e1" : "#0f172a",
            lineHeight: 1.4,
          }}
        >
          {prompt}
        </p>
      )}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {options.map((label, idx) => {
          const isActive = activeIdx === idx;
          return (
            <button
              key={idx}
              type="button"
              disabled={activeIdx !== null && !isActive}
              onClick={() => handleOptionClick(label, idx)}
              style={{
                flex: "1 1 calc(33.333% - 8px)",
                minWidth: "160px",
                padding: "14px 18px",
                background: dark ? "#1e293b" : "#f1f5f9",
                border: "1px solid transparent",
                borderRadius: "1.25rem",
                color: dark ? "#cbd5e1" : "#0f172a",
                fontSize: "0.95rem",
                fontWeight: 500,
                fontFamily: "inherit",
                cursor: isActive ? "default" : "pointer",
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "background 0.15s",
                opacity: activeIdx !== null && !isActive ? 0.35 : 1,
              }}
            >
              {isActive ? (
                <form
                  onSubmit={handleCustomSubmit}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    placeholder="Type here..."
                    required
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        e.preventDefault();
                        setActiveIdx(null);
                      }
                    }}
                    style={{
                      flex: 1,
                      border: "none",
                      background: "transparent",
                      outline: "none",
                      fontSize: "0.9rem",
                      color: "inherit",
                      fontFamily: "inherit",
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "1.1rem",
                      color: "inherit",
                    }}
                  >
                    ↪
                  </button>
                </form>
              ) : (
                <>
                  <span>{label}</span>
                  <span
                    style={{
                      marginTop: "12px",
                      fontSize: "1.1rem",
                      color: dark ? "#94a3b8" : "#64748b",
                    }}
                  >
                    ↪
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function isValidPayload(raw: unknown): raw is InteractiveChoicesOutput {
  if (typeof raw !== "object" || raw === null) return false;
  const r = raw as Record<string, unknown>;
  return (
    typeof r.prompt === "string" &&
    Array.isArray(r.options) &&
    r.options.every((o) => typeof o === "string")
  );
}

export function InteractiveChoicesCard({
  output,
  onSelect,
  theme = "light",
}: {
  output: unknown;
  onSelect: (text: string) => void;
  theme?: "light" | "dark";
}) {
  if (!isValidPayload(output)) return null;

  const payload: InteractiveChoicesOutput = {
    prompt: output.prompt,
    options: output.options,
    title: output.title ?? undefined,
  };

  return <ChoiceCard payload={payload} onSelect={onSelect} theme={theme} />;
}
