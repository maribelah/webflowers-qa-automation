// ============================================================
// src/pages/BasePage.ts
// webflowers-qa-automation
//
// Clase base heredada por todas las Page Classes del proyecto.
// Centraliza los métodos comunes de interacción con la UI:
// navegación, esperas, screenshots, validaciones generales,
// captura de métricas de red y acceso a los iframes de WebFlowers.
//
// Estructura de iframes de WebFlowers CRM:
//
//   MAIN_PAGE
//   ├── iframe #top_Page2     ← header (Search Modules, usuario)
//   ├── iframe #left_page1    ← menú lateral (Sales, Products, etc.)
//   └── div #center
//       └── iframe #center_page  name="main"  ← módulo activo
//
// Todas las Page Classes deben extender BasePage:
//   export class LoginPage extends BasePage { ... }
//
// Acceso a iframes desde cualquier Page Class:
//   this.frameHeader.locator('#inputSearch')
//   this.frameMenu.locator("//div[text()='Sales']")
//   this.frameCenter.locator('#divForm')
// ============================================================

import { Page, Locator, FrameLocator, expect } from '@playwright/test';
import { ENV } from '../utils/envConfig';

export class BasePage {

  // ─────────────────────────────────────────
  // 🖼️ Iframes de WebFlowers CRM
  // ─────────────────────────────────────────
  // Expuestos como protected para que todas las Page Classes
  // los usen directamente sin redeclararlos.

  /** iframe #top_Page2 — Header: Search Modules, nombre de usuario */
  protected readonly frameHeader: FrameLocator;

  /** iframe #left_page1 — Menú lateral: Sales, Products, Inventory, etc. */
  protected readonly frameMenu: FrameLocator;

  /** iframe #center_page — Módulo activo: Sales Order Entry, etc. */
  protected readonly frameCenter: FrameLocator;

  // ─────────────────────────────────────────
  // 🏗️ Constructor
  // ─────────────────────────────────────────
  constructor(protected readonly page: Page) {
    this.frameHeader = page.frameLocator('#top_Page2');
    this.frameMenu   = page.frameLocator('#left_page1');
    this.frameCenter = page.frameLocator('#center_page');
  }


  // ══════════════════════════════════════════
  // 🌐 NAVEGACIÓN
  // ══════════════════════════════════════════

  /**
   * Navega a la URL base del ambiente activo.
   * Equivale a ir a la raíz de la aplicación WebFlowers.
   */
  async navegarAlInicio(): Promise<void> {
    await this.page.goto(ENV.app.url);
    await this.esperarCarga();
  }

  /**
   * Navega a una ruta relativa dentro del ambiente activo.
   * La URL base se toma automáticamente de ENV según el ambiente.
   *
   * @param ruta - Ruta relativa, ej: '/login', '/dashboard', '/inventario'
   *
   * @example
   * await this.navegarA('/login');
   */
  async navegarA(ruta: string): Promise<void> {
    await this.page.goto(`${ENV.app.url}${ruta}`);
    await this.esperarCarga();
  }

  /**
   * Retorna la URL actual de la página.
   * Útil para validaciones de navegación en los tests.
   */
  obtenerURLActual(): string {
    return this.page.url();
  }

  /**
   * Retorna el título actual de la página.
   * Útil para validar que se cargó la pantalla correcta.
   */
  async obtenerTitulo(): Promise<string> {
    return await this.page.title();
  }


  // ══════════════════════════════════════════
  // ⏳ ESPERAS
  // ══════════════════════════════════════════

