import * as sql from 'mssql';
import { ENV } from './envConfig';

/**
 * Configuración de conexión a la base de datos de WebFlowers
 * Las credenciales cambian según el ambiente activo (ALPHA, BETA, PROD)
 */
const config: sql.config = {
  server: ENV.db.servidor,
  database: ENV.db.nombre,
  user: ENV.db.usuario,
  password: ENV.db.password,
  options: {
    encrypt: true,
    trustServerCertificate: ENV.ignoreSSL,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

/**
 * Verifica la conexión a la base de datos del ambiente activo
 * @returns true si la conexión es exitosa
 * @throws Error si la conexión falla
 */
export async function verificarConexion(): Promise<boolean> {
  let pool: sql.ConnectionPool | null = null;
  try {
    pool = await sql.connect(config);
    await pool.request().query('SELECT 1 AS test');
    console.log(`✅ [dbHelper — ${ENV.ambiente}] — Conexión verificada: ${ENV.db.nombre}`);
    return true;
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error);
    throw new Error(
      `❌ [dbHelper — ${ENV.ambiente}] — Error al conectar a la base de datos.\n` +
      `   Servidor: ${ENV.db.servidor}\n` +
      `   Base de datos: ${ENV.db.nombre}\n` +
      `   Detalle: ${mensaje}`
    );
  } finally {
    if (pool) await pool.close();
  }
}

/**
 * Ejecuta una consulta SQL y retorna los resultados tipados
 * @param query - Consulta SQL a ejecutar
 * @param params - Parámetros opcionales para la consulta
 * @returns Lista de resultados tipados
 */
export async function ejecutarQuery<T>(
  query: string,
  params?: Record<string, unknown>
): Promise<T[]> {
  let pool: sql.ConnectionPool | null = null;
  try {
    pool = await sql.connect(config);
    const request = pool.request();
    
    // Agregar parámetros con tipos explícitos si existen
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        // Determinar el tipo SQL según el tipo de JavaScript
        if (typeof value === 'string') {
          request.input(key, sql.VarChar, value);
        } else if (typeof value === 'number') {
          request.input(key, sql.Int, value);
        } else if (typeof value === 'boolean') {
          request.input(key, sql.Bit, value);
        } else if (value instanceof Date) {
          request.input(key, sql.DateTime, value);
        } else {
          request.input(key, sql.VarChar, String(value));
        }
      }
    }
    
    const result = await request.query(query);
    return result.recordset as T[];
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error);
    throw new Error(
      `❌ [dbHelper — ${ENV.ambiente}] — Error en ejecutarQuery.\n` +
      `   Query: ${query.substring(0, 100)}...\n` +
      `   Detalle: ${mensaje}`
    );
  } finally {
    if (pool) await pool.close();
  }
}

/**
 * Verifica si existe al menos un registro que cumpla la consulta
 * @param query - Consulta SQL a ejecutar
 * @param params - Parámetros opcionales para la consulta
 * @returns true si existe al menos un registro
 */
export async function existeRegistro(
  query: string,
  params?: Record<string, unknown>
): Promise<boolean> {
  const resultados = await ejecutarQuery<unknown>(query, params);
  return resultados.length > 0;
}

/**
 * Cuenta la cantidad de registros que cumplen la consulta
 * @param query - Consulta SQL a ejecutar
 * @param params - Parámetros opcionales para la consulta
 * @returns Cantidad de registros encontrados
 */
export async function contarRegistros(
  query: string,
  params?: Record<string, unknown>
): Promise<number> {
  const resultados = await ejecutarQuery<{ count: number }>(query, params);
  return resultados[0]?.count || 0;
}
