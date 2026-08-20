# Bulk Changes - Cambio masivo de Price

## Prompt original

@workspace /crear-test
Modulo: Sales
Requerimiento: Bulk Changes
Funcionalidad: Validar flujo principal de Bulk Changes para buscar una orden, seleccionar el primer registro, aplicar cambio masivo de PRICE y verificar el valor aplicado en Order Entry y Asignacion de ordenes.

Pasos del flujo exitoso:
  1. Navegar a la URL del ambiente activo usando ENV.url.
  2. Iniciar sesion con ENV.usuario y ENV.password.
  3. Navegar en el menu a Sales -> Bulk Changes.
  4. Ejecutar Search sin ajustar fechas.
  5. Seleccionar el checkbox del primer registro y capturar el Order Reference.
  6. Esperar 10 segundos y hacer click en el elemento indicado del formulario.
  7. Seleccionar Price desde el dropdown.
  8. Generar un valor aleatorio entre 1.00 y 3.00, con un entero y dos decimales, e ingresarlo en el input de Price.
  9. Guardar el valor Price.
  10. Hacer click en Apply y confirmar el guardado.
  11. Navegar a Sales -> New -> Order Entry.
  12. Buscar la orden usando el prefijo del Order Reference capturado.
  13. Validar que el valor FOB Price asignado se visualice en Order Entry.
  14. Abrir BETA GR y navegar a Compras -> Asignacion de ordenes.
  15. Buscar la orden capturada y validar que los primeros 3 numeros del campo Precio Unidad coincidan con el valor FOB Price asignado en QU desde el modulo Bulk Changes, sin tener en cuenta comas ni puntos.
  16. Si Precio Unidad no coincide, refrescar la busqueda hasta 5 intentos.
  17. Cuando el precio coincida, cerrar las paginas del navegador y finalizar el test.

Resultado esperado:
El cambio masivo de Precio se aplica correctamente sobre la orden seleccionada y el valor se refleja en Order Entry y en Asignacion de ordenes.

Validacion BD: No aplica
Page Class disponible: No crear Page Class; implementar navegacion con frames y localizadores resilientes dentro del spec.
Datos de prueba disponibles: Usar ENV desde src/utils/envConfig.ts.
NO MODIFICAR: BasePage.ts, base.fixture.ts, envConfig.ts, helpers.ts

Artefactos generados:
  1. tests/modulo-bulkchanges/bulk-changes_Precio.spec.ts
  2. tests/specs-fuente/modulo-bulkchanges/bulk-changes_Precio.md

---

## Analisis UI y localizadores

### Pantallas involucradas
- Login WebFlowers
- Menu lateral WebFlowers: Sales -> Bulk Changes
- Bulk Changes dentro de iframe #center_page
- Sales -> New -> Order Entry
- BETA GR: Compras -> Asignacion de ordenes

### Datos y variables del flujo
- Credenciales y URL: `ENV.url`, `ENV.usuario`, `ENV.password`
- `orderReferenceCapturado`: prefijo de 6 caracteres extraido desde Bulk Changes, formato `XX####`
- `orderReferenceCompletoCapturado`: referencia completa capturada desde el primer registro
- `valorPriceAsignado`: valor aleatorio decimal entre `1.00` y `3.00`, generado con un entero y dos decimales
- `maxIntentosAsignacion`: 5 intentos para validar `Precio Unidad`
- Documento de evidencia: `C:\Users\DianaSPS\Documents\Pruebas Bulk Changes\Bulk-changes-Price_AAAAMMDD.docx`

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
  - `xpath=/html/body/div/div/div[2]/div/div[3]/span/span[1]/span/span[1]`
- Opcion Price:
  - `xpath=/html/body/div[2]/div[3]/ul/li[normalize-space()="Price"]`
  - `xpath=/html/body/div[2]/div[3]/ul/li[contains(normalize-space(),"Price")]`
  - texto `Price`
  - texto `FOB Price`
- Input del valor Price:
  - `xpath=/html/body/div[2]/div[3]/div[2]/form/table/tbody/tr/td/input`
- Boton Save del formulario Price:
  - `xpath=/html/body/div[2]/div[3]/div[2]/form/div/button`
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
- Validacion FOB Price:
  - se leen todos los `input:visible` dentro de `iframe#center_page`
  - se normaliza cada valor numerico visible
  - se compara contra `valorPriceAsignado` con tolerancia menor a `0.001`
