import { test, expect } from '@playwright/test'

/**
 * Calendar Module E2E Tests
 * Test del flusso completo: prenotazione, conferma, pagamento collaboratori
 */

test.describe('Calendar Module', () => {
  
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('http://localhost:3000')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test.describe('Booking Flow', () => {
    
    test('Player can create a booking for a future date', async ({ page }) => {
      // Login as Figlio 1
      await page.getByRole('button', { name: '👦 Figlio 1' }).click()
      
      // Go to Calendar tab
      await page.getByRole('button', { name: 'Calendario' }).click()
      
      // Should see calendar view
      await expect(page.getByText('Calendario Attività')).toBeVisible()
      
      // Click on a day to create booking
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dayButton = page.getByRole('button', { name: new RegExp(tomorrow.getDate().toString()) })
      await dayButton.click()
      
      // Booking modal should open
      await expect(page.getByText('Nuova Prenotazione')).toBeVisible()
      
      // Select a work template
      await page.getByRole('button', { name: /Pulisce Camera/ }).click()
      
      // Confirm booking
      await page.getByRole('button', { name: 'Prenota' }).click()
      
      // Should see success toast
      await expect(page.getByText('Prenotazione creata!')).toBeVisible()
    })

    test('Player can create a booking with collaborators', async ({ page }) => {
      // Login as Figlio 1
      await page.getByRole('button', { name: '👦 Figlio 1' }).click()
      
      // Go to Calendar tab
      await page.getByRole('button', { name: 'Calendario' }).click()
      
      // Click on a day
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await page.getByRole('button', { name: new RegExp(tomorrow.getDate().toString()) }).click()
      
      // Select a work template
      await page.getByRole('button', { name: /Pulisce Cucina/ }).click()
      
      // Add collaborator
      await page.getByLabel('Figlio 2').check()
      
      // Confirm booking
      await page.getByRole('button', { name: 'Prenota' }).click()
      
      // Should see collaborator in booking
      await expect(page.getByText('Figlio 2')).toBeVisible()
    })

    test('Player can mark booking as done', async ({ page }) => {
      // Create a booking first
      await page.getByRole('button', { name: '👦 Figlio 1' }).click()
      await page.getByRole('button', { name: 'Calendario' }).click()
      
      const today = new Date()
      await page.getByRole('button', { name: new RegExp(today.getDate().toString()) }).click()
      await page.getByRole('button', { name: /Sparecchia/ }).click()
      await page.getByRole('button', { name: 'Prenota' }).click()
      
      // Wait for booking to appear
      await expect(page.getByText('Sparecchia')).toBeVisible()
      
      // Mark as done
      await page.getByRole('button', { name: 'Fatto' }).click()
      
      // Should see updated status
      await expect(page.getByText('Fatto (da confermare)')).toBeVisible()
    })

    test('Player can cancel a booking', async ({ page }) => {
      // Create a booking first
      await page.getByRole('button', { name: '👦 Figlio 1' }).click()
      await page.getByRole('button', { name: 'Calendario' }).click()
      
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await page.getByRole('button', { name: new RegExp(tomorrow.getDate().toString()) }).click()
      await page.getByRole('button', { name: /Apparecchia/ }).click()
      await page.getByRole('button', { name: 'Prenota' }).click()
      
      // Cancel booking
      await page.getByRole('button', { name: 'Cancella' }).click()
      
      // Should see toast
      await expect(page.getByText('Prenotazione cancellata')).toBeVisible()
    })
  })

  test.describe('Admin Confirmation Flow', () => {
    
    test('Admin can confirm a marked-done booking', async ({ page }) => {
      // First, create and mark done as player
      await page.getByRole('button', { name: '👦 Figlio 1' }).click()
      await page.getByRole('button', { name: 'Calendario' }).click()
      
      const today = new Date()
      await page.getByRole('button', { name: new RegExp(today.getDate().toString()) }).click()
      await page.getByRole('button', { name: /Lava Piatti/ }).click()
      await page.getByRole('button', { name: 'Prenota' }).click()
      await page.getByRole('button', { name: 'Fatto' }).click()
      
      // Logout and login as admin
      await page.getByRole('button', { name: 'Logout' }).click()
      await page.getByRole('button', { name: '👨 Papà Admin' }).click()
      
      // Go to Calendario section in admin
      await page.getByRole('button', { name: 'Calendario' }).click()
      
      // Should see pending confirmation
      await expect(page.getByText('Da Confermare')).toBeVisible()
      await expect(page.getByText('Lava Piatti')).toBeVisible()
      
      // Confirm booking
      await page.getByRole('button', { name: 'Conferma' }).click()
      
      // Should see success
      await expect(page.getByText(/Confermato!/)).toBeVisible()
    })

    test('Confirmed booking emits a work token', async ({ page }) => {
      // Create and complete booking flow
      await page.getByRole('button', { name: '👦 Figlio 1' }).click()
      await page.getByRole('button', { name: 'Calendario' }).click()
      
      const today = new Date()
      await page.getByRole('button', { name: new RegExp(today.getDate().toString()) }).click()
      await page.getByRole('button', { name: /Compiti Completi/ }).click()
      await page.getByRole('button', { name: 'Prenota' }).click()
      await page.getByRole('button', { name: 'Fatto' }).click()
      
      // Admin confirms
      await page.getByRole('button', { name: 'Logout' }).click()
      await page.getByRole('button', { name: '👨 Papà Admin' }).click()
      await page.getByRole('button', { name: 'Calendario' }).click()
      await page.getByRole('button', { name: 'Conferma' }).click()
      
      // Check Figlio 1 got the token
      await page.getByRole('button', { name: 'Logout' }).click()
      await page.getByRole('button', { name: '👦 Figlio 1' }).click()
      await page.getByRole('button', { name: 'Gettoni' }).click()
      
      // Should see the token
      await expect(page.getByText(/Compiti Completi \(Calendario\)/)).toBeVisible()
    })
  })

  test.describe('Collaborator Payment Flow', () => {
    
    test('Booking owner can pay collaborators after confirmation', async ({ page }) => {
      // Create booking with collaborator
      await page.getByRole('button', { name: '👦 Figlio 1' }).click()
      await page.getByRole('button', { name: 'Calendario' }).click()
      
      const today = new Date()
      await page.getByRole('button', { name: new RegExp(today.getDate().toString()) }).click()
      await page.getByRole('button', { name: /Aspirapolvere/ }).click()
      await page.getByLabel('Figlio 2').check()
      await page.getByRole('button', { name: 'Prenota' }).click()
      await page.getByRole('button', { name: 'Fatto' }).click()
      
      // Admin confirms
      await page.getByRole('button', { name: 'Logout' }).click()
      await page.getByRole('button', { name: '👨 Papà Admin' }).click()
      await page.getByRole('button', { name: 'Calendario' }).click()
      await page.getByRole('button', { name: 'Conferma' }).click()
      
      // Login as Figlio 1 again
      await page.getByRole('button', { name: 'Logout' }).click()
      await page.getByRole('button', { name: '👦 Figlio 1' }).click()
      await page.getByRole('button', { name: 'Calendario' }).click()
      
      // Should see "Pay collaborators" option on confirmed booking
      await expect(page.getByText('Paga collaboratori')).toBeVisible()
      await page.getByRole('button', { name: 'Paga collaboratori' }).click()
      
      // Enter amount
      await page.getByLabel('Importo per Figlio 2').fill('5')
      await page.getByRole('button', { name: 'Paga' }).click()
      
      // Should see success
      await expect(page.getByText(/Pagato.*Figlio 2/)).toBeVisible()
    })

    test('P2P transfers are tracked and visible to admin', async ({ page }) => {
      // Complete the full flow with payment
      await page.getByRole('button', { name: '👦 Figlio 1' }).click()
      await page.getByRole('button', { name: 'Calendario' }).click()
      
      const today = new Date()
      await page.getByRole('button', { name: new RegExp(today.getDate().toString()) }).click()
      await page.getByRole('button', { name: /Pulisce Bagno/ }).click()
      await page.getByLabel('Figlio 2').check()
      await page.getByRole('button', { name: 'Prenota' }).click()
      await page.getByRole('button', { name: 'Fatto' }).click()
      
      // Admin confirms
      await page.getByRole('button', { name: 'Logout' }).click()
      await page.getByRole('button', { name: '👨 Papà Admin' }).click()
      await page.getByRole('button', { name: 'Calendario' }).click()
      await page.getByRole('button', { name: 'Conferma' }).click()
      
      // Figlio 1 pays
      await page.getByRole('button', { name: 'Logout' }).click()
      await page.getByRole('button', { name: '👦 Figlio 1' }).click()
      await page.getByRole('button', { name: 'Calendario' }).click()
      await page.getByRole('button', { name: 'Paga collaboratori' }).click()
      await page.getByLabel('Importo per Figlio 2').fill('10')
      await page.getByRole('button', { name: 'Paga' }).click()
      
      // Admin checks event log
      await page.getByRole('button', { name: 'Logout' }).click()
      await page.getByRole('button', { name: '👨 Papà Admin' }).click()
      await page.getByRole('button', { name: 'Log' }).click()
      
      // Should see collaborator payment event
      await expect(page.getByText(/Figlio 1 ha pagato.*10.*Figlio 2/)).toBeVisible()
    })
  })

  test.describe('Inactivity Penalty', () => {
    
    test('Admin can see inactivity report for a date', async ({ page }) => {
      // Login as admin
      await page.getByRole('button', { name: '👨 Papà Admin' }).click()
      
      // Go to Inactivity panel
      await page.getByRole('button', { name: 'Inattività' }).click()
      
      // Should see report for today
      await expect(page.getByText('Report Inattività')).toBeVisible()
      
      // All children should be listed as inactive (no bookings yet)
      await expect(page.getByText('Figlio 1')).toBeVisible()
      await expect(page.getByText('Figlio 2')).toBeVisible()
      await expect(page.getByText('Figlio 3')).toBeVisible()
    })

    test('Admin can apply inactivity penalty to a player', async ({ page }) => {
      // Get initial balance
      await page.getByRole('button', { name: '👦 Figlio 1' }).click()
      const initialBalance = await page.getByText(/🪙 \d+/).first().textContent()
      
      // Logout and login as admin
      await page.getByRole('button', { name: 'Logout' }).click()
      await page.getByRole('button', { name: '👨 Papà Admin' }).click()
      
      // Go to Inactivity panel
      await page.getByRole('button', { name: 'Inattività' }).click()
      
      // Apply penalty to Figlio 1
      await page.getByRole('button', { name: /Penalità.*Figlio 1/ }).click()
      
      // Should see confirmation
      await expect(page.getByText(/Penalità.*applicata/)).toBeVisible()
      
      // Check Figlio 1 balance decreased
      await page.getByRole('button', { name: 'Logout' }).click()
      await page.getByRole('button', { name: '👦 Figlio 1' }).click()
      
      // Balance should be 5 less
      const newBalance = await page.getByText(/🪙 \d+/).first().textContent()
      expect(parseInt(newBalance?.replace(/\D/g, '') || '0'))
        .toBeLessThan(parseInt(initialBalance?.replace(/\D/g, '') || '0'))
    })

    test('Cannot apply penalty twice for same day', async ({ page }) => {
      // Login as admin
      await page.getByRole('button', { name: '👨 Papà Admin' }).click()
      
      // Go to Inactivity panel
      await page.getByRole('button', { name: 'Inattività' }).click()
      
      // Apply penalty
      await page.getByRole('button', { name: /Penalità.*Figlio 1/ }).click()
      
      // Try to apply again
      await page.getByRole('button', { name: /Penalità.*Figlio 1/ }).click()
      
      // Should see warning
      await expect(page.getByText('Penalità già applicata')).toBeVisible()
    })

    test('Players with bookings are not shown as inactive', async ({ page }) => {
      // Create a booking for Figlio 1
      await page.getByRole('button', { name: '👦 Figlio 1' }).click()
      await page.getByRole('button', { name: 'Calendario' }).click()
      
      const today = new Date()
      await page.getByRole('button', { name: new RegExp(today.getDate().toString()) }).click()
      await page.getByRole('button', { name: /Riordina Stanza/ }).click()
      await page.getByRole('button', { name: 'Prenota' }).click()
      
      // Check admin inactivity report
      await page.getByRole('button', { name: 'Logout' }).click()
      await page.getByRole('button', { name: '👨 Papà Admin' }).click()
      await page.getByRole('button', { name: 'Inattività' }).click()
      
      // Figlio 1 should show as active
      const figlio1Row = page.getByRole('row', { name: /Figlio 1/ })
      await expect(figlio1Row.getByText('Attivo')).toBeVisible()
      
      // Figlio 2 and 3 should still be inactive
      const figlio2Row = page.getByRole('row', { name: /Figlio 2/ })
      await expect(figlio2Row.getByText('Inattivo')).toBeVisible()
    })
  })
})

