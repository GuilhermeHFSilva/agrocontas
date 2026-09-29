import { ApiResponse } from "../../src/types/nfe";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-gemini-api-key, x-gemini-model",
  "Content-Type": "application/json",
};

export function jsonResponse<T>(payload: ApiResponse<T>, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: CORS_HEADERS,
  });
}

export function jsonSuccess<T>(data: T, message?: string, status = 200): Response {
  return jsonResponse<T>(
    {
      success: true,
      message,
      data,
    },
    status
  );
}

export function jsonError(errorMessage: string, status = 400): Response {
  return jsonResponse(
    {
      success: false,
      error: errorMessage,
    },
    status
  );
}

export function handleCorsPreflight(): Response {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