  /**
   * Espera a que la página complete su carga (networkidle).
   * Se invoca automáticamente al navegar con navegarA() y navegarAlInicio().
   * Invocar manualmente si se navega con page.goto() directamente.
   */
  async esperarCarga(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Espera a que un localizador sea visible en la pantalla.
   * Usar cuando un elemento tarda en aparecer tras una acción.
   *
   * @param localizador - Localizador de Playwright a esperar
   * @param timeout     - Tiempo máximo en ms (por defecto 10000)
   *
   * @example
   * await this.esperarVisible(this.mensajeExito);
   * await this.esperarVisible(this.spinner, 5000);
   */
  async esperarVisible(localizador: Locator, timeout = 10000): Promise<void> {
    await localizador.waitFor({ state: 'visible', timeout });
  }

  /**
   * Espera a que un localizador desaparezca de la pantalla.
   * Útil para esperar que un spinner o modal de carga se cierre.
   *
   * @param localizador - Localizador a esperar que desaparezca
   * @param timeout     - Tiempo máximo en ms (por defecto 10000)
   *
   * @example
   * await this.esperarOculto(this.spinnerCarga);
   */
  async esperarOculto(localizador: Locator, timeout = 10000): Promise<void> {
    await localizador.waitFor({ state: 'hidden', timeout });
  }

  /**
   * Espera a que la URL actual contenga el fragmento indicado.
   * Útil para confirmar redirecciones después de acciones críticas.
   *
   * @param fragmento - Texto que debe estar contenido en la URL
   * @param timeout   - Tiempo máximo en ms (por defecto 10000)
   *
   * @example
   * await this.esperarURL('/dashboard');
   */
  async esperarURL(fragmento: string, timeout = 10000): Promise<void> {
    await this.page.waitForURL(`**${fragmento}**`, { timeout });
  }


  // ══════════════════════════════════════════
  // 🖼️ MANEJO DE IFRAMES
  // ══════════════════════════════════════════

  /**
   * Espera a que un iframe de WebFlowers esté adjunto al DOM
   * y listo para interactuar con sus elementos internos.
   *
   * Usar siempre antes de la primera interacción con cada frame
   * en el flujo del test — especialmente después del login.
   *
   * @param frame - 'header' | 'menu' | 'center'
   * @param timeout - Tiempo máximo en ms (por defecto 15000)
   *
   * @example
   * await this.esperarFrameListo('menu');
   * await this.frameMenu.locator("//div[text()='Sales']").click();
   */
  async esperarFrameListo(
    frame: 'header' | 'menu' | 'center',
    timeout = 15000
  ): Promise<void> {
    const selectores: Record<string, string> = {
      header: 'iframe#top_Page2',
      menu:   'iframe#left_page1',
      center: 'iframe#center_page',
    };
    await this.page.waitForSelector(
      selectores[frame],
      { state: 'attached', timeout }
    );
  }

  /**
   * Espera a que el módulo activo en frameCenter termine de cargar.
   * Usar después de navegar a un módulo desde el menú.
   * El frameCenter siempre es #center_page — solo cambia el src interno.
   *
   * @param timeout - Tiempo máximo en ms (por defecto 20000)
   *
   * @example
   * await salesPage.navigateToOrderEntry();
   * await this.esperarCargaModulo();
   * // Ahora los elementos del módulo están disponibles en frameCenter
   */
  async esperarCargaModulo(timeout = 20000): Promise<void> {
    await this.page.waitForSelector(
      'iframe#center_page',
      { state: 'attached', timeout }
    );
    // WebFlowers mantiene conexiones activas permanentemente —
    // no usar networkidle. Esperar que el iframe esté visible es suficiente.
    await this.page.waitForSelector(
      'iframe#center_page',
      { state: 'visible', timeout }
    );
  }

  /**
   * Toma un screenshot de la pantalla completa y lo guarda
   * en la carpeta de screenshots del reporte.
   *
   * Convención de nombre: '[secuencia]-[descripcion].png'
   * Ejemplo: '01-pagina-login.png', '03-dashboard-cargado.png'
   *
   * @param nombre - Nombre del archivo sin extensión
   *
   * @example
   * await this.tomarScreenshot('01-pagina-login');
   * await this.tomarScreenshot('02-credenciales-ingresadas');
   */
  async tomarScreenshot(nombre: string): Promise<void> {
    await this.page.screenshot({
      path: `reports/screenshots/${nombre}.png`,
      fullPage: true,
    });
  }

  /**
   * Toma un screenshot de un elemento específico de la pantalla.
   * Útil para capturar mensajes de error, tablas o secciones concretas.
   *
   * @param localizador - Elemento a capturar
   * @param nombre      - Nombre del archivo sin extensión
   *
   * @example
   * await this.tomarScreenshotElemento(this.mensajeError, '03-error-login');
   */
  async tomarScreenshotElemento(localizador: Locator, nombre: string): Promise<void> {
    await localizador.screenshot({
      path: `reports/screenshots/${nombre}.png`,
    });
  }


  // ══════════════════════════════════════════
  // ✅ VALIDACIONES GENERALES
  // ══════════════════════════════════════════

  /**
   * Valida que la URL actual contenga el fragmento indicado.
   * Wrapper de expect para usar directamente en test.step().
   *
   * @param fragmento - Texto esperado en la URL
   *
   * @example
   * await this.validarURL('/dashboard');
   */
  async validarURL(fragmento: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(fragmento));
  }

