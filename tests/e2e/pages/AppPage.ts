import { Page, Locator, expect } from '@playwright/test';

export class AppPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  get emailInput() { return this.page.locator('input[type="email"]'); }
  get passwordInput() { return this.page.locator('input[type="password"]'); }
  get loginBtn() { return this.page.locator('button[id="loginBtn"], button:has-text("Sign in"), button:has-text("Log in")').first(); }
  get logoutBtn() { return this.page.locator('button:has-text("Sign out"), button:has-text("Log out"), [id="logoutBtn"]').first(); }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginBtn.click();
    await this.page.waitForSelector('#welcomeState, #courseOverview, .course-card', { timeout: 15000 });
  }

  // ── Courses ───────────────────────────────────────────────────────────────
  get addCourseBtn() { return this.page.locator('[id="addCourseBtn"], button:has-text("Add course"), button:has-text("New course")').first(); }
  get courseNameInput() { return this.page.locator('input[placeholder*="course"], input[id*="courseName"]').first(); }
  get saveCourseBtn() { return this.page.locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]').first(); }

  async createCourse(name: string) {
    await this.addCourseBtn.click();
    await this.courseNameInput.fill(name);
    await this.saveCourseBtn.click();
    await this.page.waitForSelector(`.course-card:has-text("${name}")`, { timeout: 10000 });
  }

  async openCourse(name: string) {
    await this.page.locator(`.course-card:has-text("${name}"), [data-course-name="${name}"]`).first().click();
    await this.page.waitForSelector('#courseOverview', { state: 'visible', timeout: 10000 });
  }

  // ── PDF upload ────────────────────────────────────────────────────────────
  get uploadInput() { return this.page.locator('input[type="file"]'); }

  async uploadPdf(filePath: string) {
    await this.uploadInput.setInputFiles(filePath);
    // Wait for upload completion — either spinner gone or file appears in list
    await this.page.waitForFunction(() => {
      const spinner = document.querySelector('.upload-spinner, .uploading');
      return !spinner;
    }, { timeout: 30000 });
  }

  // ── PDF reader ────────────────────────────────────────────────────────────
  get pdfView() { return this.page.locator('#pdfView'); }
  get pdfFileName() { return this.page.locator('#pdfFileName'); }
  get pdfPageInput() { return this.page.locator('#pdfPageInput'); }
  get pdfNextBtn() { return this.page.locator('#pdfNext, button[aria-label*="next"], button:has-text("›")').first(); }
  get pdfPrevBtn() { return this.page.locator('#pdfPrev, button[aria-label*="prev"], button:has-text("‹")').first(); }

  async openFile(fileName: string) {
    await this.page.locator(`.file-item:has-text("${fileName}"), [data-file-name="${fileName}"]`).first().click();
    await expect(this.pdfView).toBeVisible({ timeout: 15000 });
    await this.page.waitForFunction(() => window['pdfDoc'] != null, { timeout: 20000 });
  }

  // ── AI chips / notes ──────────────────────────────────────────────────────
  get notesChip() { return this.page.locator('[data-chip="notes"], button:has-text("Notes")').first(); }
  get notesPanel() { return this.page.locator('#notesPanel, .notes-panel').first(); }
  get generateBtn() { return this.page.locator('#npGenerateBtn, .np-generate-btn, button:has-text("Generate")').first(); }
  get notesContent() { return this.page.locator('#npContent, .np-content').first(); }

  async openNotesPanel() {
    await this.notesChip.click();
    await expect(this.notesPanel).toBeVisible({ timeout: 5000 });
  }

  async generateNotes() {
    await this.generateBtn.click();
    // Wait for generation to finish (spinner gone + content visible)
    await this.page.waitForFunction(() => {
      const spinner = document.querySelector('.np-spinner, .np-generating');
      return !spinner;
    }, { timeout: 60000 });
    await expect(this.notesContent).toBeVisible({ timeout: 5000 });
  }

  // ── Quiz / Flashcards ─────────────────────────────────────────────────────
  get quizTab() { return this.page.locator('[data-course-tab="quiz"]'); }
  get flashcardsTab() { return this.page.locator('[data-course-tab="flashcards"]'); }
  get quizPanel() { return this.page.locator('[data-course-panel="quiz"]'); }
  get flashcardsPanel() { return this.page.locator('[data-course-panel="flashcards"]'); }

  async openQuizTab() {
    await this.quizTab.click();
    await expect(this.quizPanel).toHaveClass(/active/, { timeout: 5000 });
  }

  async openFlashcardsTab() {
    await this.flashcardsTab.click();
    await expect(this.flashcardsPanel).toHaveClass(/active/, { timeout: 5000 });
  }

  // ── Console errors ────────────────────────────────────────────────────────
  collectErrors(errors: string[]) {
    this.page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    this.page.on('pageerror', err => errors.push(err.message));
  }

  collectNetworkFailures(failures: string[]) {
    this.page.on('response', resp => {
      if (resp.status() >= 400) failures.push(`${resp.status()} ${resp.url()}`);
    });
  }
}
