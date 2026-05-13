// Stripe API helpers. Uses STRIPE_SECRET_KEY from env.

import https from 'https';
import { requireEnv } from './env';
import type { SupaResult } from './types';

export function stripePost<T = unknown>(path: string, params: URLSearchParams): Promise<SupaResult<T>> {
  return new Promise<SupaResult<T>>(function (resolve, reject) {
    const secretKey = requireEnv('STRIPE_SECRET_KEY');
    const bodyStr = params.toString();
    const req = https.request(
      {
        hostname: 'api.stripe.com',
        path,
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(secretKey + ':').toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': String(Buffer.byteLength(bodyStr))
        }
      },
      function (res) {
        let data = '';
        res.on('data', function (c) { data += c; });
        res.on('end', function () {
          try {
            resolve({ status: res.statusCode ?? 0, body: JSON.parse(data) as T });
          } catch {
            resolve({ status: res.statusCode ?? 0, body: data as unknown as T });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

export function stripeGet<T = unknown>(path: string): Promise<SupaResult<T>> {
  return new Promise<SupaResult<T>>(function (resolve, reject) {
    const secretKey = requireEnv('STRIPE_SECRET_KEY');
    const req = https.request(
      {
        hostname: 'api.stripe.com',
        path,
        method: 'GET',
        headers: {
          Authorization: 'Basic ' + Buffer.from(secretKey + ':').toString('base64')
        }
      },
      function (res) {
        let data = '';
        res.on('data', function (c) { data += c; });
        res.on('end', function () {
          try {
            resolve({ status: res.statusCode ?? 0, body: JSON.parse(data) as T });
          } catch {
            resolve({ status: res.statusCode ?? 0, body: data as unknown as T });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}
