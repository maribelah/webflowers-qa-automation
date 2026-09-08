# Bulk Changes - Cambio masivo de Box Code

## Prompt original

@workspace /crear-test
Modulo: Sales
Requerimiento: Bulk Changes
Funcionalidad: Validar flujo principal de Bulk Changes para buscar una orden, seleccionar un registro que tenga al menos un BOX CODE disponible diferente al actual, aplicar cambio masivo de BOX CODE y verificar el valor aplicado en Order Entry y Asignacion de ordenes.

Pasos del flujo exitoso:
  1. Navegar a la URL del ambiente activo usando ENV.url.
  2. Iniciar sesion con ENV.usuario y ENV.password.
  3. Navegar en el menu a Sales -> Bulk Changes.
  4. Ejecutar Search sin ajustar fechas.
  5. Seleccionar el checkbox del primer registro y capturar el Order Reference.
  6. Esperar 10 segundos y hacer click en el elemento indicado del formulario.
  7. Seleccionar Box Code desde el dropdown.
  8. Seleccionar el segundo codigo que aparezca; si coincide con el Box Code actual de la fila, seleccionar el siguiente codigo disponible.
  9. Si el registro seleccionado no tiene ningun Box Code disponible diferente al actual, desmarcarlo, validar la siguiente fila visible y repetir la evaluacion hasta encontrar una Order Reference valida.
  10. Si al recorrer toda la pantalla no existe una fila que cumpla la condicion, finalizar con el mensaje: "No es posible encontrar una Order Reference que cumpla con las condiciones para realizar la prueba".
  11. Guardar el valor Box.
  12. Hacer click en Apply y confirmar el guardado.
  13. Navegar a Sales -> New -> Order Entry.
  14. Buscar la orden usando el prefijo del Order Reference capturado.
  15. Validar que el valor Box asignado se visualice en Order Entry.
  16. Abrir BETA GR y navegar a Compras -> Asignacion de ordenes.
  17. Buscar la orden capturada y validar que el campo Caja coincida con el valor Box asignado en QU desde el modulo Bulk Changes.
  18. Si Caja no coincide, refrescar la busqueda hasta 5 intentos.
  19. Cuando el valor de Caja coincida, cerrar las paginas del navegador y finalizar el test.

Resultado esperado:
El cambio masivo de Box Code se aplica correctamente sobre una orden que tenga al menos una opcion de Box Code diferente al valor actual, y el valor se refleja en Order Entry y en Asignacion de ordenes. Si no existe una Order Reference visible que cumpla la condicion, el test debe finalizar con el mensaje controlado definido.

Validacion BD: No aplica
Page Class disponible: No crear Page Class; implementar navegacion con frames y localizadores resilientes dentro del spec.
Datos de prueba disponibles: Usar ENV desde src/utils/envConfig.ts.
NO MODIFICAR: BasePage.ts, base.fixture.ts, envConfig.ts, helpers.ts

Artefactos generados:
  1. tests/modulo-bulkchanges/bulk-changes_Box code.spec.ts
  2. tests/specs-fuente/modulo-bulkchanges/bulk-changes_Box code.md

---

## Analisis UI y localizadores

### Pantallas involucradas
- Login WebFlowers
- Menu lateral WebFlowers: Sales -> Bulk Changes
- Bulk Changes dentro de iframe #center_page
- Modal Set Box Code Parameters
- Sales -> New -> Order Entry
- BETA GR: Compras -> Asignacion de ordenes

### Datos y variables del flujo
- Credenciales y URL: `ENV.url`, `ENV.usuario`, `ENV.password`
- `orderReferenceCapturado`: prefijo de 6 caracteres extraido desde Bulk Changes, formato `XX####`
- `orderReferenceCompletoCapturado`: referencia completa capturada desde el primer registro que cumpla la condicion de tener un Box Code disponible diferente al actual
- `valorBoxCodeActual`: Box Code capturado desde la fila seleccionada antes de aplicar el cambio
- `valorBoxCodeAsignado`: codigo seleccionado desde el select del modal `Set Box Code Parameters`, iniciando en el segundo codigo disponible, saltando al siguiente si coincide con `valorBoxCodeActual`, y recorriendo filas visibles si el registro actual no tiene una opcion diferente
- `maxIntentosAsignacion`: 5 intentos para validar `Caja`
- Documento de evidencia: `C:\Users\DianaSPS\Documents\Pruebas Bulk Changes\Bulk-changes_BoxCode_AAAAMMDD.docx`

