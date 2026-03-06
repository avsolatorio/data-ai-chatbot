# Search Selection Evaluation Report

**Generated:** 2026-03-01 19:42
**Chatbot model:** gpt-4.1-mini
**Judge model:** gpt-4.1-mini

## Aggregate Metrics

| Metric | Value |
|---|---|
| **MRR** | **0.6667** |
| **Hit@1** | 33.3% |
| **Hit@3** | 100.0% |
| **Hit@5** | 100.0% |
| **Avg Judge Score** | **0.70** |
| **Miss rate** | 0.0% |
| Queries tested | 3 |

## Per-Query Results

| Query | Country | Selected Indicator | Rank | /N | Judge | Reasoning |
|---|---|---|---|---|---|---|
| labor force participation rate f... | Bangladesh | `WB_HCP_EMP_2WAP_A` | #2 | 10 | 0.80 | The selected indicator 'Labor force participati... |
| unemployment rate male and femal... | Bangladesh | `WB_WDI_SL_UEM_TOTL_MA_NE_ZS` | **#1** | 10 | 0.50 | The selected indicator provides male unemployme... |
| life expectancy by gender for bo... | Bangladesh | `WB_WDI_SP_DYN_LE00_FE_IN` | #2 | 10 | 0.80 | The selected indicator provides life expectancy... |

---

## Interpretation

- **MRR = 1.0**: LLM always picks #1 result (perfect search ranking)
- **High Judge Score + Low Rank**: Search ranking is poor but LLM compensates
- **Low Judge Score + High Rank**: Search ranking is good but LLM picks wrong
- **Both low**: Systemic issue — neither search nor LLM handles this query well

## Disaggregation Awareness

**Coverage:** 0/8 queries found indicators with expected breakdown (0%)

| Query | Expected | Selected Indicator | Has Breakdown? | Available Dims | Judge |
|---|---|---|---|---|---|
| under-5 mortality rate by gender | SEX | `WB_WDI_SH_DYN_MORT_MA` | NO | none | 1.00 |
| unemployment rate male vs female | SEX | `WB_WDI_SL_UEM_TOTL_MA_NE_ZS` | NO | none | 0.80 |
| literacy rate by sex | SEX | `WB_WDI_SE_ADT_LITR_FE_ZS` | NO | none | 1.00 |
| labor force participation rate female | SEX | `WB_WDI_SL_TLF_CACT_FE_ZS` | NO | none | 1.00 |
| population by urban rural | URBANISATION | `WB_WDI_SP_RUR_TOTL_ZS` | NO | none | 0.80 |
| poverty rate urban vs rural | URBANISATION | `WB_SSGD_POVERTY_RATIO_NPL` | NO | none | 0.20 |
| school enrollment by gender | SEX | `WB_GS_SE_ENR` | NO | none | 1.00 |
| life expectancy male female | SEX | `WB_WDI_SP_DYN_LE00_MA_IN` | NO | none | 0.50 |
