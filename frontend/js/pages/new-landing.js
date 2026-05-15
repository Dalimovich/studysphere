/* new-landing.js — interactivity layer for the standalone Minallo landing page.
 * Single self-contained IIFE. No imports, no globals beyond a single init flag.
 * Behaviors:
 *   A. Mobile nav toggle           (initMobileNav)
 *   B. Path picker swap            (initPathPicker)
 *   C. Tutor preview tab highlight (initTutorPreviewTabs)
 *   D. Scroll-triggered fade-in    (initRevealOnScroll)
 *   E. Hero halo parallax          (initHeroParallax)
 *   F. Footer current year         (initFooterYear)
 * Honors prefers-reduced-motion.
 */
(function () {
  'use strict';

  if (window.__nlLandingInited) return;
  window.__nlLandingInited = true;

  var prefersReducedMotion = (function () {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (_e) {
      return false;
    }
  })();

  // Mirror of PATH_CONTENT from reference-react.tsx (lines 32-69).
  // Icon names map to inline-SVG <symbol id="i-..."> in the page sprite.
  var PATH_CONTENT = {
    student: {
      title: 'Student dashboard',
      subtitle: 'For university and school work',
      description:
        'A focused dashboard for courses, lecture PDFs, exercises, AI explanations, PDF editing, Pomodoro sessions, streaks, and study progress.',
      icon: 'layout-dashboard',
      items: [
        'Course pages for lectures, exercises, notes, and formula sheets',
        'AI tutor answers grounded in uploaded course documents',
        'PDF editor for highlighting, writing, signing, saving, and exporting',
        'Pomodoro timer, study streaks, dashboard stats, and progress tracking'
      ],
      preview: [
        ['file-text', 'Course library', 'Organize every subject and file in one clean place.'],
        ['brain-circuit', 'AI study help', 'Ask questions and get cited, course-aware answers.'],
        ['timer', 'Focus mode', 'Study with Pomodoro sessions and visible streaks.']
      ]
    },
    german: {
      title: 'German learner',
      subtitle: 'For language practice',
      description:
        'A dedicated German-learning space with vocabulary, grammar help, simple explanations, examples, and playful revision.',
      icon: 'languages',
      items: [
        'German vocabulary practice with simple examples and translations',
        'Grammar explanations in beginner-friendly language',
        'Simple sentence examples for daily German situations',
        'Mini-games and revision challenges to make practice less boring'
      ],
      preview: [
        ['languages', 'German coach', 'Learn words, grammar, sentences, and everyday phrases.'],
        ['book-open', 'Examples & phrases', 'Practice German with simple examples and everyday sentences.'],
        ['gamepad-2', 'Language games', 'Review vocabulary through quick challenges and games.']
      ]
    }
  };

  // ---- helpers ----------------------------------------------------------

  /** Build an <svg><use href="#i-name"/></svg> node without using innerHTML. */
  function buildSvgUse(iconName, size) {
    var svgNS = 'http://www.w3.org/2000/svg';
    var xlinkNS = 'http://www.w3.org/1999/xlink';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', String(size));
    svg.setAttribute('height', String(size));
    svg.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS(svgNS, 'use');
    use.setAttribute('href', '#i-' + iconName);
    // xlink:href fallback for older renderers
    use.setAttributeNS(xlinkNS, 'xlink:href', '#i-' + iconName);
    svg.appendChild(use);
    return svg;
  }

  function clearChildren(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  // ---- A. Mobile navigation toggle --------------------------------------

  function initMobileNav() {
    var nav = document.querySelector('.nl-nav');
    var btn = document.querySelector('[data-nl-menu-btn]');
    var dropdown = document.querySelector('[data-nl-mobile-menu]');
    if (!nav || !btn || !dropdown) return;

    function setOpen(open) {
      if (open) {
        nav.classList.add('is-open');
        btn.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
        dropdown.hidden = false;
      } else {
        nav.classList.remove('is-open');
        btn.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
        dropdown.hidden = true;
      }
    }

    btn.addEventListener('click', function () {
      setOpen(!nav.classList.contains('is-open'));
    });

    // Clicking any link inside the dropdown closes it.
    var links = dropdown.querySelectorAll('[data-nl-mobile-link]');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function () {
        setOpen(false);
      });
    }
  }

  // ---- B. Path picker ---------------------------------------------------

  function initPathPicker() {
    var cards = document.querySelectorAll('[data-nl-path]');
    var detail = document.querySelector('[data-nl-path-detail]');
    if (!cards.length || !detail) return;

    var iconHost = detail.querySelector('[data-nl-path-icon]');
    var subEl = detail.querySelector('[data-nl-path-subtitle]');
    var titleEl = detail.querySelector('[data-nl-path-title]');
    var descEl = detail.querySelector('[data-nl-path-desc]');
    var itemsEl = detail.querySelector('[data-nl-path-items]');
    var previewEl = detail.querySelector('[data-nl-path-preview]');

    function renderItems(items) {
      if (!itemsEl) return;
      clearChildren(itemsEl);
      for (var i = 0; i < items.length; i++) {
        var row = document.createElement('div');
        row.className = 'nl-paths__hero-item';

        var check = document.createElement('span');
        check.className = 'nl-check';
        check.appendChild(buildSvgUse('check-circle-2', 19));
        row.appendChild(check);

        var text = document.createElement('span');
        text.textContent = items[i];
        row.appendChild(text);

        itemsEl.appendChild(row);
      }
    }

    function renderPreview(preview) {
      if (!previewEl) return;
      clearChildren(previewEl);
      for (var i = 0; i < preview.length; i++) {
        var entry = preview[i];
        var iconName = entry[0];
        var pTitle = entry[1];
        var pText = entry[2];

        var card = document.createElement('div');
        card.className = 'nl-paths__preview-card';

        var badge = document.createElement('span');
        badge.className = 'nl-icon-badge';
        badge.appendChild(buildSvgUse(iconName, 23));
        card.appendChild(badge);

        var h4 = document.createElement('h4');
        h4.className = 'nl-paths__preview-title';
        h4.textContent = pTitle;
        card.appendChild(h4);

        var p = document.createElement('p');
        p.className = 'nl-paths__preview-text';
        p.textContent = pText;
        card.appendChild(p);

        previewEl.appendChild(card);
      }
    }

    function selectPath(key) {
      var data = PATH_CONTENT[key];
      if (!data) return;

      // Toggle active state on path cards.
      for (var i = 0; i < cards.length; i++) {
        var c = cards[i];
        var isActive = c.getAttribute('data-nl-path') === key;
        if (isActive) c.classList.add('is-active');
        else c.classList.remove('is-active');
        c.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      }

      // Update detail panel.
      detail.setAttribute('data-nl-path-detail', key);
      if (iconHost) {
        clearChildren(iconHost);
        iconHost.appendChild(buildSvgUse(data.icon, 26));
      }
      if (subEl) subEl.textContent = data.subtitle;
      if (titleEl) titleEl.textContent = data.title;
      if (descEl) descEl.textContent = data.description;
      renderItems(data.items);
      renderPreview(data.preview);
    }

    for (var j = 0; j < cards.length; j++) {
      (function (card) {
        card.addEventListener('click', function () {
          var key = card.getAttribute('data-nl-path');
          if (key) selectPath(key);
        });
      })(cards[j]);
    }
    // Default state ("student") is already pre-rendered by task-01;
    // no initial selectPath() call needed.
  }

  // ---- C. Tutor preview tabs -------------------------------------------

  function initTutorPreviewTabs() {
    var tabs = document.querySelectorAll('[data-nl-tab]');
    if (!tabs.length) return;
    for (var i = 0; i < tabs.length; i++) {
      (function (tab) {
        tab.addEventListener('click', function () {
          for (var k = 0; k < tabs.length; k++) {
            var t = tabs[k];
            var isActive = t === tab;
            if (isActive) t.classList.add('is-active');
            else t.classList.remove('is-active');
            t.setAttribute('aria-selected', isActive ? 'true' : 'false');
          }
        });
      })(tabs[i]);
    }
  }

  // ---- D. Scroll-triggered fade-in -------------------------------------

  function initRevealOnScroll() {
    var revealEls = document.querySelectorAll('.nl-reveal');
    if (!revealEls.length) return;

    if (prefersReducedMotion || typeof window.IntersectionObserver !== 'function') {
      for (var i = 0; i < revealEls.length; i++) revealEls[i].classList.add('is-visible');
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          var entry = entries[i];
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: '-80px 0px' }
    );

    for (var j = 0; j < revealEls.length; j++) observer.observe(revealEls[j]);
  }

  // ---- E. Hero halo parallax -------------------------------------------

  function initHeroParallax() {
    if (prefersReducedMotion) return;
    var halo = document.querySelector('[data-nl-parallax]');
    if (!halo) return;

    var ticking = false;
    var MAX_TRANSLATE = -130; // matches useTransform(scrollYProgress, [0,1], [0,-130])

    function update() {
      ticking = false;
      var doc = document.documentElement;
      var max = Math.max(1, (doc.scrollHeight || 0) - (window.innerHeight || 0));
      var ratio = Math.min(1, Math.max(0, (window.scrollY || window.pageYOffset || 0) / max));
      var y = MAX_TRANSLATE * ratio;
      halo.style.transform = 'translate3d(-50%, ' + y + 'px, 0)';
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }

  // ---- F. Footer year ---------------------------------------------------

  function initFooterYear() {
    var el = document.getElementById('nlYear');
    if (!el) return;
    el.textContent = String(new Date().getFullYear());
  }

  // ---- bootstrap --------------------------------------------------------

  function init() {
    try { initMobileNav(); } catch (e) { /* swallow per-feature errors */ }
    try { initPathPicker(); } catch (e) { /* noop */ }
    try { initTutorPreviewTabs(); } catch (e) { /* noop */ }
    try { initRevealOnScroll(); } catch (e) { /* noop */ }
    try { initHeroParallax(); } catch (e) { /* noop */ }
    try { initFooterYear(); } catch (e) { /* noop */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
