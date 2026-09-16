import { FrameLocator, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Class para REQ002 - New Invoice.
 *
 * Encapsula la navegacion por el menu lateral y las acciones de la pantalla
 * BETA Invoice - New Invoice sin depender de los objetos de REQ001.
 */
export class REQ002NewInvoicePage extends BasePage {
  readonly frameMenu: FrameLocator;
  readonly frameCenter: FrameLocator;
  readonly menuFavorites: Locator;
  readonly iconoFavorites: Locator;
  readonly menuInvoices: Locator;
  readonly submenuInvoices: Locator;
  readonly menuNew: Locator;
  readonly opcionInvoice: Locator;
  readonly encabezadoNewInvoice: Locator;
  readonly campoCustomer: Locator;
  readonly opcionCustomerLocalCashSale: Locator;
  readonly selectCarriers: Locator;
  readonly modalCarrierSelect: Locator;
  readonly selectAllCarriersModal: Locator;
  readonly btnInventory: Locator;
  readonly indicadorAddInventory: Locator;
  readonly contenedorProgreso: Locator;
  readonly spinnerCarga: Locator;
  readonly indicadorWorking: Locator;

  constructor(page: Page) {
    super(page);

    this.frameMenu = page.frameLocator('iframe#left_page1');
    this.frameCenter = page.frameLocator('iframe#center_page');

    this.menuFavorites = this.frameMenu.getByText('Favorites', { exact: true });
    this.iconoFavorites = this.frameMenu.locator('.ght-icons.ght-icons-star-filled.wh-18');
    this.menuInvoices = this.frameMenu
      .locator("[data-target='#subInvoices']")
      .or(
        this.frameMenu.locator(
          "//div[contains(@class,'div-parent') and @title='Invoices'] | //div[contains(@class,'div-parent') and normalize-space(.)='Invoices']"
        )
      );
    this.submenuInvoices = this.frameMenu.locator('#subInvoices');
    this.menuNew = this.frameMenu.locator(
      "#subInvoices div:has-text('New'), #subInvoices a:has-text('New'), #subInvoices li:has-text('New')"
    );
    this.opcionInvoice = this.frameMenu.locator(
      "#subInvoices div:has-text('Invoice'), #subInvoices a:has-text('Invoice'), #subInvoices li:has-text('Invoice')"
    );

    this.encabezadoNewInvoice = this.frameCenter.locator(
      "body *:visible:text-is('Invoicing'), body *:visible:text('New Invoice'), body *:visible:text('Invoice - New'), body *:visible:text('Invoices - New')"
    );
    this.campoCustomer = this.frameCenter.locator(
      "input[aria-label='Account# Or Name']:visible, [role='combobox'][aria-label='Account# Or Name']:visible, #txtCustomer, input[id*='Customer']:visible, input[name*='Customer']:visible, input[data-ng-model*='Customer']:visible, select[id*='Customer']:visible"
    // );
    this.opcionCustomerLocalCashSale = this.frameCenter.getByText('LOCAL CASH SALE - CALIFORNIA', { exact: false });
    this.selectCarriers = this.frameCenter.locator(
      "#cmbCarriers, select[id*='cmbCarriers'], select[name*='cmbCarriers']"
    );
    this.modalCarrierSelect = this.frameCenter.locator(
      "//*[contains(normalize-space(.),'Carrier Select') or contains(@id,'CarrierSelect') or contains(@class,'CarrierSelect')]"
    );
    this.selectAllCarriersModal = this.frameCenter.locator(
      "#cmbAllCarriersModal, select[id*='cmbAllCarriersModal'], select[name*='cmbAllCarriersModal']"
    );
    this.btnInventory = this.frameCenter.locator(
      "#btnInventory, input[id*='btnInventory']:visible, button[id*='btnInventory']:visible, input[value*='Inventory']:visible, button:has-text('Inventory'):visible"
    );
    this.indicadorAddInventory = this.frameCenter.locator(
      "//*[contains(normalize-space(.),'Add Inventory') or contains(normalize-space(.),'Inventory Added') or contains(@id,'AddInventory')]"
    );
    this.contenedorProgreso = this.frameCenter.locator(
      ".progessContainer.animate-show.animate-hide, .progressContainer.animate-show.animate-hide"
    );
    this.spinnerCarga = this.frameCenter.locator(
      "//div[contains(@class,'progessContainer') and @data-ng-show='IsLoading']"
    );
    this.indicadorWorking = this.frameCenter.locator(
      "text=Working..., input[value='Working...'], button:has-text('Working...')"
    );
  }

  /** Abre el menu principal Invoices en el menu lateral. */
  async abrirMenuInvoices(): Promise<void> {
    await this.clickConReintento(this.menuInvoices.first(), 'Invoices');
    await this.esperarCargaEstable();
    await this.submenuInvoices.waitFor({ state: 'visible', timeout: 15000 });
    await this.menuNew.first().waitFor({ state: 'visible', timeout: 15000 });
  }

  /** Valida que el dashboard y menu lateral esten listos para operar. */
  async esperarDashboardConMenu(): Promise<void> {
    await this.menuFavorites.waitFor({ state: 'visible', timeout: 45000 });
    await this.iconoFavorites.first().waitFor({ state: 'visible', timeout: 15000 });
    await this.menuInvoices.first().waitFor({ state: 'visible', timeout: 15000 });
  }

  /** Hace clic en la opcion New dentro de Invoices. */
  async clickNew(): Promise<void> {
    await this.menuNew.first().waitFor({ state: 'visible', timeout: 15000 });
    await this.menuNew.first().click();
    await this.esperarCargaEstable();
    await this.opcionInvoice.first().waitFor({ state: 'visible', timeout: 15000 });
  }

  /** Hace clic en la opcion Invoice. */
  async clickInvoice(): Promise<void> {
    await this.opcionInvoice.first().waitFor({ state: 'visible', timeout: 15000 });
    await this.opcionInvoice.first().click();
    await this.esperarCargaEstable();
  }

  /** Navega desde el menu lateral hasta Invoices - New - Invoice. */
  async navegarANewInvoice(): Promise<void> {
    await this.abrirMenuInvoices();
    await this.clickNew();
    await this.clickInvoice();
    await this.esperarCargaNewInvoice();
  }

  /** Espera y valida que la pagina New Invoice haya cargado. */
  async esperarCargaNewInvoice(): Promise<void> {
    await this.esperarCargaEstable();
    await this.esperarProgressContainerDesaparezca();
    await this.encabezadoNewInvoice.first().waitFor({ state: 'visible', timeout: 30000 });
    await this.campoCustomer.first().waitFor({ state: 'visible', timeout: 15000 });
    await this.selectCarriers.first().waitFor({ state: 'visible', timeout: 15000 });
    await this.btnInventory.first().waitFor({ state: 'visible', timeout: 15000 });
  }

  /** Espera a que desaparezca el loader progessContainer animate-show animate-hide. */
  async esperarProgressContainerDesaparezca(): Promise<void> {
    await this.contenedorProgreso.first().waitFor({ state: 'hidden', timeout: 30000 }).catch(() => undefined);
  }

  /** Ingresa el customer por codigo y selecciona LOCAL CASH SALE - CALIFORNIA. */
  async seleccionarCustomerLocalCashSale(codigoCustomer: string = 'CF90008'): Promise<void> {
    const customer = this.campoCustomer.first();
    await customer.waitFor({ state: 'visible', timeout: 15000 });

    const tagName = await customer.evaluate(element => element.tagName.toLowerCase());
    if (tagName === 'select') {
      await this.seleccionarOpcionPorTexto(customer, 'LOCAL CASH SALE - CALIFORNIA');
      await this.esperarCargaEstable();
      return;
    }

    await customer.fill(codigoCustomer);
    await this.page.keyboard.press('Tab').catch(() => undefined);

    if (await this.opcionCustomerLocalCashSale.first().isVisible().catch(() => false)) {
      await this.opcionCustomerLocalCashSale.first().click();
    } else {
      await customer.click();
      await customer.fill(codigoCustomer);
      await this.opcionCustomerLocalCashSale.first().waitFor({ state: 'visible', timeout: 15000 });
      await this.opcionCustomerLocalCashSale.first().click();
    }

    await this.esperarCargaEstable();
  }

  /** Selecciona (Others) en cmbCarriers y valida que se abra el modal Carrier Select. */
  async seleccionarCarrierOthers(): Promise<void> {
    await this.selectCarriers.first().waitFor({ state: 'visible', timeout: 15000 });
    await this.seleccionarOpcionPorTexto(this.selectCarriers.first(), '(Others)');
    await this.modalCarrierSelect.first().waitFor({ state: 'visible', timeout: 30000 });
  }

  /** Selecciona AAE - ARM AIR EXPRESS dentro del modal Carrier Select. */
  async seleccionarCarrierAAEArmAirExpress(): Promise<void> {
    await this.selectAllCarriersModal.first().waitFor({ state: 'visible', timeout: 15000 });
    await this.seleccionarOpcionPorTexto(this.selectAllCarriersModal.first(), 'AAE - ARM AIR EXPRESS');
    await this.esperarCargaEstable();
  }

  /** Hace clic en Inventory y retorna la nueva pestana Add Inventory. */
  async abrirAddInventory(): Promise<Page> {
    await this.btnInventory.first().waitFor({ state: 'visible', timeout: 15000 });

    const popupPromise = this.page.waitForEvent('popup', { timeout: 30000 });
    await this.btnInventory.first().click();
    const popup = await popupPromise;

    await popup.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => undefined);
    return popup;
  }

  /** Valida que la pestana Add Inventory haya abierto correctamente. */
  async validarAddInventoryAbierto(popup: Page): Promise<void> {
    await this.esperarSelectorEnPaginaOFrames(
      popup,
      [
        "text=Add Inventory",
        "text=Add From Inventory In Proccess",
        "text=Add From Inventory",
        "text=Inventory Types",
        "text=StandingOrders"
      ],
      'Add Inventory',
      45000
    );
    await this.esperarTextoOcultoEnPaginaOFrames(popup, 'Add From Inventory In Proccess', 90000);
  }

  /** En Add Inventory selecciona Inventory Types -> S StandingOrders. */
  async seleccionarInventoryTypeStandingOrders(popup: Page): Promise<void> {
    await this.clickSelectorEnPaginaOFrames(
      popup,
      [
        "text=/^\\s*S\\s*StandingOrders\\s*$/i",
        "text=/StandingOrders/i",
        "[aria-label*='StandingOrders']",
        "[title*='StandingOrders']"
      ],
      'S StandingOrders',
      45000
    );
  }

  /** En Add Inventory selecciona Locations -> F Florida. */
  async seleccionarLocationFlorida(popup: Page): Promise<void> {
    await this.clickSelectorEnPaginaOFrames(
      popup,
      ["text=/^\\s*F\\s*Florida\\s*$/i", "text=/Florida/i", "[aria-label*='Florida']", "[title*='Florida']"],
      'F Florida',
      45000
    );
  }

  /** Selecciona una opcion de un select por texto exacto o parcial. */
  private async seleccionarOpcionPorTexto(select: Locator, texto: string): Promise<string> {
    const opcion = await select.locator('option').evaluateAll((options, textoBuscado) => {
      const normalizado = String(textoBuscado).trim().toLowerCase();
      const opciones = options.map(option => ({
        texto: option.textContent?.trim() ?? '',
        valor: option.getAttribute('value') ?? ''
      }));

      return (
        opciones.find(option => option.texto.toLowerCase() === normalizado) ??
        opciones.find(option => option.texto.toLowerCase().includes(normalizado)) ??
        null
      );
    }, texto);

    if (!opcion) {
      throw new Error(`No se encontro la opcion "${texto}" en el select.`);
    }

    await select.selectOption(opcion.valor ? { value: opcion.valor } : { label: opcion.texto });
    await this.esperarCargaEstable();
    return opcion.texto;
  }

  /** Reintenta clicks en elementos que pueden recrearse con los frames de WebFlowers. */
  private async clickConReintento(locator: Locator, nombre: string, intentos: number = 3): Promise<void> {
    let ultimoError: unknown;

    for (let intento = 1; intento <= intentos; intento++) {
      try {
        await locator.waitFor({ state: 'visible', timeout: 15000 });
        await locator.click();
        return;
      } catch (error) {
        ultimoError = error;
        await this.page.waitForTimeout(700);
      }
    }

    const mensaje = ultimoError instanceof Error ? ultimoError.message : String(ultimoError);
    throw new Error(`No se pudo hacer clic en ${nombre} despues de ${intentos} intentos. ${mensaje}`);
  }

  /** Espera hasta que algun selector sea visible en la pagina o cualquiera de sus frames. */
  private async esperarSelectorEnPaginaOFrames(
    page: Page,
    selectors: string[],
    nombre: string,
    timeout: number
  ): Promise<Locator> {
    const inicio = Date.now();
    let ultimoError = '';

    while (Date.now() - inicio < timeout) {
      for (const locator of this.obtenerLocatorsEnPaginaOFrames(page, selectors)) {
        try {
          if (await locator.isVisible({ timeout: 1000 })) {
            return locator;
          }
        } catch (error) {
          ultimoError = error instanceof Error ? error.message : String(error);
        }
      }

      await this.page.waitForTimeout(500);
    }

    throw new Error(`No se encontro visible ${nombre}. ${ultimoError}`);
  }

  /** Hace clic sobre el primer selector visible en la pagina o cualquiera de sus frames. */
  private async clickSelectorEnPaginaOFrames(
    page: Page,
    selectors: string[],
    nombre: string,
    timeout: number
  ): Promise<void> {
    const locator = await this.esperarSelectorEnPaginaOFrames(page, selectors, nombre, timeout);
    await locator.click();
  }

  /** Espera hasta que un texto ya no este visible en ninguna pagina/frame. */
  private async esperarTextoOcultoEnPaginaOFrames(page: Page, texto: string, timeout: number): Promise<void> {
    const inicio = Date.now();

    while (Date.now() - inicio < timeout) {
      const visible = await Promise.all(
        this.obtenerLocatorsEnPaginaOFrames(page, [`text=${texto}`]).map(locator =>
          locator.isVisible({ timeout: 500 }).catch(() => false)
        )
      );

      if (!visible.some(Boolean)) {
        return;
      }

      await this.page.waitForTimeout(1000);
    }
  }

  /** Construye locators equivalentes para pagina principal y todos los frames actuales. */
  private obtenerLocatorsEnPaginaOFrames(page: Page, selectors: string[]): Locator[] {
    const locators = selectors.map(selector => page.locator(selector).first());

    for (const frame of page.frames()) {
      locators.push(...selectors.map(selector => frame.locator(selector).first()));
    }

    return locators;
  }

  /** Espera corta y reutilizable para que WebFlowers termine carga visual y DOM. */
  private async esperarCargaEstable(timeout: number = 30000): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded', { timeout }).catch(() => undefined);
    await this.spinnerCarga.waitFor({ state: 'hidden', timeout }).catch(() => undefined);
    await this.indicadorWorking.first().waitFor({ state: 'hidden', timeout }).catch(() => undefined);
    await this.page.waitForTimeout(300);
  }
}