  /**
   * Valida que el título de la página sea exactamente el esperado.
   *
   * @param titulo - Título exacto esperado
   *
   * @example
   * await this.validarTitulo('WebFlowers — Dashboard');
   */
  async validarTitulo(titulo: string): Promise<void> {
    await expect(this.page).toHaveTitle(titulo);
  }

  /**
   * Valida que un localizador sea visible en la pantalla.
   *
   * @param localizador - Elemento que debe estar visible
   *
   * @example
   * await this.validarVisible(this.mensajeBienvenida);
   */
  async validarVisible(localizador: Locator): Promise<void> {
    await expect(localizador).toBeVisible();
  }

  /**
   * Valida que un localizador NO sea visible en la pantalla.
   *
   * @param localizador - Elemento que NO debe estar visible
   *
   * @example
   * await this.validarOculto(this.mensajeError);
   */
  async validarOculto(localizador: Locator): Promise<void> {
    await expect(localizador).toBeHidden();
  }

  /**
   * Valida que un localizador contenga el texto esperado.
   *
   * @param localizador - Elemento a validar
   * @param texto       - Texto esperado (parcial o exacto)
   *
   * @example
   * await this.validarTexto(this.mensajeBienvenida, 'Juan David');
   */
  async validarTexto(localizador: Locator, texto: string): Promise<void> {
    await expect(localizador).toContainText(texto);
  }

  /**
   * Valida que un campo de formulario tenga el valor esperado.
   *
   * @param localizador - Input a validar
   * @param valor       - Valor esperado en el campo
   *
   * @example
   * await this.validarValorCampo(this.inputUsuario, 'qaauto');
   */
  async validarValorCampo(localizador: Locator, valor: string): Promise<void> {
    await expect(localizador).toHaveValue(valor);
  }


  // ══════════════════════════════════════════
  // 📡 MÉTRICAS DE RED
  // ══════════════════════════════════════════

  /**
   * Captura las métricas de rendimiento de la página actual.
   * Retorna los tiempos del ciclo de vida de carga registrados
   * por el navegador (Navigation Timing API).
   *
   * Invocar después de navegarA() o navegarAlInicio() para
   * registrar el tiempo de carga de cada pantalla en el reporte.
   *
   * @returns Objeto con los tiempos de carga en milisegundos
   *
   * @example
   * await this.navegarA('/login');
   * const metricas = await this.capturarMetricasRed();
   * console.log(`Tiempo de carga: ${metricas.tiempoCarga}ms`);
   */
  async capturarMetricasRed(): Promise<MetricasRed> {
    const timing = await this.page.evaluate(() => {
      const t = window.performance.timing;
      return {
        tiempoCarga:      t.loadEventEnd - t.navigationStart,
        tiempoDOMReady:   t.domContentLoadedEventEnd - t.navigationStart,
        tiempoServidor:   t.responseEnd - t.requestStart,
        tiempoConexion:   t.connectEnd - t.connectStart,
      };
    });

    return timing;
  }

}

// ─────────────────────────────────────────
// 📐 Interfaces
// ─────────────────────────────────────────

/** Tiempos de carga capturados desde la Navigation Timing API del navegador */
export interface MetricasRed {
  /** Tiempo total desde la navegación hasta el evento load (ms) */
  tiempoCarga: number;
  /** Tiempo hasta que el DOM estuvo listo (ms) */
  tiempoDOMReady: number;
  /** Tiempo de respuesta del servidor (ms) */
  tiempoServidor: number;
  /** Tiempo de establecimiento de conexión TCP (ms) */
  tiempoConexion: number;
}