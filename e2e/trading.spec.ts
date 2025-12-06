import { test, expect } from '@playwright/test'

test.describe('Trading with Bank', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    
    // Login as Figlio 1
    await page.getByText('Figlio 1').click()
  })

  test('should display initial balance and assets', async ({ page }) => {
    // Check wallet shows initial balance of 100
    await expect(page.locator('.wallet-card').getByText('🪙 100')).toBeVisible()
    
    // Check trading grid shows all assets
    await expect(page.getByText('Time Credits')).toBeVisible()
    await expect(page.getByText('Privilege Tokens')).toBeVisible()
    await expect(page.getByText('Chore Shares')).toBeVisible()
    await expect(page.getByText('Sweet Futures')).toBeVisible()
  })

  test('should buy an asset successfully', async ({ page }) => {
    // Find Time Credits card and click COMPRA
    const timeCreditsCard = page.locator('text=Time Credits').locator('..')
    await timeCreditsCard.getByRole('button', { name: /COMPRA/ }).click()
    
    // Modal should open
    await expect(page.getByText('COMPRA Time Credits')).toBeVisible()
    
    // Check initial quantity is 1
    const quantityInput = page.locator('input[type="number"]').first()
    await expect(quantityInput).toHaveValue('1')
    
    // Check total shows in modal
    await expect(page.getByRole('dialog').getByText('TOTALE:')).toBeVisible()
    
    // Confirm trade
    await page.getByRole('button', { name: /Conferma Trade/ }).click()
    
    // Success toast should appear
    await expect(page.getByText(/Acquistato.*Time Credits/)).toBeVisible()
    
    // Balance should be reduced (100 - 5 = 95)
    await expect(page.getByText('🪙 95')).toBeVisible()
    
    // Holdings should show 1 Time Credit
    await expect(page.getByText('📺 Time Credits')).toBeVisible()
    await expect(page.getByText('1 × 🪙5')).toBeVisible()
  })

  test('should sell an asset successfully', async ({ page }) => {
    // First buy an asset
    const timeCreditsCard = page.locator('text=Time Credits').locator('..')
    await timeCreditsCard.getByRole('button', { name: /COMPRA/ }).click()
    await page.getByRole('button', { name: /Conferma Trade/ }).click()
    await page.waitForTimeout(500)
    
    // Now sell it
    await timeCreditsCard.getByRole('button', { name: /VENDI/ }).click()
    
    // Modal should open
    await expect(page.getByText('VENDI Time Credits')).toBeVisible()
    
    // Confirm trade
    await page.getByRole('button', { name: /Conferma Trade/ }).click()
    
    // Success toast should appear
    await expect(page.getByText(/Venduto.*Time Credits/)).toBeVisible()
    
    // Balance should be back to 100
    await expect(page.locator('.wallet-card').getByText('🪙 100')).toBeVisible()
  })

  test('should not allow buying when insufficient funds', async ({ page }) => {
    // Find Privilege Tokens (price 15) and check COMPRA button
    const privilegeCard = page.locator('text=Privilege Tokens').locator('..')
    
    // User has 100, try to buy 7 (7 * 15 = 105 > 100)
    await privilegeCard.getByRole('button', { name: /COMPRA/ }).click()
    
    // Increase quantity to max
    const plusButton = page.locator('button:has-text("+")')
    for (let i = 0; i < 6; i++) {
      await plusButton.click()
    }
    
    // Should show warning
    await expect(page.getByText(/Fondi insufficienti/)).toBeVisible()
    
    // Confirm button should be disabled
    const confirmButton = page.getByRole('button', { name: /Conferma Trade/ })
    await expect(confirmButton).toBeDisabled()
  })

  test('should increase/decrease quantity in trade modal', async ({ page }) => {
    const timeCreditsCard = page.locator('text=Time Credits').locator('..')
    await timeCreditsCard.getByRole('button', { name: /COMPRA/ }).click()
    
    const quantityInput = page.locator('input[type="number"]').first()
    const plusButton = page.locator('button:has-text("+")')
    const minusButton = page.locator('button:has-text("−")')
    
    // Initial quantity is 1
    await expect(quantityInput).toHaveValue('1')
    
    // Increase to 3
    await plusButton.click()
    await plusButton.click()
    await expect(quantityInput).toHaveValue('3')
    
    // Total should be 15 (3 * 5)
    await expect(page.getByText('🪙 15').last()).toBeVisible()
    
    // Decrease to 2
    await minusButton.click()
    await expect(quantityInput).toHaveValue('2')
  })
})

