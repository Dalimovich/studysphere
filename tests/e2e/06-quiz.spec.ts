import { test, expect } from '@playwright/test';
import { AppPage } from './pages/AppPage';

test.describe('Quiz', () => {
  async function openCourseWithFiles(page: any, app: AppPage): Promise<boolean> {
    await app.goto();
    const firstCourse = page.locator('.course-card').first();
    if (!await firstCourse.isVisible().catch(() => false)) return false;
    await firstCourse.click();
    await expect(page.locator('#courseOverview')).toBeVisible({ timeout: 10000 });
    return true;
  }

  test('quiz tab is accessible', async ({ page }) => {
    const app = new AppPage(page);
    const opened = await openCourseWithFiles(page, app);
    if (!opened) { test.skip(true, 'No courses available'); return; }

    const quizTab = page.locator('[data-course-tab="quiz"]');
    await expect(quizTab).toBeVisible();
    await quizTab.click();

    const quizPanel = page.locator('[data-course-panel="quiz"]');
    await expect(quizPanel).toHaveClass(/active/, { timeout: 3000 });
  });

  test('quiz panel shows generate button or existing quizzes', async ({ page }) => {
    const app = new AppPage(page);
    const opened = await openCourseWithFiles(page, app);
    if (!opened) { test.skip(true, 'No courses available'); return; }

    await page.locator('[data-course-tab="quiz"]').click();
    const panel = page.locator('[data-course-panel="quiz"]');
    await expect(panel).toHaveClass(/active/, { timeout: 3000 });

    // Either a generate button or existing quiz cards
    const hasContent = await Promise.race([
      panel.locator('button:has-text("Generate"), button:has-text("New quiz")').first().isVisible(),
      panel.locator('.quiz-card, .quiz-item, [data-quiz-id]').first().isVisible(),
    ]).catch(() => false);
    expect(hasContent).toBe(true);
  });

  test('quiz generation returns questions without timeout (no 504)', async ({ page }) => {
    test.setTimeout(60000);
    const app = new AppPage(page);
    const failures: string[] = [];
    app.collectNetworkFailures(failures);
    const opened = await openCourseWithFiles(page, app);
    if (!opened) { test.skip(true, 'No courses available'); return; }

    await page.locator('[data-course-tab="quiz"]').click();
    const panel = page.locator('[data-course-panel="quiz"]');
    await expect(panel).toHaveClass(/active/, { timeout: 3000 });

    const genBtn = panel.locator('button:has-text("Generate"), button:has-text("New quiz")').first();
    const hasGen = await genBtn.isVisible().catch(() => false);
    if (!hasGen) { test.skip(true, 'No generate button — quizzes may already exist'); return; }

    await genBtn.click();

    // Wait for spinner to appear then disappear
    await page.waitForFunction(() => {
      const overlay = document.querySelector('.gen-overlay, .generating-overlay, [class*="gen-overlay"]');
      return !overlay;
    }, { timeout: 55000 });

    const timeouts = failures.filter(f => f.startsWith('504'));
    expect(timeouts).toHaveLength(0);

    // Quiz questions should be present
    const questions = panel.locator('.quiz-question, [data-question], .question-card');
    const count = await questions.count();
    expect(count).toBeGreaterThan(0);
  });

  test('quiz answer selection and score popup work', async ({ page }) => {
    test.setTimeout(60000);
    const app = new AppPage(page);
    const opened = await openCourseWithFiles(page, app);
    if (!opened) { test.skip(true, 'No courses available'); return; }

    await page.locator('[data-course-tab="quiz"]').click();
    const panel = page.locator('[data-course-panel="quiz"]');
    await expect(panel).toHaveClass(/active/, { timeout: 3000 });

    // Open an existing quiz or skip
    const quizCard = panel.locator('.quiz-card, [data-quiz-id]').first();
    const hasQuiz = await quizCard.isVisible().catch(() => false);
    if (!hasQuiz) { test.skip(true, 'No quiz available to test interaction'); return; }

    await quizCard.click();

    // Answer all questions
    const questions = panel.locator('.quiz-question, [data-question]');
    const qCount = await questions.count();
    for (let i = 0; i < qCount; i++) {
      const opts = questions.nth(i).locator('button, input[type="radio"]');
      const optCount = await opts.count();
      if (optCount > 0) await opts.first().click();
    }

    // Submit
    const submitBtn = panel.locator('button:has-text("Submit"), button:has-text("Check"), button[id*="submit"]').first();
    if (await submitBtn.isVisible()) await submitBtn.click();

    // Score popup / result should appear
    await page.waitForSelector('.score-popup, .quiz-result, [class*="score"]', { timeout: 10000 });
  });
});
