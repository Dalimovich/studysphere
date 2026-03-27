// ═══════════════════════════════════════════════════════════════════════════
//  ai/ai.js — StudySphere AI Engine
//  Loaded after app.js; overrides askAI, chipPrompt, and runMultiSummary.
//  Edit this file to change model, prompts, token limits, or response style.
// ═══════════════════════════════════════════════════════════════════════════

// ── CONFIG ────────────────────────────────────────────────────────────────
var _aiUserScrolled = false; // true when user has manually scrolled up during generation

var AI_MODEL   = 'claude-sonnet-4-5';
var AI_MAX_TOK = 4096;    // was 1024 — allows long, thorough answers
var AI_PDF_CAP = 100000;  // was 12000 — covers ~120+ pages

// ── SYSTEM PROMPT ─────────────────────────────────────────────────────────
function _buildSystemPrompt() {
  var docText = pdfFullText
    ? pdfFullText.slice(0, AI_PDF_CAP)
    : '(no document loaded — answer from general knowledge and note the document is not available)';

  return 'You are StudySphere, an expert academic tutor for university engineering students.\n' +
    'The student is reading "' + (activeFileName || 'a document') + '"' +
    (currentCourseShort ? ' from the course ' + currentCourseShort + '.' : '.') + '\n\n' +
    'RESPONSE STYLE RULES — follow these strictly:\n' +
    '- Write in clear, explanatory prose. Do not answer with raw bullet lists unless the content is genuinely list-like (e.g. steps, a list of symbols).\n' +
    '- When explaining a concept, write complete sentences that build understanding from first principles.\n' +
    '- Be thorough and precise — explain *why* something works, not just *what* it is.\n' +
    '- For formulas: write out the expression, then define every variable in a sentence each, then explain in plain language what the formula computes and when it applies.\n' +
    '- Match the language of the document (German or English).\n' +
    '- If the document does not cover a topic, say so clearly instead of inventing an answer.\n' +
    '- Use **bold** for key terms, `monospace` for code/variables, and ### headers to separate major sections.\n\n' +
    'CONTENT RULES:\n' +
    '- Base every answer on the document content below. Do not substitute general knowledge when the document covers the topic.\n' +
    '- If the student asks something not in the document, answer from general knowledge but state that clearly.\n\n' +
    'DOCUMENT CONTENT:\n' + docText;
}

