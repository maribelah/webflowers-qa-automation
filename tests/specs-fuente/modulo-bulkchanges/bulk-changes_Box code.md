# Bulk Changes - Cambio masivo de Box Code

## Prompt original

@workspace /crear-test
Modulo: Sales
Requerimiento: Bulk Changes
Funcionalidad: Validar flujo principal de Bulk Changes para buscar una orden, seleccionar el primer registro, aplicar cambio masivo de BOX CODE y verificar el valor aplicado en Order Entry y Asignacion de ordenes.

Pasos del flujo exitoso:
  1. Navegar a la URL del ambiente activo usando ENV.url.
  2. Iniciar sesion con ENV.usuario y ENV.password.
  3. Navegar en el menu a Sales -> Bulk Changes.
  4. Ejecutar Search sin ajustar fechas.
  5. Seleccionar el checkbox del primer registro y capturar el Order Reference.
  6. Esperar 10 segundos y hacer click en el elemento indicado del formulario.
  7. Seleccionar Box Code desde el dropdown.
  8. Seleccionar el segundo codigo que aparezca; si coincide con el Box Code actual de la fila, seleccionar el siguiente codigo disponible.
  9. Guardar el valor Box.
  10. Hacer click en Apply y confirmar el guardado.
  11. Navegar a Sales -> New -> Order Entry.
  12. Buscar la orden usando el prefijo del Order Reference capturado.
  13. Validar que el valor Box asignado se visualice en Order Entry.
  14. Abrir BETA GR y navegar a Compras -> Asignacion de ordenes.
  15. Buscar la orden capturada y validar que el campo Caja coincida con el valor Box asignado en QU desde el modulo Bulk Changes.
  16. Si Caja no coincide, refrescar la busqueda hasta 5 intentos.
  17. Cuando el valor de Caja coincida, cerrar las paginas del navegador y finalizar el test.

Resultado esperado:
El cambio masivo de Box Code se aplica correctamente sobre la orden seleccionada y el valor se refleja en Order Entry y en Asignacion de ordenes.

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
- `orderReferenceCompletoCapturado`: referencia completa capturada desde el primer registro
- `valorBoxCodeActual`: Box Code capturado desde la fila seleccionada antes de aplicar el cambio
- `valorBoxCodeAsignado`: codigo seleccionado desde el select del modal `Set Box Code Parameters`, iniciando en el segundo codigo disponible y saltando al siguiente si coincide con `valorBoxCodeActual`
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
- Evidencias:
  - `reports/html/12-order-entry.html`
  - `reports/html/12-order-entry-box-code-values.json`
  - `reports/screenshots/12-order-entry.png`
  - `reports/screenshots/12-order-entry-frame.png`

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
6. El select del formulario Box Code debe tener al menos dos codigos disponibles y al menos uno diferente al Box Code actual.

### Pasos

1. Navegar a `ENV.url`.
2. Iniciar sesion en WebFlowers con `ENV.usuario` y `ENV.password`.
3. Esperar que la aplicacion quede lista despues del login.
4. Navegar en el menu lateral a Sales -> Bulk Changes usando `iframe#left_page1`.
5. Ejecutar Search sin modificar fechas.
6. Validar que cargue al menos un Order Reference con formato `[A-Z]{2}\d{4}`.
7. Seleccionar el checkbox del primer registro.
8. Capturar el Order Reference completo, por ejemplo `PB9925-001`.
9. Derivar el prefijo de 6 caracteres, por ejemplo `PB9925`.
10. Capturar el Box Code actual de la fila seleccionada.
11. Esperar 10 segundos y abrir el selector de campo masivo.
12. Seleccionar la opcion `Box Code`.
13. Esperar que cargue el formulario `Set Box Code Parameters`.
14. Leer todas las opciones del `select:visible`.
15. Intentar seleccionar el segundo codigo disponible.
16. Si el segundo codigo coincide con el Box Code actual de la fila, seleccionar el siguiente codigo disponible.
17. Validar que el codigo elegido sea diferente al Box Code actual.
18. Guardar con `Save`.
19. Hacer click en `Apply`.
20. Confirmar que Apply fue procesado con indicadores de exito por DOM, texto o estado del boton.
21. Tomar evidencias antes, durante y despues del Apply.
22. Navegar a Sales -> New -> Order Entry.
23. Buscar la orden usando el prefijo capturado.
24. Validar que el Box Code asignado se visualice en Order Entry.
25. Abrir BETA GR en una nueva pagina.
26. Iniciar sesion en BETA GR si la pantalla lo solicita.
27. Navegar a Compras -> Asignacion de ordenes.
28. Aplicar rango de fechas del mes actual.
29. Ingresar el prefijo de la orden capturada.
30. Seleccionar filtro Todos.
31. Ejecutar Actualizar.
32. Extraer candidatos visibles del campo `Caja`.
33. Normalizar los candidatos eliminando espacios repetidos y pasando a mayusculas.
34. Comparar exactamente los valores de la columna `Caja` contra el Box Code asignado en QU.
35. Si no coincide, refrescar la busqueda y esperar 30 segundos antes del siguiente intento.
36. Reintentar hasta un maximo de 5 intentos.
37. Cuando `Caja` coincida, tomar evidencia final natural en GR.
38. Cerrar las paginas del navegador y finalizar el test.

### Resultado esperado

El cambio masivo de Box Code se aplica correctamente en Bulk Changes, el valor queda visible en Order Entry y el campo `Caja` en BETA GR coincide con el Box Code asignado desde QU. Si el segundo codigo disponible es igual al Box Code actual, el test debe seleccionar el siguiente codigo disponible para garantizar que exista un cambio real.

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
- `reports/screenshots/13-betagr-inicio.png`
- `reports/screenshots/14-betagr-compras.png`
- `reports/screenshots/15-betagr-asignacion-ordenes.png`
- `reports/screenshots/16-betagr-asignacion-actualizada.png`
- `reports/screenshots/16-betagr-asignacion-refresh-{intento}.png`
- `reports/screenshots/17-betagr-box-code-confirmado.png`
- `reports/screenshots/18-betagr-box-code-evidencia-gr.png`

### Diagnosticos

- `reports/html/04-center.html`
- `reports/html/05a-antes-checkbox.html`
- `reports/html/05b-despues-checkbox.html`
- `reports/html/05-selected-row-box-code-debug.txt`
- `reports/html/10-apply-final.html`
- `reports/html/11-final-state.html`
- `reports/html/12-order-entry.html`
- `reports/html/12-order-entry-box-code-values.json`
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

## Notas de ejecucion

- El test usa frames de WebFlowers; los elementos del menu se buscan en `iframe#left_page1` y los modulos en `iframe#center_page`.
- El formulario de Box Code usa un modal con un `select` HTML nativo, no un listbox de Material UI.
- En la ejecucion validada, el segundo codigo disponible fue `E`, coincidio con el Box Code actual y por eso se selecciono `F`.
- La validacion de BETA GR depende del encabezado `Caja`; si el texto del encabezado cambia, actualizar la expresion `/^(caja|box|box code):?$/i`.
- La prueba incluye reintentos de navegacion a BETA GR si el dominio devuelve temporalmente `404 Web Site not found`.
- La prueba no usa Page Class por decision del requerimiento.
- La prueba no valida base de datos.
- El cierre del navegador ocurre solo despues de que `Caja` coincide con el Box Code asignado en QU desde Bulk Changes.

---

*webflowers-qa-automation - tests/specs-fuente/modulo-bulkchanges/bulk-changes_Box code.md*
*Actualizado: 2026-08-19*
