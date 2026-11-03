import { test, expect } from '@playwright/test';

test.describe('Validaciones de selección y datos', () => {
  test('Impedir avanzar sin seleccionar elementos obligatorios', async ({ page }) => {
    // 1. Abrir el negocio demo sin seleccionar servicio.
    await page.goto('/?n=demo-turnos');
    await expect(page.getByRole('heading', { name: 'Reservá tu turno' })).toBeVisible();
    const continueButton = page.getByRole('button', { name: 'Continuar' });
    await expect(continueButton).toBeDisabled();

    // 2. Seleccionar Brushing e intentar avanzar sin elegir profesional.
    await page.getByRole('button', { name: /Brushing/ }).click();
    await expect(page.getByRole('heading', { name: '¿Con quién?' })).toBeVisible();
    await expect(continueButton).toBeDisabled();
    await expect(page.getByRole('heading', { name: '¿Con quién?' })).toBeVisible();

    // 3. Elegir profesional disponible y avanzar al calendario; intentar elegir un día cerrado.
    await page.getByRole('button', { name: /Cualquiera/ }).click();
    await expect(page.getByRole('heading', { name: 'Elegí día y horario' })).toBeVisible();
    const closedDate = page.locator('button[data-fecha][disabled]').first();
    await expect(closedDate).toBeVisible();
    await expect(closedDate).toContainText('Cerrado');
    await expect(closedDate).toBeDisabled();
    await expect(continueButton).toBeDisabled();

    // 4. Elegir un día habilitado, pero no seleccionar ningún horario.
    const availableDate = page.locator('button[data-fecha]:not([disabled])').nth(1);
    await availableDate.click();
    await expect(continueButton).toBeDisabled();
  });
});
