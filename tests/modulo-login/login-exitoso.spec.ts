import { test, expect } from '../../src/fixtures/base.fixture';
import { LoginPage } from '../../src/pages/LoginPage';
import { DashboardPage } from '../../src/pages/DashboardPage';
import loginData from '../../src/data/loginData.json';

test.describe('Módulo Login — Autenticación de usuarios', () => {

  test('Login exitoso con credenciales válidas', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await test.step('Navegar a la URL del ambiente activo', async () => {
      await loginPage.navegarAlInicio();
      await page.screenshot({
        path: 'reports/screenshots/01-pagina-login.png',
        fullPage: true
      });
    });

    await test.step('Ingresar credenciales válidas', async () => {
      await loginPage.login(loginData.exitoso.usuario, loginData.exitoso.password);
      await page.screenshot({
        path: 'reports/screenshots/02-credenciales-ingresadas.png',
        fullPage: true
      });
    });

    await test.step('Validar acceso al Dashboard', async () => {
      // Validar que la URL contiene 'dashboard'
      await expect(page).toHaveURL(/dashboard|home|inicio/i);
      
      // Validar que el Dashboard está visible
      await expect(dashboardPage.contenedorPrincipal).toBeVisible();
      
      await page.screenshot({
        path: 'reports/screenshots/03-dashboard-cargado.png',
        fullPage: true
      });
    });

    await test.step('Validar nombre de usuario en bienvenida', async () => {
      const nombreUsuario = await dashboardPage.obtenerNombreUsuario();
      expect(nombreUsuario).toBeTruthy();
      expect(nombreUsuario.length).toBeGreaterThan(0);
      
      await page.screenshot({
        path: 'reports/screenshots/04-validacion-usuario.png',
        fullPage: true
      });
    });
  });

});
