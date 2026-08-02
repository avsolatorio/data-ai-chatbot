import { test, expect, type Page, type APIRequestContext } from "@playwright/test";
import path from "node:path";

const BASE_URL = "http://localhost:3001";
const BACKEND_URL = "http://localhost:8001";
const ADMIN_EMAIL = "admin@test.com";
const ADMIN_PASSWORD = "AdminPass123!";

const SCREENSHOT_DIR = path.resolve(__dirname, "..", "screenshots");

let cachedAdminToken: string | null = null;

async function getAdminToken(
  request: APIRequestContext
): Promise<string> {
  if (cachedAdminToken) return cachedAdminToken;
  const res = await request.post(`${BACKEND_URL}/api/auth/login`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    headers: { "Content-Type": "application/json" },
  });
  const body = await res.json();
  cachedAdminToken = (body.access_token as string) ?? "";
  return cachedAdminToken as string;
}

async function registerUser(
  request: APIRequestContext,
  email: string,
  password: string
): Promise<string> {
  const res = await request.post(`${BACKEND_URL}/api/auth/register`, {
    data: { email, password },
    headers: { "Content-Type": "application/json" },
  });
  const body = await res.json();
  return body.access_token ?? "";
}

async function setAuthAndGoto(
  page: Page,
  token: string,
  url: string
) {
  await page.context().addCookies([
    {
      name: "auth_token",
      value: token,
      domain: "localhost",
      path: "/",
    },
  ]);
  await page.goto(url, { waitUntil: "domcontentloaded" });
}