### Navegacion inicial
- URL ambiente activo: `page.goto(ENV.url, { waitUntil: 'domcontentloaded' })`
- Usuario login: `input[name="txtUserName"]`
- Password login: `input[name="txtPassword"]`
- Boton login: `#btnSigIn`
- Menu lateral: `iframe#left_page1`
- Sales:
  - `div[data-toggle="collapse"][data-target="#subSales"]`
  - texto exacto `Sales`
  - `xpath=//*[normalize-space()="Sales"]`
- Bulk Changes:
  - `a.link:has-text("Bulk Changes")`
  - `div.div-child[title="Bulk Changes"] a.link`
  - `span.label-text:text-is("Bulk Changes")`
  - texto exacto `Bulk Changes`
  - `xpath=//*[normalize-space()="Bulk Changes"]`

### Bulk Changes
- Frame principal del modulo: `iframe#center_page`
- Boton Search: `xpath=/html/body/div/div/form/div[2]/button`
- Validacion posterior a Search: buscar texto con formato `[A-Z]{2}\d{4}`
- Checkbox primer registro:
  - `xpath=/html/body/div/div/div[1]/div/div[1]/div[2]/div[2]/div/div[1]/div[2]/span/input`
- Filas visibles evaluables:
  - `.MuiDataGrid-row`
  - `[role="row"][data-rowindex]`
  - checkbox por fila: `input[type="checkbox"]`
- Elemento que abre dropdown de campos:
  - `xpath=/html/body/div/div/div[2]/div/div[1]/span/span[2]/span/div/div/div`
- Opcion Box Code:
  - `xpath=/html/body/div[2]/div[3]/ul/li[normalize-space()="Box Code"]`
  - `xpath=/html/body/div[2]/div[3]/ul/li[contains(normalize-space(),"Box Code")]`
  - texto exacto `Box Code`
- Modal de parametros:
  - titulo visible `Set Box Code Parameters`
  - select visible: `select:visible`
  - se leen los `option` del select
  - se intenta seleccionar el segundo codigo disponible con `selectOption`
  - si el segundo codigo coincide con el Box Code actual de la fila, se selecciona el siguiente codigo disponible
  - se valida que exista un Box Code diferente al actual antes de guardar
  - si no hay un Box Code diferente para la fila seleccionada, se cierra el modal con `Escape`, se desmarca la fila actual, se marca la siguiente fila visible y se abre nuevamente el formulario `Box Code`
  - se repite la evaluacion hasta encontrar una fila valida o hasta terminar las filas visibles de la pantalla
  - error controlado cuando ninguna fila cumple: `No es posible encontrar una Order Reference que cumpla con las condiciones para realizar la prueba`
- Boton Save del modal:
  - boton visible con texto `Save`
- Boton Apply:
  - `xpath=/html/body/div/div/div[2]/div/div[3]/span/span[2]/span/button`

### Confirmacion de Apply
- Se consideran indicadores de exito visibles en el frame:
  - textos `success`, `successfully`, `completed`, `applied`, `updated`, `saved`
  - clases `success`, `toast-success`, `MuiAlert-standardSuccess`
- Se considera proceso completado si:
  - el boton Apply deja de estar visible
  - el texto del boton cambia
  - el boton ya no existe en el DOM
  - el HTML final contiene indicadores de exito
- Timeout maximo de confirmacion: 90 segundos
- Evidencias:
  - `reports/screenshots/10a-antes-apply.png`
  - `reports/screenshots/10b-despues-apply-click.png`
  - `reports/screenshots/10c-estado-final-apply.png`
  - `reports/html/10-apply-final.html`

