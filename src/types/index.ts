/**
 * Tipos compartidos del proyecto webflowers-qa-automation
 */

/**
 * Interfaz para datos de usuario de prueba
 */
export interface UsuarioData {
  usuario: string;
  password: string;
  descripcion: string;
}

/**
 * Interfaz para datos de test con casos estándar
 * Todos los archivos JSON de datos deben incluir los tres casos
 */
export interface TestData<T> {
  exitoso: T;
  fallido: T;
  borde: T;
}

/**
 * Interfaz para resultados de base de datos
 */
export interface ResultadoBD {
  encontrado: boolean;
  cantidad: number;
}

/**
 * Tipo de ambiente activo
 */
export type Ambiente = 'ALPHA' | 'BETA' | 'PROD';

/**
 * Estado de un caso de prueba para métricas
 */
export type EstadoTest = 'PASSED' | 'FAILED' | 'SKIPPED';
