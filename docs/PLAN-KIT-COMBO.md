# Plan de Pruebas — Producto KIT / Combo + Production Reporting Multinivel
### WebFlowers QA Automation — Módulo Production
**Versión:** 2.0  
**Fecha:** 2026-06-10  
**Autor:** Juan David Parra — QA Automation  
**Estado:** En ejecución

---

## 1. Contexto y Alcance

### Flujo KIT obligatorio
Un **Producto KIT** (Combo / Pallet Combo) recorre **tres módulos** antes de poder ser reportado:

```
[Sales]               [Production]              [Inventory]
Sales Order Entry  →  Work Order (NEW)       →  Production Reporting
                   →  Work Order (STARTED)      (solo si WO = FINISHED)
                   →  Work Order (FINISHED) ✓
```

> **Regla de oro:** Sin WO en estado FINISHED no hay Production Reporting.

### Nuevo requerimiento — Production Reporting Multinivel (Fase 5)
El módulo de Production Reporting debe extender la lógica de split para soportar tres tipos de productos con reglas de consumo de inventario diferenciadas:

| Tipo | Consumo inventario entrada | Inventario generado | Split |
|---|---|---|---|
| **REGULAR** | Padre O hijos (usuario elige cuando ambos existen) | Padre | Opcional por componente |
| **KIT** | No tiene inventario propio — siempre componentes | Componentes individuales | Siempre activo, auto drill-down |
| **FINISHED GOOD** | Hijos obligatorio | Solo producto terminado padre | No configurable |

### Productos activos en los tests
- `CBAT-N475` — Easter Grower Pallet (KIT con sub-KITs)
- `CBAT-N476` — KIT secundario de prueba
- `BQMX-XG19` — WE 2-7 Pallet A (KIT con componentes FG)
- `CBAT-X605` — GB SUN COMBO (sub-KIT de CBAT-N475)

---

## 2. Estructura del Plan — Fases

```
FASE 0 — Precondiciones y datos de prueba
FASE 1 — Sales Order Entry con producto KIT
FASE 2 — Work Order: ciclo de vida NEW → STARTED → FINISHED
FASE 3 — Production Reporting: componentes, Split y Hardgoods
FASE 4 — Flujos E2E + casos borde + KIT anidado
FASE 5 — Production Reporting Multinivel (REGULAR / KIT / FINISHED GOOD)  ← NUEVO
```

---

## FASE 0 — Precondiciones y Datos de Prueba

### 0.1 Productos KIT requeridos

| Código | Nombre | Nivel | Usado en |
|---|---|---|---|
| `CBAT-N475` | Easter Grower Pallet | KIT raíz | Fase 1, 2, 3, 4, 5 |
| `CBAT-N476` | KIT secundario | KIT raíz | Fase 5 |
| `CBAT-X605` | GB SUN COMBO | Sub-KIT nivel 2 | Fase 4 |
| `BQMX-XG19` | WE 2-7 Pallet A | KIT raíz simple | Fase 1 |

### 0.2 Validación de BD

```sql
SELECT POId, Combold, Name
FROM tblProducts
WHERE Code IN ('CBAT-N475', 'CBAT-N476', 'BQMX-XG19', 'CBAT-X605')
  AND Combold IS NOT NULL;
```

---

## FASE 1 — Sales Order Entry con Producto KIT

### Casos de prueba FASE 1

#### TC-KIT-F1-001 — Crear Sales Order exitosa con KIT simple ✅ VERDE
- **Estado:** Automatizado y verde
- **Precondición:** `CBAT-N475` y `CBAT-N476` existen en catálogo
- **Resultado esperado:** Order No. generado, líneas KIT visibles
- **Validación BD:** `tblSalesOrders` contiene el Order No.

#### TC-KIT-F1-002 — Sales Order con KIT anidado (sub-KIT)
- **Pasos:** Igual que F1-001 con `CBAT-N475` (contiene sub-KITs)
- **Resultado esperado:** Panel Summary muestra Pieces y FEB calculados

#### TC-KIT-F1-003 — Sales Order con múltiples líneas KIT
- **Pasos:** Agregar 2 líneas con distintos KITs en la misma orden
- **Resultado esperado:** Ambas líneas en el grid; totales del Summary suman ambas