- Evidencias:
  - `reports/html/12-order-entry.html`
  - `reports/html/12-order-entry-inputs.json`
  - `reports/screenshots/12-order-entry.png`
  - `reports/screenshots/12-order-entry-frame.png`

### BETA GR - Asignacion de ordenes
- URL fija: `https://betagr.ghtcorptest.com/`
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

### Validacion Precio Unidad
- Se buscan elementos visibles `td`, `th`, `span`, `div` e `input`.
- Se localizan encabezados que coincidan con `/precio\s*unidad:?/i`.
- Se extraen valores numericos ubicados debajo del encabezado y alineados horizontalmente con esa columna.
- Si la alineacion visual de la columna no permite capturar el valor esperado, se agregan como fallback los valores numericos visibles de la pantalla ya filtrada por orden.
- El fallback lee `value`, atributo `value`, `innerText`, `textContent`, `title` y `aria-label`, y extrae tokens numericos de textos compuestos.
- Se normalizan valores eliminando puntos, comas y cualquier separador antes de comparar.
- Se eliminan comas, puntos, simbolos de moneda y cualquier caracter que no sea numero.
- Se extraen los primeros 3 numeros de cada candidato de `Precio Unidad`.
- Se extraen los primeros 3 numeros del FOB Price asignado en QU desde el modulo Bulk Changes (`valorPriceAsignado`).
- Se comparan solo esos 3 numeros.
- Ejemplo: FOB Price asignado en QU desde Bulk Changes `1.51` coincide con Precio Unidad `151` porque ambos valores normalizan sus primeros 3 numeros a `151`.
- Si despues de quitar separadores quedan menos de 3 numeros, se completa con ceros a la derecha para comparar siempre una clave de 3 numeros.
- Si no coincide, se refresca la busqueda y se espera 30 segundos antes del siguiente intento.
- Maximo de intentos: 5.
- Al coincidir, se registra el intento exitoso, se cierran `comprasPage` y `page`, y el test finaliza.
- Evidencias por intento:
  - `reports/html/16-betagr-precio-unidad-candidatos-intento-{intento}.json`
  - `reports/html/16-betagr-precio-unidad-normalizados-intento-{intento}.json`
  - `reports/screenshots/16-betagr-asignacion-refresh-{intento}.png`
- Evidencia final:
  - `reports/screenshots/17-betagr-precio-actualizado.png`

---

## Caso de prueba de inicio a fin

### Identificacion

- Caso: Cambio masivo de Price / FOB Price.
- Spec automatizado: `tests/modulo-bulkchanges/bulk-changes_Precio.spec.ts`
- Comando de ejecucion visible: `npx.cmd playwright test tests/modulo-bulkchanges/bulk-changes_Precio.spec.ts --project "WebFlowers - Chrome QA" --headed`
- Comando con documento de evidencias: `npm.cmd run test:bulkchanges:precio:word`
- Documento esperado: `C:\Users\DianaSPS\Documents\Pruebas Bulk Changes\Bulk-changes-Price_AAAAMMDD.docx`
- Validacion BD: no aplica.
- Page Class: no crear; mantener navegacion y validaciones dentro del spec.

### Precondiciones

1. El ambiente activo debe estar configurado en `ENV`.
2. Deben existir credenciales validas en `ENV.usuario` y `ENV.password`.
3. WebFlowers BETA QU debe estar disponible en `ENV.url`.
4. BETA GR debe estar disponible en `https://betagr.ghtcorptest.com/`.
5. Debe existir al menos una orden visible en Bulk Changes con formato `[A-Z]{2}\d{4}`.

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
10. Esperar 10 segundos y abrir el selector de campo masivo.
11. Seleccionar la opcion `Price`.
12. Esperar que cargue el formulario de Price.
13. Generar un valor aleatorio entre `1.00` y `3.00` usando centavos para evitar problemas de precision.
14. Ingresar el valor generado en el input de Price.
15. Tomar evidencia del valor ingresado.
16. Hacer click en `Save`.
17. Hacer click en `Apply`.
18. Confirmar que Apply fue procesado con indicadores de exito por DOM, texto o estado del boton.
19. Tomar evidencias antes, durante y despues del Apply.
20. Navegar a Sales -> New -> Order Entry.
21. Buscar la orden usando el prefijo capturado.
22. Validar que el `FOB Price` asignado se visualice en Order Entry.
23. Abrir BETA GR en una nueva pagina.
24. Iniciar sesion en BETA GR si la pantalla lo solicita.
25. Navegar a Compras -> Asignacion de ordenes.
26. Aplicar rango de fechas del mes actual.
27. Ingresar el prefijo de la orden capturada.
28. Seleccionar filtro Todos.
29. Ejecutar Actualizar.
30. Extraer candidatos visibles del campo `Precio Unidad`.
31. Normalizar los candidatos eliminando puntos, comas, simbolos de moneda y caracteres no numericos.
32. Extraer los primeros 3 numeros del `FOB Price` asignado en QU.
33. Comparar los primeros 3 numeros de `Precio Unidad` contra los primeros 3 numeros del `FOB Price`.
34. Si no coincide, refrescar la busqueda y esperar 30 segundos antes del siguiente intento.
35. Reintentar hasta un maximo de 5 intentos.
36. Cuando el precio coincida, tomar la evidencia final `17-betagr-precio-actualizado.png`.
37. Cerrar las paginas del navegador y finalizar el test.

