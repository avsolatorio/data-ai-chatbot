import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth-service";
import { getBearerTokenFromRequest } from "@/lib/auth/cookies";
import { ChatSDKError } from "@/lib/errors";
import { serverApiFetch } from "@/lib/server-api-client";

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
  const bearerToken = getBearerTokenFromRequest(request);

  if (!user && !bearerToken) {
    return new ChatSDKError("unauthorized:suggestions").toResponse();
  }

  const response = await serverApiFetch(
    `/api/chat/suggestions?documentId=${documentId}`,
    { cache: "no-store" },
    { bearerToken: bearerToken ?? undefined }
  );

  if (!response.ok) {
    return new Response(response.body, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const suggestions = await response.json();
  return Response.json(suggestions, { status: 200 });
}
