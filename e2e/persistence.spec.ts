import { test, expect } from '@playwright/test'

test.describe('Data Persistence', () => {
  test('should persist balance after page reload', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    
    // Login and buy something
    await page.getByText('Figlio 1').click()
    
    const timeCreditsCard = page.locator('text=Time Credits').locator('..')
    await timeCreditsCard.getByRole('button', { name: /COMPRA/ }).click()
    await page.getByRole('button', { name: /Conferma Trade/ }).click()
    await page.waitForTimeout(500)
    
    // Balance should be 95
    await expect(page.getByText('🪙 95')).toBeVisible()
    
    // Reload page
    await page.reload()
    
    // Login again
    await page.getByText('Figlio 1').click()
    
    // Balance should still be 95
    await expect(page.getByText('🪙 95')).toBeVisible()
    
    // Holdings should persist
    await expect(page.getByText('📺 Time Credits')).toBeVisible()
    await expect(page.getByText('1 × 🪙5')).toBeVisible()
  })

  test('should persist asset price changes', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    
    // Login as admin and change price
    await page.getByText('Papà').click()
    
    const assetSelect = page.locator('select').first()
    await assetSelect.selectOption('TIME_CREDITS')
    await page.locator('input[placeholder="Prezzo"]').fill('25')
    await page.getByRole('button', { name: /Imposta Prezzo/ }).click()
    await page.waitForTimeout(500)
    
    // Reload page
    await page.reload()
    
    // Login and check price
    await page.getByText('Figlio 1').click()
    
    const timeCreditsCard = page.locator('text=Time Credits').locator('..')
    await expect(timeCreditsCard.getByText('🪙 25')).toBeVisible()
  })

  test('should persist new assets', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    
    // Login as admin and add asset
    await page.getByText('Papà').click()
    
    await page.locator('input[placeholder="Nome Asset"]').fill('Persistent Test')
    await page.locator('input[placeholder*="Emoji"]').fill('💾')
    await page.locator('input[placeholder="Prezzo iniziale"]').fill('50')
    await page.getByRole('button', { name: /Aggiungi Asset/ }).click()
    await page.waitForTimeout(500)
    
    // Reload page
    await page.reload()
    
    // Login and check asset exists
    await page.getByText('Figlio 1').click()
    
    await expect(page.getByRole('heading', { name: 'Persistent Test' })).toBeVisible()
    await expect(page.getByText('💾', { exact: true })).toBeVisible()
  })

  test('should persist trade history and events', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    
    // Login and make trades
    await page.getByText('Figlio 1').click()
    
    const timeCreditsCard = page.locator('text=Time Credits').locator('..')
    await timeCreditsCard.getByRole('button', { name: /COMPRA/ }).click()
    await page.getByRole('button', { name: /Conferma Trade/ }).click()
    await page.waitForTimeout(500)
    
    // Reload
    await page.reload()
    
    // Login as admin to check events
    await page.getByText('Papà').click()
    
    // Event log should contain the trade
    await expect(page.getByText(/Figlio 1.*compra.*Time Credits/)).toBeVisible()
  })

  test('should persist P2P transfers', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    
    // Login as Figlio 1 and buy asset
    await page.getByText('Figlio 1').click()
    
    const timeCreditsCard = page.locator('text=Time Credits').locator('..')
    await timeCreditsCard.getByRole('button', { name: /COMPRA/ }).click()
    await page.getByRole('button', { name: /Conferma Trade/ }).click()
    await page.waitForTimeout(500)
    
    // Transfer to Figlio 2
    await page.getByRole('button', { name: /Scambia con Altri/ }).click()
    const recipientSelect = page.locator('select').first()
    await recipientSelect.selectOption({ label: '👧 Figlio 2' })
    await page.getByRole('button', { name: /Invia/ }).click()
    await page.waitForTimeout(500)
    
    // Reload
    await page.reload()
    
    // Login as Figlio 2 and verify ownership
    await page.getByText('Figlio 2').click()
    
    await expect(page.getByText('📺 Time Credits')).toBeVisible()
    await expect(page.getByText('1 × 🪙5')).toBeVisible()
  })

  test('should persist market events', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    
    // Login as admin and trigger crash
    await page.getByText('Papà').click()
    
    await page.getByRole('button', { name: /CRASH/ }).click()
    await page.waitForTimeout(500)
    
    // Reload
    await page.reload()
    
    // Login and check prices are still crashed
    await page.getByText('Figlio 1').click()
    
    // Time Credits should be ~3-4 (70% of 5)
    const timeCreditsCard = page.locator('text=Time Credits').locator('..')
    // Price should be 3 or 4 (Math.round(5 * 0.7) = 3 or 4 depending on rounding)
    await expect(timeCreditsCard.getByText(/🪙 [34]/)).toBeVisible()
  })

  test('should preserve news/announcements after reload', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    
    // Login as admin and send announcement
    await page.getByText('Papà').click()
    
    await page.locator('input[placeholder*="pizza party"]').fill('Persisted announcement!')
    await page.getByRole('button', { name: /Invia/ }).last().click()
    await page.waitForTimeout(500)
    
    // Reload
    await page.reload()
    
    // Login and check news
    await page.getByText('Figlio 1').click()
    
    await expect(page.getByText(/Persisted announcement/)).toBeVisible()
  })
})

