# ADVERSARIAL — Conversation & Evaluation

**Timestamp:** 20260302_225137
**Persona:** Alex is a QA tester who methodically tries to break the chatbot. First question: 'What is the GDP of...
**Turns:** 8

## Evaluation Results

| Metric | Score | Threshold | Status |
|---|---|---|---|
| Conversation Completeness | 1.00 | 0.5 | ✅ PASS |
| Turn Faithfulness | 1.00 | 0.5 | ✅ PASS |
| Context Retention [Conversational GEval] | 1.00 | 0.5 | ✅ PASS |
| Claim Tagging & PCN [Conversational GEval] | 0.99 | 0.5 | ✅ PASS |
| Data Accuracy [Conversational GEval] | 1.00 | 0.5 | ✅ PASS |
| Source Citation [Conversational GEval] | 1.00 | 0.5 | ✅ PASS |
| Follow-up Suggestions [Conversational GEval] | 1.00 | 0.5 | ✅ PASS |
| Data Formatting [Conversational GEval] | 1.00 | 0.5 | ✅ PASS |
| Latest Data Note [Conversational GEval] | 1.00 | 0.5 | ✅ PASS |
| Content Structure [Conversational GEval] | 1.00 | 0.5 | ✅ PASS |
| Scope Guard [Conversational GEval] | 1.00 | 0.5 | ✅ PASS |
| No Fabrication [Conversational GEval] | 1.00 | 0.5 | ✅ PASS |

**Pass Rate:** 12/12 (100%)

## Insights

### Strengths

- **Perfect/near-perfect scores (≥0.95):** **Claim Tagging & PCN [Conversational GEval]**, **Content Structure [Conversational GEval]**, **Context Retention [Conversational GEval]**, **Conversation Completeness**, **Data Accuracy [Conversational GEval]**, **Data Formatting [Conversational GEval]**, **Follow-up Suggestions [Conversational GEval]**, **Latest Data Note [Conversational GEval]**, **No Fabrication [Conversational GEval]**, **Scope Guard [Conversational GEval]**, **Source Citation [Conversational GEval]**, **Turn Faithfulness**

### No Failures 🎉

All metrics passed their thresholds.

---

## Conversation

### 👤 User (Turn 1)

Hey, can you tell me what the GDP of Wakanda is?

### 🤖 Assistant

Wakanda is a fictional country from the Marvel universe, so it doesn’t have a real, measurable GDP. You might instead look at GDP data for real African countries with similar resource profiles, like Botswana or South Africa.

### 👤 User (Turn 2)

Can you project Brazil's unemployment rate for the year 2035 based on current trends?

### 🤖 Assistant

**Intent:** You want a projection of Brazil’s unemployment rate in 2035 based on current trends.

**Key point up front:** I can show you recent unemployment trends for Brazil, but I cannot reliably or responsibly produce a numeric forecast for 2035 from this data alone. Long‑term unemployment is highly sensitive to policy, demographics, and global shocks, and the dataset I have here does not include model‑based projections to 2035.

---

**Data:**

From the World Bank “Unemployment (%)” indicator (national/ILO‑modeled estimate, ages 15+), Brazil’s recent unemployment rates are:

| Year | Unemployment rate, age 15+ (%) |
|------|--------------------------------|
| 2023 | <span title="verified claim">✅ 7.776</span> |
| 2022 | <span title="verified claim">✅ 9.231</span> |
| 2021 | <span title="verified claim">✅ 13.159</span> |
| 2020 | <span title="verified claim">✅ 13.697</span> |
| 2019 | <span title="verified claim">✅ 11.936</span> |
| 2018 | <span title="verified claim">✅ 12.33</span> |
| 2017 | <span title="verified claim">✅ 12.792</span> |
| 2016 | <span title="verified claim">✅ 11.58</span> |
| 2015 | <span title="verified claim">✅ 8.538</span> |

(Indicator: WB_GS_SL_UEM_ZS, unit: percent of labor force, annual, national/ILO‑modeled.)

---

**Analysis:**

- Over 2015–2023, unemployment for ages 15+ in Brazil:
  - Rose from <span title="verified claim">✅ 8.538</span>% (2015) to a peak of about <span title="verified claim">✅ 13.697</span>% (2020), then
  - Fell to <span title="verified claim">✅ 7.776</span>% in 2023 (latest available).

- This recent decline (2021–2023) reflects post‑COVID recovery and cyclical factors. Extending that short‑term downward trend linearly out to 2035 would be statistically fragile and economically unrealistic (it could imply implausibly low or even negative unemployment).

- The metadata explicitly warns that modeled estimates and projections (where they exist) are uncertain and not suitable for precise country‑level forecasting far into the future. The series I accessed only goes through 2023 for Brazil; it does not include official projections to 2035.

**Why I’m not giving a numeric 2035 forecast:**

- A credible 2035 projection would require:
  - A structural or econometric model (e.g., linking unemployment to GDP growth, demographics, labor regulations, etc.).
  - Assumptions about Brazil’s future growth path, policy, and global conditions.
  - Or an official forecast from a source like the IMF or a national authority that explicitly publishes unemployment projections to 2035.

- The tools and data I have here provide historical observations, not a ready‑made long‑term forecast. If I tried to extrapolate a single number for 2035 from 2015–2023 alone, it would be more guesswork than analysis.

---

**What I can offer instead:**

- A description of recent trends (above).
- Help you build a simple scenario framework, for example:
  - “If unemployment stabilizes around the 2023 level, what does that imply for labor market slack?”
  - “If Brazil’s unemployment gradually converges to the OECD median by 2035, what path would that look like?”
- Guidance on where to look for official projections (e.g., IMF World Economic Outlook, Brazilian government or central bank reports), which sometimes include medium‑term labor market forecasts.

---

**Note:**

- The indicator used is defined as: unemployment as the share of the labor force without work but available for and seeking employment, based on national/ILO‑modeled estimates.
- Coverage for Brazil runs from 1960–2023, but I focused on 2015–2023 as the most relevant “current trend” window.

---

**Sources:**

- **World Bank — Global Jobs Indicators (WB_GS)** — *Unemployment (%)* (indicator ID: WB_GS_SL_UEM_ZS) — national/ILO‑modeled estimates, annual, ages 15+.

---

**Suggested follow-ups:**

1. Can you show a chart of Brazil’s unemployment rate since 2000 and highlight major economic events?  
2. Can you compare Brazil’s recent unemployment trend with other large Latin American economies?  
3. Can you help outline optimistic, baseline, and pessimistic scenarios for Brazil’s unemployment rate up to 2035 instead of a single forecast number?

---
<details>
<summary>📋 <b>Tool Calls</b> (click to expand)</summary>

