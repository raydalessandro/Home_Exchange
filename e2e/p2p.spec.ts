import { test, expect } from '@playwright/test'

test.describe('P2P Trading', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('should not show P2P button when user has no assets', async ({ page }) => {
    // Login as Figlio 1
    await page.getByText('Figlio 1').click()
    
    // P2P button should be disabled
    const p2pButton = page.getByRole('button', { name: /Scambia con Altri/ })
    await expect(p2pButton).toBeDisabled()
    
    // Should show explanation
    await expect(page.getByText(/Acquista asset per abilitare/)).toBeVisible()
  })

  test('should enable P2P button after buying an asset', async ({ page }) => {
    // Login as Figlio 1
    await page.getByText('Figlio 1').click()
    
    // Buy an asset first
    const timeCreditsCard = page.locator('text=Time Credits').locator('..')
    await timeCreditsCard.getByRole('button', { name: /COMPRA/ }).click()
    await page.getByRole('button', { name: /Conferma Trade/ }).click()
    await page.waitForTimeout(500)
    
    // P2P button should now be enabled
    const p2pButton = page.getByRole('button', { name: /Scambia con Altri/ })
    await expect(p2pButton).not.toBeDisabled()
  })

  test('should transfer asset between players', async ({ page }) => {
    // Login as Figlio 1 and buy an asset
    await page.getByText('Figlio 1').click()
    
    const timeCreditsCard = page.locator('text=Time Credits').locator('..')
    await timeCreditsCard.getByRole('button', { name: /COMPRA/ }).click()
    await page.getByRole('button', { name: /Conferma Trade/ }).click()
    await page.waitForTimeout(500)
    
    // Open P2P modal
    await page.getByRole('button', { name: /Scambia con Altri/ }).click()
    
    // Modal should open
    await expect(page.getByText('Scambio Peer-to-Peer')).toBeVisible()
    
    // Select recipient (Figlio 2)
    const recipientSelect = page.locator('select').first()
    await recipientSelect.selectOption({ label: '👧 Figlio 2' })
    
    // Asset select should have Time Credits
    const assetSelect = page.locator('select').nth(1)
    await expect(assetSelect).toContainText('Time Credits')
    
    // Confirm transfer
    await page.getByRole('button', { name: /Invia/ }).click()
    
    // Success toast
    await expect(page.getByText(/Inviato.*Time Credits.*Figlio 2/)).toBeVisible()
    
    // Holdings should be empty now
    await expect(page.getByText('Nessun asset')).toBeVisible()
    
    // Logout and login as Figlio 2 to verify
    await page.getByText('Logout').click()
    await page.getByText('Figlio 2').click()
    
    // Figlio 2 should have the Time Credit
    await expect(page.getByText('📺 Time Credits')).toBeVisible()
    await expect(page.getByText('1 × 🪙5')).toBeVisible()
  })

  test('should show all other players as recipients', async ({ page }) => {
    // Login as Figlio 1 and buy an asset
    await page.getByText('Figlio 1').click()
    
    const timeCreditsCard = page.locator('text=Time Credits').locator('..')
    await timeCreditsCard.getByRole('button', { name: /COMPRA/ }).click()
    await page.getByRole('button', { name: /Conferma Trade/ }).click()
    await page.waitForTimeout(500)
    
    // Open P2P modal
    await page.getByRole('button', { name: /Scambia con Altri/ }).click()
    
    // Check recipient options
    const recipientSelect = page.locator('select').first()
    
    // Should include players except Figlio 1 (current user) - bank excluded from P2P
    await expect(recipientSelect.locator('option')).toHaveCount(4) // Papà, Mamma, Figlio 2, Figlio 3
  })

  test('should allow transferring multiple quantities', async ({ page }) => {
    // Login as Figlio 1
    await page.getByText('Figlio 1').click()
    
    // Buy 3 Time Credits
    const timeCreditsCard = page.locator('text=Time Credits').locator('..')
    await timeCreditsCard.getByRole('button', { name: /COMPRA/ }).click()
    
    // Increase quantity
    const plusButton = page.locator('button:has-text("+")').first()
    await plusButton.click()
    await plusButton.click()
    
    await page.getByRole('button', { name: /Conferma Trade/ }).click()
    await page.waitForTimeout(500)
    
    // Open P2P modal
    await page.getByRole('button', { name: /Scambia con Altri/ }).click()
    
    // Increase transfer quantity to 2
    const p2pPlusButton = page.locator('button:has-text("+")').first()
    await p2pPlusButton.click()
    
    // Should show "Invierai: 2×"
    await expect(page.getByText(/Invierai:.*2×/)).toBeVisible()
    
    // Transfer
    await page.getByRole('button', { name: /Invia/ }).click()
    
    // Should have 1 left
    await expect(page.getByText('1 × 🪙5')).toBeVisible()
  })
})

