# STUDENT — Conversation & Evaluation

**Timestamp:** 20260302_222822
**Persona:** Maria is a 24-year-old economics master's student at the University of Nairobi. She is writing her t...
**Turns:** 8

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
| Visualization & API URLs [Conversational GEval] | 0.99 | 0.5 | ✅ PASS |

**Pass Rate:** 11/11 (100%)

## Insights

### Strengths

- **Perfect/near-perfect scores (≥0.95):** **Claim Tagging & PCN [Conversational GEval]**, **Content Structure [Conversational GEval]**, **Context Retention [Conversational GEval]**, **Conversation Completeness**, **Data Accuracy [Conversational GEval]**, **Data Formatting [Conversational GEval]**, **Follow-up Suggestions [Conversational GEval]**, **Latest Data Note [Conversational GEval]**, **Source Citation [Conversational GEval]**, **Turn Faithfulness**, **Visualization & API URLs [Conversational GEval]**

### No Failures 🎉

All metrics passed their thresholds.

---

## Conversation

### 👤 User (Turn 1)

Hi, I'm working on my thesis about economic growth in East Africa and need to start by finding Kenya's GDP data. Could you help me with that?

### 🤖 Assistant

**Intent:** You want Kenya’s GDP data as a starting point for a thesis on economic growth in East Africa.

**Selection Logic:**  
- I used the World Bank’s main macro database, **World Development Indicators (WB_WDI)**.  
- Indicator: **GDP (current US$)** — ID `WB_WDI_NY_GDP_MKTP_CD`.  
- Country: **Kenya (KEN)**.  
- Pulled data for **2019–2024** to give you recent levels and a short time series.

**Data Gaps:**  
- No gaps for Kenya between 2019–2024 in this indicator.  
- 2024 is flagged as the latest available year (may be provisional).

**Direct API Access (for your thesis work):**  
Data360 API URL for Kenya, GDP (current US$), 2019–2024:  
`https://data360api.worldbank.org/data360/data?DATABASE_ID=WB_WDI&INDICATOR=WB_WDI_NY_GDP_MKTP_CD&REF_AREA=KEN&timePeriodFrom=2019&timePeriodTo=2024&top=1000`

You can also download the full global series (1960–2024) as CSV from the metadata:  
`https://data360files.worldbank.org/data360-data/data/WB_WDI/WB_WDI_NY_GDP_MKTP_CD.csv`

**Key recent values for Kenya – GDP (current US$):**

| Year | GDP (current US$) |
|------|-------------------|
| 2024 | <span title="verified claim">✅ 120,339,557,905.93</span> |
| 2023 | <span title="verified claim">✅ 107,500,884,685.01</span> |
| 2022 | <span title="verified claim">✅ 114,448,978,152.64</span> |
| 2021 | <span title="verified claim">✅ 109,703,658,904.99</span> |
| 2020 | <span title="verified claim">✅ 100,657,505,750.55</span> |
| 2019 | <span title="verified claim">✅ 100,378,436,207.37</span> |

(All in current US$, nominal terms.)

**Analysis (very brief):**  
- Kenya’s nominal GDP rose from about <span title="verified claim">✅ 100.4 billion</span> US$ in 2019 to about <span title="verified claim">✅ 120.3 billion</span> US$ in 2024.  
- There is a dip in 2020 consistent with COVID-19 effects, followed by recovery and expansion.

**Methodological note (for your thesis write‑up):**  
- Indicator definition: GDP at purchaser’s prices, sum of gross value added by all resident producers plus product taxes minus subsidies, **in current US$** (no inflation adjustment).  
- Source: National accounts compiled according to **System of National Accounts 2008/1993**, harmonized by the World Bank.

**Sources:**  
- **World Bank — World Development Indicators (WB_WDI)** — *GDP (current US$)* (indicator `NY.GDP.MKTP.CD`, Data360 ID `WB_WDI_NY_GDP_MKTP_CD`) — national accounts, SNA 2008/1993, gap‑filled total.

**Clarifying question:**  
Do you also need **real GDP / GDP per capita** for Kenya (and for other East African countries like Uganda, Tanzania, Rwanda, Ethiopia) to analyze growth rates and convergence, or is nominal GDP enough for now?

**Suggested follow-ups:**  
1. Could you give me Kenya’s **real GDP and GDP per capita** series so I can compute growth rates?  
2. Can you provide **comparable GDP data for other East African countries** to set up a panel for my thesis?  
3. How can I **download and clean** these GDP series in R or Python for econometric analysis?

---
<details>
<summary>📋 <b>Tool Calls</b> (click to expand)</summary>

**1. data360_search_indicators**
```json
{
  "query": "GDP (current US$)",
  "required_country": "KEN",
  "limit": 10
}
```
**Result:**
```json
{
  "count": 10,
  "total_count": 1716,
  "offset": 0,
  "has_more": true,
  "next_offset": 10,
  "indicators": [
    {
      "idno": "WB_WDI_NY_GDP_MKTP_CD",
      "database_id": "WB_WDI",
      "name": "GDP (current US$)",
      "truncated_definition": "Gross domestic product is the total income earned through the production of goods and services in an",
      "periodicity": "Annual",
      "latest_data": "2024",
      "time_period_range": "1960-2024",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_NY_GDP_PCAP_CD",
      "database_id": "WB_WDI",
      "name": "GDP per capita (current US$)",
      "truncated_definition": "Gross domestic product is the total income earned through the production of goods and services in an",
      "periodicity": "Annual",
      "latest_data": "2024",
      "time_period_range": "1960-2024",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_GS_NY_GDP_PCAP_CD",
      "database_id": "WB_GS",
      "name": "GDP per capita (current US$)",
      "truncated_definition": "GDP per capita is gross domestic product divided by midyear population. GDP is the sum of gross valu",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_GS_NY_GDP_MKTP_CD",
      "database_id": "WB_GS",
      "name": "GDP (current US$)",
      "truncated_definition": "GDP at purchaser's prices is the sum of gross value added by all resident producers in the economy p",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_HNP_SH_XPD_CHEX_PC_CD",
      "database_id": "WB_HNP",
      "name": "Current health expenditure per capita (current US$)",
      "truncated_definition": "Current expenditures on health per capita in current US dollars. Estimates of current health expendi",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_GS_NY_GDP_PCAP_KD",
      "database_id": "WB_GS",
      "name": "GDP per capita (constant 2010 US$)",
      "truncated_definition": "GDP per capita is gross domestic product divided by midyear population. GDP is the sum of gross valu",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_HCP_HEALTH_EXP",
      "database_id": "WB_HCP",
      "name": "Current health expenditure (% of GDP)",
      "truncated_definition": "Percentage of current expenditure in public health, calculated as a share of GDP.\nName in source: Cu",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "2000-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_HNP_SH_XPD_CHEX_GD_ZS",
      "database_id": "WB_HNP",
      "name": "Current health expenditure (% of GDP)",
      "truncated_definition": "Level of current health expenditure expressed as a percentage of GDP.  Estimates of current health e",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_HNP_SH_XPD_EHEX_PC_CD",
      "database_id": "WB_HNP",
      "name": "External health expenditure per capita (current US$)",
      "truncated_definition": "Current external expenditures on health per capita expressed in current US dollars. External sources",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_CLEAR_NY_GDP_MKTP_CD",
      "database_id": "WB_CLEAR",
      "name": "GDP (current US$)",
      "truncated_definition": "GDP at purchaser's prices is the sum of gross value added by all resident producers in the economy p",
      "periodicity": "Annual",
      "latest_data": "2022",
      "time_period_range": "1960-2022",
      "covers_country": true,
      "dimensions": null
    }
  ],
  "required_country": "KEN",
  "error": null
}
```

**2. data360_get_data**
```json
{
  "database_id": "WB_WDI",
  "indicator_id": "WB_WDI_NY_GDP_MKTP_CD",
  "disaggregation_filters": {
    "REF_AREA": "KEN"
  },
  "start_year": 2019,
  "end_year": 2024,
  "limit": 100
}
```
**Result:**
```json
{
  "count": 6,
  "total_count": null,
  "offset": 0,
  "has_more": false,
  "next_offset": null,
  "data": [
    {
      "OBS_VALUE": "120339557905.93175",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "GDP (current US$)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": true,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_NY_GDP_MKTP_CD",
      "REF_AREA": "KEN",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2024",
      "FREQ": "A",
      "UNIT_MEASURE": "USD",
      "UNIT_TYPE": null,
      "claim_id": "d208b1ea"
    },
    {
      "OBS_VALUE": "107500884685.01266",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "GDP (current US$)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_NY_GDP_MKTP_CD",
      "REF_AREA": "KEN",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2023",
      "FREQ": "A",
      "UNIT_MEASURE": "USD",
      "UNIT_TYPE": null,
      "claim_id": "b1f65494"
    },
    {
      "OBS_VALUE": "114448978152.6374",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "GDP (current US$)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_NY_GDP_MKTP_CD",
      "REF_AREA": "KEN",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2022",
      "FREQ": "A",
      "UNIT_MEASURE": "USD",
      "UNIT_TYPE": null,
      "claim_id": "8bd985c3"
    },
    {
      "OBS_VALUE": "109703658904.99373",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "GDP (current US$)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_NY_GDP_MKTP_CD",
      "REF_AREA": "KEN",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2021",
      "FREQ": "A",
      "UNIT_MEASURE": "USD",
      "UNIT_TYPE": null,
      "claim_id": "7b5b079c"
    },
    {
      "OBS_VALUE": "100657505750.545",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "GDP (current US$)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_NY_GDP_MKTP_CD",
      "REF_AREA": "KEN",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2020",
      "FREQ": "A",
      "UNIT_MEASURE": "USD",
      "UNIT_TYPE": null,
      "claim_id": "1913f17c"
    },
    {
      "OBS_VALUE": "100378436207.37134",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "GDP (current US$)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_NY_GDP_MKTP_CD",
      "REF_AREA": "KEN",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2019",
      "FREQ": "A",
      "UNIT_MEASURE": "USD",
      "UNIT_TYPE": null,
      "claim_id": "ea90df2e"
    }
  ],
  "metadata": {
    "idno": "WB_WDI_NY_GDP_MKTP_CD",
    "name": "GDP (current US$)",
    "database_id": "WB_WDI",
    "measurement_unit": "current US$",
    "periodicity": "Annual",
    "definition_short": null
  },
  "error": null,
  "failed_validation": null
}
```

