import { guardarPOParaInvoice } from '../../src/utils/purchaseOrderData';
import { crearRegistroPasos } from '../../src/utils/stepEvidence';
import { captureEvidence, diagnosticPath, writeEvidence } from '../../src/utils/evidence';
import { test, expect } from '../../src/fixtures/base.fixture';
import { DashboardPage } from '../../src/pages/DashboardPage';
import { REQ001NewPOPage } from '../../src/pages/REQ001-NewPOPage';
import { AuthTasks } from '../../src/tasks/AuthTasks';
import { ProcurementTasks } from '../../src/tasks/ProcurementTasks';
import { ENV } from '../../src/utils/envConfig';

test.describe('Modulo Procurement - REQ001 New PO', () => {
  test('REQ001 - Generar PO', async ({ page }, testInfo) => {
    test.setTimeout(240000);

    const authTasks = new AuthTasks(page);
    const dashboardPage = new DashboardPage(page);
    const procurementTasks = new ProcurementTasks(page);
    const newPOPage = new REQ001NewPOPage(page);
    const integrationCode = 'CBMC-C165';
    const urlInicio = ENV.urlPO;
    const evidencia: string[] = [];
    let numeroPOGuardado = '';

    const registrarPaso = crearRegistroPasos(evidencia);

    try {
      await registrarPaso(
        'Navegar a la URL del ambiente activo e iniciar sesion',
        `Ambiente=${ENV.ambiente}; URL=${ENV.urlPO}`,
        async () => {
          await authTasks.loginEnUrl(urlInicio, ENV.usuarioPO, ENV.passwordPO);
        }
      );

      await registrarPaso('Validar que el dashboard haya cargado', 'Header WebFlowers visible', async () => {
        await expect(dashboardPage.txtWFLabel).toBeVisible({ timeout: 15000 });
        await expect(dashboardPage.headerLogoContainer).toBeVisible({ timeout: 15000 });
      });

      await registrarPaso('Navegar por menu lateral a Procurement, Products y New PO', 'Pantalla New PO abierta', async () => {
        await procurementTasks.navegarANewPOProducts();
      });

      await registrarPaso('Validar encabezado y elementos visibles de New Purchase Order', 'Campos obligatorios disponibles', async () => {
        await expect(newPOPage.encabezadoNewPO).toBeVisible({ timeout: 30000 });
        await expect(newPOPage.campoVendor.first()).toBeVisible({ timeout: 15000 });
        await expect(newPOPage.campoOrderType.first()).toBeVisible({ timeout: 15000 });
        await expect(newPOPage.campoDueDate.first()).toBeVisible({ timeout: 15000 });
        await expect(newPOPage.campoVendorShipmentDate.first()).toBeVisible({ timeout: 15000 });
        await expect(newPOPage.campoStorage.first()).toBeVisible({ timeout: 15000 });
        await expect(newPOPage.btnSave.first()).toBeVisible({ timeout: 15000 });
      });

      await registrarPaso('Seleccionar fecha actual en Due Date y Vendor Shipment Date', 'Fechas del dia cargadas', async () => {
        await newPOPage.seleccionarFechasActuales();
      });

      await registrarPaso('Seleccionar vendor preferido', 'Vendor preferido=HOLEX', async () => {
        const vendorSeleccionado = await newPOPage.seleccionarVendorPreferido('HOLEX');
        testInfo.annotations.push({
          type: 'vendor-seleccionado',
          description: vendorSeleccionado
        });
      });

      await registrarPaso('Seleccionar Quick Search desde cmbAddProduct', 'Modal de busqueda rapida solicitado', async () => {
        await newPOPage.seleccionarQuickSearchEnAddProduct();
      });

      await registrarPaso('Validar modal Search Quick Product', 'Modal visible', async () => {
        await newPOPage.esperarModalSearchQuickProduct();
        await expect(newPOPage.modalSearchQuickProduct.first()).toBeVisible({ timeout: 30000 });
      });

      await registrarPaso('Buscar integration code CBMC-C165 en Search Quick Product', `IntegrationCode=${integrationCode}`, async () => {
        await newPOPage.buscarProductoPorIntegrationCode(integrationCode);
      });

      await registrarPaso('Seleccionar resultado y agregar producto', `Producto agregado=${integrationCode}`, async () => {
        await newPOPage.seleccionarResultadoYAgregar(integrationCode);
      });

      await registrarPaso('Validar integration code en panel inferior', `Panel contiene=${integrationCode}`, async () => {
        await newPOPage.esperarIntegrationCodeEnPanel(integrationCode);
      });

      await registrarPaso('Ingresar boxes valido entre 1 y 8', 'Boxes=6', async () => {
        const boxes = await newPOPage.ingresarBoxes(integrationCode, 6);
        expect(boxes).toBe(6);
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
      });

      await registrarPaso('Seleccionar FOB Location Type valido', 'FOB=Miami, FL', async () => {
        const fobLocationType = await newPOPage.seleccionarFobLocationTypePrimeraLinea(integrationCode, 'Miami, FL');
        testInfo.annotations.push({
          type: 'fob-location-type',
          description: fobLocationType
        });
      });

      await registrarPaso('Guardar Purchase Order y esperar que desaparezca Working', 'Save ejecutado; Working finalizado; PO numerica esperada', async () => {
        numeroPOGuardado = await newPOPage.guardarPOYObtenerNumeroPO();
        expect(numeroPOGuardado).toMatch(/^\d+$/);
        guardarPOParaInvoice(numeroPOGuardado, diagnosticPath(testInfo, 'REQ001-evidencia-flujo.md'), ENV.ambiente, ENV.urlPO);
        testInfo.annotations.push({
          type: 'po-generada',
          description: numeroPOGuardado
        });
      });

      await registrarPaso('Aceptar popup de Purchase Order guardada si aparece', 'Popup opcional aceptado', async () => {
        await newPOPage.aceptarPopupSiEstaVisible();
      });

      await registrarPaso('Validar numero de PO visible contra numero guardado', `PO esperada=${numeroPOGuardado}`, async () => {
        const numeroPOVisible = await newPOPage.obtenerNumeroPOVisible();
        expect(numeroPOVisible).toBe(numeroPOGuardado);
        await captureEvidence(page, testInfo, 'REQ001-po-generada.png');
      });
    } catch (error) {
      for (const [index, frame] of page.frames().entries()) {
        writeEvidence(testInfo, `REQ001-frame-${index}.html`, await frame.content().catch(() => 'Frame no disponible.'));
      }
      throw error;
    } finally {
      const cuerpo = [
        '# Evidencia REQ001 - Generar PO',
        '',
        `Ambiente: ${ENV.ambiente}`,
        `URL: ${ENV.urlPO}`,
        `Integration code: ${integrationCode}`,
        `PO generada: ${numeroPOGuardado || 'No generada'}`,
        '',
        '## Paso a paso',
        ...evidencia.map((linea, index) => `${index + 1}. ${linea}`)
      ].join('\n');

      writeEvidence(testInfo, 'REQ001-evidencia-flujo.md', cuerpo);
      await testInfo.attach('REQ001-evidencia-flujo.md', {
        body: Buffer.from(cuerpo, 'utf-8'),
        contentType: 'text/markdown'
      });
    }
  });
});
