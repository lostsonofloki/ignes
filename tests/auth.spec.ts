import { test, expect } from '@playwright/test';

const EMAIL = process.env.TEST_USER_EMAIL || process.env.TEST_EMAIL;
const PASSWORD = process.env.TEST_USER_PASSWORD || process.env.TEST_PASSWORD;

test.beforeEach(() => {
  if (!EMAIL || !PASSWORD) {
    throw new Error(
      'Set TEST_USER_EMAIL and TEST_USER_PASSWORD (or TEST_EMAIL / TEST_PASSWORD) in .env',
    );
  }
});

test('login redirects to profile and shows username', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel(/^email$/i).fill(EMAIL);
  await page.getByLabel(/^password$/i).fill(PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page).toHaveURL(/\/profile/);
  await expect(page.getByRole('navigation')).toBeVisible();
});

test('logout returns to login page', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/^email$/i).fill(EMAIL);
  await page.getByLabel(/^password$/i).fill(PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/profile/);

  await page.getByRole('banner').getByRole('button', { name: /logout/i }).click();
  await expect(page).toHaveURL(/\/login|^\//);
});