**3. data360_get_metadata**
```json
{
  "database_id": "WB_WDI",
  "indicator_id": "WB_WDI_NY_GDP_MKTP_CD"
}
```
**Result:**
```json
{
  "indicator_metadata": {
    "idno": "WB_WDI_NY_GDP_MKTP_CD",
    "doi": null,
    "name": "GDP (current US$)",
    "display_name": null,
    "database_id": "WB_WDI",
    "database_name": "World Development Indicators (WDI)",
    "date_last_update": null,
    "date_released": null,
    "measurement_unit": "current US$",
    "release_calendar": null,
    "periodicity": "Annual",
    "base_period": null,
    "definition_short": null,
    "definition_long": "Gross domestic product is the total income earned through the production of goods and services in an economic territory during an accounting period. It can be measured in three different ways: using either the expenditure approach, the income approach, or the production approach. This indicator is expressed in current prices, meaning no adjustment has been made to account for price changes over time. This indicator is expressed in United States dollars.",
    "statistical_concept": "The conceptual elements of the SNA (System of National Accounts) measure what takes place in the economy, between which agents, and for what purpose. At the heart of the SNA is the production of goods and services. These may be used for consumption in the period to which the accounts relate or may be accumulated for use in a later period. In simple terms, the amount of value added generated by production represents GDP. The income corresponding to GDP is distributed to the various agents or groups of agents as income and it is the process of distributing and redistributing income that allows one agent to consume the goods and services produced by another agent or to acquire goods and services for later consumption. The way in which the SNA captures this pattern of economic flows is to identify the activities concerned by recognizing the institutional units in the economy and by specifying the structure of accounts capturing the transactions relevant to one stage or another of the process by which goods and services are produced and ultimately consumed.",
    "methodology": "National accounts are compiled in accordance with international standards: System of National Accounts, 2008 or 1993 versions. Specific information on how countries compile their national accounts can be found on the IMF website: https://dsbb.imf.org/",
    "derivation": null,
    "imputation": null,
    "missing": null,
    "quality_checks": null,
    "quality_note": null,
    "sources_discrepancies": null,
    "series_break": null,
    "limitation": "Gross domestic product (GDP), though widely tracked, may not always be the most relevant summary of aggregated economic performance for all economies, especially when production occurs at the expense of consuming capital stock.\r\r\n\r\r\nWhile GDP estimates based on the production approach are generally more reliable than estimates compiled from the income or expenditure side, different countries use different definitions, methods, and reporting standards. World Bank staff review the quality of national accounts data and sometimes make adjustments to improve consistency with international guidelines. Nevertheless, significant discrepancies remain between international standards and actual practice. Many statistical offices, especially those in developing countries, face severe limitations in the resources, time, training, and budgets required to produce reliable and comprehensive series of national accounts statistics.\r\r\n\r\r\nAmong the difficulties faced by compilers of national accounts is the extent of unreported economic activity in the informal or secondary economy. In developing countries a large share of agricultural output is either not exchanged (because it is consumed within the household) or not exchanged for money.",
    "relevance": "This indicator is related to the national accounts, which are critical for understanding and managing a country's economy. They provide a framework for the analysis of economic performance. National accounts are the basis for estimating the Gross Domestic Product (GDP) and Gross National Income (GNI), which are the most widely used indicator of economic performance. They are essential for government policymakers, providing the data needed to design and assess fiscal and monetary policies; and are also used by businesses and investors to assess the economic climate and make investment decisions. NAS enable comparison between economies, which is crucial for international trade, investment decisions, and economic competitiveness. More specifically, this indicator is related to national accounts aggregates. Gross Domestic Product (GDP), Gross National Income (GNI), and other aggregates provide a snapshot of the size and health of an economy by measuring the total economic activity within a country. They can thus be used by policymakers to design and implement economic policies, as they reflect the overall economic performance and can indicate the need for intervention in certain areas. Aggregates also allow for comparisons between different economies, which can be useful for trade negotiations, investment decisions, and economic benchmarking. By examining aggregates over time, economists and analysts can identify trends, cycles, and potential areas of concern within an economy, and investors can use national accounts aggregates to assess the potential risks and returns of investing in a particular country. Overall, national accounts aggregates are fundamental tools for economic analysis, policy formulation, and decision-making at both the national and international levels.",
    "aggregation_method": "Gap-filled total",
    "disaggregation": null,
    "confidentiality": null,
    "confidentiality_status": "PU",
    "confidentiality_note": null,
    "citation_requirement": null,
    "sources_note": null,
    "acknowledgement_statement": null,
    "disclaimer": null,
    "economies_count": null,
    "csv_link": "https://data360files.worldbank.org/data360-data/data/WB_WDI/WB_WDI_NY_GDP_MKTP_CD.csv",
    "excel_link": null,
    "json_link": "https://data360files.worldbank.org/data360-data/metadata/WB_WDI/WB_WDI_NY_GDP_MKTP_CD.json",
    "api_link": "https://data360api.worldbank.org/data360/data?top=1000&skip=0&DATABASE_ID=WB_WDI&INDICATOR=WB_WDI_NY_GDP_MKTP_CD",
    "indicator_count": null,
    "apiservice_link": null,
    "api_explorer_link": "http://datacatalog.worldbank.org/data360/api/execute?tab=Data&id=1&DATABASE_ID=WB_WDI&INDICATOR=WB_WDI_NY_GDP_MKTP_CD",
    "authoring_entity": [
      {
        "name": "World Bank National Accounts Team",
        "affiliation": null,
        "abbreviation": null,
        "email": null,
        "uri": null
      }
    ],
    "version_statement": {
      "version": null,
      "version_date": "2025-03-03",
      "version_resp": null,
      "version_notes": null
    },
    "aliases": [
      {
        "alias": "NY.GDP.MKTP.CD"
      }
    ],
    "alternate_identifiers": [],
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
        "source": "Inter-secretariat Working Group on National Accounts (ISWGNA) Glossary",
        "uri": "https://unstats.un.org/unsd/nationalaccount/SNAUpdate/2025/glossary.pdf",
        "note": null
      }
    ],
    "statistical_concept_references": [],
    "methodology_references": [
      {
        "source": "SNA2008",
        "uri": "https://unstats.un.org/unsd/nationalaccount/docs/sna2008.pdf",
        "note": null
      }
    ],
    "derivation_references": [],
    "imputation_references": [],
    "topics": [
      {
        "id": "P3",
        "name": "Prosperity",
        "parent_id": null,
        "vocabulary": "WB Practice Groups",
        "uri": null
      },
      {
        "id": "P3_000007",
        "name": "Growth and Jobs",
        "parent_id": "P3",
        "vocabulary": "Data360 Topic L1",
        "uri": null
      },
      {
        "id": "P3_000032",
        "name": "Growth",
        "parent_id": "P3_000007",
        "vocabulary": "Data360 Topic L2",
        "uri": null
      }
    ],
    "time_periods": [
      {
        "start": "1960",
        "end": "2024",
        "notes": null
      }
    ],
    "ref_country": [
      {
        "name": "Aruba",
        "code": "ABW"
      },
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
        "name": "Andorra",
        "code": "AND"
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
        "name": "American Samoa",
        "code": "ASM"
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
        "name": "Austria",
        "code": "AUT"
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
        "name": "Bahrain",
        "code": "BHR"
      },
      {
        "name": "Bahamas, The",
        "code": "BHS"
      },
      {
        "name": "Bosnia and Herzegovina",
        "code": "BIH"
      },
      {
        "name": "Belize",
        "code": "BLZ"
      },
      {
        "name": "Belarus",
        "code": "BLR"
      },
      {
        "name": "Bermuda",
        "code": "BMU"
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
        "name": "Brazil",
        "code": "BRA"
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
        "name": "Channel Islands",
        "code": "CHI"
      },
      {
        "name": "C\u00f4te d\u2019Ivoire",
        "code": "CIV"
      },
      {
        "name": "China",
        "code": "CHN"
      },
      {
        "name": "Congo, Rep.",
        "code": "COG"
      },
      {
        "name": "Cameroon",
        "code": "CMR"
      },
      {
        "name": "Congo, Dem. Rep.",
        "code": "COD"
      },
      {
        "name": "Costa Rica",
        "code": "CRI"
      },
      {
        "name": "Colombia",
        "code": "COL"
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
        "name": "Cuba",
        "code": "CUB"
      },
      {
        "name": "Cura\u00e7ao",
        "code": "CUW"
      },
      {
        "name": "Cyprus",
        "code": "CYP"
      },
      {
        "name": "Germany",
        "code": "DEU"
      },
      {
        "name": "Czechia",
        "code": "CZE"
      },
      {
        "name": "Algeria",
        "code": "DZA"
      },
      {
        "name": "Djibouti",
        "code": "DJI"
      },
      {
        "name": "Dominica",
        "code": "DMA"
      },
      {
        "name": "Denmark",
        "code": "DNK"
      },
      {
        "name": "Dominican Republic",
        "code": "DOM"
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
        "name": "Cayman Islands",
        "code": "CYM"
      },
      {
        "name": "Ethiopia",
        "code": "ETH"
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
        "name": "Finland",
        "code": "FIN"
      },
      {
        "name": "Fiji",
        "code": "FJI"
      },
      {
        "name": "France",
        "code": "FRA"
      },
      {
        "name": "Faroe Islands",
        "code": "FRO"
      },
      {
        "name": "United Kingdom",
        "code": "GBR"
      },
      {
        "name": "Gabon",
        "code": "GAB"
      },
      {
        "name": "Micronesia, Fed. Sts.",
        "code": "FSM"
      },
      {
        "name": "Guinea",
        "code": "GIN"
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
        "name": "Greenland",
        "code": "GRL"
      },
      {
        "name": "Grenada",
        "code": "GRD"
      },
      {
        "name": "Equatorial Guinea",
        "code": "GNQ"
      },
      {
        "name": "Guinea-Bissau",
        "code": "GNB"
      },
      {
        "name": "Eritrea",
        "code": "ERI"
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
        "name": "Guam",
        "code": "GUM"
      },
      {
        "name": "Guyana",
        "code": "GUY"
      },
      {
        "name": "Haiti",
        "code": "HTI"
      },
      {
        "name": "Hong Kong SAR, China",
        "code": "HKG"
      },
      {
        "name": "Honduras",
        "code": "HND"
      },
      {
        "name": "Croatia",
        "code": "HRV"
      },
      {
        "name": "Hungary",
        "code": "HUN"
      },
      {
        "name": "Indonesia",
        "code": "IDN"
      },
      {
        "name": "Iran, Islamic Rep.",
        "code": "IRN"
      },
      {
        "name": "Isle of Man",
        "code": "IMN"
      },
      {
        "name": "Ireland",
        "code": "IRL"
      },
      {
        "name": "Israel",
        "code": "ISR"
      },
      {
        "name": "India",
        "code": "IND"
      },
      {
        "name": "Italy",
        "code": "ITA"
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
        "name": "Jamaica",
        "code": "JAM"
      },
      {
        "name": "Jordan",
        "code": "JOR"
      },
      {
        "name": "Kazakhstan",
        "code": "KAZ"
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
        "name": "Korea, Rep.",
        "code": "KOR"
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
        "name": "Lao PDR",
        "code": "LAO"
      },
      {
        "name": "Libya",
        "code": "LBY"
      },
      {
        "name": "Sri Lanka",
        "code": "LKA"
      },
      {
        "name": "Liechtenstein",
        "code": "LIE"
      },
      {
        "name": "St. Lucia",
        "code": "LCA"
      },
      {
        "name": "Latvia",
        "code": "LVA"
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
        "name": "Lesotho",
        "code": "LSO"
      },
      {
        "name": "Morocco",
        "code": "MAR"
      },
      {
        "name": "St. Martin (French part)",
        "code": "MAF"
      },
      {
        "name": "Moldova",
        "code": "MDA"
      },
      {
        "name": "Monaco",
        "code": "MCO"
      },
      {
        "name": "Marshall Islands",
        "code": "MHL"
      },
      {
        "name": "Madagascar",
        "code": "MDG"
      },
      {
        "name": "Maldives",
        "code": "MDV"
      },
      {
        "name": "Kenya",
        "code": "KEN"
      },
      {
        "name": "North Macedonia",
        "code": "MKD"
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
        "name": "Myanmar",
        "code": "MMR"
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
        "name": "Mauritania",
        "code": "MRT"
      },
      {
        "name": "Montenegro",
        "code": "MNE"
      },
      {
        "name": "Mongolia",
        "code": "MNG"
      },
      {
        "name": "Northern Mariana Islands",
        "code": "MNP"
      },
      {
        "name": "Malawi",
        "code": "MWI"
      },
      {
        "name": "Malaysia",
        "code": "MYS"
      },
      {
        "name": "Namibia",
        "code": "NAM"
      },
      {
        "name": "New Caledonia",
        "code": "NCL"
      },
      {
        "name": "Nigeria",
        "code": "NGA"
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
        "name": "Niger",
        "code": "NER"
      },
      {
        "name": "Nicaragua",
        "code": "NIC"
      },
      {
        "name": "Oman",
        "code": "OMN"
      },
      {
        "name": "Nauru",
        "code": "NRU"
      },
      {
        "name": "Peru",
        "code": "PER"
      },
      {
        "name": "Nepal",
        "code": "NPL"
      },
      {
        "name": "Netherlands",
        "code": "NLD"
      },
      {
        "name": "Macao SAR, China",
        "code": "MAC"
      },
      {
        "name": "Panama",
        "code": "PAN"
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
        "name": "Philippines",
        "code": "PHL"
      },
      {
        "name": "Papua New Guinea",
        "code": "PNG"
      },
      {
        "name": "Paraguay",
        "code": "PRY"
      },
      {
        "name": "Palau",
        "code": "PLW"
      },
      {
        "name": "Portugal",
        "code": "PRT"
      },
      {
        "name": "Romania",
        "code": "ROU"
      },
      {
        "name": "Saudi Arabia",
        "code": "SAU"
      },
      {
        "name": "French Polynesia",
        "code": "PYF"
      },
      {
        "name": "Qatar",
        "code": "QAT"
      },
      {
        "name": "Russian Federation",
        "code": "RUS"
      },
      {
        "name": "West Bank and Gaza",
        "code": "PSE"
      },
      {
        "name": "Senegal",
        "code": "SEN"
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
        "name": "Mauritius",
        "code": "MUS"
      },
      {
        "name": "Singapore",
        "code": "SGP"
      },
      {
        "name": "San Marino",
        "code": "SMR"
      },
      {
        "name": "Solomon Islands",
        "code": "SLB"
      },
      {
        "name": "Sierra Leone",
        "code": "SLE"
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
        "name": "El Salvador",
        "code": "SLV"
      },
      {
        "name": "Suriname",
        "code": "SUR"
      },
      {
        "name": "S\u00e3o Tom\u00e9 and Pr\u00edncipe",
        "code": "STP"
      },
      {
        "name": "Slovenia",
        "code": "SVN"
      },
      {
        "name": "Slovak Republic",
        "code": "SVK"
      },
      {
        "name": "Sint Maarten (Dutch part)",
        "code": "SXM"
      },
      {
        "name": "Seychelles",
        "code": "SYC"
      },
      {
        "name": "Syrian Arab Republic",
        "code": "SYR"
      },
      {
        "name": "Eswatini",
        "code": "SWZ"
      },
      {
        "name": "Turks and Caicos Islands",
        "code": "TCA"
      },
      {
        "name": "Chad",
        "code": "TCD"
      },
      {
        "name": "Pakistan",
        "code": "PAK"
      },
      {
        "name": "Sweden",
        "code": "SWE"
      },
      {
        "name": "Togo",
        "code": "TGO"
      },
      {
        "name": "Thailand",
        "code": "THA"
      },
      {
        "name": "Turkmenistan",
        "code": "TKM"
      },
      {
        "name": "Tonga",
        "code": "TON"
      },
      {
        "name": "Tunisia",
        "code": "TUN"
      },
      {
        "name": "Timor-Leste",
        "code": "TLS"
      },
      {
        "name": "Trinidad and Tobago",
        "code": "TTO"
      },
      {
        "name": "Tanzania",
        "code": "TZA"
      },
      {
        "name": "T\u00fcrkiye",
        "code": "TUR"
      },
      {
        "name": "Uganda",
        "code": "UGA"
      },
      {
        "name": "Tuvalu",
        "code": "TUV"
      },
      {
        "name": "Ukraine",
        "code": "UKR"
      },
      {
        "name": "Uruguay",
        "code": "URY"
      },
      {
        "name": "Uzbekistan",
        "code": "UZB"
      },
      {
        "name": "Virgin Islands (U.S.)",
        "code": "VIR"
      },
      {
        "name": "Venezuela, RB",
        "code": "VEN"
      },
      {
        "name": "St. Vincent and the Grenadines",
        "code": "VCT"
      },
      {
        "name": "United States",
        "code": "USA"
      },
      {
        "name": "Vanuatu",
        "code": "VUT"
      },
      {
        "name": "South Africa",
        "code": "ZAF"
      },
      {
        "name": "Zimbabwe",
        "code": "ZWE"
      },
      {
        "name": "Yemen, Rep.",
        "code": "YEM"
      },
      {
        "name": "Federal Republic of Somalia",
        "code": "SOM"
      },
      {
        "name": "Kosovo",
        "code": "XKX"
      },
      {
        "name": "Vietnam",
        "code": "VNM"
      },
      {
        "name": "Zambia",
        "code": "ZMB"
      },
      {
        "name": "Samoa",
        "code": "WSM"
      },
      {
        "name": "Tajikistan",
        "code": "TJK"
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
        "name": "East Asia & Pacific (excluding high income)",
        "code": "EAP",
        "type": null
      },
      {
        "name": "Early-demographic dividend",
        "code": "EAR",
        "type": null
      },
      {
        "name": "Europe & Central Asia (excluding high income)",
        "code": "ECA",
        "type": null
      },
      {
        "name": "East Asia & Pacific",
        "code": "EAS",
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
        "name": "Fragile and conflict affected situations",
        "code": "FCS",
        "type": null
      },
      {
        "name": "European Union",
        "code": "EUU",
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
        "name": "IBRD only",
        "code": "IBD",
        "type": null
      },
      {
        "name": "IDA & IBRD total",
        "code": "IBT",
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
        "name": "Latin America & Caribbean",
        "code": "LCN",
        "type": null
      },
      {
        "name": "Least developed countries: UN classification",
        "code": "LDC",
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
        "name": "Middle East, North Africa, Afghanistan & Pakistan (excluding high income)",
        "code": "MNA",
        "type": null
      },
      {
        "name": "North America",
        "code": "NAC",
        "type": null
      },
      {
        "name": "Lower middle income",
        "code": "LMC",
        "type": null
      },
      {
        "name": "Other small states",
        "code": "OSS",
        "type": null
      },
      {
        "name": "OECD members",
        "code": "OED",
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
        "name": "Europe & Central Asia (IDA & IBRD)",
        "code": "TEC",
        "type": null
      },
      {
        "name": "Middle East, North Africa, Afghanistan & Pakistan (IDA & IBRD)",
        "code": "TMN",
        "type": null
      },
      {
        "name": "Sub-Saharan Africa (IDA & IBRD)",
        "code": "TSS",
        "type": null
      },
      {
        "name": "World",
        "code": "WLD",
        "type": null
      },
      {
        "name": "South Asia (IDA & IBRD)",
        "code": "TSA",
        "type": null
      },
      {
        "name": "Upper middle income",
        "code": "UMC",
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
        "uri": "https://api.worldbank.org/v2/countries/all/indicators/ny.gdp.mktp.cd?date=1960:2022&format=json",
        "image_uri": null
      },
      {
        "type": "WDI API",
        "description": "Data in XML",
        "uri": "https://api.worldbank.org/v2/countries/all/indicators/ny.gdp.mktp.cd?date=1960:2022",
        "image_uri": null
      },
      {
        "type": "WDI API",
        "description": "Metadata in JSON",
        "uri": "https://api.worldbank.org/v2/sources/2/series/ny.gdp.mktp.cd/metadata?format=json",
        "image_uri": null
      },
      {
        "type": "WDI API",
        "description": "Metadata in XML",
        "uri": "https://api.worldbank.org/v2/sources/2/series/ny.gdp.mktp.cd/metadata",
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
        "name": "Country official statistics",
        "organization": "National Statistical Organizations and/or Central Banks",
        "publisher": null,
        "publication_date": null,
        "uri": null,
        "access_date": null,
        "note": null,
        "other_identifiers": [],
        "authors": [],
        "datasets": []
      },
      {
        "idno": null,
        "type": null,
        "name": "National Accounts data files",
        "organization": "Organisation for Economic Co-operation and Development (OECD)",
        "publisher": null,
        "publication_date": null,
        "uri": null,
        "access_date": null,
        "note": null,
        "other_identifiers": [],
        "authors": [],
        "datasets": []
      },
      {
        "idno": null,
        "type": null,
        "name": "Staff estimates",
        "organization": "World Bank (WB)",
        "publisher": null,
        "publication_date": null,
        "uri": null,
        "access_date": null,
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
        "SSA",
        "VUT",
        "TMN",
        "MEA",
        "SWE",
        "GAB",
        "HTI",
        "PSE",
        "BEL",
        "GUY",
        "CHE",
        "TKM",
        "MLT",
        "COL",
        "SST",
        "TUR",
        "LTU",
        "UZB",
        "JOR",
        "LIC",
        "ABW",
        "FIN",
        "BWA",
        "JAM",
        "VIR",
        "IRL",
        "MNP",
        "TON",
        "EAR",
        "TCD",
        "WLD",
        "LAO",
        "BOL",
        "CHL",
        "MAR",
        "EUU",
        "CHN",
        "HPC",
        "TLS",
        "NPL",
        "JPN",
        "MNG",
        "LBN",
        "AFW",
        "IBT",
        "IDB",
        "SSD",
        "GIN",
        "SYR",
        "ASM",
        "GTM",
        "NCL",
        "USA",
        "GHA",
        "ITA",
        "NAC",
        "BRA",
        "COD",
        "MEX",
        "ARM",
        "BIH",
        "SLV",
        "CEB",
        "GNB",
        "QAT",
        "FCS",
        "ECU",
        "MDV",
        "ECS",
        "TSA",
        "SLE",
        "CRI",
        "ARB",
        "CHI",
        "UGA",
        "AUS",
        "AFG",
        "DEU",
        "BGD",
        "HUN",
        "ATG",
        "SWZ",
        "GBR",
        "MOZ",
        "TEA",
        "IDA",
        "DJI",
        "MNA",
        "LDC",
        "SAS",
        "BTN",
        "COM",
        "LVA",
        "MCO",
        "SXM",
        "PER",
        "MDA",
        "MUS",
        "NIC",
        "MKD",
        "SYC",
        "MLI",
        "PST",
        "GMB",
        "HIC",
        "RWA",
        "SOM",
        "GRL",
        "IMN",
        "ISR",
        "MNE",
        "COG",
        "CIV",
        "PSS",
        "NRU",
        "EMU",
        "LSO",
        "LUX",
        "SUR",
        "TLA",
        "BMU",
        "KOR",
        "BEN",
        "NZL",
        "SVK",
        "GUM",
        "OSS",
        "CZE",
        "LCN",
        "TUN",
        "SLB",
        "EAS",
        "KWT",
        "EGY",
        "PNG",
        "FRO",
        "OMN",
        "TUV",
        "IRN",
        "BRB",
        "NLD",
        "TZA",
        "MHL",
        "RUS",
        "SGP",
        "VNM",
        "YEM",
        "FSM",
        "XKX",
        "HRV",
        "AFE",
        "PRE",
        "MAC",
        "NAM",
        "ERI",
        "TEC",
        "SSF",
        "TGO",
        "AGO",
        "BDI",
        "IND",
        "NER",
        "EAP",
        "PRY",
        "STP",
        "DNK",
        "SVN",
        "ZAF",
        "LBR",
        "BLZ",
        "CMR",
        "ETH",
        "CUB",
        "PAK",
        "EST",
        "CAN",
        "THA",
        "CPV",
        "NOR",
        "KIR",
        "BFA",
        "KAZ",
        "PYF",
        "LKA",
        "IBD",
        "DMA",
        "HND",
        "LCA",
        "TJK",
        "WSM",
        "CUW",
        "DZA",
        "KEN",
        "KNA",
        "HKG",
        "AND",
        "KHM",
        "SRB",
        "MWI",
        "UKR",
        "FJI",
        "PRI",
        "MMR",
        "PLW",
        "ESP",
        "LIE",
        "AZE",
        "SEN",
        "ECA",
        "AUT",
        "ZMB",
        "CYP",
        "NGA",
        "KGZ",
        "LMC",
        "GRC",
        "ARG",
        "VCT",
        "SDN",
        "POL",
        "SMR",
        "CSS",
        "MIC",
        "URY",
        "MRT",
        "IDX",
        "ISL",
        "BHR",
        "PAN",
        "PRT",
        "IDN",
        "MDG",
        "MYS",
        "BGR",
        "ROU",
        "GNQ",
        "BRN",
        "PHL",
        "LAC",
        "OED",
        "BHS",
        "GRD",
        "TSS",
        "BLR",
        "SAU",
        "ARE",
        "TTO",
        "CYM",
        "LMY",
        "CAF",
        "VEN",
        "ZWE",
        "ALB",
        "GEO",
        "MAF",
        "FRA",
        "UMC",
        "LBY",
        "TCA",
        "DOM",
        "LTE",
        "IRQ"
      ]
    },
    {
      "field_name": "INDICATOR",
      "label_name": "Statistical indicator",
      "field_value": [
        "WB_WDI_NY_GDP_MKTP_CD"
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
        "USD"
      ]
    },
    {
      "field_name": "TIME_PERIOD",
      "label_name": "Time period",
      "field_value": [
        "2022",
        "1999",
        "2010",
        "1972",
        "1985",
        "1988",
        "1998",
        "2021",
        "1983",
        "2007",
        "2014",
        "2005",
        "2001",
        "1960",
        "1980",
        "1964",
        "2017",
        "2024",
        "1975",
        "1967",
        "1978",
        "1997",
        "2019",
        "2018",
        "1984",
        "1992",
        "2011",
        "1993",
        "1994",
        "1995",
        "2000",
        "1971",
        "1968",
        "1989",
        "1976",
        "1986",
        "1966",
        "1981",
        "2015",
        "2012",
        "2008",
        "1979",
        "2006",
        "1965",
        "1963",
        "2020",
        "2009",
        "1970",
        "2002",
        "1961",
        "1991",
        "2004",
        "2003",
        "1990",
        "1969",
        "2023",
        "1962",
        "2013",
        "1996",
        "1977",
        "1982",
        "1974",
        "1987",
        "2016",
        "1973"
      ]
    }
  ],
  "error": null
}
```

**4. data360_get_data_api_url**
```json
{
  "database_id": "WB_WDI",
  "indicator_id": "WB_WDI_NY_GDP_MKTP_CD",
  "country_code": "KEN",
  "start_year": 2019,
  "end_year": 2024
}
```
**Result:**
```json
{
  "type": "text",
  "text": "https://data360api.worldbank.org/data360/data?DATABASE_ID=WB_WDI&INDICATOR=WB_WDI_NY_GDP_MKTP_CD&REF_AREA=KEN&timePeriodFrom=2019&timePeriodTo=2024&top=1000",
  "annotations": null,
  "meta": null
}
```

</details>


### 👤 User (Turn 2)

Yes, please provide Kenya's real GDP and GDP per capita data so I can analyze growth rates more accurately.

### 🤖 Assistant

**Intent:** You want Kenya’s *real* GDP and *real* GDP per capita data to analyze growth rates more accurately.

**Selection Logic:**  
- For **real GDP growth**: IMF World Economic Outlook (WEO), indicator **“Gross domestic product, constant prices, Percent change”** (`IMF_WEO_NGDP_RPCH`).  
- For **real GDP per capita level**:  
  - World Bank **Gender Statistics (WB_GS)**, indicator **“GDP per capita (constant 2010 US$)”** (`WB_GS_NY_GDP_PCAP_KD`) – internationally comparable, in constant 2010 USD.  
  - IMF WEO **“Gross domestic product per capita, constant prices, National currency”** (`IMF_WEO_NGDPRPC`) – in constant Kenyan shillings, useful if you want to stay in domestic currency.

I focus on **2019–2024** so you can see pre‑COVID, COVID, and recovery.

**Data:**

1. **Kenya – Real GDP growth (constant prices, % change, IMF WEO)**

| Year | Real GDP growth (annual %, constant prices) |
|------|---------------------------------------------|
| 2024 | <span title="verified claim">✅ 4.974</span>% |
| 2023 | <span title="verified claim">✅ 5.507</span>% |
| 2022 | <span title="verified claim">✅ 4.847</span>% |
| 2021 | <span title="verified claim">✅ 7.59</span>% |
| 2020 | <span title="verified claim">✅ -0.273</span>% |
| 2019 | <span title="verified claim">✅ 5.114</span>% |

(2023–2024 are IMF projections/forecasts, flagged “F” in the data.)

2. **Kenya – Real GDP per capita (constant 2010 US$, World Bank)**

Indicator: **GDP per capita (constant 2010 US$)** (`WB_GS_NY_GDP_PCAP_KD`)

| Year | GDP per capita (constant 2010 US$) |
|------|------------------------------------|
| 2022 | <span title="verified claim">✅ 1,754.59</span> |
| 2021 | <span title="verified claim">✅ 1,705.74</span> |
| 2020 | <span title="verified claim">✅ 1,616.50</span> |
| 2019 | <span title="verified claim">✅ 1,653.83</span> |

(2022 is the latest available year in this series for Kenya.)

3. **Kenya – Real GDP per capita (constant prices, national currency, IMF WEO)**

Indicator: **GDP per capita, constant prices, national currency** (`IMF_WEO_NGDPRPC`), unit: constant Kenyan shillings (XDC_K).

| Year | GDP per capita (constant KES, units) |
|------|--------------------------------------|
| 2024 | <span title="verified claim">✅ 208,047.89</span> |
| 2023 | <span title="verified claim">✅ 201,669.81</span> |
| 2022 | <span title="verified claim">✅ 194,537.02</span> |
| 2021 | <span title="verified claim">✅ 188,875.72</span> |
| 2020 | <span title="verified claim">✅ 178,965.86</span> |
| 2019 | <span title="verified claim">✅ 183,969.45</span> |

(2023–2024 are IMF projections.)

---

**Analysis (concise):**

- **Real GDP growth:**  
  - Kenya’s economy **contracted slightly in 2020** by <span title="verified claim">✅ -0.273</span>% (COVID shock), then **rebounded strongly in 2021** with growth of <span title="verified claim">✅ 7.59</span>%.  
  - Growth then moderates but remains solid: around <span title="verified claim">✅ 4.847</span>% in 2022, projected at <span title="verified claim">✅ 5.507</span>% in 2023 and <span title="verified claim">✅ 4.974</span>% in 2024.

