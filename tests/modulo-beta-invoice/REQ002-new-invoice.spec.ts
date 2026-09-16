import { test, expect } from '../../src/fixtures/base.fixture';
import type { Page } from '@playwright/test';
import { REQ002NewInvoicePage } from '../../src/pages/REQ002-NewInvoicePage';
import { AuthTasks } from '../../src/tasks/AuthTasks';
import { BetaInvoiceTasks } from '../../src/tasks/BetaInvoiceTasks';
import { ENV } from '../../src/utils/envConfig';

type PasoAccion = () => Promise<void>;

test.describe('Modulo BETA Invoice - REQ002 New Invoice', () => {
  test('REQ002 - Generar invoice de comercializadora', async ({ page }, testInfo) => {
    test.setTimeout(180000);

    const authTasks = new AuthTasks(page);
    const betaInvoiceTasks = new BetaInvoiceTasks(page);
    const newInvoicePage = new REQ002NewInvoicePage(page);
    const customerCode = 'CF90008';
    const customerName = 'LOCAL CASH SALE - CALIFORNIA';
    const carrierName = 'AAE - ARM AIR EXPRESS';
    const betaInvoiceUrl = ENV.url.replace(/\/\(S\([^)]+\)\)/i, '');
    const evidencia: string[] = [];
    let addInventoryAbierto = false;
    let addInventoryPage: Page | null = null;

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
        `Ambiente=${ENV.ambiente}; URL=${betaInvoiceUrl}`,
        async () => {
          await authTasks.loginEnUrl(betaInvoiceUrl, ENV.usuario, ENV.password);
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
        await page.screenshot({
          path: 'reports/screenshots/REQ002-01-invoices-desplegado.png',
          fullPage: false
        });
      });

      await registrarPaso('Hacer clic en New y esperar opciones', 'Opcion Invoice visible', async () => {
        await betaInvoiceTasks.desplegarNew();
        await expect(newInvoicePage.opcionInvoice.first()).toBeVisible({ timeout: 15000 });
        await page.screenshot({
          path: 'reports/screenshots/REQ002-02-new-desplegado.png',
          fullPage: false
        });
      });

      await registrarPaso('Hacer clic en Invoice', 'Pantalla New Invoice solicitada', async () => {
        await betaInvoiceTasks.abrirInvoice();
        await page.screenshot({
          path: 'reports/screenshots/REQ002-03-invoice-click.png',
          fullPage: false
        });
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
          await page.screenshot({
            path: 'reports/screenshots/REQ002-04-validaciones-new-invoice.png',
            fullPage: false
          });
        }
      );

      await registrarPaso(`Ingresar customer ${customerCode} y seleccionar ${customerName}`, 'Customer seleccionado', async () => {
        await newInvoicePage.seleccionarCustomerLocalCashSale(customerCode);
        await page.screenshot({
          path: 'reports/screenshots/REQ002-05-customer-seleccionado.png',
          fullPage: false
        });
      });

      await registrarPaso('Seleccionar (Others) en cmbCarriers', 'Modal Carrier Select esperado', async () => {
        await newInvoicePage.seleccionarCarrierOthers();
        await page.screenshot({
          path: 'reports/screenshots/REQ002-06-carrier-others-seleccionado.png',
          fullPage: false
        });
      });

      await registrarPaso('Validar modal Carrier Select', 'Modal visible', async () => {
        await expect(newInvoicePage.modalCarrierSelect.first()).toBeVisible({ timeout: 30000 });
        await page.screenshot({
          path: 'reports/screenshots/REQ002-07-modal-carrier-select.png',
          fullPage: false
        });
      });

      await registrarPaso(`Seleccionar carrier ${carrierName}`, 'Carrier modal seleccionado', async () => {
        await newInvoicePage.seleccionarCarrierAAEArmAirExpress();
        testInfo.annotations.push({
          type: 'carrier-seleccionado',
          description: carrierName
        });
        await page.screenshot({
          path: 'reports/screenshots/REQ002-08-carrier-aae-seleccionado.png',
          fullPage: false
        });
      });

      await registrarPaso('Hacer clic en btnInventory y validar Add Inventory', 'Pestana Add Inventory abierta', async () => {
        addInventoryPage = await newInvoicePage.abrirAddInventory();
        await newInvoicePage.validarAddInventoryAbierto(addInventoryPage);
        addInventoryAbierto = true;
        await addInventoryPage.screenshot({
          path: 'reports/screenshots/REQ002-09-add-inventory-abierto.png',
          fullPage: false
        });
      });

      await registrarPaso('Seleccionar Inventory Types S StandingOrders', 'Inventory Type=S StandingOrders', async () => {
        if (!addInventoryPage) {
          throw new Error('La pestana Add Inventory no esta disponible para seleccionar Inventory Types.');
        }

        await newInvoicePage.seleccionarInventoryTypeStandingOrders(addInventoryPage);
        await addInventoryPage.screenshot({
          path: 'reports/screenshots/REQ002-10-standingorders-seleccionado.png',
          fullPage: false
        });
      });

      await registrarPaso('Seleccionar Locations F Florida', 'Location=F Florida', async () => {
        if (!addInventoryPage) {
          throw new Error('La pestana Add Inventory no esta disponible para seleccionar Locations.');
        }

        await newInvoicePage.seleccionarLocationFlorida(addInventoryPage);
        await addInventoryPage.screenshot({
          path: 'reports/screenshots/REQ002-11-florida-seleccionado.png',
          fullPage: false
        });
      });
    } finally {
      const cuerpo = [
        '# Evidencia REQ002 - Generar invoice de comercializadora',
        '',
        `Ambiente: ${ENV.ambiente}`,
        `URL: ${betaInvoiceUrl}`,
        `Customer: ${customerCode} - ${customerName}`,
        `Carrier: ${carrierName}`,
        `Add Inventory abierto: ${addInventoryAbierto ? 'Si' : 'No'}`,
        '',
        '## Paso a paso',
        ...evidencia.map((linea, index) => `${index + 1}. ${linea}`)
      ].join('\n');

      await testInfo.attach('REQ002-evidencia-flujo.md', {
        body: Buffer.from(cuerpo, 'utf-8'),
        contentType: 'text/markdown'
      });
    }
  });
});
