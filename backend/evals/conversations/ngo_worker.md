# NGO_WORKER — Conversation & Evaluation

**Timestamp:** 20260301_185135
**Persona:** Fatima is a 35-year-old UNICEF field officer based in Sylhet, Bangladesh. She asks practical questio...
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
| Data Formatting [Conversational GEval] | 0.84 | 0.5 | ✅ PASS |
| Latest Data Note [Conversational GEval] | 1.00 | 0.5 | ✅ PASS |
| Content Structure [Conversational GEval] | 0.99 | 0.5 | ✅ PASS |
| Tool Call Appropriateness [Conversational GEval] | 1.00 | 0.5 | ✅ PASS |
| Tool Argument Quality [Conversational GEval] | 1.00 | 0.5 | ✅ PASS |
| Data Unavailability Handling [Conversational GEval] | 1.00 | 0.5 | ✅ PASS |

**Pass Rate:** 13/13 (100%)

## Insights

### Strengths

- **Perfect/near-perfect scores (≥0.95):** **Claim Tagging & PCN [Conversational GEval]**, **Content Structure [Conversational GEval]**, **Context Retention [Conversational GEval]**, **Conversation Completeness**, **Data Accuracy [Conversational GEval]**, **Data Unavailability Handling [Conversational GEval]**, **Follow-up Suggestions [Conversational GEval]**, **Latest Data Note [Conversational GEval]**, **Source Citation [Conversational GEval]**, **Tool Argument Quality [Conversational GEval]**, **Tool Call Appropriateness [Conversational GEval]**, **Turn Faithfulness**
- **Data Formatting [Conversational GEval]** (0.84): Strong performance

### No Failures 🎉

All metrics passed their thresholds.

---

## Conversation

### 👤 User (Turn 1)

Hello, I'm working on a report and need child mortality data for Sylhet, broken down by gender. Could you help me find the most detailed data available?

### 🤖 Assistant

In the international (World Bank / UN) datasets I can access, child mortality is only available at the **national level for Bangladesh**, not for specific divisions or districts like **Sylhet**. That means I cannot give you official Sylhet‑only under‑5 or infant mortality rates by sex from these sources.

However, I can help you in two ways:

1. **Clarify what is available from global databases (for context/comparison):**
   - Under‑5 mortality rate (total, male, female) for **Bangladesh as a whole**.
   - Infant mortality rate (total, male, female) for **Bangladesh as a whole**.
   - Neonatal mortality rate (national level).

2. **Point you to where Sylhet‑level, sex‑disaggregated data is most likely to exist:**
   - **Bangladesh Demographic and Health Surveys (BDHS)**: These are the primary source for **division‑level child mortality**, often with breakdowns by sex. Sylhet is one of the standard BDHS regions.
   - **Multiple Indicator Cluster Surveys (MICS)** by UNICEF: Sometimes provide sub‑national child mortality estimates.
   - **Government of Bangladesh**:
     - Bangladesh Bureau of Statistics (BBS) – reports on child and maternal health, Sample Vital Registration System (SVRS).
     - Ministry of Health and Family Welfare – Health Bulletin and related publications.
   - **Academic and NGO studies**:
     - Papers using BDHS microdata often publish **Sylhet‑specific under‑5 or infant mortality** by sex.
     - UNICEF, Save the Children, and similar organizations sometimes publish regional child mortality profiles.

Because these sub‑national estimates are not in the World Bank’s standard indicator system, you would typically get them by:

- Downloading the **latest BDHS report** (and possibly earlier rounds for trends) and using:
  - Tables titled like “Under‑five mortality by division and sex” or “Infant and child mortality by background characteristics”.
  - Look for rows/columns for **Sylhet** and **male/female**.
- If you need to compute custom estimates (e.g., for a specific time window or age group), using **BDHS microdata** via:
  - DHS Program website (registration required).
  - Statistical software (Stata, R, SPSS) with DHS standard mortality code.

**What I can do next, if helpful:**
- Summarize the **national‑level** child mortality trends for Bangladesh by sex (under‑5, infant, neonatal) using World Bank data, for context.
- Help you design a **short methods note** for your report explaining:
  - Why Sylhet‑level data are taken from BDHS (or another survey) rather than World Bank.
  - How the mortality indicators are defined and calculated.
- Suggest **exact table names/sections** to look for in BDHS or MICS reports.

**Clarifying question:**  
Do you already have access to BDHS or MICS reports/microdata, or do you need guidance on how to obtain and cite Sylhet‑level child mortality by sex from those sources?

**Suggested follow-ups:**
- “Can you summarize recent national under‑5 and infant mortality trends in Bangladesh by sex for my report, using World Bank data?”  
- “Can you walk me through how to extract Sylhet‑specific under‑5 mortality by sex from the latest BDHS report?”  
- “Could you draft a short methodology section explaining the data sources and limitations for Sylhet child mortality estimates?”

---
📋 **Tool Calls** (for evaluation context)

**1. data360_find_codelist_value**
```json
{
  "codelist_type": "REF_AREA",
  "query": "Bangladesh",
  "limit": 5
}
```
**Result:**
```json
[
  {
    "id": "BGD",
    "name": "Bangladesh",
    "score": 100
  }
]
```