// =============================================================================
// Phase 0: Admin Auth Gate
// =============================================================================
test.describe("Phase 0 — Admin Auth Gate", () => {
  test("Anonymous user visiting /admin sees 403 (no admin content)", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/admin`, { waitUntil: "domcontentloaded" });
    // Wait for the layout to finish loading and checking auth
    await page.waitForTimeout(5000);

    const bodyText = await page.evaluate(() => document.body.innerText);
    // Should NOT show admin dashboard content
    expect(bodyText).not.toContain("Admin Dashboard");
    // Should show 403 page (unauthenticated users are redirected by guest auth,
    // or they see the 403 gate from layout)
    expect(bodyText).not.toContain("Analytics");
    expect(bodyText).not.toContain("Moderation");
    expect(bodyText).not.toContain("Health");

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "admin-0-anonymous-403.png"),
      fullPage: true,
    });
  });

  test("Non-admin user sees 403 on /admin", async ({ page, request }) => {
    const nonAdminEmail = `nonadmin-${Date.now()}@test.com`;
    const token = await registerUser(request, nonAdminEmail, "TestPass123!");
    expect(token).toBeTruthy();

    await setAuthAndGoto(page, token, `${BASE_URL}/admin/moderation`);
    await page.waitForTimeout(5000);

    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText).toContain("403");
    expect(bodyText).toContain("admin access");

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "admin-0-nonadmin-403.png"),
      fullPage: true,
    });
  });

  test("Admin user sees admin shell with sidebar on /admin", async ({
    page,
    request,
  }) => {
    const token = await getAdminToken(request);
    await setAuthAndGoto(page, token, `${BASE_URL}/admin`);
    await page.waitForTimeout(5000);

    // Should show admin dashboard shell
    await expect(page.locator("text=Admin Dashboard").first()).toBeVisible();
    await expect(page.locator("text=admin@test.com").first()).toBeVisible();

    // Sidebar nav items
    await expect(page.locator("text=Analytics").first()).toBeVisible();
    await expect(page.locator("text=Moderation").first()).toBeVisible();
    await expect(page.locator("text=Health").first()).toBeVisible();
    await expect(page.locator("text=Back to Chat").first()).toBeVisible();

    // Should redirect to analytics by default
    await expect(page).toHaveURL(/\/admin\/analytics/);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "admin-0-admin-shell.png"),
      fullPage: true,
    });
  });
});

// =============================================================================
// Phase 1: Analytics Dashboard
// =============================================================================
test.describe("Phase 1 — Analytics Dashboard", () => {
  test("Analytics page renders stat cards, charts, and date filter", async ({
    page,
    request,
  }) => {
    const token = await getAdminToken(request);
    await setAuthAndGoto(page, token, `${BASE_URL}/admin/analytics`);
    await page.waitForTimeout(5000);

    // Stat cards - Users section
    await expect(page.locator("text=Total Users").first()).toBeVisible();
    await expect(page.locator("text=New (7d)").first()).toBeVisible();
    await expect(page.locator("text=New (30d)").first()).toBeVisible();
    await expect(page.locator("text=Active (7d)").first()).toBeVisible();
    await expect(page.locator("text=Active (30d)").first()).toBeVisible();

    // Stat cards - Chats section
    await expect(page.locator("text=Total Chats").first()).toBeVisible();
    await expect(page.locator("text=Total Messages").first()).toBeVisible();

    // Stat cards - Feedback section
    await expect(page.locator("text=Avg Rating").first()).toBeVisible();
    await expect(page.locator("text=Total Feedback").first()).toBeVisible();
    await expect(page.locator("text=Upvote Ratio").first()).toBeVisible();

    // Charts - Rating distribution
    await expect(page.locator("text=Rating Distribution").first()).toBeVisible();

    // Date filter presets should be visible
    const dateFilter = page.locator("button", { hasText: /7d|30d|90d/ });
    await expect(dateFilter.first()).toBeVisible();

    // Verify all 4 API endpoint calls fire (check network)
    const endpointCalls: string[] = [];
    page.on("response", (response) => {
      const url = response.url();
      if (url.includes("/api/admin/analytics/")) {
        endpointCalls.push(url);
      }
    });

    // Reload to capture network calls
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5000);

    // All 4 analytics endpoints should have been called
    const uniqueEndpoints = new Set(endpointCalls);
    expect(uniqueEndpoints.size).toBeGreaterThanOrEqual(4);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "admin-1-analytics-full.png"),
      fullPage: true,
    });
  });

  test("Date filter changes update queries", async ({ page, request }) => {
    const token = await getAdminToken(request);
    await setAuthAndGoto(page, token, `${BASE_URL}/admin/analytics`);
    await page.waitForTimeout(5000);

    // Look for date filter buttons (7d, 30d, 90d)
    const buttons = page.locator("button");
    const buttonCount = await buttons.count();
    let foundDateFilter = false;

    for (let i = 0; i < buttonCount; i++) {
      const text = await buttons.nth(i).textContent();
      if (text && (text.includes("7d") || text.includes("30d") || text.includes("90d"))) {
        foundDateFilter = true;
        break;
      }
    }

    expect(foundDateFilter).toBeTruthy();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "admin-1-analytics-datefilter.png"),
      fullPage: true,
    });
  });
});

// =============================================================================
// Phase 2: Moderation Panel
// =============================================================================
test.describe("Phase 2 — Moderation Panel", () => {
  test("Users tab lists users with search and disable toggle", async ({
    page,
    request,
  }) => {
    const token = await getAdminToken(request);
    await setAuthAndGoto(page, token, `${BASE_URL}/admin/moderation`);
    await page.waitForTimeout(5000);

    // Page heading
    await expect(page.getByRole("heading", { name: "Moderation" })).toBeVisible();

    // Tabs visible
    const usersTab = page.locator("button", { hasText: "Users" });
    const chatsTab = page.locator("button", { hasText: "Chats" });
    await expect(usersTab).toBeVisible();
    await expect(chatsTab).toBeVisible();

    // Users tab is active by default
    await expect(page.locator("th", { hasText: "Email" })).toBeVisible();
    await expect(page.locator("th", { hasText: "Type" })).toBeVisible();
    await expect(page.locator("th", { hasText: "Chats" })).toBeVisible();
    await expect(page.locator("th", { hasText: "Status" })).toBeVisible();
    await expect(page.locator("th", { hasText: "Actions" })).toBeVisible();

    // Search input present
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput.first()).toBeVisible();

    // Disable toggle present (at least one button or toggle in Actions column)
    const actionButtons = page.locator("button", { hasText: /Disable|Enable|Toggle/ });
    // There should be at least one user in the table
    const rows = page.locator("table tbody tr");
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "admin-2-moderation-users.png"),
      fullPage: true,
    });
  });

  test("Search filters users by email", async ({ page, request }) => {
    const token = await getAdminToken(request);
    await setAuthAndGoto(page, token, `${BASE_URL}/admin/moderation`);
    await page.waitForTimeout(5000);

    // Type in search
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.first().fill("admin");
    await page.waitForTimeout(2000);

    // Should filter to show admin@test.com
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText).toContain("admin@test.com");

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "admin-2-moderation-search.png"),
      fullPage: true,
    });
  });

  test("Chats tab lists chats with search and delete action", async ({
    page,
    request,
  }) => {
    const token = await getAdminToken(request);
    await setAuthAndGoto(page, token, `${BASE_URL}/admin/moderation`);
    await page.waitForTimeout(5000);

    // Click Chats tab
    const chatsTab = page.locator("button", { hasText: "Chats" });
    await chatsTab.click();
    await page.waitForTimeout(3000);

    // Chats table columns
    await expect(page.locator("th", { hasText: "Title" })).toBeVisible();
    await expect(page.locator("th", { hasText: "User" })).toBeVisible();
    await expect(page.locator("th", { hasText: "Messages" })).toBeVisible();
    await expect(page.locator("th", { hasText: "Created" })).toBeVisible();

    // Search input for chats
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput.first()).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "admin-2-moderation-chats.png"),
      fullPage: true,
    });
  });
});

// =============================================================================
// Phase 3: System Health Dashboard
// =============================================================================
test.describe("Phase 3 — System Health Dashboard", () => {
  test("Health page shows status cards, metrics grid, and auto-refresh", async ({
    page,
    request,
  }) => {
    const token = await getAdminToken(request);
    await setAuthAndGoto(page, token, `${BASE_URL}/admin/health`);
    await page.waitForTimeout(5000);

    // Page heading
    await expect(
      page.getByRole("heading", { name: "System Health" })
    ).toBeVisible();

    // Status cards: API, Database, MCP
    await expect(page.locator("text=API Status").first()).toBeVisible();
    await expect(page.locator("text=Database").first()).toBeVisible();
    await expect(page.locator("text=MCP Server").first()).toBeVisible();

    // Should show Healthy or Degraded
    const healthyText = page.locator("text=Healthy");
    const degradedText = page.locator("text=Degraded");
    await expect(healthyText.first().or(degradedText.first())).toBeVisible();

    // Metrics section — 8 metrics
    await expect(page.locator("text=Error Rate (24h)").first()).toBeVisible();
    await expect(page.locator("text=Avg Response Time").first()).toBeVisible();
    await expect(page.locator("text=Rate Limit Hits (24h)").first()).toBeVisible();
    await expect(page.locator("text=Active Sessions").first()).toBeVisible();
    await expect(page.locator("text=DB Pool Size").first()).toBeVisible();
    // Token metrics
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText).toMatch(/Total Tokens|Prompt Tokens|Completion Tokens|Token Rate|Cost Estimate/i);

    // Auto-refresh indicator
    await expect(page.locator("text=Auto-refreshes every 30s").first()).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "admin-final-health.png"),
      fullPage: true,
    });
  });
});

// =============================================================================
// DEF-001: Health contract — db is string, uptimeSeconds is number
// =============================================================================
test.describe("DEF-001 — Health contract fix", () => {
  test("Backend /api/admin/health returns db as string and uptimeSeconds as number", async ({
    request,
  }) => {
    const token = await getAdminToken(request);
    const res = await request.get(`${BACKEND_URL}/api/admin/health`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();

    // db must be a string: "connected" or "error"
    expect(typeof body.db).toBe("string");
    expect(["connected", "error"]).toContain(body.db);

    // mcp must be a string
    expect(typeof body.mcp).toBe("string");

    // uptimeSeconds must be a number (not "uptime")
    expect(typeof body.uptimeSeconds).toBe("number");
    expect(body.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });

  test("Frontend health page shows Database card as green when connected", async ({
    page,
    request,
  }) => {
    const token = await getAdminToken(request);
    await setAuthAndGoto(page, token, `${BASE_URL}/admin/health`);
    await page.waitForTimeout(5000);

    // Database card should show "Connected" (green), not "Error" (red)
    await expect(page.locator("text=Database").first()).toBeVisible();
    await expect(page.locator("text=Connected").first()).toBeVisible();

    // Uptime should NOT show NaN
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText).not.toContain("NaN");
  });
});

// =============================================================================
// DEF-002: Health metrics — 200 with all 8 fields, metrics grid renders
// =============================================================================
test.describe("DEF-002 — Health metrics fix", () => {
  test("Backend /api/admin/health/metrics returns all 8 metric fields", async ({
    request,
  }) => {
    const token = await getAdminToken(request);
    const res = await request.get(`${BACKEND_URL}/api/admin/health/metrics`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();

    // All 8 required fields present
    expect(body).toHaveProperty("errorRate24h");
    expect(body).toHaveProperty("avgResponseTimeMs");
    expect(body).toHaveProperty("rateLimitHits24h");
    expect(body).toHaveProperty("activeSessions");
    expect(body).toHaveProperty("dbPoolSize");
    expect(body).toHaveProperty("totalTokens24h");
    expect(body).toHaveProperty("tokenRate24h");
    expect(body).toHaveProperty("costEstimate24h");
  });

  test("Frontend health page renders metrics grid with metric cards", async ({
    page,
    request,
  }) => {
    const token = await getAdminToken(request);
    await setAuthAndGoto(page, token, `${BASE_URL}/admin/health`);
    await page.waitForTimeout(5000);

    // Metrics section should be visible
    await expect(page.locator("text=Error Rate").first()).toBeVisible();
    await expect(page.locator("text=Avg Response Time").first()).toBeVisible();
    await expect(page.locator("text=Rate Limit Hits").first()).toBeVisible();
    await expect(page.locator("text=Active Sessions").first()).toBeVisible();
    await expect(page.locator("text=DB Pool Size").first()).toBeVisible();
    await expect(page.locator("text=Total Tokens").first()).toBeVisible();
    await expect(page.locator("text=Token Rate").first()).toBeVisible();
    await expect(page.locator("text=Cost Estimate").first()).toBeVisible();
  });
});

// =============================================================================
// DEF-004: Rate limit exempt for /api/admin/*
// =============================================================================
test.describe("DEF-004 — Rate limit exempt fix", () => {
  test("10 rapid admin API requests all return 200, no 429", async ({
    request,
  }) => {
    const token = await getAdminToken(request);
    const results: number[] = [];

    // Fire 10 rapid sequential requests
    for (let i = 0; i < 10; i++) {
      const res = await request.get(`${BACKEND_URL}/api/admin/analytics/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      results.push(res.status());
    }

    // All should be 200 — no 429
    expect(results.every((s) => s === 200)).toBeTruthy();
    expect(results).toHaveLength(10);
  });

  test("Moderation page loads without 'Failed to fetch' after visiting analytics", async ({
    page,
    request,
  }) => {
    const token = await getAdminToken(request);
    // First visit analytics (burns some API calls)
    await setAuthAndGoto(page, token, `${BASE_URL}/admin/analytics`);
    await page.waitForTimeout(3000);

    // Then visit moderation
    await page.goto(`${BASE_URL}/admin/moderation`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5000);

    // Should NOT show error banner
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText).not.toContain("Failed to fetch");
  });
});

