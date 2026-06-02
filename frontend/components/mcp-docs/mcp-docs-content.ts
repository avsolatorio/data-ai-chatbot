export type NavLink = { href: string; label: string };

export const MCP_DOCS_NAV: NavLink[] = [
  { href: "#data360-chat", label: "Data360 Chat" },
  { href: "#overview", label: "Overview" },
  { href: "#audience", label: "Who this is for" },
  { href: "#value", label: "What agents can do" },
  { href: "#questions", label: "Example questions" },
  { href: "#charts", label: "Charts" },
  { href: "#data-sources", label: "Data sources" },
  { href: "#agent-safe", label: "Agent-safe design" },
  { href: "#technical", label: "Technical reference" },
  { href: "#capabilities", label: "Capabilities" },
  { href: "#tools", label: "Tools" },
  { href: "#resources", label: "Resources" },
  { href: "#prompts", label: "Prompts" },
  { href: "#architecture", label: "Architecture" },
  { href: "#mcp-apps", label: "MCP Apps" },
  { href: "#packages", label: "Packages" },
  { href: "#connect", label: "Connect" },
  { href: "#health", label: "Health" },
];

export const FLOW_STEP_DELAY_MS = 420;

export const OVERVIEW_SECTION = {
  title: "Overview",
  paragraphs: [
    "The Data360 MCP Server exposes the World Bank's Data360 Platform to any MCP-capable client. LLMs and agents need a structured way to search indicators, check metadata and disaggregation, fetch time-series data, and produce charts—without embedding Data360-specific logic inside each client. This server fills that role: it implements the Model Context Protocol so clients can discover and call a fixed set of tools, read contextual resources (system prompts, codelists, schemas), and optionally render tool results in interactive app UIs.",
    "Every value returned by the server comes from the Data360 platform. The server is stateless with respect to user sessions—it acts as a bridge between MCP clients and the Data360 HTTP API.",
  ],
} as const;

export type AudienceCard = {
  id: string;
  title: string;
  note: string;
};

export const AUDIENCE_CARDS: AudienceCard[] = [
  {
    id: "1",
    title: "Agent builders",
    note: "Developers wiring Cursor, Claude Desktop, LangGraph, or custom apps to official World Bank data.",
  },
  {
    id: "2",
    title: "Researchers and analysts",
    note: "Teams integrating development indicators into LLM workflows with verified sources.",
  },
  {
    id: "3",
    title: "Platform teams",
    note: "Organizations embedding Data360 data in chatbots, dashboards, or research assistants via MCP.",
  },
];

export type AudienceStep = { title: string; detail: string };

export const AUDIENCE_DETAILS: Record<string, AudienceStep[]> = {
  "1": [
    {
      title: "MCP clients",
      detail:
        "Cursor, Claude Desktop, VS Code, or a LangGraph agent wired to the hosted MCP URL.",
    },
    {
      title: "Bootstrap resources",
      detail:
        "Load data360://context and data360://agent-recipe before calling tools.",
    },
    {
      title: "Core workflow",
      detail:
        "search_indicators → get_disaggregation → get_data or get_viz_spec.",
    },
    {
      title: "Examples in repo",
      detail:
        "langchain-minimal, langchain-graph, and demo_web for local testing.",
    },
  ],
  "2": [
    {
      title: "Verified answers",
      detail:
        "Every value and definition comes from Data360—not from model memory.",
    },
    {
      title: "Citation-ready metadata",
      detail:
        "get_metadata for source, methodology, limitations, and statistical concepts.",
    },
    {
      title: "Coverage checks",
      detail:
        "required_country filters and get_disaggregation before drawing conclusions.",
    },
    {
      title: "Compact summaries",
      detail:
        "summarize_data, rank_countries, and compare_countries for report-ready output.",
    },
  ],
  "3": [
    {
      title: "Hosted MCP",
      detail:
        "Point production clients at the public MCP endpoint (APIM) with subscription key when required.",
    },
    {
      title: "Embed charts",
      detail:
        "@data360/mcp-ui and @data360/mcp-ui-angular for Vega chart cards in your UI.",
    },
    {
      title: "Agent graphs",
      detail:
        "data360-mcp-agent LangGraph nodes with optional gating and streaming events.",
    },
    {
      title: "Operations",
      detail:
        "GET /health and GET /ready for load balancers and uptime monitors.",
    },
  ],
};

