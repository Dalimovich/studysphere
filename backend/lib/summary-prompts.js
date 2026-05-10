// Summary generation prompts, validation, and token budgets.
// Imported by notes-generate.js — do not add Netlify handler logic here.
'use strict';

// ── Shared constants ──────────────────────────────────────────────────────────

const FILLER_PHRASES = [
  'overview of', 'general introduction', 'this section covers', 'various methods',
  'überblick über', 'einführung in', 'verschiedene methoden', 'allgemeine einführung'
];

// Slide-template noise that must never appear in generated output
const TEMPLATE_NOISE_TERMS = [
  'platzhalter', 'titelfolie', 'bild einsetzen', 'hinter das logo',
  'masterfolie', 'vorlage für', 'textfeld', 'klicken sie', 'layout'
];

// ── Language instruction (shared by notes and summary prompts) ────────────────

function langInstr(lang) {
  if (lang === 'en')        return 'Write in English regardless of the source language.';
  if (lang === 'de')        return 'Schreibe auf Deutsch, unabhängig von der Quellsprache.';
  if (lang === 'bilingual') return 'Write bilingually: use the source language for content, add English translations in parentheses for key technical terms.';
  // same_as_source (default)
  return 'Write in exactly the same language as the source text. If the source is German, write in German. If English, write in English. Do NOT translate.';
}

// ── Token budget ──────────────────────────────────────────────────────────────

/**
 * Returns the max_tokens value for an OpenAI call.
 * Notes always use 4 000. Summary scales with detail level.
 */
function getMaxTokens(tool, detailLevel) {
  if (tool === 'notes') return 4000;
  switch (detailLevel) {
    case 'brief':    return 1500;
    case 'detailed': return 5000;
    case 'exam':     return 3500;
    default:         return 3000; // balanced
  }
}

// ── Detail-level instruction block ────────────────────────────────────────────

function summaryDetailInstr(detailLevel) {
  switch (detailLevel) {
    case 'brief':
      return `DETAIL LEVEL: Brief
Write a SHORT but information-dense summary.
- Target length: ~250–400 words for 1–3 pages; scale proportionally for more.
- Cover: main idea, 3–5 key concepts, critical formulas, 2–3 exam takeaways.
- No lengthy explanations — just essential facts a student needs to recognise the topic.
- Skip sections that have no content (e.g. omit Formulas if none exist).`;

    case 'detailed':
      return `DETAIL LEVEL: Detailed
Write a COMPREHENSIVE summary — thorough enough to study from without reopening the PDF.
- Target length: ~900–1500 words for 3–6 pages; scale up significantly for more pages.
- Cover EVERY important concept, definition, process step, formula, comparison, list, and example found in the source.
- Do NOT shorten lists, skip processes, or omit definitions.
- Reproduce important lists completely with all items.
- Include all advantages and disadvantages when listed in the source.`;

    case 'exam':
      return `DETAIL LEVEL: Exam-focused
Structure the output around what a student needs to pass an exam on this material.
- Cover: key terms with exact definitions, must-know processes step by step, all formulas with variable explanations, comparison tables, typical exam question types.
- Add a dedicated "Prüfungsfragen / Exam Q&A" section with 4–8 likely exam questions and precise model answers drawn from the source.
- Be selective but complete — every included item must be exam-relevant, and every exam-relevant item must be included.`;

    default: // 'balanced'
      return `DETAIL LEVEL: Balanced
Write a STRUCTURED summary that covers all important material without excessive detail.
- Target length: ~500–900 words for 3–6 pages; scale proportionally for more pages.
- Cover: main idea, all important definitions, key processes (summarised but complete), formulas, important lists, comparisons, and exam relevance.
- Prefer completeness over brevity when content is dense. Do not produce the same short output for 2 pages and 20 pages.`;
  }
}

// ── Main summary prompt (single-call / small scope) ───────────────────────────