- **Real GDP per capita (constant 2010 US$):**  
  - Per‑capita output **dipped in 2020** from <span title="verified claim">✅ 1,653.83</span> to <span title="verified claim">✅ 1,616.50</span> constant 2010 US$, then **recovered and surpassed** its pre‑COVID level by 2022, reaching <span title="verified claim">✅ 1,754.59</span>.  
  - This suggests that, despite population growth, average real income per person has been on an upward trend over 2019–2022, with only a temporary COVID setback.

- **IMF vs World Bank:**  
  - IMF WEO gives you **growth rates and per‑capita levels in constant KES**, plus **forecasts up to 2029**.  
  - World Bank gives you **historical levels in constant 2010 US$**, better for **cross‑country comparison** in your East Africa panel.

---

**Note (for your thesis write‑up):**

- **Real GDP growth (IMF WEO_NGDP_RPCH):** Year‑on‑year percentage change in GDP at constant prices; base year is country‑specific; methodology is IMF staff projections.  
- **Real GDP per capita (WB_GS_NY_GDP_PCAP_KD):** Constant 2010 US$, derived from constant‑price GDP and total population; comparable across countries and over time.  
- **Real GDP per capita (IMF_WEO_NGDPRPC):** Constant national currency per person; useful if you want to stay in KES and combine with domestic variables.

---

**Suggested follow-ups:**

1. Could you provide **the full time series (e.g., 1990–2024) for Kenya’s real GDP and real GDP per capita**, and maybe compute average growth rates by decade?  
2. Can you give me **comparable real GDP and GDP per capita data for other East African countries** (Uganda, Tanzania, Rwanda, Ethiopia) so I can build a panel?  
3. Could you show me **how to download these series and compute growth rates in Stata/R/Python** for my econometric analysis?

---
<details>
<summary>📋 <b>Tool Calls</b> (click to expand)</summary>

**1. data360_search_indicators**
```json
{
  "query": "GDP (constant prices)",
  "required_country": "KEN",
  "limit": 10
}
```
**Result:**
```json
{
  "count": 10,
  "total_count": 779,
  "offset": 0,
  "has_more": true,
  "next_offset": 10,
  "indicators": [
    {
      "idno": "IMF_WEO_NGDP_RPCH",
      "database_id": "IMF_WEO",
      "name": "Gross domestic product, constant prices, Percent change",
      "truncated_definition": "Annual percentages of constant price GDP are year-on-year changes; the base year is country-specific",
      "periodicity": "Annual",
      "latest_data": "2029",
      "time_period_range": "1980-2029",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "IMF_WEO_NGDPRPC",
      "database_id": "IMF_WEO",
      "name": "Gross domestic product per capita, constant prices, National currency, Units",
      "truncated_definition": "GDP is expressed in constant national currency per person. Data are derived by dividing constant pri",
      "periodicity": "Annual",
      "latest_data": "2029",
      "time_period_range": "1980-2029",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_GEP_NYGDPMKTPKDZ",
      "database_id": "WB_GEP",
      "name": "GDP growth, constant (average 2010-19 prices and market exchange rates)",
      "truncated_definition": "GDP growth, constant (average 2010-19 prices and market exchange rates)",
      "periodicity": "Annual",
      "latest_data": "2026",
      "time_period_range": "2022-2026",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_SL_GDP_PCAP_EM_KD",
      "database_id": "WB_WDI",
      "name": "GDP per person employed (constant 2021 PPP $)",
      "truncated_definition": "GDP per person employed is gross domestic product (GDP) divided by total employment in the economy. ",
      "periodicity": "Annual",
      "latest_data": "2024",
      "time_period_range": "1991-2024",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_GS_NY_GDP_MKTP_KD_ZG",
      "database_id": "WB_GS",
      "name": "GDP growth (annual %)",
      "truncated_definition": "Annual percentage growth rate of GDP at market prices based on constant local currency. Aggregates a",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_GS_NY_GDP_PCAP_KD",
      "database_id": "WB_GS",
      "name": "GDP per capita (constant 2010 US$)",
      "truncated_definition": "GDP per capita is gross domestic product divided by midyear population. GDP is the sum of gross valu",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_ESG_NY_GDP_MKTP_KD_ZG",
      "database_id": "WB_ESG",
      "name": "GDP growth (annual %)",
      "truncated_definition": "Annual percentage growth rate of GDP at market prices based on constant local currency. Aggregates a",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1961-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_SSGD_GDP_GROWTH_ANNUAL",
      "database_id": "WB_SSGD",
      "name": "GDP growth (annual %)",
      "truncated_definition": "Annual percentage growth rate of GDP at market prices based on constant local currency. Aggregates a",
      "periodicity": "Annual",
      "latest_data": "2022",
      "time_period_range": "2018-2022",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_CLEAR_NY_GDP_MKTP_KD_ZG",
      "database_id": "WB_CLEAR",
      "name": "GDP growth (annual %)",
      "truncated_definition": "Annual percentage growth rate of GDP at market prices based on constant local currency. Aggregates a",
      "periodicity": "Annual",
      "latest_data": "2022",
      "time_period_range": "1961-2022",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_ASPD_LABOR_PRODUCTIVITY_REAL",
      "database_id": "WB_ASPD",
      "name": "Labor productivity (2010 constant prices, local currency, thousands)",
      "truncated_definition": "Labor productivity (2010 constant prices, local currency, thousands)",
      "periodicity": "Annual",
      "latest_data": "2017",
      "time_period_range": "1950-2017",
      "covers_country": true,
      "dimensions": null
    }
  ],
  "required_country": "KEN",
  "error": null
}
```

**2. data360_search_indicators**
```json
{
  "query": "GDP per capita (constant prices)",
  "required_country": "KEN",
  "limit": 10
}
```
**Result:**
```json
{
  "count": 10,
  "total_count": 1370,
  "offset": 0,
  "has_more": true,
  "next_offset": 10,
  "indicators": [
    {
      "idno": "IMF_WEO_NGDPRPC",
      "database_id": "IMF_WEO",
      "name": "Gross domestic product per capita, constant prices, National currency, Units",
      "truncated_definition": "GDP is expressed in constant national currency per person. Data are derived by dividing constant pri",
      "periodicity": "Annual",
      "latest_data": "2029",
      "time_period_range": "1980-2029",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "IMF_WEO_NGDPRPPPPC",
      "database_id": "IMF_WEO",
      "name": "Gross domestic product per capita, constant prices, Purchasing power parity; 2017 international dollar, Units",
      "truncated_definition": "GDP is expressed in constant international dollars per person. Data are derived by dividing constant",
      "periodicity": "Annual",
      "latest_data": "2029",
      "time_period_range": "1980-2029",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_NY_GDP_PCAP_KN",
      "database_id": "WB_WDI",
      "name": "GDP per capita (constant LCU)",
      "truncated_definition": "Gross domestic product is the total income earned through the production of goods and services in an",
      "periodicity": "Annual",
      "latest_data": "2024",
      "time_period_range": "1960-2024",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_SL_GDP_PCAP_EM_KD",
      "database_id": "WB_WDI",
      "name": "GDP per person employed (constant 2021 PPP $)",
      "truncated_definition": "GDP per person employed is gross domestic product (GDP) divided by total employment in the economy. ",
      "periodicity": "Annual",
      "latest_data": "2024",
      "time_period_range": "1991-2024",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_GS_NY_GDP_PCAP_KD",
      "database_id": "WB_GS",
      "name": "GDP per capita (constant 2010 US$)",
      "truncated_definition": "GDP per capita is gross domestic product divided by midyear population. GDP is the sum of gross valu",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_SSGD_GDP_CAPITA_PPP",
      "database_id": "WB_SSGD",
      "name": "GDP per capita, PPP",
      "truncated_definition": "GDP per capita, PPP (constant 2017 international $)",
      "periodicity": "Annual",
      "latest_data": "2022",
      "time_period_range": "2018-2022",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_SSGD_LOG_GDP_CAPITA_PPP",
      "database_id": "WB_SSGD",
      "name": "Log of GDP per capita, PPP",
      "truncated_definition": "Log of GDP per capita, PPP",
      "periodicity": "Annual",
      "latest_data": "2022",
      "time_period_range": "2018-2022",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_SSGD_GDP_GROWTH_ANNUAL",
      "database_id": "WB_SSGD",
      "name": "GDP growth (annual %)",
      "truncated_definition": "Annual percentage growth rate of GDP at market prices based on constant local currency. Aggregates a",
      "periodicity": "Annual",
      "latest_data": "2022",
      "time_period_range": "2018-2022",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_CLEAR_NY_GDP_PCAP_KD_ZG",
      "database_id": "WB_CLEAR",
      "name": "GDP per capita growth (annual %)",
      "truncated_definition": "Annual percentage growth rate of GDP per capita based on constant local currency. GDP per capita is ",
      "periodicity": "Annual",
      "latest_data": "2022",
      "time_period_range": "1961-2022",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "FAO_AS_4458",
      "database_id": "FAO_AS",
      "name": "GDP per capita",
      "truncated_definition": "GDP per capita",
      "periodicity": "Annual",
      "latest_data": "2022",
      "time_period_range": "1970-2022",
      "covers_country": true,
      "dimensions": null
    }
  ],
  "required_country": "KEN",
  "error": null
}
```

**3. data360_get_data**
```json
{
  "database_id": "WB_GS",
  "indicator_id": "WB_GS_NY_GDP_PCAP_KD",
  "disaggregation_filters": {
    "REF_AREA": "KEN"
  },
  "start_year": 2019,
  "end_year": 2024,
  "limit": 100
}
```
**Result:**
```json
{
  "count": 4,
  "total_count": null,
  "offset": 0,
  "has_more": false,
  "next_offset": null,
  "data": [
    {
      "OBS_VALUE": "1754.59",
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
      "INDICATOR": "WB_GS_NY_GDP_PCAP_KD",
      "REF_AREA": "KEN",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2022",
      "FREQ": "A",
      "UNIT_MEASURE": "USD_CONST_2010",
      "UNIT_TYPE": null,
      "claim_id": "e9c63695"
    },
    {
      "OBS_VALUE": "1705.74",
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
      "INDICATOR": "WB_GS_NY_GDP_PCAP_KD",
      "REF_AREA": "KEN",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2021",
      "FREQ": "A",
      "UNIT_MEASURE": "USD_CONST_2010",
      "UNIT_TYPE": null,
      "claim_id": "42f51ab4"
    },
    {
      "OBS_VALUE": "1616.5",
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
      "INDICATOR": "WB_GS_NY_GDP_PCAP_KD",
      "REF_AREA": "KEN",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2020",
      "FREQ": "A",
      "UNIT_MEASURE": "USD_CONST_2010",
      "UNIT_TYPE": null,
      "claim_id": "69982ab4"
    },
    {
      "OBS_VALUE": "1653.83",
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
      "INDICATOR": "WB_GS_NY_GDP_PCAP_KD",
      "REF_AREA": "KEN",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2019",
      "FREQ": "A",
      "UNIT_MEASURE": "USD_CONST_2010",
      "UNIT_TYPE": null,
      "claim_id": "585b258b"
    }
  ],
  "metadata": {
    "idno": "WB_GS_NY_GDP_PCAP_KD",
    "name": "GDP per capita (constant 2010 US$)",
    "database_id": "WB_GS",
    "measurement_unit": "constant 2010 USD",
    "periodicity": "Annual",
    "definition_short": "GDP per capita (constant 2010 US$)"
  },
  "error": null,
  "failed_validation": null
}
```

**4. data360_get_data**
```json
{
  "database_id": "IMF_WEO",
  "indicator_id": "IMF_WEO_NGDP_RPCH",
  "disaggregation_filters": {
    "REF_AREA": "KEN"
  },
  "start_year": 2019,
  "end_year": 2024,
  "limit": 100
}
```
**Result:**
```json
{
  "count": 6,
  "total_count": null,
  "offset": 0,
  "has_more": false,
  "next_offset": null,
  "data": [
    {
      "OBS_VALUE": "4.974",
      "TIME_FORMAT": "602",
      "UNIT_MULT": 0,
      "COMMENT_OBS": "See notes for:  Gross domestic product, constant prices (National currency).",
      "OBS_STATUS": "F",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "IMF_WEO",
      "INDICATOR": "IMF_WEO_NGDP_RPCH",
      "REF_AREA": "KEN",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2024",
      "FREQ": "A",
      "UNIT_MEASURE": "PC",
      "UNIT_TYPE": null,
      "claim_id": "973571c1"
    },
    {
      "OBS_VALUE": "5.507",
      "TIME_FORMAT": "602",
      "UNIT_MULT": 0,
      "COMMENT_OBS": "See notes for:  Gross domestic product, constant prices (National currency).",
      "OBS_STATUS": "F",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "IMF_WEO",
      "INDICATOR": "IMF_WEO_NGDP_RPCH",
      "REF_AREA": "KEN",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2023",
      "FREQ": "A",
      "UNIT_MEASURE": "PC",
      "UNIT_TYPE": null,
      "claim_id": "0894bba4"
    },
    {
      "OBS_VALUE": "4.847",
      "TIME_FORMAT": "602",
      "UNIT_MULT": 0,
      "COMMENT_OBS": "See notes for:  Gross domestic product, constant prices (National currency).",
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "IMF_WEO",
      "INDICATOR": "IMF_WEO_NGDP_RPCH",
      "REF_AREA": "KEN",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2022",
      "FREQ": "A",
      "UNIT_MEASURE": "PC",
      "UNIT_TYPE": null,
      "claim_id": "5d14ece9"
    },
    {
      "OBS_VALUE": "7.59",
      "TIME_FORMAT": "602",
      "UNIT_MULT": 0,
      "COMMENT_OBS": "See notes for:  Gross domestic product, constant prices (National currency).",
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "IMF_WEO",
      "INDICATOR": "IMF_WEO_NGDP_RPCH",
      "REF_AREA": "KEN",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2021",
      "FREQ": "A",
      "UNIT_MEASURE": "PC",
      "UNIT_TYPE": null,
      "claim_id": "13be5490"
    },
    {
      "OBS_VALUE": "-0.273",
      "TIME_FORMAT": "602",
      "UNIT_MULT": 0,
      "COMMENT_OBS": "See notes for:  Gross domestic product, constant prices (National currency).",
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "IMF_WEO",
      "INDICATOR": "IMF_WEO_NGDP_RPCH",
      "REF_AREA": "KEN",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2020",
      "FREQ": "A",
      "UNIT_MEASURE": "PC",
      "UNIT_TYPE": null,
      "claim_id": "54cd9afd"
    },
    {
      "OBS_VALUE": "5.114",
      "TIME_FORMAT": "602",
      "UNIT_MULT": 0,
      "COMMENT_OBS": "See notes for:  Gross domestic product, constant prices (National currency).",
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "IMF_WEO",
      "INDICATOR": "IMF_WEO_NGDP_RPCH",
      "REF_AREA": "KEN",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2019",
      "FREQ": "A",
      "UNIT_MEASURE": "PC",
      "UNIT_TYPE": null,
      "claim_id": "f5efd378"
    }
  ],
  "metadata": {
    "idno": "IMF_WEO_NGDP_RPCH",
    "name": "Gross domestic product, constant prices, Percent change",
    "database_id": "IMF_WEO",
    "measurement_unit": "Percentage change",
    "periodicity": "Annual",
    "definition_short": "Gross domestic product, constant prices, Percent change"
  },
  "error": null,
  "failed_validation": null
}
```

**5. data360_get_data**
```json
{
  "database_id": "IMF_WEO",
  "indicator_id": "IMF_WEO_NGDPRPC",
  "disaggregation_filters": {
    "REF_AREA": "KEN"
  },
  "start_year": 2019,
  "end_year": 2024,
  "limit": 100
}
```
**Result:**
```json
{
  "count": 6,
  "total_count": null,
  "offset": 0,
  "has_more": false,
  "next_offset": null,
  "data": [
    {
      "OBS_VALUE": "208047.89",
      "TIME_FORMAT": "602",
      "UNIT_MULT": 0,
      "COMMENT_OBS": "See notes for:  Gross domestic product, constant prices (National currency) Population (Persons).",
      "OBS_STATUS": "F",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "IMF_WEO",
      "INDICATOR": "IMF_WEO_NGDPRPC",
      "REF_AREA": "KEN",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2024",
      "FREQ": "A",
      "UNIT_MEASURE": "XDC_K",
      "UNIT_TYPE": null,
      "claim_id": "4715ba91"
    },
    {
      "OBS_VALUE": "201669.81",
      "TIME_FORMAT": "602",
      "UNIT_MULT": 0,
      "COMMENT_OBS": "See notes for:  Gross domestic product, constant prices (National currency) Population (Persons).",
      "OBS_STATUS": "F",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "IMF_WEO",
      "INDICATOR": "IMF_WEO_NGDPRPC",
      "REF_AREA": "KEN",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2023",
      "FREQ": "A",
      "UNIT_MEASURE": "XDC_K",
      "UNIT_TYPE": null,
      "claim_id": "b8e8d16b"
    },
    {
      "OBS_VALUE": "194537.02",
      "TIME_FORMAT": "602",
      "UNIT_MULT": 0,
      "COMMENT_OBS": "See notes for:  Gross domestic product, constant prices (National currency) Population (Persons).",
      "OBS_STATUS": "F",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "IMF_WEO",
      "INDICATOR": "IMF_WEO_NGDPRPC",
      "REF_AREA": "KEN",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2022",
      "FREQ": "A",
      "UNIT_MEASURE": "XDC_K",
      "UNIT_TYPE": null,
      "claim_id": "0cdac9ec"
    },
    {
      "OBS_VALUE": "188875.72",
      "TIME_FORMAT": "602",
      "UNIT_MULT": 0,
      "COMMENT_OBS": "See notes for:  Gross domestic product, constant prices (National currency) Population (Persons).",
      "OBS_STATUS": "F",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "IMF_WEO",
      "INDICATOR": "IMF_WEO_NGDPRPC",
      "REF_AREA": "KEN",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2021",
      "FREQ": "A",
      "UNIT_MEASURE": "XDC_K",
      "UNIT_TYPE": null,
      "claim_id": "da4980ae"
    },
    {
      "OBS_VALUE": "178965.86",
      "TIME_FORMAT": "602",
      "UNIT_MULT": 0,
      "COMMENT_OBS": "See notes for:  Gross domestic product, constant prices (National currency) Population (Persons).",
      "OBS_STATUS": "F",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "IMF_WEO",
      "INDICATOR": "IMF_WEO_NGDPRPC",
      "REF_AREA": "KEN",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2020",
      "FREQ": "A",
      "UNIT_MEASURE": "XDC_K",
      "UNIT_TYPE": null,
      "claim_id": "54ea4c08"
    },
    {
      "OBS_VALUE": "183969.45",
      "TIME_FORMAT": "602",
      "UNIT_MULT": 0,
      "COMMENT_OBS": "See notes for:  Gross domestic product, constant prices (National currency) Population (Persons).",
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": null,
      "DECIMALS": null,
      "COMMENT_TS": null,
      "DATA_SOURCE": null,
      "LATEST_DATA": false,
      "DATABASE_ID": "IMF_WEO",
      "INDICATOR": "IMF_WEO_NGDPRPC",
      "REF_AREA": "KEN",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2019",
      "FREQ": "A",
      "UNIT_MEASURE": "XDC_K",
      "UNIT_TYPE": null,
      "claim_id": "e2e9906c"
    }
  ],
  "metadata": {
    "idno": "IMF_WEO_NGDPRPC",
    "name": "Gross domestic product per capita, constant prices, National currency, Units",
    "database_id": "IMF_WEO",
    "measurement_unit": "Domestic currency, constant prices",
    "periodicity": "Annual",
    "definition_short": "Gross domestic product per capita, constant prices, National currency"
  },
  "error": null,
  "failed_validation": null
}
```

