"use client";

import Link from "next/link";
import { scrollMcpDocsToTop } from "./mcp-docs-scroll";

export function McpDocsTopbar() {
  return (
    <header className="site-topbar">
      <div className="site-topbar__inner">
        <button
          className="site-brand"
          onClick={() => {
            scrollMcpDocsToTop();
          }}
          type="button"
        >
          Data360 MCP
        </button>
        <ul className="site-topbar__links">
          <li>
            <a href="#connect">Connect</a>
          </li>
          <li>
            <a
              href="https://github.com/worldbank/data360-mcp"
              rel="noopener noreferrer"
              target="_blank"
            >
              GitHub
            </a>
          </li>
          <li>
            <Link href="/">Back to chat</Link>
          </li>
        </ul>
      </div>
    </header>
  );
}