**2. data360_search_indicators**
```json
{
  "query": "under-5 mortality rate",
  "required_country": "BGD",
  "limit": 10
}
```
**Result:**
```json
{
  "count": 10,
  "total_count": 1680,
  "offset": 0,
  "has_more": true,
  "next_offset": 10,
  "indicators": [
    {
      "idno": "WB_GS_SH_DYN_MORT",
      "database_id": "WB_GS",
      "name": "Mortality rate, under-5 (per 1,000 live births)",
      "truncated_definition": "Under-five mortality rate is the probability per 1,000 that a newborn baby will die before reaching ",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": [
        "SEX"
      ]
    },
    {
      "idno": "WB_HNP_SH_DYN_MORT",
      "database_id": "WB_HNP",
      "name": "Mortality rate, under-5 (per 1,000 live births)",
      "truncated_definition": "Under-five mortality rate is the probability per 1,000 that a newborn baby will die before reaching ",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_SH_DYN_MORT",
      "database_id": "WB_WDI",
      "name": "Mortality rate, under-5 (per 1,000 live births)",
      "truncated_definition": "Under-five mortality rate is the probability per 1,000 that a newborn baby will die before reaching ",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_SH_DYN_MORT_MA",
      "database_id": "WB_WDI",
      "name": "Mortality rate, under-5, male (per 1,000 live births)",
      "truncated_definition": "Under-five mortality rate, male is the probability per 1,000 that a newborn male baby will die befor",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_HCP_U5MORT",
      "database_id": "WB_HCP",
      "name": "Under-five mortality rate",
      "truncated_definition": "Under-5 mortality rate is the number of deaths of children during their first 4 completed years of l",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_SH_DYN_MORT_FE",
      "database_id": "WB_WDI",
      "name": "Mortality rate, under-5, female (per 1,000 live births)",
      "truncated_definition": "Under-five mortality rate, female is the probability per 1,000 that a newborn female baby will die b",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_ESG_SH_DYN_MORT",
      "database_id": "WB_ESG",
      "name": "Mortality rate, under-5 (per 1,000 live births)",
      "truncated_definition": "Under-five mortality rate is the probability per 1,000 that a newborn baby will die before reaching ",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
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
      "idno": "WB_HCP_MORT514",
      "database_id": "WB_HCP",
      "name": "Child mortality rate (per 1,000 children aged 5), ages 5-14",
      "truncated_definition": "Probability of dying between ages 5 and 14, expressed per 1,000 children at age 5.\nName in source: M",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "2010-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_SP_DYN_IMRT_MA_IN",
      "database_id": "WB_WDI",
      "name": "Mortality rate, infant, male (per 1,000 live births)",
      "truncated_definition": "Infant mortality rate, male is the number of male infants dying before reaching one year of age, per",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    }
  ],
  "required_country": "BGD",
  "error": null
}
```

**3. data360_search_indicators**
```json
{
  "query": "infant mortality rate",
  "required_country": "BGD",
  "limit": 10
}
```
**Result:**
```json
{
  "count": 10,
  "total_count": 1041,
  "offset": 0,
  "has_more": true,
  "next_offset": 10,
  "indicators": [
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
      "idno": "WB_WDI_SP_DYN_IMRT_MA_IN",
      "database_id": "WB_WDI",
      "name": "Mortality rate, infant, male (per 1,000 live births)",
      "truncated_definition": "Infant mortality rate, male is the number of male infants dying before reaching one year of age, per",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_SP_DYN_IMRT_FE_IN",
      "database_id": "WB_WDI",
      "name": "Mortality rate, infant, female (per 1,000 live births)",
      "truncated_definition": "Infant mortality rate, female is the number of female infants dying before reaching one year of age,",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_SH_DYN_MORT",
      "database_id": "WB_WDI",
      "name": "Mortality rate, under-5 (per 1,000 live births)",
      "truncated_definition": "Under-five mortality rate is the probability per 1,000 that a newborn baby will die before reaching ",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_HNP_SH_DYN_MORT",
      "database_id": "WB_HNP",
      "name": "Mortality rate, under-5 (per 1,000 live births)",
      "truncated_definition": "Under-five mortality rate is the probability per 1,000 that a newborn baby will die before reaching ",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_GS_SH_DYN_MORT",
      "database_id": "WB_GS",
      "name": "Mortality rate, under-5 (per 1,000 live births)",
      "truncated_definition": "Under-five mortality rate is the probability per 1,000 that a newborn baby will die before reaching ",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": [
        "SEX"
      ]
    },
    {
      "idno": "WB_WDI_SH_DYN_MORT_MA",
      "database_id": "WB_WDI",
      "name": "Mortality rate, under-5, male (per 1,000 live births)",
      "truncated_definition": "Under-five mortality rate, male is the probability per 1,000 that a newborn male baby will die befor",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_HNP_SH_DYN_NMRT",
      "database_id": "WB_HNP",
      "name": "Mortality rate, neonatal (per 1,000 live births)",
      "truncated_definition": "Neonatal mortality rate is the number of neonates dying before reaching 28 days of age, per 1,000 li",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    }
  ],
  "required_country": "BGD",
  "error": null
}
```

