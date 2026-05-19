// GET /api/ai/usage — current user's AI-call usage for this calendar month.
//
// Used by the frontend to render a "X / 500 this month" widget on the
// subscription page and a proactive banner once the user crosses 80% of
// the cap. Authenticated via Supabase JWT; the user can only read their
// own counters.

import { jsonResponse, fail, handleOptions } from '../lib/responses';
import { requireEnv } from '../lib/env';
import { verifySupabaseToken, extractBearerToken } from '../lib/supabase-auth';
import { AI_MONTHLY_CAP, countAiEventsThisMonth } from '../lib/rate-limit';
import type { LambdaResponse, NetlifyEvent } from '../lib/types';

function _startOfNextMonthIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0)).toISOString();
}

export const handler = async (event: NetlifyEvent): Promise<LambdaResponse> => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return fail(405, 'Method not allowed');
  }

  const token = extractBearerToken(event.headers);
  if (!token) return fail(401, 'Missing authorization token');
  const user = await verifySupabaseToken(token);
  if (!user) return fail(401, 'Invalid or expired token');

  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const used = await countAiEventsThisMonth(serviceKey, user.id);
  const limit = AI_MONTHLY_CAP;
  const percentUsed = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  return jsonResponse(200, {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    percentUsed,
    resetsAt: _startOfNextMonthIso()
  });
};
