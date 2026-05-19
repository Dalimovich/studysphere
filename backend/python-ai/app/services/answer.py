"""Grounded answer generation from retrieved chunks.

Hard rules from the architecture brief:
  - Use uploaded files as the only source of truth.
  - Never invent content; never silently fall back to general knowledge.
  - Cite source pages.
  - If retrieval is weak, say so explicitly with a marked "general explanation"
    rather than fabricating a confident answer.

Implementation:
  - We classify retrieval as STRONG / WEAK using simple thresholds on the
    top reranked chunks. Tunable; documented in the JSON response so it can
    be evaluated against the existing /api/ai/feedback flow.
  - Prompt is split into a system message (rules + identity) and a user
    message (question + numbered context chunks with page citations).
  - Returns a structured dict: answer text, retrieval mode, list of sources,
    plus model + token diagnostics for the eval pipeline.
"""

from __future__ import annotations

import logging
import re
from typing import Any

from openai import OpenAI

from ..config import get_settings
from .retrieval import RetrievedChunk

log = logging.getLogger(__name__)


# Tunables. Mirrored from the existing JS pipeline so behaviour stays consistent
# during cutover; tighten/loosen later as we gather eval data.
_STRONG_SIMILARITY = 0.32   # at least one chunk above this → strong context
_STRONG_AVG_SCORE  = 0.30   # OR average reranked score across top chunks
_MIN_CONTEXT_CHARS = 400    # below this, we treat it as no useful context


_SYSTEM_PROMPT_STRONG = """You are Minallo's exam-prep tutor for a university student.
Answer the question STRICTLY using the COURSE CONTEXT below, which comes from the student's uploaded course files. Those files can be ANY mix of: lecture slides, textbook chapters, exercise sheets, worked solutions, formula sheets, definitions, theorems, examples, summaries, or student notes. Adapt your answer to what the retrieved sources actually contain — do NOT assume every question is an exercise to solve.

Rules:
1. Use ONLY the context. Do not invent facts. If a claim isn't supported by the context, do not make it.
2. Quote / paraphrase the relevant chunk and cite the source like "(filename, p.3)" using the [Source N] header.
3. If the context contradicts itself, acknowledge it and present both views.
4. Write math using KaTeX: $...$ for inline, $$...$$ for display.
5. Match the language of the question. If the question is in German, answer in German.
6. Be concise but thorough. Use bullet points for steps and definitions; use explanatory prose for conceptual questions.
7. Match the format to the question and to the source material:
   - Conceptual question over lecture/summary chunks → explanatory prose with citations.
   - Definition or theorem question → state the definition/theorem verbatim from the source, then explain.
   - Formula question → state the formula, define every variable, explain when it applies.
   - "What does this say / summarise this" → faithful summary of the cited chunks, not a derivation.
   Do not impose an engineering-exercise template on questions that aren't exercises.

Open with a line like "Based on your uploaded files..." so the student knows the answer is grounded."""

# Phase 9 — strict step-by-step template for math/exercise questions. Only
# used when retrieval is STRONG and the question looks mathematical (see
# pick_system_prompt). The template mirrors plan-v2 lines 187-200.
_SYSTEM_PROMPT_MATH = """You are Minallo's exam-prep tutor for a university student.
The question is mathematical or asks you to solve an exercise. Answer it STRICTLY using the COURSE CONTEXT below.

Rules:
1. Use ONLY the context. Do not invent formulas, numbers, or symbols. Do not silently fall back to general knowledge.
2. Cite the source like "(filename, p.3)" using the [Source N] header for every formula and every step that comes from the context.
3. Write math using KaTeX: $...$ inline, $$...$$ display.
4. Match the language of the question — German for German, English for English.

Use the following structure, in this order, with these exact section headings (translate the headings to German when the question is in German). Cite inline as you go — every formula and every step from the context must carry a `[Source N]` or `(filename, p.N)` reference next to it. Do NOT list sources up front; only cite the ones you actually use, where you use them.

### Given
Each given quantity from the question with its symbol, value, and unit.

### Required
The quantity to find, with its symbol and unit.

### Formula
The relevant formula(s) in $$...$$ display form, cited from the context. If multiple formulas are needed, list them in the order you will use them.

### Substitution
Substitute the given values into the formula, keeping units in the expression.

### Calculation
Step-by-step arithmetic, one transformation per line. Keep units throughout.

### Unit check
A single line confirming that the units on both sides agree.

### Final answer
The boxed result on its own line, e.g. $$\\boxed{M = 100\\ \\mathrm{N\\,m}}$$.

### Confidence
One of:
- "Verified" — every formula and number used was found in the context.
- "Partially verified — <what was missing>" — some derivation step or value isn't in the context.
- "Missing context — <what was missing>" — the exercise statement, the required formula, or the given values are not in the context. In this case STOP after this section and do not invent the rest.

Do not skip sections. If a section genuinely has nothing to put in it (e.g. a pure derivation has no Given values), say so explicitly with "— none —"."""

