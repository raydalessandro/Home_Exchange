import { test, expect } from '@playwright/test'

test.describe('Admin Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    
    // Login as admin (Papà)
    await page.getByText('Papà').click()
  })

  test('should display admin controls', async ({ page }) => {
    await expect(page.getByText('Controlli Market Maker')).toBeVisible()
    await expect(page.getByText('Gestione Asset')).toBeVisible()
    await expect(page.getByText('Giocatori')).toBeVisible()
    await expect(page.getByText('Log Eventi')).toBeVisible()
  })

  test('should change asset price', async ({ page }) => {
    // Select Time Credits
    const assetSelect = page.locator('select').first()
    await assetSelect.selectOption('TIME_CREDITS')
    
    // Enter new price
    await page.locator('input[placeholder="Prezzo"]').fill('10')
    
    // Click set price
    await page.getByRole('button', { name: /Imposta Prezzo/ }).click()
    
    // Check event log
    await expect(page.getByText(/Time Credits.*🪙5.*→.*🪙10/)).toBeVisible()
    
    // Switch to trader view to verify
    await page.getByRole('button', { name: /Trader/ }).click()
    
    // Price should be updated
    const timeCreditsCard = page.locator('text=Time Credits').locator('..')
    await expect(timeCreditsCard.getByText('🪙 10')).toBeVisible()
  })

  test('should trigger CRASH market event', async ({ page }) => {
    // Click CRASH button
    await page.getByRole('button', { name: /CRASH/ }).click()
    
    // Toast should appear (one of the elements with crash message)
    await expect(page.getByText(/CRASH DEL MERCATO/).first()).toBeVisible()
    
    // News ticker should show crash
    await page.getByRole('button', { name: /Trader/ }).click()
    await expect(page.getByText(/CRASH/)).toBeVisible()
  })

  test('should trigger BOOM market event', async ({ page }) => {
    await page.getByRole('button', { name: /BOOM/ }).click()
    
    await expect(page.getByText(/BOOM DEL MERCATO/).first()).toBeVisible()
  })

  test('should send Oracle announcement', async ({ page }) => {
    // Enter announcement
    await page.locator('input[placeholder*="pizza party"]').fill('Test announcement!')
    
    // Send
    await page.getByRole('button', { name: /Invia/ }).last().click()
    
    // Toast should appear
    await expect(page.getByText(/Annuncio inviato/)).toBeVisible()
    
    // Check news ticker in trader view
    await page.getByRole('button', { name: /Trader/ }).click()
    await expect(page.getByText(/ORACLE.*Test announcement/)).toBeVisible()
  })

  test('should add new asset', async ({ page }) => {
    // Fill form
    await page.locator('input[placeholder="Nome Asset"]').fill('Test Asset')
    await page.locator('input[placeholder*="Emoji"]').fill('🎁')
    await page.locator('textarea[placeholder="Descrizione"]').fill('A test asset')
    await page.locator('input[placeholder="Prezzo iniziale"]').fill('20')
    
    // Add asset
    await page.getByRole('button', { name: /Aggiungi Asset/ }).click()
    
    // Toast should appear
    await expect(page.getByText(/Test Asset aggiunto/)).toBeVisible()
    
    // Asset should appear in list
    await expect(page.getByText('🎁', { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Test Asset' })).toBeVisible()
    
    // Switch to trader view
    await page.getByRole('button', { name: /Trader/ }).click()
    
    // New asset should be tradeable
    const newAssetCard = page.locator('text=Test Asset').locator('..')
    await expect(newAssetCard.getByText('🪙 20')).toBeVisible()
  })

  test('should remove asset', async ({ page }) => {
    // First add an asset
    await page.locator('input[placeholder="Nome Asset"]').fill('To Delete')
    await page.locator('input[placeholder*="Emoji"]').fill('🗑️')
    await page.locator('input[placeholder="Prezzo iniziale"]').fill('5')
    await page.getByRole('button', { name: /Aggiungi Asset/ }).click()
    await page.waitForTimeout(500)
    
    // Find and delete it
    page.on('dialog', dialog => dialog.accept())
    
    const assetRow = page.locator('text=To Delete').locator('..')
    await assetRow.getByRole('button', { name: '🗑️' }).click()
    
    // Should be removed
    await expect(page.getByText('To Delete')).not.toBeVisible()
  })

  test('should give money to player', async ({ page }) => {
    // Find Figlio 1 and give money
    const figlio1Card = page.locator('text=Figlio 1').locator('..')
    await figlio1Card.getByRole('button', { name: /\+50/ }).click()
    
    // Check balance increased
    await expect(figlio1Card.getByText(/Cash:.*150/)).toBeVisible()
    
    // Event should be logged
    await expect(page.getByText(/BANCA.*Figlio 1.*\+.*50/)).toBeVisible()
  })

  test('should take money from player', async ({ page }) => {
    const figlio1Card = page.locator('text=Figlio 1').locator('..')
    await figlio1Card.getByRole('button', { name: /-30/ }).click()
    
    // Check balance decreased
    await expect(figlio1Card.getByText(/Cash:.*70/)).toBeVisible()
    
    // Event should be logged
    await expect(page.getByText(/Figlio 1.*BANCA.*-.*30/)).toBeVisible()
  })

  test('should display player portfolio values', async ({ page }) => {
    // Give Figlio 1 some holdings first
    await page.getByRole('button', { name: /Trader/ }).click()
    
    // Switch to Figlio 1
    await page.getByText('Logout').click()
    await page.getByText('Figlio 1').click()
    
    // Buy Time Credits
    const timeCreditsCard = page.locator('text=Time Credits').locator('..')
    await timeCreditsCard.getByRole('button', { name: /COMPRA/ }).click()
    await page.getByRole('button', { name: /Conferma Trade/ }).click()
    await page.waitForTimeout(500)
    
    // Login as admin to check portfolio display
    await page.getByText('Logout').click()
    await page.getByText('Papà').click()
    
    // Figlio 1 should show portfolio value
    const figlio1Card = page.locator('text=Figlio 1').locator('..')
    await expect(figlio1Card.getByText(/Portfolio:.*5/)).toBeVisible()
    await expect(figlio1Card.getByText(/Total:.*100/)).toBeVisible() // 95 cash + 5 portfolio
  })
})

