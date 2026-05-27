export type NavLink = { href: string; label: string };

export const MCP_DOCS_NAV: NavLink[] = [
  { href: "#data360-chat", label: "Data360 Chat" },
  { href: "#value", label: "What agents can do" },
  { href: "#questions", label: "Example questions" },
  { href: "#charts", label: "Charts" },
  { href: "#technical", label: "Technical reference" },
  { href: "#capabilities", label: "Capabilities" },
  { href: "#tools", label: "Tools" },
  { href: "#resources", label: "Resources" },
  { href: "#connect", label: "Connect" },
];

export const VALUE_SECTION = {
  title: "What your agent can do",
  intro:
    "An AI agent connected over MCP can query official World Bank series from Data360: search the catalog, pull time series, read indicator metadata, and request charts. Every value comes from Data360 APIs, not from model training.",
} as const;

export const OUTCOME_CARDS = [
  {
    title: "Countries",
    description:
      "Search indicators and confirm coverage for the countries named in the prompt.",
  },
  {
    title: "Time series",
    description:
      "Retrieve values by country, year, and breakdowns such as sex, age, or urban/rural.",
  },
  {
    title: "Metadata",
    description:
      "Surface source, definition, methodology, and known limitations for an indicator.",
  },
  {
    title: "Charts",
    description:
      "Build line, bar, or other charts and return a URL the MCP client can display.",
  },
] as const;

export const QUESTIONS_SECTION_INTRO =
  "Sample prompts for a connected agent in Cursor, VS Code, or another MCP client. The agent resolves countries, selects indicators, and checks coverage before answering.";

export const CHARTS_SECTION_INTRO =
  "For charts, the agent calls visualization tools. The server loads the series from Data360 and returns a Vega-Lite spec and chart URL. For tables or numbers in text, it uses the data tools listed under Technical reference.";

export const CHART_FLOW_LEAD =
  "Search for the indicator, confirm available years and countries, then request the chart.";

export const TECHNICAL_SECTION = {
  title: "Technical reference",
  intro:
    "MCP tools, bundled resources, and connection details for developers wiring Cursor, Claude Desktop, LangGraph, or a custom client.",
} as const;

export const EXAMPLE_QUESTIONS = [
  {
    question:
      "How has GDP per capita changed in Kenya over the last two decades?",
    note: "Catalog search, Kenya coverage check, then the time series.",
  },
  {
    question:
      "Which indicators in WDI relate to female labor force participation, and do they include Bangladesh?",
    note: "WDI search with a Bangladesh coverage filter.",
  },
  {
    question:
      "What is the official definition and source for this indicator—and what footnotes should I mention?",
    note: "Metadata fields for definition, source, and footnotes.",
  },
  {
    question:
      "Plot a line chart comparing access to electricity in three countries since 2010.",
    note: "Indicator lookup, disaggregation check, then chart spec.",
  },
] as const;

export const CHART_TYPES = [
  { title: "Line and area", description: "trends over years or periods" },
  {
    title: "Bar",
    description: "discrete periods or categories when appropriate",
  },
  {
    title: "Scatter / point",
    description: "relationships when the data supports it",
  },
] as const;

export const CAPABILITY_CARDS = [
  {
    title: "Indicator search",
    description:
      "Full-text search with metadata; optional country filter to limit results to series that actually exist.",
  },
  {
    title: "Metadata",
    description:
      "Methodology, definitions, limitations, and statistical concepts for each indicator.",
  },
  {
    title: "Time series",
    description:
      "Historical values with filters for country, period, sex, age, urbanization, and other dimensions.",
  },
  {
    title: "Bundled resources",
    description:
      "System prompt, codelists, and usage notes exposed as MCP resources under data360://.",
  },
  {
    title: "Composable tools",
    description:
      "Small, focused tools that validate coverage, codes, and filters before returning data.",
  },
] as const;

export type ToolRow = { name: string; description: string };

