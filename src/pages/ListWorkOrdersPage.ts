import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ListWorkOrdersPage extends BasePage {

  constructor(page: Page) {
    super(page);
  }

  // ── Navegación ────────────────────────────────────────────────────────────

  /** Navega a Production → Work Orders → List desde el menú lateral */
  async navegarAListWorkOrders(): Promise<void> {
    await this.esperarFrameListo('menu');

    await this.frameMenu
      .locator("//div[@class='div-parent' and @title='Production']")
      .click();

    await this.frameMenu
      .locator("//div[@class='div-child' and @title='Work Orders']")
      .first()
      .waitFor({ state: 'visible' });

    await this.frameMenu
      .locator("//div[@class='div-child' and @title='Work Orders']")
      .first()
      .click();

    await this.frameMenu
      .locator("//ul[@id='sub3_Work_Orders_15']")
      .waitFor({ state: 'visible' });

    await this.frameMenu
      .locator("//ul[@id='sub3_Work_Orders_15']//div[@class='div-subchild' and @title='List']")
      .click();

    await this.esperarCargaModulo();
    await this.frameCenter
      .locator("//span[@class='pageHeader']")
      .waitFor({ state: 'visible', timeout: 30000 });
  }

  // ── Búsqueda ──────────────────────────────────────────────────────────────

  /**
   * Busca una Work Order por número en el campo Search Text
   * @param woNo  Número de WO (ej: "109045")
   */
  async buscarWO(woNo: string): Promise<void> {
    // Limpiar filtros de fecha para que no restrinjan el resultado
    const inputFrom = this.frameCenter.locator("//input[@id='txtFrom']");
    const inputTo   = this.frameCenter.locator("//input[@id='txtTo']");
    if (await inputFrom.isVisible()) await inputFrom.fill('');
    if (await inputTo.isVisible())   await inputTo.fill('');

    const input = this.frameCenter.locator("//input[@id='txtSearchText']");
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.fill(woNo);

    // Botón Search confirmado por inspección: id='btnSearch'
    await this.frameCenter
      .locator("//input[@id='btnSearch']")
      .click();
    await this.esperarCargaModulo();
  }

  // ── Abrir WO en modo edición ──────────────────────────────────────────────

  /**
   * Hace clic en el botón Edit de la primera fila del resultado
   * y espera que cargue el formulario de edición
   */
  async abrirEdicion(): Promise<void> {
    await this.frameCenter
      .locator("//input[@type='button' and @value='Edit']")
      .first()
      .click();

    await this.esperarCargaModulo();
    await this.frameCenter
      .locator("//span[@class='pageHeader']")
      .waitFor({ state: 'visible', timeout: 30000 });
  }

  // ── Finalizar WO ──────────────────────────────────────────────────────────

  /**
   * Finaliza la Work Order actualmente abierta.
   * Acepta dos popups en secuencia:
   *   1. "WARNING: Do you want to Finish Work Order?"
   *   2. "Work Order has been finished successfully!"
   */
  /**
   * Finaliza la Work Order actualmente abierta.
   * Acepta dos popups en secuencia:
   *   1. "WARNING: Do you want to Finish Work Order?"  → accept
   *   2. "Work Order has been finished successfully!"   → accept
   * @throws Error si el segundo popup contiene un mensaje de error
   */
  async finalizarWorkOrder(): Promise<void> {
    // Primer popup: confirmación WARNING
    this.page.once('dialog', async dialog => {
      console.log(`💬 Dialog Finish (1): ${dialog.message().substring(0, 80)}`);
      await dialog.accept();
    });

    await this.frameCenter
      .locator("//input[@id='btnFinish']")
      .click();

    // Segundo popup: éxito o error — capturar mensaje
    const mensajeSegundoDialog = await new Promise<string>(resolve => {
      this.page.once('dialog', async dialog => {
        const msg = dialog.message();
        console.log(`💬 Dialog Finish (2): ${msg.substring(0, 120)}`);
        await dialog.accept();
        resolve(msg);
      });
      setTimeout(() => resolve(''), 8000);
    });

    await this.page.waitForTimeout(1000);

    // Si el segundo popup es un error, lanzar excepción para que el test falle correctamente
    if (mensajeSegundoDialog.toLowerCase().startsWith('error')) {
      throw new Error(`❌ Finish rechazado por WebFlowers: "${mensajeSegundoDialog.substring(0, 120)}"`);
    }
  }

  // ── Validaciones ──────────────────────────────────────────────────────────

  /** Verifica que el formulario List/Edit Work Order esté cargado */
  async estaFormularioCargado(): Promise<boolean> {
    try {
      await this.frameCenter
        .locator("//span[@class='pageHeader']")
        .waitFor({ state: 'visible', timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verifica que la WO esté en estado FINISHED comprobando
   * la marca de agua (watermark) del formulario
   */
  /**
   * Verifica que la WO esté en estado FINISHED comprobando que
   * el src de la imagen de marca de agua contenga "finish" (case-insensitive).
   * El mismo div existe para STARTED — distinguir por el src del img.
   */
  async estaFinished(): Promise<boolean> {
    try {
      const img = this.frameCenter.locator("//div[@id='divLookHead']/img");
      await img.waitFor({ state: 'visible', timeout: 10000 });
      const src = (await img.getAttribute('src') ?? '').toLowerCase();
      console.log(`🖼️  divLookHead img src: ${src}`);
      return src.includes('finish');
    } catch {
      return false;
    }
  }
}
