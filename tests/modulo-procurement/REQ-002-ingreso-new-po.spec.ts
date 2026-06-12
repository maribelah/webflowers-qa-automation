import { test, expect } from '../../src/fixtures/base.fixture';
import { LoginPage } from '../../src/pages/LoginPage';
import { DashboardPage } from '../../src/pages/DashboardPage';
import { NewPurchaseOrderPage } from '../../src/pages/NewPurchaseOrderPage';
import datos from '../../src/data/REQ-002-data.json';

test.describe('Módulo Procurement — Ingreso a New Purchase Order', () => {

  test('REQ-002 — Ingreso exitoso al módulo New Purchase Order', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const newPurchaseOrderPage = new NewPurchaseOrderPage(page);

    await test.step('Navegar a la URL del ambiente activo', async () => {
      await loginPage.navegarAlInicio();
      await page.screenshot({
        path: 'reports/screenshots/REQ-002-01-pagina-login.png',
        fullPage: true
      });
    });

    await test.step('Ingresar credenciales válidas', async () => {
      await loginPage.login(datos.exitoso.usuario, datos.exitoso.password);
      await page.screenshot({
        path: 'reports/screenshots/REQ-002-02-credenciales-ingresadas.png',
        fullPage: true
      });
    });

    await test.step('Validar carga del Dashboard', async () => {
      await expect(dashboardPage.contenedorPrincipal).toBeVisible();
      await page.screenshot({
        path: 'reports/screenshots/REQ-002-03-dashboard-cargado.png',
        fullPage: true
      });
    });

    await test.step('Navegar al módulo New PO desde el menú Procurement', async () => {
      await newPurchaseOrderPage.navigateToNewPurchaseOrder();
      await page.screenshot({
        path: 'reports/screenshots/REQ-002-04-navegacion-menu.png',
        fullPage: true
      });
    });

    await test.step('Validar apertura del formulario New Purchase Order', async () => {
      await newPurchaseOrderPage.validarModuloCargado();
      await page.screenshot({
        path: 'reports/screenshots/REQ-002-05-ventana-abierta.png',
        fullPage: true
      });
    });

  });

});