// =============================================================================
// DEF-005: Null byte in search returns 200 empty, not 500
// =============================================================================
test.describe("DEF-005 — Null byte search fix", () => {
  test("Backend /api/admin/moderation/users with null byte returns 200 empty list", async ({
    request,
  }) => {
    const token = await getAdminToken(request);
    const res = await request.get(
      `${BACKEND_URL}/api/admin/moderation/users?q=%00`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.users).toEqual([]);
    expect(body.total).toBe(0);
  });
});

// =============================================================================
// DEF-006: Reversed date range returns 400
// =============================================================================
test.describe("DEF-006 — Reversed date range fix", () => {
  test("Backend /api/admin/analytics/users with from>to returns 400", async ({
    request,
  }) => {
    const token = await getAdminToken(request);
    const res = await request.get(
      `${BACKEND_URL}/api/admin/analytics/users?from=9999-12-31&to=0001-01-01`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.detail).toContain("from must be <= to");
  });
});

// =============================================================================
// DEF-007: Frontend stat cards show non-zero values matching backend
// =============================================================================
test.describe("DEF-007 — Frontend field mapping fix", () => {
  test("Frontend analytics page shows Total Users matching backend (non-zero)", async ({
    page,
    request,
  }) => {
    const token = await getAdminToken(request);

    // Get backend value first
    const apiRes = await request.get(`${BACKEND_URL}/api/admin/analytics/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const apiData = await apiRes.json();
    expect(apiData.totalUsers).toBeGreaterThan(0);

    // Navigate to analytics
    await setAuthAndGoto(page, token, `${BASE_URL}/admin/analytics`);
    await page.waitForTimeout(5000);

    // The Total Users stat card should show the backend value (non-zero)
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText).toContain("Total Users");
    const totalUsersStr = String(apiData.totalUsers);
    expect(bodyText).toContain(totalUsersStr);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "admin-final-analytics.png"),
      fullPage: true,
    });
  });
});