#### TC-KIT-F1-004 — Intentar crear SO sin Fac/Loc
- **Resultado esperado:** Error de validación; no genera Order No.

#### TC-KIT-F1-005 — Sales Order con Shipping Date pasada
- **Resultado esperado:** Advertencia o error de fecha inválida

---

## FASE 2 — Work Order: Ciclo de Vida NEW → STARTED → FINISHED

### Casos de prueba FASE 2

#### TC-KIT-F2-001 — Crear Work Order vinculada a Sales Order con KIT ✅ VERDE
- **Estado:** Automatizado y verde
- **Resultado esperado:** WO # generado, estado NEW, Start/Finish vacíos

#### TC-KIT-F2-002 — WO en estado NEW NO aparece en Production Reporting ⬜ Pendiente
- **Importancia:** ⭐⭐⭐ — Regla de negocio R-01
- **Resultado esperado:** La orden NO está disponible en Production Reporting

#### TC-KIT-F2-003 — Iniciar Work Order (NEW → STARTED) ⬜ Pendiente
- **Resultado esperado:** Campo Start completo, estado = STARTED

#### TC-KIT-F2-004 — WO en estado STARTED NO aparece en Production Reporting ⬜ Pendiente
- **Importancia:** ⭐⭐⭐ — Confirma que Start no es suficiente

#### TC-KIT-F2-005 — Finalizar Work Order (STARTED → FINISHED) ✅ VERDE
- **Estado:** Automatizado y verde
- **Resultado esperado:** Estado = FINISHED, FinishDate completo

#### TC-KIT-F2-006 — Intentar Finish sin haber hecho Start
- **Resultado esperado:** Sistema bloquea la acción

#### TC-KIT-F2-007 — WO con múltiples líneas KIT — Finish libera todas
- **Resultado esperado:** Ambas líneas disponibles en Production Reporting

---

## FASE 3 — Production Reporting: Componentes, Split y Hardgoods

### Casos de prueba FASE 3

#### TC-KIT-F3-001 — KIT visible en Production Reporting tras WO FINISHED ✅ VERDE
- **Estado:** Automatizado y verde — flujo completo con Start Reporting
- **Flujo automatizado:**
  ```
  Login → Inventory > Tools > Production Reporting
  → Filtrar Customer (md-select "F Guesstimate") → Search
  → Expandir Customer → Expandir Task (House Made)
  → Verificar EASTER GROWER PALLET visible con WOs pendientes
  → Expandir todos los productos → Seleccionar WO finalizada
  → Click Start Reporting → Verificar pantalla de detalle cargada
  ```
- **Caso de éxito:** div.d-flex.justify-content-between.align-items-center visible

#### TC-KIT-F3-002 — Toggle Split activa vista por componente 🚫 N/A
- **Motivo:** Los productos KIT siempre traen Split activo por defecto.
  No permite desactivarlo. Este TC no aplica.

#### TC-KIT-F3-003 — Validar fórmula distribución de cajas por componente ⬜ Pendiente
- **Precondición:** TC-KIT-F3-001 exitoso
- **Regla:** Bunches Total = Boxes × Pack (definido en Sales Order)
- **Validación:** Suma de Bunches de componentes = Pack por caja
- **Ejemplo:** 7 componentes (40+16+40+24+40+24+56 = 240 bunches/caja) × 10 cajas = 2400 total
- **Importancia:** ⭐⭐⭐ — Regla de negocio R-06

#### TC-KIT-F3-004 — Cambiar Method de componente: Product → Bulk ⬜ Pendiente
- **Resultado esperado:** Desglose a nivel stem/ingrediente

#### TC-KIT-F3-005 — Agregar Hardgood (Vase) a un componente específico ⬜ Pendiente
- **Resultado esperado:** Hardgood asignado al componente 001 (no al KIT padre)
- **Importancia:** ⭐⭐⭐ — Regla de negocio R-04

#### TC-KIT-F3-006 — Hardgood del componente 001 NO afecta al componente 002 ⬜ Pendiente
- **Importancia:** ⭐⭐⭐ — Regla de negocio R-04

#### TC-KIT-F3-007 — Generar Report de producción del KIT ⬜ Pendiente
- **Resultado esperado:** Reporte generado sin errores con todos los componentes

---

