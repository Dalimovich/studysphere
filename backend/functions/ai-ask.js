// POST /api/ai/ask
// RAG endpoint: embeds the question, retrieves relevant chunks from the student's
// course documents, then calls Claude with only those chunks as context.
//
// Request body:
//   { courseId, question, mode? }
//   mode: "strict" (default) | "general"
//
// Response:
//   { answer, sources, confidence, unsupported }

const https = require('https');
const crypto = require('crypto');
const { requireEnv, optionalEnv } = require('../lib/env');
const { jsonResponse, fail, handleOptions } = require('../lib/responses');
const { verifySupabaseToken, extractBearerToken } = require('../lib/supabase-auth');
const { supaRequest } = require('../lib/supabase-admin');
const { countRecentEvents, rateLimitResponse } = require('../lib/rate-limit');

const EMBED_MODEL = 'text-embedding-3-small';
const EMBED_DIMENSIONS = 1536;
const OPENAI_CHAT_MODEL = optionalEnv('AI_MODEL', 'gpt-4o');
const OPENAI_FAST_MODEL = 'gpt-4o-mini'; // used for HyDE + query expansion (cheap, fast)
const MAX_CHUNKS = 12;
const MIN_SIMILARITY = 0.12;
const STRONG_SIMILARITY_THRESHOLD = 0.3;
const MAX_COMPLETION_TOKENS = 3000;

const AI_RATE_LIMIT_MAX = Number(optionalEnv('AI_RATE_LIMIT_MAX', '20'));
const AI_RATE_LIMIT_WINDOW_MS = Number(optionalEnv('AI_RATE_LIMIT_WINDOW_MS', '3600000'));

// Source type priority boost for ranking (added to cosine similarity)
const SOURCE_BOOST = {
  solution: 0.08,
  exercise: 0.08,
  lecture: 0.1,
  exam: 0.06,
  notes: 0.02,
  summary: -0.03,
  other: 0.0
};

// ─── OpenAI embeddings ────────────────────────────────────────────────────────

