import { Dialog, FrameLocator, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Class para REQ001 - New Purchase Order [Products].
 *
 * Encapsula la navegacion por el menu lateral y las validaciones de la
 * pantalla Procurement - New Purchase Order [Products].
 */
export class REQ001NewPOPage extends BasePage {
  readonly frameMenu: FrameLocator;
  readonly frameCenter: FrameLocator;
  readonly menuProcurement: Locator;
  readonly menuProducts: Locator;
  readonly opcionNewPO: Locator;
  readonly encabezadoNewPO: Locator;
  readonly campoVendor: Locator;
  readonly campoOrderType: Locator;
  readonly campoDueDate: Locator;
  readonly campoVendorShipmentDate: Locator;
  readonly campoStorage: Locator;
  readonly btnSave: Locator;
  readonly selectVendor: Locator;
  readonly selectAddProduct: Locator;
  readonly modalSearchQuickProduct: Locator;
  readonly inputSearchQuickProduct: Locator;
  readonly btnSearchQuickProduct: Locator;
  readonly btnAddQuickProduct: Locator;
  readonly inputBoxes: Locator;
  readonly celdaCustomerPrimeraLinea: Locator;
  readonly selectCustomerPrimeraLinea: Locator;
  readonly popupPurchaseOrderGuardada: Locator;
  readonly btnAceptarPopupPurchaseOrder: Locator;
  readonly btnConfirmarOverwriteLandedCost: Locator;
  readonly btnCancelarOverwriteLandedCost: Locator;
  readonly labelNumeroPO: Locator;
  readonly spinnerCarga: Locator;

  constructor(page: Page) {
    super(page);

    this.frameMenu = page.frameLocator('iframe#left_page1');
    this.frameCenter = page.frameLocator('iframe#center_page');

    this.menuProcurement = this.frameMenu.locator("//div[@class='div-parent' and @title='Procurement']");
    this.menuProducts = this.frameMenu.locator("//div[@class='div-parent' and @title='Procurement']/ul/li[3]/div");
    this.opcionNewPO = this.frameMenu.getByText('New PO', { exact: true });

    this.encabezadoNewPO = this.frameCenter.getByText('Procurement - New Purchase Order [Products]', { exact: true });
    this.campoVendor = this.frameCenter.locator(
      "//label[contains(normalize-space(.),'Vendor')] | //input[contains(@data-ng-model,'Vendor')] | //select[contains(@data-ng-model,'Vendor')]"
    );
    this.campoOrderType = this.frameCenter.locator(
      "//label[contains(normalize-space(.),'Order Type')] | //input[contains(@data-ng-model,'OrderType')] | //select[contains(@data-ng-model,'OrderType')]"
    );
    this.campoDueDate = this.frameCenter.locator(
      "//label[contains(normalize-space(.),'Due Date')] | //input[contains(@data-ng-model,'DueDate')]"
    );
    this.campoVendorShipmentDate = this.frameCenter.locator(
      "//label[contains(normalize-space(.),'Vendor Ship')]/following::input[not(contains(@class,'ng-hide'))][1]"
    );
    this.campoStorage = this.frameCenter.locator(
      "//*[contains(normalize-space(.),'Storage')] | //input[contains(@data-ng-model,'Storage')] | //select[contains(@data-ng-model,'Storage')]"
    );
    this.btnSave = this.frameCenter.locator("input[value='Save']:visible, button:has-text('Save'):visible");
    this.selectVendor = this.frameCenter.locator(
      "//label[normalize-space(.)='Vendor:']/following::select[not(contains(@class,'ng-hide'))][1]"
    );
    this.selectAddProduct = this.frameCenter.locator(
      "//select[contains(@id,'cmbAddProduct') or option[contains(normalize-space(.),'Add Product From')]]"
    );
    this.modalSearchQuickProduct = this.frameCenter.locator(
      "//*[contains(normalize-space(.),'Search Quick Product') or contains(normalize-space(.),'Quick Product Search')]"
    );
    this.inputSearchQuickProduct = this.frameCenter.locator('#txtSearch');
    this.btnSearchQuickProduct = this.frameCenter.locator('#btnSearch');
    this.btnAddQuickProduct = this.frameCenter.locator(
      '#apcOrder_btncloseAndAddProduct, input[value="Add"]:visible, button:has-text("Add"):visible'
    );
    this.inputBoxes = this.frameCenter.locator(
      "//input[@ng-model='data.Boxes' or @data-ng-model='data.Boxes' or contains(@id,'Boxes')]"
    );
    this.celdaCustomerPrimeraLinea = this.frameCenter.locator(
      "//*[@id='lblCustomer0' or (contains(@id,'lblCustomer') and not(contains(@class,'ng-hide')))]"
    );
    this.selectCustomerPrimeraLinea = this.frameCenter.locator(
      "#cmbHiddenCustomers"
    );
    this.popupPurchaseOrderGuardada = this.frameCenter.locator(
      "//*[contains(normalize-space(.),'Purchase Order saved successfully') or contains(normalize-space(.),'P.O #:')]"
    );
    this.btnAceptarPopupPurchaseOrder = this.frameCenter.locator(
      "button:has-text('Aceptar'):visible, button:has-text('OK'):visible, input[value='Aceptar']:visible, input[value='OK']:visible"
    );
    this.btnConfirmarOverwriteLandedCost = this.frameCenter.locator(
      "button:has-text('Yes, overwrite!'):visible"
    );
    this.btnCancelarOverwriteLandedCost = this.frameCenter.locator(
      "button:has-text('No'):visible"
    );
    this.labelNumeroPO = this.frameCenter.locator(
      "//*[contains(normalize-space(.),'P.O') and contains(normalize-space(.),'#')]/following::*[normalize-space(.)!=''][1]"
    );
    this.spinnerCarga = this.frameCenter.locator(
      "//div[contains(@class,'progessContainer') and @data-ng-show='IsLoading']"
    );
  }

  /** Abre el menu principal Procurement en el menu lateral. */
  async abrirMenuProcurement(): Promise<void> {
    await this.menuProcurement.waitFor({ state: 'visible', timeout: 15000 });
    await this.menuProcurement.click();
  }

  /** Expande o selecciona la opcion Products dentro de Procurement. */
  async seleccionarProducts(): Promise<void> {
    await this.menuProducts.waitFor({ state: 'visible', timeout: 15000 });
    await this.menuProducts.click();
  }

  /** Hace clic en la opcion New PO del menu Products. */
  async clickNewPO(): Promise<void> {
    await this.opcionNewPO.first().waitFor({ state: 'visible', timeout: 15000 });
    await this.opcionNewPO.first().click();
  }

  /** Espera a que la pantalla New Purchase Order termine de cargar. */
  async esperarCargaNewPO(): Promise<void> {
    await this.spinnerCarga.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined);
    await this.encabezadoNewPO.waitFor({ state: 'visible', timeout: 30000 });
  }

  /** Ingresa la fecha actual en Due Date y Vendor Shipment Date. */
  async seleccionarFechasActuales(): Promise<void> {
    const fechaActual = this.obtenerFechaActualFormulario();
    const inputDueDate = this.frameCenter.locator(
      "//label[contains(normalize-space(.),'Due Date')]/following::input[not(contains(@class,'ng-hide'))][1]"
    );

    await inputDueDate.waitFor({ state: 'visible', timeout: 15000 });
    await inputDueDate.fill(fechaActual);
    await this.campoVendorShipmentDate.waitFor({ state: 'visible', timeout: 15000 });
    await this.campoVendorShipmentDate.fill(fechaActual);
  }

  /** Selecciona aleatoriamente un vendor valido de la lista desplegable. */
  async seleccionarVendorAleatorio(): Promise<string> {
    await this.selectVendor.waitFor({ state: 'visible', timeout: 15000 });

    const opcionesValidas = await this.selectVendor.locator('option').evaluateAll(options =>
      options
        .map((option, index) => ({
          index,
          texto: option.textContent?.trim() ?? '',
          valor: option.getAttribute('value') ?? ''
        }))
        .filter(option => option.texto.length > 0 && option.texto !== '[Selected]')
    );

    if (opcionesValidas.length === 0) {
      throw new Error('No se encontraron vendors validos para seleccionar.');
    }

    const opcion = opcionesValidas[Math.floor(Math.random() * opcionesValidas.length)];
    await this.selectVendor.selectOption({ index: opcion.index });
    await this.spinnerCarga.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined);
    return opcion.texto;
  }

  /** Selecciona Quick Search desde cmbAddProduct. */
  async seleccionarQuickSearchEnAddProduct(): Promise<void> {
    await this.selectAddProduct.waitFor({ state: 'visible', timeout: 15000 });

    const opcionQuickSearch = await this.selectAddProduct.locator('option').evaluateAll(options => {
      const option = options.find(item => item.textContent?.trim().toLowerCase().includes('quick search'));

      return option
        ? {
            texto: option.textContent?.trim() ?? '',
            valor: option.getAttribute('value') ?? ''
          }
        : null;
    });

    if (!opcionQuickSearch) {
      throw new Error('No se encontro la opcion Quick Search en cmbAddProduct.');
    }

    await this.selectAddProduct.selectOption(
      opcionQuickSearch.valor ? { value: opcionQuickSearch.valor } : { label: opcionQuickSearch.texto }
    );
  }

  /** Espera y valida que se muestre el modal Search Quick Product. */
  async esperarModalSearchQuickProduct(): Promise<void> {
    await this.modalSearchQuickProduct.first().waitFor({ state: 'visible', timeout: 30000 });
  }

  /** Busca un producto por integration code dentro del modal Search Quick Product. */
  async buscarProductoPorIntegrationCode(integrationCode: string): Promise<void> {
    await this.inputSearchQuickProduct.waitFor({ state: 'visible', timeout: 15000 });
    await this.inputSearchQuickProduct.fill(integrationCode);
    await this.btnSearchQuickProduct.waitFor({ state: 'visible', timeout: 15000 });
    await this.btnSearchQuickProduct.click();
    await this.obtenerFilaResultadoProducto(integrationCode).waitFor({ state: 'visible', timeout: 30000 });
  }

  /** Selecciona el resultado encontrado y lo agrega a la PO. */
  async seleccionarResultadoYAgregar(integrationCode: string): Promise<void> {
    const filaResultado = this.obtenerFilaResultadoProducto(integrationCode);

    await filaResultado.waitFor({ state: 'visible', timeout: 30000 });
    await filaResultado.click();
    await this.btnAddQuickProduct.first().waitFor({ state: 'visible', timeout: 15000 });
    await this.btnAddQuickProduct.first().click();
    await this.spinnerCarga.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined);
  }

  /** Valida que el integration code agregado se visualice en el panel inferior. */
  async esperarIntegrationCodeEnPanel(integrationCode: string): Promise<void> {
    await this.frameCenter
      .locator(`//tr[td[contains(normalize-space(.),'${integrationCode}')]] | //*[contains(normalize-space(.),'${integrationCode}')]`)
      .first()
      .waitFor({ state: 'visible', timeout: 30000 });
  }

  /** Ingresa un valor aleatorio entre 1 y 8 en Boxes para el producto indicado. */
  async ingresarBoxesAleatorio(integrationCode: string): Promise<number> {
    const boxes = Math.floor(Math.random() * 8) + 1;
    const inputBoxesProducto = this.obtenerFilaProductoAgregado(integrationCode).locator('input:visible').nth(2);

    await inputBoxesProducto.waitFor({ state: 'visible', timeout: 15000 });
    await inputBoxesProducto.fill(String(boxes));
    return boxes;
  }

  /** Selecciona aleatoriamente un customer valido para la linea del integration code indicado. */
  async seleccionarCustomerAleatorioPrimeraLinea(integrationCode: string): Promise<string> {
    for (let intento = 1; intento <= 5; intento++) {
      const celdaCustomerProducto = this.obtenerCeldaCustomerProducto(integrationCode);
      const lblCustomer0 = this.frameCenter.locator('#lblCustomer0');

      if (await lblCustomer0.isVisible().catch(() => false)) {
        await lblCustomer0.dblclick();
      } else {
        await celdaCustomerProducto.waitFor({ state: 'visible', timeout: 15000 });
        await celdaCustomerProducto.dblclick();
      }

      await this.selectCustomerPrimeraLinea.first().waitFor({ state: 'attached', timeout: 15000 });
      await this.selectCustomerPrimeraLinea.first().dispatchEvent('click');
      await this.spinnerCarga.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined);

      const customerSeleccionado = await this.seleccionarCustomerAleatorioEnCmbHidden();
      await this.spinnerCarga.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined);

      if (await this.customerVisibleEnFila(integrationCode, customerSeleccionado)) {
        return customerSeleccionado;
      }

      if (intento < 5) {
        await this.seleccionarVendorAleatorio();
        await this.confirmarOverwriteLandedCostSiAparece();
      }
    }

    throw new Error('No se pudo seleccionar un customer aleatorio luego de reintentar con vendors aleatorios.');
  }

  /** Selecciona un customer aleatorio en cmbHiddenCustomers y dispara los eventos de WebFlowers. */
  private async seleccionarCustomerAleatorioEnCmbHidden(): Promise<string> {
    await this.selectCustomerPrimeraLinea.first().locator('option').nth(1).waitFor({
      state: 'attached',
      timeout: 15000
    });

    return await this.selectCustomerPrimeraLinea.first().evaluate(select => {
      const customerSelect = select as HTMLSelectElement;
      const opcionesValidas = Array.from(customerSelect.options)
        .map((option, index) => ({
          index,
          texto: option.textContent?.trim() ?? '',
          valor: option.value
        }))
        .filter(option => option.texto.length > 0 && option.texto !== '[Selected]' && option.valor !== '');

      if (opcionesValidas.length === 0) {
        throw new Error('No se encontraron customers validos en cmbHiddenCustomers.');
      }

      const opcion = opcionesValidas[Math.floor(Math.random() * opcionesValidas.length)];
      customerSelect.selectedIndex = opcion.index;
      customerSelect.dispatchEvent(new Event('click', { bubbles: true }));
      customerSelect.dispatchEvent(new Event('change', { bubbles: true }));
      customerSelect.dispatchEvent(new Event('blur', { bubbles: true }));

      return opcion.texto;
    });
  }

  /** Valida si el customer indicado quedo visible en la fila del producto. */
  private async customerVisibleEnFila(integrationCode: string, customer: string): Promise<boolean> {
    const filaConCustomer = this.frameCenter.locator(
      `//tr[td[contains(normalize-space(.),'${integrationCode}')] and td[contains(normalize-space(.),'${customer}')]]`
    );

    return await filaConCustomer.first().isVisible().catch(() => false);
  }

  /** Guarda la PO y retorna el mensaje del popup de confirmacion. */
  async guardarPOYObtenerMensaje(): Promise<string> {
    const dialogPromise = new Promise<string | null>(resolve => {
      const handler = async (dialog: Dialog): Promise<void> => {
        clearTimeout(timer);
        const mensaje = dialog.message();
        await dialog.accept();
        resolve(mensaje);
      };
      const timer = setTimeout(() => {
        this.page.off('dialog', handler);
        resolve(null);
      }, 30000);

      this.page.once('dialog', handler);
    });

    await this.btnSave.first().waitFor({ state: 'visible', timeout: 15000 });
    await this.btnSave.first().click({ force: true });

    const mensajeDialog = await dialogPromise;
    if (mensajeDialog) {
      return mensajeDialog;
    }

    await this.popupPurchaseOrderGuardada.first().waitFor({ state: 'visible', timeout: 30000 });
    return (await this.popupPurchaseOrderGuardada.first().textContent())?.trim() ?? '';
  }

  /** Hace clic en aceptar cuando el popup de guardado es un modal interno. */
  async aceptarPopupSiEstaVisible(): Promise<void> {
    if (await this.btnAceptarPopupPurchaseOrder.first().isVisible().catch(() => false)) {
      await this.btnAceptarPopupPurchaseOrder.first().click();
    }
  }

  /** Acepta el SweetAlert de sobrescritura de landed cost cuando aparece. */
  async confirmarOverwriteLandedCostSiAparece(): Promise<void> {
    if (await this.btnConfirmarOverwriteLandedCost.first().isVisible().catch(() => false)) {
      await this.btnConfirmarOverwriteLandedCost.first().click();
      await this.spinnerCarga.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined);
    }
  }

  /** Obtiene el numero de PO visible en la pantalla New Purchase Order. */
  async obtenerNumeroPOVisible(): Promise<string> {
    await this.labelNumeroPO.first().waitFor({ state: 'visible', timeout: 30000 });
    const texto = (await this.labelNumeroPO.first().textContent())?.trim() ?? '';
    const numero = this.extraerNumeroPO(texto);

    if (!numero) {
      throw new Error(`No se pudo extraer el numero de PO desde la pantalla. Texto: ${texto}`);
    }

    return numero;
  }

  /** Extrae el numero de PO desde un texto de confirmacion o pantalla. */
  extraerNumeroPO(texto: string): string {
    return texto.match(/P\.?O\.?\s*#?:?\s*([A-Za-z0-9-]+)/i)?.[1] ?? texto.match(/\b([0-9]{4,})\b/)?.[1] ?? '';
  }

  /** Retorna la fila de resultados que contiene el integration code indicado. */
  private obtenerFilaResultadoProducto(integrationCode: string): Locator {
    return this.frameCenter
      .locator(`//div[@id='divResultsGrid']//tr[td[contains(normalize-space(.),'${integrationCode}')]] | //tr[td[contains(normalize-space(.),'${integrationCode}')]]`)
      .first();
  }

  /** Retorna la fila agregada al panel inferior para el integration code indicado. */
  private obtenerFilaProductoAgregado(integrationCode: string): Locator {
    return this.frameCenter
      .locator(`//tr[td[contains(normalize-space(.),'${integrationCode}')]]`)
      .first();
  }

  /** Retorna la celda Customer de la fila agregada para el integration code indicado. */
  private obtenerCeldaCustomerProducto(integrationCode: string): Locator {
    return this.obtenerFilaProductoAgregado(integrationCode)
      .locator("xpath=./td[count(//th[normalize-space(.)='Customer']/preceding-sibling::th) + 1]");
  }

  /** Retorna la fecha actual en formato MM/DD/YYYY para los campos de WebFlowers. */
  private obtenerFechaActualFormulario(): string {
    const hoy = new Date();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    const anio = hoy.getFullYear();

    return `${mes}/${dia}/${anio}`;
  }
}
