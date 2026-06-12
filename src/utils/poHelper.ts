import { ejecutarQuery, existeRegistro } from './dbHelper';
import { ENV } from './envConfig';

// Refleja las columnas de tblFlowerOrders y tblHardgoodOrders relevantes para QA
export interface PORecord {
  FlowerOrderId?: number;
  HardgoodOrderId?: number;
  POId: string;
  VendorId: number;
  status: string;
  DateCreated: Date;
  DueDate: Date | null;
  DateReceived: Date | null;
  DateClosed: Date | null;
  CreatedBy: string;
  InvoiceNumber: string | null;
  CostingSystemAcceptanceDate: Date | null;
}

export type POType = 'flower' | 'hardgood';

/**
 * Busca un Purchase Order por su número visible (POId) en la UI.
 * @param poId  Número de PO tal como aparece en la pantalla (ej. "PO-00123")
 * @param type  Tipo de PO: 'flower' (flores/productos) o 'hardgood' (materiales)
 */
export async function obtenerPO(poId: string, type: POType = 'flower'): Promise<PORecord | null> {
  const tabla = type === 'flower' ? 'tblFlowerOrders' : 'tblHardgoodOrders';
  const pkCol = type === 'flower' ? 'FlowerOrderId' : 'HardgoodOrderId';

  const query = `
    SELECT TOP 1
      ${pkCol},
      POId,
      VendorId,
      status,
      DateCreated,
      DueDate,
      DateReceived,
      DateClosed,
      CreatedBy,
      InvoiceNumber,
      CostingSystemAcceptanceDate
    FROM ${tabla}
    WHERE POId = @poId
    ORDER BY DateCreated DESC
  `;

  const resultados = await ejecutarQuery<PORecord>(query, { poId });
  return resultados[0] ?? null;
}

/**
 * Verifica que un PO recién creado exista en BD con el estado esperado.
 * Un PO recién creado tiene: DateClosed IS NULL, DateReceived IS NULL.
 * @param poId   Número de PO visible en la UI
 * @param type   Tipo de PO
 * @returns true si el PO existe y está en estado "recién creado"
 */
export async function verificarPOCreado(poId: string, type: POType = 'flower'): Promise<boolean> {
  const tabla = type === 'flower' ? 'tblFlowerOrders' : 'tblHardgoodOrders';

  const query = `
    SELECT 1
    FROM ${tabla}
    WHERE POId = @poId
      AND DateClosed IS NULL
      AND DateReceived IS NULL
  `;

  return existeRegistro(query, { poId });
}

/**
 * Obtiene el estado (status) de un PO directamente desde la BD.
 * Útil para comparar contra lo que muestra la UI.
 */
export async function obtenerEstadoPO(poId: string, type: POType = 'flower'): Promise<string | null> {
  const po = await obtenerPO(poId, type);
  return po?.status ?? null;
}

/**
 * Verifica que el vendor del PO en BD coincide con el seleccionado en la UI.
 * @param poId      Número de PO
 * @param vendorId  ID interno del vendor esperado
 * @param type      Tipo de PO
 */
export async function verificarVendorPO(
  poId: string,
  vendorId: number,
  type: POType = 'flower'
): Promise<boolean> {
  const tabla = type === 'flower' ? 'tblFlowerOrders' : 'tblHardgoodOrders';

  const query = `
    SELECT 1
    FROM ${tabla}
    WHERE POId = @poId
      AND VendorId = @vendorId
  `;

  return existeRegistro(query, { poId, vendorId });
}

/**
 * Espera a que el PO aparezca en BD, reintentando hasta maxIntentos veces.
 * Necesario porque WebFlowers puede tener un pequeño lag entre la UI y la BD.
 * @param poId          Número de PO
 * @param type          Tipo de PO
 * @param maxIntentos   Máximo de reintentos (default: 5)
 * @param intervaloMs   Milisegundos entre reintentos (default: 1000)
 */
export async function esperarPOEnBD(
  poId: string,
  type: POType = 'flower',
  maxIntentos = 5,
  intervaloMs = 1000
): Promise<PORecord | null> {
  for (let intento = 1; intento <= maxIntentos; intento++) {
    const po = await obtenerPO(poId, type);
    if (po) {
      console.log(`✅ [poHelper — ${ENV.ambiente}] PO "${poId}" encontrado en BD (intento ${intento})`);
      return po;
    }
    if (intento < maxIntentos) {
      await new Promise(resolve => setTimeout(resolve, intervaloMs));
    }
  }
  console.warn(`⚠️  [poHelper — ${ENV.ambiente}] PO "${poId}" no apareció en BD tras ${maxIntentos} intentos`);
  return null;
}
