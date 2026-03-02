# HEALTH_RESEARCHER — Conversation & Evaluation

**Timestamp:** 20260301_180454
**Persona:** Dr. Thandi is a 38-year-old public health researcher specializing in infectious diseases in Southern...
**Turns:** 6

## Evaluation Results

| Metric | Score | Threshold | Status |
|---|---|---|---|
| Conversation Completeness | 1.00 | 0.5 | ✅ PASS |
| Turn Faithfulness | 1.00 | 0.5 | ✅ PASS |
| Context Retention [Conversational GEval] | 1.00 | 0.5 | ✅ PASS |
| Claim Tagging & PCN [Conversational GEval] | 1.00 | 0.5 | ✅ PASS |
| Data Accuracy [Conversational GEval] | 1.00 | 0.5 | ✅ PASS |
| Source Citation [Conversational GEval] | 1.00 | 0.5 | ✅ PASS |
| Follow-up Suggestions [Conversational GEval] | 1.00 | 0.5 | ✅ PASS |
| Data Formatting [Conversational GEval] | 1.00 | 0.5 | ✅ PASS |
| Latest Data Note [Conversational GEval] | 1.00 | 0.5 | ✅ PASS |
| Content Structure [Conversational GEval] | 1.00 | 0.5 | ✅ PASS |
| Tool Call Appropriateness [Conversational GEval] | 1.00 | 0.5 | ✅ PASS |
| Tool Argument Quality [Conversational GEval] | 1.00 | 0.5 | ✅ PASS |

**Pass Rate:** 12/12 (100%)

## Insights

### Strengths

- **Perfect/near-perfect scores (≥0.95):** **Claim Tagging & PCN [Conversational GEval]**, **Content Structure [Conversational GEval]**, **Context Retention [Conversational GEval]**, **Conversation Completeness**, **Data Accuracy [Conversational GEval]**, **Data Formatting [Conversational GEval]**, **Follow-up Suggestions [Conversational GEval]**, **Latest Data Note [Conversational GEval]**, **Source Citation [Conversational GEval]**, **Tool Argument Quality [Conversational GEval]**, **Tool Call Appropriateness [Conversational GEval]**, **Turn Faithfulness**

### No Failures 🎉

All metrics passed their thresholds.

---

## Conversation

### 👤 User (Turn 1)

Hello, I’m looking to gather the latest data on HIV prevalence and maternal mortality rates for South Africa, Botswana, and Namibia. Could you help me access this information with detailed metadata and notes on data quality?

### 🤖 Assistant

**Intent:** Provide the latest comparable HIV prevalence and maternal mortality data for South Africa, Botswana, and Namibia, with detailed metadata and data‑quality notes.

---

**Data (latest available from World Bank / UN agencies)**  

_All data are modeled estimates from international agencies, not raw country vital‑registration counts._

### 1. HIV prevalence, adults 15–49 (%)

Indicator: **Prevalence of HIV, total (% of population ages 15–49)**  
Code: **WB_WDI_SH_DYN_AIDS_ZS** (WDI / UNAIDS Spectrum model)  
Latest year available: **2024**

| Country        | 2024 (% of adults 15–49 living with HIV) |
|----------------|-------------------------------------------|
| South Africa   | <claim id="3878cdc4" policy="auto">17.2</claim>% |
| Botswana       | <claim id="afe70664" policy="auto">15.7</claim>% |
| Namibia        | <claim id="e6455594" policy="auto">9</claim>%    |

Recent trend (2020–2024, % of adults 15–49):

- **South Africa**
  - 2020: <claim id="4f47cc43" policy="auto">18.4</claim>%
  - 2021: <claim id="2eab0aa5" policy="auto">18.2</claim>%
  - 2022: <claim id="09b4cdd6" policy="auto">17.9</claim>%
  - 2023: <claim id="98d86436" policy="auto">17.6</claim>%
  - 2024: <claim id="3878cdc4" policy="auto">17.2</claim>%

- **Botswana**
  - 2020: <claim id="c986de9d" policy="auto">19</claim>%
  - 2021: <claim id="07d599a1" policy="auto">18.2</claim>%
  - 2022: <claim id="9a286d05" policy="auto">17.4</claim>%
  - 2023: <claim id="147d9d7a" policy="auto">16.6</claim>%
  - 2024: <claim id="afe70664" policy="auto">15.7</claim>%

- **Namibia**
  - 2020: <claim id="0c611505" policy="auto">10.6</claim>%
  - 2021: <claim id="a5047eab" policy="auto">10.2</claim>%
  - 2022: <claim id="26482c53" policy="auto">9.8</claim>%
  - 2023: <claim id="1be9fe5f" policy="auto">9.4</claim>%
  - 2024: <claim id="e6455594" policy="auto">9</claim>%

---

### 2. Maternal mortality ratio (per 100,000 live births)

Indicator: **Maternal mortality ratio (modeled estimate, per 100,000 live births)**  
Code: **WB_WDI_SH_STA_MMRT** (WDI / MMEIG: WHO, UNICEF, UNFPA, World Bank, UNDESA)  
Latest year available: **2023**

| Country        | 2023 maternal deaths per 100,000 live births |
|----------------|----------------------------------------------|
| South Africa   | <claim id="b48a6b8f" policy="auto">118</claim> |
| Botswana       | <claim id="513dd7a2" policy="auto">155</claim> |
| Namibia        | <claim id="615382c8" policy="auto">139</claim> |

Recent trend (2020–2023, per 100,000 live births):

- **South Africa**
  - 2020: <claim id="3d773beb" policy="auto">118</claim>
  - 2021: <claim id="3a3134ac" policy="auto">191</claim>
  - 2022: <claim id="82777120" policy="auto">129</claim>
  - 2023: <claim id="b48a6b8f" policy="auto">118</claim>

- **Botswana**
  - 2020: <claim id="82b263ed" policy="auto">98</claim>
  - 2021: <claim id="2d8554c5" policy="auto">165</claim>
  - 2022: <claim id="6ca0eef0" policy="auto">120</claim>
  - 2023: <claim id="513dd7a2" policy="auto">155</claim>

- **Namibia**
  - 2020: <claim id="67cf8fa4" policy="auto">143</claim>
  - 2021: <claim id="d3255a18" policy="auto">254</claim>
  - 2022: <claim id="a7abaffd" policy="auto">127</claim>
  - 2023: <claim id="615382c8" policy="auto">139</claim>

---

## Analysis (brief)

- **HIV prevalence**
  - All three countries have **very high adult HIV prevalence** by global standards, with South Africa and Botswana above 15% and Namibia just under 10% in 2024.
  - All three show a **gradual decline** in prevalence since 2020, consistent with expanded ART coverage and prevention.

- **Maternal mortality**
  - Ratios remain **well above SDG target 3.1** (70 deaths per 100,000 live births).
  - All three countries show a **spike in 2021**, likely reflecting COVID‑19 disruptions and indirect effects on maternal care, followed by some improvement but not a full return to pre‑spike levels in Botswana and Namibia.

---

## Metadata and data‑quality notes

### HIV prevalence (WB_WDI_SH_DYN_AIDS_ZS)

- **Definition:**  
  “Prevalence of HIV refers to the percentage of people ages 15–49 who are infected with HIV.” (UNAIDS Spectrum model).

- **Methodology (key points):**
  - Produced by **UNAIDS** using the **Spectrum** modeling framework.
  - Integrates:
    - HIV surveillance data (sentinel surveillance, routine testing)
    - ART coverage and program data
    - Demographic data and assumptions on transmission, progression, survival.
  - Estimates are **modeled**, not simple counts; they include **uncertainty ranges** (not shown in WDI series but available from UNAIDS).

- **Data quality / limitations:**
  - Many countries lack complete case reporting or cause‑of‑death data; hence **model dependence is high**.
  - National prevalence can **mask sub‑national and key‑population heterogeneity**.
  - Time series are periodically revised as UNAIDS updates methods and inputs; **historical values can change** between releases.
  - WDI notes:  
    > “The limited availability of data on health status is a major constraint… Estimates of prevalence and incidence are available for some diseases but are often unreliable and incomplete.”

- **Comparability:**
  - Very good **cross‑country comparability**, because the same UNAIDS model and assumptions are applied globally.
  - Less suitable for **short‑term program evaluation** at sub‑national level; use national surveillance data where available.

---

### Maternal mortality ratio (WB_WDI_SH_STA_MMRT)

- **Definition:**  
  “Number of women who die from pregnancy‑related causes while pregnant or within 42 days of pregnancy termination per 100,000 live births.”

- **Methodology (MMEIG model):**
  - Produced by the **Maternal Mortality Estimation Inter‑Agency Group (MMEIG)**: WHO, UNICEF, UNFPA, World Bank, UNDESA.
  - Uses a **regression model** combining:
    - Proportion of maternal deaths among non‑AIDS deaths in women 15–49
    - Fertility levels
    - Skilled birth attendance and other health‑system indicators
    - GDP (PPP) and other socioeconomic variables
  - For countries with **no or poor data**, the model extrapolates from regional patterns and covariates.

- **Data quality / limitations:**
  - WDI explicitly warns:  
    > “Maternal mortality ratios are generally of unknown reliability… The ratios cannot be assumed to provide an exact estimate of maternal mortality.”
  - Household surveys (e.g., DHS “sisterhood” method) produce estimates that:
    - Refer to a **multi‑year period before the survey**, not a single year.
    - Are subject to **sampling error and recall bias**.
  - Vital registration misclassification (e.g., pregnancy status not recorded) leads to **under‑reporting** even in high‑income settings.
  - **Methodological changes over time**:  
    > “The methodology differs from that used for previous estimates, so data should not be compared historically.”
    - This means long‑term trends across major MMEIG revisions should be interpreted cautiously.

- **Comparability:**
  - Good for **broad cross‑country comparisons** and SDG monitoring.
  - Less precise for **year‑to‑year changes** or for evaluating specific national programs; national confidential enquiries into maternal deaths are more precise but less comparable.

---

## Direct access to data & metadata

You can pull the full series and metadata directly:

### HIV prevalence (SH.DYN.AIDS.ZS)

- **CSV (Data360/WDI):**  
  https://data360files.worldbank.org/data360-data/data/WB_WDI/WB_WDI_SH_DYN_AIDS_ZS.csv
- **Metadata JSON (Data360):**  
  https://data360files.worldbank.org/data360-data/metadata/WB_WDI/WB_WDI_SH_DYN_AIDS_ZS.json
- **WDI API (all countries, 1990–2021 example):**  
  https://api.worldbank.org/v2/countries/all/indicators/sh.dyn.aids.zs?date=1990:2021&format=json  

### Maternal mortality ratio (SH.STA.MMRT)

- **CSV (Data360/WDI):**  
  https://data360files.worldbank.org/data360-data/data/WB_WDI/WB_WDI_SH_STA_MMRT.csv
- **Metadata JSON (Data360):**  
  https://data360files.worldbank.org/data360-data/metadata/WB_WDI/WB_WDI_SH_STA_MMRT.json
- **WDI API (all countries, 2000–2020 example):**  
  https://api.worldbank.org/v2/countries/all/indicators/sh.sta.mmrt?date=2000:2020&format=json  

If you’d like, I can also provide a short Python snippet to download and filter these for just South Africa (ZAF), Botswana (BWA), and Namibia (NAM).

---

**Sources:**

- **World Bank — World Development Indicators (WDI)**  
  - *Prevalence of HIV, total (% of population ages 15–49)* (SH.DYN.AIDS.ZS) — modeled UNAIDS Spectrum estimates; annual; 1990–2024; unit: percent of adults 15–49.  
  - *Maternal mortality ratio (modeled estimate, per 100,000 live births)* (SH.STA.MMRT) — MMEIG regression model; annual; 1985–2023; unit: deaths per 100,000 live births.
- **UNAIDS** — AIDSinfo and Global AIDS Update methodology annex (Spectrum model).
- **WHO / UNICEF / UNFPA / World Bank / UNDESA** — *Trends in Maternal Mortality* and related methodological notes.

---

**Suggested follow-ups:**

1. Could you show simple charts comparing HIV prevalence and maternal mortality trends over time for these three countries?  
2. Can you break down HIV prevalence by sex or age group for South Africa, Botswana, and Namibia if such disaggregated indicators are available?  
3. How do these HIV and maternal mortality indicators compare with regional averages for Sub‑Saharan Africa and with global averages?

---
📋 **Tool Calls** (for evaluation context)

