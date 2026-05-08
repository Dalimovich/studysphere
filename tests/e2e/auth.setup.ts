import { test as setup, expect } from '@playwright/test';
import path from 'path';

const AUTH_FILE = path.join(__dirname, '.auth/user.json');

setup('authenticate', async ({ page }) => {
  const email = process.env.E2E_EMAIL || 'test.student@studysphere.test';
  const password = process.env.E2E_PASSWORD || '';

  if (!password) {
    console.warn('[auth.setup] E2E_PASSWORD not set — skipping real auth, writing empty state');
    await page.context().storageState({ path: AUTH_FILE });
    return;
  }

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Fill login form
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[id="loginBtn"], button:has-text("Sign in"), button:has-text("Log in")').first().click();

  // Wait for authenticated state
  await page.waitForSelector('#welcomeState, #courseOverview, .course-card', { timeout: 15000 });

  await page.context().storageState({ path: AUTH_FILE });
});