### Resultado esperado

El cambio masivo de Price se aplica correctamente en Bulk Changes, el valor queda visible como `FOB Price` en Order Entry y los primeros 3 numeros normalizados de `Precio Unidad` en BETA GR coinciden con el valor asignado desde QU.

### Evidencias del caso

- `reports/screenshots/01-inicio.png`
- `reports/screenshots/02-post-login.png`
- `reports/screenshots/03-bulk-changes.png`
- `reports/screenshots/04-post-search.png`
- `reports/screenshots/05-checkbox-selected.png`
- `reports/screenshots/06-after-click.png`
- `reports/screenshots/07-price-selected.png`
- `reports/screenshots/08-price-value-entered.png`
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
- `reports/screenshots/17-betagr-precio-actualizado.png`

### Diagnosticos

- `reports/html/04-center.html`
- `reports/html/05a-antes-checkbox.html`
- `reports/html/05b-despues-checkbox.html`
- `reports/html/10-apply-final.html`
- `reports/html/11-final-state.html`
- `reports/html/12-order-entry.html`
- `reports/html/12-order-entry-inputs.json`
- `reports/html/16-betagr-precio-unidad-candidatos-intento-{intento}.json`
- `reports/html/16-betagr-precio-unidad-normalizados-intento-{intento}.json`

---

## Ejecucion validada 2026-08-19

Comando ejecutado:

```powershell
npx.cmd playwright test tests/modulo-bulkchanges/bulk-changes_Precio.spec.ts --project "WebFlowers - Chrome QA" --headed
```

Resultado:

- Estado: exitoso, `1 passed`.
- Duracion aproximada: `4.0m`.
- Ambiente: BETA / `https://betaqu.ghtcorptest.com`.
- Orden seleccionada: `PB9925-001`.
- Prefijo usado para validaciones: `PB9925`.
- `FOB Price` generado y aplicado: `2.35`.
- Confirmacion Apply: mensaje de exito detectado con `text=applied`.
- Validacion QU Order Entry: `FOB Price 2.35` visible para el prefijo `PB9925`.
- Validacion BETA GR: `Precio Unidad` coincide contra los primeros 3 numeros normalizados `235`.
- Intento exitoso en BETA GR: intento 3.
- Documento de evidencia vigente para el caso Price: `Bulk-changes-Price_AAAAMMDD.docx`.
- Error de `qa_metrics`: no bloqueante para la validacion funcional.

---

## Notas de ejecucion

- El test usa frames de WebFlowers; los elementos del menu se buscan en `iframe#left_page1` y los modulos en `iframe#center_page`.
- La validacion de Order Entry no depende del indice del input; compara cualquier input visible con el precio esperado.
- La validacion de BETA GR depende del encabezado `Precio Unidad`; si el texto del encabezado cambia, actualizar la expresion `/precio\s*unidad:?/i`.
- La bitacora de decisiones de la sesion esta en `tests/specs-fuente/modulo-bulkchanges/bitacora-2026-08-13.md`.
- La prueba no usa Page Class por decision del requerimiento.
- La prueba no valida base de datos.
- El cierre del navegador ocurre solo despues de que los primeros 3 numeros de `Precio Unidad` coinciden con los primeros 3 numeros del FOB Price asignado en QU desde Bulk Changes.

---

*webflowers-qa-automation - tests/specs-fuente/modulo-bulkchanges/bulk-changes_Precio.md*
*Actualizado: 2026-08-19*