### Order Entry
- Navegacion:
  - Sales: `div[data-toggle="collapse"][data-target="#subSales"]`
  - New: `div[data-toggle="collapse"][data-target="#sub0_New_10"]`
  - Order Entry:
    - `a.link:has-text("Order Entry")`
    - `span.label-text:text-is("Order Entry")`
    - texto exacto `Order Entry`
    - `xpath=//*[normalize-space()="Order Entry"]`
- Search input Order Entry:
  - `xpath=/html/body/form/div[3]/div[3]/div[1]/input`
- Busqueda:
  - llenar con `orderReferenceCapturado`
  - presionar `Enter`
- Validacion Box Code:
  - se leen elementos visibles `input`, `td`, `th`, `span` y `div` dentro de `iframe#center_page`
  - se toma `value`, `textContent`, `title` o `aria-label`
  - se normaliza el texto eliminando espacios repetidos y pasando a mayusculas
  - se compara contra `valorBoxCodeAsignado`
  - si el valor aun no aparece despues de la primera busqueda, se reintenta la busqueda en Order Entry hasta 5 intentos
  - entre reintentos se espera 30 segundos para permitir propagacion del cambio aplicado
- Evidencias:
  - `reports/html/12-order-entry.html`
  - `reports/html/12-order-entry-box-code-values.json`
  - `reports/html/12-order-entry-box-code-values-intento-{intento}.json`
  - `reports/screenshots/12-order-entry.png`
  - `reports/screenshots/12-order-entry-frame.png`
  - `reports/screenshots/12-order-entry-refresh-{intento}.png`

### BETA GR - Asignacion de ordenes
- URL fija: `https://betagr.ghtcorptest.com/`
- Navegacion BETA GR:
  - se realizan hasta 3 intentos si la pagina devuelve `404 Web Site not found`
- Login BETA GR:
  - `input[name="txtUserName"]`
  - `input[name="txtPassword"]`
  - `#btnSigIn`
- Menu Compras:
  - texto exacto `Compras`
  - `xpath=//*[normalize-space()="Compras"]`
  - `xpath=/html/body/form/div[3]/div/div/div[1]/ul/li[8]/div/div/div`
- Asignacion de ordenes:
  - texto `/Asignaci[oó]n(?: de)? Orden/i`
  - `xpath=//*[contains(translate(normalize-space(), "Óó", "Oo"), "Asignacion Orden") or contains(translate(normalize-space(), "Óó", "Oo"), "Asignacion de ordenes")]`
  - `xpath=/html/body/form/div[3]/div/div/div[1]/ul/li[8]/div/ul/li[1]/div/a/div/span`

### Filtros de Asignacion de ordenes
- Frame de asignacion: `iframe#center_page`
- Prefijo orden:
  - `xpath=/html/body/form/div[3]/div[1]/table/tbody/tr[1]/td/table/tbody/tr/td[1]/table/tbody/tr[4]/td[2]/input`
- Filtro Todos:
  - `xpath=/html/body/form/div[3]/div[1]/table/tbody/tr[1]/td/table/tbody/tr/td[1]/table/tbody/tr[1]/td[7]/div[2]/div[1]/div[1]/input`
- Filtro Fecha:
  - se ubica el selector asociado al label visible `Fecha`
  - si no hay ordenes despues de buscar por prefijo con `Todos`, se selecciona `UC`
  - despues de cambiar a `UC`, se ejecuta `Actualizar` nuevamente antes de validar `Caja`
- Fecha desde calendario:
  - `xpath=/html/body/form/div[3]/div[1]/table/tbody/tr[1]/td/table/tbody/tr/td[1]/table/tbody/tr[3]/td[6]/img`
- Fecha desde input:
  - `xpath=/html/body/form/div[3]/div[1]/table/tbody/tr[1]/td/table/tbody/tr/td[1]/table/tbody/tr[3]/td[6]/input`
- Fecha hasta input:
  - `xpath=/html/body/form/div[3]/div[1]/table/tbody/tr[1]/td/table/tbody/tr/td[1]/table/tbody/tr[4]/td[6]/input`
- Boton Actualizar:
  - `xpath=/html/body/form/div[3]/div[1]/table/tbody/tr[2]/td/table/tbody/tr/td[1]/div/input[1]`
