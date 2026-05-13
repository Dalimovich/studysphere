// POST /api/ai/generate — proxy to Python /generate-{quiz,flashcards,notes}.

import { jsonResponse, fail, handleOptions } from '../lib/responses';
import { verifySupabaseToken, extractBearerToken } from '../lib/supabase-auth';
import { pythonAiConfigured, forwardToPython } from '../lib/python-ai-proxy';
import type { LambdaResponse, NetlifyEvent } from '../lib/types';

const _LETTERS = ['A', 'B', 'C', 'D'] as const;

interface PyQuizQuestion {
  type?: string;
  options?: Record<string, unknown>;
  answer?: string | number;
  [k: string]: unknown;
}

interface PyResponse {
  questions?: PyQuizQuestion[];
  cards?: unknown[];
  text?: string;
  groundedSources?: unknown[];
  warning?: string;
}

function _normaliseQuizQuestions(questions: PyQuizQuestion[] | undefined): unknown[] {
  return (questions || []).map((q) => {
    if ((q.type || 'mcq') !== 'mcq') return q;
    const opts = q.options || {};
    const arr = _LETTERS.map((L) => (typeof opts[L] === 'string' ? (opts[L] as string) : ''));
    let ansIdx = -1;
    if (typeof q.answer === 'string') {
      const m = q.answer.trim().toUpperCase().match(/^([A-D])/);
      if (m && m[1]) ansIdx = _LETTERS.indexOf(m[1] as 'A' | 'B' | 'C' | 'D');
    } else if (typeof q.answer === 'number') {
      ansIdx = q.answer;
    }
    return { ...q, options: arr, answer: ansIdx };
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
  const tool = body.tool;
  const topic = body.topic;
  const count = body.count;
  const difficulty = body.difficulty;
  const rawDocumentIds = (body.documentIds ?? body.docIds) as unknown;
  if (!courseId || typeof courseId !== 'string') return fail(400, 'courseId is required');
  if (typeof tool !== 'string' || !['flashcards', 'quiz', 'summary'].includes(tool)) {
    return fail(400, 'tool must be flashcards, quiz, or summary');
  }

  const docIds = Array.isArray(rawDocumentIds) && rawDocumentIds.length ? (rawDocumentIds as string[]) : null;
  const requestedCount = parseInt(String(count), 10) || (tool === 'flashcards' ? 10 : 8);

  let endpoint: string;
  let pyPayload: Record<string, unknown>;
  if (tool === 'quiz') {
    endpoint = 'generate-quiz';
    pyPayload = {
      userId: user.id, courseId, documentIds: docIds,
      requestedCount, difficulty: (typeof difficulty === 'string' ? difficulty : 'medium'), save: false
    };
  } else if (tool === 'flashcards') {
    endpoint = 'generate-flashcards';
    pyPayload = { userId: user.id, courseId, documentIds: docIds, requestedCount, save: false };
  } else {
    endpoint = 'generate-notes';
    pyPayload = { userId: user.id, courseId, documentIds: docIds, topic: topic ?? null, save: false };
  }

  const upstream = await forwardToPython<PyResponse>(endpoint, pyPayload);
  if (!upstream.ok) {
    const err = (upstream.body as { error?: string }).error;
    return jsonResponse(200, {
      tool, items: [], text: '', sources: [],
      error: 'AI generation is temporarily unavailable: ' + (err || 'upstream ' + upstream.status)
    });
  }

  const py = upstream.body as PyResponse;
  let mapped: Record<string, unknown>;
  if (tool === 'summary') {
    mapped = { tool, items: [], text: py.text || '', sources: py.groundedSources || [] };
  } else if (tool === 'quiz') {
    mapped = { tool, items: _normaliseQuizQuestions(py.questions), sources: [] };
  } else {
    mapped = { tool, items: py.cards || [], sources: [] };
  }
  if (py.warning) mapped.error = py.warning;
  return jsonResponse(200, mapped);
};
