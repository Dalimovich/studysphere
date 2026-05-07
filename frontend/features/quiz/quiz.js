// Quiz feature module — Phase 2: full AI-generated multi-choice quizzes.

(function () {
  var TEMPLATE_URL = 'features/quiz/quiz.html';
  var _templatePromise = null;

  // courseId -> { quizzes: [{id, name, items, answers, submitted, createdAt, lastTaken, progress, bestScore}], activeId }
  var _state = {};

  function _loadTemplate() {
    if (_templatePromise) return _templatePromise;
    _templatePromise = fetch(TEMPLATE_URL)
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var tmp = document.createElement('div');
        tmp.innerHTML = html;
        var root = tmp.querySelector('[data-quiz-root]');
        return root ? root.outerHTML : html;
      })
      .catch(function (err) {
        console.error('quiz template load error:', err);
        return '<div class="qz-empty">Failed to load quiz UI.</div>';
      });
    return _templatePromise;
  }

  window.mountQuiz = function (target, course, options) {
    if (!target) return Promise.resolve();
    options = options || {};
    return _loadTemplate().then(function (html) {
      target.innerHTML = html;
      var root = target.querySelector('[data-quiz-root]');
      if (!root) return;
      _initShell(root, course, options);
    });
  };

  function _getStateFor(courseId) {
    if (!_state[courseId]) _state[courseId] = { quizzes: [], activeId: null };
    return _state[courseId];
  }

  function _toast(title, body) {
    if (typeof window.showToast === 'function') window.showToast(title, body);
  }

  function _esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function _initShell(root, course, options) {
    var courseId = (course && course.id) || 'unknown';
    if (course && course.id) root.dataset.courseId = course.id;
    var state = _getStateFor(courseId);

    var els = {
      list: root.querySelector('#qzList'),
      generate: root.querySelector('#qzGenerateBtn'),
      newQuiz: root.querySelector('#qzNewQuizBtn'),
      search: root.querySelector('#qzSearchInput'),
      sort: root.querySelector('#qzSortSelect'),
      takeName: root.querySelector('#qzTakeName'),
      takeCount: root.querySelector('#qzTakeCount'),
      takeScore: root.querySelector('#qzTakeScore'),
      question: root.querySelector('#qzQuestion'),
      options: root.querySelector('#qzOptions'),
      progressBar: root.querySelector('#qzProgressBar'),
      progressLabel: root.querySelector('#qzProgressLabel'),
      prev: root.querySelector('#qzPrevBtn'),
      submit: root.querySelector('#qzSubmitBtn'),
      next: root.querySelector('#qzNextBtn')
    };

    // ── List pane ──
    function renderList() {
      if (!els.list) return;
      var query = (els.search && els.search.value || '').trim().toLowerCase();
      var sortBy = (els.sort && els.sort.value) || 'recent';
      var quizzes = state.quizzes.slice();
      if (query) {
        quizzes = quizzes.filter(function (q) {
          return (q.name || '').toLowerCase().indexOf(query) !== -1;
        });
      }
      quizzes.sort(function (a, b) {
        if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
        if (sortBy === 'score') {
          var aS = a.bestScore != null ? a.bestScore / (a.items.length || 1) : -1;
          var bS = b.bestScore != null ? b.bestScore / (b.items.length || 1) : -1;
          return bS - aS;
        }
        if (sortBy === 'created') return (b.createdAt || 0) - (a.createdAt || 0);
        var aT = a.lastTaken ? new Date(a.lastTaken).getTime() : 0;
        var bT = b.lastTaken ? new Date(b.lastTaken).getTime() : 0;
        return bT - aT;
      });

      if (!quizzes.length) {
        els.list.innerHTML =
          '<div class="qz-empty">' +
          (state.quizzes.length
            ? 'No quizzes match your search.'
            : 'No quizzes yet. Click <strong>Generate quiz</strong> to make one from this course\'s material.') +
          '</div>';
        return;
      }

      els.list.innerHTML = quizzes.map(function (q) {
        var isActive = q.id === state.activeId;
        var scoreHtml = q.bestScore != null
          ? '<span class="qz-list-item-score' + ((q.bestScore / q.items.length) < 0.5 ? ' low' : '') + '">' +
              q.bestScore + '/' + q.items.length + '</span>'
          : '';
        return (
          '<div class="qz-list-item' + (isActive ? ' active' : '') + '" data-quiz-id="' + _esc(q.id) + '">' +
            '<span class="qz-list-item-icon">&#x1F4DD;</span>' +
            '<div>' +
              '<div class="qz-list-item-name">' + _esc(q.name) + '</div>' +
              '<div class="qz-list-item-meta">' + q.items.length + ' questions</div>' +
            '</div>' +
            scoreHtml +
            '<button class="qz-btn qz-btn-ghost" style="margin-left:auto;padding:5px 10px;font-size:0.7rem;flex-shrink:0" data-quiz-delete="' + _esc(q.id) + '" title="Delete">&#x1F5D1;</button>' +
          '</div>'
        );
      }).join('');

      els.list.querySelectorAll('[data-quiz-id]').forEach(function (item) {
        item.addEventListener('click', function () {
          selectQuiz(item.getAttribute('data-quiz-id'));
        });
      });
      els.list.querySelectorAll('[data-quiz-delete]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          var id = btn.getAttribute('data-quiz-delete');
          var q = state.quizzes.find(function (x) { return x.id === id; });
          if (!q) return;
          if (!window.confirm('Delete quiz "' + q.name + '"?')) return;
          state.quizzes = state.quizzes.filter(function (x) { return x.id !== id; });
          if (state.activeId === id) state.activeId = state.quizzes.length ? state.quizzes[0].id : null;
          renderAll();
        });
      });
    }

    function selectQuiz(id) {
      state.activeId = id;
      var q = state.quizzes.find(function (x) { return x.id === id; });
      if (q) {
        q.progress = 0;
        q.answers = {};
        q.submitted = {};
      }
      renderAll();
    }

    // ── Take pane ──
    function renderTake() {
      var q = state.quizzes.find(function (x) { return x.id === state.activeId; });
      if (!q || !q.items.length) {
        if (els.takeName) els.takeName.textContent = q ? q.name : 'Select a quiz';
        if (els.takeCount) els.takeCount.textContent = q ? '0 questions' : '';
        if (els.takeScore) els.takeScore.hidden = true;
        if (els.question) els.question.innerHTML = '<div class="qz-question-empty">' + (q ? 'This quiz has no questions.' : 'Pick a quiz to start.') + '</div>';
        if (els.options) els.options.innerHTML = '';
        if (els.progressBar) els.progressBar.style.width = '0%';
        if (els.progressLabel) els.progressLabel.textContent = '0 / 0';
        [els.prev, els.submit, els.next].forEach(function (b) { if (b) b.disabled = true; });
        return;
      }

      if (els.takeName) els.takeName.textContent = q.name;
      if (els.takeCount) els.takeCount.textContent = q.items.length + ' questions';

      var idx = Math.max(0, Math.min(q.progress || 0, q.items.length - 1));
      var item = q.items[idx];
      var answered = q.answers[idx];
      var isSubmitted = !!q.submitted[idx];

      var correct = 0;
      Object.keys(q.submitted).forEach(function (k) {
        if (q.submitted[k] && q.answers[parseInt(k, 10)] === q.items[parseInt(k, 10)].answer) correct++;
      });
      var submittedCount = Object.keys(q.submitted).length;
      if (els.takeScore) {
        els.takeScore.hidden = submittedCount === 0;
        els.takeScore.textContent = correct + ' / ' + submittedCount;
      }

      if (els.question) els.question.textContent = item.question;

      if (els.options) {
        var letters = ['A', 'B', 'C', 'D'];
        els.options.innerHTML = (item.options || []).map(function (opt, i) {
          var cls = 'qz-option';
          if (isSubmitted) {
            if (i === item.answer) cls += ' correct';
            else if (i === answered) cls += ' incorrect';
          } else if (i === answered) {
            cls += ' selected';
          }
          return (
            '<button class="' + cls + '" data-opt-idx="' + i + '"' + (isSubmitted ? ' disabled' : '') + '>' +
              '<span class="qz-option-letter">' + _esc(letters[i] || String(i + 1)) + '</span>' +
              '<span>' + _esc(opt) + '</span>' +
            '</button>'
          );
        }).join('');

        if (!isSubmitted) {
          els.options.querySelectorAll('[data-opt-idx]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              q.answers[idx] = parseInt(btn.getAttribute('data-opt-idx'), 10);
              renderTake();
            });
          });
        }
      }

      var pct = ((idx + 1) / q.items.length) * 100;
      if (els.progressBar) els.progressBar.style.width = pct + '%';
      if (els.progressLabel) els.progressLabel.textContent = (idx + 1) + ' / ' + q.items.length;
      if (els.prev) els.prev.disabled = idx === 0;
      if (els.next) els.next.disabled = idx >= q.items.length - 1;
      if (els.submit) {
        els.submit.disabled = isSubmitted || answered == null;
        els.submit.textContent = isSubmitted ? '✓ Submitted' : 'Submit';
      }
    }

    function renderAll() { renderList(); renderTake(); }

    // ── Study controls ──
    if (els.prev) els.prev.addEventListener('click', function () {
      var q = state.quizzes.find(function (x) { return x.id === state.activeId; });
      if (!q) return;
      q.progress = Math.max(0, (q.progress || 0) - 1);
      renderAll();
    });
    if (els.next) els.next.addEventListener('click', function () {
      var q = state.quizzes.find(function (x) { return x.id === state.activeId; });
      if (!q) return;
      q.progress = Math.min(q.items.length - 1, (q.progress || 0) + 1);
      renderAll();
    });
    if (els.submit) els.submit.addEventListener('click', function () {
      var q = state.quizzes.find(function (x) { return x.id === state.activeId; });
      if (!q) return;
      var idx = q.progress || 0;
      if (q.answers[idx] == null) return;
      q.submitted[idx] = true;
      q.lastTaken = new Date().toISOString();
      var correct = 0;
      Object.keys(q.submitted).forEach(function (k) {
        if (q.submitted[k] && q.answers[parseInt(k, 10)] === q.items[parseInt(k, 10)].answer) correct++;
      });
      if (q.bestScore == null || correct > q.bestScore) q.bestScore = correct;
      renderAll();
    });

    // ── Generate ──
    function defaultQuizName() {
      return (course && course.name ? course.name : 'Quiz') + ' — Set ' + (state.quizzes.length + 1);
    }

    function doGenerate() {
      if (!options.generate) {
        _toast('Generation unavailable', 'Generator function not injected.');
        return;
      }
      els.generate.disabled = true;
      var origLabel = els.generate.innerHTML;
      els.generate.innerHTML = '<span class="qz-btn-icon">&#x23F3;</span> Generating…';
      options.generate(course.id, 'quiz', {
        count: 10,
        difficulty: 'medium',
        topic: (course && course.name) || null
      }).then(function (result) {
        if (!result || !result.items || !result.items.length) {
          _toast('Nothing generated', (result && result.error) || 'No content yet — try indexing a PDF first.');
          return;
        }
        var quiz = {
          id: 'q_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
          name: defaultQuizName(),
          items: result.items.map(function (item) {
            return {
              question: item.question,
              options: item.options,
              answer: typeof item.answer === 'number' ? item.answer : 0,
              source: item.source || ''
            };
          }),
          createdAt: Date.now(),
          lastTaken: null,
          progress: 0,
          answers: {},
          submitted: {},
          bestScore: null
        };
        state.quizzes.unshift(quiz);
        state.activeId = quiz.id;
        _toast('Quiz generated', quiz.items.length + ' questions from indexed material.');
        renderAll();
      }).catch(function (err) {
        console.error('quiz generate error:', err);
        _toast('Generation failed', 'Try again, or reindex your PDFs first.');
      }).finally(function () {
        els.generate.disabled = false;
        els.generate.innerHTML = origLabel;
      });
    }

    if (els.generate) els.generate.addEventListener('click', doGenerate);
    if (els.newQuiz) els.newQuiz.addEventListener('click', function () {
      var name = window.prompt('Name for new (empty) quiz', defaultQuizName());
      if (!name) return;
      var quiz = {
        id: 'q_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        name: name.trim(),
        items: [],
        createdAt: Date.now(),
        lastTaken: null,
        progress: 0,
        answers: {},
        submitted: {},
        bestScore: null
      };
      state.quizzes.unshift(quiz);
      state.activeId = quiz.id;
      renderAll();
    });
    if (els.search) els.search.addEventListener('input', renderList);
    if (els.sort) els.sort.addEventListener('change', renderList);

    renderAll();
  }
})();
