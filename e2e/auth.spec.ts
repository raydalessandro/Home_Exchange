import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('should display login view with all players', async ({ page }) => {
    await page.goto('/')
    
    // Check header
    await expect(page.getByText('CASA EXCHANGE')).toBeVisible()
    await expect(page.getByText('Non giochiamo coi numeri, facciamo magie')).toBeVisible()
    
    // Check login card
    await expect(page.getByText('Seleziona il tuo Profilo')).toBeVisible()
    
    // Check all players are visible (excluding bank)
    await expect(page.getByText('Papà')).toBeVisible()
    await expect(page.getByText('Mamma')).toBeVisible()
    await expect(page.getByText('Figlio 1')).toBeVisible()
    await expect(page.getByText('Figlio 2')).toBeVisible()
    await expect(page.getByText('Figlio 3')).toBeVisible()
  })

  test('should login as admin user (Papà)', async ({ page }) => {
    await page.goto('/')
    
    // Click on Papà
    await page.getByText('Papà').click()
    
    // Should show header with user info
    await expect(page.getByRole('banner').getByText('👨')).toBeVisible()
    await expect(page.getByRole('banner').getByText('Papà')).toBeVisible()
    
    // Should show mode switcher for admin
    await expect(page.getByText('Admin')).toBeVisible()
    await expect(page.getByText('Trader')).toBeVisible()
    
    // Should show logout button
    await expect(page.getByText('Logout')).toBeVisible()
  })

  test('should login as non-admin user (Figlio 1)', async ({ page }) => {
    await page.goto('/')
    
    // Click on Figlio 1
    await page.getByText('Figlio 1').click()
    
    // Should show header with user info
    await expect(page.getByText('👦')).toBeVisible()
    await expect(page.getByText('Figlio 1')).toBeVisible()
    
    // Should NOT show admin mode switcher
    await expect(page.getByRole('button', { name: /Admin/ })).not.toBeVisible()
    
    // Should be in trader view
    await expect(page.getByText('PORTAFOGLIO')).toBeVisible()
  })

  test('should logout successfully', async ({ page }) => {
    await page.goto('/')
    
    // Login
    await page.getByRole('button', { name: /Papà/ }).click()
    // Admin view shows by default for admins
    await expect(page.getByText('Controlli Market Maker')).toBeVisible()
    
    // Logout
    await page.getByText('Logout').click()
    
    // Should be back to login view
    await expect(page.getByText('Seleziona il tuo Profilo')).toBeVisible()
  })

  test('admin can switch between admin and trader modes', async ({ page }) => {
    await page.goto('/')
    
    // Login as admin
    await page.getByText('Papà').click()
    
    // By default should be in admin mode
    await expect(page.getByText('Controlli Market Maker')).toBeVisible()
    
    // Switch to trader mode
    await page.getByRole('button', { name: /Trader/ }).click()
    
    // Should show trader view
    await expect(page.getByText('PORTAFOGLIO')).toBeVisible()
    await expect(page.getByText('Controlli Market Maker')).not.toBeVisible()
    
    // Switch back to admin mode
    await page.getByRole('button', { name: /Admin/ }).click()
    
    // Should show admin view again
    await expect(page.getByText('Controlli Market Maker')).toBeVisible()
  })
})

