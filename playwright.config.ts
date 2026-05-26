import { defineConfig, devices } from '@playwright/test';
import { ENV } from './src/utils/envConfig';

/**
 * Configuración de Playwright para WebFlowers QA Automation
 * 
 * Decisiones de diseño:
 * - ADR-004: Ejecución secuencial (fullyParallel: false, workers: 1) por ambientes compartidos
 * - Reporters en orden: line → allure → metricsReporter
 * - Screenshots y videos solo en fallos para optimizar espacio
 */
export default defineConfig({
  testDir: './tests',
  
  /* Ejecución secuencial por ambientes compartidos (ADR-004) */
  fullyParallel: false,
  workers: 1,
  
  /* Timeouts */
  timeout: 60_000, // 60 segundos por test
  
  /* Sin reintentos automáticos */
  retries: 0,
  
  /* Reporters en orden exacto */
  reporter: [
    ['line'],
    ['allure-playwright', { 
      resultsDir: 'reports/allure-results',
      detail: true,
      suiteTitle: true
    }],
    ['./src/utils/metricsReporter.ts']
  ],

  /* Configuración global de ejecución */
  use: {
    /* Screenshots solo en fallos */
    screenshot: 'only-on-failure',
    
    /* Video solo en fallos */
    video: 'retain-on-failure',
    
    /* Trazas en primer reintento */
    trace: 'on-first-retry',
    
    /* Ignorar errores SSL solo en ALPHA */
    ignoreHTTPSErrors: ENV.ignoreSSL,
    
    /* Timeout de navegación */
    navigationTimeout: 30000,
    
    /* Timeout de acciones */
    actionTimeout: 15000,
  },

  /* Proyecto de pruebas */
  projects: [
    {
      name: 'WebFlowers CRM',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },
  ],
});
