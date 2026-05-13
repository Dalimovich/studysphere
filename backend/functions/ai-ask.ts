// POST /api/ai/ask — thin proxy to the Python /ask endpoint.

import { jsonResponse, fail, handleOptions } from '../lib/responses';
import { verifySupabaseToken, extractBearerToken } from '../lib/supabase-auth';
import { pythonAiConfigured, forwardToPython } from '../lib/python-ai-proxy';
import type { LambdaResponse, NetlifyEvent } from '../lib/types';

interface GroundedSource {
  fileName?: string;
  pageStart?: number | null;
  pageEnd?: number | null;
  sectionTitle?: string | null;
}

interface AskResponseBody {
  answer?: string;
  retrievalMode?: string;
  groundedSources?: GroundedSource[];
  cacheHit?: boolean;
  model?: string | null;
}

interface MappedSource {
  file_name: string;
  pages: string | null;
  section?: string | null;
}

function _mapSources(groundedSources: GroundedSource[] | undefined): MappedSource[] {
  return (groundedSources || []).map((s) => {
    const ps = s.pageStart ?? null;
    const pe = s.pageEnd ?? null;
    let pages: string | null = null;
    if (ps && pe) pages = ps === pe ? String(ps) : `${ps}-${pe}`;
    else if (ps) pages = String(ps);
    return { file_name: s.fileName || 'Unknown', pages, section: s.sectionTitle ?? null };
  });
}

export const handler = async (event: NetlifyEvent): Promise<LambdaResponse> => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') return fail(405, 'Method not allowed');

  const token = extractBearerToken(event.headers);
  if (!token) return fail(401, 'Missing authorization token');
  const user = await verifySupabaseToken(token);
  if (!user) return fail(401, 'Invalid or expired token');
  if (!pythonAiConfigured()) return fail(503, 'AI service not configured');

  let body: Record<string, unknown>;
  try { body = JSON.parse(event.body || '{}') as Record<string, unknown>; }
  catch { return fail(400, 'Invalid JSON'); }

  const courseId = body.courseId;
  const question = body.question;
  if (!courseId || typeof courseId !== 'string') return fail(400, 'courseId is required');
  if (!question || typeof question !== 'string') return fail(400, 'question is required');

  const documentIds: string[] | null = Array.isArray(body.documentIds)
    ? (body.documentIds as string[])
    : typeof body.documentId === 'string' ? [body.documentId] : null;

  const upstream = await forwardToPython<AskResponseBody>('ask', {
    userId: user.id,
    courseId,
    documentIds,
    question,
    bypassCache: Boolean(body.bypassCache)
  });

  if (!upstream.ok) return jsonResponse(upstream.status, upstream.body);
  const py = upstream.body as AskResponseBody;
  return jsonResponse(200, {
    answer: py.answer || '',
    retrievalMode: py.retrievalMode || 'strong',
    confidence: py.retrievalMode === 'strong' ? 'high' : 'low',
    unsupported: py.retrievalMode !== 'strong',
    sources: _mapSources(py.groundedSources),
    cacheHit: Boolean(py.cacheHit),
    model: py.model ?? null
  });
};
