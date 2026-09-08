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
        console.log(`ðŸ“‹ Order Reference de la fila seleccionada: ${orderReferenceCompletoCapturado}`);
        console.log(`ðŸ“‹ Prefijo de la fila seleccionada: ${orderReferenceCapturado}`);
      }
      
      if (!orderReferenceCompletoCapturado) {
        fs.writeFileSync('reports/html/05-selected-row-debug.txt', textoFilaSeleccionada.replace(/\s+/g, ' ').trim());
      }

      expect(orderReferenceCompletoCapturado, 'Debe capturar el Order Reference completo de la fila seleccionada, ejemplo PB9919-001').toMatch(/^[A-Z]{2}\d{4}(?:-\d+)?$/);
      expect(orderReferenceCapturado, 'Debe capturar el prefijo del Order Reference, ejemplo PB9919').toMatch(/^[A-Z]{2}\d{4}$/);
      
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

      await comprasPage.goto('https://betagr.ghtcorptest.com/', { waitUntil: 'domcontentloaded' });
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

        expect(cambioRealizado, 'Debe poder cambiar el filtro Fecha a UC cuando no se encuentran ordenes').toBeTruthy();
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
        console.log('✅ No se encontraron ordenes con el filtro de fecha actual. Filtro Fecha cambiado a UC.');
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

      const aplicarBusquedaAsignacion = async () => {
        await esperarCargaAsignacion();

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
          await aplicarRangoFechasMesAsignacion();
          await marcarFiltroTodos(asignacionFrame.locator(filtroTodosXpath));
          await esperarCargaAsignacion();
          await asignacionFrame.locator(actualizarXpath).click({ timeout: 10000 });
        } else {
          await comprasPage.locator(prefijoInputXpath).waitFor({ state: 'visible', timeout: 20000 });
          await comprasPage.locator(prefijoInputXpath).fill(orderReferenceCapturado);
          await aplicarRangoFechasMesAsignacion();
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

      const obtenerValoresPrecioUnidadAsignacion = async () => {
        if (usarFrame) {
          const centerFrame = await comprasPage.locator('iframe#center_page').elementHandle().then((iframe) => iframe?.contentFrame());
          if (!centerFrame) return [];

          return centerFrame.locator('td:visible, th:visible, span:visible, div:visible, input:visible').evaluateAll((elements) => {
            const extraerNumeros = (valor: string) => valor.match(/\$?\d+(?:[.,]\d+)?/g) ?? [];
            const agregar = (destino: string[], valor: unknown) => {
              const texto = String(valor ?? '').trim();
              if (!texto) return;
              destino.push(texto);
              destino.push(...extraerNumeros(texto));
            };
            const items = elements.map((element) => {
              const htmlElement = element as any;
              const input = element as any;
              const rect = htmlElement.getBoundingClientRect();
              const value = input.value?.trim();
              const text = htmlElement.textContent?.trim();

              return {
                value: value || text || '',
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height
              };
            }).filter((item) => item.value);

            const precioUnidadHeaders = items.filter((item) => /precio\s*unidad:?/i.test(item.value));

            const valoresBajoPrecioUnidad = precioUnidadHeaders.flatMap((header) =>
              items
                .filter((item) => item.y > header.y + header.height)
                .filter((item) => item.x < header.x + header.width && item.x + item.width > header.x)
                .map((item) => item.value)
                .filter((value) => /^\$?\d+(?:[.,]\d+)?$/.test(value))
            );

            const valoresNumericosVisibles = items
              .map((item) => item.value)
              .filter((value) => /^\$?\d+(?:[.,]\d+)?$/.test(value));

            const valoresAmpliados: string[] = [];
            for (const element of elements) {
              const htmlElement = element as any;
              agregar(valoresAmpliados, htmlElement.value);
              agregar(valoresAmpliados, htmlElement.getAttribute?.('value'));
              agregar(valoresAmpliados, htmlElement.innerText);
              agregar(valoresAmpliados, htmlElement.textContent);
              agregar(valoresAmpliados, htmlElement.title);
              agregar(valoresAmpliados, htmlElement.getAttribute?.('aria-label'));
            }

            return [...new Set([...valoresBajoPrecioUnidad, ...valoresNumericosVisibles, ...valoresAmpliados])]
              .filter((value) => /\d/.test(value));
          });
        }

        return comprasPage.locator('td:visible, th:visible, span:visible, div:visible, input:visible').evaluateAll((elements) => {
          const extraerNumeros = (valor: string) => valor.match(/\$?\d+(?:[.,]\d+)?/g) ?? [];
          const agregar = (destino: string[], valor: unknown) => {
            const texto = String(valor ?? '').trim();
            if (!texto) return;
            destino.push(texto);
            destino.push(...extraerNumeros(texto));
          };
          const items = elements.map((element) => {
            const htmlElement = element as any;
            const input = element as any;
            const rect = htmlElement.getBoundingClientRect();
            const value = input.value?.trim();
            const text = htmlElement.textContent?.trim();

            return {
              value: value || text || '',
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height
            };
          }).filter((item) => item.value);

          const precioUnidadHeaders = items.filter((item) => /precio\s*unidad:?/i.test(item.value));

          const valoresBajoPrecioUnidad = precioUnidadHeaders.flatMap((header) =>
            items
              .filter((item) => item.y > header.y + header.height)
              .filter((item) => item.x < header.x + header.width && item.x + item.width > header.x)
              .map((item) => item.value)
              .filter((value) => /^\$?\d+(?:[.,]\d+)?$/.test(value))
          );

          const valoresNumericosVisibles = items
            .map((item) => item.value)
            .filter((value) => /^\$?\d+(?:[.,]\d+)?$/.test(value));

          const valoresAmpliados: string[] = [];
          for (const element of elements) {
            const htmlElement = element as any;
            agregar(valoresAmpliados, htmlElement.value);
            agregar(valoresAmpliados, htmlElement.getAttribute?.('value'));
            agregar(valoresAmpliados, htmlElement.innerText);
            agregar(valoresAmpliados, htmlElement.textContent);
            agregar(valoresAmpliados, htmlElement.title);
            agregar(valoresAmpliados, htmlElement.getAttribute?.('aria-label'));
          }

          return [...new Set([...valoresBajoPrecioUnidad, ...valoresNumericosVisibles, ...valoresAmpliados])]
            .filter((value) => /\d/.test(value));
        });
      };

      await aplicarBusquedaAsignacion();

      console.log(`âœ… Prefijo ${orderReferenceCapturado} ingresado, filtro Todos seleccionado y bÃºsqueda actualizada`);
      await esperarCargaAsignacion();
      await tomarScreenshotPagina(comprasPage, 'reports/screenshots/16-betagr-asignacion-actualizada.png');

      const totalItemsInicialAsignacion = await obtenerTotalItemsAsignacion();
      const sinOrdenesInicialAsignacion = await noHayOrdenesAsignacion();
      fs.writeFileSync(
        'reports/html/16-betagr-total-items-filtro-fecha-original.json',
        JSON.stringify({ totalItems: totalItemsInicialAsignacion, sinOrdenes: sinOrdenesInicialAsignacion }, null, 2)
      );

      if (totalItemsInicialAsignacion === 0 || sinOrdenesInicialAsignacion) {
        await aplicarFiltroFechaUCAsignacion();
        await aplicarBusquedaAsignacion();
        await esperarCargaAsignacion();
        await tomarScreenshotPagina(comprasPage, 'reports/screenshots/16-betagr-asignacion-filtro-uc.png');
        const totalItemsFiltroUC = await obtenerTotalItemsAsignacion();
        const sinOrdenesFiltroUC = await noHayOrdenesAsignacion();
        fs.writeFileSync(
          'reports/html/16-betagr-total-items-filtro-uc.json',
          JSON.stringify({ totalItems: totalItemsFiltroUC, sinOrdenes: sinOrdenesFiltroUC }, null, 2)
        );
      }

      // Ejemplo de comparacion: FOB Price asignado en QU desde Bulk Changes "1.51" y Precio Unidad "151" coinciden porque ambos normalizan sus primeros 3 numeros a "151".
      const obtenerPrimerosTresNumeros = (valor: string) => {
        const numeros = String(valor).replace(/[^0-9]/g, '');
        return numeros ? numeros.slice(0, 3).padEnd(3, '0') : '';
      };
      const primerosTresNumerosFobPrice = obtenerPrimerosTresNumeros(valorPriceAsignado);
      const selectorValoresAsignacion = 'td:visible, th:visible, span:visible, div:visible, input:visible';
      const estiloEvidenciaExitosa = {
        outline: '4px solid #16803c',
        backgroundColor: '#e8f5e9',
        color: '#000000',
      };
      const enfocarPrecioUnidadCoincidente = async () => {
        const enfocarElemento = async (locatorBase: any) => {
          return locatorBase.evaluateAll((elements: Element[], params: { primerosTres: string; estilo: typeof estiloEvidenciaExitosa }) => {
            const obtenerPrimerosTres = (valor: string) => {
              const numeros = String(valor).replace(/[^0-9]/g, '');
              return numeros ? numeros.slice(0, 3).padEnd(3, '0') : '';
            };
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

            const items = elements
              .map((element) => {
                const htmlElement = element as HTMLElement;
                const rect = htmlElement.getBoundingClientRect();
                const value = obtenerValor(element);

                return { element: htmlElement, value, rect };
              })
              .filter((item) => item.value && item.rect.width > 0 && item.rect.height > 0);

            const headersPrecioUnidad = items.filter((item) => /precio\s*unidad:?/i.test(item.value));
            const candidatos = headersPrecioUnidad
              .flatMap((header) => items
                .filter((item) => item.rect.top > header.rect.bottom)
                .filter((item) => seCruzaHorizontalmente(item, header))
              )
              .filter((item) => /\d/.test(item.value))
              .filter((item) => obtenerPrimerosTres(item.value) === params.primerosTres)
              .sort((a, b) => a.rect.top - b.rect.top);

            const candidato = candidatos[0];
            if (!candidato) {
              return false;
            }

            candidato.element.scrollIntoView({ block: 'center', inline: 'center' });
            candidato.element.style.outline = params.estilo.outline;
            candidato.element.style.backgroundColor = params.estilo.backgroundColor;
            candidato.element.style.color = params.estilo.color;
            return true;
          }, { primerosTres: primerosTresNumerosFobPrice, estilo: estiloEvidenciaExitosa });
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
      const maxIntentosAsignacion = 5;

      for (let intento = 1; intento <= maxIntentosAsignacion; intento++) {
        const valoresPrecioUnidadAsignacion = await obtenerValoresPrecioUnidadAsignacion();
        fs.writeFileSync(
          `reports/html/16-betagr-precio-unidad-candidatos-intento-${intento}.json`,
          JSON.stringify(valoresPrecioUnidadAsignacion, null, 2)
        );
        const valoresPrecioUnidadNormalizados = valoresPrecioUnidadAsignacion.map((valor) => ({
          valorOriginal: valor,
          primerosTresNumeros: obtenerPrimerosTresNumeros(valor),
          coincideConFobPrice: obtenerPrimerosTresNumeros(valor) === primerosTresNumerosFobPrice,
        }));
        fs.writeFileSync(
          `reports/html/16-betagr-precio-unidad-normalizados-intento-${intento}.json`,
          JSON.stringify(
            {
              fobPriceAsignadoQU: valorPriceAsignado,
              primerosTresNumerosFobPrice,
              candidatos: valoresPrecioUnidadNormalizados,
            },
            null,
            2
          )
        );
        precioVisible = valoresPrecioUnidadAsignacion.some((valor) => {
          const primerosTresNumerosPrecioUnidad = obtenerPrimerosTresNumeros(valor);
          return primerosTresNumerosPrecioUnidad === primerosTresNumerosFobPrice;
        });

        if (precioVisible) {
          intentoConPrecioCoincidente = intento;
          console.log(`SUCCESS: Los primeros 3 numeros de Precio Unidad coinciden con el FOB Price asignado en QU desde Bulk Changes (${valorPriceAsignado}, numeros ${primerosTresNumerosFobPrice}) para ${orderReferenceCapturado}`);
          break;
        }

        if (intento < maxIntentosAsignacion) {
          console.log(`Los primeros 3 numeros de Precio Unidad no coinciden con el FOB Price asignado en QU desde Bulk Changes (${valorPriceAsignado}, numeros ${primerosTresNumerosFobPrice}). Refrescando intento ${intento} de ${maxIntentosAsignacion - 1}...`);
          await aplicarBusquedaAsignacion();
          await comprasPage.waitForTimeout(30000);
          await esperarCargaAsignacion();
          await tomarScreenshotPagina(comprasPage, `reports/screenshots/16-betagr-asignacion-refresh-${intento}.png`);
        }
      }

      expect(
        precioVisible,
        `Los primeros 3 numeros del campo Precio Unidad de Asignacion de ordenes deben coincidir con el FOB Price asignado en QU desde Bulk Changes (${valorPriceAsignado}, numeros ${primerosTresNumerosFobPrice}) para el prefijo ${orderReferenceCapturado}`
      ).toBeTruthy();

      const precioEnfocadoParaEvidencia = await enfocarPrecioUnidadCoincidente();
      expect(
        precioEnfocadoParaEvidencia,
        `Debe poder enfocar visualmente en GR el Precio Unidad que coincide con ${valorPriceAsignado}`
      ).toBeTruthy();
      await comprasPage.waitForTimeout(1000);
      await tomarScreenshotPagina(comprasPage, 'reports/screenshots/17-betagr-precio-actualizado.png');
      await tomarScreenshotPagina(comprasPage, 'reports/screenshots/18-betagr-precio-evidencia-gr.png');

      console.log(`âœ… Precio validado en intento ${intentoConPrecioCoincidente}. Cerrando navegador y finalizando test.`);
      await comprasPage.close();
      await page.close();

      console.log(`COMPRAS_ASIGNACION_ORDENES: ${Date.now() - t0}ms`);
    });

  });
});
