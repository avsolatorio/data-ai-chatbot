"use client";

import { type MouseEvent, useEffect } from "react";
import type { NavLink } from "./mcp-docs-content";
import {
  getMcpDocsScrollMarker,
  getMcpDocsScrollRoot,
  isMcpDocsNearBottom,
  scrollMcpDocsToId,
} from "./mcp-docs-scroll";

type McpDocsTocProps = {
  items: NavLink[];
};

function getTocSpyTarget(id: string): HTMLElement | null {
  const element = document.getElementById(id);
  if (!element) {
    return null;
  }

  if (id === "technical") {
    return document.getElementById("technical-heading") ?? element;
  }

  const heading = element.querySelector(
    ":scope > h2, :scope > h3, :scope > .section__title",
  );
  return (heading as HTMLElement | null) ?? element;
}

export function McpDocsToc({ items }: McpDocsTocProps) {
  useEffect(() => {
    const sections: {
      id: string;
      link: HTMLAnchorElement;
      target: HTMLElement;
    }[] = [];

    for (const item of items) {
      const id = item.href.slice(1);
      const link = document.querySelector<HTMLAnchorElement>(
        `.docs-toc__list a[href="${item.href}"]`,
      );
      const target = getTocSpyTarget(id);
      if (link && target) {
        sections.push({ id, link, target });
      }
    }

    if (sections.length === 0) {
      return;
    }

    let ticking = false;

    const setActiveLink = (activeId: string) => {
      for (const { id, link } of sections) {
        const isActive = id === activeId;
        link.classList.toggle("docs-toc__link--active", isActive);
        if (isActive) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      }
    };

    const updateActiveLink = () => {
      ticking = false;

      if (isMcpDocsNearBottom()) {
        setActiveLink(sections.at(-1)?.id ?? sections[0].id);
        return;
      }

      const marker = getMcpDocsScrollMarker();
      let activeId = sections[0].id;

      for (const { id, target } of sections) {
        if (target.getBoundingClientRect().top <= marker) {
          activeId = id;
        }
      }

      setActiveLink(activeId);
    };

    const scheduleUpdate = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateActiveLink);
      }
    };

    const scrollRoot = getMcpDocsScrollRoot();
    const scrollTarget: HTMLElement | Window = scrollRoot ?? window;

    scrollTarget.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });
    updateActiveLink();

    return () => {
      scrollTarget.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [items]);

  const handleTocClick = (
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    event.preventDefault();
    const id = href.slice(1);
    if (id) {
      scrollMcpDocsToId(id);
    }
  };

  return (
    <aside aria-label="On this page" className="docs-toc">
      <p className="docs-toc__label">On this page</p>
      <nav>
        <ul className="docs-toc__list">
          {items.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={(event) => {
                  handleTocClick(event, link.href);
                }}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