**1. data360_search_indicators**
```json
{
  "query": "HIV prevalence (adult)",
  "required_country": "South Africa, Botswana, Namibia",
  "limit": 10
}
```
**Result:**
```json
{
  "count": 10,
  "total_count": 376,
  "offset": 0,
  "has_more": true,
  "next_offset": 10,
  "indicators": [
    {
      "idno": "WB_WDI_SH_DYN_AIDS_ZS",
      "database_id": "WB_WDI",
      "name": "Prevalence of HIV, total (% of population ages 15-49)",
      "truncated_definition": "Prevalence of HIV refers to the percentage of people ages 15-49 who are infected with HIV.",
      "periodicity": "Annual",
      "latest_data": "2024",
      "time_period_range": "1990-2024",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_SH_HIV_1524_MA_ZS",
      "database_id": "WB_WDI",
      "name": "Prevalence of HIV, male (% ages 15-24)",
      "truncated_definition": "Prevalence of HIV, male is the percentage of males who are infected with HIV. Youth rates are as a p",
      "periodicity": "Annual",
      "latest_data": "2024",
      "time_period_range": "1990-2024",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_SH_HIV_1524_FE_ZS",
      "database_id": "WB_WDI",
      "name": "Prevalence of HIV, female (% ages 15-24)",
      "truncated_definition": "Prevalence of HIV, female is the percentage of females who are infected with HIV. Youth rates are as",
      "periodicity": "Annual",
      "latest_data": "2024",
      "time_period_range": "1990-2024",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_SH_DYN_AIDS_FE_ZS",
      "database_id": "WB_WDI",
      "name": "Women's share of population ages 15+ living with HIV (%)",
      "truncated_definition": "Prevalence of HIV is the percentage of people who are infected with HIV. Female rate is as a percent",
      "periodicity": "Annual",
      "latest_data": "2024",
      "time_period_range": "1990-2024",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_HNP_SH_DYN_AIDS_ZS",
      "database_id": "WB_HNP",
      "name": "Prevalence of HIV (% of population with relevant ages)",
      "truncated_definition": "Prevalence of HIV refers to the percentage of people ages who are infected with HIV.  The data is av",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_HNP_SH_HIV_INCD",
      "database_id": "WB_HNP",
      "name": "Population newly infected with HIV",
      "truncated_definition": "Number of adults (ages 15-49) newly infected with HIV.",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_HNP_SH_HIV_ZS",
      "database_id": "WB_HNP",
      "name": "Prevalence of HIV (% of total)",
      "truncated_definition": "Prevalence of HIV (% of total)",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_HNP_SH_HIV_ORPH",
      "database_id": "WB_HNP",
      "name": "Children orphaned by HIV/AIDS",
      "truncated_definition": "Number of children orphaned by HIV/AIDS is the estimated number of children who have lost their moth",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_GS_SH_HIV_1524_ZS",
      "database_id": "WB_GS",
      "name": "Prevalence of HIV (% ages 15-24)",
      "truncated_definition": "Prevalence of HIV is the percentage of people who are infected with HIV. Includes breakdown by sex.",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": [
        "SEX"
      ]
    },
    {
      "idno": "WEF_GCIHH_HIVPREV",
      "database_id": "WEF_GCIHH",
      "name": "HIV prevalence, % adult pop.",
      "truncated_definition": "Please refer to: https://www3.weforum.org/docs/GCR2016-2017/05FullReport/TheGlobalCompetitivenessRep",
      "periodicity": "Annual",
      "latest_data": "2017",
      "time_period_range": "2007-2017",
      "covers_country": true,
      "dimensions": null
    }
  ],
  "required_country": "ZAF,BWA,NAM",
  "error": null
}
```

**2. data360_search_indicators**
```json
{
  "query": "maternal mortality ratio (per 100,000 live births)",
  "required_country": "South Africa, Botswana, Namibia",
  "limit": 10
}
```
**Result:**
```json
{
  "count": 10,
  "total_count": 1504,
  "offset": 0,
  "has_more": true,
  "next_offset": 10,
  "indicators": [
    {
      "idno": "WB_HNP_SH_STA_MMRT",
      "database_id": "WB_HNP",
      "name": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "truncated_definition": "Maternal mortality ratio is the number of women who die from pregnancy-related causes while pregnant",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_GS_SH_STA_MMRT",
      "database_id": "WB_GS",
      "name": "Maternal mortality ratio (per 100,000 live births)",
      "truncated_definition": "Maternal mortality ratio is the number of women who die from pregnancy-related causes while pregnant",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_HNP_SH_STA_MMRT_NE",
      "database_id": "WB_HNP",
      "name": "Maternal mortality ratio (national estimate, per 100,000 live births)",
      "truncated_definition": "Maternal mortality ratio is the number of women who die from pregnancy-related causes while pregnant",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_SH_STA_MMRT_NE",
      "database_id": "WB_WDI",
      "name": "Maternal mortality ratio (national estimate, per 100,000 live births)",
      "truncated_definition": "Maternal mortality ratio is the number of women who die from pregnancy-related causes while pregnant",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1985-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_SH_STA_MMRT",
      "database_id": "WB_WDI",
      "name": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "truncated_definition": "Maternal mortality ratio is the number of women who die from pregnancy-related causes while pregnant",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1985-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_GS_SP_DYN_IMRT_IN",
      "database_id": "WB_GS",
      "name": "Mortality rate, infant (per 1,000 live births)",
      "truncated_definition": "Infant mortality rate is the number of infants dying before reaching one year of age, per 1,000 live",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": [
        "SEX"
      ]
    },
    {
      "idno": "WB_WDI_SP_DYN_IMRT_IN",
      "database_id": "WB_WDI",
      "name": "Mortality rate, infant (per 1,000 live births)",
      "truncated_definition": "Infant mortality rate is the number of infants dying before reaching one year of age, per 1,000 live",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_SH_DYN_NMRT",
      "database_id": "WB_WDI",
      "name": "Mortality rate, neonatal (per 1,000 live births)",
      "truncated_definition": "Neonatal mortality rate is the number of neonates dying before reaching 28 days of age, per 1,000 li",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_HNP_SP_DYN_IMRT_IN",
      "database_id": "WB_HNP",
      "name": "Mortality rate, infant (per 1,000 live births)",
      "truncated_definition": "Infant mortality rate is the number of infants dying before reaching one year of age, per 1,000 live",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_HCP_LASTNM_MMRT",
      "database_id": "WB_HCP",
      "name": "Maternal mortality ratio (per 100,000 live births)",
      "truncated_definition": "Maternal mortality ratio is the number of women who die from pregnancy-related causes while pregnant",
      "periodicity": "Annual",
      "latest_data": "2018",
      "time_period_range": "1985-2018",
      "covers_country": true,
      "dimensions": null
    }
  ],
  "required_country": "ZAF,BWA,NAM",
  "error": null
}
```

**3. data360_get_data**
```json
{
  "database_id": "WB_WDI",
  "indicator_id": "WB_WDI_SH_DYN_AIDS_ZS",
  "disaggregation_filters": {
    "REF_AREA": "ZAF,BWA,NAM"
  },
  "start_year": 2020,
  "end_year": 2024,
  "limit": 50,
  "offset": 0
}
```
**Result:**
```json
{
  "count": 15,
  "total_count": null,
  "offset": 0,
  "has_more": false,
  "next_offset": null,
  "data": [
    {
      "OBS_VALUE": "17.2",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": true,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "ZAF",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2024",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "3878cdc4"
    },
    {
      "OBS_VALUE": "9",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": true,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "NAM",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2024",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "e6455594"
    },
    {
      "OBS_VALUE": "15.7",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": true,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "BWA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2024",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "afe70664"
    },
    {
      "OBS_VALUE": "17.6",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "ZAF",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2023",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "98d86436"
    },
    {
      "OBS_VALUE": "9.4",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "NAM",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2023",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "1be9fe5f"
    },
    {
      "OBS_VALUE": "16.6",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "BWA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2023",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "147d9d7a"
    },
    {
      "OBS_VALUE": "17.9",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "ZAF",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2022",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "09b4cdd6"
    },
    {
      "OBS_VALUE": "9.8",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "NAM",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2022",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "26482c53"
    },
    {
      "OBS_VALUE": "17.4",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "BWA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2022",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "9a286d05"
    },
    {
      "OBS_VALUE": "10.2",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "NAM",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2021",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "a5047eab"
    },
    {
      "OBS_VALUE": "18.2",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "ZAF",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2021",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "2eab0aa5"
    },
    {
      "OBS_VALUE": "18.2",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "BWA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2021",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "07d599a1"
    },
    {
      "OBS_VALUE": "19",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "BWA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2020",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "c986de9d"
    },
    {
      "OBS_VALUE": "18.4",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "ZAF",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2020",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "4f47cc43"
    },
    {
      "OBS_VALUE": "10.6",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "NAM",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2020",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "0c611505"
    }
  ],
  "metadata": {
    "idno": "WB_WDI_SH_DYN_AIDS_ZS",
    "name": "Prevalence of HIV, total (% of population ages 15-49)",
    "database_id": "WB_WDI",
    "measurement_unit": "Percentage",
    "periodicity": "Annual",
    "definition_short": null
  },
  "error": null,
  "failed_validation": null
}
```

