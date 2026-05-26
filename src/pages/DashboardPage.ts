import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Class del Dashboard de WebFlowers
 * 
 * Encapsula los elementos y acciones del panel principal post-login.
 * Incluye navegación a módulos y cierre de sesión.
 */
export class DashboardPage extends BasePage {
  readonly contenedorPrincipal: Locator;
  readonly nombreUsuarioBienvenida: Locator;
  readonly menuNavegacion: Locator;
  readonly btnLogout: Locator;

  constructor(page: Page) {
    super(page);
    
    this.contenedorPrincipal = page.locator('[data-testid="dashboard"], .dashboard, #dashboard');
    this.nombreUsuarioBienvenida = page.locator('[data-testid="user-name"], .user-name, .username');
    this.menuNavegacion = page.locator('[data-testid="nav-menu"], nav, .navbar');
    this.btnLogout = page.locator('[data-testid="logout"], button:has-text("Salir"), a:has-text("Cerrar Sesión")');
  }

  /**
   * Verifica si la página actual es el Dashboard
   * @returns true si está en el Dashboard
   */
  async estaEnDashboard(): Promise<boolean> {
    return await this.estaVisible(this.contenedorPrincipal);
  }

  /**
   * Obtiene el nombre del usuario mostrado en la bienvenida
   * @returns Nombre del usuario actualmente logueado
   */
  async obtenerNombreUsuario(): Promise<string> {
    return await this.obtenerTexto(this.nombreUsuarioBienvenida);
  }

  /**
   * Hace clic en el botón de logout para cerrar sesión
   */
  async clickLogout(): Promise<void> {
    await this.btnLogout.click();
  }

  /**
   * Navega a un módulo específico del sistema
   * @param modulo - Nombre del módulo al que navegar (ej: "Inventario", "Pedidos")
   */
  async navegarAModulo(modulo: string): Promise<void> {
    const linkModulo = this.page.locator(`[data-testid="nav-${modulo.toLowerCase()}"], a:has-text("${modulo}")`);
    await linkModulo.click();
  }
}
