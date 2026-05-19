import { supaRequest } from './supabase-admin';
import { getCorsHeaders } from './cors';
import { logSecurityEvent } from './logger';
import { optionalEnv } from './env';
import type { LambdaResponse } from './types';

/** Global monthly AI call cap. Default 500 covers heavy legitimate use while
 *  protecting against runaway-cost scripts. Override with the env var. */
export const AI_MONTHLY_CAP = parseInt(optionalEnv('AI_MONTHLY_CAP', '500'), 10);

// Counts recent security_events for a user within a rolling window.
export async function countRecentEvents(
  serviceKey: string,
  userId: string,
  eventType: string,
  windowMs: number
): Promise<number> {
  const since = new Date(Date.now() - windowMs).toISOString();
  const path =
    'security_events?user_id=eq.' + encodeURIComponent(userId) +
    '&event_type=eq.' + encodeURIComponent(eventType) +
    '&created_at=gte.' + encodeURIComponent(since) +
    '&select=id';
  const res = await supaRequest<unknown[]>('GET', path, null, serviceKey);
  return Array.isArray(res.body) ? res.body.length : 0;
}

// Counts recent messages for a user within a rolling window (chat rate limit).
export async function countRecentMessages(
  serviceKey: string,
  userId: string,
  windowMs: number
): Promise<number> {
  const since = new Date(Date.now() - windowMs).toISOString();
  const path =
    'messages?user_id=eq.' + encodeURIComponent(userId) +
    '&created_at=gte.' + encodeURIComponent(since) +
    '&select=id';
  const res = await supaRequest<unknown[]>('GET', path, null, serviceKey);
  return Array.isArray(res.body) ? res.body.length : 0;
}

// Returns a 429 response with Retry-After header.
export function rateLimitResponse(windowMs: number, message?: string): LambdaResponse {
  return {
    statusCode: 429,
    headers: {
      ...getCorsHeaders(),
      'Retry-After': String(Math.ceil(windowMs / 1000))
    },
    body: JSON.stringify({ error: { message: message || 'Rate limit exceeded. Try again soon.' } })
  };
}

export async function enforceEventRateLimit(
  serviceKey: string,
  userId: string,
  eventType: string,
  maxEvents: number,
  windowMs: number,
  message?: string,
  metadata?: Record<string, unknown>
): Promise<LambdaResponse | null> {
  const count = await countRecentEvents(serviceKey, userId, eventType, windowMs);
  if (count < maxEvents) return null;
  await logSecurityEvent(serviceKey, userId, eventType + '_rate_limited', {
    count,
    ...(metadata || {})
  });
  return rateLimitResponse(windowMs, message);
}

// ── Monthly combined cap across all AI endpoints ───────────────────────────
//
// The hourly per-endpoint caps stop short-burst abuse, but a focused user can
// still reach ~21k calls/month at gpt-4o pricing — a net loss against the
// €11.99 subscription. This cap counts every AI call across all endpoints in
// the current calendar month (UTC) and blocks further calls past the budget.
// The window resets at the first of the month so we can keep the "unlimited"
// marketing language as long as fair-use is documented in the AGB.

const AI_EVENT_TYPES = [
  'ai_ask',
  'ai_generate',
  'ai_chat',
  'notes_generate',
  'writing_coach_analyse',
  'ask_stream'
] as const;

function _startOfMonthIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)).toISOString();
}

function _startOfNextMonthIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0)).toISOString();
}

export async function countAiEventsThisMonth(
  serviceKey: string,
  userId: string
): Promise<number> {
  const since = _startOfMonthIso();
  const types = AI_EVENT_TYPES.map(encodeURIComponent).join(',');
  const path =
    'security_events?user_id=eq.' + encodeURIComponent(userId) +
    '&event_type=in.(' + types + ')' +
    '&created_at=gte.' + encodeURIComponent(since) +
    '&select=id';
  const res = await supaRequest<unknown[]>('GET', path, null, serviceKey);
  return Array.isArray(res.body) ? res.body.length : 0;
}

/** Returns null if the user is within their monthly AI budget, or a 429
 *  LambdaResponse with a Retry-After header set to "seconds until the 1st
 *  of next month". */
export async function enforceMonthlyAiCap(
  serviceKey: string,
  userId: string,
  maxEvents: number
): Promise<LambdaResponse | null> {
  const count = await countAiEventsThisMonth(serviceKey, userId);
  if (count < maxEvents) return null;
  await logSecurityEvent(serviceKey, userId, 'ai_monthly_cap_blocked', {
    count,
    cap: maxEvents
  }).catch(() => undefined);
  const secondsUntilReset = Math.max(
    60,
    Math.floor((new Date(_startOfNextMonthIso()).getTime() - Date.now()) / 1000)
  );
  return {
    statusCode: 429,
    headers: {
      ...getCorsHeaders(),
      'Retry-After': String(secondsUntilReset)
    },
    body: JSON.stringify({
      error: {
        // `code` lets the client recognise the cap (vs. generic rate-limit)
        // and surface a dedicated modal instead of a generic toast.
        code: 'ai_monthly_cap',
        message:
          "You've reached this month's fair-use limit (" +
          maxEvents +
          ' AI calls). It resets on the 1st of next month.',
        used: count,
        limit: maxEvents,
        resetsAt: _startOfNextMonthIso()
      }
    })
  };
}