**6. data360_get_metadata**
```json
{
  "database_id": "WB_GS",
  "indicator_id": "WB_GS_NY_GDP_PCAP_KD"
}
```
**Result:**
```json
{
  "indicator_metadata": {
    "idno": "WB_GS_NY_GDP_PCAP_KD",
    "doi": null,
    "name": "GDP per capita (constant 2010 US$)",
    "display_name": null,
    "database_id": "WB_GS",
    "database_name": "Gender Statistics",
    "date_last_update": null,
    "date_released": null,
    "measurement_unit": "constant 2010 USD",
    "release_calendar": null,
    "periodicity": "Annual",
    "base_period": null,
    "definition_short": "GDP per capita (constant 2010 US$)",
    "definition_long": "GDP per capita is gross domestic product divided by midyear population. GDP is the sum of gross value added by all resident producers in the economy plus any product taxes and minus any subsidies not included in the value of the products. It is calculated without making deductions for depreciation of fabricated assets or for depletion and degradation of natural resources. Data are in constant 2015 U.S. dollars.",
    "statistical_concept": null,
    "methodology": "For more information, see the metadata for constant U.S. dollar GDP (NY.GDP.MKTP.KD) and total population (SP.POP.TOTL).",
    "derivation": null,
    "imputation": null,
    "missing": null,
    "quality_checks": null,
    "quality_note": null,
    "sources_discrepancies": null,
    "series_break": null,
    "limitation": null,
    "relevance": null,
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
    "csv_link": "https://data360files.worldbank.org/data360-data/data/WB_GS/WB_GS_NY_GDP_PCAP_KD.csv",
    "excel_link": null,
    "json_link": "https://data360files.worldbank.org/data360-data/metadata/WB_GS/WB_GS_NY_GDP_PCAP_KD.json",
    "api_link": "https://data360api.worldbank.org/data360/data?top=1000&skip=0&DATABASE_ID=WB_GS&INDICATOR=WB_GS_NY_GDP_PCAP_KD",
    "indicator_count": null,
    "apiservice_link": null,
    "api_explorer_link": "http://datacatalog.worldbank.org/data360/api/execute?tab=Data&id=1&DATABASE_ID=WB_GS&INDICATOR=WB_GS_NY_GDP_PCAP_KD",
    "authoring_entity": [],
    "version_statement": {
      "version": "Version 1.0",
      "version_date": "2025-11-04",
      "version_resp": null,
      "version_notes": null
    },
    "aliases": [],
    "alternate_identifiers": [],
    "languages": [
      {
        "name": "English",
        "code": "EN"
      }
    ],
    "dimensions": [
      {
        "name": null,
        "label": "Geographic area",
        "description": "Country/economy, Region"
      }
    ],
    "definition_references": [],
    "statistical_concept_references": [],
    "methodology_references": [],
    "derivation_references": [],
    "imputation_references": [],
    "topics": [],
    "time_periods": [
      {
        "start": "1960",
        "end": "2023",
        "notes": null
      }
    ],
    "ref_country": [
      {
        "name": "Aruba",
        "code": "ABW"
      },
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
        "name": "Andorra",
        "code": "AND"
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
        "name": "American Samoa",
        "code": "ASM"
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
        "name": "Austria",
        "code": "AUT"
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
        "name": "Bahrain",
        "code": "BHR"
      },
      {
        "name": "Bahamas, The",
        "code": "BHS"
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
        "name": "Bermuda",
        "code": "BMU"
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
        "name": "Brunei Darussalam",
        "code": "BRN"
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
        "name": "Channel Islands",
        "code": "CHI"
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
        "name": "Cote d'Ivoire",
        "code": "CIV"
      },
      {
        "name": "Cameroon",
        "code": "CMR"
      },
      {
        "name": "Congo, Dem. Rep.",
        "code": "COD"
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
        "name": "Costa Rica",
        "code": "CRI"
      },
      {
        "name": "Cuba",
        "code": "CUB"
      },
      {
        "name": "Curacao",
        "code": "CUW"
      },
      {
        "name": "Cayman Islands",
        "code": "CYM"
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
        "name": "Germany",
        "code": "DEU"
      },
      {
        "name": "Djibouti",
        "code": "DJI"
      },
      {
        "name": "Dominica",
        "code": "DMA"
      },
      {
        "name": "Denmark",
        "code": "DNK"
      },
      {
        "name": "Dominican Republic",
        "code": "DOM"
      },
      {
        "name": "Algeria",
        "code": "DZA"
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
        "name": "Eritrea",
        "code": "ERI"
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
        "name": "Finland",
        "code": "FIN"
      },
      {
        "name": "Fiji",
        "code": "FJI"
      },
      {
        "name": "France",
        "code": "FRA"
      },
      {
        "name": "Faroe Islands",
        "code": "FRO"
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
        "name": "United Kingdom",
        "code": "GBR"
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
        "name": "Gibraltar",
        "code": "GIB"
      },
      {
        "name": "Guinea",
        "code": "GIN"
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
        "name": "Equatorial Guinea",
        "code": "GNQ"
      },
      {
        "name": "Greece",
        "code": "GRC"
      },
      {
        "name": "Grenada",
        "code": "GRD"
      },
      {
        "name": "Greenland",
        "code": "GRL"
      },
      {
        "name": "Guatemala",
        "code": "GTM"
      },
      {
        "name": "Guam",
        "code": "GUM"
      },
      {
        "name": "Guyana",
        "code": "GUY"
      },
      {
        "name": "Hong Kong SAR, China",
        "code": "HKG"
      },
      {
        "name": "Honduras",
        "code": "HND"
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
        "name": "Indonesia",
        "code": "IDN"
      },
      {
        "name": "Isle of Man",
        "code": "IMN"
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
        "name": "Iran, Islamic Rep.",
        "code": "IRN"
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
        "name": "Jordan",
        "code": "JOR"
      },
      {
        "name": "Japan",
        "code": "JPN"
      },
      {
        "name": "Kazakhstan",
        "code": "KAZ"
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
        "name": "Cambodia",
        "code": "KHM"
      },
      {
        "name": "Kiribati",
        "code": "KIR"
      },
      {
        "name": "St. Kitts and Nevis",
        "code": "KNA"
      },
      {
        "name": "Korea, Rep.",
        "code": "KOR"
      },
      {
        "name": "Kuwait",
        "code": "KWT"
      },
      {
        "name": "Lao PDR",
        "code": "LAO"
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
        "name": "Libya",
        "code": "LBY"
      },
      {
        "name": "St. Lucia",
        "code": "LCA"
      },
      {
        "name": "Liechtenstein",
        "code": "LIE"
      },
      {
        "name": "Sri Lanka",
        "code": "LKA"
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
        "name": "Luxembourg",
        "code": "LUX"
      },
      {
        "name": "Latvia",
        "code": "LVA"
      },
      {
        "name": "Macao SAR, China",
        "code": "MAC"
      },
      {
        "name": "St. Martin (French part)",
        "code": "MAF"
      },
      {
        "name": "Morocco",
        "code": "MAR"
      },
      {
        "name": "Monaco",
        "code": "MCO"
      },
      {
        "name": "Moldova",
        "code": "MDA"
      },
      {
        "name": "Madagascar",
        "code": "MDG"
      },
      {
        "name": "Maldives",
        "code": "MDV"
      },
      {
        "name": "Mexico",
        "code": "MEX"
      },
      {
        "name": "Marshall Islands",
        "code": "MHL"
      },
      {
        "name": "North Macedonia",
        "code": "MKD"
      },
      {
        "name": "Mali",
        "code": "MLI"
      },
      {
        "name": "Malta",
        "code": "MLT"
      },
      {
        "name": "Myanmar",
        "code": "MMR"
      },
      {
        "name": "Montenegro",
        "code": "MNE"
      },
      {
        "name": "Mongolia",
        "code": "MNG"
      },
      {
        "name": "Northern Mariana Islands",
        "code": "MNP"
      },
      {
        "name": "Mozambique",
        "code": "MOZ"
      },
      {
        "name": "Mauritania",
        "code": "MRT"
      },
      {
        "name": "Mauritius",
        "code": "MUS"
      },
      {
        "name": "Malawi",
        "code": "MWI"
      },
      {
        "name": "Malaysia",
        "code": "MYS"
      },
      {
        "name": "Namibia",
        "code": "NAM"
      },
      {
        "name": "New Caledonia",
        "code": "NCL"
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
        "name": "Netherlands",
        "code": "NLD"
      },
      {
        "name": "Norway",
        "code": "NOR"
      },
      {
        "name": "Nepal",
        "code": "NPL"
      },
      {
        "name": "Nauru",
        "code": "NRU"
      },
      {
        "name": "New Zealand",
        "code": "NZL"
      },
      {
        "name": "Oman",
        "code": "OMN"
      },
      {
        "name": "Pakistan",
        "code": "PAK"
      },
      {
        "name": "Panama",
        "code": "PAN"
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
        "name": "Palau",
        "code": "PLW"
      },
      {
        "name": "Papua New Guinea",
        "code": "PNG"
      },
      {
        "name": "Poland",
        "code": "POL"
      },
      {
        "name": "Puerto Rico",
        "code": "PRI"
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
        "name": "Paraguay",
        "code": "PRY"
      },
      {
        "name": "West Bank and Gaza",
        "code": "PSE"
      },
      {
        "name": "French Polynesia",
        "code": "PYF"
      },
      {
        "name": "Qatar",
        "code": "QAT"
      },
      {
        "name": "Romania",
        "code": "ROU"
      },
      {
        "name": "Russian Federation",
        "code": "RUS"
      },
      {
        "name": "Rwanda",
        "code": "RWA"
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
        "name": "Singapore",
        "code": "SGP"
      },
      {
        "name": "Solomon Islands",
        "code": "SLB"
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
        "name": "San Marino",
        "code": "SMR"
      },
      {
        "name": "Somalia",
        "code": "SOM"
      },
      {
        "name": "Serbia",
        "code": "SRB"
      },
      {
        "name": "South Sudan",
        "code": "SSD"
      },
      {
        "name": "Sao Tome and Principe",
        "code": "STP"
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
        "name": "Sweden",
        "code": "SWE"
      },
      {
        "name": "Eswatini",
        "code": "SWZ"
      },
      {
        "name": "Sint Maarten (Dutch part)",
        "code": "SXM"
      },
      {
        "name": "Seychelles",
        "code": "SYC"
      },
      {
        "name": "Syrian Arab Republic",
        "code": "SYR"
      },
      {
        "name": "Turks and Caicos Islands",
        "code": "TCA"
      },
      {
        "name": "Chad",
        "code": "TCD"
      },
      {
        "name": "Togo",
        "code": "TGO"
      },
      {
        "name": "Thailand",
        "code": "THA"
      },
      {
        "name": "Tajikistan",
        "code": "TJK"
      },
      {
        "name": "Turkmenistan",
        "code": "TKM"
      },
      {
        "name": "Timor-Leste",
        "code": "TLS"
      },
      {
        "name": "Tonga",
        "code": "TON"
      },
      {
        "name": "Trinidad and Tobago",
        "code": "TTO"
      },
      {
        "name": "Tunisia",
        "code": "TUN"
      },
      {
        "name": "Turkiye",
        "code": "TUR"
      },
      {
        "name": "Tuvalu",
        "code": "TUV"
      },
      {
        "name": "Tanzania",
        "code": "TZA"
      },
      {
        "name": "Uganda",
        "code": "UGA"
      },
      {
        "name": "Ukraine",
        "code": "UKR"
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
        "name": "Uzbekistan",
        "code": "UZB"
      },
      {
        "name": "St. Vincent and the Grenadines",
        "code": "VCT"
      },
      {
        "name": "Venezuela, RB",
        "code": "VEN"
      },
      {
        "name": "British Virgin Islands",
        "code": "VGB"
      },
      {
        "name": "Virgin Islands (U.S.)",
        "code": "VIR"
      },
      {
        "name": "Viet Nam",
        "code": "VNM"
      },
      {
        "name": "Vanuatu",
        "code": "VUT"
      },
      {
        "name": "Samoa",
        "code": "WSM"
      },
      {
        "name": "Kosovo",
        "code": "XKX"
      },
      {
        "name": "Yemen, Rep.",
        "code": "YEM"
      },
      {
        "name": "South Africa",
        "code": "ZAF"
      },
      {
        "name": "Zambia",
        "code": "ZMB"
      },
      {
        "name": "Zimbabwe",
        "code": "ZWE"
      }
    ],
    "geographic_units": [
      {
        "name": "Africa Eastern and Southern",
        "code": "AFE",
        "type": null
      },
      {
        "name": "Africa Western and Central",
        "code": "AFW",
        "type": null
      },
      {
        "name": "Arab World",
        "code": "ARB",
        "type": null
      },
      {
        "name": "Central Electricity Board (CEB)",
        "code": "CEB",
        "type": null
      },
      {
        "name": "Caribbean small states",
        "code": "CSS",
        "type": null
      },
      {
        "name": "East Asia & Pacific (excluding high income)",
        "code": "EAP",
        "type": null
      },
      {
        "name": "Early-demographic dividend",
        "code": "EAR",
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
        "name": "IBRD only",
        "code": "IBD",
        "type": null
      },
      {
        "name": "IDA & IBRD total",
        "code": "IBT",
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
        "name": "Latin America & Caribbean (excluding high income)",
        "code": "LAC",
        "type": null
      },
      {
        "name": "Latin America & Caribbean",
        "code": "LCN",
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
        "name": "Lower middle income",
        "code": "LMC",
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
        "name": "Middle East and North Africa",
        "code": "MEA",
        "type": null
      },
      {
        "name": "Middle income",
        "code": "MIC",
        "type": null
      },
      {
        "name": "Middle East & North Africa (excluding high income)",
        "code": "MNA",
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
        "name": "East Asia & Pacific (IDA & IBRD)",
        "code": "TEA",
        "type": null
      },
      {
        "name": "Europe & Central Asia (IDA & IBRD)",
        "code": "TEC",
        "type": null
      },
      {
        "name": "Latin America & Caribbean (IDA & IBRD)",
        "code": "TLA",
        "type": null
      },
      {
        "name": "Middle East & North Africa (IDA & IBRD)",
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
    "aggregation_method_references": [
      {
        "source": "Gender Statistics",
        "uri": "https://api.worldbank.org/v2/sources/14/series/NY.GDP.PCAP.KD/metadata",
        "note": null
      }
    ],
    "license": [
      {
        "name": "CC BY 4.0",
        "uri": "https://creativecommons.org/licenses/by/4.0/",
        "note": "This work is provided under a Creative Commons 4.0 Attribution International License, with the following mandatory and binding addition:i. Any and all disputes arising under this License that cannot be settled amicably shall be submitted to mediation in accordance with the WIPO Mediation Rules in effect at the time the work was published. If the request for mediation is not resolved within forty-five (45) days of the request, either You or the Licensor may, pursuant to a notice of arbitration communicated by reasonable means to the other party refer the dispute to final and binding arbitration to be conducted in accordance with UNCITRAL Arbitration Rules as then in force. The arbitral tribunal shall consist of a sole arbitrator and the language of the proceedings shall be English unless otherwise agreed. The place of arbitration shall be where the Licensor has its headquarters. The arbitral proceedings shall be conducted remotely (e.g., via telephone conference or written submissions) whenever practicable, or held at the World Bank headquarters in Washington DC."
      }
    ],
    "links": [
      {
        "type": "Website",
        "description": "DDH",
        "uri": "https://datacatalog.worldbank.org/search/dataset/0037654/Gender-Statistics",
        "image_uri": null
      },
      {
        "type": "Website",
        "description": "Gender Data Portal",
        "uri": "https://genderdata.worldbank.org/en/home",
        "image_uri": null
      },
      {
        "type": "Website",
        "description": "World Bank Data Terms of Use",
        "uri": "https://www.worldbank.org/en/about/legal/terms-of-use-for-datasets",
        "image_uri": null
      },
      {
        "type": "API",
        "description": "World Bank Data API",
        "uri": "https://api.worldbank.org/v2/sources/14/indicators",
        "image_uri": null
      }
    ],
    "api_documentation": [],
    "sources": [
      {
        "idno": null,
        "type": null,
        "name": "National Accounts Data",
        "organization": "World Bank (WB)",
        "publisher": null,
        "publication_date": null,
        "uri": null,
        "access_date": null,
        "note": null,
        "other_identifiers": [],
        "authors": [],
        "datasets": []
      },
      {
        "idno": null,
        "type": null,
        "name": "National Accounts Data",
        "organization": "organisation for Economic Co-operation and Development (OECD)",
        "publisher": null,
        "publication_date": null,
        "uri": null,
        "access_date": null,
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
        "ARM",
        "MAC",
        "CEB",
        "DOM",
        "TCA",
        "MYS",
        "VEN",
        "LTU",
        "SLE",
        "TLS",
        "URY",
        "GTM",
        "TZA",
        "DZA",
        "MWI",
        "SWZ",
        "ARE",
        "NCL",
        "SGP",
        "BRB",
        "PRT",
        "BOL",
        "BWA",
        "QAT",
        "LMY",
        "VUT",
        "GAB",
        "SLB",
        "MNG",
        "OED",
        "PRY",
        "LSO",
        "FRO",
        "ISL",
        "LVA",
        "MCO",
        "MDV",
        "BLZ",
        "COM",
        "GBR",
        "KEN",
        "HUN",
        "TUN",
        "IDB",
        "PER",
        "CYM",
        "SVK",
        "CAN",
        "GUM",
        "SLV",
        "SYR",
        "LMC",
        "MEA",
        "LCN",
        "UKR",
        "ASM",
        "EAR",
        "SXM",
        "MUS",
        "POL",
        "TJK",
        "FCS",
        "NPL",
        "COL",
        "TEC",
        "MHL",
        "CYP",
        "GIN",
        "MIC",
        "IBD",
        "AUT",
        "RUS",
        "JAM",
        "MMR",
        "ARB",
        "ZMB",
        "IRL",
        "KGZ",
        "ESP",
        "BLR",
        "CUB",
        "ALB",
        "LBR",
        "MOZ",
        "SAS",
        "SVN",
        "AGO",
        "GNQ",
        "ECU",
        "BHS",
        "GMB",
        "GRL",
        "ROU",
        "SAU",
        "GHA",
        "ISR",
        "NZL",
        "GIB",
        "IDX",
        "ZWE",
        "LUX",
        "KNA",
        "TLA",
        "JPN",
        "NAM",
        "SST",
        "HIC",
        "HPC",
        "MRT",
        "HND",
        "SMR",
        "SRB",
        "YEM",
        "BGD",
        "TKM",
        "BRA",
        "LTE",
        "WLD",
        "ZAF",
        "MDA",
        "UZB",
        "MLI",
        "VCT",
        "GNB",
        "LAO",
        "MDG",
        "EMU",
        "BEN",
        "BHR",
        "MEX",
        "NLD",
        "STP",
        "FSM",
        "ETH",
        "LIC",
        "CAF",
        "MAF",
        "EUU",
        "NOR",
        "NGA",
        "HKG",
        "SOM",
        "PRI",
        "CSS",
        "AFG",
        "ERI",
        "IRQ",
        "PAN",
        "AZE",
        "GEO",
        "IMN",
        "KHM",
        "CPV",
        "IRN",
        "TSS",
        "JOR",
        "LAC",
        "SUR",
        "PLW",
        "UMC",
        "BRN",
        "COD",
        "HTI",
        "BDI",
        "CHN",
        "MLT",
        "TGO",
        "DNK",
        "LBN",
        "MNE",
        "IND",
        "GRD",
        "EAS",
        "VNM",
        "OMN",
        "TUR",
        "BMU",
        "NRU",
        "PYF",
        "XKX",
        "HRV",
        "MNP",
        "PSE",
        "LCA",
        "LIE",
        "SSF",
        "OSS",
        "BTN",
        "THA",
        "TTO",
        "GRC",
        "KIR",
        "PSS",
        "SWE",
        "COG",
        "EGY",
        "CMR",
        "TON",
        "ATG",
        "CIV",
        "LDC",
        "BGR",
        "AFE",
        "CRI",
        "SYC",
        "TMN",
        "IDA",
        "PRK",
        "UGA",
        "ARG",
        "IDN",
        "BFA",
        "SSD",
        "BEL",
        "KWT",
        "CZE",
        "DJI",
        "DEU",
        "EST",
        "AFW",
        "AUS",
        "ECS",
        "VGB",
        "PHL",
        "FRA",
        "NIC",
        "SEN",
        "TEA",
        "PST",
        "ECA",
        "MNA",
        "CHL",
        "PRE",
        "KOR",
        "NER",
        "USA",
        "DMA",
        "ITA",
        "TSA",
        "LKA",
        "KAZ",
        "BIH",
        "SDN",
        "SSA",
        "FJI",
        "PAK",
        "CHE",
        "VIR",
        "GUY",
        "CHI",
        "IBT",
        "MKD",
        "CUW",
        "FIN",
        "PNG",
        "TCD",
        "WSM",
        "EAP",
        "AND",
        "LBY",
        "MAR",
        "TUV",
        "ABW",
        "NAC",
        "RWA"
      ]
    },
    {
      "field_name": "INDICATOR",
      "label_name": "Statistical indicator",
      "field_value": [
        "WB_GS_NY_GDP_PCAP_KD"
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
        "USD_CONST_2010"
      ]
    },
    {
      "field_name": "TIME_PERIOD",
      "label_name": "Time period",
      "field_value": [
        "1960",
        "1961",
        "1962",
        "1963",
        "1964",
        "1965",
        "1966",
        "1967",
        "1968",
        "1969",
        "1970",
        "1971",
        "1972",
        "1973",
        "1974",
        "1975",
        "1976",
        "1977",
        "1978",
        "1979",
        "1980",
        "1981",
        "1982",
        "1983",
        "1984",
        "1985",
        "1986",
        "1987",
        "1988",
        "1989",
        "1990",
        "1991",
        "1992",
        "1993",
        "1994",
        "1995",
        "1996",
        "1997",
        "1998",
        "1999",
        "2000",
        "2001",
        "2002",
        "2003",
        "2004",
        "2005",
        "2006",
        "2007",
        "2008",
        "2009",
        "2010",
        "2011",
        "2012",
        "2013",
        "2014",
        "2015",
        "2016",
        "2017",
        "2018",
        "2019",
        "2020",
        "2021",
        "2022",
        "2023"
      ]
    }
  ],
  "error": null
}
```

