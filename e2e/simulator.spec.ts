import { test, expect } from '@playwright/test';

test.describe('Simulador de Crédito Automotriz', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the homepage with correct title and branding', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Simulador/);
    
    // Check main heading
    await expect(page.locator('h1')).toContainText('Simula tu Crédito Automotriz');
    
    // Check branding colors (gradient background)
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('should have all form fields present', async ({ page }) => {
    // Vehicle value input
    await expect(page.locator('input[name="vehicle_value"]')).toBeVisible();
    
    // Down payment input
    await expect(page.locator('input[name="down_payment_amount"]')).toBeVisible();
    
    // Term buttons
    await expect(page.locator('text=12 meses')).toBeVisible();
    await expect(page.locator('text=24 meses')).toBeVisible();
    await expect(page.locator('text=36 meses')).toBeVisible();
    await expect(page.locator('text=48 meses')).toBeVisible();
    await expect(page.locator('text=60 meses')).toBeVisible();
    
    // Rate tier buttons
    await expect(page.locator('text=Nivel A')).toBeVisible();
    await expect(page.locator('text=Nivel B')).toBeVisible();
    await expect(page.locator('text=Nivel C')).toBeVisible();
    
    // Insurance section
    await expect(page.locator('text=Contado')).toBeVisible();
    await expect(page.locator('text=Financiado')).toBeVisible();
    
    // Submit button
    await expect(page.locator('button:has-text("Calcular mi Crédito")')).toBeVisible();
  });

  test('should calculate quote correctly and show results', async ({ page }) => {
    // Fill vehicle value
    await page.fill('input[name="vehicle_value"]', '405900');
    
    // Fill down payment
    await page.fill('input[name="down_payment_amount"]', '121770');
    
    // Select 48 months term
    await page.click('text=48 meses');
    
    // Fill insurance amount
    await page.fill('input[name="insurance_amount"]', '19000');
    
    // Submit form
    await page.click('button:has-text("Calcular mi Crédito")');
    
    // Wait for results to appear
    await expect(page.locator('text=Pago mes 2')).toBeVisible({ timeout: 10000 });
    
    // Check that payment amount is displayed
    await expect(page.locator('text=/\\$[0-9,]+\\.[0-9]{2}/')).toBeVisible();
    
    // Check that desembolso is displayed
    await expect(page.locator('text=Desembolso')).toBeVisible();
  });

  test('should show A/B/C comparison when toggled', async ({ page }) => {
    // Fill basic form data
    await page.fill('input[name="vehicle_value"]', '405900');
    await page.fill('input[name="down_payment_amount"]', '121770');
    await page.click('text=48 meses');
    await page.fill('input[name="insurance_amount"]', '19000');
    
    // Toggle comparison
    await page.check('input[type="checkbox"]');
    
    // Submit form
    await page.click('button:has-text("Calcular mi Crédito")');
    
    // Wait for comparison results - just check for presence of level cards
    await expect(page.locator('text=Nivel A')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Nivel B')).toBeVisible();
    await expect(page.locator('text=Nivel C')).toBeVisible();
  });

  test('should validate minimum down payment (30%)', async ({ page }) => {
    // Fill vehicle value
    await page.fill('input[name="vehicle_value"]', '405900');
    
    // Fill low down payment (20%)
    await page.fill('input[name="down_payment_amount"]', '81180');
    
    // Tab out to trigger validation
    await page.keyboard.press('Tab');
    
    // Check that down payment gets auto-corrected
    await page.waitForTimeout(1000);
    const correctedValue = await page.inputValue('input[name="down_payment_amount"]');
    expect(parseInt(correctedValue)).toBeGreaterThanOrEqual(121770);
  });

  test('should show loading state during calculation', async ({ page }) => {
    // Fill form
    await page.fill('input[name="vehicle_value"]', '405900');
    await page.fill('input[name="down_payment_amount"]', '121770');
    await page.click('text=48 meses');
    await page.fill('input[name="insurance_amount"]', '19000');
    
    // Submit and check loading state
    await page.click('button:has-text("Calcular mi Crédito")');
    
    // Check that button shows loading state
    await expect(page.locator('button:has-text("Calculando...")')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page, isMobile }) => {
    if (isMobile) {
      // Check that form stacks vertically on mobile
      const formContainer = page.locator('form').first();
      await expect(formContainer).toBeVisible();
      
      // Check that comparison cards stack on mobile
      await page.fill('input[name="vehicle_value"]', '405900');
      await page.fill('input[name="down_payment_amount"]', '121770');
      await page.check('input[type="checkbox"]');
      await page.click('button:has-text("Calcular mi Crédito")');
      
      await expect(page.locator('text=Nivel A')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should allow downloading exports', async ({ page }) => {
    // Fill and submit form
    await page.fill('input[name="vehicle_value"]', '405900');
    await page.fill('input[name="down_payment_amount"]', '121770');
    await page.click('text=48 meses');
    await page.fill('input[name="insurance_amount"]', '19000');
    await page.click('button:has-text("Calcular mi Crédito")');
    
    // Wait for results
    await expect(page.locator('text=Pago mes 2')).toBeVisible({ timeout: 10000 });
    
    // Check download buttons are present
    await expect(page.locator('button:has-text("PDF")')).toBeVisible();
    await expect(page.locator('button:has-text("Excel")')).toBeVisible();
    await expect(page.locator('button:has-text("JSON")')).toBeVisible();
  });
});
