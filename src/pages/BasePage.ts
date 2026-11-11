import { Page, Locator } from '@playwright/test';

/**
 * Clase base de la que heredan todas las Page Classes
 * 
 * Proporciona métodos comunes de navegación, espera, screenshots y validaciones
 * que son reutilizados por todas las páginas del proyecto.
 */
export class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navega a una URL y espera a que la red esté inactiva
   * @param url - URL completa a la que navegar
   */
  async navegarA(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'networkidle' });
  }

  /**
   * Espera a que un elemento esté visible y disponible
   * @param locator - Localizador del elemento a esperar
   * @param timeout - Timeout opcional en milisegundos (default: 30000)
   */
  async esperarElemento(locator: Locator, timeout: number = 30000): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
  }

  /**
   * Verifica si un elemento está visible en la página
   * @param locator - Localizador del elemento a verificar
   * @returns true si el elemento está visible, false en caso contrario
   */
  async estaVisible(locator: Locator): Promise<boolean> {
    try {
      await locator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene el texto de un elemento
   * @param locator - Localizador del elemento
   * @returns Texto del elemento
   */
  async obtenerTexto(locator: Locator): Promise<string> {
    await this.esperarElemento(locator);
    const texto = await locator.textContent();
    return texto?.trim() || '';
  }
}