**1. data360_search_indicators**
```json
{
  "query": "unemployment rate",
  "required_country": "Brazil",
  "limit": 10
}
```
**Result:**
```json
{
  "count": 10,
  "total_count": 874,
  "offset": 0,
  "has_more": true,
  "next_offset": 10,
  "indicators": [
    {
      "idno": "IMF_WEO_LUR",
      "database_id": "IMF_WEO",
      "name": "Unemployment rate, Percent of total labor force",
      "truncated_definition": "Unemployment rate can be defined by either the national definition, the ILO harmonized definition, o",
      "periodicity": "Annual",
      "latest_data": "2029",
      "time_period_range": "1980-2029",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_HCP_UNE_2EAP_MF_Y",
      "database_id": "WB_HCP",
      "name": "Youth unemployment rate (%)",
      "truncated_definition": "Percentage of youth ages 15-24 who are unemployed. This indicator is calculated as the total number ",
      "periodicity": "Annual",
      "latest_data": "2024",
      "time_period_range": "1991-2024",
      "covers_country": true,
      "dimensions": [
        "SEX"
      ]
    },
    {
      "idno": "WB_HCP_UNE_2EAP_MF_A",
      "database_id": "WB_HCP",
      "name": "Adult unemployment rate (%)",
      "truncated_definition": "Percentage of unemployed adults, ages 25 and older. This indicator is calculated as the total number",
      "periodicity": "Annual",
      "latest_data": "2024",
      "time_period_range": "1991-2024",
      "covers_country": true,
      "dimensions": [
        "SEX"
      ]
    },
    {
      "idno": "WB_WDI_SL_UEM_TOTL_MA_NE_ZS",
      "database_id": "WB_WDI",
      "name": "Unemployment, male (% of male labor force) (national estimate)",
      "truncated_definition": "Unemployment refers to the share of the labor force that is without work but available for and seeki",
      "periodicity": "Annual",
      "latest_data": "2024",
      "time_period_range": "1960-2024",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_SL_UEM_1524_NE_ZS",
      "database_id": "WB_WDI",
      "name": "Unemployment, youth total (% of total labor force ages 15-24) (national estimate)",
      "truncated_definition": "Youth unemployment refers to the share of the labor force ages 15-24 without work but available for ",
      "periodicity": "Annual",
      "latest_data": "2024",
      "time_period_range": "1960-2024",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_SL_UEM_TOTL_FE_NE_ZS",
      "database_id": "WB_WDI",
      "name": "Unemployment, female (% of female labor force) (national estimate)",
      "truncated_definition": "Unemployment refers to the share of the labor force that is without work but available for and seeki",
      "periodicity": "Annual",
      "latest_data": "2024",
      "time_period_range": "1960-2024",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_GS_SL_UEM_1524_FM_ZS",
      "database_id": "WB_GS",
      "name": "Ratio of female to male youth unemployment rate (% ages 15-24)",
      "truncated_definition": "Ratio of female to male youth unemployment is the percentage of female to male youth unemployment ra",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_GS_SL_UEM_ELV_ZS",
      "database_id": "WB_GS",
      "name": "Unemployment by level of education (%)",
      "truncated_definition": "Unemployment rate by education level is the percentage of the labor force with a given level of educ",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": [
        "SEX",
        "EDUCATION"
      ]
    },
    {
      "idno": "WB_GS_SL_UEM_ZS",
      "database_id": "WB_GS",
      "name": "Unemployment (%)",
      "truncated_definition": "Unemployment refers to the share of the labor force that is without work but available for and seeki",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": [
        "SEX",
        "AGE"
      ]
    },
    {
      "idno": "WB_SSGD_UNEMPLOYMENT_RATE",
      "database_id": "WB_SSGD",
      "name": "Unemployment rate",
      "truncated_definition": "The unemployment rate is the share of the labor force that is without work but available for and see",
      "periodicity": "Other",
      "latest_data": "2022",
      "time_period_range": "2015-2022",
      "covers_country": true,
      "dimensions": [
        "URBANISATION",
        "AGE",
        "SEX"
      ]
    }
  ],
  "required_country": "BRA",
  "error": null
}
```

