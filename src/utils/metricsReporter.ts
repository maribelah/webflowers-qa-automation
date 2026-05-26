import type {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  TestResult,
  FullResult,
} from '@playwright/test/reporter';
import * as sql from 'mssql';
import { ENV } from './envConfig';

/**
 * Interfaz para el detalle de un caso de prueba
 */
interface TestCaseRow {
  modulo: string;
  nombre: string;
  estado: 'PASSED' | 'FAILED' | 'SKIPPED';
  duracion_seg: number;
  screenshot_path: string | null;
  error_mensaje: string | null;
}

/**
 * Configuración de conexión a la base de datos de métricas (qa_metrics)
 * Esta conexión es independiente del ambiente activo de WebFlowers
 */
const metricsConfig: sql.config = {
  server: ENV.metrics.servidor,
  database: ENV.metrics.bd,
  user: ENV.metrics.usuario,
  password: ENV.metrics.password,
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true,
  },
  pool: {
    max: 5,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

/**
 * Reporter custom de Playwright que persiste los resultados en Azure SQL (qa_metrics)
 * 
 * Niveles de inserción:
 * 1. test_runs → Registro de la ejecución completa del suite
 * 2. test_cases → Detalle de cada caso de prueba
 * 3. coverage_log → Cálculo de cobertura por módulo
 * 
 * Reglas obligatorias:
 * - Nunca lanzar excepciones que detengan Playwright
 * - Siempre cerrar el pool en bloque finally
 * - Usar request().input() con tipos explícitos
 * - El ambiente se registra como campo, no como BD separada
 */
export default class MetricsReporter implements Reporter {
  private casos: TestCaseRow[] = [];
  private inicio: Date = new Date();

  /**
   * Se ejecuta al finalizar cada test individual
   */
  onTestEnd(test: TestCase, result: TestResult): void {
    const modulo = test.parent?.title ?? 'sin-modulo';
    const screenshot = result.attachments
      .find(a => a.name === 'screenshot')?.path ?? null;

    this.casos.push({
      modulo,
      nombre: test.title,
      estado: result.status.toUpperCase() as TestCaseRow['estado'],
      duracion_seg: Math.round(result.duration / 1000),
      screenshot_path: screenshot,
      error_mensaje: result.error?.message ?? null,
    });
  }

  /**
   * Se ejecuta al finalizar toda la suite de pruebas
   * Persiste los resultados en qa_metrics (3 niveles)
   */
  async onEnd(result: FullResult): Promise<void> {
    const duracion = Math.round((Date.now() - this.inicio.getTime()) / 1000);
    const passed = this.casos.filter(c => c.estado === 'PASSED').length;
    const failed = this.casos.filter(c => c.estado === 'FAILED').length;
    const skipped = this.casos.filter(c => c.estado === 'SKIPPED').length;

    let pool: sql.ConnectionPool | null = null;
    try {
      pool = await sql.connect(metricsConfig);

      // ══════════════════════════════════════════════════════════
      // Nivel 1: Insertar el run y obtener su ID
      // ══════════════════════════════════════════════════════════
      const runResult = await pool.request()
        .input('ambiente', sql.VarChar, ENV.ambiente)
        .input('total', sql.Int, this.casos.length)
        .input('passed', sql.Int, passed)
        .input('failed', sql.Int, failed)
        .input('skipped', sql.Int, skipped)
        .input('duracion_seg', sql.Int, duracion)
        .query(`
          INSERT INTO qa_metrics.test_runs
            (ambiente, total, passed, failed, skipped, duracion_seg)
          OUTPUT INSERTED.id
          VALUES (@ambiente, @total, @passed, @failed, @skipped, @duracion_seg)
        `);

      const runId: number = runResult.recordset[0].id;

      // ══════════════════════════════════════════════════════════
      // Nivel 2: Insertar el detalle de cada caso
      // ══════════════════════════════════════════════════════════
      for (const caso of this.casos) {
        await pool.request()
          .input('run_id', sql.Int, runId)
          .input('modulo', sql.VarChar, caso.modulo)
          .input('nombre', sql.VarChar, caso.nombre)
          .input('estado', sql.VarChar, caso.estado)
          .input('duracion_seg', sql.Int, caso.duracion_seg)
          .input('screenshot_path', sql.VarChar, caso.screenshot_path)
          .input('error_mensaje', sql.NVarChar, caso.error_mensaje)
          .query(`
            INSERT INTO qa_metrics.test_cases
              (run_id, modulo, nombre, estado, duracion_seg, screenshot_path, error_mensaje)
            VALUES
              (@run_id, @modulo, @nombre, @estado, @duracion_seg, @screenshot_path, @error_mensaje)
          `);
      }

      // ══════════════════════════════════════════════════════════
      // Nivel 3: Calcular y registrar cobertura por módulo
      // ══════════════════════════════════════════════════════════
      const modulos = [...new Set(this.casos.map(c => c.modulo))];
      for (const modulo of modulos) {
        const casosModulo = this.casos.filter(c => c.modulo === modulo);
        const cubiertos = casosModulo.filter(c => c.estado === 'PASSED').length;
        const porcentaje = parseFloat(((cubiertos / casosModulo.length) * 100).toFixed(2));

        await pool.request()
          .input('run_id', sql.Int, runId)
          .input('modulo', sql.VarChar, modulo)
          .input('casos_cubiertos', sql.Int, cubiertos)
          .input('casos_totales', sql.Int, casosModulo.length)
          .input('porcentaje', sql.Decimal(5, 2), porcentaje)
          .query(`
            INSERT INTO qa_metrics.coverage_log
              (run_id, modulo, casos_cubiertos, casos_totales, porcentaje)
            VALUES
              (@run_id, @modulo, @casos_cubiertos, @casos_totales, @porcentaje)
          `);
      }

      console.log(
        `✅ [qa_metrics] — Run #${runId} registrado en ${ENV.metrics.bd} | ` +
        `${passed} passed / ${failed} failed / ${skipped} skipped`
      );

    } catch (error) {
      // El reporter NUNCA debe interrumpir el flujo de Playwright
      const mensaje = error instanceof Error ? error.message : String(error);
      console.error(
        `⚠️  [qa_metrics] — Error al persistir métricas (no afecta la ejecución).\n` +
        `   Servidor: ${ENV.metrics.servidor}\n` +
        `   Base de datos: ${ENV.metrics.bd}\n` +
        `   Detalle: ${mensaje}`
      );
    } finally {
      if (pool) await pool.close();
    }
  }
}
