import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class SalesOrderEntryPage extends BasePage {

  /** @deprecated usar estaFormularioCargado() */
  readonly formularioPrincipal: Locator;

  constructor(page: Page) {
    super(page);
    this.formularioPrincipal = this.frameCenter.locator('#divForm');
  }

  /** @deprecated usar navegarAOrderEntry() */
  async navigateToOrderEntry(): Promise<void> {
    return this.navegarAOrderEntry();
  }

  // ── Navegación ────────────────────────────────────────────────────────────

  async navegarAOrderEntry(): Promise<void> {
    await this.esperarFrameListo('menu');

    await this.frameMenu
      .locator("//div[@class='div-parent' and @title='Sales']")
      .click();

    await this.frameMenu
      .locator("//ul[@id='subSales']//div[@class='div-child' and @title='New']")
      .click();

    await this.frameMenu
      .locator("//ul[@id='sub1_New_10']//div[@class='div-subchild' and @title='Order Entry']")
      .click();

    // Esperar que el iframe center_page cargue el módulo
    await this.esperarCargaModulo(90000);
    await this.frameCenter
      .locator("//div[@data-label='Sales_Order_Entry']")
      .waitFor({ state: 'visible', timeout: 90000 });
  }

  // ── Validación del formulario ─────────────────────────────────────────────

  async estaFormularioCargado(): Promise<boolean> {
    return this.frameCenter
      .locator("//div[@data-label='Sales_Order_Entry']")
      .isVisible();
  }

  // ── Cabecera de la orden ──────────────────────────────────────────────────

  async ingresarCustomer(customer: string): Promise<void> {
    const input = this.frameCenter.locator("//input[@id='txtCustomer']");
    await input.waitFor({ state: 'visible' });
    await input.click();

    // Escribir solo los primeros caracteres
    await input.pressSequentially("TRADER JOE", { delay: 50 });
    await this.page.waitForTimeout(500);

    // El dropdown tiene dos columnas: Account Number y Account Name
    // Buscamos el div de la segunda columna (Account Name) con el nombre exacto
    const customerOption = this.frameCenter.locator(
      "//div[@class='userDiv userDivLines' and text()=\"TRADER JOE`S F GUESSTIMATES\"]"
    );

    const found = await customerOption.count();
    if (found > 0) {
      // Hacer clic en el div del nombre, que selecciona la fila
      await customerOption.first().click();
    } else {
      throw new Error('No se encontró el customer "TRADER JOE\'S F GUESSTIMATES" en el dropdown');
    }

    // Esperar a que se cierre el dropdown y se procese la selección
    await this.page.waitForTimeout(1000);
  }

  async ingresarPONo(poNo: string): Promise<void> {
    const input = this.frameCenter.locator(
      "//input[@data-ng-model='currentOrder.PONumber' and not(contains(@class,'ng-hide'))]"
    );
    await input.waitFor({ state: 'visible' });
    await input.fill(poNo);
  }

  async ingresarShippingDate(fecha: Date): Promise<void> {
    const input = this.frameCenter.locator(
      "//input[@data-ng-model='currentOrder.DueDate']"
    );
    await input.waitFor({ state: 'visible' });
    // Formato requerido por WebFlowers: MM/DD/YYYY
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const año = fecha.getFullYear();
    const fechaFormato = `${mes}/${dia}/${año}`;
    await input.fill(fechaFormato);
    await input.press('Tab');
  }

  async seleccionarCarrier(): Promise<void> {
    // El select está dentro de un div después del label "Carrier"
    const select = this.frameCenter.locator(
      "//label[@data-label='Carrier']/following-sibling::div//select"
    );
    await select.waitFor({ state: 'visible', timeout: 10000 });

    // Verificar que no esté deshabilitado
    const disabled = await select.isDisabled();
    if (disabled) {
      throw new Error('El Carrier está deshabilitado. El Customer no fue seleccionado correctamente.');
    }

    // Obtener todas las opciones y seleccionar la segunda (primera no vacía)
    const options = await select.locator('option').count();
    if (options > 1) {
      await select.selectOption({ index: 1 });
    }
  }

  // ── Líneas de producto (Quick Search) ────────────────────────────────────

  /**
   * Agrega un producto a la orden usando el flujo Quick Search.
   * Pasos: abrir popup → buscar por código → clic en la fila del resultado → clic en Add
   * @param codigo  Ej: "CBAT-N475" o "BQMX-XG19"
   */
  async agregarProductoPorQuickSearch(codigo: string): Promise<void> {
    // 1. Abrir menú Add Products solo si Quick Search no está ya visible
    const quickSearchOpcion = this.frameCenter.locator("//tr[@data-ng-click='addProductFromQuickSearch()']");
    const menuYaAbierto = await quickSearchOpcion.isVisible();
    if (!menuYaAbierto) {
      await this.frameCenter.locator("//span[@data-label='AddProducts']").click();
      await quickSearchOpcion.waitFor({ state: 'visible', timeout: 5000 });
    }

    // 2. Seleccionar opción Quick Search
    await this.frameCenter.locator("//tr[@data-ng-click='addProductFromQuickSearch()']").click();

    // 3. Esperar que el popup esté visible
    await this.frameCenter
      .locator("//label[@id='apcOrder_lblQuickProductSearch']")
      .waitFor({ state: 'visible', timeout: 10000 });

    // 4. Ingresar el código y buscar
    await this.frameCenter.locator("//input[@id='txtSearch']").fill(codigo);
    await this.frameCenter.locator("//img[@id='btnSearch']").click();

    // 5. Esperar que aparezca la fila del producto en divResultsGrid
    const filaProducto = this.frameCenter.locator(
      `//div[@id='divResultsGrid']//tr[td[contains(normalize-space(.),'${codigo}')]]`
    );
    await filaProducto.waitFor({ state: 'visible', timeout: 15000 });

    // 6. Seleccionar el producto — primero intentar checkbox, sino clic en la fila
    try {
      // Checkbox puede estar fuera del tr, como siguiente elemento
      const checkboxFila = this.frameCenter.locator(
        `//div[@id='divResultsGrid']//tr[td[contains(normalize-space(.),'${codigo}')]]/following-sibling::tr[1]//input[@type='checkbox'] | //div[@id='divResultsGrid']//tr[td[contains(normalize-space(.),'${codigo}')]]//input[@type='checkbox']`
      );
      await checkboxFila.waitFor({ state: 'visible', timeout: 3000 });
      await checkboxFila.click();
    } catch {
      // Si no hay checkbox, clic directo en la fila para seleccionarla
      await filaProducto.click();
    }

    // 7. Clic en Add para agregar el producto seleccionado
    const btnAdd = this.frameCenter.locator("//input[@id='apcOrder_btncloseAndAddProduct']");
    await btnAdd.waitFor({ state: 'visible', timeout: 10000 });
    await btnAdd.click();

    // 7. Esperar que el popup se cierre
    await this.frameCenter
      .locator("//label[@id='apcOrder_lblQuickProductSearch']")
      .waitFor({ state: 'hidden', timeout: 10000 });

    // 8. Esperar spinner si aparece
    const spinner = this.frameCenter.locator(
      "//div[contains(@class,'progessContainer') and @data-ng-show='IsLoading']"
    );
    try {
      await spinner.waitFor({ state: 'visible', timeout: 3000 });
      await spinner.waitFor({ state: 'hidden', timeout: 20000 });
    } catch { /* operación rápida sin spinner */ }
  }

  // ── AG Grid — Boxes y FOB Price ───────────────────────────────────────────

  async ingresarBoxes(linea: number, cantidad: number): Promise<void> {
    // Esperar a que el spinner desaparezca primero
    const spinner = this.frameCenter.locator(
      "//div[contains(@class,'progessContainer') and @data-ng-show='IsLoading']"
    );
    try {
      await spinner.waitFor({ state: 'hidden', timeout: 10000 });
    } catch {
      // Si no hay spinner, continuar
    }

    // Esperar extra para que AG Grid renderice completamente
    await this.page.waitForTimeout(2000);

    const input = this.frameCenter
      .locator("//input[@ng-model='data.Boxes']")
      .nth(linea - 1);

    await input.waitFor({ state: 'visible', timeout: 20000 });
    await input.fill(String(cantidad));
    await input.press('Tab');
  }

  async ingresarFOBPrice(linea: number, precio: number): Promise<void> {
    // Esperar a que el spinner desaparezca primero
    const spinner = this.frameCenter.locator(
      "//div[contains(@class,'progessContainer') and @data-ng-show='IsLoading']"
    );
    try {
      await spinner.waitFor({ state: 'hidden', timeout: 10000 });
    } catch {
      // Si no hay spinner, continuar
    }

    // Esperar extra para que AG Grid renderice completamente
    await this.page.waitForTimeout(2000);

    const input = this.frameCenter
      .locator("//input[@ng-model='data.Price']")
      .nth(linea - 1);

    await input.waitFor({ state: 'visible', timeout: 20000 });
    await input.fill(String(precio));
    await input.press('Tab');
  }

  // ── Guardar y obtener Order No. ───────────────────────────────────────────

  async guardarOrden(): Promise<string> {
    await this.frameCenter.locator("//button[@id='btnSave']").click();

    // Esperar que el spinner desaparezca — señal de que el guardado terminó
    const spinner = this.frameCenter.locator(
      "//div[contains(@class,'progessContainer') and @data-ng-show='IsLoading']"
    );
    try {
      await spinner.waitFor({ state: 'visible', timeout: 3000 });
      await spinner.waitFor({ state: 'hidden', timeout: 30000 });
    } catch { /* operación rápida — sin spinner */ }

    // Esperar a que la URL cambie o el formulario se actualice
    await this.page.waitForTimeout(2000);

    // Cerrar toast si apareció (no lanzar error si no aparece)
    try {
      const toast    = this.frameCenter.locator("//div[contains(@class,'toast-success')]");
      const closeBtn = this.frameCenter.locator("//button[contains(@class,'toast-close-button')]");
      await toast.waitFor({ state: 'visible', timeout: 4000 });
      console.log('✅ Toast de éxito mostrado');
      if (await closeBtn.isVisible()) await closeBtn.click();
    } catch { /* toast rápido o no apareció */ }

    // Leer el Order No. — esperar hasta 15s a que sea un número (no "New Order")
    const locatorOrderNo = this.frameCenter.locator(
      "//div[@id='divForm']/div[4]/div/div/label[2]/span"
    );

    for (let i = 0; i < 15; i++) {
      try {
        const texto = await locatorOrderNo.innerText({ timeout: 1000 });
        const limpio = texto.trim();
        if (limpio && limpio !== 'New Order' && /\d/.test(limpio)) {
          console.log(`✅ Order No. obtenido: ${limpio}`);
          return limpio;
        }
      } catch { /* aún no visible */ }
      await this.page.waitForTimeout(1000);
    }

    console.warn('⚠️  Order No. no obtenido tras esperar. Revisando URL...');
    // Fallback: intentar leer de la URL si WebFlowers redirige a ?orderId=XXXXX
    const url = this.page.url();
    const match = url.match(/[?&](?:orderId|id|order)=(\d+)/i);
    if (match) return match[1];

    return '';
  }
}