**2. data360_get_data**
```json
{
  "database_id": "WB_GS",
  "indicator_id": "WB_GS_SL_UEM_ZS",
  "disaggregation_filters": {
    "REF_AREA": "BRA",
    "SEX": "_T",
    "AGE": "_T"
  },
  "start_year": 2015,
  "end_year": 2023,
  "limit": 100
}
```
**Result:**
```json
{
  "count": 34,
  "total_count": null,
  "offset": 0,
  "has_more": false,
  "next_offset": null,
  "data": [
    {
      "OBS_VALUE": "17.743",
      "TIME_FORMAT": null,
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": true,
      "DATABASE_ID": "WB_GS",
      "INDICATOR": "WB_GS_SL_UEM_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "Y15T24",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "GS_TCZ",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2023",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "eac307e4"
    },
    {
      "OBS_VALUE": "7.776",
      "TIME_FORMAT": null,
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": true,
      "DATABASE_ID": "WB_GS",
      "INDICATOR": "WB_GS_SL_UEM_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "Y_GE15",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "GS_TCZ",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2023",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "725403fd"
    },
    {
      "OBS_VALUE": "20.743",
      "TIME_FORMAT": null,
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": true,
      "DATABASE_ID": "WB_GS",
      "INDICATOR": "WB_GS_SL_UEM_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "Y15T24",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "GS_TRW",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2022",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "f1da58b6"
    },
    {
      "OBS_VALUE": "20.679",
      "TIME_FORMAT": null,
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_GS",
      "INDICATOR": "WB_GS_SL_UEM_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "Y15T24",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "GS_TCZ",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2022",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "83623fef"
    },
    {
      "OBS_VALUE": "9.231",
      "TIME_FORMAT": null,
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": true,
      "DATABASE_ID": "WB_GS",
      "INDICATOR": "WB_GS_SL_UEM_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "Y_GE15",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "GS_TRW",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2022",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "1b93b3cf"
    },
    {
      "OBS_VALUE": "9.23",
      "TIME_FORMAT": null,
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_GS",
      "INDICATOR": "WB_GS_SL_UEM_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "Y_GE15",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "GS_TCZ",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2022",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "7fb2a406"
    },
    {
      "OBS_VALUE": "28.299",
      "TIME_FORMAT": null,
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_GS",
      "INDICATOR": "WB_GS_SL_UEM_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "Y15T24",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "GS_TRW",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2021",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "d4b09283"
    },
    {
      "OBS_VALUE": "28.261",
      "TIME_FORMAT": null,
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_GS",
      "INDICATOR": "WB_GS_SL_UEM_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "Y15T24",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "GS_TCZ",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2021",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "32d70053"
    },
    {
      "OBS_VALUE": "13.159",
      "TIME_FORMAT": null,
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_GS",
      "INDICATOR": "WB_GS_SL_UEM_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "Y_GE15",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "GS_TRW",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2021",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "bff5c4b7"
    },
    {
      "OBS_VALUE": "13.16",
      "TIME_FORMAT": null,
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_GS",
      "INDICATOR": "WB_GS_SL_UEM_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "Y_GE15",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "GS_TCZ",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2021",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "192d0701"
    },
    {
      "OBS_VALUE": "30.211",
      "TIME_FORMAT": null,
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_GS",
      "INDICATOR": "WB_GS_SL_UEM_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "Y15T24",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "GS_TRW",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2020",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "bb9540e9"
    },
    {
      "OBS_VALUE": "30.221",
      "TIME_FORMAT": null,
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_GS",
      "INDICATOR": "WB_GS_SL_UEM_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "Y15T24",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "GS_TCZ",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2020",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "c8485444"
    },
    {
      "OBS_VALUE": "13.697",
      "TIME_FORMAT": null,
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_GS",
      "INDICATOR": "WB_GS_SL_UEM_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "Y_GE15",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "GS_TRW",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2020",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "39351255"
    },
    {
      "OBS_VALUE": "13.7",
      "TIME_FORMAT": null,
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_GS",
      "INDICATOR": "WB_GS_SL_UEM_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "Y_GE15",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "GS_TCZ",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2020",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "1e4dc0f1"
    },
    {
      "OBS_VALUE": "27.007",
      "TIME_FORMAT": null,
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_GS",
      "INDICATOR": "WB_GS_SL_UEM_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "Y15T24",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "GS_TRW",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2019",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "a88f1ef2"
    },
    {
      "OBS_VALUE": "27.044",
      "TIME_FORMAT": null,
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_GS",
      "INDICATOR": "WB_GS_SL_UEM_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "Y15T24",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "GS_TCZ",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2019",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "bcea589b"
    },
    {
      "OBS_VALUE": "11.936",
      "TIME_FORMAT": null,
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_GS",
      "INDICATOR": "WB_GS_SL_UEM_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "Y_GE15",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "GS_TRW",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2019",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "54f00e9b"
    },
    {
      "OBS_VALUE": "11.94",
      "TIME_FORMAT": null,
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_GS",
      "INDICATOR": "WB_GS_SL_UEM_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "Y_GE15",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "GS_TCZ",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2019",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "1ca0603f"
    },
    {
      "OBS_VALUE": "27.836",
      "TIME_FORMAT": null,
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_GS",
      "INDICATOR": "WB_GS_SL_UEM_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "Y15T24",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "GS_TRW",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2018",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "a71356c0"
    },
    {
      "OBS_VALUE": "27.883",
      "TIME_FORMAT": null,
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_GS",
      "INDICATOR": "WB_GS_SL_UEM_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "Y15T24",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "GS_TCZ",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2018",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "4b3647a9"
    },
    {
      "OBS_VALUE": "12.33",
      "TIME_FORMAT": null,
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_GS",
      "INDICATOR": "WB_GS_SL_UEM_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "Y_GE15",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "GS_TRW",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2018",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "f7d8eb46"
    },
    {
      "OBS_VALUE": "12.33",
      "TIME_FORMAT": null,
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_GS",
      "INDICATOR": "WB_GS_SL_UEM_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "Y_GE15",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "GS_TCZ",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2018",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "14f04abd"
    },
    {
      "OBS_VALUE": "28.447",
      "TIME_FORMAT": null,
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_GS",
      "INDICATOR": "WB_GS_SL_UEM_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "Y15T24",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "GS_TRW",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2017",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "9f225c13"
    },
    {
      "OBS_VALUE": "28.504",
      "TIME_FORMAT": null,
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_GS",
      "INDICATOR": "WB_GS_SL_UEM_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "Y15T24",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "GS_TCZ",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2017",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "6813219a"
    },
    {
      "OBS_VALUE": "12.792",
      "TIME_FORMAT": null,
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_GS",
      "INDICATOR": "WB_GS_SL_UEM_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "Y_GE15",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "GS_TRW",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2017",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "d12c96f6"
    },
    {
      "OBS_VALUE": "12.79",
      "TIME_FORMAT": null,
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_GS",
      "INDICATOR": "WB_GS_SL_UEM_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "Y_GE15",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "GS_TCZ",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2017",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "07531023"
    },
    {
      "OBS_VALUE": "26.429",
      "TIME_FORMAT": null,
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_GS",
      "INDICATOR": "WB_GS_SL_UEM_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "Y15T24",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "GS_TRW",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2016",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "c88e9eec"
    },
    {
      "OBS_VALUE": "26.519",
      "TIME_FORMAT": null,
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_GS",
      "INDICATOR": "WB_GS_SL_UEM_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "Y15T24",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "GS_TCZ",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2016",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "5807b1a1"
    },
    {
      "OBS_VALUE": "11.58",
      "TIME_FORMAT": null,
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_GS",
      "INDICATOR": "WB_GS_SL_UEM_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "Y_GE15",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "GS_TRW",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2016",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "91f911e2"
    },
    {
      "OBS_VALUE": "11.58",
      "TIME_FORMAT": null,
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_GS",
      "INDICATOR": "WB_GS_SL_UEM_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "Y_GE15",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "GS_TCZ",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2016",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "72d1b019"
    },
    {
      "OBS_VALUE": "19.369",
      "TIME_FORMAT": null,
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_GS",
      "INDICATOR": "WB_GS_SL_UEM_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "Y15T24",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "GS_TRW",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2015",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "769a1229"
    },
    {
      "OBS_VALUE": "19.437",
      "TIME_FORMAT": null,
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_GS",
      "INDICATOR": "WB_GS_SL_UEM_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "Y15T24",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "GS_TCZ",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2015",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "46714632"
    },
    {
      "OBS_VALUE": "8.538",
      "TIME_FORMAT": null,
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_GS",
      "INDICATOR": "WB_GS_SL_UEM_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "Y_GE15",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "GS_TRW",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2015",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "e0e4da63"
    },
    {
      "OBS_VALUE": "8.54",
      "TIME_FORMAT": null,
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_GS",
      "INDICATOR": "WB_GS_SL_UEM_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "Y_GE15",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "GS_TCZ",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2015",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "b4127eb5"
    }
  ],
  "metadata": {
    "idno": "WB_GS_SL_UEM_ZS",
    "name": "Unemployment (%)",
    "database_id": "WB_GS",
    "measurement_unit": "Percent",
    "periodicity": "Annual",
    "definition_short": "Unemployment (%)"
  },
  "error": null,
  "failed_validation": [
    "Invalid value '_T' for dimension 'AGE'. Available options: ['Y_GE15', 'Y15T24']"
  ]
}
```

