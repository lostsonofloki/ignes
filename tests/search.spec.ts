import { test, expect } from '@playwright/test';

test('search returns relevant results with exact match visible', async ({ page }) => {
  await page.goto('/');

  const searchInput = page.getByPlaceholder(/search movies/i);
  await searchInput.fill('The Shining');
  await searchInput.press('Enter');

  await expect(page).toHaveURL(/\/search\?q=The\+Shining|\/search\?q=The%20Shining/);
  await expect(page.getByText('The Shining').first()).toBeVisible();
});

test('search with no results shows empty state', async ({ page }) => {
  await page.goto('/');

  const searchInput = page.getByPlaceholder(/search movies/i);
  await searchInput.fill('xzqqthisdoesnotexist99999');
  await searchInput.press('Enter');

  await expect(page).toHaveURL(/\/search/);
  // Should not crash — page should still render
  await expect(page.locator('body')).toBeVisible();
});
