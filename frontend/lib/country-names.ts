/**
 * Converts an ISO 3166-1 alpha-3 country code (e.g. "JPN") to its
 * full English name (e.g. "Japan") using the browser-native Intl.DisplayNames
 * API. Falls back to the raw code if the mapping is unknown.
 *
 * Coverage: full World Bank country set (~200 countries/territories).
 */

// Compact alpha-3 → alpha-2 mapping (ISO 3166-1)
const ALPHA3_TO_ALPHA2: Record<string, string> = {
  ABW: "AW", AFG: "AF", AGO: "AO", ALB: "AL", AND: "AD", ARE: "AE",
  ARG: "AR", ARM: "AM", ATG: "AG", AUS: "AU", AUT: "AT", AZE: "AZ",
  BDI: "BI", BEL: "BE", BEN: "BJ", BFA: "BF", BGD: "BD", BGR: "BG",
  BHR: "BH", BHS: "BS", BIH: "BA", BLR: "BY", BLZ: "BZ", BMU: "BM",
  BOL: "BO", BRA: "BR", BRB: "BB", BRN: "BN", BTN: "BT", BWA: "BW",
  CAF: "CF", CAN: "CA", CHE: "CH", CHL: "CL", CHN: "CN", CIV: "CI",
  CMR: "CM", COD: "CD", COG: "CG", COL: "CO", COM: "KM", CPV: "CV",
  CRI: "CR", CUB: "CU", CYP: "CY", CZE: "CZ", DEU: "DE", DJI: "DJ",
  DMA: "DM", DNK: "DK", DOM: "DO", DZA: "DZ", ECU: "EC", EGY: "EG",
  ERI: "ER", ESP: "ES", EST: "EE", ETH: "ET", FIN: "FI", FJI: "FJ",
  FRA: "FR", FSM: "FM", GAB: "GA", GBR: "GB", GEO: "GE", GHA: "GH",
  GIN: "GN", GMB: "GM", GNB: "GW", GNQ: "GQ", GRC: "GR", GRD: "GD",
  GTM: "GT", GUY: "GY", HND: "HN", HRV: "HR", HTI: "HT", HUN: "HU",
  IDN: "ID", IND: "IN", IRL: "IE", IRN: "IR", IRQ: "IQ", ISL: "IS",
  ISR: "IL", ITA: "IT", JAM: "JM", JOR: "JO", JPN: "JP", KAZ: "KZ",
  KEN: "KE", KGZ: "KG", KHM: "KH", KIR: "KI", KNA: "KN", KOR: "KR",
  KWT: "KW", LAO: "LA", LBN: "LB", LBR: "LR", LBY: "LY", LCA: "LC",
  LIE: "LI", LKA: "LK", LSO: "LS", LTU: "LT", LUX: "LU", LVA: "LV",
  MAR: "MA", MDA: "MD", MDG: "MG", MDV: "MV", MEX: "MX", MHL: "MH",
  MKD: "MK", MLI: "ML", MLT: "MT", MMR: "MM", MNE: "ME", MNG: "MN",
  MOZ: "MZ", MRT: "MR", MUS: "MU", MWI: "MW", MYS: "MY", NAM: "NA",
  NER: "NE", NGA: "NG", NIC: "NI", NLD: "NL", NOR: "NO", NPL: "NP",
  NRU: "NR", NZL: "NZ", OMN: "OM", PAK: "PK", PAN: "PA", PER: "PE",
  PHL: "PH", PLW: "PW", PNG: "PG", POL: "PL", PRI: "PR", PRK: "KP",
  PRT: "PT", PRY: "PY", PSE: "PS", PYF: "PF", QAT: "QA", ROU: "RO",
  RUS: "RU", RWA: "RW", SAU: "SA", SDN: "SD", SEN: "SN", SGP: "SG",
  SLB: "SB", SLE: "SL", SLV: "SV", SMR: "SM", SOM: "SO", SRB: "RS",
  SSD: "SS", STP: "ST", SUR: "SR", SVK: "SK", SVN: "SI", SWE: "SE",
  SWZ: "SZ", SYC: "SC", SYR: "SY", TCD: "TD", TGO: "TG", THA: "TH",
  TJK: "TJ", TKM: "TM", TLS: "TL", TON: "TO", TTO: "TT", TUN: "TN",
  TUR: "TR", TUV: "TV", TZA: "TZ", UGA: "UG", UKR: "UA", URY: "UY",
  USA: "US", UZB: "UZ", VCT: "VC", VEN: "VE", VNM: "VN", VUT: "VU",
  WSM: "WS", YEM: "YE", ZAF: "ZA", ZMB: "ZM", ZWE: "ZW",
};

let _displayNames: Intl.DisplayNames | null = null;

function getDisplayNames(): Intl.DisplayNames | null {
  if (_displayNames) return _displayNames;
  try {
    _displayNames = new Intl.DisplayNames(["en"], { type: "region" });
    return _displayNames;
  } catch {
    return null;
  }
}

/**
 * Convert an alpha-3 code like "JPN" → "Japan".
 * Falls back to the raw code string if lookup fails.
 */
export function alpha3ToName(code: string): string {
  if (!code) return code;
  const alpha2 = ALPHA3_TO_ALPHA2[code.toUpperCase()];
  if (!alpha2) return code;
  try {
    return getDisplayNames()?.of(alpha2) ?? code;
  } catch {
    return code;
  }
}

/**
 * Convert a semicolon-separated list of alpha-3 codes to names.
 * "JPN;PHL" → "Japan; Philippines"
 */
export function alpha3ListToNames(codes: string, separator = "; "): string {
  return codes
    .split(";")
    .map((c) => alpha3ToName(c.trim()))
    .join(separator);
}
