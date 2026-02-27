/**
 * Client-side authentication functions.
 * Safe to import in client components.
 */

import { sessionStorageKeys } from "@/lib/constants";
import { getApiUrl } from "./api-client";

/** Clears auth-related sessionStorage (legacy USER_DATA, etc.) so no PII persists after logout. */
export function clearAuthSessionStorage(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(sessionStorageKeys.userData);
  } catch {
    // Ignore quota or security errors
  }
}

export type UserType = "guest" | "regular";

export type User = {
  id: string;
  email: string | null;
  type: UserType;
  /** Display name (e.g. from MSAL/Azure AD). Present when backend returns it. */
  name?: string | null;
};

/**
 * Client-side logout function.
 * Calls Next.js logout route handler which ensures cookies are properly cleared
 * before navigation. This is more robust than calling FastAPI directly.
 */
export async function logoutClient(): Promise<void> {
  // Use Next.js API route which handles cookie clearing server-side
  const apiUrl = getApiUrl("/api/auth/logout");
  const response = await fetch(apiUrl, {
    method: "POST",
    credentials: "include", // Important: include cookies
  });

  if (!response.ok) {
    throw new Error("Logout failed");
  }

  clearAuthSessionStorage();

  // Cookies are cleared by the server-side route handler (Set-Cookie headers)
}