_SYSTEM_PROMPT_WEAK = """You are Minallo's exam-prep tutor.
The student asked a question, but their uploaded course files do NOT contain enough relevant material to ground a confident answer.

For exam prep, a generic textbook answer can be actively misleading — the professor's notation, method, or convention may differ from the standard treatment. Do NOT silently fall back to a long general explanation.

Behaviour (keep the response short — under ~120 words):
1. Open with: "I could not find this in your uploaded course files."
2. Briefly say what is likely missing for this question — pick whichever applies: the lecture slides for the topic, the exercise sheet the question came from, the formula sheet / Formelsammlung, the worked solutions / Musterlösung. Be specific (e.g. "the formula sheet for chapter on bending moments") rather than generic.
3. Offer a one-line follow-up: "I can give a general textbook explanation if you reply 'general' — but it may not match your professor's approach."
4. Do NOT provide the general explanation now. Do NOT fabricate citations or invent course-specific content.
5. Match the language of the question (German for German). Write math with KaTeX: $...$ inline, $$...$$ display."""


_SOURCE_REF_RE = re.compile(r"\bSources?\s+([0-9 ,andund&]+)\b", re.IGNORECASE)


def pick_system_prompt(
    question: str,
    strength: str,
    chunks: list[RetrievedChunk] | None = None,
) -> tuple[str, str]:
    """Pick (system_prompt, mode_label) for the answer pipeline.

    mode_label is one of: 'math' | 'strong' | 'weak'. Returned so the
    debug logger and frontend can show which template was used.

    The MATH template is rigid (Given / Required / Formula / ... / Final
    answer / Confidence). Only select it when retrieval actually surfaced
    exercise or solution chunks — otherwise the model is forced to fill
    the template against lecture/summary/definition material and emits
    a useless "— none —" answer plus "Missing context" confidence.
    """
    if strength != "strong":
        return _SYSTEM_PROMPT_WEAK, "weak"
    # Local import: query_expansion may transitively import retrieval.
    from .query_expansion import is_math_question  # noqa: WPS433
    if is_math_question(question):
        # Only commit to the rigid math template when at least one retrieved
        # chunk is (a) classified as an exercise or solution AND (b) actually
        # on-topic (similarity above the strong threshold). A spurious
        # exercise chunk with weak similarity isn't enough to ground the
        # Given/Required/Formula/... structure. If chunks weren't passed
        # (legacy callers / unit tests) we keep the historical behaviour.
        if chunks is None:
            return _SYSTEM_PROMPT_MATH, "math"
        for c in chunks:
            if (
                getattr(c, "chunk_type", None) in ("exercise", "solution")
                and getattr(c, "similarity", 0.0) >= _STRONG_SIMILARITY
            ):
                return _SYSTEM_PROMPT_MATH, "math"
    return _SYSTEM_PROMPT_STRONG, "strong"


def _cited_indices(answer_text: str, total: int) -> set[int]:
    """Return the 1-based [Source N] indices the LLM actually referenced.

    The system prompt requires inline `[Source N]` citations. If the model
    produced none, we return an empty set rather than falling back to
    "all chunks" — surfacing every retrieved chunk for an unanchored answer
    is misleading and inflates the source list with material the model
    never used.
    """
    if not answer_text or total <= 0:
        return set()
    cited: set[int] = set()
    for m in _SOURCE_REF_RE.finditer(answer_text):
        for tok in re.split(r"[\s,&]+|and|und", m.group(1), flags=re.IGNORECASE):
            tok = tok.strip()
            if tok.isdigit():
                n = int(tok)
                if 1 <= n <= total:
                    cited.add(n)
    return cited


