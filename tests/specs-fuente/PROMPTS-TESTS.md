# Prompts fuente de pruebas - WebFlowers QA Automation

Actualizados contra los specs, Page Objects, configuraci?n y pol?tica de evidencias vigentes.

## Reglas comunes

- Playwright y TypeScript; separar specs, Pages, Tasks, fixtures y utilidades.
- Importar `test` y `expect` de `src/fixtures/base.fixture.ts`.
- Consumir URLs y credenciales mediante `ENV`; secretos solo en `.env`.
- Header: `iframe#top_Page2`; men?: `iframe#left_page1`; contenido: `iframe#center_page`.
  Para los campos de invoice se usa tambi?n `iframe[name="main"]`.
- Ejecutar secuencialmente: `workers: 1`, `fullyParallel: false`, `retries: 0`.
- Proyecto `Invoice` depende de `Procurement`: si REQ001 falla, REQ002 no inicia.
- Conservar capturas solo de PO/invoice generados y errores no mapeados, mediante
  `captureEvidence`. Las capturas autom?ticas de Playwright est?n desactivadas.
- Un `MappedApplicationError` mantiene el fallo sin captura. No clasificar un error
  desconocido como conocido solo porque su mensaje menciona una alerta conocida.
- Guardar Markdown, JSON y HTML mediante `writeEvidence` en `reports/diagnostics/`.
- El fixture verifica la conexi?n general a BD; el reporter intenta persistir m?tricas.
  Un fallo del servidor de m?tricas se registra y no modifica el resultado funcional.

## Ejecuci?n

```powershell
# Suite completa: REQ001, tres casos de login y REQ002; navegador visible.
npm run test:headed

# REQ001 seguido de REQ002, incluyendo la dependencia; navegador visible.
npm run test:po-invoice -- --headed

# Solo REQ002 con una PO existente v?lida del servidor configurado.
npx playwright test --project=Invoice --no-deps --headed

# Validaci?n de TypeScript.
npx tsc --noEmit
```

## Prompt fuente - Login exitoso

**Spec:** `tests/modulo-login/login-exitoso.spec.ts` ? **Proyecto:** `Login`

```text
@Workspace
Requerimiento: Login exitoso con credenciales v?lidas.
Datos: ENV.url, ENV.usuario y ENV.password desde el ambiente activo.
1. Navegar con LoginPage.navegarAlInicio().
2. Ingresar credenciales y pulsar Sign In.
3. Validar que no existe mensaje de rechazo de credenciales.
4. Validar #txtWFLabel y #headerWFLogoContainer en iframe#top_Page2.
5. Obtener el nombre visible del usuario y registrarlo como anotaci?n si existe.
Resultado: dashboard visible sin error de autenticaci?n.
Pages: LoginPage.ts y DashboardPage.ts. Fixture: base.fixture.ts.
No tomar capturas en este flujo exitoso. Capturar solo errores no mapeados.
```

## Prompt fuente - Login fallido con contrase?a incorrecta

**Spec:** `tests/modulo-login/login-fallido.spec.ts` ? **Proyecto:** `Login`

```text
@Workspace
Requerimiento: rechazo de credenciales incorrectas.
Datos: ENV.url y loginData.fallido de src/data/loginData.json.
1. Navegar con LoginPage.navegarAlInicio().
2. Enviar loginData.fallido.usuario y loginData.fallido.password.
3. Validar mensaje de error visible y texto no vac?o.
4. Validar que permanece en login.
Resultado: acceso rechazado; este rechazo esperado representa un test exitoso.
Page: LoginPage.ts. Fixture: base.fixture.ts.
No capturar el rechazo esperado. Capturar solo errores no mapeados del test.
```

## Prompt fuente - Login con campos vac?os

**Spec:** `tests/modulo-login/login-fallido.spec.ts` ? **Proyecto:** `Login`

```text
@Workspace
Requerimiento: validaci?n del formulario vac?o.
Datos: ENV.url y loginData.borde de src/data/loginData.json.
1. Navegar con LoginPage.navegarAlInicio().
2. Intentar login con usuario y contrase?a vac?os desde loginData.borde.
3. Validar que permanece en login.
4. Validar mensaje de error visible, no nulo y no vac?o.
Resultado: sin acceso al dashboard y con validaci?n visible.
Page: LoginPage.ts. Fixture: base.fixture.ts.
No capturar la validaci?n esperada. Capturar solo errores no mapeados del test.
```

## Prompt fuente - REQ001 New PO

