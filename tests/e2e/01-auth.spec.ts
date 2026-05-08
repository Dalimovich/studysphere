import { test, expect } from '@playwright/test';
import { AppPage } from './pages/AppPage';

test.describe('Authentication', () => {
  test('login page renders without JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Login form or already-authed home is visible
    const hasLoginForm = await page.locator('input[type="email"]').isVisible().catch(() => false);
    const hasApp = await page.locator('#welcomeState, #courseOverview').isVisible().catch(() => false);
    expect(hasLoginForm || hasApp).toBe(true);

    expect(errors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0);
  });

  test('invalid credentials shows error, not crash', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const hasLoginForm = await page.locator('input[type="email"]').isVisible().catch(() => false);
    if (!hasLoginForm) {
      test.skip();
      return;
    }

    await page.locator('input[type="email"]').fill('bad@example.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.locator('button[id="loginBtn"], button:has-text("Sign in"), button:has-text("Log in")').first().click();

    // Expect an error message to appear without full-page crash
    await page.waitForSelector('.toast, .error-msg, [role="alert"], #authError', { timeout: 10000 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});
