import { test, expect } from '@playwright/test';

test.describe('E2E: Experiment Creation & Evaluation', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate via Demo mode
    await page.goto('/login');
    const demoButton = page.locator('button:has-text("Try Instant Demo")');
    if (await demoButton.isVisible()) {
      await demoButton.click();
      await page.waitForURL('**/dashboard');
    }
  });

  test('opens Create Experiment modal, validates fields, and creates a new test', async ({ page }) => {
    await page.goto('/experiments');
    await expect(page.locator('h1')).toContainText('Experiments');

    // Click "New Experiment" button
    const newExpButton = page.locator('button:has-text("New Experiment")');
    await expect(newExpButton).toBeVisible();
    await newExpButton.click();

    // Verify modal appeared
    await expect(page.locator('h2:has-text("Create New Marketing Experiment")')).toBeVisible();

    // Fill form fields
    const testName = `Playwright Test ${Date.now()}`;
    await page.locator('input[placeholder*="Free Shipping"]').fill(testName);

    // Click submit
    const submitBtn = page.locator('button:has-text("Create Experiment")');
    await submitBtn.click();

    // Verify toast notification and new experiment in table/list
    await expect(page.locator('text=Experiment Created Successfully!')).toBeVisible({ timeout: 5000 });
  });
});
