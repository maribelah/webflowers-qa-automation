import { test } from '@playwright/test';

/** Registra el resultado del paso conservando el error original. */
export function crearRegistroPasos(evidencia: string[]) {
  return async (nombre: string, detalle: string, accion: () => Promise<void>): Promise<void> => {
    const inicio = Date.now();
    try {
      await test.step(nombre, accion);
      evidencia.push(`PASS | ${nombre} | ${detalle} | ${((Date.now() - inicio) / 1000).toFixed(1)}s`);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      evidencia.push(`FAIL | ${nombre} | ${detalle} | ${((Date.now() - inicio) / 1000).toFixed(1)}s | ${mensaje}`);
      throw error;
    }
  };
}
