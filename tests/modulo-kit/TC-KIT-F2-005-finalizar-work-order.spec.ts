// tests/modulo-kit/TC-KIT-F2-005-finalizar-work-order.spec.ts
// webflowers-qa-automation

import { test, expect } from '../../src/fixtures/base.fixture';
import { AuthTasks } from '../../src/tasks/AuthTasks';
import { ListWorkOrdersPage } from '../../src/pages/ListWorkOrdersPage';
import { ENV } from '../../src/utils/envConfig';
import * as fs from 'fs';
import * as path from 'path';

/**
 * TC-KIT-F2-005 — Finalizar Work Order (STARTED → FINISHED)
 * Requerimiento: RC Margin
 *
 * Precondición: TC-KIT-F2-001 debe haberse ejecutado previamente.
 * El WO No. se lee automáticamente desde shared-state.json.
 *
 * Flujo:
 *   Login → Production → Work Orders → List
 *   → Buscar WO No. → Edit → Finish
 *   → Aceptar popup WARNING → Aceptar popup de éxito
 *   → Validar marca de agua FINISHED
 *
 * Resultado esperado: El sistema finaliza exitosamente la Work Order
 */
test.describe('Módulo Work Orders List — Finalizar Work Order', () => {

  test('TC-KIT-F2-005 — Finalizar Work Order exitosamente (STARTED → FINISHED)', async ({ page }) => {
    test.setTimeout(180000); // 3 min — incluye 65 s de espera obligatoria entre Start y Finish

    const auth        = new AuthTasks(page);
    const listWOPage  = new ListWorkOrdersPage(page);

    // Leer WO No. desde shared-state (generado por TC-KIT-F2-001)
    const sharedPath = path.join(process.cwd(), 'src', 'data', 'shared-state.json');
    const sharedState = JSON.parse(fs.readFileSync(sharedPath, 'utf-8'));
    const woNo = sharedState.lastWorkOrderNo;

    expect(woNo, 'WO No. no encontrado. Ejecutar TC-KIT-F2-001 primero.').toBeTruthy();
    console.log(`📋 Usando WO No.: ${woNo}`);

    // ── Step 1: Login ───────────────────────────────────────────────────────
    await test.step('Login en el ambiente activo', async () => {
      await auth.login(ENV.usuario, ENV.password);
      await page.screenshot({ path: 'reports/screenshots/TC-KIT-F2-005-01-login.png', fullPage: true });
    });

    // ── Step 2: Navegar a Production → Work Orders → List ───────────────────
    await test.step('Navegar a Production → Work Orders → List', async () => {
      await listWOPage.navegarAListWorkOrders();
      await page.screenshot({ path: 'reports/screenshots/TC-KIT-F2-005-02-modulo-cargado.png', fullPage: true });
    });

    // ── Step 3: Validar módulo cargado ──────────────────────────────────────
    await test.step('Validar formulario Work Orders List cargado', async () => {
      const cargado = await listWOPage.estaFormularioCargado();
      expect(cargado).toBe(true);
    });

    // ── Step 4: Buscar WO por número ────────────────────────────────────────
    await test.step(`Ingresar WO No. ${woNo} en Search Text y buscar`, async () => {
      await listWOPage.buscarWO(woNo);
      await page.screenshot({ path: 'reports/screenshots/TC-KIT-F2-005-03-resultado-busqueda.png', fullPage: true });
    });

    // ── Step 5: Abrir en modo edición ────────────────────────────────────────
    await test.step('Clic en Edit — abrir formulario de la WO', async () => {
      await listWOPage.abrirEdicion();
      await page.screenshot({ path: 'reports/screenshots/TC-KIT-F2-005-04-formulario-wo.png', fullPage: true });
    });

    // ── Step 6: Finalizar WO ─────────────────────────────────────────────────
    // WebFlowers exige ≥ 1 minuto entre Start y Finish — esperar 65 segundos
    await test.step('Esperar 65 s (WebFlowers exige ≥ 1 min entre Start y Finish)', async () => {
      console.log('⏳ Esperando 65 segundos antes de Finish...');
      await page.waitForTimeout(65000);
      console.log('✅ Espera completada — procediendo a Finish');
    });

    await test.step('Clic en Finish — aceptar popup WARNING y popup de éxito', async () => {
      await listWOPage.finalizarWorkOrder();
      await page.screenshot({ path: 'reports/screenshots/TC-KIT-F2-005-05-wo-finalizada.png', fullPage: true });
    });

    // ── Step 7: Validar marca de agua FINISHED ───────────────────────────────
    await test.step('Validar marca de agua FINISHED visible en el formulario', async () => {
      const finished = await listWOPage.estaFinished();
      expect(finished, 'La marca de agua FINISHED no apareció — la WO puede no haberse finalizado').toBe(true);
      console.log(`✅ WO No. ${woNo} finalizada exitosamente`);
    });

    // ── Step 8: Persistir estado ─────────────────────────────────────────────
    await test.step('Guardar estado FINISHED en shared-state para Production Reporting', async () => {
      const state = JSON.parse(fs.readFileSync(sharedPath, 'utf-8'));
      state.lastWorkOrderFinished = woNo;
      fs.writeFileSync(sharedPath, JSON.stringify(state, null, 2));
      console.log(`✅ WO No. ${woNo} marcada como FINISHED en shared-state.json`);
    });
  });

});
