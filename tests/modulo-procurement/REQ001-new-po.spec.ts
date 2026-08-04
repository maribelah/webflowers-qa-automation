import { test, expect } from '../../src/fixtures/base.fixture';
import { DashboardPage } from '../../src/pages/DashboardPage';
import { REQ001NewPOPage } from '../../src/pages/REQ001-NewPOPage';
import { AuthTasks } from '../../src/tasks/AuthTasks';
import { ProcurementTasks } from '../../src/tasks/ProcurementTasks';
import { ENV } from '../../src/utils/envConfig';

test.describe('Modulo Procurement - REQ001 New PO', () => {
  test('REQ001 - Generar PO', async ({ page }) => {
    const authTasks = new AuthTasks(page);
    const dashboardPage = new DashboardPage(page);
    const procurementTasks = new ProcurementTasks(page);
    const newPOPage = new REQ001NewPOPage(page);
    const integrationCode = 'CBMC-C165';
    let numeroPODelPopup = '';

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
      await expect(newPOPage.campoVendorShipmentDate.first()).toBeVisible({ timeout: 15000 });
      await expect(newPOPage.campoStorage.first()).toBeVisible({ timeout: 15000 });
      await expect(newPOPage.btnSave.first()).toBeVisible({ timeout: 15000 });

      await page.screenshot({
        path: 'reports/screenshots/REQ001-04-validaciones-new-po.png',
        fullPage: true
      });
    });

    await test.step('Seleccionar fecha actual en Due Date y Vendor Shipment Date', async () => {
      await newPOPage.seleccionarFechasActuales();
      await page.screenshot({
        path: 'reports/screenshots/REQ001-05-fechas-actuales.png',
        fullPage: true
      });
    });

    await test.step('Seleccionar vendor aleatoriamente', async () => {
      const vendorSeleccionado = await newPOPage.seleccionarVendorAleatorio();
      test.info().annotations.push({
        type: 'vendor-seleccionado',
        description: vendorSeleccionado
      });

      await page.screenshot({
        path: 'reports/screenshots/REQ001-06-vendor-seleccionado.png',
        fullPage: true
      });
    });

    await test.step('Seleccionar Quick Search desde cmbAddProduct', async () => {
      await newPOPage.seleccionarQuickSearchEnAddProduct();
      await page.screenshot({
        path: 'reports/screenshots/REQ001-07-quick-search-seleccionado.png',
        fullPage: true
      });
    });

    await test.step('Validar modal Search Quick Product', async () => {
      await newPOPage.esperarModalSearchQuickProduct();
      await expect(newPOPage.modalSearchQuickProduct.first()).toBeVisible({ timeout: 30000 });

      await page.screenshot({
        path: 'reports/screenshots/REQ001-08-modal-search-quick-product.png',
        fullPage: true
      });
    });

    await test.step('Buscar integration code CBMC-C165 en Search Quick Product', async () => {
      await newPOPage.buscarProductoPorIntegrationCode(integrationCode);
      await page.screenshot({
        path: 'reports/screenshots/REQ001-09-busqueda-integration-code.png',
        fullPage: true
      });
    });

    await test.step('Seleccionar resultado y agregar producto', async () => {
      await newPOPage.seleccionarResultadoYAgregar(integrationCode);
      await page.screenshot({
        path: 'reports/screenshots/REQ001-10-producto-agregado.png',
        fullPage: true
      });
    });

    await test.step('Validar integration code en panel inferior', async () => {
      await newPOPage.esperarIntegrationCodeEnPanel(integrationCode);
      await page.screenshot({
        path: 'reports/screenshots/REQ001-11-integration-code-panel.png',
        fullPage: true
      });
    });

    await test.step('Ingresar boxes aleatorio entre 1 y 8', async () => {
      const boxes = await newPOPage.ingresarBoxesAleatorio(integrationCode);
      expect(boxes).toBeGreaterThanOrEqual(1);
      expect(boxes).toBeLessThanOrEqual(8);

      await page.screenshot({
        path: 'reports/screenshots/REQ001-12-boxes-ingresado.png',
        fullPage: true
      });
    });

    await test.step('Seleccionar customer aleatorio en la primera linea', async () => {
      const customerSeleccionado = await newPOPage.seleccionarCustomerAleatorioPrimeraLinea(integrationCode);
      test.info().annotations.push({
        type: 'customer-seleccionado',
        description: customerSeleccionado
      });

      await page.screenshot({
        path: 'reports/screenshots/REQ001-13-customer-seleccionado.png',
        fullPage: true
      });
    });

    await test.step('Guardar Purchase Order y validar popup de exito', async () => {
      const mensajePopup = await newPOPage.guardarPOYObtenerMensaje();
      expect(mensajePopup).toContain('Purchase Order saved successfully');

      numeroPODelPopup = newPOPage.extraerNumeroPO(mensajePopup);
      expect(numeroPODelPopup.length).toBeGreaterThan(0);

      test.info().annotations.push({
        type: 'po-popup',
        description: numeroPODelPopup
      });

      await page.screenshot({
        path: 'reports/screenshots/REQ001-14-popup-po-guardada.png',
        fullPage: true
      });
    });

    await test.step('Aceptar popup de Purchase Order guardada', async () => {
      await newPOPage.aceptarPopupSiEstaVisible();
      await page.screenshot({
        path: 'reports/screenshots/REQ001-15-popup-aceptado.png',
        fullPage: true
      });
    });

    await test.step('Validar numero de PO visible contra numero del popup', async () => {
      const numeroPOVisible = await newPOPage.obtenerNumeroPOVisible();
      expect(numeroPOVisible).toBe(numeroPODelPopup);

      await page.screenshot({
        path: 'reports/screenshots/REQ001-16-po-visible-validada.png',
        fullPage: true
      });
    });
  });
});
