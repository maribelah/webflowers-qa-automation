# TC-KIT-F2-001 — Crear Work Order vinculada a Sales Order con productos KIT

## Prompt original

@workspace /crear-test
Módulo: Production-Work Orders-New
Requerimiento: RC Margin
Funcionalidad: TC-KIT-F2-001-crear-work-orders
Pasos del flujo exitoso:
  1. Navegar a la URL del ambiente activo
  2. Ingresar usuario y contraseña desde el JSON de datos
  3. Hacer clic en el botón de ingresar
  4. Validar que carga el Dashboard
  5. Navegar a Production //div[@class='div-parent' and @title='Production']
  6. Work Orders //div[@class='div-child' and @title='Work Orders']
  7. New //ul[@id='sub3_Work_Orders_15']//div[@class='div-subchild' and @title='New']
  8. Validar módulo cargado //span[@class='pageHeader']
  9. Dar clic en el botón Add //input[@id='btnAddLine']
 10. Validar popup cargado //span[@id='spanTitle']
 11. En Date To ingresar fecha siguiente //input[@id='txtDateTo']
 12. En Order/P.O# ingresar Order No. de la Sales Order //input[@id='txtOrderNumber']
 13. Dar clic en Search //input[@id='btnSearch']
 14. Esperar spinner //div[@id='divProgress']
 15. Ingresar cajas línea 1 //input[@id='txtToAdd0'] — valor 10
 16. Ingresar cajas línea 2 //input[@id='txtToAdd1'] — valor 10
 17. Dar clic en Add to WO //input[@id='btnAddToCart']
 18. Esperar spinner
 19. Clic en Back To Order //input[@id='btnBackToOrder']
 20. Clic en pestaña Assign To //div[@id='divTab1']
 21. Seleccionar grupo //select[@id='cmbProductionGroupByBatch'] — primera opción
 22. Clic en Save //input[@id='btnSave'] — aceptar popup confirmación
 23. Leer WO No. //span[@id='lblWorkOrderNumber']
 24. Clic en Start //input[@id='btnStart'] — aceptar popup
     Nota: Si error "Production Group is working in other WorkOrder" → reintentar con siguiente grupo
Resultado esperado: Work Order creada e iniciada exitosamente
Validación BD: No aplica
Page Class disponible: WorkOrdersPage.ts
Datos de prueba disponibles: kit-workorders-data.json
NO MODIFICAR: BasePage.ts, base.fixture.ts, envConfig.ts, WorkOrdersPage.ts

Artefactos a generar:
  1. tests/modulo-kit/TC-KIT-F2-001-work-orders.spec.ts
  2. tests/specs-fuente/work-orders/TC-KIT-F2-001.md

---

## Análisis UI y localizadores

### Pantallas involucradas
- Login
- Menú lateral → Production → Work Orders → New
- Formulario Production - New/Edit Work Order (iframe #center_page)
- Popup Production - Search Order Lines (iframe #center_page)
- Pestaña Assign To del formulario

### Elementos y localizadores

#### Navegación (frameMenu = iframe #left_page1)
- **Production:** `//div[@class='div-parent' and @title='Production']`
- **Work Orders:** `//div[@class='div-child' and @title='Work Orders']` (primera coincidencia)
- **New:** `//ul[@id='sub3_Work_Orders_15']//div[@class='div-subchild' and @title='New']`

#### Formulario New/Edit Work Order (frameCenter)
- **Módulo cargado:** `//span[@class='pageHeader']`
- **WO No.:** `//span[@id='lblWorkOrderNumber']`
- **Botón Add:** `//input[@id='btnAddLine']`
- **Botón Save:** `//input[@id='btnSave']`
- **Botón Start:** `//input[@id='btnStart']`
- **Tab Assign To:** `//div[@id='divTab1']`
- **Select grupo:** `//select[@id='cmbProductionGroupByBatch']`

#### Popup Search Order Lines (frameCenter)
- **Título popup:** `//span[@id='spanTitle']`
- **Date To:** `//input[@id='txtDateTo']` — formato MM/DD/YYYY
- **Order/P.O.#:** `//input[@id='txtOrderNumber']`
- **Botón Search:** `//input[@id='btnSearch']`
- **Spinner:** `//div[@id='divProgress']`
- **Cajas línea 1:** `//input[@id='txtToAdd0']`
- **Cajas línea 2:** `//input[@id='txtToAdd1']`
- **Botón Add to WO:** `//input[@id='btnAddToCart']`
- **Botón Back to Order:** `//input[@id='btnBackToOrder']`

### Flujo esperado
1. Login
2. Navegar al módulo (3 clics del menú)
3. Clic Add → popup Search Order Lines
4. Ingresar Date To (mañana) y Order No.
5. Search → esperar spinner → ingresar cajas (10 c/u) → Add to WO
6. Back to Order → Assign To → seleccionar grupo → Save → aceptar popup
7. Leer WO No. → Start → aceptar popup (con retry si grupo ocupado)

### Notas técnicas
- **Order No.** se lee de `shared-state.json` generado por TC-KIT-F1-001
- **Retry logic:** si Start falla por grupo ocupado, reintentar hasta 5 veces con siguiente grupo
- Los popups pueden ser dialogs nativos del browser o modales Angular
- Spinner en Search Order Lines: `//div[@id='divProgress']` (diferente al de Sales Order Entry)
- Precondición: TC-KIT-F1-001 debe haber corrido antes en la misma sesión

---

*webflowers-qa-automation — tests/specs-fuente/work-orders/TC-KIT-F2-001.md*
*Generado: 2026-06-03*
