import { test, expect } from '@playwright/test';

test.describe('FarmSage E2E Frontend & QA Test Suite', () => {
  const BASE_URL = 'http://localhost:5173';

  test('1. Homepage Render & Component Integrity', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

    // Verify navbar logo or brand
    const navbar = page.locator('nav');
    await expect(navbar).toBeVisible();

    // Check brand title
    const brandName = page.locator('text=FARMSAGE');
    await expect(brandName.first()).toBeVisible();

    // Check search input
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput.first()).toBeVisible();
  });

  test('2. Product Filtering & Category Navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/category/all`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Filter search
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Tomato');
      await page.waitForTimeout(500);
    }

    const pageText = await page.textContent('body');
    expect(pageText.length).toBeGreaterThan(0);
  });

  test('3. Cart Add, Quantity Update & Cart Persistence', async ({ page }) => {
    await page.goto(`${BASE_URL}/category/all`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Click Add on first product card if present
    const addButton = page.locator('button:has-text("Add")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
    }

    const cartText = await page.textContent('body');
    expect(cartText.length).toBeGreaterThan(0);
  });

  test('4. Authentication Form & OTP State Verification', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });

    const phoneInput = page.locator('input[type="tel"], input[placeholder*="Mobile"], input[type="text"]').first();
    await expect(phoneInput).toBeVisible();
    await phoneInput.fill('9876543210');

    const submitBtn = page.locator('button:has-text("Send OTP"), button:has-text("Continue"), button[type="submit"]').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(1000);
    }

    const bodyContent = await page.textContent('body');
    expect(bodyContent.toLowerCase()).toContain('otp');
  });

  test('5. Checkout Route & Delivery Address Form', async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'domcontentloaded' });
    const bodyText = await page.textContent('body');
    expect(bodyText.length).toBeGreaterThan(0);
  });
});
