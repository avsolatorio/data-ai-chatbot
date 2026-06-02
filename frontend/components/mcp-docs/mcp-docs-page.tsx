import Link from "next/link";
import { appConfig } from "@/lib/config";
import { McpDocsConnectSection } from "./mcp-docs-connect-section";
import {
  AGENT_SAFE_CARDS,
  AGENT_WORKFLOW,
  ARCHITECTURE_LAYERS,
  ARCHITECTURE_SECTION,
  CAPABILITY_CARDS,
  CHART_FLOW_LEAD,
  CHART_TYPES,
  DATA_SOURCES_SECTION,
  FOOTER_LINKS,
  HEALTH_ROWS,
  HEALTH_SECTION,
  MCP_APPS,
  MCP_APPS_SECTION,
  MCP_DOCS_NAV,
  MCP_PROMPTS,
  MCP_RESOURCES,
  MCP_TOOLS_ANALYSIS,
  MCP_TOOLS_DISCOVERY,
  OUTCOME_CARDS,
  OVERVIEW_SECTION,
  PACKAGES,
  QUESTIONS_SECTION_INTRO,
  TECHNICAL_SECTION,
  VALUE_SECTION,
} from "./mcp-docs-content";
import { McpDocsExpandableList } from "./mcp-docs-expandable-list";
import { McpDocsToc } from "./mcp-docs-toc";
import { McpDocsTopbar } from "./mcp-docs-topbar";

