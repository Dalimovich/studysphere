// Minallo document side rail + drawer — Task-01 (shell only).
//
// This module wires the right-side rail (3 buttons: AI / Notes / Summary) to
// a slide-in drawer. The drawer is intentionally empty in Task-01 — content
// for each mode is mounted in Task-02. Visibility is controlled by the
// `.is-pdf` / `.is-courses` classes on `#drRoot`, toggled via
// `setRouteVisibility()` (called from navigation/panels).

export type DocRailRoute = 'pdf' | 'courses' | 'other';
export type DocRailMode = 'ai' | 'notes' | 'summary';

interface DocRailWindow extends Window {
  __minalloDocRail?: {
    setRouteVisibility: (route: DocRailRoute) => void;
    open: (mode: DocRailMode) => void;
    close: () => void;
  };
}

const WIDTH_KEY = 'ss_dr_width';
const WIDTH_MIN = 340;
const WIDTH_MAX = 520;
const WIDTH_DEFAULT = 390;

let _initialized = false;
let _openMode: DocRailMode | null = null;
let _drawerWidth = WIDTH_DEFAULT;

function clampWidth(w: number): number {
  if (!Number.isFinite(w)) return WIDTH_DEFAULT;
  return Math.max(WIDTH_MIN, Math.min(WIDTH_MAX, Math.round(w)));
}

function loadWidth(): number {
  try {
    const raw = localStorage.getItem(WIDTH_KEY);
    if (raw == null) return WIDTH_DEFAULT;
    const n = parseFloat(raw);
    return clampWidth(n);
  } catch {
    return WIDTH_DEFAULT;
  }
}

function saveWidth(w: number): void {
  try {
    localStorage.setItem(WIDTH_KEY, String(w));
  } catch {
    /* ignore */
  }
}

const HEADER_COPY: Record<DocRailMode, { title: string; subtitle: string }> = {
  ai: { title: 'AI', subtitle: 'Ask this document' },
  notes: { title: 'Study tools', subtitle: 'Notes, summaries & saved outputs' },
  summary: { title: 'Study tools', subtitle: 'Notes, summaries & saved outputs' },
};

function $<T extends HTMLElement = HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function applyHeader(mode: DocRailMode): void {
  const titleEl = $('drTitle');
  const subEl = $('drSubtitle');
  const copy = HEADER_COPY[mode];
  if (titleEl) titleEl.textContent = copy.title;
  if (subEl) subEl.textContent = copy.subtitle;
}

function updateRailActive(mode: DocRailMode | null): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>('.dr-rail-btn');
  buttons.forEach((b) => {
    const m = b.dataset.drMode as DocRailMode | undefined;
    b.classList.toggle('is-active', !!m && m === mode);
    b.setAttribute('aria-pressed', m === mode ? 'true' : 'false');
  });
}

function applyWidth(drawer: HTMLElement, w: number): void {
  drawer.style.width = w + 'px';
}

function openDrawer(mode: DocRailMode): void {
  const drawer = $('drDrawer');
  if (!drawer) return;
  _openMode = mode;
  applyHeader(mode);
  drawer.hidden = false;
  // Force reflow so the transition runs from the hidden initial state.
  void drawer.offsetWidth;
  drawer.classList.add('is-open');
  applyWidth(drawer, _drawerWidth);
  updateRailActive(mode);
}

function closeDrawer(): void {
  const drawer = $('drDrawer');
  if (!drawer) return;
  _openMode = null;
  drawer.classList.remove('is-open');
  updateRailActive(null);
  // After the transition ends, fully hide so it doesn't intercept anything.
  const onEnd = (): void => {
    if (!drawer.classList.contains('is-open')) drawer.hidden = true;
    drawer.removeEventListener('transitionend', onEnd);
  };
  drawer.addEventListener('transitionend', onEnd);
  // Safety: also hide after a fixed delay in case transitionend doesn't fire.
  window.setTimeout(() => {
    if (!drawer.classList.contains('is-open')) drawer.hidden = true;
  }, 360);
}

function toggleMode(mode: DocRailMode): void {
  if (_openMode === mode) {
    closeDrawer();
  } else {
    openDrawer(mode);
  }
}

function wireResize(): void {
  const drawer = $('drDrawer');
  const handle = $('drResize');
  if (!drawer || !handle) return;

  let dragging = false;
  let startX = 0;
  let startW = 0;

  const onMove = (e: MouseEvent): void => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    // Drawer is anchored to the right; dragging left (negative dx) grows it.
    const next = clampWidth(startW - dx);
    _drawerWidth = next;
    applyWidth(drawer, next);
  };

  const onUp = (): void => {
    if (!dragging) return;
    dragging = false;
    handle.classList.remove('is-active');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
    saveWidth(_drawerWidth);
  };

  handle.addEventListener('mousedown', (e: MouseEvent) => {
    dragging = true;
    startX = e.clientX;
    startW = drawer.offsetWidth || _drawerWidth;
    handle.classList.add('is-active');
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    e.preventDefault();
  });
}

function wireRailButtons(): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>('.dr-rail-btn');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.drMode as DocRailMode | undefined;
      if (!mode) return;
      toggleMode(mode);
    });
  });
}

function wireClose(): void {
  const btn = $('drClose');
  if (btn) btn.addEventListener('click', closeDrawer);
  // Esc closes the drawer when it's open.
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape' && _openMode != null) {
      closeDrawer();
    }
  });
}

function setRouteVisibility(route: DocRailRoute): void {
  const root = $('drRoot');
  if (!root) return;
  root.hidden = false; // root must remain in DOM; CSS handles actual show/hide
  root.classList.toggle('is-pdf', route === 'pdf');
  root.classList.toggle('is-courses', route === 'courses');
  // If we're navigating away from a route that allows the rail, close any
  // open drawer so it doesn't linger off-screen.
  if (route === 'other' && _openMode != null) {
    closeDrawer();
  }
}

export function initDocumentRail(): void {
  if (_initialized) return;
  const root = $('drRoot');
  if (!root) {
    // Markup may not be in the DOM yet (loader fetches sections async).
    // Retry once the loader signals readiness.
    window.addEventListener('ss-ready', () => initDocumentRail(), { once: true });
    return;
  }
  _initialized = true;

  _drawerWidth = loadWidth();
  const drawer = $('drDrawer');
  if (drawer) applyWidth(drawer, _drawerWidth);

  wireRailButtons();
  wireClose();
  wireResize();

  const w: DocRailWindow = window as DocRailWindow;
  w.__minalloDocRail = {
    setRouteVisibility,
    open: openDrawer,
    close: closeDrawer,
  };

  // Hidden by default; navigation/panels will call setRouteVisibility().
  root.classList.remove('is-pdf', 'is-courses');
}