```text
@Workspace

Modulo: Procurement / Products / New PO
Requerimiento: REQ001 - Generar PO
Spec: tests/modulo-procurement/REQ001-new-po.spec.ts
Proyecto Playwright: Procurement

Objetivo:
Crear una PO en Falcon Farms Texas (betafft), validar su n?mero y dejarlo
disponible para que REQ002 lo ingrese en P.O. No. del invoice en betacf.

Configuracion y datos:
- Ambiente de este flujo: BETA.
- URL: ENV.urlPO, cargada exclusivamente de BETAPO_URL en BETA.
- BETAPO_URL=https://betafft.ghtcorptest.com/(S(zrcegarp3jtssj5ozjh4zoe0))/Default_new.aspx
- Conservar el segmento de sesi?n. envConfig normaliza espacios y escapes de URL.
- Usuario y contrase?a: ENV.usuarioPO y ENV.passwordPO.
- En BETA usar BETAPO_USER y BETAPO_PASS; si faltan, usar BETA_USER y BETA_PASS.
- Mantener credenciales en .env y consumirlas mediante ENV; no incluirlas en prompts.
- Integration code: CBMC-C165.
- Vendor preferido: HOLEX; permitir un vendor v?lido de respaldo si no existe.
- Customer preferido: 10156083-6083 BC TEMPLE WAL-MART.
- Boxes: 6 (entero permitido entre 1 y 8).
- FOB Location Type: Miami, FL.
- Due Date y Vendor Shipment Date: fecha actual.
- Timeout total: 240000 ms.

Flujo:
1. Abrir ENV.urlPO con AuthTasks.loginEnUrl y autenticar con las credenciales PO.
2. Si el sitio rechaza el login, fallar indicando el hostname y el mensaje visible.
3. Validar #txtWFLabel y #headerWFLogoContainer en iframe#top_Page2.
4. Desde iframe#left_page1 navegar Procurement > Products > New PO.
5. En iframe#center_page esperar el encabezado exacto
   Procurement - New Purchase Order [Products].
6. Esperar el selector de Vendor visible hasta 90000 ms y el bot?n Save hasta
   30000 ms. La presencia del encabezado por s? sola no confirma la carga.
7. Validar Vendor, Order Type, Due Date, Vendor Shipment Date, Storage y Save.
8. Completar ambas fechas con la fecha actual.
9. Seleccionar HOLEX o el vendor v?lido de respaldo y registrar el seleccionado.
10. Si aparece el SweetAlert de sobrescritura de landed cost, aceptar
    Yes, overwrite! y esperar la carga antes de continuar.
11. Seleccionar Quick Search desde cmbAddProduct y esperar Search Quick Product.
12. Ingresar CBMC-C165 en #txtSearch, pulsar #btnSearch, seleccionar el resultado
    y agregarlo con Add. Validar el integration code en el panel inferior.
13. Ingresar 6 en Boxes y confirmar el valor.
14. Abrir Customer con doble clic en #lblCustomer0 o en la celda del producto.
    Seleccionar el customer preferido en #cmbHiddenCustomers; si no est? disponible
    o no queda visible, usar el respaldo v?lido implementado en el Page Object.
    Registrar el customer finalmente seleccionado.
15. Seleccionar FOB Location Type Miami, FL y registrar el resultado.
16. Pulsar Save una vez, esperar el fin de Working/carga y obtener la PO.
17. Validar que el n?mero de PO sea num?rico y conservar los ceros iniciales.
18. Guardar con guardarPOParaInvoice en src/data/REQ002-invoiceData.json:
    numeroPO, origen=REQ001, evidenciaOrigen, ambiente y urlOrigen=ENV.urlPO.
    evidenciaOrigen debe apuntar al resumen de esta ejecuci?n en reports/diagnostics.
19. Aceptar el popup de guardado si aparece.
20. Validar que el n?mero de PO visible coincida con el n?mero obtenido al guardar.
21. Solo entonces tomar REQ001-po-generada.png mediante captureEvidence.
22. Guardar y adjuntar REQ001-evidencia-flujo.md con resultado, detalle y duraci?n
    de los pasos mediante crearRegistroPasos y writeEvidence.

Resultado esperado:
PO guardada en betafft, numero numerico validado, datos de origen persistidos
para REQ002 y una unica captura final de la PO en esta ejecucion exitosa.

Arquitectura:
- Pages: DashboardPage.ts y REQ001-NewPOPage.ts.
- Tasks: AuthTasks.ts y ProcurementTasks.ts.
- Utilidades: envConfig.ts, purchaseOrderData.ts, stepEvidence.ts, evidence.ts.
- Importar test y expect desde src/fixtures/base.fixture.ts.
- No hay validaci?n funcional de la PO en BD; el fixture verifica la conexi?n general.

Evidencias:
- Imagen final: reports/screenshots/REQ001/<ejecuci?n>/REQ001-po-generada.png.
- Sin capturas de login, dashboard, pasos intermedios ni alertas conocidas resueltas.
- Ante errores no mapeados, el fixture captura las pesta?as abiertas con
  ERROR-NO-MAPEADO-pagina-*.png y adjunta las im?genes al reporte.
- Resumen y HTML de diagn?stico en reports/diagnostics/REQ001/<ejecuci?n>/.
- Un fallo de REQ001 impide iniciar el proyecto Invoice por su dependencia.
```

