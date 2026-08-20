import { test } from '../../src/fixtures/base.fixture';
import { ENV } from '../../src/utils/envConfig';
import { waitForAppReady, clickResilient } from '../../src/utils/waitUtils';

test.describe('Modulo Bulk Changes - Visual hasta paso 3', () => {
  test('abrir Bulk Changes y mantener Chrome abierto', async ({ page }) => {
    test.setTimeout(900000);

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

    await test.step('Paso 1 - Navegar a la URL del ambiente', async () => {
      await page.goto(ENV.url, { waitUntil: 'domcontentloaded' });
      await waitForAppReady(page, 30000);
    });

    await test.step('Paso 2 - Login', async () => {
      await page.fill('input[name="txtUserName"]', ENV.usuario);
      await page.fill('input[name="txtPassword"]', ENV.password);
      await clickResilient(page.locator('#btnSigIn'));
      await waitForAppReady(page, 30000);
    });

    await test.step('Paso 3 - Navegar a Sales -> Bulk Changes', async () => {
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
      ]);

      await page.waitForTimeout(5000);
    });

    await page.pause();
  });
});
