# TC-KIT-F2-005 — Finalizar Work Order (STARTED → FINISHED)

## Prompt original

@workspace /crear-test
Módulo: Production-Work Orders-List
Requerimiento: RC Margin
Funcionalidad: TC-KIT-F1-001-finalizar-wokr-orders
Pasos del flujo exitoso:
  1. Navegar a la URL del ambiente activo
  2. Ingresar usuario y contraseña desde el JSON de datos
  3. Hacer clic en el botón de ingresar
  4. Validar que carga el Dashboard
  5. Navegar a Sales //div[@class='div-parent' and @title='Production']
  6. Work Orders //div[@class='div-child' and @title='Work Orders']
  7. New //ul[@id='sub3_Work_Orders_15']//div[@class='div-subchild' and @title='List']
  8. Validar módulo cargado //span[@class='pageHeader']
  9. Ingresar el número de la WO creada en el campo Search Text //input[@id='txtSearchText']
 10. Dar clic en el botón Edit //input[@type='button' and @value='Edit']
 11. Validar módulo cargado //span[@class='pageHeader']
 12. Dar clic en el botón Finish //input[@id='btnFinish']
 13. El sistema abre un Pop pup con el mensaje WARNING: Do you want to Finish Work Order?, Aceptar
 14. Luego se debe levantar otro Pop pup: Work Order has been finished successfully!, Aceptar
 15. Se debe mostrar una marca de agua //div[@id='divLookHead']/img
Resultado esperado: El sistema finaliza exitosamente una orden de trabajo
Validación BD: No aplica
Page Class disponible: ListWorkOrdersPage.ts
Datos de prueba disponibles: kit-ListWorkOrders-data.json
NO MODIFICAR: BasePage.ts, base.fixture.ts, envConfig.ts, WorkOrdersPage.ts

---

## Análisis UI y localizadores

### Pantallas involucradas
- Login
- Menú lateral → Production → Work Orders → List
- Formulario Production - Work Orders List (iframe #center_page)
- Formulario Production - Edit Work Order (iframe #center_page)

### Elementos y localizadores

#### Navegación (frameMenu = iframe #left_page1)
- **Production:** `//div[@class='div-parent' and @title='Production']`
- **Work Orders:** `//div[@class='div-child' and @title='Work Orders']` (primera coincidencia)
- **List:** `//ul[@id='sub3_Work_Orders_15']//div[@class='div-subchild' and @title='List']`

#### Formulario List (frameCenter)
- **Módulo cargado:** `//span[@class='pageHeader']`
- **Search Text:** `//input[@id='txtSearchText']`
- **Botón Edit:** `//input[@type='button' and @value='Edit']`

#### Formulario Edit Work Order (frameCenter)
- **Módulo cargado:** `//span[@class='pageHeader']`
- **Botón Finish:** `//input[@id='btnFinish']`
- **Marca de agua FINISHED:** `//div[@id='divLookHead']/img`

#### Popups (dialogs nativos del browser)
- **Popup 1:** "WARNING: Do you want to Finish Work Order?" → `dialog.accept()`
- **Popup 2:** "Work Order has been finished successfully!" → `dialog.accept()`

### Flujo esperado
1. Login
2. Navegar al módulo List (3 clics del menú)
3. Ingresar WO No. en Search Text → buscar
4. Clic Edit → formulario de edición cargado
5. Clic Finish → aceptar popup WARNING → aceptar popup de éxito
6. Validar marca de agua `divLookHead/img` visible

### Notas técnicas
- **WO No.** se lee de `shared-state.json.lastWorkOrderNo` generado por TC-KIT-F2-001
- Los dos popups son dialogs nativos del browser — se registran con `page.once('dialog')`
- El popup 2 (éxito) puede tardar unos segundos después del primero
- Al finalizar, se escribe `lastWorkOrderFinished` en `shared-state.json` para TC-KIT-F3-001
- **Precondición:** TC-KIT-F2-001 debe haber corrido antes — WO debe estar en estado STARTED

---

*webflowers-qa-automation — tests/specs-fuente/work-orders/TC-KIT-F2-005.md*
*Generado: 2026-06-04*
