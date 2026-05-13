// Supabase REST API helper using the service-role key.
// Reads SUPABASE_URL from env at call time so this module is safe to require at load time.

import https from 'https';
import { requireEnv } from './env';
import type { HttpHeaders, SupaResult } from './types';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export function supaRequest<T = unknown>(
  method: HttpMethod,
  path: string,
  body: unknown,
  serviceKey: string,
  extraHeaders?: HttpHeaders
): Promise<SupaResult<T>> {
  return new Promise<SupaResult<T>>(function (resolve, reject) {
    const supaUrl = requireEnv('SUPABASE_URL');
    const bodyStr = body ? JSON.stringify(body) : '';
    const url = new URL(supaUrl);
    const headers: HttpHeaders = {
      apikey: serviceKey,
      Authorization: 'Bearer ' + serviceKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(extraHeaders || {}),
      ...(bodyStr ? { 'Content-Length': String(Buffer.byteLength(bodyStr)) } : {})
    };
    const req = https.request(
      {
        hostname: url.hostname,
        path: '/rest/v1/' + path,
        method,
        headers
      },
      function (res) {
        let data = '';
        res.on('data', function (c) { data += c; });
        res.on('end', function () {
          try {
            resolve({ status: res.statusCode ?? 0, body: (data ? JSON.parse(data) : null) as T });
          } catch {
            resolve({ status: res.statusCode ?? 0, body: data as unknown as T });
          }
        });
      }
    );
    req.setTimeout(12000, function () { req.destroy(new Error('Supabase REST request timed out')); });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// Supabase Auth Admin API (e.g. /auth/v1/admin/users)
export function supaAuthAdminRequest<T = unknown>(
  method: HttpMethod,
  path: string,
  serviceKey: string
): Promise<SupaResult<T>> {
  return new Promise<SupaResult<T>>(function (resolve, reject) {
    const supaUrl = requireEnv('SUPABASE_URL');
    const req = https.request(
      {
        hostname: new URL(supaUrl).hostname,
        path: '/auth/v1/admin/' + path,
        method,
        headers: {
          apikey: serviceKey,
          Authorization: 'Bearer ' + serviceKey
        }
      },
      function (res) {
        let data = '';
        res.on('data', function (c) { data += c; });
        res.on('end', function () {
          try {
            resolve({ status: res.statusCode ?? 0, body: (data ? JSON.parse(data) : null) as T });
          } catch {
            resolve({ status: res.statusCode ?? 0, body: data as unknown as T });
          }
        });
      }
    );
    req.setTimeout(12000, function () { req.destroy(new Error('Supabase Auth request timed out')); });
    req.on('error', reject);
    req.end();
  });
}

export interface ActiveSubscription {
  plan?: string;
  status: string;
  expires_at?: string | null;
}

/**
 * Fetches the user's subscription and returns it only if it is genuinely active
 * (status = 'active' AND expires_at is either null or in the future).
 * Returns null if the user has no subscription or if it has expired.
 */
export async function getActiveSubscription(
  serviceKey: string,
  userId: string
): Promise<ActiveSubscription | null> {
  const result = await supaRequest<ActiveSubscription[]>(
    'GET',
    'subscriptions?user_id=eq.' + encodeURIComponent(userId) +
      '&select=plan,status,expires_at&limit=1',
    null,
    serviceKey
  );
  const sub = Array.isArray(result.body) ? result.body[0] : undefined;
  if (!sub) return null;
  if (sub.status !== 'active') return null;
  if (sub.expires_at && new Date(sub.expires_at) < new Date()) {
    // Subscription has expired — mark it cancelled so future reads are consistent.
    supaRequest(
      'PATCH',
      'subscriptions?user_id=eq.' + encodeURIComponent(userId),
      { status: 'expired', updated_at: new Date().toISOString() },
      serviceKey,
      { Prefer: 'return=minimal' }
    ).catch(function (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[supabase-admin] subscription expiry patch error:', msg);
    });
    return null;
  }
  return sub;
}
