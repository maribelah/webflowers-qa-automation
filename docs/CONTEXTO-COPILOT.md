# WebFlowers QA Automation — Contexto completo para GitHub Copilot

## Qué es este proyecto

Automatización de pruebas E2E del flujo completo de **productos tipo KIT (Combo / Pallet Combo)**
en **WebFlowers**, un ERP de gestión de flores desarrollado por GHT en Medellín, Colombia.

El objetivo es cubrir el ciclo de vida completo del producto KIT a través de tres módulos obligatorios:

```
Sales Order Entry → Work Order (NEW → STARTED → FINISHED) → Production Reporting
```

- **Stack:** TypeScript + Playwright + Page Object Model (POM) + Allure Report + Azure SQL
- **Ambiente activo:** ALPHA — `https://webflowersalphakds.azurewebsites.net`
- **Base de datos:** `WebFlowersAlpha_KS` en `ghtalphaserver.database.windows.net`

---

## Definición conceptual — Producto KIT

Un **Producto KIT** (también llamado **Combo** o **Pallet Combo**) es un producto especial en WebFlowers que:

- Se vende como **una sola unidad** al cliente (ej. un pallet con código único)
- Está **compuesto internamente** por múltiples sub-productos independientes (componentes)
- Cada componente puede ser otro combo (estructura anidada) o un producto simple tipo Finished Good (FG)
- En Production Reporting aparece marcado como **(KIT)** en la columna Costing Group

**Productos KIT activos en los tests:**
| Código | Nombre | Tipo |
|---|---|---|
| `CBAT-N475` | Easter Grower Pallet | KIT con sub-KITs (producto principal de prueba) |
| `CBAT-N476` | — | KIT secundario |
| `BQMX-XG19` | WE 2-7 Pallet A | KIT con 12 componentes FG |
| `CBAT-X605` | GB SUN COMBO | Sub-KIT de CBAT-N475 |

---

## Estructura del proyecto

```
src/
├── pages/
│   ├── BasePage.ts                        ← NUNCA modificar
│   ├── LoginPage.ts                       ← Localizadores reales confirmados
│   ├── DashboardPage.ts                   ← contenedorPrincipal pendiente de confirmar frame
│   ├── SalesOrderEntryPage.ts             ← Funcional
│   ├── NewPurchaseOrderPage.ts            ← Localizadores parciales
│   ├── ListWorkOrdersPage.ts              ← Funcional
│   ├── WorkOrdersPage.ts                  ← Funcional (lógica de reintentos de Production Group)
│   └── ProductionReportingPage.ts         ← Funcional
├── tasks/
│   └── AuthTasks.ts
├── fixtures/
│   └── base.fixture.ts                    ← Importar siempre desde aquí
├── utils/
│   ├── envConfig.ts                       ← ENV.url, ENV.usuario, ENV.db.*
│   ├── dbHelper.ts
│   ├── poHelper.ts
│   ├── metricsReporter.ts
│   └── helpers.ts
├── data/
│   ├── loginData.json                     ← Solo usar clave "exitoso" para login
│   ├── kit-salesorder-data.json
│   ├── kit-workorders-data.json
│   ├── kit-ListWorkOrders-data.json
│   ├── kit-production-data.json
│   ├── shared-state.json                  ← lastOrderNo, lastWorkOrderNo, lastWorkOrderFinished
│   └── REQ-001-data.json / REQ-002-data.json
└── types/
    └── index.ts

tests/
├── modulo-login/
│   ├── login-exitoso.spec.ts              ← ÚNICO test de login activo
│   └── login-fallido.spec.ts              ← Pendiente de corrección (no ejecutar)
├── modulo-kit/
│   ├── TC-KIT-F1-001-crear-sales-order.spec.ts
│   ├── TC-KIT-F2-001-work-orders.spec.ts
│   ├── TC-KIT-F2-005-finalizar-work-order.spec.ts
│   └── TC-KIT-F3-001-production-reporting.spec.ts
├── modulo-sales-order-entry/
└── modulo-procurement/
```

---

## ENV — estructura real

```typescript
ENV.ambiente    // 'ALPHA' | 'BETA' | 'PROD'
ENV.url         // URL base del ambiente
ENV.usuario     // Usuario de la app
ENV.password    // Contraseña
ENV.ignoreSSL   // true en ALPHA
ENV.db.servidor / ENV.db.nombre / ENV.db.usuario / ENV.db.password
```

