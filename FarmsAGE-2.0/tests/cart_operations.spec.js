import { test, expect } from '@playwright/test';

test.describe('Cart Operations Full Functionality Test Suite', () => {
  const BASE_URL = 'http://localhost:5173';

  test('Cart Add, Increment (+), Decrement (-), and Delete Trash Button', async ({ page }) => {
    // 1. Navigate to All Products
    await page.goto(`${BASE_URL}/category/all`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // 2. Add product to cart
    const addBtn = page.locator('button:has-text("ADD")').first();
    await expect(addBtn).toBeVisible();
    await addBtn.click();
    await page.waitForTimeout(500);

    // 3. Navigate to Cart page
    await page.goto(`${BASE_URL}/cart`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Check item is present in cart
    const initialQty = page.locator('span.font-bold.text-sm.min-w-\\[20px\\]');
    await expect(initialQty).toHaveText('1');

    // 4. Click Plus (+) button to increment quantity to 2
    const plusBtn = page.locator('button:has([data-lucide="plus"]), button:has(svg.lucide-plus)');
    await plusBtn.first().click();
    await page.waitForTimeout(300);
    await expect(initialQty).toHaveText('2');

    // 5. Click Minus (-) button to decrement quantity back to 1
    const minusBtn = page.locator('button:has([data-lucide="minus"]), button:has(svg.lucide-minus)');
    await minusBtn.first().click();
    await page.waitForTimeout(300);
    await expect(initialQty).toHaveText('1');

    // 6. Click Trash button to delete item from cart
    const trashBtn = page.locator('button:has([data-lucide="trash-2"]), button:has(svg.lucide-trash-2)');
    await trashBtn.first().click();
    await page.waitForTimeout(500);

    // 7. Verify cart is lonely / empty state message
    const emptyHeading = page.locator('text=Your cart is lonely!');
    await expect(emptyHeading).toBeVisible();
  });
});
