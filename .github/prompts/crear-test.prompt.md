# ✅ Habilidad: Crear Test Completo

## Propósito

Generar todos los artefactos de un requerimiento de prueba para WebFlowers:
spec `.spec.ts`, JSON de datos, y especificación en lenguaje natural `.md`.
Listos para ejecutar sin modificación manual.

Esta es la habilidad principal del agente — el `Requerimiento` es el identificador
padre de todos los artefactos generados.

---

## Cómo invocar esta habilidad

```
@workspace /crear-test
Módulo: [opción del menú de WebFlowers — ej: Procurement, Sales, Inventory]
Requerimiento: [REQ-ID de Azure DevOps — ej: REQ-002]
Funcionalidad: [descripción de lo que se prueba]
Pasos del flujo exitoso:
  1. [paso 1]
  2. [paso 2]
  ...
Resultado esperado: [qué debe ocurrir al finalizar]
Validación BD: [si aplica — qué verificar. Si no aplica: No aplica]
Page Class disponible: [NombrePage.ts si existe, o "Crear [Nombre]Page.ts"]
Datos de prueba disponibles: [REQ-ID-data.json si existe, o "Crear REQ-ID-data.json"]
NO MODIFICAR: BasePage.ts, base.fixture.ts, envConfig.ts, helpers.ts
```

---

## Lo que el agente genera — SIEMPRE los cuatro artefactos

| # | Artefacto | Ubicación | Obligatorio |
|---|---|---|---|
| 1 | `REQ-[ID]-[nombre].spec.ts` | `tests/modulo-[nombre]/` | ✅ Siempre |
| 2 | `REQ-[ID]-data.json` | `src/data/` | ✅ Siempre |
| 3 | `[Nombre]Page.ts` | `src/pages/` | Solo si no existe |
| 4 | `REQ-[ID].md` | `tests/specs-fuente/[modulo]/` | ✅ Siempre |

> Si la Page Class o el JSON ya existen, Copilot los usa directamente sin sobrescribirlos.
> El `.md` de specs-fuente **siempre** se crea — es la especificación en lenguaje natural
> del requerimiento y debe quedar documentada aunque los otros archivos ya existan.

---

## Estructura del `REQ-[ID].md` en specs-fuente

```markdown
# REQ-[ID] — [Nombre del requerimiento]

**Módulo:** [Módulo]
**Requerimiento:** REQ-[ID]
**Analista QA:** [nombre]
**Estado:** Cerrado

## Descripción
[Descripción del requerimiento]

## Flujo principal
1. [paso 1]
2. [paso 2]

**Resultado esperado:** [resultado]

## Casos de prueba
### ✅ Caso exitoso
### ❌ Caso fallido
### 🔲 Caso borde

## Validaciones de base de datos
[Si aplica o No aplica]

## Prompt final para Copilot
[El prompt exacto con el que se generó este test]
```

---

## Estructura obligatoria del spec

```typescript
// tests/modulo-[nombre]/REQ-[ID]-[nombre-funcionalidad].spec.ts
// webflowers-qa-automation

import { test, expect } from '../../src/fixtures/base.fixture';
import { LoginPage }    from '../../src/pages/LoginPage';
import { DashboardPage } from '../../src/pages/DashboardPage';
import { [Nombre]Page } from '../../src/pages/[Nombre]Page';
import datos            from '../../src/data/REQ-[ID]-data.json';

test.describe('Módulo [Nombre] — [Descripción breve]', () => {

  test('REQ-[ID] — [descripción del caso exitoso]', async ({ page }) => {
    const loginPage    = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const [nombre]Page = new [Nombre]Page(page);

    await test.step('Navegar a la URL del ambiente activo', async () => {
      await loginPage.navegarAlInicio();
      await page.screenshot({
        path: 'reports/screenshots/REQ-[ID]-01-pagina-login.png',
        fullPage: true,
      });
    });

    await test.step('Ingresar credenciales válidas', async () => {
      await loginPage.login(datos.exitoso.usuario, datos.exitoso.password);
      await page.screenshot({
        path: 'reports/screenshots/REQ-[ID]-02-credenciales-ingresadas.png',
        fullPage: true,
      });
    });

    await test.step('Validar carga del Dashboard', async () => {
      await expect(dashboardPage.contenedorPrincipal).toBeVisible();
      await page.screenshot({
        path: 'reports/screenshots/REQ-[ID]-03-dashboard-cargado.png',
        fullPage: true,
      });
    });

    await test.step('[Acción principal del módulo]', async () => {
      await [nombre]Page.[metodo]();
      await page.screenshot({
        path: 'reports/screenshots/REQ-[ID]-04-accion-ejecutada.png',
        fullPage: true,
      });
    });

    await test.step('Validar resultado esperado', async () => {
      await [nombre]Page.validarModuloCargado();
      await page.screenshot({
        path: 'reports/screenshots/REQ-[ID]-05-resultado-validado.png',
        fullPage: true,
      });
    });

  });

});
```

---

## Estructura del JSON de datos

```json
{
  "exitoso": {
    "usuario": "qaauto",
    "password": "qaauto",
    "descripcion": "Usuario válido con acceso al módulo [Módulo]"
  },
  "fallido": {
    "usuario": "qaauto",
    "password": "password_incorrecta",
    "descripcion": "Contraseña incorrecta para usuario válido"
  },
  "borde": {
    "usuario": "",
    "password": "",
    "descripcion": "Campos vacíos, validación de formulario"
  }
}
```

