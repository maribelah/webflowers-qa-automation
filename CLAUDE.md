# WebFlowers QA Automation — Contexto del Proyecto

## Qué es este proyecto
Automatización de pruebas E2E del flujo completo de **productos tipo KIT (Combo/Pallet Combo)**
en **WebFlowers**, ERP de gestión de flores desarrollado por GHT en Medellín, Colombia.

Un producto KIT es el tipo de producto más complejo del sistema: recorre tres módulos
obligatorios antes de poder ser reportado en producción.

```
Sales Order Entry  →  Work Order (NEW → STARTED → FINISHED)  →  Production Reporting
```

- **Stack:** TypeScript + Playwright + POM + Allure Report + Azure SQL
- **Ambiente activo:** ALPHA — `https://webflowersalphakds.azurewebsites.net`
- **BD:** `WebFlowersAlpha_KS` en `ghtalphaserver.database.windows.net`

---

## Definición Conceptual — Producto KIT

Un **Producto KIT** (también llamado **Combo** o **Pallet Combo**) es un producto especial en WebFlowers que:

- Se vende comercialmente como **una sola unidad** al cliente (por ejemplo, un pallet con código único)
- Está **internamente compuesto** por múltiples sub-productos independientes (componentes) con sus propios Costing Groups, recetas y cantidades
- Cada componente puede ser a su vez otro combo (estructura anidada), o un producto simple tipo Finished Good (FG)
- En el reporte de Costing Groups aparece marcado como **(KIT)** en la columna Costing Group, a diferencia de los productos FG normales que tienen un CG explícito

---

## Estructura del proyecto

```
src/
├── pages/
│   ├── BasePage.ts                        ← NUNCA modificar directamente
│   ├── LoginPage.ts                       ← Localizadores reales confirmados
│   ├── DashboardPage.ts
│   ├── SalesOrderEntryPage.ts             ← ✅ Funcional
│   ├── NewPurchaseOrderPage.ts            ← Localizadores parciales
│   ├── ListWorkOrdersPage.ts              ← ✅ Funcional
│   ├── WorkOrdersPage.ts
│   └── ProductionReportingPage.ts         ← ✅ Funcional — creado hoy
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
│   ├── loginData.json
│   ├── kit-salesorder-data.json
│   ├── kit-workorders-data.json
│   ├── kit-ListWorkOrders-data.json
│   ├── kit-production-data.json           ← Creado hoy
│   ├── shared-state.json                  ← lastOrderNo, lastWorkOrderNo, lastWorkOrderFinished
│   └── REQ-001-data.json / REQ-002-data.json
└── types/
    └── index.ts
tests/
├── modulo-login/
│   ├── login-exitoso.spec.ts
│   └── login-fallido.spec.ts
├── modulo-kit/
│   ├── TC-KIT-F1-001-crear-sales-order.spec.ts
│   ├── TC-KIT-F2-001-work-orders.spec.ts
│   ├── TC-KIT-F2-005-finalizar-work-order.spec.ts
│   └── TC-KIT-F3-001-production-reporting.spec.ts  ← ✅ VERDE hoy
├── modulo-sales-order-entry/
└── modulo-procurement/
docs/
└── PLAN-KIT-COMBO.md                      ← Plan completo 25 TCs, 5 fases
```

---

## ENV — estructura real

```typescript
ENV.ambiente    // 'ALPHA' | 'BETA' | 'PROD'
ENV.url         // URL base
ENV.usuario     // Usuario de la app
ENV.password    // Contraseña
ENV.ignoreSSL   // true en ALPHA
ENV.db.servidor / ENV.db.nombre / ENV.db.usuario / ENV.db.password
ENV.metrics.servidor / ENV.metrics.bd / ENV.metrics.usuario / ENV.metrics.password
```

---

## Iframes de WebFlowers — CRÍTICO

```
MAIN_PAGE
├── iframe #top_Page2     → frameHeader
├── iframe #left_page1    → frameMenu   (menú lateral)
└── iframe #center_page   → frameCenter (módulo activo, name="main")
```

- Login → `page.locator()` directamente (sin iframe)
- `networkidle` NO funciona → usar `domcontentloaded`
- Spinner: `//div[contains(@class,'progessContainer') and @data-ng-show='IsLoading']` (typo: sin 'r')

---

## Localizadores reales confirmados por inspección

### Login
```
Usuario:  input[name="txtUserName"]
Password: input[name="txtPassword"]
Botón:    #btnSigIn
```

