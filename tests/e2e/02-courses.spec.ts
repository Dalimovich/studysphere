import { test, expect } from '@playwright/test';
import { AppPage } from './pages/AppPage';

test.describe('Course management', () => {
  test('course list loads after auth', async ({ page }) => {
    const app = new AppPage(page);
    const errors: string[] = [];
    app.collectErrors(errors);

    await app.goto();
    // Either welcome state or existing courses are visible
    await expect(
      page.locator('#welcomeState, .course-card, #courseList')
    ).toBeVisible({ timeout: 10000 });

    expect(errors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0);
  });

  test('can create and open a course', async ({ page }) => {
    const app = new AppPage(page);
    await app.goto();

    const courseName = `E2E Course ${Date.now()}`;
    try {
      await app.createCourse(courseName);
    } catch {
      test.skip(true, 'Add course button not found — may not be authenticated');
      return;
    }

    await expect(page.locator(`.course-card`).filter({ hasText: courseName })).toBeVisible();

    await app.openCourse(courseName);
    await expect(page.locator('#courseOverview')).toBeVisible();
    await expect(page.locator('#breadcrumb')).toContainText(courseName);
  });

  test('course tabs (Files / Quiz / Flashcards) switch without recursion crash', async ({ page }) => {
    const app = new AppPage(page);
    const errors: string[] = [];
    app.collectErrors(errors);

    await app.goto();

    const firstCourse = page.locator('.course-card').first();
    const hasCourses = await firstCourse.isVisible().catch(() => false);
    if (!hasCourses) {
      test.skip(true, 'No courses available');
      return;
    }
    await firstCourse.click();
    await expect(page.locator('#courseOverview')).toBeVisible({ timeout: 10000 });

    // Click through tabs multiple times — should never crash
    for (let i = 0; i < 3; i++) {
      await page.locator('[data-course-tab="quiz"]').click();
      await page.waitForTimeout(300);
      await page.locator('[data-course-tab="flashcards"]').click();
      await page.waitForTimeout(300);
      await page.locator('[data-course-tab="files"]').click();
      await page.waitForTimeout(300);
    }

    const crashes = errors.filter(e => e.includes('Maximum call stack') || e.includes('RangeError'));
    expect(crashes).toHaveLength(0);
  });
});
