import { test, expect } from '../../src/fixtures/base.fixture';
import { AuthTasks } from '../../src/tasks/AuthTasks';
import { ProductionReportingPage } from '../../src/pages/ProductionReportingPage';
import produccionData from '../../src/data/kit-production-data.json';
import * as fs from 'fs';
import * as path from 'path';

const datos  = produccionData.produccionKIT;
const formula = produccionData.produccionKIT.formulaBunches;

test.describe('TC-KIT-F3-003 — Fórmula Bunches: suma componentes × Boxes = Bunches header', () => {

  test('Bunches Total = Boxes × suma de Bunches por componente en pantalla de detalle', async ({ page }) => {
    test.setTimeout(120000);

    const auth = new AuthTasks(page);
    const pr   = new ProductionReportingPage(page);

    // Leer WO finalizada desde shared-state
    const sharedPath = path.join(process.cwd(), 'src', 'data', 'shared-state.json');
    const sharedState = JSON.parse(fs.readFileSync(sharedPath, 'utf-8'));
    const woNo = sharedState.lastWorkOrderFinished;

    expect(woNo, 'WO finalizada no encontrada. Ejecutar TC-KIT-F2-005 primero.').toBeTruthy();
    console.log(`📋 Usando WO No. finalizada: ${woNo}`);

    // ── Paso 1–11: flujo idéntico a F3-001 hasta llegar a la pantalla de detalle ──
    await auth.login(
      process.env.ALPHA_USER ?? 'qaauto',
      process.env.ALPHA_PASS ?? 'qaauto'
    );
    await pr.navegarAProductionReporting();
    await pr.filtrarPorCustomer(datos.customerFiltro);
    await pr.clickSearch();
    await pr.expandirFila(0);
    await pr.expandirFila(0);
    await pr.expandirTodosLosProductos();
    await pr.seleccionarWorkOrderEnProducto(woNo, datos.productoKIT.nombre);
    await pr.clickStartReporting();

    // ── Paso 12: Verificar pantalla de detalle cargada ───────────────────────
    // La espera se hace dentro de clickStartReporting — si llegamos aquí la pantalla cargó
    console.log('✅ Pantalla de detalle cargada — leyendo valores');


    // ── Paso 13: Leer Boxes y Bunches del header ─────────────────────────────
    const boxesHeader   = await pr.obtenerBoxesDelHeader();
    const bunchesHeader = await pr.obtenerBunchesDelHeader();

    console.log(`📊 Header — Boxes: ${boxesHeader} | Bunches: ${bunchesHeader}`);

    expect(boxesHeader, 'Boxes del header debe ser mayor que 0').toBeGreaterThan(0);
    expect(bunchesHeader, 'Bunches del header debe ser mayor que 0').toBeGreaterThan(0);

    // ── Paso 14: Leer Bunches de todos los componentes ───────────────────────
    const bunchesPorComponente = await pr.obtenerBunchesPorComponente();

    console.log(`📊 Bunches por componente: [${bunchesPorComponente.join(', ')}]`);

    expect(bunchesPorComponente.length, 'Debe haber al menos 1 componente').toBeGreaterThan(0);

    // ── Paso 15: Validar fórmula R-06 (dinámica) ─────────────────────────────
    // Regla: suma(bunchesComponentes) × boxes = bunchesHeader
    // La validación es dinámica — funciona con cualquier WO y cantidad de cajas
    const sumaBunches = bunchesPorComponente.reduce((acc, b) => acc + b, 0);
    const bunchesCalculados = sumaBunches * boxesHeader;

    console.log(`📐 Fórmula: ${sumaBunches} bunches/caja × ${boxesHeader} cajas = ${bunchesCalculados}`);
    console.log(`📐 Bunches header: ${bunchesHeader}`);

    expect(
      bunchesCalculados,
      `Suma componentes (${sumaBunches}) × Boxes (${boxesHeader}) = ${bunchesCalculados} debe ser igual a Bunches header (${bunchesHeader})`
    ).toBe(bunchesHeader);

    // ── Paso 16: Validar cantidad mínima de componentes ──────────────────────
    expect(
      bunchesPorComponente.length,
      `Debe haber al menos ${formula.componentesEsperados.length} componentes`
    ).toBeGreaterThanOrEqual(formula.componentesEsperados.length);

    // ── Paso 17: Validar suma esperada de bunches por caja ───────────────────
    // La suma de bunches por caja es constante (definida en la receta del KIT)
    // independientemente de cuántas cajas tenga el WO
    expect(
      sumaBunches,
      `Suma de Bunches por caja debe ser ${formula.sumaBunchesEsperada} (constante de la receta)`
    ).toBe(formula.sumaBunchesEsperada);

    console.log(`✅ Fórmula válida: ${sumaBunches} bunches/caja × ${boxesHeader} cajas = ${bunchesCalculados} = ${bunchesHeader}`);
  });

});