### Menú lateral (frameMenu = #left_page1)
```
// ⚠️ IMPORTANTE: div[@class='div-child' and @title='New'] existe 9 veces en el menú.
// SIEMPRE anclar al id del submenú padre para evitar ambigüedad.
Sales:       //div[@class='div-parent' and @title='Sales']
Sales > New: //ul[@id='subSales']//div[@class='div-child' and @title='New']
Order Entry: //ul[@id='sub1_New_10']//div[@class='div-subchild' and @title='Order Entry']

Inventory:             //div[@class='div-parent' and @title='Inventory']
Inventory > Tools:     //ul[@id='subInventory']//div[@class='div-child' and @title='Tools']
Production Reporting:  //ul[@id='sub1_Tools_12']//a[contains(@href,'ProductionReporting')]
  ⚠️ IMPORTANTE: usar el <a> (no el div) para que target="main" navegue el center_page

Production:            //div[@class='div-parent' and @title='Production']
Work Orders > List:    //ul[@id='subProduction']//div[@class='div-child' and @title='Work Orders']
```

### Sales Order Entry (frameCenter = #center_page)
```
Módulo cargado:  //div[@data-label='Sales_Order_Entry']
Customer input:  //input[@id='txtCustomer']
P.O. No.:        //input[@data-ng-model='currentOrder.PONumber' and not(contains(@class,'ng-hide'))]
Add Products:    //span[@data-label='AddProducts']
Quick Search:    //tr[@data-ng-click='addProductFromQuickSearch()']
Popup QS label:  //label[@id='apcOrder_lblQuickProductSearch']
Input búsqueda:  //input[@id='txtSearch']
Botón buscar:    //img[@id='btnSearch']
Botón Add popup: //input[@id='apcOrder_btncloseAndAddProduct']
Boxes (AG Grid): //input[@ng-model='data.Boxes']  — nth(fila-1)
FOB Price:       //input[@ng-model='data.Price']   — nth(fila-1)
Botón Save:      //button[@id='btnSave']
Toast éxito:     //div[contains(@class,'toast-success')]
Order No.:       //div[@id='divForm']/div[4]/div/div/label[2]/span
Spinner:         //div[contains(@class,'progessContainer') and @data-ng-show='IsLoading']
```

### Production Reporting (frameCenter = #center_page)
```
Módulo cargado:    //md-select-value[@id='select_value_label_0']  (Customer Group select)

Filtro Customer:   //md-select[@ng-model='$ctrl.filters.customersSelected']  ← click abre dropdown
  ⚠️ Es md-select Angular Material — NO un input de texto
  Después de abrir: //input[@ng-model='customersSelectFilter']  ← visible para filtrar
  Opción:           //md-option[contains(normalize-space(.),'texto')]
  Cerrar dropdown:  Escape (es multi-select, no cierra solo)

Botón Search:      //button[@class='mt-3 btn btn-sm btn-outline-primary btn-custom-secondary' and text()='Search']

Expand Customer/Task (AG Grid):
  //span[contains(@class,'ag-group-contracted') and not(contains(@class,'ag-hidden'))]
  ⚠️ ag-group-contracted SIN ag-hidden = ícono [+] visible

Expand Product Name (nivel producto, confirmado DevTools):
  //span[@class='ag-cell-wrapper ag-cell-expandable ag-row-group ag-row-group-indent-0 ng-scope']/span[2]
  ⚠️ span[2] = ag-group-contracted (el [+] del nivel producto)
  ⚠️ Requiere force:true — el ícono usa CSS ::before, dimensiones 0

Sub-tabla WO (dentro de Product Name expandido):
  Filas:     //div[@role='row' and .//div[normalize-space(.)='WO_NUMBER']]
  Checkbox:  input[type="checkbox"] en la misma fila del WO

Botón Start Reporting:
  //button[contains(@class,'btn-primary') and contains(normalize-space(.),'Start Reporting')]

Columnas AG Grid (col-id confirmados por DevTools):
  col-id="Selected"      → aria-colindex="4"  (expand + checkbox)
  col-id="OrderId"       → aria-colindex="5"
  col-id="CostingGroup"  → aria-colindex="6"
  col-id="BoxCode"       → aria-colindex="7"
  col-id="Boxes"         → aria-colindex="8"

⚠️ La columna "Costing Group" del KIT (EASTER GROWER PALLET) muestra ícono ℹ️, NO texto.
⚠️ "PROX" es el Box Type (col-id="BoxCode"), NO el Costing Group.
```

