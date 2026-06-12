import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class NewPurchaseOrderPage extends BasePage {

  readonly formularioPrincipal: Locator;

 constructor(page: Page) {
  super(page);
  this.formularioPrincipal = this.frameCenter
    .locator("//span[@id='pageHeader']");
}

  /**
   * Navega al módulo New PO a través del menú de Procurement.
   */
async navigateToNewPurchaseOrder(): Promise<void> {
  await this.esperarFrameListo('menu');

  await this.frameMenu
    .locator("//div[@class='div-parent' and @title='Procurement']")
    .click();

  // Esperar que aparezca el submenú de Products
  await this.frameMenu
    .locator("//div[@class='div-parent' and @title='Procurement']/ul/li[3]/div")
    .waitFor({ state: 'visible' });

  await this.frameMenu
    .locator("//div[@class='div-parent' and @title='Procurement']/ul/li[3]/div")
    .click();

  // Esperar que aparezca el submenú de New PO
  await this.frameMenu
    .locator("//ul[@id='sub2_Products_11']")
    .waitFor({ state: 'visible' });

  await this.frameMenu
    .locator("//ul[@id='sub2_Products_11']/li[4]/div")
    .click();

  await this.esperarCargaModulo();
}

  /**
   * Valida que el formulario principal de New PO esté visible.
   */
  async validarModuloCargado(): Promise<void> {
    await this.validarVisible(this.formularioPrincipal);
  }

  /**
   * Retorna si el formulario principal de New PO está visible.
   * @returns true si el formulario está visible
   */
  async isNewPOFormVisible(): Promise<boolean> {
    return await this.formularioPrincipal.isVisible();
  }
}
