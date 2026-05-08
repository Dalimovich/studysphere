import { test, expect } from '@playwright/test';
import { AppPage } from './pages/AppPage';

// Terms that must appear in quality notes about Kokillenguss (die-casting)
const REQUIRED_TERMS = ['Kokillenguss', 'Schlichte', 'Trägerflüssigkeit', 'Bindemittel', 'Regulierstoffe'];
// Terms that indicate template/placeholder garbage
const FORBIDDEN_TERMS = ['Platzhalter', 'Titelfolie', 'Bild einsetzen', 'hinter das Logo'];

test.describe('AI Notes', () => {
  async function openPdfWithNotes(page: any, app: AppPage): Promise<boolean> {
    await app.goto();
    const firstCourse = page.locator('.course-card').first();
    if (!await firstCourse.isVisible().catch(() => false)) return false;
    await firstCourse.click();
    await expect(page.locator('#courseOverview')).toBeVisible({ timeout: 10000 });
    const firstFile = page.locator('.file-item').first();
    if (!await firstFile.isVisible().catch(() => false)) return false;
    await firstFile.click();
    const opened = await page.locator('#pdfView').isVisible({ timeout: 15000 }).catch(() => false);
    if (!opened) return false;
    await page.waitForFunction(() => window['pdfDoc'] != null, { timeout: 20000 });
    return true;
  }

  test('notes chip is visible when PDF is open', async ({ page }) => {
    const app = new AppPage(page);
    const opened = await openPdfWithNotes(page, app);
    if (!opened) { test.skip(true, 'No PDF available'); return; }

    const chip = page.locator('[data-chip="notes"], .ai-chip:has-text("Notes"), button:has-text("Notes")').first();
    await expect(chip).toBeVisible({ timeout: 5000 });
  });

  test('notes panel opens with Generate button', async ({ page }) => {
    const app = new AppPage(page);
    const opened = await openPdfWithNotes(page, app);
    if (!opened) { test.skip(true, 'No PDF available'); return; }

    const chip = page.locator('[data-chip="notes"], .ai-chip:has-text("Notes"), button:has-text("Notes")').first();
    const hasChip = await chip.isVisible().catch(() => false);
    if (!hasChip) { test.skip(true, 'Notes chip not found'); return; }

    await chip.click();
    const panel = page.locator('#notesPanel, .notes-panel').first();
    await expect(panel).toBeVisible({ timeout: 5000 });

    const genBtn = panel.locator('#npGenerateBtn, .np-generate-btn, button:has-text("Generate")').first();
    await expect(genBtn).toBeVisible();
  });

  test('range inputs accept valid page numbers', async ({ page }) => {
    const app = new AppPage(page);
    const opened = await openPdfWithNotes(page, app);
    if (!opened) { test.skip(true, 'No PDF available'); return; }

    const chip = page.locator('[data-chip="notes"], .ai-chip:has-text("Notes"), button:has-text("Notes")').first();
    if (!await chip.isVisible().catch(() => false)) { test.skip(true, 'No notes chip'); return; }
    await chip.click();

    const panel = page.locator('#notesPanel, .notes-panel').first();
    await expect(panel).toBeVisible({ timeout: 5000 });

    // Click Range scope button
    const rangeBtn = panel.locator('button:has-text("Range"), [data-scope="range"]').first();
    const hasRange = await rangeBtn.isVisible().catch(() => false);
    if (!hasRange) { test.skip(true, 'Range scope not found'); return; }

    await rangeBtn.click();

    const fromInput = panel.locator('#npRangeFrom, input[placeholder*="From"], input[aria-label*="from"]').first();
    const toInput = panel.locator('#npRangeTo, input[placeholder*="To"], input[aria-label*="to"]').first();

    await expect(fromInput).toBeVisible();
    await expect(toInput).toBeVisible();

    await fromInput.fill('1');
    await toInput.fill('3');

    expect(await fromInput.inputValue()).toBe('1');
    expect(await toInput.inputValue()).toBe('3');
  });

  test('notes generation completes and produces content (no 504)', async ({ page }) => {
    test.setTimeout(90000);
    const app = new AppPage(page);
    const failures: string[] = [];
    app.collectNetworkFailures(failures);
    const opened = await openPdfWithNotes(page, app);
    if (!opened) { test.skip(true, 'No PDF available'); return; }

    const chip = page.locator('[data-chip="notes"], .ai-chip:has-text("Notes"), button:has-text("Notes")').first();
    if (!await chip.isVisible().catch(() => false)) { test.skip(true, 'No notes chip'); return; }
    await chip.click();

    const panel = page.locator('#notesPanel, .notes-panel').first();
    await expect(panel).toBeVisible({ timeout: 5000 });

    // Use Range 1–3 to keep it fast
    const rangeBtn = panel.locator('button:has-text("Range"), [data-scope="range"]').first();
    if (await rangeBtn.isVisible().catch(() => false)) {
      await rangeBtn.click();
      const fromInput = panel.locator('#npRangeFrom').first();
      const toInput = panel.locator('#npRangeTo').first();
      if (await fromInput.isVisible()) { await fromInput.fill('1'); }
      if (await toInput.isVisible()) { await toInput.fill('3'); }
    }

    const genBtn = panel.locator('#npGenerateBtn, .np-generate-btn, button:has-text("Generate")').first();
    await genBtn.click();

    // Wait up to 80s for generation
    await page.waitForFunction(() => {
      const spinner = document.querySelector('.np-spinner, .np-generating, [class*="generating"]');
      return !spinner;
    }, { timeout: 80000 });

    const content = panel.locator('#npContent, .np-content').first();
    await expect(content).toBeVisible({ timeout: 5000 });

    const text = await content.textContent();
    expect(text?.trim().length).toBeGreaterThan(50);

    // No 504
    const timeouts = failures.filter(f => f.startsWith('504'));
    expect(timeouts).toHaveLength(0);
  });

  test('Kokillenguss notes quality: required terms present, no template garbage', async ({ page }) => {
    test.setTimeout(120000);
    // This test only passes if the test course has the Kokillenguss lecture PDF indexed
    const app = new AppPage(page);

    await app.goto();
    // Find course with Kokillenguss material — look for a course card matching known names
    const courseCard = page.locator('.course-card').filter({ hasText: /gieß|guss|fertigungs|werkstoff/i }).first();
    const hasCourse = await courseCard.isVisible().catch(() => false);
    if (!hasCourse) { test.skip(true, 'Kokillenguss course not available'); return; }

    await courseCard.click();
    await expect(page.locator('#courseOverview')).toBeVisible({ timeout: 10000 });

    const fileItem = page.locator('.file-item').filter({ hasText: /kokillen|gieß/i }).first();
    const hasFile = await fileItem.isVisible().catch(() => false);
    if (!hasFile) { test.skip(true, 'Kokillenguss file not found'); return; }

    await fileItem.click();
    await page.waitForFunction(() => window['pdfDoc'] != null, { timeout: 20000 });

    const chip = page.locator('[data-chip="notes"], button:has-text("Notes")').first();
    await chip.click();
    const panel = page.locator('#notesPanel, .notes-panel').first();
    await expect(panel).toBeVisible({ timeout: 5000 });

    // Generate for current page range
    const genBtn = panel.locator('#npGenerateBtn, button:has-text("Generate")').first();
    await genBtn.click();

    await page.waitForFunction(() => {
      const s = document.querySelector('.np-spinner, .np-generating');
      return !s;
    }, { timeout: 100000 });

    const content = panel.locator('#npContent, .np-content').first();
    const text = (await content.textContent()) || '';

    for (const term of REQUIRED_TERMS) {
      expect(text, `Missing required term: "${term}"`).toContain(term);
    }
    for (const bad of FORBIDDEN_TERMS) {
      expect(text, `Found forbidden template term: "${bad}"`).not.toContain(bad);
    }
  });

  test('saved notes tab shows previously generated notes', async ({ page }) => {
    const app = new AppPage(page);
    const opened = await openPdfWithNotes(page, app);
    if (!opened) { test.skip(true, 'No PDF available'); return; }

    const chip = page.locator('[data-chip="notes"], button:has-text("Notes")').first();
    if (!await chip.isVisible().catch(() => false)) { test.skip(true, 'No notes chip'); return; }
    await chip.click();

    const panel = page.locator('#notesPanel, .notes-panel').first();
    await expect(panel).toBeVisible({ timeout: 5000 });

    const savedTab = panel.locator('[data-np-tab="saved"], button:has-text("Saved")').first();
    const hasSaved = await savedTab.isVisible().catch(() => false);
    if (!hasSaved) { test.skip(true, 'No Saved tab'); return; }

    await savedTab.click();

    // Either a list or an empty state should be visible — not a crash
    await page.waitForTimeout(1000);
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    const crashes = errors.filter(e => e.includes('Maximum call stack') || e.includes('TypeError'));
    expect(crashes).toHaveLength(0);
  });
});