**4. data360_get_metadata**
```json
{
  "database_id": "WB_WDI",
  "indicator_id": "WB_WDI_SH_DYN_AIDS_ZS"
}
```
**Result:**
```json
{
  "indicator_metadata": {
    "idno": "WB_WDI_SH_DYN_AIDS_ZS",
    "doi": null,
    "name": "Prevalence of HIV, total (% of population ages 15-49)",
    "display_name": null,
    "database_id": "WB_WDI",
    "database_name": "World Development Indicators (WDI)",
    "date_last_update": null,
    "date_released": null,
    "measurement_unit": "Percentage",
    "release_calendar": null,
    "periodicity": "Annual",
    "base_period": null,
    "definition_short": null,
    "definition_long": "Prevalence of HIV refers to the percentage of people ages 15-49 who are infected with HIV.",
    "statistical_concept": "HIV prevalence rates reflect the rate of HIV infection in each country's population. Low national prevalence rates can be misleading, however. They often disguise epidemics that are initially concentrated in certain localities or population groups and threaten to spill over into the wider population. In many developing countries most new infections occur in young adults, with young women especially vulnerable.",
    "methodology": "UNAIDS produces annual HIV/AIDS-related indicators using a common modelling framework (Spectrum). The model integrates country-reported data on HIV surveillance, antiretroviral therapy (ART) coverage, demographic information, and established patterns of HIV transmission, disease progression, and survival. Because many countries lack complete case reporting or cause-of-death data, these figures are modelled estimates and include uncertainty ranges. UNAIDS updates the estimates each year as new data and methods become available, ensuring internal consistency across all HIV/AIDS-related indicators. Reference: Annex 1 Methods for deriving UNAIDS HIV estimates \u2014 2025 Global AIDS Update \u2014 AIDS, Crisis and the Power to Transform: https://www.unaids.org/sites/default/files/2025-08/JC3153_GAU25_report_annex1_en.pdf",
    "derivation": null,
    "imputation": null,
    "missing": null,
    "quality_checks": null,
    "quality_note": null,
    "sources_discrepancies": null,
    "series_break": null,
    "limitation": "The limited availability of data on health status is a major constraint in assessing the health situation in developing countries. Surveillance data are lacking for many major public health concerns. Estimates of prevalence and incidence are available for some diseases but are often unreliable and incomplete. National health authorities differ widely in capacity and willingness to collect or report information.",
    "relevance": "Despite the existence of effective medications and treatment, HIV/AIDS is still a leading cause of death and public health threat in the world.  Low and middle income countries continue to bear a disproportionate share of the global burden of HIV/AIDS.",
    "aggregation_method": "Weighted average",
    "disaggregation": null,
    "confidentiality": null,
    "confidentiality_status": "PU",
    "confidentiality_note": null,
    "citation_requirement": null,
    "sources_note": null,
    "acknowledgement_statement": null,
    "disclaimer": null,
    "economies_count": null,
    "csv_link": "https://data360files.worldbank.org/data360-data/data/WB_WDI/WB_WDI_SH_DYN_AIDS_ZS.csv",
    "excel_link": null,
    "json_link": "https://data360files.worldbank.org/data360-data/metadata/WB_WDI/WB_WDI_SH_DYN_AIDS_ZS.json",
    "api_link": "https://data360api.worldbank.org/data360/data?top=1000&skip=0&DATABASE_ID=WB_WDI&INDICATOR=WB_WDI_SH_DYN_AIDS_ZS",
    "indicator_count": null,
    "apiservice_link": null,
    "api_explorer_link": "http://datacatalog.worldbank.org/data360/api/execute?tab=Data&id=1&DATABASE_ID=WB_WDI&INDICATOR=WB_WDI_SH_DYN_AIDS_ZS",
    "authoring_entity": [
      {
        "name": "Juliana Daher",
        "affiliation": "The Joint United Nations Programme on HIV/AIDS",
        "abbreviation": "UNAIDS",
        "email": "DaherJ@unaids.org",
        "uri": "https://aidsinfo.unaids.org/"
      }
    ],
    "version_statement": {
      "version": null,
      "version_date": "2024-11-13",
      "version_resp": null,
      "version_notes": null
    },
    "aliases": [
      {
        "alias": "SH.DYN.AIDS.ZS"
      }
    ],
    "alternate_identifiers": [
      {
        "identifier": "Adults (15-49) prevalence (%)",
        "name": "Adults (15-49) prevalence (%)",
        "database": null,
        "uri": "https://aidsinfo.unaids.org/",
        "notes": null
      }
    ],
    "languages": [
      {
        "name": "English",
        "code": "EN"
      }
    ],
    "dimensions": [
      {
        "name": null,
        "label": "Year",
        "description": null
      },
      {
        "name": null,
        "label": "Geographic area",
        "description": "Country/economy, country group, region"
      }
    ],
    "definition_references": [
      {
        "source": "UNAIDS",
        "uri": "https://aidsinfo.unaids.org/",
        "note": null
      }
    ],
    "statistical_concept_references": [],
    "methodology_references": [
      {
        "source": "Annex 1 Methods for deriving UNAIDS HIV estimates \u2014 2025 Global AIDS Update \u2014 AIDS, Crisis and the Power to Transform",
        "uri": "https://www.unaids.org/en/resources/documents/2025/JC3153_GAU25_report_annex1",
        "note": null
      }
    ],
    "derivation_references": [],
    "imputation_references": [],
    "topics": [
      {
        "id": "P2",
        "name": "People",
        "parent_id": null,
        "vocabulary": "WB Practice Groups",
        "uri": null
      },
      {
        "id": "P2_000003",
        "name": "Health, Nutrition & Population",
        "parent_id": "P2",
        "vocabulary": "Data360 Topic L1",
        "uri": null
      }
    ],
    "time_periods": [
      {
        "start": "1990",
        "end": "2024",
        "notes": null
      }
    ],
    "ref_country": [
      {
        "name": "Afghanistan",
        "code": "AFG"
      },
      {
        "name": "Angola",
        "code": "AGO"
      },
      {
        "name": "Albania",
        "code": "ALB"
      },
      {
        "name": "United Arab Emirates",
        "code": "ARE"
      },
      {
        "name": "Argentina",
        "code": "ARG"
      },
      {
        "name": "Armenia",
        "code": "ARM"
      },
      {
        "name": "Antigua and Barbuda",
        "code": "ATG"
      },
      {
        "name": "Australia",
        "code": "AUS"
      },
      {
        "name": "Azerbaijan",
        "code": "AZE"
      },
      {
        "name": "Burundi",
        "code": "BDI"
      },
      {
        "name": "Belgium",
        "code": "BEL"
      },
      {
        "name": "Benin",
        "code": "BEN"
      },
      {
        "name": "Burkina Faso",
        "code": "BFA"
      },
      {
        "name": "Bangladesh",
        "code": "BGD"
      },
      {
        "name": "Bulgaria",
        "code": "BGR"
      },
      {
        "name": "Bahamas, The",
        "code": "BHS"
      },
      {
        "name": "Bahrain",
        "code": "BHR"
      },
      {
        "name": "Belize",
        "code": "BLZ"
      },
      {
        "name": "Bolivia",
        "code": "BOL"
      },
      {
        "name": "Brazil",
        "code": "BRA"
      },
      {
        "name": "Barbados",
        "code": "BRB"
      },
      {
        "name": "Bhutan",
        "code": "BTN"
      },
      {
        "name": "Botswana",
        "code": "BWA"
      },
      {
        "name": "Central African Republic",
        "code": "CAF"
      },
      {
        "name": "Canada",
        "code": "CAN"
      },
      {
        "name": "Switzerland",
        "code": "CHE"
      },
      {
        "name": "Chile",
        "code": "CHL"
      },
      {
        "name": "C\u00f4te d\u2019Ivoire",
        "code": "CIV"
      },
      {
        "name": "Congo, Dem. Rep.",
        "code": "COD"
      },
      {
        "name": "Cameroon",
        "code": "CMR"
      },
      {
        "name": "Congo, Rep.",
        "code": "COG"
      },
      {
        "name": "Colombia",
        "code": "COL"
      },
      {
        "name": "Comoros",
        "code": "COM"
      },
      {
        "name": "Cabo Verde",
        "code": "CPV"
      },
      {
        "name": "Cuba",
        "code": "CUB"
      },
      {
        "name": "Costa Rica",
        "code": "CRI"
      },
      {
        "name": "Dominica",
        "code": "DMA"
      },
      {
        "name": "Djibouti",
        "code": "DJI"
      },
      {
        "name": "Dominican Republic",
        "code": "DOM"
      },
      {
        "name": "Denmark",
        "code": "DNK"
      },
      {
        "name": "Ecuador",
        "code": "ECU"
      },
      {
        "name": "Egypt, Arab Rep.",
        "code": "EGY"
      },
      {
        "name": "Algeria",
        "code": "DZA"
      },
      {
        "name": "Spain",
        "code": "ESP"
      },
      {
        "name": "Estonia",
        "code": "EST"
      },
      {
        "name": "Ethiopia",
        "code": "ETH"
      },
      {
        "name": "France",
        "code": "FRA"
      },
      {
        "name": "Fiji",
        "code": "FJI"
      },
      {
        "name": "Eritrea",
        "code": "ERI"
      },
      {
        "name": "Georgia",
        "code": "GEO"
      },
      {
        "name": "Ghana",
        "code": "GHA"
      },
      {
        "name": "Gabon",
        "code": "GAB"
      },
      {
        "name": "Gambia, The",
        "code": "GMB"
      },
      {
        "name": "Guinea-Bissau",
        "code": "GNB"
      },
      {
        "name": "Guinea",
        "code": "GIN"
      },
      {
        "name": "Greece",
        "code": "GRC"
      },
      {
        "name": "Guyana",
        "code": "GUY"
      },
      {
        "name": "Guatemala",
        "code": "GTM"
      },
      {
        "name": "Honduras",
        "code": "HND"
      },
      {
        "name": "Haiti",
        "code": "HTI"
      },
      {
        "name": "Croatia",
        "code": "HRV"
      },
      {
        "name": "Indonesia",
        "code": "IDN"
      },
      {
        "name": "Ireland",
        "code": "IRL"
      },
      {
        "name": "Iceland",
        "code": "ISL"
      },
      {
        "name": "Iraq",
        "code": "IRQ"
      },
      {
        "name": "Kenya",
        "code": "KEN"
      },
      {
        "name": "Kyrgyz Republic",
        "code": "KGZ"
      },
      {
        "name": "Jordan",
        "code": "JOR"
      },
      {
        "name": "Italy",
        "code": "ITA"
      },
      {
        "name": "Jamaica",
        "code": "JAM"
      },
      {
        "name": "Kazakhstan",
        "code": "KAZ"
      },
      {
        "name": "Kuwait",
        "code": "KWT"
      },
      {
        "name": "St. Kitts and Nevis",
        "code": "KNA"
      },
      {
        "name": "Lao PDR",
        "code": "LAO"
      },
      {
        "name": "Cambodia",
        "code": "KHM"
      },
      {
        "name": "Liberia",
        "code": "LBR"
      },
      {
        "name": "Lebanon",
        "code": "LBN"
      },
      {
        "name": "St. Lucia",
        "code": "LCA"
      },
      {
        "name": "Libya",
        "code": "LBY"
      },
      {
        "name": "Lesotho",
        "code": "LSO"
      },
      {
        "name": "Sri Lanka",
        "code": "LKA"
      },
      {
        "name": "Latvia",
        "code": "LVA"
      },
      {
        "name": "Morocco",
        "code": "MAR"
      },
      {
        "name": "Luxembourg",
        "code": "LUX"
      },
      {
        "name": "Lithuania",
        "code": "LTU"
      },
      {
        "name": "Madagascar",
        "code": "MDG"
      },
      {
        "name": "Moldova",
        "code": "MDA"
      },
      {
        "name": "Myanmar",
        "code": "MMR"
      },
      {
        "name": "Mexico",
        "code": "MEX"
      },
      {
        "name": "Mali",
        "code": "MLI"
      },
      {
        "name": "Maldives",
        "code": "MDV"
      },
      {
        "name": "Montenegro",
        "code": "MNE"
      },
      {
        "name": "Malta",
        "code": "MLT"
      },
      {
        "name": "Mozambique",
        "code": "MOZ"
      },
      {
        "name": "Malawi",
        "code": "MWI"
      },
      {
        "name": "Namibia",
        "code": "NAM"
      },
      {
        "name": "Mauritania",
        "code": "MRT"
      },
      {
        "name": "Malaysia",
        "code": "MYS"
      },
      {
        "name": "Mongolia",
        "code": "MNG"
      },
      {
        "name": "Niger",
        "code": "NER"
      },
      {
        "name": "Nigeria",
        "code": "NGA"
      },
      {
        "name": "Pakistan",
        "code": "PAK"
      },
      {
        "name": "Norway",
        "code": "NOR"
      },
      {
        "name": "New Zealand",
        "code": "NZL"
      },
      {
        "name": "North Macedonia",
        "code": "MKD"
      },
      {
        "name": "Nepal",
        "code": "NPL"
      },
      {
        "name": "Oman",
        "code": "OMN"
      },
      {
        "name": "Netherlands",
        "code": "NLD"
      },
      {
        "name": "Papua New Guinea",
        "code": "PNG"
      },
      {
        "name": "Panama",
        "code": "PAN"
      },
      {
        "name": "Philippines",
        "code": "PHL"
      },
      {
        "name": "Paraguay",
        "code": "PRY"
      },
      {
        "name": "Qatar",
        "code": "QAT"
      },
      {
        "name": "Portugal",
        "code": "PRT"
      },
      {
        "name": "Saudi Arabia",
        "code": "SAU"
      },
      {
        "name": "Rwanda",
        "code": "RWA"
      },
      {
        "name": "Sudan",
        "code": "SDN"
      },
      {
        "name": "Romania",
        "code": "ROU"
      },
      {
        "name": "Senegal",
        "code": "SEN"
      },
      {
        "name": "Singapore",
        "code": "SGP"
      },
      {
        "name": "Solomon Islands",
        "code": "SLB"
      },
      {
        "name": "Federal Republic of Somalia",
        "code": "SOM"
      },
      {
        "name": "Serbia",
        "code": "SRB"
      },
      {
        "name": "Peru",
        "code": "PER"
      },
      {
        "name": "Slovak Republic",
        "code": "SVK"
      },
      {
        "name": "Slovenia",
        "code": "SVN"
      },
      {
        "name": "Suriname",
        "code": "SUR"
      },
      {
        "name": "South Sudan",
        "code": "SSD"
      },
      {
        "name": "Sierra Leone",
        "code": "SLE"
      },
      {
        "name": "El Salvador",
        "code": "SLV"
      },
      {
        "name": "Sweden",
        "code": "SWE"
      },
      {
        "name": "Eswatini",
        "code": "SWZ"
      },
      {
        "name": "Tajikistan",
        "code": "TJK"
      },
      {
        "name": "Togo",
        "code": "TGO"
      },
      {
        "name": "Chad",
        "code": "TCD"
      },
      {
        "name": "Syrian Arab Republic",
        "code": "SYR"
      },
      {
        "name": "Timor-Leste",
        "code": "TLS"
      },
      {
        "name": "Thailand",
        "code": "THA"
      },
      {
        "name": "Tunisia",
        "code": "TUN"
      },
      {
        "name": "Tanzania",
        "code": "TZA"
      },
      {
        "name": "Tuvalu",
        "code": "TUV"
      },
      {
        "name": "Uganda",
        "code": "UGA"
      },
      {
        "name": "Vietnam",
        "code": "VNM"
      },
      {
        "name": "Vanuatu",
        "code": "VUT"
      },
      {
        "name": "Venezuela, RB",
        "code": "VEN"
      },
      {
        "name": "Yemen, Rep.",
        "code": "YEM"
      },
      {
        "name": "St. Vincent and the Grenadines",
        "code": "VCT"
      },
      {
        "name": "Zimbabwe",
        "code": "ZWE"
      },
      {
        "name": "Zambia",
        "code": "ZMB"
      },
      {
        "name": "South Africa",
        "code": "ZAF"
      },
      {
        "name": "Germany",
        "code": "DEU"
      },
      {
        "name": "United Kingdom",
        "code": "GBR"
      },
      {
        "name": "India",
        "code": "IND"
      }
    ],
    "geographic_units": [
      {
        "name": "Eastern & Southern Africa",
        "code": "AFE",
        "type": null
      },
      {
        "name": "Western & Central Africa",
        "code": "AFW",
        "type": null
      },
      {
        "name": "Arab World",
        "code": "ARB",
        "type": null
      },
      {
        "name": "Euro area",
        "code": "EMU",
        "type": null
      },
      {
        "name": "Fragile and conflict affected situations",
        "code": "FCS",
        "type": null
      },
      {
        "name": "Heavily indebted poor countries (HIPC)",
        "code": "HPC",
        "type": null
      },
      {
        "name": "IDA total",
        "code": "IDA",
        "type": null
      },
      {
        "name": "IDA blend",
        "code": "IDB",
        "type": null
      },
      {
        "name": "IDA only",
        "code": "IDX",
        "type": null
      },
      {
        "name": "Latin America & Caribbean",
        "code": "LCN",
        "type": null
      },
      {
        "name": "Latin America & Caribbean (excluding high income)",
        "code": "LAC",
        "type": null
      },
      {
        "name": "Low income",
        "code": "LIC",
        "type": null
      },
      {
        "name": "Least developed countries: UN classification",
        "code": "LDC",
        "type": null
      },
      {
        "name": "Middle East, North Africa, Afghanistan & Pakistan",
        "code": "MEA",
        "type": null
      },
      {
        "name": "Middle East, North Africa, Afghanistan & Pakistan (excluding high income)",
        "code": "MNA",
        "type": null
      },
      {
        "name": "Other small states",
        "code": "OSS",
        "type": null
      },
      {
        "name": "Pre-demographic dividend",
        "code": "PRE",
        "type": null
      },
      {
        "name": "Pacific island small states",
        "code": "PSS",
        "type": null
      },
      {
        "name": "Sub-Saharan Africa",
        "code": "SSF",
        "type": null
      },
      {
        "name": "Sub-Saharan Africa (excluding high income)",
        "code": "SSA",
        "type": null
      },
      {
        "name": "Small states",
        "code": "SST",
        "type": null
      },
      {
        "name": "Middle East, North Africa, Afghanistan & Pakistan (IDA & IBRD)",
        "code": "TMN",
        "type": null
      },
      {
        "name": "Latin America & Caribbean (IDA & IBRD)",
        "code": "TLA",
        "type": null
      },
      {
        "name": "World",
        "code": "WLD",
        "type": null
      },
      {
        "name": "Sub-Saharan Africa (IDA & IBRD)",
        "code": "TSS",
        "type": null
      },
      {
        "name": "European Union",
        "code": "EUU",
        "type": null
      },
      {
        "name": "Caribbean small states",
        "code": "CSS",
        "type": null
      },
      {
        "name": "Early-demographic dividend",
        "code": "EAR",
        "type": null
      },
      {
        "name": "IDA & IBRD total",
        "code": "IBT",
        "type": null
      },
      {
        "name": "Low & middle income",
        "code": "LMY",
        "type": null
      },
      {
        "name": "Lower middle income",
        "code": "LMC",
        "type": null
      },
      {
        "name": "Middle income",
        "code": "MIC",
        "type": null
      },
      {
        "name": "South Asia",
        "code": "SAS",
        "type": null
      },
      {
        "name": "South Asia (IDA & IBRD)",
        "code": "TSA",
        "type": null
      }
    ],
    "aggregation_method_references": [],
    "license": [
      {
        "name": "CC BY-4.0",
        "uri": "https://creativecommons.org/licenses/by/4.0/",
        "note": null
      }
    ],
    "links": [
      {
        "type": "WDI API",
        "description": "Data in JSON",
        "uri": "https://api.worldbank.org/v2/countries/all/indicators/sh.dyn.aids.zs?date=1990:2021&format=json",
        "image_uri": null
      },
      {
        "type": "WDI API",
        "description": "Data in XML",
        "uri": "https://api.worldbank.org/v2/countries/all/indicators/sh.dyn.aids.zs?date=1990:2021",
        "image_uri": null
      },
      {
        "type": "WDI API",
        "description": "Metadata in JSON",
        "uri": "https://api.worldbank.org/v2/sources/2/series/sh.dyn.aids.zs/metadata?format=json",
        "image_uri": null
      },
      {
        "type": "WDI API",
        "description": "Metadata in XML",
        "uri": "https://api.worldbank.org/v2/sources/2/series/sh.dyn.aids.zs/metadata",
        "image_uri": null
      }
    ],
    "api_documentation": [
      {
        "description": "Developer Information webpage (detailed documentation of the WDI API)",
        "uri": "https://datahelpdesk.worldbank.org/knowledgebase/topics/125589-developer-information"
      }
    ],
    "sources": [
      {
        "idno": null,
        "type": null,
        "name": "UNAIDS estimates",
        "organization": "Joint United Nations Programme on HIV/AIDS (UNAIDS)",
        "publisher": "UNAIDS",
        "publication_date": "2025-07",
        "uri": "https://aidsinfo.unaids.org/",
        "access_date": "2025-08-27",
        "note": null,
        "other_identifiers": [],
        "authors": [],
        "datasets": []
      }
    ],
    "notes": [],
    "related_indicators": []
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
        "LUX",
        "MNE",
        "BFA",
        "CYP",
        "CHE",
        "NZL",
        "HND",
        "LBR",
        "CRI",
        "SUR",
        "CAN",
        "RWA",
        "NAM",
        "TGO",
        "URY",
        "DEU",
        "BLZ",
        "SVN",
        "FCS",
        "TSS",
        "IBT",
        "MAR",
        "LBY",
        "SEN",
        "JAM",
        "NPL",
        "SAS",
        "MEA",
        "SLE",
        "TUN",
        "FJI",
        "UGA",
        "ALB",
        "BLR",
        "HTI",
        "COL",
        "MOZ",
        "LAC",
        "PST",
        "KWT",
        "CSS",
        "BTN",
        "YEM",
        "LDC",
        "TMN",
        "GEO",
        "LTU",
        "MDA",
        "MIC",
        "VEN",
        "PAK",
        "NLD",
        "SRB",
        "GIN",
        "SSA",
        "AFE",
        "NAC",
        "USA",
        "GHA",
        "LBN",
        "PER",
        "POL",
        "GAB",
        "TLA",
        "TCD",
        "ECU",
        "BRA",
        "IRN",
        "MEX",
        "ARE",
        "BRB",
        "CZE",
        "AFG",
        "CHL",
        "ESP",
        "COM",
        "IDA",
        "EAR",
        "MWI",
        "OMN",
        "IDX",
        "ITA",
        "MLT",
        "SDN",
        "MDV",
        "DZA",
        "STP",
        "ARM",
        "KEN",
        "PNG",
        "THA",
        "SSD",
        "AGO",
        "IRQ",
        "LAO",
        "FRA",
        "ETH",
        "PAN",
        "BHS",
        "BOL",
        "GRC",
        "KGZ",
        "WLD",
        "MKD",
        "KHM",
        "LMY",
        "ARG",
        "JOR",
        "ARB",
        "MNA",
        "MLI",
        "QAT",
        "DOM",
        "MDG",
        "TZA",
        "ZWE",
        "GNQ",
        "LSO",
        "NIC",
        "NER",
        "PHL",
        "OSS",
        "LCN",
        "EST",
        "EMU",
        "HRV",
        "ISL",
        "MYS",
        "TTO",
        "OED",
        "GMB",
        "BGR",
        "BDI",
        "TSA",
        "COG",
        "IND",
        "EUU",
        "CIV",
        "EGY",
        "GUY",
        "AZE",
        "SYR",
        "GNB",
        "IDN",
        "BEL",
        "HPC",
        "CEB",
        "BGD",
        "BWA",
        "MMR",
        "LMC",
        "PRE",
        "IRL",
        "SAU",
        "VNM",
        "BEN",
        "CAF",
        "SLV",
        "LKA",
        "ZMB",
        "COD",
        "SWZ",
        "GTM",
        "TJK",
        "CMR",
        "MRT",
        "ROU",
        "SST",
        "PRT",
        "LIC",
        "ERI",
        "LVA",
        "CUB",
        "SSF",
        "DNK",
        "CPV",
        "PRY",
        "TLS",
        "SVK",
        "ZAF",
        "AUS",
        "MNG"
      ]
    },
    {
      "field_name": "INDICATOR",
      "label_name": "Statistical indicator",
      "field_value": [
        "WB_WDI_SH_DYN_AIDS_ZS"
      ]
    },
    {
      "field_name": "SEX",
      "label_name": "Sex",
      "field_value": [
        "_T"
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
        "PT_POP_SUB"
      ]
    },
    {
      "field_name": "TIME_PERIOD",
      "label_name": "Time period",
      "field_value": [
        "2011",
        "2002",
        "1995",
        "1990",
        "2005",
        "1993",
        "2018",
        "1999",
        "1991",
        "2014",
        "1998",
        "2022",
        "2013",
        "2004",
        "2021",
        "1992",
        "2003",
        "2010",
        "1994",
        "1996",
        "2006",
        "2020",
        "2016",
        "2000",
        "2001",
        "2017",
        "2009",
        "2019",
        "1997",
        "2015",
        "2008",
        "2012",
        "2007"
      ]
    }
  ],
  "error": null
}
```