**4. data360_search_indicators**
```json
{
  "query": "neonatal mortality rate",
  "required_country": "BGD",
  "limit": 10
}
```
**Result:**
```json
{
  "count": 10,
  "total_count": 1043,
  "offset": 0,
  "has_more": true,
  "next_offset": 10,
  "indicators": [
    {
      "idno": "WB_HNP_SH_DYN_NMRT",
      "database_id": "WB_HNP",
      "name": "Mortality rate, neonatal (per 1,000 live births)",
      "truncated_definition": "Neonatal mortality rate is the number of neonates dying before reaching 28 days of age, per 1,000 li",
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
      "idno": "WB_HCP_NEOMORT",
      "database_id": "WB_HCP",
      "name": "Neonatal Mortality rate (per 1,000 live births)",
      "truncated_definition": "Neonatal mortality rate is the number of deaths during the first 28 completed days of life per 1,000",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_SH_DYN_MORT",
      "database_id": "WB_WDI",
      "name": "Mortality rate, under-5 (per 1,000 live births)",
      "truncated_definition": "Under-five mortality rate is the probability per 1,000 that a newborn baby will die before reaching ",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_GS_SH_DYN_MORT",
      "database_id": "WB_GS",
      "name": "Mortality rate, under-5 (per 1,000 live births)",
      "truncated_definition": "Under-five mortality rate is the probability per 1,000 that a newborn baby will die before reaching ",
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
      "idno": "WB_HNP_SH_DYN_MORT",
      "database_id": "WB_HNP",
      "name": "Mortality rate, under-5 (per 1,000 live births)",
      "truncated_definition": "Under-five mortality rate is the probability per 1,000 that a newborn baby will die before reaching ",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_SH_DYN_MORT_MA",
      "database_id": "WB_WDI",
      "name": "Mortality rate, under-5, male (per 1,000 live births)",
      "truncated_definition": "Under-five mortality rate, male is the probability per 1,000 that a newborn male baby will die befor",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_SH_DYN_MORT_FE",
      "database_id": "WB_WDI",
      "name": "Mortality rate, under-5, female (per 1,000 live births)",
      "truncated_definition": "Under-five mortality rate, female is the probability per 1,000 that a newborn female baby will die b",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_SP_DYN_IMRT_MA_IN",
      "database_id": "WB_WDI",
      "name": "Mortality rate, infant, male (per 1,000 live births)",
      "truncated_definition": "Infant mortality rate, male is the number of male infants dying before reaching one year of age, per",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    }
  ],
  "required_country": "BGD",
  "error": null
}
```



### 👤 User (Turn 2)

Yes, I don't have access to BDHS or MICS reports yet. Could you guide me on how to obtain and cite Sylhet-level child mortality data by sex from those sources?

### 🤖 Assistant

This is within health/development data, so I can help.

1) Getting the reports (no microdata needed if you just want tables)  
- BDHS:  
  - Go to: https://dhsprogram.com → “Publications” → “Country Reports” → choose Bangladesh.  
  - Download the latest **Bangladesh Demographic and Health Survey** final report (PDF) and, if you need trends, one or two earlier rounds.  
- MICS:  
  - Go to: https://mics.unicef.org → “Surveys and results” → filter by country “Bangladesh”.  
  - Download the latest **Bangladesh MICS** final report (and statistical tables, often a separate Excel/PDF).

2) Finding Sylhet-level, sex-disaggregated child mortality in BDHS  
In the BDHS PDF:  
- Use the search function for terms like:  
  - “Under-five mortality”  
  - “Infant and child mortality”  
  - “Table 8.” (mortality tables are usually in Chapter 8 or similar).  
- Look for tables titled along the lines of:  
  - “Early childhood mortality rates”  
  - “Infant and under-five mortality by background characteristics”  
- In those tables:  
  - One of the background characteristics is usually **division**; Sylhet will appear as a row.  
  - Some BDHS rounds also show **mortality by sex**; if not, you may only get total mortality for Sylhet from the report (sex breakdown would then require microdata).  
- Extract:  
  - Under‑5 mortality rate (per 1,000 live births) – total, and if available, male/female for Sylhet.  
  - Infant mortality rate (per 1,000 live births) – total, and if available, male/female for Sylhet.  

3) Finding Sylhet-level data in MICS  
In the MICS report/statistical tables:  
- Search for:  
  - “Under-five mortality rate”  
  - “Infant mortality rate”  
- Look for tables with disaggregation by **region/division** and, if available, **sex of child**.  
- MICS sometimes provides an Excel file with all tables; there you can filter for:  
  - Indicator: under‑5 mortality / infant mortality  
  - Disaggregation: region (Sylhet) and sex (male/female).

4) If you need sex-disaggregated Sylhet data and it’s not in the printed tables  
Then you need microdata (more work, but standard in research):  

a) Request BDHS microdata  
- Go to: https://dhsprogram.com → “Data” → “Download Datasets”.  
- Create a free account and submit a request specifying:  
  - Country: Bangladesh  
  - Survey: the BDHS round(s) you need  
  - Purpose: academic / policy analysis, brief description of your project.  
- Once approved, download the **Births (BR)** and/or **Household (HR)** and **Women’s (IR)** files.  

b) Compute mortality rates by division and sex  
- Use Stata/R/SPSS with DHS standard code (DHS provides example mortality do-files).  
- Steps in brief:  
  - Restrict to births in a defined period (e.g., 0–9 years before survey).  
  - Use variables: date of birth, age at death, survival status, division (region), sex of child.  
  - Apply DHS sampling weights.  
  - Calculate:  
    - Neonatal, infant, under‑5 mortality rates per 1,000 live births, by division (Sylhet) and sex.  
- This is a technical task; if you’re not doing coding yourself, you may want a statistician or demographer to run it.

5) How to cite BDHS and MICS in your report  

a) BDHS (report tables only) – example citation  
- In text:  
  - “Division-level under‑five mortality rates by sex for Sylhet are taken from the Bangladesh Demographic and Health Survey 2017–18 (NIPORT et al., 2020).”  
