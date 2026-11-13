import { test, expect } from '@playwright/test';

test('al elegir horario no vuelve a la elección de profesional', async ({ page }) => {
  page.on('console', m => console.log('[consola]', m.type(), m.text()));
  page.on('response', r => {
    if (r.url().includes('/api/')) console.log('[api]', r.status(), r.url());
  });
  page.on('framenavigated', f => {
    if (f === page.mainFrame()) console.log('[navegación]', f.url());
  });

  const tituloProfesional = page.getByRole('heading', { name: '¿Con quién?' });
  const tituloDia = page.getByRole('heading', { name: 'Elegí día y horario' });
  const continuar = page.getByRole('button', { name: 'Continuar' });
  const resumen = page.locator('#resumen');

  await page.goto('/?n=demo-turnos');

  // Paso 1: servicio (avanza solo)
  await expect(page.getByRole('heading', { name: 'Reservá tu turno' })).toBeVisible();
  await page.getByRole('button', { name: /Brushing/ }).click();

  // Paso 2: profesional
  await expect(tituloProfesional).toBeVisible();
  await page.getByRole('button', { name: /Cualquiera/ }).click();
  if (await tituloProfesional.isVisible() && await continuar.isEnabled()) {
    await continuar.click();
  }

  // Paso 3: día
  await expect(tituloDia).toBeVisible();
  await page.locator('button.dia:not([disabled])').nth(2).click();
  await expect(resumen).toContainText('Cualquiera');

  // Horario
  const horario = page.locator('button.horario').first();
  await expect(horario).toBeVisible();
  const horaElegida = (await horario.getAttribute('data-hora')) ?? '';
  await horario.click();

  // Esperar un momento por si hay un re-render o un salto tardío
  await page.waitForTimeout(1500);

  // El bug: NO debe volver al paso de profesional
  await expect(tituloProfesional).toBeHidden();
  await expect(tituloDia).toBeVisible();
  await expect(resumen).toContainText('Cualquiera');
  await expect(resumen).toContainText(horaElegida);
  await expect(continuar).toBeEnabled();

  // No se pulsa "Continuar" ni "Reservar turno": no crea reservas.
});