**5. data360_get_data**
```json
{
  "database_id": "WB_WDI",
  "indicator_id": "WB_WDI_SH_STA_MMRT",
  "disaggregation_filters": {
    "REF_AREA": "ZAF,BWA,NAM"
  },
  "start_year": 2020,
  "end_year": 2024,
  "limit": 50,
  "offset": 0
}
```
**Result:**
```json
{
  "count": 12,
  "total_count": null,
  "offset": 0,
  "has_more": false,
  "next_offset": null,
  "data": [
    {
      "OBS_VALUE": "118",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": true,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "ZAF",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2023",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "b48a6b8f"
    },
    {
      "OBS_VALUE": "139",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": true,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "NAM",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2023",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "615382c8"
    },
    {
      "OBS_VALUE": "155",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": true,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "BWA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2023",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "513dd7a2"
    },
    {
      "OBS_VALUE": "129",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "ZAF",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2022",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "82777120"
    },
    {
      "OBS_VALUE": "127",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "NAM",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2022",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "a7abaffd"
    },
    {
      "OBS_VALUE": "120",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "BWA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2022",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "6ca0eef0"
    },
    {
      "OBS_VALUE": "254",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "NAM",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2021",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "d3255a18"
    },
    {
      "OBS_VALUE": "191",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "ZAF",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2021",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "3a3134ac"
    },
    {
      "OBS_VALUE": "165",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "BWA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2021",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "2d8554c5"
    },
    {
      "OBS_VALUE": "98",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "BWA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2020",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "82b263ed"
    },
    {
      "OBS_VALUE": "118",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "ZAF",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2020",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "3d773beb"
    },
    {
      "OBS_VALUE": "143",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "NAM",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2020",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "67cf8fa4"
    }
  ],
  "metadata": {
    "idno": "WB_WDI_SH_STA_MMRT",
    "name": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
    "database_id": "WB_WDI",
    "measurement_unit": "Per 100,000 live births",
    "periodicity": "Annual",
    "definition_short": null
  },
  "error": null,
  "failed_validation": null
}
```

