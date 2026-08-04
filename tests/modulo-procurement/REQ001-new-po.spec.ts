import { test, expect } from '../../src/fixtures/base.fixture';
import { DashboardPage } from '../../src/pages/DashboardPage';
import { REQ001NewPOPage } from '../../src/pages/REQ001-NewPOPage';
import { AuthTasks } from '../../src/tasks/AuthTasks';
import { ProcurementTasks } from '../../src/tasks/ProcurementTasks';
import { ENV } from '../../src/utils/envConfig';

test.describe('Modulo Procurement - REQ001 New PO', () => {
  test('REQ001 - Ingresar a New PO', async ({ page }) => {
    const authTasks = new AuthTasks(page);
    const dashboardPage = new DashboardPage(page);
    const procurementTasks = new ProcurementTasks(page);
    const newPOPage = new REQ001NewPOPage(page);

    await test.step('Navegar a la URL del ambiente activo e iniciar sesion', async () => {
      await authTasks.login(ENV.usuario, ENV.password);
      await page.screenshot({
        path: 'reports/screenshots/REQ001-01-login-ejecutado.png',
        fullPage: true
      });
    });

    await test.step('Validar que el dashboard haya cargado', async () => {
      await expect(dashboardPage.txtWFLabel).toBeVisible({ timeout: 15000 });
      await expect(dashboardPage.headerLogoContainer).toBeVisible({ timeout: 15000 });
      await page.screenshot({
        path: 'reports/screenshots/REQ001-02-dashboard-cargado.png',
        fullPage: true
      });
    });

    await test.step('Navegar por menu lateral a Procurement, Products y New PO', async () => {
      await procurementTasks.navegarANewPOProducts();
      await page.screenshot({
        path: 'reports/screenshots/REQ001-03-new-po-cargado.png',
        fullPage: true
      });
    });

    await test.step('Validar encabezado y elementos visibles de New Purchase Order', async () => {
      await expect(newPOPage.encabezadoNewPO).toBeVisible({ timeout: 30000 });
      await expect(newPOPage.campoVendor.first()).toBeVisible({ timeout: 15000 });
      await expect(newPOPage.campoOrderType.first()).toBeVisible({ timeout: 15000 });
      await expect(newPOPage.campoDueDate.first()).toBeVisible({ timeout: 15000 });
      await expect(newPOPage.campoStorage.first()).toBeVisible({ timeout: 15000 });
      await expect(newPOPage.btnSave.first()).toBeVisible({ timeout: 15000 });

      await page.screenshot({
        path: 'reports/screenshots/REQ001-04-validaciones-new-po.png',
        fullPage: true
      });
    });
  });
});
