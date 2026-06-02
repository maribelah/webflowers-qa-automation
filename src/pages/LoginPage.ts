import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { ENV } from '../utils/envConfig';

/**
 * Page Class del módulo Login de WebFlowers
 * 
 * Encapsula los elementos y acciones de la pantalla de autenticación.
 * Localizadores actualizados con los IDs reales de WebFlowers.
 */
export class LoginPage extends BasePage {
  readonly inputUsuario: Locator;
  readonly inputPassword: Locator;
  readonly btnIngresar: Locator;
  readonly mensajeError: Locator;

  constructor(page: Page) {
    super(page);
    
    // Localizadores específicos de WebFlowers
    this.inputUsuario = page.locator('#txtUserName');
    this.inputPassword = page.locator('#txtPassword');
    this.btnIngresar = page.locator('#btnSigIn');
    this.mensajeError = page.locator('[data-testid="error-message"], .error-message, .alert-danger');
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
    await this.navegarA(ENV.url);
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
