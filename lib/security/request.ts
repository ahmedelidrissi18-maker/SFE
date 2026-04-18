import { NextResponse } from "next/server";
import type { RateLimitResult } from "@/lib/security/rate-limit";

type RequestLike = {
  headers: Headers;
};

type RateLimitedResponseInput =
  | {
      body: BodyInit | null;
      headers?: HeadersInit;
      statusText?: string;
    }
  | {
      json: unknown;
      headers?: HeadersInit;
      statusText?: string;
    };

export function extractRequestIp(request: RequestLike) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();

  return forwardedFor || realIp || null;
}

export function extractUserAgent(request: RequestLike) {
  return request.headers.get("user-agent")?.trim() || null;
}

export function buildActorRateLimitKey(...parts: Array<string | null | undefined>) {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(":");
}

export function buildRateLimitHeaders(result: RateLimitResult, headers?: HeadersInit) {
  const mergedHeaders = new Headers(headers);
  mergedHeaders.set("Retry-After", String(result.retryAfterSeconds));
  mergedHeaders.set("X-RateLimit-Limit", String(result.limit));
  mergedHeaders.set("X-RateLimit-Remaining", String(result.remaining));
  mergedHeaders.set("X-RateLimit-Reset", result.resetAt.toISOString());
  return mergedHeaders;
}

export function buildRateLimitedResponse(
  result: RateLimitResult,
  input: RateLimitedResponseInput,
) {
  const headers = buildRateLimitHeaders(result, input.headers);

  if ("json" in input) {
    return NextResponse.json(input.json, {
      status: 429,
      statusText: input.statusText,
      headers,
    });
  }

  return new NextResponse(input.body, {
    status: 429,
    statusText: input.statusText,
    headers,
  });
}

