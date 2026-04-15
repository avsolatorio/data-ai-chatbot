"""Geographic region resolution utilities for the Data360 Chat assistant.

This module provides a mapping from common region names to lists of ISO-3 country
codes, and helper functions to resolve free-text region names in user queries to
the corresponding country codes.  It is used by the scout and planner nodes to
expand vague geographic references (e.g. "East Africa") into explicit country
lists before calling data retrieval tools.
"""

from __future__ import annotations

import re

# ---------------------------------------------------------------------------
# Region → ISO-3 country code mapping
# ---------------------------------------------------------------------------
REGION_TO_CODES: dict[str, list[str]] = {
    "sub-saharan africa": [
        "AGO",
        "BEN",
        "BWA",
        "BFA",
        "BDI",
        "CPV",
        "CMR",
        "CAF",
        "TCD",
        "COM",
        "COD",
        "COG",
        "CIV",
        "DJI",
        "ERI",
        "SWZ",
        "ETH",
        "GAB",
        "GMB",
        "GHA",
        "GIN",
        "GNB",
        "KEN",
        "LSO",
        "LBR",
        "MDG",
        "MWI",
        "MLI",
        "MRT",
        "MUS",
        "MOZ",
        "NAM",
        "NER",
        "NGA",
        "RWA",
        "STP",
        "SEN",
        "SLE",
        "SOM",
        "ZAF",
        "SSD",
        "SDN",
        "TZA",
        "TGO",
        "UGA",
        "ZMB",
        "ZWE",
        "SYC",
    ],
    "east africa": [
        "ETH",
        "KEN",
        "TZA",
        "UGA",
        "RWA",
        "BDI",
        "SOM",
        "DJI",
        "ERI",
        "SSD",
    ],
    "west africa": [
        "NGA",
        "GHA",
        "SEN",
        "CIV",
        "MLI",
        "BFA",
        "NER",
        "TGO",
        "BEN",
        "CMR",
        "GIN",
        "SLE",
        "LBR",
        "GMB",
        "GNB",
        "CPV",
        "MRT",
    ],
    "southern africa": [
        "ZAF",
        "ZWE",
        "ZMB",
        "MWI",
        "MOZ",
        "BWA",
        "NAM",
        "LSO",
        "SWZ",
        "AGO",
        "COM",
        "MDG",
        "MUS",
        "SYC",
    ],
    "north africa": [
        "DZA",
        "EGY",
        "LBY",
        "MAR",
        "TUN",
        "SDN",
    ],
    "asean": [
        "BRN",
        "KHM",
        "IDN",
        "LAO",
        "MYS",
        "MMR",
        "PHL",
        "SGP",
        "THA",
        "VNM",
    ],
    "south asia": [
        "AFG",
        "BGD",
        "BTN",
        "IND",
        "MDV",
        "NPL",
        "PAK",
        "LKA",
    ],
    "east asia and pacific": [
        "CHN",
        "JPN",
        "KOR",
        "MNG",
        "PRK",
        "HKG",
        "MAC",
        "TWN",
        "AUS",
        "NZL",
        "FJI",
        "PNG",
        "SLB",
        "VUT",
        "WSM",
        "TON",
        "KIR",
        "FSM",
        "PLW",
        "MHL",
        "NRU",
        "TUV",
    ],
    "latin america and caribbean": [
        "BRA",
        "MEX",
        "ARG",
        "COL",
        "CHL",
        "PER",
        "VEN",
        "ECU",
        "BOL",
        "PRY",
        "URY",
        "GUY",
        "SUR",
        "TTO",
        "JAM",
        "CUB",
        "DOM",
        "HTI",
        "GTM",
        "HND",
        "SLV",
        "NIC",
        "CRI",
        "PAN",
        "BLZ",
        "BHS",
        "BRB",
        "ATG",
        "DMA",
        "GRD",
        "KNA",
        "LCA",
        "VCT",
    ],
    "middle east and north africa": [
        "DZA",
        "BHR",
        "DJI",
        "EGY",
        "IRN",
        "IRQ",
        "ISR",
        "JOR",
        "KWT",
        "LBN",
        "LBY",
        "MAR",
        "MLT",
        "OMN",
        "QAT",
        "SAU",
        "SYR",
        "TUN",
        "ARE",
        "YEM",
        "PSE",
        "MAR",
    ],
    "europe and central asia": [
        "ALB",
        "ARM",
        "AZE",
        "BLR",
        "BIH",
        "BGR",
        "CYP",
        "CZE",
        "DNK",
        "EST",
        "FIN",
        "FRA",
        "GEO",
        "DEU",
        "GRC",
        "HUN",
        "ISL",
        "IRL",
        "ITA",
        "KAZ",
        "XKX",
        "KGZ",
        "LVA",
        "LTU",
        "LUX",
        "MDA",
        "MNE",
        "NLD",
        "MKD",
        "NOR",
        "POL",
        "PRT",
        "ROU",
        "RUS",
        "SRB",
        "SVK",
        "SVN",
        "ESP",
        "SWE",
        "CHE",
        "TJK",
        "TUR",
        "TKM",
        "UKR",
        "GBR",
        "UZB",
    ],
    "g7": ["CAN", "FRA", "DEU", "ITA", "JPN", "GBR", "USA"],
    "g20": [
        "ARG",
        "AUS",
        "BRA",
        "CAN",
        "CHN",
        "FRA",
        "DEU",
        "IND",
        "IDN",
        "ITA",
        "JPN",
        "KOR",
        "MEX",
        "RUS",
        "SAU",
        "ZAF",
        "TUR",
        "GBR",
        "USA",
    ],
    "oecd": [
        "AUS",
        "AUT",
        "BEL",
        "CAN",
        "CHL",
        "COL",
        "CZE",
        "DNK",
        "EST",
        "FIN",
        "FRA",
        "DEU",
        "GRC",
        "HUN",
        "ISL",
        "IRL",
        "ISR",
        "ITA",
        "JPN",
        "KOR",
        "LVA",
        "LTU",
        "LUX",
        "MEX",
        "NLD",
        "NZL",
        "NOR",
        "POL",
        "PRT",
        "SVK",
        "SVN",
        "ESP",
        "SWE",
        "CHE",
        "TUR",
        "GBR",
        "USA",
    ],
    "brics": ["BRA", "RUS", "IND", "CHN", "ZAF"],
}

