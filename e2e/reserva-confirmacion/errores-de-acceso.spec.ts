import { test, expect } from '@playwright/test';

test.describe('Consistencia del recorrido y manejo de errores', () => {
  test('Informar cuando el negocio no existe', async ({ page }) => {
    // 1. Abrir la aplicación con un identificador de negocio inexistente.
    await page.goto('/?n=negocio-inexistente');

    // 2. Verificar el mensaje para negocio inexistente y que no se ofrece el formulario de reserva.
    await expect(page.getByRole('heading', { name: 'Negocio no encontrado' })).toBeVisible();
    await expect(page.getByText('Revisá el link de reservas.')).toBeVisible();
    await expect(page.getByRole('textbox')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Brushing/ })).toHaveCount(0);
  });
});