Para cambiar ambiente: `$env:AMBIENTE="BETA"; npx playwright test ...`

---

## Regla crítica de Login — SOLO ejecutar exitoso

> **El módulo de login únicamente debe ejecutar el test `login-exitoso.spec.ts`.**
> El archivo `login-fallido.spec.ts` tiene problemas activos no resueltos y NO debe ejecutarse en la suite principal.

Para correr solo el test exitoso:
```powershell
npx playwright test "login-exitoso" --reporter=list
```

Para excluirlo de la suite general, se puede usar en `playwright.config.ts`:
```typescript
testIgnore: ['**/login-fallido.spec.ts']
```

---

## Arquitectura de iframes — CRÍTICO

WebFlowers usa tres iframes fijos. Todos los módulos viven dentro de estos frames:

```
MAIN_PAGE
├── iframe #top_Page2     → frameHeader  (cabecera)
├── iframe #left_page1    → frameMenu    (menú lateral)
└── iframe #center_page   → frameCenter  (módulo activo, name="main")
```

- **Login** → `page.locator()` directamente, sin iframe
- **Nunca usar `networkidle`** → WebFlowers mantiene conexiones permanentes, usar `domcontentloaded`
- **Spinner:** `//div[contains(@class,'progessContainer') and @data-ng-show='IsLoading']`

---

## Localizadores reales confirmados

### Login (sin iframe)
```
Usuario:  input[name="txtUserName"]
Password: input[name="txtPassword"]
Botón:    #btnSigIn
```

### Dashboard (post-login)
```
Contenedor principal: //div[@id='headerWFLogoContainer']
⚠️ PENDIENTE: confirmar en qué iframe vive este elemento
   (no está en #top_Page2 ni directamente en page — inspeccionar con DevTools)
```

### Menú lateral (frameMenu = #left_page1)
```
Sales:            //div[@class='div-parent' and @title='Sales']
Sales > New:      //ul[@id='subSales']//div[@class='div-child' and @title='New']
Order Entry:      //ul[@id='sub1_New_10']//div[@class='div-subchild' and @title='Order Entry']

Inventory:                //div[@class='div-parent' and @title='Inventory']
Inventory > Tools:        //ul[@id='subInventory']//div[@class='div-child' and @title='Tools']
Production Reporting:     //ul[@id='sub1_Tools_12']//a[contains(@href,'ProductionReporting')]
  ⚠️ Usar el <a>, NO el <div> — target="main" navega el center_page

Production:               //div[@class='div-parent' and @title='Production']
Work Orders > List:       //ul[@id='subProduction']//div[@class='div-child' and @title='Work Orders']
```

### Sales Order Entry (frameCenter = #center_page)
```
Módulo cargado:  //div[@data-label='Sales_Order_Entry']
Customer input:  //input[@id='txtCustomer']
P.O. No.:        //input[@data-ng-model='currentOrder.PONumber' and not(contains(@class,'ng-hide'))]
Add Products:    //span[@data-label='AddProducts']
Input búsqueda:  //input[@id='txtSearch']
Botón buscar:    //img[@id='btnSearch']
Botón Add popup: //input[@id='apcOrder_btncloseAndAddProduct']
Boxes (AG Grid): //input[@ng-model='data.Boxes']   — nth(fila-1)
FOB Price:       //input[@ng-model='data.Price']    — nth(fila-1)
Botón Save:      //button[@id='btnSave']
Toast éxito:     //div[contains(@class,'toast-success')]
Order No.:       //div[@id='divForm']/div[4]/div/div/label[2]/span
```

