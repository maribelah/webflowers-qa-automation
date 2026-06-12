import { test, expect } from '../../src/fixtures/base.fixture';
import { LoginPage } from '../../src/pages/LoginPage';
import { DashboardPage } from '../../src/pages/DashboardPage';
import { SalesOrderEntryPage } from '../../src/pages/SalesOrderEntryPage';
import datos from '../../src/data/REQ-001-data.json';

test.describe('Módulo Sales Order Entry — Acceso desde menú principal', () => {

  test('REQ-001 — Ingreso exitoso al módulo Sales Order Entry', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const salesOrderEntryPage = new SalesOrderEntryPage(page);

    await test.step('Navegar a la URL del ambiente activo', async () => {
      await loginPage.navegarAlInicio();
      await page.screenshot({
        path: 'reports/screenshots/REQ-001-01-pagina-login.png',
        fullPage: true
      });
    });

    await test.step('Ingresar credenciales válidas', async () => {
      await loginPage.login(datos.exitoso.usuario, datos.exitoso.password);
      await page.screenshot({
        path: 'reports/screenshots/REQ-001-02-credenciales-ingresadas.png',
        fullPage: true
      });
    });

    await test.step('Validar carga del Dashboard', async () => {
      await expect(dashboardPage.contenedorPrincipal).toBeVisible();
      await page.screenshot({
        path: 'reports/screenshots/REQ-001-03-dashboard-cargado.png',
        fullPage: true
      });
    });

    await test.step('Navegar al módulo Sales Order Entry desde el menú', async () => {
      await salesOrderEntryPage.navigateToOrderEntry();
      await page.screenshot({
        path: 'reports/screenshots/REQ-001-04-navegacion-menu.png',
        fullPage: true
      });
    });

    await test.step('Validar apertura de ventana Sales-Order Entry', async () => {
      await expect(salesOrderEntryPage.formularioPrincipal).toBeVisible();
      await page.screenshot({
        path: 'reports/screenshots/REQ-001-05-ventana-abierta.png',
        fullPage: true
      });
    });

  });

});