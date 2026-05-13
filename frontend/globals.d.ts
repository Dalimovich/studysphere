// Ambient declarations for the `window`-scoped globals the legacy bootstrap
// (auth-bootstrap.js, supabase.js, loader.js, app.js) still installs. Each
// migration commit will replace these as the corresponding module is
// rewritten and stops touching window.

declare global {
  interface Window {
    // Config (set by frontend/js/config.js).
    _GCID?: string;
    _SUPA?: string;
    _SAKEY?: string;
    AI_SERVICE_URL?: string;
    BACKEND_URL?: string;
    MinalloConfig?: Record<string, unknown>;
    PDF_DATA?: Record<string, string>;

    // Session.
    _currentUser?: { id?: string; sub?: string; email?: string };
    _sbToken?: string;
    _lang?: string;

    // i18n helper.
    _t?: (key: string) => string;

    // Toasts + auth flow.
    showToast?: (title: string, sub?: string) => void;
    _onLoginSuccess?: () => void;

    // Misc DB shim exposed by db-helpers.
    _ssDb?: {
      supaHeaders: () => Record<string, string>;
      supaUrl: () => string;
      userId: () => string | null;
    };

    // pdf.js
    pdfjsLib?: {
      GlobalWorkerOptions: { workerSrc: string };
    } & Record<string, unknown>;
  }
}

export {};