- Reference list (adapt to the exact year and edition you use):  
  - National Institute of Population Research and Training (NIPORT), and ICF. 2020. *Bangladesh Demographic and Health Survey 2017–18*. Dhaka, Bangladesh, and Rockville, Maryland, USA: NIPORT and ICF.  

b) BDHS (if you use microdata) – add a data citation  
- In text:  
  - “Author’s calculations using BDHS 2017–18 microdata (NIPORT and ICF, 2020).”  
- Reference list (example):  
  - NIPORT and ICF. 2020. *Bangladesh Demographic and Health Survey 2017–18 [Dataset]*. Dhaka, Bangladesh, and Rockville, Maryland, USA: NIPORT and ICF. Available from The DHS Program (https://dhsprogram.com).  

c) MICS – example citation  
- In text:  
  - “Sylhet under‑five mortality estimates are cross-checked against Bangladesh MICS 2019 (BBS and UNICEF, 2020).”  
- Reference list (adapt to actual year):  
  - Bangladesh Bureau of Statistics (BBS) and UNICEF. 2020. *Bangladesh Multiple Indicator Cluster Survey 2019, Survey Findings Report*. Dhaka, Bangladesh: BBS and UNICEF.  

6) Suggested wording for your methods section  
You can adapt something like this:  

- “Subnational child mortality estimates for Sylhet division, disaggregated by sex, are derived from nationally representative household surveys. Where available, we use published tables from the Bangladesh Demographic and Health Survey (BDHS) and Bangladesh Multiple Indicator Cluster Survey (MICS), which report infant and under‑five mortality rates by division and, in some cases, by sex of the child. When sex-disaggregated Sylhet estimates are not directly tabulated, we compute them from BDHS microdata using standard DHS mortality methods, applying survey weights and restricting to births in the 0–9 years preceding the survey. All mortality rates are expressed as deaths per 1,000 live births.”  

If you tell me which BDHS/MICS round you plan to use (e.g., “latest available” or a specific year), I can help you draft a very precise citation and a 1–2 sentence description tailored to your report.

### 👤 User (Turn 3)

Could you please summarize the most recent national under-5 and infant mortality rates in Bangladesh by sex using World Bank data for my report context?

### 🤖 Assistant

**Summary (for your report):**  
Using the latest World Bank World Development Indicators (2023), Bangladesh’s national child mortality remains higher for boys than girls, for both under‑5 and infant mortality.

---

### Data (Bangladesh, 2023, per 1,000 live births)

**Under‑5 mortality (0–4 years)**  
- Total: <claim id="bb23d18a" policy="auto">30.6</claim> deaths per 1,000 live births  
- Male: <claim id="af23ff76" policy="auto">32.6</claim> deaths per 1,000 live births  
- Female: <claim id="1722e025" policy="auto">28.4</claim> deaths per 1,000 live births  

**Infant mortality (0–11 months)**  
- Total: <claim id="65162ee1" policy="auto">24.4</claim> deaths per 1,000 live births  
- Male: <claim id="04e8232e" policy="auto">26.0</claim> deaths per 1,000 live births  
- Female: <claim id="249824fc" policy="auto">22.6</claim> deaths per 1,000 live births  

You can describe this in prose as:

> “According to the latest World Bank estimates (2023), Bangladesh’s under‑five mortality rate is <claim id="bb23d18a" policy="auto">30.6</claim> deaths per 1,000 live births (male: <claim id="af23ff76" policy="auto">32.6</claim>; female: <claim id="1722e025" policy="auto">28.4</claim>). The infant mortality rate is <claim id="65162ee1" policy="auto">24.4</claim> deaths per 1,000 live births (male: <claim id="04e8232e" policy="auto">26.0</claim>; female: <claim id="249824fc" policy="auto">22.6</claim>). These national figures provide the broader context for Sylhet’s child mortality patterns.”

---

### Analysis (brief, for context)

- **Sex gap:** In 2023, boys have higher mortality than girls:
  - Under‑5: about **4 deaths more per 1,000** for boys than girls (32.6 vs. 28.4).  
  - Infant: about **3–4 deaths more per 1,000** for boys than girls (26.0 vs. 22.6).  
- **Trend 2019–2023 (optional 1–2 sentences if you want them):**
  - Under‑5 mortality fell slightly from <claim id="925b8b7c" policy="auto">32.4</claim> (2019) to <claim id="bb23d18a" policy="auto">30.6</claim> (2023).  
  - Infant mortality fell from <claim id="37ecba04" policy="auto">25.4</claim> (2019) to <claim id="65162ee1" policy="auto">24.4</claim> (2023).  
  - Male and female rates both declined modestly over this period.

You can frame this as: “National child mortality has continued a gradual decline in recent years, with consistently higher mortality among boys than girls.”

---

### Sources:

- **World Bank — World Development Indicators (WDI)**  
  - Mortality rate, under‑5 (per 1,000 live births), total — indicator `SH.DYN.MORT` (here: `WB_WDI_SH_DYN_MORT`)  
  - Mortality rate, under‑5, male (per 1,000 live births) — `SH.DYN.MORT.MA` (here: `WB_WDI_SH_DYN_MORT_MA`)  
  - Mortality rate, under‑5, female (per 1,000 live births) — `SH.DYN.MORT.FE` (here: `WB_WDI_SH_DYN_MORT_FE`)  
  - Mortality rate, infant (per 1,000 live births), total — `SP.DYN.IMRT.IN` (here: `WB_WDI_SP_DYN_IMRT_IN`)  
  - Mortality rate, infant, male (per 1,000 live births) — `SP.DYN.IMRT.MA.IN` (here: `WB_WDI_SP_DYN_IMRT_MA_IN`)  
  - Mortality rate, infant, female (per 1,000 live births) — `SP.DYN.IMRT.FE.IN` (here: `WB_WDI_SP_DYN_IMRT_FE_IN`)  

