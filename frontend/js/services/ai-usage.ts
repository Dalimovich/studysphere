// AI fair-use surface — fetches the current month's call counters and
// renders two things:
//   • a "X / 500 this month" banner that appears once the user crosses 80%
//   • a cap-reached modal triggered when any AI call returns 429 with
//     code 'ai_monthly_cap'
//
// Both pieces are styled with the site's existing glass tokens
// (--on-glass, rgba(255,255,255,0.07) surfaces) so they sit naturally in
// the portal. No new design language introduced.

declare global {
  interface Window {
    _sbToken?: string;
    BACKEND_URL?: string;
    _aiUsage?: AiUsage;
    showAiCapModal?: (detail: AiCapErrorDetail) => void;
    refreshAiUsage?: () => Promise<AiUsage | null>;
  }
}

export interface AiUsage {
  used: number;
  limit: number;
  remaining: number;
  percentUsed: number;
  resetsAt: string;
}

export interface AiCapErrorDetail {
  code: 'ai_monthly_cap';
  message: string;
  used: number;
  limit: number;
  resetsAt: string;
}

const WARN_THRESHOLD = 0.8; // banner appears at 80% of the cap
const BANNER_ID = 'aiUsageBanner';
const MODAL_ID = 'aiCapModal';
const STORAGE_KEY = 'ss_ai_usage_banner_dismissed_month';
const CONTACT_EMAIL = 'mohamedali.mariam@minallo.de';

function _backendUrl(): string {
  return window.BACKEND_URL || '';
}

function _token(): string {
  return window._sbToken || '';
}

function _monthKey(d: Date = new Date()): string {
  return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0');
}

export async function fetchAiUsage(): Promise<AiUsage | null> {
  if (!_token()) return null;
  try {
    const res = await fetch(_backendUrl() + '/api/ai/usage', {
      method: 'GET',
      headers: { Authorization: 'Bearer ' + _token() }
    });
    if (!res.ok) return null;
    const data = (await res.json()) as AiUsage;
    window._aiUsage = data;
    return data;
  } catch {
    return null;
  }
}

function _formatResetDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return iso;
  }
}

/** Render or update the banner. Removes itself if usage drops below the
 *  threshold (e.g. after a month reset while the tab is still open). */
function _renderBanner(usage: AiUsage): void {
  const shouldShow = usage.percentUsed >= WARN_THRESHOLD * 100;
  let banner = document.getElementById(BANNER_ID);

  if (!shouldShow) {
    if (banner) banner.remove();
    return;
  }

  // Suppress for the rest of the month if the user dismissed it.
  const dismissedFor = localStorage.getItem(STORAGE_KEY);
  if (dismissedFor === _monthKey()) return;

  if (!banner) {
    banner = document.createElement('div');
    banner.id = BANNER_ID;
    banner.className = 'ai-usage-banner';
    // Inject near the top of the portal so it sits above the dashboard
    // content but doesn't break flow.
    const portal = document.getElementById('portal') || document.body;
    portal.insertBefore(banner, portal.firstChild);
  }

  const isAtCap = usage.percentUsed >= 100;
  const reset = _formatResetDate(usage.resetsAt);
  const tone = isAtCap ? 'ai-usage-banner--cap' : 'ai-usage-banner--warn';
  banner.className = 'ai-usage-banner ' + tone;
  banner.innerHTML =
    '<div class="ai-usage-banner-icon" aria-hidden="true">' +
    (isAtCap ? '&#x26A0;&#xFE0F;' : '&#x1F4CA;') +
    '</div>' +
    '<div class="ai-usage-banner-body">' +
    '<div class="ai-usage-banner-title">' +
    (isAtCap
      ? "You've reached this month's AI Fair-Use limit"
      : "You're approaching this month's AI Fair-Use limit") +
    '</div>' +
    '<div class="ai-usage-banner-sub">' +
    usage.used +
    ' of ' +
    usage.limit +
    ' AI calls used. Resets on ' +
    reset +
    '.' +
    '</div>' +
    '<div class="ai-usage-banner-meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' +
    usage.percentUsed +
    '">' +
    '<div class="ai-usage-banner-meter-fill" style="width:' +
    Math.min(100, usage.percentUsed) +
    '%"></div>' +
    '</div>' +
    '</div>' +
    '<button class="ai-usage-banner-close" type="button" aria-label="Dismiss">&times;</button>';

  const close = banner.querySelector('.ai-usage-banner-close');
  close?.addEventListener('click', () => {
    localStorage.setItem(STORAGE_KEY, _monthKey());
    banner?.remove();
  });
}

