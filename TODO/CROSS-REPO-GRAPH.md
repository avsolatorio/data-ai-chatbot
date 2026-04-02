# Cross-repo task dependencies

Tasks live in:
- `data-ai-chatbot/TODO/`
- `data360-mcp/TODO/`
- `pcn/TODO/`

## Combined graph

```mermaid
flowchart TB
  subgraph data_ai_chatbot [data-ai-chatbot]
    BE001["BE-001 Writer and Planner prompt"]
    DESIGN001["DESIGN-001 Design — visual hierarchy"]
    FE001["FE-001 Follow-ups — parser harde"]
    FE002["FE-002 Assistant markdown — auto"]
    FE003["FE-003 Chat scroll — stick to bo"]
    FE004["FE-004 UI — return to thinking a"]
    FE005["FE-005 Markdown — visual hierarc"]
    FE006["FE-006 Optional “How to read” pr"]
  end
  subgraph data360_mcp [data360-mcp]
    MCP001["MCP-001 SYSTEM_PROMPT — align wit"]
    MCP002["MCP-002 Vega-Lite — default toolt"]
    MCP003["MCP-003 Many countries — beeswarm"]
  end
  subgraph pcn [pcn]
  end
  BE001 --> FE005
  FE005 --> FE006
  BE001 --> MCP001
  MCP002 -.->|"shared code"| MCP003
```

## Edge reference

| From | To | Relationship |
|------|----|--------------|
| BE-001 | FE-005 | **Unblocks** |
| FE-005 | FE-006 | **Unblocks** |
| BE-001 | MCP-001 | **Unblocks** |
| MCP-002 | MCP-003 | **Soft order** (shared code) |

## Suggested batch order

1. **BE-001, DESIGN-001, FE-001, FE-002, FE-003, FE-004, MCP-002, MCP-003** (data-ai-chatbot, data360-mcp)
2. **FE-005, MCP-001** (data-ai-chatbot, data360-mcp)
3. **FE-006** (data-ai-chatbot)
