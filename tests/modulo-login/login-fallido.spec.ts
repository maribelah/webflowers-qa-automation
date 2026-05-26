import { test, expect } from '../../src/fixtures/base.fixture';
import { LoginPage } from '../../src/pages/LoginPage';
import loginData from '../../src/data/loginData.json';

test.describe('Módulo Login — Casos negativos de autenticación', () => {

  test('Login fallido con contraseña incorrecta', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await test.step('Navegar a la página de login', async () => {
      await loginPage.navegarAlInicio();
      await page.screenshot({
        path: 'reports/screenshots/01-pagina-login-caso-fallido.png',
        fullPage: true
      });
    });

    await test.step('Ingresar credenciales incorrectas', async () => {
      await loginPage.login(loginData.fallido.usuario, loginData.fallido.password);
      await page.screenshot({
        path: 'reports/screenshots/02-credenciales-incorrectas-ingresadas.png',
        fullPage: true
      });
    });

    await test.step('Validar mensaje de error', async () => {
      // Esperar a que el mensaje de error sea visible
      await expect(loginPage.mensajeError).toBeVisible({ timeout: 10000 });
      
      const mensajeError = await loginPage.obtenerMensajeError();
      expect(mensajeError.length).toBeGreaterThan(0);
      
      await page.screenshot({
        path: 'reports/screenshots/03-mensaje-error-visible.png',
        fullPage: true
      });
    });

    await test.step('Validar que permanece en login', async () => {
      const estaEnLogin = await loginPage.estaEnLogin();
      expect(estaEnLogin).toBe(true);
      
      await page.screenshot({
        path: 'reports/screenshots/04-permanece-en-login.png',
        fullPage: true
      });
    });
  });

  test('Login con campos vacíos — validación de formulario', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await test.step('Navegar a la página de login', async () => {
      await loginPage.navegarAlInicio();
      await page.screenshot({
        path: 'reports/screenshots/01-pagina-login-campos-vacios.png',
        fullPage: true
      });
    });

    await test.step('Intentar login con campos vacíos', async () => {
      await loginPage.login(loginData.borde.usuario, loginData.borde.password);
      await page.screenshot({
        path: 'reports/screenshots/02-campos-vacios-submit.png',
        fullPage: true
      });
    });

    await test.step('Validar que muestra validación de formulario', async () => {
      // Validar que permanece en login (no navega)
      const estaEnLogin = await loginPage.estaEnLogin();
      expect(estaEnLogin).toBe(true);
      
      // Validar que la URL no cambia
      await expect(page).toHaveURL(/login|auth|signin|^\/$|^\/$/i);
      
      await page.screenshot({
        path: 'reports/screenshots/03-validacion-formulario.png',
        fullPage: true
      });
    });
  });

});
