import { test, expect } from '@playwright/test';

test('Dashboard loads with expected content and no errors', async ({ page }) => {
  // Listen for page errors before navigation
  let pageErrors: Error[] = [];
  page.on('pageerror', (err) => {
    pageErrors.push(err);
  });

  // Navigate to dashboard
  await page.goto('/#dashboard');

  // Wait for the dashboard heading to appear - this indicates data has loaded
  await expect(page.locator('h2').getByText('Dashboard executivo')).toBeVisible({ timeout: 10000 });

  // Verify some expected KPI labels are present
  await expect(page.getByText('Vendas YTD')).toBeVisible();
  await expect(page.getByText('EBITDA')).toBeVisible();

  // Assert that there were no uncaught page errors
  expect(pageErrors).toHaveLength(0);

  // Optional: take a screenshot for manual inspection
  await page.screenshot({ path: 'tests/screenshots/dashboard.png' });
});