/** Modal shown when any AI call returns 429 with code 'ai_monthly_cap'.
 *  Idempotent — calling repeatedly only renders once. */
function showAiCapModal(detail: AiCapErrorDetail): void {
  let modal = document.getElementById(MODAL_ID);
  if (modal) {
    modal.style.display = 'flex';
    return;
  }
  const reset = _formatResetDate(detail.resetsAt);
  modal = document.createElement('div');
  modal.id = MODAL_ID;
  modal.className = 'ai-cap-modal';
  modal.innerHTML =
    '<div class="ai-cap-modal-backdrop"></div>' +
    '<div class="ai-cap-modal-card" role="dialog" aria-modal="true" aria-labelledby="aiCapModalTitle">' +
    '<div class="ai-cap-modal-icon" aria-hidden="true">&#x26A0;&#xFE0F;</div>' +
    '<h2 id="aiCapModalTitle" class="ai-cap-modal-title">Monthly AI limit reached</h2>' +
    '<p class="ai-cap-modal-text">' +
    "You've used all " +
    detail.limit +
    ' AI calls included in your Pro subscription this month (Fair-Use). ' +
    'Your allowance refreshes on <strong>' +
    reset +
    '</strong>.' +
    '</p>' +
    '<div class="ai-cap-modal-meta">' +
    detail.used +
    ' / ' +
    detail.limit +
    ' used &middot; <a href="/terms.html#leistung" target="_blank" rel="noopener">Fair-Use details</a>' +
    '</div>' +
    '<div class="ai-cap-modal-actions">' +
    '<a class="ai-cap-modal-btn ai-cap-modal-btn-secondary" href="mailto:' +
    CONTACT_EMAIL +
    '?subject=Request%20higher%20AI%20fair-use%20limit">Need more? Contact us</a>' +
    '<button class="ai-cap-modal-btn ai-cap-modal-btn-primary" type="button" id="aiCapModalDismiss">Got it</button>' +
    '</div>' +
    '</div>';
  document.body.appendChild(modal);
  const dismiss = (): void => {
    modal!.style.display = 'none';
  };
  modal.querySelector('#aiCapModalDismiss')?.addEventListener('click', dismiss);
  modal.querySelector('.ai-cap-modal-backdrop')?.addEventListener('click', dismiss);
}

/** Inspect an AI fetch response and surface the cap modal if 429 with the
 *  expected code. Other 429s (per-endpoint rate limits) bubble up as-is. */
export async function detectAiCapError(res: Response): Promise<boolean> {
  if (res.status !== 429) return false;
  try {
    const clone = res.clone();
    const body = (await clone.json()) as { error?: AiCapErrorDetail };
    if (body && body.error && body.error.code === 'ai_monthly_cap') {
      showAiCapModal(body.error);
      // Refresh the counter so the banner updates the moment the user gets
      // the modal — bridges the gap between server count and client state.
      void fetchAiUsage().then((u) => {
        if (u) _renderBanner(u);
      });
      return true;
    }
  } catch {
    /* not JSON / no body — ignore */
  }
  return false;
}

/** Boot: fetch usage once on portal load, render the banner if needed,
 *  and expose the modal helper on `window` so non-TS call sites
 *  (subscription.js, ai.js) can trigger it without an import. */
export function initAiUsage(): void {
  window.showAiCapModal = showAiCapModal;
  window.refreshAiUsage = async (): Promise<AiUsage | null> => {
    const u = await fetchAiUsage();
    if (u) _renderBanner(u);
    return u;
  };
  void window.refreshAiUsage();
}
