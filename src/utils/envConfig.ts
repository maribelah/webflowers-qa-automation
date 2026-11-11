import 'dotenv/config';

/**
 * Interfaz de configuración de ambiente
 */
export interface EnvConfig {
  ambiente: 'ALPHA' | 'BETA' | 'PROD';
  url: string;
  urlPO: string;
  urlInvoice: string;
  usuarioPO: string;
  passwordPO: string;
  usuario: string;
  password: string;
  ignoreSSL: boolean;
  db: {
    servidor: string;
    nombre: string;
    usuario: string;
    password: string;
  };
  metrics: {
    servidor: string;
    bd: string;
    usuario: string;
    password: string;
  };
}

/**
 * Obtiene una variable de entorno o lanza error si no existe
 */
function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `❌ [envConfig] — Variable de entorno requerida no encontrada.\n` +
      `   Variable: ${key}\n` +
      `   Solución: Verifica que el archivo .env exista y contenga todas las variables necesarias.\n` +
      `   Referencia: Copia .env.example a .env y completa los valores reales.`
    );
  }
  return value;
}

/** Normaliza URLs copiadas desde archivos properties o mensajes. */
function getUrl(key: string): string {
  const value = getEnvVar(key).trim().replace(/\\([:.])/g, '$1');
  const parsed = new URL(value);
  if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error(`URL invalida: ${key}`);
  return parsed.href;
}

/**
 * Carga y valida la configuración del ambiente activo
 */
function cargarConfiguracion(): EnvConfig {
  // Leer ambiente activo (default: ALPHA)
  const ambiente = (process.env.AMBIENTE || 'ALPHA') as 'ALPHA' | 'BETA' | 'PROD';
  
  // Validar que el ambiente sea válido
  if (!['ALPHA', 'BETA', 'PROD'].includes(ambiente)) {
    throw new Error(
      `❌ [envConfig] — Ambiente inválido: ${ambiente}\n` +
      `   Valores permitidos: ALPHA, BETA, PROD\n` +
      `   Valor actual: ${ambiente}`
    );
  }

  // Cargar variables específicas del ambiente
  const url = getUrl(`${ambiente}_URL`);
  const urlPO = ambiente === 'BETA' ? getUrl('BETAPO_URL') : url;
  const urlInvoice = ambiente === 'BETA' && process.env.BETAINVOICE_URL ? getUrl('BETAINVOICE_URL') : url;
  const usuario = getEnvVar(`${ambiente}_USER`);
  const password = getEnvVar(`${ambiente}_PASS`);
  const usuarioPO = ambiente === 'BETA' ? process.env.BETAPO_USER || usuario : usuario;
  const passwordPO = ambiente === 'BETA' ? process.env.BETAPO_PASS || password : password;
  const servidorBD = getEnvVar(`${ambiente}_SERVIDOR_BD`);
  const nombreBD = getEnvVar(`${ambiente}_BD`);
  const usuarioBD = getEnvVar(`${ambiente}_USER_BD`);
  const passwordBD = getEnvVar(`${ambiente}_PASS_BD`);

  // Cargar variables de métricas (independientes del ambiente)
  const metricsServidor = getEnvVar('METRICS_SERVIDOR');
  const metricsBD = getEnvVar('METRICS_BD');
  const metricsUser = getEnvVar('METRICS_USER');
  const metricsPass = getEnvVar('METRICS_PASS');

  // ignoreSSL es true solo en ALPHA
  const ignoreSSL = ambiente === 'ALPHA';

  return {
    ambiente,
    url,
    urlPO,
    urlInvoice,
    usuarioPO,
    passwordPO,
    usuario,
    password,
    ignoreSSL,
    db: {
      servidor: servidorBD,
      nombre: nombreBD,
      usuario: usuarioBD,
      password: passwordBD,
    },
    metrics: {
      servidor: metricsServidor,
      bd: metricsBD,
      usuario: metricsUser,
      password: metricsPass,
    },
  };
}

/**
 * Configuración global del ambiente activo
 * 
 * Esta es la única fuente de variables de entorno en el proyecto.
 * Nunca usar process.env directamente fuera de este archivo.
 */
export const ENV: EnvConfig = cargarConfiguracion();

// Log del ambiente activo en startup (solo en modo debug)
if (process.env.DEBUG) {
  console.log(`🌐 [envConfig] — Ambiente activo: ${ENV.ambiente}`);
  console.log(`   URL: ${ENV.url}`);
  console.log(`   URL PO: ${ENV.urlPO}`);
  console.log(`   URL Invoice: ${ENV.urlInvoice}`);
  console.log(`   BD: ${ENV.db.nombre} @ ${ENV.db.servidor}`);
  console.log(`   Métricas: ${ENV.metrics.bd} @ ${ENV.metrics.servidor}`);
  console.log(`   ignoreSSL: ${ENV.ignoreSSL}`);
}
