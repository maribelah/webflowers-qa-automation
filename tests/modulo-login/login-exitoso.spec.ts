import { test, expect } from '../../src/fixtures/base.fixture';
import { LoginPage } from '../../src/pages/LoginPage';
import { DashboardPage } from '../../src/pages/DashboardPage';
import { ENV } from '../../src/utils/envConfig';

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
      await loginPage.login(ENV.usuario, ENV.password);
      await page.screenshot({
        path: 'reports/screenshots/02-credenciales-ingresadas.png',
        fullPage: true
      });
    });

    await test.step('Validar acceso al Dashboard', async () => {
      const mensajeError = await loginPage.obtenerMensajeErrorVisible();
      expect(
        mensajeError,
        `La aplicacion rechazo las credenciales configuradas para ${ENV.ambiente}: ${mensajeError}`
      ).toBeNull();

      await expect(dashboardPage.txtWFLabel).toBeVisible({ timeout: 15000 });
      await expect(dashboardPage.headerLogoContainer).toBeVisible({ timeout: 15000 });

      await page.screenshot({
        path: 'reports/screenshots/03-dashboard-cargado.png',
        fullPage: true
      });
    });

    await test.step('Validar nombre de usuario en bienvenida', async () => {
      const nombreUsuario = await dashboardPage.obtenerNombreUsuario();
      test.info().annotations.push({
        type: 'usuario-dashboard',
        description: nombreUsuario || 'No se encontro etiqueta de usuario visible en el dashboard'
      });
      
      await page.screenshot({
        path: 'reports/screenshots/04-validacion-usuario.png',
        fullPage: true
      });
    });
  });

});