## FASE 4 — Flujos E2E + Casos Borde + KIT Anidado

### Casos de prueba FASE 4

#### TC-KIT-F4-001 — Flujo E2E completo con KIT simple (happy path) ⬜ Pendiente
- **Dataset:** `BQMX-XG19`

#### TC-KIT-F4-002 — Flujo E2E completo con KIT anidado ⬜ Pendiente
- **Dataset:** `CBAT-N475` (contiene sub-KIT `CBAT-X605`)

#### TC-KIT-F4-003 — KIT con componente sin Costing Group asignado ⬜ Pendiente
- **Resultado esperado:** Alerta de CG faltante; no genera reporte

#### TC-KIT-F4-004 — Recipe 1 (Sell Recipe) vs Recipe 2 (Sub-Assembly) ⬜ Pendiente

#### TC-KIT-F4-005 — Remaining de cajas negativo o cero (borde) ⬜ Pendiente

#### TC-KIT-F4-006 — WO con KIT cancelada antes de Finish ⬜ Pendiente

#### TC-KIT-F4-007 — Dos WOs para la misma línea de Sales Order con KIT ⬜ Pendiente

---

## FASE 5 — Production Reporting Multinivel (REGULAR / KIT / FINISHED GOOD) 🆕

> **Objetivo:** Validar que el módulo de Production Reporting determina correctamente
> el consumo de inventario según el tipo de Costing Group (REGULAR, KIT, FINISHED GOOD),
> garantizando trazabilidad, costeo correcto y consistencia del inventario multinivel.
>
> **Feature en desarrollo** — Aplica solo para método: **Producto**

### Módulo
`Inventory → Production Reporting → Detalle de componentes (Components per box)`

---

### Grupo A — Tipo REGULAR

#### TC-PR-F5-001 — Consumo desde producto PADRE en componente REGULAR ⬜ Pendiente
- **Precondición:** Componente con CG tipo REGULAR y stock disponible en el padre
- **Pasos:** En el componente REGULAR, seleccionar consumo desde **producto padre**
- **Resultado esperado:**
  - Inventario descontado del producto padre (armado recibido de finca/compras)
  - Trazabilidad registrada como consumo de padre
- **Regla:** R-REGULAR-01

#### TC-PR-F5-002 — Consumo desde HIJOS en componente REGULAR ⬜ Pendiente
- **Precondición:** Componente con CG tipo REGULAR y stock disponible en hijos
- **Pasos:** Activar Split a nivel de componente → seleccionar consumo desde **hijos**
- **Resultado esperado:**
  - Inventario descontado de los raw materials correspondientes
  - Trazabilidad completa del costing group mantenida
- **Regla:** R-REGULAR-02

#### TC-PR-F5-003 — Selección de origen cuando hay stock en padre E hijos (REGULAR) ⬜ Pendiente
- **Precondición:** Componente REGULAR con inventario disponible tanto en padre como en hijos
- **Pasos:** Verificar que el sistema presenta opción de elección al usuario
- **Resultado esperado:**
  - UI permite seleccionar: consumir del padre O de los hijos
  - El sistema no selecciona automáticamente — requiere decisión del usuario
- **Importancia:** ⭐⭐⭐ — Regla de negocio R-REGULAR-03

#### TC-PR-F5-004 — Mezcla de consumo padre + hijos en REGULAR ⬜ Pendiente
- **Pasos:** En una orden con múltiples componentes REGULAR, consumir algunos desde padre y otros desde hijos
- **Resultado esperado:**
  - Cada componente consume según la elección individual
  - El reporte final refleja correctamente la mezcla de orígenes

---

### Grupo B — Tipo KIT

#### TC-PR-F5-005 — Auto drill-down al mayor nivel de detalle en KIT ⬜ Pendiente
- **Precondición:** Componente con CG tipo KIT activo
- **Resultado esperado:**
  - Sistema baja automáticamente al mayor nivel de detalle disponible
  - Se mantiene la distribución de la receta del KIT (ej: 10 y 6, NO 8 y 8)
  - No se promedian ni redistribuyen las cantidades
- **Importancia:** ⭐⭐⭐ — Regla de negocio R-KIT-01

