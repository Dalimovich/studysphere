// POST /api/notes/generate — proxy to Python /notes-generate.

import { jsonResponse, fail, handleOptions } from '../lib/responses';
import { verifySupabaseToken, extractBearerToken } from '../lib/supabase-auth';
import { pythonAiConfigured, forwardToPython } from '../lib/python-ai-proxy';
import type { LambdaResponse, NetlifyEvent } from '../lib/types';

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

  if (!body.courseId) return fail(400, 'courseId is required');
  if (typeof body.tool !== 'string' || !['notes', 'summary'].includes(body.tool)) {
    return fail(400, 'tool must be notes or summary');
  }

  const upstream = await forwardToPython('notes-generate', {
    userId:         user.id,
    courseId:       body.courseId,
    documentId:     body.documentId ?? null,
    tool:           body.tool,
    mode:           body.mode ?? 'generate',
    scope:          body.scope ?? 'document',
    fileName:       body.fileName ?? null,
    pdfText:        body.pdfText ?? null,
    language:       body.language ?? 'same_as_source',
    detailLevel:    body.detailLevel ?? 'balanced',
    currentPage:    body.currentPage != null ? Number(body.currentPage) : null,
    pageRange:      body.pageRange ?? null,
    topicTitle:     body.topicTitle ?? null,
    sections:       body.sections ?? null,
    effectivePages: body.effectivePages != null ? Number(body.effectivePages) : null,
    title:          body.title ?? null
  });
  return jsonResponse(upstream.status, upstream.body);
};
