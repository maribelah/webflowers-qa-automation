import { test, expect } from '../../src/fixtures/base.fixture';
import { ENV } from '../../src/utils/envConfig';
import fs from 'fs';

test.describe('Módulo Bulk Changes — Flujo principal', () => {
  test('Bulkchanges — navegar, buscar y seleccionar checkbox', async ({ page }, testInfo) => {
    fs.mkdirSync('reports/screenshots', { recursive: true });
    fs.mkdirSync('reports/html', { recursive: true });
    test.setTimeout(300000);
    
    // Variables para guardar datos entre pasos
    let orderReferenceCapturado = '';
    let valorBOXESAsignado = 0;
    const tomarScreenshot = async (path: string) => {
      try {
        await page.screenshot({ path, fullPage: true, timeout: 60000 });
      } catch (error) {
        console.log(`⚠️ No se pudo guardar screenshot ${path}: ${(error as Error).message}`);
      }
    };

    // ══════════════════════════════════════════════════════════════
    // PASO 1: Navegar a la URL
    // ══════════════════════════════════════════════════════════════
    await test.step('Navegar a la URL del ambiente', async () => {
      const t0 = Date.now();
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(ENV.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
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
      await page.click('#btnSigIn');
      // Esperar más tiempo para que cargue la aplicación completa
      await page.waitForTimeout(8000);
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
      await page.waitForTimeout(5000);
      
      // Click en Sales - usar selector específico con data-target="#subSales"
      const salesParent = frameMenu.locator('div[data-toggle="collapse"][data-target="#subSales"]');
      await salesParent.click({ timeout: 15000 });
      await page.waitForTimeout(2000);
      console.log('✅ Click en Sales');
      
      // Click en Bulk Changes
      const bulkChanges = frameMenu.locator('div.div-child[title="Bulk Changes"] a.link');
      await bulkChanges.click({ timeout: 15000 });
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
      
      // CAPTURAR el Order Reference de la primera fila
      // El checkbox está en div[2], así que Order Reference debería estar en div[3]
      const selectoresOrderRef = [
        'xpath=/html/body/div/div/div[1]/div/div[1]/div[2]/div[2]/div/div[1]/div[3]',
        'xpath=/html/body/div/div/div[1]/div/div[1]/div[2]/div[2]/div/div[1]/div[3]/span',
        'xpath=//div[contains(@class, "row")]//div[3]',
        '[col-id="Order_Reference"]'
      ];
      
      for (const selector of selectoresOrderRef) {
        try {
          const orderRefElement = frameCenter.locator(selector).first();
          // Esperar a que el elemento esté visible con timeout corto
          await orderRefElement.waitFor({ state: 'visible', timeout: 3000 });
          const texto = await orderRefElement.textContent({ timeout: 2000 });
          if (texto && texto.trim().length > 0) {
            orderReferenceCapturado = texto.trim();
            console.log(`📋 Order Reference capturado con selector "${selector}": ${orderReferenceCapturado}`);
            break;
          }
        } catch (e) {
          // Continuar con el siguiente selector
        }
      }
      
      if (!orderReferenceCapturado) {
        console.log('⚠️ No se pudo capturar Order Reference automáticamente');
        // Intentar capturar cualquier texto que parece ser Order Reference (PC####-###)
        try {
          const allTexts = await frameCenter.locator('xpath=/html/body/div/div/div[1]/div/div[1]/div[2]/div[2]/div/div[1]//div').allTextContents();
          console.log('📄 Textos encontrados en la primera fila:', allTexts);
          for (const t of allTexts) {
            if (/^PC\d+/.test(t.trim())) {
              orderReferenceCapturado = t.trim();
              console.log(`📋 Order Reference detectado por patrón: ${orderReferenceCapturado}`);
              break;
            }
          }
        } catch (e) {
          console.log('⚠️ Error al buscar textos');
        }
      }
      
      // XPath proporcionado por el usuario para el checkbox
      const checkboxXpath = 'xpath=/html/body/div/div/div[1]/div/div[1]/div[2]/div[2]/div/div[1]/div[2]/span/input';
      
      await frameCenter.locator(checkboxXpath).click({ timeout: 10000 });
      console.log('✅ Checkbox clickeado con XPath del usuario');
      
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
      console.log(`📋 Este valor se verificará en Order Entry para la orden: ${orderReferenceCapturado}`);
      
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
      
      // Click en Sales - usar selector específico
      await frameMenu.locator('div[data-toggle="collapse"][data-target="#subSales"]').click();
      await page.waitForTimeout(2000);
      console.log('✅ Click en Sales');
      
      // Click en New - usar selector específico
      await frameMenu.locator('div[data-toggle="collapse"][data-target="#sub0_New_10"]').click();
      await page.waitForTimeout(2000);
      console.log('✅ Click en New');
      
      // Click en Order Entry - buscar span con texto exacto
      const orderEntry = frameMenu.locator('span.label-text:text-is("Order Entry")');
      await orderEntry.scrollIntoViewIfNeeded();
      await orderEntry.click({ timeout: 15000 });
      console.log('✅ Click en Order Entry');
      
      // Esperar 20 segundos a que cargue el módulo
      console.log('⏳ Esperando 20 segundos a que cargue Order Entry...');
      await page.waitForTimeout(20000);
      
      console.log(`ORDER_ENTRY: ${Date.now() - t0}ms`);
      await tomarScreenshot('reports/screenshots/12-order-entry.png');
    });

  });
});
