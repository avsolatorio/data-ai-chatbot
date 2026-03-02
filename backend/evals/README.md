# Data360-Chat Evaluation Suite

Evaluates the Data360 chatbot's response quality through multi-turn conversation simulation, independent of any MCP server logic.

## What is DeepEval?

[DeepEval](https://deepeval.com) is an open-source evaluation framework for LLM applications. It provides conversational metrics, some deterministic and some LLM-judged, to assess how well a chatbot handles multi-turn interactions. We use 10 metrics from three categories.

### DeepEval Metrics We Use

**1. ConversationCompletenessMetric - Built-in** ([docs](https://deepeval.com/docs/metrics-conversation-completeness))

Evaluates whether all expected outcomes defined in the persona were satisfied by the end of the conversation. Score is the fraction of outcomes achieved.

If it fails, the chatbot did not fulfill the user's goals (e.g., skipped the comparison table, forgot to generate a chart).

**2. TurnFaithfulnessMetric - Built-in** ([docs](https://deepeval.com/docs/metrics-turn-faithfulness))

Per-turn metric that checks whether the chatbot's response is grounded in tool results. Catches hallucinated values that did not come from any tool call.

If it fails, the chatbot fabricated data not present in tool responses.

**3-10. ConversationalGEval - Custom LLM-judged** ([docs](https://deepeval.com/docs/metrics-conversational-g-eval))

Eight custom metrics, each with specific evaluation criteria and steps. The LLM judge (gpt-4.1-mini) scores each one 0-1 across the full conversation:

| # | Metric | What It Checks | Threshold |
|---|---|---|---|
| 3 | Context Retention | References data from earlier turns; reuses indicator IDs | 0.6 |
| 4 | Claim Tagging & PCN | Every data value wrapped in `<claim>` tags | 0.8 |
| 5 | Data Accuracy | Values match actual tool output | 0.8 |
| 6 | Source Citation | Database, indicator, and methodology cited | 0.6 |
| 7 | Follow-up Suggestions | 2-3 relevant follow-up questions provided | 0.4 |
| 8 | Data Formatting | Tables, units, consistent number formatting | 0.4 |
| 9 | Latest Data Note | Notes "latest available" when no year specified | 0.4 |
| 10 | Content Structure | Headers, sections, limitation/comparability warnings | 0.4 |

Each metric includes an **applicability clause**: if the metric does not apply to a turn (e.g., no data was presented), the judge scores it 1.0 rather than penalizing.

### Edge-Case Metrics (persona-specific)

Applied only to specific personas that test boundary behaviors:

| Metric | Applied To | What It Checks |
|---|---|---|
| Scope Guard | adversarial | Politely refuses out-of-scope requests |
| No Fabrication | adversarial | Refuses to invent future projections |
| Country Resolution | multilingual | Resolves non-English country names |
| High-Cardinality Handling | comparison_max | Manages 12+ country tables |
| Data Unavailability | ngo_worker | Communicates missing data clearly |
| Guided Discovery | curious_citizen | Progressive depth for vague queries |
| Visualization & API URLs | student, journalist, ... | Generates chart links and API URLs |

### Why These Metrics?

| Question | Metric |
|---|---|
| Did the chatbot complete the user's task? | ConversationCompletenessMetric |
| Did it make up data? | TurnFaithfulnessMetric |
| Did it follow output formatting rules? | Claim Tagging, Data Formatting, Content Structure |
| Did it cite sources properly? | Source Citation |
| Was the data correct? | Data Accuracy |
| Did it maintain conversation context? | Context Retention |

## What We Test (and What We Do Not)

**In scope: Chatbot conversation quality**

- Does the chatbot follow system prompt instructions?
- Are responses well-structured, accurate, and properly cited?
- Does it handle multi-turn context correctly?
- Does it behave appropriately at edge cases (refusals, unavailable data, ambiguous queries)?

**Out of scope: MCP server tool quality**

- Tool selection correctness (→ tested in [data360-mcp](https://github.com/avsolatorio/data360-mcp) evals)
- Argument correctness (→ tested in data360-mcp evals)
- Search result ranking quality (→ tested in data360-mcp evals)

The eval uses the full chatbot pipeline (routing → planner → writer) with real MCP tool calls. If the eval fails, the problem is in the chatbot prompts, conversation handling, or response formatting — not in the MCP server.

## How It Works

```
Persona YAML ──→ DeepEval ConversationSimulator ──→ Dynamic user messages
                                                           ↓
                                                  Full chatbot pipeline
                                                  (routing + planner + writer + MCP tools)
                                                           ↓
                                                  Multi-turn conversation (4 turns default)
                                                           ↓
                                                  10+ metrics score the conversation
                                                           ↓
                                                  Pass/Fail per metric
```

Questions are **dynamically generated** by the simulator based on the persona's scenario and expected outcome — not hardcoded. This ensures the chatbot is tested on varied, realistic queries each run.

## Persona Coverage

12 personas covering distinct user archetypes:

| Persona | Role | Key Behaviors Tested |
|---|---|---|
| student | Economics grad student | Multi-step retrieval, comparison tables, charts |
| economist | Central bank researcher | Technical precision, methodology, source citations |
| health_researcher | Epidemiologist | Cross-database search, indicator selection |
| policy_advisor | Government briefing prep | Education data, policy-relevant framing |
| ngo_worker | Field worker in Bangladesh | Data gaps, gender disaggregation |
| journalist | Data-driven reporter | Quick facts, sourcing, visualization |
| data_engineer | API integration specialist | Raw data, API URLs, metadata |
| geographer | Spatial analyst | Urban/rural disaggregation, multi-country |
| curious_citizen | Non-technical user | Plain language, guided discovery |
| adversarial | Tries to trick the chatbot | Scope guard, fabrication prevention |
| multilingual | Non-English country names | Country code resolution |
| comparison_max | 12+ country comparison | High-cardinality tables |

## How to Run

Prerequisites:

1. Start the MCP server (or use the hosted endpoint)
2. Set environment variables: `export OPENAI_API_KEY=<your-key>` and `export MCP_SERVER_URL=http://localhost:8021/mcp`

Run all personas:

    uv run python -m evals.run_conversation_eval --turns 4

Run a single persona:

    uv run python -m evals.run_conversation_eval --persona student --turns 4

Multiple independent runs (aggregates mean ± std per metric):

    uv run python -m evals.run_conversation_eval --persona student --turns 4 --runs 3

Replay a previous run (re-evaluate without re-running the chatbot):

    uv run python -m evals.run_conversation_eval --replay 20260302_222822 --persona student

Dump conversations to markdown (with collapsible tool calls):

    uv run python -m evals.dump_conversations

## How to Add Tests

### Persona (personas/*.yaml)

Each persona is a YAML file with three fields:

| Field | Description | Example |
|---|---|---|
| scenario | What the user is trying to accomplish | "A graduate student writing a thesis on East African economic development..." |
| user_description | Who the user is and how they behave | "Maria is a 24-year-old economics master's student..." |
| expected_outcome | ALL outcomes that must be achieved | "ALL of: (1) GDP data with claim tags (2) comparison table (3) chart..." |

### Edge-case metric (run_conversation_eval.py)

Add a new `ConversationalGEval` in `_build_edge_case_metrics()` keyed to a persona:

```python
if persona_key == "my_persona":
    extra.append(ConversationalGEval(
        name="My Custom Metric",
        criteria="Evaluate whether...",
        evaluation_steps=["Check if...", "Verify that..."],
        threshold=0.5, model=JUDGE_MODEL,
    ))
```

## Output Files

| File | Contents |
|---|---|
| `.results/conversations_*.json` | Raw conversation turns per persona |
| `.results/conversation_eval_*.json` | Metric scores per persona |
| `conversations/<persona>.md` | Readable markdown transcript with collapsible tool calls |
| `reviews/<persona>_review.md` | Post-hoc LLM review per persona |

### Conversation Markdown Features

- **Collapsible tool calls**: `<details>` tags hide verbose MCP tool results by default
- **Verified claims**: `<claim>` tags transformed into visible `✅ value` checkmarks
- **Evaluation results**: Metrics table at the top of each file

## File Structure

| File | Purpose |
|---|---|
| README.md | This file |
| run_conversation_eval.py | Main entry point: simulate + evaluate |
| pipeline_runner.py | Non-streaming eval runner for chatbot pipeline |
| dump_conversations.py | Export conversations to per-persona markdown |
| review_conversation.py | Post-hoc LLM conversation review |
| run_scorecard.py | Single-turn scorecard tests (edge cases) |
| generate_personas.py | LLM-powered persona generator |
| personas/ | 12 persona YAML definitions |
| conversations/ | Generated conversation transcripts |
| reviews/ | Post-hoc analysis reports |
| .results/ | Raw JSON results (gitignored) |
| mvp_features.md | MVP feature specification |
| mvp_user_stories.md | User stories (drives persona design) |

## DeepEval References

Resources used to build this evaluation suite:

| Resource | What we used it for |
|---|---|
| [Conversational Evaluation](https://deepeval.com/docs/evaluation-conversational) | Core guide: multi-turn test cases, ConversationalGolden, simulation |
| [ConversationSimulator](https://deepeval.com/docs/confident-ai-synthesizer-conversational) | Persona-driven dynamic question generation |
| [ConversationCompletenessMetric](https://deepeval.com/docs/metrics-conversation-completeness) | Built-in outcome completeness scoring |
| [TurnFaithfulnessMetric](https://deepeval.com/docs/metrics-turn-faithfulness) | Per-turn hallucination detection |
| [ConversationalGEval](https://deepeval.com/docs/metrics-conversational-g-eval) | Custom LLM-judged metrics with criteria and evaluation steps |
| [ConversationalTestCase](https://deepeval.com/docs/evaluation-test-cases) | Test case structure: turns, tools_called, expected outcomes |