- Overlays de carga:
  - `#divBackground`
  - `#backgroundLoadingMain`

### Validacion Caja
- Se buscan elementos visibles `td`, `th`, `span`, `div` e `input`.
- Se localizan encabezados que coincidan con `/^(caja|box|box code):?$/i`.
- Se extraen valores ubicados debajo del encabezado y alineados horizontalmente con esa columna.
- No se compara contra todos los textos visibles de la pantalla, para evitar falsos positivos con valores como `FBE`.
- Se normalizan los valores eliminando espacios repetidos y pasando a mayusculas.
- Se compara exactamente contra `valorBoxCodeAsignado`.
- Si la busqueda inicial en BETA GR no devuelve ordenes (`Total Items` igual a 0 o mensaje `No se encontraron registros.`), se cambia el filtro `Fecha` a `UC`, se actualiza la grilla y se repite la lectura de candidatos.
- Si no coincide, se refresca la busqueda y se espera 30 segundos antes del siguiente intento.
- Maximo de intentos: 5.
- Al coincidir, se cierran `comprasPage` y `page`, y el test finaliza.
- Evidencias por intento:
  - `reports/html/16-betagr-caja-candidatos-intento-{intento}.json`
  - `reports/screenshots/16-betagr-asignacion-refresh-{intento}.png`
- Evidencia final:
  - `reports/screenshots/17-betagr-box-code-confirmado.png`
  - `reports/screenshots/18-betagr-box-code-evidencia-gr.png`

---

## Caso de prueba de inicio a fin

### Identificacion

- Caso: Cambio masivo de Box Code.
- Spec automatizado: `tests/modulo-bulkchanges/bulk-changes_Box code.spec.ts`
- Comando de ejecucion visible: `npx.cmd playwright test "tests/modulo-bulkchanges/bulk-changes_Box code.spec.ts" --project "WebFlowers - Chrome QA" --headed`
- Comando con documento de evidencias: `npm.cmd run test:bulkchanges:boxcode:word`
- Documento esperado: `C:\Users\DianaSPS\Documents\Pruebas Bulk Changes\Bulk-changes_BoxCode_AAAAMMDD.docx`
- Validacion BD: no aplica.
- Page Class: no crear; mantener navegacion y validaciones dentro del spec.

### Precondiciones

1. El ambiente activo debe estar configurado en `ENV`.
2. Deben existir credenciales validas en `ENV.usuario` y `ENV.password`.
3. WebFlowers BETA QU debe estar disponible en `ENV.url`.
4. BETA GR debe estar disponible en `https://betagr.ghtcorptest.com/`.
5. Debe existir al menos una orden visible en Bulk Changes con formato `[A-Z]{2}\d{4}`.
6. Debe existir al menos una fila visible cuyo Box Code actual tenga una opcion diferente disponible dentro del select del formulario Box Code.

### Pasos

