import { test, expect } from '@playwright/test';
import { AppPage } from './pages/AppPage';

test.describe('State persistence', () => {
  test('course overview survives page reload', async ({ page }) => {
    const app = new AppPage(page);
    await app.goto();

    const firstCourse = page.locator('.course-card').first();
    const hasCourses = await firstCourse.isVisible().catch(() => false);
    if (!hasCourses) { test.skip(true, 'No courses'); return; }

    await firstCourse.click();
    await expect(page.locator('#courseOverview')).toBeVisible({ timeout: 10000 });
    const courseName = await page.locator('#breadcrumb b').first().textContent();

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should restore to course view
    await expect(page.locator('#courseOverview')).toBeVisible({ timeout: 10000 });
    const restoredName = await page.locator('#breadcrumb b').first().textContent().catch(() => '');
    expect(restoredName).toBe(courseName);
  });

  test('PDF view survives page reload', async ({ page }) => {
    const app = new AppPage(page);
    await app.goto();

    const firstCourse = page.locator('.course-card').first();
    const hasCourses = await firstCourse.isVisible().catch(() => false);
    if (!hasCourses) { test.skip(true, 'No courses'); return; }

    await firstCourse.click();
    await expect(page.locator('#courseOverview')).toBeVisible({ timeout: 10000 });

    const firstFile = page.locator('.file-item').first();
    if (!await firstFile.isVisible().catch(() => false)) { test.skip(true, 'No files'); return; }
    await firstFile.click();

    await page.waitForFunction(() => window['pdfDoc'] != null, { timeout: 20000 });
    const fileName = await page.locator('#pdfFileName').textContent();

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => window['pdfDoc'] != null, { timeout: 20000 });

    const restoredName = await page.locator('#pdfFileName').textContent();
    expect(restoredName).toBe(fileName);
  });

  test('no 404 or 500 on static assets', async ({ page }) => {
    const failures: string[] = [];
    page.on('response', resp => {
      const url = resp.url();
      const status = resp.status();
      // Ignore external CDN and API calls, only care about same-origin assets
      if (status >= 400 && (url.includes(page.url().split('/').slice(0, 3).join('/')) ||
          url.includes('localhost') || url.includes('netlify.app'))) {
        if (!url.includes('/api/') && !url.includes('functions')) {
          failures.push(`${status} ${url}`);
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(failures).toHaveLength(0);
  });

  test('console has no unhandled errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Filter known benign noise
        if (!text.includes('favicon') && !text.includes('ResizeObserver') && !text.includes('Non-Error promise')) {
          errors.push(text);
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    expect(errors).toHaveLength(0);
  });
});
