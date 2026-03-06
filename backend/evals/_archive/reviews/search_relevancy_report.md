# Search Indicator Relevancy Report

**Generated:** 2026-03-01 18:30

## Aggregate Metrics

| Metric | Value |
|---|---|
| **MRR** (Mean Reciprocal Rank) | **0.3000** |
| **Hit@1** (LLM picks #1 result) | 25.0% (2/8) |
| **Hit@3** (top-3) | 25.0% |
| **Hit@5** (top-5) | 50.0% |
| **Miss rate** (not in results) | 50.0% |
| Total search-select pairs | 8 |

### Rank Distribution

| Rank Position | Count |
|---|---|
| #1 | 2 ## |
| #5 | 2 ## |

## Per-Persona Breakdown

### health_researcher

MRR: 0.3000 | Hit@1: 25% | Pairs: 8

| Turn | Query | Selected Indicator | Rank | / N | Tool |
|---|---|---|---|---|---|
| 1 | HIV prevalence (adult) | `WB_WDI_SH_DYN_AIDS_ZS` | **#1** | 10 | get_data |
| 1 | HIV prevalence (adult) | `WB_WDI_SH_DYN_AIDS_ZS` | **#1** | 10 | get_metadata |
| 1 | maternal mortality ratio (per 100,000 live births) | `WB_WDI_SH_STA_MMRT` | #5 | 10 | get_data |
| 1 | maternal mortality ratio (per 100,000 live births) | `WB_WDI_SH_STA_MMRT` | #5 | 10 | get_metadata |
| 2 | (no search) | `WB_WDI_SH_DYN_AIDS_ZS` | MISS | - | get_viz_spec |
| 2 | (no search) | `WB_WDI_SH_STA_MMRT` | MISS | - | get_viz_spec |
| 3 | (no search) | `WB_WDI_SH_DYN_AIDS_ZS` | MISS | - | get_data |
| 3 | (no search) | `WB_WDI_SH_STA_MMRT` | MISS | - | get_data |

---

## Interpretation Guide

- **MRR = 1.0**: LLM always picks the #1 result (perfect ranking)
- **MRR > 0.8**: Good ranking; LLM mostly picks top results
- **MRR < 0.5**: Ranking needs improvement; LLM digs deep
- **High miss rate**: LLM uses indicators not in search results