# ---------------------------------------------------------------------------
# Punctuation stripper (for query normalisation)
# ---------------------------------------------------------------------------
_PUNCT_RE = re.compile(r"[^\w\s-]")


def _normalize(text: str) -> str:
    """Lowercase and strip punctuation for consistent matching."""
    return _PUNCT_RE.sub("", text.strip().lower())


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def resolve_region(query: str) -> list[str]:
    """Return the ISO-3 country codes for a region name, or [] if not found.

    Tries an exact match first (after normalisation), then falls back to a
    partial/substring match against all registered region names.

    Args:
        query: Free-text region name, e.g. "East Africa" or "sub saharan africa".

    Returns:
        List of ISO-3 country codes, or an empty list if no match is found.
    """
    key = _normalize(query)
    # Exact match
    if key in REGION_TO_CODES:
        return list(REGION_TO_CODES[key])
    # Partial match — query is a substring of a region name, or vice-versa
    for region_name, codes in REGION_TO_CODES.items():
        if key in region_name or region_name in key:
            return list(codes)
    return []


def expand_country_list(countries: list[str]) -> list[str]:
    """Expand region names in a country list to individual ISO-3 codes.

    For each entry:
    - If it looks like an ISO-3 code (3 uppercase letters), keep it as-is.
    - Otherwise, attempt to resolve it as a region name via ``resolve_region``.

    Duplicates are removed while preserving order.

    Args:
        countries: Mixed list of ISO-3 codes and/or region names.

    Returns:
        Deduplicated flat list of ISO-3 country codes.
    """
    seen: set[str] = set()
    result: list[str] = []

    for entry in countries:
        # Heuristic: a 3-letter all-uppercase string is an ISO-3 code
        if re.fullmatch(r"[A-Z]{3}", entry.strip()):
            code = entry.strip()
            if code not in seen:
                seen.add(code)
                result.append(code)
        else:
            # Treat as a region name and expand
            codes = resolve_region(entry)
            for code in codes:
                if code not in seen:
                    seen.add(code)
                    result.append(code)

    return result
