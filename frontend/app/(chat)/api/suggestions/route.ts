import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth-service";
import { getBearerTokenFromRequest } from "@/lib/auth/cookies";
import { ChatSDKError } from "@/lib/errors";
import { serverApiFetch } from "@/lib/server-api-client";

const API_URL =
  process.env.SERVER_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8001";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get("documentId");

  if (!documentId) {
    return new ChatSDKError(
      "bad_request:api",
      "Parameter documentId is required.",
    ).toResponse();
  }

  const user = await getCurrentUser();
  const bearerFromRequest = getBearerTokenFromRequest(request);

  if (!user && !bearerFromRequest) {
    return new ChatSDKError("unauthorized:suggestions").toResponse();
  }

  const url = `${API_URL}/api/chat/suggestions?documentId=${documentId}`;
  const init: RequestInit = {
    cache: "no-store",
    ...(bearerFromRequest && {
      headers: { Authorization: `Bearer ${bearerFromRequest}` },
    }),
  };
  const response = bearerFromRequest
    ? await fetch(url, init)
    : await serverApiFetch(`/api/chat/suggestions?documentId=${documentId}`);

  if (!response.ok) {
    return new Response(response.body, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const suggestions = await response.json();
  return Response.json(suggestions, { status: 200 });
}