export const MCP_TOOLS: ToolRow[] = [
  {
    name: "data360_search_indicators",
    description:
      "Search with enriched metadata; use required_country for coverage. Returns covers_country, latest_data, dimensions.",
  },
  {
    name: "data360_get_data",
    description:
      "Fetch data points with filters (country, time period, SEX, AGE, etc.).",
  },
  {
    name: "data360_get_metadata",
    description: "Indicator metadata; use select_fields to limit payload.",
  },
  {
    name: "data360_get_disaggregation",
    description:
      "Available filter values (countries, years, dimensions) per indicator.",
  },
  {
    name: "data360_find_codelist_value",
    description: 'Resolve names to codes (e.g. "Kenya" → KEN, "female" → F).',
  },
  {
    name: "data360_list_indicators",
    description: "List all indicators for a database.",
  },
  {
    name: "data360_get_viz_spec",
    description:
      "Fetch a series and return a Vega-Lite spec and chart URL. Call get_disaggregation first for valid filters. Does not consume get_data output.",
  },
  {
    name: "data360_get_supported_chart_types",
    description: "List supported chart types and data requirements.",
  },
  {
    name: "data360_get_data_api_url",
    description: "Low-level: direct Data360 data API URL helper.",
  },
];

export const MCP_RESOURCES: ToolRow[] = [
  {
    name: "data360://system-prompt",
    description: "Workflow and tool-use guidance for the system message",
  },
  {
    name: "data360://databases",
    description: "Available databases (WB_WDI, WB_SSGD, …)",
  },
  {
    name: "data360://codelists",
    description: "Codelist reference (REF_AREA, SEX, AGE, …)",
  },
  {
    name: "data360://metadata-fields",
    description: "Field mapping for smart question routing",
  },
  {
    name: "data360://data-filters",
    description: "Available filters and usage guidance",
  },
  {
    name: "data360://search-usage",
    description: "Search examples and best practices",
  },
];

/** World Bank public (external) MCP endpoint for agents and IDEs. */
export const PUBLIC_MCP_URL = "https://maimcpext.worldbank.org/ext/data360/mcp";

export const AGENT_WORKFLOW = `Tables / numbers in text:
1. data360_search_indicators(query, required_country="Kenya")
2. data360_get_disaggregation(database_id, indicator_id)  — optional; years and dimensions
3. data360_get_data(database_id, indicator_id, filters)

Charts:
1. data360_search_indicators(...)
2. data360_get_disaggregation(...)  — recommended before get_viz_spec
3. data360_get_viz_spec(database_id, indicator_id, country_code, start_year, end_year, ...)
   Fetches data internally; does not take get_data output.`;

export const MCP_ENDPOINTS = [
  {
    environment: "Public (external)",
    url: PUBLIC_MCP_URL,
    note: "Recommended for Cursor, Claude Desktop, and custom agents",
  },
  {
    environment: "Local dev",
    url: "http://localhost:8000/mcp",
    note: "Port matches your server (see README)",
  },
] as const;

export const MCP_JSON_CURSOR = `{
  "mcpServers": {
    "data360-mcp": {
      "url": "${PUBLIC_MCP_URL}",
      "type": "http"
    }
  }
}`;

export const MCP_JSON_CLAUDE = `{
  "mcpServers": {
    "data360-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "${PUBLIC_MCP_URL}"
      ]
    }
  }
}`;

export const MCP_JSON_LOCAL = `{
  "mcpServers": {
    "data360-mcp": {
      "url": "http://localhost:8000/mcp",
      "type": "http"
    }
  }
}`;

export const LANGGRAPH_ENV = `DATA360_MCP_URL=${PUBLIC_MCP_URL}
DATA360_MCP_TRANSPORT=streamable_http
OPENAI_API_KEY=your-key`;

export const EXAMPLE_DATABASES = [
  { id: "WB_WDI", label: "World Development Indicators" },
  {
    id: "WB_SSGD",
    label: "Social Sustainability and Global Database",
  },
] as const;

export const FOOTER_LINKS = [
  {
    href: "https://github.com/worldbank/data360-mcp/blob/main/docs/overview.md",
    label: "Documentation (markdown overview)",
  },
  {
    href: "https://github.com/worldbank/data360-mcp/blob/main/DEVELOPMENT.md",
    label: "DEVELOPMENT.md",
  },
  {
    href: "https://github.com/worldbank/data360-mcp/blob/main/LICENSE",
    label: "License",
  },
  {
    href: "https://github.com/worldbank/data360-mcp/blob/main/WB-IGO-RIDER.md",
    label: "IGO Rider",
  },
] as const;

export const CONNECT_SECTION_INTRO =
  "Required only for external MCP clients (Cursor, Claude Desktop, LangGraph, and similar). If you use Data360 Chat, the server is already configured—see the section above.";
