import { optionalEnv, requireEnv } from './env';
import type { HttpHeaders } from './types';

// In production ALLOWED_ORIGIN must be set in Netlify env vars.
// In local dev (netlify dev / unit tests) it falls back to localhost.
// Never falls back to '*' which would allow any origin.
function resolveOrigin(): string {
  const configured = optionalEnv('ALLOWED_ORIGIN', '');
  if (configured) return configured;
  if (optionalEnv('NETLIFY', '') === 'true' || optionalEnv('CONTEXT', '') === 'production') {
    return requireEnv('ALLOWED_ORIGIN');
  }
  return 'http://localhost:8888';
}

export function getCorsHeaders(): HttpHeaders {
  return {
    'Access-Control-Allow-Origin': resolveOrigin(),
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, GET, PATCH, DELETE, OPTIONS'
  };
}
