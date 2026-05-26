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
        "TLS",
        "VNM",
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