---

## shared-state.json — datos encadenados entre TCs

```json
{
  "lastOrderNo": "075649",
  "lastWorkOrderNo": "108011",
  "lastWorkOrderFinished": "108011"
}
```

---

## Estado actual de los TCs — Sprint 1

| TC | Descripción | Estado |
|---|---|---|
| TC-KIT-F1-001 | Crear Sales Order con KIT | ✅ VERDE |
| TC-KIT-F2-001 | Crear Work Order | ✅ VERDE |
| TC-KIT-F2-005 | Finalizar Work Order (STARTED→FINISHED) | ✅ VERDE |
| TC-KIT-F3-001 | KIT visible en Production Reporting + Start Reporting | ✅ VERDE |
| TC-KIT-F2-002 | WO NEW no aparece en Prod. Reporting | ⬜ Pendiente |
| TC-KIT-F2-003 | Start Work Order (NEW→STARTED) | ⬜ Pendiente |
| TC-KIT-F2-004 | WO STARTED no aparece en Prod. Reporting | ⬜ Pendiente |
| TC-KIT-F3-002 | Toggle Split activa vista por componente | 🚫 N/A — KIT siempre trae Split activo por defecto, no se puede desactivar |

---

## Flujo TC-KIT-F3-001 — Production Reporting (VERDE ✅)

```
Login
→ Inventory > Tools > Production Reporting  (clic en <a>, no en div)
→ Filtrar Customer: md-select click → filtro "F Guesstimate" → md-option → Escape
→ Search
→ expandirFila(0)                    ← Customer group
→ expandirFila(0)                    ← Task (House Made)
→ Verificar "EASTER GROWER PALLET" visible
→ Verificar "(0/" visible (WOs pending)
→ expandirTodosLosProductos()        ← span.ag-cell-expandable.../span[2] force:true
→ Verificar WO "108011" visible
→ seleccionarWorkOrderEnProducto()   ← checkbox en fila del WO
→ clickStartReporting()
```

---

## Plan de Pruebas KIT — PLAN-KIT-COMBO.md

Flujo completo del producto KIT en WebFlowers:
```
Sales Order Entry → Work Order (NEW→STARTED→FINISHED) → Production Reporting
```

**Regla crítica:** WO debe estar en FINISHED para aparecer en Production Reporting.

**25 TCs en 5 fases:**
- Fase 0: Precondiciones
- Fase 1: Sales Order Entry con KIT ← 1/5 VERDE
- Fase 2: Work Order ciclo de vida ← 2/7 VERDE
- Fase 3: Production Reporting — Split, cajas, Hardgoods ← 1/7 VERDE
- Fase 4: E2E + casos borde + KIT anidado

**Productos KIT activos en los tests:**
- `CBAT-N475` — Easter Grower Pallet (KIT con sub-KITs) — producto principal de prueba
- `CBAT-N476` — producto KIT secundario de prueba
- `BQMX-XG19` — WE 2-7 Pallet A (KIT con 12 componentes FG)
- `CBAT-X605` — GB SUN COMBO (sub-KIT de CBAT-N475)

---

## Reglas del proyecto

- **NUNCA** modificar: `BasePage.ts`, `base.fixture.ts`, `envConfig.ts`, `helpers.ts`, `dbHelper.ts`
- **SIEMPRE** importar test desde: `../../src/fixtures/base.fixture`
- **NUNCA** usar `networkidle` — WebFlowers mantiene conexiones permanentes
- **NUNCA** hardcodear datos — siempre desde JSON en `src/data/`
- Localizadores sin `id`: usar `data-ng-model` (patrón AngularJS de WebFlowers)
- Login usa `AuthTasks.login(user, pass)` — 2 parámetros, NO la URL

---

## Próximos pasos — Sprint 2

1. TC-KIT-F3-002 — 🚫 N/A (Split siempre activo en KITs)
2. TC-KIT-F3-003 — Validar fórmula de distribución de cajas (Components per box)
3. TC-KIT-F2-002/003/004 — Ciclo NEW→STARTED→FINISHED con validaciones negativas
4. Ampliar cobertura con productos CBAT-N475 y CBAT-N476

---

*Contexto actualizado: 2026-06-10 — Sesión de depuración TC-KIT-F3-001*