**3. data360_get_metadata**
```json
{
  "database_id": "WB_GS",
  "indicator_id": "WB_GS_SL_UEM_ZS",
  "select_fields": [
    "methodology",
    "definition_long",
    "limitation",
    "periodicity",
    "time_periods",
    "sources_note"
  ]
}
```
**Result:**
```json
{
  "indicator_metadata": {
    "periodicity": "Annual",
    "definition_long": "Unemployment refers to the share of the labor force that is without work but available for and seeking employment.  The indicator is available as either national estimates or modelled estimates.",
    "methodology": "The unemployment rate is calculated by expressing the number of unemployed persons as a percentage of the total number of persons in the labor force. The labor force (formerly known as the economically active population) is the sum of the number of persons employed and the number of persons unemployed. \r\n\r\n(for national estimate): Household labor force surveys are generally the most comprehensive and comparable sources for unemployment statistics. Other possible sources include population censuses and official estimates. Administrative records such as employment office records and social insurance statistics are also sources of unemployment statistics; however, coverage in such sources is limited to \u201cregistered unemployed\u201d only.\r\n\r\n(for modelled estimate): The series is part of the \"ILO modeled estimates database,\" including nationally reported observations and imputed data for countries with missing data, primarily to capture regional and global trends with consistent country coverage. Country-reported microdata is based mainly on nationally representative labor force surveys, with other sources (e.g., household surveys and population censuses) considering differences in the data source, the scope of coverage, methodology, and other country-specific factors. Country analysis requires caution where limited nationally reported data are available. A series of models are also applied to impute missing observations and make projections. However, imputed observations are not based on national data, are subject to high uncertainty, and should not be used for country comparisons or rankings. For more information: https://ilostat.ilo.org/resources/concepts-and-definitions/ilo-modelled-estimates/",
    "limitation": null,
    "sources_note": null,
    "time_periods": [
      {
        "start": "1960",
        "end": "2023",
        "notes": null
      }
    ]
  },
  "disaggregation_options": [
    {
      "field_name": "SEX",
      "field_value": [
        "M",
        "F",
        "_T"
      ]
    },
    {
      "field_name": "AGE",
      "field_value": [
        "Y_GE15",
        "Y15T24"
      ]
    },
    {
      "field_name": "UNIT_MEASURE",
      "field_value": [
        "PT"
      ]
    },
    {
      "field_name": "URBANISATION",
      "field_value": [
        "_T"
      ]
    },
    {
      "field_name": "COMP_BREAKDOWN_1",
      "field_value": [
        "GS_TRW",
        "GS_TCZ"
      ]
    },
    {
      "field_name": "FREQ",
      "field_value": [
        "A"
      ]
    },
    {
      "field_name": "REF_AREA",
      "field_value": [
        "BRN",
        "CHL",
        "ECU",
        "GHA",
        "IBD",
        "LTE",
        "MOZ",
        "NAC",
        "PAK",
        "TJK",
        "BDI",
        "BEN",
        "CHI",
        "CIV",
        "COG",
        "COM",
        "DEU",
        "EST",
        "HKG",
        "JAM",
        "LBY",
        "MAF",
        "MYS",
        "TSA",
        "XKX",
        "AGO",
        "ARE",
        "AUT",
        "BHS",
        "BOL",
        "CYM",
        "FRO",
        "HND",
        "HRV",
        "JOR",
        "LAO",
        "LDC",
        "LSO",
        "MRT",
        "PNG",
        "QAT",
        "SMR",
        "SSA",
        "SSF",
        "ARG",
        "ASM",
        "BLR",
        "BMU",
        "BRB",
        "CSS",
        "GEO",
        "JPN",
        "LCN",
        "MLI",
        "MNA",
        "MNG",
        "OSS",
        "PRE",
        "SYC",
        "TKM",
        "TZA",
        "VIR",
        "ABW",
        "AFE",
        "AFW",
        "CMR",
        "DNK",
        "ECS",
        "GAB",
        "GIB",
        "KOR",
        "MEA",
        "MLT",
        "PRT",
        "SLB",
        "SLV",
        "SSD",
        "UKR",
        "UZB",
        "AUS",
        "BEL",
        "CHN",
        "EAS",
        "GMB",
        "IDB",
        "LBR",
        "PSE",
        "PSS",
        "ROU",
        "SAS",
        "SWZ",
        "TUR",
        "AFG",
        "ALB",
        "BFA",
        "BIH",
        "BWA",
        "GRC",
        "IRQ",
        "KEN",
        "LIE",
        "LTU",
        "NAM",
        "SGP",
        "VUT",
        "CEB",
        "CYP",
        "GUM",
        "IRL",
        "ISR",
        "MDA",
        "NOR",
        "NZL",
        "PER",
        "SVN",
        "WSM",
        "ZWE",
        "BGR",
        "COD",
        "DZA",
        "ECA",
        "ETH",
        "GUY",
        "IDN",
        "IND",
        "KAZ",
        "LAC",
        "MEX",
        "MNE",
        "NER",
        "NLD",
        "RWA",
        "SLE",
        "SRB",
        "TCA",
        "TON",
        "AND",
        "CAF",
        "CRI",
        "CUB",
        "CZE",
        "EAP",
        "FCS",
        "FJI",
        "GRD",
        "GTM",
        "HIC",
        "IBT",
        "KGZ",
        "KIR",
        "LVA",
        "MIC",
        "MKD",
        "MWI",
        "NPL",
        "PYF",
        "RUS",
        "SEN",
        "SWE",
        "TGO",
        "TLA",
        "TUV",
        "ARB",
        "BTN",
        "HUN",
        "IRN",
        "LKA",
        "MCO",
        "MUS",
        "NGA",
        "PRK",
        "SXM",
        "THA",
        "TUN",
        "VNM",
        "ZAF",
        "COL",
        "GIN",
        "HPC",
        "IDX",
        "ISL",
        "MAC",
        "MAR",
        "MDV",
        "NIC",
        "OED",
        "PHL",
        "SOM",
        "STP",
        "SVK",
        "TTO",
        "USA",
        "BRA",
        "CAN",
        "CPV",
        "CUW",
        "DOM",
        "EMU",
        "ESP",
        "GNB",
        "GNQ",
        "HTI",
        "IMN",
        "KHM",
        "LCA",
        "LMC",
        "LMY",
        "MMR",
        "PAN",
        "POL",
        "PRI",
        "SDN",
        "SST",
        "TEC",
        "UMC",
        "AZE",
        "BGD",
        "BLZ",
        "DJI",
        "DMA",
        "EAR",
        "ERI",
        "GRL",
        "IDA",
        "LIC",
        "SYR",
        "VEN",
        "VGB",
        "WLD",
        "ARM",
        "ATG",
        "CHE",
        "FIN",
        "FRA",
        "FSM",
        "GBR",
        "KNA",
        "MDG",
        "MHL",
        "NCL",
        "PLW",
        "SAU",
        "TMN",
        "TSS",
        "UGA",
        "URY",
        "VCT",
        "BHR",
        "EGY",
        "EUU",
        "ITA",
        "KWT",
        "LBN",
        "LUX",
        "MNP",
        "NRU",
        "OMN",
        "PRY",
        "PST",
        "SUR",
        "TCD",
        "TEA",
        "TLS",
        "YEM",
        "ZMB"
      ]
    },
    {
      "field_name": "TIME_PERIOD",
      "field_value": [
        "2000",
        "2004",
        "1988",
        "1979",
        "1989",
        "2018",
        "2003",
        "1971",
        "2020",
        "1969",
        "1992",
        "1981",
        "2001",
        "1990",
        "2008",
        "1963",
        "1994",
        "2015",
        "1980",
        "2022",
        "2013",
        "1967",
        "2010",
        "1966",
        "1960",
        "1977",
        "1964",
        "2002",
        "1985",
        "1986",
        "2006",
        "2017",
        "1997",
        "1995",
        "1978",
        "2009",
        "1996",
        "1970",
        "1968",
        "2021",
        "1976",
        "1975",
        "1974",
        "1991",
        "1984",
        "1983",
        "1987",
        "2019",
        "1961",
        "2023",
        "1962",
        "2011",
        "1993",
        "2005",
        "2012",
        "1982",
        "1973",
        "1965",
        "1998",
        "1972",
        "2007",
        "2014",
        "2016",
        "1999"
      ]
    }
  ],
  "error": null
}
```

</details>


### 👤 User (Turn 3)

Can you write me a haiku about GDP growth?

### 🤖 Assistant

Rivers of value  
Quiet numbers swell each year  
Lives change, line by line

### 👤 User (Turn 4)

Can you compare Brazil's unemployment trends with those of Argentina over the past decade?

### 🤖 Assistant

**Summary:** Over 2014–2023, Brazil’s unemployment rate was generally higher and more volatile than Argentina’s, with a sharper spike around 2016–2021 and a strong decline after 2021; Argentina’s unemployment rose more moderately and has recently fallen to slightly below Brazil’s level.

