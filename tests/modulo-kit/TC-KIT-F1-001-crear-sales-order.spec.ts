import { test, expect } from '../../src/fixtures/base.fixture';
import { AuthTasks } from '../../src/tasks/AuthTasks';
import { SalesOrderEntryPage } from '../../src/pages/SalesOrderEntryPage';
import { ENV } from '../../src/utils/envConfig';
import kitData from '../../src/data/kit-salesorder-data.json';
import * as fs from 'fs';
import * as path from 'path';

/**
 * TC-KIT-F1-001 — Crear Sales Order con productos KIT
 *
 * Flujo:
 *   Login → Sales → New → Order Entry
 *   → Ingresar Customer y P.O. No.
 *   → Agregar 2 productos KIT via Quick Search (CBAT-N475 y BQMX-XG19)
 *   → Ingresar Boxes y FOB Price a cada línea
 *   → Guardar y obtener el Order No. generado
 *
 * Precondición:
 *   - Productos CBAT-N475 y BQMX-XG19 existen en el catálogo del ambiente ALPHA
 *   - Usuario con acceso a módulo Sales
 */
test.describe('TC-KIT-F1 — Sales Order Entry con producto KIT', () => {

  test('TC-KIT-F1-001 — Crear Sales Order exitosa con dos productos KIT', async ({ page }) => {
    test.setTimeout(180000); // 3 minutos — flujo completo con productos KIT
    const auth        = new AuthTasks(page);
    const salesPage   = new SalesOrderEntryPage(page);
    const datos       = kitData.exitoso;

    // ── Step 1: Login ───────────────────────────────────────────────────────
    await test.step('Login en el ambiente ALPHA', async () => {
      await auth.login(ENV.usuario, ENV.password);
      await page.screenshot({
        path: 'reports/screenshots/TC-KIT-F1-001-01-login.png',
        fullPage: true
      });
    });

    // ── Step 2: Navegar a Sales Order Entry ─────────────────────────────────
    await test.step('Navegar a Sales → New → Order Entry', async () => {
      await salesPage.navegarAOrderEntry();
      await page.screenshot({
        path: 'reports/screenshots/TC-KIT-F1-001-02-modulo-cargado.png',
        fullPage: true
      });
    });

    // ── Step 3: Validar formulario cargado ──────────────────────────────────
    await test.step('Validar que el formulario Sales - Order Entry cargó', async () => {
      const cargado = await salesPage.estaFormularioCargado();
      expect(cargado).toBe(true);
    });

    // ── Step 4: Llenar cabecera ─────────────────────────────────────────────
    await test.step(`Ingresar Customer: ${datos.customer}`, async () => {
      await salesPage.ingresarCustomer(datos.customer);
      await page.screenshot({
        path: 'reports/screenshots/TC-KIT-F1-001-03-customer.png',
        fullPage: true
      });
    });

    await test.step('Ingresar Shipping Date (mañana)', async () => {
      const manana = new Date();
      manana.setDate(manana.getDate() + 1);
      await salesPage.ingresarShippingDate(manana);
      await page.screenshot({
        path: 'reports/screenshots/TC-KIT-F1-001-03b-shipping-date.png',
        fullPage: true
      });
    });

    await test.step(`Ingresar P.O. No.: ${datos.poNo}`, async () => {
      await salesPage.ingresarPONo(datos.poNo);
      await page.screenshot({
        path: 'reports/screenshots/TC-KIT-F1-001-03c-po-no.png',
        fullPage: true
      });
    });

    await test.step('Seleccionar Carrier', async () => {
      await salesPage.seleccionarCarrier();
      await page.screenshot({
        path: 'reports/screenshots/TC-KIT-F1-001-03d-carrier.png',
        fullPage: true
      });
    });

    // ── Step 5: Agregar primer producto KIT ─────────────────────────────────
    await test.step(`Agregar producto KIT 1: ${datos.productos[0].codigo}`, async () => {
      await salesPage.agregarProductoPorQuickSearch(datos.productos[0].codigo);
      await page.screenshot({
        path: 'reports/screenshots/TC-KIT-F1-001-04-producto1-agregado.png',
        fullPage: true
      });
    });

    // ── Step 6: Agregar segundo producto KIT ────────────────────────────────
    await test.step(`Agregar producto KIT 2: ${datos.productos[1].codigo}`, async () => {
      await salesPage.agregarProductoPorQuickSearch(datos.productos[1].codigo);
      await page.screenshot({
        path: 'reports/screenshots/TC-KIT-F1-001-05-producto2-agregado.png',
        fullPage: true
      });
    });

    // ── Step 7: Ingresar Boxes a las dos líneas ──────────────────────────────
    await test.step(`Ingresar Boxes: ${datos.productos[0].boxes} a línea 1`, async () => {
      await salesPage.ingresarBoxes(1, datos.productos[0].boxes);
    });

    await test.step(`Ingresar Boxes: ${datos.productos[1].boxes} a línea 2`, async () => {
      await salesPage.ingresarBoxes(2, datos.productos[1].boxes);
    });

    // ── Step 8: Ingresar FOB Price a las dos líneas ──────────────────────────
    await test.step(`Ingresar FOB Price: ${datos.productos[0].fobPrice} a línea 1`, async () => {
      await salesPage.ingresarFOBPrice(1, datos.productos[0].fobPrice);
    });

    await test.step(`Ingresar FOB Price: ${datos.productos[1].fobPrice} a línea 2`, async () => {
      await salesPage.ingresarFOBPrice(2, datos.productos[1].fobPrice);
      await page.screenshot({
        path: 'reports/screenshots/TC-KIT-F1-001-06-precios-ingresados.png',
        fullPage: true
      });
    });

    // ── Step 8: Guardar la orden ─────────────────────────────────────────────
    let orderNo = '';

    await test.step('Guardar la Sales Order', async () => {
      orderNo = await salesPage.guardarOrden();
      await page.screenshot({
        path: 'reports/screenshots/TC-KIT-F1-001-06-orden-guardada.png',
        fullPage: true
      });
    });

    // ── Step 9: Validaciones y persistencia ─────────────────────────────────
    await test.step('Validar que se generó un Order No.', async () => {
      console.log(`✅ Order No. generado: ${orderNo}`);
      expect(orderNo).not.toBe('');
      expect(orderNo).not.toBe('New Order');
    });

    await test.step('Guardar Order No. en shared-state para el siguiente test', async () => {
      const sharedPath = path.join(process.cwd(), 'src', 'data', 'shared-state.json');
      fs.writeFileSync(sharedPath, JSON.stringify({ lastOrderNo: orderNo }, null, 2));
      console.log(`✅ Order No. ${orderNo} guardado en shared-state.json`);
    });
  });

});