#### TC-PR-F5-006 — KIT no genera ni consume inventario físico propio ⬜ Pendiente
- **Resultado esperado:**
  - No se puede registrar entrada de inventario para el KIT como producto terminado
  - No se puede sacar el KIT como raw material
  - Solo se reportan los componentes individuales enlazados con el split
- **Importancia:** ⭐⭐⭐ — Regla de negocio R-KIT-02

#### TC-PR-F5-007 — KIT actúa únicamente como agrupador lógico ⬜ Pendiente
- **Resultado esperado:**
  - El KIT aparece en pantalla como agrupador visual
  - Los movimientos de inventario ocurren solo a nivel de sus componentes hijos
  - Trazabilidad muestra componentes, no el KIT padre

#### TC-PR-F5-008 — Distribución receta KIT respeta proporciones originales ⬜ Pendiente
- **Precondición:** KIT con receta definida (ej: comp1=10, comp2=6)
- **Resultado esperado:**
  - La distribución en Production Reporting mantiene 10 y 6
  - NO redistribuye a 8 y 8 (promedio)
  - El sistema respeta la receta original sin ajustes automáticos
- **Importancia:** ⭐⭐⭐ — Regla de negocio R-KIT-03

---

### Grupo C — Tipo FINISHED GOOD

#### TC-PR-F5-009 — FG consume componentes hijos obligatoriamente ⬜ Pendiente
- **Precondición:** Componente con CG tipo FINISHED GOOD
- **Resultado esperado:**
  - El sistema no presenta opción de consumir desde el padre
  - El consumo de inventario ocurre obligatoriamente desde los hijos del split
- **Importancia:** ⭐⭐⭐ — Regla de negocio R-FG-01

#### TC-PR-F5-010 — FG genera SOLO inventario del producto terminado final ⬜ Pendiente
- **Resultado esperado:**
  - El inventario generado corresponde únicamente al producto padre (FG final)
  - Los hijos no aparecen como productos terminados independientes
- **Importancia:** ⭐⭐⭐ — Regla de negocio R-FG-02

#### TC-PR-F5-011 — FG no permite reportar hijos como producto terminado ⬜ Pendiente
- **Pasos:** Intentar reportar un componente hijo de un FG como producto terminado
- **Resultado esperado:** Sistema bloquea la acción; mensaje de error o campo deshabilitado
- **Importancia:** ⭐⭐⭐ — Regla de negocio R-FG-03

#### TC-PR-F5-012 — FG no permite consumir padre como raw material ⬜ Pendiente
- **Pasos:** Intentar consumir el producto padre como insumo raw material en un FG
- **Resultado esperado:** Sistema no permite esta operación
- **Importancia:** ⭐⭐⭐ — Regla de negocio R-FG-04

#### TC-PR-F5-013 — FG respeta proporciones del split durante el reporte ⬜ Pendiente
- **Precondición:** FG con componentes con cantidades proporcionales en el split
- **Resultado esperado:**
  - Las proporciones se mantienen durante todo el reporte
  - No se redistribuyen arbitrariamente entre componentes
- **Importancia:** ⭐⭐⭐ — Regla de negocio R-FG-05

---

### Grupo D — Visualización e Indicadores UI

#### TC-PR-F5-014 — Badges visuales KIT / FG / REGULAR visibles en pantalla ⬜ Pendiente
- **Aplica:** A nivel de encabezado del pallet Y a nivel de cada componente
- **Resultado esperado:**
  - Badge verde `KIT` visible en componentes tipo KIT
  - Badge verde `FG` visible en componentes tipo Finished Good
  - Sin badge = REGULAR (comportamiento por defecto)
- **Importancia:** ⭐⭐ — Criterio de aceptación #11

#### TC-PR-F5-015 — Integration Code visible en todos los niveles ⬜ Pendiente
- **Resultado esperado:**
  - Integration Code mostrado en el header del componente
  - Integration Code mostrado en cada sub-item del split
  - Visible tanto para nivel padre como para niveles hijos
- **Importancia:** ⭐⭐ — Criterio de aceptación #12

#### TC-PR-F5-016 — Indicadores RM vs FG por componente ⬜ Pendiente
- **Resultado esperado:**
  - Cada componente indica visualmente cuáles sub-items son RM (raw materials)
  - Cada componente indica cuáles sub-items serán FG (producto terminado)
  - Consistente con la lógica aplicada en el módulo Bulk