def _context_strength(chunks: list[RetrievedChunk]) -> str:
    """Classify retrieval as strong/weak/none based on EMBEDDING similarity.

    Earlier versions also accepted a high reranked `avg_score`, but the
    reranker stacks boosts (active doc +0.25, source-type +0.20, doc-type
    +0.15, ...) that easily push score above the threshold even when the
    chunks are topically irrelevant. That caused confident-sounding answers
    over unrelated material. We now require actual semantic similarity:
    the top chunk must clear `_STRONG_SIMILARITY`, OR at least two chunks
    must clear a slightly lower bar (which proves the topic is genuinely
    present in the corpus, not just one lucky chunk).
    """
    if not chunks:
        return "none"
    sims = sorted((c.similarity for c in chunks), reverse=True)
    total_chars = sum(len(c.text) for c in chunks)
    if total_chars < _MIN_CONTEXT_CHARS:
        return "weak"
    if sims[0] >= _STRONG_SIMILARITY:
        return "strong"
    if len(sims) >= 2 and sims[0] >= 0.28 and sims[1] >= 0.24:
        return "strong"
    return "weak"


def _build_context_block(chunks: list[RetrievedChunk], doc_names: dict[str, str]) -> str:
    parts: list[str] = []
    for i, c in enumerate(chunks, start=1):
        file_name = doc_names.get(c.document_id, "Unknown")
        if c.page_start and c.page_end:
            pages = f"p.{c.page_start}" if c.page_start == c.page_end else f"pp.{c.page_start}-{c.page_end}"
        else:
            pages = "no-page"
        header = f"[Source {i}] {file_name}, {pages}"
        if c.section_title:
            header += f"\nSection: {c.section_title}"
        parts.append(f"{header}\n{c.text}")
    return "\n\n---\n\n".join(parts)


def generate_answer(
    *,
    question: str,
    chunks: list[RetrievedChunk],
    doc_names: dict[str, str],
    model: str | None = None,
    max_tokens: int = 1200,
) -> dict[str, Any]:
    """Return the structured answer dict the API surface exposes."""
    settings = get_settings()
    target_model = model or settings.openai_generate_model

    strength = _context_strength(chunks)
    used_chunks = chunks if strength == "strong" else []
    system_prompt, answer_mode = pick_system_prompt(question, strength, used_chunks)
    context_block = _build_context_block(used_chunks, doc_names) if used_chunks else ""

    user_message = "QUESTION:\n" + question.strip()
    if context_block:
        user_message += "\n\nCOURSE CONTEXT:\n\n" + context_block

    client = OpenAI(api_key=settings.openai_api_key)
    completion = client.chat.completions.create(
        model=target_model,
        max_tokens=max_tokens,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_message},
        ],
    )
    msg = completion.choices[0].message if completion.choices else None
    answer_text = (msg.content if msg else "") or ""

    cited = _cited_indices(answer_text, len(used_chunks))
    sources = [
        {
            "fileName":  doc_names.get(c.document_id, "Unknown"),
            "pageStart": c.page_start,
            "pageEnd":   c.page_end,
            "sectionTitle": c.section_title,
            "chunkType": c.chunk_type,
            "similarity": round(c.similarity, 4),
        }
        for i, c in enumerate(used_chunks, start=1) if i in cited
    ]

    # Phase 10: deterministic verification independent of the model's
    # self-report. Failure here must never block the response.
    verification: dict[str, Any] = {"status": "missing_context", "reasons": [], "details": {}}
    try:
        from .verification import verify_answer  # noqa: WPS433
        verification = verify_answer(
            answer_text=answer_text,
            chunk_texts=[c.text for c in used_chunks],
            question=question,
            answer_mode=answer_mode,
        ).to_api()
    except Exception:  # noqa: BLE001
        log.exception("verify_answer failed — emitting default missing_context")

    return {
        "answer":          answer_text,
        "retrievalMode":   strength,                # strong | weak | none
        "answerMode":      answer_mode,             # math | strong | weak
        "verification":    verification,            # Phase 10 status + reasons + details
        "groundedSources": sources,
        "model":           target_model,
        "promptTokens":    completion.usage.prompt_tokens if completion.usage else None,
        "completionTokens": completion.usage.completion_tokens if completion.usage else None,
    }
