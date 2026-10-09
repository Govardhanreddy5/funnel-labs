import { test, expect } from '@playwright/test';

test.describe('E2E: Authentication Flow & Protected Routes', () => {
  test('redirects unauthenticated users from protected dashboard to /login', async ({ page }) => {
    // Clear any previous session
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());

    // Navigate to protected route
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h2')).toContainText('Sign in to your brand dashboard');
  });

  test('validates form inputs and shows accessible error messages', async ({ page }) => {
    await page.goto('/login');

    // Click submit without filling form
    await page.locator('button[type="submit"]').click();

    // Check inline error feedback
    await expect(page.locator('#signin-email-error')).toBeVisible();
    await expect(page.locator('#signin-email-error')).toContainText('Work email address is required');
  });

  test('allows instant login via Demo Mode and navigates to Dashboard', async ({ page }) => {
    await page.goto('/login');

    // Click demo login button
    const demoButton = page.locator('button:has-text("Try Instant Demo")');
    await expect(demoButton).toBeVisible();
    await demoButton.click();

    // Should successfully land on Dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=Bombay Threads D2C')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Executive Growth Dashboard');
  });
});
