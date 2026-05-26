/**
 * Formatea una fecha en formato YYYY-MM-DD_HH-mm-ss para nombres de archivos
 * @param date - Fecha a formatear
 * @returns String formateado para usar en nombres de archivos
 */
export function formatearFecha(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

/**
 * Sanitiza un nombre reemplazando espacios y caracteres especiales por guiones
 * Útil para crear nombres de archivos seguros (screenshots, reportes)
 * @param nombre - Nombre a sanitizar
 * @returns Nombre sanitizado con solo caracteres alfanuméricos y guiones
 */
export function sanitizarNombre(nombre: string): string {
  return nombre
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')  // Reemplazar no-alfanuméricos por guiones
    .replace(/^-+|-+$/g, '')       // Eliminar guiones al inicio/final
    .substring(0, 50);              // Limitar longitud
}

/**
 * Espera un número específico de milisegundos
 * 
 * ⚠️ ADVERTENCIA: Usar con criterio. No usar para sincronización con la UI.
 * Preferir waitForSelector, waitForURL, networkidle en su lugar.
 * 
 * Casos válidos de uso:
 * - Esperar backend asíncrono fuera del control de la UI
 * - Delays intencionales en flujos de negocio (ej: cooldown de API)
 * 
 * @param ms - Milisegundos a esperar
 */
export async function esperarMs(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retorna un timestamp compacto para sufijos únicos
 * Formato: YYYYMMDD-HHmmss
 * @returns Timestamp en formato compacto
 */
export function obtenerTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}
