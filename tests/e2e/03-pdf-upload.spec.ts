import { test, expect } from '@playwright/test';
import { AppPage } from './pages/AppPage';
import path from 'path';
import fs from 'fs';

// Minimal valid 1-page PDF (base64-encoded)
const MINIMAL_PDF_B64 =
  'JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2Jq' +
  'CjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2Jq' +
  'CjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA2MTIg' +
  'NzkyXSA+PgplbmRvYmoKeHJlZgowIDQKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAw' +
  'MDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAp0cmFpbGVyCjw8' +
  'IC9TaXplIDQgL1Jvb3QgMSAwIFIgPj4Kc3RhcnR4cmVmCjE5MAolJUVPRgo=';

function writeTempPdf(dir: string): string {
  const filePath = path.join(dir, 'test-upload.pdf');
  fs.writeFileSync(filePath, Buffer.from(MINIMAL_PDF_B64, 'base64'));
  return filePath;
}

test.describe('PDF Upload', () => {
  let tempDir: string;
  let pdfPath: string;

  test.beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'ss-e2e-'));
    pdfPath = writeTempPdf(tempDir);
  });

  test.afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('upload input is present in a course', async ({ page }) => {
    const app = new AppPage(page);
    await app.goto();

    const firstCourse = page.locator('.course-card').first();
    const hasCourses = await firstCourse.isVisible().catch(() => false);
    if (!hasCourses) {
      test.skip(true, 'No courses available');
      return;
    }
    await firstCourse.click();
    await expect(page.locator('#courseOverview')).toBeVisible({ timeout: 10000 });

    const uploadInput = page.locator('input[type="file"]');
    await expect(uploadInput).toBeAttached();
  });

  test('uploading a PDF adds it to the file list', async ({ page }) => {
    const app = new AppPage(page);
    const failures: string[] = [];
    app.collectNetworkFailures(failures);
    await app.goto();

    const firstCourse = page.locator('.course-card').first();
    const hasCourses = await firstCourse.isVisible().catch(() => false);
    if (!hasCourses) {
      test.skip(true, 'No courses available');
      return;
    }
    await firstCourse.click();
    await expect(page.locator('#courseOverview')).toBeVisible({ timeout: 10000 });

    const uploadInput = page.locator('input[type="file"]');
    await uploadInput.setInputFiles(pdfPath);

    // Wait up to 30s for file to appear in list or a toast
    await Promise.race([
      page.waitForSelector('.file-item:has-text("test-upload.pdf")', { timeout: 30000 }),
      page.waitForSelector('.toast', { timeout: 30000 }),
    ]);

    // If a toast appeared check it's not an error
    const toast = page.locator('.toast');
    if (await toast.isVisible()) {
      const toastText = await toast.textContent();
      expect(toastText?.toLowerCase()).not.toContain('failed');
      expect(toastText?.toLowerCase()).not.toContain('error');
    }

    const serverErrors = failures.filter(f => f.startsWith('5') || f.includes('/api/'));
    expect(serverErrors).toHaveLength(0);
  });
});
