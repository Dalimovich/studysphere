import { test, expect } from '@playwright/test';
import { AppPage } from './pages/AppPage';

test.describe('PDF Reader', () => {
  async function openAnyPdf(page: any, app: AppPage) {
    await app.goto();
    const firstCourse = page.locator('.course-card').first();
    if (!await firstCourse.isVisible().catch(() => false)) return false;
    await firstCourse.click();
    await expect(page.locator('#courseOverview')).toBeVisible({ timeout: 10000 });
    const firstFile = page.locator('.file-item').first();
    if (!await firstFile.isVisible().catch(() => false)) return false;
    await firstFile.click();
    return await page.locator('#pdfView').isVisible({ timeout: 15000 }).catch(() => false);
  }

  test('PDF viewer renders without JS errors', async ({ page }) => {
    const app = new AppPage(page);
    const errors: string[] = [];
    app.collectErrors(errors);

    const opened = await openAnyPdf(page, app);
    if (!opened) { test.skip(true, 'No PDF available'); return; }

    await expect(page.locator('#pdfBody canvas, #pdfBody iframe')).toBeVisible({ timeout: 20000 });

    const crashes = errors.filter(e =>
      !e.includes('ResizeObserver') &&
      !e.includes('favicon') &&
      !e.includes('Non-Error promise rejection')
    );
    expect(crashes).toHaveLength(0);
  });

  test('page number input is visible and shows page 1', async ({ page }) => {
    const app = new AppPage(page);
    const opened = await openAnyPdf(page, app);
    if (!opened) { test.skip(true, 'No PDF available'); return; }

    await page.waitForFunction(() => window['pdfDoc'] != null, { timeout: 20000 });

    const pageInput = page.locator('#pdfPageInput');
    await expect(pageInput).toBeVisible();
    const val = await pageInput.inputValue();
    expect(parseInt(val)).toBe(1);
  });

  test('breadcrumb shows file name', async ({ page }) => {
    const app = new AppPage(page);
    const opened = await openAnyPdf(page, app);
    if (!opened) { test.skip(true, 'No PDF available'); return; }

    await expect(page.locator('#breadcrumb')).toBeVisible();
    const breadcrumb = await page.locator('#breadcrumb').textContent();
    expect(breadcrumb?.trim().length).toBeGreaterThan(0);
  });

  test('page bookmark is restored after reload', async ({ page, context }) => {
    const app = new AppPage(page);
    const opened = await openAnyPdf(page, app);
    if (!opened) { test.skip(true, 'No PDF available'); return; }

    await page.waitForFunction(() => window['pdfDoc'] != null, { timeout: 20000 });

    const totalStr = await page.locator('#pdfTotal, #pdfPageTotal').textContent().catch(() => '1');
    const total = parseInt(totalStr || '1');
    if (total < 3) { test.skip(true, 'PDF too short to test bookmark'); return; }

    // Navigate to page 3
    const pageInput = page.locator('#pdfPageInput');
    await pageInput.fill('3');
    await pageInput.dispatchEvent('blur');
    await page.waitForTimeout(1000);

    const fileName = await page.locator('#pdfFileName').textContent();

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => window['pdfDoc'] != null, { timeout: 20000 });

    // Should be back to page 3
    await page.waitForTimeout(1500); // bookmark restore timeout
    const restoredVal = await page.locator('#pdfPageInput').inputValue();
    expect(parseInt(restoredVal)).toBe(3);
  });

  test('notes panel closes when navigating back to course', async ({ page }) => {
    const app = new AppPage(page);
    const errors: string[] = [];
    app.collectErrors(errors);

    const opened = await openAnyPdf(page, app);
    if (!opened) { test.skip(true, 'No PDF available'); return; }

    // Open notes panel if chip exists
    const notesChip = page.locator('[data-chip="notes"], button:has-text("Notes")').first();
    const hasChip = await notesChip.isVisible().catch(() => false);
    if (hasChip) {
      await notesChip.click();
      await expect(page.locator('#notesPanel, .notes-panel').first()).toBeVisible({ timeout: 5000 });
    }

    // Navigate back via breadcrumb or back button
    const breadcrumb = page.locator('#breadcrumb');
    await breadcrumb.click();

    await page.waitForTimeout(500);

    // Notes panel should be gone
    const panel = page.locator('#notesPanel, .notes-panel').first();
    const stillVisible = await panel.isVisible().catch(() => false);
    expect(stillVisible).toBe(false);

    const crashes = errors.filter(e => e.includes('Maximum call stack') || e.includes('RangeError'));
    expect(crashes).toHaveLength(0);
  });
});
