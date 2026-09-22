import { test, expect } from '../../src/fixtures/base.fixture';
import { ENV } from '../../src/utils/envConfig';
import { waitForAppReady, clickResilient } from '../../src/utils/waitUtils';
import fs from 'fs';

test.describe('MÃ³dulo Bulk Changes â€” Flujo principal Price', () => {
  test('Bulkchanges Price â€” aplicar cambio masivo y validar precio', async ({ page }, testInfo) => {
    fs.mkdirSync('reports/screenshots', { recursive: true });
    fs.mkdirSync('reports/html', { recursive: true });
    test.setTimeout(600000);
    
    // Variables para guardar datos entre pasos
    let orderReferenceCapturado = '';
    let orderReferenceCompletoCapturado = '';
    let itemOrderReferenceCapturado = '';
    let valorPriceAsignado = '';
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
        console.log(`âš ï¸ No se pudo guardar screenshot ${path}: ${(error as Error).message}`);
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

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // PASO 1: Navegar a la URL
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    await test.step('Navegar a la URL del ambiente', async () => {
      const t0 = Date.now();
      await page.goto(ENV.url, { waitUntil: 'domcontentloaded' });
      await waitForAppReady(page, 30000);
      console.log(`NAVIGATE: ${Date.now() - t0}ms`);
      await tomarScreenshot('reports/screenshots/01-inicio.png');
    });

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // PASO 2: Login
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // PASO 3: Navegar a Sales â†’ Bulk Changes
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    await test.step('Navegar a Sales â†’ Bulk Changes', async () => {
      const t0 = Date.now();
      const frameMenu = page.frameLocator('iframe#left_page1');
      
      // Esperar a que el iframe del menÃº estÃ© listo
      await page.locator('iframe#left_page1').waitFor({ state: 'attached', timeout: 30000 });
      await page.waitForTimeout(3000);
      
      await clickPrimerMenuVisible('Sales', [
        frameMenu.locator('div[data-toggle="collapse"][data-target="#subSales"]'),
        frameMenu.getByText('Sales', { exact: true }),
        frameMenu.locator('xpath=//*[normalize-space()="Sales"]'),
      ]);
      await page.waitForTimeout(2000);
      console.log('âœ… Click en Sales');
      
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
      console.log('âœ… Click en Bulk Changes');
      
      console.log(`NAV_MENU: ${Date.now() - t0}ms`);
      await tomarScreenshot('reports/screenshots/03-bulk-changes.png');
    });

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // PASO 4: Click en Search (sin ajustar fechas)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    await test.step('Click en Search', async () => {
      const t0 = Date.now();
      const frameCenter = page.frameLocator('iframe#center_page');
      
      // Click en el botÃ³n Search sin modificar fechas
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

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // PASO 5: Click en el checkbox del primer registro y CAPTURAR Order Reference
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    await test.step('Click en checkbox del primer registro', async () => {
      const t0 = Date.now();
      const frameCenter = page.frameLocator('iframe#center_page');
      const centerFrame = page.frame({ name: 'center_page' }) ?? page.frames().find(f => f.name() === 'center_page');
      
      // Guardar HTML ANTES del click para debug (ya deberÃ­an estar los datos)
      if (centerFrame) {
        fs.writeFileSync('reports/html/05a-antes-checkbox.html', await centerFrame.content());
        console.log('ðŸ“„ HTML guardado en 05a-antes-checkbox.html');
      }

      // XPath proporcionado por el usuario para el checkbox.
      const checkboxXpath = 'xpath=/html/body/div/div/div[1]/div/div[1]/div[2]/div[2]/div/div[1]/div[2]/span/input';
      const checkboxPrimerRegistro = frameCenter.locator(checkboxXpath);
      await checkboxPrimerRegistro.waitFor({ state: 'visible', timeout: 10000 });

      await checkboxPrimerRegistro.click({ timeout: 10000 });
      console.log('âœ… Checkbox clickeado con XPath del usuario');

      const filaSeleccionada = frameCenter.locator('[role="row"][aria-selected="true"], .MuiDataGrid-row.Mui-selected').first();
      await filaSeleccionada.waitFor({ state: 'visible', timeout: 10000 });

      const textoFilaSeleccionada = await filaSeleccionada.textContent({ timeout: 5000 }) ?? '';
      orderReferenceCompletoCapturado = extraerOrderReference(textoFilaSeleccionada);

      if (orderReferenceCompletoCapturado) {
        orderReferenceCapturado = orderReferenceCompletoCapturado.substring(0, 6);
        itemOrderReferenceCapturado = orderReferenceCompletoCapturado.split('-')[1] ?? '';
        console.log(`ðŸ“‹ Order Reference de la fila seleccionada: ${orderReferenceCompletoCapturado}`);
        console.log(`ðŸ“‹ Prefijo de la fila seleccionada: ${orderReferenceCapturado}`);
        console.log(`ðŸ“‹ Item de la fila seleccionada: ${itemOrderReferenceCapturado}`);
      }
      
      if (!orderReferenceCompletoCapturado) {
        fs.writeFileSync('reports/html/05-selected-row-debug.txt', textoFilaSeleccionada.replace(/\s+/g, ' ').trim());
      }

      expect(orderReferenceCompletoCapturado, 'Debe capturar el Order Reference completo de la fila seleccionada, ejemplo PB9919-001').toMatch(/^[A-Z]{2}\d{4}(?:-\d+)?$/);
      expect(orderReferenceCapturado, 'Debe capturar el prefijo del Order Reference, ejemplo PB9919').toMatch(/^[A-Z]{2}\d{4}$/);
      expect(itemOrderReferenceCapturado, 'Debe capturar el item del Order Reference, ejemplo 001').toMatch(/^\d+$/);
      
      console.log(`CHECKBOX: ${Date.now() - t0}ms`);
      await tomarScreenshot('reports/screenshots/05-checkbox-selected.png');
      
      // Guardar HTML despuÃ©s del click para verificar
      if (centerFrame) {
        fs.writeFileSync('reports/html/05b-despues-checkbox.html', await centerFrame.content());
      }
    });

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // PASO 6: Esperar 10 segundos y click en elemento
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    await test.step('Esperar 10s y click en elemento', async () => {
      const t0 = Date.now();
      const frameCenter = page.frameLocator('iframe#center_page');
      
      // Esperar 10 segundos
      console.log('â³ Esperando 10 segundos...');
      await page.waitForTimeout(10000);
      
      // Click en el elemento proporcionado
      const elementXpath = 'xpath=/html/body/div/div/div[2]/div/div[1]/span/span[2]/span/div/div/div';
      await frameCenter.locator(elementXpath).click({ timeout: 10000 });
      console.log('âœ… Click en elemento realizado');
      
      // Esperar a que el dropdown se abra
      await page.waitForTimeout(2000);
      
      console.log(`CLICK_ELEMENTO: ${Date.now() - t0}ms`);
      await tomarScreenshot('reports/screenshots/06-after-click.png');
    });

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // PASO 7: Seleccionar Price del dropdown
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    await test.step('Seleccionar Price del dropdown', async () => {
      const t0 = Date.now();
      const frameCenter = page.frameLocator('iframe#center_page');
      
      const opcionesPrice = [
        frameCenter.locator('xpath=/html/body/div[2]/div[3]/ul/li[normalize-space()="Price"]'),
        frameCenter.locator('xpath=/html/body/div[2]/div[3]/ul/li[contains(normalize-space(),"Price")]'),
        frameCenter.getByText(/^Price$/i),
        frameCenter.getByText(/FOB Price/i),
      ];

      await clickPrimerMenuVisible('Price', opcionesPrice);
      console.log('âœ… Price seleccionado');
      
      // Esperar a que cargue el formulario
      console.log('â³ Esperando carga del formulario...');
      await page.waitForTimeout(5000);
      
      console.log(`SELECT_PRICE: ${Date.now() - t0}ms`);
      await tomarScreenshot('reports/screenshots/07-price-selected.png');
    });

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // PASO 8: Ingresar valor random (1.00-3.00) en input de Price
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    await test.step('Ingresar valor random en input Price', async () => {
      const t0 = Date.now();
      const frameCenter = page.frameLocator('iframe#center_page');
      
      // Regla actual: rango inclusivo 1.00 a 3.00, siempre con dos decimales.
      const centavosPrice = Math.floor(Math.random() * (300 - 100 + 1)) + 100;
      valorPriceAsignado = (centavosPrice / 100).toFixed(2);
      console.log(`ðŸŽ² Valor random Price generado: ${valorPriceAsignado}`);
      console.log(`ðŸ“‹ Este valor se verificarÃ¡ en Order Entry para la orden: ${orderReferenceCompletoCapturado}`);
      
      // Limpiar y escribir en el input de Price
      const inputXpath = 'xpath=/html/body/div[2]/div[3]/div[2]/form/table/tbody/tr/td/input';
      await frameCenter.locator(inputXpath).clear();
      await frameCenter.locator(inputXpath).fill(valorPriceAsignado);
      console.log('âœ… Valor Price ingresado en el input');
      
      console.log(`INPUT_PRICE: ${Date.now() - t0}ms`);
      await tomarScreenshot('reports/screenshots/08-price-value-entered.png');
    });

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // PASO 9: Click en Save (formulario Price)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    await test.step('Click en Save Price', async () => {
      const t0 = Date.now();
      const frameCenter = page.frameLocator('iframe#center_page');
      
      // Click en Save del formulario Price
      const saveXpath = 'xpath=/html/body/div[2]/div[3]/div[2]/form/div/button';
      await frameCenter.locator(saveXpath).click({ timeout: 10000 });
      console.log('âœ… Click en Save Price realizado');
      
      // Esperar a que se procese
      await page.waitForTimeout(5000);
      
      console.log(`SAVE_PRICE: ${Date.now() - t0}ms`);
      await tomarScreenshot('reports/screenshots/09-after-save.png');
    });

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // PASO 10: Click en Apply y CONFIRMAR guardado
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    await test.step('Click en Apply y confirmar guardado', async () => {
      const t0 = Date.now();
      const frameCenter = page.frameLocator('iframe#center_page');
      const centerFrame = page.frame({ name: 'center_page' }) ?? page.frames().find(f => f.name() === 'center_page');
      
      // XPath del botÃ³n Apply
      const applyXpath = 'xpath=/html/body/div/div/div[2]/div/div[3]/span/span[2]/span/button';
      const applyButton = frameCenter.locator(applyXpath);
      
      // === FASE 1: PreparaciÃ³n ===
      console.log('ðŸ“‹ FASE 1: Preparando click en Apply...');
      await applyButton.waitFor({ state: 'visible', timeout: 15000 });
      
      // Capturar estado inicial del botÃ³n
      const textoBotonAntes = await applyButton.textContent();
      const claseBotonAntes = await applyButton.getAttribute('class');
      console.log(`   Estado inicial del botÃ³n: "${textoBotonAntes}" | class: ${claseBotonAntes?.substring(0, 50)}...`);
      
      // Screenshot antes del click
      await tomarScreenshot('reports/screenshots/10a-antes-apply.png');
      
      // === FASE 2: Click en Apply ===
      console.log('ðŸ“‹ FASE 2: Ejecutando click en Apply...');
      await applyButton.click({ timeout: 10000 });
      console.log('âœ… Click en Apply ejecutado');
      
      // Screenshot inmediatamente despuÃ©s del click
      await page.waitForTimeout(500);
      await tomarScreenshot('reports/screenshots/10b-despues-apply-click.png');
      
      // === FASE 3: Esperar que el proceso inicie ===
      console.log('ðŸ“‹ FASE 3: Esperando que el proceso inicie...');
      await page.waitForTimeout(2000);
      
      // === FASE 4: Confirmar que Apply se estÃ¡ ejecutando o terminÃ³ ===
      console.log('ðŸ“‹ FASE 4: Confirmando ejecuciÃ³n del proceso...');
      
      let procesoConfirmado = false;
      const maxWaitTime = 90000; // 90 segundos mÃ¡ximo
      const pollInterval = 2000;
      let elapsedTime = 0;
      
      // Selectores para detectar que el proceso terminÃ³
      const indicadoresExito = [
        // Mensajes de Ã©xito
        'text=success', 'text=Success', 'text=successfully', 'text=Successfully',
        'text=completed', 'text=Completed', 'text=applied', 'text=Applied',
        'text=updated', 'text=Updated', 'text=saved', 'text=Saved',
        // Clases de Ã©xito
        '//*[contains(@class,"success")]', '//*[contains(@class,"toast-success")]',
        '.MuiAlert-standardSuccess', '[class*="success"]'
      ];
      
      // Selectores de loading/spinner (para saber si estÃ¡ procesando)
      const indicadoresLoading = [
        '//*[contains(@class,"loading")]', '//*[contains(@class,"spinner")]',
        '//*[contains(@class,"progress")]', '.MuiCircularProgress-root',
        '[class*="loading"]', '[class*="spinner"]'
      ];
      
      while (elapsedTime < maxWaitTime && !procesoConfirmado) {
        // Verificar si hay indicadores de Ã©xito
        for (const selector of indicadoresExito) {
          try {
            const count = await frameCenter.locator(selector).count();
            if (count > 0) {
              const isVisible = await frameCenter.locator(selector).first().isVisible();
              if (isVisible) {
                console.log(`âœ… CONFIRMADO: Mensaje de Ã©xito detectado con: ${selector}`);
                procesoConfirmado = true;
                break;
              }
            }
          } catch (e) { /* ignorar */ }
        }
        
        if (procesoConfirmado) break;
        
        // Verificar si el botÃ³n Apply cambiÃ³ de estado (se deshabilitÃ³ o cambiÃ³ texto)
        try {
          const textoBotonAhora = await applyButton.textContent();
          const estaDeshabilitado = await applyButton.isDisabled();
          const estaVisible = await applyButton.isVisible();
          
          if (!estaVisible) {
            console.log('âœ… CONFIRMADO: BotÃ³n Apply ya no estÃ¡ visible (proceso completado)');
            procesoConfirmado = true;
            break;
          }
          
          if (textoBotonAhora !== textoBotonAntes) {
            console.log(`âœ… CONFIRMADO: BotÃ³n cambiÃ³ de "${textoBotonAntes}" a "${textoBotonAhora}"`);
            procesoConfirmado = true;
            break;
          }
        } catch (e) {
          // BotÃ³n no encontrado = proceso completado y UI cambiÃ³
          console.log('âœ… CONFIRMADO: BotÃ³n Apply no encontrado (UI actualizÃ³)');
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
          console.log(`â³ Proceso en ejecuciÃ³n... ${elapsedTime / 1000}s`);
        } else if (elapsedTime > 10000) {
          // Si no hay loading despuÃ©s de 10s, probablemente terminÃ³
          console.log(`â³ Verificando finalizaciÃ³n... ${elapsedTime / 1000}s`);
        }
        
        await page.waitForTimeout(pollInterval);
        elapsedTime += pollInterval;
      }
      
      // === FASE 5: ConfirmaciÃ³n final ===
      console.log('ðŸ“‹ FASE 5: ConfirmaciÃ³n final del proceso...');
      
      // Esperar estabilizaciÃ³n
      await page.waitForTimeout(3000);
      
      // Screenshot del estado final
      await tomarScreenshot('reports/screenshots/10c-estado-final-apply.png');
      
      // Guardar HTML para anÃ¡lisis
      if (centerFrame) {
        const htmlFinal = await centerFrame.content();
        fs.writeFileSync('reports/html/10-apply-final.html', htmlFinal);
        
        // Buscar en el HTML indicadores de Ã©xito
        const htmlLower = htmlFinal.toLowerCase();
        if (htmlLower.includes('success') || htmlLower.includes('completed') || 
            htmlLower.includes('applied') || htmlLower.includes('updated')) {
          console.log('âœ… CONFIRMADO via HTML: Se encontraron indicadores de Ã©xito en el DOM');
          procesoConfirmado = true;
        }
      }
      
      // Resultado final
      if (procesoConfirmado) {
        console.log('ðŸŽ‰ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
        console.log('ðŸŽ‰ APPLY CONFIRMADO: El proceso se ejecutÃ³ correctamente');
        console.log('ðŸŽ‰ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
      } else {
        console.log('âš ï¸ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
        console.log('âš ï¸ APPLY: No se pudo confirmar el mensaje de Ã©xito');
        console.log('âš ï¸ Pero el click fue ejecutado y el proceso puede haber terminado');
        console.log('âš ï¸ Revisar screenshots 10a, 10b, 10c para confirmar visualmente');
        console.log('âš ï¸ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
      }
      
      console.log(`APPLY: ${Date.now() - t0}ms`);
      await tomarScreenshot('reports/screenshots/11-final-state.png');
      
      // Guardar HTML final
      if (centerFrame) {
        fs.writeFileSync('reports/html/11-final-state.html', await centerFrame.content());
      }
    });

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // PASO 11: Navegar a Sales â†’ New â†’ Order Entry
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    await test.step('Navegar a Sales â†’ New â†’ Order Entry', async () => {
      const t0 = Date.now();
      const frameMenu = page.frameLocator('iframe#left_page1');
      
      await page.locator('iframe#left_page1').waitFor({ state: 'attached', timeout: 30000 });

      await clickPrimerMenuVisible('Sales', [
        frameMenu.locator('div[data-toggle="collapse"][data-target="#subSales"]'),
        frameMenu.getByText('Sales', { exact: true }),
        frameMenu.locator('xpath=//*[normalize-space()="Sales"]'),
      ]);
      await page.waitForTimeout(2000);
      console.log('âœ… Click en Sales');
      
      await clickPrimerMenuVisible('New', [
        frameMenu.locator('div[data-toggle="collapse"][data-target="#sub0_New_10"]'),
        frameMenu.getByText('New', { exact: true }),
        frameMenu.locator('xpath=//*[normalize-space()="New"]'),
      ]);
      await page.waitForTimeout(2000);
      console.log('âœ… Click en New');
      
      await clickPrimerMenuVisible('Order Entry', [
        frameMenu.locator('a.link:has-text("Order Entry")'),
        frameMenu.locator('span.label-text:text-is("Order Entry")'),
        frameMenu.getByText('Order Entry', { exact: true }),
        frameMenu.locator('xpath=//*[normalize-space()="Order Entry"]'),
      ]);
      console.log('âœ… Click en Order Entry');
      
      // Esperar 20 segundos a que cargue el mÃ³dulo
      console.log('â³ Esperando 20 segundos a que cargue Order Entry...');
      await page.waitForTimeout(20000);

      const orderEntrySearchXpath = 'xpath=/html/body/form/div[3]/div[3]/div[1]/input';
      const frameCenter = page.frameLocator('iframe#center_page');
      const orderReferenceParaOrderEntry = orderReferenceCapturado;

      expect(
        orderReferenceParaOrderEntry,
        'Debe existir el prefijo de 6 caracteres de la orden capturada en Bulk Changes para buscarla en Order Entry'
      ).toMatch(/^[A-Z]{2}\d{4}$/);

      try {
        const searchInput = frameCenter.locator(orderEntrySearchXpath);
        await searchInput.waitFor({ state: 'visible', timeout: 30000 });
        await searchInput.fill(orderReferenceParaOrderEntry);
        await searchInput.press('Enter');
      } catch (error) {
        const searchInput = page.locator(orderEntrySearchXpath);
        await searchInput.waitFor({ state: 'visible', timeout: 30000 });
        await searchInput.fill(orderReferenceParaOrderEntry);
        await searchInput.press('Enter');
      }

      console.log(`âœ… Prefijo ${orderReferenceParaOrderEntry} ingresado en Order Entry y bÃºsqueda ejecutada con Enter`);
      await page.waitForLoadState('domcontentloaded').catch(() => undefined);
      await waitForAppReady(page, 45000).catch(() => undefined);
      await page.waitForTimeout(10000);

      const centerFrame = await page.locator('iframe#center_page').elementHandle().then((iframe) => iframe?.contentFrame());
      if (centerFrame) {
        const precioEsperado = Number(valorPriceAsignado);
        const leerInputsOrderEntry = async () => centerFrame.locator('input:visible').evaluateAll((inputs) =>
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

        const maxIntentosOrderEntry = 5;
        let valoresCoincidentes: any[] = [];
        let inputsOrderEntry: any[] = [];

        for (let intento = 1; intento <= maxIntentosOrderEntry; intento++) {
          await waitForAppReady(page, 45000).catch(() => undefined);
          await page.waitForTimeout(intento === 1 ? 5000 : 15000);

          fs.writeFileSync(`reports/html/12-order-entry-intento-${intento}.html`, await centerFrame.content());
          inputsOrderEntry = await leerInputsOrderEntry();
          fs.writeFileSync(`reports/html/12-order-entry-inputs-intento-${intento}.json`, JSON.stringify(inputsOrderEntry, null, 2));

          valoresCoincidentes = inputsOrderEntry.filter((input) => {
            const valorNormalizado = Number.parseFloat(String(input.value).replace(/[^0-9.-]/g, ''));
            return Number.isFinite(valorNormalizado) && Math.abs(valorNormalizado - precioEsperado) < 0.001;
          });

          if (valoresCoincidentes.length > 0) {
            break;
          }

          if (intento < maxIntentosOrderEntry) {
            console.log(`FOB Price ${valorPriceAsignado} aun no aparece en Order Entry. Esperando carga estable, intento ${intento} de ${maxIntentosOrderEntry - 1}...`);
            await centerFrame.locator('body').waitFor({ state: 'visible', timeout: 30000 });
          }
        }

        fs.writeFileSync('reports/html/12-order-entry.html', await centerFrame.content());
        fs.writeFileSync('reports/html/12-order-entry-inputs.json', JSON.stringify(inputsOrderEntry, null, 2));
        await tomarScreenshot('reports/screenshots/12-order-entry.png');
        await tomarScreenshot('reports/screenshots/12-order-entry-frame.png');

        expect(
          valoresCoincidentes.length,
          `Debe visualizarse el valor FOB Price ${valorPriceAsignado} en Order Entry para el prefijo ${orderReferenceParaOrderEntry}`
        ).toBeGreaterThan(0);

        console.log(`âœ… SUCCESS: Valor FOB Price ${valorPriceAsignado} visualizado en Order Entry para el prefijo ${orderReferenceParaOrderEntry}`);
      } else {
        throw new Error('No se encontrÃ³ iframe center_page para validar el valor FOB Price en Order Entry');
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
        // Esperar que la pÃ¡gina estÃ© lista y usar click resiliente
        await waitForAppReady(comprasPage, 30000);
        await clickResilient(comprasPage.locator('#btnSigIn'));
        await waitForAppReady(comprasPage, 30000);
        await comprasPage.bringToFront();
        console.log('âœ… Login realizado en BETA GR');
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
      console.log('âœ… Click en Compras');
      await tomarScreenshotPagina(comprasPage, 'reports/screenshots/14-betagr-compras.png');

      await clickPrimerMenuVisible('AsignaciÃ³n de ordenes', [
        frameMenu.getByText(/Asignaci[oÃ³]n(?: de)? Orden/i),
        frameMenu.locator('xpath=//*[contains(translate(normalize-space(), "Ã“Ã³", "Oo"), "Asignacion Orden") or contains(translate(normalize-space(), "Ã“Ã³", "Oo"), "Asignacion de ordenes")]'),
        frameMenu.locator(asignacionOrdenesXpath),
      ]);
      await comprasPage.waitForTimeout(8000);
      await comprasPage.bringToFront();
      console.log('âœ… Click en AsignaciÃ³n de ordenes');
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
        const loaders = usarFrame
          ? [
              asignacionFrame.locator('#divBackground'),
              asignacionFrame.locator('#backgroundLoadingMain'),
              comprasPage.locator('#backgroundLoadingMain'),
            ]
          : [
              comprasPage.locator('#divBackground'),
              comprasPage.locator('#backgroundLoadingMain'),
            ];

        for (const loading of loaders) {
          await loading.waitFor({ state: 'hidden', timeout: 60000 }).catch(() => undefined);
        }

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

        expect(cambioRealizado, 'Debe poder cambiar el filtro Fecha a UC antes de validar Precio Unidad').toBeTruthy();
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
        console.log('✅ Filtro Fecha cambiado a UC antes de validar Precio Unidad.');
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

        console.log(`âœ… Rango de fechas GR aplicado: ${fechaDesdeMes} - ${fechaHastaMes}`);
      };

      const aplicarBusquedaAsignacion = async (opciones: { aplicarRangoFechas?: boolean } = {}) => {
        await esperarCargaAsignacion();
        const debeAplicarRangoFechas = opciones.aplicarRangoFechas ?? true;

        const marcarFiltroTodos = async (locator: any) => {
          await esperarCargaAsignacion();
          await locator.waitFor({ state: 'attached', timeout: 20000 });
          await locator.scrollIntoViewIfNeeded();

          try {
            await locator.check({ timeout: 15000 });
          } catch {
            await esperarCargaAsignacion();
            await locator.evaluate((input: any) => {
              if (!input.checked) {
                input.click();
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
              }
            });
          }
        };

        if (usarFrame) {
          await asignacionFrame.locator(prefijoInputXpath).fill(orderReferenceCapturado);
          if (debeAplicarRangoFechas) await aplicarRangoFechasMesAsignacion();
          await marcarFiltroTodos(asignacionFrame.locator(filtroTodosXpath));
          await esperarCargaAsignacion();
          await asignacionFrame.locator(actualizarXpath).click({ timeout: 10000 });
        } else {
          await comprasPage.locator(prefijoInputXpath).waitFor({ state: 'visible', timeout: 20000 });
          await comprasPage.locator(prefijoInputXpath).fill(orderReferenceCapturado);
          if (debeAplicarRangoFechas) await aplicarRangoFechasMesAsignacion();
          await marcarFiltroTodos(comprasPage.locator(filtroTodosXpath));
          await esperarCargaAsignacion();
          await comprasPage.locator(actualizarXpath).click({ timeout: 10000 });
        }

        await comprasPage.waitForTimeout(1000);
        await esperarCargaAsignacion();
      };

      const obtenerTotalItemsAsignacion = async () => {
        const leerTotalItems = (texto: string) => {
          const match = texto.match(/Total\s*(?:Í|I)tems:\s*(\d+)/i);
          return match ? Number(match[1]) : null;
        };

        if (usarFrame) {
          const centerFrame = await comprasPage.locator('iframe#center_page').elementHandle().then((iframe) => iframe?.contentFrame());
          if (centerFrame) {
            const texto = await centerFrame.locator('body').innerText({ timeout: 10000 }).catch(() => '');
            return leerTotalItems(texto);
          }
        }

        const texto = await comprasPage.locator('body').innerText({ timeout: 10000 }).catch(() => '');
        return leerTotalItems(texto);
      };

      const noHayOrdenesAsignacion = async () => {
        const leerSinRegistros = (texto: string) =>
          /No se encontraron registros/i.test(texto) || /Total\s*(?:Í|I)tems:\s*0/i.test(texto);

        if (usarFrame) {
          const centerFrame = await comprasPage.locator('iframe#center_page').elementHandle().then((iframe) => iframe?.contentFrame());
          if (centerFrame) {
            const texto = await centerFrame.locator('body').innerText({ timeout: 10000 }).catch(() => '');
            return leerSinRegistros(texto);
          }
        }

        const texto = await comprasPage.locator('body').innerText({ timeout: 10000 }).catch(() => '');
        return leerSinRegistros(texto);
      };

      type ResultadoPrecioUnidadAsignacion = {
        encontrado: boolean;
        pagina: string;
        orden: string;
        item: string;
        precioUnidad: string;
        filasVisibles: Array<{ orden: string; item: string; precioUnidad: string }>;
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
        const xpathSelectorPagina = 'xpath=(//*[normalize-space()="PÃ¡gina" or normalize-space()="Pagina"]/following::select)[1]';

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
          const leerPaginaActual = async () => selectPagina.evaluate((selectElement: HTMLSelectElement) =>
            selectElement.options[selectElement.selectedIndex]?.textContent?.trim() || selectElement.value
          ).catch(() => '');
          const esperarPaginaObjetivo = async () => {
            for (let intentoEspera = 1; intentoEspera <= 12; intentoEspera++) {
              await comprasPage.waitForTimeout(2000);
              const paginaSeleccionada = await leerPaginaActual();
              if (paginaSeleccionada === pagina) {
                return true;
              }
            }
            return false;
          };
          const clickControlPagina = async () => selectPagina.evaluate((selectElement: HTMLSelectElement, paginaObjetivo: string) => {
            const normalizar = (valor: string) => String(valor || '').trim().replace(/\s+/g, ' ');
            const paginaActualNumero = Number(selectElement.options[selectElement.selectedIndex]?.textContent || selectElement.value || '1');
            const paginaDestinoNumero = Number(paginaObjetivo);
            if (!Number.isFinite(paginaActualNumero) || !Number.isFinite(paginaDestinoNumero) || paginaActualNumero === paginaDestinoNumero) {
              return false;
            }

            const rectSelect = selectElement.getBoundingClientRect();
            const controlesPagina = Array.from(document.querySelectorAll('a, button, input, img, span'))
              .map((element) => {
                const htmlElement = element as HTMLElement;
                const rect = htmlElement.getBoundingClientRect();
                return { element: htmlElement, rect, text: normalizar(htmlElement.innerText || htmlElement.getAttribute('title') || htmlElement.getAttribute('alt') || htmlElement.getAttribute('src') || '') };
              })
              .filter((item) => item.rect.width > 0 && item.rect.height > 0)
              .filter((item) => Math.abs(item.rect.top - rectSelect.top) < 24)
              .filter((item) => item.rect.width <= 40 && item.rect.height <= 40)
              .filter((item) => !/TOTAL|ITEMS|PAGINA|^\d+$/.test(item.text.toUpperCase()));
            const controlSiguiente = controlesPagina
              .filter((item) => item.rect.left > rectSelect.right)
              .filter((item) => item.rect.left - rectSelect.right < 80)
              .sort((a, b) => a.rect.left - b.rect.left)[0];
            const controlAnterior = controlesPagina
              .filter((item) => item.rect.right < rectSelect.left)
              .filter((item) => rectSelect.left - item.rect.right < 80)
              .sort((a, b) => b.rect.right - a.rect.right)[0];
            const control = paginaDestinoNumero > paginaActualNumero ? controlSiguiente : controlAnterior;
            if (!control) return false;

            control.element.click();
            return true;
          }, pagina).catch(() => false);

          for (let intentoPagina = 1; intentoPagina <= 3; intentoPagina++) {
            await comprasPage.waitForTimeout(5000);
            const clickEjecutado = await clickControlPagina();
            if (clickEjecutado && await esperarPaginaObjetivo()) {
              return true;
            }
          }

          const paginaActualAntesTeclado = await leerPaginaActual();
          const pasosPagina = Number(pagina) - Number(paginaActualAntesTeclado);
          if (Number.isFinite(pasosPagina) && pasosPagina !== 0) {
            await selectPagina.click({ timeout: 5000 }).catch(() => undefined);
            await comprasPage.waitForTimeout(1000);
            for (let paso = 0; paso < Math.abs(pasosPagina); paso++) {
              await comprasPage.keyboard.press(pasosPagina > 0 ? 'ArrowDown' : 'ArrowUp');
              await comprasPage.waitForTimeout(500);
            }
            await comprasPage.keyboard.press('Enter');
            if (await esperarPaginaObjetivo()) {
              return true;
            }
          }

          await selectPagina.selectOption({ label: pagina }).catch(async () => {
            await selectPagina.selectOption({ value: pagina });
          });
          return esperarPaginaObjetivo();
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
            .filter((item) => Math.abs(item.rect.top - rectSelect.top) < 24)
            .filter((item) => item.rect.width <= 40 && item.rect.height <= 40)
            .filter((item) => !/TOTAL|ITEMS|PAGINA|^\d+$/.test(item.text.toUpperCase()));
          const controlSiguiente = controlesPagina
            .filter((item) => item.rect.left > rectSelect.right)
            .filter((item) => item.rect.left - rectSelect.right < 80)
            .sort((a, b) => a.rect.left - b.rect.left)[0];
          const controlAnterior = controlesPagina
            .filter((item) => item.rect.right < rectSelect.left)
            .filter((item) => rectSelect.left - item.rect.right < 80)
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
          const seleccionada = await centerFrame.locator('body').evaluate(seleccionarPagina, pagina);
          if (seleccionada) {
            await comprasPage.waitForTimeout(12000);
          }
          return seleccionada;
        }

        const seleccionada = await comprasPage.locator('body').evaluate(seleccionarPagina, pagina);
        if (seleccionada) {
          await comprasPage.waitForTimeout(12000);
        }
        return seleccionada;
      };

      const obtenerPrecioUnidadItemAsignacion = async (): Promise<ResultadoPrecioUnidadAsignacion> => {
        const extraerPrecioUnidadItem = (
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
          const buscarHeaderPrecioUnidad = () => {
            const headerCompleto = buscarHeaderGrilla(/PRECIO\s*UNIDAD/);
            if (headerCompleto) return headerCompleto;

            const headersPrecio = visibles
              .filter((item) => /^PRECIO:?$/.test(item.normalized))
              .sort((a, b) => b.y - a.y);
            const headersUnidad = visibles
              .filter((item) => /^UNIDAD:?$/.test(item.normalized))
              .sort((a, b) => b.y - a.y);

            for (const precio of headersPrecio) {
              const unidad = headersUnidad.find((item) =>
                Math.abs((item.x + item.width / 2) - (precio.x + precio.width / 2)) <= Math.max(precio.width, item.width)
                && item.y >= precio.y
                && item.y - precio.y <= 40
              );

              if (unidad) {
                return {
                  ...precio,
                  x: Math.min(precio.x, unidad.x),
                  y: Math.min(precio.y, unidad.y),
                  width: Math.max(precio.x + precio.width, unidad.x + unidad.width) - Math.min(precio.x, unidad.x),
                  height: Math.max(precio.y + precio.height, unidad.y + unidad.height) - Math.min(precio.y, unidad.y),
                };
              }
            }

            return undefined;
          };
          const headers = {
            orden: buscarHeaderGrilla(/ORDEN/),
            item: buscarHeaderGrilla(/\bITEM\b/),
            precioUnidad: buscarHeaderPrecioUnidad(),
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

              const obtenerCeldaPorHeader = (header: { x: number; width: number } | undefined, regexColid: RegExp, preferirHeader = false) => {
                const celdaPorHeader = header ? celdas.find((celda) => seCruzaHorizontalmente(celda, header)) : undefined;
                const celdaPorColid = celdas.find((celda) => regexColid.test(celda.colid));
                return preferirHeader ? celdaPorHeader || celdaPorColid : celdaPorColid || celdaPorHeader;
              };
              const esValorMonetario = (valor: string) => /\$/.test(valor);
              const celdaMonetariaFila = () => celdas
                .filter((celda) => esValorMonetario(celda.value))
                .sort((a, b) => a.x - b.x)[0];
              const celdaMonetariaDerecha = (celdaBase: { x: number; width: number } | undefined) => celdaBase
                ? celdas
                  .filter((celda) => celda.x > celdaBase.x + celdaBase.width - 2)
                  .filter((celda) => esValorMonetario(celda.value))
                  .sort((a, b) => a.x - b.x)[0]
                : undefined;

              const celdaOrden = obtenerCeldaPorHeader(headers.orden, /order/i);
              const celdaItem = obtenerCeldaPorHeader(headers.item, /^item$/i);
              let celdaPrecioUnidad = obtenerCeldaPorHeader(headers.precioUnidad, /precio|price/i, true);
              if (celdaPrecioUnidad && !esValorMonetario(celdaPrecioUnidad.value)) {
                celdaPrecioUnidad = celdaMonetariaDerecha(celdaPrecioUnidad) || celdaPrecioUnidad;
              }
              celdaPrecioUnidad = celdaMonetariaFila() || celdaPrecioUnidad;

              return {
                y: rectFila.y,
                orden: celdaOrden?.value || '',
                item: celdaItem?.value || '',
                precioUnidad: celdaPrecioUnidad?.value || '',
                ordenNormalizada: normalizar(celdaOrden?.value || ''),
                itemNormalizado: normalizar(celdaItem?.value || ''),
              };
            })
            .filter((fila) => fila.orden || fila.item || fila.precioUnidad);

          if (filas.every((fila) => fila.ordenNormalizada !== normalizar(datos.orderReference)) && headers.orden && headers.item && headers.precioUnidad) {
            const celdasDatos = visibles
              .filter((item) => item.y > Math.max(headers.orden!.y, headers.item!.y, headers.precioUnidad!.y) + Math.max(headers.orden!.height, headers.item!.height, headers.precioUnidad!.height) - 2)
              .filter((item) => item.normalized && !/^ORDEN#?:?$|^ITEM:?$|^PRECIO\s*UNIDAD:?$/.test(item.normalized));
            const filasPorY = new Map<number, typeof celdasDatos>();

            for (const celda of celdasDatos) {
              const llaveExistente = Array.from(filasPorY.keys()).find((y) => Math.abs(y - celda.y) <= 8);
              const llave = llaveExistente ?? Math.round(celda.y);
              filasPorY.set(llave, [...(filasPorY.get(llave) ?? []), celda]);
            }

            filas = Array.from(filasPorY.values()).map((celdas) => {
              const celdaOrden = celdas.find((celda) => seCruzaHorizontalmente(celda, headers.orden!));
              const celdaItem = celdas.find((celda) => seCruzaHorizontalmente(celda, headers.item!));
              const esValorMonetario = (valor: string) => /\$/.test(valor);
              let celdaPrecioUnidad = celdas.find((celda) => seCruzaHorizontalmente(celda, headers.precioUnidad!));
              if (celdaPrecioUnidad && !esValorMonetario(celdaPrecioUnidad.value)) {
                celdaPrecioUnidad = celdas
                  .filter((celda) => celda.x > celdaPrecioUnidad!.x + celdaPrecioUnidad!.width - 2)
                  .filter((celda) => esValorMonetario(celda.value))
                  .sort((a, b) => a.x - b.x)[0] || celdaPrecioUnidad;
              }
              celdaPrecioUnidad = celdas
                .filter((celda) => esValorMonetario(celda.value))
                .sort((a, b) => a.x - b.x)[0] || celdaPrecioUnidad;
              return {
                y: Math.min(...celdas.map((celda) => celda.y)),
                orden: celdaOrden?.value || '',
                item: celdaItem?.value || '',
                precioUnidad: celdaPrecioUnidad?.value || '',
                ordenNormalizada: normalizar(celdaOrden?.value || ''),
                itemNormalizado: normalizar(celdaItem?.value || ''),
              };
            }).filter((fila) => fila.orden || fila.item || fila.precioUnidad);
          }

          const filaObjetivo = filas.find((fila) =>
            fila.ordenNormalizada === normalizar(datos.orderReference) && valorItemCoincide(fila.itemNormalizado)
          );

          const filasVisibles = filas
            .filter((fila) => fila.ordenNormalizada === normalizar(datos.orderReference))
            .map((fila) => ({
              orden: fila.orden,
              item: fila.item,
              precioUnidad: fila.precioUnidad,
            }));

          if (!filaObjetivo) {
            return {
              encontrado: false,
              pagina: paginaActual,
              orden: datos.orderReference,
              item: datos.itemReference,
              precioUnidad: '',
              filasVisibles,
              paginasDisponibles: datos.paginasDisponibles,
            };
          }

          return {
            encontrado: true,
            pagina: paginaActual,
            orden: filaObjetivo.orden,
            item: filaObjetivo.item,
            precioUnidad: filaObjetivo.precioUnidad,
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
            return { encontrado: false, pagina: '', orden: orderReferenceCapturado, item: itemOrderReferenceCapturado, precioUnidad: '', filasVisibles: [], paginasDisponibles };
          }
          return centerFrame.locator(selectorElementosAsignacion).evaluateAll(extraerPrecioUnidadItem, args);
        }

        return comprasPage.locator(selectorElementosAsignacion).evaluateAll(extraerPrecioUnidadItem, args);
      };

      const buscarPrecioUnidadItemEnPaginasAsignacion = async (intento: number) => {
        const paginasDisponibles = await obtenerPaginasDisponiblesAsignacion();
        const paginas = paginasDisponibles.length > 0 ? paginasDisponibles : ['1'];
        let ultimoResultado: ResultadoPrecioUnidadAsignacion | null = null;

        for (const [indicePagina, paginaAsignacion] of paginas.entries()) {
          let resultado: ResultadoPrecioUnidadAsignacion | null = null;

          if (indicePagina > 0) {
          for (let intentoPagina = 1; intentoPagina <= 3; intentoPagina++) {
            await comprasPage.waitForTimeout(7000);
            const paginaSeleccionada = await seleccionarPaginaAsignacion(paginaAsignacion);
            if (!paginaSeleccionada) {
              console.log(`⚠️ No se pudo confirmar seleccion de pagina ${paginaAsignacion} (intento pagina ${intentoPagina}/3). Reintentando seleccion...`);
              continue;
            }

            await comprasPage.waitForTimeout(12000);
            await esperarCargaAsignacion();
            await tomarScreenshotPagina(comprasPage, `reports/screenshots/16-betagr-asignacion-pagina-${paginaAsignacion}-seleccionada-intento-${intento}-try-${intentoPagina}.png`);

              resultado = await obtenerPrecioUnidadItemAsignacion();
              fs.writeFileSync(
                `reports/html/16-betagr-precio-unidad-item-${orderReferenceCapturado}-${itemOrderReferenceCapturado}-intento-${intento}-pagina-${paginaAsignacion}-try-${intentoPagina}.json`,
                JSON.stringify(resultado, null, 2)
              );

              if (resultado.pagina === paginaAsignacion && resultado.filasVisibles.length > 0) {
                break;
              }

              console.log(`⚠️ La pagina ${paginaAsignacion} aun no quedo cargada en Asignacion de ordenes (intento pagina ${intentoPagina}/3). Reintentando seleccion...`);
            }

            expect(
              resultado?.pagina === paginaAsignacion && resultado.filasVisibles.length > 0,
              `Debe poder cambiar y cargar la pagina ${paginaAsignacion} en Asignacion de ordenes antes de validar Precio Unidad`
            ).toBeTruthy();
          }

          if (!resultado) {
            resultado = await obtenerPrecioUnidadItemAsignacion();
          }

          ultimoResultado = resultado;
          fs.writeFileSync(
            `reports/html/16-betagr-precio-unidad-item-${orderReferenceCapturado}-${itemOrderReferenceCapturado}-intento-${intento}-pagina-${paginaAsignacion}.json`,
            JSON.stringify(resultado, null, 2)
          );

          if (resultado.encontrado) {
            await tomarScreenshotPagina(comprasPage, `reports/screenshots/16-betagr-asignacion-precio-item-${itemOrderReferenceCapturado}-pagina-${paginaAsignacion}.png`);
            return resultado;
          }
        }

        return ultimoResultado ?? {
          encontrado: false,
          pagina: '',
          orden: orderReferenceCapturado,
          item: itemOrderReferenceCapturado,
          precioUnidad: '',
          filasVisibles: [],
          paginasDisponibles: paginas,
        };
      };

      await aplicarRangoFechasMesAsignacion();
      await aplicarFiltroFechaUCAsignacion();
      await aplicarBusquedaAsignacion({ aplicarRangoFechas: false });

      console.log(`âœ… Filtro UC aplicado. Prefijo ${orderReferenceCapturado} ingresado, filtro Todos seleccionado y bÃºsqueda actualizada`);
      await esperarCargaAsignacion();
      await tomarScreenshotPagina(comprasPage, 'reports/screenshots/16-betagr-asignacion-actualizada.png');

      const totalItemsInicialAsignacion = await obtenerTotalItemsAsignacion();
      const sinOrdenesInicialAsignacion = await noHayOrdenesAsignacion();
      fs.writeFileSync(
        'reports/html/16-betagr-total-items-filtro-fecha-original.json',
        JSON.stringify({ totalItems: totalItemsInicialAsignacion, sinOrdenes: sinOrdenesInicialAsignacion }, null, 2)
      );

      await tomarScreenshotPagina(comprasPage, 'reports/screenshots/16-betagr-asignacion-filtro-uc.png');
      const totalItemsFiltroUC = await obtenerTotalItemsAsignacion();
      const sinOrdenesFiltroUC = await noHayOrdenesAsignacion();
      fs.writeFileSync(
        'reports/html/16-betagr-total-items-filtro-uc.json',
        JSON.stringify({ totalItems: totalItemsFiltroUC, sinOrdenes: sinOrdenesFiltroUC }, null, 2)
      );

      // Ejemplo de comparacion: FOB Price asignado en QU desde Bulk Changes "1.51" y Precio Unidad "151" coinciden porque ambos normalizan sus primeros 3 numeros a "151".
      const obtenerPrimerosTresNumeros = (valor: string) => {
        const numeros = String(valor).replace(/[^0-9]/g, '');
        return numeros ? numeros.slice(0, 3).padEnd(3, '0') : '';
      };
      const primerosTresNumerosFobPrice = obtenerPrimerosTresNumeros(valorPriceAsignado);
      const selectorValoresAsignacion = 'td:visible, th:visible, span:visible, div:visible, input:visible';
      const estiloEvidenciaExitosa = {
        outline: '4px solid #0057d8',
        backgroundColor: '#dbeafe',
        color: '#000000',
      };
      const enfocarPrecioUnidadCoincidente = async () => {
        const enfocarElemento = async (locatorBase: any) => {
          return locatorBase.evaluateAll((elements: Element[], params: { primerosTres: string; orderReference: string; itemReference: string; estilo: typeof estiloEvidenciaExitosa }) => {
            const obtenerPrimerosTres = (valor: string) => {
              const numeros = String(valor).replace(/[^0-9]/g, '');
              return numeros ? numeros.slice(0, 3).padEnd(3, '0') : '';
            };
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
            const seCruzaHorizontalmente = (
              item: { rect: DOMRect },
              header: { rect: DOMRect }
            ) => item.rect.left < header.rect.right && item.rect.right > header.rect.left;
            const valorItemCoincide = (valor: string) => {
              const normalizado = normalizar(valor);
              const itemNormalizado = normalizar(params.itemReference);
              return normalizado === itemNormalizado || String(Number(normalizado)) === String(Number(itemNormalizado));
            };

            const items = elements
              .map((element) => {
                const htmlElement = element as HTMLElement;
                const rect = htmlElement.getBoundingClientRect();
                const value = obtenerValor(element);

                return { element: htmlElement, value, rect };
              })
              .filter((item) => item.value && item.rect.width > 0 && item.rect.height > 0);

            const buscarHeaderGrilla = (regex: RegExp) => items
              .filter((item) => regex.test(normalizar(item.value)))
              .sort((a, b) => b.rect.top - a.rect.top)[0];
            const buscarHeaderPrecioUnidad = () => {
              const headerCompleto = buscarHeaderGrilla(/PRECIO\s*UNIDAD/);
              if (headerCompleto) return headerCompleto;

              const headersPrecio = items
                .filter((item) => /^PRECIO:?$/.test(normalizar(item.value)))
                .sort((a, b) => b.rect.top - a.rect.top);
              const headersUnidad = items
                .filter((item) => /^UNIDAD:?$/.test(normalizar(item.value)))
                .sort((a, b) => b.rect.top - a.rect.top);

              for (const precio of headersPrecio) {
                const unidad = headersUnidad.find((item) =>
                  Math.abs((item.rect.left + item.rect.width / 2) - (precio.rect.left + precio.rect.width / 2)) <= Math.max(precio.rect.width, item.rect.width)
                  && item.rect.top >= precio.rect.top
                  && item.rect.top - precio.rect.top <= 40
                );

                if (unidad) {
                  const left = Math.min(precio.rect.left, unidad.rect.left);
                  const top = Math.min(precio.rect.top, unidad.rect.top);
                  const right = Math.max(precio.rect.right, unidad.rect.right);
                  const bottom = Math.max(precio.rect.bottom, unidad.rect.bottom);
                  return {
                    ...precio,
                    rect: {
                      x: left,
                      y: top,
                      left,
                      top,
                      right,
                      bottom,
                      width: right - left,
                      height: bottom - top,
                      toJSON: () => ({}),
                    },
                  };
                }
              }

              return undefined;
            };
            const headers = {
              orden: buscarHeaderGrilla(/ORDEN/),
              item: buscarHeaderGrilla(/\bITEM\b/),
              precioUnidad: buscarHeaderPrecioUnidad(),
            };
            if (!headers.orden || !headers.item || !headers.precioUnidad) {
              return false;
            }

            const celdasDatos = items
              .filter((item) => item.rect.top > Math.max(headers.orden!.rect.top, headers.item!.rect.top, headers.precioUnidad!.rect.top))
              .filter((item) => !/^ORDEN#?:?$|^ITEM:?$|^PRECIO\s*UNIDAD:?$/.test(normalizar(item.value)));
            const filasPorY = new Map<number, typeof celdasDatos>();
            for (const celda of celdasDatos) {
              const llaveExistente = Array.from(filasPorY.keys()).find((y) => Math.abs(y - celda.rect.top) <= 8);
              const llave = llaveExistente ?? Math.round(celda.rect.top);
              filasPorY.set(llave, [...(filasPorY.get(llave) ?? []), celda]);
            }

            const candidato = Array.from(filasPorY.values())
              .map((celdas) => {
                const esValorMonetario = (valor: string) => /\$/.test(valor);
                const precioUnidadInicial = celdas.find((celda) => seCruzaHorizontalmente(celda, headers.precioUnidad!));
                const precioUnidad = precioUnidadInicial && !esValorMonetario(precioUnidadInicial.value)
                  ? celdas
                    .filter((celda) => celda.rect.left > precioUnidadInicial.rect.left + precioUnidadInicial.rect.width - 2)
                    .filter((celda) => esValorMonetario(celda.value))
                    .filter((celda) => obtenerPrimerosTres(celda.value) === params.primerosTres)
                    .sort((a, b) => a.rect.left - b.rect.left)[0] || precioUnidadInicial
                  : precioUnidadInicial;
                const precioUnidadMonetario = celdas
                  .filter((celda) => esValorMonetario(celda.value))
                  .filter((celda) => obtenerPrimerosTres(celda.value) === params.primerosTres)
                  .sort((a, b) => a.rect.left - b.rect.left)[0] || precioUnidad;

                return {
                  orden: celdas.find((celda) => seCruzaHorizontalmente(celda, headers.orden!)),
                  item: celdas.find((celda) => seCruzaHorizontalmente(celda, headers.item!)),
                  precioUnidad: precioUnidadMonetario,
                };
              })
              .find((fila) =>
                normalizar(fila.orden?.value || '') === normalizar(params.orderReference)
                && valorItemCoincide(fila.item?.value || '')
                && obtenerPrimerosTres(fila.precioUnidad?.value || '') === params.primerosTres
              )?.precioUnidad;
            if (!candidato) {
              return false;
            }

            candidato.element.scrollIntoView({ block: 'center', inline: 'center' });
            candidato.element.style.outline = params.estilo.outline;
            candidato.element.style.backgroundColor = params.estilo.backgroundColor;
            candidato.element.style.color = params.estilo.color;
            return true;
          }, { primerosTres: primerosTresNumerosFobPrice, orderReference: orderReferenceCapturado, itemReference: itemOrderReferenceCapturado, estilo: estiloEvidenciaExitosa });
        };

        if (usarFrame) {
          const centerFrame = await comprasPage.locator('iframe#center_page').elementHandle().then((iframe) => iframe?.contentFrame());
          if (centerFrame && await enfocarElemento(centerFrame.locator(selectorValoresAsignacion))) {
            return true;
          }
        }

        return enfocarElemento(comprasPage.locator(selectorValoresAsignacion));
      };
      let precioVisible = false;
      let intentoConPrecioCoincidente = 0;
      let resultadoPrecioUnidadFinal: ResultadoPrecioUnidadAsignacion | null = null;
      const maxIntentosAsignacion = 5;

      for (let intento = 1; intento <= maxIntentosAsignacion; intento++) {
        const resultadoPrecioUnidadAsignacion = await buscarPrecioUnidadItemEnPaginasAsignacion(intento);
        resultadoPrecioUnidadFinal = resultadoPrecioUnidadAsignacion;
        fs.writeFileSync(
          `reports/html/16-betagr-precio-unidad-candidatos-intento-${intento}.json`,
          JSON.stringify(resultadoPrecioUnidadAsignacion, null, 2)
        );
        const primerosTresNumerosPrecioUnidad = obtenerPrimerosTresNumeros(resultadoPrecioUnidadAsignacion.precioUnidad);
        const valorPrecioUnidadNormalizado = {
          valorOriginal: resultadoPrecioUnidadAsignacion.precioUnidad,
          primerosTresNumeros: primerosTresNumerosPrecioUnidad,
          coincideConFobPrice: primerosTresNumerosPrecioUnidad === primerosTresNumerosFobPrice,
          encontrado: resultadoPrecioUnidadAsignacion.encontrado,
          pagina: resultadoPrecioUnidadAsignacion.pagina,
          orden: resultadoPrecioUnidadAsignacion.orden,
          item: resultadoPrecioUnidadAsignacion.item,
        };
        fs.writeFileSync(
          `reports/html/16-betagr-precio-unidad-normalizados-intento-${intento}.json`,
          JSON.stringify(
            {
              fobPriceAsignadoQU: valorPriceAsignado,
              primerosTresNumerosFobPrice,
              candidato: valorPrecioUnidadNormalizado,
            },
            null,
            2
          )
        );
        precioVisible = resultadoPrecioUnidadAsignacion.encontrado && primerosTresNumerosPrecioUnidad === primerosTresNumerosFobPrice;

        if (precioVisible) {
          intentoConPrecioCoincidente = intento;
          console.log(`SUCCESS: Los primeros 3 numeros de Precio Unidad coinciden con el FOB Price asignado en QU desde Bulk Changes (${valorPriceAsignado}, numeros ${primerosTresNumerosFobPrice}) para ${orderReferenceCapturado}-${itemOrderReferenceCapturado}, pagina ${resultadoPrecioUnidadAsignacion.pagina}`);
          break;
        }

        if (intento < maxIntentosAsignacion) {
          console.log(`Los primeros 3 numeros de Precio Unidad no coinciden con el FOB Price asignado en QU desde Bulk Changes (${valorPriceAsignado}, numeros ${primerosTresNumerosFobPrice}) para ${orderReferenceCapturado}-${itemOrderReferenceCapturado}. Refrescando intento ${intento} de ${maxIntentosAsignacion - 1}...`);
          await aplicarBusquedaAsignacion();
          await comprasPage.waitForTimeout(30000);
          await esperarCargaAsignacion();
          await tomarScreenshotPagina(comprasPage, `reports/screenshots/16-betagr-asignacion-refresh-${intento}.png`);
        }
      }

      expect(
        precioVisible,
        `Los primeros 3 numeros del campo Precio Unidad de Asignacion de ordenes deben coincidir con el FOB Price asignado en QU desde Bulk Changes (${valorPriceAsignado}, numeros ${primerosTresNumerosFobPrice}) para ${orderReferenceCapturado}-${itemOrderReferenceCapturado}. Ultimo resultado: ${JSON.stringify(resultadoPrecioUnidadFinal)}`
      ).toBeTruthy();

      const precioEnfocadoParaEvidencia = await enfocarPrecioUnidadCoincidente();
      expect(
        precioEnfocadoParaEvidencia,
        `Debe poder enfocar visualmente en GR el Precio Unidad que coincide con ${valorPriceAsignado}`
      ).toBeTruthy();
      await comprasPage.waitForTimeout(1000);
      await tomarScreenshotPagina(comprasPage, 'reports/screenshots/16-betagr-asignacion-filtro-uc.png');
      await tomarScreenshotPagina(comprasPage, 'reports/screenshots/17-betagr-precio-actualizado.png');
      await tomarScreenshotPagina(comprasPage, 'reports/screenshots/18-betagr-precio-evidencia-gr.png');

      console.log(`âœ… Precio validado en intento ${intentoConPrecioCoincidente}. Cerrando navegador y finalizando test.`);
      await comprasPage.close();
      await page.close();

      console.log(`COMPRAS_ASIGNACION_ORDENES: ${Date.now() - t0}ms`);
    });

  });
});
