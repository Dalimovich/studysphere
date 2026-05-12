// AI typing speed and render configuration.
// Change values here to tune all AI text animation across the app.

var AI_TYPING = {
  // ── Streaming path (edge function SSE tokens) ──────────────────────────
  // How long to wait between rendering each received token (ms).
  // Higher = slower, more readable. Lower = faster.
  streamTokenInterval: 38,

  // ── Fallback path (non-streaming ai-ask endpoint) ─────────────────────
  // How many words to reveal per animation frame.
  fallbackWordsPerFrame: 1,
  // Time between frames (ms).
  fallbackFrameInterval: 38,

  // ── Chatbot page typewriter ────────────────────────────────────────────
  // Time between each character reveal (ms) — legacy, kept for backcompat.
  chatbotCharInterval: 6,
  // Word-by-word typewriter on the chatbot page. Tighter values feel
  // closer to the streaming side panel.
  chatbotWordsPerFrame: 4,    // was effectively 2
  chatbotFrameInterval: 6,    // ms — was 22

  // ── Progressive math rendering ─────────────────────────────────────────
  // Re-render with markdown+KaTeX whenever one of these tokens arrives.
  // This makes math and formatting appear rendered as each line is written.
  mathRenderTriggers: ['$', '\n', '##', '**', '- ', '> ']
};

window.AI_TYPING = AI_TYPING;
