/**
 * Loaded with `tsx --import` before the isolated Data360 api-client tests.
 * Sets NEXT_PUBLIC_AUTH_PROVIDER before @/lib/auth/config is first evaluated.
 */

process.env.NEXT_PUBLIC_AUTH_PROVIDER = "data360";
process.env.NEXT_PUBLIC_DATA360_AUTH_URL = "https://example.com/auth";
process.env.NEXT_PUBLIC_DATA360_SEARCH_TOKEN_REFRESH_URL =
  "https://refresh.example.com/api/refresh-search-token";
