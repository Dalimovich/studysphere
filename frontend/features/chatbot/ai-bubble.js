/* ── AI FLOATING BUBBLE ─────────────────────────────────────────────────────
   Self-contained IIFE. No ES modules, no import/export.
   Injects the draggable bubble + resizable/draggable panel into document.body.
   ──────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  // ── Constants ─────────────────────────────────────────────────────────────
  var DRAG_THRESHOLD  = 6;
  var SNAP_MARGIN     = 16;
  var PANEL_DEFAULT_W = 400;
  var PANEL_DEFAULT_H = 600;
  var PANEL_MIN_W     = 300;
  var PANEL_MIN_H     = 360;
  var STORAGE_KEY     = 'ss_ai_bubble_pos';
  var PANEL_SIZE_KEY  = 'ss_ai_panel_size';

  // ── State ──────────────────────────────────────────────────────────────────
  var isDragging      = false;
  var isPanelOpen     = false;
  var isPinned        = false;
  var startX          = 0;
  var startY          = 0;
  var bubbleStartLeft = 0;
  var bubbleStartTop  = 0;
  var totalMovement   = 0;
  var _initialized    = false;

  // ── Inject HTML ────────────────────────────────────────────────────────────
  function injectHTML() {
    var bubbleEl = document.createElement('div');
    bubbleEl.id = 'aiBubble';
    bubbleEl.title = 'StudySphere AI';
    bubbleEl.innerHTML =
      '<svg class="ai-bubble-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<rect x="3" y="8" width="18" height="11" rx="3" fill="currentColor" opacity="0.9"/>' +
        '<circle cx="9" cy="13.5" r="1.5" fill="rgba(15,23,42,0.8)"/>' +
        '<circle cx="15" cy="13.5" r="1.5" fill="rgba(15,23,42,0.8)"/>' +
        '<rect x="8" y="16.5" width="8" height="1.2" rx="0.6" fill="rgba(15,23,42,0.6)"/>' +
        '<rect x="10" y="5" width="4" height="4" rx="1" fill="currentColor" opacity="0.7"/>' +
        '<circle cx="12" cy="4" r="1.5" fill="currentColor" opacity="0.8"/>' +
        '<rect x="1" y="10" width="2" height="5" rx="1" fill="currentColor" opacity="0.6"/>' +
        '<rect x="21" y="10" width="2" height="5" rx="1" fill="currentColor" opacity="0.6"/>' +
      '</svg>' +
      '<span id="aiBubbleStatus"></span>';
    document.body.appendChild(bubbleEl);

    // Resize handles markup
    var handles = ['n','s','e','w','nw','ne','sw','se'];
    var handlesHtml = handles.map(function(d) {
      return '<div class="ai-resize-handle ai-resize-' + d + '" data-dir="' + d + '"></div>';
    }).join('');

    var panelEl = document.createElement('div');
    panelEl.id = 'aiFloatPanel';
    panelEl.style.display = 'none';
    panelEl.innerHTML =
      handlesHtml +
      '<div id="aiFpHeader">' +
        '<div id="aiFpTitle">' +
          '<span class="ai-fp-icon">🤖</span>' +
          '<div>' +
            '<div class="ai-fp-name">StudySphere AI</div>' +
            '<div class="ai-fp-status"><span class="ai-status-dot"></span> Online</div>' +
          '</div>' +
        '</div>' +
        '<div id="aiFpControls">' +
          '<button id="aiFpPin" title="Pin panel">📌</button>' +
          '<button id="aiFpClose" title="Close">✕</button>' +
        '</div>' +
      '</div>' +
      '<div id="aiFpMessages">' +
        '<div class="ai-fp-empty">' +
          '<span class="ai-fp-empty-icon">🤖</span>' +
          '<span>Ask me anything about your course!</span>' +
        '</div>' +
      '</div>' +
      '<div id="aiFpQuickActions">' +
        '<button class="ai-chip" data-action="summarize">📄 Summarize PDF</button>' +
        '<button class="ai-chip" data-action="notes">📝 Generate Notes</button>' +
        '<button class="ai-chip" data-action="quiz">❓ Quiz me</button>' +
        '<button class="ai-chip" data-action="flashcards">🃏 Flashcards</button>' +
      '</div>' +
      '<div id="aiFpInputRow">' +
        '<textarea id="aiFpInput" placeholder="Ask anything about your course…" rows="1"></textarea>' +
        '<button id="aiFpSend" title="Send">➤</button>' +
      '</div>';
    document.body.appendChild(panelEl);
  }

  // ── Snap logic (bubble) ────────────────────────────────────────────────────
  function snapBubble(x, y, bW, bH, vW, vH) {
    var distL = x;
    var distR = vW - x - bW;
    var distT = y;
    var distB = vH - y - bH;
    var min = Math.min(distL, distR, distT, distB);

    if (min === distL) return { left: SNAP_MARGIN, top: Math.max(SNAP_MARGIN, Math.min(y, vH - bH - SNAP_MARGIN)) };
    if (min === distR) return { left: vW - bW - SNAP_MARGIN, top: Math.max(SNAP_MARGIN, Math.min(y, vH - bH - SNAP_MARGIN)) };
    if (min === distT) return { left: Math.max(SNAP_MARGIN, Math.min(x, vW - bW - SNAP_MARGIN)), top: SNAP_MARGIN + 56 };
    return { left: Math.max(SNAP_MARGIN, Math.min(x, vW - bW - SNAP_MARGIN)), top: vH - bH - SNAP_MARGIN };
  }

  // ── Panel positioning (initial open) ──────────────────────────────────────
  function positionPanel(bubble, panel) {
    var bRect = bubble.getBoundingClientRect();
    var vW    = window.innerWidth;
    var vH    = window.innerHeight;

    // Use saved size if available, else defaults
    var saved = getSavedPanelSize();
    var pW = Math.max(PANEL_MIN_W, Math.min(saved.w, vW - 24));
    var pH = Math.max(PANEL_MIN_H, Math.min(saved.h, vH - 16));

    // Place panel above the bubble if there's room, else below, else best fit
    var top, left;
    var spaceAbove = bRect.top - 12;
    var spaceBelow = vH - bRect.bottom - 12;

    if (spaceAbove >= PANEL_MIN_H) {
      // Anchor bottom of panel to just above bubble
      top = Math.max(8, bRect.top - pH - 12);
    } else if (spaceBelow >= PANEL_MIN_H) {
      top = bRect.bottom + 12;
    } else {
      // Not enough space either way — open tall from top
      top = 8;
      pH  = vH - 16;
    }

    // Horizontally: prefer right-aligned with bubble, clamped to viewport
    left = Math.max(8, Math.min(bRect.right - pW, vW - pW - 8));
    if (left < 8) left = Math.min(8, vW - pW - 8);

    top  = Math.max(8, Math.min(top,  vH - pH - 8));
    left = Math.max(8, Math.min(left, vW - pW - 8));

    panel.style.top    = top  + 'px';
    panel.style.left   = left + 'px';
    panel.style.width  = pW   + 'px';
    panel.style.height = pH   + 'px';
  }

  // ── Save / restore panel size ──────────────────────────────────────────────
  function getSavedPanelSize() {
    try {
      var s = JSON.parse(localStorage.getItem(PANEL_SIZE_KEY) || 'null');
      if (s && s.w && s.h) return s;
    } catch (e) {}
    return { w: PANEL_DEFAULT_W, h: PANEL_DEFAULT_H };
  }

  function savePanelSize(w, h) {
    try { localStorage.setItem(PANEL_SIZE_KEY, JSON.stringify({ w: w, h: h })); } catch (e) {}
  }

  // ── Open / close panel ─────────────────────────────────────────────────────
  function openPanel() {
    var bubble = document.getElementById('aiBubble');
    var panel  = document.getElementById('aiFloatPanel');
    if (!bubble || !panel) return;
    isPanelOpen = true;
    bubble.classList.add('expanded');
    panel.style.display = 'flex';
    positionPanel(bubble, panel);
    panel.classList.remove('panel-closing');
    panel.classList.add('panel-opening');
    panel.addEventListener('animationend', function onOpen() {
      panel.classList.remove('panel-opening');
      panel.removeEventListener('animationend', onOpen);
    });
    var input = document.getElementById('aiFpInput');
    if (input) setTimeout(function () { input.focus(); }, 50);
  }

  function closePanel() {
    var bubble = document.getElementById('aiBubble');
    var panel  = document.getElementById('aiFloatPanel');
    if (!bubble || !panel) return;
    isPanelOpen = false;
    bubble.classList.remove('expanded');
    panel.classList.remove('panel-opening');
    panel.classList.add('panel-closing');
    panel.addEventListener('animationend', function onClose() {
      panel.classList.remove('panel-closing');
      panel.style.display = 'none';
      panel.removeEventListener('animationend', onClose);
    });
  }

  // ── Panel drag (header) ────────────────────────────────────────────────────
  function attachPanelDrag(panel) {
    var header = document.getElementById('aiFpHeader');
    if (!header) return;

    var pdStartX, pdStartY, pdPanelLeft, pdPanelTop, pdDragging = false;

    header.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button')) return; // don't drag on control buttons
      pdDragging   = true;
      pdStartX     = e.clientX;
      pdStartY     = e.clientY;
      var rect     = panel.getBoundingClientRect();
      pdPanelLeft  = rect.left;
      pdPanelTop   = rect.top;
      header.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    header.addEventListener('pointermove', function (e) {
      if (!pdDragging) return;
      var dx   = e.clientX - pdStartX;
      var dy   = e.clientY - pdStartY;
      var vW   = window.innerWidth;
      var vH   = window.innerHeight;
      var pW   = panel.offsetWidth;
      var pH   = panel.offsetHeight;
      var newL = Math.max(0, Math.min(pdPanelLeft + dx, vW - pW));
      var newT = Math.max(0, Math.min(pdPanelTop  + dy, vH - pH));
      panel.style.left = newL + 'px';
      panel.style.top  = newT + 'px';
    });

    header.addEventListener('pointerup', function () {
      pdDragging = false;
    });
  }

  // ── Panel resize (all edges + corners) ────────────────────────────────────
  function attachPanelResize(panel) {
    var handles = panel.querySelectorAll('.ai-resize-handle');
    handles.forEach(function (handle) {
      handle.addEventListener('pointerdown', function (e) {
        e.stopPropagation();
        e.preventDefault();
        var dir     = handle.getAttribute('data-dir');
        var startX  = e.clientX;
        var startY  = e.clientY;
        var rect    = panel.getBoundingClientRect();
        var origL   = rect.left;
        var origT   = rect.top;
        var origW   = rect.width;
        var origH   = rect.height;
        var vW      = window.innerWidth;
        var vH      = window.innerHeight;

        handle.setPointerCapture(e.pointerId);

        function onMove(ev) {
          var dx = ev.clientX - startX;
          var dy = ev.clientY - startY;
          var newL = origL, newT = origT, newW = origW, newH = origH;

          if (dir.indexOf('e') !== -1)  newW = Math.max(PANEL_MIN_W, origW + dx);
          if (dir.indexOf('s') !== -1)  newH = Math.max(PANEL_MIN_H, origH + dy);
          if (dir.indexOf('w') !== -1) {
            newW = Math.max(PANEL_MIN_W, origW - dx);
            newL = origL + origW - newW;
          }
          if (dir.indexOf('n') !== -1) {
            newH = Math.max(PANEL_MIN_H, origH - dy);
            newT = origT + origH - newH;
          }

          // Clamp to viewport
          newL = Math.max(0, Math.min(newL, vW - PANEL_MIN_W));
          newT = Math.max(0, Math.min(newT, vH - PANEL_MIN_H));
          newW = Math.min(newW, vW - newL);
          newH = Math.min(newH, vH - newT);

          panel.style.left   = newL + 'px';
          panel.style.top    = newT + 'px';
          panel.style.width  = newW + 'px';
          panel.style.height = newH + 'px';
        }

        function onUp() {
          savePanelSize(panel.offsetWidth, panel.offsetHeight);
          handle.removeEventListener('pointermove', onMove);
          handle.removeEventListener('pointerup',   onUp);
        }

        handle.addEventListener('pointermove', onMove);
        handle.addEventListener('pointerup',   onUp);
      });
    });
  }

  // ── Bubble drag ────────────────────────────────────────────────────────────
  function attachDrag(bubble) {
    bubble.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      isDragging    = false;
      totalMovement = 0;
      startX = e.clientX;
      startY = e.clientY;
      var rect = bubble.getBoundingClientRect();
      bubbleStartLeft = rect.left;
      bubbleStartTop  = rect.top;
      bubble.setPointerCapture(e.pointerId);
      bubble.classList.add('dragging');
    });

    bubble.addEventListener('pointermove', function (e) {
      if (!bubble.hasPointerCapture(e.pointerId)) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      totalMovement = Math.sqrt(dx * dx + dy * dy);
      if (totalMovement > DRAG_THRESHOLD) {
        isDragging = true;
        e.preventDefault();
        var newLeft = bubbleStartLeft + dx;
        var newTop  = bubbleStartTop  + dy;
        var vW = window.innerWidth;
        var vH = window.innerHeight;
        newLeft = Math.max(0, Math.min(newLeft, vW - bubble.offsetWidth));
        newTop  = Math.max(0, Math.min(newTop,  vH - bubble.offsetHeight));
        bubble.style.left = newLeft + 'px';
        bubble.style.top  = newTop  + 'px';
      }
    });

    bubble.addEventListener('pointerup', function (e) {
      if (!bubble.hasPointerCapture(e.pointerId)) return;
      bubble.releasePointerCapture(e.pointerId);
      bubble.classList.remove('dragging');

      if (!isDragging) {
        if (isPanelOpen) closePanel(); else openPanel();
      } else {
        var rect    = bubble.getBoundingClientRect();
        var vW      = window.innerWidth;
        var vH      = window.innerHeight;
        var snapped = snapBubble(rect.left, rect.top, bubble.offsetWidth, bubble.offsetHeight, vW, vH);
        bubble.classList.add('snapping');
        bubble.style.left = snapped.left + 'px';
        bubble.style.top  = snapped.top  + 'px';
        bubble.addEventListener('transitionend', function onSnap() {
          bubble.classList.remove('snapping');
          bubble.removeEventListener('transitionend', onSnap);
        });
        savePosition(snapped.left, snapped.top);
      }
      isDragging = false;
    });
  }

  // ── Save / restore bubble position ────────────────────────────────────────
  function savePosition(left, top) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ left: left, top: top })); } catch (e) {}
  }

  function restorePosition(bubble) {
    var vW = window.innerWidth;
    var vH = window.innerHeight;
    var bW = bubble.offsetWidth  || 60;
    var bH = bubble.offsetHeight || 60;
    var defaultLeft = vW - bW - SNAP_MARGIN;
    var defaultTop  = vH - bH - SNAP_MARGIN - 20;

    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && typeof saved.left === 'number' && typeof saved.top === 'number') {
        if (saved.left >= 0 && saved.left <= vW - bW && saved.top >= 0 && saved.top <= vH - bH) {
          bubble.style.left = saved.left + 'px';
          bubble.style.top  = saved.top  + 'px';
          return;
        }
      }
    } catch (e) {}

    bubble.style.left = defaultLeft + 'px';
    bubble.style.top  = defaultTop  + 'px';
  }

  // ── Messages ───────────────────────────────────────────────────────────────
  function appendMessage(role, html) {
    var msgs = document.getElementById('aiFpMessages');
    if (!msgs) return null;
    var empty = msgs.querySelector('.ai-fp-empty');
    if (empty) empty.remove();

    var wrap   = document.createElement('div');
    wrap.className = 'ai-fp-msg ' + role;

    var sender = document.createElement('div');
    sender.className = 'ai-fp-msg-sender';
    sender.textContent = role === 'user' ? 'You' : 'StudySphere AI';

    var bub = document.createElement('div');
    bub.className = 'ai-fp-msg-bubble';
    bub.innerHTML = html;

    wrap.appendChild(sender);
    wrap.appendChild(bub);
    msgs.appendChild(wrap);
    msgs.scrollTop = msgs.scrollHeight;
    return wrap;
  }

  function appendThinking() {
    var msgs = document.getElementById('aiFpMessages');
    if (!msgs) return null;
    var wrap   = document.createElement('div');
    wrap.className = 'ai-fp-msg bot';

    var sender = document.createElement('div');
    sender.className = 'ai-fp-msg-sender';
    sender.textContent = 'StudySphere AI';

    var dot = document.createElement('div');
    dot.className = 'ai-fp-thinking';
    dot.innerHTML = '<span></span><span></span><span></span>';

    wrap.appendChild(sender);
    wrap.appendChild(dot);
    msgs.appendChild(wrap);
    msgs.scrollTop = msgs.scrollHeight;
    return wrap;
  }

  function escapeHtml(t) {
    return String(t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
  }

  // ── Input / send ───────────────────────────────────────────────────────────
  function handleSend() {
    var input = document.getElementById('aiFpInput');
    if (!input) return;
    var text = input.value.trim();
    if (!text) return;
    input.value = '';
    input.style.height = 'auto';

    appendMessage('user', escapeHtml(text));
    var thinkRow = appendThinking();

    if (typeof window._aiBubbleSendMessage === 'function') {
      var result = window._aiBubbleSendMessage(text);
      if (result && typeof result.then === 'function') {
        result.then(function (response) {
          if (thinkRow) thinkRow.remove();
          if (response) appendMessage('bot', escapeHtml(response));
        }).catch(function () {
          if (thinkRow) thinkRow.remove();
          appendMessage('bot', '❌ Something went wrong. Please try again.');
        });
      } else {
        if (thinkRow) setTimeout(function () { if (thinkRow.parentNode) thinkRow.remove(); }, 8000);
      }
    } else {
      document.dispatchEvent(new CustomEvent('ai:message', { detail: { text: text } }));
      setTimeout(function () { if (thinkRow && thinkRow.parentNode) thinkRow.remove(); }, 8000);
    }
  }

  // ── Quick action chips ─────────────────────────────────────────────────────
  var CHIP_CONFIG = {
    summarize: {
      label: 'Summarizing your PDF…',
      trigger: function () {
        if (typeof window._triggerAiSummarize === 'function') window._triggerAiSummarize();
        else document.dispatchEvent(new CustomEvent('ai:summarize'));
      }
    },
    notes: {
      label: 'Generating notes…',
      trigger: function () {
        if (typeof window._triggerAiNotes === 'function') window._triggerAiNotes();
        else document.dispatchEvent(new CustomEvent('ai:notes'));
      }
    },
    quiz: {
      label: 'Starting quiz…',
      trigger: function () {
        if (typeof window._triggerAiQuiz === 'function') window._triggerAiQuiz();
        else document.dispatchEvent(new CustomEvent('ai:quiz'));
      }
    },
    flashcards: {
      label: 'Creating flashcards…',
      trigger: function () {
        if (typeof window._triggerAiFlashcards === 'function') window._triggerAiFlashcards();
        else document.dispatchEvent(new CustomEvent('ai:flashcards'));
      }
    }
  };

  function wireChips() {
    var qa = document.getElementById('aiFpQuickActions');
    if (!qa) return;
    qa.addEventListener('click', function (e) {
      var chip   = e.target.closest('.ai-chip');
      if (!chip) return;
      var action = chip.getAttribute('data-action');
      var cfg    = CHIP_CONFIG[action];
      if (!cfg) return;
      appendMessage('user', escapeHtml(chip.textContent.trim()));
      appendMessage('bot',  escapeHtml(cfg.label));
      cfg.trigger();
    });
  }

  function wireInput() {
    var input = document.getElementById('aiFpInput');
    var send  = document.getElementById('aiFpSend');
    if (input) {
      input.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
      });
    }
    if (send) send.addEventListener('click', handleSend);
  }

  function wireHeader() {
    var closeBtn = document.getElementById('aiFpClose');
    if (closeBtn) closeBtn.addEventListener('click', closePanel);

    var pinBtn = document.getElementById('aiFpPin');
    if (pinBtn) {
      pinBtn.addEventListener('click', function () {
        isPinned = !isPinned;
        pinBtn.classList.toggle('pinned', isPinned);
        pinBtn.title = isPinned ? 'Unpin panel' : 'Pin panel';
      });
    }
  }

  function wireOutsideClick() {
    document.addEventListener('pointerdown', function (e) {
      if (isPinned || !isPanelOpen) return;
      var bubble = document.getElementById('aiBubble');
      var panel  = document.getElementById('aiFloatPanel');
      if (!bubble || !panel) return;
      if (!bubble.contains(e.target) && !panel.contains(e.target)) closePanel();
    });
  }

  function wireViewportResize() {
    window.addEventListener('resize', function () {
      var bubble = document.getElementById('aiBubble');
      if (!bubble) return;
      var vW   = window.innerWidth;
      var vH   = window.innerHeight;
      var left = parseFloat(bubble.style.left) || 0;
      var top  = parseFloat(bubble.style.top)  || 0;
      var bW   = bubble.offsetWidth;
      var bH   = bubble.offsetHeight;
      var cL   = Math.max(0, Math.min(left, vW - bW));
      var cT   = Math.max(0, Math.min(top,  vH - bH));
      if (cL !== left || cT !== top) { bubble.style.left = cL + 'px'; bubble.style.top = cT + 'px'; }

      if (isPanelOpen) {
        var panel = document.getElementById('aiFloatPanel');
        if (panel) {
          var pW = Math.min(panel.offsetWidth,  vW - 16);
          var pH = Math.min(panel.offsetHeight, vH - 16);
          var pL = Math.max(0, Math.min(parseFloat(panel.style.left) || 0, vW - pW));
          var pT = Math.max(0, Math.min(parseFloat(panel.style.top)  || 0, vH - pH));
          panel.style.width  = pW + 'px';
          panel.style.height = pH + 'px';
          panel.style.left   = pL + 'px';
          panel.style.top    = pT + 'px';
        }
      }
    });
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  function exposeAPI() {
    window._aiBubbleOpen   = function () { if (!isPanelOpen) openPanel(); };
    window._aiBubbleClose  = function () { if (isPanelOpen) closePanel(); };
    window._aiBubbleToggle = function () { if (isPanelOpen) closePanel(); else openPanel(); };
    window._aiFpBotReply   = function (html) {
      var msgs = document.getElementById('aiFpMessages');
      if (msgs) {
        var thinking = msgs.querySelector('.ai-fp-thinking');
        if (thinking && thinking.parentNode) thinking.parentNode.remove();
      }
      appendMessage('bot', html);
    };
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  function init() {
    if (_initialized) return;
    _initialized = true;

    injectHTML();

    var bubble = document.getElementById('aiBubble');
    var panel  = document.getElementById('aiFloatPanel');
    if (!bubble || !panel) return;

    restorePosition(bubble);
    attachDrag(bubble);
    attachPanelDrag(panel);
    attachPanelResize(panel);
    wireHeader();
    wireChips();
    wireInput();
    wireOutsideClick();
    wireViewportResize();
    exposeAPI();
  }

  // ── Boot ───────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.addEventListener('ss-ready', init);
})();