---

**Suggested follow-ups:**  
- “Can you help me draft a short paragraph comparing Sylhet’s expected child mortality to these national figures, once I have Sylhet data?”  
- “Could you provide a small table showing the 2019–2023 trend in these mortality rates for Bangladesh?”  
- “Can you help me write a brief methods/limitations box explaining the difference between World Bank modelled estimates and survey-based (BDHS/MICS) estimates?”

---
📋 **Tool Calls** (for evaluation context)

**1. data360_search_indicators**
```json
{
  "query": "under-5 mortality rate male female Bangladesh",
  "required_country": "BGD",
  "limit": 10
}
```
**Result:**
```json
{
  "count": 10,
  "total_count": 7538,
  "offset": 0,
  "has_more": true,
  "next_offset": 10,
  "indicators": [
    {
      "idno": "WB_WDI_SP_DYN_AMRT_MA",
      "database_id": "WB_WDI",
      "name": "Mortality rate, adult, male (per 1,000 male adults)",
      "truncated_definition": "Adult mortality rate, male, is the probability of dying between the ages of 15 and 60--that is, the ",
      "periodicity": "Annual",
      "latest_data": "2024",
      "time_period_range": "1960-2024",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_SP_DYN_AMRT_FE",
      "database_id": "WB_WDI",
      "name": "Mortality rate, adult, female (per 1,000 female adults)",
      "truncated_definition": "Adult mortality rate, female, is the probability of dying between the ages of 15 and 60--that is, th",
      "periodicity": "Annual",
      "latest_data": "2024",
      "time_period_range": "1960-2024",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_SH_DYN_MORT_MA",
      "database_id": "WB_WDI",
      "name": "Mortality rate, under-5, male (per 1,000 live births)",
      "truncated_definition": "Under-five mortality rate, male is the probability per 1,000 that a newborn male baby will die befor",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_SH_DYN_MORT_FE",
      "database_id": "WB_WDI",
      "name": "Mortality rate, under-5, female (per 1,000 live births)",
      "truncated_definition": "Under-five mortality rate, female is the probability per 1,000 that a newborn female baby will die b",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_SH_DYN_MORT",
      "database_id": "WB_WDI",
      "name": "Mortality rate, under-5 (per 1,000 live births)",
      "truncated_definition": "Under-five mortality rate is the probability per 1,000 that a newborn baby will die before reaching ",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_GS_SH_DYN_MORT",
      "database_id": "WB_GS",
      "name": "Mortality rate, under-5 (per 1,000 live births)",
      "truncated_definition": "Under-five mortality rate is the probability per 1,000 that a newborn baby will die before reaching ",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": [
        "SEX"
      ]
    },
    {
      "idno": "WB_HNP_SH_DYN_MORT",
      "database_id": "WB_HNP",
      "name": "Mortality rate, under-5 (per 1,000 live births)",
      "truncated_definition": "Under-five mortality rate is the probability per 1,000 that a newborn baby will die before reaching ",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_HCP_U5MORT",
      "database_id": "WB_HCP",
      "name": "Under-five mortality rate",
      "truncated_definition": "Under-5 mortality rate is the number of deaths of children during their first 4 completed years of l",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_SP_DYN_IMRT_MA_IN",
      "database_id": "WB_WDI",
      "name": "Mortality rate, infant, male (per 1,000 live births)",
      "truncated_definition": "Infant mortality rate, male is the number of male infants dying before reaching one year of age, per",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_SP_DYN_IMRT_FE_IN",
      "database_id": "WB_WDI",
      "name": "Mortality rate, infant, female (per 1,000 live births)",
      "truncated_definition": "Infant mortality rate, female is the number of female infants dying before reaching one year of age,",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    }
  ],
  "required_country": "BGD",
  "error": null
}
```

**2. data360_search_indicators**
```json
{
  "query": "infant mortality rate male female Bangladesh",
  "required_country": "BGD",
  "limit": 10
}
```
**Result:**
```json
{
  "count": 10,
  "total_count": 7452,
  "offset": 0,
  "has_more": true,
  "next_offset": 10,
  "indicators": [
    {
      "idno": "WB_WDI_SP_DYN_AMRT_MA",
      "database_id": "WB_WDI",
      "name": "Mortality rate, adult, male (per 1,000 male adults)",
      "truncated_definition": "Adult mortality rate, male, is the probability of dying between the ages of 15 and 60--that is, the ",
      "periodicity": "Annual",
      "latest_data": "2024",
      "time_period_range": "1960-2024",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_SP_DYN_AMRT_FE",
      "database_id": "WB_WDI",
      "name": "Mortality rate, adult, female (per 1,000 female adults)",
      "truncated_definition": "Adult mortality rate, female, is the probability of dying between the ages of 15 and 60--that is, th",
      "periodicity": "Annual",
      "latest_data": "2024",
      "time_period_range": "1960-2024",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_SP_DYN_IMRT_MA_IN",
      "database_id": "WB_WDI",
      "name": "Mortality rate, infant, male (per 1,000 live births)",
      "truncated_definition": "Infant mortality rate, male is the number of male infants dying before reaching one year of age, per",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_SP_DYN_IMRT_FE_IN",
      "database_id": "WB_WDI",
      "name": "Mortality rate, infant, female (per 1,000 live births)",
      "truncated_definition": "Infant mortality rate, female is the number of female infants dying before reaching one year of age,",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
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
      "idno": "WB_WDI_SH_DYN_MORT_MA",
      "database_id": "WB_WDI",
      "name": "Mortality rate, under-5, male (per 1,000 live births)",
      "truncated_definition": "Under-five mortality rate, male is the probability per 1,000 that a newborn male baby will die befor",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_SH_DYN_MORT_FE",
      "database_id": "WB_WDI",
      "name": "Mortality rate, under-5, female (per 1,000 live births)",
      "truncated_definition": "Under-five mortality rate, female is the probability per 1,000 that a newborn female baby will die b",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_SH_DYN_MORT",
      "database_id": "WB_WDI",
      "name": "Mortality rate, under-5 (per 1,000 live births)",
      "truncated_definition": "Under-five mortality rate is the probability per 1,000 that a newborn baby will die before reaching ",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    }
  ],
  "required_country": "BGD",
  "error": null
}
```