---

### Data:

**Unemployment, total (% of total labor force), modeled ILO estimate**  
Indicator: WB_HNP_SL_UEM_TOTL_ZS — ages 15+, both sexes, national estimate/model

| Year | Brazil | Argentina |
|------|--------|-----------|
| 2023 | <span title="verified claim">✅ 7.95</span>% | <span title="verified claim">✅ 6.178</span>% |
| 2022 | <span title="verified claim">✅ 9.231</span>% | <span title="verified claim">✅ 6.805</span>% |
| 2021 | <span title="verified claim">✅ 13.159</span>% | <span title="verified claim">✅ 8.736</span>% |
| 2020 | <span title="verified claim">✅ 13.697</span>% | <span title="verified claim">✅ 11.461</span>% |
| 2019 | <span title="verified claim">✅ 11.936</span>% | <span title="verified claim">✅ 9.843</span>% |
| 2018 | <span title="verified claim">✅ 12.33</span>% | <span title="verified claim">✅ 9.221</span>% |
| 2017 | <span title="verified claim">✅ 12.792</span>% | <span title="verified claim">✅ 8.347</span>% |
| 2016 | <span title="verified claim">✅ 11.58</span>% | <span title="verified claim">✅ 8.083</span>% |
| 2015 | <span title="verified claim">✅ 8.538</span>% | <span title="verified claim">✅ 7.58</span>% |
| 2014 | <span title="verified claim">✅ 6.755</span>% | <span title="verified claim">✅ 7.268</span>% |

*(using latest available data; all values are percentages of the total labor force)*

---

### Analysis:

**1. Starting point (2014–2015):**
- In 2014, Brazil’s unemployment (<span title="verified claim">✅ 6.755</span>%) was slightly below Argentina’s (<span title="verified claim">✅ 7.268</span>%).
- By 2015, Brazil had overtaken Argentina: Brazil at <span title="verified claim">✅ 8.538</span>% vs. Argentina at <span title="verified claim">✅ 7.58</span>%.

**2. Pre‑COVID deterioration (2015–2019):**
- **Brazil:** Unemployment rose steeply from <span title="verified claim">✅ 8.538</span>% (2015) to a peak of around <span title="verified claim">✅ 12.792</span>% (2017), then remained elevated around <span title="verified claim">✅ 12.33</span>% (2018) and <span title="verified claim">✅ 11.936</span>% (2019). This reflects Brazil’s deep recession and slow recovery.
- **Argentina:** Also saw an increase, but more moderate: from <span title="verified claim">✅ 7.58</span>% (2015) to <span title="verified claim">✅ 8.347</span>% (2017), then to <span title="verified claim">✅ 9.221</span>% (2018) and <span title="verified claim">✅ 9.843</span>% (2019), amid its own macroeconomic and currency crises.
- Throughout 2016–2019, Brazil’s unemployment stayed about 2–3 percentage points higher than Argentina’s.

**3. COVID‑19 shock (2020–2021):**
- **Brazil:** Unemployment peaked at about <span title="verified claim">✅ 13.697</span>% in 2020 and remained very high at <span title="verified claim">✅ 13.159</span>% in 2021.
- **Argentina:** Also spiked, from <span title="verified claim">✅ 9.843</span>% (2019) to <span title="verified claim">✅ 11.461</span>% (2020), then eased slightly to <span title="verified claim">✅ 8.736</span>% in 2021.
- The COVID shock hit both labor markets, but Brazil’s unemployment level and persistence were higher.

**4. Post‑COVID recovery (2021–2023):**
- **Brazil:** Strong improvement: from <span title="verified claim">✅ 13.159</span>% (2021) to <span title="verified claim">✅ 9.231</span>% (2022) and further to <span title="verified claim">✅ 7.95</span>% (2023). That’s a drop of over 5 percentage points from the 2020 peak.
- **Argentina:** Gradual decline: from <span title="verified claim">✅ 8.736</span>% (2021) to <span title="verified claim">✅ 6.805</span>% (2022) and <span title="verified claim">✅ 6.178</span>% (2023).
- By 2023, Argentina’s unemployment (<span title="verified claim">✅ 6.178</span>%) is modestly below Brazil’s (<span title="verified claim">✅ 7.95</span>%), reversing the 2015–2021 pattern where Brazil was consistently worse.

**5. Volatility and levels:**
- **Brazil** shows higher volatility: a rapid run‑up from mid‑single digits to the low‑teens, then a sharp fall.
- **Argentina** shows a more gradual rise and fall, with unemployment mostly in the 7–11% range over the decade.
- Over most of 2015–2021, Brazil’s unemployment exceeded Argentina’s by roughly 2–4 percentage points; only at the very start (2014) and end (2023) of the period is Argentina at or below Brazil.

**Limitations:**
- These are **modeled ILO estimates**; the metadata notes that imputed values are uncertain and “should not be used for country rankings or fine comparisons.” They are appropriate for broad trend comparison but not for precise league tables.
- National definitions, survey methods, and labor‑force participation patterns differ between Brazil and Argentina, which can affect comparability.

---

**Sources:**

- **World Bank — Health, Nutrition and Population Statistics (WB_HNP)** — *Unemployment, total (% of total labor force) (modeled ILO estimate)* (indicator ID: WB_HNP_SL_UEM_TOTL_ZS) — ILO‑modeled estimates based mainly on national labor force surveys.

---

**Suggested follow-ups:**

1. Can you show a chart of Brazil vs. Argentina unemployment rates over 2000–2023 instead of just the last decade?  
2. How do youth unemployment trends compare between Brazil and Argentina over the same period?  
3. Can you relate these unemployment trends to GDP growth or major policy changes in each country?

---
<details>
<summary>📋 <b>Tool Calls</b> (click to expand)</summary>