**7. data360_get_metadata**
```json
{
  "database_id": "IMF_WEO",
  "indicator_id": "IMF_WEO_NGDP_RPCH"
}
```
**Result:**
```json
{
  "indicator_metadata": {
    "idno": "IMF_WEO_NGDP_RPCH",
    "doi": null,
    "name": "Gross domestic product, constant prices, Percent change",
    "display_name": null,
    "database_id": "IMF_WEO",
    "database_name": "World Economic Outlook (WEO)",
    "date_last_update": null,
    "date_released": null,
    "measurement_unit": "Percentage change",
    "release_calendar": "Annual",
    "periodicity": "Annual",
    "base_period": null,
    "definition_short": "Gross domestic product, constant prices, Percent change",
    "definition_long": "Annual percentages of constant price GDP are year-on-year changes; the base year is country-specific. Expenditure-based GDP is total final expenditures at purchasers' prices (including the f.o.b. value of exports of goods and services), less the f.o.b. value of imports of goods and services. [SNA 1993]",
    "statistical_concept": null,
    "methodology": "The IMF's World Economic Outlook uses a \"bottom-up\" approach in producing its forecasts; that is, country teams within the IMF generate projections for individual countries. These are then aggregated, and through a series of iterations where the aggregates feed back into individual countries' forecasts, forecasts converge to the projections reported in the WEO.\n\nBecause forecasts are made by the individual country teams, the methodology can vary from country to country and series to series depending on many factors. To get more information on a specific country and series forecast, you may contact the country teams directly; from the Countries tab on the IMF website. (From: https://www.imf.org/en/Publications/WEO/frequently-asked-questions#:~:text=%2Ddatabase%2FDisclaimer.-,Q.,generate%20projections%20for%20individual%20countries.)",
    "derivation": null,
    "imputation": null,
    "missing": null,
    "quality_checks": null,
    "quality_note": null,
    "sources_discrepancies": null,
    "series_break": null,
    "limitation": null,
    "relevance": null,
    "aggregation_method": null,
    "disaggregation": null,
    "confidentiality": null,
    "confidentiality_status": "PU",
    "confidentiality_note": null,
    "citation_requirement": null,
    "sources_note": null,
    "acknowledgement_statement": null,
    "disclaimer": null,
    "economies_count": null,
    "csv_link": "https://data360files.worldbank.org/data360-data/data/IMF_WEO/IMF_WEO_NGDP_RPCH.csv",
    "excel_link": null,
    "json_link": "https://data360files.worldbank.org/data360-data/metadata/IMF_WEO/IMF_WEO_NGDP_RPCH.json",
    "api_link": "https://data360api.worldbank.org/data360/data?top=1000&skip=0&DATABASE_ID=IMF_WEO&INDICATOR=IMF_WEO_NGDP_RPCH",
    "indicator_count": null,
    "apiservice_link": null,
    "api_explorer_link": "http://datacatalog.worldbank.org/data360/api/execute?tab=Data&id=1&DATABASE_ID=IMF_WEO&INDICATOR=IMF_WEO_NGDP_RPCH",
    "authoring_entity": [
      {
        "name": "International Monetary Fund",
        "affiliation": null,
        "abbreviation": "IMF",
        "email": "publicaffairs@imf.org",
        "uri": "https://www.imf.org/"
      }
    ],
    "version_statement": {
      "version": null,
      "version_date": "2025-10-14",
      "version_resp": null,
      "version_notes": null
    },
    "aliases": [],
    "alternate_identifiers": [],
    "languages": [
      {
        "name": "English",
        "code": "EN"
      }
    ],
    "dimensions": [
      {
        "name": null,
        "label": "Geographic area",
        "description": "Country/economy, Region"
      }
    ],
    "definition_references": [
      {
        "source": "International Monetary Fund",
        "uri": "https://www.imf.org/en/publications/weo",
        "note": null
      }
    ],
    "statistical_concept_references": [],
    "methodology_references": [],
    "derivation_references": [],
    "imputation_references": [],
    "topics": [
      {
        "id": "P3",
        "name": "Prosperity",
        "parent_id": null,
        "vocabulary": "WB Practice Groups",
        "uri": null
      },
      {
        "id": "P3_000001",
        "name": "Economic Policy",
        "parent_id": "P3",
        "vocabulary": "Data360 Topic L1",
        "uri": null
      },
      {
        "id": "P3_000007",
        "name": "Growth and Jobs",
        "parent_id": "P3_000001",
        "vocabulary": "Data360 Topic L2",
        "uri": null
      }
    ],
    "time_periods": [
      {
        "start": "1980",
        "end": "2029",
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
        "name": "Algeria",
        "code": "DZA"
      },
      {
        "name": "Andorra",
        "code": "AND"
      },
      {
        "name": "Angola",
        "code": "AGO"
      },
      {
        "name": "Antigua and Barbuda",
        "code": "ATG"
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
        "name": "Aruba",
        "code": "ABW"
      },
      {
        "name": "Australia",
        "code": "AUS"
      },
      {
        "name": "Austria",
        "code": "AUT"
      },
      {
        "name": "Azerbaijan",
        "code": "AZE"
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
        "name": "Bangladesh",
        "code": "BGD"
      },
      {
        "name": "Barbados",
        "code": "BRB"
      },
      {
        "name": "Belarus",
        "code": "BLR"
      },
      {
        "name": "Belgium",
        "code": "BEL"
      },
      {
        "name": "Belize",
        "code": "BLZ"
      },
      {
        "name": "Benin",
        "code": "BEN"
      },
      {
        "name": "Bhutan",
        "code": "BTN"
      },
      {
        "name": "Bolivia",
        "code": "BOL"
      },
      {
        "name": "Bosnia and Herzegovina",
        "code": "BIH"
      },
      {
        "name": "Botswana",
        "code": "BWA"
      },
      {
        "name": "Brazil",
        "code": "BRA"
      },
      {
        "name": "Brunei Darussalam",
        "code": "BRN"
      },
      {
        "name": "Bulgaria",
        "code": "BGR"
      },
      {
        "name": "Burkina Faso",
        "code": "BFA"
      },
      {
        "name": "Burundi",
        "code": "BDI"
      },
      {
        "name": "Cabo Verde",
        "code": "CPV"
      },
      {
        "name": "Cambodia",
        "code": "KHM"
      },
      {
        "name": "Cameroon",
        "code": "CMR"
      },
      {
        "name": "Canada",
        "code": "CAN"
      },
      {
        "name": "Central African Republic",
        "code": "CAF"
      },
      {
        "name": "Chad",
        "code": "TCD"
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
        "name": "Colombia",
        "code": "COL"
      },
      {
        "name": "Comoros",
        "code": "COM"
      },
      {
        "name": "Congo, Dem. Rep.",
        "code": "COD"
      },
      {
        "name": "Congo, Rep.",
        "code": "COG"
      },
      {
        "name": "Costa Rica",
        "code": "CRI"
      },
      {
        "name": "Cote d'Ivoire",
        "code": "CIV"
      },
      {
        "name": "Croatia",
        "code": "HRV"
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
        "name": "Djibouti",
        "code": "DJI"
      },
      {
        "name": "Dominica",
        "code": "DMA"
      },
      {
        "name": "Dominican Republic",
        "code": "DOM"
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
        "name": "El Salvador",
        "code": "SLV"
      },
      {
        "name": "Equatorial Guinea",
        "code": "GNQ"
      },
      {
        "name": "Eritrea",
        "code": "ERI"
      },
      {
        "name": "Estonia",
        "code": "EST"
      },
      {
        "name": "Eswatini",
        "code": "SWZ"
      },
      {
        "name": "Ethiopia",
        "code": "ETH"
      },
      {
        "name": "Fiji",
        "code": "FJI"
      },
      {
        "name": "Finland",
        "code": "FIN"
      },
      {
        "name": "France",
        "code": "FRA"
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
        "name": "Georgia",
        "code": "GEO"
      },
      {
        "name": "Germany",
        "code": "DEU"
      },
      {
        "name": "Ghana",
        "code": "GHA"
      },
      {
        "name": "Greece",
        "code": "GRC"
      },
      {
        "name": "Grenada",
        "code": "GRD"
      },
      {
        "name": "Guatemala",
        "code": "GTM"
      },
      {
        "name": "Guinea",
        "code": "GIN"
      },
      {
        "name": "Guinea-Bissau",
        "code": "GNB"
      },
      {
        "name": "Guyana",
        "code": "GUY"
      },
      {
        "name": "Haiti",
        "code": "HTI"
      },
      {
        "name": "Honduras",
        "code": "HND"
      },
      {
        "name": "Hong Kong SAR, China",
        "code": "HKG"
      },
      {
        "name": "Hungary",
        "code": "HUN"
      },
      {
        "name": "Iceland",
        "code": "ISL"
      },
      {
        "name": "India",
        "code": "IND"
      },
      {
        "name": "Indonesia",
        "code": "IDN"
      },
      {
        "name": "Iran, Islamic Rep.",
        "code": "IRN"
      },
      {
        "name": "Iraq",
        "code": "IRQ"
      },
      {
        "name": "Ireland",
        "code": "IRL"
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
        "name": "Jordan",
        "code": "JOR"
      },
      {
        "name": "Kazakhstan",
        "code": "KAZ"
      },
      {
        "name": "Kenya",
        "code": "KEN"
      },
      {
        "name": "Kiribati",
        "code": "KIR"
      },
      {
        "name": "Korea, Rep.",
        "code": "KOR"
      },
      {
        "name": "Kosovo",
        "code": "XKX"
      },
      {
        "name": "Kuwait",
        "code": "KWT"
      },
      {
        "name": "Kyrgyz Republic",
        "code": "KGZ"
      },
      {
        "name": "Lao PDR",
        "code": "LAO"
      },
      {
        "name": "Latvia",
        "code": "LVA"
      },
      {
        "name": "Lebanon",
        "code": "LBN"
      },
      {
        "name": "Lesotho",
        "code": "LSO"
      },
      {
        "name": "Liberia",
        "code": "LBR"
      },
      {
        "name": "Libya",
        "code": "LBY"
      },
      {
        "name": "Lithuania",
        "code": "LTU"
      },
      {
        "name": "Luxembourg",
        "code": "LUX"
      },
      {
        "name": "Macao SAR, China",
        "code": "MAC"
      },
      {
        "name": "Madagascar",
        "code": "MDG"
      },
      {
        "name": "Malawi",
        "code": "MWI"
      },
      {
        "name": "Malaysia",
        "code": "MYS"
      },
      {
        "name": "Maldives",
        "code": "MDV"
      },
      {
        "name": "Mali",
        "code": "MLI"
      },
      {
        "name": "Malta",
        "code": "MLT"
      },
      {
        "name": "Marshall Islands",
        "code": "MHL"
      },
      {
        "name": "Mauritania",
        "code": "MRT"
      },
      {
        "name": "Mauritius",
        "code": "MUS"
      },
      {
        "name": "Mexico",
        "code": "MEX"
      },
      {
        "name": "Micronesia, Fed. Sts.",
        "code": "FSM"
      },
      {
        "name": "Moldova",
        "code": "MDA"
      },
      {
        "name": "Mongolia",
        "code": "MNG"
      },
      {
        "name": "Montenegro",
        "code": "MNE"
      },
      {
        "name": "Morocco",
        "code": "MAR"
      },
      {
        "name": "Mozambique",
        "code": "MOZ"
      },
      {
        "name": "Myanmar",
        "code": "MMR"
      },
      {
        "name": "Namibia",
        "code": "NAM"
      },
      {
        "name": "Nauru",
        "code": "NRU"
      },
      {
        "name": "Nepal",
        "code": "NPL"
      },
      {
        "name": "Netherlands",
        "code": "NLD"
      },
      {
        "name": "New Zealand",
        "code": "NZL"
      },
      {
        "name": "Nicaragua",
        "code": "NIC"
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
        "name": "North Macedonia",
        "code": "MKD"
      },
      {
        "name": "Norway",
        "code": "NOR"
      },
      {
        "name": "Oman",
        "code": "OMN"
      },
      {
        "name": "Pakistan",
        "code": "PAK"
      },
      {
        "name": "Palau",
        "code": "PLW"
      },
      {
        "name": "Panama",
        "code": "PAN"
      },
      {
        "name": "Papua New Guinea",
        "code": "PNG"
      },
      {
        "name": "Paraguay",
        "code": "PRY"
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
        "name": "Poland",
        "code": "POL"
      },
      {
        "name": "Portugal",
        "code": "PRT"
      },
      {
        "name": "Puerto Rico",
        "code": "PRI"
      },
      {
        "name": "Qatar",
        "code": "QAT"
      },
      {
        "name": "Romania",
        "code": "ROU"
      },
      {
        "name": "Russian Federation",
        "code": "RUS"
      },
      {
        "name": "Rwanda",
        "code": "RWA"
      },
      {
        "name": "Samoa",
        "code": "WSM"
      },
      {
        "name": "San Marino",
        "code": "SMR"
      },
      {
        "name": "Sao Tome and Principe",
        "code": "STP"
      },
      {
        "name": "Saudi Arabia",
        "code": "SAU"
      },
      {
        "name": "Senegal",
        "code": "SEN"
      },
      {
        "name": "Serbia",
        "code": "SRB"
      },
      {
        "name": "Seychelles",
        "code": "SYC"
      },
      {
        "name": "Sierra Leone",
        "code": "SLE"
      },
      {
        "name": "Singapore",
        "code": "SGP"
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
        "name": "Solomon Islands",
        "code": "SLB"
      },
      {
        "name": "Somalia",
        "code": "SOM"
      },
      {
        "name": "South Africa",
        "code": "ZAF"
      },
      {
        "name": "South Sudan",
        "code": "SSD"
      },
      {
        "name": "Spain",
        "code": "ESP"
      },
      {
        "name": "Sri Lanka",
        "code": "LKA"
      },
      {
        "name": "St. Kitts and Nevis",
        "code": "KNA"
      },
      {
        "name": "St. Lucia",
        "code": "LCA"
      },
      {
        "name": "St. Vincent and the Grenadines",
        "code": "VCT"
      },
      {
        "name": "Sudan",
        "code": "SDN"
      },
      {
        "name": "Suriname",
        "code": "SUR"
      },
      {
        "name": "Sweden",
        "code": "SWE"
      },
      {
        "name": "Switzerland",
        "code": "CHE"
      },
      {
        "name": "Syrian Arab Republic",
        "code": "SYR"
      },
      {
        "name": "Taiwan, China",
        "code": "TWN"
      },
      {
        "name": "Tajikistan",
        "code": "TJK"
      },
      {
        "name": "Tanzania",
        "code": "TZA"
      },
      {
        "name": "Thailand",
        "code": "THA"
      },
      {
        "name": "Timor-Leste",
        "code": "TLS"
      },
      {
        "name": "Togo",
        "code": "TGO"
      },
      {
        "name": "Tonga",
        "code": "TON"
      },
      {
        "name": "Trinidad and Tobago",
        "code": "TTO"
      },
      {
        "name": "Tunisia",
        "code": "TUN"
      },
      {
        "name": "Turkiye",
        "code": "TUR"
      },
      {
        "name": "Turkmenistan",
        "code": "TKM"
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
        "name": "Ukraine",
        "code": "UKR"
      },
      {
        "name": "United Arab Emirates",
        "code": "ARE"
      },
      {
        "name": "United Kingdom",
        "code": "GBR"
      },
      {
        "name": "United States",
        "code": "USA"
      },
      {
        "name": "Uruguay",
        "code": "URY"
      },
      {
        "name": "Uzbekistan",
        "code": "UZB"
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
        "name": "Viet Nam",
        "code": "VNM"
      },
      {
        "name": "West Bank and Gaza",
        "code": "PSE"
      },
      {
        "name": "Yemen, Rep.",
        "code": "YEM"
      },
      {
        "name": "Zambia",
        "code": "ZMB"
      },
      {
        "name": "Zimbabwe",
        "code": "ZWE"
      }
    ],
    "geographic_units": [],
    "aggregation_method_references": [],
    "license": [
      {
        "name": "License Specified Externally",
        "uri": "https://www.imf.org/external/terms.htm",
        "note": "This material is being redistributed with the express permission of the copyright holder."
      }
    ],
    "links": [
      {
        "type": "website",
        "description": "World Economic Outlook",
        "uri": "https://www.imf.org/en/publications/weo",
        "image_uri": null
      }
    ],
    "api_documentation": [],
    "sources": [
      {
        "idno": null,
        "type": null,
        "name": "World Economic Outlook",
        "organization": "International Monetary Fund (IMF)",
        "publisher": null,
        "publication_date": null,
        "uri": "https://www.imf.org/en/publications/weo",
        "access_date": null,
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
        "ABW",
        "AFG",
        "AGO",
        "ALB",
        "AND",
        "ARE",
        "ARG",
        "ARM",
        "ATG",
        "AUS",
        "AUT",
        "AZE",
        "BDI",
        "BEL",
        "BEN",
        "BFA",
        "BGD",
        "BGR",
        "BHR",
        "BHS",
        "BIH",
        "BLR",
        "BLZ",
        "BOL",
        "BRA",
        "BRB",
        "BRN",
        "BTN",
        "BWA",
        "CAF",
        "CAN",
        "CHE",
        "CHL",
        "CHN",
        "CIV",
        "CMR",
        "COD",
        "COG",
        "COL",
        "COM",
        "CPV",
        "CRI",
        "CYP",
        "CZE",
        "DEU",
        "DJI",
        "DMA",
        "DNK",
        "DOM",
        "DZA",
        "ECU",
        "EGY",
        "ERI",
        "ESP",
        "EST",
        "ETH",
        "FIN",
        "FJI",
        "FRA",
        "FSM",
        "GAB",
        "GBR",
        "GEO",
        "GHA",
        "GIN",
        "GMB",
        "GNB",
        "GNQ",
        "GRC",
        "GRD",
        "GTM",
        "GUY",
        "HKG",
        "HND",
        "HRV",
        "HTI",
        "HUN",
        "IDN",
        "IND",
        "IRL",
        "IRN",
        "IRQ",
        "ISL",
        "ISR",
        "ITA",
        "JAM",
        "JOR",
        "JPN",
        "KAZ",
        "KEN",
        "KGZ",
        "KHM",
        "KIR",
        "KNA",
        "KOR",
        "KWT",
        "LAO",
        "LBN",
        "LBR",
        "LBY",
        "LCA",
        "LKA",
        "LSO",
        "LTU",
        "LUX",
        "LVA",
        "MAC",
        "MAR",
        "MDA",
        "MDG",
        "MDV",
        "MEX",
        "MHL",
        "MKD",
        "MLI",
        "MLT",
        "MMR",
        "MNE",
        "MNG",
        "MOZ",
        "MRT",
        "MUS",
        "MWI",
        "MYS",
        "NAM",
        "NER",
        "NGA",
        "NIC",
        "NLD",
        "NOR",
        "NPL",
        "NRU",
        "NZL",
        "OMN",
        "PAK",
        "PAN",
        "PER",
        "PHL",
        "PLW",
        "PNG",
        "POL",
        "PRI",
        "PRT",
        "PRY",
        "PSE",
        "QAT",
        "ROU",
        "RUS",
        "RWA",
        "SAU",
        "SDN",
        "SEN",
        "SGP",
        "SLB",
        "SLE",
        "SLV",
        "SMR",
        "SOM",
        "SRB",
        "SSD",
        "STP",
        "SUR",
        "SVK",
        "SVN",
        "SWE",
        "SWZ",
        "SYC",
        "SYR",
        "TCD",
        "TGO",
        "THA",
        "TJK",
        "TKM",
        "TLS",
        "TON",
        "TTO",
        "TUN",
        "TUR",
        "TUV",
        "TWN",
        "TZA",
        "UGA",
        "UKR",
        "URY",
        "USA",
        "UZB",
        "VCT",
        "VEN",
        "VNM",
        "VUT",
        "WSM",
        "XKX",
        "YEM",
        "ZAF",
        "ZMB",
        "ZWE"
      ]
    },
    {
      "field_name": "INDICATOR",
      "label_name": "Statistical indicator",
      "field_value": [
        "IMF_WEO_NGDP_RPCH"
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
        "PC"
      ]
    },
    {
      "field_name": "TIME_PERIOD",
      "label_name": "Time period",
      "field_value": [
        "1980",
        "1981",
        "1982",
        "1983",
        "1984",
        "1985",
        "1986",
        "1987",
        "1988",
        "1989",
        "1990",
        "1991",
        "1992",
        "1993",
        "1994",
        "1995",
        "1996",
        "1997",
        "1998",
        "1999",
        "2000",
        "2001",
        "2002",
        "2003",
        "2004",
        "2005",
        "2006",
        "2007",
        "2008",
        "2009",
        "2010",
        "2011",
        "2012",
        "2013",
        "2014",
        "2015",
        "2016",
        "2017",
        "2018",
        "2019",
        "2020",
        "2021",
        "2022",
        "2023",
        "2024",
        "2025",
        "2026",
        "2027",
        "2028",
        "2029"
      ]
    }
  ],
  "error": null
}
```

