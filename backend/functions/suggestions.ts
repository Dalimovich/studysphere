import { requireEnv } from '../lib/env';
import { jsonResponse, fail } from '../lib/responses';
import { getCorsHeaders } from '../lib/cors';
import { supaRequest } from '../lib/supabase-admin';
import { verifySupabaseToken, extractBearerToken } from '../lib/supabase-auth';
import { countRecentEvents, rateLimitResponse } from '../lib/rate-limit';
import { logSecurityEvent } from '../lib/logger';
import type { LambdaResponse, NetlifyEvent } from '../lib/types';

// Crowd-sourced dropdown suggestions for the onboarding modal (Vertiefung)
// and the course-creation field. Once an entry receives 5 submissions it
// auto-promotes to `approved = true` (see supabase/migrations/.._suggestions.sql)
// and starts appearing in everyone's dropdown.

const KINDS = new Set(['vertiefung', 'course']);
const MAX_VALUE_LEN = 120;
const MAX_PARENT_LEN = 120;
const SUBMIT_RATE_LIMIT_MAX = 60;
const SUBMIT_RATE_LIMIT_WINDOW = 60 * 60 * 1000;

interface SuggestionRow {
  value: string;
  count: number;
  parent: string;
}

interface RpcRow {
  id: string;
  count: number;
  approved: boolean;
}

function clean(input: unknown, max: number): string {
  return String(input || '').trim().slice(0, max);
}

export const handler = async (event: NetlifyEvent): Promise<LambdaResponse> => {
  const corsHeaders = {
    ...getCorsHeaders(),
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const token = extractBearerToken(event.headers);
  if (!token) return fail(401, 'Unauthorized');
  const user = await verifySupabaseToken(token);
  if (!user || !user.id) return fail(401, 'Invalid or expired session');

  // ── GET: list approved entries for a given (kind, parent) ───────────────
  if (event.httpMethod === 'GET') {
    const kind = clean(event.queryStringParameters?.kind, 40);
    const parent = clean(event.queryStringParameters?.parent, MAX_PARENT_LEN) || '*';
    if (!KINDS.has(kind)) return fail(400, 'Invalid kind');

    const path =
      'suggestions?approved=eq.true' +
      '&kind=eq.' + encodeURIComponent(kind) +
      '&parent=eq.' + encodeURIComponent(parent) +
      '&select=value,count,parent' +
      '&order=count.desc,value.asc' +
      '&limit=100';
    const res = await supaRequest<SuggestionRow[]>('GET', path, null, serviceKey);
    if (res.status < 200 || res.status >= 300) return fail(500, 'Could not load suggestions');
    const items = (Array.isArray(res.body) ? res.body : []).map((r) => ({
      value: r.value,
      count: r.count,
    }));
    return jsonResponse(200, { items });
  }

  // ── POST: increment counter for a submission ────────────────────────────
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
  }

  let body: { kind?: unknown; parent?: unknown; value?: unknown } = {};
  try { body = JSON.parse(event.body || '{}'); } catch { return fail(400, 'Invalid JSON'); }
  const kind = clean(body.kind, 40);
  const parent = clean(body.parent, MAX_PARENT_LEN) || '*';
  const value = clean(body.value, MAX_VALUE_LEN);
  if (!KINDS.has(kind)) return fail(400, 'Invalid kind');
  if (!value) return fail(400, 'value is required');

  // Per-user rate limit so a single client can't pad the counter.
  const submitCount = await countRecentEvents(
    serviceKey, user.id, 'suggestion_submit', SUBMIT_RATE_LIMIT_WINDOW
  );
  if (submitCount >= SUBMIT_RATE_LIMIT_MAX) {
    await logSecurityEvent(serviceKey, user.id, 'suggestion_submit_rate_limited', {
      count: submitCount,
    });
    return rateLimitResponse(SUBMIT_RATE_LIMIT_WINDOW, 'Too many submissions. Try again later.');
  }
  await logSecurityEvent(serviceKey, user.id, 'suggestion_submit', { kind, parent });

  const rpcRes = await supaRequest<RpcRow[]>(
    'POST',
    'rpc/suggestion_submit',
    { p_kind: kind, p_parent: parent, p_value: value, p_threshold: 5 },
    serviceKey
  );
  if (rpcRes.status < 200 || rpcRes.status >= 300) return fail(500, 'Could not submit suggestion');
  const row = Array.isArray(rpcRes.body) ? rpcRes.body[0] : null;
  return jsonResponse(200, {
    count: row?.count ?? 1,
    approved: !!row?.approved,
  });
};