function summaryPrompt(lang, detailLevel) {
  return `You are a study assistant generating a student-focused summary of a university lecture PDF.

${langInstr(lang)}

${summaryDetailInstr(detailLevel || 'balanced')}

STRICT RULES:
- Use ONLY the provided PDF text. Do NOT invent, hallucinate, or add external knowledge.
- IGNORE: author names, university/institute names, logos, copyright lines, semester labels, slide numbers.
- Stay faithful to the source — preserve definitions verbatim or near-verbatim.
- Include page references *(S. X)* or *(S. X–Y)* whenever citing a specific fact or concept.
- Use Markdown. Use KaTeX for formulas: inline $...$, display $$...$$
- Do NOT write generic filler like "this section provides an overview" or "various methods are discussed".
- The summary length MUST scale with content. More pages = longer summary. Do not cap at a fixed short length.
- Include a section only if the source contains relevant content for it.
- If something is not clearly present in the source, omit it entirely — do not write "(Nicht klar aus dem PDF.)" after a claim.
- Do not include slide-template text, placeholder text, or PDF metadata (Platzhalter, Titelfolie, Bild einsetzen, etc.).

OUTPUT STRUCTURE — use all sections that apply:

# Zusammenfassung: [Main topic — use the actual lecture title or first major heading]

## 1. Überblick / Big Picture
2–4 sentences: what this section covers, why it matters, how it fits into the lecture.

## 2. Hauptkonzepte / Main Concepts
For each major concept found in the source:
- **[Concept name]** *(S. X)*: precise explanation — not just the term, but what it means and why it matters.

## 3. Wichtige Definitionen / Important Definitions
- **[Term]** *(S. X)*: [exact or near-verbatim definition from the source]
Omit this section ONLY if there are truly no definitions in the source.

## 4. Technische Begriffe / Technical Terms
- **[Term]**: short explanation of what it means in this context.
Include terms that are field-specific and appear in the source.

## 5. Methoden und Prozesse / Methods and Processes
For each method, process, or procedure named in the source:
- **[Method name]** *(S. X)*: what it is, how it works, when it is used, key characteristics.
Include step-by-step descriptions if the source provides them.
Omit this section if the source contains no methods or processes.

## 6. Formeln / Formulas
$$[formula]$$
Where: [variable] = [meaning], unit: [unit]
*(S. X)*
If no formulas appear in the selected content, write: "Keine Formeln in den ausgewählten Seiten gefunden."

## 7. Wichtige Listen und Klassifikationen / Important Lists and Classifications
Reproduce important lists from the source COMPLETELY — all items, not just a selection.
Examples: classifications, component lists, advantages/disadvantages, material groups, process categories.
Omit this section if there are no important lists.

## 8. Vergleiche / Comparisons
Comparison tables or side-by-side lists when the source compares methods, materials, or approaches.
Use Markdown table format when comparing 2+ items across multiple properties.
Omit this section if the source contains no comparisons.

## 9. Prüfungsrelevanz / What to Remember for the Exam
The most important things a student must know. Be specific — name actual concepts, not vague categories.
For exam-focused detail level: also include 4–8 likely exam questions with model answers.

## 10. Quellen / Source Pages
List the page ranges used: *(S. X–Y)*`;
}

// ── Section summary prompt (used in multi-section pipeline) ───────────────────

function sectionSummaryPrompt(lang, detailLevel, pageStart, pageEnd) {
  var pageRef = pageStart != null
    ? (pageStart === pageEnd ? 'Seite ' + pageStart : 'Seiten ' + pageStart + '–' + pageEnd)
    : 'diesem Abschnitt';

  return `You are summarising ONE specific page group (${pageRef}) from a university lecture PDF for a student.

${langInstr(lang)}

${summaryDetailInstr(detailLevel || 'balanced')}

STRICT RULES:
- Use ONLY the provided PDF text for ${pageRef}. Do NOT invent information.
- IGNORE: author names, university logos, copyright notices, semester labels, slide numbers.
- Include page references *(S. X)* for important facts.
- Use Markdown. Use KaTeX for formulas ($...$ inline, $$...$$ display).
- This is ONE SECTION of a larger summary — do not introduce the whole lecture context.
- Only cover what is actually on these pages.
- Do not include slide-template text or PDF metadata noise.

OUTPUT FORMAT:
## [Heading — use the actual slide/section title if visible, else describe the topic]

Cover whatever is present on these pages: main concepts, definitions, technical terms, processes/methods, formulas, lists, comparisons. Include page references. Scale length to content density.`;
}

