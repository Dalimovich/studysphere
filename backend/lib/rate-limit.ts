import { supaRequest } from './supabase-admin';
import { getCorsHeaders } from './cors';
import type { LambdaResponse } from './types';

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
