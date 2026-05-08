import { test as setup } from '@playwright/test';
import path from 'path';

const AUTH_FILE = path.join(__dirname, '.auth/user.json');

setup('authenticate', async ({ page }) => {
  const email = process.env.E2E_EMAIL || '';
  const password = process.env.E2E_PASSWORD || '';

  if (!email || !password) {
    throw new Error(
      '[auth.setup] E2E_EMAIL and E2E_PASSWORD must be set.\n' +
      'Run: $env:E2E_EMAIL="test.e2e@studysphere.test"; $env:E2E_PASSWORD="test.test.123"; npm run test:e2e'
    );
  }

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Check if already authenticated — app sets ss_logged_in in sessionStorage after auth
  const isLoggedIn = await page.evaluate(() => sessionStorage.getItem('ss_logged_in') === 'true').catch(() => false);

  if (!isLoggedIn) {
    // Not logged in — app shows landing page. Click the Login button to open auth modal.
    const loginBtn = page.locator('[data-i18n="landing_nav_login"], #landingLoginBtn, button:has-text("Login"), button:has-text("Sign in")').first();
    await loginBtn.click({ timeout: 10000 });

    // Auth modal opens — #authEmail is inside #authModal
    await page.waitForSelector('#authEmail', { timeout: 10000 });
    await page.locator('#authEmail').fill(email);
    await page.locator('#authPassword').fill(password);
    await page.locator('#authSubmit').click();

    // Wait for sessionStorage flag set by supabase.js after successful login
    await page.waitForFunction(() => sessionStorage.getItem('ss_logged_in') === 'true', { timeout: 30000 });
  } else {
    console.log('[auth.setup] Already authenticated — saving existing session');
  }

  await page.context().storageState({ path: AUTH_FILE });
  console.log('[auth.setup] Session saved');
});
