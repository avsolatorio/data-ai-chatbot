/**
 * Catch-all API proxy route.
 * Forwards all API requests to the backend API (NEXT_PUBLIC_API_URL).
 * This avoids CORS issues and centralizes API configuration.
 *
 * More specific routes (like /api/auth/*) take precedence over this catch-all.
 */

import type { NextRequest, NextResponse } from "next/server";
import { NextResponse as NextResponseValue } from "next/server";

const API_URL =
  process.env.SERVER_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8001";

/**
 * Derive the client-facing origin from the request so redirects stay on the host the user used.
 * Uses, in order: X-Forwarded-* headers, Referer (browser page URL), NEXT_PUBLIC_APP_URL, then request host.
 */
function getRequestOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedHost && forwardedProto) {
    const host = forwardedHost.split(",")[0]?.trim() ?? "";
    const proto = forwardedProto.split(",")[0]?.trim() ?? "https";
    if (host) return `${proto}://${host}`;
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const refUrl = new URL(referer);
      if (refUrl.origin && (refUrl.protocol === "http:" || refUrl.protocol === "https:")) {
        return refUrl.origin;
      }
    } catch {
      // Ignore invalid Referer
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) {
    try {
      const appOrigin = new URL(appUrl).origin;
      if (appOrigin) return appOrigin;
    } catch {
      // Ignore invalid URL
    }
  }

  const host = request.headers.get("host") ?? request.nextUrl.host;
  const proto =
    request.nextUrl.protocol === "https:" ? "https" : "http";
  return `${proto}://${host}`;
}

/**
 * If Location points at the backend host, rewrite it to the request origin so the user is not sent to the internal host.
 */
function rewriteRedirectLocation(
  location: string,
  request: NextRequest,
): string {
  try {
    const locUrl = new URL(location, API_URL);
    const apiOrigin = new URL(API_URL).origin;
    if (locUrl.origin !== apiOrigin) {
      return location;
    }
    const clientOrigin = getRequestOrigin(request);
    const rewritten = new URL(locUrl.pathname + locUrl.search, clientOrigin);
    return rewritten.toString();
  } catch {
    return location;
  }
}

/**
 * Forward request to backend API
 */
