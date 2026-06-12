# TC-KIT-F1-001 — Crear Sales Order con productos KIT

## Prompt original

@workspace /crear-test
Módulo: Sales-New-Order-Entry
Requerimiento: RC Margin
Funcionalidad: TC-KIT-F1-001-crear-sales-order
Pasos del flujo exitoso:
  1. Navegar a la URL del ambiente activo
  2. Ingresar usuario y contraseña desde el JSON de datos
  3. Hacer clic en el botón de ingresar
  4. Validar que carga el Dashboard
  5. Navegar a Sales //div[@class='div-parent' and @title='Sales']
  6. New //ul[@id='subSales']//div[@class='div-child' and @title='New']
  7. Order Entry //ul[@id='sub1_New_10']//div[@class='div-subchild' and @title='Order Entry']
  8. Validar módulo cargado //div[@data-label='Sales_Order_Entry']
  9. Customer: //input[@id='txtCustomer'], escribir "TRADER JOE" y seleccionar la opción
     Shipping Date: //input[@data-ng-model='currentOrder.DueDate'], fecha actual+1 día MM/DD/YYYY
     Carrier: //label[@data-label='Carrier']/following-sibling::div//select, primera opción
     P.O. No.: //input[@data-ng-model='currentOrder.PONumber' and not(contains(@class,'ng-hide'))]
  10. Agregar productos via Quick Search (CBAT-N475 y BQMX-XG19)
      Add Products: //span[@data-label='AddProducts']
      Quick Search: //tr[@data-ng-click='addProductFromQuickSearch()']
      Popup: //label[@id='apcOrder_lblQuickProductSearch']
      Buscar: //input[@id='txtSearch'] + //img[@id='btnSearch']
      Fila resultado: //div[@id='divResultsGrid']//tr[td[contains(.,codigo)]]
      Add: //input[@id='apcOrder_btncloseAndAddProduct']
      Boxes: //input[@ng-model='data.Boxes'] nth(0) y nth(1) — valor 10
      FOB Price: //input[@ng-model='data.Price'] nth(0) y nth(1) — valor 12
  11. Save //button[@id='btnSave']
  12. Esperar spinner //div[contains(@class,'progessContainer') and @data-ng-show='IsLoading']
  13. Cerrar toast //div[contains(@class,'toast-success')]
  14. Leer Order No. //div[@id='divForm']/div[4]/div/div/label[2]/span
  15. Validar que Order No. es numérico y distinto de vacío
Resultado esperado: El sistema guarda exitosamente una orden de venta
Validación BD: No aplica
Page Class disponible: SalesOrderEntryPage.ts
Datos de prueba disponibles: kit-salesorder-data.json
NO MODIFICAR: BasePage.ts, base.fixture.ts, envConfig.ts, SalesOrderEntryPage.ts

Artefactos a generar:
  1. tests/modulo-kit/TC-KIT-F1-001-crear-sales-order.spec.ts
  2. tests/specs-fuente/sales-order-entry/TC-KIT-F1-001.md
     Formato: igual a tests/specs-fuente/sales-order-entry/REQ-001.md
     Incluir sección "Prompt original" con este prompt
     Incluir sección "Análisis UI y localizadores" con todos los localizadores documentados

---

## Análisis UI y localizadores

### Pantallas involucradas
- Login
- Dashboard
- Menú lateral → Sales → New → Order Entry
- Formulario Sales - Order Entry (iframe #center_page)
- Popup Quick Search (dentro de #center_page)

### Elementos y localizadores clave

#### Navegación (frameMenu = iframe #left_page1)
- **Sales:** `//div[@class='div-parent' and @title='Sales']`
- **New:** `//ul[@id='subSales']//div[@class='div-child' and @title='New']`
- **Order Entry:** `//ul[@id='sub1_New_10']//div[@class='div-subchild' and @title='Order Entry']`

#### Formulario (frameCenter = iframe #center_page)
- **Módulo cargado:** `//div[@data-label='Sales_Order_Entry']`
- **Customer input:** `//input[@id='txtCustomer']`
- **Customer opción:** `//div[@class='userDiv userDivLines']`
- **Shipping Date:** `//input[@data-ng-model='currentOrder.DueDate']`
- **Carrier:** `//label[@data-label='Carrier']/following-sibling::div//select`
- **P.O. No.:** `//input[@data-ng-model='currentOrder.PONumber' and not(contains(@class,'ng-hide'))]`
- **Add Products:** `//span[@data-label='AddProducts']`
- **Quick Search:** `//tr[@data-ng-click='addProductFromQuickSearch()']`
- **Popup QS:** `//label[@id='apcOrder_lblQuickProductSearch']`
- **Input búsqueda:** `//input[@id='txtSearch']`
- **Botón buscar:** `//img[@id='btnSearch']`
- **Fila resultado:** `//div[@id='divResultsGrid']//tr[td[contains(normalize-space(.),codigo)]]`
- **Botón Add popup:** `//input[@id='apcOrder_btncloseAndAddProduct']`
- **Boxes AG Grid:** `//input[@ng-model='data.Boxes']` — nth(linea-1)
- **FOB Price AG Grid:** `//input[@ng-model='data.Price']` — nth(linea-1)
- **Save:** `//button[@id='btnSave']`
- **Spinner:** `//div[contains(@class,'progessContainer') and @data-ng-show='IsLoading']`
- **Toast éxito:** `//div[contains(@class,'toast-success')]`
- **Cerrar toast:** `//button[contains(@class,'toast-close-button')]`
- **Order No.:** `//div[@id='divForm']/div[4]/div/div/label[2]/span`

### Flujo esperado
1. Login con `ENV.usuario` / `ENV.password`
2. Navegar al módulo con los 3 clics del menú
3. Ingresar Customer (4 chars + selección del dropdown)
4. Ingresar Shipping Date (fecha actual + 1 día, formato MM/DD/YYYY)
5. Seleccionar Carrier (primera opción disponible)
6. Ingresar P.O. No.
7. Agregar CBAT-N475 vía Quick Search (buscar → clic fila → Add)
8. Agregar BQMX-XG19 vía Quick Search (menú sigue abierto → buscar → clic fila → Add)
9. Ingresar Boxes (10) y FOB Price (12) en ambas líneas
10. Save → esperar spinner → cerrar toast → leer Order No.

### Notas
- `networkidle` NO funciona en WebFlowers — usar `domcontentloaded` y `esperarCargaModulo()`
- El spinner tiene un typo: `progessContainer` (sin 'r') — así está en el código real de WebFlowers
- El toast dice "Order saved successfully" — NO incluye el Order No.
- El segundo producto NO requiere re-clicar "Add Products" — el menú permanece abierto
- Hay 2 inputs de P.O. No. condicionales — usar `not(contains(@class,'ng-hide'))`
- `div[@class='div-child' and @title='New']` existe 9 veces — anclar a `#subSales`
- Timeout del test: 180000ms (3 min) — flujo completo con dos productos KIT

---

*webflowers-qa-automation — tests/specs-fuente/sales-order-entry/TC-KIT-F1-001.md*
*Test confirmado — Orders 075615, 075616, 075617, 075618, 075619, 075620, 075621 creadas en ALPHA*
*Generado: 2026-06-03*
