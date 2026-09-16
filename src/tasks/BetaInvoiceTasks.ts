import { Page } from '@playwright/test';
import { REQ002NewInvoicePage } from '../pages/REQ002-NewInvoicePage';

/**
 * Tasks del modulo BETA Invoice.
 *
 * Orquesta flujos completos de navegacion reutilizando Page Classes.
 */
export class BetaInvoiceTasks {
  private newInvoicePage: REQ002NewInvoicePage;

  constructor(page: Page) {
    this.newInvoicePage = new REQ002NewInvoicePage(page);
  }

  /** Despliega Invoices en el menu lateral. */
  async desplegarInvoices(): Promise<void> {
    await this.newInvoicePage.abrirMenuInvoices();
  }
// 
  /** Despliega New dentro de Invoices. */
  async desplegarNew(): Promise<void> {
    await this.newInvoicePage.clickNew();
  }

  /** Abre la opcion Invoice dentro de Invoices - New. */
  async abrirInvoice(): Promise<void> {
    await this.newInvoicePage.clickInvoice();
  }

  /** Navega desde el Dashboard hasta Invoices - New - Invoice. */
  async navegarANewInvoice(): Promise<void> {
    await this.desplegarInvoices();
    await this.desplegarNew();
    await this.abrirInvoice();
    await this.newInvoicePage.esperarCargaNewInvoice();
  }
}