// ── askAI — core Q&A ──────────────────────────────────────────────────────
askAI = function(question, skipUserBubble) {
  if (!question) return;
  generationStopped = false;
  currentGenId++;
  var myGenId = currentGenId;
  pinAI();
  if (!skipUserBubble) addUserMsg(question);
  var sendBtn = document.getElementById('aiSend');
  sendBtn.disabled = false; // keep clickable so stop works
  sendBtn.classList.add('is-stop');

  var thinkWrap = document.createElement('div');
  thinkWrap.className = 'ai-msg-wrap';
  thinkWrap.innerHTML =
    '<div class="msg-sender bot-sender"><span class="msg-sender-dot"></span>StudySphere AI</div>' +
    '<div class="think-bubble">' +
      '<span class="think-label">Thinking\u2026</span>' +
      '<span class="think-text" id="thinkText"></span>' +
    '</div>';
  aiMsgs.appendChild(thinkWrap);
  aiMsgs.scrollTop = aiMsgs.scrollHeight;

  var THOUGHTS = [
    'Reading the document\u2026',
    'Identifying key concepts\u2026',
    'Checking formulas\u2026',
    'Structuring a thorough explanation\u2026',
    'Almost ready\u2026'
  ];
  var tIdx = 0;
  function cycleThought() {
    var el = document.getElementById('thinkText');
    if (!el) return;
    el.textContent = '';
    var txt = THOUGHTS[tIdx % THOUGHTS.length];
    tIdx++;
    var i = 0;
    var ti = setInterval(function() {
      if (!document.getElementById('thinkText')) { clearInterval(ti); return; }
      document.getElementById('thinkText').textContent = txt.slice(0, i + 1);
      i++;
      if (i >= txt.length) clearInterval(ti);
    }, 20);
  }
  cycleThought();
  activeThinkTimer = setInterval(cycleThought, 1100);

  fetch(BACKEND_URL + '/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: AI_MAX_TOK,
      system: _buildSystemPrompt(),
      messages: [{ role: 'user', content: question }]
    })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (myGenId !== currentGenId) { thinkWrap.remove(); return; }
    clearInterval(activeThinkTimer); activeThinkTimer = null;
    thinkWrap.style.transition = 'opacity .3s';
    thinkWrap.style.opacity = '0';
    setTimeout(function() { thinkWrap.remove(); }, 320);

    var rawText = data.error
      ? ('\u274C Error: ' + (data.error.message || JSON.stringify(data.error)))
      : (data.content ? data.content.map(function(b) { return b.text || ''; }).join('') : 'No response');

    var ansWrap = document.createElement('div');
    ansWrap.className = 'ai-msg-wrap';
    var t = getTime();
    ansWrap.innerHTML =
      '<div class="msg-sender bot-sender"><span class="msg-sender-dot"></span>StudySphere AI</div>' +
      '<div class="msg-body">' +
        '<div class="ai-bubble bot" id="streamBubble" style="min-height:20px"></div>' +
        '<div class="msg-meta" id="streamMeta" style="display:none">' +
          '<span class="msg-time">' + t + '</span>' +
          '<button class="msg-action-btn" onclick="copyBubble(this)">Copy</button>' +
        '</div>' +
      '</div>';
    aiMsgs.appendChild(ansWrap);
    aiMsgs.scrollTop = aiMsgs.scrollHeight;

    var bubble = document.getElementById('streamBubble');
    var meta   = document.getElementById('streamMeta');
    setTimeout(function() {
      bubble = ansWrap.querySelector('.ai-bubble.bot');
      meta   = ansWrap.querySelector('.msg-meta');
      var i = 0;
      function typeNext() {
        if (generationStopped || myGenId !== currentGenId) {
          bubble = ansWrap.querySelector('.ai-bubble.bot');
          meta   = ansWrap.querySelector('.msg-meta');
          bubble.innerHTML = renderMarkdown(rawText.slice(0, i));
          meta.style.display = 'flex';
          _aiUserScrolled = false;
          return;
        }
        // Tab is hidden — render immediately so the answer is ready when user returns
        if (document.hidden || i >= rawText.length) {
          bubble = ansWrap.querySelector('.ai-bubble.bot');
          meta   = ansWrap.querySelector('.msg-meta');
          bubble.innerHTML = renderMarkdown(rawText);
          meta.style.display = 'flex';
          document.getElementById('aiSend').classList.remove('is-stop');
          _aiUserScrolled = false;
          spawnConfetti();
          return;
        }
        bubble.innerHTML = renderMarkdown(rawText.slice(0, i + 1)) + '<span class="stream-cursor">\u258b</span>';
        i++;
        if (!_aiUserScrolled) aiMsgs.scrollTop = aiMsgs.scrollHeight;
        activeTypeTimer = setTimeout(typeNext, 16 + (Math.random() > 0.93 ? 55 : 0));
      }
      // When user returns to tab mid-animation, flush to end instantly
      var _visHandler = function() {
        if (!document.hidden && myGenId === currentGenId) {
          clearTimeout(activeTypeTimer);
          typeNext();
        }
      };
      document.addEventListener('visibilitychange', _visHandler, { once: true });
      typeNext();
    }, 340);
  })
  .catch(function(e) {
    clearInterval(activeThinkTimer); activeThinkTimer = null;
    thinkWrap.remove();
    addBotMsg('\u274C Error: ' + e.message);
    document.getElementById('aiSend').classList.remove('is-stop');
  });
};
window.askAI = askAI;

