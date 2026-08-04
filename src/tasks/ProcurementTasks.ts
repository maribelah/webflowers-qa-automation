import { Page } from '@playwright/test';
import { REQ001NewPOPage } from '../pages/REQ001-NewPOPage';

/**
 * Tasks del modulo Procurement.
 *
 * Orquesta flujos completos de navegacion reutilizando Page Classes.
 */
export class ProcurementTasks {
  private newPOPage: REQ001NewPOPage;

  constructor(page: Page) {
    this.newPOPage = new REQ001NewPOPage(page);
  }

  /** Navega desde el Dashboard hasta Procurement - New Purchase Order [Products]. */
  async navegarANewPOProducts(): Promise<void> {
    await this.newPOPage.abrirMenuProcurement();
    await this.newPOPage.seleccionarProducts();
    await this.newPOPage.clickNewPO();
    await this.newPOPage.esperarCargaNewPO();
  }
}