function DocsTable({
  rows,
  nameHeader = "Name",
  descHeader = "Description",
}: {
  rows: { name: string; description: string }[];
  nameHeader?: string;
  descHeader?: string;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col">{nameHeader}</th>
            <th scope="col">{descHeader}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <td>
                <code>{row.name}</code>
              </td>
              <td>{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function McpDocsPage() {
  return (
    <div className="mcp-docs">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <McpDocsTopbar />

      <div className="site-hero">
        <div className="site-hero__inner">
          <h1>World Bank development data through Data360 MCP</h1>
          <p className="hero__lead">
            Poverty, growth, gender, climate, health, and thousands of other
            indicators come from the{" "}
            <a
              href="https://data360.worldbank.org"
              rel="noopener noreferrer"
              target="_blank"
            >
              Data360 Platform
            </a>
            —the Bank&apos;s catalog for development data.
          </p>
          <p className="hero__sub">
            The server uses the{" "}
            <a
              href="https://modelcontextprotocol.io"
              rel="noopener noreferrer"
              target="_blank"
            >
              Model Context Protocol (MCP)
            </a>
            . Point Cursor, VS Code, or a custom app at this server so an AI
            agent can work with those indicators on your behalf.
          </p>
          <div className="hero__actions">
            <a className="btn btn--primary" href="#value">
              What agents can do
            </a>
            <a className="btn btn--secondary" href="#connect">
              Connect your agent
            </a>
          </div>
        </div>
      </div>

      <main id="main">
        <div className="docs-layout">
          <McpDocsToc items={MCP_DOCS_NAV} />
          <div className="docs-content">
            <section
              aria-labelledby="data360-chat-heading"
              className="section"
              id="data360-chat"
            >
              <div className="notice">
                <h2
                  className="section__title section__title--compact"
                  id="data360-chat-heading"
                >
                  Powers {appConfig.sidebar.appName}
                </h2>
                <p>
                  {appConfig.sidebar.appName} is the World Bank&apos;s chat
                  interface for development data. It already calls this MCP
                  server for search, series, metadata, and charts. No extra MCP
                  setup is required unless you want a separate client.
                </p>
                <p className="notice__actions">
                  <Link className="btn btn--primary" href="/">
                    Open {appConfig.sidebar.appName}
                  </Link>
                  <a className="btn btn--secondary" href="#connect">
                    Connect an external client
                  </a>
                </p>
              </div>
            </section>

            <div className="section--user">
              <section
                aria-labelledby="overview-heading"
                className="section"
                id="overview"
              >
                <h2 className="section__title" id="overview-heading">
                  {OVERVIEW_SECTION.title}
                </h2>
                <p className="section__intro">
                  The Data360 MCP Server exposes the World Bank&apos;s{" "}
                  <a
                    href="https://data360.worldbank.org"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Data360 Platform
                  </a>{" "}
                  to any MCP-capable client. LLMs and agents need a structured
                  way to search indicators, check metadata and disaggregation,
                  fetch time-series data, and produce charts—without embedding
                  Data360-specific logic inside each client. This server fills
                  that role: it implements the{" "}
                  <a
                    href="https://modelcontextprotocol.io"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Model Context Protocol
                  </a>{" "}
                  so clients can discover and call a fixed set of tools, read
                  contextual resources (system prompts, codelists, schemas), and
                  optionally render tool results in interactive app UIs.
                </p>
                <p className="section__intro">
                  Every value returned by the server comes from the Data360
                  platform. The server is stateless with respect to user
                  sessions—it acts as a bridge between MCP clients and the
                  Data360 HTTP API.
                </p>
              </section>

              <section
                aria-labelledby="audience-heading"
                className="section"
                id="audience"
              >
                <h2 className="section__title" id="audience-heading">
                  Who this is for
                </h2>
                <McpDocsExpandableList variant="audience" />
              </section>

              <section
                aria-labelledby="value-heading"
                className="section"
                id="value"
              >
                <h2 className="section__title" id="value-heading">
                  {VALUE_SECTION.title}
                </h2>
                <p className="section__intro">{VALUE_SECTION.intro}</p>
                <ul className="outcome-grid">
                  {OUTCOME_CARDS.map((card) => (
                    <li className="outcome-card" key={card.title}>
                      <h3>{card.title}</h3>
                      <p>{card.description}</p>
                    </li>
                  ))}
                </ul>
              </section>

              <section
                aria-labelledby="questions-heading"
                className="section"
                id="questions"
              >
                <h2 className="section__title" id="questions-heading">
                  Example questions
                </h2>
                <p className="section__intro">{QUESTIONS_SECTION_INTRO}</p>
                <McpDocsExpandableList variant="questions" />
              </section>

              <section
                aria-labelledby="charts-heading"
                className="section"
                id="charts"
              >
                <h2 className="section__title" id="charts-heading">
                  Charts and visualizations
                </h2>
                <p className="section__intro">
                  For charts, the agent calls <code>data360_get_viz_spec</code>{" "}
                  (single indicator) or{" "}
                  <code>data360_get_multi_indicator_viz_spec</code> (2–4
                  indicators). The server loads series from Data360 and returns
                  Vega-Lite JSON plus a chart URL. For tables or numbers in
                  text, use <code>data360_get_data</code> or the aggregation
                  tools listed under Technical reference—they are separate
                  calls.
                </p>
                <div className="viz-panel">
                  <p className="viz-panel__lead">
                    <strong>Chart flow:</strong> {CHART_FLOW_LEAD}
                  </p>
                  <ul>
                    {CHART_TYPES.map((t) => (
                      <li key={t.title}>
                        <strong>{t.title}</strong> — {t.description}
                      </li>
                    ))}
                  </ul>
                  <p className="viz-panel__footnote">
                    Charts use Vega-Lite. Your MCP client opens the URL the
                    server returns.
                  </p>
                </div>
              </section>

              <section
                aria-labelledby="data-sources-heading"
                className="section"
                id="data-sources"
              >
                <h2 className="section__title" id="data-sources-heading">
                  {DATA_SOURCES_SECTION.title}
                </h2>
                <p className="section__intro">
                  The server&apos;s only persistent data source is the World
                  Bank Data360 HTTP API. All indicator search, metadata,
                  disaggregation, and time-series data are fetched from Data360
                  endpoints. There is no local database—the server is stateless
                  aside from in-memory caches (e.g. codelists). All Data360
                  databases are supported. Use{" "}
                  <code>data360_list_indicators</code> to discover indicators in
                  any database, or load <code>data360://databases</code> for a
                  reference list.
                </p>
              </section>

              <section
                aria-labelledby="agent-safe-heading"
                className="section"
                id="agent-safe"
              >
                <h2 className="section__title" id="agent-safe-heading">
                  Agent-safe design
                </h2>
                <p className="section__intro">
                  The server is designed to reduce common LLM data errors
                  through composable tools, coverage validation, and curated
                  resources.
                </p>
                <ul className="feature-grid">
                  {AGENT_SAFE_CARDS.map((card) => (
                    <li className="feature-card" key={card.title}>
                      <h3>{card.title}</h3>
                      <p>{card.description}</p>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <div className="docs-technical" id="technical">
              <div className="docs-technical__header">
                <h2
                  className="section__title section__title--technical"
                  id="technical-heading"
                >
                  {TECHNICAL_SECTION.title}
                </h2>
                <p className="section__technical-lede">
                  {TECHNICAL_SECTION.intro}
                </p>
              </div>

              <section
                aria-labelledby="capabilities-heading"
                className="section section--in-technical"
                id="capabilities"
              >
                <h3 className="section__title" id="capabilities-heading">
                  Server capabilities
                </h3>
                <p className="section__intro">
                  Search, metadata, series retrieval, code lists, and bundled
                  prompt resources exposed to MCP clients.
                </p>
                <ul className="feature-list">
                  {CAPABILITY_CARDS.map((card) => (
                    <li className="feature-card" key={card.title}>
                      <h4>{card.title}</h4>
                      <p>{card.description}</p>
                    </li>
                  ))}
                </ul>
              </section>

              <section
                aria-labelledby="tools-heading"
                className="section section--in-technical"
                id="tools"
              >
                <h3 className="section__title" id="tools-heading">
                  MCP tools
                </h3>
                <p className="section__intro">
                  Typical order: search (or search datasets), optional
                  disaggregation, then get_data, aggregation tools, or viz
                  specs. Do not guess database_id or indicator_id—obtain them
                  from search results first.
                </p>
                <h4 className="section__title section__title--sub">
                  Discovery and data
                </h4>
                <DocsTable rows={MCP_TOOLS_DISCOVERY} nameHeader="Tool" />
                <h4 className="section__title section__title--sub">
                  Analysis and visualization
                </h4>
                <DocsTable rows={MCP_TOOLS_ANALYSIS} nameHeader="Tool" />
                <h4 className="section__title section__title--sub">
                  Recommended agent workflow
                </h4>
                <pre className="workflow-box">{AGENT_WORKFLOW}</pre>
              </section>

              <section
                aria-labelledby="resources-heading"
                className="section section--in-technical"
                id="resources"
              >
                <h3 className="section__title" id="resources-heading">
                  MCP resources
                </h3>
                <p className="section__intro">
                  Read-only URIs for prompts and reference data. Most
                  integrations load data360://system-prompt and
                  data360://context in the system message; larger references can
                  be fetched on demand.
                </p>
                <DocsTable rows={MCP_RESOURCES} nameHeader="Resource" />
              </section>

              <section
                aria-labelledby="prompts-heading"
                className="section section--in-technical"
                id="prompts"
              >
                <h3 className="section__title" id="prompts-heading">
                  MCP prompts
                </h3>
                <p className="section__intro">
                  Parameterized playbooks registered with prompts/list and
                  prompts/get. Hosts fetch a prompt by name and prepend the
                  returned text to the conversation for a specific user turn.
                </p>
                <DocsTable
                  descHeader="When to use"
                  nameHeader="Prompt"
                  rows={MCP_PROMPTS.map((p) => ({
                    name: p.name,
                    description: p.description,
                  }))}
                />
                <p className="section__intro section__intro--after-table">
                  See data360://agent-recipe for recommended composition order
                  with LangGraph and data360-mcp-agent.
                </p>
              </section>

              <section
                aria-labelledby="architecture-heading"
                className="section section--in-technical"
                id="architecture"
              >
                <h3 className="section__title" id="architecture-heading">
                  {ARCHITECTURE_SECTION.title}
                </h3>
                <p className="section__intro">{ARCHITECTURE_SECTION.intro}</p>
                <pre className="architecture-diagram">
                  {ARCHITECTURE_SECTION.diagram}
                </pre>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Layer</th>
                        <th scope="col">Technology</th>
                        <th scope="col">Purpose</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ARCHITECTURE_LAYERS.map((row) => (
                        <tr key={row.layer}>
                          <td>{row.layer}</td>
                          <td>{row.technology}</td>
                          <td>{row.purpose}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="section__intro section__intro--after-table">
                  For the full architecture document, see{" "}
                  <a
                    href={ARCHITECTURE_SECTION.docLink}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    architecture-data360-mcp.md
                  </a>
                  .
                </p>
              </section>

              <section
                aria-labelledby="mcp-apps-heading"
                className="section section--in-technical"
                id="mcp-apps"
              >
                <h3 className="section__title" id="mcp-apps-heading">
                  MCP Apps
                </h3>
                <p className="section__intro">{MCP_APPS_SECTION.intro}</p>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">App</th>
                        <th scope="col">URI</th>
                        <th scope="col">Tool</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MCP_APPS.map((row) => (
                        <tr key={row.uri}>
                          <td>{row.app}</td>
                          <td>
                            <code>{row.uri}</code>
                          </td>
                          <td>
                            <code>{row.tool}</code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="section__intro section__intro--after-table">
                  See{" "}
                  <a
                    href={MCP_APPS_SECTION.notesLink}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    MCP Apps implementation notes
                  </a>{" "}
                  for alignment with the official MCP ext-apps extension.
                </p>
              </section>

              <section
                aria-labelledby="packages-heading"
                className="section section--in-technical"
                id="packages"
              >
                <h3 className="section__title" id="packages-heading">
                  Client libraries and examples
                </h3>
                <p className="section__intro">
                  The repository includes packages and examples for common
                  integration patterns.
                </p>
                <ul className="package-list">
                  {PACKAGES.map((pkg) => (
                    <li key={pkg.name}>
                      <strong>
                        <code>{pkg.name}</code>
                      </strong>{" "}
                      — {pkg.description}{" "}
                      <a
                        href={pkg.href}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {pkg.linkLabel}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>

              <McpDocsConnectSection />

              <section
                aria-labelledby="health-heading"
                className="section section--in-technical"
                id="health"
              >
                <h3 className="section__title" id="health-heading">
                  {HEALTH_SECTION.title}
                </h3>
                <p className="section__intro">
                  {HEALTH_SECTION.intro} See{" "}
                  <a
                    href={HEALTH_SECTION.devLink}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    DEVELOPMENT.md
                  </a>{" "}
                  for environment variables and configuration.
                </p>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Route</th>
                        <th scope="col">Purpose</th>
                        <th scope="col">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {HEALTH_ROWS.map((row) => (
                        <tr key={row.route}>
                          <td>
                            <code>{row.route}</code>
                          </td>
                          <td>{row.purpose}</td>
                          <td>
                            <code>{row.status}</code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="section__intro section__intro--after-table">
                  {HEALTH_SECTION.footnote}
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <div className="site-footer__main">
            <div className="site-footer__contact">
              <p className="site-footer__team">
                <strong>AI for Data – Data for AI</strong>
                <span className="site-footer__org">
                  Development Data Group · World Bank Group
                </span>
              </p>
              <a href="mailto:ai4data@worldbank.org">ai4data@worldbank.org</a>
            </div>
            <nav
              aria-label="Related documentation"
              className="site-footer__nav"
            >
              <ul className="site-footer__links">
                {FOOTER_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <p className="site-footer__fine-print">
            MIT License with World Bank IGO Rider · Built with{" "}
            <a
              href="https://github.com/jlowin/fastmcp"
              rel="noopener noreferrer"
              target="_blank"
            >
              FastMCP
            </a>{" "}
            &{" "}
            <a
              href="https://modelcontextprotocol.io"
              rel="noopener noreferrer"
              target="_blank"
            >
              MCP
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