---

## Reglas críticas de generación

### Nombre del archivo spec
```
✅ REQ-001-ingreso-sales-order-entry.spec.ts
✅ REQ-002-ingreso-new-po.spec.ts
❌ login-exitoso.spec.ts  (sin REQ-ID)
❌ test-procurement.spec.ts
```

### Nombre del `test.describe` — impacto en `qa_metrics`
```typescript
// ✅ Correcto — nombre estable sin REQ-ID
test.describe('Módulo Sales Order Entry — Acceso desde menú principal', () => { ... });
test.describe('Módulo Procurement — Ingreso a New Purchase Order', () => { ... });

// ❌ Incorrecto — REQ-ID en el describe fragmenta el historial
test.describe('REQ-001: Sales Order Entry', () => { ... });
test.describe('Procurement', () => { ... });
```

### Nombre del test individual — incluye el REQ-ID
```typescript
// ✅ Correcto — REQ-ID en el nombre del test individual
test('REQ-001 — Ingreso exitoso al módulo Sales Order Entry', ...)
test('REQ-002 — Ingreso exitoso al módulo New Purchase Order', ...)
```

### Imports — siempre desde `base.fixture.ts`
```typescript
// ✅ Correcto
import { test, expect } from '../../src/fixtures/base.fixture';

// ❌ Incorrecto
import { test, expect } from '@playwright/test';
```

### Screenshots — uno por `test.step`, con prefijo REQ-ID
```typescript
// ✅ Correcto
await page.screenshot({
  path: 'reports/screenshots/REQ-002-03-dashboard-cargado.png',
  fullPage: true,
});
```

### Datos — siempre desde JSON
```typescript
// ✅ Correcto
await loginPage.login(datos.exitoso.usuario, datos.exitoso.password);

// ❌ Incorrecto
await loginPage.login('qaauto', 'qaauto');
```

---

## Ejemplo de spec generado correctamente

REQ-001 — Sales Order Entry:

```typescript
import { test, expect } from '../../src/fixtures/base.fixture';
import { LoginPage }     from '../../src/pages/LoginPage';
import { DashboardPage } from '../../src/pages/DashboardPage';
import { SalesOrderEntryPage } from '../../src/pages/SalesOrderEntryPage';
import datos from '../../src/data/REQ-001-data.json';

test.describe('Módulo Sales Order Entry — Acceso desde menú principal', () => {

  test('REQ-001 — Ingreso exitoso al módulo Sales Order Entry', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const salesOrderEntryPage = new SalesOrderEntryPage(page);

    await test.step('Navegar a la URL del ambiente activo', async () => {
      await loginPage.navegarAlInicio();
      await page.screenshot({ path: 'reports/screenshots/REQ-001-01-pagina-login.png', fullPage: true });
    });

    await test.step('Ingresar credenciales válidas', async () => {
      await loginPage.login(datos.exitoso.usuario, datos.exitoso.password);
      await page.screenshot({ path: 'reports/screenshots/REQ-001-02-credenciales-ingresadas.png', fullPage: true });
    });

    await test.step('Validar carga del Dashboard', async () => {
      await expect(dashboardPage.contenedorPrincipal).toBeVisible();
      await page.screenshot({ path: 'reports/screenshots/REQ-001-03-dashboard-cargado.png', fullPage: true });
    });

    await test.step('Navegar al módulo Sales Order Entry desde el menú', async () => {
      await salesOrderEntryPage.navigateToOrderEntry();
      await page.screenshot({ path: 'reports/screenshots/REQ-001-04-navegacion-menu.png', fullPage: true });
    });

    await test.step('Validar apertura del formulario Sales Order Entry', async () => {
      await salesOrderEntryPage.validarModuloCargado();
      await page.screenshot({ path: 'reports/screenshots/REQ-001-05-formulario-visible.png', fullPage: true });
    });

  });

});
```

---

## Checklist de entregables — verificar antes de terminar

- [ ] `tests/modulo-[nombre]/REQ-[ID]-[nombre].spec.ts` — creado
- [ ] `src/data/REQ-[ID]-data.json` — creado con tres casos y `descripcion`
- [ ] `tests/specs-fuente/[modulo]/REQ-[ID].md` — **SIEMPRE creado**
- [ ] Import desde `base.fixture.ts` — no de `@playwright/test`
- [ ] `test.describe` sin REQ-ID — formato `Módulo [Nombre] — [Descripción]`
- [ ] Nombre del test individual incluye el REQ-ID
- [ ] Screenshots con prefijo `REQ-[ID]-` y número secuencial
- [ ] Datos desde JSON — sin valores hardcodeados
- [ ] `DashboardPage.contenedorPrincipal` usado para validar el Dashboard
- [ ] Archivos protegidos no modificados: `BasePage.ts`, `base.fixture.ts`, `envConfig.ts`

---

*webflowers-qa-automation — .github/prompts/crear-test.prompt.md*
*Versión 2.0 — Mayo 2026 — Alineado con SDD v4.3*
*Cambios v2.0: REQ-ID como identificador padre, cuatro artefactos obligatorios,
specs-fuente siempre generado, nombre del test individual incluye REQ-ID*