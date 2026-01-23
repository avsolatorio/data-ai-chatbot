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
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.SERVER_API_URL ||
  "http://localhost:8001";

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
    // Make the request to the backend
    const response = await fetch(backendUrl, {
      method: request.method,
      headers,
      body,
      // Don't follow redirects automatically - let the client handle them
      redirect: "manual",
    });

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

      proxiedResponse = new NextResponseValue(stream, {
        status: response.status,
        statusText: response.statusText,
      });
    } else {
      // For non-streaming responses, buffer the entire body
      const responseBody = await response.arrayBuffer();
      proxiedResponse = new NextResponseValue(responseBody, {
        status: response.status,
        statusText: response.statusText,
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
    return NextResponseValue.json(
      {
        error: "Failed to proxy request to backend",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 },
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
