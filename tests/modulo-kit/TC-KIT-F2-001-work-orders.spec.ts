import { test, expect } from '../../src/fixtures/base.fixture';
import { AuthTasks } from '../../src/tasks/AuthTasks';
import { WorkOrdersPage } from '../../src/pages/WorkOrdersPage';
import { ENV } from '../../src/utils/envConfig';
import woData from '../../src/data/kit-workorders-data.json';
import * as fs from 'fs';
import * as path from 'path';

/**
 * TC-KIT-F2-001 — Crear Work Orders e inicio de WO
 * Requerimiento: RC Margin
 *
 * Precondición: TC-KIT-F1-001 debe haberse ejecutado previamente.
 * El Order No. se lee automáticamente desde shared-state.json.
 *
 * Flujo:
 *   Login → Production → Work Orders → New
 *   → Add → buscar por Order No. → ingresar cajas → Add to WO
 *   → Assign To → seleccionar grupo → Save (popup OK) → Start (popup OK)
 *
 * Resultado esperado: El sistema guarda e inicia exitosamente una orden de trabajo
 */
test.describe('TC-KIT-F2 — Work Orders e inicio de WO', () => {

  test('TC-KIT-F2-001 — Crear Work Orders e inicio de WO', async ({ page }) => {
    test.setTimeout(300000); // 5 min — incluye hasta 15 reintentos de Start en ALPHA

    const auth   = new AuthTasks(page);
    const woPage = new WorkOrdersPage(page);

    // Leer Order No. desde shared-state (generado por TC-KIT-F1-001)
    const sharedPath = path.join(process.cwd(), 'src', 'data', 'shared-state.json');
    const sharedState = JSON.parse(fs.readFileSync(sharedPath, 'utf-8'));
    const orderNo = sharedState.lastOrderNo || woData.exitoso.orderNoSalesOrder;

    expect(orderNo, 'Order No. no encontrado. Ejecutar TC-KIT-F1-001 primero.').not.toBe('');
    console.log(`📋 Usando Order No.: ${orderNo}`);

    // ── Step 1: Login ───────────────────────────────────────────────────────
    await test.step('Login en el ambiente ALPHA', async () => {
      await auth.login(ENV.usuario, ENV.password);
      await page.screenshot({ path: 'reports/screenshots/TC-KIT-F2-001-01-login.png', fullPage: true });
    });

    // ── Step 2: Navegar a Production → Work Orders → New ────────────────────
    await test.step('Navegar a Production → Work Orders → New', async () => {
      await woPage.navegarANewWorkOrder();
      await page.screenshot({ path: 'reports/screenshots/TC-KIT-F2-001-02-modulo-cargado.png', fullPage: true });
    });

    // ── Step 3: Validar formulario cargado ──────────────────────────────────
    await test.step('Validar formulario New/Edit Work Order cargado', async () => {
      const cargado = await woPage.estaFormularioCargado();
      expect(cargado).toBe(true);
    });

    // ── Step 4: Abrir Search Order Lines ────────────────────────────────────
    await test.step('Clic en Add — abrir Search Order Lines', async () => {
      await woPage.abrirSearchOrderLines();
      await page.screenshot({ path: 'reports/screenshots/TC-KIT-F2-001-03-search-order-lines.png', fullPage: true });
    });

    // ── Step 5: Buscar por Order No. ────────────────────────────────────────
    await test.step(`Buscar Order No.: ${orderNo}`, async () => {
      await woPage.buscarLineasOrden(orderNo, woData.exitoso.dateToOffset);
      // Esperar que la grilla muestre el primer input — ALPHA puede tardar hasta 45s
      await page.frameLocator('#center_page').locator("//input[@id='txtToAdd0']")
        .waitFor({ state: 'visible', timeout: 45000 });
      await page.screenshot({ path: 'reports/screenshots/TC-KIT-F2-001-04-resultados-busqueda.png', fullPage: true });
    });

    // ── Step 6: Ingresar cajas ───────────────────────────────────────────────
    // txtToAdd# llegan disabled — evaluate quita el atributo, pone el valor y dispara onblur
    await test.step(`Ingresar cajas línea 1: ${woData.exitoso.boxesLinea1}`, async () => {
      const input0 = page.frameLocator('#center_page').locator("//input[@id='txtToAdd0']");
      // txtBoxesToAdd_onclick usa window.event (IE-style) — mockear antes de llamar
      await input0.evaluate((el: HTMLInputElement) => {
        (window as any).event = { cancelBubble: false, returnValue: true, srcElement: el };
        const onclick = (window as any).txtBoxesToAdd_onclick;
        if (typeof onclick === 'function') try { onclick(); } catch (_) { /* ignorar */ }
        delete (window as any).event;
      });
      await expect(input0).toBeEnabled({ timeout: 10000 });
      await input0.fill(String(woData.exitoso.boxesLinea1));
    });

    await test.step(`Ingresar cajas línea 2: ${woData.exitoso.boxesLinea2}`, async () => {
      const input1 = page.frameLocator('#center_page').locator("//input[@id='txtToAdd1']");
      await input1.evaluate((el: HTMLInputElement) => {
        (window as any).event = { cancelBubble: false, returnValue: true, srcElement: el };
        const onclick = (window as any).txtBoxesToAdd_onclick;
        if (typeof onclick === 'function') try { onclick(); } catch (_) { /* ignorar */ }
        delete (window as any).event;
      });
      await expect(input1).toBeEnabled({ timeout: 10000 });
      await input1.fill(String(woData.exitoso.boxesLinea2));
      await page.screenshot({ path: 'reports/screenshots/TC-KIT-F2-001-05-cajas-ingresadas.png', fullPage: true });
    });

    // ── Step 7: Add to WO ───────────────────────────────────────────────────
    await test.step('Clic en Add to WO', async () => {
      await woPage.agregarAWO();
      await page.screenshot({ path: 'reports/screenshots/TC-KIT-F2-001-06-lineas-agregadas.png', fullPage: true });
    });

    // ── Step 8: Volver al formulario ────────────────────────────────────────
    await test.step('Clic en Back to Order', async () => {
      await woPage.volverAOrden();
      await page.screenshot({ path: 'reports/screenshots/TC-KIT-F2-001-07-back-to-order.png', fullPage: true });
    });

    // ── Step 9: Assign To ───────────────────────────────────────────────────
    await test.step('Abrir pestaña Assign To', async () => {
      await woPage.abrirTabAssignTo();
      await page.screenshot({ path: 'reports/screenshots/TC-KIT-F2-001-08-assign-to.png', fullPage: true });
    });

    await test.step('Seleccionar primer grupo de producción', async () => {
      await woPage.seleccionarGrupoProduccion(1);
    });

    // ── Step 10: Guardar WO ──────────────────────────────────────────────────
    let woNo = '';

    await test.step('Guardar Work Order', async () => {
      woNo = await woPage.guardarWorkOrder();
      console.log(`✅ Work Order creada: ${woNo}`);
      await page.screenshot({ path: 'reports/screenshots/TC-KIT-F2-001-09-wo-guardada.png', fullPage: true });
    });

    // ── Step 11: Start WO con verificación real de estado ───────────────────
    // Retry-loop directo en el spec — espera 3s por dialog (kds2 tarda >1500ms).
    // No usa iniciarWorkOrder para evitar conflictos de dialog handlers.
    await test.step('Iniciar Work Order (Start) — con verificación de estado STARTED', async () => {
      const frameCenter  = page.frameLocator('#center_page');
      const btnStart     = frameCenter.locator("//input[@id='btnStart']");
      const btnFinish    = frameCenter.locator("//input[@id='btnFinish']");
      const lblWO        = frameCenter.locator("//span[@id='lblWorkOrderNumber']");
      const MAX_INTENTOS = 15;
      let started        = false;

      for (let idx = 1; idx <= MAX_INTENTOS && !started; idx++) {
        // Desde intento 2, cambiar grupo antes de reintentar
        if (idx > 1) {
          console.log(`🔄 Cambiando grupo a índice ${idx} antes de reintentar Start...`);
          await woPage.abrirTabAssignTo();
          await woPage.seleccionarGrupoProduccion(idx);
          // Drenar cualquier dialog tardío antes de registrar el handler de Save
          await page.waitForTimeout(1500);
          try {
            await woPage.guardarWorkOrder();
          } catch (e: any) {
            if (e.message?.includes('already handled')) {
              console.warn(`⚠️  Dialog tardío en guardar ignorado (intento ${idx})`);
            } else {
              throw e;
            }
          }
          await page.waitForTimeout(1500);
        }

        // Limpiar handlers huérfanos de la iteración anterior antes de registrar el nuevo
        page.removeAllListeners('dialog');

        console.log(`▶️  Start directo intento ${idx}/${MAX_INTENTOS}...`);
        let dialogMsg = '';
        page.once('dialog', async dialog => {
          dialogMsg = dialog.message();
          console.log(`💬 Dialog Start: ${dialogMsg.substring(0, 80)}`);
          await dialog.accept().catch(() => { /* ignorar si ya fue manejado */ });
        });

        await btnStart.click();
        await page.waitForTimeout(2500); // 2.5s — balance ALPHA/BETA/kds2

        started = await btnFinish.isVisible();

        if (started) {
          const txt = await lblWO.textContent().catch(() => '');
          if (txt?.trim()) woNo = txt.trim();
          console.log(`✅ WO ${woNo} en estado STARTED (intento ${idx})`);
        } else {
          console.warn(`⚠️  Start rechazado en intento ${idx}: "${dialogMsg.substring(0, 80)}"`);
        }
      }

      expect(started, `❌ WO ${woNo} no pudo iniciarse tras ${MAX_INTENTOS} intentos`).toBe(true);
      await page.screenshot({ path: 'reports/screenshots/TC-KIT-F2-001-10-wo-iniciada.png', fullPage: true });
    });

    // ── Step 12: Validar WO No. generado ─────────────────────────────────────
    await test.step('Validar que se generó un Work Order No.', async () => {
      console.log(`✅ Work Order No.: ${woNo}`);
      expect(woNo).not.toBe('');
    });

    // ── Step 13: Guardar WO No. en shared-state ──────────────────────────────
    await test.step('Guardar WO No. en shared-state para el siguiente test', async () => {
      const state = JSON.parse(fs.readFileSync(sharedPath, 'utf-8'));
      state.lastWorkOrderNo = woNo;
      fs.writeFileSync(sharedPath, JSON.stringify(state, null, 2));
      console.log(`✅ Work Order No. ${woNo} guardado en shared-state.json`);
    });
  });

});