- **Importancia:** ⭐⭐⭐ — Criterio de aceptación #13

#### TC-PR-F5-017 — Modal summary con RM, FG, units, avg cost y location ⬜ Pendiente
- **Pasos:** Abrir el modal de summary asociado a un componente
- **Resultado esperado:**
  - Modal muestra consumo de RM con unidades y avg cost
  - Modal muestra FG a reportar con unidades y avg cost
  - Modal incluye Location del inventario
  - Los datos del modal son consistentes con los valores de la pantalla principal
- **Importancia:** ⭐⭐⭐ — Criterio de aceptación #14

---

### Grupo E — Identificación Automática del Tipo

#### TC-PR-F5-018 — Sistema identifica automáticamente tipo REGULAR ⬜ Pendiente
- **Resultado esperado:** Al cargar el componente, el sistema detecta CG = REGULAR
  y presenta las opciones de consumo (padre o hijos) sin configuración manual

#### TC-PR-F5-019 — Sistema identifica automáticamente tipo KIT ⬜ Pendiente
- **Resultado esperado:** Al cargar el componente, badge KIT visible y drill-down automático
  sin intervención del usuario

#### TC-PR-F5-020 — Sistema identifica automáticamente tipo FINISHED GOOD ⬜ Pendiente
- **Resultado esperado:** Al cargar el componente, badge FG visible y consumo de hijos
  configurado automáticamente como obligatorio

---

## 3. Matriz de Cobertura

| ID | Regla de Negocio | TCs | Estado |
|---|---|---|---|
| R-01 | WO debe ser FINISHED para Prod. Reporting | F2-002, F2-004, F2-005 | F2-005 ✅ |
| R-02 | Flujo obligatorio SO → WO → Reporting | F4-001, F4-002 | Pendiente |
| R-03 | KIT = badge KIT, FG = badge FG | F3-001, F5-014 | F3-001 ✅ |
| R-04 | Hardgoods al componente, no al KIT padre | F3-005, F3-006 | Pendiente |
| R-05 | Suma bunches componentes = Pack por caja | F3-003 | Pendiente |
| R-06 | Bunches Total = Boxes × Pack (SO) | F3-003 | Pendiente |
| R-07 | KIT anidado hasta nivel 4 | F4-002, F5-005 | Pendiente |
| R-08 | Recipe 1 con Vase, Recipe 2 sin Vase | F4-004 | Pendiente |
| R-09 | Combold identifica combo en BD | F2-001 (BD) | F2-001 ✅ |
| R-10 | Fac/Loc determina el KDS | F1-004 | Pendiente |
| R-REGULAR-01 | REGULAR puede consumir del padre | F5-001 | Pendiente |
| R-REGULAR-02 | REGULAR puede consumir de los hijos | F5-002 | Pendiente |
| R-REGULAR-03 | Usuario elige origen cuando hay stock en ambos | F5-003 | Pendiente |
| R-KIT-01 | KIT drill-down respeta receta (no promedia) | F5-005, F5-008 | Pendiente |
| R-KIT-02 | KIT sin inventario físico propio | F5-006 | Pendiente |
| R-KIT-03 | KIT solo como agrupador lógico | F5-007 | Pendiente |
| R-FG-01 | FG consume hijos obligatoriamente | F5-009 | Pendiente |
| R-FG-02 | FG genera solo inventario del padre final | F5-010 | Pendiente |
| R-FG-03 | FG no reporta hijos como terminado | F5-011 | Pendiente |
| R-FG-04 | FG no consume padre como RM | F5-012 | Pendiente |
| R-FG-05 | FG respeta proporciones del split | F5-013 | Pendiente |

---

## 4. Métricas del Plan

| Métrica | Valor |
|---|---|
| Total TCs diseñados | 45 |
| Fases | 6 (0 a 5) |
| TCs automatizados y verdes | 4 (F1-001, F2-001, F2-005, F3-001) |
| TCs N/A | 1 (F3-002) |
| TCs pendientes | 40 |
| TCs de happy path | 12 |
| TCs de validación negativa | 11 |
| TCs de casos borde | 7 |
| TCs E2E | 5 |
| TCs con validación BD | 8 |
| TCs Fase 5 (nuevo feature) | 20 |

### Peso acumulado estimado (Size × Riesgo)

