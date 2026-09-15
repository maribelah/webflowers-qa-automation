import { test, expect } from '../../src/fixtures/base.fixture';
import { ENV } from '../../src/utils/envConfig';
import { waitForAppReady, clickResilient } from '../../src/utils/waitUtils';
import fs from 'fs';

test.describe('Módulo Bulk Changes — Flujo principal', () => {
  test('Bulkchanges — navegar, buscar y seleccionar checkbox', async ({ page }, testInfo) => {
    fs.mkdirSync('reports/screenshots', { recursive: true });
    fs.mkdirSync('reports/html', { recursive: true });
    test.setTimeout(420000);
    
    // Variables para guardar datos entre pasos
    let orderReferenceCapturado = '';
    let orderReferenceCompletoCapturado = '';
    let itemOrderReferenceCapturado = '';
    let valorBOXESAsignado = 0;
    const orderReferenceRegex = /[A-Z]{2}\d{4}(?:-\d+)?/;
    const extraerOrderReference = (texto: string) => texto.match(orderReferenceRegex)?.[0] ?? '';
    const tomarScreenshotPagina = async (pageActual: any, path: string) => {
      try {
        const tomarRecorte = async (x: number, y: number, width: number, height: number) => {
          const viewport = await pageActual.evaluate(() => ({
            width: window.innerWidth,
            height: window.innerHeight
          }));

          await pageActual.screenshot({
            path,
            clip: {
              x,
              y,
              width: Math.min(1710, Math.floor(width), viewport.width - x),
              height: Math.min(971, Math.floor(height), viewport.height - y)
            },
            timeout: 60000
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

        const viewport = await pageActual.evaluate(() => ({
          width: window.innerWidth,
          height: window.innerHeight
        }));

        await pageActual.screenshot({
          path,
          clip: {
            x: 0,
            y: 0,
            width: Math.min(1710, viewport.width),
            height: Math.min(971, viewport.height)
          },
          timeout: 60000
        });
      } catch (error) {
        console.log(`⚠️ No se pudo guardar screenshot ${path}: ${(error as Error).message}`);
        try {
          await pageActual.screenshot({ path, fullPage: false, timeout: 60000 });
          return;
        } catch {
          // El error original tiene el detalle util para diagnostico.
        }
      }
    };
    const tomarScreenshot = async (path: string) => tomarScreenshotPagina(page, path);

    const guardarHtmlFrame = async (frameName: string, path: string) => {
      const frame = page.frame({ name: frameName }) ?? page.frames().find(f => f.name() === frameName);
      if (frame) {
        fs.writeFileSync(path, await frame.content());
      }
    };

    const clickPrimerMenuVisible = async (descripcion: string, candidatos: any[], pageActual = page) => {
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

      throw ultimoError instanceof Error
        ? ultimoError
        : new Error(`No se pudo hacer click en ${descripcion}`);
    };

    // ══════════════════════════════════════════════════════════════
    // PASO 1: Navegar a la URL
    // ══════════════════════════════════════════════════════════════
    await test.step('Navegar a la URL del ambiente', async () => {
      const t0 = Date.now();
      await page.goto(ENV.url, { waitUntil: 'domcontentloaded' });
      await waitForAppReady(page, 30000);
      console.log(`NAVIGATE: ${Date.now() - t0}ms`);
      await tomarScreenshot('reports/screenshots/01-inicio.png');
    });

    // ══════════════════════════════════════════════════════════════
    // PASO 2: Login
    // ══════════════════════════════════════════════════════════════
    await test.step('Login', async () => {
      const t0 = Date.now();
      await page.fill('input[name="txtUserName"]', ENV.usuario);
      await page.fill('input[name="txtPassword"]', ENV.password);
      await clickResilient(page.locator('#btnSigIn'));
      // Esperar que la app deje de cargar (indica post-login estable)
      await waitForAppReady(page, 30000);
      console.log(`LOGIN: ${Date.now() - t0}ms`);
      await tomarScreenshot('reports/screenshots/02-post-login.png');
    });

    // ══════════════════════════════════════════════════════════════
    // PASO 3: Navegar a Sales → Bulk Changes
    // ══════════════════════════════════════════════════════════════
    await test.step('Navegar a Sales → Bulk Changes', async () => {
      const t0 = Date.now();
      const frameMenu = page.frameLocator('iframe#left_page1');
      
      // Esperar a que el iframe del menú esté listo
      await page.locator('iframe#left_page1').waitFor({ state: 'attached', timeout: 30000 });
      await page.waitForTimeout(3000);
      
      await clickPrimerMenuVisible('Sales', [
        frameMenu.locator('div[data-toggle="collapse"][data-target="#subSales"]'),
        frameMenu.getByText('Sales', { exact: true }),
        frameMenu.locator('xpath=//*[normalize-space()="Sales"]'),
      ]);
      await page.waitForTimeout(2000);
      console.log('✅ Click en Sales');
      
      try {
        await clickPrimerMenuVisible('Bulk Changes', [
          frameMenu.locator('a.link:has-text("Bulk Changes")'),
          frameMenu.locator('div.div-child[title="Bulk Changes"] a.link'),
          frameMenu.locator('span.label-text:text-is("Bulk Changes")'),
          frameMenu.getByText('Bulk Changes', { exact: true }),
          frameMenu.locator('xpath=//*[normalize-space()="Bulk Changes"]'),
        ]);
      } catch (error) {
        await guardarHtmlFrame('left_page1', 'reports/html/03-left-menu-bulkchanges-fail.html');
        throw error;
      }
      await page.waitForTimeout(5000);
      console.log('✅ Click en Bulk Changes');
      
      console.log(`NAV_MENU: ${Date.now() - t0}ms`);
      await tomarScreenshot('reports/screenshots/03-bulk-changes.png');
    });

    // ══════════════════════════════════════════════════════════════
    // PASO 4: Click en Search (sin ajustar fechas)
    // ══════════════════════════════════════════════════════════════
    await test.step('Click en Search', async () => {
      const t0 = Date.now();
      const frameCenter = page.frameLocator('iframe#center_page');
      
      // Click en el botón Search sin modificar fechas
      await frameCenter.locator('xpath=/html/body/div/div/form/div[2]/button').click();
      await page.waitForTimeout(10000);
      await expect(
        frameCenter.locator('body'),
        'Debe cargar al menos un Order Reference con formato XX#### antes de continuar'
      ).toContainText(/[A-Z]{2}\d{4}/, { timeout: 60000 });
      
      console.log(`SEARCH: ${Date.now() - t0}ms`);
      await tomarScreenshot('reports/screenshots/04-post-search.png');
      
      // Guardar HTML para debug
      const centerFrame = page.frame({ name: 'center_page' }) ?? page.frames().find(f => f.name() === 'center_page');
      if (centerFrame) {
        fs.writeFileSync('reports/html/04-center.html', await centerFrame.content());
      }
    });

    // ══════════════════════════════════════════════════════════════
    // PASO 5: Click en el checkbox del primer registro y CAPTURAR Order Reference
    // ══════════════════════════════════════════════════════════════
    await test.step('Click en checkbox del primer registro', async () => {
      const t0 = Date.now();
      const frameCenter = page.frameLocator('iframe#center_page');
      const centerFrame = page.frame({ name: 'center_page' }) ?? page.frames().find(f => f.name() === 'center_page');
      
      // Guardar HTML ANTES del click para debug (ya deberían estar los datos)
      if (centerFrame) {
        fs.writeFileSync('reports/html/05a-antes-checkbox.html', await centerFrame.content());
        console.log('📄 HTML guardado en 05a-antes-checkbox.html');
      }

      // XPath proporcionado por el usuario para el checkbox.
      const checkboxXpath = 'xpath=/html/body/div/div/div[1]/div/div[1]/div[2]/div[2]/div/div[1]/div[2]/span/input';
      const checkboxPrimerRegistro = frameCenter.locator(checkboxXpath);
      await checkboxPrimerRegistro.waitFor({ state: 'visible', timeout: 10000 });

      await checkboxPrimerRegistro.click({ timeout: 10000 });
      console.log('✅ Checkbox clickeado con XPath del usuario');

      const filaSeleccionada = frameCenter.locator('[role="row"][aria-selected="true"], .MuiDataGrid-row.Mui-selected').first();
      await filaSeleccionada.waitFor({ state: 'visible', timeout: 10000 });

      const textoFilaSeleccionada = await filaSeleccionada.textContent({ timeout: 5000 }) ?? '';
      orderReferenceCompletoCapturado = extraerOrderReference(textoFilaSeleccionada);

      if (orderReferenceCompletoCapturado) {
        orderReferenceCapturado = orderReferenceCompletoCapturado.substring(0, 6);
        itemOrderReferenceCapturado = orderReferenceCompletoCapturado.split('-')[1] ?? '';
        console.log(`📋 Order Reference de la fila seleccionada: ${orderReferenceCompletoCapturado}`);
        console.log(`📋 Prefijo de la fila seleccionada: ${orderReferenceCapturado}`);
        console.log(`📋 Item de la fila seleccionada: ${itemOrderReferenceCapturado}`);
      }
      
      if (!orderReferenceCompletoCapturado) {
        fs.writeFileSync('reports/html/05-selected-row-debug.txt', textoFilaSeleccionada.replace(/\s+/g, ' ').trim());
      }

      expect(orderReferenceCompletoCapturado, 'Debe capturar el Order Reference completo de la fila seleccionada, ejemplo PB9919-001').toMatch(/^[A-Z]{2}\d{4}(?:-\d+)?$/);
      expect(orderReferenceCapturado, 'Debe capturar el prefijo del Order Reference, ejemplo PB9919').toMatch(/^[A-Z]{2}\d{4}$/);
      expect(itemOrderReferenceCapturado, 'Debe capturar el item del Order Reference, ejemplo 001').toMatch(/^\d+$/);
      
      console.log(`CHECKBOX: ${Date.now() - t0}ms`);
      await tomarScreenshot('reports/screenshots/05-checkbox-selected.png');
      
      // Guardar HTML después del click para verificar
      if (centerFrame) {
        fs.writeFileSync('reports/html/05b-despues-checkbox.html', await centerFrame.content());
      }
    });

    // ══════════════════════════════════════════════════════════════
    // PASO 6: Esperar 10 segundos y click en elemento
    // ══════════════════════════════════════════════════════════════
    await test.step('Esperar 10s y click en elemento', async () => {
      const t0 = Date.now();
      const frameCenter = page.frameLocator('iframe#center_page');
      
      // Esperar 10 segundos
      console.log('⏳ Esperando 10 segundos...');
      await page.waitForTimeout(10000);
      
      // Click en el elemento proporcionado
      const elementXpath = 'xpath=/html/body/div/div/div[2]/div/div[1]/span/span[2]/span/div/div/div';
      await frameCenter.locator(elementXpath).click({ timeout: 10000 });
      console.log('✅ Click en elemento realizado');
      
      // Esperar a que el dropdown se abra
      await page.waitForTimeout(2000);
      
      console.log(`CLICK_ELEMENTO: ${Date.now() - t0}ms`);
      await tomarScreenshot('reports/screenshots/06-after-click.png');
    });

    // ══════════════════════════════════════════════════════════════
    // PASO 7: Seleccionar BOXES del dropdown
    // ══════════════════════════════════════════════════════════════
    await test.step('Seleccionar BOXES del dropdown', async () => {
      const t0 = Date.now();
      const frameCenter = page.frameLocator('iframe#center_page');
      
      // Click en BOXES (opción 7 del dropdown)
      const boxesXpath = 'xpath=/html/body/div[2]/div[3]/ul/li[7]';
      await frameCenter.locator(boxesXpath).click({ timeout: 20000 });
      console.log('✅ BOXES seleccionado');
      
      // Esperar a que cargue el formulario
      console.log('⏳ Esperando carga del formulario...');
      await page.waitForTimeout(5000);
      
      console.log(`SELECT_BOXES: ${Date.now() - t0}ms`);
      await tomarScreenshot('reports/screenshots/07-boxes-selected.png');
    });

    // ══════════════════════════════════════════════════════════════
    // PASO 8: Ingresar valor random (1-20) en input de BOXES
    // ══════════════════════════════════════════════════════════════
    await test.step('Ingresar valor random en input BOXES', async () => {
      const t0 = Date.now();
      const frameCenter = page.frameLocator('iframe#center_page');
      
      // Generar valor random de 1 a 20 y GUARDARLO para verificar después
      valorBOXESAsignado = Math.floor(Math.random() * 20) + 1;
      console.log(`🎲 Valor random BOXES generado: ${valorBOXESAsignado}`);
      console.log(`📋 Este valor se verificará en Order Entry para la orden: ${orderReferenceCompletoCapturado}`);
      
      // Limpiar y escribir en el input de BOXES
      const inputXpath = 'xpath=/html/body/div[2]/div[3]/div[2]/form/table/tbody/tr/td/input';
      await frameCenter.locator(inputXpath).clear();
      await frameCenter.locator(inputXpath).fill(valorBOXESAsignado.toString());
      console.log('✅ Valor BOXES ingresado en el input');
      
      console.log(`INPUT_BOXES: ${Date.now() - t0}ms`);
      await tomarScreenshot('reports/screenshots/08-boxes-value-entered.png');
    });

    // ══════════════════════════════════════════════════════════════
    // PASO 9: Click en Save (formulario BOXES)
    // ══════════════════════════════════════════════════════════════
    await test.step('Click en Save BOXES', async () => {
      const t0 = Date.now();
      const frameCenter = page.frameLocator('iframe#center_page');
      
      // Click en Save del formulario BOXES
      const saveXpath = 'xpath=/html/body/div[2]/div[3]/div[2]/form/div/button';
      await frameCenter.locator(saveXpath).click({ timeout: 10000 });
      console.log('✅ Click en Save BOXES realizado');
      
      // Esperar a que se procese
      await page.waitForTimeout(5000);
      
      console.log(`SAVE_BOXES: ${Date.now() - t0}ms`);
      await tomarScreenshot('reports/screenshots/09-after-save.png');
    });

    // ══════════════════════════════════════════════════════════════
    // PASO 10: Click en Apply y CONFIRMAR guardado
    // ══════════════════════════════════════════════════════════════
    await test.step('Click en Apply y confirmar guardado', async () => {
      const t0 = Date.now();
      const frameCenter = page.frameLocator('iframe#center_page');
      const centerFrame = page.frame({ name: 'center_page' }) ?? page.frames().find(f => f.name() === 'center_page');
      
      // XPath del botón Apply
      const applyXpath = 'xpath=/html/body/div/div/div[2]/div/div[3]/span/span[2]/span/button';
      const applyButton = frameCenter.locator(applyXpath);
      
      // === FASE 1: Preparación ===
      console.log('📋 FASE 1: Preparando click en Apply...');
      await applyButton.waitFor({ state: 'visible', timeout: 15000 });
      
      // Capturar estado inicial del botón
      const textoBotonAntes = await applyButton.textContent();
      const claseBotonAntes = await applyButton.getAttribute('class');
      console.log(`   Estado inicial del botón: "${textoBotonAntes}" | class: ${claseBotonAntes?.substring(0, 50)}...`);
      
      // Screenshot antes del click
      await tomarScreenshot('reports/screenshots/10a-antes-apply.png');
      
      // === FASE 2: Click en Apply ===
      console.log('📋 FASE 2: Ejecutando click en Apply...');
      await applyButton.click({ timeout: 10000 });
      console.log('✅ Click en Apply ejecutado');
      
      // Screenshot inmediatamente después del click
      await page.waitForTimeout(500);
      await tomarScreenshot('reports/screenshots/10b-despues-apply-click.png');
      
      // === FASE 3: Esperar que el proceso inicie ===
      console.log('📋 FASE 3: Esperando que el proceso inicie...');
      await page.waitForTimeout(2000);
      
      // === FASE 4: Confirmar que Apply se está ejecutando o terminó ===
      console.log('📋 FASE 4: Confirmando ejecución del proceso...');
      
      let procesoConfirmado = false;
      const maxWaitTime = 90000; // 90 segundos máximo
      const pollInterval = 2000;
      let elapsedTime = 0;
      
      // Selectores para detectar que el proceso terminó
      const indicadoresExito = [
        // Mensajes de éxito
        'text=success', 'text=Success', 'text=successfully', 'text=Successfully',
        'text=completed', 'text=Completed', 'text=applied', 'text=Applied',
        'text=updated', 'text=Updated', 'text=saved', 'text=Saved',
        // Clases de éxito
        '//*[contains(@class,"success")]', '//*[contains(@class,"toast-success")]',
        '.MuiAlert-standardSuccess', '[class*="success"]'
      ];
      
      // Selectores de loading/spinner (para saber si está procesando)
      const indicadoresLoading = [
        '//*[contains(@class,"loading")]', '//*[contains(@class,"spinner")]',
        '//*[contains(@class,"progress")]', '.MuiCircularProgress-root',
        '[class*="loading"]', '[class*="spinner"]'
      ];
      
      while (elapsedTime < maxWaitTime && !procesoConfirmado) {
        // Verificar si hay indicadores de éxito
        for (const selector of indicadoresExito) {
          try {
            const count = await frameCenter.locator(selector).count();
            if (count > 0) {
              const isVisible = await frameCenter.locator(selector).first().isVisible();
              if (isVisible) {
                console.log(`✅ CONFIRMADO: Mensaje de éxito detectado con: ${selector}`);
                procesoConfirmado = true;
                break;
              }
            }
          } catch (e) { /* ignorar */ }
        }
        
        if (procesoConfirmado) break;
        
        // Verificar si el botón Apply cambió de estado (se deshabilitó o cambió texto)
        try {
          const textoBotonAhora = await applyButton.textContent();
          const estaDeshabilitado = await applyButton.isDisabled();
          const estaVisible = await applyButton.isVisible();
          
          if (!estaVisible) {
            console.log('✅ CONFIRMADO: Botón Apply ya no está visible (proceso completado)');
            procesoConfirmado = true;
            break;
          }
          
          if (textoBotonAhora !== textoBotonAntes) {
            console.log(`✅ CONFIRMADO: Botón cambió de "${textoBotonAntes}" a "${textoBotonAhora}"`);
            procesoConfirmado = true;
            break;
          }
        } catch (e) {
          // Botón no encontrado = proceso completado y UI cambió
          console.log('✅ CONFIRMADO: Botón Apply no encontrado (UI actualizó)');
          procesoConfirmado = true;
          break;
        }
        
        // Verificar si hay loading activo
        let hayLoading = false;
        for (const loadSelector of indicadoresLoading) {
          try {
            const loadCount = await frameCenter.locator(loadSelector).count();
            if (loadCount > 0 && await frameCenter.locator(loadSelector).first().isVisible()) {
              hayLoading = true;
              break;
            }
          } catch (e) { /* ignorar */ }
        }
        
        if (hayLoading) {
          console.log(`⏳ Proceso en ejecución... ${elapsedTime / 1000}s`);
        } else if (elapsedTime > 10000) {
          // Si no hay loading después de 10s, probablemente terminó
          console.log(`⏳ Verificando finalización... ${elapsedTime / 1000}s`);
        }
        
        await page.waitForTimeout(pollInterval);
        elapsedTime += pollInterval;
      }
      
      // === FASE 5: Confirmación final ===
      console.log('📋 FASE 5: Confirmación final del proceso...');
      
      // Esperar estabilización
      await page.waitForTimeout(3000);
      
      // Screenshot del estado final
      await tomarScreenshot('reports/screenshots/10c-estado-final-apply.png');
      
      // Guardar HTML para análisis
      if (centerFrame) {
        const htmlFinal = await centerFrame.content();
        fs.writeFileSync('reports/html/10-apply-final.html', htmlFinal);
        
        // Buscar en el HTML indicadores de éxito
        const htmlLower = htmlFinal.toLowerCase();
        if (htmlLower.includes('success') || htmlLower.includes('completed') || 
            htmlLower.includes('applied') || htmlLower.includes('updated')) {
          console.log('✅ CONFIRMADO via HTML: Se encontraron indicadores de éxito en el DOM');
          procesoConfirmado = true;
        }
      }
      
      // Resultado final
      if (procesoConfirmado) {
        console.log('🎉 ═══════════════════════════════════════════════════');
        console.log('🎉 APPLY CONFIRMADO: El proceso se ejecutó correctamente');
        console.log('🎉 ═══════════════════════════════════════════════════');
      } else {
        console.log('⚠️ ═══════════════════════════════════════════════════');
        console.log('⚠️ APPLY: No se pudo confirmar el mensaje de éxito');
        console.log('⚠️ Pero el click fue ejecutado y el proceso puede haber terminado');
        console.log('⚠️ Revisar screenshots 10a, 10b, 10c para confirmar visualmente');
        console.log('⚠️ ═══════════════════════════════════════════════════');
      }
      
      console.log(`APPLY: ${Date.now() - t0}ms`);
      await tomarScreenshot('reports/screenshots/11-final-state.png');
      
      // Guardar HTML final
      if (centerFrame) {
        fs.writeFileSync('reports/html/11-final-state.html', await centerFrame.content());
      }
    });

    // ══════════════════════════════════════════════════════════════
    // PASO 11: Navegar a Sales → New → Order Entry
    // ══════════════════════════════════════════════════════════════
    await test.step('Navegar a Sales → New → Order Entry', async () => {
      const t0 = Date.now();
      const frameMenu = page.frameLocator('iframe#left_page1');
      
      await page.locator('iframe#left_page1').waitFor({ state: 'attached', timeout: 30000 });

      await clickPrimerMenuVisible('Sales', [
        frameMenu.locator('div[data-toggle="collapse"][data-target="#subSales"]'),
        frameMenu.getByText('Sales', { exact: true }),
        frameMenu.locator('xpath=//*[normalize-space()="Sales"]'),
      ]);
      await page.waitForTimeout(2000);
      console.log('✅ Click en Sales');
      
      await clickPrimerMenuVisible('New', [
        frameMenu.locator('div[data-toggle="collapse"][data-target="#sub0_New_10"]'),
        frameMenu.getByText('New', { exact: true }),
        frameMenu.locator('xpath=//*[normalize-space()="New"]'),
      ]);
      await page.waitForTimeout(2000);
      console.log('✅ Click en New');
      
      await clickPrimerMenuVisible('Order Entry', [
        frameMenu.locator('a.link:has-text("Order Entry")'),
        frameMenu.locator('span.label-text:text-is("Order Entry")'),
        frameMenu.getByText('Order Entry', { exact: true }),
        frameMenu.locator('xpath=//*[normalize-space()="Order Entry"]'),
      ]);
      console.log('✅ Click en Order Entry');
      
      // Esperar 20 segundos a que cargue el módulo
      console.log('⏳ Esperando 20 segundos a que cargue Order Entry...');
      await page.waitForTimeout(20000);

      const orderEntrySearchXpath = 'xpath=/html/body/form/div[3]/div[3]/div[1]/input';
      const frameCenter = page.frameLocator('iframe#center_page');
      const orderReferenceParaOrderEntry = orderReferenceCapturado;

      expect(
        orderReferenceParaOrderEntry,
        'Debe existir el prefijo de 6 caracteres de la orden capturada en Bulk Changes para buscarla en Order Entry'
      ).toMatch(/^[A-Z]{2}\d{4}$/);

      const buscarOrdenEnOrderEntry = async () => {
        try {
          const searchInput = frameCenter.locator(orderEntrySearchXpath);
          await searchInput.waitFor({ state: 'visible', timeout: 10000 });
          await searchInput.fill(orderReferenceParaOrderEntry);
          await searchInput.press('Enter');
        } catch (error) {
          const searchInput = page.locator(orderEntrySearchXpath);
          await searchInput.waitFor({ state: 'visible', timeout: 10000 });
          await searchInput.fill(orderReferenceParaOrderEntry);
          await searchInput.press('Enter');
        }
      };

      await buscarOrdenEnOrderEntry();

      console.log(`✅ Prefijo ${orderReferenceParaOrderEntry} ingresado en Order Entry y búsqueda ejecutada con Enter`);
      await page.waitForTimeout(5000);

      const centerFrame = await page.locator('iframe#center_page').elementHandle().then((iframe) => iframe?.contentFrame());
      if (centerFrame) {
        const capturarInputsOrderEntry = async (sufijo = '') => {
          fs.writeFileSync(`reports/html/12-order-entry${sufijo}.html`, await centerFrame.content());
          await tomarScreenshot(`reports/screenshots/12-order-entry${sufijo}.png`);
          await tomarScreenshot(`reports/screenshots/12-order-entry-frame${sufijo}.png`);

          const inputsOrderEntry = await centerFrame.locator('input:visible').evaluateAll((inputs) =>
            inputs.map((input, index) => {
              const element = input as any;
              const rect = element.getBoundingClientRect();

              return {
                index,
                value: element.value.trim(),
                id: element.id,
                name: element.name,
                title: element.title,
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height)
              };
            })
          );
          fs.writeFileSync(`reports/html/12-order-entry-inputs${sufijo}.json`, JSON.stringify(inputsOrderEntry, null, 2));
          return inputsOrderEntry;
        };

        const valorBoxesEsperado = valorBOXESAsignado.toString();
        let inputsOrderEntry = await capturarInputsOrderEntry();
        let valoresCoincidentes = inputsOrderEntry.filter((input) => input.value === valorBoxesEsperado);

        if (valoresCoincidentes.length === 0) {
          console.log(`⏳ Valor BOXES ${valorBoxesEsperado} no visible en Order Entry. Esperando hasta 1 minuto y repitiendo la consulta...`);
          await page.waitForTimeout(60000);
          await buscarOrdenEnOrderEntry();
          await page.waitForTimeout(5000);
          inputsOrderEntry = await capturarInputsOrderEntry('-retry');
          valoresCoincidentes = inputsOrderEntry.filter((input) => input.value === valorBoxesEsperado);
        }

        expect(
          valoresCoincidentes.length,
          `Debe visualizarse el valor BOXES ${valorBoxesEsperado} en Order Entry para el prefijo ${orderReferenceParaOrderEntry}`
        ).toBeGreaterThan(0);

        console.log(`✅ SUCCESS: Valor BOXES ${valorBoxesEsperado} visualizado en Order Entry para el prefijo ${orderReferenceParaOrderEntry}`);
      } else {
        throw new Error('No se encontró iframe center_page para validar el valor BOXES en Order Entry');
      }

      console.log(`ORDER_ENTRY: ${Date.now() - t0}ms`);
    });

    await test.step('Abrir BETA GR y navegar a Compras -> Asignacion de ordenes', async () => {
      const t0 = Date.now();
      const comprasPage = await page.context().newPage();
      await comprasPage.setViewportSize({ width: 1920, height: 1200 });
      await comprasPage.bringToFront();

      await comprasPage.goto('https://betagr.ghtcorptest.com/', { waitUntil: 'domcontentloaded' });
      await comprasPage.bringToFront();
      await comprasPage.waitForTimeout(3000);
      await tomarScreenshotPagina(comprasPage, 'reports/screenshots/13-betagr-inicio.png');

      const userInput = comprasPage.locator('input[name="txtUserName"]');
      if (await userInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await userInput.fill(ENV.usuario);
        await comprasPage.locator('input[name="txtPassword"]').fill(ENV.password);
        // Esperar que la página esté lista y usar click resiliente
        await waitForAppReady(comprasPage, 30000);
        await clickResilient(comprasPage.locator('#btnSigIn'));
        await waitForAppReady(comprasPage, 30000);
        await comprasPage.bringToFront();
        console.log('✅ Login realizado en BETA GR');
      }

      const frameMenu = comprasPage.frameLocator('iframe#left_page1');
      const comprasXpath = 'xpath=/html/body/form/div[3]/div/div/div[1]/ul/li[8]/div/div/div';
      const asignacionOrdenesXpath = 'xpath=/html/body/form/div[3]/div/div/div[1]/ul/li[8]/div/ul/li[1]/div/a/div/span';

      await comprasPage.locator('iframe#left_page1').waitFor({ state: 'attached', timeout: 30000 });

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

        throw ultimoError instanceof Error
          ? ultimoError
          : new Error(`No se pudo hacer click en ${descripcion}`);
      };

      await clickPrimerMenuVisible('Compras', [
        frameMenu.getByText('Compras', { exact: true }),
        frameMenu.locator('xpath=//*[normalize-space()="Compras"]'),
        frameMenu.locator(comprasXpath),
      ]);
      await comprasPage.waitForTimeout(2000);
      console.log('✅ Click en Compras');
      await tomarScreenshotPagina(comprasPage, 'reports/screenshots/14-betagr-compras.png');

      await clickPrimerMenuVisible('Asignación de ordenes', [
        frameMenu.getByText(/Asignaci[oó]n(?: de)? Orden/i),
        frameMenu.locator('xpath=//*[contains(translate(normalize-space(), "Óó", "Oo"), "Asignacion Orden") or contains(translate(normalize-space(), "Óó", "Oo"), "Asignacion de ordenes")]'),
        frameMenu.locator(asignacionOrdenesXpath),
      ]);
      await comprasPage.waitForTimeout(8000);
      await comprasPage.bringToFront();
      console.log('✅ Click en Asignación de ordenes');
      await tomarScreenshotPagina(comprasPage, 'reports/screenshots/15-betagr-asignacion-ordenes.png');

      const asignacionFrame = comprasPage.frameLocator('iframe#center_page');
      const prefijoInputXpath = 'xpath=/html/body/form/div[3]/div[1]/table/tbody/tr[1]/td/table/tbody/tr/td[1]/table/tbody/tr[4]/td[2]/input';
      const filtroTodosXpath = 'xpath=/html/body/form/div[3]/div[1]/table/tbody/tr[1]/td/table/tbody/tr/td[1]/table/tbody/tr[1]/td[7]/div[2]/div[1]/div[1]/input';
      const fechaDesdeCalendarXpath = 'xpath=/html/body/form/div[3]/div[1]/table/tbody/tr[1]/td/table/tbody/tr/td[1]/table/tbody/tr[3]/td[6]/img';
      const fechaDesdeInputXpath = 'xpath=/html/body/form/div[3]/div[1]/table/tbody/tr[1]/td/table/tbody/tr/td[1]/table/tbody/tr[3]/td[6]/input';
      const fechaHastaInputXpath = 'xpath=/html/body/form/div[3]/div[1]/table/tbody/tr[1]/td/table/tbody/tr/td[1]/table/tbody/tr[4]/td[6]/input';
      const actualizarXpath = 'xpath=/html/body/form/div[3]/div[1]/table/tbody/tr[2]/td/table/tbody/tr/td[1]/div/input[1]';
      let filtroFechaUCActivado = false;

      const usarFrameAsignacion = async () => {
        const prefijoInput = asignacionFrame.locator(prefijoInputXpath);
        await prefijoInput.waitFor({ state: 'visible', timeout: 20000 });
        return prefijoInput;
      };

      let usarFrame = true;
      await usarFrameAsignacion().catch(() => {
        usarFrame = false;
      });

      const esperarCargaAsignacion = async () => {
        const loading = usarFrame ? asignacionFrame.locator('#divBackground') : comprasPage.locator('#divBackground');
        await loading.waitFor({ state: 'hidden', timeout: 60000 }).catch(() => undefined);
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

          const selectFecha = selectsCandidatos.find((select) =>
            Array.from(select.options).some((option) => normalizar(option.value) === 'UC' || normalizar(option.textContent || '') === 'UC')
          );

          if (!selectFecha) return false;

          const opcionUC = Array.from(selectFecha.options).find((option) =>
            normalizar(option.value) === 'UC' || normalizar(option.textContent || '') === 'UC'
          );
          if (!opcionUC) return false;

          selectFecha.value = opcionUC.value;
          selectFecha.dispatchEvent(new Event('input', { bubbles: true }));
          selectFecha.dispatchEvent(new Event('change', { bubbles: true }));
          selectFecha.dispatchEvent(new Event('blur', { bubbles: true }));
          return true;
        });

        expect(cambioRealizado, 'Debe poder cambiar el filtro Fecha a UC antes de validar TOTAL').toBeTruthy();
      };

      const aplicarFiltroFechaUCAsignacion = async () => {
        if (filtroFechaUCActivado) return;

        if (usarFrame) {
          const centerFrame = await comprasPage.locator('iframe#center_page').elementHandle().then((iframe) => iframe?.contentFrame());
          if (!centerFrame) throw new Error('No se encontro iframe center_page para cambiar el filtro Fecha a UC');
          await seleccionarFiltroFechaUCEnPagina(centerFrame);
        } else {
          await seleccionarFiltroFechaUCEnPagina(comprasPage);
        }

        filtroFechaUCActivado = true;
        console.log('✅ Filtro Fecha cambiado a UC antes de validar TOTAL en GR.');
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

        console.log(`✅ Rango de fechas GR aplicado: ${fechaDesdeMes} - ${fechaHastaMes}`);
      };

      const aplicarBusquedaAsignacion = async () => {
        await esperarCargaAsignacion();

        if (usarFrame) {
          await asignacionFrame.locator(prefijoInputXpath).fill(orderReferenceCapturado);
          await aplicarRangoFechasMesAsignacion();
          await aplicarFiltroFechaUCAsignacion();
          await asignacionFrame.locator(filtroTodosXpath).check({ timeout: 10000 });
          await asignacionFrame.locator(actualizarXpath).click({ timeout: 10000 });
        } else {
          await comprasPage.locator(prefijoInputXpath).waitFor({ state: 'visible', timeout: 20000 });
          await comprasPage.locator(prefijoInputXpath).fill(orderReferenceCapturado);
          await aplicarRangoFechasMesAsignacion();
          await aplicarFiltroFechaUCAsignacion();
          await comprasPage.locator(filtroTodosXpath).check({ timeout: 10000 });
          await comprasPage.locator(actualizarXpath).click({ timeout: 10000 });
        }

        await comprasPage.waitForTimeout(1000);
        await esperarCargaAsignacion();
      };

      type ResultadoTotalAsignacion = {
        encontrado: boolean;
        pagina: string;
        orden: string;
        item: string;
        total: string;
        filasVisibles: Array<{ orden: string; item: string; total: string }>;
        paginasDisponibles: string[];
      };

      const obtenerFrameAsignacion = async () =>
        comprasPage.locator('iframe#center_page').elementHandle().then((iframe) => iframe?.contentFrame());

      const selectorElementosAsignacion = 'td:visible, th:visible, span:visible, div:visible, input:visible, select:visible';

      const obtenerPaginasDisponiblesAsignacion = async () => {
        const leerPaginas = () => {
          const normalizar = (valor: string) => String(valor || '').trim().replace(/\s+/g, ' ');
          const normalizarSinAcentos = (valor: string) => normalizar(valor)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase();
          const labelsPagina = Array.from(document.querySelectorAll('td, th, label, span, div')) as HTMLElement[];
          const labelPagina = labelsPagina
            .map((element) => ({ element, rect: element.getBoundingClientRect(), text: normalizarSinAcentos(element.innerText || element.textContent || '') }))
            .filter((item) => item.rect.width > 0 && item.rect.height > 0)
            .find((item) => /^PAGINA:?$/.test(item.text));
          const selects = Array.from(document.querySelectorAll('select')) as HTMLSelectElement[];
          const selectPagina = labelPagina
            ? selects
              .map((select) => ({ select, rect: select.getBoundingClientRect() }))
              .filter((item) => item.rect.width > 0 && item.rect.height > 0)
              .filter((item) => item.rect.left > labelPagina.rect.right && Math.abs(item.rect.top - labelPagina.rect.top) < 24)
              .sort((a, b) => a.rect.left - b.rect.left)[0]?.select
            : undefined;
          return selectPagina
            ? Array.from(selectPagina.options).map((option) => normalizar(option.textContent || option.value || '')).filter(Boolean)
            : ['1'];
        };

        if (usarFrame) {
          const centerFrame = await obtenerFrameAsignacion();
          if (!centerFrame) return ['1'];
          return centerFrame.locator('body').evaluate(leerPaginas);
        }

        return comprasPage.locator('body').evaluate(leerPaginas);
      };

      const seleccionarPaginaAsignacion = async (pagina: string) => {
        const xpathSelectorPagina = 'xpath=(//*[normalize-space()="Página" or normalize-space()="Pagina"]/following::select)[1]';

        const seleccionarConPlaywright = async (scope: any) => {
          const selectPagina = scope.locator(xpathSelectorPagina).first();
          if (!await selectPagina.isVisible({ timeout: 3000 }).catch(() => false)) {
            return false;
          }

          const paginaActual = await selectPagina.evaluate((selectElement: HTMLSelectElement) =>
            selectElement.options[selectElement.selectedIndex]?.textContent?.trim() || selectElement.value
          );
          if (paginaActual === pagina) {
            return true;
          }

          await selectPagina.scrollIntoViewIfNeeded().catch(() => undefined);
          await comprasPage.waitForTimeout(1500);
          await selectPagina.selectOption({ label: pagina }).catch(async () => {
            await selectPagina.selectOption({ value: pagina });
          });
          await comprasPage.waitForTimeout(4000);

          const paginaSeleccionada = await selectPagina.evaluate((selectElement: HTMLSelectElement) =>
            selectElement.options[selectElement.selectedIndex]?.textContent?.trim() || selectElement.value
          );
          return paginaSeleccionada === pagina;
        };

        if (usarFrame) {
          const centerFrame = await obtenerFrameAsignacion();
          if (centerFrame && await seleccionarConPlaywright(centerFrame)) {
            return true;
          }
        } else if (await seleccionarConPlaywright(comprasPage)) {
          return true;
        }

        const seleccionarPagina = (paginaObjetivo: string) => {
          const normalizar = (valor: string) => String(valor || '').trim().replace(/\s+/g, ' ');
          const normalizarSinAcentos = (valor: string) => normalizar(valor)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase();
          const labelsPagina = Array.from(document.querySelectorAll('td, th, label, span, div')) as HTMLElement[];
          const labelPagina = labelsPagina
            .map((element) => ({ element, rect: element.getBoundingClientRect(), text: normalizarSinAcentos(element.innerText || element.textContent || '') }))
            .filter((item) => item.rect.width > 0 && item.rect.height > 0)
            .find((item) => /^PAGINA:?$/.test(item.text));
          const selects = Array.from(document.querySelectorAll('select')) as HTMLSelectElement[];
          const selectPagina = labelPagina
            ? selects
              .map((select) => ({ select, rect: select.getBoundingClientRect() }))
              .filter((item) => item.rect.width > 0 && item.rect.height > 0)
              .filter((item) => item.rect.left > labelPagina.rect.right && Math.abs(item.rect.top - labelPagina.rect.top) < 24)
              .sort((a, b) => a.rect.left - b.rect.left)[0]?.select
            : undefined;
          if (!selectPagina) return false;

          const opciones = Array.from(selectPagina.options);
          const paginaActual = Number(selectPagina.options[selectPagina.selectedIndex]?.textContent || selectPagina.value || '1');
          const paginaDestino = Number(paginaObjetivo);
          if (paginaActual === paginaDestino) return true;

          const rectSelect = selectPagina.getBoundingClientRect();
          const controlesPagina = Array.from(document.querySelectorAll('a, button, input, img, span'))
            .map((element) => {
              const htmlElement = element as HTMLElement;
              const rect = htmlElement.getBoundingClientRect();
              return { element: htmlElement, rect, text: normalizar(htmlElement.innerText || htmlElement.getAttribute('title') || htmlElement.getAttribute('alt') || htmlElement.getAttribute('src') || '') };
            })
            .filter((item) => item.rect.width > 0 && item.rect.height > 0)
            .filter((item) => Math.abs(item.rect.top - rectSelect.top) < 24);
          const controlSiguiente = controlesPagina
            .filter((item) => item.rect.left > rectSelect.right)
            .sort((a, b) => a.rect.left - b.rect.left)[0];
          const controlAnterior = controlesPagina
            .filter((item) => item.rect.right < rectSelect.left)
            .sort((a, b) => b.rect.right - a.rect.right)[0];
          const control = paginaDestino > paginaActual ? controlSiguiente : controlAnterior;
          if (control) {
            control.element.click();
            return true;
          }

          const opcion = opciones.find((option) =>
            normalizar(option.value) === paginaObjetivo || normalizar(option.textContent || '') === paginaObjetivo
          ) || opciones[Number(paginaObjetivo) - 1];
          if (!opcion) return false;

          selectPagina.value = opcion.value;
          selectPagina.dispatchEvent(new Event('input', { bubbles: true }));
          selectPagina.dispatchEvent(new Event('change', { bubbles: true }));
          selectPagina.dispatchEvent(new Event('blur', { bubbles: true }));
          return true;
        };

        if (usarFrame) {
          const centerFrame = await obtenerFrameAsignacion();
          if (!centerFrame) return false;
          return centerFrame.locator('body').evaluate(seleccionarPagina, pagina);
        }

        return comprasPage.locator('body').evaluate(seleccionarPagina, pagina);
      };

      const obtenerTotalItemAsignacion = async (): Promise<ResultadoTotalAsignacion> => {
        const extraerTotalItem = (
          elements: Element[],
          datos: { orderReference: string; itemReference: string; paginasDisponibles: string[] }
        ) => {
          const normalizar = (valor: string) => String(valor || '')
            .trim()
            .replace(/\s+/g, ' ')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase();
          const obtenerValor = (element: Element) => {
            const htmlElement = element as HTMLElement;
            const input = element as HTMLInputElement;
            return (
              input.value ||
              htmlElement.getAttribute('value') ||
              htmlElement.innerText ||
              htmlElement.textContent ||
              htmlElement.title ||
              htmlElement.getAttribute('aria-label') ||
              ''
            ).trim();
          };
          const seCruzaHorizontalmente = (celda: { x: number; width: number }, header: { x: number; width: number }) =>
            celda.x < header.x + header.width && celda.x + celda.width > header.x;
          const valorItemCoincide = (valor: string) => {
            const normalizado = normalizar(valor);
            const itemNormalizado = normalizar(datos.itemReference);
            return normalizado === itemNormalizado || String(Number(normalizado)) === String(Number(itemNormalizado));
          };

          const visibles = elements
            .map((element) => {
              const htmlElement = element as HTMLElement;
              const rect = htmlElement.getBoundingClientRect();
              const value = obtenerValor(element);
              const select = element as HTMLSelectElement;
              const selectedOption = select.tagName === 'SELECT'
                ? (select.options[select.selectedIndex]?.value || select.options[select.selectedIndex]?.text || '')
                : '';
              return {
                element: htmlElement,
                value,
                normalized: normalizar(value || selectedOption),
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
              };
            })
            .filter((item) => item.width > 0 && item.height > 0);

          const paginaActual = visibles.find((item) =>
            item.element.tagName === 'SELECT'
            && Array.from((item.element as HTMLSelectElement).options).every((option) => /^\d+$/.test((option.value || option.textContent || '').trim()))
          )?.normalized || '';

          const buscarHeaderGrilla = (regex: RegExp) => visibles
            .filter((item) => regex.test(item.normalized))
            .sort((a, b) => b.y - a.y)[0];
          const headers = {
            orden: buscarHeaderGrilla(/ORDEN/),
            item: buscarHeaderGrilla(/\bITEM\b/),
            total: buscarHeaderGrilla(/\bTOTAL\b/),
          };

          let filas = Array.from(document.querySelectorAll('tr, .ag-row'))
            .map((fila) => {
              const filaHtml = fila as HTMLElement;
              const rectFila = filaHtml.getBoundingClientRect();
              const celdas = Array.from(fila.children)
                .filter((child) => child.matches('td, th, [colid], .ag-cell'))
                .map((child) => {
                  const childHtml = child as HTMLElement;
                  const childRect = childHtml.getBoundingClientRect();
                  const value = obtenerValor(child);
                  return {
                    value,
                    normalized: normalizar(value),
                    x: childRect.x,
                    y: childRect.y,
                    width: childRect.width,
                    height: childRect.height,
                    colid: child.getAttribute('colid') || '',
                  };
                })
                .filter((celda) => celda.width > 0 && celda.height > 0);

              const obtenerCeldaPorHeader = (header: { x: number; width: number } | undefined, regexColid: RegExp) =>
                celdas.find((celda) => regexColid.test(celda.colid))
                || (header ? celdas.find((celda) => seCruzaHorizontalmente(celda, header)) : undefined);

              const celdaOrden = obtenerCeldaPorHeader(headers.orden, /order/i);
              const celdaItem = obtenerCeldaPorHeader(headers.item, /^item$/i);
              const celdaTotal = obtenerCeldaPorHeader(headers.total, /total/i);

              return {
                y: rectFila.y,
                orden: celdaOrden?.value || '',
                item: celdaItem?.value || '',
                total: celdaTotal?.value || '',
                ordenNormalizada: normalizar(celdaOrden?.value || ''),
                itemNormalizado: normalizar(celdaItem?.value || ''),
              };
            })
            .filter((fila) => fila.orden || fila.item || fila.total);

          if (filas.every((fila) => fila.ordenNormalizada !== normalizar(datos.orderReference)) && headers.orden && headers.item && headers.total) {
            const celdasDatos = visibles
              .filter((item) => item.y > Math.max(headers.orden!.y, headers.item!.y, headers.total!.y) + Math.max(headers.orden!.height, headers.item!.height, headers.total!.height) - 2)
              .filter((item) => item.normalized && !/^ORDEN#?:?$|^ITEM:?$|^TOTAL:?$/.test(item.normalized));
            const filasPorY = new Map<number, typeof celdasDatos>();

            for (const celda of celdasDatos) {
              const llaveExistente = Array.from(filasPorY.keys()).find((y) => Math.abs(y - celda.y) <= 8);
              const llave = llaveExistente ?? Math.round(celda.y);
              filasPorY.set(llave, [...(filasPorY.get(llave) ?? []), celda]);
            }

            filas = Array.from(filasPorY.values()).map((celdas) => {
              const celdaOrden = celdas.find((celda) => seCruzaHorizontalmente(celda, headers.orden!));
              const celdaItem = celdas.find((celda) => seCruzaHorizontalmente(celda, headers.item!));
              const celdaTotal = celdas.find((celda) => seCruzaHorizontalmente(celda, headers.total!));
              return {
                y: Math.min(...celdas.map((celda) => celda.y)),
                orden: celdaOrden?.value || '',
                item: celdaItem?.value || '',
                total: celdaTotal?.value || '',
                ordenNormalizada: normalizar(celdaOrden?.value || ''),
                itemNormalizado: normalizar(celdaItem?.value || ''),
              };
            }).filter((fila) => fila.orden || fila.item || fila.total);
          }

          const filaObjetivo = filas.find((fila) =>
            fila.ordenNormalizada === normalizar(datos.orderReference) && valorItemCoincide(fila.itemNormalizado)
          );

          const filasVisibles = filas
            .filter((fila) => fila.ordenNormalizada === normalizar(datos.orderReference))
            .map((fila) => ({
              orden: fila.orden,
              item: fila.item,
              total: fila.total,
            }));

          if (!filaObjetivo) {
            return {
              encontrado: false,
              pagina: paginaActual,
              orden: datos.orderReference,
              item: datos.itemReference,
              total: '',
              filasVisibles,
              paginasDisponibles: datos.paginasDisponibles,
            };
          }

          return {
            encontrado: true,
            pagina: paginaActual,
            orden: filaObjetivo.orden,
            item: filaObjetivo.item,
            total: filaObjetivo.total,
            filasVisibles,
            paginasDisponibles: datos.paginasDisponibles,
          };
        };

        const paginasDisponibles = await obtenerPaginasDisponiblesAsignacion();
        const args = {
          orderReference: orderReferenceCapturado,
          itemReference: itemOrderReferenceCapturado,
          paginasDisponibles,
        };

        if (usarFrame) {
          const centerFrame = await obtenerFrameAsignacion();
          if (!centerFrame) {
            return { encontrado: false, pagina: '', orden: orderReferenceCapturado, item: itemOrderReferenceCapturado, total: '', filasVisibles: [], paginasDisponibles };
          }
          return centerFrame.locator(selectorElementosAsignacion).evaluateAll(extraerTotalItem, args);
        }

        return comprasPage.locator(selectorElementosAsignacion).evaluateAll(extraerTotalItem, args);
      };

      const buscarTotalItemEnPaginasAsignacion = async (intento: number) => {
        const paginasDisponibles = await obtenerPaginasDisponiblesAsignacion();
        const paginas = paginasDisponibles.length > 0 ? paginasDisponibles : ['1'];
        let ultimoResultado: ResultadoTotalAsignacion | null = null;

        for (const [indicePagina, paginaAsignacion] of paginas.entries()) {
          if (indicePagina > 0) {
            await comprasPage.waitForTimeout(2500);
            const paginaSeleccionada = await seleccionarPaginaAsignacion(paginaAsignacion);
            expect(paginaSeleccionada, `Debe poder cambiar a la pagina ${paginaAsignacion} en Asignacion de ordenes`).toBeTruthy();
            await comprasPage.waitForTimeout(5000);
            await esperarCargaAsignacion();
          }

          const resultado = await obtenerTotalItemAsignacion();
          ultimoResultado = resultado;
          fs.writeFileSync(
            `reports/html/16-betagr-total-item-${orderReferenceCapturado}-${itemOrderReferenceCapturado}-intento-${intento}-pagina-${paginaAsignacion}.json`,
            JSON.stringify(resultado, null, 2)
          );

          if (resultado.encontrado) {
            await tomarScreenshotPagina(comprasPage, `reports/screenshots/16-betagr-asignacion-item-${itemOrderReferenceCapturado}-pagina-${paginaAsignacion}.png`);
            return resultado;
          }
        }

        return ultimoResultado ?? {
          encontrado: false,
          pagina: '',
          orden: orderReferenceCapturado,
          item: itemOrderReferenceCapturado,
          total: '',
          filasVisibles: [],
          paginasDisponibles: paginas,
        };
      };

      await aplicarBusquedaAsignacion();

      console.log(`✅ Prefijo ${orderReferenceCapturado} ingresado, filtro Fecha UC y filtro Todos seleccionados, búsqueda actualizada`);
      await esperarCargaAsignacion();
      await tomarScreenshotPagina(comprasPage, 'reports/screenshots/16-betagr-asignacion-actualizada.png');
      await tomarScreenshotPagina(comprasPage, 'reports/screenshots/16-betagr-asignacion-filtro-uc.png');

      const valorBoxesEsperado = valorBOXESAsignado.toString();
      let valorBoxesVisible = false;
      const maxIntentosAsignacion = 5;

      for (let intento = 1; intento <= maxIntentosAsignacion; intento++) {
        const resultadoTotalAsignacion = await buscarTotalItemEnPaginasAsignacion(intento);
        fs.writeFileSync(
          `reports/html/16-betagr-total-candidatos-intento-${intento}.json`,
          JSON.stringify(resultadoTotalAsignacion, null, 2)
        );
        valorBoxesVisible = resultadoTotalAsignacion.encontrado && resultadoTotalAsignacion.total === valorBoxesEsperado;

        if (valorBoxesVisible) {
          console.log(`✅ SUCCESS: Valor BOXES ${valorBoxesEsperado} coincide con TOTAL en Asignación de ordenes para ${orderReferenceCapturado}-${itemOrderReferenceCapturado}, pagina ${resultadoTotalAsignacion.pagina}`);
          break;
        }

        if (intento < maxIntentosAsignacion) {
          console.log(`⏳ Valor BOXES ${valorBoxesEsperado} no coincide con TOTAL para ${orderReferenceCapturado}-${itemOrderReferenceCapturado}. Refrescando intento ${intento} de ${maxIntentosAsignacion - 1}...`);
          await aplicarBusquedaAsignacion();
          await comprasPage.waitForTimeout(30000);
          await esperarCargaAsignacion();
          await tomarScreenshotPagina(comprasPage, `reports/screenshots/16-betagr-asignacion-refresh-${intento}.png`);
        }
      }

      expect(
        valorBoxesVisible,
        `El campo TOTAL de Asignación de ordenes debe coincidir con el valor BOXES ${valorBoxesEsperado} para ${orderReferenceCapturado}-${itemOrderReferenceCapturado}`
      ).toBeTruthy();

      await comprasPage.waitForTimeout(1000);
      await tomarScreenshotPagina(comprasPage, 'reports/screenshots/17-betagr-cambio-gr-confirmado.png');

      console.log(`COMPRAS_ASIGNACION_ORDENES: ${Date.now() - t0}ms`);
    });

  });
});
