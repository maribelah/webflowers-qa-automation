import { Page, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ENV } from '../utils/envConfig';

/**
 * Tasks de autenticación
 * 
 * Orquesta las Page Classes de Login y Dashboard para ejecutar
 * flujos completos de autenticación reutilizables entre tests.
 * 
 * Las Tasks NO contienen localizadores directos — solo orquestan Pages.
 */
export class AuthTasks {
  private page: Page;
  private loginPage: LoginPage;
  private dashboardPage: DashboardPage;

  constructor(page: Page) {
    this.page = page;
    this.loginPage = new LoginPage(page);
    this.dashboardPage = new DashboardPage(page);
  }

  /**
   * Ejecuta el flujo completo de login en el ambiente activo
   * @param usuario - Nombre de usuario
   * @param password - Contraseña
   */
  async login(usuario: string, password: string): Promise<void> {
    await this.loginPage.navegarAlInicio();
    await this.loginPage.login(usuario, password);
  }

  /**
   * Ejecuta el flujo completo de logout
   */
  async logout(): Promise<void> {
    await this.dashboardPage.clickLogout();
    await this.page.waitForURL(/login|auth|signin/i);
  }

  /**
   * Ejecuta login completo y valida que se cargue el Dashboard
   * @param usuario - Nombre de usuario
   * @param password - Contraseña
   */
  async loginYValidar(usuario: string, password: string): Promise<void> {
    await this.login(usuario, password);
    await this.page.waitForURL(/dashboard|home|inicio/i, { timeout: 15000 });
    await expect(this.dashboardPage.contenedorPrincipal).toBeVisible();
  }
}