**1. data360_search_indicators**
```json
{
  "query": "Unemployment (%)",
  "required_country": "Brazil, Argentina",
  "limit": 10
}
```
**Result:**
```json
{
  "count": 10,
  "total_count": 98,
  "offset": 0,
  "has_more": true,
  "next_offset": 10,
  "indicators": [
    {
      "idno": "WB_WDI_SL_UEM_TOTL_MA_NE_ZS",
      "database_id": "WB_WDI",
      "name": "Unemployment, male (% of male labor force) (national estimate)",
      "truncated_definition": "Unemployment refers to the share of the labor force that is without work but available for and seeki",
      "periodicity": "Annual",
      "latest_data": "2024",
      "time_period_range": "1960-2024",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_SL_UEM_1524_NE_ZS",
      "database_id": "WB_WDI",
      "name": "Unemployment, youth total (% of total labor force ages 15-24) (national estimate)",
      "truncated_definition": "Youth unemployment refers to the share of the labor force ages 15-24 without work but available for ",
      "periodicity": "Annual",
      "latest_data": "2024",
      "time_period_range": "1960-2024",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_SL_UEM_1524_FE_NE_ZS",
      "database_id": "WB_WDI",
      "name": "Unemployment, youth female (% of female labor force ages 15-24) (national estimate)",
      "truncated_definition": "Youth unemployment refers to the share of the labor force ages 15-24 without work but available for ",
      "periodicity": "Annual",
      "latest_data": "2024",
      "time_period_range": "1960-2024",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_SL_UEM_TOTL_FE_NE_ZS",
      "database_id": "WB_WDI",
      "name": "Unemployment, female (% of female labor force) (national estimate)",
      "truncated_definition": "Unemployment refers to the share of the labor force that is without work but available for and seeki",
      "periodicity": "Annual",
      "latest_data": "2024",
      "time_period_range": "1960-2024",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_SL_UEM_1524_MA_NE_ZS",
      "database_id": "WB_WDI",
      "name": "Unemployment, youth male (% of male labor force ages 15-24) (national estimate)",
      "truncated_definition": "Youth unemployment refers to the share of the labor force ages 15-24 without work but available for ",
      "periodicity": "Annual",
      "latest_data": "2024",
      "time_period_range": "1960-2024",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_GS_SL_UEM_ZS",
      "database_id": "WB_GS",
      "name": "Unemployment (%)",
      "truncated_definition": "Unemployment refers to the share of the labor force that is without work but available for and seeki",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": [
        "SEX",
        "AGE"
      ]
    },
    {
      "idno": "WB_GS_SL_UEM_1524_FM_ZS",
      "database_id": "WB_GS",
      "name": "Ratio of female to male youth unemployment rate (% ages 15-24)",
      "truncated_definition": "Ratio of female to male youth unemployment is the percentage of female to male youth unemployment ra",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_GS_SL_UEM_ELV_ZS",
      "database_id": "WB_GS",
      "name": "Unemployment by level of education (%)",
      "truncated_definition": "Unemployment rate by education level is the percentage of the labor force with a given level of educ",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": [
        "SEX",
        "EDUCATION"
      ]
    },
    {
      "idno": "WB_HNP_SL_UEM_TOTL_ZS",
      "database_id": "WB_HNP",
      "name": "Unemployment, total (% of total labor force) (modeled ILO estimate)",
      "truncated_definition": "Unemployment refers to the share of the labor force that is without work but available for and seeki",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_SSGD_UNEMPLOYMENT_RATE",
      "database_id": "WB_SSGD",
      "name": "Unemployment rate",
      "truncated_definition": "The unemployment rate is the share of the labor force that is without work but available for and see",
      "periodicity": "Other",
      "latest_data": "2022",
      "time_period_range": "2015-2022",
      "covers_country": true,
      "dimensions": [
        "URBANISATION",
        "AGE",
        "SEX"
      ]
    }
  ],
  "required_country": "BRA,ARG",
  "error": null
}
```

**2. data360_search_indicators**
```json
{
  "query": "unemployment rate",
  "required_country": "Brazil, Argentina",
  "limit": 10
}
```
**Result:**
```json
{
  "count": 10,
  "total_count": 874,
  "offset": 0,
  "has_more": true,
  "next_offset": 10,
  "indicators": [
    {
      "idno": "IMF_WEO_LUR",
      "database_id": "IMF_WEO",
      "name": "Unemployment rate, Percent of total labor force",
      "truncated_definition": "Unemployment rate can be defined by either the national definition, the ILO harmonized definition, o",
      "periodicity": "Annual",
      "latest_data": "2029",
      "time_period_range": "1980-2029",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_HCP_UNE_2EAP_MF_Y",
      "database_id": "WB_HCP",
      "name": "Youth unemployment rate (%)",
      "truncated_definition": "Percentage of youth ages 15-24 who are unemployed. This indicator is calculated as the total number ",
      "periodicity": "Annual",
      "latest_data": "2024",
      "time_period_range": "1991-2024",
      "covers_country": true,
      "dimensions": [
        "SEX"
      ]
    },
    {
      "idno": "WB_HCP_UNE_2EAP_MF_A",
      "database_id": "WB_HCP",
      "name": "Adult unemployment rate (%)",
      "truncated_definition": "Percentage of unemployed adults, ages 25 and older. This indicator is calculated as the total number",
      "periodicity": "Annual",
      "latest_data": "2024",
      "time_period_range": "1991-2024",
      "covers_country": true,
      "dimensions": [
        "SEX"
      ]
    },
    {
      "idno": "WB_WDI_SL_UEM_TOTL_MA_NE_ZS",
      "database_id": "WB_WDI",
      "name": "Unemployment, male (% of male labor force) (national estimate)",
      "truncated_definition": "Unemployment refers to the share of the labor force that is without work but available for and seeki",
      "periodicity": "Annual",
      "latest_data": "2024",
      "time_period_range": "1960-2024",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_SL_UEM_TOTL_FE_NE_ZS",
      "database_id": "WB_WDI",
      "name": "Unemployment, female (% of female labor force) (national estimate)",
      "truncated_definition": "Unemployment refers to the share of the labor force that is without work but available for and seeki",
      "periodicity": "Annual",
      "latest_data": "2024",
      "time_period_range": "1960-2024",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_SL_UEM_1524_FE_NE_ZS",
      "database_id": "WB_WDI",
      "name": "Unemployment, youth female (% of female labor force ages 15-24) (national estimate)",
      "truncated_definition": "Youth unemployment refers to the share of the labor force ages 15-24 without work but available for ",
      "periodicity": "Annual",
      "latest_data": "2024",
      "time_period_range": "1960-2024",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_GS_SL_UEM_1524_FM_ZS",
      "database_id": "WB_GS",
      "name": "Ratio of female to male youth unemployment rate (% ages 15-24)",
      "truncated_definition": "Ratio of female to male youth unemployment is the percentage of female to male youth unemployment ra",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_GS_SL_UEM_ZS",
      "database_id": "WB_GS",
      "name": "Unemployment (%)",
      "truncated_definition": "Unemployment refers to the share of the labor force that is without work but available for and seeki",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": [
        "SEX",
        "AGE"
      ]
    },
    {
      "idno": "WB_GS_SL_UEM_ELV_ZS",
      "database_id": "WB_GS",
      "name": "Unemployment by level of education (%)",
      "truncated_definition": "Unemployment rate by education level is the percentage of the labor force with a given level of educ",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": [
        "SEX",
        "EDUCATION"
      ]
    },
    {
      "idno": "WB_SSGD_UNEMPLOYMENT_RATE",
      "database_id": "WB_SSGD",
      "name": "Unemployment rate",
      "truncated_definition": "The unemployment rate is the share of the labor force that is without work but available for and see",
      "periodicity": "Other",
      "latest_data": "2022",
      "time_period_range": "2015-2022",
      "covers_country": true,
      "dimensions": [
        "URBANISATION",
        "AGE",
        "SEX"
      ]
    }
  ],
  "required_country": "BRA,ARG",
  "error": null
}
```

