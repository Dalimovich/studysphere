export function panelShow(el: HTMLElement | null, isFlexEl?: boolean): void {
  if (!el) return;
  el.style.display = isFlexEl ? 'flex' : 'block';
}

export function panelHide(el: HTMLElement | null): void {
  if (!el) return;
  el.style.display = 'none';
}

export function showFilesView(stRunning?: boolean): void {
  const portal = document.getElementById('portal');
  if (portal) {
    portal.classList.add('show');
    portal.style.display = 'block';
    portal.style.opacity = '1';
    portal.style.pointerEvents = 'auto';
  }
  const ms = document.querySelector<HTMLElement>('#portal .main-scroll');
  if (ms) ms.style.display = 'none';
  const app = document.getElementById('app');
  if (app) app.style.display = 'flex';
  const fab = document.getElementById('addWidgetFab');
  if (fab) fab.classList.remove('visible');
  const back = document.getElementById('goPortal');
  if (back) back.style.display = '';
  const title = document.getElementById('topTitle');
  if (title) title.style.display = 'none';
  const crumb = document.getElementById('breadcrumb');
  if (crumb) crumb.style.display = '';
  const stBtn = document.getElementById('studyTechBtn');
  if (stBtn) stBtn.style.display = 'flex';
  const stMini = document.getElementById('stMiniTimer');
  if (stMini) stMini.style.display = stRunning ? 'flex' : 'none';
}

// Single source of truth for which of the three top-level containers is shown.
// `studipDash` (courses listing), `#app` (file view), `#portal .main-scroll`
// (portal sections). Previously, each had its own show/hide function, and
// nothing enforced mutual exclusion — leading to ghost pages when one was
// switched while another was still visible underneath. Calling this guarantees
// the other two are hidden, all `.portal-section` orphans are cleared, and the
// `#portal[data-active-view]` attribute reflects reality for debugging.
export type TopLevelView = 'file' | 'studip' | 'portal';

export function selectTopLevelView(which: TopLevelView, opts?: { stRunning?: boolean }): void {
  const portal = document.getElementById('portal');
  const app = document.getElementById('app');
  const studip = document.getElementById('studipDash');
  const mainScroll = document.querySelector<HTMLElement>('#portal .main-scroll');

  if (portal) {
    portal.classList.add('show');
    portal.style.display = 'block';
    portal.dataset.activeView = which;
  }

  if (which === 'file') {
    if (mainScroll) mainScroll.style.display = 'none';
    if (studip) studip.style.display = 'none';
    if (app) app.style.display = 'flex';
    // Clear any portal-section orphans that may still be display:block under us
    document.querySelectorAll<HTMLElement>('.portal-section').forEach((el) => {
      el.style.display = 'none';
      el.classList.remove('psec-entering', 'psec-leaving');
    });
    _applyFileChrome(opts?.stRunning ?? false);
  } else if (which === 'studip') {
    if (mainScroll) mainScroll.style.display = 'none';
    if (app) app.style.display = 'none';
    if (studip) studip.style.display = '';
    document.querySelectorAll<HTMLElement>('.portal-section').forEach((el) => {
      el.style.display = 'none';
      el.classList.remove('psec-entering', 'psec-leaving');
    });
    _applyPortalChrome();
  } else {
    // 'portal' — show the main-scroll, hide app/studip. Caller is responsible
    // for revealing the specific .portal-section they want.
    if (mainScroll) mainScroll.style.display = '';
    if (app) app.style.display = 'none';
    if (studip) studip.style.display = 'none';
    _applyPortalChrome();
  }
}

function _applyFileChrome(stRunning: boolean): void {
  const fab = document.getElementById('addWidgetFab');
  if (fab) fab.classList.remove('visible');
  const back = document.getElementById('goPortal');
  if (back) back.style.display = '';
  const title = document.getElementById('topTitle');
  if (title) title.style.display = 'none';
  const crumb = document.getElementById('breadcrumb');
  if (crumb) crumb.style.display = '';
  const stBtn = document.getElementById('studyTechBtn');
  if (stBtn) stBtn.style.display = 'flex';
  const stMini = document.getElementById('stMiniTimer');
  if (stMini) stMini.style.display = stRunning ? 'flex' : 'none';
}

function _applyPortalChrome(): void {
  const back = document.getElementById('goPortal');
  if (back) back.style.display = 'none';
  const title = document.getElementById('topTitle');
  if (title) title.style.display = '';
  const crumb = document.getElementById('breadcrumb');
  if (crumb) crumb.style.display = 'none';
  const stBtn = document.getElementById('studyTechBtn');
  if (stBtn) stBtn.style.display = 'none';
  const stMini = document.getElementById('stMiniTimer');
  if (stMini) stMini.style.display = 'none';
}

export function hideFilesView(): void {
  const ms = document.querySelector<HTMLElement>('#portal .main-scroll');
  if (ms) ms.style.display = '';
  const app = document.getElementById('app');
  if (app) app.style.display = 'none';
  const back = document.getElementById('goPortal');
  if (back) back.style.display = 'none';
  const title = document.getElementById('topTitle');
  if (title) title.style.display = '';
  const crumb = document.getElementById('breadcrumb');
  if (crumb) crumb.style.display = 'none';
  const stBtn = document.getElementById('studyTechBtn');
  if (stBtn) stBtn.style.display = 'none';
  const stMini = document.getElementById('stMiniTimer');
  if (stMini) stMini.style.display = 'none';
}
