import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.resolve(__dirname, '../portfolio-screenshots');

// Credentials from .env
const EMAIL = process.env.TEST_USER_EMAIL || 'YOUR_EMAIL@example.com';
const PASSWORD = process.env.TEST_USER_PASSWORD || 'YOUR_PASSWORD';

test.describe('Portfolio Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login and authenticate
    await page.goto('/login');
    await expect(page).toHaveURL(/.*login/);

    // Input credentials
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);

    // Submit login form
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await expect(page).not.toHaveURL(/.*login/);
    await page.waitForLoadState('networkidle');
  });

  test('Matchmaker screenshot (Desktop 1920x1080)', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Navigate to matchmaker
    await page.goto('/matchmaker');

    // Wait for Synergy scores to calculate
    await page.waitForTimeout(2000);

    // Take screenshot
    const screenshotPath = path.join(SCREENSHOTS_DIR, 'matchmaker.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });

    console.log(`✓ Matchmaker screenshot saved to: ${screenshotPath}`);
  });

  test('Oracle screenshot (Desktop 1920x1080)', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Navigate to discover
    await page.goto('/discover');

    // Type query into Oracle input
    const oracleInput = page.locator('input[placeholder*="Oracle"], input[type="text"], textarea').first();
    await oracleInput.fill('A dark sci-fi for a rainy night');

    // Wait for recommendations to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Take screenshot
    const screenshotPath = path.join(SCREENSHOTS_DIR, 'oracle.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });

    console.log(`✓ Oracle screenshot saved to: ${screenshotPath}`);
  });

  test('Stats screenshot (Desktop 1920x1080)', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Navigate to profile
    await page.goto('/profile');

    // Wait for Recharts animations to complete
    await page.waitForTimeout(2000);

    // Take screenshot
    const screenshotPath = path.join(SCREENSHOTS_DIR, 'stats.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });

    console.log(`✓ Stats screenshot saved to: ${screenshotPath}`);
  });

  test('Library screenshot (Mobile 390x844)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });

    // Navigate to library
    await page.goto('/library');

    // Wait for content to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Take screenshot
    const screenshotPath = path.join(SCREENSHOTS_DIR, 'library-mobile.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });

    console.log(`✓ Library mobile screenshot saved to: ${screenshotPath}`);
  });
});