| Fase | Size | Riesgo | Peso |
|---|---|---|---|
| Fase 0 — Precondiciones | 2 | 2 — Medio | 4 |
| Fase 1 — Sales Order | 3 | 2 — Medio | 6 |
| Fase 2 — Work Order | 5 | 3 — Alto | 15 |
| Fase 3 — Production Reporting base | 8 | 3 — Alto | 24 |
| Fase 4 — E2E + Borde | 8 | 3 — Alto | 24 |
| Fase 5 — PR Multinivel (nuevo) | 13 | 3 — Alto | 39 |
| **Total** | | | **112** |

---

## 5. Orden de Automatización Recomendado

```
Sprint 1 — COMPLETADO ✅
  1. TC-KIT-F1-001  (Sales Order con KIT)           ✅
  2. TC-KIT-F2-001  (Crear WO)                      ✅
  3. TC-KIT-F2-005  (Finish WO)                     ✅
  4. TC-KIT-F3-001  (KIT en Prod. Reporting)         ✅

Sprint 2 — Validaciones base y fórmula (en curso)
  5. TC-KIT-F3-003  (Fórmula Bunches = Boxes × Pack)
  6. TC-KIT-F2-002  (NEW no aparece en Prod. Reporting)
  7. TC-KIT-F2-004  (STARTED no aparece en Prod. Reporting)
  8. TC-KIT-F4-001  (E2E simple)

Sprint 3 — Hardgoods y casos borde
  9. TC-KIT-F3-005  (Add Hardgood)
  10. TC-KIT-F3-006 (Hardgood aislado por componente)
  11. TC-KIT-F4-002 (E2E anidado)
  12. TC-KIT-F2-003 (Start WO NEW→STARTED)

Sprint 4 — Fase 5: UI y Visualización (cuando feature esté en ALPHA)
  13. TC-PR-F5-014  (Badges KIT/FG/REGULAR)
  14. TC-PR-F5-015  (Integration Code en todos los niveles)
  15. TC-PR-F5-016  (Indicadores RM vs FG)
  16. TC-PR-F5-017  (Modal summary)

Sprint 5 — Fase 5: Reglas de negocio REGULAR y KIT
  17. TC-PR-F5-001  (REGULAR consume padre)
  18. TC-PR-F5-002  (REGULAR consume hijos)
  19. TC-PR-F5-003  (Selección usuario cuando stock en ambos)
  20. TC-PR-F5-005  (KIT auto drill-down)
  21. TC-PR-F5-006  (KIT sin inventario propio)
  22. TC-PR-F5-008  (KIT respeta receta)

Sprint 6 — Fase 5: Reglas de negocio FINISHED GOOD
  23. TC-PR-F5-009  (FG consume hijos obligatorio)
  24. TC-PR-F5-010  (FG genera solo inventario padre)
  25. TC-PR-F5-011  (FG no reporta hijos como terminado)
  26. TC-PR-F5-012  (FG no consume padre como RM)
  27. Restantes Fase 5
```

---

## 6. Page Classes y Helpers

| Archivo | Estado | Prioridad |
|---|---|---|
| `src/pages/SalesOrderEntryPage.ts` | ✅ Funcional | Sprint 1 |
| `src/pages/ListWorkOrdersPage.ts` | ✅ Funcional | Sprint 1 |
| `src/pages/WorkOrdersPage.ts` | ✅ Funcional | Sprint 1 |
| `src/pages/ProductionReportingPage.ts` | ✅ Funcional | Sprint 1 |
| `src/data/kit-salesorder-data.json` | ✅ Creado | Sprint 1 |
| `src/data/kit-production-data.json` | ✅ Creado | Sprint 1 |
| `src/pages/ProductionReportingMultinivel.ts` | ⬜ Pendiente | Sprint 4 |
| `src/data/kit-multinivel-data.json` | ⬜ Pendiente | Sprint 4 |
| `src/utils/kitHelper.ts` | ⬜ Pendiente | Sprint 4 |

---

*Plan actualizado: 2026-06-10 — v2.0*  
*Incluye requerimiento Production Reporting Multinivel (Regular/KIT/Finished Good)*  
*Validar con el equipo de negocio los valores exactos de cada tipo de CG en ambiente ALPHA.*