**3. data360_get_data**
```json
{
  "database_id": "WB_WDI",
  "indicator_id": "WB_WDI_SH_DYN_MORT_MA",
  "disaggregation_filters": {
    "REF_AREA": "BGD"
  },
  "start_year": 2019,
  "end_year": 2023,
  "limit": 5,
  "offset": 0
}
```
**Result:**
```json
{
  "count": 5,
  "total_count": null,
  "offset": 0,
  "has_more": false,
  "next_offset": null,
  "data": [
    {
      "OBS_VALUE": "32.6",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Mortality rate, under-5, male (per 1,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": true,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_MORT_MA",
      "REF_AREA": "BGD",
      "SEX": "M",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2023",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P3BR_L",
      "UNIT_TYPE": null,
      "claim_id": "af23ff76"
    },
    {
      "OBS_VALUE": "32.7",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Mortality rate, under-5, male (per 1,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_MORT_MA",
      "REF_AREA": "BGD",
      "SEX": "M",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2022",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P3BR_L",
      "UNIT_TYPE": null,
      "claim_id": "0f26a22c"
    },
    {
      "OBS_VALUE": "33",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Mortality rate, under-5, male (per 1,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_MORT_MA",
      "REF_AREA": "BGD",
      "SEX": "M",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2021",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P3BR_L",
      "UNIT_TYPE": null,
      "claim_id": "e5aff6d4"
    },
    {
      "OBS_VALUE": "33.6",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Mortality rate, under-5, male (per 1,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_MORT_MA",
      "REF_AREA": "BGD",
      "SEX": "M",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2020",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P3BR_L",
      "UNIT_TYPE": null,
      "claim_id": "957acfb5"
    },
    {
      "OBS_VALUE": "34.5",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Mortality rate, under-5, male (per 1,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_MORT_MA",
      "REF_AREA": "BGD",
      "SEX": "M",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2019",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P3BR_L",
      "UNIT_TYPE": null,
      "claim_id": "b25ce27f"
    }
  ],
  "metadata": {
    "idno": "WB_WDI_SH_DYN_MORT_MA",
    "name": "Mortality rate, under-5, male (per 1,000 live births)",
    "database_id": "WB_WDI",
    "measurement_unit": "Per 1000 live births",
    "periodicity": "Annual",
    "definition_short": null
  },
  "error": null,
  "failed_validation": null
}
```

**4. data360_get_data**
```json
{
  "database_id": "WB_WDI",
  "indicator_id": "WB_WDI_SH_DYN_MORT_FE",
  "disaggregation_filters": {
    "REF_AREA": "BGD"
  },
  "start_year": 2019,
  "end_year": 2023,
  "limit": 5,
  "offset": 0
}
```
**Result:**
```json
{
  "count": 5,
  "total_count": null,
  "offset": 0,
  "has_more": false,
  "next_offset": null,
  "data": [
    {
      "OBS_VALUE": "28.4",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Mortality rate, under-5, female (per 1,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": true,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_MORT_FE",
      "REF_AREA": "BGD",
      "SEX": "F",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2023",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P3BR_L",
      "UNIT_TYPE": null,
      "claim_id": "1722e025"
    },
    {
      "OBS_VALUE": "28.5",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Mortality rate, under-5, female (per 1,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_MORT_FE",
      "REF_AREA": "BGD",
      "SEX": "F",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2022",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P3BR_L",
      "UNIT_TYPE": null,
      "claim_id": "71f113b1"
    },
    {
      "OBS_VALUE": "28.8",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Mortality rate, under-5, female (per 1,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_MORT_FE",
      "REF_AREA": "BGD",
      "SEX": "F",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2021",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P3BR_L",
      "UNIT_TYPE": null,
      "claim_id": "50899a89"
    },
    {
      "OBS_VALUE": "29.4",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Mortality rate, under-5, female (per 1,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_MORT_FE",
      "REF_AREA": "BGD",
      "SEX": "F",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2020",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P3BR_L",
      "UNIT_TYPE": null,
      "claim_id": "ebad7e28"
    },
    {
      "OBS_VALUE": "30.2",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Mortality rate, under-5, female (per 1,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_MORT_FE",
      "REF_AREA": "BGD",
      "SEX": "F",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2019",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P3BR_L",
      "UNIT_TYPE": null,
      "claim_id": "debafbea"
    }
  ],
  "metadata": {
    "idno": "WB_WDI_SH_DYN_MORT_FE",
    "name": "Mortality rate, under-5, female (per 1,000 live births)",
    "database_id": "WB_WDI",
    "measurement_unit": "Per 1000 live births",
    "periodicity": "Annual",
    "definition_short": null
  },
  "error": null,
  "failed_validation": null
}
```

