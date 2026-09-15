import { test, expect } from '../../src/fixtures/base.fixture';
import { ENV } from '../../src/utils/envConfig';
import { waitForAppReady, clickResilient } from '../../src/utils/waitUtils';
import fs from 'fs';

test.describe('Modulo Bulk Changes - Flujo principal Product Name', () => {
  test('Bulkchanges Product Name - aplicar cambio masivo y validar Adjusted Name', async ({ page }) => {
    fs.mkdirSync('reports/screenshots', { recursive: true });
    fs.mkdirSync('reports/html', { recursive: true });
    test.setTimeout(720000);

    let orderReferenceCapturado = '';
    let orderReferenceCompletoCapturado = '';
    let itemOrderReferenceCapturado = '';
    let productNameBase = '';
    let adjustedNameAsignado = '';
    const hoyEjecucion = new Date();
    const logDateEsperado = `${String(hoyEjecucion.getMonth() + 1).padStart(2, '0')}/${String(hoyEjecucion.getDate()).padStart(2, '0')}/${hoyEjecucion.getFullYear()}`;
    const fechaHoraEjecucion = `${hoyEjecucion.getFullYear()}/${String(hoyEjecucion.getMonth() + 1).padStart(2, '0')}/${String(hoyEjecucion.getDate()).padStart(2, '0')} ${String(hoyEjecucion.getHours()).padStart(2, '0')}:${String(hoyEjecucion.getMinutes()).padStart(2, '0')}:${String(hoyEjecucion.getSeconds()).padStart(2, '0')}`;
    const orderReferenceRegex = /[A-Z]{2}\d{4}(?:-\d+)?/;
    const extraerOrderReference = (texto: string) => texto.match(orderReferenceRegex)?.[0] ?? '';
    const normalizarValor = (valor: string) => String(valor || '').trim().replace(/\s+/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    const valoresCoinciden = (valorA: string, valorB: string) => {
      const a = normalizarValor(valorA);
      const b = normalizarValor(valorB);
      return !!a && !!b && (a === b || a.includes(b) || b.includes(a));
    };

    const tomarScreenshotPagina = async (pageActual: any, path: string) => {
      try {
        const tomarRecorte = async (x: number, y: number, width: number, height: number) => {
          const viewport = await pageActual.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));
          await pageActual.screenshot({
            path,
            clip: { x, y, width: Math.min(1710, Math.floor(width), viewport.width - x), height: Math.min(971, Math.floor(height), viewport.height - y) },
            timeout: 60000,
          });
        };

        const frameCentral = pageActual.locator('iframe#center_page');
        if (await frameCentral.isVisible({ timeout: 2000 }).catch(() => false)) {
          const box = await frameCentral.boundingBox();
          if (box) {
            await tomarRecorte(Math.floor(box.x), Math.floor(box.y), box.width, box.height);
            return;
          }
        }

        const viewport = await pageActual.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));
        await pageActual.screenshot({
          path,
          clip: { x: 0, y: 0, width: Math.min(1710, viewport.width), height: Math.min(971, viewport.height) },
          timeout: 60000,
        });
      } catch (error) {
        console.log(`No se pudo guardar screenshot ${path}: ${(error as Error).message}`);
        await pageActual.screenshot({ path, fullPage: false, timeout: 60000 }).catch(() => undefined);
      }
    };
    const tomarScreenshot = async (path: string) => tomarScreenshotPagina(page, path);

    const guardarHtmlFrame = async (frameName: string, path: string) => {
      const frame = page.frame({ name: frameName }) ?? page.frames().find(f => f.name() === frameName);
      if (frame) {
        fs.writeFileSync(path, await frame.content());
      }
    };

    const clickPrimerMenuVisible = async (descripcion: string, candidatos: any[]) => {
      let ultimoError: unknown;
      for (const candidato of candidatos) {
        const locator = candidato.first();
        try {
          await locator.waitFor({ state: 'visible', timeout: 7000 });
          await locator.scrollIntoViewIfNeeded();
          await locator.click({ timeout: 15000 });
          return;
        } catch (error) {
          ultimoError = error;
        }
      }

      throw ultimoError instanceof Error ? ultimoError : new Error(`No se pudo hacer click en ${descripcion}`);
    };

    await test.step('Navegar a la URL del ambiente', async () => {
      const t0 = Date.now();
      await page.goto(ENV.url, { waitUntil: 'domcontentloaded' });
      await waitForAppReady(page, 30000);
      console.log(`NAVIGATE: ${Date.now() - t0}ms`);
      await tomarScreenshot('reports/screenshots/01-inicio.png');
    });

    await test.step('Login', async () => {
      const t0 = Date.now();
      const sesionActiva = await page.locator('iframe#left_page1, iframe#center_page').first().isVisible({ timeout: 3000 }).catch(() => false);
      if (!sesionActiva) {
        await page.fill('input[name="txtUserName"]', ENV.usuario);
        await page.fill('input[name="txtPassword"]', ENV.password);
        await clickResilient(page.locator('#btnSigIn'));
      }
      await waitForAppReady(page, 30000);
      console.log(`LOGIN: ${Date.now() - t0}ms`);
      await tomarScreenshot('reports/screenshots/02-post-login.png');
    });

    await test.step('Navegar a Sales -> Bulk Changes', async () => {
      const t0 = Date.now();
      const frameMenu = page.frameLocator('iframe#left_page1');
      await page.locator('iframe#left_page1').waitFor({ state: 'attached', timeout: 30000 });
      await page.waitForTimeout(3000);
      await clickPrimerMenuVisible('Sales', [
        frameMenu.locator('div[data-toggle="collapse"][data-target="#subSales"]'),
        frameMenu.getByText('Sales', { exact: true }),
        frameMenu.locator('xpath=//*[normalize-space()="Sales"]'),
      ]);
      await page.waitForTimeout(2000);
      await clickPrimerMenuVisible('Bulk Changes', [
        frameMenu.locator('a.link:has-text("Bulk Changes")'),
        frameMenu.locator('div.div-child[title="Bulk Changes"] a.link'),
        frameMenu.locator('span.label-text:text-is("Bulk Changes")'),
        frameMenu.getByText('Bulk Changes', { exact: true }),
        frameMenu.locator('xpath=//*[normalize-space()="Bulk Changes"]'),
      ]).catch(async (error) => {
        await guardarHtmlFrame('left_page1', 'reports/html/03-left-menu-bulkchanges-fail.html');
        throw error;
      });
      await page.waitForTimeout(5000);
      console.log(`NAV_MENU: ${Date.now() - t0}ms`);
      await tomarScreenshot('reports/screenshots/03-bulk-changes.png');
    });

    await test.step('Click en Search', async () => {
      const t0 = Date.now();
      const frameCenter = page.frameLocator('iframe#center_page');
      await frameCenter.locator('xpath=/html/body/div/div/form/div[2]/button').click();
      await page.waitForTimeout(10000);
      await expect(frameCenter.locator('body')).toContainText(/[A-Z]{2}\d{4}/, { timeout: 60000 });
      console.log(`SEARCH: ${Date.now() - t0}ms`);
      await tomarScreenshot('reports/screenshots/04-post-search.png');
      await guardarHtmlFrame('center_page', 'reports/html/04-center.html');
    });

    await test.step('Seleccionar primer registro y capturar datos', async () => {
      const t0 = Date.now();
      const frameCenter = page.frameLocator('iframe#center_page');
      const centerFrame = page.frame({ name: 'center_page' }) ?? page.frames().find(f => f.name() === 'center_page');
      if (centerFrame) {
        fs.writeFileSync('reports/html/05a-antes-checkbox.html', await centerFrame.content());
      }

      const checkboxPrimerRegistro = frameCenter.locator('xpath=/html/body/div/div/div[1]/div/div[1]/div[2]/div[2]/div/div[1]/div[2]/span/input');
      await checkboxPrimerRegistro.waitFor({ state: 'visible', timeout: 10000 });
      await checkboxPrimerRegistro.click({ timeout: 10000 });

      const filaSeleccionada = frameCenter.locator('[role="row"][aria-selected="true"], .MuiDataGrid-row.Mui-selected').first();
      await filaSeleccionada.waitFor({ state: 'visible', timeout: 10000 });
      const textoFilaSeleccionada = await filaSeleccionada.textContent({ timeout: 5000 }) ?? '';
      orderReferenceCompletoCapturado = extraerOrderReference(textoFilaSeleccionada);

      const datosFila = await filaSeleccionada.evaluate((row: Element) => {
        const obtenerTexto = (element: Element | null) => {
          if (!element) return '';
          const input = element as HTMLInputElement;
          const htmlElement = element as HTMLElement;
          return (input.value || htmlElement.textContent || htmlElement.getAttribute('title') || htmlElement.getAttribute('aria-label') || '').trim();
        };
        const normalizar = (valor: string) => String(valor || '').trim().replace(/\s+/g, ' ').toUpperCase();
        const rowElement = row as HTMLElement;
        const grid = rowElement.closest('[role="grid"], .MuiDataGrid-root') ?? document;
        const headers = Array.from(grid.querySelectorAll('[role="columnheader"], .MuiDataGrid-columnHeader')) as HTMLElement[];
        const headerProduct = headers.find((header) => {
          const textoHeader = normalizar(header.innerText || header.textContent || header.getAttribute('aria-label') || header.getAttribute('data-field') || '');
          return /PRODUCT\s*NAME|PRODUCTO|PRODUCT/.test(textoHeader);
        });

        const dataField = headerProduct?.getAttribute('data-field');
        if (dataField) {
          const cell = Array.from(rowElement.querySelectorAll('[data-field]')).find((element) => element.getAttribute('data-field') === dataField);
          const valor = obtenerTexto(cell ?? null);
          if (valor) return { productName: valor };
        }

        const ariaColIndex = headerProduct?.getAttribute('aria-colindex');
        if (ariaColIndex) {
          const cell = rowElement.querySelector(`[aria-colindex="${ariaColIndex}"]`);
          const valor = obtenerTexto(cell);
          if (valor) return { productName: valor };
        }

        const cells = Array.from(rowElement.querySelectorAll('[role="cell"], .MuiDataGrid-cell, td')) as HTMLElement[];
        const cellProduct = cells.find((cell) => [cell.getAttribute('data-field'), cell.getAttribute('aria-label'), cell.getAttribute('title'), cell.id, cell.className?.toString()].join(' ').match(/product\s*name|product|producto/i));
        return { productName: obtenerTexto(cellProduct ?? null) };
      });

      productNameBase = String(datosFila.productName || '').trim().slice(0, 15).trim();
      adjustedNameAsignado = `${productNameBase} PRUEBAS QA ${fechaHoraEjecucion}`.trim();
      if (orderReferenceCompletoCapturado) {
        orderReferenceCapturado = orderReferenceCompletoCapturado.substring(0, 6);
        itemOrderReferenceCapturado = orderReferenceCompletoCapturado.split('-')[1] ?? '';
      }

      expect(orderReferenceCompletoCapturado).toMatch(/^[A-Z]{2}\d{4}(?:-\d+)?$/);
      expect(orderReferenceCapturado).toMatch(/^[A-Z]{2}\d{4}$/);
      expect(itemOrderReferenceCapturado).toMatch(/^\d+$/);
      expect(productNameBase, 'Debe capturar los 15 primeros caracteres del Product Name de la fila seleccionada').not.toBe('');

      console.log(`Order Reference seleccionado: ${orderReferenceCompletoCapturado}`);
      console.log(`Prefijo seleccionado: ${orderReferenceCapturado}`);
      console.log(`Item seleccionado: ${itemOrderReferenceCapturado}`);
      console.log(`Product Name base: ${productNameBase}`);
      console.log(`Adjusted Name asignado: ${adjustedNameAsignado}`);
      console.log(`CHECKBOX: ${Date.now() - t0}ms`);
      await tomarScreenshot('reports/screenshots/05-checkbox-selected.png');
      if (centerFrame) {
        fs.writeFileSync('reports/html/05b-despues-checkbox.html', await centerFrame.content());
      }
    });

    await test.step('Abrir selector y seleccionar Product Name', async () => {
      const t0 = Date.now();
      const frameCenter = page.frameLocator('iframe#center_page');
      await page.waitForTimeout(10000);
      await frameCenter.locator('xpath=/html/body/div/div/div[2]/div/div[1]/span/span[2]/span/div/div/div').click({ timeout: 10000 });
      await page.waitForTimeout(2000);
      await tomarScreenshot('reports/screenshots/06-after-click.png');
      await clickPrimerMenuVisible('Product Name', [
        frameCenter.locator('xpath=/html/body/div[2]/div[3]/ul/li[normalize-space()="Product Name"]'),
        frameCenter.locator('xpath=/html/body/div[2]/div[3]/ul/li[contains(normalize-space(),"Product Name")]'),
        frameCenter.getByText(/^Product\s*Name$/i),
      ]);
      await page.waitForTimeout(5000);
      console.log(`SELECT_PRODUCT_NAME: ${Date.now() - t0}ms`);
      await tomarScreenshot('reports/screenshots/07-product-name-selected.png');
    });

    await test.step('Ingresar Adjusted Name', async () => {
      const t0 = Date.now();
      const frameCenter = page.frameLocator('iframe#center_page');
      const adjustedNameInput = frameCenter.locator('xpath=(//*[normalize-space()="Adjusted Name" or contains(normalize-space(),"Adjusted Name")]/following::input[1] | //input[@name="AdjustedName" or @id="AdjustedName" or contains(@name,"Adjusted") or contains(@id,"Adjusted")])[1]');
      await adjustedNameInput.waitFor({ state: 'visible', timeout: 30000 });
      await adjustedNameInput.clear();
      await adjustedNameInput.fill(adjustedNameAsignado);
      console.log(`Adjusted Name ingresado: ${adjustedNameAsignado}`);
      console.log(`INPUT_PRODUCT_NAME: ${Date.now() - t0}ms`);
      await tomarScreenshot('reports/screenshots/08-product-name-value-entered.png');
    });

    await test.step('Click en Save Product Name', async () => {
      const t0 = Date.now();
      const frameCenter = page.frameLocator('iframe#center_page');
      const saveButton = frameCenter.getByRole('button', { name: /^Save$/i });
      await expect(saveButton).toBeEnabled({ timeout: 30000 });
      await saveButton.click({ timeout: 10000 });
      await page.waitForTimeout(5000);
      console.log(`SAVE_PRODUCT_NAME: ${Date.now() - t0}ms`);
      await tomarScreenshot('reports/screenshots/09-after-save.png');
    });

    await test.step('Click en Apply y confirmar guardado', async () => {
      const t0 = Date.now();
      const frameCenter = page.frameLocator('iframe#center_page');
      const centerFrame = page.frame({ name: 'center_page' }) ?? page.frames().find(f => f.name() === 'center_page');
      const applyButton = frameCenter.locator('xpath=/html/body/div/div/div[2]/div/div[3]/span/span[2]/span/button');
      await applyButton.waitFor({ state: 'visible', timeout: 15000 });
      await expect(applyButton).toBeEnabled({ timeout: 60000 });
      const textoBotonAntes = await applyButton.textContent();
      await tomarScreenshot('reports/screenshots/10a-antes-apply.png');
      await applyButton.click({ timeout: 10000 });
      await page.waitForTimeout(500);
      await tomarScreenshot('reports/screenshots/10b-despues-apply-click.png');

      let procesoConfirmado = false;
      const indicadoresExito = ['text=success', 'text=Success', 'text=successfully', 'text=Successfully', 'text=completed', 'text=Completed', 'text=applied', 'text=Applied', 'text=updated', 'text=Updated', 'text=saved', 'text=Saved', '//*[contains(@class,"success")]', '//*[contains(@class,"toast-success")]', '.MuiAlert-standardSuccess', '[class*="success"]'];
      for (let elapsedTime = 0; elapsedTime < 60000 && !procesoConfirmado; elapsedTime += 2000) {
        for (const selector of indicadoresExito) {
          if (await frameCenter.locator(selector).first().isVisible({ timeout: 500 }).catch(() => false)) {
            procesoConfirmado = true;
            break;
          }
        }
        if (procesoConfirmado) break;
        const textoBotonAhora = await applyButton.textContent().catch(() => null);
        const estaVisible = await applyButton.isVisible().catch(() => false);
        if (!estaVisible || (textoBotonAhora !== null && textoBotonAhora !== textoBotonAntes)) {
          procesoConfirmado = true;
          break;
        }
        await page.waitForTimeout(2000);
      }

      await page.waitForTimeout(3000);
      await tomarScreenshot('reports/screenshots/10c-estado-final-apply.png');
      if (centerFrame) {
        const htmlFinal = await centerFrame.content();
        fs.writeFileSync('reports/html/10-apply-final.html', htmlFinal);
        const htmlLower = htmlFinal.toLowerCase();
        procesoConfirmado = procesoConfirmado || htmlLower.includes('success') || htmlLower.includes('completed') || htmlLower.includes('applied') || htmlLower.includes('updated');
      }
      expect(procesoConfirmado, 'El proceso Apply debe finalizar correctamente mediante mensaje o estado de exito').toBeTruthy();
      console.log(`APPLY: ${Date.now() - t0}ms`);
      await tomarScreenshot('reports/screenshots/11-final-state.png');
      if (centerFrame) {
        fs.writeFileSync('reports/html/11-final-state.html', await centerFrame.content());
      }
    });

    await test.step('Navegar a Sales -> New -> Order Entry y validar Product', async () => {
      const t0 = Date.now();
      const frameMenu = page.frameLocator('iframe#left_page1');
      await page.locator('iframe#left_page1').waitFor({ state: 'attached', timeout: 30000 });
      await clickPrimerMenuVisible('Sales', [frameMenu.locator('div[data-toggle="collapse"][data-target="#subSales"]'), frameMenu.getByText('Sales', { exact: true }), frameMenu.locator('xpath=//*[normalize-space()="Sales"]')]);
      await page.waitForTimeout(2000);
      await clickPrimerMenuVisible('New', [frameMenu.locator('div[data-toggle="collapse"][data-target="#sub0_New_10"]'), frameMenu.getByText('New', { exact: true }), frameMenu.locator('xpath=//*[normalize-space()="New"]')]);
      await page.waitForTimeout(2000);
      await clickPrimerMenuVisible('Order Entry', [frameMenu.locator('a.link:has-text("Order Entry")'), frameMenu.locator('span.label-text:text-is("Order Entry")'), frameMenu.getByText('Order Entry', { exact: true }), frameMenu.locator('xpath=//*[normalize-space()="Order Entry"]')]);
      await page.waitForTimeout(20000);

      const frameCenter = page.frameLocator('iframe#center_page');
      const orderEntrySearchXpath = 'xpath=/html/body/form/div[3]/div[3]/div[1]/input';
      await frameCenter.locator(orderEntrySearchXpath).fill(orderReferenceCapturado);
      await frameCenter.locator(orderEntrySearchXpath).press('Enter');
      await page.waitForTimeout(5000);
      const centerFrame = await page.locator('iframe#center_page').elementHandle().then((iframe) => iframe?.contentFrame());
      if (!centerFrame) throw new Error('No se encontro iframe center_page para validar Product en Order Entry');

      let productVisible = false;
      for (let intento = 1; intento <= 5; intento++) {
        const valoresOrderEntry = await centerFrame.locator('td:visible, th:visible, span:visible, div:visible, input:visible, textarea:visible').evaluateAll((elements) =>
          elements.map((element) => {
            const htmlElement = element as HTMLElement;
            const input = element as HTMLInputElement;
            return (input.value || htmlElement.textContent || htmlElement.getAttribute('title') || htmlElement.getAttribute('aria-label') || '').trim();
          }).filter((value) => value)
        );
        fs.writeFileSync(`reports/html/12-order-entry-product-values-intento-${intento}.json`, JSON.stringify(valoresOrderEntry, null, 2));
        productVisible = valoresOrderEntry.some((valor) => valoresCoinciden(valor, adjustedNameAsignado));
        if (productVisible) break;
        if (intento < 5) {
          await frameCenter.locator(orderEntrySearchXpath).fill(orderReferenceCapturado);
          await frameCenter.locator(orderEntrySearchXpath).press('Enter');
          await page.waitForTimeout(30000);
        }
      }
      fs.writeFileSync('reports/html/12-order-entry.html', await centerFrame.content());
      await tomarScreenshot('reports/screenshots/12-order-entry.png');
      await tomarScreenshot('reports/screenshots/12-order-entry-frame.png');
      expect(productVisible, `Debe visualizarse el Product ${adjustedNameAsignado} en Order Entry`).toBeTruthy();
      console.log(`ORDER_ENTRY: ${Date.now() - t0}ms`);
    });

    await test.step('Abrir BETA GR y validar Historia -> New Value', async () => {
      const t0 = Date.now();
      const comprasPage = await page.context().newPage();
      if (process.env.PW_VISIBLE === '1') {
        await comprasPage.setViewportSize({ width: 1920, height: 1200 });
        await comprasPage.bringToFront();
      }

      await comprasPage.goto('https://betagr.ghtcorptest.com/', { waitUntil: 'domcontentloaded' });
      await comprasPage.waitForTimeout(3000);
      await tomarScreenshotPagina(comprasPage, 'reports/screenshots/13-betagr-inicio.png');
      const userInput = comprasPage.locator('input[name="txtUserName"]');
      if (await userInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await userInput.fill(ENV.usuario);
        await comprasPage.locator('input[name="txtPassword"]').fill(ENV.password);
        await waitForAppReady(comprasPage, 30000);
        await clickResilient(comprasPage.locator('#btnSigIn'));
        await waitForAppReady(comprasPage, 30000);
      }

      const frameMenu = comprasPage.frameLocator('iframe#left_page1');
      await comprasPage.locator('iframe#left_page1').waitFor({ state: 'attached', timeout: 30000 });
      await clickPrimerMenuVisible('Compras', [frameMenu.getByText('Compras', { exact: true }), frameMenu.locator('xpath=//*[normalize-space()="Compras"]'), frameMenu.locator('xpath=/html/body/form/div[3]/div/div/div[1]/ul/li[8]/div/div/div')]);
      await comprasPage.waitForTimeout(2000);
      await tomarScreenshotPagina(comprasPage, 'reports/screenshots/14-betagr-compras.png');
      await clickPrimerMenuVisible('Asignacion de ordenes', [frameMenu.getByText(/Asignaci[oó]n(?: de)? Orden/i), frameMenu.locator('xpath=//*[contains(translate(normalize-space(), "Óó", "Oo"), "Asignacion Orden") or contains(translate(normalize-space(), "Óó", "Oo"), "Asignacion de ordenes")]'), frameMenu.locator('xpath=/html/body/form/div[3]/div/div/div[1]/ul/li[8]/div/ul/li[1]/div/a/div/span')]);
      await comprasPage.waitForTimeout(8000);
      await tomarScreenshotPagina(comprasPage, 'reports/screenshots/15-betagr-asignacion-ordenes.png');

      const asignacionFrame = comprasPage.frameLocator('iframe#center_page');
      const prefijoInputXpath = 'xpath=/html/body/form/div[3]/div[1]/table/tbody/tr[1]/td/table/tbody/tr/td[1]/table/tbody/tr[4]/td[2]/input';
      const filtroTodosXpath = 'xpath=/html/body/form/div[3]/div[1]/table/tbody/tr[1]/td/table/tbody/tr/td[1]/table/tbody/tr[1]/td[7]/div[2]/div[1]/div[1]/input';
      const fechaDesdeCalendarXpath = 'xpath=/html/body/form/div[3]/div[1]/table/tbody/tr[1]/td/table/tbody/tr/td[1]/table/tbody/tr[3]/td[6]/img';
      const fechaDesdeInputXpath = 'xpath=/html/body/form/div[3]/div[1]/table/tbody/tr[1]/td/table/tbody/tr/td[1]/table/tbody/tr[3]/td[6]/input';
      const fechaHastaInputXpath = 'xpath=/html/body/form/div[3]/div[1]/table/tbody/tr[1]/td/table/tbody/tr/td[1]/table/tbody/tr[4]/td[6]/input';
      const actualizarXpath = 'xpath=/html/body/form/div[3]/div[1]/table/tbody/tr[2]/td/table/tbody/tr/td[1]/div/input[1]';
      const selectorElementosAsignacion = 'td:visible, th:visible, span:visible, div:visible, input:visible, button:visible, a:visible, img:visible';
      let usarFrame = true;
      await asignacionFrame.locator(prefijoInputXpath).waitFor({ state: 'visible', timeout: 20000 }).catch(() => { usarFrame = false; });
      const obtenerFrameAsignacion = async () => comprasPage.locator('iframe#center_page').elementHandle().then((iframe) => iframe?.contentFrame());
      const esperarCargaAsignacion = async () => {
        const loaders = usarFrame ? [asignacionFrame.locator('#divBackground'), asignacionFrame.locator('#backgroundLoadingMain'), comprasPage.locator('#backgroundLoadingMain')] : [comprasPage.locator('#divBackground'), comprasPage.locator('#backgroundLoadingMain')];
        for (const loading of loaders) await loading.waitFor({ state: 'hidden', timeout: 60000 }).catch(() => undefined);
        await comprasPage.waitForTimeout(1000);
      };
      const formatearFechaGR = (fecha: Date) => `${fecha.getMonth() + 1}/${fecha.getDate()}/${fecha.getFullYear()}`;
      const hoy = new Date();
      const fechaDesdeMes = formatearFechaGR(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
      const fechaHastaMes = formatearFechaGR(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0));
      const asignarFecha = async (locator: any, valor: string) => {
        await locator.waitFor({ state: 'attached', timeout: 20000 });
        await locator.evaluate((input: any, dateValue: string) => {
          input.value = dateValue;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.dispatchEvent(new Event('blur', { bubbles: true }));
        }, valor);
      };
      const seleccionarFiltroFechaUCEnPagina = async (pageOrFrame: any) => {
        const cambioRealizado = await pageOrFrame.locator('body').evaluate(() => {
          const normalizar = (valor: string) => String(valor).trim().replace(/\s+/g, ' ').toUpperCase();
          const labels = Array.from(document.querySelectorAll('td, label, span, div')) as HTMLElement[];
          const labelFecha = labels.find((element) => /^FECHA:?$/.test(normalizar(element.innerText || element.textContent || '')));
          const fila = labelFecha?.closest('tr');
          const celdas = fila ? Array.from(fila.children) as HTMLElement[] : [];
          const indiceLabel = labelFecha ? celdas.findIndex((cell) => cell === labelFecha || cell.contains(labelFecha)) : -1;
          const selectsCandidatos = [
            ...(indiceLabel >= 0 ? celdas.slice(indiceLabel + 1).flatMap((cell) => Array.from(cell.querySelectorAll('select'))) : []),
            ...Array.from(document.querySelectorAll('select')).filter((select) => {
              const rect = select.getBoundingClientRect();
              const labelRect = labelFecha?.getBoundingClientRect();
              return !!labelRect && rect.left > labelRect.left && Math.abs(rect.top - labelRect.top) < 30;
            }),
          ] as HTMLSelectElement[];
          const selectFecha = selectsCandidatos.find((select) => Array.from(select.options).some((option) => normalizar(option.value) === 'UC' || normalizar(option.textContent || '') === 'UC'));
          const opcionUC = selectFecha && Array.from(selectFecha.options).find((option) => normalizar(option.value) === 'UC' || normalizar(option.textContent || '') === 'UC');
          if (!selectFecha || !opcionUC) return false;
          selectFecha.value = opcionUC.value;
          selectFecha.dispatchEvent(new Event('input', { bubbles: true }));
          selectFecha.dispatchEvent(new Event('change', { bubbles: true }));
          selectFecha.dispatchEvent(new Event('blur', { bubbles: true }));
          return true;
        });
        expect(cambioRealizado).toBeTruthy();
      };
      const aplicarRangoFechasMesAsignacion = async () => {
        if (usarFrame) {
          await asignacionFrame.locator(fechaDesdeCalendarXpath).click({ timeout: 10000 }).catch(() => undefined);
          await asignarFecha(asignacionFrame.locator(fechaDesdeInputXpath), fechaDesdeMes);
          await asignarFecha(asignacionFrame.locator(fechaHastaInputXpath), fechaHastaMes);
        } else {
          await comprasPage.locator(fechaDesdeCalendarXpath).click({ timeout: 10000 }).catch(() => undefined);
          await asignarFecha(comprasPage.locator(fechaDesdeInputXpath), fechaDesdeMes);
          await asignarFecha(comprasPage.locator(fechaHastaInputXpath), fechaHastaMes);
        }
      };
      const aplicarFiltroFechaUCAsignacion = async () => {
        if (usarFrame) {
          const centerFrame = await obtenerFrameAsignacion();
          if (!centerFrame) throw new Error('No se encontro iframe center_page para cambiar Fecha a UC');
          await seleccionarFiltroFechaUCEnPagina(centerFrame);
        } else {
          await seleccionarFiltroFechaUCEnPagina(comprasPage);
        }
      };
      const aplicarBusquedaAsignacion = async () => {
        await esperarCargaAsignacion();
        if (usarFrame) {
          await asignacionFrame.locator(prefijoInputXpath).fill(orderReferenceCapturado);
          await aplicarRangoFechasMesAsignacion();
          await aplicarFiltroFechaUCAsignacion();
          await asignacionFrame.locator(filtroTodosXpath).check({ timeout: 10000 }).catch(async () => asignacionFrame.locator(filtroTodosXpath).evaluate((input: any) => { if (!input.checked) input.click(); }));
          await asignacionFrame.locator(actualizarXpath).click({ timeout: 10000 });
        } else {
          await comprasPage.locator(prefijoInputXpath).fill(orderReferenceCapturado);
          await aplicarRangoFechasMesAsignacion();
          await aplicarFiltroFechaUCAsignacion();
          await comprasPage.locator(filtroTodosXpath).check({ timeout: 10000 }).catch(async () => comprasPage.locator(filtroTodosXpath).evaluate((input: any) => { if (!input.checked) input.click(); }));
          await comprasPage.locator(actualizarXpath).click({ timeout: 10000 });
        }
        await comprasPage.waitForTimeout(1000);
        await esperarCargaAsignacion();
      };
      const clickPlusFilaAsignacion = async () => {
        const clickEnFila = async (scope: any) => {
          const fila = scope.locator(`xpath=(//div[contains(@class,"ag-row") and .//*[@colid="OrderNumber" and normalize-space()="${orderReferenceCapturado}"] and .//*[@colid="Item" and normalize-space()="${itemOrderReferenceCapturado}"]] | //tr[./td[normalize-space()="${orderReferenceCapturado}"] and ./td[normalize-space()="${itemOrderReferenceCapturado}"]])[1]`);
          if (!await fila.isVisible({ timeout: 5000 }).catch(() => false)) return { clicked: false, reason: `No se encontro fila principal para ${orderReferenceCapturado}-${itemOrderReferenceCapturado}` };
          const controles = [fila.locator('xpath=.//*[normalize-space()="+"]').first(), fila.locator('xpath=.//img[contains(translate(@src, "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "plus")]').first(), fila.locator('xpath=.//input[@value="+" or contains(translate(@src, "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "plus")]').first(), fila.locator('xpath=.//a[normalize-space()="+" or .//img[contains(translate(@src, "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "plus")]]').first(), fila.locator('xpath=.//*[@colid="Detail" or @colid="LineOptions"]').first(), fila.locator('td').nth(1)];
          for (let index = 0; index < controles.length; index += 1) {
            const control = controles[index];
            if (!await control.isVisible({ timeout: 1000 }).catch(() => false)) continue;
            await control.scrollIntoViewIfNeeded().catch(() => undefined);
            await control.click({ timeout: 5000, force: true });
            return { clicked: true, method: `row-locator-${index + 1}` };
          }
          return { clicked: false, reason: `No se encontro control + en la fila ${orderReferenceCapturado}-${itemOrderReferenceCapturado}` };
        };
        if (usarFrame) {
          const centerFrame = await obtenerFrameAsignacion();
          if (!centerFrame) return { clicked: false, reason: 'No se encontro iframe center_page en GR' };
          return clickEnFila(centerFrame);
        }
        return clickEnFila(comprasPage);
      };
      const clickTabHistoriaAsignacion = async () => {
        const activarHistoria = (datos: { orderReference: string; itemReference: string }) => {
          const normalizar = (valor: string) => String(valor || '').trim().replace(/\s+/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
          const obtenerValor = (element: Element | null | undefined) => {
            if (!element) return '';
            const htmlElement = element as HTMLElement;
            const input = element as HTMLInputElement;
            return input.value || htmlElement.getAttribute('title') || htmlElement.getAttribute('aria-label') || htmlElement.innerText || htmlElement.textContent || '';
          };
          const esVisible = (element: Element) => {
            const rect = (element as HTMLElement).getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          };
          const orderReferenceNormalizado = normalizar(datos.orderReference);
          const itemReferenceNormalizado = normalizar(datos.itemReference);
          const filas = Array.from(document.querySelectorAll('.ag-row, tr')).filter(esVisible).map((fila) => ({
            fila: fila as HTMLElement,
            celdasDirectas: Array.from(fila.children).filter((child) => child.matches('td, th, [colid], .ag-cell') && esVisible(child)).map((child) => ({
              value: normalizar(obtenerValor(child)),
              colid: child.getAttribute('colid') || '',
            })),
          })).filter((fila) => fila.celdasDirectas.length > 0);
          const esFilaPrincipalObjetivo = (fila: typeof filas[number]) => {
            const ordenCoincide = fila.celdasDirectas.some((celda) => celda.value === orderReferenceNormalizado || (celda.colid.toUpperCase().includes('ORDER') && celda.value.includes(orderReferenceNormalizado)));
            const itemCoincide = fila.celdasDirectas.some((celda) => celda.value === itemReferenceNormalizado || (celda.colid.toUpperCase() === 'ITEM' && celda.value === itemReferenceNormalizado));
            return ordenCoincide && itemCoincide;
          };
          const esOtraFilaPrincipal = (fila: typeof filas[number]) => fila.celdasDirectas.some((celda) => celda.value === orderReferenceNormalizado) && fila.celdasDirectas.some((celda) => /^\d{3}$/.test(celda.value));
          const indiceFilaObjetivo = filas.findIndex(esFilaPrincipalObjetivo);
          if (indiceFilaObjetivo < 0) return { clicked: false, reason: 'No se encontro la fila principal objetivo' };
          const filasDetalle = [];
          for (const fila of filas.slice(indiceFilaObjetivo + 1)) {
            if (esOtraFilaPrincipal(fila)) break;
            filasDetalle.push(fila.fila);
          }
          const elementosDetalle = filasDetalle.flatMap((fila) => [fila, ...Array.from(fila.querySelectorAll('td, th, span, div, a, button, input'))]).filter(esVisible);
          const tabHistoria = elementosDetalle.find((element) => /^HISTORIA$/.test(normalizar(obtenerValor(element)))) as HTMLElement | undefined;
          if (!tabHistoria) return { clicked: false, reason: 'No se encontro la pestana Historia dentro del detalle objetivo' };
          tabHistoria.scrollIntoView({ block: 'center', inline: 'center' });
          tabHistoria.click();
          return { clicked: true };
        };

        if (usarFrame) {
          const centerFrame = await obtenerFrameAsignacion();
          if (!centerFrame) return { clicked: false, reason: 'No se encontro iframe center_page en GR' };
          return centerFrame.locator('body').evaluate(activarHistoria, { orderReference: orderReferenceCapturado, itemReference: itemOrderReferenceCapturado });
        }
        return comprasPage.locator('body').evaluate(activarHistoria, { orderReference: orderReferenceCapturado, itemReference: itemOrderReferenceCapturado });
      };
      const obtenerHistoriaNewValue = async () => {
        const extraerHistoria = (elements: Element[], datos: { orderReference: string; itemReference: string; adjustedName: string; changedByEsperado: string; logDateEsperado: string }) => {
          const normalizar = (valor: string) => String(valor || '').trim().replace(/\s+/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
          const obtenerValor = (element: Element | null | undefined) => {
            if (!element) return '';
            const htmlElement = element as HTMLElement;
            const input = element as HTMLInputElement;
            return input.value || htmlElement.innerText || htmlElement.textContent || htmlElement.getAttribute('title') || htmlElement.getAttribute('aria-label') || '';
          };
          const esVisible = (element: Element) => {
            const rect = (element as HTMLElement).getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          };
          const orderReferenceNormalizado = normalizar(datos.orderReference);
          const itemReferenceNormalizado = normalizar(datos.itemReference);
          const adjustedNameNormalizado = normalizar(datos.adjustedName);
          const changedByEsperadoNormalizado = normalizar(datos.changedByEsperado);
          const normalizarFecha = (valor: string) => {
            const match = String(valor || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
            if (!match) return String(valor || '').trim();
            return `${match[1].padStart(2, '0')}/${match[2].padStart(2, '0')}/${match[3]}`;
          };
          const logDateEsperadoNormalizado = normalizarFecha(datos.logDateEsperado);
          const filas = Array.from(document.querySelectorAll('.ag-row, tr')).filter(esVisible).map((fila) => ({
            fila: fila as HTMLElement,
            celdasDirectas: Array.from(fila.children).filter((child) => child.matches('td, th, [colid], .ag-cell') && esVisible(child)).map((child) => ({
              value: normalizar(obtenerValor(child)),
              rawValue: String(obtenerValor(child) || '').trim(),
              colid: child.getAttribute('colid') || '',
            })),
          })).filter((fila) => fila.celdasDirectas.length > 0);
          const esFilaPrincipalObjetivo = (fila: typeof filas[number]) => {
            const ordenCoincide = fila.celdasDirectas.some((celda) => celda.value === orderReferenceNormalizado || (celda.colid.toUpperCase().includes('ORDER') && celda.value.includes(orderReferenceNormalizado)));
            const itemCoincide = fila.celdasDirectas.some((celda) => celda.value === itemReferenceNormalizado || (celda.colid.toUpperCase() === 'ITEM' && celda.value === itemReferenceNormalizado));
            return ordenCoincide && itemCoincide;
          };
          const esOtraFilaPrincipal = (fila: typeof filas[number]) => fila.celdasDirectas.some((celda) => celda.value === orderReferenceNormalizado) && fila.celdasDirectas.some((celda) => /^\d{3}$/.test(celda.value));
          const indiceFilaObjetivo = filas.findIndex(esFilaPrincipalObjetivo);
          if (indiceFilaObjetivo < 0) return { itemObjetivoEncontrado: false, historiaVisible: false, newValue: '', candidatosNewValue: [] as string[], coincide: false };
          const filasDetalle = [];
          for (const fila of filas.slice(indiceFilaObjetivo + 1)) {
            if (esOtraFilaPrincipal(fila)) break;
            filasDetalle.push(fila);
          }
          const scopeElements = filasDetalle.flatMap((fila) => [fila.fila, ...Array.from(fila.fila.querySelectorAll('td, th, span, div, input'))]).filter(esVisible);
          const visibles = scopeElements.map((element) => {
            const rect = (element as HTMLElement).getBoundingClientRect();
            return { element: element as HTMLElement, value: normalizar(obtenerValor(element)), rawValue: String(obtenerValor(element) || '').trim(), x: rect.x, y: rect.y, width: rect.width, height: rect.height };
          }).filter((item) => item.rawValue);
          const historiaVisible = visibles.some((item) => /^HISTORIA$/.test(item.value));
          const filasHistoria = filasDetalle
            .map((fila) => {
              const rectFila = fila.fila.getBoundingClientRect();
              const celdas = Array.from(fila.fila.children)
                .filter((child) => child.matches('td, th') && esVisible(child))
                .map((child) => {
                  const rect = (child as HTMLElement).getBoundingClientRect();
                  return {
                    element: child as HTMLElement,
                    value: normalizar(obtenerValor(child)),
                    rawValue: String(obtenerValor(child) || '').trim(),
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height,
                  };
                })
                .filter((celda) => celda.rawValue);
              return { y: rectFila.y, celdas };
            })
            .filter((fila) => fila.celdas.length > 0)
            .sort((a, b) => a.y - b.y);
          const indiceHeaderHistoria = filasHistoria.findIndex((fila) =>
            fila.celdas.some((celda) => /^CHANGED\s*BY:?$/.test(celda.value))
            &&
            fila.celdas.some((celda) => /^FIELD\s*NAME:?$/.test(celda.value))
            && fila.celdas.some((celda) => /^NEW\s*VALUE:?$/.test(celda.value))
          );
          const headerHistoria = indiceHeaderHistoria >= 0 ? filasHistoria[indiceHeaderHistoria] : null;
          const headerChangedBy = headerHistoria?.celdas.find((celda) => /^CHANGED\s*BY:?$/.test(celda.value));
          const headerLogDate = headerHistoria?.celdas.find((celda) => /^LOG\s*DATE:?$/.test(celda.value));
          const headerFieldName = headerHistoria?.celdas.find((celda) => /^FIELD\s*NAME:?$/.test(celda.value));
          const headerNewValue = headerHistoria?.celdas.find((celda) => /^NEW\s*VALUE:?$/.test(celda.value));
          const filasDatosHistoria = headerHistoria
            ? filasHistoria.slice(indiceHeaderHistoria + 1).filter((fila) => fila.celdas.some((celda) => celda.rawValue))
            : [];
          const obtenerCeldaPorHeader = (fila: typeof filasDatosHistoria[number], header: typeof headerNewValue) => header
            ? fila.celdas
                .filter((celda) => celda.x < header.x + header.width && celda.x + celda.width > header.x)
                .sort((a, b) => a.x - b.x)
                .at(-1)
            : undefined;
          const changedByCoincideConUsuario = (valor: string) => {
            const changedByNormalizado = normalizar(valor).replace(/\.+$/, '').trim();
            return !!changedByNormalizado && (
              changedByNormalizado === changedByEsperadoNormalizado
              || changedByEsperadoNormalizado.startsWith(changedByNormalizado)
            );
          };
          const obtenerCeldasFila = (fila: typeof filasDatosHistoria[number]) => fila.celdas
            .map((celda) => ({ ...celda, value: normalizar(celda.rawValue) }))
            .filter((celda) => celda.rawValue);
          const fieldNameCoincideConProductName = (valor: string) => /^PRODUCT\s*NAME$/.test(normalizar(valor));
          const logDateCoincideConHoy = (valor: string) => normalizarFecha(valor) === logDateEsperadoNormalizado;
          const filasDianaDavilaFechaProductName = filasDatosHistoria.filter((fila) => {
            const celdaChangedBy = obtenerCeldaPorHeader(fila, headerChangedBy);
            const celdaLogDate = obtenerCeldaPorHeader(fila, headerLogDate);
            const celdaFieldName = obtenerCeldaPorHeader(fila, headerFieldName);
            const celdas = obtenerCeldasFila(fila);
            const changedByCoincide = changedByCoincideConUsuario(celdaChangedBy?.rawValue || '')
              || celdas.some((celda) => changedByCoincideConUsuario(celda.rawValue));
            const logDateCoincide = logDateCoincideConHoy(celdaLogDate?.rawValue || '')
              || celdas.some((celda) => logDateCoincideConHoy(celda.rawValue));
            const fieldNameCoincide = fieldNameCoincideConProductName(celdaFieldName?.rawValue || '')
              || celdas.some((celda) => fieldNameCoincideConProductName(celda.rawValue));

            return changedByCoincide && logDateCoincide && fieldNameCoincide;
          });
          const filaUltima = filasDianaDavilaFechaProductName.at(-1);
          let celdaNewValue = filaUltima ? obtenerCeldaPorHeader(filaUltima, headerNewValue) : undefined;
          if (!celdaNewValue) {
            const celdasFilaUltima = filaUltima ? obtenerCeldasFila(filaUltima) : [];
            const indiceFieldName = celdasFilaUltima.findIndex((celda) => /^PRODUCT\s*NAME$/.test(celda.value));
            celdaNewValue = indiceFieldName >= 0
              ? celdasFilaUltima.slice(indiceFieldName + 1).find((celda) => celda.value.includes(adjustedNameNormalizado))
              : celdasFilaUltima.find((celda) => celda.value.includes(adjustedNameNormalizado));
          }
          const candidatosNewValue = filasDatosHistoria.map((fila) => fila.celdas.map((celda) => celda.rawValue).join(' | '));
          if (celdaNewValue) {
            celdaNewValue.element.scrollIntoView({ block: 'center', inline: 'center' });
            celdaNewValue.element.style.outline = '4px solid #0057ff';
            celdaNewValue.element.style.outlineOffset = '-3px';
            for (const celda of filaUltima?.celdas ?? []) {
              celda.element.style.boxShadow = 'inset 0 0 0 2px #0057ff';
            }
          }
          const newValue = celdaNewValue?.rawValue || '';
          const celdasFilaUltima = filaUltima ? obtenerCeldasFila(filaUltima) : [];
          const changedBy = filaUltima
            ? celdasFilaUltima.find((celda) => changedByCoincideConUsuario(celda.rawValue))?.rawValue || obtenerCeldaPorHeader(filaUltima, headerChangedBy)?.rawValue || ''
            : '';
          const logDate = filaUltima
            ? obtenerCeldaPorHeader(filaUltima, headerLogDate)?.rawValue || celdasFilaUltima.find((celda) => logDateCoincideConHoy(celda.rawValue))?.rawValue || ''
            : '';
          const fieldName = filaUltima
            ? celdasFilaUltima.find((celda) => /^PRODUCT\s*NAME$/.test(celda.value))?.rawValue || obtenerCeldaPorHeader(filaUltima, headerFieldName)?.rawValue || ''
            : '';
          const changedByCoincide = changedByCoincideConUsuario(changedBy);
          const logDateCoincide = logDateCoincideConHoy(logDate);
          const fieldNameCoincide = fieldNameCoincideConProductName(fieldName);
          return {
            itemObjetivoEncontrado: true,
            historiaVisible,
            newValue,
            changedBy,
            logDate,
            fieldName,
            changedByCoincide,
            logDateCoincide,
            fieldNameCoincide,
            changedByEsperado: datos.changedByEsperado,
            logDateEsperado: datos.logDateEsperado,
            fieldNameEsperado: 'Product Name',
            filasCoincidentesChangedByLogDateYFieldName: filasDianaDavilaFechaProductName.length,
            candidatosNewValue,
            filaUltimaHistoria: filaUltima?.celdas.map((celda) => celda.rawValue) ?? [],
            coincide: normalizar(newValue) === adjustedNameNormalizado || normalizar(newValue).includes(adjustedNameNormalizado),
          };
        };
        if (usarFrame) {
          const centerFrame = await obtenerFrameAsignacion();
          if (!centerFrame) return { itemObjetivoEncontrado: false, historiaVisible: false, newValue: '', candidatosNewValue: [] as string[], coincide: false };
          return centerFrame.locator(selectorElementosAsignacion).evaluateAll(extraerHistoria, { orderReference: orderReferenceCapturado, itemReference: itemOrderReferenceCapturado, adjustedName: adjustedNameAsignado, changedByEsperado: 'BK - Diana Davila', logDateEsperado });
        }
        return comprasPage.locator(selectorElementosAsignacion).evaluateAll(extraerHistoria, { orderReference: orderReferenceCapturado, itemReference: itemOrderReferenceCapturado, adjustedName: adjustedNameAsignado, changedByEsperado: 'BK - Diana Davila', logDateEsperado });
      };

      let historiaValidada = false;
      let ultimoResultadoHistoria: any = null;
      for (let intento = 1; intento <= 5; intento++) {
        await aplicarBusquedaAsignacion();
        await tomarScreenshotPagina(comprasPage, intento === 1 ? 'reports/screenshots/16-betagr-asignacion-actualizada.png' : `reports/screenshots/16-betagr-asignacion-refresh-${intento - 1}.png`);
        const resultadoExpansion: any = await clickPlusFilaAsignacion();
        await comprasPage.waitForTimeout(5000);
        const resultadoTabHistoria: any = await clickTabHistoriaAsignacion();
        await comprasPage.waitForTimeout(2000);
        ultimoResultadoHistoria = await obtenerHistoriaNewValue();
        await tomarScreenshotPagina(comprasPage, `reports/screenshots/16d-betagr-asignacion-historia-intento-${intento}.png`);
        fs.writeFileSync(`reports/html/16-betagr-product-name-historia-intento-${intento}.json`, JSON.stringify({ expansion: resultadoExpansion, tabHistoria: resultadoTabHistoria, historia: ultimoResultadoHistoria, adjustedName: adjustedNameAsignado }, null, 2));
        historiaValidada = !!resultadoTabHistoria.clicked
          && !!ultimoResultadoHistoria.historiaVisible
          && !!ultimoResultadoHistoria.changedByCoincide
          && !!ultimoResultadoHistoria.logDateCoincide
          && !!ultimoResultadoHistoria.fieldNameCoincide
          && !!ultimoResultadoHistoria.coincide;
        if (historiaValidada) break;
        if (intento < 5) {
          await comprasPage.waitForTimeout(30000);
        }
      }
      expect(historiaValidada, `New Value en Historia debe coincidir con Adjusted Name ${adjustedNameAsignado}. Ultimo resultado: ${JSON.stringify(ultimoResultadoHistoria)}`).toBeTruthy();
      await comprasPage.waitForTimeout(1000);
      await tomarScreenshotPagina(comprasPage, 'reports/screenshots/17-betagr-product-name-historia-confirmado.png');
      await comprasPage.close();
      await page.close();
      console.log(`COMPRAS_ASIGNACION_ORDENES: ${Date.now() - t0}ms`);
    });
  });
});
