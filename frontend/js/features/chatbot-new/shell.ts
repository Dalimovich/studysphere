// New chatbot shell. Flag-gated behind localStorage.ss_new_chatbot === '1'.
// PR-01: hide #aipOuter, reveal #ncbRoot.
// PR-02: sidebar interactivity (collapse, chat-row selection, new chat, search).

export function initNewChatbotShell(): void {
  let flag: string | null = null;
  try {
    flag = localStorage.getItem('ss_new_chatbot');
  } catch {
    // private browsing / storage disabled — leave flag null
  }
  if (flag !== '1') return;

  const newRoot = document.getElementById('ncbRoot') as HTMLElement | null;
  if (!newRoot) return;

  const oldRoot = document.getElementById('aipOuter') as HTMLElement | null;
  if (oldRoot) oldRoot.style.display = 'none';

  newRoot.hidden = false;
  newRoot.style.display = '';

  initSidebar(newRoot);
}

// PR-02 — sidebar behavior. Idempotent: each binding tags the node with
// data-ncb-bound so we don't double-bind across repeat init calls.

function initSidebar(root: HTMLElement): void {
  const sidebar = root.querySelector<HTMLElement>('.ncb-sidebar');
  if (!sidebar) return;

  bindCollapse(sidebar);
  bindChatItems(sidebar);
  bindNewChat(sidebar);
  bindSearch(sidebar);
}

function bindCollapse(sidebar: HTMLElement): void {
  const btn = sidebar.querySelector<HTMLButtonElement>('.ncb-collapse-btn');
  if (!btn || btn.dataset.ncbBound === '1') return;
  btn.dataset.ncbBound = '1';
  btn.addEventListener('click', () => {
    const collapsed = sidebar.dataset.collapsed === 'true';
    setCollapsed(sidebar, !collapsed);
  });
}

function setCollapsed(sidebar: HTMLElement, collapsed: boolean): void {
  sidebar.dataset.collapsed = collapsed ? 'true' : 'false';
}

function bindChatItems(sidebar: HTMLElement): void {
  const list = sidebar.querySelector<HTMLElement>('.ncb-chat-list');
  if (!list || list.dataset.ncbBound === '1') return;
  list.dataset.ncbBound = '1';

  // Event delegation so newly-prepended "New chat" rows work without rebinding.
  list.addEventListener('click', (ev) => {
    const target = ev.target as HTMLElement | null;
    const item = target ? target.closest<HTMLElement>('.ncb-chat-item') : null;
    if (!item) return;

    // If the sidebar is collapsed, expand it before selecting — matches the
    // brief's rule that collapsed icon clicks reopen + select.
    if (sidebar.dataset.collapsed === 'true') setCollapsed(sidebar, false);

    selectChatItem(list, item);
  });
}

function selectChatItem(list: HTMLElement, item: HTMLElement): void {
  list.querySelectorAll<HTMLElement>('.ncb-chat-item').forEach((el) => {
    el.classList.remove('ncb-chat-item--active');
  });
  item.classList.add('ncb-chat-item--active');
}

function bindNewChat(sidebar: HTMLElement): void {
  const btn = sidebar.querySelector<HTMLButtonElement>('.ncb-new-chat-btn');
  if (!btn || btn.dataset.ncbBound === '1') return;
  btn.dataset.ncbBound = '1';

  btn.addEventListener('click', () => {
    if (sidebar.dataset.collapsed === 'true') setCollapsed(sidebar, false);

    const list = sidebar.querySelector<HTMLElement>('.ncb-chat-list');
    if (!list) return;

    // Skip if a draft "New chat" row already exists, matching the React preview's
    // handleNewChat which de-dupes drafts.
    const existingDraft = list.querySelector<HTMLElement>('.ncb-chat-item[data-ncb-draft="1"]');
    if (existingDraft) {
      selectChatItem(list, existingDraft);
      return;
    }

    const row = buildChatItem('New chat', 'Title generated from full context');
    row.dataset.ncbDraft = '1';

    // Insert directly after the "Recent" label (or at the top if no Recent label).
    const recentLabel = Array.from(
      list.querySelectorAll<HTMLElement>('.ncb-chat-section-label')
    ).find((el) => /recent/i.test(el.textContent || ''));

    if (recentLabel && recentLabel.parentElement === list) {
      recentLabel.insertAdjacentElement('afterend', row);
    } else {
      list.prepend(row);
    }

    selectChatItem(list, row);
  });
}

function buildChatItem(title: string, meta: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'ncb-chat-item';

  // Same MessageSquareText lucide path used in the static sample rows.
  btn.innerHTML = `
    <span class="ncb-chat-icon">
      <svg class="ncb-icon ncb-icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </span>
    <span class="ncb-chat-text">
      <span class="ncb-chat-title"></span>
      <span class="ncb-chat-meta"></span>
    </span>
    <span class="ncb-chat-more" aria-hidden="true">
      <svg class="ncb-icon ncb-icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
      </svg>
    </span>
  `;

  const titleEl = btn.querySelector<HTMLElement>('.ncb-chat-title');
  const metaEl = btn.querySelector<HTMLElement>('.ncb-chat-meta');
  if (titleEl) titleEl.textContent = title;
  if (metaEl) metaEl.textContent = meta;

  return btn;
}

function bindSearch(sidebar: HTMLElement): void {
  const input = sidebar.querySelector<HTMLInputElement>('.ncb-search-input');
  const list = sidebar.querySelector<HTMLElement>('.ncb-chat-list');
  if (!input || !list || input.dataset.ncbBound === '1') return;
  input.dataset.ncbBound = '1';

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    const items = list.querySelectorAll<HTMLElement>('.ncb-chat-item');
    items.forEach((item) => {
      const titleEl = item.querySelector<HTMLElement>('.ncb-chat-title');
      const text = (titleEl?.textContent || '').toLowerCase();
      item.style.display = !q || text.includes(q) ? '' : 'none';
    });

    // Hide section labels whose section has no visible items.
    const labels = list.querySelectorAll<HTMLElement>('.ncb-chat-section-label');
    labels.forEach((label) => {
      let visible = 0;
      let sib = label.nextElementSibling as HTMLElement | null;
      while (sib && !sib.classList.contains('ncb-chat-section-label')) {
        if (sib.classList.contains('ncb-chat-item') && sib.style.display !== 'none') visible++;
        sib = sib.nextElementSibling as HTMLElement | null;
      }
      label.style.display = visible === 0 ? 'none' : '';
    });
  });
}

(window as unknown as { initNewChatbotShell?: () => void }).initNewChatbotShell = initNewChatbotShell;
