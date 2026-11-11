import { crearRegistroPasos } from '../../src/utils/stepEvidence';
import { writeEvidence } from '../../src/utils/evidence';
import { test, expect } from '../../src/fixtures/base.fixture';
import type { Page, Request } from '@playwright/test';
import { REQ002NewInvoicePage } from '../../src/pages/REQ002-NewInvoicePage';
import { AuthTasks } from '../../src/tasks/AuthTasks';
import { BetaInvoiceTasks } from '../../src/tasks/BetaInvoiceTasks';
import { ENV } from '../../src/utils/envConfig';
import { cargarPOParaInvoice } from '../../src/utils/purchaseOrderData';

test.describe('Modulo BETA Invoice - REQ002 New Invoice', () => {
  test('REQ002 - Generar invoice de comercializadora', async ({ page }, testInfo) => {
    test.setTimeout(240000);

    const authTasks = new AuthTasks(page);
    const betaInvoiceTasks = new BetaInvoiceTasks(page);
    const newInvoicePage = new REQ002NewInvoicePage(page);
    const customerCode = 'CF90008';
    const customerName = 'LOCAL CASH SALE - CALIFORNIA';
    const carrierName = 'AAE - ARM AIR EXPRESS';
    const invoiceData = cargarPOParaInvoice(ENV.ambiente, ENV.urlPO);
    const numeroPO = invoiceData.numeroPO;
    const betaInvoiceUrl = ENV.urlInvoice;
    const evidencia: string[] = [];
    const red: object[] = [];
    const solicitudes = new Map<Request, number>();
    const respuestasPendientes: Promise<void>[] = [];
    let numeroInvoice = '';
    let addInventoryAbierto = false;
    let addInventoryPage: Page | null = null;

    const registrarPaso = crearRegistroPasos(evidencia);

    try {
      await registrarPaso(
        'Navegar a la URL del ambiente activo e iniciar sesion',
        `Ambiente=${ENV.ambiente}; URL=${betaInvoiceUrl}`,
        async () => {
          await authTasks.loginEnUrl(betaInvoiceUrl, ENV.usuario, ENV.password);
          page.context().on('request', request => {
            if (['xhr', 'fetch'].includes(request.resourceType())) solicitudes.set(request, Date.now());
          });
          page.context().on('response', response => {
            const request = response.request();
            const inicio = solicitudes.get(request);
            if (!inicio) return;
            const tarea = (async () => {
              const ruta = new URL(response.url()).pathname.replace(/\/\(S\([^)]+\)\)/i, '');
              let mensaje: string | undefined;
              if (/save|ExecuteCommandStream/i.test(ruta)) {
                const body = await response.text();
                if (/The wait operation timed out/i.test(body)) mensaje = 'The wait operation timed out';
                else if (/execution timeout expired/i.test(body)) mensaje = 'Execution Timeout Expired';
              }
              red.push({ ruta, metodo: request.method(), estado: response.status(), duracionMs: Date.now() - inicio, mensaje });
            })().catch(error => { red.push({ diagnostico: String(error) }); });
            respuestasPendientes.push(tarea);
          });
          page.context().on('requestfailed', request => {
            if (!solicitudes.has(request)) return;
            red.push({ ruta: new URL(request.url()).pathname.replace(/\/\(S\([^)]+\)\)/i, ''), error: request.failure()?.errorText });
          });
        }
      );

      await registrarPaso('Validar que el dashboard haya cargado', 'Favorites e icono star visibles en menu lateral', async () => {
        await newInvoicePage.esperarDashboardConMenu();
        await expect(newInvoicePage.menuFavorites).toBeVisible({ timeout: 45000 });
        await expect(newInvoicePage.iconoFavorites.first()).toBeVisible({ timeout: 15000 });
      });

      await registrarPaso('Hacer clic en Invoices una sola vez y esperar despliegue', 'data-target=#subInvoices visible', async () => {
        await betaInvoiceTasks.desplegarInvoices();
        await expect(newInvoicePage.submenuInvoices).toBeVisible({ timeout: 15000 });
        await expect(newInvoicePage.menuNew.first()).toBeVisible({ timeout: 15000 });
      });

      await registrarPaso('Hacer clic en New y esperar opciones', 'Opcion Invoice visible', async () => {
        await betaInvoiceTasks.desplegarNew();
        await expect(newInvoicePage.opcionInvoice.first()).toBeVisible({ timeout: 15000 });
      });

      await registrarPaso('Hacer clic en Invoice', 'Pantalla New Invoice solicitada', async () => {
        await betaInvoiceTasks.abrirInvoice();
      });

      await registrarPaso(
        'Validar que cargue correctamente la pagina Invoice',
        'Loader progessContainer desaparece y header Invoicing visible',
        async () => {
          await newInvoicePage.esperarCargaNewInvoice();
          await expect(newInvoicePage.encabezadoNewInvoice.first()).toBeVisible({ timeout: 30000 });
          await expect(newInvoicePage.campoCustomer.first()).toBeVisible({ timeout: 15000 });
          await expect(newInvoicePage.selectCarriers.first()).toBeVisible({ timeout: 15000 });
          await expect(newInvoicePage.btnInventory.first()).toBeVisible({ timeout: 15000 });
        }
      );

      await registrarPaso('Restaurar inventario reservado si aparece User Reserved Lines', 'Restore to inventory y continuar con la nueva factura', async () => {
        const restaurado = await newInvoicePage.restaurarInventarioReservadoSiAparece();
        testInfo.annotations.push({ type: 'inventario-restaurado', description: String(restaurado) });
      });

      await registrarPaso(`Ingresar customer ${customerCode} y seleccionar ${customerName}`, 'Customer seleccionado', async () => {
        await newInvoicePage.seleccionarCustomerLocalCashSale(customerCode);
      });

      await registrarPaso('Seleccionar (Others) en cmbCarriers', 'Modal Carrier Select esperado', async () => {
        await newInvoicePage.seleccionarCarrierOthers();
      });

      await registrarPaso('Validar modal Carrier Select', 'Modal visible', async () => {
        await expect(newInvoicePage.modalCarrierSelect.first()).toBeVisible({ timeout: 30000 });
      });

      await registrarPaso(`Seleccionar carrier ${carrierName}`, 'Carrier modal seleccionado', async () => {
        await newInvoicePage.seleccionarCarrierAAEArmAirExpress();
        testInfo.annotations.push({
          type: 'carrier-seleccionado',
          description: carrierName
        });
      });

      await registrarPaso('Completar P.O. No. con la PO generada en REQ001', `P.O. No.=${numeroPO}`, async () => {
        await newInvoicePage.completarReferencia(numeroPO);
      });

      await registrarPaso('Hacer clic en btnInventory y validar Add Inventory', 'Pestana Add Inventory abierta', async () => {
        addInventoryPage = await newInvoicePage.abrirAddInventory();
        await newInvoicePage.validarAddInventoryAbierto(addInventoryPage);
        addInventoryAbierto = true;
      });

      await registrarPaso('Seleccionar Inventory Types S StandingOrders', 'Inventory Type=S StandingOrders', async () => {
        if (!addInventoryPage) {
          throw new Error('La pestana Add Inventory no esta disponible para seleccionar Inventory Types.');
        }

        await newInvoicePage.seleccionarInventoryTypeStandingOrders(addInventoryPage);
      });

      await registrarPaso('Seleccionar Locations F Florida', 'Location=F Florida', async () => {
        if (!addInventoryPage) {
          throw new Error('La pestana Add Inventory no esta disponible para seleccionar Locations.');
        }

        await newInvoicePage.seleccionarLocationFlorida(addInventoryPage);
      });
      await registrarPaso('Abrir filtro de la columna Slot', 'Menu de SlotNumber visible', async () => {
        if (!addInventoryPage) throw new Error('Add Inventory no disponible.');
        await newInvoicePage.abrirFiltroSlot(addInventoryPage);
      });

      await registrarPaso('Desmarcar (Blanks) del filtro Slot', 'Slots vacios excluidos', async () => {
        if (!addInventoryPage) throw new Error('Add Inventory no disponible.');
        await newInvoicePage.excluirSlotsVacios(addInventoryPage);
      });

      const boxes = [2, 2];
      await registrarPaso('Ingresar Boxes entre 2 y 6', `Boxes=${boxes}`, async () => {
        if (!addInventoryPage) throw new Error('Add Inventory no disponible.');
        await newInvoicePage.ingresarBoxesInventory(addInventoryPage, boxes);
      });
      await registrarPaso('Agregar inventario y volver a Invoice', 'Add to Invoice y Back to Invoice', async () => {
        if (!addInventoryPage) throw new Error('Add Inventory no disponible.');
        await newInvoicePage.agregarInventarioYVolver(addInventoryPage);
      });
      await registrarPaso('Guardar Invoice', `P.O. No.=${numeroPO}; numero de factura asignado`, async () => {
        numeroInvoice = await newInvoicePage.guardarInvoice();
        testInfo.annotations.push({ type: 'invoice-generada', description: numeroInvoice });
        await newInvoicePage.capturarInvoiceGenerado(testInfo, numeroInvoice, numeroPO);
      });
    } catch (error) {
      for (const [index, frame] of page.frames().entries()) {
        writeEvidence(testInfo, `REQ002-main-frame-${index}.html`, await frame.content().catch(() => 'Frame cerrado; contenido no disponible.'));
      }
      const inventoryPage = addInventoryPage as Page | null;
      if (inventoryPage && !inventoryPage.isClosed()) {

        for (const [index, frame] of inventoryPage.frames().entries()) {
          writeEvidence(testInfo, `REQ002-frame-${index}.html`, await frame.content().catch(() => 'Frame cerrado; contenido no disponible.'));
        }
      }
      throw error;
    } finally {
      await Promise.all(respuestasPendientes);
      writeEvidence(testInfo, 'REQ002-red.json', JSON.stringify(red, null, 2));
      const cuerpo = [
        '# Evidencia REQ002 - Generar invoice de comercializadora',
        '',
        `Ambiente: ${ENV.ambiente}`,
        `URL: ${betaInvoiceUrl}`,
        `Customer: ${customerCode} - ${customerName}`,
        `Carrier: ${carrierName}`,
        `Add Inventory abierto: ${addInventoryAbierto ? 'Si' : 'No'}`,
        `Invoice generada: ${numeroInvoice || 'No confirmada'}`,
        `P.O. No.: ${numeroPO}`,
        `Evidencia REQ001: ${invoiceData.evidenciaOrigen}`,
        '',
        '## Paso a paso',
        ...evidencia.map((linea, index) => `${index + 1}. ${linea}`)
      ].join('\n');

      writeEvidence(testInfo, 'REQ002-evidencia-flujo.md', cuerpo);
      await testInfo.attach('REQ002-evidencia-flujo.md', {
        body: Buffer.from(cuerpo, 'utf-8'),
        contentType: 'text/markdown'
      });
    }
  });
});
