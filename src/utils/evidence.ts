import type { Page, TestInfo } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
import * as path from 'path';

const directories = new WeakMap<TestInfo, string>();
const diagnosticDirectories = new WeakMap<TestInfo, string>();

/** Agrupa las evidencias por requerimiento y ejecucion, sin sobrescribir el historial. */
function reportPath(testInfo: TestInfo, filename: string, category: string, cache: WeakMap<TestInfo, string>): string {
  let directory = cache.get(testInfo);
  if (!directory) {
    const requirement = /REQ\d+/i.exec(`${testInfo.title} ${path.basename(testInfo.file)}`)?.[0].toUpperCase();
    const group = requirement || path.basename(testInfo.file, '.spec.ts');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    directory = path.join(process.cwd(), 'reports', category, group,
      `${timestamp}-worker${testInfo.workerIndex}-retry${testInfo.retry}`);
    mkdirSync(directory, { recursive: true });
    cache.set(testInfo, directory);
  }
  return path.join(directory, path.basename(filename));
}

export function evidencePath(testInfo: TestInfo, filename: string): string {
  return reportPath(testInfo, filename, 'screenshots', directories);
}

export function diagnosticPath(testInfo: TestInfo, filename: string): string {
  return reportPath(testInfo, filename, 'diagnostics', diagnosticDirectories);
}

/** Unica entrada para capturas finales y errores inesperados. */
export async function captureEvidence(page: Page, testInfo: TestInfo, filename: string): Promise<void> {
  const target = evidencePath(testInfo, filename);
  await page.screenshot({ path: target, fullPage: false });
  await testInfo.attach('screenshot', { path: target, contentType: 'image/png' });
}

export function writeEvidence(testInfo: TestInfo, filename: string, body: string): void {
  writeFileSync(diagnosticPath(testInfo, filename), body, 'utf8');
}
