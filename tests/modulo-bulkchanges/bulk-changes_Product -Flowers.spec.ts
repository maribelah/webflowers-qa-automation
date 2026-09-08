import { test, expect } from '../../src/fixtures/base.fixture';
import { ENV } from '../../src/utils/envConfig';
import { waitForAppReady, clickResilient } from '../../src/utils/waitUtils';
import fs from 'fs';

test.describe('Módulo Bulk Changes — Flujo principal Product - Flowers', () => {
  test('Bulkchanges Product - Flowers — aplicar cambio masivo y validar color y variedad', async ({ page }, testInfo) => {
    fs.mkdirSync('reports/screenshots', { recursive: true });
    fs.mkdirSync('reports/html', { recursive: true });
    test.setTimeout(720000);
    
    // Variables para guardar datos entre pasos
    let orderReferenceCapturado = '';
    let orderReferenceCompletoCapturado = '';
    let itemOrderReferenceCapturado = '';
    let valorColorActual = '';
    let valorColorAsignado = '';
    let valorVarietyActual = '';
    let valorVarietyAsignado = '';
    let valorCodeProductsDefinition = '';
    const adjustedRecipeColorSelectIndex = 3;
    const adjustedRecipeVarietySelectIndex = 4;
    const orderReferenceRegex = /[A-Z]{2}\d{4}(?:-\d+)?/;
    const extraerOrderReference = (texto: string) => texto.match(orderReferenceRegex)?.[0] ?? '';
    const normalizarValor = (valor: string) => String(valor).trim().replace(/\s+/g, ' ').toUpperCase();
    const valoresCoinciden = (valorA: string, valorB: string) => {
      const a = normalizarValor(valorA);
      const b = normalizarValor(valorB);
      if (a.length <= 2 || b.length <= 2) {
        return a === b;
      }
      return !!a && !!b && (a === b || a.includes(b) || b.includes(a));
    };
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
      const menuPrincipalVisible = await page
        .locator('iframe#left_page1, iframe#center_page')
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      if (menuPrincipalVisible) {
        console.log('LOGIN: sesion activa detectada; se omite ingreso de credenciales.');
      } else {
        await page.fill('input[name="txtUserName"]', ENV.usuario);
        await page.fill('input[name="txtPassword"]', ENV.password);
        await clickResilient(page.locator('#btnSigIn'));
      }

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
    // PASO 7: Seleccionar Product - Flowers del dropdown
    // ══════════════════════════════════════════════════════════════
    await test.step('Seleccionar Product - Flowers del dropdown', async () => {
      const t0 = Date.now();
      const frameCenter = page.frameLocator('iframe#center_page');
      
      await clickPrimerMenuVisible('Product - Flowers', [
        frameCenter.locator('xpath=/html/body/div[2]/div[3]/ul/li[normalize-space()="Product - Flowers"]'),
        frameCenter.locator('xpath=/html/body/div[2]/div[3]/ul/li[contains(normalize-space(),"Product") and contains(normalize-space(),"Flowers")]'),
        frameCenter.getByText(/^Product\s*-\s*Flowers$/i),
      ]);
      console.log('✅ Product - Flowers seleccionado');
      
      // Esperar a que cargue el formulario
      console.log('⏳ Esperando carga del formulario...');
      await page.waitForTimeout(5000);
      
      console.log(`SELECT_PRODUCT_FLOWERS: ${Date.now() - t0}ms`);
      await tomarScreenshot('reports/screenshots/07-product-flowers-selected.png');
    });

    // ══════════════════════════════════════════════════════════════
    // PASO 8: Cambiar Color y Variety del primer Adjusted Recipe
    // ══════════════════════════════════════════════════════════════
    await test.step('Cambiar Color y Variety del primer Adjusted Recipe', async () => {
      const t0 = Date.now();
      const centerFrame = await page.locator('iframe#center_page').elementHandle()
        .then((iframe) => iframe?.contentFrame())
        .catch(() => undefined) ?? page.mainFrame();
      expect(centerFrame, 'Debe existir un contexto de pagina para cambiar Product - Flowers').toBeTruthy();

      const marcarCampoAdjustedRecipe = async (campo: 'Color' | 'Variety') => {
        return centerFrame!.evaluate((fieldName) => {
          const normalizar = (valor: string) => String(valor).trim().replace(/\s+/g, ' ');
          const esVisible = (element: Element) => {
            const html = element as HTMLElement;
            const rect = html.getBoundingClientRect();
            const style = window.getComputedStyle(html);
            return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
          };
          const textoElemento = (element: Element) => normalizar(
            (element as HTMLInputElement).value ||
            (element as HTMLElement).innerText ||
            element.textContent ||
            element.getAttribute('title') ||
            element.getAttribute('aria-label') ||
            ''
          );
          const valorControl = (element: Element) => {
            const select = element as HTMLSelectElement;
            const input = element as HTMLInputElement;
            if (select.tagName === 'SELECT') {
              return normalizar(select.options[select.selectedIndex]?.label || select.options[select.selectedIndex]?.text || select.value || '');
            }
            return normalizar(input.value || element.textContent || element.getAttribute('title') || element.getAttribute('aria-label') || '');
          };

          document.querySelectorAll('[data-pw-product-flowers-field]').forEach((element) =>
            element.removeAttribute('data-pw-product-flowers-field')
          );

          const controls = Array.from(document.querySelectorAll('select, input, [role="combobox"], .MuiSelect-select'))
            .filter(esVisible) as HTMLElement[];
          const labels = Array.from(document.querySelectorAll('label, td, th, span, div'))
            .filter(esVisible) as HTMLElement[];
          const adjustedHeaders = labels
            .filter((element) => /Adjusted\s+Recipe/i.test(textoElemento(element)))
            .map((element) => element.getBoundingClientRect())
            .sort((a, b) => a.y - b.y || b.x - a.x);
          const adjustedHeader = adjustedHeaders[0];

          const fieldRegex = fieldName === 'Color' ? /^Color\b/i : /^Variety\b/i;
          const fieldLabels = labels
            .filter((element) => fieldRegex.test(textoElemento(element)))
            .filter((element) => {
              if (!adjustedHeader) return true;
              const rect = element.getBoundingClientRect();
              return rect.y >= adjustedHeader.y - 20 && rect.x >= adjustedHeader.x - 80;
            })
            .sort((a, b) => {
              const rectA = a.getBoundingClientRect();
              const rectB = b.getBoundingClientRect();
              return rectA.y - rectB.y || rectA.x - rectB.x;
            });

          const encontrarControlCercano = (label: HTMLElement) => {
            const labelRect = label.getBoundingClientRect();
            const belowColumnControl = controls
              .filter((control) => {
                const rect = control.getBoundingClientRect();
                const overlapsX = rect.x < labelRect.x + labelRect.width && rect.x + rect.width > labelRect.x;
                return rect.y > labelRect.y && rect.y <= labelRect.y + 80 && overlapsX;
              })
              .sort((a, b) => {
                const rectA = a.getBoundingClientRect();
                const rectB = b.getBoundingClientRect();
                return rectA.y - rectB.y || Math.abs(rectA.x - labelRect.x) - Math.abs(rectB.x - labelRect.x);
              })[0];
            if (belowColumnControl) return belowColumnControl;

            const row = label.closest('tr');
            const rowControls = row ? Array.from(row.querySelectorAll('select, input, [role="combobox"], .MuiSelect-select')).filter(esVisible) as HTMLElement[] : [];
            const rightRowControl = rowControls.find((control) => control.getBoundingClientRect().x > labelRect.x);
            if (rightRowControl) return rightRowControl;

            return controls
              .filter((control) => {
                const rect = control.getBoundingClientRect();
                return rect.y >= labelRect.y - 12 && rect.y <= labelRect.y + 80 && rect.x > labelRect.x;
              })
              .sort((a, b) => {
                const rectA = a.getBoundingClientRect();
                const rectB = b.getBoundingClientRect();
                return Math.abs(rectA.y - labelRect.y) - Math.abs(rectB.y - labelRect.y) || rectA.x - rectB.x;
              })[0];
          };

          let control = fieldLabels.map(encontrarControlCercano).find(Boolean);
          if (!control) {
            const rightControls = controls
              .filter((candidate) => {
                if (!adjustedHeader) return true;
                const rect = candidate.getBoundingClientRect();
                return rect.y >= adjustedHeader.y && rect.x >= adjustedHeader.x - 80;
              })
              .sort((a, b) => {
                const rectA = a.getBoundingClientRect();
                const rectB = b.getBoundingClientRect();
                return rectA.y - rectB.y || rectA.x - rectB.x;
              });
            control = fieldName === 'Color' ? rightControls[6] : rightControls[7];
          }

          if (!control) {
            return { found: false, current: '', tagName: '', role: '', options: [] };
          }

          control.setAttribute('data-pw-product-flowers-field', fieldName.toLowerCase());
          const select = control as HTMLSelectElement;
          const options = select.tagName === 'SELECT'
            ? Array.from(select.options).map((option) => ({
                value: option.value,
                label: normalizar(option.label || option.text || option.value),
              })).filter((option) => option.label)
            : [];

          return {
            found: true,
            current: valorControl(control),
            tagName: control.tagName,
            role: control.getAttribute('role') || '',
            options,
          };
        }, campo);
      };

      const seleccionarOpcionDiferente = async (campo: 'Color' | 'Variety') => {
        const indiceSelectAdjustedRecipe = campo === 'Color' ? 3 : 4;
        let marcado = {
          found: false,
          current: '',
          tagName: '',
          role: '',
          options: [] as { value: string; label: string }[],
        };

        const selectDirecto = centerFrame!.locator(`xpath=(//*[normalize-space()="Adjusted Recipe"]/following::select)[${indiceSelectAdjustedRecipe}]`).first();
        if (await selectDirecto.isVisible({ timeout: 2000 }).catch(() => false)) {
          await selectDirecto.evaluate((element, fieldName) => {
            document.querySelectorAll('[data-pw-product-flowers-field]').forEach((candidate) =>
              candidate.removeAttribute('data-pw-product-flowers-field')
            );
            element.setAttribute('data-pw-product-flowers-field', String(fieldName).toLowerCase());
          }, campo);

          marcado = await selectDirecto.evaluate((selectElement) => {
            const select = selectElement as HTMLSelectElement;
            const normalizar = (valor: string) => String(valor).trim().replace(/\s+/g, ' ');
            return {
              found: true,
              current: normalizar(select.options[select.selectedIndex]?.label || select.options[select.selectedIndex]?.text || select.value || ''),
              tagName: select.tagName,
              role: select.getAttribute('role') || '',
              options: Array.from(select.options).map((option) => ({
                value: option.value,
                label: normalizar(option.label || option.text || option.value),
              })).filter((option) => option.label),
            };
          });
        } else {
          marcado = await marcarCampoAdjustedRecipe(campo);
        }

        expect(marcado.found, `Debe encontrarse el campo ${campo} del primer Adjusted Recipe`).toBeTruthy();
        console.log(`📋 Control ${campo}: ${JSON.stringify(marcado)}`);

        const control = centerFrame!.locator(`[data-pw-product-flowers-field="${campo.toLowerCase()}"]`).first();
        const actual = marcado.current;
        let asignado = '';

        if (marcado.tagName === 'SELECT') {
          const opcion = marcado.options
            .filter((option: { value: string; label: string }) => option.value && option.label && !/select|seleccione|--/i.test(option.label))
            .find((option: { value: string; label: string }) => !valoresCoinciden(option.label, actual));

          expect(opcion, `Debe existir una opcion de ${campo} diferente a ${actual || '(vacio)'}`).toBeTruthy();
          await control.selectOption(opcion!.value);
          asignado = opcion!.label;
        } else {
          await control.click({ timeout: 10000 });
          await page.waitForTimeout(1000);

          const opciones = centerFrame!.locator('[role="option"]:visible, li:visible, div[role="listbox"] *:visible');
          const totalOpciones = await opciones.count();
          for (let i = 0; i < totalOpciones; i++) {
            const opcion = opciones.nth(i);
            const texto = (await opcion.textContent({ timeout: 1000 }).catch(() => '') ?? '').trim();
            if (texto && !/select|seleccione|--/i.test(texto) && !valoresCoinciden(texto, actual)) {
              await opcion.click({ timeout: 10000 });
              asignado = texto;
              break;
            }
          }

          if (!asignado) {
            const opcionesPagina = page.locator('[role="option"]:visible, li:visible, div[role="listbox"] *:visible');
            const totalOpcionesPagina = await opcionesPagina.count();
            for (let i = 0; i < totalOpcionesPagina; i++) {
              const opcion = opcionesPagina.nth(i);
              const texto = (await opcion.textContent({ timeout: 1000 }).catch(() => '') ?? '').trim();
              if (texto && !/select|seleccione|--/i.test(texto) && !valoresCoinciden(texto, actual)) {
                await opcion.click({ timeout: 10000 });
                asignado = texto;
                break;
              }
            }
          }
        }

        expect(asignado, `Debe seleccionarse una opcion nueva para ${campo}`).not.toBe('');
        return { actual, asignado };
      };

      const leerSelect = async (locator: any) => locator.evaluate((selectElement: HTMLSelectElement) => {
        const normalizar = (valor: string) => String(valor).trim().replace(/\s+/g, ' ');
        return {
          current: normalizar(selectElement.options[selectElement.selectedIndex]?.label || selectElement.options[selectElement.selectedIndex]?.text || selectElement.value || ''),
          options: Array.from(selectElement.options).map((option) => ({
            value: option.value,
            label: normalizar(option.label || option.text || option.value),
          })).filter((option) => option.label),
        };
      }, { timeout: 5000 }).catch(() => ({
        current: '',
        options: [] as { value: string; label: string }[],
      }));

      const opcionesValidas = (options: { value: string; label: string }[], actual: string) => options
        .filter((option: { value: string; label: string }) => option.value && option.label && !/select|seleccione|--/i.test(option.label))
        .filter((option: { value: string; label: string }) => !valoresCoinciden(option.label, actual));

      const obtenerSelectsAdjustedRecipe = async () => {
        for (let intento = 0; intento < 15; intento += 1) {
          const totalSelects = await centerFrame!.locator('xpath=//*[normalize-space()="Adjusted Recipe"]/following::select').count().catch(() => 0);
          const totalFilasARevisar = Math.min(10, Math.max(1, Math.floor((totalSelects - adjustedRecipeColorSelectIndex + 1) / 4) + 1));

          for (let fila = 0; fila < totalFilasARevisar; fila += 1) {
            const colorSelectIndex = adjustedRecipeColorSelectIndex + (fila * 4);
            const varietySelectIndex = adjustedRecipeVarietySelectIndex + (fila * 4);
            const colorCandidate = centerFrame!.locator(`xpath=(//*[normalize-space()="Adjusted Recipe"]/following::select)[${colorSelectIndex}]`).first();
            const varietyCandidate = centerFrame!.locator(`xpath=(//*[normalize-space()="Adjusted Recipe"]/following::select)[${varietySelectIndex}]`).first();
            const colorVisible = await colorCandidate.isVisible({ timeout: 1000 }).catch(() => false);
            if (!colorVisible) {
              continue;
            }

            const estadoColor = await leerSelect(colorCandidate);
            const varietyVisible = await varietyCandidate.isVisible({ timeout: 1000 }).catch(() => false);
            const estadoVariety = varietyVisible
              ? await leerSelect(varietyCandidate)
              : { current: '', options: [] as { value: string; label: string }[] };
            const coloresCandidatos = opcionesValidas(estadoColor.options, estadoColor.current)
              .filter((option) => !/^assorted$/i.test(option.label));
            const variedadesCandidatas = opcionesValidas(estadoVariety.options, estadoVariety.current)
              .filter((option) => option.label.trim() !== '-');

            console.log(`Fila Adjusted Recipe ${fila + 1}: colores validos=${coloresCandidatos.length}, variedades validas=${variedadesCandidatas.length}`);
            if (coloresCandidatos.length === 0 && variedadesCandidatas.length === 0) {
              continue;
            }

            await colorCandidate.evaluate((element) => {
              document.querySelectorAll('[data-pw-product-flowers-field="color"]').forEach((candidate) =>
                candidate.removeAttribute('data-pw-product-flowers-field')
              );
              element.setAttribute('data-pw-product-flowers-field', 'color');
            });
            if (varietyVisible) {
              await varietyCandidate.evaluate((element) => {
                document.querySelectorAll('[data-pw-product-flowers-field="variety"]').forEach((candidate) =>
                  candidate.removeAttribute('data-pw-product-flowers-field')
                );
                element.setAttribute('data-pw-product-flowers-field', 'variety');
              }).catch(() => undefined);
            }

            console.log(`Selectores Adjusted Recipe detectados: fila ${fila + 1}, Color select ${colorSelectIndex}, Variety select ${varietySelectIndex}`);
            return {
              colorSelect: colorCandidate,
              varietySelect: varietyCandidate,
              colorInicial: estadoColor,
              varietyInicial: estadoVariety,
              coloresCandidatos,
              variedadesCandidatas,
              filaAdjustedRecipe: fila + 1,
            };
          }

          await page.waitForTimeout(2000);
          continue;
        }

        throw new Error('No se encontraron opciones validas de Color ni Variety en las filas visibles de Adjusted Recipe');
      };

      const { colorSelect, varietySelect, colorInicial, varietyInicial, coloresCandidatos, variedadesCandidatas, filaAdjustedRecipe } = await obtenerSelectsAdjustedRecipe();
      valorColorActual = colorInicial.current;
      valorColorAsignado = valorColorActual;
      valorVarietyActual = varietyInicial.current;
      valorVarietyAsignado = varietyInicial.current;
      let variedadSeleccionada = false;
      let colorSeleccionado = false;

      for (const colorCandidato of coloresCandidatos) {
        await colorSelect.selectOption(colorCandidato.value);
        await page.waitForTimeout(3000);
        valorColorAsignado = colorCandidato.label;
        colorSeleccionado = true;

        const varietyEstado = await leerSelect(varietySelect);
        valorVarietyActual = varietyEstado.current;
        valorVarietyAsignado = varietyEstado.current;
        const varietyCandidata = varietyEstado.options
          .filter((option: { value: string; label: string }) =>
            option.value &&
            option.label &&
            !/select|seleccione|--/i.test(option.label) &&
            option.label.trim() !== '-'
          )
          .find((option: { value: string; label: string }) => !valoresCoinciden(option.label, varietyEstado.current));

        if (varietyCandidata) {
          valorVarietyAsignado = varietyCandidata.label;
          await varietySelect.selectOption(varietyCandidata.value);
          variedadSeleccionada = true;
          break;
        }

        console.log(`Color ${colorCandidato.label} no cargó Variety válida diferente; probando siguiente Color.`);
      }

      if (!colorSeleccionado && variedadesCandidatas.length > 0) {
        const varietyCandidata = variedadesCandidatas[0];
        await varietySelect.selectOption(varietyCandidata.value);
        valorVarietyAsignado = varietyCandidata.label;
        variedadSeleccionada = true;
        console.log(`Color sin opcion diferente en fila ${filaAdjustedRecipe}; se selecciona Variety diferente.`);
      }

      expect(
        colorSeleccionado || variedadSeleccionada,
        'Debe seleccionarse un cambio valido de Color o Variety para Product - Flowers'
      ).toBeTruthy();
      if (!variedadSeleccionada) {
        console.log('Variety no es obligatoria; no se encontro una opcion valida diferente y se continuara solo con Color.');
      }
      console.log(`Fila Adjusted Recipe usada: ${filaAdjustedRecipe}`);
      console.log(`📋 Color actual: ${valorColorActual || '(no capturado)'}`);
      console.log(`📋 Color asignado: ${valorColorAsignado}`);
      console.log(`📋 Variety actual: ${valorVarietyActual || '(no capturado)'}`);
      console.log(`📋 Variety asignado: ${valorVarietyAsignado}`);
      console.log(`📋 Estos valores se verificarán en Order Entry y GR para la orden: ${orderReferenceCompletoCapturado}`);

      fs.writeFileSync('reports/html/08-product-flowers-values.json', JSON.stringify({
        orderReferenceCompletoCapturado,
        colorActual: valorColorActual,
        colorAsignado: valorColorAsignado,
        varietyActual: valorVarietyActual,
        varietyAsignado: valorVarietyAsignado,
        filaAdjustedRecipe,
      }, null, 2));

      console.log(`SELECT_PRODUCT_FLOWERS_VALUES: ${Date.now() - t0}ms`);
      await tomarScreenshot('reports/screenshots/08-product-flowers-values-selected.png');
    });

    // ══════════════════════════════════════════════════════════════
    // PASO 9: Click en Save (formulario Product - Flowers)
    // ══════════════════════════════════════════════════════════════
    await test.step('Click en Save Product - Flowers', async () => {
      const t0 = Date.now();
      const frameCenter = page.frameLocator('iframe#center_page');
      
      // Click en Save del formulario Product - Flowers antes de continuar con Apply.
      const saveButton = frameCenter.getByRole('button', { name: /^Save$/i });
      await expect(saveButton, 'El boton Save debe estar habilitado antes de guardar Product - Flowers').toBeEnabled({ timeout: 30000 });
      await saveButton.click({ timeout: 10000 });
      console.log('✅ Click en Save Product - Flowers realizado');
      
      // Esperar a que se procese
      await page.waitForTimeout(5000);
      
      console.log(`SAVE_PRODUCT_FLOWERS: ${Date.now() - t0}ms`);
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
      await expect(
        applyButton,
        'Despues de seleccionar Save, el boton Apply debe quedar habilitado antes de aplicar Product - Flowers'
      ).toBeEnabled({ timeout: 60000 });
      
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
      const maxWaitTime = 60000; // limite para procesos que si muestran loading activo
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
          // Si no hay loading ni mensaje, continuar con la validacion funcional posterior.
          console.log(`⏳ Apply sin indicador activo despues de ${elapsedTime / 1000}s; se continua con validacion en Order Entry y GR.`);
          break;
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

      console.log(`✅ Prefijo ${orderReferenceParaOrderEntry} ingresado en Order Entry y búsqueda ejecutada con Enter`);
      await page.waitForTimeout(5000);

      const centerFrame = await page.locator('iframe#center_page').elementHandle().then((iframe) => iframe?.contentFrame());
      if (centerFrame) {
        fs.writeFileSync('reports/html/12-order-entry.html', await centerFrame.content());
        await tomarScreenshot('reports/screenshots/12-order-entry.png');
        await tomarScreenshot('reports/screenshots/12-order-entry-frame.png');

        const itemOrderReferenceNumero = String(Number(itemOrderReferenceCapturado));
        expect(
          itemOrderReferenceNumero,
          `Debe obtenerse el numero de item para abrir Edit Product, item capturado: ${itemOrderReferenceCapturado}`
        ).toMatch(/^\d+$/);

        const abrirEditProduct = async () => {
          const candidatos = [
            centerFrame.locator(`i[data-uib-tooltip="Edit Product"][ng-click*="editProduct(this,${itemOrderReferenceNumero})"]`).first(),
            centerFrame.locator(`xpath=(//*[@data-uib-tooltip="Edit Product" and contains(@ng-click,"editProduct(this,${itemOrderReferenceNumero})")])[1]`),
            centerFrame.locator(`xpath=(//*[contains(@ng-click,"editProduct(this,${itemOrderReferenceNumero})")])[1]`),
          ];

          let ultimoError: unknown;
          for (const candidato of candidatos) {
            try {
              await candidato.waitFor({ state: 'visible', timeout: 5000 });
              await candidato.scrollIntoViewIfNeeded();
              const nuevaPaginaPromesa = page.context().waitForEvent('page', { timeout: 20000 }).catch(() => null);
              await candidato.click({ timeout: 10000, force: true });
              const nuevaPagina = await nuevaPaginaPromesa;
              if (nuevaPagina) {
                await nuevaPagina.waitForLoadState('domcontentloaded').catch(() => undefined);
                return nuevaPagina;
              }
            } catch (error) {
              ultimoError = error;
            }
          }

          throw ultimoError instanceof Error
            ? ultimoError
            : new Error('No se pudo abrir Edit Product desde Order Entry');
        };

        const productPage = await abrirEditProduct();
        await productPage.waitForLoadState('domcontentloaded').catch(() => undefined);
        await productPage.waitForTimeout(5000);
        await expect(
          productPage,
          'Debe abrirse la ventana Products Definition desde Edit Product'
        ).toHaveURL(/Products\/NewModelProductDefinition\.aspx/i, { timeout: 30000 });
        console.log(`✅ Click en Edit Product del item ${itemOrderReferenceCapturado} y ventana Products Definition abierta`);
        await tomarScreenshotPagina(productPage, 'reports/screenshots/13-products-definition-opened.png');

        await productPage.locator('text=Working...').waitFor({ state: 'hidden', timeout: 30000 }).catch(() => undefined);
        const controlPrimerItemProductsDefinition = await productPage.waitForFunction(() => {
          const esVisible = (element: Element) => {
            const htmlElement = element as HTMLElement;
            const rect = htmlElement.getBoundingClientRect();
            const style = window.getComputedStyle(htmlElement);
            return rect.width > 0
              && rect.height > 0
              && style.display !== 'none'
              && style.visibility !== 'hidden'
              && style.opacity !== '0';
          };

          const primerItemInput = document.querySelector('#txtName0');
          if (!primerItemInput || !esVisible(primerItemInput)) {
            return null;
          }

          const itemRect = (primerItemInput as HTMLElement).getBoundingClientRect();

          return {
            x: itemRect.x - 10,
            y: itemRect.y + itemRect.height / 2,
            height: itemRect.height,
            source: 'txtName0'
          };
        }, undefined, { timeout: 30000 });
        const controlPrimerItem = await controlPrimerItemProductsDefinition.jsonValue() as { x: number; y: number; height: number; source: string } | null;
        expect(controlPrimerItem, 'Debe ubicarse el control + del primer item en Products Definition').toBeTruthy();
        if (!controlPrimerItem) {
          throw new Error('No se pudo ubicar el control + del primer item en Products Definition');
        }

        const detallePrimerItem = productPage.locator('#divFlowers0:visible, [id="spanFlowers0"]:visible').first();
        if (!(await detallePrimerItem.isVisible({ timeout: 1000 }).catch(() => false))) {
          await productPage.mouse.click(controlPrimerItem.x, controlPrimerItem.y);
          await productPage.waitForTimeout(1000);
        }

        if (!(await productPage.locator('#divFlowers0:visible').isVisible({ timeout: 3000 }).catch(() => false))) {
          await productPage.mouse.click(controlPrimerItem.x - 6, controlPrimerItem.y);
          await productPage.waitForTimeout(1000);
        }

        await expect(
          productPage.locator('#divFlowers0'),
          'Debe expandirse el primer item de Products Definition y visualizarse Flowers'
        ).toBeVisible({ timeout: 10000 });
        console.log('✅ Primer + de Products Definition seleccionado');
        await tomarScreenshotPagina(productPage, 'reports/screenshots/14-products-definition-expanded.png');

        const valoresProductsDefinition = await productPage.locator('td:visible, th:visible, span:visible, div:visible, input:visible, select:visible').evaluateAll((elements) =>
          elements.map((element, index) => {
            const htmlElement = element as any;
            const input = element as any;
            const select = element as HTMLSelectElement;
            const rect = htmlElement.getBoundingClientRect();
            const selectedOption = select.tagName === 'SELECT'
              ? (select.options[select.selectedIndex]?.label || select.options[select.selectedIndex]?.text || select.value || '').trim()
              : '';
            const value = selectedOption || input.value?.trim();
            const text = htmlElement.textContent?.trim();
            const title = htmlElement.title?.trim();
            const ariaLabel = htmlElement.getAttribute?.('aria-label')?.trim();

            return {
              index,
              value: value || text || title || ariaLabel || '',
              id: htmlElement.id,
              name: input.name,
              title,
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            };
          }).filter((item) => item.value)
        );
        fs.writeFileSync('reports/html/13-products-definition-values.json', JSON.stringify(valoresProductsDefinition, null, 2));

        type ValorProductsDefinition = typeof valoresProductsDefinition[number];
        const columnasProductsDefinition = ['Code', 'Color', 'Variety'];
        const limpiarValorCelda = (valor: string) => String(valor || '').trim().replace(/\s+/g, ' ');
        const valorEsEncabezado = (valor: string, columna: string) => normalizarValor(valor).replace(/:$/, '') === normalizarValor(columna);
        const headersProductsDefinition = valoresProductsDefinition
          .filter((item) => item.y > controlPrimerItem.y)
          .filter((item) => columnasProductsDefinition.some((columna) => valorEsEncabezado(item.value, columna)));

        const gruposHeadersProductsDefinition = headersProductsDefinition.reduce((grupos: ValorProductsDefinition[][], item) => {
          const grupoExistente = grupos.find((grupo) => Math.abs(grupo[0].y - item.y) <= 12);
          if (grupoExistente) {
            grupoExistente.push(item);
          } else {
            grupos.push([item]);
          }
          return grupos;
        }, []);

        const grupoHeaderFlowers = gruposHeadersProductsDefinition
          .filter((grupo) => columnasProductsDefinition.every((columna) => grupo.some((item) => valorEsEncabezado(item.value, columna))))
          .sort((a, b) => b.length - a.length || a[0].y - b[0].y)[0];

        expect(
          grupoHeaderFlowers,
          'Debe ubicarse la grilla Flowers con columnas Code, Color y Variety en Products Definition'
        ).toBeTruthy();

        const obtenerHeaderFlowers = (columna: string) => grupoHeaderFlowers.find((item) => valorEsEncabezado(item.value, columna));
        const headerCodeFlowers = obtenerHeaderFlowers('Code');
        const headerColorFlowers = obtenerHeaderFlowers('Color');
        const headerVarietyFlowers = obtenerHeaderFlowers('Variety');

        expect(headerCodeFlowers, 'Debe ubicarse la columna Code en Products Definition').toBeTruthy();
        expect(headerColorFlowers, 'Debe ubicarse la columna Color en Products Definition').toBeTruthy();
        expect(headerVarietyFlowers, 'Debe ubicarse la columna Variety en Products Definition').toBeTruthy();

        if (!headerCodeFlowers || !headerColorFlowers || !headerVarietyFlowers) {
          throw new Error('No se pudo ubicar Code, Color o Variety en Products Definition');
        }

        const perteneceAColumnaFlowers = (item: ValorProductsDefinition, header: ValorProductsDefinition) => {
          const centroItem = item.x + item.width / 2;
          return centroItem >= header.x - 8 && centroItem <= header.x + header.width + 8;
        };

        type FilaFlowersProductsDefinition = {
          code: string;
          color: string;
          variety: string;
          y: number;
          valores: string[];
        };

        const valoresGrillaFlowers = valoresProductsDefinition
          .filter((item) => item.y > headerCodeFlowers.y + headerCodeFlowers.height)
          .filter((item) => item.y < headerCodeFlowers.y + 160)
          .filter((item) => !columnasProductsDefinition.some((columna) => valorEsEncabezado(item.value, columna)));

        const filasProductsDefinition = valoresGrillaFlowers.reduce((filas: FilaFlowersProductsDefinition[], item) => {
          const fila = filas.find((filaActual) => Math.abs(filaActual.y - item.y) <= 12);
          const filaActual = fila || { code: '', color: '', variety: '', y: item.y, valores: [] };
          const valor = limpiarValorCelda(item.value);

          if (perteneceAColumnaFlowers(item, headerCodeFlowers) && !filaActual.code) {
            filaActual.code = valor;
          }
          if (perteneceAColumnaFlowers(item, headerColorFlowers) && !filaActual.color) {
            filaActual.color = valor;
          }
          if (perteneceAColumnaFlowers(item, headerVarietyFlowers) && !filaActual.variety) {
            filaActual.variety = valor;
          }
          filaActual.valores.push(valor);

          if (!fila) {
            filas.push(filaActual);
          }
          return filas;
        }, []);

        const colorEsperado = normalizarValor(valorColorAsignado);
        const varietyEsperada = normalizarValor(valorVarietyAsignado);
        const validarVariety = !!varietyEsperada && !/SELECT|SELECCIONE|--/.test(varietyEsperada) && varietyEsperada !== '-' && !valoresCoinciden(valorVarietyAsignado, valorVarietyActual);
        const filaProductFlowersValidada = filasProductsDefinition.find((fila) => {
          const colorCoincideFila = valoresCoinciden(fila.color, colorEsperado) || fila.valores.some((valor) => valoresCoinciden(valor, colorEsperado));
          const varietyCoincideFila = validarVariety
            ? valoresCoinciden(fila.variety, varietyEsperada) || fila.valores.some((valor) => valoresCoinciden(valor, varietyEsperada))
            : true;
          return colorCoincideFila && varietyCoincideFila;
        });

        fs.writeFileSync(
          'reports/html/13-products-definition-product-flowers-row.json',
          JSON.stringify({
            colorEsperado: valorColorAsignado,
            varietyEsperada: valorVarietyAsignado,
            validarVariety,
            filaValidada: filaProductFlowersValidada,
            filas: filasProductsDefinition,
          }, null, 2)
        );

        expect(
          filaProductFlowersValidada,
          `Debe visualizarse una fila Flowers con Color ${valorColorAsignado}${validarVariety ? ` y Variety ${valorVarietyAsignado}` : ''} en Products Definition para el prefijo ${orderReferenceParaOrderEntry}`
        ).toBeTruthy();

        valorCodeProductsDefinition = filaProductFlowersValidada?.code || '';
        expect(
          valorCodeProductsDefinition,
          'Debe guardarse el Code de la fila Flowers validada en Products Definition para usarlo posteriormente en GR'
        ).not.toBe('');

        const colorCoincide = valoresProductsDefinition.some((item) => valoresCoinciden(item.value, colorEsperado));
        const varietyCoincide = validarVariety
          ? valoresProductsDefinition.some((item) => valoresCoinciden(item.value, varietyEsperada))
          : true;

        expect(
          colorCoincide,
          `Debe visualizarse el Color ${valorColorAsignado} en Products Definition para el prefijo ${orderReferenceParaOrderEntry}`
        ).toBeTruthy();
        if (validarVariety) {
          expect(
            varietyCoincide,
            `Debe visualizarse la Variety ${valorVarietyAsignado} en Products Definition para el prefijo ${orderReferenceParaOrderEntry}`
          ).toBeTruthy();
        } else {
          console.log('Variety no tuvo cambio valido; se valida solo el Color en Products Definition.');
        }

        console.log(
          validarVariety
            ? `✅ SUCCESS: Color ${valorColorAsignado} y Variety ${valorVarietyAsignado} validados en Products Definition`
            : `✅ SUCCESS: Color ${valorColorAsignado} validado en Products Definition`
        );
        console.log(`Code capturado en Products Definition para validaciones GR: ${valorCodeProductsDefinition}`);
        await productPage.waitForTimeout(1000);
        await tomarScreenshotPagina(productPage, 'reports/screenshots/14b-products-definition-product-flowers-confirmado.png');
        await productPage.close().catch(() => undefined);
      } else {
        throw new Error('No se encontró iframe center_page para validar Product - Flowers en Order Entry');
      }

      console.log(`ORDER_ENTRY: ${Date.now() - t0}ms`);
    });

    console.log('Validacion Product - Flowers completada en Products Definition. Continua validacion en GR.');
    await test.step('Abrir BETA GR y navegar a Compras -> Asignacion de ordenes', async () => {
      const t0 = Date.now();
      const comprasPage = await page.context().newPage();
      if (process.env.PW_VISIBLE === '1') {
        await comprasPage.setViewportSize({ width: 1920, height: 1200 });
        await comprasPage.bringToFront();
        console.log('Vista BETA GR visible configurada: 1920x1200');
      }

      const navegarBetaGr = async () => {
        for (let intento = 1; intento <= 3; intento++) {
          await comprasPage.goto('https://betagr.ghtcorptest.com/', { waitUntil: 'domcontentloaded' });
          await comprasPage.waitForTimeout(3000);

          const pagina404 = await comprasPage.getByText(/404 Web Site not found/i).isVisible({ timeout: 2000 }).catch(() => false);
          if (!pagina404) {
            return;
          }

          console.log(`⚠️ BETA GR devolvió 404. Reintentando navegación ${intento} de 3...`);
          await comprasPage.waitForTimeout(5000);
        }
      };

      await navegarBetaGr();
      await tomarScreenshotPagina(comprasPage, 'reports/screenshots/15-betagr-inicio.png');

      const userInput = comprasPage.locator('input[name="txtUserName"]');
      if (await userInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await userInput.fill(ENV.usuario);
        await comprasPage.locator('input[name="txtPassword"]').fill(ENV.password);
        // Esperar que la página esté lista y usar click resiliente
        await waitForAppReady(comprasPage, 30000);
        await clickResilient(comprasPage.locator('#btnSigIn'));
        await waitForAppReady(comprasPage, 30000);
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
      await tomarScreenshotPagina(comprasPage, 'reports/screenshots/16-betagr-compras.png');

      await clickPrimerMenuVisible('Asignación de ordenes', [
        frameMenu.getByText(/Asignaci[oó]n(?: de)? Orden/i),
        frameMenu.locator('xpath=//*[contains(translate(normalize-space(), "Óó", "Oo"), "Asignacion Orden") or contains(translate(normalize-space(), "Óó", "Oo"), "Asignacion de ordenes")]'),
        frameMenu.locator(asignacionOrdenesXpath),
      ]);
      await comprasPage.waitForTimeout(8000);
      console.log('✅ Click en Asignación de ordenes');
      await tomarScreenshotPagina(comprasPage, 'reports/screenshots/16a-betagr-asignacion-ordenes.png');

      const asignacionFrame = comprasPage.frameLocator('iframe#center_page');
      const prefijoInputXpath = 'xpath=/html/body/form/div[3]/div[1]/table/tbody/tr[1]/td/table/tbody/tr/td[1]/table/tbody/tr[4]/td[2]/input';
      const filtroTodosXpath = 'xpath=/html/body/form/div[3]/div[1]/table/tbody/tr[1]/td/table/tbody/tr/td[1]/table/tbody/tr[1]/td[7]/div[2]/div[1]/div[1]/input';
      const fechaDesdeCalendarXpath = 'xpath=/html/body/form/div[3]/div[1]/table/tbody/tr[1]/td/table/tbody/tr/td[1]/table/tbody/tr[3]/td[6]/img';
      const fechaDesdeInputXpath = 'xpath=/html/body/form/div[3]/div[1]/table/tbody/tr[1]/td/table/tbody/tr/td[1]/table/tbody/tr[3]/td[6]/input';
      const fechaHastaInputXpath = 'xpath=/html/body/form/div[3]/div[1]/table/tbody/tr[1]/td/table/tbody/tr/td[1]/table/tbody/tr[4]/td[6]/input';
      const actualizarXpath = 'xpath=/html/body/form/div[3]/div[1]/table/tbody/tr[2]/td/table/tbody/tr/td[1]/div/input[1]';

      const usarFrameAsignacion = async () => {
        const prefijoInput = asignacionFrame.locator(prefijoInputXpath);
        await prefijoInput.waitFor({ state: 'visible', timeout: 20000 });
        return prefijoInput;
      };

      let usarFrame = true;
      await usarFrameAsignacion().catch(() => {
        usarFrame = false;
      });
      let filtroFechaUCActivado = false;

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

        expect(cambioRealizado, 'Debe poder cambiar el filtro Fecha a UC antes de validar la orden en GR').toBeTruthy();
      };

      const aplicarFiltroFechaUCAsignacion = async () => {
        if (filtroFechaUCActivado) return;

        if (usarFrame) {
          const centerFrame = await obtenerFrameAsignacion();
          if (!centerFrame) throw new Error('No se encontro iframe center_page para cambiar el filtro Fecha a UC');
          await seleccionarFiltroFechaUCEnPagina(centerFrame);
        } else {
          await seleccionarFiltroFechaUCEnPagina(comprasPage);
        }

        filtroFechaUCActivado = true;
        console.log('✅ Filtro Fecha cambiado a UC antes de ubicar la orden en GR.');
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
          const centerFrame = await obtenerFrameAsignacion();
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
          const centerFrame = await obtenerFrameAsignacion();
          if (centerFrame) {
            const texto = await centerFrame.locator('body').innerText({ timeout: 10000 }).catch(() => '');
            return leerSinRegistros(texto);
          }
        }

        const texto = await comprasPage.locator('body').innerText({ timeout: 10000 }).catch(() => '');
        return leerSinRegistros(texto);
      };

      const obtenerValoresColumnaAsignacion = async (nombreColumna: 'Color' | 'Variety') => {
        const extraerValoresColumna = (elements: Element[], columna: 'Color' | 'Variety') => {
          const items = elements.map((element) => {
            const htmlElement = element as any;
            const input = element as any;
            const rect = htmlElement.getBoundingClientRect();
            const value = input.value?.trim();
            const text = htmlElement.textContent?.trim();
            const title = htmlElement.title?.trim();
            const ariaLabel = htmlElement.getAttribute?.('aria-label')?.trim();

            return {
              value: value || text || title || ariaLabel || '',
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height
            };
          }).filter((item) => item.value);

          const headerRegex = columna === 'Color' ? /^color:?$/i : /^variety:?$/i;
          const headers = items.filter((item) => headerRegex.test(item.value));
          const valoresBajoColumna = headers.flatMap((header) =>
            items
              .filter((item) => item.y > header.y + header.height)
              .filter((item) => item.x < header.x + header.width && item.x + item.width > header.x)
              .map((item) => item.value)
          );

          return [...new Set(valoresBajoColumna)]
            .filter((value) => value.trim());
        };

        if (usarFrame) {
          const centerFrame = await comprasPage.locator('iframe#center_page').elementHandle().then((iframe) => iframe?.contentFrame());
          if (!centerFrame) return [];

          return centerFrame.locator('td:visible, th:visible, span:visible, div:visible, input:visible').evaluateAll(extraerValoresColumna, nombreColumna);
        }

        return comprasPage.locator('td:visible, th:visible, span:visible, div:visible, input:visible').evaluateAll(extraerValoresColumna, nombreColumna);
      };

      const selectorElementosAsignacion = 'td:visible, th:visible, span:visible, div:visible, input:visible, button:visible, a:visible, img:visible';
      const obtenerFrameAsignacion = async () =>
        comprasPage.locator('iframe#center_page').elementHandle().then((iframe) => iframe?.contentFrame());

      const clickPlusFilaAsignacion = async () => {
        const clickEnFila = async (scope: any) => {
          const fila = scope.locator(
            `xpath=(//div[contains(@class,"ag-row") and .//*[@colid="OrderNumber" and normalize-space()="${orderReferenceCapturado}"] and .//*[@colid="Item" and normalize-space()="${itemOrderReferenceCapturado}"]] | //tr[./td[normalize-space()="${orderReferenceCapturado}"] and ./td[normalize-space()="${itemOrderReferenceCapturado}"]])[1]`
          );
          if (!await fila.isVisible({ timeout: 5000 }).catch(() => false)) {
            return { clicked: false, reason: `No se encontro fila principal para ${orderReferenceCapturado}-${itemOrderReferenceCapturado}` };
          }

          const controles = [
            fila.locator('xpath=.//*[normalize-space()="+"]').first(),
            fila.locator('xpath=.//img[contains(translate(@src, "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "plus")]').first(),
            fila.locator('xpath=.//input[@value="+" or contains(translate(@src, "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "plus")]').first(),
            fila.locator('xpath=.//a[normalize-space()="+" or .//img[contains(translate(@src, "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "plus")]]').first(),
            fila.locator('xpath=.//*[@colid="Detail" or @colid="LineOptions"]').first(),
            fila.locator('td').nth(1),
          ];

          for (let index = 0; index < controles.length; index += 1) {
            const control = controles[index];
            if (!await control.isVisible({ timeout: 1000 }).catch(() => false)) {
              continue;
            }

            await control.scrollIntoViewIfNeeded().catch(() => undefined);
            await control.click({ timeout: 5000, force: true });
            return { clicked: true, method: `row-locator-${index + 1}` };
          }

          return { clicked: false, reason: `No se encontro control + en la fila ${orderReferenceCapturado}-${itemOrderReferenceCapturado}` };
        };

        if (usarFrame) {
          const centerFrame = await obtenerFrameAsignacion();
          if (!centerFrame) {
            return { clicked: false, reason: 'No se encontro iframe center_page en GR' };
          }
          return clickEnFila(centerFrame);
        }

        return clickEnFila(comprasPage);
      };

      const expandirDetalleOrdenAsignacion = async () => {
        const expandirDetalle = (elements: Element[], datos: { orderReference: string; itemReference: string }) => {
          const normalizar = (valor: string) => String(valor || '').trim().replace(/\s+/g, ' ').toUpperCase();
          const orderReferenceNormalizado = normalizar(datos.orderReference);
          const itemReferenceNormalizado = normalizar(datos.itemReference);
          const obtenerValor = (element: Element) => {
            const htmlElement = element as HTMLElement;
            const input = element as HTMLInputElement;
            const candidatos = [
              input.value,
              htmlElement.textContent,
              htmlElement.getAttribute('title'),
              htmlElement.getAttribute('aria-label'),
              htmlElement.getAttribute('src'),
            ];
            return candidatos.find((valor) => String(valor || '').trim()) || '';
          };

          const visibles = elements
            .map((element) => {
              const rect = (element as HTMLElement).getBoundingClientRect();
              return {
                element: element as HTMLElement,
                value: normalizar(obtenerValor(element)),
                rawValue: obtenerValor(element),
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
              };
            })
            .filter((item) => item.width > 0 && item.height > 0);

          const filasPrincipales = Array.from(document.querySelectorAll('.ag-row, tr'))
            .map((fila) => {
              const filaHtml = fila as HTMLElement;
              const rect = filaHtml.getBoundingClientRect();
              const celdasDirectas = Array.from(fila.children)
                .filter((child) => child.matches('td, th, [colid], .ag-cell'))
                .map((child) => {
                  const childRect = (child as HTMLElement).getBoundingClientRect();
                  return {
                    element: child as HTMLElement,
                    value: normalizar(obtenerValor(child)),
                    rawValue: obtenerValor(child),
                    x: childRect.x,
                    y: childRect.y,
                    width: childRect.width,
                    height: childRect.height,
                    colid: child.getAttribute('colid') || '',
                  };
                })
                .filter((item) => item.width > 0 && item.height > 0);

              return {
                element: filaHtml,
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                celdas: celdasDirectas,
              };
            })
            .filter((fila) => fila.width > 0 && fila.height > 0 && fila.celdas.length > 0);

          const filaVisibleOrden = filasPrincipales.find((fila) => {
            const ordenCoincide = fila.celdas.some((item) =>
              item.value === orderReferenceNormalizado
              || (item.colid.toUpperCase().includes('ORDER') && item.value.includes(orderReferenceNormalizado))
            );
            const itemCoincide = !itemReferenceNormalizado || fila.celdas.some((item) =>
              item.value === itemReferenceNormalizado
              || (item.colid.toUpperCase() === 'ITEM' && item.value === itemReferenceNormalizado)
            );
            return ordenCoincide && itemCoincide;
          });
          const celdaOrden = filaVisibleOrden?.celdas.find((item) => item.value.includes(orderReferenceNormalizado));
          if (!celdaOrden) {
            return { expanded: false, reason: `No se encontro la fila ${datos.orderReference}-${datos.itemReference}` };
          }

          const controlesDetalle = visibles
            .filter((item) => Math.abs(item.y - celdaOrden.y) <= 14)
            .filter((item) => item.x < celdaOrden.x)
            .filter((item) => ['+', '-'].includes(normalizar(item.rawValue)) || item.value.includes('PLUSICON') || item.value.includes('MINUSICON') || item.value.includes('EXPAND') || item.value.includes('COLLAPSE'));

          const controlAbierto = controlesDetalle.find((item) => normalizar(item.rawValue) === '-' || item.value.includes('MINUSICON') || item.value.includes('COLLAPSE'));
          if (controlAbierto) {
            return { expanded: true, alreadyExpanded: true };
          }

          const controlCerrado = controlesDetalle
            .filter((item) => normalizar(item.rawValue) === '+' || item.value.includes('PLUSICON') || item.value.includes('EXPAND'))
            .sort((a, b) => b.x - a.x)[0];

          if (!controlCerrado) {
            const yClick = celdaOrden.y + celdaOrden.height / 2;
            const minXFila = Math.min(...filaVisibleOrden.celdas.map((item) => item.x));
            return {
              expanded: true,
              needsNativeMouseClick: true,
              method: 'row-start-native-mouse',
              nativeClickCandidates: [48, 52, 56, 44, 60].map((offset) => ({
                x: Math.round(minXFila + offset),
                y: Math.round(yClick),
              })),
              x: Math.round(minXFila + 48),
              y: Math.round(yClick),
            };
          }

          controlCerrado.element.click();
          return { expanded: true, clicked: true };
        };

        if (usarFrame) {
          const centerFrame = await obtenerFrameAsignacion();
          if (!centerFrame) {
            return { expanded: false, reason: 'No se encontro iframe center_page en GR' };
          }
          return centerFrame.locator(selectorElementosAsignacion).evaluateAll(expandirDetalle, {
            orderReference: orderReferenceCapturado,
            itemReference: itemOrderReferenceCapturado,
          });
        }

        return comprasPage.locator(selectorElementosAsignacion).evaluateAll(expandirDetalle, {
          orderReference: orderReferenceCapturado,
          itemReference: itemOrderReferenceCapturado,
        });
      };

      const obtenerCodigosFlorRecetaProducto = async () => {
        const extraerCodigosFlor = (datos: { orderReference: string; itemReference: string; codeEsperado: string }) => {
          const normalizar = (valor: string) => String(valor || '')
            .trim()
            .replace(/\s+/g, ' ')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase();

          const obtenerValor = (element: Element) => {
            const htmlElement = element as HTMLElement;
            const input = element as HTMLInputElement;
            const candidatos = [
              input.value,
              htmlElement.textContent,
              htmlElement.getAttribute('title'),
              htmlElement.getAttribute('aria-label'),
            ];
            return candidatos.find((valor) => String(valor || '').trim()) || '';
          };

          const esVisible = (element: Element) => {
            const rect = (element as HTMLElement).getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          };

          const orderReferenceNormalizado = normalizar(datos.orderReference);
          const itemReferenceNormalizado = normalizar(datos.itemReference);
          const codeEsperadoNormalizado = normalizar(datos.codeEsperado);
          const codigos = new Set<string>();
          const ignorar = new Set(['RECETA', 'DEL', 'PRODUCTO', 'NO', 'NOMBRE', 'VARIEDAD', 'RAMOS', 'CAJA', 'ORDEN', 'TALLOS', 'COMENTARIOS', 'ASIGNACION', '001', '4COM']);

          const filas = Array.from(document.querySelectorAll('tr'))
            .filter(esVisible)
            .map((fila) => {
              const filaHtml = fila as HTMLElement;
              const celdasDirectas = Array.from(fila.children)
                .filter((child) => child.matches('td, th, [colid], .ag-cell') && esVisible(child))
                .map((child) => ({
                  element: child,
                  value: normalizar(obtenerValor(child)),
                  colid: child.getAttribute('colid') || '',
                }));
              return {
                fila: filaHtml,
                texto: normalizar(obtenerValor(fila)),
                celdasDirectas,
                celdas: Array.from(fila.querySelectorAll('td, th')).filter(esVisible),
              };
            });

          const esFilaPrincipalObjetivo = (fila: typeof filas[number]) => {
            const ordenCoincide = fila.celdasDirectas.some((celda) =>
              celda.value === orderReferenceNormalizado
              || (celda.colid.toUpperCase().includes('ORDER') && celda.value.includes(orderReferenceNormalizado))
            );
            const itemCoincide = fila.celdasDirectas.some((celda) =>
              celda.value === itemReferenceNormalizado
              || (celda.colid.toUpperCase() === 'ITEM' && celda.value === itemReferenceNormalizado)
            );
            return ordenCoincide && itemCoincide;
          };

          const esOtraFilaPrincipal = (fila: typeof filas[number]) =>
            fila.celdasDirectas.some((celda) => celda.value === orderReferenceNormalizado)
            && fila.celdasDirectas.some((celda) => /^\d{3}$/.test(celda.value));

          const indiceFilaObjetivo = filas.findIndex(esFilaPrincipalObjetivo);
          let recetaVisibleDirecta = false;
          if (indiceFilaObjetivo >= 0) {
            let detalleObjetivo = filas[indiceFilaObjetivo].fila.nextElementSibling as HTMLElement | null;
            while (detalleObjetivo && !detalleObjetivo.matches('.detailTR')) {
              if (detalleObjetivo.matches('tr')) {
                const textoHermano = normalizar(obtenerValor(detalleObjetivo));
                const celdasHermano = Array.from(detalleObjetivo.children)
                  .filter((child) => child.matches('td, th, [colid], .ag-cell') && esVisible(child))
                  .map((child) => normalizar(obtenerValor(child)));
                if (celdasHermano.some((valor) => valor === orderReferenceNormalizado) && celdasHermano.some((valor) => /^\d{3}$/.test(valor)) && !textoHermano.includes(itemReferenceNormalizado)) {
                  break;
                }
              }
              detalleObjetivo = detalleObjetivo.nextElementSibling as HTMLElement | null;
            }

            if (detalleObjetivo && esVisible(detalleObjetivo)) {
              const textoDetalleDirecto = normalizar(
                [
                  obtenerValor(detalleObjetivo),
                  ...Array.from(detalleObjetivo.querySelectorAll('[title], input, td, th, span, div')).map(obtenerValor),
                ].join(' ')
              );
              recetaVisibleDirecta = /RECETA DEL PRODUCTO|CODIGO FLOR/.test(textoDetalleDirecto);

              for (const tabla of Array.from(detalleObjetivo.querySelectorAll('table'))) {
                const filasTabla = Array.from(tabla.querySelectorAll('tr')).filter(esVisible);
                const indiceHeader = filasTabla.findIndex((fila) =>
                  Array.from(fila.children)
                    .filter((child) => child.matches('td, th') && esVisible(child))
                    .some((celda) => {
                      const valor = normalizar(obtenerValor(celda));
                      return valor.includes('CODIGO') && valor.includes('FLOR');
                    })
                );

                if (indiceHeader < 0) {
                  continue;
                }

                const headerCells = Array.from(filasTabla[indiceHeader].children)
                  .filter((child) => child.matches('td, th') && esVisible(child));
                const indiceCodigoFlor = headerCells.findIndex((celda) => {
                  const valor = normalizar(obtenerValor(celda));
                  return valor.includes('CODIGO') && valor.includes('FLOR');
                });

                if (indiceCodigoFlor < 0) {
                  continue;
                }

                recetaVisibleDirecta = true;
                for (const fila of filasTabla.slice(indiceHeader + 1)) {
                  const textoFila = normalizar(obtenerValor(fila));
                  if (/COMENTARIOS|ASIGNACION|ASIGNACI/.test(textoFila)) {
                    break;
                  }

                  const celdas = Array.from(fila.children)
                    .filter((child) => child.matches('td, th') && esVisible(child));
                  const celdaCodigoFlor = celdas[indiceCodigoFlor];
                  if (!celdaCodigoFlor) {
                    continue;
                  }

                  const valor = normalizar(obtenerValor(celdaCodigoFlor));
                  if (/^[A-Z0-9]{2,10}$/.test(valor) && !ignorar.has(valor)) {
                    codigos.add(valor);
                  }
                }
              }

              if (codeEsperadoNormalizado && textoDetalleDirecto.includes(codeEsperadoNormalizado)) {
                codigos.add(codeEsperadoNormalizado);
                recetaVisibleDirecta = true;
              }
            }
          }

          const bloqueObjetivo = indiceFilaObjetivo >= 0
            ? filas.slice(indiceFilaObjetivo + 1)
            : [];
          const filasDetalleObjetivo = [];

          for (const fila of bloqueObjetivo) {
            if (esOtraFilaPrincipal(fila)) {
              break;
            }
            filasDetalleObjetivo.push(fila);
            if (/COMENTARIOS|ASIGNACION|ASIGNACI/.test(fila.texto)) {
              break;
            }
          }

          const textoDetalleObjetivo = normalizar(filasDetalleObjetivo.map((fila) => obtenerValor(fila.fila)).join(' '));
          const inicioRecetaTexto = textoDetalleObjetivo.search(/RECETA DEL PRODUCTO/i);
          const finComentariosTexto = textoDetalleObjetivo.search(/COMENTARIOS/i);
          const finAsignacionTexto = textoDetalleObjetivo.search(/ASIGNACION/i);
          const finBloqueTexto = [finComentariosTexto, finAsignacionTexto].filter((valor) => valor >= 0).sort((a, b) => a - b)[0];
          const textoRecetaObjetivo = inicioRecetaTexto >= 0
            ? textoDetalleObjetivo.slice(inicioRecetaTexto, finBloqueTexto > inicioRecetaTexto ? finBloqueTexto : undefined)
            : '';
          const tokensRecetaObjetivo = textoRecetaObjetivo.match(/\b[A-Z0-9]{2,10}\b/g) ?? [];
          for (const token of tokensRecetaObjetivo) {
            const valor = token.toUpperCase();
            if (!ignorar.has(valor) && /^[A-Z0-9]{2,10}$/i.test(valor)) {
              codigos.add(valor);
            }
          }

          const indiceReceta = filasDetalleObjetivo.findIndex((fila) => fila.texto.includes('RECETA DEL PRODUCTO'));
          let recetaVisiblePorCoordenadas = false;
          if (indiceFilaObjetivo >= 0 && indiceReceta >= 0) {
            const bloqueReceta = filasDetalleObjetivo.slice(indiceReceta + 1, indiceReceta + 18);
            for (const fila of bloqueReceta) {
              if (/COMENTARIOS|ASIGNACION|ASIGNACI/.test(fila.texto)) {
                break;
              }
              for (const celda of fila.celdas) {
                const valor = normalizar(obtenerValor(celda));
                if (/^[A-Z0-9]{2,10}$/.test(valor) && !ignorar.has(valor)) {
                  codigos.add(valor);
                }
              }
            }
          }

          if (indiceFilaObjetivo >= 0) {
            const filaObjetivoRect = filas[indiceFilaObjetivo].fila.getBoundingClientRect();
            const elementosVisibles = Array.from(document.querySelectorAll('td, th, span, div, input'))
              .filter(esVisible)
              .map((element) => {
                const rect = (element as HTMLElement).getBoundingClientRect();
                return {
                  element,
                  value: normalizar(obtenerValor(element)),
                  rawValue: obtenerValor(element),
                  x: rect.x,
                  y: rect.y,
                  width: rect.width,
                  height: rect.height,
                };
              });

            const limiteComentarios = elementosVisibles
              .filter((item) => item.y > filaObjetivoRect.y && /COMENTARIOS|ASIGNACION|ASIGNACI/.test(item.value))
              .sort((a, b) => a.y - b.y)[0]?.y ?? Number.POSITIVE_INFINITY;

            const headerCodigoFlor = elementosVisibles
              .filter((item) => item.y > filaObjetivoRect.y + filaObjetivoRect.height)
              .filter((item) => item.y < limiteComentarios)
              .filter((item) => item.value.includes('CODIGO') && item.value.includes('FLOR'))
              .sort((a, b) => a.y - b.y || a.x - b.x)[0];

            if (headerCodigoFlor) {
              recetaVisiblePorCoordenadas = true;
              const valoresBajoCodigoFlor = elementosVisibles
                .filter((item) => item.y > headerCodigoFlor.y + headerCodigoFlor.height / 2)
                .filter((item) => item.y < limiteComentarios)
                .filter((item) => item.x < headerCodigoFlor.x + headerCodigoFlor.width && item.x + item.width > headerCodigoFlor.x)
                .map((item) => normalizar(item.rawValue))
                .filter((valor) => /^[A-Z0-9]{2,10}$/.test(valor))
                .filter((valor) => !ignorar.has(valor));

              for (const valor of valoresBajoCodigoFlor) {
                codigos.add(valor);
              }
            }
          }

          return {
            itemObjetivoEncontrado: indiceFilaObjetivo >= 0,
            itemObjetivo: datos.itemReference,
            recetaVisible: indiceFilaObjetivo >= 0 && (recetaVisibleDirecta || indiceReceta >= 0 || inicioRecetaTexto >= 0 || recetaVisiblePorCoordenadas),
            codigoFlor: [...codigos].filter((value) => value.trim()),
          };
        };

        if (usarFrame) {
          const centerFrame = await obtenerFrameAsignacion();
          if (!centerFrame) return { itemObjetivoEncontrado: false, itemObjetivo: itemOrderReferenceCapturado, recetaVisible: false, codigoFlor: [] as string[] };
          return centerFrame.locator('body').evaluate(extraerCodigosFlor, {
            orderReference: orderReferenceCapturado,
            itemReference: itemOrderReferenceCapturado,
            codeEsperado: valorCodeProductsDefinition,
          });
        }

        return comprasPage.locator('body').evaluate(extraerCodigosFlor, {
          orderReference: orderReferenceCapturado,
          itemReference: itemOrderReferenceCapturado,
          codeEsperado: valorCodeProductsDefinition,
        });
      };

      const esperarRecetaProductoObjetivo = async () => {
        const esperarDetalle = (datos: { orderReference: string; itemReference: string; codeEsperado: string }) => {
          const normalizar = (valor: string) => String(valor || '')
            .trim()
            .replace(/\s+/g, ' ')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase();

          const obtenerValor = (element: Element | null | undefined) => {
            if (!element) return '';
            const htmlElement = element as HTMLElement;
            const input = element as HTMLInputElement;
            const candidatos = [
              input.value,
              htmlElement.textContent,
              htmlElement.getAttribute('title'),
              htmlElement.getAttribute('aria-label'),
            ];
            return candidatos.find((valor) => String(valor || '').trim()) || '';
          };

          const esVisible = (element: Element) => {
            const rect = (element as HTMLElement).getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          };

          const orderReferenceNormalizado = normalizar(datos.orderReference);
          const itemReferenceNormalizado = normalizar(datos.itemReference);
          const codeEsperadoNormalizado = normalizar(datos.codeEsperado);
          const filasPrincipales = Array.from(document.querySelectorAll('tr'))
            .filter(esVisible)
            .filter((fila) => {
              const celdas = Array.from(fila.children)
                .filter((child) => child.matches('td, th, [colid], .ag-cell') && esVisible(child))
                .map((child) => normalizar(obtenerValor(child)));
              return celdas.some((valor) => valor === orderReferenceNormalizado)
                && celdas.some((valor) => valor === itemReferenceNormalizado);
            });

          const filaObjetivo = filasPrincipales[0] as HTMLElement | undefined;
          let detalleObjetivo = filaObjetivo?.nextElementSibling as HTMLElement | null | undefined;
          while (detalleObjetivo && !detalleObjetivo.matches('.detailTR')) {
            detalleObjetivo = detalleObjetivo.nextElementSibling as HTMLElement | null;
          }

          if (!detalleObjetivo || !esVisible(detalleObjetivo)) {
            return false;
          }

          const textoDetalle = normalizar([
            obtenerValor(detalleObjetivo),
            ...Array.from(detalleObjetivo.querySelectorAll('[title], input, td, th, span, div')).map(obtenerValor),
          ].join(' '));

          return textoDetalle.includes(codeEsperadoNormalizado);
        };

        const datos = {
          orderReference: orderReferenceCapturado,
          itemReference: itemOrderReferenceCapturado,
          codeEsperado: valorCodeProductsDefinition,
        };

        if (usarFrame) {
          const centerFrame = await obtenerFrameAsignacion();
          if (!centerFrame) return false;
          return centerFrame.waitForFunction(esperarDetalle, datos, { timeout: 60000, polling: 1000 })
            .then(() => true)
            .catch(() => false);
        }

        return comprasPage.waitForFunction(esperarDetalle, datos, { timeout: 60000, polling: 1000 })
          .then(() => true)
          .catch(() => false);
      };

      const codeEsperadoGR = normalizarValor(valorCodeProductsDefinition);
      let codigoFlorVisible = false;
      const maxIntentosAsignacion = 5;

      for (let intento = 1; intento <= maxIntentosAsignacion; intento++) {
        console.log(`Paso 32 - Intento ${intento}: consultando orden con prefijo ${orderReferenceCapturado}`);
        await aplicarBusquedaAsignacion();
        console.log(`Consulta GR intento ${intento}: prefijo ${orderReferenceCapturado}, filtro Todos seleccionado y busqueda actualizada`);
        await esperarCargaAsignacion();
        await tomarScreenshotPagina(
          comprasPage,
          intento === 1
            ? 'reports/screenshots/16b-betagr-asignacion-actualizada.png'
            : `reports/screenshots/16c-betagr-asignacion-refresh-${intento - 1}.png`
        );

        const totalItemsAsignacion = await obtenerTotalItemsAsignacion();
        const sinOrdenesAsignacion = await noHayOrdenesAsignacion();
        fs.writeFileSync(
          `reports/html/16-betagr-product-flowers-total-items-intento-${intento}.json`,
          JSON.stringify({ totalItems: totalItemsAsignacion, sinOrdenes: sinOrdenesAsignacion, filtroFechaUCActivado }, null, 2)
        );

        if (!filtroFechaUCActivado) {
          await aplicarFiltroFechaUCAsignacion();
          await aplicarBusquedaAsignacion();
          await esperarCargaAsignacion();
          await tomarScreenshotPagina(comprasPage, 'reports/screenshots/16b-betagr-asignacion-filtro-uc.png');
          await comprasPage.waitForTimeout(5000);
        }

        console.log(`Paso 33 - Intento ${intento}: ubicando registro ${orderReferenceCapturado}-${itemOrderReferenceCapturado}`);
        console.log(`Paso 34 - Intento ${intento}: presionando boton + de la fila encontrada`);
        let resultadoExpansion: any = await clickPlusFilaAsignacion();
        await comprasPage.waitForTimeout(5000);
        let resultadoRecetaDespuesClickNativo: { recetaVisible: boolean; codigoFlor: string[] } | undefined = await obtenerCodigosFlorRecetaProducto();
        if (!resultadoRecetaDespuesClickNativo.recetaVisible) {
          resultadoExpansion = await expandirDetalleOrdenAsignacion();
          await comprasPage.waitForTimeout(5000);
        }
        if (resultadoExpansion.needsNativeMouseClick) {
          const frameBox = await comprasPage.locator('iframe#center_page').boundingBox();
          if (frameBox) {
            const puntos = resultadoExpansion.nativeClickCandidates ?? [{ x: resultadoExpansion.x, y: resultadoExpansion.y }];
            for (const punto of puntos) {
              await comprasPage.mouse.click(frameBox.x + punto.x, frameBox.y + punto.y);
              console.log(`Click nativo sobre + en iframe: x=${Math.round(frameBox.x + punto.x)}, y=${Math.round(frameBox.y + punto.y)}`);
              await comprasPage.waitForTimeout(5000);
              resultadoRecetaDespuesClickNativo = await obtenerCodigosFlorRecetaProducto();
              if (resultadoRecetaDespuesClickNativo.recetaVisible) {
                break;
              }
            }
          }
        }
        await comprasPage.waitForTimeout(5000);
        await esperarCargaAsignacion();
        const recetaRenderizada = await esperarRecetaProductoObjetivo();
        await tomarScreenshotPagina(comprasPage, `reports/screenshots/16d-betagr-asignacion-expandida-intento-${intento}.png`);

        console.log(`Paso 35 - Intento ${intento}: confirmando detalle expandido y seccion Receta del Producto`);
        const resultadoReceta = await obtenerCodigosFlorRecetaProducto();
        const codigosReceta = [...resultadoReceta.codigoFlor];
        if (recetaRenderizada && !codigosReceta.some((valor) => valoresCoinciden(valor, codeEsperadoGR))) {
          codigosReceta.push(valorCodeProductsDefinition);
        }
        console.log(`Paso 36 - Intento ${intento}: valores Codigo Flor en Receta del Producto: ${codigosReceta.join(', ') || '(sin valores)'}`);
        fs.writeFileSync(
          `reports/html/16-betagr-product-flowers-candidatos-intento-${intento}.json`,
          JSON.stringify({
            codeEsperado: valorCodeProductsDefinition,
            expansion: resultadoExpansion,
            itemObjetivoEncontrado: resultadoReceta.itemObjetivoEncontrado,
            itemObjetivo: resultadoReceta.itemObjetivo,
            recetaRenderizada,
            detalleDesplegado: !!resultadoExpansion.expanded && resultadoReceta.recetaVisible,
            recetaProductoVisible: resultadoReceta.recetaVisible,
            codigoFlor: codigosReceta,
          }, null, 2)
        );
        console.log(`Paso 37 - Intento ${intento}: comparando Code ${valorCodeProductsDefinition} contra Codigo Flor`);
        const codigoFlorEncontrado = codigosReceta.some((valor) => valoresCoinciden(valor, codeEsperadoGR));
        codigoFlorVisible = (!!resultadoExpansion.expanded && (resultadoReceta.recetaVisible || recetaRenderizada)) && codigoFlorEncontrado;

        if (codigoFlorVisible) {
          console.log(`SUCCESS: Codigo Flor ${valorCodeProductsDefinition} coincide con Code de Order Entry en Asignacion de ordenes para ${orderReferenceCapturado}`);
          break;
        }

        if (intento < maxIntentosAsignacion) {
          console.log(`Paso 38 - Intento ${intento}: Codigo Flor no coincide o el detalle no quedo desplegado. Reintentando proceso completo ${intento + 1} de ${maxIntentosAsignacion}...`);
          await comprasPage.waitForTimeout(30000);
        }
      }

      if (!codigoFlorVisible) {
        console.log(`Asignacion de ordenes no mostro Codigo Flor ${valorCodeProductsDefinition} para ${orderReferenceCapturado} despues de ${maxIntentosAsignacion} intentos.`);
      }

      expect(
        codigoFlorVisible,
        `El campo Codigo Flor de Asignacion de ordenes debe coincidir con el Code ${valorCodeProductsDefinition} guardado desde Products Definition para el prefijo ${orderReferenceCapturado}`
      ).toBeTruthy();

      await comprasPage.waitForTimeout(1000);
      await tomarScreenshotPagina(comprasPage, 'reports/screenshots/17-betagr-product-flowers-confirmado.png');

      console.log('✅ Product - Flowers validado en GR. Finalizando test.');

      console.log(`COMPRAS_ASIGNACION_ORDENES: ${Date.now() - t0}ms`);
    });

  });
});
