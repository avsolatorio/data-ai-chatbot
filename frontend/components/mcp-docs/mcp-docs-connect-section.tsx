"use client";

import { useState } from "react";
import { McpDocsCodeSnippet } from "./mcp-docs-code-snippet";
import {
  CONNECT_SECTION_INTRO,
  EXAMPLE_DATABASES,
  LANGGRAPH_ENV,
  MCP_ENDPOINTS,
  MCP_JSON_CLAUDE,
  MCP_JSON_CURSOR,
  MCP_JSON_LOCAL,
} from "./mcp-docs-content";

const CLIENT_TABS = [
  { id: "cursor", label: "Cursor / VS Code", code: MCP_JSON_CURSOR },
  { id: "claude", label: "Claude Desktop", code: MCP_JSON_CLAUDE },
  { id: "local", label: "Local server", code: MCP_JSON_LOCAL },
] as const;

export function McpDocsConnectSection() {
  const [activeTab, setActiveTab] =
    useState<(typeof CLIENT_TABS)[number]["id"]>("cursor");

  const activeCode =
    CLIENT_TABS.find((t) => t.id === activeTab)?.code ?? MCP_JSON_CURSOR;

  return (
    <section
      aria-labelledby="connect-heading"
      className="section section--in-technical"
      id="connect"
    >
      <h3 className="section__title" id="connect-heading">
        Connect your agent
      </h3>

      <p className="section__intro">
        {CONNECT_SECTION_INTRO} <a href="#data360-chat">Data360 Chat</a>
      </p>

      <div className="connect-steps">
        <article className="connect-step">
          <h3 className="connect-step__title">1. Choose an endpoint</h3>
          <p className="section__intro">
            Use streamable HTTP at the <code>/mcp</code> path (default). For
            SSE, set <code>MCP_TRANSPORT=sse</code> on the server and point
            clients at <code>/sse</code> (example:{" "}
            <code>http://localhost:8021/sse</code>). Other org-specific hosts
            and paths are documented in the{" "}
            <a
              href="https://github.com/worldbank/data360-mcp"
              rel="noopener noreferrer"
              target="_blank"
            >
              GitHub repository
            </a>
            .
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Environment</th>
                  <th scope="col">HTTP URL</th>
                </tr>
              </thead>
              <tbody>
                {MCP_ENDPOINTS.map((row) => (
                  <tr key={row.url}>
                    <td>{row.environment}</td>
                    <td>
                      <code>{row.url}</code>
                      {row.note ? (
                        <p className="panel__text">{row.note}</p>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="connect-step">
          <h3 className="connect-step__title">2. Configure your MCP client</h3>
          <p className="section__intro">
            Add the server to your client config. Streamable HTTP (
            <code>type: &quot;http&quot;</code>) is the recommended transport
            for Cursor and compatible hosts.
          </p>
          <div
            aria-label="MCP client configuration examples"
            className="connect-tabs"
            role="tablist"
          >
            {CLIENT_TABS.map((tab) => (
              <button
                aria-selected={activeTab === tab.id}
                className={
                  activeTab === tab.id
                    ? "connect-tab connect-tab--active"
                    : "connect-tab"
                }
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div role="tabpanel">
            <McpDocsCodeSnippet code={activeCode} language="json" />
          </div>
        </article>

        <article className="connect-step">
          <h3 className="connect-step__title">
            3. Load MCP resources in your agent
          </h3>
          <ol className="connect-step__list">
            <li>
              Load <code>data360://system-prompt</code> in your agent system
              context (required for reliable tool use).
            </li>
            <li>
              Load <code>data360://context</code> and{" "}
              <code>data360://agent-recipe</code> for time-aware queries and
              host integration patterns.
            </li>
            <li>
              Optionally fetch <code>data360://search-usage</code> and{" "}
              <code>data360://codelists</code> for discovery and code
              resolution.
            </li>
            <li>
              Tables: search → get_disaggregation (optional) → get_data. Charts:
              search → get_disaggregation → get_viz_spec (fetches its own data).
            </li>
          </ol>
        </article>

        <article className="connect-step">
          <h3 className="connect-step__title">
            4. Authentication (hosted / APIM)
          </h3>
          <p className="section__intro">
            World Bank–hosted endpoints may require a Bearer token or Azure AD
            client credentials. On the server, set{" "}
            <code>MCP_INTERNAL=true</code> and <code>MCP_AUTH_SCOPE</code> for
            APIM; clients may pass an <code>Authorization</code> header in{" "}
            <code>mcp.json</code> when required. See{" "}
            <a
              href="https://github.com/worldbank/data360-mcp/blob/main/DEVELOPMENT.md"
              rel="noopener noreferrer"
              target="_blank"
            >
              DEVELOPMENT.md
            </a>{" "}
            for environment-specific setup (not covered here).
          </p>
        </article>

        <article className="connect-step">
          <h3 className="connect-step__title">5. Verify the connection</h3>
          <p className="section__intro">
            Use the{" "}
            <a
              href="https://modelcontextprotocol.io"
              rel="noopener noreferrer"
              target="_blank"
            >
              MCP Inspector
            </a>{" "}
            or your IDE&apos;s MCP panel to list tools. From the repo:{" "}
            <code>scripts/test_mcp_client.py</code> (
            <a
              href="https://github.com/worldbank/data360-mcp"
              rel="noopener noreferrer"
              target="_blank"
            >
              data360-mcp on GitHub
            </a>
            ).
          </p>
        </article>

        <article className="connect-step">
          <h3 className="connect-step__title">6. Docker and containers</h3>
          <p className="section__intro">
            From a container, use <code>host.docker.internal</code> instead of{" "}
            <code>localhost</code> to reach an MCP server on the host machine.
          </p>
        </article>

        <article className="connect-step">
          <h3 className="connect-step__title">7. LangGraph / Python agents</h3>
          <p className="section__intro">
            Set environment variables before running your agent (see{" "}
            <code>data360-mcp-agent</code> package in the repo):
          </p>
          <McpDocsCodeSnippet code={LANGGRAPH_ENV} language="bash" />
        </article>

        <article className="connect-step">
          <h3 className="connect-step__title">8. Self-host locally</h3>
          <p className="section__intro">
            Install and run the server on your machine: see the{" "}
            <a
              href="https://github.com/worldbank/data360-mcp#readme"
              rel="noopener noreferrer"
              target="_blank"
            >
              GitHub README
            </a>
            .
          </p>
        </article>

        <div className="connect-panel">
          <h3 className="connect-step__title">Databases (examples)</h3>
          <p className="connect-panel__text">
            All Data360 databases are supported; list indicators with{" "}
            <code>data360_list_indicators</code>.
          </p>
          <ul className="connect-panel__list">
            {EXAMPLE_DATABASES.map((db) => (
              <li key={db.id}>
                <strong>{db.id}</strong> — {db.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
