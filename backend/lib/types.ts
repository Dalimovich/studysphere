// Shared types used across the Netlify backend.

/** HTTP headers as Netlify exposes them — always string-valued. */
export type HttpHeaders = Record<string, string>;

/** Shape of a successful Netlify Functions response. */
export interface LambdaResponse {
  statusCode: number;
  headers?: HttpHeaders;
  body: string;
}

/** Subset of the Netlify Functions event we actually use. */
export interface NetlifyEvent {
  httpMethod: string;
  path?: string;
  headers: HttpHeaders;
  queryStringParameters?: Record<string, string | undefined> | null;
  body?: string | null;
  isBase64Encoded?: boolean;
}

/** Subset of the Netlify Functions context we actually use. */
export interface NetlifyContext {
  clientContext?: { user?: { sub?: string } };
}

/** Standard Supabase REST result shape used by `supaRequest`. */
export interface SupaResult<T = unknown> {
  status: number;
  body: T;
}

/** Supabase Auth user record (only the fields we read). */
export interface SupabaseUser {
  id: string;
  email?: string;
  [key: string]: unknown;
}

/** Result returned by `forwardToPython`. */
export interface PythonProxyResult<T = unknown> {
  ok: boolean;
  status: number;
  body: T | { error: string } | { raw: string };
}
