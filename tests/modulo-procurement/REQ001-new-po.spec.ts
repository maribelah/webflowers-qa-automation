import { test, expect } from '../../src/fixtures/base.fixture';
import { DashboardPage } from '../../src/pages/DashboardPage';
import { REQ001NewPOPage } from '../../src/pages/REQ001-NewPOPage';
import { AuthTasks } from '../../src/tasks/AuthTasks';
import { ProcurementTasks } from '../../src/tasks/ProcurementTasks';
import { ENV } from '../../src/utils/envConfig';

type PasoAccion = () => Promise<void>;

test.describe('Modulo Procurement - REQ001 New PO', () => {
  test('REQ001 - Generar PO', async ({ page }, testInfo) => {
    test.setTimeout(180000);

    const authTasks = new AuthTasks(page);
    const dashboardPage = new DashboardPage(page);
    const procurementTasks = new ProcurementTasks(page);
    const newPOPage = new REQ001NewPOPage(page);
    const integrationCode = 'CBMC-C165';
    const evidencia: string[] = [];
    let numeroPOGuardado = '';

    const registrarPaso = async (nombre: string, detalle: string, accion: PasoAccion): Promise<void> => {
      const inicio = Date.now();

      try {
        await test.step(nombre, accion);
        const duracion = ((Date.now() - inicio) / 1000).toFixed(1);
        evidencia.push(`PASS | ${nombre} | ${detalle} | ${duracion}s`);
      } catch (error) {
        const duracion = ((Date.now() - inicio) / 1000).toFixed(1);
        const mensaje = error instanceof Error ? error.message : String(error);
        evidencia.push(`FAIL | ${nombre} | ${detalle} | ${duracion}s | ${mensaje}`);
        throw error;
      }
    };

    try {
      await registrarPaso(
        'Navegar a la URL del ambiente activo e iniciar sesion',
        `Ambiente=${ENV.ambiente}; URL=${ENV.url}`,
        async () => {
          await authTasks.login(ENV.usuario, ENV.password);
          await page.screenshot({
            path: 'reports/screenshots/REQ001-01-login-ejecutado.png',
            fullPage: true
          });
        }
      );

      await registrarPaso('Validar que el dashboard haya cargado', 'Header WebFlowers visible', async () => {
        await expect(dashboardPage.txtWFLabel).toBeVisible({ timeout: 15000 });
        await expect(dashboardPage.headerLogoContainer).toBeVisible({ timeout: 15000 });
        await page.screenshot({
          path: 'reports/screenshots/REQ001-02-dashboard-cargado.png',
          fullPage: true
        });
      });

      await registrarPaso('Navegar por menu lateral a Procurement, Products y New PO', 'Pantalla New PO abierta', async () => {
        await procurementTasks.navegarANewPOProducts();
        await page.screenshot({
          path: 'reports/screenshots/REQ001-03-new-po-cargado.png',
          fullPage: true
        });
      });

      await registrarPaso('Validar encabezado y elementos visibles de New Purchase Order', 'Campos obligatorios disponibles', async () => {
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

      await registrarPaso('Seleccionar fecha actual en Due Date y Vendor Shipment Date', 'Fechas del dia cargadas', async () => {
        await newPOPage.seleccionarFechasActuales();
        await page.screenshot({
          path: 'reports/screenshots/REQ001-05-fechas-actuales.png',
          fullPage: true
        });
      });

      await registrarPaso('Seleccionar vendor preferido', 'Vendor preferido=HOLEX', async () => {
        const vendorSeleccionado = await newPOPage.seleccionarVendorPreferido('HOLEX');
        testInfo.annotations.push({
          type: 'vendor-seleccionado',
          description: vendorSeleccionado
        });
        await page.screenshot({
          path: 'reports/screenshots/REQ001-06-vendor-seleccionado.png',
          fullPage: true
        });
      });

      await registrarPaso('Seleccionar Quick Search desde cmbAddProduct', 'Modal de busqueda rapida solicitado', async () => {
        await newPOPage.seleccionarQuickSearchEnAddProduct();
        await page.screenshot({
          path: 'reports/screenshots/REQ001-07-quick-search-seleccionado.png',
          fullPage: true
        });
      });

      await registrarPaso('Validar modal Search Quick Product', 'Modal visible', async () => {
        await newPOPage.esperarModalSearchQuickProduct();
        await expect(newPOPage.modalSearchQuickProduct.first()).toBeVisible({ timeout: 30000 });
        await page.screenshot({
          path: 'reports/screenshots/REQ001-08-modal-search-quick-product.png',
          fullPage: true
        });
      });

      await registrarPaso('Buscar integration code CBMC-C165 en Search Quick Product', `IntegrationCode=${integrationCode}`, async () => {
        await newPOPage.buscarProductoPorIntegrationCode(integrationCode);
        await page.screenshot({
          path: 'reports/screenshots/REQ001-09-busqueda-integration-code.png',
          fullPage: true
        });
      });

      await registrarPaso('Seleccionar resultado y agregar producto', `Producto agregado=${integrationCode}`, async () => {
        await newPOPage.seleccionarResultadoYAgregar(integrationCode);
        await page.screenshot({
          path: 'reports/screenshots/REQ001-10-producto-agregado.png',
          fullPage: true
        });
      });

      await registrarPaso('Validar integration code en panel inferior', `Panel contiene=${integrationCode}`, async () => {
        await newPOPage.esperarIntegrationCodeEnPanel(integrationCode);
        await page.screenshot({
          path: 'reports/screenshots/REQ001-11-integration-code-panel.png',
          fullPage: true
        });
      });

      await registrarPaso('Ingresar boxes valido entre 1 y 8', 'Boxes=6', async () => {
        const boxes = await newPOPage.ingresarBoxes(integrationCode, 6);
        expect(boxes).toBe(6);
        await page.screenshot({
          path: 'reports/screenshots/REQ001-12-boxes-ingresado.png',
          fullPage: true
        });
      });

      await registrarPaso('Seleccionar customer preferido en la primera linea', 'Customer=10156083-6083 BC TEMPLE WAL-MART', async () => {
        const customerSeleccionado = await newPOPage.seleccionarCustomerPreferidoPrimeraLinea(
          integrationCode,
          '10156083-6083 BC TEMPLE WAL-MART'
        );
        testInfo.annotations.push({
          type: 'customer-seleccionado',
          description: customerSeleccionado
        });
        await page.screenshot({
          path: 'reports/screenshots/REQ001-13-customer-seleccionado.png',
          fullPage: true
        });
      });

      await registrarPaso('Seleccionar FOB Location Type valido', 'FOB=Miami, FL', async () => {
        const fobLocationType = await newPOPage.seleccionarFobLocationTypePrimeraLinea(integrationCode, 'Miami, FL');
        testInfo.annotations.push({
          type: 'fob-location-type',
          description: fobLocationType
        });
        await page.screenshot({
          path: 'reports/screenshots/REQ001-13b-fob-location-type.png',
          fullPage: true
        });
      });

      await registrarPaso('Guardar Purchase Order y esperar que desaparezca Working', 'Save ejecutado; Working finalizado; PO numerica esperada', async () => {
        numeroPOGuardado = await newPOPage.guardarPOYObtenerNumeroPO();
        expect(numeroPOGuardado).toMatch(/^\d+$/);
        testInfo.annotations.push({
          type: 'po-generada',
          description: numeroPOGuardado
        });
        await page.screenshot({
          path: 'reports/screenshots/REQ001-14-po-guardada.png',
          fullPage: true
        });
      });

      await registrarPaso('Aceptar popup de Purchase Order guardada si aparece', 'Popup opcional aceptado', async () => {
        await newPOPage.aceptarPopupSiEstaVisible();
        await page.screenshot({
          path: 'reports/screenshots/REQ001-15-popup-aceptado.png',
          fullPage: true
        });
      });

      await registrarPaso('Validar numero de PO visible contra numero guardado', `PO esperada=${numeroPOGuardado}`, async () => {
        const numeroPOVisible = await newPOPage.obtenerNumeroPOVisible();
        expect(numeroPOVisible).toBe(numeroPOGuardado);
        await page.screenshot({
          path: 'reports/screenshots/REQ001-16-po-visible-validada.png',
          fullPage: true
        });
      });
    } finally {
      const cuerpo = [
        '# Evidencia REQ001 - Generar PO',
        '',
        `Ambiente: ${ENV.ambiente}`,
        `URL: ${ENV.url}`,
        `Integration code: ${integrationCode}`,
        `PO generada: ${numeroPOGuardado || 'No generada'}`,
        '',
        '## Paso a paso',
        ...evidencia.map((linea, index) => `${index + 1}. ${linea}`)
      ].join('\n');

      await testInfo.attach('REQ001-evidencia-flujo.md', {
        body: Buffer.from(cuerpo, 'utf-8'),
        contentType: 'text/markdown'
      });
    }
  });
});
