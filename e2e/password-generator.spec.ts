import { test, expect } from '@playwright/test';

test.describe('Password Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Increase viewport size to avoid "outside of viewport" errors
    await page.setViewportSize({ width: 1280, height: 1000 });
  });

  test('should load with default values', async ({ page }) => {
    await expect(page.locator('.password-generator-title')).toHaveText(/Password Generator/);
    await expect(page.locator('.ammount')).toHaveText(/9/);
    await expect(page.locator('.strength-indicator__level-text')).toHaveText(/MEDIUM/);
  });

  test('should generate a new password when clicking the generate button', async ({ page }) => {
    const passwordInput = page.locator('.password-display');
    const initialPassword = await passwordInput.inputValue();

    await page.click('.generate-button-no-material');

    // Wait for the input value to change from the initial one
    await expect(passwordInput).not.toHaveValue(initialPassword);
    const newPassword = await passwordInput.inputValue();
    expect(newPassword.length).toBe(9);
  });

  test('should update character length when using the slider', async ({ page }) => {
    const sliderTrack = page.locator('.slider-track');
    const amount = page.locator('.ammount');

    await sliderTrack.waitFor({ state: 'visible' });
    const box = await sliderTrack.boundingBox();
    if (box) {
      // Click at the far right of the track to set max length (20)
      await sliderTrack.click({ position: { x: box.width - 2, y: box.height / 2 } });

      // Wait for the UI to update the amount text to 20
      await expect(amount).toHaveText('20');
      
      await page.click('.generate-button-no-material');
      const passwordInput = page.locator('.password-display');
      // The password should now be 20 characters long
      await expect(passwordInput).toHaveValue(/.{20}/);
    }
  });

  test('should respect character criteria', async ({ page }) => {
    // Helper to toggle checkbox via label, which is more reliable for E2E
    const setCriteria = async (id: string, shouldBeChecked: boolean) => {
      const checkbox = page.locator(`#${id}`);
      const label = page.locator(`label[for="${id}"]`);
      
      await label.scrollIntoViewIfNeeded();
      
      const isChecked = await checkbox.isChecked();
      if (isChecked !== shouldBeChecked) {
        await label.click();
      }
      
      await expect(checkbox).toBeChecked({ checked: shouldBeChecked });
    };

    // We want ONLY numbers and symbols
    await setCriteria('crit-numbers', true);
    await setCriteria('crit-symbols', true);
    await setCriteria('crit-uppercase', false);
    await setCriteria('crit-lowercase', false);

    await page.click('.generate-button-no-material');

    const passwordInput = page.locator('.password-display');
    // Wait for the value to become non-empty and NOT just letters
    await expect(passwordInput).not.toHaveValue('');
    await expect(passwordInput).not.toHaveValue(/^[a-zA-Z]+$/);
    const password = await passwordInput.inputValue();

    // Verify requirements
    expect(password).toMatch(/[0-9]/);
    expect(password).toMatch(/[!@#$%^&*()_+[\]{}|;:,.<>?]/);
    expect(password).not.toMatch(/[a-zA-Z]/);
  });

  test('should copy password to clipboard', async ({ page, context, browserName }) => {
    if (browserName === 'chromium') {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    }

    await page.click('.generate-button-no-material');
    const passwordInput = page.locator('.password-display');
    
    // Wait for a non-empty value
    await expect(passwordInput).not.toHaveValue('');
    const password = await passwordInput.inputValue();

    await page.click('.copy-button');
    // Wait for the "COPIED" feedback to appear
    await expect(page.locator('.copy-feedback')).toBeVisible();

    if (browserName === 'chromium') {
      // Small delay to ensure clipboard is updated
      await page.waitForTimeout(200);
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardText).toBe(password);
    } else {
      await expect(page.locator('.copy-feedback')).toContainText('COPIED');
    }
  });
});
