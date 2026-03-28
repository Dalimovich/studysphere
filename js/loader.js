// ── StudySphere Section Loader ─────────────────────────────────────────────────
// Fetches each HTML section file and injects it into the DOM in order,
// then loads app.js and fires 'ss-ready' so supabase.js can do auth init.
// All JS runs in the same window scope — no iframes, no module boundaries.

(function() {

  // ── Session routing ──────────────────────────────────────────────────────
  var root = document.getElementById('ss-sections-root');

  // ── Landing translations ─────────────────────────────────────────────────
  var _landingTrans = {
    en: {
      nav_login: 'Login',
      badge: 'BUILT FOR UNIVERSITY STUDENTS',
      h1: 'Study smarter,<br>not harder.',
      subtitle: 'One workspace for courses, PDFs, your AI tutor and lecture notes. Stop switching tabs — start understanding.',
      cta: 'Start for free →',
      note: 'Free forever · No credit card needed',
      features_label: 'What you get',
      features_title: 'Everything you need to ace your degree',
      f1_title: 'Smart PDF Viewer',
      f1_desc: 'Ask the AI to explain formulas, summarise sections or answer questions — based on the actual document.',
      f2_title: 'AI Study Assistant',
      f2_desc: 'Select any text and get instant explanations, examples and step-by-step solutions from your 24/7 tutor.',
      f3_title: 'Lecture Summaries',
      f3_desc: 'Watch on YouTube or Opencast and auto-generate structured notes with the browser extension.',
      f4_title: 'Course Dashboard',
      f4_desc: 'Subjects, files, timetable, forum and appointments. No more hunting through Stud.IP tabs.',
      f5_title: 'Chat History Per PDF',
      f5_desc: 'Every AI conversation saved per file. Pick up exactly where you left off — on any device.',
      f6_title: 'Secure & Private',
      f6_desc: 'Row-level security via Supabase. Only you can see your notes, settings and profile. Always.',
      cta2_title: 'Ready to study smarter?',
      cta2_desc: 'Join thousands of students already using StudySphere to save time, understand more and stress less.',
      cta2_btn: 'Create your free account →',
      stats_rating: 'Average rating',
      stats_students: 'Students',
      stats_pdfs: 'PDFs analysed',
      reviews_label: 'What students say',
      reviews_title: 'Loved by students',
      footer_signin: 'Sign in'
    },
    de: {
      nav_login: 'Anmelden',
      badge: 'FÜR UNIVERSITÄTSSTUDENTEN',
      h1: 'Klüger studieren,<br>nicht härter.',
      subtitle: 'Ein Arbeitsbereich für Kurse, PDFs, deinen KI-Tutor und Vorlesungsnotizen. Höre auf, Tabs zu wechseln — fange an zu verstehen.',
      cta: 'Kostenlos starten →',
      note: 'Für immer kostenlos · Keine Kreditkarte nötig',
      features_label: 'Was du bekommst',
      features_title: 'Alles, was du für deinen Abschluss brauchst',
      f1_title: 'Intelligenter PDF-Viewer',
      f1_desc: 'Bitte die KI, Formeln zu erklären, Abschnitte zusammenzufassen oder Fragen zu beantworten — basierend auf dem Dokument.',
      f2_title: 'KI-Lernassistent',
      f2_desc: 'Markiere Text und erhalte sofortige Erklärungen, Beispiele und Schritt-für-Schritt-Lösungen von deinem 24/7-Tutor.',
      f3_title: 'Vorlesungszusammenfassungen',
      f3_desc: 'Schaue auf YouTube oder Opencast und generiere automatisch strukturierte Notizen mit der Browsererweiterung.',
      f4_title: 'Kurs-Dashboard',
      f4_desc: 'Fächer, Dateien, Stundenplan, Forum und Termine. Kein Suchen mehr in Stud.IP-Tabs.',
      f5_title: 'Chatverlauf pro PDF',
      f5_desc: 'Jedes KI-Gespräch wird pro Datei gespeichert. Mache genau dort weiter, wo du aufgehört hast — auf jedem Gerät.',
      f6_title: 'Sicher & Privat',
      f6_desc: 'Zeilensicherheit über Supabase. Nur du kannst deine Notizen, Einstellungen und dein Profil sehen. Immer.',
      cta2_title: 'Bereit, klüger zu studieren?',
      cta2_desc: 'Schließe dich Tausenden von Studierenden an, die bereits StudySphere nutzen, um Zeit zu sparen und mehr zu verstehen.',
      cta2_btn: 'Kostenloses Konto erstellen →',
      stats_rating: 'Durchschnittsbewertung',
      stats_students: 'Studierende',
      stats_pdfs: 'Analysierte PDFs',
      reviews_label: 'Was Studierende sagen',
      reviews_title: 'Geliebt von Studierenden',
      footer_signin: 'Anmelden'
    }
  };

  var _landingLang = localStorage.getItem('ss_lang') || 'en';

  function applyLandingTranslation(lang) {
    _landingLang = (lang === 'de') ? 'de' : 'en';
    localStorage.setItem('ss_lang', _landingLang);
    var t = _landingTrans[_landingLang];

    // Nav
    var loginBtn = root.querySelector('[data-i18n="landing_nav_login"]');
    if (loginBtn) loginBtn.textContent = t.nav_login;
    var langBtn = document.getElementById('landingLangBtn');
    if (langBtn) langBtn.textContent = _landingLang === 'de' ? 'EN' : 'DE';

    // Hero
    var badge = root.querySelector('.hero-badge');
    if (badge) {
      var dot = badge.querySelector('.hero-badge-dot');
      badge.innerHTML = t.badge;
      if (dot) badge.insertBefore(dot, badge.firstChild);
    }
    var h1 = root.querySelector('.hero-text h1');
    if (h1) h1.innerHTML = t.h1;
    var heroPara = root.querySelector('.hero-text > p');
    if (heroPara) heroPara.textContent = t.subtitle;
    var heroCta = root.querySelector('a.hero-cta');
    if (heroCta) heroCta.textContent = t.cta;
    var heroNote = root.querySelector('.hero-note');
    if (heroNote) heroNote.textContent = t.note;

    // Features section labels
    var sectionLabel = root.querySelector('.section-label.fade-in');
    if (sectionLabel) sectionLabel.textContent = t.features_label;
    var sectionTitle = root.querySelector('.section-title.fade-in');
    if (sectionTitle) sectionTitle.textContent = t.features_title;

    // Feature cards
    var cards = root.querySelectorAll('.glass-card');
    var descs = [t.f1_desc, t.f2_desc, t.f3_desc, t.f4_desc, t.f5_desc, t.f6_desc];
    var titles = [t.f1_title, t.f2_title, t.f3_title, t.f4_title, t.f5_title, t.f6_title];
    cards.forEach(function(card, i) {
      if (i >= titles.length) return;
      var h3 = card.querySelector('h3');
      var p = card.querySelector('p');
      if (h3) h3.textContent = titles[i];
      if (p) p.textContent = descs[i];
    });

    // CTA section
    var ctaBox = root.querySelector('.cta-box');
    if (ctaBox) {
      var ctaH2 = ctaBox.querySelector('h2');
      var ctaP = ctaBox.querySelector('p');
      var ctaBtn = ctaBox.querySelector('button');
      if (ctaH2) ctaH2.textContent = t.cta2_title;
      if (ctaP) ctaP.textContent = t.cta2_desc;
      if (ctaBtn) ctaBtn.textContent = t.cta2_btn;
    }

    // Stats row labels
    var statSpans = root.querySelectorAll('#ratings span[style*="font-size:.78rem"]');
    var statLabels = [t.stats_rating, t.stats_students, t.stats_pdfs];
    statSpans.forEach(function(el, i) {
      if (statLabels[i]) el.textContent = statLabels[i];
    });

    // Reviews heading
    var reviewsLabel = root.querySelector('#ratings div[style*="Fredoka"][style*=".75rem"]');
    if (reviewsLabel) reviewsLabel.textContent = t.reviews_label;
    var reviewsTitle = root.querySelector('#ratings div[style*="Fredoka"][style*="2.4rem"]');
    if (reviewsTitle) reviewsTitle.textContent = t.reviews_title;

    // Footer sign-in link
    var footerLink = root.querySelector('footer a');
    if (footerLink) footerLink.textContent = t.footer_signin;
  }

  // Public toggle — called by the language button in landing.html
  window._toggleLandingLang = function() {
    applyLandingTranslation(_landingLang === 'en' ? 'de' : 'en');
  };

  if (!window._ssIsLoggedIn) {
    fetch('pages/landing.html')
      .then(function(r) {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' loading landing.html');
        return r.text();
      })
      .then(function(html) {
        root.innerHTML = html;
        document.body.classList.add('landing');
        console.log('✓ Landing page loaded');

        // Re-run fade-in observer — scripts inside landing.html don't execute via innerHTML
        var fadeObserver = new IntersectionObserver(function(entries) {
          entries.forEach(function(e) {
            if (e.isIntersecting) { e.target.classList.add('visible'); fadeObserver.unobserve(e.target); }
          });
        }, { threshold: 0.12 });
        root.querySelectorAll('.fade-in').forEach(function(el) { fadeObserver.observe(el); });

        // Back-to-top button scroll handler
        var backBtn = document.getElementById('backToTop');
        if (backBtn) {
          window.addEventListener('scroll', function() {
            backBtn.style.display = window.scrollY > 400 ? 'flex' : 'none';
          });
          backBtn.addEventListener('mouseover', function() { this.style.background = 'rgba(124,58,237,.5)'; this.style.transform = 'translateY(-3px)'; });
          backBtn.addEventListener('mouseout',  function() { this.style.background = 'rgba(20,14,40,.9)';  this.style.transform = 'translateY(0)'; });
        }

        // Apply saved language
        applyLandingTranslation(_landingLang);

        // Landing page CTAs call window._googleAuth() via inline onclick — no extra
        // binding needed here. _googleAuth is defined in index.html before this runs.
      })
      .catch(function(err) {
        console.error('✗ Could not load landing.html:', err);
        root.innerHTML =
          '<div style="display:flex;align-items:center;justify-content:center;' +
          'height:100vh;font-family:Nunito,sans-serif;color:#c084fc;font-size:1.1rem">' +
          'StudySphere — ' +
          '<button onclick="window._googleAuth()" ' +
          'style="margin-left:12px;padding:10px 24px;' +
          'background:linear-gradient(90deg,#b87bff,#ef79c4);' +
          'border:none;border-radius:999px;color:#fff;font-weight:800;cursor:pointer">' +
          'Sign in with Google</button></div>';
      });

    return; // ← do NOT load app sections below
  }

  // ── Full app (user is logged-in this session) ─────────────────────────────

  var SECTIONS = [
    'pages/auth.html',
    'pages/signup.html',
    'pages/toast.html',
    'pages/portal.html',
    'pages/modals.html',
    'pages/studip.html',
    'pages/files.html'
  ];

  function loadSequential(index) {
    if (index >= SECTIONS.length) {
      loadAppScript();
      return;
    }
    var filename = SECTIONS[index];
    fetch(filename)
      .then(function(r) {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' loading ' + filename);
        return r.text();
      })
      .then(function(html) {
        var wrapper = document.createElement('div');
        wrapper.setAttribute('data-section', filename.replace('.html', ''));
        wrapper.innerHTML = html;
        while (wrapper.firstChild) {
          root.appendChild(wrapper.firstChild);
        }
        console.log('✓ Section loaded: ' + filename);
        loadSequential(index + 1);
      })
      .catch(function(err) {
        console.error('✗ Error loading ' + filename + ':', err);
        loadSequential(index + 1);
      });
  }

  function loadAppScript() {
    var _v = Date.now();
    // Use fetch+inline injection to avoid ERR_CONNECTION_RESET on dynamic <script src>
    fetch('js/app.js?v=' + _v)
      .then(function(r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(function(code) {
        var script = document.createElement('script');
        script.textContent = code;
        document.body.appendChild(script);
        console.log('✓ app.js loaded');
        // Load ai/ai.js after app.js so it can override AI functions
        var aiScript = document.createElement('script');
        aiScript.src = 'ai/ai.js?v=' + _v;
        aiScript.onload = function() {
          console.log('✓ ai/ai.js loaded');
          window.dispatchEvent(new Event('ss-ready'));
        };
        aiScript.onerror = function() {
          console.error('✗ Failed to load ai/ai.js — falling back to default AI');
          window.dispatchEvent(new Event('ss-ready'));
        };
        document.body.appendChild(aiScript);
      })
      .catch(function(err) {
        console.error('✗ Failed to load app.js:', err);
        window.dispatchEvent(new Event('ss-ready'));
      });
  }

  loadSequential(0);

})();
