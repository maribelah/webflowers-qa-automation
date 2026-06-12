import { test, expect } from '../../src/fixtures/base.fixture';
import { AuthTasks } from '../../src/tasks/AuthTasks';
import { ProductionReportingPage } from '../../src/pages/ProductionReportingPage';
import produccionData from '../../src/data/kit-production-data.json';
import * as fs from 'fs';
import * as path from 'path';

const datos = produccionData.produccionKIT;

test.describe('TC-KIT-F3-001 — KIT visible en Production Reporting tras WO FINISHED', () => {

  test('KIT aparece en Production Reporting, WO seleccionada y Start Reporting exitoso', async ({ page }) => {
    test.setTimeout(120000);

    const auth = new AuthTasks(page);
    const pr   = new ProductionReportingPage(page);

    // Leer WO No. desde shared-state (generado y finalizado por TC-KIT-F2-005)
    const sharedPath = path.join(process.cwd(), 'src', 'data', 'shared-state.json');
    const sharedState = JSON.parse(fs.readFileSync(sharedPath, 'utf-8'));
    const woNo = sharedState.lastWorkOrderFinished;

    expect(woNo, 'WO No. finalizada no encontrada. Ejecutar TC-KIT-F2-005 primero.').toBeTruthy();
    console.log(`📋 Usando WO No. finalizada: ${woNo}`);

    // ── Paso 1: Login ────────────────────────────────────────────────────────
    await auth.login(
      process.env.ALPHA_USER ?? 'qaauto',
      process.env.ALPHA_PASS ?? 'qaauto'
    );

    // ── Paso 2: Navegar a Inventory → Tools → Production Reporting ──────────
    await pr.navegarAProductionReporting();

    // ── Paso 3: Filtrar por Customer y buscar ────────────────────────────────
    await pr.filtrarPorCustomer(datos.customerFiltro);
    await pr.clickSearch();

    // ── Paso 4: Expandir Customer ────────────────────────────────────────────
    await pr.expandirFila(0);

    // ── Paso 5: Expandir Task (House Made) ───────────────────────────────────
    await pr.expandirFila(0);

    // ── Paso 6: Verificar que el KIT EASTER GROWER PALLET es visible ─────────
    const ordenVisible = await pr.ordenEsVisible(datos.productoKIT.nombre);
    expect(ordenVisible, `"${datos.productoKIT.nombre}" debe estar visible en el grid`).toBe(true);

    // ── Paso 7: Verificar WOs pendientes para el KIT ─────────────────────────
    // El formato "(0/N)" confirma que hay WOs en estado FINISHED disponibles para reportar.
    const tieneWOsPendientes = await pr.ordenEsVisible(`${datos.productoKIT.nombre} (0/`);
    expect(tieneWOsPendientes, `${datos.productoKIT.nombre} debe tener WOs pendientes`).toBe(true);

    // ── Paso 8: Expandir TODOS los Product Names para ver los WOs ────────────
    await pr.expandirTodosLosProductos();

    // ── Paso 9: Verificar que el WO finalizado aparece en el grid ────────────
    const woVisible = await pr.ordenEsVisible(woNo);
    expect(woVisible, `WO "${woNo}" debe estar visible en la sub-tabla de productos`).toBe(true);

    // ── Paso 10: Seleccionar (checkear) el WO en la sección EASTER GROWER PALLET
    await pr.seleccionarWorkOrderEnProducto(woNo, datos.productoKIT.nombre);

    // ── Paso 11: Click Start Reporting ────────────────────────────────────────
    await pr.clickStartReporting();

    // ── Resultado esperado: pantalla de detalle del reporte cargada ───────────
    const reporteCargado = await pr.estaVistaReporteCargada();
    expect(reporteCargado, 'La pantalla de detalle del reporte debe cargar tras Start Reporting').toBe(true);
  });

});
