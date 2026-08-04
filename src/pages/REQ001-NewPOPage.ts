import { FrameLocator, Locator, Page } from '@playwright/test';
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
  readonly campoStorage: Locator;
  readonly btnSave: Locator;
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
    this.campoStorage = this.frameCenter.locator(
      "//*[contains(normalize-space(.),'Storage')] | //input[contains(@data-ng-model,'Storage')] | //select[contains(@data-ng-model,'Storage')]"
    );
    this.btnSave = this.frameCenter.locator("input[value='Save']:visible, button:has-text('Save'):visible");
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
}