// ── Merge summary prompt (combines section summaries into one document) ────────

function mergeSummaryPrompt(lang, detailLevel) {
  return `You are merging multiple section summaries from a university lecture PDF into one final structured study summary.

${langInstr(lang)}

${summaryDetailInstr(detailLevel || 'balanced')}

MERGE RULES:
- Preserve ALL important content from ALL sections. Do NOT aggressively shorten.
- Remove exact duplicates (identical facts stated twice), but keep content that appears in different contexts.
- Keep ALL page references *(S. X)*.
- Organise under the full 10-section structure below, matching the lecture's topic flow.
- Do NOT invent new content. Use only what is in the provided section summaries.
- The merged summary must be longer than any individual section summary.
- The final Prüfungsrelevanz section must cover the most important exam points across all sections.

OUTPUT: Complete Markdown document using this structure:

# Zusammenfassung: [Chapter/Topic Title]

## 1. Überblick / Big Picture
## 2. Hauptkonzepte / Main Concepts
## 3. Wichtige Definitionen / Important Definitions
## 4. Technische Begriffe / Technical Terms
## 5. Methoden und Prozesse / Methods and Processes
## 6. Formeln / Formulas
## 7. Wichtige Listen und Klassifikationen / Important Lists and Classifications
## 8. Vergleiche / Comparisons
## 9. Prüfungsrelevanz / What to Remember for the Exam
## 10. Quellen / Source Pages

Fill each section from the provided section summaries. Skip a section only if no content exists for it across all sections.`;
}

// ── Strict fallback prompt (used when validation fails) ───────────────────────

function strictSummaryPrompt(lang, detailLevel, missingTerms) {
  return summaryPrompt(lang, detailLevel) + `

ADDITIONAL REQUIREMENT — FINAL CHECK:
The following key terms from the source text are missing from your summary. Include all that are genuinely important to the content:
${missingTerms.map(function (t) { return '- ' + t; }).join('\n')}

ALSO: Do not include any slide-template noise (Platzhalter, Titelfolie, Bild einsetzen, etc.) in the output.`;
}

// ── Validation ────────────────────────────────────────────────────────────────

function extractKeyTerms(contextText) {
  var words = contextText.match(/[A-Za-zÄÖÜäöüß]{5,}/g) || [];
  var freq = {};
  for (var i = 0; i < words.length; i++) {
    var lw = words[i].toLowerCase();
    freq[lw] = (freq[lw] || 0) + 1;
  }
  return Object.keys(freq)
    .filter(function (w) { return freq[w] >= 2; })
    .sort(function (a, b) { return freq[b] - freq[a]; })
    .slice(0, 30);
}

/**
 * Validates a generated summary against the source context.
 * Returns { valid, issues, missingTerms }.
 */
function validateSummary(markdown, contextText, detailLevel) {
  var issues = [];
  var minLen = detailLevel === 'brief' ? 250 : detailLevel === 'detailed' ? 700 : 400;

  if (markdown.length < minLen) issues.push('too_short');

  var keyTerms = extractKeyTerms(contextText);
  var mdLower  = markdown.toLowerCase();
  var missingTerms = keyTerms.filter(function (t) { return !mdLower.includes(t); });
  // Summary may legitimately omit more terms than notes — threshold 0.60
  if (keyTerms.length > 0 && missingTerms.length / keyTerms.length > 0.60) {
    issues.push('missing_terms');
  }

  for (var i = 0; i < FILLER_PHRASES.length; i++) {
    if (mdLower.includes(FILLER_PHRASES[i])) { issues.push('generic_filler'); break; }
  }

  for (var j = 0; j < TEMPLATE_NOISE_TERMS.length; j++) {
    if (mdLower.includes(TEMPLATE_NOISE_TERMS[j])) { issues.push('template_noise'); break; }
  }

  return { valid: issues.length === 0, issues: issues, missingTerms: missingTerms.slice(0, 15) };
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  langInstr,
  getMaxTokens,
  summaryDetailInstr,
  summaryPrompt,
  sectionSummaryPrompt,
  mergeSummaryPrompt,
  strictSummaryPrompt,
  validateSummary,
  FILLER_PHRASES,
  TEMPLATE_NOISE_TERMS
};