**8. data360_get_metadata**
```json
{
  "database_id": "IMF_WEO",
  "indicator_id": "IMF_WEO_NGDPRPC"
}
```
**Result:**
```json
{
  "indicator_metadata": {
    "idno": "IMF_WEO_NGDPRPC",
    "doi": null,
    "name": "Gross domestic product per capita, constant prices, National currency, Units",
    "display_name": null,
    "database_id": "IMF_WEO",
    "database_name": "World Economic Outlook (WEO)",
    "date_last_update": null,
    "date_released": null,
    "measurement_unit": "Domestic currency, constant prices",
    "release_calendar": "Annual",
    "periodicity": "Annual",
    "base_period": null,
    "definition_short": "Gross domestic product per capita, constant prices, National currency",
    "definition_long": "GDP is expressed in constant national currency per person. Data are derived by dividing constant price GDP by total population.",
    "statistical_concept": null,
    "methodology": "The IMF's World Economic Outlook uses a \"bottom-up\" approach in producing its forecasts; that is, country teams within the IMF generate projections for individual countries. These are then aggregated, and through a series of iterations where the aggregates feed back into individual countries' forecasts, forecasts converge to the projections reported in the WEO.\n\nBecause forecasts are made by the individual country teams, the methodology can vary from country to country and series to series depending on many factors. To get more information on a specific country and series forecast, you may contact the country teams directly; from the Countries tab on the IMF website. (From: https://www.imf.org/en/Publications/WEO/frequently-asked-questions#:~:text=%2Ddatabase%2FDisclaimer.-,Q.,generate%20projections%20for%20individual%20countries.)",
    "derivation": null,
    "imputation": null,
    "missing": null,
    "quality_checks": null,
    "quality_note": null,
    "sources_discrepancies": null,
    "series_break": null,
    "limitation": null,
    "relevance": null,
    "aggregation_method": null,
    "disaggregation": null,
    "confidentiality": null,
    "confidentiality_status": "PU",
    "confidentiality_note": null,
    "citation_requirement": null,
    "sources_note": null,
    "acknowledgement_statement": null,
    "disclaimer": null,
    "economies_count": null,
    "csv_link": "https://data360files.worldbank.org/data360-data/data/IMF_WEO/IMF_WEO_NGDPRPC.csv",
    "excel_link": null,
    "json_link": "https://data360files.worldbank.org/data360-data/metadata/IMF_WEO/IMF_WEO_NGDPRPC.json",
    "api_link": "https://data360api.worldbank.org/data360/data?top=1000&skip=0&DATABASE_ID=IMF_WEO&INDICATOR=IMF_WEO_NGDPRPC",
    "indicator_count": null,
    "apiservice_link": null,
    "api_explorer_link": "http://datacatalog.worldbank.org/data360/api/execute?tab=Data&id=1&DATABASE_ID=IMF_WEO&INDICATOR=IMF_WEO_NGDPRPC",
    "authoring_entity": [
      {
        "name": "International Monetary Fund",
        "affiliation": null,
        "abbreviation": "IMF",
        "email": "publicaffairs@imf.org",
        "uri": "https://www.imf.org/"
      }
    ],
    "version_statement": {
      "version": null,
      "version_date": "2025-10-14",
      "version_resp": null,
      "version_notes": null
    },
    "aliases": [],
    "alternate_identifiers": [],
    "languages": [
      {
        "name": "English",
        "code": "EN"
      }
    ],
    "dimensions": [
      {
        "name": null,
        "label": "Geographic area",
        "description": "Country/economy, Region"
      }
    ],
    "definition_references": [
      {
        "source": "International Monetary Fund",
        "uri": "https://www.imf.org/en/publications/weo",
        "note": null
      }
    ],
    "statistical_concept_references": [],
    "methodology_references": [],
    "derivation_references": [],
    "imputation_references": [],
    "topics": [
      {
        "id": "P3",
        "name": "Prosperity",
        "parent_id": null,
        "vocabulary": "WB Practice Groups",
        "uri": null
      },
      {
        "id": "P3_000001",
        "name": "Economic Policy",
        "parent_id": "P3",
        "vocabulary": "Data360 Topic L1",
        "uri": null
      },
      {
        "id": "P3_000007",
        "name": "Growth and Jobs",
        "parent_id": "P3_000001",
        "vocabulary": "Data360 Topic L2",
        "uri": null
      }
    ],
    "time_periods": [
      {
        "start": "1980",
        "end": "2029",
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
        "name": "Algeria",
        "code": "DZA"
      },
      {
        "name": "Andorra",
        "code": "AND"
      },
      {
        "name": "Angola",
        "code": "AGO"
      },
      {
        "name": "Antigua and Barbuda",
        "code": "ATG"
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
        "name": "Aruba",
        "code": "ABW"
      },
      {
        "name": "Australia",
        "code": "AUS"
      },
      {
        "name": "Austria",
        "code": "AUT"
      },
      {
        "name": "Azerbaijan",
        "code": "AZE"
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
        "name": "Bangladesh",
        "code": "BGD"
      },
      {
        "name": "Barbados",
        "code": "BRB"
      },
      {
        "name": "Belarus",
        "code": "BLR"
      },
      {
        "name": "Belgium",
        "code": "BEL"
      },
      {
        "name": "Belize",
        "code": "BLZ"
      },
      {
        "name": "Benin",
        "code": "BEN"
      },
      {
        "name": "Bhutan",
        "code": "BTN"
      },
      {
        "name": "Bolivia",
        "code": "BOL"
      },
      {
        "name": "Bosnia and Herzegovina",
        "code": "BIH"
      },
      {
        "name": "Botswana",
        "code": "BWA"
      },
      {
        "name": "Brazil",
        "code": "BRA"
      },
      {
        "name": "Brunei Darussalam",
        "code": "BRN"
      },
      {
        "name": "Bulgaria",
        "code": "BGR"
      },
      {
        "name": "Burkina Faso",
        "code": "BFA"
      },
      {
        "name": "Burundi",
        "code": "BDI"
      },
      {
        "name": "Cabo Verde",
        "code": "CPV"
      },
      {
        "name": "Cambodia",
        "code": "KHM"
      },
      {
        "name": "Cameroon",
        "code": "CMR"
      },
      {
        "name": "Canada",
        "code": "CAN"
      },
      {
        "name": "Central African Republic",
        "code": "CAF"
      },
      {
        "name": "Chad",
        "code": "TCD"
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
        "name": "Colombia",
        "code": "COL"
      },
      {
        "name": "Comoros",
        "code": "COM"
      },
      {
        "name": "Congo, Dem. Rep.",
        "code": "COD"
      },
      {
        "name": "Congo, Rep.",
        "code": "COG"
      },
      {
        "name": "Costa Rica",
        "code": "CRI"
      },
      {
        "name": "Cote d'Ivoire",
        "code": "CIV"
      },
      {
        "name": "Croatia",
        "code": "HRV"
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
        "name": "Djibouti",
        "code": "DJI"
      },
      {
        "name": "Dominica",
        "code": "DMA"
      },
      {
        "name": "Dominican Republic",
        "code": "DOM"
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
        "name": "El Salvador",
        "code": "SLV"
      },
      {
        "name": "Equatorial Guinea",
        "code": "GNQ"
      },
      {
        "name": "Eritrea",
        "code": "ERI"
      },
      {
        "name": "Estonia",
        "code": "EST"
      },
      {
        "name": "Eswatini",
        "code": "SWZ"
      },
      {
        "name": "Ethiopia",
        "code": "ETH"
      },
      {
        "name": "Fiji",
        "code": "FJI"
      },
      {
        "name": "Finland",
        "code": "FIN"
      },
      {
        "name": "France",
        "code": "FRA"
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
        "name": "Georgia",
        "code": "GEO"
      },
      {
        "name": "Germany",
        "code": "DEU"
      },
      {
        "name": "Ghana",
        "code": "GHA"
      },
      {
        "name": "Greece",
        "code": "GRC"
      },
      {
        "name": "Grenada",
        "code": "GRD"
      },
      {
        "name": "Guatemala",
        "code": "GTM"
      },
      {
        "name": "Guinea",
        "code": "GIN"
      },
      {
        "name": "Guinea-Bissau",
        "code": "GNB"
      },
      {
        "name": "Guyana",
        "code": "GUY"
      },
      {
        "name": "Haiti",
        "code": "HTI"
      },
      {
        "name": "Honduras",
        "code": "HND"
      },
      {
        "name": "Hong Kong SAR, China",
        "code": "HKG"
      },
      {
        "name": "Hungary",
        "code": "HUN"
      },
      {
        "name": "Iceland",
        "code": "ISL"
      },
      {
        "name": "India",
        "code": "IND"
      },
      {
        "name": "Indonesia",
        "code": "IDN"
      },
      {
        "name": "Iran, Islamic Rep.",
        "code": "IRN"
      },
      {
        "name": "Iraq",
        "code": "IRQ"
      },
      {
        "name": "Ireland",
        "code": "IRL"
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
        "name": "Jordan",
        "code": "JOR"
      },
      {
        "name": "Kazakhstan",
        "code": "KAZ"
      },
      {
        "name": "Kenya",
        "code": "KEN"
      },
      {
        "name": "Kiribati",
        "code": "KIR"
      },
      {
        "name": "Korea, Rep.",
        "code": "KOR"
      },
      {
        "name": "Kosovo",
        "code": "XKX"
      },
      {
        "name": "Kuwait",
        "code": "KWT"
      },
      {
        "name": "Kyrgyz Republic",
        "code": "KGZ"
      },
      {
        "name": "Lao PDR",
        "code": "LAO"
      },
      {
        "name": "Latvia",
        "code": "LVA"
      },
      {
        "name": "Lebanon",
        "code": "LBN"
      },
      {
        "name": "Lesotho",
        "code": "LSO"
      },
      {
        "name": "Liberia",
        "code": "LBR"
      },
      {
        "name": "Libya",
        "code": "LBY"
      },
      {
        "name": "Lithuania",
        "code": "LTU"
      },
      {
        "name": "Luxembourg",
        "code": "LUX"
      },
      {
        "name": "Macao SAR, China",
        "code": "MAC"
      },
      {
        "name": "Madagascar",
        "code": "MDG"
      },
      {
        "name": "Malawi",
        "code": "MWI"
      },
      {
        "name": "Malaysia",
        "code": "MYS"
      },
      {
        "name": "Maldives",
        "code": "MDV"
      },
      {
        "name": "Mali",
        "code": "MLI"
      },
      {
        "name": "Malta",
        "code": "MLT"
      },
      {
        "name": "Marshall Islands",
        "code": "MHL"
      },
      {
        "name": "Mauritania",
        "code": "MRT"
      },
      {
        "name": "Mauritius",
        "code": "MUS"
      },
      {
        "name": "Mexico",
        "code": "MEX"
      },
      {
        "name": "Micronesia, Fed. Sts.",
        "code": "FSM"
      },
      {
        "name": "Moldova",
        "code": "MDA"
      },
      {
        "name": "Mongolia",
        "code": "MNG"
      },
      {
        "name": "Montenegro",
        "code": "MNE"
      },
      {
        "name": "Morocco",
        "code": "MAR"
      },
      {
        "name": "Mozambique",
        "code": "MOZ"
      },
      {
        "name": "Myanmar",
        "code": "MMR"
      },
      {
        "name": "Namibia",
        "code": "NAM"
      },
      {
        "name": "Nauru",
        "code": "NRU"
      },
      {
        "name": "Nepal",
        "code": "NPL"
      },
      {
        "name": "Netherlands",
        "code": "NLD"
      },
      {
        "name": "New Zealand",
        "code": "NZL"
      },
      {
        "name": "Nicaragua",
        "code": "NIC"
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
        "name": "North Macedonia",
        "code": "MKD"
      },
      {
        "name": "Norway",
        "code": "NOR"
      },
      {
        "name": "Oman",
        "code": "OMN"
      },
      {
        "name": "Pakistan",
        "code": "PAK"
      },
      {
        "name": "Palau",
        "code": "PLW"
      },
      {
        "name": "Panama",
        "code": "PAN"
      },
      {
        "name": "Papua New Guinea",
        "code": "PNG"
      },
      {
        "name": "Paraguay",
        "code": "PRY"
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
        "name": "Poland",
        "code": "POL"
      },
      {
        "name": "Portugal",
        "code": "PRT"
      },
      {
        "name": "Puerto Rico",
        "code": "PRI"
      },
      {
        "name": "Qatar",
        "code": "QAT"
      },
      {
        "name": "Romania",
        "code": "ROU"
      },
      {
        "name": "Russian Federation",
        "code": "RUS"
      },
      {
        "name": "Rwanda",
        "code": "RWA"
      },
      {
        "name": "Samoa",
        "code": "WSM"
      },
      {
        "name": "San Marino",
        "code": "SMR"
      },
      {
        "name": "Sao Tome and Principe",
        "code": "STP"
      },
      {
        "name": "Saudi Arabia",
        "code": "SAU"
      },
      {
        "name": "Senegal",
        "code": "SEN"
      },
      {
        "name": "Serbia",
        "code": "SRB"
      },
      {
        "name": "Seychelles",
        "code": "SYC"
      },
      {
        "name": "Sierra Leone",
        "code": "SLE"
      },
      {
        "name": "Singapore",
        "code": "SGP"
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
        "name": "Solomon Islands",
        "code": "SLB"
      },
      {
        "name": "Somalia",
        "code": "SOM"
      },
      {
        "name": "South Africa",
        "code": "ZAF"
      },
      {
        "name": "South Sudan",
        "code": "SSD"
      },
      {
        "name": "Spain",
        "code": "ESP"
      },
      {
        "name": "Sri Lanka",
        "code": "LKA"
      },
      {
        "name": "St. Kitts and Nevis",
        "code": "KNA"
      },
      {
        "name": "St. Lucia",
        "code": "LCA"
      },
      {
        "name": "St. Vincent and the Grenadines",
        "code": "VCT"
      },
      {
        "name": "Sudan",
        "code": "SDN"
      },
      {
        "name": "Suriname",
        "code": "SUR"
      },
      {
        "name": "Sweden",
        "code": "SWE"
      },
      {
        "name": "Switzerland",
        "code": "CHE"
      },
      {
        "name": "Syrian Arab Republic",
        "code": "SYR"
      },
      {
        "name": "Taiwan, China",
        "code": "TWN"
      },
      {
        "name": "Tajikistan",
        "code": "TJK"
      },
      {
        "name": "Tanzania",
        "code": "TZA"
      },
      {
        "name": "Thailand",
        "code": "THA"
      },
      {
        "name": "Timor-Leste",
        "code": "TLS"
      },
      {
        "name": "Togo",
        "code": "TGO"
      },
      {
        "name": "Tonga",
        "code": "TON"
      },
      {
        "name": "Trinidad and Tobago",
        "code": "TTO"
      },
      {
        "name": "Tunisia",
        "code": "TUN"
      },
      {
        "name": "Turkiye",
        "code": "TUR"
      },
      {
        "name": "Turkmenistan",
        "code": "TKM"
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
        "name": "Ukraine",
        "code": "UKR"
      },
      {
        "name": "United Arab Emirates",
        "code": "ARE"
      },
      {
        "name": "United Kingdom",
        "code": "GBR"
      },
      {
        "name": "United States",
        "code": "USA"
      },
      {
        "name": "Uruguay",
        "code": "URY"
      },
      {
        "name": "Uzbekistan",
        "code": "UZB"
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
        "name": "Viet Nam",
        "code": "VNM"
      },
      {
        "name": "West Bank and Gaza",
        "code": "PSE"
      },
      {
        "name": "Yemen, Rep.",
        "code": "YEM"
      },
      {
        "name": "Zambia",
        "code": "ZMB"
      },
      {
        "name": "Zimbabwe",
        "code": "ZWE"
      }
    ],
    "geographic_units": [],
    "aggregation_method_references": [],
    "license": [
      {
        "name": "License Specified Externally",
        "uri": "https://www.imf.org/external/terms.htm",
        "note": "This material is being redistributed with the express permission of the copyright holder."
      }
    ],
    "links": [
      {
        "type": "website",
        "description": "World Economic Outlook",
        "uri": "https://www.imf.org/en/publications/weo",
        "image_uri": null
      }
    ],
    "api_documentation": [],
    "sources": [
      {
        "idno": null,
        "type": null,
        "name": "World Economic Outlook",
        "organization": "International Monetary Fund (IMF)",
        "publisher": null,
        "publication_date": null,
        "uri": "https://www.imf.org/en/publications/weo",
        "access_date": null,
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
        "ABW",
        "AFG",
        "AGO",
        "ALB",
        "AND",
        "ARE",
        "ARG",
        "ARM",
        "ATG",
        "AUS",
        "AUT",
        "AZE",
        "BDI",
        "BEL",
        "BEN",
        "BFA",
        "BGD",
        "BGR",
        "BHR",
        "BHS",
        "BIH",
        "BLR",
        "BLZ",
        "BOL",
        "BRA",
        "BRB",
        "BRN",
        "BTN",
        "BWA",
        "CAF",
        "CAN",
        "CHE",
        "CHL",
        "CHN",
        "CIV",
        "CMR",
        "COD",
        "COG",
        "COL",
        "COM",
        "CPV",
        "CRI",
        "CYP",
        "CZE",
        "DEU",
        "DJI",
        "DMA",
        "DNK",
        "DOM",
        "DZA",
        "ECU",
        "EGY",
        "ERI",
        "ESP",
        "EST",
        "ETH",
        "FIN",
        "FJI",
        "FRA",
        "FSM",
        "GAB",
        "GBR",
        "GEO",
        "GHA",
        "GIN",
        "GMB",
        "GNB",
        "GNQ",
        "GRC",
        "GRD",
        "GTM",
        "GUY",
        "HKG",
        "HND",
        "HRV",
        "HTI",
        "HUN",
        "IDN",
        "IND",
        "IRL",
        "IRN",
        "IRQ",
        "ISL",
        "ISR",
        "ITA",
        "JAM",
        "JOR",
        "JPN",
        "KAZ",
        "KEN",
        "KGZ",
        "KHM",
        "KIR",
        "KNA",
        "KOR",
        "KWT",
        "LAO",
        "LBN",
        "LBR",
        "LBY",
        "LCA",
        "LKA",
        "LSO",
        "LTU",
        "LUX",
        "LVA",
        "MAC",
        "MAR",
        "MDA",
        "MDG",
        "MDV",
        "MEX",
        "MHL",
        "MKD",
        "MLI",
        "MLT",
        "MMR",
        "MNE",
        "MNG",
        "MOZ",
        "MRT",
        "MUS",
        "MWI",
        "MYS",
        "NAM",
        "NER",
        "NGA",
        "NIC",
        "NLD",
        "NOR",
        "NPL",
        "NRU",
        "NZL",
        "OMN",
        "PAK",
        "PAN",
        "PER",
        "PHL",
        "PLW",
        "PNG",
        "POL",
        "PRI",
        "PRT",
        "PRY",
        "PSE",
        "QAT",
        "ROU",
        "RUS",
        "RWA",
        "SAU",
        "SDN",
        "SEN",
        "SGP",
        "SLB",
        "SLE",
        "SLV",
        "SMR",
        "SOM",
        "SRB",
        "SSD",
        "STP",
        "SUR",
        "SVK",
        "SVN",
        "SWE",
        "SWZ",
        "SYC",
        "SYR",
        "TCD",
        "TGO",
        "THA",
        "TJK",
        "TKM",
        "TLS",
        "TON",
        "TTO",
        "TUN",
        "TUR",
        "TUV",
        "TWN",
        "TZA",
        "UGA",
        "UKR",
        "URY",
        "USA",
        "UZB",
        "VCT",
        "VEN",
        "VNM",
        "VUT",
        "WSM",
        "XKX",
        "YEM",
        "ZAF",
        "ZMB",
        "ZWE"
      ]
    },
    {
      "field_name": "INDICATOR",
      "label_name": "Statistical indicator",
      "field_value": [
        "IMF_WEO_NGDPRPC"
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
        "XDC_K"
      ]
    },
    {
      "field_name": "TIME_PERIOD",
      "label_name": "Time period",
      "field_value": [
        "1980",
        "1981",
        "1982",
        "1983",
        "1984",
        "1985",
        "1986",
        "1987",
        "1988",
        "1989",
        "1990",
        "1991",
        "1992",
        "1993",
        "1994",
        "1995",
        "1996",
        "1997",
        "1998",
        "1999",
        "2000",
        "2001",
        "2002",
        "2003",
        "2004",
        "2005",
        "2006",
        "2007",
        "2008",
        "2009",
        "2010",
        "2011",
        "2012",
        "2013",
        "2014",
        "2015",
        "2016",
        "2017",
        "2018",
        "2019",
        "2020",
        "2021",
        "2022",
        "2023",
        "2024",
        "2025",
        "2026",
        "2027",
        "2028",
        "2029"
      ]
    }
  ],
  "error": null
}
```