1. Navegar a `ENV.url`.
2. Iniciar sesion en WebFlowers con `ENV.usuario` y `ENV.password`.
3. Esperar que la aplicacion quede lista despues del login.
4. Navegar en el menu lateral a Sales -> Bulk Changes usando `iframe#left_page1`.
5. Ejecutar Search sin modificar fechas.
6. Validar que cargue al menos un Order Reference con formato `[A-Z]{2}\d{4}`.
7. Seleccionar el checkbox del primer registro visible.
8. Capturar el Order Reference completo, por ejemplo `PB9925-001`.
9. Derivar el prefijo de 6 caracteres, por ejemplo `PB9925`.
10. Capturar el Box Code actual de la fila seleccionada.
11. Esperar 10 segundos y abrir el selector de campo masivo.
12. Seleccionar la opcion `Box Code`.
13. Esperar que cargue el formulario `Set Box Code Parameters`.
14. Leer todas las opciones del `select:visible`.
15. Intentar seleccionar el segundo codigo disponible.
16. Si el segundo codigo coincide con el Box Code actual de la fila, seleccionar el siguiente codigo disponible.
17. Si no existe un codigo diferente disponible para ese registro, cerrar el modal, desmarcar la fila actual y seleccionar la siguiente fila visible.
18. Para cada fila candidata, capturar Order Reference, prefijo, item y Box Code actual; abrir nuevamente `Box Code` y evaluar las opciones disponibles.
19. Continuar recorriendo filas visibles hasta encontrar un registro con al menos una opcion de Box Code diferente al actual.
20. Si no se encuentra una Order Reference valida en toda la pantalla, finalizar con el mensaje: `No es posible encontrar una Order Reference que cumpla con las condiciones para realizar la prueba`.
21. Validar que el codigo elegido sea diferente al Box Code actual.
22. Guardar con `Save`.
23. Hacer click en `Apply`.
24. Confirmar que Apply fue procesado con indicadores de exito por DOM, texto o estado del boton.
25. Tomar evidencias antes, durante y despues del Apply.
26. Navegar a Sales -> New -> Order Entry.
27. Buscar la orden usando el prefijo capturado.
28. Validar que el Box Code asignado se visualice en Order Entry.
29. Si el Box Code aun no aparece en Order Entry, refrescar la busqueda y esperar 30 segundos antes del siguiente intento.
30. Reintentar la validacion de Order Entry hasta un maximo de 5 intentos.
31. Abrir BETA GR en una nueva pagina.
32. Iniciar sesion en BETA GR si la pantalla lo solicita.
33. Navegar a Compras -> Asignacion de ordenes.
34. Aplicar rango de fechas del mes actual.
35. Ingresar el prefijo de la orden capturada.
36. Seleccionar filtro Todos.
37. Ejecutar Actualizar.
38. Si no se encuentran ordenes despues de buscar por prefijo con el filtro `Todos`, cambiar el filtro `Fecha` a `UC` y ejecutar `Actualizar` nuevamente.
39. Extraer candidatos visibles del campo `Caja`.
40. Normalizar los candidatos eliminando espacios repetidos y pasando a mayusculas.
41. Comparar exactamente los valores de la columna `Caja` contra el Box Code asignado en QU.
42. Si no coincide, refrescar la busqueda y esperar 30 segundos antes del siguiente intento.
43. Reintentar hasta un maximo de 5 intentos.
44. Cuando `Caja` coincida, tomar evidencia final natural en GR.
45. Cerrar las paginas del navegador y finalizar el test.

### Resultado esperado

El cambio masivo de Box Code se aplica correctamente en Bulk Changes, el valor queda visible en Order Entry y el campo `Caja` en BETA GR coincide con el Box Code asignado desde QU. Si el registro seleccionado no tiene una opcion diferente disponible, el test debe evaluar los siguientes registros visibles hasta encontrar uno que permita un cambio real. Si no hay ordenes visibles en GR con el filtro de fecha inicial, la prueba cambia `Fecha` a `UC` y repite la busqueda antes de validar `Caja`. Si ninguna fila visible cumple, debe finalizar con el mensaje: `No es posible encontrar una Order Reference que cumpla con las condiciones para realizar la prueba`.

### Evidencias del caso

- `reports/screenshots/01-inicio.png`
- `reports/screenshots/02-post-login.png`
- `reports/screenshots/03-bulk-changes.png`
- `reports/screenshots/04-post-search.png`
- `reports/screenshots/05-checkbox-selected.png`
- `reports/screenshots/06-after-click.png`
- `reports/screenshots/07-box-code-selected.png`
- `reports/screenshots/08-box-code-value-selected.png`
- `reports/screenshots/09-after-save.png`
- `reports/screenshots/10a-antes-apply.png`
- `reports/screenshots/10b-despues-apply-click.png`
- `reports/screenshots/10c-estado-final-apply.png`
- `reports/screenshots/11-final-state.png`
- `reports/screenshots/12-order-entry.png`
- `reports/screenshots/12-order-entry-frame.png`
- `reports/screenshots/12-order-entry-refresh-{intento}.png`
- `reports/screenshots/13-betagr-inicio.png`
- `reports/screenshots/14-betagr-compras.png`
- `reports/screenshots/15-betagr-asignacion-ordenes.png`
- `reports/screenshots/16-betagr-asignacion-actualizada.png`
- `reports/screenshots/16-betagr-asignacion-filtro-uc.png`, si aplica
- `reports/screenshots/16-betagr-asignacion-refresh-{intento}.png`
- `reports/screenshots/17-betagr-box-code-confirmado.png`
- `reports/screenshots/18-betagr-box-code-evidencia-gr.png`

