  import { Page, Locator } from '@playwright/test';
  import { BasePage } from './BasePage';
  import { ENV } from '../utils/envConfig';

  /**
   * Page Class del módulo Login de WebFlowers
   * 
   * Encapsula los elementos y acciones de la pantalla de autenticación.
   * Orden de preferencia de selectores: data-testid → role → text → css
   */
  export class LoginPage extends BasePage {
    readonly inputUsuario: Locator;
    readonly inputPassword: Locator;
    readonly btnIngresar: Locator;
    readonly mensajeError: Locator;

    constructor(page: Page) {
      super(page);
      
      // Preferir data-testid, si no existe usar name, id o clase CSS
      this.inputUsuario = page.locator('[data-testid="username"], input[name="txtUserName"], #txtUserName, input[placeholder="User Name or E-mail"]');
      this.inputPassword = page.locator('[data-testid="password"], input[name="txtPassword"], #txtPassword, input[placeholder="Password"]');
      this.btnIngresar = page.locator('[data-testid="login-button"], button[type="submit"], input[type="submit"], #btnSigIn');
      this.mensajeError = page.locator('[data-testid="error-message"], .error-message, .alert-danger, .validation-summary-errors');
    }

    /**
     * Ingresa las credenciales y hace clic en el botón de login
     * @param usuario - Nombre de usuario
     * @param password - Contraseña
     */
    async login(usuario: string, password: string): Promise<void> {
      await this.inputUsuario.fill(usuario);
      await this.inputPassword.fill(password);
      await this.btnIngresar.click();
    }

    /**
     * Navega a la página de login del ambiente activo
     */
    async navegarAlInicio(): Promise<void> {
      await this.page.goto(ENV.url);
      await this.esperarCarga();
    }

    /**
     * Obtiene el mensaje de error mostrado en pantalla
     * @returns Texto del mensaje de error
     */
    async obtenerMensajeError(): Promise<string> {
      return await this.obtenerTexto(this.mensajeError);
    }

    /**
     * Verifica si la página actual es la de login
     * @returns true si está en la página de login
     */
    async estaEnLogin(): Promise<boolean> {
      return await this.estaVisible(this.btnIngresar);
    }
  }