### Production Reporting (frameCenter = #center_page)
```
Módulo cargado:     //md-select-value[@id='select_value_label_0']

Filtro Customer:    //md-select[@ng-model='$ctrl.filters.customersSelected']
  Input filtro:     //input[@ng-model='customersSelectFilter']
  Opción:           //md-option[contains(normalize-space(.),'texto')]
  Cerrar:           Escape (es multi-select)

Botón Search:       //button[@class='mt-3 btn btn-sm btn-outline-primary btn-custom-secondary' and text()='Search']

Expand Customer/Task:
  //span[contains(@class,'ag-group-contracted') and not(contains(@class,'ag-hidden'))]

Expand Product Name (nivel producto):
  //span[@class='ag-cell-wrapper ag-cell-expandable ag-row-group ag-row-group-indent-0 ng-scope']/span[2]
  ⚠️ Requiere force:true

Sub-tabla WO:
  Filas:     //div[@role='row' and .//div[normalize-space(.)='WO_NUMBER']]
  Checkbox:  input[type="checkbox"] en la misma fila del WO

Botón Start Reporting:
  //button[contains(@class,'btn-primary') and contains(normalize-space(.),'Start Reporting')]

Vista de detalle post-Start:
  production-reporting-components-details
  ⚠️ Esperar state: 'attached', NO 'visible'

Columnas AG Grid (col-id confirmados):
  col-id="Selected"     → aria-colindex="4"
  col-id="OrderId"      → aria-colindex="5"
  col-id="CostingGroup" → aria-colindex="6"
  col-id="BoxCode"      → aria-colindex="7"
  col-id="Boxes"        → aria-colindex="8"

⚠️ La columna Costing Group del KIT muestra ícono ℹ️, NO texto.
⚠️ "PROX" es el Box Type (col-id="BoxCode"), NO el Costing Group.
```

---

## shared-state.json — datos encadenados entre TCs

Los TCs se encadenan mediante este archivo. Si un TC falla, los siguientes también fallan por falta de datos.

```json
{
  "lastOrderNo": "075661",
  "lastWorkOrderNo": "108022",
  "lastWorkOrderFinished": "108022"
}
```

**Regla crítica:** La WO **debe estar en estado FINISHED** para aparecer en Production Reporting.

---

## Estado actual de los TCs

| TC | Descripción | Estado | Nota |
|---|---|---|---|
| TC-KIT-F1-001 | Crear Sales Order con KIT | ✅ VERDE | Estable |
| TC-KIT-F2-001 | Crear Work Order y llevarla a STARTED | ⚠️ INESTABLE | El backend ALPHA rechaza grupos de producción aleatoriamente. El test tiene lógica de reintentos (hasta 15) rotando entre Production Groups. Puede necesitar 3-12 intentos. Error backend: `UpdateMainTaskWO expects @UserName` (error del servidor, no del test) |
| TC-KIT-F2-005 | Finalizar Work Order (STARTED → FINISHED) | ✅ VERDE | Depende de F2-001 |
| TC-KIT-F3-001 | KIT visible en Production Reporting + Start Reporting | ⚠️ INTERMITENTE | Falla cuando la grilla AG Grid tarda más de 15s en renderizar. Depende de F2-005 |
| TC-KIT-F3-003 | Fórmula Bunches: suma componentes × Boxes = header | ✅ VERDE | Estable |
| TC-KIT-F2-002 | WO NEW no aparece en Prod. Reporting | ⬜ Pendiente | |
| TC-KIT-F2-003 | Start Work Order (NEW→STARTED) | ⬜ Pendiente | |
| TC-KIT-F2-004 | WO STARTED no aparece en Prod. Reporting | ⬜ Pendiente | |
| TC-KIT-F3-002 | Toggle Split activa vista por componente | 🚫 N/A | KIT siempre trae Split activo, no se puede desactivar |
| login-exitoso | Login con credenciales válidas | ⚠️ PENDIENTE FIX | `DashboardPage.contenedorPrincipal` usa `//div[@id='headerWFLogoContainer']` pero el frame correcto no está confirmado |
| login-fallido | Login con credenciales inválidas | 🚫 NO EJECUTAR | Métodos de BasePage (`obtenerTexto`, `estaVisible`) no disponibles en LoginPage; diseño pendiente |

---

## Problemas activos por resolver

### 1. `DashboardPage.contenedorPrincipal` — frame incorrecto
**Síntoma:** `//div[@id='headerWFLogoContainer']` no se encuentra ni en `page` directo ni en `#top_Page2`.  
**Acción requerida:** Inspeccionar con DevTools en qué iframe vive ese div tras el login y actualizar `DashboardPage.ts`.  
**Archivos afectados:** `src/pages/DashboardPage.ts`, `tests/modulo-login/login-exitoso.spec.ts`, `tests/modulo-procurement/REQ-002-ingreso-new-po.spec.ts`, `tests/modulo-sales-order-entry/REQ-001-sales-order-entry.spec.ts`

### 2. `login-fallido.spec.ts` — métodos faltantes en LoginPage
**Síntoma:** `this.obtenerTexto is not a function` y `this.estaVisible is not a function`.  
**Causa:** `LoginPage` no extiende correctamente `BasePage`, o `BasePage` no expone esos métodos como `protected`.  
**Acción requerida:** Revisar `BasePage.ts` y `LoginPage.ts`. Por política del proyecto, `BasePage.ts` NO se modifica. Si los métodos no están ahí, implementarlos directamente en `LoginPage`.