### Diagnosticos

- `reports/html/04-center.html`
- `reports/html/05a-antes-checkbox.html`
- `reports/html/05b-despues-checkbox.html`
- `reports/html/05-selected-row-box-code-debug.txt`
- `reports/html/05-row-{fila}-debug.txt`
- `reports/html/10-apply-final.html`
- `reports/html/11-final-state.html`
- `reports/html/12-order-entry.html`
- `reports/html/12-order-entry-box-code-values.json`
- `reports/html/12-order-entry-box-code-values-intento-{intento}.json`
- `reports/html/16-betagr-total-items-filtro-fecha-original.json`, si aplica
- `reports/html/16-betagr-total-items-filtro-uc.json`, si aplica
- `reports/html/16-betagr-caja-candidatos-intento-{intento}.json`

---

## Ejecucion validada 2026-08-19

Comando ejecutado:

```powershell
npx.cmd playwright test "tests/modulo-bulkchanges/bulk-changes_Box code.spec.ts" --project "WebFlowers - Chrome QA" --headed
```

Resultado:

- Estado: exitoso, `1 passed`.
- Duracion aproximada: `2.6m`.
- Ambiente: BETA / `https://betaqu.ghtcorptest.com`.
- Orden seleccionada: `PB9925-001`.
- Prefijo usado para validaciones: `PB9925`.
- Box Code actual capturado: `E`.
- Segundo Box Code disponible: `E`.
- Regla aplicada: como el segundo codigo coincidio con el Box Code actual, se selecciono el siguiente disponible.
- Box Code asignado: `F`.
- Confirmacion Apply: mensaje de exito detectado con `text=applied`.
- Validacion QU Order Entry: Box Code `F` visible para el prefijo `PB9925`.
- Validacion BETA GR: campo `Caja` coincide con `F` para `PB9925`.
- Documento de evidencia vigente para el caso Box Code: `Bulk-changes_BoxCode_AAAAMMDD.docx`.
- Error de `qa_metrics`: no bloqueante para la validacion funcional.

## Ajuste de validacion GR 2026-08-19

Se ajusto la validacion final de BETA GR para que no acepte coincidencias parciales ni textos generales de la pantalla. El test ahora extrae candidatos desde la columna visual `Caja` y compara el Box Code esperado de forma exacta despues de normalizar espacios y mayusculas.

Motivo del ajuste:

- Un Box Code de una sola letra, por ejemplo `F`, podia coincidir de forma incorrecta con textos visibles como `FBE`.
- La ultima evidencia debe generarse solo cuando la columna `Caja` muestra realmente el Box Code asignado.
- La captura `reports/screenshots/18-betagr-box-code-evidencia-gr.png` debe mostrar la grilla de GR con la caja actualizada.

---

## Ajuste de seleccion de fila Box Code 2026-08-31

Se ajusto la seleccion inicial del registro para evitar que la prueba falle al tomar una fila cuyo Box Code actual no tiene opciones diferentes disponibles en el formulario `Set Box Code Parameters`.

Nuevo comportamiento:

- La prueba selecciona inicialmente el primer registro visible.
- Si las opciones disponibles de Box Code no contienen ningun valor diferente al Box Code actual de esa fila, se cierra el modal, se desmarca esa fila y se valida la siguiente fila visible.
- El recorrido continua hasta encontrar una Order Reference con al menos una opcion de Box Code diferente.
- Si ninguna fila visible cumple la condicion, se finaliza con el mensaje controlado: `No es posible encontrar una Order Reference que cumpla con las condiciones para realizar la prueba`.

Ejecucion validada:

