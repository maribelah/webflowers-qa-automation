import type { TestInfo } from '@playwright/test';
import { captureEvidence } from '../utils/evidence';
import { MappedApplicationError } from '../utils/errorPolicy';
import { expect, FrameLocator, Locator, Page, Dialog } from '@playwright/test';
import { randomInt } from 'crypto';
import { BasePage } from './BasePage';

/**
 * Page Class para REQ002 - New Invoice.
 *
 * Encapsula la navegacion por el menu lateral y las acciones de la pantalla
 * BETA Invoice - New Invoice sin depender de los objetos de REQ001.
 */
export class REQ002NewInvoicePage extends BasePage {
  private filasSeleccionadas: { rowId: string; cantidad: number }[] = [];
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
    this.menuNew = this.frameMenu.locator('#subInvoices > li > .div-child > .link').first();
    this.opcionInvoice = this.frameMenu.getByRole('link', { name: 'Invoice', exact: true });

    this.encabezadoNewInvoice = this.frameCenter.locator(
      "body *:visible:text-is('Invoicing'), body *:visible:text('New Invoice'), body *:visible:text('Invoice - New'), body *:visible:text('Invoices - New')"
    );
    this.campoCustomer = this.frameCenter.locator('#divFormInvoicing').getByRole('combobox', { name: 'Account# Or Name', exact: true });
    this.opcionCustomerLocalCashSale = this.frameCenter.getByText('LOCAL CASH SALE - CALIFORNIA', { exact: false });
    this.selectCarriers = this.frameCenter.locator(
      "#cmbCarriers, select[id*='cmbCarriers'], select[name*='cmbCarriers']"
    );
    this.modalCarrierSelect = this.frameCenter.locator('#addCarrierModal');
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
    await this.frameMenu.locator('[data-target="#subInvoices"]').click();
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
    await this.contenedorProgreso.first().waitFor({ state: 'hidden', timeout: 30000 });
  }

  /** Libera las reservas pendientes antes de comenzar una nueva factura. */
  async restaurarInventarioReservadoSiAparece(): Promise<boolean> {
    const modal = this.frameCenter.locator('#userReservedLinesModal');
    try {
      await modal.waitFor({ state: 'visible', timeout: 3000 });
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') return false;
      throw error;
    }
    await modal.locator('#btnCancelRestoreUserLines').click();
    await expect(modal).toBeHidden({ timeout: 30000 });
    await this.esperarProgressContainerDesaparezca();
    return true;
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
    await this.opcionCustomerLocalCashSale.first().waitFor({ state: 'visible', timeout: 15000 });
    await this.opcionCustomerLocalCashSale.first().click();
    await this.esperarCargaEstable();
    await this.restaurarInventarioReservadoSiAparece();
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
    await expect(this.modalCarrierSelect).toBeHidden({ timeout: 15000 });
    await expect(this.selectCarriers.locator('option:checked')).toHaveText('AAE - ARM AIR EXPRESS');
    await this.esperarCargaEstable();
  }

  /** Hace clic en Inventory y retorna la nueva pestana Add Inventory. */
  async abrirAddInventory(): Promise<Page> {
    await this.btnInventory.first().waitFor({ state: 'visible', timeout: 15000 });

    const popupPromise = this.page.waitForEvent('popup', { timeout: 30000 });
    await this.btnInventory.first().click();
    const popup = await popupPromise;

    await popup.waitForLoadState('domcontentloaded', { timeout: 30000 });
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
    const type = await this.esperarSelectorEnPaginaOFrames(popup, ['#TypeS'], 'S StandingOrders', 45000);
    if (!/Active/.test(await type.getAttribute('class') || '')) await type.click();
    await expect(type).toHaveClass(/Active/);
    await expect(popup.locator('.progessContainer:visible')).toHaveCount(0, { timeout: 45000 });
  }

  /** Florida puede venir seleccionada; un segundo clic la desactiva. */
  async seleccionarLocationFlorida(popup: Page): Promise<void> {
    const location = await this.esperarSelectorEnPaginaOFrames(popup, ['#LocationF'], 'F Florida', 45000);
    if (!/Active/.test(await location.getAttribute('class') || '')) await location.click();
    await expect(location).toHaveClass(/Active/);
    await expect(popup.locator('.progessContainer:visible')).toHaveCount(0, { timeout: 45000 });
  }

  async abrirFiltroSlot(popup: Page): Promise<void> {
    const header = await this.esperarSelectorEnPaginaOFrames(popup,
      ['.ag-header-cell[col-id="SlotNumber"]'], 'Encabezado Slot', 30000);
    await header.hover();
    await header.locator('span[ref="eMenu"] .ag-icon-menu').click();
    await this.clickSelectorEnPaginaOFrames(popup, ['.ag-menu [role="tab"][aria-label="filter"]'], 'Pestana filter', 15000);
  }

  async excluirSlotsVacios(popup: Page): Promise<void> {
    const checkbox = popup.getByRole('checkbox', { name: '(Blanks)', exact: true });
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
    await checkbox.press('Escape');
    const slots = popup.locator('.ag-center-cols-container .ag-row [col-id="SlotNumber"]');
    await expect.poll(async () => {
      const textos = await slots.allTextContents();
      return textos.length > 0 && textos.every(texto => texto.trim() !== '');
    }, { timeout: 30000, message: 'Esperar que la tabla aplique el filtro de slots' }).toBe(true);
  }

  async ingresarBoxesInventory(popup: Page, cantidades: number[]): Promise<void> {
    this.filasSeleccionadas = [];
    const rows = popup.locator('.ag-center-cols-container .ag-row');
    for (const cantidad of cantidades) {
      if (!Number.isInteger(cantidad) || cantidad < 2 || cantidad > 6) {
        throw new Error('Boxes debe estar entre 2 y 6.');
      }
      const rowId = await rows.evaluateAll((elementos, datos) => {
        const fila = elementos.find(elemento => {
          const id = elemento.getAttribute('row-id');
          const disponibles = Number(elemento.querySelector('[col-id="Pieces"]')?.textContent?.trim());
          const slot = elemento.querySelector('[col-id="SlotNumber"]')?.textContent?.trim();
          return id !== null && !datos.usadas.includes(id) && disponibles >= datos.cantidad && !!slot;
        });
        return fila?.getAttribute('row-id') ?? null;
      }, { cantidad, usadas: this.filasSeleccionadas.map(fila => fila.rowId) });
      if (rowId === null) throw new Error(`No hay una fila de inventario con ${cantidad} cajas disponibles y slot asignado.`);
      const row = popup.locator(`.ag-center-cols-container .ag-row[row-id="${rowId}"]`);
      const cell = row.locator('[col-id="Boxes"]');
      await cell.click();
      const editor = popup.getByRole('textbox', { name: 'Input Editor', exact: true });
      await editor.fill(String(cantidad));
      await expect(editor).toHaveValue(String(cantidad));
      await editor.press('Enter');
      await expect(cell).toHaveText(new RegExp(`^\\s*${cantidad}\\s*$`));
      this.filasSeleccionadas.push({ rowId, cantidad });
    }
  }

  async agregarInventarioYVolver(popup: Page): Promise<void> {
    await popup.getByRole('button', { name: 'add_shopping_cart Add to' }).click();
    await expect(popup.locator('.progessContainer:visible')).toHaveCount(0, { timeout: 45000 });
    if (!this.filasSeleccionadas.length) throw new Error('No hay cajas seleccionadas para transferir.');
    for (const { rowId } of this.filasSeleccionadas) {
      const cell = popup.locator(`.ag-center-cols-container .ag-row[row-id="${rowId}"] [col-id="Boxes"]`);
      // AG Grid puede eliminar la fila transferida en lugar de vaciar la celda.
      await expect.poll(async () => {
        if (await cell.count() === 0) return true;
        return (await cell.innerText()).trim() === '';
      }, { timeout: 45000, message: 'Esperar que inventario libere la cantidad transferida' }).toBe(true);
    }
    await popup.getByRole('button', { name: 'west Back to Invoice' }).click();
    await this.page.bringToFront();
    await this.esperarCargaNewInvoice();
    const cells = this.frameCenter.locator('[data-ag-grid="gridInvoiceLines"] .ag-center-cols-container [col-id="NroBoxes"]');
    const total = this.filasSeleccionadas.reduce((sum, row) => sum + row.cantidad, 0);
    await expect.poll(async () => (await cells.allTextContents()).reduce((sum, text) => sum + Number(text.trim()), 0), {
      timeout: 30000, message: 'La factura debe contener todas las cajas transferidas'
    }).toBe(total);
  }

  async completarReferencia(referencia: string): Promise<void> {
    const main = this.page.frameLocator('iframe[name="main"]');
    const campo = main.locator('xpath=//*[@id="divFormInvoicing"]/div[4]/div[2]/div[5]/div[2]/input');
    await campo.fill(referencia);
    await campo.press('Tab');
    await expect(campo).toHaveValue(referencia);
  }

  async guardarInvoice(): Promise<string> {
    await this.esperarCargaEstable();
    const main = this.page.frameLocator('iframe[name="main"]');
    const numero = main.locator('input[data-ng-model="invoiceHeader.InvoiceNumber"]');
    await expect(numero).toHaveValue('');
    const cuentaInvalida = /invalid carrier account number/i;
    let alertaNativa = '';
    const atenderDialogo = async (dialog: Dialog): Promise<void> => {
      alertaNativa = dialog.message();
      await dialog.accept();
    };
    this.page.on('dialog', atenderDialogo);
    try {
      for (let intento = 0; intento < 2; intento++) {
        alertaNativa = '';
        await main.locator('#btnSave').click();
        let mensaje = '';
        let resultado = '';
        await expect.poll(async () => {
          if ((await numero.inputValue()).trim()) return resultado = 'guardada';
          if (alertaNativa) {
            mensaje = alertaNativa;
            return resultado = cuentaInvalida.test(mensaje) ? 'cuenta-invalida' : 'error-servidor';
          }
          const alerta = await this.obtenerAlertaGuardado();
          if (alerta) {
            mensaje = alerta.mensaje;
            return resultado = cuentaInvalida.test(mensaje) ? 'cuenta-invalida' : 'error-servidor';
          }
          return 'esperando';
        }, { timeout: 60000, message: 'Esperar numero de factura o error del servidor' }).not.toBe('esperando');
        if (resultado === 'guardada') {
          await this.esperarProgressContainerDesaparezca();
          return numero.inputValue();
        }
        if (resultado !== 'cuenta-invalida' || intento > 0) {
          if (resultado === 'cuenta-invalida') throw new MappedApplicationError(mensaje);
          throw new Error(`WebFlowers rechazo el guardado: ${mensaje}`);
        }
        await this.corregirCarrierAccount();
      }
      throw new Error('No se pudo confirmar el guardado de la factura.');
    } finally {
      this.page.off('dialog', atenderDialogo);
    }
  }

  private async obtenerAlertaGuardado(): Promise<{ mensaje: string } | null> {
    for (const frame of this.page.frames()) {
      const alerta = frame.locator('.toast-message:visible, .swal2-content:visible, .swal2-html-container:visible, [role="alert"]:visible')
        .filter({ hasText: /invalid carrier account number/i }).first();
      if (await alerta.isVisible()) return { mensaje: (await alerta.innerText()).trim() };
      const error = frame.locator('.toast-error .toast-message:visible');
      if (await error.count()) return { mensaje: (await error.allTextContents()).join('; ') };
    }
    return null;
  }

  private async corregirCarrierAccount(): Promise<void> {
    for (const frame of this.page.frames()) {
      const modal = frame.locator('.swal2-popup:visible').filter({ hasText: /invalid carrier account number/i });
      if (await modal.count()) {
        await modal.locator('.swal2-confirm').click();
        await expect(modal).toBeHidden();
      }
      const toast = frame.locator('.toast:visible').filter({ hasText: /invalid carrier account number/i });
      if (await toast.count()) {
        const cerrar = toast.locator('.toast-close-button');
        if (await cerrar.isVisible()) await cerrar.click();
        await expect(toast).toBeHidden({ timeout: 15000 });
      }
    }
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const cuenta = Array.from({ length: 4 }, () => letras[randomInt(letras.length)]).join('')
      + Array.from({ length: 6 }, () => String(randomInt(10))).join('');
    const campo = this.page.frameLocator('iframe[name="main"]')
      .locator('xpath=//*[@id="divFormInvoicing"]/div[4]/div[2]/div[4]/div[2]/input');
    await campo.fill(cuenta);
    await campo.press('Tab');
    await expect(campo).toHaveValue(cuenta);
    console.log(`Carrier Account completado tras alerta: ${cuenta}`);
  }

  async capturarInvoiceGenerado(testInfo: TestInfo, numeroInvoice: string, numeroPO: string): Promise<void> {
    const main = this.page.frameLocator('iframe[name="main"]');
    await expect(main.locator('input[data-ng-model="invoiceHeader.InvoiceNumber"]')).toHaveValue(numeroInvoice);
    await expect(main.locator('input[data-ng-model="invoiceHeader.CustomerPONumber"]')).toHaveValue(numeroPO);
    await this.page.bringToFront();
    await captureEvidence(this.page, testInfo, 'REQ002-invoice-generado.png');
    console.log(`Invoice generado: ${numeroInvoice}; PO: ${numeroPO}`);
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
    throw new Error(`No desaparecio ${texto} en ${timeout}ms.`);
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
    await this.page.waitForLoadState('domcontentloaded', { timeout });
    await this.spinnerCarga.waitFor({ state: 'hidden', timeout });
    await this.indicadorWorking.first().waitFor({ state: 'hidden', timeout });
    await this.page.waitForTimeout(300);
  }
}
