import { readFileSync, writeFileSync } from 'fs';
import * as path from 'path';

interface PurchaseOrderData {
  numeroPO: string;
  origen: string;
  evidenciaOrigen: string;
  ambiente?: string;
  urlOrigen?: string;
}

const dataPath = path.resolve(__dirname, '../data/REQ002-invoiceData.json');

export function guardarPOParaInvoice(numeroPO: string, evidenciaOrigen: string, ambiente: string, urlOrigen: string): void {
  if (!/^\d+$/.test(numeroPO)) throw new Error('La PO generada debe ser numerica.');
  const data: PurchaseOrderData = { numeroPO, origen: 'REQ001', evidenciaOrigen, ambiente, urlOrigen };
  writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

export function cargarPOParaInvoice(ambiente: string, urlPO: string): PurchaseOrderData {
  const data: PurchaseOrderData = JSON.parse(readFileSync(dataPath, 'utf8'));
  if (!/^\d+$/.test(data.numeroPO) || data.origen !== 'REQ001') {
    throw new Error('Ejecuta REQ001 antes de REQ002 para obtener una PO valida.');
  }
  if (data.ambiente && data.ambiente !== ambiente) throw new Error('La PO pertenece a otro ambiente.');
  if (!data.urlOrigen || new URL(data.urlOrigen).origin !== new URL(urlPO).origin) {
    throw new Error('Ejecuta REQ001 en la URL de PO configurada antes de crear el invoice.');
  }
  return data;
}