- Fecha: 2026-08-31.
- Ordenes evaluadas sin alternativa diferente: `PD4628-001`, `PD4628-002`, `PD4628-003`, `PD4628-004`.
- Orden seleccionada para ejecutar el cambio: `PD4628-005`.
- Box Code actual capturado: `H`.
- Box Code asignado: `Q`.
- Confirmacion Apply: mensaje de exito detectado con `text=applied`.
- Validacion QU Order Entry: Box Code `Q` visible para el prefijo `PD4628`.
- Validacion BETA GR: campo `Caja` coincide con `Q` para `PD4628`.
- Resultado: exitoso, `1 passed`.
- Documento generado: `C:\Users\DianaSPS\Documents\Pruebas Bulk Changes\Bulk-changes_BoxCode_20260831.docx`.

---

## Ajuste 2026-09-01 - Filtro Fecha UC en GR

Cuando BETA GR no devuelve ordenes despues de buscar por el prefijo capturado y activar el filtro `Todos`, la prueba debe cambiar el selector `Fecha` a `UC` y ejecutar `Actualizar` nuevamente. La validacion de `Caja` se realiza despues de ese fallback.

Este ajuste cubre el mismo comportamiento observado en las pruebas de Bulk Changes donde la orden puede no aparecer con el filtro de fecha inicial, pero si estar disponible al cambiar `Fecha` a `UC`.

### Ejecucion validada 2026-09-01

Comando ejecutado:

```powershell
npm.cmd run test:bulkchanges:boxcode:visible:word
```

Resultado:

- Estado: exitoso, `1 passed`.
- Ambiente: BETA / `https://betaqu.ghtcorptest.com`.
- Ordenes evaluadas sin alternativa diferente: `PD3941-001`, `PD3941-002`, `PD3941-003`.
- Orden seleccionada para ejecutar el cambio: `PD4777-001`.
- Prefijo usado para validaciones: `PD4777`.
- Box Code actual capturado: `F`.
- Box Code asignado: `H`.
- Confirmacion Apply: proceso finalizado correctamente con indicador de exito.
- Validacion QU Order Entry: Box Code `H` visible para el prefijo `PD4777`.
- Validacion inicial BETA GR: no se encontraron ordenes con el filtro de fecha del mes actual y filtro `Todos`.
- Fallback aplicado en BETA GR: cambio del filtro `Fecha` a `UC` y nueva ejecucion de `Actualizar`.
- Validacion final BETA GR: campo `Caja` coincide con `H` para `PD4777`.
- Documento generado: `C:\Users\DianaSPS\Documents\Pruebas Bulk Changes\Bulk-changes_BoxCode_20260901.docx`.
- Imagenes incluidas en el documento: `22`.

---

## Notas de ejecucion

- El test usa frames de WebFlowers; los elementos del menu se buscan en `iframe#left_page1` y los modulos en `iframe#center_page`.
- El formulario de Box Code usa un modal con un `select` HTML nativo, no un listbox de Material UI.
- Cuando no exista una opcion diferente para la fila seleccionada, el formulario se cierra antes de cambiar a la siguiente fila porque el backdrop del modal bloquea la grilla.
- En la ejecucion validada del 2026-08-31, las primeras cuatro filas tenian Box Code `H` sin alternativa diferente y la fila `PD4628-005` permitio asignar `Q`.
- Si BETA GR no encuentra ordenes al buscar por prefijo con el filtro `Todos`, se cambia el filtro `Fecha` a `UC` y se vuelve a actualizar antes de evaluar `Caja`.
- La validacion de BETA GR depende del encabezado `Caja`; si el texto del encabezado cambia, actualizar la expresion `/^(caja|box|box code):?$/i`.
- La prueba incluye reintentos de navegacion a BETA GR si el dominio devuelve temporalmente `404 Web Site not found`.
- La prueba no usa Page Class por decision del requerimiento.
- La prueba no valida base de datos.
- La validacion de Order Entry puede requerir reintentos por latencia en la propagacion del Box Code aplicado.
- El cierre del navegador ocurre solo despues de que `Caja` coincide con el Box Code asignado en QU desde Bulk Changes.

---

*webflowers-qa-automation - tests/specs-fuente/modulo-bulkchanges/bulk-changes_Box code.md*
*Actualizado: 2026-09-01*