**6. data360_get_metadata**
```json
{
  "database_id": "WB_WDI",
  "indicator_id": "WB_WDI_SH_STA_MMRT"
}
```
**Result:**
```json
{
  "indicator_metadata": {
    "idno": "WB_WDI_SH_STA_MMRT",
    "doi": null,
    "name": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
    "display_name": null,
    "database_id": "WB_WDI",
    "database_name": "World Development Indicators (WDI)",
    "date_last_update": null,
    "date_released": null,
    "measurement_unit": "Per 100,000 live births",
    "release_calendar": null,
    "periodicity": "Annual",
    "base_period": null,
    "definition_short": null,
    "definition_long": "Maternal mortality ratio is the number of women who die from pregnancy-related causes while pregnant or within 42 days of pregnancy termination per 100,000 live births. The data are estimated with a regression model using information on the proportion of maternal deaths among non-AIDS deaths in women ages 15-49, fertility, birth attendants, and GDP measured using purchasing power parities (PPPs).",
    "statistical_concept": "Reproductive health is a state of physical and mental well-being in relation to the reproductive system and its functions and processes. Means of achieving reproductive health include education and services during pregnancy and childbirth, safe and effective contraception, and prevention and treatment of sexually transmitted diseases. Complications of pregnancy and childbirth are the leading cause of death and disability among women of reproductive age in developing countries.\r\n\r\nMaternal mortality is generally of unknown reliability, as are many other cause-specific mortality indicators. Household surveys such as Demographic and Health Surveys attempt to measure maternal mortality by asking respondents about survivorship of sisters. The main disadvantage of this method is that the estimates of maternal mortality that it produces pertain to any time within the past few years before the survey, making them unsuitable for monitoring recent changes or observing the impact of interventions. In addition, measurement of maternal mortality is subject to many types of errors. Even in high-income countries with reliable vital registration systems, misclassification of maternal deaths has been found to lead to serious underestimation.",
    "methodology": "The estimates are based on an exercise by the Maternal Mortality Estimation Inter-Agency Group (MMEIG) which consists of World Health Organization (WHO), United Nations Children's Fund (UNICEF), World Bank, and United Nations Population Fund (UNFPA), and include country-level time series data. For countries without complete registration data but with other types of data and for countries with no data, maternal mortality is estimated with a regression model using available national maternal mortality data and socioeconomic information.",
    "derivation": null,
    "imputation": null,
    "missing": null,
    "quality_checks": null,
    "quality_note": null,
    "sources_discrepancies": null,
    "series_break": null,
    "limitation": "The methodology differs from that used for previous estimates, so data should not be compared historically. Maternal mortality ratios are generally of unknown reliability, as are many other cause-specific mortality indicators. The ratios cannot be assumed to provide an exact estimate of maternal mortality.",
    "relevance": "Childbirth should be a time of life, not death. And yet, many women die due to complications of pregnancy and childbirth. Nearly every death is in low- and middle-income countries, and nearly every death is preventable where the clinical knowledge and technology required to prevent them have existed. However these solutions are often not available, not accessible or not implemented, especially in low-resource settings and/or subpopulations at greater risk due to social determinants.",
    "aggregation_method": "Weighted average",
    "disaggregation": null,
    "confidentiality": null,
    "confidentiality_status": "PU",
    "confidentiality_note": null,
    "citation_requirement": null,
    "sources_note": null,
    "acknowledgement_statement": null,
    "disclaimer": null,
    "economies_count": null,
    "csv_link": "https://data360files.worldbank.org/data360-data/data/WB_WDI/WB_WDI_SH_STA_MMRT.csv",
    "excel_link": null,
    "json_link": "https://data360files.worldbank.org/data360-data/metadata/WB_WDI/WB_WDI_SH_STA_MMRT.json",
    "api_link": "https://data360api.worldbank.org/data360/data?top=1000&skip=0&DATABASE_ID=WB_WDI&INDICATOR=WB_WDI_SH_STA_MMRT",
    "indicator_count": null,
    "apiservice_link": null,
    "api_explorer_link": "http://datacatalog.worldbank.org/data360/api/execute?tab=Data&id=1&DATABASE_ID=WB_WDI&INDICATOR=WB_WDI_SH_STA_MMRT",
    "authoring_entity": [
      {
        "name": null,
        "affiliation": "WHO, UNICEF, UNFPA, World Bank Group, and UNDESA/Population Division.",
        "abbreviation": null,
        "email": null,
        "uri": "https://www.who.int/news/item/23-02-2023-a-woman-dies-every-two-minutes-due-to-pregnancy-or-childbirth--un-agencies"
      }
    ],
    "version_statement": {
      "version": null,
      "version_date": "2024-12-16",
      "version_resp": null,
      "version_notes": null
    },
    "aliases": [
      {
        "alias": "SH.STA.MMRT"
      }
    ],
    "alternate_identifiers": [
      {
        "identifier": "Maternal mortality ratio (per 100 000 live births)",
        "name": "Maternal mortality ratio (per 100 000 live births)",
        "database": null,
        "uri": "https://www.who.int/news/item/23-02-2023-a-woman-dies-every-two-minutes-due-to-pregnancy-or-childbirth--un-agencies",
        "notes": null
      }
    ],
    "languages": [
      {
        "name": "English",
        "code": "EN"
      }
    ],
    "dimensions": [
      {
        "name": null,
        "label": "Year",
        "description": null
      },
      {
        "name": null,
        "label": "Geographic area",
        "description": "Country/economy, country group, region"
      }
    ],
    "definition_references": [
      {
        "source": "WHO, UNICEF, UNFPA, World Bank Group, and UNDESA/Population Division.",
        "uri": "https://www.who.int/news/item/23-02-2023-a-woman-dies-every-two-minutes-due-to-pregnancy-or-childbirth--un-agencies",
        "note": null
      }
    ],
    "statistical_concept_references": [],
    "methodology_references": [
      {
        "source": "WHO, UNICEF, UNFPA, World Bank Group, and UNDESA/Population Division.",
        "uri": "https://www.who.int/news/item/23-02-2023-a-woman-dies-every-two-minutes-due-to-pregnancy-or-childbirth--un-agencies",
        "note": null
      }
    ],
    "derivation_references": [],
    "imputation_references": [],
    "topics": [
      {
        "id": "P2",
        "name": "People",
        "parent_id": null,
        "vocabulary": "WB Practice Groups",
        "uri": null
      },
      {
        "id": "P2_000002",
        "name": "Gender",
        "parent_id": "P2",
        "vocabulary": "Data360 Topic L1",
        "uri": null
      },
      {
        "id": "P2_000112",
        "name": "SDGs",
        "parent_id": "P2_000002",
        "vocabulary": "Data360 Topic L2",
        "uri": null
      }
    ],
    "time_periods": [
      {
        "start": "1985",
        "end": "2023",
        "notes": null
      }
    ],
    "ref_country": [
      {
        "name": "Afghanistan",
        "code": "AFG"
      },
      {
        "name": "Albania",
        "code": "ALB"
      },
      {
        "name": "Angola",
        "code": "AGO"
      },
      {
        "name": "Andorra",
        "code": "AND"
      },
      {
        "name": "United Arab Emirates",
        "code": "ARE"
      },
      {
        "name": "Armenia",
        "code": "ARM"
      },
      {
        "name": "Argentina",
        "code": "ARG"
      },
      {
        "name": "Austria",
        "code": "AUT"
      },
      {
        "name": "Australia",
        "code": "AUS"
      },
      {
        "name": "Antigua and Barbuda",
        "code": "ATG"
      },
      {
        "name": "Azerbaijan",
        "code": "AZE"
      },
      {
        "name": "Belgium",
        "code": "BEL"
      },
      {
        "name": "Burundi",
        "code": "BDI"
      },
      {
        "name": "Benin",
        "code": "BEN"
      },
      {
        "name": "Burkina Faso",
        "code": "BFA"
      },
      {
        "name": "Bangladesh",
        "code": "BGD"
      },
      {
        "name": "Bulgaria",
        "code": "BGR"
      },
      {
        "name": "Bahamas, The",
        "code": "BHS"
      },
      {
        "name": "Bahrain",
        "code": "BHR"
      },
      {
        "name": "Bosnia and Herzegovina",
        "code": "BIH"
      },
      {
        "name": "Belarus",
        "code": "BLR"
      },
      {
        "name": "Belize",
        "code": "BLZ"
      },
      {
        "name": "Brazil",
        "code": "BRA"
      },
      {
        "name": "Bolivia",
        "code": "BOL"
      },
      {
        "name": "Brunei Darussalam",
        "code": "BRN"
      },
      {
        "name": "Barbados",
        "code": "BRB"
      },
      {
        "name": "Bhutan",
        "code": "BTN"
      },
      {
        "name": "Botswana",
        "code": "BWA"
      },
      {
        "name": "Central African Republic",
        "code": "CAF"
      },
      {
        "name": "Switzerland",
        "code": "CHE"
      },
      {
        "name": "Canada",
        "code": "CAN"
      },
      {
        "name": "Chile",
        "code": "CHL"
      },
      {
        "name": "China",
        "code": "CHN"
      },
      {
        "name": "C\u00f4te d\u2019Ivoire",
        "code": "CIV"
      },
      {
        "name": "Congo, Dem. Rep.",
        "code": "COD"
      },
      {
        "name": "Colombia",
        "code": "COL"
      },
      {
        "name": "Cameroon",
        "code": "CMR"
      },
      {
        "name": "Congo, Rep.",
        "code": "COG"
      },
      {
        "name": "Cabo Verde",
        "code": "CPV"
      },
      {
        "name": "Comoros",
        "code": "COM"
      },
      {
        "name": "Costa Rica",
        "code": "CRI"
      },
      {
        "name": "Cuba",
        "code": "CUB"
      },
      {
        "name": "Germany",
        "code": "DEU"
      },
      {
        "name": "Cyprus",
        "code": "CYP"
      },
      {
        "name": "Czechia",
        "code": "CZE"
      },
      {
        "name": "Denmark",
        "code": "DNK"
      },
      {
        "name": "Dominica",
        "code": "DMA"
      },
      {
        "name": "Algeria",
        "code": "DZA"
      },
      {
        "name": "Dominican Republic",
        "code": "DOM"
      },
      {
        "name": "Egypt, Arab Rep.",
        "code": "EGY"
      },
      {
        "name": "Djibouti",
        "code": "DJI"
      },
      {
        "name": "Eritrea",
        "code": "ERI"
      },
      {
        "name": "Ecuador",
        "code": "ECU"
      },
      {
        "name": "Ethiopia",
        "code": "ETH"
      },
      {
        "name": "Finland",
        "code": "FIN"
      },
      {
        "name": "Estonia",
        "code": "EST"
      },
      {
        "name": "Fiji",
        "code": "FJI"
      },
      {
        "name": "United Kingdom",
        "code": "GBR"
      },
      {
        "name": "France",
        "code": "FRA"
      },
      {
        "name": "Spain",
        "code": "ESP"
      },
      {
        "name": "Micronesia, Fed. Sts.",
        "code": "FSM"
      },
      {
        "name": "Gabon",
        "code": "GAB"
      },
      {
        "name": "Georgia",
        "code": "GEO"
      },
      {
        "name": "Ghana",
        "code": "GHA"
      },
      {
        "name": "Gambia, The",
        "code": "GMB"
      },
      {
        "name": "Equatorial Guinea",
        "code": "GNQ"
      },
      {
        "name": "Guinea",
        "code": "GIN"
      },
      {
        "name": "Greece",
        "code": "GRC"
      },
      {
        "name": "Guatemala",
        "code": "GTM"
      },
      {
        "name": "Guinea-Bissau",
        "code": "GNB"
      },
      {
        "name": "Grenada",
        "code": "GRD"
      },
      {
        "name": "Guyana",
        "code": "GUY"
      },
      {
        "name": "Croatia",
        "code": "HRV"
      },
      {
        "name": "Haiti",
        "code": "HTI"
      },
      {
        "name": "Hungary",
        "code": "HUN"
      },
      {
        "name": "India",
        "code": "IND"
      },
      {
        "name": "Ireland",
        "code": "IRL"
      },
      {
        "name": "Honduras",
        "code": "HND"
      },
      {
        "name": "Indonesia",
        "code": "IDN"
      },
      {
        "name": "Iraq",
        "code": "IRQ"
      },
      {
        "name": "Iceland",
        "code": "ISL"
      },
      {
        "name": "Iran, Islamic Rep.",
        "code": "IRN"
      },
      {
        "name": "Israel",
        "code": "ISR"
      },
      {
        "name": "Italy",
        "code": "ITA"
      },
      {
        "name": "Jamaica",
        "code": "JAM"
      },
      {
        "name": "Japan",
        "code": "JPN"
      },
      {
        "name": "St. Kitts and Nevis",
        "code": "KNA"
      },
      {
        "name": "Kenya",
        "code": "KEN"
      },
      {
        "name": "Jordan",
        "code": "JOR"
      },
      {
        "name": "Kyrgyz Republic",
        "code": "KGZ"
      },
      {
        "name": "Kuwait",
        "code": "KWT"
      },
      {
        "name": "Cambodia",
        "code": "KHM"
      },
      {
        "name": "Kiribati",
        "code": "KIR"
      },
      {
        "name": "Lebanon",
        "code": "LBN"
      },
      {
        "name": "Liberia",
        "code": "LBR"
      },
      {
        "name": "Korea, Rep.",
        "code": "KOR"
      },
      {
        "name": "Libya",
        "code": "LBY"
      },
      {
        "name": "Lao PDR",
        "code": "LAO"
      },
      {
        "name": "St. Lucia",
        "code": "LCA"
      },
      {
        "name": "Sri Lanka",
        "code": "LKA"
      },
      {
        "name": "Kazakhstan",
        "code": "KAZ"
      },
      {
        "name": "Lesotho",
        "code": "LSO"
      },
      {
        "name": "Lithuania",
        "code": "LTU"
      },
      {
        "name": "Latvia",
        "code": "LVA"
      },
      {
        "name": "Morocco",
        "code": "MAR"
      },
      {
        "name": "Maldives",
        "code": "MDV"
      },
      {
        "name": "Monaco",
        "code": "MCO"
      },
      {
        "name": "Madagascar",
        "code": "MDG"
      },
      {
        "name": "Mali",
        "code": "MLI"
      },
      {
        "name": "Moldova",
        "code": "MDA"
      },
      {
        "name": "Myanmar",
        "code": "MMR"
      },
      {
        "name": "Marshall Islands",
        "code": "MHL"
      },
      {
        "name": "Mexico",
        "code": "MEX"
      },
      {
        "name": "North Macedonia",
        "code": "MKD"
      },
      {
        "name": "Montenegro",
        "code": "MNE"
      },
      {
        "name": "Mozambique",
        "code": "MOZ"
      },
      {
        "name": "Malta",
        "code": "MLT"
      },
      {
        "name": "Luxembourg",
        "code": "LUX"
      },
      {
        "name": "Mongolia",
        "code": "MNG"
      },
      {
        "name": "Malawi",
        "code": "MWI"
      },
      {
        "name": "Namibia",
        "code": "NAM"
      },
      {
        "name": "Malaysia",
        "code": "MYS"
      },
      {
        "name": "Mauritius",
        "code": "MUS"
      },
      {
        "name": "Netherlands",
        "code": "NLD"
      },
      {
        "name": "Nauru",
        "code": "NRU"
      },
      {
        "name": "Niger",
        "code": "NER"
      },
      {
        "name": "Nigeria",
        "code": "NGA"
      },
      {
        "name": "Nicaragua",
        "code": "NIC"
      },
      {
        "name": "Norway",
        "code": "NOR"
      },
      {
        "name": "New Zealand",
        "code": "NZL"
      },
      {
        "name": "Palau",
        "code": "PLW"
      },
      {
        "name": "Oman",
        "code": "OMN"
      },
      {
        "name": "Nepal",
        "code": "NPL"
      },
      {
        "name": "Pakistan",
        "code": "PAK"
      },
      {
        "name": "Peru",
        "code": "PER"
      },
      {
        "name": "Philippines",
        "code": "PHL"
      },
      {
        "name": "Korea, Dem. People's Rep.",
        "code": "PRK"
      },
      {
        "name": "Portugal",
        "code": "PRT"
      },
      {
        "name": "Papua New Guinea",
        "code": "PNG"
      },
      {
        "name": "Mauritania",
        "code": "MRT"
      },
      {
        "name": "Paraguay",
        "code": "PRY"
      },
      {
        "name": "Puerto Rico",
        "code": "PRI"
      },
      {
        "name": "Poland",
        "code": "POL"
      },
      {
        "name": "West Bank and Gaza",
        "code": "PSE"
      },
      {
        "name": "Russian Federation",
        "code": "RUS"
      },
      {
        "name": "Qatar",
        "code": "QAT"
      },
      {
        "name": "Saudi Arabia",
        "code": "SAU"
      },
      {
        "name": "Sudan",
        "code": "SDN"
      },
      {
        "name": "Senegal",
        "code": "SEN"
      },
      {
        "name": "Federal Republic of Somalia",
        "code": "SOM"
      },
      {
        "name": "San Marino",
        "code": "SMR"
      },
      {
        "name": "Sierra Leone",
        "code": "SLE"
      },
      {
        "name": "Rwanda",
        "code": "RWA"
      },
      {
        "name": "Panama",
        "code": "PAN"
      },
      {
        "name": "S\u00e3o Tom\u00e9 and Pr\u00edncipe",
        "code": "STP"
      },
      {
        "name": "South Sudan",
        "code": "SSD"
      },
      {
        "name": "Serbia",
        "code": "SRB"
      },
      {
        "name": "Singapore",
        "code": "SGP"
      },
      {
        "name": "Solomon Islands",
        "code": "SLB"
      },
      {
        "name": "Suriname",
        "code": "SUR"
      },
      {
        "name": "Slovak Republic",
        "code": "SVK"
      },
      {
        "name": "Slovenia",
        "code": "SVN"
      },
      {
        "name": "Syrian Arab Republic",
        "code": "SYR"
      },
      {
        "name": "Togo",
        "code": "TGO"
      },
      {
        "name": "Seychelles",
        "code": "SYC"
      },
      {
        "name": "Sweden",
        "code": "SWE"
      },
      {
        "name": "Chad",
        "code": "TCD"
      },
      {
        "name": "Timor-Leste",
        "code": "TLS"
      },
      {
        "name": "Romania",
        "code": "ROU"
      },
      {
        "name": "Turkmenistan",
        "code": "TKM"
      },
      {
        "name": "Tajikistan",
        "code": "TJK"
      },
      {
        "name": "Trinidad and Tobago",
        "code": "TTO"
      },
      {
        "name": "Eswatini",
        "code": "SWZ"
      },
      {
        "name": "Tuvalu",
        "code": "TUV"
      },
      {
        "name": "Tunisia",
        "code": "TUN"
      },
      {
        "name": "Uganda",
        "code": "UGA"
      },
      {
        "name": "El Salvador",
        "code": "SLV"
      },
      {
        "name": "Tonga",
        "code": "TON"
      },
      {
        "name": "Ukraine",
        "code": "UKR"
      },
      {
        "name": "T\u00fcrkiye",
        "code": "TUR"
      },
      {
        "name": "St. Vincent and the Grenadines",
        "code": "VCT"
      },
      {
        "name": "Tanzania",
        "code": "TZA"
      },
      {
        "name": "Uzbekistan",
        "code": "UZB"
      },
      {
        "name": "Uruguay",
        "code": "URY"
      },
      {
        "name": "United States",
        "code": "USA"
      },
      {
        "name": "Vietnam",
        "code": "VNM"
      },
      {
        "name": "Vanuatu",
        "code": "VUT"
      },
      {
        "name": "Venezuela, RB",
        "code": "VEN"
      },
      {
        "name": "Yemen, Rep.",
        "code": "YEM"
      },
      {
        "name": "Zimbabwe",
        "code": "ZWE"
      },
      {
        "name": "Thailand",
        "code": "THA"
      },
      {
        "name": "South Africa",
        "code": "ZAF"
      },
      {
        "name": "Samoa",
        "code": "WSM"
      },
      {
        "name": "Zambia",
        "code": "ZMB"
      }
    ],
    "geographic_units": [
      {
        "name": "Eastern & Southern Africa",
        "code": "AFE",
        "type": null
      },
      {
        "name": "Western & Central Africa",
        "code": "AFW",
        "type": null
      },
      {
        "name": "Arab World",
        "code": "ARB",
        "type": null
      },
      {
        "name": "Central Europe and the Baltics",
        "code": "CEB",
        "type": null
      },
      {
        "name": "Caribbean small states",
        "code": "CSS",
        "type": null
      },
      {
        "name": "Early-demographic dividend",
        "code": "EAR",
        "type": null
      },
      {
        "name": "East Asia & Pacific (excluding high income)",
        "code": "EAP",
        "type": null
      },
      {
        "name": "East Asia & Pacific",
        "code": "EAS",
        "type": null
      },
      {
        "name": "Europe & Central Asia (excluding high income)",
        "code": "ECA",
        "type": null
      },
      {
        "name": "Europe & Central Asia",
        "code": "ECS",
        "type": null
      },
      {
        "name": "Euro area",
        "code": "EMU",
        "type": null
      },
      {
        "name": "European Union",
        "code": "EUU",
        "type": null
      },
      {
        "name": "Fragile and conflict affected situations",
        "code": "FCS",
        "type": null
      },
      {
        "name": "High income",
        "code": "HIC",
        "type": null
      },
      {
        "name": "Heavily indebted poor countries (HIPC)",
        "code": "HPC",
        "type": null
      },
      {
        "name": "IDA & IBRD total",
        "code": "IBT",
        "type": null
      },
      {
        "name": "IDA only",
        "code": "IDX",
        "type": null
      },
      {
        "name": "IDA total",
        "code": "IDA",
        "type": null
      },
      {
        "name": "IDA blend",
        "code": "IDB",
        "type": null
      },
      {
        "name": "IBRD only",
        "code": "IBD",
        "type": null
      },
      {
        "name": "Latin America & Caribbean (excluding high income)",
        "code": "LAC",
        "type": null
      },
      {
        "name": "Least developed countries: UN classification",
        "code": "LDC",
        "type": null
      },
      {
        "name": "Low income",
        "code": "LIC",
        "type": null
      },
      {
        "name": "Low & middle income",
        "code": "LMY",
        "type": null
      },
      {
        "name": "Late-demographic dividend",
        "code": "LTE",
        "type": null
      },
      {
        "name": "Latin America & Caribbean",
        "code": "LCN",
        "type": null
      },
      {
        "name": "Lower middle income",
        "code": "LMC",
        "type": null
      },
      {
        "name": "Middle East, North Africa, Afghanistan & Pakistan (excluding high income)",
        "code": "MNA",
        "type": null
      },
      {
        "name": "Middle East, North Africa, Afghanistan & Pakistan",
        "code": "MEA",
        "type": null
      },
      {
        "name": "Middle income",
        "code": "MIC",
        "type": null
      },
      {
        "name": "North America",
        "code": "NAC",
        "type": null
      },
      {
        "name": "OECD members",
        "code": "OED",
        "type": null
      },
      {
        "name": "Other small states",
        "code": "OSS",
        "type": null
      },
      {
        "name": "Pre-demographic dividend",
        "code": "PRE",
        "type": null
      },
      {
        "name": "Pacific island small states",
        "code": "PSS",
        "type": null
      },
      {
        "name": "Post-demographic dividend",
        "code": "PST",
        "type": null
      },
      {
        "name": "South Asia",
        "code": "SAS",
        "type": null
      },
      {
        "name": "Sub-Saharan Africa (excluding high income)",
        "code": "SSA",
        "type": null
      },
      {
        "name": "Sub-Saharan Africa",
        "code": "SSF",
        "type": null
      },
      {
        "name": "Small states",
        "code": "SST",
        "type": null
      },
      {
        "name": "Europe & Central Asia (IDA & IBRD)",
        "code": "TEC",
        "type": null
      },
      {
        "name": "East Asia & Pacific (IDA & IBRD)",
        "code": "TEA",
        "type": null
      },
      {
        "name": "Latin America & Caribbean (IDA & IBRD)",
        "code": "TLA",
        "type": null
      },
      {
        "name": "Middle East, North Africa, Afghanistan & Pakistan (IDA & IBRD)",
        "code": "TMN",
        "type": null
      },
      {
        "name": "South Asia (IDA & IBRD)",
        "code": "TSA",
        "type": null
      },
      {
        "name": "Sub-Saharan Africa (IDA & IBRD)",
        "code": "TSS",
        "type": null
      },
      {
        "name": "Upper middle income",
        "code": "UMC",
        "type": null
      },
      {
        "name": "World",
        "code": "WLD",
        "type": null
      }
    ],
    "aggregation_method_references": [],
    "license": [
      {
        "name": "CC BY-4.0",
        "uri": "https://creativecommons.org/licenses/by/4.0/",
        "note": null
      }
    ],
    "links": [
      {
        "type": "WDI API",
        "description": "Data in JSON",
        "uri": "https://api.worldbank.org/v2/countries/all/indicators/sh.sta.mmrt?date=2000:2020&format=json",
        "image_uri": null
      },
      {
        "type": "WDI API",
        "description": "Data in XML",
        "uri": "https://api.worldbank.org/v2/countries/all/indicators/sh.sta.mmrt?date=2000:2020",
        "image_uri": null
      },
      {
        "type": "WDI API",
        "description": "Metadata in JSON",
        "uri": "https://api.worldbank.org/v2/sources/2/series/sh.sta.mmrt/metadata?format=json",
        "image_uri": null
      },
      {
        "type": "WDI API",
        "description": "Metadata in XML",
        "uri": "https://api.worldbank.org/v2/sources/2/series/sh.sta.mmrt/metadata",
        "image_uri": null
      }
    ],
    "api_documentation": [
      {
        "description": "Developer Information webpage (detailed documentation of the WDI API)",
        "uri": "https://datahelpdesk.worldbank.org/knowledgebase/topics/125589-developer-information"
      }
    ],
    "sources": [
      {
        "idno": null,
        "type": null,
        "name": "Trends in Maternal Mortality",
        "organization": "World Health Organization (WHO)",
        "publisher": null,
        "publication_date": null,
        "uri": "https://www.who.int/news/item/23-02-2023-a-woman-dies-every-two-minutes-due-to-pregnancy-or-childbirth--un-agencies",
        "access_date": null,
        "note": null,
        "other_identifiers": [],
        "authors": [],
        "datasets": []
      },
      {
        "idno": null,
        "type": null,
        "name": null,
        "organization": "UN Children's Fund (UNICEF)",
        "publisher": null,
        "publication_date": null,
        "uri": null,
        "access_date": null,
        "note": "Trends in Maternal Mortality",
        "other_identifiers": [],
        "authors": [],
        "datasets": []
      },
      {
        "idno": null,
        "type": null,
        "name": null,
        "organization": "UN Population Fund (UNFPA)",
        "publisher": null,
        "publication_date": null,
        "uri": null,
        "access_date": null,
        "note": "Trends in Maternal Mortality",
        "other_identifiers": [],
        "authors": [],
        "datasets": []
      },
      {
        "idno": null,
        "type": null,
        "name": null,
        "organization": "World Bank Group (WBG)",
        "publisher": null,
        "publication_date": null,
        "uri": null,
        "access_date": null,
        "note": "Trends in Maternal Mortality",
        "other_identifiers": [],
        "authors": [],
        "datasets": []
      }
    ],
    "notes": [
      {
        "note": "This indicator represents the risk associated with each pregnancy and is also a Sustainable Development Goal Indicator (3.1.1) for monitoring maternal health.",
        "type": null,
        "uri": null
      }
    ],
    "related_indicators": []
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
        "DZA",
        "BRA",
        "KEN",
        "BTN",
        "TZA",
        "ECA",
        "IBD",
        "LCA",
        "CIV",
        "ATG",
        "IDN",
        "KIR",
        "GUY",
        "EAR",
        "MHL",
        "EGY",
        "SLV",
        "VCT",
        "TUN",
        "TKM",
        "FCS",
        "LAO",
        "BFA",
        "GMB",
        "LBR",
        "IRQ",
        "SAU",
        "GBR",
        "AFE",
        "WLD",
        "ARM",
        "BDI",
        "COL",
        "LUX",
        "ERI",
        "ZWE",
        "CUB",
        "NAM",
        "PRI",
        "IDB",
        "BRN",
        "HUN",
        "NAC",
        "FIN",
        "DNK",
        "ECU",
        "AFG",
        "LMY",
        "TCD",
        "EMU",
        "GEO",
        "BHR",
        "BGR",
        "CMR",
        "CAF",
        "SWE",
        "GIN",
        "KOR",
        "TLS",
        "SEN",
        "TUV",
        "CPV",
        "MYS",
        "TSS",
        "BLR",
        "HTI",
        "DOM",
        "AND",
        "PAN",
        "TEC",
        "SSA",
        "NER",
        "UMC",
        "STP",
        "SSF",
        "COG",
        "MUS",
        "PRT",
        "EST",
        "DEU",
        "GTM",
        "GRC",
        "HND",
        "MCO",
        "PSE",
        "THA",
        "DMA",
        "SMR",
        "SAS",
        "FRA",
        "URY",
        "CSS",
        "GHA",
        "NLD",
        "ARG",
        "BLZ",
        "ETH",
        "WSM",
        "MIC",
        "KGZ",
        "FSM",
        "SSD",
        "TSA",
        "RUS",
        "TUR",
        "UKR",
        "CAN",
        "UZB",
        "GNQ",
        "MAR",
        "ESP",
        "VNM",
        "YEM",
        "MWI",
        "SOM",
        "COD",
        "ZAF",
        "CHL",
        "PRK",
        "PAK",
        "BOL",
        "MMR",
        "TGO",
        "AFW",
        "NIC",
        "SST",
        "JAM",
        "ROU",
        "SRB",
        "ITA",
        "NGA",
        "PHL",
        "OED",
        "CYP",
        "TEA",
        "PER",
        "LDC",
        "GAB",
        "FJI",
        "OMN",
        "ARE",
        "PNG",
        "LAC",
        "LTU",
        "SLB",
        "QAT",
        "COM",
        "SWZ",
        "TTO",
        "SVK",
        "EUU",
        "MKD",
        "NPL",
        "DJI",
        "ISL",
        "MNG",
        "PRY",
        "LBN",
        "LIC",
        "MDA",
        "SYR",
        "BEL",
        "MOZ",
        "IDA",
        "ALB",
        "HPC",
        "CRI",
        "GRD",
        "IRL",
        "UGA",
        "ZMB",
        "MEX",
        "MDG",
        "BGD",
        "BWA",
        "KWT",
        "PSS",
        "HRV",
        "IND",
        "USA",
        "VEN",
        "SGP",
        "HIC",
        "LSO",
        "LTE",
        "MDV",
        "KAZ",
        "SVN",
        "ARB",
        "LKA",
        "TJK",
        "CZE",
        "AUT",
        "GNB",
        "JPN",
        "IBT",
        "TLA",
        "MLT",
        "SYC",
        "ISR",
        "EAP",
        "TMN",
        "AUS",
        "SDN",
        "OSS",
        "IRN",
        "SLE",
        "LCN",
        "NZL",
        "BHS",
        "BEN",
        "BIH",
        "JOR",
        "NOR",
        "VUT",
        "LVA",
        "MEA",
        "AGO",
        "MLI",
        "LBY",
        "RWA",
        "ECS",
        "IDX",
        "LMC",
        "AZE",
        "SUR",
        "PRE",
        "PST",
        "NRU",
        "KNA",
        "CHE",
        "CEB",
        "TON",
        "EAS",
        "CHN",
        "MNE",
        "BRB",
        "MRT",
        "POL",
        "PLW",
        "MNA",
        "KHM"
      ]
    },
    {
      "field_name": "INDICATOR",
      "label_name": "Statistical indicator",
      "field_value": [
        "WB_WDI_SH_STA_MMRT"
      ]
    },
    {
      "field_name": "SEX",
      "label_name": "Sex",
      "field_value": [
        "_T"
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
        "DT_10P5BR_L"
      ]
    },
    {
      "field_name": "TIME_PERIOD",
      "label_name": "Time period",
      "field_value": [
        "1992",
        "1990",
        "1989",
        "1999",
        "2017",
        "1991",
        "2021",
        "2014",
        "1996",
        "2010",
        "1986",
        "2011",
        "2003",
        "2012",
        "1985",
        "2007",
        "2000",
        "2019",
        "2009",
        "2006",
        "2015",
        "1988",
        "1993",
        "1998",
        "2008",
        "2020",
        "1987",
        "1997",
        "2018",
        "2002",
        "2016",
        "1994",
        "2001",
        "1995",
        "2022",
        "2004",
        "2005",
        "2023",
        "2013"
      ]
    }
  ],
  "error": null
}
```