export const VALUE_SECTION = {
  title: "What your agent can do",
  intro:
    "An AI agent connected over MCP can query official World Bank series from Data360: search the catalog, pull time series, read indicator metadata, and request charts. Every value comes from the Data360 platform, mitigating the risk of hallucination.",
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

export const QUESTIONS_LIST_HINT =
  "Click a question to see the likely MCP tool sequence an agent would run.";

export const AUDIENCE_LIST_HINT =
  "Click an audience to see typical setup, tools, and resources.";

export type QuestionCard = {
  id: string;
  question: string;
  note: string;
};

export const EXAMPLE_QUESTION_CARDS: QuestionCard[] = [
  {
    id: "1",
    question:
      "How has GDP per capita changed in Kenya over the last two decades?",
    note: "Catalog search, Kenya coverage check, then the time series.",
  },
  {
    id: "2",
    question:
      "Which indicators in WDI relate to female labor force participation, and do they include Bangladesh?",
    note: "WDI search with a Bangladesh coverage filter.",
  },
  {
    id: "3",
    question:
      "What is the official definition and source of PPP adjusted GDP per capita, and what methodology should I use to calculate it?",
    note: "Metadata fields for definition, source, and methodology.",
  },
  {
    id: "4",
    question:
      "Plot a line chart comparing access to electricity in three countries since 2010.",
    note: "Indicator lookup, disaggregation check, then chart spec.",
  },
];

export type QuestionToolStep = { tool: string; detail: string };

export const QUESTION_TOOL_FLOWS: Record<string, QuestionToolStep[]> = {
  "1": [
    {
      tool: "data360_find_codelist_value",
      detail: 'dimension="REF_AREA", query="Kenya" → KEN',
    },
    {
      tool: "data360_search_indicators",
      detail:
        'query="GDP per capita", required_country="Kenya" → WDI series with Kenya coverage',
    },
    {
      tool: "data360_get_disaggregation",
      detail:
        "database_id, indicator_id → confirm years 2004–2024 and available dimensions",
    },
    {
      tool: "data360_get_data",
      detail:
        'country_code="KEN", start_year=2004, end_year=2024 → time series for the answer',
    },
  ],
  "2": [
    {
      tool: "data360_find_codelist_value",
      detail: 'dimension="REF_AREA", query="Bangladesh" → BGD',
    },
    {
      tool: "data360_search_indicators",
      detail:
        'query="female labor force participation", database="WDI", required_country="Bangladesh"',
    },
    {
      tool: "data360_get_disaggregation",
      detail:
        "top matches → verify Bangladesh appears in coverage for each candidate series",
    },
    {
      tool: "data360_get_metadata",
      detail:
        "selected indicator → definition and source to cite in the response",
    },
  ],
  "3": [
    {
      tool: "data360_search_indicators",
      detail:
        'query="PPP adjusted GDP per capita" → pick the official WDI / macro series',
    },
    {
      tool: "data360_get_metadata",
      detail:
        "definition_long, source, methodology, aggregation_method, limitation",
    },
  ],
  "4": [
    {
      tool: "data360_find_codelist_value",
      detail:
        'dimension="REF_AREA", resolve each country name → ISO3 codes (e.g. KEN, IND, NGA)',
    },
    {
      tool: "data360_search_indicators",
      detail:
        'query="access to electricity" → select the best-matching indicator',
    },
    {
      tool: "data360_get_disaggregation",
      detail:
        "confirm electricity series spans 2010–present for all three countries",
    },
    {
      tool: "data360_get_viz_spec",
      detail:
        'chart_type="line", country_code=[…], start_year=2010 → Vega-Lite spec + chart URL',
    },
  ],
};

export const CHARTS_SECTION_INTRO =
  "For charts, the agent calls data360_get_viz_spec (single indicator) or data360_get_multi_indicator_viz_spec (2–4 indicators). The server loads series from Data360 and returns Vega-Lite JSON plus a chart URL. For tables or numbers in text, use data360_get_data or the aggregation tools listed under Technical reference—they are separate calls.";

export const CHART_FLOW_LEAD =
  "Search for the indicator, call data360_get_disaggregation for valid years and breakdowns, then request the chart spec.";

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

export const DATA_SOURCES_SECTION = {
  title: "Data sources and databases",
  intro:
    "The server's only persistent data source is the World Bank Data360 HTTP API. All indicator search, metadata, disaggregation, and time-series data are fetched from Data360 endpoints. There is no local database—the server is stateless aside from in-memory caches (e.g. codelists). All Data360 databases are supported. Use data360_list_indicators to discover indicators in any database, or load data360://databases for a reference list.",
} as const;

export const AGENT_SAFE_CARDS = [
  {
    title: "Coverage checks",
    description:
      "Use required_country in search and data360_get_disaggregation before fetching data so the agent only requests series that exist.",
  },
  {
    title: "Composable tools",
    description:
      "Small, focused tools validate codes, filters, and dimensions before returning data—search first, then refine.",
  },
  {
    title: "Bundled resources",
    description:
      "System prompt, codelists, and usage notes under data360:// keep client logic in sync with server conventions.",
  },
  {
    title: "Payload trimming",
    description:
      "Use select_fields on metadata calls to limit response size; data payloads are pre-filtered to essential columns for LLM consumption.",
  },
  {
    title: "Aggregation helpers",
    description:
      "data360_summarize_data, data360_rank_countries, and data360_compare_countries return compact summaries instead of raw series when the question is about trends, rankings, or cross-country comparison.",
  },
] as const;

export const TECHNICAL_SECTION = {
  title: "Technical reference",
  intro:
    "MCP tools, bundled resources, and connection details for developers wiring Cursor, Claude Desktop, LangGraph, or a custom client.",
} as const;

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

export const MCP_TOOLS_DISCOVERY: ToolRow[] = [
  {
    name: "data360_search_indicators",
    description:
      "Search indicators with enriched metadata. Use required_country for coverage checks. Supports single query, multi-topic queries, or scoped query_groups. Returns covers_country, latest_data, dimensions.",
  },
  {
    name: "data360_search_datasets",
    description:
      "Search Data360 dataset catalogs (e.g. WDI, Findex) when the user asks about sources or databases by name.",
  },
  {
    name: "data360_get_metadata",
    description:
      "Indicator metadata and optional disaggregation preview; use select_fields to limit payload.",
  },
  {
    name: "data360_get_disaggregation",
    description:
      "Available filter values (countries, years, dimensions) per indicator. Call before get_data or chart tools.",
  },
  {
    name: "data360_get_data",
    description:
      "Fetch observations with country, year, and dimension filters (SEX, AGE, URBANISATION, etc.). Paginated.",
  },
  {
    name: "data360_find_codelist_value",
    description: 'Resolve names to codes (e.g. "Kenya" → KEN, "female" → F).',
  },
  {
    name: "data360_expand_country_group",
    description:
      "Expand a REF_AREA group (region, income, lending) into constituent country codes (e.g. SAS, LIC).",
  },
  {
    name: "data360_list_indicators",
    description: "List all indicator IDs for a database.",
  },
  {
    name: "data360_get_data_api_url",
    description: "Low-level: build a direct Data360 data API URL.",
  },
];

export const MCP_TOOLS_ANALYSIS: ToolRow[] = [
  {
    name: "data360_summarize_data",
    description:
      "Summary statistics grouped by dimensions—use for trend or change-over-time questions without pulling full series.",
  },
  {
    name: "data360_rank_countries",
    description:
      "Rank countries by indicator value for a year (top/bottom performers, leaderboards).",
  },
  {
    name: "data360_compare_countries",
    description:
      "Compare 2–8 countries on one indicator (snapshot or aligned time series).",
  },
  {
    name: "data360_get_viz_spec",
    description:
      "Vega-Lite spec and chart URL for one indicator. Call get_disaggregation first. Fetches its own data; does not consume get_data output.",
  },
  {
    name: "data360_get_multi_indicator_viz_spec",
    description:
      "Chart comparing 2–4 indicators (scatter, dual-axis line, etc.).",
  },
  {
    name: "data360_get_supported_chart_types",
    description: "List supported chart types and data requirements.",
  },
];

export const AGENT_WORKFLOW = `Tables / numbers in text:
1. data360_search_indicators(query, required_country="Kenya")
2. data360_get_disaggregation(database_id, indicator_id)  — years and dimensions
3. data360_get_data(database_id, indicator_id, country_code="KEN", ...)

Rankings / comparisons (prefer over raw get_data when possible):
1. data360_search_indicators(...)
2. data360_get_disaggregation(...)
3. data360_rank_countries(...) or data360_compare_countries(...)

Charts (single indicator):
1. data360_search_indicators(...)
2. data360_get_disaggregation(...)
3. data360_get_viz_spec(database_id, indicator_id, country_code, ...)

Charts (multiple indicators):
1. data360_search_indicators(...) for each topic
2. data360_get_multi_indicator_viz_spec(indicator_ids=[...], ...)`;

export const MCP_RESOURCES: ToolRow[] = [
  {
    name: "data360://system-prompt",
    description:
      "Required. Workflow and tool-use guidance for the system message.",
  },
  {
    name: "data360://context",
    description:
      "Recommended. Runtime context (current date and year) for time-aware queries.",
  },
  {
    name: "data360://agent-recipe",
    description:
      "Host integration recipe for LangGraph / data360-mcp-agent (resource + prompt composition).",
  },
  {
    name: "data360://k360-narrative-style",
    description:
      "Optional markdown response contract for staged narrative renderers.",
  },
  {
    name: "data360://databases",
    description: "Available databases (live mapping from Data360)",
  },
  {
    name: "data360://codelists",
    description: "Codelist reference (REF_AREA, SEX, AGE, UNIT_MEASURE, …)",
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
    name: "data360://data-schema",
    description: "Standard columns and visualization guidance",
  },
  {
    name: "data360://search-usage",
    description: "Search examples and best practices",
  },
];

export type PromptRow = { name: string; description: string };

export const MCP_PROMPTS: PromptRow[] = [
  {
    name: "indicator_search",
    description: "Pick one indicator among search hits",
  },
  {
    name: "indicator_details",
    description: "Methodology, definition, or limitation questions",
  },
  {
    name: "country_data",
    description: "One country + theme → data and optional chart",
  },
  {
    name: "gate_classifier",
    description: "Decide in/out of scope before the tool loop",
  },
  {
    name: "thematic_to_data",
    description: "Rewrite a broad development question into a data task",
  },
  {
    name: "k360_research_compiler",
    description: "Build a JSON content packet from a tool trace",
  },
  {
    name: "k360_narrative",
    description: "Convert a content packet into narrative markdown",
  },
];

export const ARCHITECTURE_SECTION = {
  title: "How the server works",
  intro:
    "MCP clients connect to the Data360 MCP server over streamable HTTP. The server does not store user sessions; each request is independent. It calls the Data360 API for search, metadata, disaggregation, and data, and optionally an external Charts API for persisting Vega-Lite specs.",
  diagram: `  MCP clients (Cursor, LangGraph, custom apps)
              │
              ▼ streamable HTTP /mcp
  ┌───────────────────────────────┐
  │     Data360 MCP Server        │
  │  FastMCP · Tools · Resources  │
  │  · Prompts · MCP Apps         │
  └───────────┬───────────────────┘
              │
     ┌────────┴────────┐
     ▼                 ▼
 Data360 HTTP API   Charts API (optional)
 search · metadata  Vega-Lite spec storage
 disagg · data`,
  docLink:
    "https://github.com/worldbank/data360-mcp/blob/main/docs/architecture-data360-mcp.md",
} as const;

export type ArchitectureLayerRow = {
  layer: string;
  technology: string;
  purpose: string;
};

export const ARCHITECTURE_LAYERS: ArchitectureLayerRow[] = [
  {
    layer: "MCP",
    technology: "FastMCP, MCP SDK",
    purpose: "Tools, resources, prompts, apps",
  },
  {
    layer: "Transport",
    technology: "Streamable HTTP (stateless)",
    purpose: "Production and local development",
  },
  {
    layer: "API client",
    technology: "httpx (async)",
    purpose: "Data360 search, metadata, data, codelists",
  },
  {
    layer: "Visualization",
    technology: "Draco, Altair, Vega-Lite",
    purpose: "Chart generation from time-series data",
  },
];

export type McpAppRow = { app: string; uri: string; tool: string };

export const MCP_APPS: McpAppRow[] = [
  {
    app: "Chart view",
    uri: "ui://data360/chart-view.html",
    tool: "data360_get_viz_spec",
  },
  {
    app: "Search results",
    uri: "ui://data360/search-results.html",
    tool: "data360_search_indicators",
  },
  { app: "QR view", uri: "ui://data360/qr-view.html", tool: "(example)" },
];

export const MCP_APPS_SECTION = {
  intro:
    "MCP Apps allow hosts to render tool results in interactive iframes instead of plain JSON. Tools attach a resourceUri in their metadata so the host can open the corresponding app and pass the tool result.",
  notesLink:
    "https://github.com/worldbank/data360-mcp/blob/main/docs/mcp-apps-implementation-notes.md",
} as const;

export type PackageRow = {
  name: string;
  description: string;
  href: string;
  linkLabel: string;
};

export const PACKAGES: PackageRow[] = [
  {
    name: "data360-mcp-agent",
    description:
      "Python client for LangGraph agents; load data360://agent-recipe for multi-agent nodes.",
    href: "https://github.com/worldbank/data360-mcp/tree/main/packages/data360-mcp-agent",
    linkLabel: "Package README",
  },
  {
    name: "LangChain minimal example",
    description: "One-shot agent with data360://system-prompt.",
    href: "https://github.com/worldbank/data360-mcp/tree/main/examples/agents/langchain-minimal",
    linkLabel: "Example",
  },
  {
    name: "LangGraph multi-agent example",
    description: "Gated tool node with relevance check.",
    href: "https://github.com/worldbank/data360-mcp/tree/main/examples/agents/langchain-graph",
    linkLabel: "Example",
  },
  {
    name: "@data360/mcp-ui",
    description:
      "React components for MCP tool output (Vega charts, search results).",
    href: "https://github.com/worldbank/data360-mcp/tree/main/packages/mcp-ui",
    linkLabel: "Package README",
  },
  {
    name: "@data360/mcp-ui-angular",
    description: "Angular counterpart for host-embeddable chart UI.",
    href: "https://github.com/worldbank/data360-mcp/tree/main/packages/mcp-ui-angular",
    linkLabel: "Package README",
  },
  {
    name: "@data360/mcp-viz-core",
    description: "Shared Vega-Lite prep and World Bank chart theme.",
    href: "https://github.com/worldbank/data360-mcp/tree/main/packages/mcp-viz-core",
    linkLabel: "Package README",
  },
  {
    name: "@data360/tool-types",
    description: "Zod schemas and parsers for MCP tool JSON contracts.",
    href: "https://github.com/worldbank/data360-mcp/tree/main/packages/tool-types",
    linkLabel: "Package README",
  },
];

export type HealthRow = { route: string; purpose: string; status: string };

export const HEALTH_ROWS: HealthRow[] = [
  {
    route: "GET /mcp/health",
    purpose: "Liveness — process is running (no outbound I/O)",
    status: "Always 200",
  },
  {
    route: "GET /mcp/ready",
    purpose:
      "Readiness — Data360 API, database mapping, and viz storage are usable",
    status: "200 or 503",
  },
];

export const HEALTH_SECTION = {
  title: "Health and operations",
  intro:
    "The FastAPI wrapper exposes HTTP probes for deployment and load balancers.",
  devLink: "https://github.com/worldbank/data360-mcp/blob/main/DEVELOPMENT.md",
  footnote:
    "Toggle readiness checks with MCP_READINESS_ENABLED (default true). Per-check timeout: MCP_HEALTH_CHECK_TIMEOUT (default 5 seconds).",
} as const;

/** World Bank public (external) MCP endpoint for agents and IDEs. */
export const PUBLIC_MCP_URL = "https://maimcpext.worldbank.org/ext/data360/mcp";

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
  { id: "WB_POVERTY", label: "Poverty and inequality indicators" },
  { id: "IPC_IPC", label: "International Poverty Comparison" },
] as const;

export const FOOTER_LINKS = [
  {
    href: "https://github.com/worldbank/data360-mcp/blob/main/docs/overview.md",
    label: "Overview",
  },
  {
    href: "https://github.com/worldbank/data360-mcp/blob/main/DEVELOPMENT.md",
    label: "Development",
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
  "Required for external MCP clients (Cursor, Claude Desktop, LangGraph, and similar). If you use Data360 Chat, the server is already configured—see the section above.";
