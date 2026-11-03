import { test, expect } from '@playwright/test';

test.describe('Validaciones de selección y datos', () => {
  test('Validar nombre y WhatsApp antes de crear la reserva', async ({ page }) => {
    // 1. Llegar a «Tus datos» con una selección válida y dejar ambos campos vacíos.
    await page.goto('/?n=demo-turnos');
    await expect(page.getByRole('heading', { name: 'Reservá tu turno' })).toBeVisible();
    await page.getByRole('button', { name: /Brushing/ }).click();
    await expect(page.getByRole('heading', { name: '¿Con quién?' })).toBeVisible();
    await page.getByRole('button', { name: /Cualquiera/ }).click();
    await expect(page.getByRole('heading', { name: 'Elegí día y horario' })).toBeVisible();
    const availableDate = page.locator('button[data-fecha]:not([disabled])').nth(1);
    await availableDate.click();
    const availableTime = page.locator('button[data-hora]').first();
    await expect(availableTime).toBeVisible();
    await availableTime.click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByRole('heading', { name: 'Tus datos' })).toBeVisible();
    const nameField = page.getByRole('textbox', { name: 'Nombre y apellido' });
    const phoneField = page.getByRole('textbox', { name: 'WhatsApp' });
    await page.getByRole('button', { name: 'Reservar turno' }).click();
    await expect(page.getByRole('alert')).toContainText('Ingresá tu nombre completo.');
    await expect(nameField).toBeVisible();
    await expect(page.getByText(/confirmad/i)).toHaveCount(0);

    // 2. Ingresar nombre incompleto «Ana», dejar WhatsApp vacío y volver a intentar reservar.
    await nameField.fill('Ana');
    await page.getByRole('button', { name: 'Reservar turno' }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText(/confirmad/i)).toHaveCount(0);

    // 3. Ingresar nombre y WhatsApp inválido «abc», e intentar reservar.
    await phoneField.fill('abc');
    await page.getByRole('button', { name: 'Reservar turno' }).click();
    await expect(page.getByRole('alert')).toContainText(/WhatsApp válido.*característica/i);
    await expect(nameField).toHaveValue('Ana');
    await expect(phoneField).toHaveValue('abc');
    await expect(page.getByText(/confirmad/i)).toHaveCount(0);

    // 4. Reemplazar por nombre completo y WhatsApp válido, sin enviar la reserva en este escenario.
    await nameField.fill('Ana Pérez');
    await phoneField.fill('11 6234-1187');
    await expect(nameField).toHaveValue('Ana Pérez');
    await expect(phoneField).toHaveValue('11 6234-1187');
  });
});