**5. data360_get_data**
```json
{
  "database_id": "WB_WDI",
  "indicator_id": "WB_WDI_SP_DYN_IMRT_MA_IN",
  "disaggregation_filters": {
    "REF_AREA": "BGD"
  },
  "start_year": 2019,
  "end_year": 2023,
  "limit": 5,
  "offset": 0
}
```
**Result:**
```json
{
  "count": 5,
  "total_count": null,
  "offset": 0,
  "has_more": false,
  "next_offset": null,
  "data": [
    {
      "OBS_VALUE": "26",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Mortality rate, infant, male (per 1,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": true,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SP_DYN_IMRT_MA_IN",
      "REF_AREA": "BGD",
      "SEX": "M",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2023",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P3BR_L",
      "UNIT_TYPE": null,
      "claim_id": "04e8232e"
    },
    {
      "OBS_VALUE": "26",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Mortality rate, infant, male (per 1,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SP_DYN_IMRT_MA_IN",
      "REF_AREA": "BGD",
      "SEX": "M",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2022",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P3BR_L",
      "UNIT_TYPE": null,
      "claim_id": "ba2d472b"
    },
    {
      "OBS_VALUE": "26.1",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Mortality rate, infant, male (per 1,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SP_DYN_IMRT_MA_IN",
      "REF_AREA": "BGD",
      "SEX": "M",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2021",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P3BR_L",
      "UNIT_TYPE": null,
      "claim_id": "6e9c8cd3"
    },
    {
      "OBS_VALUE": "26.4",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Mortality rate, infant, male (per 1,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SP_DYN_IMRT_MA_IN",
      "REF_AREA": "BGD",
      "SEX": "M",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2020",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P3BR_L",
      "UNIT_TYPE": null,
      "claim_id": "80e36d3c"
    },
    {
      "OBS_VALUE": "27",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Mortality rate, infant, male (per 1,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SP_DYN_IMRT_MA_IN",
      "REF_AREA": "BGD",
      "SEX": "M",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2019",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P3BR_L",
      "UNIT_TYPE": null,
      "claim_id": "c1a30da6"
    }
  ],
  "metadata": {
    "idno": "WB_WDI_SP_DYN_IMRT_MA_IN",
    "name": "Mortality rate, infant, male (per 1,000 live births)",
    "database_id": "WB_WDI",
    "measurement_unit": "Per 1000 live births",
    "periodicity": "Annual",
    "definition_short": null
  },
  "error": null,
  "failed_validation": null
}
```

**6. data360_get_data**
```json
{
  "database_id": "WB_WDI",
  "indicator_id": "WB_WDI_SP_DYN_IMRT_FE_IN",
  "disaggregation_filters": {
    "REF_AREA": "BGD"
  },
  "start_year": 2019,
  "end_year": 2023,
  "limit": 5,
  "offset": 0
}
```
**Result:**
```json
{
  "count": 5,
  "total_count": null,
  "offset": 0,
  "has_more": false,
  "next_offset": null,
  "data": [
    {
      "OBS_VALUE": "22.6",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Mortality rate, infant, female (per 1,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": true,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SP_DYN_IMRT_FE_IN",
      "REF_AREA": "BGD",
      "SEX": "F",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2023",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P3BR_L",
      "UNIT_TYPE": null,
      "claim_id": "249824fc"
    },
    {
      "OBS_VALUE": "22.7",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Mortality rate, infant, female (per 1,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SP_DYN_IMRT_FE_IN",
      "REF_AREA": "BGD",
      "SEX": "F",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2022",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P3BR_L",
      "UNIT_TYPE": null,
      "claim_id": "02760246"
    },
    {
      "OBS_VALUE": "22.8",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Mortality rate, infant, female (per 1,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SP_DYN_IMRT_FE_IN",
      "REF_AREA": "BGD",
      "SEX": "F",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2021",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P3BR_L",
      "UNIT_TYPE": null,
      "claim_id": "eb872636"
    },
    {
      "OBS_VALUE": "23.2",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Mortality rate, infant, female (per 1,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SP_DYN_IMRT_FE_IN",
      "REF_AREA": "BGD",
      "SEX": "F",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2020",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P3BR_L",
      "UNIT_TYPE": null,
      "claim_id": "d248330e"
    },
    {
      "OBS_VALUE": "23.7",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Mortality rate, infant, female (per 1,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SP_DYN_IMRT_FE_IN",
      "REF_AREA": "BGD",
      "SEX": "F",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2019",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P3BR_L",
      "UNIT_TYPE": null,
      "claim_id": "b867f427"
    }
  ],
  "metadata": {
    "idno": "WB_WDI_SP_DYN_IMRT_FE_IN",
    "name": "Mortality rate, infant, female (per 1,000 live births)",
    "database_id": "WB_WDI",
    "measurement_unit": "Per 1000 live births",
    "periodicity": "Annual",
    "definition_short": null
  },
  "error": null,
  "failed_validation": null
}
```