// ── chipPrompt — quick action buttons ────────────────────────────────────
function chipPrompt(type, level) {
  var hasDoc = !!pdfFullText;
  var ref = hasDoc
    ? 'Based strictly on the document "' + activeFileName + '" provided in the system prompt, '
    : 'As a knowledgeable tutor (no document is loaded), ';
  if (!hasDoc) addBotMsg('\uD83D\uDCA1 Tip: open a PDF first so I can answer from the actual document!');

  var prompts = {
    summarise: {
      small:
        ref + 'write a concise summary of the document in 4-6 sentences covering the core topic and purpose. ' +
        'Then list the 3-4 most critical takeaways as complete sentences, not fragments.',

      medium:
        ref + 'write a structured summary with these sections:\n\n' +
        '### \uD83D\uDCDD Overview\nA paragraph of 4-6 sentences explaining what the document covers and why it matters.\n\n' +
        '### \uD83D\uDD11 Main Topics\nFor each major topic: a short heading followed by 2-3 sentences explaining what it covers — ' +
        'not just a label.\n\n' +
        '### \uD83D\uDCA1 Key Takeaways\n5-7 takeaways written as full sentences explaining the significance of each point.',

      thorough:
        ref + 'write a comprehensive deep-dive summary of the entire document. ' +
        'For each major section write a full paragraph explaining what it covers, the underlying principles, ' +
        'and how it connects to the overall subject. ' +
        'Include a dedicated section listing every formula with variables defined and meaning explained. ' +
        'End with a "Things to Remember for the Exam" section covering the most testable concepts.'
    },

    formulas:
      ref + 'find and explain every formula, equation and mathematical expression in the document. ' +
      'For each one: write out the expression clearly, define every variable or symbol in a sentence each, ' +
      'then write 2-3 sentences explaining what the formula computes, what it represents physically or mathematically, ' +
      'and when or how it is applied. Do not just list symbols — explain them in context.',

    quiz: {
      easy:
        ref + 'create 6 questions that test basic understanding of the document. ' +
        'For each question: write it clearly, then write the answer as a full paragraph — ' +
        'not a one-liner. Explain *why* the answer is correct.',

      medium:
        ref + 'create 8 questions of medium difficulty mixing conceptual and applied questions. ' +
        'Include at least one question that requires applying a formula or method from the document. ' +
        'For each question: write a complete answer paragraph that explains the concept and reasoning, not just the result.',

      hard:
        ref + 'create 10 challenging questions requiring deep understanding, multi-step reasoning, ' +
        'or application of several concepts from the document. ' +
        'For each question: write a step-by-step answer that explains the full reasoning process. ' +
        'At least 3 questions should involve calculations or derivations.'
    },

    keyideas:
      ref + 'identify the 8-10 most important concepts in the document. ' +
      'For each concept: use its name as a ### heading, then write 2-3 sentences explaining ' +
      'what it is, how it works, and why it matters in the context of this subject. ' +
      'Write in explanatory prose, not bullet fragments.',

    analogy:
      ref + 'explain the 5-6 central concepts from the document using vivid real-world analogies. ' +
      'For each: state the concept name, then write the analogy as 3-4 sentences making it concrete and memorable, ' +
      'then briefly explain in 1-2 sentences how the analogy maps to the actual concept.'
  };

  var prompt = typeof prompts[type] === 'object' ? prompts[type][level || 'medium'] : prompts[type];
  closeAllOpts();
  askAI(prompt);
}
window.chipPrompt = chipPrompt;

