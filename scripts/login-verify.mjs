/**
 * One-off login verification — not part of CI. Run from project root:
 *   node scripts/login-verify.mjs [baseUrl]
 */
import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = process.argv[2] || process.env.PLAYWRIGHT_BASE_URL || 'https://filmgraph.app';
const EMAIL = process.env.TEST_USER_EMAIL;
const PASSWORD = process.env.TEST_USER_PASSWORD;
const OUT_DIR = path.resolve(__dirname, '../test-results/login-verify');

async function main() {
  if (!EMAIL || !PASSWORD) {
    console.error('FAIL: Missing TEST_USER_EMAIL or TEST_USER_PASSWORD in .env');
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const consoleErrors = [];
  const networkErrors = [];
  const authResponses = [];

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  page.on('response', (res) => {
    const url = res.url();
    if (url.includes('supabase.co/auth') || url.includes('/auth/v1/')) {
      authResponses.push({ url, status: res.status() });
    }
    if (res.status() >= 400 && (url.includes('supabase') || url.includes('/auth'))) {
      networkErrors.push({ url, status: res.status() });
    }
  });

  const result = {
    baseUrl: BASE_URL,
    loginSuccess: false,
    profileLoaded: false,
    libraryLoaded: false,
    finalUrl: null,
    consoleErrors: [],
    networkErrors: [],
    authResponses: [],
    screenshots: [],
    error: null,
  };

  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.screenshot({ path: path.join(OUT_DIR, '01-login-page.png') });
    result.screenshots.push('01-login-page.png');

    await page.locator('#email, input[type="email"]').first().fill(EMAIL);
    await page.locator('#password, input[type="password"]').first().fill(PASSWORD);
    await page.locator('button[type="submit"], .login-button').first().click();

    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20000 }).catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    result.finalUrl = page.url();
    result.loginSuccess = !page.url().includes('/login');
    await page.screenshot({ path: path.join(OUT_DIR, '02-after-login.png') });
    result.screenshots.push('02-after-login.png');

    if (result.loginSuccess) {
      await page.goto(`${BASE_URL}/profile`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      const navVisible = await page.getByRole('navigation').isVisible().catch(() => false);
      result.profileLoaded = navVisible || !page.url().includes('/login');
      await page.screenshot({ path: path.join(OUT_DIR, '03-profile.png') });
      result.screenshots.push('03-profile.png');

      await page.goto(`${BASE_URL}/library`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      result.libraryLoaded = !page.url().includes('/login');
      await page.screenshot({ path: path.join(OUT_DIR, '04-library.png') });
      result.screenshots.push('04-library.png');
    }
  } catch (err) {
    result.error = err.message;
    await page.screenshot({ path: path.join(OUT_DIR, '99-error.png') }).catch(() => {});
    result.screenshots.push('99-error.png');
  } finally {
    result.consoleErrors = [...new Set(consoleErrors)].slice(0, 10);
    result.networkErrors = networkErrors.slice(0, 10);
    result.authResponses = authResponses;
    await browser.close();
  }

  const reportPath = path.join(OUT_DIR, 'report.json');
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));

  console.log(JSON.stringify(result, null, 2));
  process.exit(result.loginSuccess ? 0 : 1);
}

main();