**7. data360_get_data**
```json
{
  "database_id": "WB_WDI",
  "indicator_id": "WB_WDI_SH_DYN_MORT",
  "disaggregation_filters": {
    "REF_AREA": "BGD"
  },
  "start_year": 2019,
  "end_year": 2023,
  "limit": 5,
  "offset": 0
}
```
**Result:**
```json
{
  "count": 5,
  "total_count": null,
  "offset": 0,
  "has_more": false,
  "next_offset": null,
  "data": [
    {
      "OBS_VALUE": "30.6",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Mortality rate, under-5 (per 1,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": true,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_MORT",
      "REF_AREA": "BGD",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2023",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P3BR_L",
      "UNIT_TYPE": null,
      "claim_id": "bb23d18a"
    },
    {
      "OBS_VALUE": "30.7",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Mortality rate, under-5 (per 1,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_MORT",
      "REF_AREA": "BGD",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2022",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P3BR_L",
      "UNIT_TYPE": null,
      "claim_id": "d5c551ed"
    },
    {
      "OBS_VALUE": "31",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Mortality rate, under-5 (per 1,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_MORT",
      "REF_AREA": "BGD",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2021",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P3BR_L",
      "UNIT_TYPE": null,
      "claim_id": "7f10ece7"
    },
    {
      "OBS_VALUE": "31.5",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Mortality rate, under-5 (per 1,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_MORT",
      "REF_AREA": "BGD",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2020",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P3BR_L",
      "UNIT_TYPE": null,
      "claim_id": "8e6bd25f"
    },
    {
      "OBS_VALUE": "32.4",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Mortality rate, under-5 (per 1,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SH_DYN_MORT",
      "REF_AREA": "BGD",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2019",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P3BR_L",
      "UNIT_TYPE": null,
      "claim_id": "925b8b7c"
    }
  ],
  "metadata": {
    "idno": "WB_WDI_SH_DYN_MORT",
    "name": "Mortality rate, under-5 (per 1,000 live births)",
    "database_id": "WB_WDI",
    "measurement_unit": "Per 1000 live births",
    "periodicity": "Annual",
    "definition_short": null
  },
  "error": null,
  "failed_validation": null
}
```

**8. data360_get_data**
```json
{
  "database_id": "WB_WDI",
  "indicator_id": "WB_WDI_SP_DYN_IMRT_IN",
  "disaggregation_filters": {
    "REF_AREA": "BGD"
  },
  "start_year": 2019,
  "end_year": 2023,
  "limit": 5,
  "offset": 0
}
```
**Result:**
```json
{
  "count": 5,
  "total_count": null,
  "offset": 0,
  "has_more": false,
  "next_offset": null,
  "data": [
    {
      "OBS_VALUE": "24.4",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Mortality rate, infant (per 1,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": true,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SP_DYN_IMRT_IN",
      "REF_AREA": "BGD",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2023",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P3BR_L",
      "UNIT_TYPE": null,
      "claim_id": "65162ee1"
    },
    {
      "OBS_VALUE": "24.4",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Mortality rate, infant (per 1,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SP_DYN_IMRT_IN",
      "REF_AREA": "BGD",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2022",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P3BR_L",
      "UNIT_TYPE": null,
      "claim_id": "508434e5"
    },
    {
      "OBS_VALUE": "24.5",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Mortality rate, infant (per 1,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SP_DYN_IMRT_IN",
      "REF_AREA": "BGD",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2021",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P3BR_L",
      "UNIT_TYPE": null,
      "claim_id": "1ac1ad2d"
    },
    {
      "OBS_VALUE": "24.9",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Mortality rate, infant (per 1,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SP_DYN_IMRT_IN",
      "REF_AREA": "BGD",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2020",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P3BR_L",
      "UNIT_TYPE": null,
      "claim_id": "134a40d4"
    },
    {
      "OBS_VALUE": "25.4",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "Mortality rate, infant (per 1,000 live births)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_SP_DYN_IMRT_IN",
      "REF_AREA": "BGD",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2019",
      "FREQ": "A",
      "UNIT_MEASURE": "DT_10P3BR_L",
      "UNIT_TYPE": null,
      "claim_id": "37ecba04"
    }
  ],
  "metadata": {
    "idno": "WB_WDI_SP_DYN_IMRT_IN",
    "name": "Mortality rate, infant (per 1,000 live births)",
    "database_id": "WB_WDI",
    "measurement_unit": "Per 1000 live births",
    "periodicity": "Annual",
    "definition_short": null
  },
  "error": null,
  "failed_validation": null
}
```


---
🧠 **Planner Reasoning** (for evaluation context)

**Intent:** Provide a concise, report-ready summary of the latest national under‑5 and infant mortality rates in Bangladesh, disaggregated by sex, using World Bank (WDI) data.

**Selection Logic:**  
- Used World Development Indicators (WDI) because they are the standard World Bank source and align with what most reports cite.  
- Selected:
  - Under‑5 mortality, male: `WB_WDI_SH_DYN_MORT_MA`  
  - Under‑5 mortality, female: `WB_WDI_SH_DYN_MORT_FE`  
  - Under‑5 mortality, total: `WB_WDI_SH_DYN_MORT`  
  - Infant mortality, male: `WB_WDI_SP_DYN_IMRT_MA_IN`  
  - Infant mortality, female: `WB_WDI_SP_DYN_IMRT_FE_IN`  
  - Infant mortality, total: `WB_WDI_SP_DYN_IMRT_IN`  
- Pulled data for 2019–2023 and used **2023** as the “most recent” year (latest available in WDI for Bangladesh).

**Data Gaps:**  
- No gaps for 2019–2023; all six indicators have annual values for Bangladesh through 2023.  
- No subnational (Sylhet) data in WDI; only national-level.

**CLARIFYING QUESTION:** None.