async function proxyRequest(
  request: NextRequest,
  path: string[],
): Promise<NextResponse> {
  // Reconstruct the path
  // The catch-all route captures everything after /api/, so we need to add /api/ back
  const pathString = path.join("/");
  const searchParams = request.nextUrl.searchParams.toString();
  const queryString = searchParams ? `?${searchParams}` : "";

  // Build the backend URL - add /api/ prefix since backend expects it
  const backendUrl = `${API_URL}/api/${pathString}${queryString}`;

  // Get request body if present
  let body: BodyInit | undefined;
  const contentType = request.headers.get("content-type");

  if (request.method !== "GET" && request.method !== "HEAD") {
    if (contentType?.includes("application/json")) {
      body = await request.text();
    } else if (contentType?.includes("multipart/form-data")) {
      body = await request.formData();
    } else if (contentType?.includes("application/x-www-form-urlencoded")) {
      body = await request.text();
    } else {
      // For other content types (including binary), use arrayBuffer
      body = await request.arrayBuffer();
    }
  }

  // Prepare headers to forward
  const headers = new Headers();

  // Forward important headers
  const headersToForward = [
    "authorization",
    "content-type",
    "accept",
    "accept-language",
    "user-agent",
    "x-requested-with",
  ];

  for (const headerName of headersToForward) {
    const headerValue = request.headers.get(headerName);
    if (headerValue) {
      headers.set(headerName, headerValue);
    }
  }

  // Forward cookies
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }

  try {
    // Validate backend URL
    if (!API_URL || API_URL.trim() === "") {
      return NextResponseValue.json(
        {
          error: "Backend API URL not configured",
          message: "NEXT_PUBLIC_API_URL or SERVER_API_URL must be set",
        },
        { status: 500 },
      );
    }

    // Make the request to the backend with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout

    let response: Response;
    try {
      response = await fetch(backendUrl, {
        method: request.method,
        headers,
        body,
        signal: controller.signal,
        // Don't follow redirects automatically - let the client handle them
        redirect: "manual",
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        return NextResponseValue.json(
          {
            error: "Request timeout",
            message: "The backend request took too long to respond",
          },
          { status: 504 },
        );
      }
      // Network errors (connection refused, DNS failure, etc.)
      if (fetchError instanceof TypeError) {
        return NextResponseValue.json(
          {
            error: "Backend connection failed",
            message:
              "Unable to connect to the backend server. Please check if the backend is running.",
          },
          { status: 503 },
        );
      }
      throw fetchError;
    }

    // Handle redirects (3xx status codes). Rewrite Location if it points at the backend so the user stays on the client-facing host.
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (location) {
        const redirectTo = rewriteRedirectLocation(location, request);
        return NextResponseValue.redirect(redirectTo, response.status);
      }
    }

    // Check if this is a streaming response (Server-Sent Events or other streaming content)
    const contentType = response.headers.get("content-type") || "";
    const isStreaming =
      contentType.includes("text/event-stream") ||
      contentType.includes("application/stream+json") ||
      contentType.includes("text/stream") ||
      response.headers.get("transfer-encoding") === "chunked";

    let proxiedResponse: NextResponseValue;

    if (isStreaming) {
      // For streaming responses, pipe the stream through
      // Create a ReadableStream that forwards chunks from the backend
      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body?.getReader();
          if (!reader) {
            controller.close();
            return;
          }

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                controller.close();
                break;
              }
              controller.enqueue(value);
            }
          } catch (error) {
            controller.error(error);
          } finally {
            reader.releaseLock();
          }
        },
      });

      // Next.js doesn't accept 204 for streaming responses, convert to 200
      // Also ensure status code is valid (200-599)
      let statusCode = response.status;
      if (statusCode === 204) {
        statusCode = 200; // Convert 204 to 200 for streaming
      } else if (statusCode < 200 || statusCode >= 600) {
        statusCode = 200; // Fallback to 200 for invalid status codes
      }
      proxiedResponse = new NextResponseValue(stream, {
        status: statusCode,
        statusText: response.statusText || "OK",
      });
    } else {
      // For non-streaming responses, buffer the entire body
      // Ensure status code is valid
      let statusCode = response.status;
      if (statusCode < 100 || statusCode >= 600) {
        statusCode = 500; // Fallback for invalid status codes
      }
      const responseBody = await response.arrayBuffer();
      proxiedResponse = new NextResponseValue(responseBody, {
        status: statusCode,
        statusText: response.statusText || "OK",
      });
    }

    // Forward important response headers
    const responseHeadersToForward = [
      "content-type",
      "content-disposition",
      "set-cookie",
      "location", // For redirects
      "cache-control",
      "etag",
      "last-modified",
      "connection", // Important for streaming
      "x-accel-buffering", // Disable buffering for streaming
      "retry-after", // For rate limiting
      "x-ratelimit-limit", // Rate limit headers
      "x-ratelimit-remaining",
      "x-ratelimit-reset",
    ];

    // Only forward content-length for non-streaming responses
    if (!isStreaming) {
      responseHeadersToForward.push("content-length");
    }

    for (const headerName of responseHeadersToForward) {
      const headerValue = response.headers.get(headerName);
      if (headerValue) {
        proxiedResponse.headers.set(headerName, headerValue);
      }
    }

    // Set streaming-specific headers if needed
    if (isStreaming) {
      // Ensure proper headers for Server-Sent Events
      if (!proxiedResponse.headers.has("cache-control")) {
        proxiedResponse.headers.set("cache-control", "no-cache");
      }
      if (!proxiedResponse.headers.has("connection")) {
        proxiedResponse.headers.set("connection", "keep-alive");
      }
    }

    // Forward CORS headers if present
    const corsHeaders = [
      "access-control-allow-origin",
      "access-control-allow-credentials",
      "access-control-allow-methods",
      "access-control-allow-headers",
      "access-control-expose-headers",
    ];

    for (const headerName of corsHeaders) {
      const headerValue = response.headers.get(headerName);
      if (headerValue) {
        proxiedResponse.headers.set(headerName, headerValue);
      }
    }

    return proxiedResponse;
  } catch (error) {
    console.error("Proxy error:", error);

    // Provide more specific error messages
    let statusCode = 502;
    let errorMessage = "Failed to proxy request to backend";

    if (error instanceof Error) {
      if (
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("ENOTFOUND")
      ) {
        statusCode = 503;
        errorMessage = "Backend server is not available";
      } else if (
        error.message.includes("timeout") ||
        error.message.includes("aborted")
      ) {
        statusCode = 504;
        errorMessage = "Backend request timed out";
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponseValue.json(
      {
        error: errorMessage,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: statusCode },
    );
  }
}

// Handle all HTTP methods
// Note: In Next.js 15+, params is a Promise and must be awaited
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function OPTIONS(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyRequest(request, path);
}
