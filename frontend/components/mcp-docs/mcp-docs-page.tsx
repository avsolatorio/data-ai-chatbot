import Link from "next/link";
import { appConfig } from "@/lib/config";
import { McpDocsConnectSection } from "./mcp-docs-connect-section";
import {
  AGENT_WORKFLOW,
  CAPABILITY_CARDS,
  CHART_FLOW_LEAD,
  CHART_TYPES,
  CHARTS_SECTION_INTRO,
  EXAMPLE_QUESTIONS,
  FOOTER_LINKS,
  MCP_DOCS_NAV,
  MCP_RESOURCES,
  MCP_TOOLS,
  OUTCOME_CARDS,
  QUESTIONS_SECTION_INTRO,
  TECHNICAL_SECTION,
  VALUE_SECTION,
} from "./mcp-docs-content";

function DocsTable({
  rows,
}: {
  rows: { name: string; description: string }[];
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Description</th>
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

function DocsToc() {
  return (
    <aside aria-label="On this page" className="docs-toc">
      <p className="docs-toc__label">On this page</p>
      <nav>
        <ul className="docs-toc__list">
          {MCP_DOCS_NAV.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export function McpDocsPage() {
  return (
    <div className="mcp-docs">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <header className="site-topbar">
        <div className="site-topbar__inner">
          <span className="site-brand">Data360 MCP</span>
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

      <div className="site-hero">
        <div className="site-hero__inner">
          {/* <p className="hero__eyebrow">World Bank · Development Data Group</p> */}
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
          <DocsToc />
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

            <section
              aria-labelledby="value-heading"
              className="section"
              id="value"
            >
              <h2 className="section__title" id="value-heading">
                {VALUE_SECTION.title}
              </h2>
              <p className="section__intro">{VALUE_SECTION.intro}</p>
              <ul className="capability-grid">
                {OUTCOME_CARDS.map((card) => (
                  <li className="capability-item" key={card.title}>
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
              <ul className="example-list">
                {EXAMPLE_QUESTIONS.map((item) => (
                  <li key={item.question}>
                    {item.question}
                    <span className="question__note">{item.note}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section
              aria-labelledby="charts-heading"
              className="section"
              id="charts"
            >
              <h2 className="section__title" id="charts-heading">
                Charts and visualizations
              </h2>
              <p className="section__intro">{CHARTS_SECTION_INTRO}</p>
              <div className="prose-block">
                <p className="prose-block__lead">
                  <strong>Chart flow:</strong> {CHART_FLOW_LEAD}
                </p>
                <ul>
                  {CHART_TYPES.map((t) => (
                    <li key={t.title}>
                      <strong>{t.title}</strong> — {t.description}
                    </li>
                  ))}
                </ul>
                <p className="prose-block__footnote">
                  Charts use Vega-Lite. Your MCP client opens the URL the server
                  returns.
                </p>
              </div>
            </section>

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
                  Typical order: search, optional disaggregation, then get_data
                  or get_viz_spec.
                </p>
                <DocsTable rows={MCP_TOOLS} />
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
                  Read-only URIs for prompts and reference data. Load{" "}
                  <code>data360://system-prompt</code> in the system message for
                  most integrations.
                </p>
                <DocsTable rows={MCP_RESOURCES} />
              </section>

              <McpDocsConnectSection />
            </div>
          </div>
        </div>
      </main>

      {/* <footer className="site-footer">
        <div className="site-footer__inner">
          <p>
            <strong>AI for Data - Data for AI Team</strong>
            <br />
            <a href="mailto:ai4data@worldbank.org">ai4data@worldbank.org</a>
            <br />
            Development Data Group / Office of the World Bank Group Chief
            Statistician
            <br />
            World Bank Group
          </p>
          <p>
            {FOOTER_LINKS.map((link, i) => (
              <span key={link.href}>
                {i > 0 ? " · " : null}
                <a href={link.href} rel="noopener noreferrer" target="_blank">
                  {link.label}
                </a>
              </span>
            ))}
          </p>
          <p className="site-footer__meta">
            This project is licensed under the MIT License together with the
            World Bank IGO Rider. The Rider is procedural: it reserves World
            Bank privileges and immunities without adding restrictions to MIT
            permissions.
          </p>
          <p className="site-footer__built">
            Built with{" "}
            <a
              href="https://github.com/jlowin/fastmcp"
              rel="noopener noreferrer"
              target="_blank"
            >
              FastMCP
            </a>{" "}
            and the{" "}
            <a
              href="https://modelcontextprotocol.io"
              rel="noopener noreferrer"
              target="_blank"
            >
              Model Context Protocol
            </a>
            .
          </p>
        </div>
      </footer> */}
    </div>
  );
}