## Prompt fuente - REQ002 New Invoice

```text
@Workspace

Modulo: BETA Invoice / Invoices / New / Invoice
Requerimiento: REQ002 - Generar invoice de comercializadora
Spec: tests/modulo-beta-invoice/REQ002-new-invoice.spec.ts
Proyecto Playwright: Invoice; dependencia: Procurement

Objetivo:
Crear y guardar un invoice en betacf usando en P.O. No. el n?mero generado
por REQ001 en betafft, transferir inventario y capturar el invoice final validado.

Configuraci?n y datos:
- Ambiente de este flujo: BETA.
- URL: ENV.urlInvoice, desde BETAINVOICE_URL; si no est? definida, usar BETA_URL.
- BETAINVOICE_URL=https://betacf.ghtcorptest.com/(S(pok1gclilrzhqvvd0a0vxdor))/Default_new.aspx
- Conservar el segmento de sesi?n. No eliminar /(S(...))/ antes del login.
- Credenciales: ENV.usuario y ENV.password, desde BETA_USER y BETA_PASS.
- Customer: CF90008 / LOCAL CASH SALE - CALIFORNIA.
- Carrier: seleccionar (Others) y luego AAE - ARM AIR EXPRESS en Carrier Select.
- Inventory Type: S StandingOrders. Location: F Florida.
- Cantidades: [2, 2], dos filas distintas y 4 cajas en total.
- Cada cantidad debe ser un entero entre 2 y 6, con existencias suficientes.
- Timeout total: 240000 ms. Espera del resultado de cada Save: 60000 ms.

Precondicion y PO:
1. Cargar src/data/REQ002-invoiceData.json mediante
   cargarPOParaInvoice(ENV.ambiente, ENV.urlPO), al ejecutar el test.
2. Validar numeroPO numerico, origen=REQ001, ambiente compatible y urlOrigen
   con el mismo origin que ENV.urlPO. Rechazar datos de otro servidor o sin origen.
3. Usar el numero como cadena, conservando sus ceros iniciales. No usar una PO fija
   ni referencias de ejemplo. Registrar su evidenciaOrigen para trazabilidad.

Flujo:
1. Abrir ENV.urlInvoice y autenticar con AuthTasks.loginEnUrl.
2. Validar Favorites y .ght-icons.ght-icons-star-filled.wh-18 en iframe#left_page1.
3. Pulsar Invoices una vez mediante data-target="#subInvoices" y esperar
   #subInvoices visible. Expandir New y abrir Invoice.
4. Esperar el fin de .progessContainer.animate-show.animate-hide y validar
   Invoicing, Customer, cmbCarriers y btnInventory en iframe#center_page.
5. Si aparece User Reserved Lines, pulsar Restore to inventory con
   #userReservedLinesModal #btnCancelRestoreUserLines; esperar el cierre y la carga.
6. Ingresar CF90008 y seleccionar LOCAL CASH SALE - CALIFORNIA. Comprobar tambi?n
   si aparece User Reserved Lines tras seleccionar el customer y restaurar si aplica.
7. En cmbCarriers seleccionar (Others), esperar Carrier Select y seleccionar
   AAE - ARM AIR EXPRESS en cmbAllCarriersModal. Validar el cierre y el carrier.
8. Completar P.O. No. con numeroPO de REQ001 en el XPath exacto:
   //*[@id="divFormInvoicing"]/div[4]/div[2]/div[5]/div[2]/input
   Resolverlo dentro de iframe[name="main"], pulsar Tab y validar el valor.
9. Pulsar btnInventory y esperar la nueva pesta?a Add Inventory y el fin de carga.
10. Activar S StandingOrders y F Florida solo si no est?n activos; un segundo clic
    en una opci?n activa la desactiva. Validar el estado activo y esperar la carga.
11. Abrir el men? de .ag-header-cell[col-id="SlotNumber"] y la pesta?a filter.
12. Desmarcar (Blanks), cerrar con Escape y esperar hasta que haya filas y todos
    los slots renderizados est?n completos. No editar mientras se aplica el filtro.
13. Para cada cantidad de [2, 2], elegir una fila distinta con slot asignado y
    col-id="Pieces" mayor o igual a la cantidad. No usar ?ndices fijos o filas alternas.
14. Conservar row-id; editar col-id="Boxes" mediante el textbox Input Editor,
    completar la cantidad, confirmar con Enter y validar el texto de la celda.
15. Pulsar add_shopping_cart Add to. Esperar el fin de carga y que las celdas
    Boxes se vac?en o que sus filas desaparezcan de AG Grid tras la transferencia.
16. Pulsar west Back to Invoice y volver a la pesta?a principal.
17. Validar que la suma de col-id="NroBoxes" en gridInvoiceLines sea 4.
18. Verificar que invoiceHeader.InvoiceNumber est? vac?o y pulsar #btnSave.
19. Esperar un identificador no vac?o en invoiceHeader.InvoiceNumber o una alerta.
    El identificador puede ser alfanum?rico; no exigir que contenga solo d?gitos.
20. Aplicar la recuperaci?n de Carrier Account descrita abajo solo si corresponde.
21. Confirmar que existe el n?mero de invoice y que termin? el indicador de carga.
22. Validar el valor de invoiceHeader.InvoiceNumber contra el n?mero obtenido y
    invoiceHeader.CustomerPONumber contra numeroPO de REQ001.
23. Solo entonces capturar REQ002-invoice-generado.png con captureEvidence y
    adjuntarla al reporte. Registrar el n?mero de invoice como anotaci?n.

Alerta mapeada: Invalid carrier account number
- Detectarla como di?logo nativo, toast o SweetAlert visible, sin distinguir may?sculas.
- Cerrar o aceptar el aviso y esperar que desaparezca antes de corregir el campo.
- Generar 4 letras may?sculas aleatorias seguidas de 6 d?gitos aleatorios,
  concatenados sin espacios, por ejemplo ABCD123456; no usar ese ejemplo fijo.
- Completar Carrier Account dentro de iframe[name="main"] en el XPath exacto:
  //*[@id="divFormInvoicing"]/div[4]/div[2]/div[4]/div[2]/input
- Pulsar Tab y validar el valor ingresado. Reintentar Save una sola vez.
- Si vuelve a aparecer la misma alerta, fallar con MappedApplicationError;
  sigue siendo un test fallido y no genera captura por tratarse de un error mapeado.
- Otras alertas, timeouts o fallos durante la recuperaci?n son errores no mapeados;
  no repetir Save para ellos. El fixture conserva su captura.

Resultado esperado:
Invoice guardado en betacf, con el PO generado en betafft en P.O. No., 4 cajas
transferidas, identificador asignado y una ?nica captura final en el caso exitoso.
La PO se ingresa como referencia; las filas de inventario se eligen por stock y slot,
no mediante un filtro del n?mero de PO.

Arquitectura y diagn?sticos:
- Page: REQ002-NewInvoicePage.ts. Tasks: AuthTasks.ts y BetaInvoiceTasks.ts.
- Importar test y expect desde src/fixtures/base.fixture.ts.
- Usar crearRegistroPasos y writeEvidence para el resumen por paso.
- Guardar REQ002-evidencia-flujo.md y REQ002-red.json en
  reports/diagnostics/REQ002/<ejecucion>/; adjuntar el resumen al reporte.
- El registro de red incluye ruta, m?todo, estado, duraci?n y mensajes de timeout
  detectados; no persistir credenciales ni cuerpos completos de respuestas.
- Ante fallo, guardar HTML de la pagina principal y de Add Inventory en diagnostics.
- No hay validaci?n funcional del invoice en BD; el fixture verifica la conexi?n general.

Evidencias:
- Imagen final: reports/screenshots/REQ002/<ejecuci?n>/REQ002-invoice-generado.png.
- Sin capturas de login, pasos intermedios ni alertas conocidas resueltas.
- Errores no mapeados: ERROR-NO-MAPEADO-pagina-*.png de las pestañas abiertas.
- Capturas automaticas de Playwright desactivadas para evitar duplicados.
```
