import { test, expect } from '@playwright/test';

test.describe('Reserva y confirmación exitosa', () => {
  test('Completar una reserva y verificar su confirmación', async ({ page }) => {
    // 1. Abrir el negocio demo en un estado limpio y sin reservas previas del escenario.
    await page.goto('/?n=demo-turnos');
    await expect(page.getByRole('heading', { name: 'Reservá tu turno' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Brushing/ })).toBeVisible();

    // 2. Seleccionar un servicio disponible (Brushing) y continuar.
    await page.getByRole('button', { name: /Brushing/ }).click();
    await expect(page.getByRole('heading', { name: '¿Con quién?' })).toBeVisible();
    const summary = page.getByRole('complementary');
    await expect(summary.getByText('Brushing')).toBeVisible();
    const selectedPrice = await summary.locator('strong').innerText();

    // 3. Elegir un profesional disponible y continuar.
    await page.getByRole('button', { name: /Lucía/ }).click();
    await expect(summary.getByText('Lucía')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Elegí día y horario' })).toBeVisible();

    // 4. Elegir un día futuro habilitado y un horario disponible.
    const availableDate = page.locator('button[data-fecha]:not([disabled])').nth(1);
    await availableDate.click();
    const availableTime = page.locator('button[data-hora]').first();
    await expect(availableTime).toBeVisible();
    await availableTime.click();
    await expect(page.getByRole('button', { name: 'Continuar' })).toBeEnabled();
    const selectedDate = (await summary.getByRole('definition').nth(2).textContent())?.trim() ?? '';
    const selectedTime = (await summary.getByRole('definition').nth(3).textContent())?.trim() ?? '';
    expect(selectedDate).not.toBe('—');
    expect(selectedTime).not.toBe('—');
    await expect(summary.getByRole('definition').nth(2)).toBeVisible();
    await expect(summary.getByRole('definition').nth(3)).toBeVisible();
    await page.getByRole('button', { name: 'Continuar' }).click();

    // 5. Ingresar nombre completo y WhatsApp válido con característica; pulsar «Reservar turno» una sola vez.
    await expect(page.getByRole('heading', { name: 'Tus datos' })).toBeVisible();
    await page.getByRole('textbox', { name: 'Nombre y apellido' }).fill('E2E Playwright - Ana Pérez');
    await page.getByRole('textbox', { name: 'WhatsApp' }).fill('11 6234-1187');
    await page.getByRole('button', { name: 'Reservar turno' }).click();
    await expect(page).toHaveURL(/confirmacion/);
    await expect(page.getByRole('heading', { name: /turno quedó confirmado/i })).toBeVisible();
    await expect(page.getByText('Confirmado', { exact: true })).toBeVisible();
    await expect(page.getByText('E2E Playwright - Ana Pérez')).toBeVisible();
    await expect(page.getByText('Brushing')).toBeVisible();
    await expect(page.getByText('Lucía')).toBeVisible();
    await expect(page.getByText(selectedDate, { exact: true })).toBeVisible();
    await expect(page.getByText(selectedTime, { exact: true })).toBeVisible();
    await expect(page.getByText('Demo Sist. Turnos')).toBeVisible();
    await expect(page.getByText(selectedPrice, { exact: true })).toBeVisible();
    await expect(page.getByText(/pendiente|fallid/i)).toHaveCount(0);

    // 6. Actualizar la página o consultar el estado si hay referencia disponible.
    await page.reload();
    await expect(page.getByText('Confirmado', { exact: true })).toBeVisible();
    await expect(page.getByText('E2E Playwright - Ana Pérez')).toBeVisible();
  });
});