function embedQuestion(question) {
  return new Promise(function (resolve, reject) {
    const apiKey = requireEnv('OPENAI_API_KEY');
    const body = JSON.stringify({
      model: EMBED_MODEL,
      input: question,
      dimensions: EMBED_DIMENSIONS
    });
    const req = https.request(
      {
        hostname: 'api.openai.com',
        path: '/v1/embeddings',
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + apiKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        }
      },
      function (res) {
        let data = '';
        res.on('data', function (c) {
          data += c;
        });
        res.on('end', function () {
          try {
            const parsed = JSON.parse(data);
            if (!parsed.data || !parsed.data[0])
              return reject(new Error('Embedding failed: ' + data));
            resolve(parsed.data[0].embedding);
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── HyDE + multi-query ───────────────────────────────────────────────────────
// HyDE: generate a short hypothetical passage that would answer the question,
// then embed that passage. Documents are written as answers; this closes the
// vocabulary gap and dramatically improves retrieval for technical content.
//
// Multi-query: also generate 2 alternative phrasings, retrieve for each,
// then merge results. Catches chunks that one phrasing misses.

function callFastOpenAI(systemPrompt, userMsg, maxTokens) {
  return new Promise(function (resolve, reject) {
    const apiKey = requireEnv('OPENAI_API_KEY');
    const body = JSON.stringify({
      model: OPENAI_FAST_MODEL,
      max_tokens: maxTokens || 300,
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMsg }
      ]
    });
    const req = https.request(
      {
        hostname: 'api.openai.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + apiKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        }
      },
      function (res) {
        let d = '';
        res.on('data', function (c) {
          d += c;
        });
        res.on('end', function () {
          try {
            const p = JSON.parse(d);
            const text =
              p.choices && p.choices[0] && p.choices[0].message && p.choices[0].message.content;
            resolve(text || '');
          } catch (e) {
            resolve('');
          }
        });
      }
    );
    req.setTimeout(4000, function () {
      req.destroy();
      resolve('');
    });
    req.on('error', function () {
      resolve('');
    });
    req.write(body);
    req.end();
  });
}

async function generateHydeAndQueries(question) {
  // Single fast LLM call: returns a hypothetical passage + 2 query variants as JSON
  const sysPrompt = [
    'You are a retrieval query generator for an academic study assistant.',
    'Given a student question, output JSON with:',
    '  "hypothetical": a 2-3 sentence passage from an academic lecture or textbook that would directly answer this question (write as if extracted from a course document),',
    '  "queries": array of exactly 2 alternative phrasings of the question optimized for keyword search.',
    'Output ONLY valid JSON. No markdown, no explanation.'
  ].join('\n');

  const raw = await callFastOpenAI(sysPrompt, question, 350);
  try {
    const parsed = JSON.parse(raw);
    return {
      hypothetical: (parsed.hypothetical || '').trim(),
      queries: Array.isArray(parsed.queries) ? parsed.queries.slice(0, 2) : []
    };
  } catch (e) {
    return { hypothetical: '', queries: [] };
  }
}

function embedBatch(texts) {
  // Embed up to 3 texts in a single API call
  return new Promise(function (resolve, reject) {
    const apiKey = requireEnv('OPENAI_API_KEY');
    const body = JSON.stringify({ model: EMBED_MODEL, input: texts, dimensions: EMBED_DIMENSIONS });
    const req = https.request(
      {
        hostname: 'api.openai.com',
        path: '/v1/embeddings',
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + apiKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        }
      },
      function (res) {
        let d = '';
        res.on('data', function (c) {
          d += c;
        });
        res.on('end', function () {
          try {
            const p = JSON.parse(d);
            if (!p.data) return reject(new Error('Embed batch failed'));
            // Sort by index to preserve order
            const sorted = p.data.slice().sort(function (a, b) {
              return a.index - b.index;
            });
            resolve(
              sorted.map(function (e) {
                return e.embedding;
              })
            );
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.setTimeout(6000, function () {
      req.destroy(new Error('Embed timeout'));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── Question type classifier ─────────────────────────────────────────────────
// Classifies the question so the prompt can be adapted.
// Types: "exercise" | "definition" | "derivation" | "concept" | "formula" | "other"
// Runs in parallel with HyDE — adds ~0ms net latency on cache miss.

async function classifyQuestion(question) {
  const sys =
    'Classify this student question into exactly one of these types: exercise, definition, derivation, concept, formula, other.\nExercise: asks to solve a specific numbered problem or compute a value.\nDefinition: asks what something is or means.\nDerivation: asks to show, prove, or derive a formula or result.\nConcept: asks how/why something works.\nFormula: asks for a specific formula or equation.\nOther: anything else.\nRespond with ONLY the type word, nothing else.';
  const result = await callFastOpenAI(sys, question, 10);
  const type = (result || '').trim().toLowerCase();
  const valid = ['exercise', 'definition', 'derivation', 'concept', 'formula', 'other'];
  return valid.includes(type) ? type : 'other';
}

// Extra instructions appended to the system prompt based on question type
function questionTypeInstructions(type) {
  const map = {
    exercise:
      '\n\n## Exercise instructions\nSolve this step by step. Number each step. State the method and formula used at each step. Show intermediate results. Box or bold the final answer. If you find an official solution in the sources, follow its method exactly.',
    definition:
      '\n\n## Definition instructions\nFirst give the exact definition as stated in the course material (quote it). Then explain it in plain language. Then give one concrete example from the material.',
    derivation:
      "\n\n## Derivation instructions\nShow every algebraic step. Number them. State what rule or identity you apply at each step. The final result should be clearly labeled. Use the professor's notation throughout.",
    concept:
      '\n\n## Concept instructions\nExplain the concept clearly: what it is, why it matters, how it works. Use an analogy if it helps. Then give a concrete example from the course material.',
    formula:
      '\n\n## Formula instructions\nState the formula clearly. Define every variable. State the units if applicable. State any conditions or assumptions the formula requires. Show a brief worked example if one exists in the sources.',
    other: ''
  };
  return map[type] || '';
}

// ─── Self-verification ────────────────────────────────────────────────────────
// After generating the answer, run a fast check:
// - Does the answer contain claims that are NOT supported by the retrieved context?
// - Are citations plausible (right file, right page range)?
// Returns { ok: true } or { ok: false, issues: "..." }

async function verifyClaims(question, contextBlock, answerText) {
  const sys = [
    'You are a strict academic fact-checker.',
    'You will receive: (1) a student question, (2) the source context used to answer it, (3) a generated answer.',
    'Your job: check whether the answer contains any claims, formulas, or definitions that are NOT supported by the source context.',
    'Be concise. Respond with JSON only:',
    '{ "ok": true }  — if the answer is well-supported',
    '{ "ok": false, "issues": "brief description of unsupported claims" }  — if there are problems'
  ].join('\n');
  const userMsg =
    'QUESTION:\n' +
    question +
    '\n\nSOURCE CONTEXT (excerpts):\n' +
    contextBlock.slice(0, 3000) +
    '\n\nGENERATED ANSWER:\n' +
    answerText.slice(0, 1500);
  const raw = await callFastOpenAI(sys, userMsg, 120);
  try {
    const parsed = JSON.parse(raw);
    return { ok: parsed.ok !== false, issues: parsed.issues || null };
  } catch (e) {
    return { ok: true, issues: null }; // don't block on parse failure
  }
}

// ─── Merge chunk arrays from multiple retrievals ───────────────────────────────
function mergeChunkResults(arrays) {
  const map = {};
  arrays.forEach(function (arr) {
    arr.forEach(function (c) {
      if (!map[c.id] || c.similarity > map[c.id].similarity) {
        map[c.id] = c;
      }
    });
  });
  return Object.values(map);
}

// ─── Retrieval ────────────────────────────────────────────────────────────────

function retrieveChunks(serviceKey, userId, courseId, embedding, question) {
  // Call match_chunks_hybrid via Supabase RPC.
  // pgvector via PostgREST RPC requires the embedding as a string "[v1,v2,...]"
  // — passing a raw JS array gets serialized as a JSON array which pgvector
  // can't cast to vector at the RPC boundary, silently returning 0 rows.
  return new Promise(function (resolve, reject) {
    const supaUrl = requireEnv('SUPABASE_URL');
    const embeddingStr = '[' + embedding.join(',') + ']';
    const body = JSON.stringify({
      p_user_id: userId,
      p_course_id: courseId,
      p_embedding: embeddingStr,
      p_query: question || '',
      p_match_count: MAX_CHUNKS,
      p_threshold: MIN_SIMILARITY
    });
    const req = https.request(
      {
        hostname: new URL(supaUrl).hostname,
        path: '/rest/v1/rpc/match_chunks_hybrid',
        method: 'POST',
        headers: {
          apikey: serviceKey,
          Authorization: 'Bearer ' + serviceKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        }
      },
      function (res) {
        let data = '';
        res.on('data', function (c) {
          data += c;
        });
        res.on('end', function () {
          try {
            const parsed = JSON.parse(data);
            resolve(Array.isArray(parsed) ? parsed : []);
          } catch (e) {
            resolve([]);
          }
        });
      }
    );
    req.on('error', function () {
      resolve([]);
    });
    req.write(body);
    req.end();
  });
}

// Apply source priority boost + official-material boost, then re-sort
function rankChunks(chunks) {
  return chunks
    .map(function (c) {
      const sourceBoost = SOURCE_BOOST[c.source_type] || 0;
      const officialBoost = c.is_official ? 0.05 : 0;
      return Object.assign({}, c, { final_score: c.similarity + sourceBoost + officialBoost });
    })
    .sort(function (a, b) {
      return b.final_score - a.final_score;
    });
}

// Fetch file_name for each unique document_id so we can cite properly
function fetchDocumentNames(serviceKey, documentIds) {
  if (!documentIds.length) return Promise.resolve({});
  const ids = documentIds
    .map(function (id) {
      return '"' + id + '"';
    })
    .join(',');
  return supaRequest(
    'GET',
    'documents?id=in.(' + ids + ')&select=id,file_name',
    null,
    serviceKey
  ).then(function (result) {
    const map = {};
    if (Array.isArray(result.body)) {
      result.body.forEach(function (d) {
        map[d.id] = d.file_name;
      });
    }
    return map;
  });
}

// ─── Claude call ──────────────────────────────────────────────────────────────

function buildSystemPrompt(mode) {
  const strict = mode !== 'general';
  return [
    'You are StudySphere AI — a precise, expert-level academic study assistant.',
    'Your job is to give the student an accurate, well-structured answer grounded in their own course materials.',
    '',
    '## How to answer',
    '',
    '1. **Read all COURSE CONTEXT sources carefully before writing anything.**',
    "2. **Ground every claim in the context.** Use the professor's exact notation, variable names, formulas, and terminology — not textbook alternatives.",
    '3. **Structure your answer clearly** using markdown:',
    '   - Start with a direct 1-2 sentence answer to the question.',
    '   - Then give a detailed explanation. Use `##` headings for multi-part answers.',
    '   - For derivations or proofs: show every step. Number them.',
    '   - For definitions: give the exact definition from the material, then explain it.',
    '   - For exercises: solve step-by-step, showing all work. Reference the method from the lecture.',
    '   - Use `**bold**` for key terms, formulas, and important results.',
    '   - Use bullet lists for enumerations, numbered lists for sequential steps.',
    '4. **Math notation:** Write all math in plain ASCII — `x^2`, `x_0`, `F = m*a`, `integral(f dx)`. Do NOT use Unicode math letters (𝑎, 𝑣, 𝑥) or Unicode subscript/superscript digits.',
    '5. **Citations:** After every major claim, add an inline citation using the exact FILE and PAGES from the source header: *(filename, p.X)*. If a SECTION_ID is present, include it: *(filename, p.X, Exercise 3b)*.',
    '6. **Confidence:** Set "high" if context directly answers the question, "medium" if you used partial context + standard knowledge, "low" if mostly general knowledge.',
    strict
      ? '7. **Strict mode:** Only use information from the COURSE CONTEXT. If the context does not cover part of the question, say so explicitly: *"This part was not found in your uploaded materials."* Do not invent formulas or definitions.'
      : '7. **General mode:** You may use outside knowledge when helpful. Clearly label it: *"Outside knowledge (not in your uploaded materials):"*',
    '',
    '## Sources array rules',
    'For EACH source you actually used in the answer, add one entry. Fields:',
    '- "file_name": exact FILE value from the source header',
    '- "pages": exact PAGES value from the source header (e.g. "17" or "17-19")',
    '- "section": the SECTION_ID value if present — this must be the specific exercise, section, or heading label (e.g. "Exercise 3b", "Aufgabe 2a", "1.3 Moment of Inertia"). If no SECTION_ID, leave empty string.',
    'Do NOT invent page numbers or section names. Copy them exactly from the source headers.',
    '',
    '## Answer format',
    'Respond ONLY in this JSON. The "answer" field contains full markdown.',
    '{',
    '  "answer": "markdown answer here",',
    '  "sources": [{ "file_name": "...", "pages": "...", "section": "..." }],',
    '  "confidence": "high|medium|low",',
    '  "unsupported": false',
    '}'
  ].join('\n');
}

function buildFallbackSystemPrompt() {
  return [
    'You are StudySphere AI — a precise academic study assistant.',
    '',
    'No course-specific documents were found for this question.',
    'Answer from general academic knowledge. Be accurate and structured.',
    '',
    'Structure your answer with:',
    '- A direct answer first (1-2 sentences)',
    '- A detailed explanation with steps or definitions as needed',
    '- Key formulas or examples if relevant',
    '',
    'Start with: "⚠️ *No course materials found for this topic. This answer is based on general knowledge.*"',
    '',
    'Math notation: plain ASCII only — x^2, x_0, F = m*a.',
    '',
    'Respond ONLY in this JSON:',
    '{',
    '  "answer": "markdown answer here",',
    '  "sources": [],',
    '  "confidence": "medium",',
    '  "unsupported": true',
    '}'
  ].join('\n');
}

function buildContextBlock(rankedChunks, docNames) {
  if (!rankedChunks.length) return 'No relevant course material found.';
  return rankedChunks
    .map(function (c, i) {
      const fileName = docNames[c.document_id] || 'Unknown file';
      const pages =
        c.page_start === c.page_end ? 'p.' + c.page_start : 'pp.' + c.page_start + '-' + c.page_end;
      // SECTION_ID is the exact string the model must use in the "section" citation field
      const sectionId = c.section_title || null;
      const lines = [
        '=== SOURCE ' + (i + 1) + ' ===',
        'FILE: ' + fileName,
        'PAGES: ' + pages,
        'TYPE: ' + (c.source_type || 'document'),
        sectionId ? 'SECTION_ID: ' + sectionId : null,
        'TEXT:',
        c.chunk_text
      ].filter(Boolean);
      return lines.join('\n');
    })
    .join('\n\n');
}

function callOpenAI(systemPrompt, contextBlock, question) {
  return new Promise(function (resolve, reject) {
    const apiKey = requireEnv('OPENAI_API_KEY');
    const userMessage =
      'COURSE CONTEXT:\n\n' + contextBlock + '\n\n---\n\nSTUDENT QUESTION:\n' + question;
    const body = JSON.stringify({
      model: OPENAI_CHAT_MODEL,
      max_tokens: MAX_COMPLETION_TOKENS,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]
    });
    const req = https.request(
      {
        hostname: 'api.openai.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + apiKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        }
      },
      function (res) {
        let data = '';
        res.on('data', function (c) {
          data += c;
        });
        res.on('end', function () {
          try {
            const parsed = JSON.parse(data);
            const text =
              parsed.choices &&
              parsed.choices[0] &&
              parsed.choices[0].message &&
              parsed.choices[0].message.content;
            if (!text) return reject(new Error('Empty OpenAI response'));
            resolve(text);
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function parseOpenAIResponse(text) {
  // Strip optional markdown code fences
  const stripped = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();
  // First try: parse as-is (works when response_format:json_object is used)
  try {
    const direct = JSON.parse(stripped);
    if (direct && typeof direct === 'object') return direct;
  } catch (e) {}
  // Second try: extract {...} block and repair literal newlines inside strings
  try {
    const match = stripped.match(/\{[\s\S]*\}/);
    if (match) {
      // Replace unescaped literal newlines inside JSON string values
      const repaired = match[0].replace(/("(?:[^"\\]|\\.)*")|(\n)/g, function (m, str) {
        return str ? str : '\\n';
      });
      const parsed = JSON.parse(repaired);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (e) {}
  return { answer: text, sources: [], confidence: 'low', unsupported: false };
}

// ─── Caching helpers ──────────────────────────────────────────────────────────

function normalizeQuestion(q) {
  return q.toLowerCase().replace(/\s+/g, ' ').trim();
}

function hashQuestion(userId, courseId, normalizedQ, docVersionHash, mode) {
  return crypto
    .createHash('sha256')
    .update(
      'v2|' +
        userId +
        '|' +
        courseId +
        '|' +
        normalizedQ +
        '|' +
        docVersionHash +
        '|' +
        (mode || 'strict')
    )
    .digest('hex');
}

// Compute a hash over all document IDs + updated_at for the user's course
async function getDocumentVersionHash(serviceKey, userId, courseId) {
  const result = await supaRequest(
    'GET',
    'documents?user_id=eq.' +
      userId +
      '&course_id=eq.' +
      encodeURIComponent(courseId) +
      '&processing_status=eq.ready&select=id,updated_at&order=id.asc',
    null,
    serviceKey
  );
  if (!Array.isArray(result.body) || !result.body.length) return 'empty';
  const str = result.body
    .map(function (d) {
      return d.id + ':' + d.updated_at;
    })
    .join('|');
  return crypto.createHash('sha256').update(str).digest('hex');
}

// Look up exact answer cache
async function getExactCache(serviceKey, userId, courseId, questionHash, docVersionHash, mode) {
  const result = await supaRequest(
    'GET',
    'ai_answer_cache?user_id=eq.' +
      userId +
      '&course_id=eq.' +
      encodeURIComponent(courseId) +
      '&question_hash=eq.' +
      questionHash +
      '&document_version_hash=eq.' +
      docVersionHash +
      '&mode=eq.' +
      (mode || 'strict') +
      '&select=id,answer_json&limit=1',
    null,
    serviceKey
  );
  if (Array.isArray(result.body) && result.body[0]) return result.body[0];
  return null;
}

// Touch last_used_at and increment usage_count on a cache hit
function touchAnswerCache(serviceKey, cacheId) {
  return supaRequest(
    'PATCH',
    'ai_answer_cache?id=eq.' + cacheId,
    { last_used_at: new Date().toISOString(), usage_count: null }, // usage_count incremented via DB
    serviceKey
  ).catch(function () {});
}

// Look up semantic cache via match_cached_questions RPC
async function getSemanticCache(serviceKey, userId, courseId, embedding, docVersionHash, mode) {
  const body = JSON.stringify({
    p_user_id: userId,
    p_course_id: courseId,
    p_embedding: '[' + embedding.join(',') + ']',
    p_document_version_hash: docVersionHash,
    p_mode: mode || 'strict',
    p_threshold: 0.92,
    p_limit: 1
  });
  return new Promise(function (resolve) {
    const supaUrl = requireEnv('SUPABASE_URL');
    const req = https.request(
      {
        hostname: new URL(supaUrl).hostname,
        path: '/rest/v1/rpc/match_cached_questions',
        method: 'POST',
        headers: {
          apikey: serviceKey,
          Authorization: 'Bearer ' + serviceKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        }
      },
      function (res) {
        let data = '';
        res.on('data', function (c) {
          data += c;
        });
        res.on('end', function () {
          try {
            const parsed = JSON.parse(data);
            resolve(Array.isArray(parsed) && parsed[0] ? parsed[0] : null);
          } catch (e) {
            resolve(null);
          }
        });
      }
    );
    req.on('error', function () {
      resolve(null);
    });
    req.write(body);
    req.end();
  });
}

// Fetch a cached answer by its ID
async function getAnswerById(serviceKey, answerId) {
  const result = await supaRequest(
    'GET',
    'ai_answer_cache?id=eq.' + answerId + '&select=id,answer_json&limit=1',
    null,
    serviceKey
  );
  if (Array.isArray(result.body) && result.body[0]) return result.body[0];
  return null;
}

// Store a new answer in the cache
async function storeAnswerCache(
  serviceKey,
  userId,
  courseId,
  questionHash,
  normalizedQ,
  docVersionHash,
  mode,
  answerJson
) {
  const result = await supaRequest(
    'POST',
    'ai_answer_cache',
    {
      user_id: userId,
      course_id: courseId,
      question_hash: questionHash,
      normalized_question: normalizedQ,
      document_version_hash: docVersionHash,
      mode: mode || 'strict',
      answer_json: answerJson
    },
    serviceKey,
    { Prefer: 'return=representation' }
  );
  if (Array.isArray(result.body) && result.body[0]) return result.body[0].id;
  return null;
}

// Store question embedding for future semantic cache lookups
function storeQuestionCache(
  serviceKey,
  userId,
  courseId,
  question,
  embedding,
  answerId,
  docVersionHash,
  mode
) {
  return supaRequest(
    'POST',
    'ai_question_cache',
    {
      user_id: userId,
      course_id: courseId,
      question: question,
      question_embedding: '[' + embedding.join(',') + ']',
      answer_cache_id: answerId,
      document_version_hash: docVersionHash,
      mode: mode || 'strict'
    },
    serviceKey,
    { Prefer: 'return=minimal' }
  ).catch(function () {});
}

// ─── Retrieval cache ──────────────────────────────────────────────────────────
// Caches the ranked chunk set for a question+docVersion so repeated questions
// can skip the vector search and go straight to fetching chunks by PK.

async function getRetrievalCache(serviceKey, userId, courseId, questionHash, docVersionHash) {
  const result = await supaRequest(
    'GET',
    'retrieval_cache?user_id=eq.' +
      userId +
      '&course_id=eq.' +
      encodeURIComponent(courseId) +
      '&question_hash=eq.' +
      questionHash +
      '&document_version_hash=eq.' +
      docVersionHash +
      '&select=id,chunk_entries&limit=1',
    null,
    serviceKey
  );
  if (Array.isArray(result.body) && result.body[0]) return result.body[0];
  return null;
}

// Fetch full chunk rows for a set of IDs (used on retrieval cache hit)
async function fetchChunksByIds(serviceKey, userId, courseId, chunkIds) {
  if (!chunkIds.length) return [];
  const ids = chunkIds
    .map(function (id) {
      return '"' + id + '"';
    })
    .join(',');
  const result = await supaRequest(
    'GET',
    'document_chunks?id=in.(' +
      ids +
      ')&user_id=eq.' +
      userId +
      '&course_id=eq.' +
      encodeURIComponent(courseId) +
      '&select=id,document_id,chunk_text,page_start,page_end,source_type,section_title',
    null,
    serviceKey
  );
  return Array.isArray(result.body) ? result.body : [];
}

function storeRetrievalCache(
  serviceKey,
  userId,
  courseId,
  questionHash,
  docVersionHash,
  rankedChunks
) {
  // Store { id, similarity } per chunk so source-boost order is preserved on hit
  const entries = rankedChunks.map(function (c) {
    return { id: c.id, similarity: c.similarity };
  });
  return supaRequest(
    'POST',
    'retrieval_cache',
    {
      user_id: userId,
      course_id: courseId,
      question_hash: questionHash,
      document_version_hash: docVersionHash,
      chunk_entries: entries
    },
    serviceKey,
    { Prefer: 'return=minimal' }
  ).catch(function () {});
}

// ─── Chunk deduplication ──────────────────────────────────────────────────────
// After source-boost ranking, remove chunks that overlap in page range with an
// already-selected chunk from the same document. Prevents the same passage from
// appearing multiple times in the context window.

function deduplicateChunks(rankedChunks) {
  const selected = [];
  for (var i = 0; i < rankedChunks.length; i++) {
    var chunk = rankedChunks[i];
    var overlaps = selected.some(function (sel) {
      if (sel.document_id !== chunk.document_id) return false;
      return Math.max(sel.page_start, chunk.page_start) <= Math.min(sel.page_end, chunk.page_end);
    });
    if (!overlaps) selected.push(chunk);
    if (selected.length >= MAX_CHUNKS) break;
  }
  return selected;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') return fail(405, 'Method not allowed');

  const token = extractBearerToken(event.headers);
  if (!token) return fail(401, 'Missing authorization token');

  const user = await verifySupabaseToken(token);
  if (!user) return fail(401, 'Invalid or expired token');

  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

  // Rate limit
  const recentCount = await countRecentEvents(
    serviceKey,
    user.id,
    'ai_ask',
    AI_RATE_LIMIT_WINDOW_MS
  );
  if (recentCount >= AI_RATE_LIMIT_MAX) {
    return rateLimitResponse();
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return fail(400, 'Invalid JSON body');
  }

  const { courseId, question, mode } = body;
  if (!courseId || typeof courseId !== 'string') return fail(400, 'courseId is required');
  if (!question || typeof question !== 'string') return fail(400, 'question is required');
  if (question.length > 2000) return fail(400, 'Question too long (max 2000 characters)');

  const normalizedQ = normalizeQuestion(question);
  const ragMode = mode === 'general' ? 'general' : 'strict';

  // 1. Embed question (needed for cache lookups)
  let embedding;
  try {
    embedding = await embedQuestion(question);
  } catch (e) {
    return fail(502, 'Embedding service unavailable');
  }

  // 2. Get document version hash (used for cache invalidation)
  const docVersionHash = await getDocumentVersionHash(serviceKey, user.id, courseId);
  const questionHash = hashQuestion(user.id, courseId, normalizedQ, docVersionHash, ragMode);

  // 3. Check exact answer cache
  const exactHit = await getExactCache(
    serviceKey,
    user.id,
    courseId,
    questionHash,
    docVersionHash,
    ragMode
  );
  if (exactHit) {
    touchAnswerCache(serviceKey, exactHit.id);
    return jsonResponse(200, Object.assign({}, exactHit.answer_json, { cached: true }));
  }

  // 4. Check semantic question cache
  const semanticHit = await getSemanticCache(
    serviceKey,
    user.id,
    courseId,
    embedding,
    docVersionHash,
    ragMode
  );
  if (semanticHit && semanticHit.answer_cache_id) {
    const cachedAnswer = await getAnswerById(serviceKey, semanticHit.answer_cache_id);
    if (cachedAnswer) {
      touchAnswerCache(serviceKey, cachedAnswer.id);
      return jsonResponse(200, Object.assign({}, cachedAnswer.answer_json, { cached: true }));
    }
  }

  // 5. Check retrieval cache (skip vector search + HyDE for repeated questions)
  let rawChunks;
  const retrievalHit = await getRetrievalCache(
    serviceKey,
    user.id,
    courseId,
    questionHash,
    docVersionHash
  );
  if (retrievalHit) {
    const entries = Array.isArray(retrievalHit.chunk_entries) ? retrievalHit.chunk_entries : [];
    const ids = entries.map(function (e) {
      return e.id;
    });
    const fetchedChunks = await fetchChunksByIds(serviceKey, user.id, courseId, ids);
    const simMap = {};
    entries.forEach(function (e) {
      simMap[e.id] = e.similarity;
    });
    rawChunks = fetchedChunks.map(function (c) {
      return Object.assign({}, c, { similarity: simMap[c.id] || 0.5 });
    });
  } else {
    // HyDE + multi-query: run in parallel with the base retrieval
    // Generate hypothetical passage + 2 alternative queries, embed all at once,
    // retrieve for each, then merge. Falls back gracefully if LLM call fails.
    const hydeResult = await generateHydeAndQueries(question);

    const textsToEmbed = [question];
    if (hydeResult.hypothetical) textsToEmbed.push(hydeResult.hypothetical);
    hydeResult.queries.forEach(function (q) {
      if (q) textsToEmbed.push(q);
    });

    let embeddings;
    try {
      embeddings = await embedBatch(textsToEmbed);
    } catch (e) {
      embeddings = [embedding]; // fallback to pre-computed question embedding
    }

    // Retrieve for each embedding in parallel
    const retrievalPromises = embeddings.map(function (emb, i) {
      const queryText = textsToEmbed[i] || question;
      return retrieveChunks(serviceKey, user.id, courseId, emb, queryText);
    });
    const allResults = await Promise.all(retrievalPromises);
    rawChunks = mergeChunkResults(allResults);
  }

  // 6. No chunks found — fall back to general knowledge answer
  if (!rawChunks.length) {
    let fallbackResponse;
    try {
      fallbackResponse = await callOpenAI(buildFallbackSystemPrompt(), '', question);
    } catch (e) {
      return jsonResponse(200, {
        answer:
          'I could not find this in your uploaded course materials. Please make sure you have uploaded the relevant lecture or exercise files for this course.',
        sources: [],
        confidence: 'low',
        unsupported: true,
        cached: false
      });
    }
    const fallbackResult = parseOpenAIResponse(fallbackResponse);
    const fallbackJson = {
      answer: fallbackResult.answer || '',
      sources: [],
      confidence: 'low',
      unsupported: true,
      cached: false
    };
    storeAnswerCache(
      serviceKey,
      user.id,
      courseId,
      questionHash,
      normalizedQ,
      docVersionHash,
      ragMode,
      fallbackJson
    ).catch(function () {});
    return jsonResponse(200, fallbackJson);
  }

  // 7. Rank by similarity + source type boost, then deduplicate overlapping pages
  const rankedChunks = deduplicateChunks(rankChunks(rawChunks));

  // Store retrieval cache for future identical questions (fire-and-forget)
  if (!retrievalHit && rankedChunks.length) {
    storeRetrievalCache(serviceKey, user.id, courseId, questionHash, docVersionHash, rankedChunks);
  }

  // Guardrail: best chunk is below strong threshold — still answer but flag low confidence
  const topScore = rankedChunks[0] ? rankedChunks[0].final_score : 0;
  const weakRetrieval = topScore < STRONG_SIMILARITY_THRESHOLD;

  // 8. Fetch document file names for citations
  const uniqueDocIds = [
    ...new Set(
      rankedChunks.map(function (c) {
        return c.document_id;
      })
    )
  ];
  const docNames = await fetchDocumentNames(serviceKey, uniqueDocIds);
  const knownFileNames = new Set(Object.values(docNames));

  // 9. Classify question type + build context (parallel, both needed before prompt)
  const contextBlock = buildContextBlock(rankedChunks, docNames);
  const qType = await classifyQuestion(question);
  const systemPrompt = buildSystemPrompt(ragMode) + questionTypeInstructions(qType);

  let rawResponse;
  try {
    rawResponse = await callOpenAI(systemPrompt, contextBlock, question);
  } catch (e) {
    return fail(502, 'AI service unavailable');
  }

  // 10. Parse + self-verify (run verify in parallel while we parse)
  const result = parseOpenAIResponse(rawResponse);

  // Citation validation: strip any sources the AI hallucinated
  const validatedSources = (Array.isArray(result.sources) ? result.sources : []).filter(
    function (s) {
      return !s.file_name || knownFileNames.has(s.file_name);
    }
  );

  // Self-verification: flag low confidence if model invented claims
  let verifiedConfidence = result.confidence || (weakRetrieval ? 'medium' : 'high');
  if (result.answer && result.answer.length > 100) {
    const verification = await verifyClaims(question, contextBlock, result.answer);
    if (!verification.ok) {
      verifiedConfidence = 'medium';
      // Append a note to the answer so the student knows to double-check
      result.answer =
        result.answer +
        '\n\n> ⚠️ *Some claims in this answer may go beyond your uploaded materials. Please verify with your course documents.*';
    }
  }

  const answerJson = {
    answer: result.answer || '',
    sources: validatedSources,
    confidence: verifiedConfidence,
    unsupported: false,
    question_type: qType
  };

  // 11. Store in cache (fire-and-forget)
  storeAnswerCache(
    serviceKey,
    user.id,
    courseId,
    questionHash,
    normalizedQ,
    docVersionHash,
    ragMode,
    answerJson
  )
    .then(function (newCacheId) {
      if (newCacheId) {
        storeQuestionCache(
          serviceKey,
          user.id,
          courseId,
          question,
          embedding,
          newCacheId,
          docVersionHash,
          ragMode
        );
      }
    })
    .catch(function () {});

  return jsonResponse(200, Object.assign({}, answerJson, { cached: false }));
};
