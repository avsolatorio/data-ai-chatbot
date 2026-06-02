"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AUDIENCE_CARDS,
  AUDIENCE_DETAILS,
  AUDIENCE_LIST_HINT,
  type AudienceStep,
  EXAMPLE_QUESTION_CARDS,
  FLOW_STEP_DELAY_MS,
  QUESTION_TOOL_FLOWS,
  QUESTIONS_LIST_HINT,
  type QuestionToolStep,
} from "./mcp-docs-content";

type ExpandableVariant = "questions" | "audience";

type McpDocsExpandableListProps = {
  variant: ExpandableVariant;
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReduced(media.matches);
    };
    update();
    media.addEventListener("change", update);
    return () => {
      media.removeEventListener("change", update);
    };
  }, []);

  return reduced;
}

function QuestionStepBody({ step }: { step: QuestionToolStep }) {
  return (
    <>
      <span className="question-flow__tool">{step.tool}</span>
      <span className="question-flow__detail">{step.detail}</span>
      <span className="question-flow__status">Complete</span>
    </>
  );
}

function AudienceStepBody({ step }: { step: AudienceStep }) {
  return (
    <>
      <span className="question-flow__heading">{step.title}</span>
      <span className="question-flow__detail">{step.detail}</span>
    </>
  );
}

export function McpDocsExpandableList({ variant }: McpDocsExpandableListProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [openId, setOpenId] = useState<string | null>(null);
  const [visibleStepCount, setVisibleStepCount] = useState(0);
  const animationTokenRef = useRef(0);

  const isQuestions = variant === "questions";
  const hint = isQuestions ? QUESTIONS_LIST_HINT : AUDIENCE_LIST_HINT;
  const listClass = isQuestions ? "question-list" : "audience-list";
  const itemClass = isQuestions ? "question-item" : "audience-item";
  const triggerClass = isQuestions
    ? "question-item__trigger"
    : "audience-item__trigger";
  const openClass = isQuestions ? "question-item--open" : "audience-item--open";
  const flowLabel = isQuestions ? "Likely tool sequence" : "How they use it";

  const items = isQuestions ? EXAMPLE_QUESTION_CARDS : AUDIENCE_CARDS;

  const getSteps = useCallback(
    (id: string) => {
      if (isQuestions) {
        return QUESTION_TOOL_FLOWS[id] ?? [];
      }
      return AUDIENCE_DETAILS[id] ?? [];
    },
    [isQuestions],
  );

  const animateSteps = useCallback(
    (stepCount: number, token: number) => {
      if (stepCount === 0) {
        return;
      }

      const delay = prefersReducedMotion ? 0 : FLOW_STEP_DELAY_MS;

      if (delay === 0) {
        setVisibleStepCount(stepCount);
        return;
      }

      setVisibleStepCount(0);
      for (let index = 0; index < stepCount; index += 1) {
        window.setTimeout(() => {
          if (token !== animationTokenRef.current) {
            return;
          }
          setVisibleStepCount(index + 1);
        }, index * delay);
      }
    },
    [prefersReducedMotion],
  );

  const handleToggle = (id: string) => {
    if (openId === id) {
      setOpenId(null);
      setVisibleStepCount(0);
      return;
    }

    animationTokenRef.current += 1;
    const token = animationTokenRef.current;
    const steps = getSteps(id);
    setOpenId(id);
    animateSteps(steps.length, token);
  };

  return (
    <>
      <p
        className={isQuestions ? "question-list__hint" : "audience-list__hint"}
      >
        {hint}
      </p>
      <ul className={listClass}>
        {items.map((item) => {
          const panelId = `${variant}-flow-${item.id}`;
          const isOpen = openId === item.id;
          const steps = getSteps(item.id);
          const title = isQuestions
            ? (item as (typeof EXAMPLE_QUESTION_CARDS)[number]).question
            : (item as (typeof AUDIENCE_CARDS)[number]).title;
          const note = item.note;

          return (
            <li
              className={isOpen ? `${itemClass} ${openClass}` : itemClass}
              key={item.id}
            >
              <button
                aria-controls={panelId}
                aria-expanded={isOpen}
                className={triggerClass}
                onClick={() => {
                  handleToggle(item.id);
                }}
                type="button"
              >
                <span
                  className={
                    isQuestions ? "question-item__text" : "audience-item__text"
                  }
                >
                  {title}
                </span>
                <span
                  className={
                    isQuestions ? "question__note" : "audience-item__note"
                  }
                >
                  {note}
                </span>
              </button>
              <div
                aria-live="polite"
                className="question-flow"
                hidden={!isOpen}
                id={panelId}
              >
                <p className="question-flow__label">{flowLabel}</p>
                <ol className="question-flow__steps">
                  {steps.map((step, index) => {
                    const stepVisible = isOpen && index < visibleStepCount;
                    return (
                      <li
                        className={
                          stepVisible
                            ? "question-flow__step is-visible"
                            : "question-flow__step"
                        }
                        key={`${item.id}-step-${index}`}
                      >
                        <span className="question-flow__step-index">
                          {index + 1}
                        </span>
                        <span className="question-flow__step-body">
                          {isQuestions ? (
                            <QuestionStepBody step={step as QuestionToolStep} />
                          ) : (
                            <AudienceStepBody step={step as AudienceStep} />
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