// ── runMultiSummary — combined PDF summary ────────────────────────────────
async function runMultiSummary(fnames, course) {
  var modal = document.getElementById('multiSumModal');
  var body  = document.getElementById('msmBody');
  var title = document.getElementById('msmTitle');
  msmCurrentText = ''; msmCurrentTitle = '';
  document.getElementById('msmSaveBtn').style.display = 'none';

  var shortNames = fnames.map(function(n) { return n.replace(/\.pdf$/i, '').slice(0, 30); });
  msmCurrentTitle = course.short + ' \u2014 Combined: ' + shortNames.join(', ');
  title.textContent = '\u2728 Combined Summary (' + fnames.length + ' files)';

  var tagsHtml = '<div class="msm-files-list">' + fnames.map(function(n) {
    return '<span class="msm-file-tag">\uD83D\uDCC4 ' + n + '</span>';
  }).join('') + '</div>';

  body.innerHTML = tagsHtml +
    '<div class="msm-loading"><div class="msm-dots"><span></span><span></span><span></span></div>' +
    '<p>Extracting text from ' + fnames.length + ' files\u2026</p></div>';
  modal.classList.add('show');

  // Extract full text from all selected PDFs (no page cap)
  var promises = fnames.map(function(fname) {
    return new Promise(function(resolve) {
      var b64 = PDF_DATA[fname];
      if (!b64) { resolve('[' + fname + ': not available]'); return; }
      var binary = atob(b64), bytes = new Uint8Array(binary.length);
      for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      pdfjsLib.getDocument({ data: bytes }).promise.then(function(pdf) {
        var pagePromises = [];
        for (var p = 1; p <= pdf.numPages; p++) {
          pagePromises.push(pdf.getPage(p).then(function(page) {
            return page.getTextContent().then(function(tc) {
              return tc.items.map(function(it) { return it.str; }).join(' ');
            });
          }));
        }
        Promise.all(pagePromises).then(function(pages) {
          resolve('=== ' + fname + ' ===\n' + pages.join('\n'));
        });
      }).catch(function() { resolve('[' + fname + ': error reading]'); });
    });
  });

  Promise.all(promises).then(function(parts) {
    var combined = parts.join('\n\n').slice(0, 60000);
    body.innerHTML = tagsHtml +
      '<div class="msm-loading"><div class="msm-dots"><span></span><span></span><span></span></div>' +
      '<p>Asking AI to synthesise all files\u2026</p></div>';

    fetch(BACKEND_URL + '/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: AI_MAX_TOK,
        system:
          'You are StudySphere, an expert AI tutor for university engineering students. ' +
          'The student has selected multiple related course files and needs a single unified study guide. ' +
          'Synthesise all content into one coherent document written in explanatory prose — not bullet lists. ' +
          'Use the same language as the documents (German or English).',
        messages: [{ role: 'user', content:
          'These are ' + fnames.length + ' related course files from ' + course.name + ':\n\n' + combined +
          '\n\n---\n' +
          'Write a single unified study guide covering all files with these sections:\n\n' +
          '### \uD83D\uDCDD Overview\n' +
          'A paragraph summarising what these files collectively cover and how they relate.\n\n' +
          '### \uD83D\uDD11 Key Concepts\n' +
          'For each important concept: a ### sub-heading followed by 2-3 sentences explaining it thoroughly.\n\n' +
          '### \uD83D\uDD22 Formulas & Definitions\n' +
          'Every formula and key definition — written out with all variables explained in prose.\n\n' +
          '### \uD83D\uDCC2 File Breakdown\n' +
          'A short paragraph for each file explaining what it specifically contributes.\n\n' +
          '### \u2753 Exam Questions\n' +
          '6 questions spanning the combined content with full answer explanations.'
        }]
      })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.error) {
        body.innerHTML = tagsHtml + '<p style="color:#ff6b35">\u274C ' + (data.error.message || 'API error') + '</p>';
        return;
      }
      msmCurrentText = data.content ? data.content.map(function(b) { return b.text || ''; }).join('') : '';
      body.innerHTML = tagsHtml + lnRenderMarkdown(msmCurrentText);
      document.getElementById('msmSaveBtn').style.display = '';
    })
    .catch(function(e) {
      body.innerHTML = tagsHtml + '<p style="color:#ff6b35">\u274C ' + e.message + '</p>';
    });
  });
}
window.runMultiSummary = runMultiSummary;

// ── File chip sync ────────────────────────────────────────────────────────
// Mirrors #aiFileLabel text into the file chip bar whenever it changes
(function() {
  var label = document.getElementById('aiFileLabel');
  var chip  = document.getElementById('aiFileChip');
  var name  = document.getElementById('aiFileChipName');
  if (!label || !chip || !name) return;

  function syncChip() {
    var txt = label.textContent || '';
    var isEmpty = !txt || txt === 'Ready to help' || txt === 'Bereit zu helfen';
    name.textContent = isEmpty ? 'No file open' : txt;
    chip.className   = 'ai-file-chip' + (isEmpty ? ' empty' : '');
  }
  syncChip();
  new MutationObserver(syncChip).observe(label, { childList: true, characterData: true, subtree: true });
})();

// ── Scroll intent detection ───────────────────────────────────────────────
// If the user scrolls up during generation, stop auto-scrolling.
// When they scroll back to the bottom, resume.
(function() {
  var msgs = document.getElementById('aiMsgs');
  if (!msgs) return;
  var prevScrollTop = 0;
  msgs.addEventListener('scroll', function() {
    var atBottom = (msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight) < 60;
    if (atBottom) {
      _aiUserScrolled = false;
    } else if (msgs.scrollTop < prevScrollTop) {
      // User actively scrolled up
      _aiUserScrolled = true;
    }
    prevScrollTop = msgs.scrollTop;
  }, { passive: true });
})();

console.log('\u2713 ai/ai.js loaded — model: ' + AI_MODEL + ', max_tokens: ' + AI_MAX_TOK + ', pdf_cap: ' + AI_PDF_CAP);