</details>


### 👤 User (Turn 3)

Could you now provide a comparison table of Kenya's and Tanzania's GDP (current US$) for the years 2019 to 2024?

### 🤖 Assistant

**Data:** Comparison of Kenya and Tanzania — GDP (current US$), 2019–2024  
Indicator: **GDP (current US$)** — Data360 ID `WB_WDI_NY_GDP_MKTP_CD` (World Development Indicators)

_All values are in current US dollars; 2024 is the latest available year and may be provisional._

| Year | Kenya GDP (current US$) | Tanzania GDP (current US$) |
|------|-------------------------|----------------------------|
| 2024 | <span title="verified claim">✅ 120,339,557,905.93</span> | <span title="verified claim">✅ 78,844,405,385.22</span> |
| 2023 | <span title="verified claim">✅ 107,500,884,685.01</span> | <span title="verified claim">✅ 79,030,935,627.08</span> |
| 2022 | <span title="verified claim">✅ 114,448,978,152.64</span> | <span title="verified claim">✅ 75,749,121,842.91</span> |
| 2021 | <span title="verified claim">✅ 109,703,658,904.99</span> | <span title="verified claim">✅ 70,655,628,147.90</span> |
| 2020 | <span title="verified claim">✅ 100,657,505,750.55</span> | <span title="verified claim">✅ 66,068,737,786.06</span> |
| 2019 | <span title="verified claim">✅ 100,378,436,207.37</span> | <span title="verified claim">✅ 61,026,731,925.92</span> |

**Analysis (concise):**

- Over 2019–2024, **Kenya’s nominal GDP** is consistently larger than Tanzania’s, rising from about <span title="verified claim">✅ 100,378,436,207.37</span> US$ in 2019 to about <span title="verified claim">✅ 120,339,557,905.93</span> US$ in 2024.  
- **Tanzania’s nominal GDP** increases from about <span title="verified claim">✅ 61,026,731,925.92</span> US$ in 2019 to about <span title="verified claim">✅ 78,844,405,385.22</span> US$ in 2024.  
- Both economies show steady nominal growth, with a visible COVID‑period slowdown in 2020 for each.

**Sources:**

- **World Bank — World Development Indicators (WB_WDI)** — *GDP (current US$)* (`NY.GDP.MKTP.CD`, Data360 ID `WB_WDI_NY_GDP_MKTP_CD`) — national accounts, SNA 2008/1993, gap‑filled total.

**Suggested follow-ups:**

1. Could you compute and compare **annual nominal GDP growth rates** for Kenya and Tanzania over 2019–2024?  
2. Can you provide **GDP per capita (current and constant US$)** for Kenya and Tanzania over the same period?  
3. Could you help me build a **panel including Uganda, Rwanda, and Ethiopia** for GDP and GDP per capita for my East Africa thesis?

---
<details>
<summary>📋 <b>Tool Calls</b> (click to expand)</summary>

**1. data360_search_indicators**
```json
{
  "query": "GDP (current US$)",
  "required_country": "Kenya, Tanzania",
  "limit": 10
}
```
**Result:**
```json
{
  "count": 10,
  "total_count": 1716,
  "offset": 0,
  "has_more": true,
  "next_offset": 10,
  "indicators": [
    {
      "idno": "WB_WDI_NY_GDP_MKTP_CD",
      "database_id": "WB_WDI",
      "name": "GDP (current US$)",
      "truncated_definition": "Gross domestic product is the total income earned through the production of goods and services in an",
      "periodicity": "Annual",
      "latest_data": "2024",
      "time_period_range": "1960-2024",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_WDI_NY_GDP_PCAP_CD",
      "database_id": "WB_WDI",
      "name": "GDP per capita (current US$)",
      "truncated_definition": "Gross domestic product is the total income earned through the production of goods and services in an",
      "periodicity": "Annual",
      "latest_data": "2024",
      "time_period_range": "1960-2024",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_GS_NY_GDP_PCAP_CD",
      "database_id": "WB_GS",
      "name": "GDP per capita (current US$)",
      "truncated_definition": "GDP per capita is gross domestic product divided by midyear population. GDP is the sum of gross valu",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_GS_NY_GDP_MKTP_CD",
      "database_id": "WB_GS",
      "name": "GDP (current US$)",
      "truncated_definition": "GDP at purchaser's prices is the sum of gross value added by all resident producers in the economy p",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_HNP_SH_XPD_CHEX_PC_CD",
      "database_id": "WB_HNP",
      "name": "Current health expenditure per capita (current US$)",
      "truncated_definition": "Current expenditures on health per capita in current US dollars. Estimates of current health expendi",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_GS_NY_GDP_PCAP_KD",
      "database_id": "WB_GS",
      "name": "GDP per capita (constant 2010 US$)",
      "truncated_definition": "GDP per capita is gross domestic product divided by midyear population. GDP is the sum of gross valu",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_HCP_HEALTH_EXP",
      "database_id": "WB_HCP",
      "name": "Current health expenditure (% of GDP)",
      "truncated_definition": "Percentage of current expenditure in public health, calculated as a share of GDP.\nName in source: Cu",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "2000-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_HNP_SH_XPD_CHEX_GD_ZS",
      "database_id": "WB_HNP",
      "name": "Current health expenditure (% of GDP)",
      "truncated_definition": "Level of current health expenditure expressed as a percentage of GDP.  Estimates of current health e",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_HNP_SH_XPD_EHEX_PC_CD",
      "database_id": "WB_HNP",
      "name": "External health expenditure per capita (current US$)",
      "truncated_definition": "Current external expenditures on health per capita expressed in current US dollars. External sources",
      "periodicity": "Annual",
      "latest_data": "2023",
      "time_period_range": "1960-2023",
      "covers_country": true,
      "dimensions": null
    },
    {
      "idno": "WB_CLEAR_NY_GDP_MKTP_CD",
      "database_id": "WB_CLEAR",
      "name": "GDP (current US$)",
      "truncated_definition": "GDP at purchaser's prices is the sum of gross value added by all resident producers in the economy p",
      "periodicity": "Annual",
      "latest_data": "2022",
      "time_period_range": "1960-2022",
      "covers_country": true,
      "dimensions": null
    }
  ],
  "required_country": "KEN,TZA",
  "error": null
}
```

**2. data360_find_codelist_value**
```json
{
  "codelist_type": "REF_AREA",
  "query": "Kenya, Tanzania",
  "limit": 5
}
```
**Result:**
```json
[
  {
    "id": "KEN",
    "name": "Kenya",
    "score": 100
  },
  {
    "id": "TZA",
    "name": "Tanzania",
    "score": 100
  }
]
```

