import { test as base, expect } from '@playwright/test';
import { verificarConexion } from '../utils/dbHelper';
import { ENV } from '../utils/envConfig';

/**
 * Fixture base que extiende el test de Playwright
 * 
 * Proporciona setup y teardown automático para todos los tests:
 * - beforeAll: Verifica conexión a BD
 * - beforeEach: Log del test que inicia
 * - afterEach: Screenshot en caso de fallo
 * - afterAll: Limpieza de recursos
 * 
 * IMPORTANTE: Los tests deben importar { test, expect } desde este archivo,
 * nunca directamente de @playwright/test
 */

/**
 * Hook beforeAll — se ejecuta una vez antes de todos los tests del archivo
 */
base.beforeAll(async () => {
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`🌸 WebFlowers QA Automation — Ambiente: ${ENV.ambiente}`);
  console.log(`   URL: ${ENV.url}`);
  console.log(`   BD: ${ENV.db.nombre}`);
  console.log(`${'═'.repeat(80)}\n`);

  // Verificar conexión a la base de datos del ambiente activo
  try {
    await verificarConexion();
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error);
    console.error(`\n${mensaje}\n`);
    // Marcar el test como fallido si no hay conexión a BD
    base.fail(true, 'No se pudo conectar a la base de datos. Verifica las credenciales en .env');
  }
});

/**
 * Hook beforeEach — se ejecuta antes de cada test individual
 */
base.beforeEach(async ({ }, testInfo) => {
  const timestamp = new Date().toISOString();
  console.log(`\n▶️  [${timestamp}] — Iniciando: ${testInfo.title}`);
});

/**
 * Hook afterEach — se ejecuta después de cada test individual
 */
base.afterEach(async ({ page }, testInfo) => {
  const timestamp = new Date().toISOString();
  
  // Capturar screenshot si el test falló
  if (testInfo.status !== testInfo.expectedStatus) {
    console.log(`❌ [${timestamp}] — Test fallido: ${testInfo.title}`);
    
    const screenshotPath = `reports/screenshots/FAILED-${testInfo.title.replace(/[^a-z0-9]/gi, '-')}.png`;
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
    
    console.log(`   Screenshot guardado: ${screenshotPath}`);
  } else {
    console.log(`✅ [${timestamp}] — Test exitoso: ${testInfo.title}`);
  }
});

/**
 * Hook afterAll — se ejecuta una vez después de todos los tests del archivo
 */
base.afterAll(async () => {
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`🏁 Suite finalizada — ${ENV.ambiente}`);
  console.log(`${'═'.repeat(80)}\n`);
});

/**
 * Exportar test y expect extendidos
 * 
 * Los specs deben importar desde aquí:
 * import { test, expect } from '../fixtures/base.fixture';
 */
export const test = base;
export { expect };