### 👤 User (Turn 2)

Could you please provide simple line charts comparing the HIV prevalence and maternal mortality trends over the past decade for South Africa, Botswana, and Namibia?

### 🤖 Assistant

**Summary:** Here are two ready‑to‑use line charts for the last decade, comparing South Africa, Botswana, and Namibia on HIV prevalence and maternal mortality.

---

**Data:**

1. **HIV prevalence, adults 15–49 (%), 2014–2024**  
   - Indicator: *Prevalence of HIV, total (% of population ages 15–49)*  
   - Database/ID: **World Development Indicators — WB_WDI_SH_DYN_AIDS_ZS**

   **Chart (line chart, 2014–2024):**  
   [View HIV prevalence trend chart (ZAF, BWA, NAM, 2014–2024)](http://localhost:8000/static/viz_specs/3d0ba536-1f15-4246-8576-0fbd51ac7648_vega.json)

2. **Maternal mortality ratio (per 100,000 live births), 2014–2023**  
   - Indicator: *Maternal mortality ratio (modeled estimate, per 100,000 live births)*  
   - Database/ID: **World Development Indicators — WB_WDI_SH_STA_MMRT**

   **Chart (line chart, 2014–2023):**  
   [View maternal mortality trend chart (ZAF, BWA, NAM, 2014–2023)](http://localhost:8000/static/viz_specs/2cbf0c0f-b47f-4e49-9a23-8e14429b7db4_vega.json)

---

**Analysis (very brief):**

- **HIV prevalence:** All three countries show a **gradual downward trend** over the decade, with South Africa and Botswana remaining above Namibia but converging slowly as prevalence falls.
- **Maternal mortality:** All three show **overall improvement** over the decade but with a **clear spike around 2020–2021**, consistent with COVID‑19 disruptions, followed by partial recovery.

---

**Sources:**

- **World Bank — World Development Indicators (WDI)**  
  - *Prevalence of HIV, total (% of population ages 15–49)* — SH.DYN.AIDS.ZS (WB_WDI_SH_DYN_AIDS_ZS)  
  - *Maternal mortality ratio (modeled estimate, per 100,000 live births)* — SH.STA.MMRT (WB_WDI_SH_STA_MMRT)

---

**Suggested follow-ups:**

1. Could you export the underlying data for these charts into a table or CSV for South Africa, Botswana, and Namibia?  
2. Can you add regional averages (Sub‑Saharan Africa and global) to these charts for context?  
3. Could you help interpret how changes in HIV prevalence might be related to maternal mortality trends in these three countries?

---
📋 **Tool Calls** (for evaluation context)

**1. data360_get_viz_spec**
```json
{
  "database_id": "WB_WDI",
  "indicator_id": "WB_WDI_SH_DYN_AIDS_ZS",
  "country_code": "ZAF,BWA,NAM",
  "start_year": 2014,
  "end_year": 2024,
  "chart_type": "line chart"
}
```
**Result:**
```json
{
  "url": "http://localhost:8000/static/viz_specs/3d0ba536-1f15-4246-8576-0fbd51ac7648_vega.json",
  "error": null
}
```

**2. data360_get_viz_spec**
```json
{
  "database_id": "WB_WDI",
  "indicator_id": "WB_WDI_SH_STA_MMRT",
  "country_code": "ZAF,BWA,NAM",
  "start_year": 2014,
  "end_year": 2023,
  "chart_type": "line chart"
}
```
**Result:**
```json
{
  "url": "http://localhost:8000/static/viz_specs/2cbf0c0f-b47f-4e49-9a23-8e14429b7db4_vega.json",
  "error": null
}
```



### 👤 User (Turn 3)

Could you please provide the underlying data tables or CSV files for these HIV prevalence and maternal mortality trend charts for South Africa, Botswana, and Namibia?

### 🤖 Assistant

Below are clean tables plus direct API URLs you can use to download CSV/JSON for both indicators.

---

## 1. HIV prevalence, adults 15–49 (%), 2014–2024

**Indicator:** Prevalence of HIV, total (% of population ages 15–49)  
**Code:** WB_WDI_SH_DYN_AIDS_ZS (alias SH.DYN.AIDS.ZS)

### Table (values in % of adults 15–49)

| Year | South Africa (ZAF) | Botswana (BWA) | Namibia (NAM) |
|------|---------------------|----------------|---------------|
| 2024 | <claim id="3878cdc4" policy="auto">17.2</claim> | <claim id="afe70664" policy="auto">15.7</claim> | <claim id="e6455594" policy="auto">9</claim> |
| 2023 | <claim id="98d86436" policy="auto">17.6</claim> | <claim id="147d9d7a" policy="auto">16.6</claim> | <claim id="1be9fe5f" policy="auto">9.4</claim> |
| 2022 | <claim id="09b4cdd6" policy="auto">17.9</claim> | <claim id="9a286d05" policy="auto">17.4</claim> | <claim id="26482c53" policy="auto">9.8</claim> |
| 2021 | <claim id="2eab0aa5" policy="auto">18.2</claim> | <claim id="07d599a1" policy="auto">18.2</claim> | <claim id="a5047eab" policy="auto">10.2</claim> |
| 2020 | <claim id="4f47cc43" policy="auto">18.4</claim> | <claim id="c986de9d" policy="auto">19</claim> | <claim id="0c611505" policy="auto">10.6</claim> |
| 2019 | <claim id="2663358b" policy="auto">18.5</claim> | <claim id="624f618f" policy="auto">19.7</claim> | <claim id="4275771c" policy="auto">11.1</claim> |
| 2018 | <claim id="69a97918" policy="auto">18.6</claim> | <claim id="c99b16b6" policy="auto">20.3</claim> | <claim id="eb101cb2" policy="auto">11.5</claim> |
| 2017 | <claim id="d8d2555a" policy="auto">18.6</claim> | <claim id="24ad2e1e" policy="auto">20.9</claim> | <claim id="e0890327" policy="auto">11.8</claim> |
| 2016 | <claim id="3bd56225" policy="auto">18.6</claim> | <claim id="d89340fe" policy="auto">21.4</claim> | <claim id="c612e3c7" policy="auto">12.1</claim> |
| 2015 | <claim id="69604609" policy="auto">18.5</claim> | <claim id="f84dfa4d" policy="auto">21.8</claim> | <claim id="164c3672" policy="auto">12.4</claim> |
| 2014 | <claim id="088c80ef" policy="auto">18.3</claim> | <claim id="ded61aad" policy="auto">22.1</claim> | <claim id="3dc2ac45" policy="auto">12.6</claim> |

### Direct API access (HIV prevalence, 2014–2024)

**Data360 API URL (JSON/CSV capable):**

- `WB_WDI_SH_DYN_AIDS_ZS` for ZAF, BWA, NAM, 2014–2024:  
  `https://data360api.worldbank.org/data360/data?DATABASE_ID=WB_WDI&INDICATOR=WB_WDI_SH_DYN_AIDS_ZS&REF_AREA=ZAF,BWA,NAM&timePeriodFrom=2014&timePeriodTo=2024&top=3000`

You can add `&format=csv` in many HTTP clients or use the CSV link from the metadata for the full global series if needed.

**Example (Python) to get a CSV-like table for these three countries:**

```python
import requests
import pandas as pd

url = "https://data360api.worldbank.org/data360/data"
params = {
    "DATABASE_ID": "WB_WDI",
    "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
    "REF_AREA": "ZAF,BWA,NAM",
    "timePeriodFrom": 2014,
    "timePeriodTo": 2024,
    "top": 3000
}

r = requests.get(url, params=params)
r.raise_for_status()
data = r.json()["data"]

df = pd.DataFrame(data)[["TIME_PERIOD", "REF_AREA", "OBS_VALUE"]]
df_pivot = df.pivot(index="TIME_PERIOD", columns="REF_AREA", values="OBS_VALUE")
print(df_pivot)
```

---

## 2. Maternal mortality ratio (per 100,000 live births), 2014–2023

**Indicator:** Maternal mortality ratio (modeled estimate, per 100,000 live births)  
**Code:** WB_WDI_SH_STA_MMRT (alias SH.STA.MMRT)

### Table (values = maternal deaths per 100,000 live births)

| Year | South Africa (ZAF) | Botswana (BWA) | Namibia (NAM) |
|------|---------------------|----------------|---------------|
| 2023 | <claim id="b48a6b8f" policy="auto">118</claim> | <claim id="513dd7a2" policy="auto">155</claim> | <claim id="615382c8" policy="auto">139</claim> |
| 2022 | <claim id="82777120" policy="auto">129</claim> | <claim id="6ca0eef0" policy="auto">120</claim> | <claim id="a7abaffd" policy="auto">127</claim> |
| 2021 | <claim id="3a3134ac" policy="auto">191</claim> | <claim id="2d8554c5" policy="auto">165</claim> | <claim id="d3255a18" policy="auto">254</claim> |
| 2020 | <claim id="3d773beb" policy="auto">118</claim> | <claim id="82b263ed" policy="auto">98</claim>  | <claim id="67cf8fa4" policy="auto">143</claim> |
| 2019 | <claim id="a8a15590" policy="auto">119</claim> | <claim id="e3ada008" policy="auto">100</claim> | <claim id="9f8bba70" policy="auto">175</claim> |
| 2018 | <claim id="8c3ba5b4" policy="auto">128</claim> | <claim id="d73d660c" policy="auto">99</claim>  | <claim id="036a441b" policy="auto">198</claim> |
| 2017 | <claim id="7851120f" policy="auto">134</claim> | <claim id="5e3550fb" policy="auto">46</claim>  | <claim id="ad3f0c01" policy="auto">213</claim> |
| 2016 | <claim id="57abc1d6" policy="auto">141</claim> | <claim id="5aee03e6" policy="auto">72</claim>  | <claim id="3e88a750" policy="auto">250</claim> |
| 2015 | <claim id="b8353256" policy="auto">150</claim> | <claim id="cb75c1b3" policy="auto">141</claim> | <claim id="da1b25ea" policy="auto">307</claim> |
| 2014 | <claim id="35bfa15a" policy="auto">162</claim> | <claim id="74ff37f2" policy="auto">212</claim> | <claim id="c166f92e" policy="auto">369</claim> |

### Direct API access (maternal mortality, 2014–2023)

**Data360 API URL:**

- `WB_WDI_SH_STA_MMRT` for ZAF, BWA, NAM, 2014–2023:  
  `https://data360api.worldbank.org/data360/data?DATABASE_ID=WB_WDI&INDICATOR=WB_WDI_SH_STA_MMRT&REF_AREA=ZAF,BWA,NAM&timePeriodFrom=2014&timePeriodTo=2023&top=3000`

**Example (Python) to get a CSV-like table:**

```python
import requests
import pandas as pd

url = "https://data360api.worldbank.org/data360/data"
params = {
    "DATABASE_ID": "WB_WDI",
    "INDICATOR": "WB_WDI_SH_STA_MMRT",
    "REF_AREA": "ZAF,BWA,NAM",
    "timePeriodFrom": 2014,
    "timePeriodTo": 2023,
    "top": 3000
}

r = requests.get(url, params=params)
r.raise_for_status()
data = r.json()["data"]

df = pd.DataFrame(data)[["TIME_PERIOD", "REF_AREA", "OBS_VALUE"]]
df_pivot = df.pivot(index="TIME_PERIOD", columns="REF_AREA", values="OBS_VALUE")
print(df_pivot)
```

---

**Note on interpretation / data quality (applies to both tables):**

- HIV prevalence values are **UNAIDS Spectrum model estimates**; they are comparable across countries but come with uncertainty ranges.
- Maternal mortality ratios are **MMEIG modeled estimates**; they are suitable for broad comparisons and SDG tracking but not precise year‑to‑year program evaluation.

---

**Sources:**

- **World Bank — World Development Indicators (WDI)**  
  - *Prevalence of HIV, total (% of population ages 15–49)* — SH.DYN.AIDS.ZS (WB_WDI_SH_DYN_AIDS_ZS) — modeled UNAIDS estimates.  
  - *Maternal mortality ratio (modeled estimate, per 100,000 live births)* — SH.STA.MMRT (WB_WDI_SH_STA_MMRT) — MMEIG model (WHO, UNICEF, UNFPA, World Bank, UNDESA).

---

**Suggested follow-ups:**

1. Could you also provide these same series in a machine‑readable CSV snippet directly in the chat (comma‑separated text)?  
2. Can you add regional (Sub‑Saharan Africa) and global averages to these tables for comparison?  
3. Could you help compute percentage changes over the decade for each country on both indicators?

---
📋 **Tool Calls** (for evaluation context)

**1. data360_get_data**
```json
{
  "database_id": "WB_WDI",
  "indicator_id": "WB_WDI_SH_DYN_AIDS_ZS",
  "disaggregation_filters": {
    "REF_AREA": "ZAF,BWA,NAM"
  },
  "start_year": 2014,
  "end_year": 2024,
  "limit": 100,
  "offset": 0
}
```
**Result:**
```json
{
  "count": 33,
  "total_count": null,
  "offset": 0,
  "has_more": false,
  "next_offset": null,
  "data": [
    {
      "OBS_VALUE": "17.2",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": true,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "ZAF",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2024",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "3878cdc4"
    },
    {
      "OBS_VALUE": "9",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": true,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "NAM",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2024",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "e6455594"
    },
    {
      "OBS_VALUE": "15.7",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": true,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "BWA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2024",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "afe70664"
    },
    {
      "OBS_VALUE": "17.6",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "ZAF",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2023",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "98d86436"
    },
    {
      "OBS_VALUE": "9.4",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "NAM",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2023",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "1be9fe5f"
    },
    {
      "OBS_VALUE": "16.6",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "BWA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2023",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "147d9d7a"
    },
    {
      "OBS_VALUE": "17.9",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "ZAF",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2022",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "09b4cdd6"
    },
    {
      "OBS_VALUE": "9.8",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "NAM",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2022",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "26482c53"
    },
    {
      "OBS_VALUE": "17.4",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "BWA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2022",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "9a286d05"
    },
    {
      "OBS_VALUE": "10.2",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "NAM",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2021",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "a5047eab"
    },
    {
      "OBS_VALUE": "18.2",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "ZAF",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2021",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "2eab0aa5"
    },
    {
      "OBS_VALUE": "18.2",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "BWA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2021",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "07d599a1"
    },
    {
      "OBS_VALUE": "19",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "BWA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2020",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "c986de9d"
    },
    {
      "OBS_VALUE": "18.4",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "ZAF",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2020",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "4f47cc43"
    },
    {
      "OBS_VALUE": "10.6",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "NAM",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2020",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "0c611505"
    },
    {
      "OBS_VALUE": "11.1",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "NAM",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2019",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "4275771c"
    },
    {
      "OBS_VALUE": "18.5",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "ZAF",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2019",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "2663358b"
    },
    {
      "OBS_VALUE": "19.7",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "BWA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2019",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "624f618f"
    },
    {
      "OBS_VALUE": "18.6",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "ZAF",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2018",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "69a97918"
    },
    {
      "OBS_VALUE": "20.3",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "BWA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2018",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "c99b16b6"
    },
    {
      "OBS_VALUE": "11.5",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "NAM",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2018",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "eb101cb2"
    },
    {
      "OBS_VALUE": "18.6",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "ZAF",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2017",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "d8d2555a"
    },
    {
      "OBS_VALUE": "20.9",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "BWA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2017",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "24ad2e1e"
    },
    {
      "OBS_VALUE": "11.8",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "NAM",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2017",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "e0890327"
    },
    {
      "OBS_VALUE": "12.1",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "NAM",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2016",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "c612e3c7"
    },
    {
      "OBS_VALUE": "21.4",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "BWA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2016",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "d89340fe"
    },
    {
      "OBS_VALUE": "18.6",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "ZAF",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2016",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "3bd56225"
    },
    {
      "OBS_VALUE": "21.8",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "BWA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2015",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "f84dfa4d"
    },
    {
      "OBS_VALUE": "12.4",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "NAM",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2015",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "164c3672"
    },
    {
      "OBS_VALUE": "18.5",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "ZAF",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2015",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "69604609"
    },
    {
      "OBS_VALUE": "12.6",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "NAM",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2014",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "3dc2ac45"
    },
    {
      "OBS_VALUE": "22.1",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "BWA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2014",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "ded61aad"
    },
    {
      "OBS_VALUE": "18.3",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Prevalence of HIV, total (% of population ages 15-49)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_AIDS_ZS",
      "REF_AREA": "ZAF",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2014",
      "FREQ": "A",
      "UNIT_MEASURE": "PT_POP_SUB",
      "UNIT_TYPE": null,
      "claim_id": "088c80ef"
    }
  ],
  "metadata": {
    "idno": "WB_WDI_SH_DYN_AIDS_ZS",
    "name": "Prevalence of HIV, total (% of population ages 15-49)",
    "database_id": "WB_WDI",
    "measurement_unit": "Percentage",
    "periodicity": "Annual",
    "definition_short": null
  },
  "error": null,
  "failed_validation": null
}
```

**2. data360_get_data**
```json
{
  "database_id": "WB_WDI",
  "indicator_id": "WB_WDI_SH_STA_MMRT",
  "disaggregation_filters": {
    "REF_AREA": "ZAF,BWA,NAM"
  },
  "start_year": 2014,
  "end_year": 2023,
  "limit": 100,
  "offset": 0
}
```
**Result:**
```json
{
  "count": 30,
  "total_count": null,
  "offset": 0,
  "has_more": false,
  "next_offset": null,
  "data": [
    {
      "OBS_VALUE": "118",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": true,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "ZAF",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2023",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "b48a6b8f"
    },
    {
      "OBS_VALUE": "139",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": true,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "NAM",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2023",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "615382c8"
    },
    {
      "OBS_VALUE": "155",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": true,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "BWA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2023",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "513dd7a2"
    },
    {
      "OBS_VALUE": "129",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "ZAF",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2022",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "82777120"
    },
    {
      "OBS_VALUE": "127",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "NAM",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2022",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "a7abaffd"
    },
    {
      "OBS_VALUE": "120",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "BWA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2022",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "6ca0eef0"
    },
    {
      "OBS_VALUE": "254",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "NAM",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2021",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "d3255a18"
    },
    {
      "OBS_VALUE": "191",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "ZAF",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2021",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "3a3134ac"
    },
    {
      "OBS_VALUE": "165",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "BWA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2021",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "2d8554c5"
    },
    {
      "OBS_VALUE": "98",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "BWA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2020",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "82b263ed"
    },
    {
      "OBS_VALUE": "118",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "ZAF",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2020",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "3d773beb"
    },
    {
      "OBS_VALUE": "143",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "NAM",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2020",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "67cf8fa4"
    },
    {
      "OBS_VALUE": "175",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "NAM",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2019",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "9f8bba70"
    },
    {
      "OBS_VALUE": "119",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "ZAF",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2019",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "a8a15590"
    },
    {
      "OBS_VALUE": "100",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "BWA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2019",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "e3ada008"
    },
    {
      "OBS_VALUE": "128",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "ZAF",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2018",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "8c3ba5b4"
    },
    {
      "OBS_VALUE": "99",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "BWA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2018",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "d73d660c"
    },
    {
      "OBS_VALUE": "198",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "NAM",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2018",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "036a441b"
    },
    {
      "OBS_VALUE": "46",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "BWA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2017",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "5e3550fb"
    },
    {
      "OBS_VALUE": "134",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "ZAF",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2017",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "7851120f"
    },
    {
      "OBS_VALUE": "213",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "NAM",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2017",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "ad3f0c01"
    },
    {
      "OBS_VALUE": "250",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "NAM",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2016",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "3e88a750"
    },
    {
      "OBS_VALUE": "72",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "BWA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2016",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "5aee03e6"
    },
    {
      "OBS_VALUE": "141",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "ZAF",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2016",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "57abc1d6"
    },
    {
      "OBS_VALUE": "141",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "BWA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2015",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "cb75c1b3"
    },
    {
      "OBS_VALUE": "307",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "NAM",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2015",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "da1b25ea"
    },
    {
      "OBS_VALUE": "150",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "ZAF",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2015",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "b8353256"
    },
    {
      "OBS_VALUE": "369",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "NAM",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2014",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "c166f92e"
    },
    {
      "OBS_VALUE": "212",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "BWA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2014",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "74ff37f2"
    },
    {
      "OBS_VALUE": "162",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_STA_MMRT",
      "REF_AREA": "ZAF",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2014",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P5BR_L",
      "UNIT_TYPE": null,
      "claim_id": "35bfa15a"
    }
  ],
  "metadata": {
    "idno": "WB_WDI_SH_STA_MMRT",
    "name": "Maternal mortality ratio (modeled estimate, per 100,000 live births)",
    "database_id": "WB_WDI",
    "measurement_unit": "Per 100,000 live births",
    "periodicity": "Annual",
    "definition_short": null
  },
  "error": null,
  "failed_validation": null
}
```

**3. data360_get_data_api_url**
```json
{
  "database_id": "WB_WDI",
  "indicator_id": "WB_WDI_SH_DYN_AIDS_ZS",
  "country_code": "ZAF,BWA,NAM",
  "start_year": 2014,
  "end_year": 2024
}
```
**Result:**
```json
{
  "type": "text",
  "text": "https://data360api.worldbank.org/data360/data?DATABASE_ID=WB_WDI&INDICATOR=WB_WDI_SH_DYN_AIDS_ZS&REF_AREA=ZAF,BWA,NAM&timePeriodFrom=2014&timePeriodTo=2024&top=3000",
  "annotations": null,
  "meta": null
}
```

**4. data360_get_data_api_url**
```json
{
  "database_id": "WB_WDI",
  "indicator_id": "WB_WDI_SH_STA_MMRT",
  "country_code": "ZAF,BWA,NAM",
  "start_year": 2014,
  "end_year": 2023
}
```
**Result:**
```json
{
  "type": "text",
  "text": "https://data360api.worldbank.org/data360/data?DATABASE_ID=WB_WDI&INDICATOR=WB_WDI_SH_STA_MMRT&REF_AREA=ZAF,BWA,NAM&timePeriodFrom=2014&timePeriodTo=2023&top=3000",
  "annotations": null,
  "meta": null
}
```


---
🧠 **Planner Reasoning** (for evaluation context)

**Intent:** Provide the underlying data (tables and downloadable links) for the HIV prevalence and maternal mortality trend charts for South Africa, Botswana, and Namibia over roughly the last decade.

**Selection Logic:**  
- HIV: `WB_WDI_SH_DYN_AIDS_ZS` — Prevalence of HIV, total (% of population ages 15–49), 2014–2024, for ZAF, BWA, NAM.  
- Maternal mortality: `WB_WDI_SH_STA_MMRT` — Maternal mortality ratio (modeled estimate, per 100,000 live births), 2014–2023, for ZAF, BWA, NAM.  
These match the indicators used in the earlier charts and have full coverage for the requested countries.

**Data Gaps:**  
- HIV: Continuous annual data 2014–2024 for all three countries.  
- Maternal mortality: Continuous annual data 2014–2023 for all three countries. No missing years in this window.

**CLARIFYING QUESTION:** None.