### 3. TC-KIT-F3-001 — timeout intermitente en expand de AG Grid
**Síntoma:** `ag-group-contracted` no aparece en 15s después del Search.  
**Causa probable:** La grilla tarda más en renderizar cuando el servidor ALPHA está bajo carga.  
**Acción sugerida:** Aumentar el timeout de `expandirFila` de 15000ms a 30000ms.

### 4. TC-KIT-F2-001 — inestabilidad por Production Groups ocupados en ALPHA
**Síntoma:** Backend rechaza Start WO con `Production Group 'X' is working` en múltiples grupos simultáneamente.  
**Causa:** ALPHA es un ambiente compartido, los grupos de producción tienen WOs activas de otros usuarios.  
**Acción sugerida:** Configurar un Production Group dedicado para QA en ALPHA, o aumentar el pool de reintentos.

---

## Reglas del proyecto

- **NUNCA** modificar: `BasePage.ts`, `base.fixture.ts`, `envConfig.ts`, `helpers.ts`, `dbHelper.ts`
- **SIEMPRE** importar `test` desde: `../../src/fixtures/base.fixture`
- **NUNCA** usar `networkidle` — usar `domcontentloaded`
- **NUNCA** hardcodear datos — siempre desde JSON en `src/data/`
- **Login:** solo ejecutar `login-exitoso.spec.ts`. Ignorar o excluir `login-fallido.spec.ts` hasta resolución
- Localizadores sin `id`: usar `data-ng-model` (patrón AngularJS de WebFlowers)
- `AuthTasks.login(usuario, password)` — 2 parámetros, NO recibe la URL

---

## Comando de ejecución por módulo

```powershell
# Suite completa (ALPHA, por defecto)
npx playwright test --reporter=list

# Solo flujo KIT completo
npx playwright test "modulo-kit" --reporter=list

# Solo login exitoso
npx playwright test "login-exitoso" --reporter=list

# En BETA
$env:AMBIENTE="BETA"; npx playwright test "modulo-kit" --reporter=list

# Con modo headed (ver el navegador)
npx playwright test "modulo-kit" --headed --reporter=list
```

---

## Flujo completo del producto KIT — paso a paso

```
1. Login → https://webflowersalphakds.azurewebsites.net
2. Sales > New > Order Entry
3. Ingresar Customer: "F Guesstimate"
4. Ingresar P.O. No.
5. Add Products → Quick Search → buscar CBAT-N475
6. Ingresar Boxes y FOB Price
7. Save → capturar Order No. (ej. 075661) → guardar en shared-state.json

8. Production > Work Orders > List
9. Buscar Order No. 075661 → aparece la WO nueva
10. Ingresar cajas → Save WO → capturar WO No. (ej. 108022)
11. Start WO → confirmar estado STARTED → guardar en shared-state.json

12. Esperar 65s mínimo (regla de negocio WebFlowers)
13. Abrir WO 108022 desde List → Finish → confirmar FINISHED → guardar en shared-state.json

14. Inventory > Tools > Production Reporting
15. Filtrar Customer "F Guesstimate" → Search
16. Expandir Customer group → expandir Task → verificar "EASTER GROWER PALLET" visible
17. Expandir Product Name → seleccionar checkbox WO 108022
18. Start Reporting → verificar pantalla de detalle (production-reporting-components-details)
19. Validar fórmula: Bunches header = suma(bunches por componente) × Boxes
```

---

## Próximos pasos — Sprint 2

1. Confirmar frame de `//div[@id='headerWFLogoContainer']` para estabilizar `login-exitoso`, `REQ-001` y `REQ-002`
2. Aumentar timeout de `expandirFila` en `ProductionReportingPage.ts` (15000 → 30000ms) para estabilizar TC-KIT-F3-001
3. Investigar y corregir `LoginPage` / `BasePage` para reactivar `login-fallido`
4. TC-KIT-F2-002 — WO NEW no aparece en Prod. Reporting (caso negativo)
5. TC-KIT-F2-003 — Start Work Order (NEW → STARTED) con validaciones
6. TC-KIT-F2-004 — WO STARTED no aparece en Prod. Reporting (caso negativo)

---

*Documento generado: 2026-06-17 — Sesión de estabilización de suite completa*
