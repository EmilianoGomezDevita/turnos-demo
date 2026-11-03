import { test, expect } from '@playwright/test';

test.describe('Consistencia del recorrido y manejo de errores', () => {
  test('Volver entre pasos y mantener coherentes las selecciones', async ({ page }) => {
    // 1. Seleccionar Brushing, profesional, día y horario, y avanzar a «Tus datos».
    await page.goto('/?n=demo-turnos');
    await expect(page.getByRole('heading', { name: 'Reservá tu turno' })).toBeVisible();
    await page.getByRole('button', { name: /Brushing/ }).click();
    await expect(page.getByRole('heading', { name: '¿Con quién?' })).toBeVisible();
    await page.getByRole('button', { name: /Cualquiera/ }).click();
    await expect(page.getByRole('heading', { name: 'Elegí día y horario' })).toBeVisible();
    const availableDate = page.locator('button[data-fecha]:not([disabled])').nth(1);
    await availableDate.click();
    const availableTime = page.locator('button[data-hora]').first();
    await availableTime.click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByRole('heading', { name: 'Tus datos' })).toBeVisible();
    const summary = page.getByRole('complementary');
    await expect(summary.getByText('Brushing')).toBeVisible();
    const selectedPrice = await summary.locator('strong').innerText();
    const dateDefinition = summary.getByRole('definition').nth(2);
    const timeDefinition = summary.getByRole('definition').nth(3);
    const selectedDate = (await dateDefinition.textContent())?.trim() ?? '';
    const selectedTime = (await timeDefinition.textContent())?.trim() ?? '';
    expect(selectedDate).not.toBe('—');
    expect(selectedTime).not.toBe('—');
    await expect(dateDefinition).toBeVisible();
    await expect(timeDefinition).toBeVisible();

    // 2. Volver al calendario y regresar a datos sin cambiar las selecciones.
    await page.getByRole('button', { name: 'Volver' }).click();
    await expect(page.getByRole('heading', { name: 'Elegí día y horario' })).toBeVisible();
    await expect(dateDefinition).toHaveText(selectedDate);
    await expect(timeDefinition).toHaveText(selectedTime);
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByRole('heading', { name: 'Tus datos' })).toBeVisible();
    await expect(summary.getByText('Brushing')).toBeVisible();
    await expect(summary.locator('strong')).toHaveText(selectedPrice);

    // 3. Volver al servicio, cambiarlo por Color completo y avanzar de nuevo por profesional y agenda.
    await page.getByRole('button', { name: 'Volver' }).click();
    await page.getByRole('button', { name: 'Volver' }).click();
    await page.getByRole('button', { name: 'Volver' }).click();
    await expect(page.getByRole('heading', { name: '¿Qué te querés hacer?' })).toBeVisible();
    await page.getByRole('button', { name: /Color completo/ }).click();
    const updatedPrice = await summary.locator('strong').innerText();
    expect(updatedPrice).not.toBe(selectedPrice);
    await expect(page.getByRole('heading', { name: '¿Con quién?' })).toBeVisible();
    await page.getByRole('button', { name: /Cualquiera/ }).click();
    await expect(page.getByRole('heading', { name: 'Elegí día y horario' })).toBeVisible();
    await expect(summary.locator('strong')).toHaveText(updatedPrice);
    await expect(summary.getByRole('definition').nth(2)).toHaveText('—');
    await expect(summary.getByRole('definition').nth(3)).toHaveText('—');
    await expect(page.getByRole('heading', { name: /confirmad/i })).toHaveCount(0);
  });
});