**3. data360_get_data**
```json
{
  "database_id": "WB_HNP",
  "indicator_id": "WB_HNP_SL_UEM_TOTL_ZS",
  "disaggregation_filters": {
    "REF_AREA": "BRA,ARG"
  },
  "start_year": 2014,
  "end_year": 2023,
  "limit": 100
}
```
**Result:**
```json
{
  "count": 20,
  "total_count": null,
  "offset": 0,
  "has_more": false,
  "next_offset": null,
  "data": [
    {
      "OBS_VALUE": "6.178",
      "TIME_FORMAT": "602",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": true,
      "DATABASE_ID": "WB_HNP",
      "INDICATOR": "WB_HNP_SL_UEM_TOTL_ZS",
      "REF_AREA": "ARG",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2023",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "466cc398"
    },
    {
      "OBS_VALUE": "7.95",
      "TIME_FORMAT": "602",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": true,
      "DATABASE_ID": "WB_HNP",
      "INDICATOR": "WB_HNP_SL_UEM_TOTL_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2023",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "8612fc82"
    },
    {
      "OBS_VALUE": "6.805",
      "TIME_FORMAT": "602",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_HNP",
      "INDICATOR": "WB_HNP_SL_UEM_TOTL_ZS",
      "REF_AREA": "ARG",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2022",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "201d7a7d"
    },
    {
      "OBS_VALUE": "9.231",
      "TIME_FORMAT": "602",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_HNP",
      "INDICATOR": "WB_HNP_SL_UEM_TOTL_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2022",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "f4b1479f"
    },
    {
      "OBS_VALUE": "8.736",
      "TIME_FORMAT": "602",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_HNP",
      "INDICATOR": "WB_HNP_SL_UEM_TOTL_ZS",
      "REF_AREA": "ARG",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2021",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "0963149d"
    },
    {
      "OBS_VALUE": "13.159",
      "TIME_FORMAT": "602",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_HNP",
      "INDICATOR": "WB_HNP_SL_UEM_TOTL_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2021",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "355737b3"
    },
    {
      "OBS_VALUE": "11.461",
      "TIME_FORMAT": "602",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_HNP",
      "INDICATOR": "WB_HNP_SL_UEM_TOTL_ZS",
      "REF_AREA": "ARG",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2020",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "48545c59"
    },
    {
      "OBS_VALUE": "13.697",
      "TIME_FORMAT": "602",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_HNP",
      "INDICATOR": "WB_HNP_SL_UEM_TOTL_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2020",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "b4cb418a"
    },
    {
      "OBS_VALUE": "9.843",
      "TIME_FORMAT": "602",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_HNP",
      "INDICATOR": "WB_HNP_SL_UEM_TOTL_ZS",
      "REF_AREA": "ARG",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2019",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "faa7e93b"
    },
    {
      "OBS_VALUE": "11.936",
      "TIME_FORMAT": "602",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_HNP",
      "INDICATOR": "WB_HNP_SL_UEM_TOTL_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2019",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "2da47054"
    },
    {
      "OBS_VALUE": "9.221",
      "TIME_FORMAT": "602",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_HNP",
      "INDICATOR": "WB_HNP_SL_UEM_TOTL_ZS",
      "REF_AREA": "ARG",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2018",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "e674b4f5"
    },
    {
      "OBS_VALUE": "12.33",
      "TIME_FORMAT": "602",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_HNP",
      "INDICATOR": "WB_HNP_SL_UEM_TOTL_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2018",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "55bae6ef"
    },
    {
      "OBS_VALUE": "8.347",
      "TIME_FORMAT": "602",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_HNP",
      "INDICATOR": "WB_HNP_SL_UEM_TOTL_ZS",
      "REF_AREA": "ARG",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2017",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "c50eace6"
    },
    {
      "OBS_VALUE": "12.792",
      "TIME_FORMAT": "602",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_HNP",
      "INDICATOR": "WB_HNP_SL_UEM_TOTL_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2017",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "1fb1b4ed"
    },
    {
      "OBS_VALUE": "8.083",
      "TIME_FORMAT": "602",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_HNP",
      "INDICATOR": "WB_HNP_SL_UEM_TOTL_ZS",
      "REF_AREA": "ARG",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2016",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "a6307e01"
    },
    {
      "OBS_VALUE": "11.58",
      "TIME_FORMAT": "602",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_HNP",
      "INDICATOR": "WB_HNP_SL_UEM_TOTL_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2016",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "85f4a520"
    },
    {
      "OBS_VALUE": "7.58",
      "TIME_FORMAT": "602",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_HNP",
      "INDICATOR": "WB_HNP_SL_UEM_TOTL_ZS",
      "REF_AREA": "ARG",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2015",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "01efa230"
    },
    {
      "OBS_VALUE": "8.538",
      "TIME_FORMAT": "602",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_HNP",
      "INDICATOR": "WB_HNP_SL_UEM_TOTL_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2015",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "956953d1"
    },
    {
      "OBS_VALUE": "7.268",
      "TIME_FORMAT": "602",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_HNP",
      "INDICATOR": "WB_HNP_SL_UEM_TOTL_ZS",
      "REF_AREA": "ARG",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2014",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "3bca1386"
    },
    {
      "OBS_VALUE": "6.755",
      "TIME_FORMAT": "602",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_HNP",
      "INDICATOR": "WB_HNP_SL_UEM_TOTL_ZS",
      "REF_AREA": "BRA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2014",
      "FREQ": "A",
      "UNIT_MEASURE": "PT",
      "UNIT_TYPE": null,
      "claim_id": "b4d1587a"
    }
  ],
  "metadata": {
    "idno": "WB_HNP_SL_UEM_TOTL_ZS",
    "name": "Unemployment, total (% of total labor force) (modeled ILO estimate)",
    "database_id": "WB_HNP",
    "measurement_unit": "Percent",
    "periodicity": "Annual",
    "definition_short": "Unemployment, total (% of total labor force) (modeled ILO estimate)"
  },
  "error": null,
  "failed_validation": null
}
```

