/**
 * Helpers for the /register page's provider-conditional rendering.
 * Extracted so the predicate can be unit tested without rendering React.
 */

import type { AuthProviderType } from "./config";

/**
 * True when /register should bounce away (render nothing).
 * Only MSAL — which manages its own auth via the SDK — disables
 * the credentials form. Guest and user modes both render the form.
 */
export function isRegistrationDisabled(
  authProvider: AuthProviderType | string,
): boolean {
  return authProvider === "msal";
}
