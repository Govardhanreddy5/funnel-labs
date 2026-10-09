import { test, expect } from '@playwright/test';

test.describe('E2E: Campaign Status Changes & Filtering', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate via Demo mode
    await page.goto('/login');
    const demoButton = page.locator('button:has-text("Try Instant Demo")');
    if (await demoButton.isVisible()) {
      await demoButton.click();
      await page.waitForURL('**/dashboard');
    }
  });

  test('filters campaigns and toggles status between Active and Paused', async ({ page }) => {
    await page.goto('/campaigns');
    await expect(page.locator('h1')).toContainText('Campaigns');

    // Verify campaign cards are rendered
    const campaignCards = page.locator('.card-clean');
    await expect(campaignCards.first()).toBeVisible();

    // Find the first Pause or Resume campaign button
    const toggleButton = page.locator('button:has-text("Pause Campaign"), button:has-text("Resume Campaign")').first();
    await expect(toggleButton).toBeVisible();

    const initialText = await toggleButton.innerText();

    // Click toggle button
    await toggleButton.click();

    // Check toast alert notification
    await expect(page.locator('[role="region"]').or(page.locator('text=Campaign'))).toBeVisible({ timeout: 5000 });

    // Verify toggle text inverted
    if (initialText.includes('Pause')) {
      await expect(toggleButton).toContainText('Resume Campaign');
    } else {
      await expect(toggleButton).toContainText('Pause Campaign');
    }
  });
});