**3. data360_get_data**
```json
{
  "database_id": "WB_WDI",
  "indicator_id": "WB_WDI_NY_GDP_MKTP_CD",
  "disaggregation_filters": {
    "REF_AREA": "KEN,TZA"
  },
  "start_year": 2019,
  "end_year": 2024,
  "limit": 100
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
      "OBS_VALUE": "120339557905.93175",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "GDP (current US$)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": true,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_NY_GDP_MKTP_CD",
      "REF_AREA": "KEN",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2024",
      "FREQ": "A",
      "UNIT_MEASURE": "USD",
      "UNIT_TYPE": null,
      "claim_id": "d208b1ea"
    },
    {
      "OBS_VALUE": "78844405385.21951",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "GDP (current US$)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": true,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_NY_GDP_MKTP_CD",
      "REF_AREA": "TZA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2024",
      "FREQ": "A",
      "UNIT_MEASURE": "USD",
      "UNIT_TYPE": null,
      "claim_id": "aefbb0c2"
    },
    {
      "OBS_VALUE": "107500884685.01266",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "GDP (current US$)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_NY_GDP_MKTP_CD",
      "REF_AREA": "KEN",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2023",
      "FREQ": "A",
      "UNIT_MEASURE": "USD",
      "UNIT_TYPE": null,
      "claim_id": "b1f65494"
    },
    {
      "OBS_VALUE": "79030935627.07812",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "GDP (current US$)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_NY_GDP_MKTP_CD",
      "REF_AREA": "TZA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2023",
      "FREQ": "A",
      "UNIT_MEASURE": "USD",
      "UNIT_TYPE": null,
      "claim_id": "c0e51155"
    },
    {
      "OBS_VALUE": "114448978152.6374",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "GDP (current US$)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_NY_GDP_MKTP_CD",
      "REF_AREA": "KEN",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2022",
      "FREQ": "A",
      "UNIT_MEASURE": "USD",
      "UNIT_TYPE": null,
      "claim_id": "8bd985c3"
    },
    {
      "OBS_VALUE": "75749121842.91487",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "GDP (current US$)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_NY_GDP_MKTP_CD",
      "REF_AREA": "TZA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2022",
      "FREQ": "A",
      "UNIT_MEASURE": "USD",
      "UNIT_TYPE": null,
      "claim_id": "6fe8e48b"
    },
    {
      "OBS_VALUE": "70655628147.89859",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "GDP (current US$)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_NY_GDP_MKTP_CD",
      "REF_AREA": "TZA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2021",
      "FREQ": "A",
      "UNIT_MEASURE": "USD",
      "UNIT_TYPE": null,
      "claim_id": "3a872aeb"
    },
    {
      "OBS_VALUE": "109703658904.99373",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "GDP (current US$)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_NY_GDP_MKTP_CD",
      "REF_AREA": "KEN",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2021",
      "FREQ": "A",
      "UNIT_MEASURE": "USD",
      "UNIT_TYPE": null,
      "claim_id": "7b5b079c"
    },
    {
      "OBS_VALUE": "100657505750.545",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "GDP (current US$)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_NY_GDP_MKTP_CD",
      "REF_AREA": "KEN",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2020",
      "FREQ": "A",
      "UNIT_MEASURE": "USD",
      "UNIT_TYPE": null,
      "claim_id": "1913f17c"
    },
    {
      "OBS_VALUE": "66068737786.06392",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "GDP (current US$)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_NY_GDP_MKTP_CD",
      "REF_AREA": "TZA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2020",
      "FREQ": "A",
      "UNIT_MEASURE": "USD",
      "UNIT_TYPE": null,
      "claim_id": "49a55584"
    },
    {
      "OBS_VALUE": "100378436207.37134",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "GDP (current US$)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_NY_GDP_MKTP_CD",
      "REF_AREA": "KEN",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2019",
      "FREQ": "A",
      "UNIT_MEASURE": "USD",
      "UNIT_TYPE": null,
      "claim_id": "ea90df2e"
    },
    {
      "OBS_VALUE": "61026731925.92128",
      "TIME_FORMAT": "P1Y",
      "UNIT_MULT": 0,
      "COMMENT_OBS": null,
      "OBS_STATUS": "A",
      "OBS_CONF": "PU",
      "AGG_METHOD": "_Z",
      "DECIMALS": "2",
      "COMMENT_TS": "GDP (current US$)",
      "DATA_SOURCE": "WB_WDI",
      "LATEST_DATA": false,
      "DATABASE_ID": "WB_WDI",
      "INDICATOR": "WB_WDI_NY_GDP_MKTP_CD",
      "REF_AREA": "TZA",
      "SEX": "_T",
      "AGE": "_T",
      "URBANISATION": "_T",
      "COMP_BREAKDOWN_1": "_Z",
      "COMP_BREAKDOWN_2": "_Z",
      "COMP_BREAKDOWN_3": "_Z",
      "TIME_PERIOD": "2019",
      "FREQ": "A",
      "UNIT_MEASURE": "USD",
      "UNIT_TYPE": null,
      "claim_id": "844d7051"
    }
  ],
  "metadata": {
    "idno": "WB_WDI_NY_GDP_MKTP_CD",
    "name": "GDP (current US$)",
    "database_id": "WB_WDI",
    "measurement_unit": "current US$",
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
  "indicator_id": "WB_WDI_NY_GDP_MKTP_CD"
}
```
**Result:**
```json
{
  "indicator_metadata": {
    "idno": "WB_WDI_NY_GDP_MKTP_CD",
    "doi": null,
    "name": "GDP (current US$)",
    "display_name": null,
    "database_id": "WB_WDI",
    "database_name": "World Development Indicators (WDI)",
    "date_last_update": null,
    "date_released": null,
    "measurement_unit": "current US$",
    "release_calendar": null,
    "periodicity": "Annual",
    "base_period": null,
    "definition_short": null,
    "definition_long": "Gross domestic product is the total income earned through the production of goods and services in an economic territory during an accounting period. It can be measured in three different ways: using either the expenditure approach, the income approach, or the production approach. This indicator is expressed in current prices, meaning no adjustment has been made to account for price changes over time. This indicator is expressed in United States dollars.",
    "statistical_concept": "The conceptual elements of the SNA (System of National Accounts) measure what takes place in the economy, between which agents, and for what purpose. At the heart of the SNA is the production of goods and services. These may be used for consumption in the period to which the accounts relate or may be accumulated for use in a later period. In simple terms, the amount of value added generated by production represents GDP. The income corresponding to GDP is distributed to the various agents or groups of agents as income and it is the process of distributing and redistributing income that allows one agent to consume the goods and services produced by another agent or to acquire goods and services for later consumption. The way in which the SNA captures this pattern of economic flows is to identify the activities concerned by recognizing the institutional units in the economy and by specifying the structure of accounts capturing the transactions relevant to one stage or another of the process by which goods and services are produced and ultimately consumed.",
    "methodology": "National accounts are compiled in accordance with international standards: System of National Accounts, 2008 or 1993 versions. Specific information on how countries compile their national accounts can be found on the IMF website: https://dsbb.imf.org/",
    "derivation": null,
    "imputation": null,
    "missing": null,
    "quality_checks": null,
    "quality_note": null,
    "sources_discrepancies": null,
    "series_break": null,
    "limitation": "Gross domestic product (GDP), though widely tracked, may not always be the most relevant summary of aggregated economic performance for all economies, especially when production occurs at the expense of consuming capital stock.\r\r\n\r\r\nWhile GDP estimates based on the production approach are generally more reliable than estimates compiled from the income or expenditure side, different countries use different definitions, methods, and reporting standards. World Bank staff review the quality of national accounts data and sometimes make adjustments to improve consistency with international guidelines. Nevertheless, significant discrepancies remain between international standards and actual practice. Many statistical offices, especially those in developing countries, face severe limitations in the resources, time, training, and budgets required to produce reliable and comprehensive series of national accounts statistics.\r\r\n\r\r\nAmong the difficulties faced by compilers of national accounts is the extent of unreported economic activity in the informal or secondary economy. In developing countries a large share of agricultural output is either not exchanged (because it is consumed within the household) or not exchanged for money.",
    "relevance": "This indicator is related to the national accounts, which are critical for understanding and managing a country's economy. They provide a framework for the analysis of economic performance. National accounts are the basis for estimating the Gross Domestic Product (GDP) and Gross National Income (GNI), which are the most widely used indicator of economic performance. They are essential for government policymakers, providing the data needed to design and assess fiscal and monetary policies; and are also used by businesses and investors to assess the economic climate and make investment decisions. NAS enable comparison between economies, which is crucial for international trade, investment decisions, and economic competitiveness. More specifically, this indicator is related to national accounts aggregates. Gross Domestic Product (GDP), Gross National Income (GNI), and other aggregates provide a snapshot of the size and health of an economy by measuring the total economic activity within a country. They can thus be used by policymakers to design and implement economic policies, as they reflect the overall economic performance and can indicate the need for intervention in certain areas. Aggregates also allow for comparisons between different economies, which can be useful for trade negotiations, investment decisions, and economic benchmarking. By examining aggregates over time, economists and analysts can identify trends, cycles, and potential areas of concern within an economy, and investors can use national accounts aggregates to assess the potential risks and returns of investing in a particular country. Overall, national accounts aggregates are fundamental tools for economic analysis, policy formulation, and decision-making at both the national and international levels.",
    "aggregation_method": "Gap-filled total",
    "disaggregation": null,
    "confidentiality": null,
    "confidentiality_status": "PU",
    "confidentiality_note": null,
    "citation_requirement": null,
    "sources_note": null,
    "acknowledgement_statement": null,
    "disclaimer": null,
    "economies_count": null,
    "csv_link": "https://data360files.worldbank.org/data360-data/data/WB_WDI/WB_WDI_NY_GDP_MKTP_CD.csv",
    "excel_link": null,
    "json_link": "https://data360files.worldbank.org/data360-data/metadata/WB_WDI/WB_WDI_NY_GDP_MKTP_CD.json",
    "api_link": "https://data360api.worldbank.org/data360/data?top=1000&skip=0&DATABASE_ID=WB_WDI&INDICATOR=WB_WDI_NY_GDP_MKTP_CD",
    "indicator_count": null,
    "apiservice_link": null,
    "api_explorer_link": "http://datacatalog.worldbank.org/data360/api/execute?tab=Data&id=1&DATABASE_ID=WB_WDI&INDICATOR=WB_WDI_NY_GDP_MKTP_CD",
    "authoring_entity": [
      {
        "name": "World Bank National Accounts Team",
        "affiliation": null,
        "abbreviation": null,
        "email": null,
        "uri": null
      }
    ],
    "version_statement": {
      "version": null,
      "version_date": "2025-03-03",
      "version_resp": null,
      "version_notes": null
    },
    "aliases": [
      {
        "alias": "NY.GDP.MKTP.CD"
      }
    ],
    "alternate_identifiers": [],
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
        "source": "Inter-secretariat Working Group on National Accounts (ISWGNA) Glossary",
        "uri": "https://unstats.un.org/unsd/nationalaccount/SNAUpdate/2025/glossary.pdf",
        "note": null
      }
    ],
    "statistical_concept_references": [],
    "methodology_references": [
      {
        "source": "SNA2008",
        "uri": "https://unstats.un.org/unsd/nationalaccount/docs/sna2008.pdf",
        "note": null
      }
    ],
    "derivation_references": [],
    "imputation_references": [],
    "topics": [
      {
        "id": "P3",
        "name": "Prosperity",
        "parent_id": null,
        "vocabulary": "WB Practice Groups",
        "uri": null
      },
      {
        "id": "P3_000007",
        "name": "Growth and Jobs",
        "parent_id": "P3",
        "vocabulary": "Data360 Topic L1",
        "uri": null
      },
      {
        "id": "P3_000032",
        "name": "Growth",
        "parent_id": "P3_000007",
        "vocabulary": "Data360 Topic L2",
        "uri": null
      }
    ],
    "time_periods": [
      {
        "start": "1960",
        "end": "2024",
        "notes": null
      }
    ],
    "ref_country": [
      {
        "name": "Aruba",
        "code": "ABW"
      },
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
        "name": "Andorra",
        "code": "AND"
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
        "name": "American Samoa",
        "code": "ASM"
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
        "name": "Austria",
        "code": "AUT"
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
        "name": "Bahrain",
        "code": "BHR"
      },
      {
        "name": "Bahamas, The",
        "code": "BHS"
      },
      {
        "name": "Bosnia and Herzegovina",
        "code": "BIH"
      },
      {
        "name": "Belize",
        "code": "BLZ"
      },
      {
        "name": "Belarus",
        "code": "BLR"
      },
      {
        "name": "Bermuda",
        "code": "BMU"
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
        "name": "Brazil",
        "code": "BRA"
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
        "name": "Channel Islands",
        "code": "CHI"
      },
      {
        "name": "C\u00f4te d\u2019Ivoire",
        "code": "CIV"
      },
      {
        "name": "China",
        "code": "CHN"
      },
      {
        "name": "Congo, Rep.",
        "code": "COG"
      },
      {
        "name": "Cameroon",
        "code": "CMR"
      },
      {
        "name": "Congo, Dem. Rep.",
        "code": "COD"
      },
      {
        "name": "Costa Rica",
        "code": "CRI"
      },
      {
        "name": "Colombia",
        "code": "COL"
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
        "name": "Cuba",
        "code": "CUB"
      },
      {
        "name": "Cura\u00e7ao",
        "code": "CUW"
      },
      {
        "name": "Cyprus",
        "code": "CYP"
      },
      {
        "name": "Germany",
        "code": "DEU"
      },
      {
        "name": "Czechia",
        "code": "CZE"
      },
      {
        "name": "Algeria",
        "code": "DZA"
      },
      {
        "name": "Djibouti",
        "code": "DJI"
      },
      {
        "name": "Dominica",
        "code": "DMA"
      },
      {
        "name": "Denmark",
        "code": "DNK"
      },
      {
        "name": "Dominican Republic",
        "code": "DOM"
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
        "name": "Cayman Islands",
        "code": "CYM"
      },
      {
        "name": "Ethiopia",
        "code": "ETH"
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
        "name": "Finland",
        "code": "FIN"
      },
      {
        "name": "Fiji",
        "code": "FJI"
      },
      {
        "name": "France",
        "code": "FRA"
      },
      {
        "name": "Faroe Islands",
        "code": "FRO"
      },
      {
        "name": "United Kingdom",
        "code": "GBR"
      },
      {
        "name": "Gabon",
        "code": "GAB"
      },
      {
        "name": "Micronesia, Fed. Sts.",
        "code": "FSM"
      },
      {
        "name": "Guinea",
        "code": "GIN"
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
        "name": "Greenland",
        "code": "GRL"
      },
      {
        "name": "Grenada",
        "code": "GRD"
      },
      {
        "name": "Equatorial Guinea",
        "code": "GNQ"
      },
      {
        "name": "Guinea-Bissau",
        "code": "GNB"
      },
      {
        "name": "Eritrea",
        "code": "ERI"
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
        "name": "Guam",
        "code": "GUM"
      },
      {
        "name": "Guyana",
        "code": "GUY"
      },
      {
        "name": "Haiti",
        "code": "HTI"
      },
      {
        "name": "Hong Kong SAR, China",
        "code": "HKG"
      },
      {
        "name": "Honduras",
        "code": "HND"
      },
      {
        "name": "Croatia",
        "code": "HRV"
      },
      {
        "name": "Hungary",
        "code": "HUN"
      },
      {
        "name": "Indonesia",
        "code": "IDN"
      },
      {
        "name": "Iran, Islamic Rep.",
        "code": "IRN"
      },
      {
        "name": "Isle of Man",
        "code": "IMN"
      },
      {
        "name": "Ireland",
        "code": "IRL"
      },
      {
        "name": "Israel",
        "code": "ISR"
      },
      {
        "name": "India",
        "code": "IND"
      },
      {
        "name": "Italy",
        "code": "ITA"
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
        "name": "Jamaica",
        "code": "JAM"
      },
      {
        "name": "Jordan",
        "code": "JOR"
      },
      {
        "name": "Kazakhstan",
        "code": "KAZ"
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
        "name": "Korea, Rep.",
        "code": "KOR"
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
        "name": "Lao PDR",
        "code": "LAO"
      },
      {
        "name": "Libya",
        "code": "LBY"
      },
      {
        "name": "Sri Lanka",
        "code": "LKA"
      },
      {
        "name": "Liechtenstein",
        "code": "LIE"
      },
      {
        "name": "St. Lucia",
        "code": "LCA"
      },
      {
        "name": "Latvia",
        "code": "LVA"
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
        "name": "Lesotho",
        "code": "LSO"
      },
      {
        "name": "Morocco",
        "code": "MAR"
      },
      {
        "name": "St. Martin (French part)",
        "code": "MAF"
      },
      {
        "name": "Moldova",
        "code": "MDA"
      },
      {
        "name": "Monaco",
        "code": "MCO"
      },
      {
        "name": "Marshall Islands",
        "code": "MHL"
      },
      {
        "name": "Madagascar",
        "code": "MDG"
      },
      {
        "name": "Maldives",
        "code": "MDV"
      },
      {
        "name": "Kenya",
        "code": "KEN"
      },
      {
        "name": "North Macedonia",
        "code": "MKD"
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
        "name": "Myanmar",
        "code": "MMR"
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
        "name": "Mauritania",
        "code": "MRT"
      },
      {
        "name": "Montenegro",
        "code": "MNE"
      },
      {
        "name": "Mongolia",
        "code": "MNG"
      },
      {
        "name": "Northern Mariana Islands",
        "code": "MNP"
      },
      {
        "name": "Malawi",
        "code": "MWI"
      },
      {
        "name": "Malaysia",
        "code": "MYS"
      },
      {
        "name": "Namibia",
        "code": "NAM"
      },
      {
        "name": "New Caledonia",
        "code": "NCL"
      },
      {
        "name": "Nigeria",
        "code": "NGA"
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
        "name": "Niger",
        "code": "NER"
      },
      {
        "name": "Nicaragua",
        "code": "NIC"
      },
      {
        "name": "Oman",
        "code": "OMN"
      },
      {
        "name": "Nauru",
        "code": "NRU"
      },
      {
        "name": "Peru",
        "code": "PER"
      },
      {
        "name": "Nepal",
        "code": "NPL"
      },
      {
        "name": "Netherlands",
        "code": "NLD"
      },
      {
        "name": "Macao SAR, China",
        "code": "MAC"
      },
      {
        "name": "Panama",
        "code": "PAN"
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
        "name": "Philippines",
        "code": "PHL"
      },
      {
        "name": "Papua New Guinea",
        "code": "PNG"
      },
      {
        "name": "Paraguay",
        "code": "PRY"
      },
      {
        "name": "Palau",
        "code": "PLW"
      },
      {
        "name": "Portugal",
        "code": "PRT"
      },
      {
        "name": "Romania",
        "code": "ROU"
      },
      {
        "name": "Saudi Arabia",
        "code": "SAU"
      },
      {
        "name": "French Polynesia",
        "code": "PYF"
      },
      {
        "name": "Qatar",
        "code": "QAT"
      },
      {
        "name": "Russian Federation",
        "code": "RUS"
      },
      {
        "name": "West Bank and Gaza",
        "code": "PSE"
      },
      {
        "name": "Senegal",
        "code": "SEN"
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
        "name": "Mauritius",
        "code": "MUS"
      },
      {
        "name": "Singapore",
        "code": "SGP"
      },
      {
        "name": "San Marino",
        "code": "SMR"
      },
      {
        "name": "Solomon Islands",
        "code": "SLB"
      },
      {
        "name": "Sierra Leone",
        "code": "SLE"
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
        "name": "El Salvador",
        "code": "SLV"
      },
      {
        "name": "Suriname",
        "code": "SUR"
      },
      {
        "name": "S\u00e3o Tom\u00e9 and Pr\u00edncipe",
        "code": "STP"
      },
      {
        "name": "Slovenia",
        "code": "SVN"
      },
      {
        "name": "Slovak Republic",
        "code": "SVK"
      },
      {
        "name": "Sint Maarten (Dutch part)",
        "code": "SXM"
      },
      {
        "name": "Seychelles",
        "code": "SYC"
      },
      {
        "name": "Syrian Arab Republic",
        "code": "SYR"
      },
      {
        "name": "Eswatini",
        "code": "SWZ"
      },
      {
        "name": "Turks and Caicos Islands",
        "code": "TCA"
      },
      {
        "name": "Chad",
        "code": "TCD"
      },
      {
        "name": "Pakistan",
        "code": "PAK"
      },
      {
        "name": "Sweden",
        "code": "SWE"
      },
      {
        "name": "Togo",
        "code": "TGO"
      },
      {
        "name": "Thailand",
        "code": "THA"
      },
      {
        "name": "Turkmenistan",
        "code": "TKM"
      },
      {
        "name": "Tonga",
        "code": "TON"
      },
      {
        "name": "Tunisia",
        "code": "TUN"
      },
      {
        "name": "Timor-Leste",
        "code": "TLS"
      },
      {
        "name": "Trinidad and Tobago",
        "code": "TTO"
      },
      {
        "name": "Tanzania",
        "code": "TZA"
      },
      {
        "name": "T\u00fcrkiye",
        "code": "TUR"
      },
      {
        "name": "Uganda",
        "code": "UGA"
      },
      {
        "name": "Tuvalu",
        "code": "TUV"
      },
      {
        "name": "Ukraine",
        "code": "UKR"
      },
      {
        "name": "Uruguay",
        "code": "URY"
      },
      {
        "name": "Uzbekistan",
        "code": "UZB"
      },
      {
        "name": "Virgin Islands (U.S.)",
        "code": "VIR"
      },
      {
        "name": "Venezuela, RB",
        "code": "VEN"
      },
      {
        "name": "St. Vincent and the Grenadines",
        "code": "VCT"
      },
      {
        "name": "United States",
        "code": "USA"
      },
      {
        "name": "Vanuatu",
        "code": "VUT"
      },
      {
        "name": "South Africa",
        "code": "ZAF"
      },
      {
        "name": "Zimbabwe",
        "code": "ZWE"
      },
      {
        "name": "Yemen, Rep.",
        "code": "YEM"
      },
      {
        "name": "Federal Republic of Somalia",
        "code": "SOM"
      },
      {
        "name": "Kosovo",
        "code": "XKX"
      },
      {
        "name": "Vietnam",
        "code": "VNM"
      },
      {
        "name": "Zambia",
        "code": "ZMB"
      },
      {
        "name": "Samoa",
        "code": "WSM"
      },
      {
        "name": "Tajikistan",
        "code": "TJK"
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
        "name": "East Asia & Pacific (excluding high income)",
        "code": "EAP",
        "type": null
      },
      {
        "name": "Early-demographic dividend",
        "code": "EAR",
        "type": null
      },
      {
        "name": "Europe & Central Asia (excluding high income)",
        "code": "ECA",
        "type": null
      },
      {
        "name": "East Asia & Pacific",
        "code": "EAS",
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
        "name": "Fragile and conflict affected situations",
        "code": "FCS",
        "type": null
      },
      {
        "name": "European Union",
        "code": "EUU",
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
        "name": "IBRD only",
        "code": "IBD",
        "type": null
      },
      {
        "name": "IDA & IBRD total",
        "code": "IBT",
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
        "name": "Latin America & Caribbean",
        "code": "LCN",
        "type": null
      },
      {
        "name": "Least developed countries: UN classification",
        "code": "LDC",
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
        "name": "Middle East, North Africa, Afghanistan & Pakistan (excluding high income)",
        "code": "MNA",
        "type": null
      },
      {
        "name": "North America",
        "code": "NAC",
        "type": null
      },
      {
        "name": "Lower middle income",
        "code": "LMC",
        "type": null
      },
      {
        "name": "Other small states",
        "code": "OSS",
        "type": null
      },
      {
        "name": "OECD members",
        "code": "OED",
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
        "name": "Europe & Central Asia (IDA & IBRD)",
        "code": "TEC",
        "type": null
      },
      {
        "name": "Middle East, North Africa, Afghanistan & Pakistan (IDA & IBRD)",
        "code": "TMN",
        "type": null
      },
      {
        "name": "Sub-Saharan Africa (IDA & IBRD)",
        "code": "TSS",
        "type": null
      },
      {
        "name": "World",
        "code": "WLD",
        "type": null
      },
      {
        "name": "South Asia (IDA & IBRD)",
        "code": "TSA",
        "type": null
      },
      {
        "name": "Upper middle income",
        "code": "UMC",
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
        "uri": "https://api.worldbank.org/v2/countries/all/indicators/ny.gdp.mktp.cd?date=1960:2022&format=json",
        "image_uri": null
      },
      {
        "type": "WDI API",
        "description": "Data in XML",
        "uri": "https://api.worldbank.org/v2/countries/all/indicators/ny.gdp.mktp.cd?date=1960:2022",
        "image_uri": null
      },
      {
        "type": "WDI API",
        "description": "Metadata in JSON",
        "uri": "https://api.worldbank.org/v2/sources/2/series/ny.gdp.mktp.cd/metadata?format=json",
        "image_uri": null
      },
      {
        "type": "WDI API",
        "description": "Metadata in XML",
        "uri": "https://api.worldbank.org/v2/sources/2/series/ny.gdp.mktp.cd/metadata",
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
        "name": "Country official statistics",
        "organization": "National Statistical Organizations and/or Central Banks",
        "publisher": null,
        "publication_date": null,
        "uri": null,
        "access_date": null,
        "note": null,
        "other_identifiers": [],
        "authors": [],
        "datasets": []
      },
      {
        "idno": null,
        "type": null,
        "name": "National Accounts data files",
        "organization": "Organisation for Economic Co-operation and Development (OECD)",
        "publisher": null,
        "publication_date": null,
        "uri": null,
        "access_date": null,
        "note": null,
        "other_identifiers": [],
        "authors": [],
        "datasets": []
      },
      {
        "idno": null,
        "type": null,
        "name": "Staff estimates",
        "organization": "World Bank (WB)",
        "publisher": null,
        "publication_date": null,
        "uri": null,
        "access_date": null,
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
        "SSA",
        "VUT",
        "TMN",
        "MEA",
        "SWE",
        "GAB",
        "HTI",
        "PSE",
        "BEL",
        "GUY",
        "CHE",
        "TKM",
        "MLT",
        "COL",
        "SST",
        "TUR",
        "LTU",
        "UZB",
        "JOR",
        "LIC",
        "ABW",
        "FIN",
        "BWA",
        "JAM",
        "VIR",
        "IRL",
        "MNP",
        "TON",
        "EAR",
        "TCD",
        "WLD",
        "LAO",
        "BOL",
        "CHL",
        "MAR",
        "EUU",
        "CHN",
        "HPC",
        "TLS",
        "NPL",
        "JPN",
        "MNG",
        "LBN",
        "AFW",
        "IBT",
        "IDB",
        "SSD",
        "GIN",
        "SYR",
        "ASM",
        "GTM",
        "NCL",
        "USA",
        "GHA",
        "ITA",
        "NAC",
        "BRA",
        "COD",
        "MEX",
        "ARM",
        "BIH",
        "SLV",
        "CEB",
        "GNB",
        "QAT",
        "FCS",
        "ECU",
        "MDV",
        "ECS",
        "TSA",
        "SLE",
        "CRI",
        "ARB",
        "CHI",
        "UGA",
        "AUS",
        "AFG",
        "DEU",
        "BGD",
        "HUN",
        "ATG",
        "SWZ",
        "GBR",
        "MOZ",
        "TEA",
        "IDA",
        "DJI",
        "MNA",
        "LDC",
        "SAS",
        "BTN",
        "COM",
        "LVA",
        "MCO",
        "SXM",
        "PER",
        "MDA",
        "MUS",
        "NIC",
        "MKD",
        "SYC",
        "MLI",
        "PST",
        "GMB",
        "HIC",
        "RWA",
        "SOM",
        "GRL",
        "IMN",
        "ISR",
        "MNE",
        "COG",
        "CIV",
        "PSS",
        "NRU",
        "EMU",
        "LSO",
        "LUX",
        "SUR",
        "TLA",
        "BMU",
        "KOR",
        "BEN",
        "NZL",
        "SVK",
        "GUM",
        "OSS",
        "CZE",
        "LCN",
        "TUN",
        "SLB",
        "EAS",
        "KWT",
        "EGY",
        "PNG",
        "FRO",
        "OMN",
        "TUV",
        "IRN",
        "BRB",
        "NLD",
        "TZA",
        "MHL",
        "RUS",
        "SGP",
        "VNM",
        "YEM",
        "FSM",
        "XKX",
        "HRV",
        "AFE",
        "PRE",
        "MAC",
        "NAM",
        "ERI",
        "TEC",
        "SSF",
        "TGO",
        "AGO",
        "BDI",
        "IND",
        "NER",
        "EAP",
        "PRY",
        "STP",
        "DNK",
        "SVN",
        "ZAF",
        "LBR",
        "BLZ",
        "CMR",
        "ETH",
        "CUB",
        "PAK",
        "EST",
        "CAN",
        "THA",
        "CPV",
        "NOR",
        "KIR",
        "BFA",
        "KAZ",
        "PYF",
        "LKA",
        "IBD",
        "DMA",
        "HND",
        "LCA",
        "TJK",
        "WSM",
        "CUW",
        "DZA",
        "KEN",
        "KNA",
        "HKG",
        "AND",
        "KHM",
        "SRB",
        "MWI",
        "UKR",
        "FJI",
        "PRI",
        "MMR",
        "PLW",
        "ESP",
        "LIE",
        "AZE",
        "SEN",
        "ECA",
        "AUT",
        "ZMB",
        "CYP",
        "NGA",
        "KGZ",
        "LMC",
        "GRC",
        "ARG",
        "VCT",
        "SDN",
        "POL",
        "SMR",
        "CSS",
        "MIC",
        "URY",
        "MRT",
        "IDX",
        "ISL",
        "BHR",
        "PAN",
        "PRT",
        "IDN",
        "MDG",
        "MYS",
        "BGR",
        "ROU",
        "GNQ",
        "BRN",
        "PHL",
        "LAC",
        "OED",
        "BHS",
        "GRD",
        "TSS",
        "BLR",
        "SAU",
        "ARE",
        "TTO",
        "CYM",
        "LMY",
        "CAF",
        "VEN",
        "ZWE",
        "ALB",
        "GEO",
        "MAF",
        "FRA",
        "UMC",
        "LBY",
        "TCA",
        "DOM",
        "LTE",
        "IRQ"
      ]
    },
    {
      "field_name": "INDICATOR",
      "label_name": "Statistical indicator",
      "field_value": [
        "WB_WDI_NY_GDP_MKTP_CD"
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
        "USD"
      ]
    },
    {
      "field_name": "TIME_PERIOD",
      "label_name": "Time period",
      "field_value": [
        "2022",
        "1999",
        "2010",
        "1972",
        "1985",
        "1988",
        "1998",
        "2021",
        "1983",
        "2007",
        "2014",
        "2005",
        "2001",
        "1960",
        "1980",
        "1964",
        "2017",
        "2024",
        "1975",
        "1967",
        "1978",
        "1997",
        "2019",
        "2018",
        "1984",
        "1992",
        "2011",
        "1993",
        "1994",
        "1995",
        "2000",
        "1971",
        "1968",
        "1989",
        "1976",
        "1986",
        "1966",
        "1981",
        "2015",
        "2012",
        "2008",
        "1979",
        "2006",
        "1965",
        "1963",
        "2020",
        "2009",
        "1970",
        "2002",
        "1961",
        "1991",
        "2004",
        "2003",
        "1990",
        "1969",
        "2023",
        "1962",
        "2013",
        "1996",
        "1977",
        "1982",
        "1974",
        "1987",
        "2016",
        "1973"
      ]
    }
  ],
  "error": null
}
```

</details>


### 👤 User (Turn 4)

Could you also provide a chart visualizing the GDP comparison between Kenya and Tanzania from 2019 to 2024?

### 🤖 Assistant

Here’s a visual comparison of Kenya’s and Tanzania’s GDP (current US$), 2019–2024:

**Data:**  
- Indicator: GDP (current US$) — `WB_WDI_NY_GDP_MKTP_CD`  
- Countries: Kenya (KEN), Tanzania (TZA)  
- Years: 2019–2024 (latest year may be provisional)

**Chart (line chart):**  
[View GDP comparison chart: Kenya vs. Tanzania, 2019–2024](http://localhost:8000/static/viz_specs/1d6008ae-1d57-4a1b-ba9a-f5d7e448c5b1_vega.json)

The chart plots both countries’ nominal GDP over time so you can visually compare levels and trajectories.

**Suggested follow-ups:**  
1. Can you compute and plot **annual GDP growth rates** for Kenya and Tanzania over 2019–2024?  
2. Could you add **GDP per capita** for both countries to a similar comparison chart?  
3. Can you help me export these data and charts for use in my **thesis (e.g., in Excel, R, or Python)**?

---
<details>
<summary>📋 <b>Tool Calls</b> (click to expand)</summary>

**1. data360_get_viz_spec**
```json
{
  "database_id": "WB_WDI",
  "indicator_id": "WB_WDI_NY_GDP_MKTP_CD",
  "country_code": "KEN,TZA",
  "start_year": 2019,
  "end_year": 2024,
  "chart_type": "line chart"
}
```
**Result:**
```json
{
  "url": "http://localhost:8000/static/viz_specs/1d6008ae-1d57-4a1b-ba9a-f5d7e448c5b1_vega.json",
  "error": null
}
```

</details>
