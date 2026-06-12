import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProductionReportingPage extends BasePage {

  constructor(page: Page) {
    super(page);
  }

  // ── Navegación ────────────────────────────────────────────────────────────

  async navegarAProductionReporting(): Promise<void> {
    await this.esperarFrameListo('menu');

    await this.frameMenu
      .locator("//div[@class='div-parent' and @title='Inventory']")
      .click();

    await this.frameMenu
      .locator("//ul[@id='subInventory']//div[@class='div-child' and @title='Tools']")
      .click();

    // Clic en el <a> directo — target="main" navega el iframe center_page
    await this.frameMenu
      .locator("//ul[@id='sub1_Tools_12']//a[contains(@href,'ProductionReporting')]")
      .click();

    await this.esperarCargaModulo(90000);
    await this.frameCenter
      .locator("//md-select-value[@id='select_value_label_0']")
      .waitFor({ state: 'visible', timeout: 90000 });
  }

  // ── Filtros ───────────────────────────────────────────────────────────────

  async filtrarPorCustomer(customer: string): Promise<void> {
    // md-select con ng-model="$ctrl.filters.customersSelected" — click abre el dropdown
    const selectCustomer = this.frameCenter.locator(
      "//md-select[@ng-model='$ctrl.filters.customersSelected']"
    );
    await selectCustomer.waitFor({ state: 'visible', timeout: 15000 });
    await selectCustomer.click();

    const filterInput = this.frameCenter.locator("//input[@ng-model='customersSelectFilter']");
    await filterInput.waitFor({ state: 'visible', timeout: 10000 });
    await filterInput.fill(customer);
    await this.page.waitForTimeout(600);

    const option = this.frameCenter.locator(
      `//md-option[.//span[contains(normalize-space(.),'${customer}')]] | //md-option[contains(normalize-space(.),'${customer}')]`
    );
    await option.first().waitFor({ state: 'visible', timeout: 8000 });
    await option.first().click();

    // md-select multi — cerrar con Escape para quitar el md-backdrop
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(400);
  }

  async clickSearch(): Promise<void> {
    await this.frameCenter
      .locator("//button[@class='mt-3 btn btn-sm btn-outline-primary btn-custom-secondary' and text()='Search']")
      .click();
    await this.esperarCargaModulo(30000);
  }

  // ── Grid — niveles de árbol ───────────────────────────────────────────────

  /** Expande la fila Customer (nivel 0) o Task (nivel 1) usando ag-group-contracted */
  async expandirFila(indice = 0): Promise<void> {
    const iconos = this.frameCenter.locator(
      "//span[contains(@class,'ag-group-contracted') and not(contains(@class,'ag-hidden'))]"
    );
    await iconos.nth(indice).waitFor({ state: 'visible', timeout: 15000 });
    await iconos.nth(indice).click();
    await this.page.waitForTimeout(600);
  }

  /**
   * Expande TODOS los Product Name visibles usando el localizador confirmado por DevTools.
   * Localizador: span.ag-cell-wrapper.ag-cell-expandable.ag-row-group.ag-row-group-indent-0.ng-scope / span[2]
   * span[2] = ag-group-contracted (el botón [+] del Product Name)
   */
  async expandirTodosLosProductos(): Promise<void> {
    const expandButtons = this.frameCenter.locator(
      "//span[@class='ag-cell-wrapper ag-cell-expandable ag-row-group ag-row-group-indent-0 ng-scope']/span[2]"
    );
    const count = await expandButtons.count();
    for (let i = 0; i < count; i++) {
      try {
        await expandButtons.nth(i).click({ force: true });
        await this.page.waitForTimeout(300);
      } catch { /* fila ya expandida o no disponible */ }
    }
    await this.page.waitForTimeout(500);
  }

  /** Verifica que un texto está visible en cualquier celda del grid */
  async ordenEsVisible(valor: string): Promise<boolean> {
    const fila = this.frameCenter.locator(
      `//div[contains(@class,'ag-cell') and contains(normalize-space(.),'${valor}')]`
    );
    return fila.first().isVisible();
  }

  // ── Sub-tabla Work Orders (dentro de cada Product Name expandido) ─────────

  /**
   * Selecciona el checkbox del Work Order con el número dado en la sección del producto indicado.
   * La sub-tabla de WOs aparece debajo de cada Product Name al expandirlo.
   * @param woNo       Número de WO a seleccionar (ej. "108011")
   * @param productName  Texto del Product Name para ubicar la sección correcta
   */
  async seleccionarWorkOrderEnProducto(woNo: string, productName: string): Promise<void> {
    // Buscar la celda que contiene el woNo dentro de la sección del productName.
    // La sub-tabla AG Grid full-width row está anidada bajo la fila del producto.
    // La celda del WO Id tiene el número como texto; su fila tiene un checkbox al inicio.
    const woCell = this.frameCenter.locator(
      `//div[contains(@class,'ag-full-width-row') and preceding-sibling::div[.//span[contains(.,'${productName}')]]]//div[contains(@class,'ag-cell') and normalize-space(.)='${woNo}'] | ` +
      `//div[contains(@class,'ag-row') and .//div[normalize-space(.)='${woNo}']]//div[contains(@class,'ag-cell') and normalize-space(.)='${woNo}']`
    );

    try {
      await woCell.first().waitFor({ state: 'visible', timeout: 10000 });
      // Buscar el checkbox en la misma fila del WO
      const woRow = woCell.first().locator('xpath=ancestor::div[@role="row"]');
      const checkbox = woRow.locator('input[type="checkbox"]').first();
      await checkbox.check({ force: true });
      await this.page.waitForTimeout(300);
    } catch {
      // Fallback: buscar el checkbox directamente por el WO number visible en pantalla
      await this.seleccionarWorkOrderPorNumero(woNo);
    }
  }

  /**
   * Fallback: selecciona el checkbox del primer WO row que contenga el woNo.
   */
  async seleccionarWorkOrderPorNumero(woNo: string): Promise<void> {
    // La celda WO number está en una sub-tabla; buscar la primera fila con ese número
    const woRow = this.frameCenter.locator(
      `//div[@role='row' and .//div[normalize-space(.)='${woNo}']]`
    ).first();
    await woRow.waitFor({ state: 'visible', timeout: 10000 });
    const checkbox = woRow.locator('input[type="checkbox"]').first();
    await checkbox.check({ force: true });
    await this.page.waitForTimeout(300);
  }

  // ── Start Reporting ───────────────────────────────────────────────────────

  async clickStartReporting(): Promise<void> {
    const btn = this.frameCenter.locator(
      "//button[contains(@class,'btn-primary') and contains(normalize-space(.),'Start Reporting')]"
    );
    await btn.waitFor({ state: 'visible', timeout: 10000 });
    await btn.click();
    // Esperar que el botón "Start Reporting" desaparezca — confirma la navegación al detalle
    await btn.waitFor({ state: 'hidden', timeout: 30000 });
    // Esperar el primer componente del detalle cargado
    await this.frameCenter
      .locator("production-reporting-components-details")
      .first()
      .waitFor({ state: 'attached', timeout: 30000 });
    await this.page.waitForTimeout(500);
  }

  /** Verifica que la pantalla de detalle del reporte está cargada tras Start Reporting */
  async estaVistaReporteCargada(): Promise<boolean> {
    try {
      await this.frameCenter
        .locator('production-reporting-components-details')
        .first()
        .waitFor({ state: 'attached', timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }

  // ── Vista de componentes (después de Start Reporting) ─────────────────────

  /** Verifica que la pantalla de detalle del reporte está cargada tras Start Reporting */
  async estaVistaReporteCargada(): Promise<boolean> {
    return this.frameCenter
      .locator("//div[@class='d-flex justify-content-between align-items-center']")
      .isVisible();
  }

  /** Verifica que la vista de componentes por caja está cargada */
  async estaVistaComponentesCargada(): Promise<boolean> {
    return this.frameCenter
      .locator("//div[contains(text(),'Components per box')]")
      .isVisible();
  }

  // ── Lectura de valores del header (detalle del reporte) ───────────────────

  /**
   * Lee Boxes y Bunches del header leyendo el scope de AngularJS ($ctrl.currentDetail).
   * El controlador de la página de detalle expone currentDetail con Boxes y Bunches.
   */
  private async obtenerHeaderValues(): Promise<{ boxes: number; bunches: number }> {
    const centerFrame = this.page.frame({ name: 'main' });
    if (!centerFrame) return { boxes: 0, bunches: 0 };
    try {
      return await centerFrame.evaluate(() => {
        // Encontrar el elemento con el controlador que tiene $ctrl.currentDetail
        const compEl = document.querySelector('production-reporting-components-details');
        if (!compEl) return { boxes: 0, bunches: 0 };
        // Subir hasta el elemento que tiene el scope del controlador padre
        let el: Element | null = compEl.parentElement;
        while (el) {
          const scope = (window as any).angular?.element(el)?.scope?.();
          if (scope?.$ctrl?.currentDetail) {
            const d = scope.$ctrl.currentDetail;
            return {
              boxes:   Number(d.Boxes   ?? d.boxes   ?? 0),
              bunches: Number(d.Bunches  ?? d.bunches  ?? 0),
            };
          }
          el = el.parentElement;
        }
        return { boxes: 0, bunches: 0 };
      });
    } catch {
      return { boxes: 0, bunches: 0 };
    }
  }

  /** Lee el valor de Boxes del header de la pantalla de detalle */
  async obtenerBoxesDelHeader(): Promise<number> {
    return (await this.obtenerHeaderValues()).boxes;
  }

  /** Lee el valor de Bunches del header de la pantalla de detalle */
  async obtenerBunchesDelHeader(): Promise<number> {
    return (await this.obtenerHeaderValues()).bunches;
  }

  // ── Lectura de componentes (Components per box) ───────────────────────────

  /**
   * Lee el valor de Bunches de cada componente numerado (001, 002, …).
   * Accede al scope de AngularJS directamente en cada elemento del componente.
   */
  async obtenerBunchesPorComponente(): Promise<number[]> {
    const components = this.frameCenter.locator('production-reporting-components-details');
    const count = await components.count();
    const valores: number[] = [];
    for (let i = 0; i < count; i++) {
      const bunches = await components.nth(i).evaluate((el: Element) => {
        const ang = (window as any).angular;
        const isoScope = ang?.element(el)?.isolateScope?.();
        const scope    = ang?.element(el)?.scope?.();
        const val = isoScope?.detail?.Bunches ?? scope?.detail?.Bunches ?? null;
        return val !== null ? Number(val) : null;
      });
      if (bunches !== null) valores.push(bunches as number);
    }
    return valores;
  }

  // ── Add Items (Hardgoods) ─────────────────────────────────────────────────

  async clickAddItems(): Promise<void> {
    await this.frameCenter
      .locator("//button[contains(text(),'Add Items')]")
      .click();
    await this.page.waitForTimeout(1000);
  }

  // ── Report ────────────────────────────────────────────────────────────────

  async clickReport(): Promise<void> {
    await this.frameCenter
      .locator("//button[contains(text(),'Report') and not(contains(text(),'Start'))]")
      .click();
    await this.esperarCargaModulo(30000);
  }
}
