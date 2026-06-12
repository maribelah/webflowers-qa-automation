import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class WorkOrdersPage extends BasePage {

  constructor(page: Page) {
    super(page);
  }

  // ── Navegación ────────────────────────────────────────────────────────────

  /** Navega a Production → Work Orders → New desde el menú lateral */
  async navegarANewWorkOrder(): Promise<void> {
    await this.esperarFrameListo('menu');

    await this.frameMenu
      .locator("//div[@class='div-parent' and @title='Production']")
      .click();

    // Esperar que se expanda el submenú de Production
    await this.frameMenu
      .locator("//div[@class='div-child' and @title='Work Orders']")
      .first()
      .waitFor({ state: 'visible' });

    await this.frameMenu
      .locator("//div[@class='div-child' and @title='Work Orders']")
      .first()
      .click();

    // Esperar que se expanda el submenú de Work Orders
    await this.frameMenu
      .locator("//ul[@id='sub3_Work_Orders_15']")
      .waitFor({ state: 'visible' });

    await this.frameMenu
      .locator("//ul[@id='sub3_Work_Orders_15']//div[@class='div-subchild' and @title='New']")
      .click();

    await this.esperarCargaModulo();
    await this.frameCenter
      .locator("//span[@class='pageHeader']")
      .waitFor({ state: 'visible', timeout: 30000 });
  }

  // ── Validación ────────────────────────────────────────────────────────────

  /** Verifica que el formulario New/Edit Work Order esté cargado */
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

  // ── Agregar líneas de producto (popup Search Order Lines) ─────────────────

  /**
   * Abre el popup Search Order Lines haciendo clic en Add
   */
  async abrirSearchOrderLines(): Promise<void> {
    await this.frameCenter
      .locator("//input[@id='btnAddLine']")
      .click();

    await this.frameCenter
      .locator("//span[@id='spanTitle']")
      .waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Busca las líneas de la Sales Order por número de orden.
   * @param orderNo     Número de orden de venta (ej: "075621")
   * @param dateToOffset Días a sumar a la fecha actual para Date To (default: 1)
   */
  async buscarLineasOrden(orderNo: string, dateToOffset = 1): Promise<void> {
    // Ingresar Date To (fecha actual + offset)
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + dateToOffset);
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const año = fecha.getFullYear();
    const fechaFormato = `${mes}/${dia}/${año}`;

    const inputDateTo = this.frameCenter.locator("//input[@id='txtDateTo']");
    await inputDateTo.waitFor({ state: 'visible' });
    await inputDateTo.fill(fechaFormato);

    // Ingresar número de orden
    await this.frameCenter
      .locator("//input[@id='txtOrderNumber']")
      .fill(orderNo);

    // Clic en Search y esperar que desaparezca el spinner
    await this.frameCenter
      .locator("//input[@id='btnSearch']")
      .click();

    await this.esperarFinWorking();
  }

  /**
   * Ingresa las cajas para cada línea del resultado de búsqueda
   * @param linea   Índice base 0 (0 = primera línea, 1 = segunda)
   * @param cajas   Cantidad de cajas
   */
  async ingresarCajas(linea: number, cajas: number): Promise<void> {
    const input = this.frameCenter.locator(`//input[@id='txtToAdd${linea}']`);
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.fill(String(cajas));
  }

  /** Hace clic en Add to WO y espera que se procese */
  async agregarAWO(): Promise<void> {
    await this.frameCenter
      .locator("//input[@id='btnAddToCart']")
      .click();
    await this.esperarFinWorking();
  }

  /** Vuelve al formulario principal de la Work Order */
  async volverAOrden(): Promise<void> {
    await this.frameCenter
      .locator("//input[@id='btnBackToOrder']")
      .click();
    await this.frameCenter
      .locator("//span[@class='pageHeader']")
      .waitFor({ state: 'visible', timeout: 10000 });
  }

  // ── Pestaña Assign To ─────────────────────────────────────────────────────

  /** Activa la pestaña Assign To forzando CSS en tblTab1 y sus selectores */
  async abrirTabAssignTo(): Promise<void> {
    // Clic en el tab primero (señal visual para WebFlowers)
    await this.frameCenter.locator("//div[@id='divTab1']").click();
    await this.page.waitForTimeout(300);

    // Forzar visibilidad del panel Assign To y su select en el frame correcto
    const frames = this.page.frames();
    for (const frame of frames) {
      try {
        const ok = await frame.evaluate(() => {
          const tab1 = document.getElementById('tblTab1');
          if (!tab1) return false;

          // Forzar panel Assign To visible
          (tab1 as HTMLElement).style.display = 'block';

          // Forzar panel Product Lines oculto
          const tab0 = document.getElementById('tblTab0');
          if (tab0) (tab0 as HTMLElement).style.display = 'none';

          // Hacer visible cmbProductionGroup (WorkGroups) y todos sus ancestros dentro del panel
          const sel = document.getElementById('cmbProductionGroup') as HTMLElement;
          if (sel) {
            let el: HTMLElement | null = sel;
            while (el && el.id !== 'tblTab1') {
              if (getComputedStyle(el).display === 'none') el.style.display = 'block';
              el = el.parentElement;
            }
            sel.style.display = 'block';
          }
          return true;
        });
        if (ok) {
          console.log('✅ Tab Assign To y cmbProductionGroup forzados visibles');
          break;
        }
      } catch { /* frame equivocado */ }
    }
    await this.page.waitForTimeout(300);
  }

  /**
   * Selecciona un grupo de producción.
   * Prioriza cmbProductionGroupByBatch (WorkGroup). Si está oculto, usa cmbProductionGroup.
   * @param indice Índice de la opción (1 = primera opción no vacía)
   */
  /**
   * Selecciona un WorkGroup del select cmbProductionGroup (visible, con grupos reales)
   * y llama cmbProductionGroup_onclick para registrar la selección en WebFlowers.
   * @param indice Índice de la opción (1 = Satellite 1, 2 = Arrangement 1, etc.)
   */
  async seleccionarGrupoProduccion(indice = 1): Promise<void> {
    const select = this.frameCenter.locator("//select[@id='cmbProductionGroup']");
    await select.waitFor({ state: 'visible', timeout: 10000 });

    // Seleccionar la opción — dispara change/input events
    await select.selectOption({ index: indice });

    // Llamar cmbProductionGroup_onclick — puede hacer AJAX al servidor
    await select.evaluate((el: HTMLSelectElement) => {
      const fn = (window as any).cmbProductionGroup_onclick;
      if (typeof fn === 'function') fn(el);
      const fnChange = (window as any).cmbProductionGroup_onchange;
      if (typeof fnChange === 'function') fnChange();
    });

    // Esperar AJAX del onclick (WebFlowers hace llamada al servidor para validar el grupo)
    await this.page.waitForTimeout(2000);

    const textoSeleccionado = await select.evaluate(
      (el: HTMLSelectElement) => el.options[el.selectedIndex]?.text ?? ''
    );
    console.log(`✅ WorkGroup seleccionado: "${textoSeleccionado}" (índice ${indice})`);
  }

  /** Retorna el texto del grupo de producción actualmente seleccionado */
  async obtenerGrupoSeleccionado(): Promise<string> {
    const select = this.frameCenter.locator("//select[@id='cmbProductionGroupByBatch']");
    return await select.inputValue();
  }

  /** Retorna cuántas opciones tiene el select de grupos (sin contar la primera vacía) */
  async contarGruposDisponibles(): Promise<number> {
    const select = this.frameCenter.locator("//select[@id='cmbProductionGroupByBatch']");
    const count = await select.locator('option').count();
    return Math.max(0, count - 1); // descontar la primera opción vacía
  }

  // ── Guardar Work Order ────────────────────────────────────────────────────

  /**
   * Guarda la Work Order. Acepta el popup de confirmación.
   * @returns Número de Work Order generado
   */
  async guardarWorkOrder(): Promise<string> {
    // Registrar handler del dialog ANTES del click para no perderlo
    this.page.once('dialog', async dialog => {
      console.log(`💬 Dialog Save WO: ${dialog.message()}`);
      await dialog.accept();
    });

    await this.frameCenter
      .locator("//input[@id='btnSave']")
      .click();

    await this.page.waitForTimeout(1000);

    // Leer el número de WO generado
    // lblWorkOrderNumber está oculto hasta que se guarda — esperar que aparezca
    const lblWO = this.frameCenter.locator("//span[@id='lblWorkOrderNumber']");
    await lblWO.waitFor({ state: 'visible', timeout: 20000 });
    const woNo = await lblWO.textContent();
    console.log(`✅ WO No. leído: ${woNo?.trim()}`);
    return woNo?.trim() ?? '';
  }

  // ── Start Work Order ──────────────────────────────────────────────────────

  /**
   * Inicia la Work Order. Maneja el error de grupo ocupado con reintentos.
   * Si el grupo está ocupado, intenta con el siguiente grupo disponible.
   * @param maxReintentos Máximo de reintentos (default: 5)
   * @returns Work Order Number tras el inicio exitoso
   */
  async iniciarWorkOrder(maxReintentos = 5): Promise<string> {
    for (let intento = 1; intento <= maxReintentos; intento++) {
      console.log(`▶️  Intento ${intento} de Start WO...`);

      // Registrar handler del dialog ANTES del click — igual que en guardarWorkOrder
      let mensajeDialog = '';
      this.page.once('dialog', async dialog => {
        mensajeDialog = dialog.message();
        console.log(`💬 Dialog Start WO: ${mensajeDialog}`);
        await dialog.accept();
      });

      await this.frameCenter
        .locator("//input[@id='btnStart']")
        .click();

      // Esperar que el dialog sea procesado
      await this.page.waitForTimeout(1500);
      const resultado = mensajeDialog;

      if (resultado.includes('could not be started') || resultado.includes('Error') || resultado.includes('must select')) {
        console.warn(`⚠️  Error al iniciar — reintentando (intento ${intento}): "${resultado.substring(0, 80)}"`);
        await this.abrirTabAssignTo();
        const grupos = await this.contarGruposDisponibles();
        // Probar todos los índices de 1 a grupos en secuencia
        const siguienteIndice = Math.min(intento + 1, grupos);
        await this.seleccionarGrupoProduccion(siguienteIndice);
        const woNo = await this.guardarWorkOrder();
        console.log(`✅ WO re-guardada con grupo ${siguienteIndice}: ${woNo}`);
        continue;
      }

      // Start exitoso
      const lblWO = this.frameCenter.locator("//span[@id='lblWorkOrderNumber']");
      const woNo = await lblWO.textContent();
      console.log(`✅ WO iniciada: ${woNo?.trim()}`);
      return woNo?.trim() ?? '';
    }

    throw new Error(`❌ No se pudo iniciar la Work Order tras ${maxReintentos} intentos`);
  }

  // ── Métodos de espera y popups ────────────────────────────────────────────

  /** Espera a que desaparezca el spinner de carga de la WO */
  async esperarFinWorking(): Promise<void> {
    const spinner = this.frameCenter.locator("//div[@id='divProgress']");
    try {
      await spinner.waitFor({ state: 'visible', timeout: 3000 });
      await spinner.waitFor({ state: 'hidden', timeout: 30000 });
    } catch { /* operación rápida sin spinner */ }
  }

  /**
   * Acepta un popup/dialog — maneja tanto dialogs nativos del browser
   * como modales de Angular dentro del iframe.
   */
  async aceptarPopup(): Promise<void> {
    try {
      // Intentar dialog nativo del browser
      this.page.once('dialog', async dialog => {
        console.log(`💬 Dialog: ${dialog.message()}`);
        await dialog.accept();
      });
      await this.page.waitForTimeout(1000);
    } catch { /* sin dialog nativo */ }

    // Intentar modal Angular (botón OK/Accept dentro del iframe)
    try {
      const btnOk = this.frameCenter.locator(
        "//button[contains(text(),'OK') or contains(text(),'Accept') or contains(text(),'Aceptar')]"
      ).first();
      if (await btnOk.isVisible({ timeout: 2000 })) {
        await btnOk.click();
      }
    } catch { /* sin modal Angular */ }
  }

  /**
   * Acepta un popup y retorna el texto del mensaje.
   * Útil para detectar si el mensaje es de éxito o de error.
   */
  async aceptarPopupConResultado(): Promise<string> {
    let mensaje = '';

    // Capturar dialog nativo
    const dialogPromise = new Promise<string>(resolve => {
      this.page.once('dialog', async dialog => {
        mensaje = dialog.message();
        await dialog.accept();
        resolve(mensaje);
      });
    });

    // Esperar el dialog con timeout
    try {
      await Promise.race([
        dialogPromise,
        this.page.waitForTimeout(3000)
      ]);
    } catch { /* timeout — sin dialog */ }

    // Si no fue dialog nativo, buscar modal Angular
    if (!mensaje) {
      try {
        const modal = this.frameCenter.locator(
          "//div[contains(@class,'modal') or contains(@class,'popup')]"
        ).first();
        if (await modal.isVisible({ timeout: 2000 })) {
          mensaje = await modal.textContent() ?? '';
          const btnOk = this.frameCenter.locator(
            "//button[contains(text(),'OK') or contains(text(),'Aceptar')]"
          ).first();
          if (await btnOk.isVisible()) await btnOk.click();
        }
      } catch { /* sin modal */ }
    }

    return mensaje;
  }
}
