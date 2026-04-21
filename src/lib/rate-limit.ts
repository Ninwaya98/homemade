import "server-only";

import { headers } from "next/headers";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Abuse protection. Opts in when the two Upstash env vars are set;
 * otherwise every helper reports success so local dev and environments
 * without Redis configured just work.
 *
 * Required env vars (set in Vercel):
 *   UPSTASH_REDIS_REST_URL    — from Upstash console
 *   UPSTASH_REDIS_REST_TOKEN  — from Upstash console
 */

const hasUpstash = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasUpstash ? Redis.fromEnv() : null;

function makeLimiter(label: string, tokens: number, window: Parameters<typeof Ratelimit.slidingWindow>[1]): Ratelimit | null {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, window),
    analytics: true,
    prefix: `hm:${label}`,
  });
}

// Credential-targeted endpoints (sign-in / forgot-password).
const authLimiter = makeLimiter("auth", 5, "1 m");

// Account creation — abuse = mass fake accounts.
const signUpLimiter = makeLimiter("signup", 3, "1 h");

// Placing market orders — abuse = order spam / inventory nuking.
const orderLimiter = makeLimiter("order", 30, "1 h");

// AI moderation endpoint — abuse = burning through Anthropic quota.
const moderationLimiter = makeLimiter("moderation", 20, "1 m");

export type LimitResult = {
  success: boolean;
  /** Seconds until the user can retry. 0 when success is true. */
  retryAfter: number;
  /** Human-friendly error message suitable for showing to the user. */
  message: string | null;
};

function describe(success: boolean, reset: number, retryLabel: string): LimitResult {
  if (success) return { success: true, retryAfter: 0, message: null };
  const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  return {
    success: false,
    retryAfter,
    message: `Too many ${retryLabel}. Please wait ${retryAfter} seconds and try again.`,
  };
}

/** Resolves the best IP header for the current request. */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = h.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

export async function checkAuthLimit(identifier: string): Promise<LimitResult> {
  if (!authLimiter) return { success: true, retryAfter: 0, message: null };
  const { success, reset } = await authLimiter.limit(identifier);
  return describe(success, reset, "sign-in attempts");
}

export async function checkSignUpLimit(identifier: string): Promise<LimitResult> {
  if (!signUpLimiter) return { success: true, retryAfter: 0, message: null };
  const { success, reset } = await signUpLimiter.limit(identifier);
  return describe(success, reset, "sign-up attempts");
}

export async function checkOrderLimit(identifier: string): Promise<LimitResult> {
  if (!orderLimiter) return { success: true, retryAfter: 0, message: null };
  const { success, reset } = await orderLimiter.limit(identifier);
  return describe(success, reset, "order attempts");
}

export async function checkModerationLimit(identifier: string): Promise<LimitResult> {
  if (!moderationLimiter) return { success: true, retryAfter: 0, message: null };
  const { success, reset } = await moderationLimiter.limit(identifier);
  return describe(success, reset, "moderation requests");
}