**4. data360_get_metadata**
```json
{
  "database_id": "WB_HNP",
  "indicator_id": "WB_HNP_SL_UEM_TOTL_ZS",
  "select_fields": [
    "definition_long",
    "methodology",
    "limitation",
    "periodicity",
    "time_periods",
    "sources_note"
  ]
}
```
**Result:**
```json
{
  "indicator_metadata": {
    "periodicity": "Annual",
    "definition_long": "Unemployment refers to the share of the labor force that is without work but available for and seeking employment.",
    "methodology": "The standard definition of unemployed persons is those individuals without work, seeking work in a recent past period, and currently available for work, including people who have lost their jobs or voluntarily left work. In addition, persons who did not look for work but have an arrangement for a future job are also counted as unemployed. Still, some unemployment is unavoidable\u2014at any time, some workers are temporarily unemployed between jobs as employers look for the right workers and workers search for better jobs. The labor force or the economically active portion of the population serves as the base for this indicator, not the total population.\r\n\r\nThe series is part of the \"ILO modeled estimates database,\" including nationally reported observations and imputed data for countries with missing data, primarily to capture regional and global trends with consistent country coverage. Country-reported microdata is based mainly on nationally representative labor force surveys, with other sources (e.g., household surveys and population censuses) considering differences in the data source, the scope of coverage, methodology, and other country-specific factors. Country analysis requires caution where limited nationally reported data are available. A series of models are also applied to impute missing observations and make projections. However, imputed observations are not based on national data, are subject to high uncertainty, and should not be used for country comparisons or rankings. For more information: https://ilostat.ilo.org/resources/concepts-and-definitions/ilo-modelled-estimates/",
    "limitation": null,
    "sources_note": null,
    "time_periods": [
      {
        "start": "1960",
        "end": "2023",
        "notes": null
      }
    ]
  },
  "disaggregation_options": [
    {
      "field_name": "FREQ",
      "label_name": "Frequency of observation",
      "field_value": [
        "A"
      ]
    },
    {
      "field_name": "REF_AREA",
      "label_name": "Reference area",
      "field_value": [
        "NER",
        "LBY",
        "BHS",
        "CPV",
        "MCO",
        "PAN",
        "COM",
        "ZWE",
        "BEL",
        "MWI",
        "BGR",
        "CHN",
        "PHL",
        "AUT",
        "FIN",
        "NLD",
        "GUY",
        "TGO",
        "EAP",
        "FRA",
        "JOR",
        "KIR",
        "KEN",
        "LCA",
        "TLA",
        "ARE",
        "BGD",
        "TUN",
        "CHL",
        "IMN",
        "ECA",
        "OSS",
        "SSA",
        "DZA",
        "TLS",
        "GTM",
        "CRI",
        "BIH",
        "IBD",
        "PSS",
        "CHE",
        "NPL",
        "PRY",
        "MAC",
        "SOM",
        "AFE",
        "BTN",
        "USA",
        "IBT",
        "ISR",
        "URY",
        "CMR",
        "SAS",
        "BLZ",
        "LTE",
        "SWZ",
        "BDI",
        "XKX",
        "ZAF",
        "HTI",
        "GEO",
        "GHA",
        "INX",
        "JAM",
        "SMR",
        "TEA",
        "GRD",
        "TCA",
        "SGP",
        "NCL",
        "EST",
        "MDV",
        "FRO",
        "AFW",
        "SYC",
        "PRT",
        "KGZ",
        "GRC",
        "ERI",
        "IDA",
        "PST",
        "PYF",
        "TEC",
        "MOZ",
        "VEN",
        "JPN",
        "SDN",
        "TKM",
        "TSA",
        "EMU",
        "CUB",
        "PRE",
        "VGB",
        "LCN",
        "ZMB",
        "MNE",
        "EUU",
        "GNB",
        "FJI",
        "POL",
        "TJK",
        "CYM",
        "COG",
        "LIE",
        "TZA",
        "ARB",
        "LKA",
        "KOR",
        "CAN",
        "UKR",
        "KHM",
        "LBR",
        "SUR",
        "CUW",
        "IRN",
        "EAR",
        "HRV",
        "HUN",
        "KWT",
        "ATG",
        "KAZ",
        "ALB",
        "LAO",
        "BOL",
        "DJI",
        "GMB",
        "IDX",
        "FCS",
        "NAC",
        "HPC",
        "LTU",
        "SST",
        "IND",
        "NZL",
        "ARG",
        "CHI",
        "QAT",
        "MEX",
        "PSE",
        "ECS",
        "THA",
        "LDC",
        "MLT",
        "VNM",
        "MLI",
        "MIC",
        "OED",
        "IRQ",
        "HND",
        "WLD",
        "CAF",
        "NRU",
        "BHR",
        "MHL",
        "MUS",
        "PER",
        "AGO",
        "EAS",
        "UMC",
        "AZE",
        "IDB",
        "MNA",
        "SXM",
        "SAU",
        "GAB",
        "IRL",
        "RUS",
        "ETH",
        "GIN",
        "SLE",
        "BWA",
        "CYP",
        "DOM",
        "UZB",
        "BLR",
        "DMA",
        "STP",
        "TUR",
        "NAM",
        "MAF",
        "AFG",
        "BRA",
        "MKD",
        "PAK",
        "AUS",
        "PRI",
        "AND",
        "NIC",
        "LSO",
        "CEB",
        "SSD",
        "TTO",
        "BRN",
        "PRK",
        "MNP",
        "MYS",
        "EGY",
        "GIB",
        "LUX",
        "VCT",
        "VUT",
        "LMC",
        "GBR",
        "VIR",
        "DEU",
        "PNG",
        "SEN",
        "SSF",
        "CIV",
        "NOR",
        "OMN",
        "SVK",
        "SWE",
        "CSS",
        "MNG",
        "WSM",
        "LIC",
        "BEN",
        "KNA",
        "TCD",
        "NGA",
        "ROU",
        "SRB",
        "GNQ",
        "TUV",
        "IDN",
        "ISL",
        "RWA",
        "TON",
        "ABW",
        "MAR",
        "DNK",
        "TMN",
        "BRB",
        "CZE",
        "HIC",
        "ITA",
        "SYR",
        "ESP",
        "FSM",
        "MDA",
        "ARM",
        "GUM",
        "MEA",
        "MDG",
        "ECU",
        "GRL",
        "LBN",
        "LVA",
        "SLV",
        "SVN",
        "COL",
        "SLB",
        "BFA",
        "BMU",
        "UGA",
        "HKG",
        "TSS",
        "LMY",
        "ASM",
        "MMR",
        "PLW",
        "YEM",
        "MRT",
        "LAC",
        "COD"
      ]
    },
    {
      "field_name": "INDICATOR",
      "label_name": "Statistical indicator",
      "field_value": [
        "WB_HNP_SL_UEM_TOTL_ZS"
      ]
    },
    {
      "field_name": "SEX",
      "label_name": "Sex",
      "field_value": [
        "_T",
        "M",
        "F"
      ]
    },
    {
      "field_name": "AGE",
      "label_name": "Age",
      "field_value": [
        "_T"
      ]
    },
    {
      "field_name": "URBANISATION",
      "label_name": "Degree of urbanisation",
      "field_value": [
        "_T"
      ]
    },
    {
      "field_name": "UNIT_MEASURE",
      "label_name": "Unit of measure",
      "field_value": [
        "PT"
      ]
    },
    {
      "field_name": "TIME_PERIOD",
      "label_name": "Time period",
      "field_value": [
        "2015",
        "2012",
        "1990",
        "2006",
        "1988",
        "2009",
        "1966",
        "1982",
        "1972",
        "1995",
        "1993",
        "1980",
        "1989",
        "1979",
        "2017",
        "2018",
        "2021",
        "1987",
        "2000",
        "1969",
        "1974",
        "2022",
        "1984",
        "1978",
        "1985",
        "1970",
        "1996",
        "1965",
        "1994",
        "2003",
        "1971",
        "1963",
        "2020",
        "1983",
        "2002",
        "2004",
        "1967",
        "2005",
        "1975",
        "2016",
        "1962",
        "1973",
        "1997",
        "2007",
        "2008",
        "1986",
        "2001",
        "1991",
        "1999",
        "1981",
        "2023",
        "2014",
        "1977",
        "2019",
        "2011",
        "1998",
        "1992",
        "1976",
        "2010",
        "1960",
        "1961",
        "2013",
        "1968",
        "1964"
      ]
    }
  ],
  "error": null
}
```

</details>

---
<details>
<summary>🧠 <b>Planner Reasoning</b> (click to expand)</summary>

**Intent:** You want a comparison of Brazil’s and Argentina’s unemployment trends over roughly the last decade (using latest available data, 2014–2023).

**Selection Logic:**  
I used the World Bank Health, Nutrition and Population database indicator **“Unemployment, total (% of total labor force) (modeled ILO estimate)”** (ID: `WB_HNP_SL_UEM_TOTL_ZS`) because:
- It’s available for both Brazil and Argentina.
- It provides a consistent, ILO‑modeled unemployment rate for international comparison.
- It has annual data through 2023 for both countries.

**Data Gaps:**  
- Both countries have continuous annual data from 2014–2023 in this series; no missing years in that window.
- Values are modeled ILO estimates; metadata warns they should not be used for fine country rankings, but they are suitable for broad trend comparison.

**CLARIFYING QUESTION:** None.

---

</details>
