# Bulk Changes - Product Flowers

## Objetivo

Validar que el cambio masivo de `Product - Flowers` realizado en QU desde `Sales -> Bulk Changes` se aplique correctamente sobre la orden seleccionada, se refleje en `Sales -> New -> Order Entry` dentro de la ventana `Products Definition`, y que el `Code` guardado coincida con `Codigo Flor` en BETA GR.

## Archivos relacionados

- Spec automatizado: `tests/modulo-bulkchanges/bulk-changes_Product -Flowers.spec.ts`
- Spec fuente: `tests/specs-fuente/modulo-bulkchanges/bulk-changes_ProductFlowers.md`
- Script Word: `scripts/generate-bulkchanges-productflowers-word.ps1`
- Comando visible con evidencia Word: `npm.cmd run test:bulkchanges:productflowers:visible:word`
- Comando visible con evidencia Word y video: `npm.cmd run test:bulkchanges:productflowers:visible:word:video`
- Comando visible sin Word: `npm.cmd run test:bulkchanges:productflowers:visible`
- Comando con evidencia Word: `npm.cmd run test:bulkchanges:productflowers:word`
- Documento esperado: `C:\Users\DianaSPS\Documents\Pruebas Bulk Changes\Bulk-changes-ProductFlowers_AAAAMMDD.docx`
- Video esperado: `C:\Users\DianaSPS\Documents\Pruebas Bulk Changes\Vídeo_Bulk-changes-ProductFlowers_AAAAMMDD.webm`

## Flujo esperado

1. Navegar a `ENV.url`.
2. Iniciar sesion con `ENV.usuario` y `ENV.password`; si la aplicacion ya muestra el menu principal o frames de trabajo, omitir el ingreso de credenciales y continuar.
3. Navegar a `Sales -> Bulk Changes`.
4. Ejecutar `Search` sin modificar fechas.
5. Seleccionar el checkbox del primer registro visible.
6. Capturar el `Order Reference` completo y derivar su prefijo `XX####`.
7. Abrir el selector de campo para cambio masivo.
8. Seleccionar la opcion `Product - Flowers`.
9. Esperar que cargue el formulario `Set Product Flower Parameters`.
10. Ubicar el primer bloque `Adjusted Recipe`.
11. Identificar `Color` como el tercer `select` despues de `Adjusted Recipe`.
12. Identificar `Variety` como el cuarto `select` despues de `Adjusted Recipe`, si esta disponible.
13. Validar si existe un `Color` diferente al actual.
14. No seleccionar `Assorted` como color operativo para el cambio masivo.
15. Si existe un `Color` diferente, seleccionarlo; luego intentar seleccionar una `Variety` diferente solo si existe una opcion valida.
16. Si no existe un `Color` diferente, intentar seleccionar una `Variety` diferente en la misma fila.
17. Si en esa fila no existe `Color` diferente ni `Variety` valida diferente, revisar la fila siguiente de `Adjusted Recipe` y repetir la validacion desde `Color`.
18. Si se selecciono `Color` y no existe una `Variety` valida diferente, conservar la `Variety` actual y continuar porque `Variety` no es obligatoria.
19. Guardar el formulario con `Save`.
20. Aplicar el cambio masivo con `Apply`.
21. Confirmar el proceso `Apply` de forma acotada mediante mensaje, estado de exito o ausencia de indicador activo; si la UI no expone confirmacion visible, continuar con las validaciones en `Order Entry` y BETA GR.
22. Navegar a `Sales -> New -> Order Entry`.
23. Buscar la orden usando el prefijo capturado.
24. Abrir `Edit Product` en la linea cuyo item coincida con el item capturado en Bulk Changes, por ejemplo `002`.
25. Esperar la ventana emergente `Products Definition`.
26. En `Products Definition`, expandir el primer item visible de la pantalla emergente usando el primer signo `+`; este primer item pertenece al producto abierto, no necesariamente se identifica como `001/002`.
27. Validar que el `Color` esperado se visualice en `Products Definition`.
28. Validar `Variety` solo si realmente se selecciono una opcion valida diferente.
29. Si `Variety` no tuvo cambio valido, validar solo `Color`.
30. Guardar el valor `Code` de la fila Flowers validada en `Products Definition`.
31. Tomar evidencia visual en `Products Definition` despues de validar el cambio, mostrando la fila Flowers expandida con `Code`, `Color` y `Variety`.
32. Abrir BETA GR.
33. Navegar a `Compras -> Asignacion de ordenes`.
34. Consultar la orden usando el prefijo capturado.
35. Cambiar siempre el filtro `Fecha` a `UC` y ejecutar `Actualizar` nuevamente antes de continuar.
36. Ubicar el registro correspondiente al `Order Reference` e item capturados usando solo celdas directas de la fila principal.
37. Presionar el boton `+` de la fila encontrada para desplegar el detalle.
38. Confirmar que el detalle quede expandido y muestre la seccion `Receta del Producto`.
39. Leer los valores visibles bajo la columna `Codigo Flor` en la seccion `Receta del Producto`.
40. Comparar el `Code` guardado desde `Products Definition` contra `Codigo Flor`.
41. Si `Codigo Flor` no coincide o el detalle no queda desplegado, repetir el proceso completo hasta 5 intentos.
42. La coincidencia en GR debe salir del bloque de detalle asociado a la fila principal del item capturado; no se permite usar una busqueda global en toda la pantalla.
43. Tan pronto se valide la coincidencia, guardar la evidencia visual del detalle expandido en GR usando `17-betagr-product-flowers-confirmado.png` y dejar que Playwright cierre el navegador al finalizar.
44. Generar el documento Word con las capturas recientes de la ejecucion.

## Reglas de validacion

- El `Order Reference` debe capturarse desde la fila seleccionada en Bulk Changes.
- El prefijo de orden debe tener formato `XX####`.
- El campo `Code` del formulario Product Flowers no debe modificarse.
- El cambio debe aplicar al menos una diferencia valida entre `Color` o `Variety`.
- El `Color` se debe cambiar cuando exista una opcion diferente al color actual.
- La opcion `Assorted` no debe usarse como unico cambio operativo, porque puede dejar `Apply` deshabilitado.
- Si `Color` solo tiene una opcion, se debe intentar cambiar `Variety` en la misma fila.
- Si en la fila no existe `Color` diferente ni `Variety` valida diferente, se debe revisar la fila siguiente de `Adjusted Recipe`.
- El cambio de `Variety` es opcional cuando ya se selecciono un `Color` diferente.
- `Variety` solo se cambia cuando existe una opcion valida diferente a la actual.
- Opciones vacias, textos tipo `-- select an option --`, `select`, `seleccione` o `-` no son variedades validas.
- Si no hay `Variety` valida diferente, la prueba debe conservar el valor actual y continuar.
- El item capturado en Bulk Changes debe ser consistente en todo el flujo: seleccion en Bulk Changes, apertura de `Edit Product` en Order Entry y expansion/validacion en BETA GR.
- En `Products Definition`, `Color` siempre debe coincidir con el valor asignado.
- En `Products Definition`, `Variety` solo debe validarse cuando fue cambiada a una opcion valida.
- En `Products Definition`, el valor `Code` de la fila Flowers validada debe capturarse y conservarse.
- En BETA GR, cada intento debe consultar la orden, ubicar la linea por prefijo de orden e item capturados, abrir el detalle con el boton `+` y luego comparar `Codigo Flor`.
- En BETA GR, despues de consultar por prefijo con el filtro `Todos`, la prueba debe cambiar siempre el filtro `Fecha` a `UC`, ejecutar `Actualizar` nuevamente y solo despues continuar con la expansion de la fila.
- En BETA GR, la lectura de `Codigo Flor` debe hacerse dentro del bloque expandido de la fila principal objetivo, identificando el encabezado `Codigo Flor`/`Codigo` con tilde o sin tilde y tomando los valores alineados bajo esa columna hasta `Comentarios`.
- En BETA GR, el item debe compararse contra celdas directas de la fila principal. Textos dentro de detalles expandidos, como `Q002`, no deben tomarse como coincidencia del item `002`.
- En BETA GR, las celdas pueden exponer el valor real en el atributo `title`; si `textContent` esta vacio o solo tiene espacios, la prueba debe leer `title` para comparar orden, item y columnas de receta.
- En BETA GR, si ya hay otra fila expandida, la prueba no debe usar esa receta como valida a menos que pertenezca a la fila principal del item capturado.
- En BETA GR, el campo `Codigo Flor` debe coincidir con el `Code` guardado desde `Products Definition`.
- La validacion de `Codigo Flor` debe permitir hasta 5 intentos completos de consulta, expansion con `+` y comparacion solo si los valores aun no coinciden.
- Despues de expandir la fila objetivo en BETA GR y esperar la carga, la prueba debe hacer una lectura fresca de `Codigo Flor`; no debe decidir el resultado con una lectura tomada antes de que el detalle termine de renderizar.
- Si la grilla de GR no expone la celda de `Codigo Flor` como columna parseable, se permite validar la coincidencia por presencia del `Code` esperado solo dentro del `detailTR` asociado a la fila principal objetivo.
- Tan pronto `Codigo Flor` coincida con `Code`, la prueba debe considerarse exitosa y guardar la evidencia final.
- El cierre del navegador debe quedar a cargo de Playwright; el test no debe cerrar manualmente la pagina principal ni el contexto para evitar errores de teardown.
- El login debe ser idempotente: cuando la sesion ya esta activa, la prueba no debe esperar `#btnSigIn`.
- Los avisos o errores de persistencia de `qa_metrics`, incluyendo el bloqueo por firewall de Azure SQL para la IP cliente, no deben considerarse falla funcional ni bloquear el resultado de la prueba.

## Localizadores principales

### Bulk Changes

- Frame principal del modulo: `iframe#center_page`
- Boton Search: `xpath=/html/body/div/div/form/div[2]/button`
- Checkbox primer registro:
  - `xpath=/html/body/div/div/div[1]/div/div[1]/div[2]/div[2]/div/div[1]/div[2]/span/input`
- Elemento que abre dropdown de campos:
  - `xpath=/html/body/div/div/div[2]/div/div[1]/span/span[2]/span/div/div/div`
- Opcion Product - Flowers:
  - `xpath=/html/body/div[2]/div[3]/ul/li[normalize-space()="Product - Flowers"]`
  - `xpath=/html/body/div[2]/div[3]/ul/li[contains(normalize-space(),"Product") and contains(normalize-space(),"Flowers")]`
  - texto exacto `Product - Flowers`
- Campos de `Adjusted Recipe`:
  - Primera fila: `Color` es el tercer `select` despues de `Adjusted Recipe`; `Variety` es el cuarto `select`, si esta visible/disponible.
  - Filas siguientes: revisar el siguiente par equivalente de `Color` y `Variety`.
  - La prueba debe usar la primera fila visible que permita aplicar un cambio valido en `Color` o `Variety`.
- Boton Save:
  - boton visible con texto `Save`
- Boton Apply:
  - `xpath=/html/body/div/div/div[2]/div/div[3]/span/span[2]/span/button`
  - despues del click, no esperar indefinidamente por mensaje de exito; si no hay loading ni indicador activo despues de una espera corta, continuar con `Order Entry`

### Order Entry y Products Definition

- Navegacion: `Sales -> New -> Order Entry`
- Search input Order Entry:
  - `xpath=/html/body/form/div[3]/div[3]/div[1]/input`
- Busqueda:
  - llenar con el prefijo capturado
  - presionar `Enter`
- Validacion:
  - abrir `Edit Product`
  - abrir la linea cuyo item coincida con el item capturado en Bulk Changes
  - esperar `Products Definition`
  - esperar que desaparezca `Working...`
  - ubicar `#txtName0` como ancla del primer item visible del popup
  - seleccionar el primer signo `+` de esa primera fila
  - confirmar que se muestre `#divFlowers0`
  - leer elementos visibles `td`, `th`, `span`, `div`, `input` y `select`
  - validar `Color`
  - validar `Variety` solo cuando aplique
  - guardar el `Code` de la fila Flowers validada
  - tomar evidencia posterior a la validacion en `14b-products-definition-product-flowers-confirmado.png`

### BETA GR - Asignacion de ordenes

- Navegacion: `Compras -> Asignacion de ordenes`
- Filtro de orden:
  - llenar `Orden #` con el prefijo capturado
  - aplicar rango de fechas del mes actual
  - seleccionar filtro `(Todos...)`
  - presionar `Actualizar`
- Filtro Fecha:
  - despues de buscar por prefijo con `(Todos...)`, ubicar siempre el selector asociado al label visible `Fecha`
  - seleccionar `UC`
  - ejecutar `Actualizar` nuevamente antes de ubicar la fila y expandir `Receta del Producto`
- Expansion:
  - ubicar la fila principal por `Orden #` y `Item` capturados
  - en grillas `ag-row`, validar `OrderNumber` e `Item` por `colid`
  - en tablas HTML, validar `Orden #` e `Item` solo contra `td` directos de la fila
  - presionar el boton `+` de esa fila
  - el control debe abrir el detalle de `Receta del Producto`
- Validacion:
  - ejecutar la consulta antes de cada intento
  - abrir el detalle con `+` antes de comparar
  - leer la columna `Codigo Flor` solamente del detalle asociado a la fila principal del item capturado, por encabezado/columna y no por texto global de la pantalla
  - no usar coincidencias globales del texto completo de la pantalla para aprobar la validacion
  - comparar contra el `Code` guardado desde `Products Definition`
  - si `Codigo Flor` no coincide o no se despliega la seccion, repetir consulta, expansion y comparacion hasta 5 intentos
  - guardar diagnostico por intento en `reports/html/16-betagr-product-flowers-candidatos-intento-N.json`

## Evidencias esperadas en Word

Esta regla solo aplica para el documento Word de `bulk-changes_Product -Flowers.spec.ts`. El Word debe contener solamente estas capturas:

- `reports/screenshots/01-inicio.png`
- `reports/screenshots/04-post-search.png`
- `reports/screenshots/05-checkbox-selected.png`
- `reports/screenshots/08-product-flowers-values-selected.png`
- `reports/screenshots/10b-despues-apply-click.png`
- `reports/screenshots/12-order-entry.png`
- `reports/screenshots/12-order-entry-frame.png`
- `reports/screenshots/13-products-definition-opened.png`
- `reports/screenshots/14b-products-definition-product-flowers-confirmado.png`
- `reports/screenshots/14-products-definition-expanded.png`
- `reports/screenshots/15-betagr-inicio.png`
- `reports/screenshots/16b-betagr-asignacion-filtro-uc.png` despues de aplicar `Fecha = UC`
- `reports/screenshots/16d-betagr-asignacion-expandida-intento-1.png`
- `reports/screenshots/17-betagr-product-flowers-confirmado.png`

Las evidencias de `Order Entry / Products Definition` deben quedar antes de cualquier evidencia de BETA GR en el documento Word. Por eso las capturas de BETA GR deben iniciar despues de `14b-products-definition-product-flowers-confirmado.png`.

Para Product Flowers, el documento Word no debe usar `IncludeAllBaseNames`; debe usar la lista cerrada anterior. No se deben aplicar filtros de imagen heredados de otros casos de Bulk Changes, porque cada prueba tiene su propio criterio de evidencia.

La evidencia `17-betagr-product-flowers-confirmado.png` es la captura oficial para la validacion final en GR. No se debe generar ni incluir una captura adicional `18-betagr-product-flowers-evidencia-gr.png`, porque la evidencia requerida ya esta contenida en la imagen `17`.

## Diagnosticos esperados

- `reports/html/04-center.html`
- `reports/html/05a-antes-checkbox.html`
- `reports/html/05b-despues-checkbox.html`
- `reports/html/08-product-flowers-values.json`
- `reports/html/10-apply-final.html`
- `reports/html/11-final-state.html`
- `reports/html/12-order-entry.html`
- `reports/html/12-order-entry-product-flowers-values.json`
- `reports/html/13-products-definition-values.json`
- `reports/html/13-products-definition-product-flowers-row.json`
- `reports/html/16-betagr-product-flowers-total-items-intento-N.json`
- `reports/html/16-betagr-product-flowers-candidatos-intento-N.json`

## Documento Word

El documento Word debe generarse automaticamente en:

```text
C:\Users\DianaSPS\Documents\Pruebas Bulk Changes\Bulk-changes-ProductFlowers_AAAAMMDD.docx
```

Las imagenes incluidas en el Word deben conservarse completas. El generador debe normalizarlas usando escalado tipo `contain`, dejando margen blanco si la proporcion de la captura no coincide con el tamano uniforme.

Tamano uniforme esperado:

```text
1710x971
```

## Video

El video debe generarse solo cuando se use el comando con video. La ruta esperada es:

```text
C:\Users\DianaSPS\Documents\Pruebas Bulk Changes\Vídeo_Bulk-changes-ProductFlowers_AAAAMMDD.webm
```

Si la prueba se ejecuta mas de una vez el mismo dia con video, el ultimo video debe reemplazar al anterior.

## Ultima ejecucion confirmada

- Comando: `npm.cmd run test:bulkchanges:productflowers:visible:word`
- Ambiente: `BETA`
- Resultado: `1 passed (4.9m)`
- Fecha de ejecucion: `2026-09-08`
- Orden validada: `PD4707-001`
- Fila `Adjusted Recipe` usada: `1`
- Valores confirmados: `Color=Red`, `Variety=Beloved°`, `Code=1AL1`, `Codigo Flor=1AL1`
- Comportamiento validado: cuando `Color` no tiene una opcion diferente disponible, la prueba conserva el color actual y selecciona una `Variety` diferente si existe.
- Regla GR aplicada: cambio obligatorio del filtro `Fecha` a `UC` despues de la consulta por prefijo con `Todos`.
- Intentos de expansion GR: `1`
- Documento generado: `C:\Users\DianaSPS\Documents\Pruebas Bulk Changes\Bulk-changes-ProductFlowers_20260908.docx`
- Imagenes incluidas: `14`

El warning de persistencia de `qa_metrics` por firewall de Azure SQL se ignora como no funcional.

## Comando oficial

Para ejecutar la prueba visible y generar solo Word:

```powershell
npm.cmd run test:bulkchanges:productflowers:visible:word
```

Para ejecutar la prueba visible y generar Word + video:

```powershell
npm.cmd run test:bulkchanges:productflowers:visible:word:video
```

## Criterios de aceptacion

- La prueba finaliza con `1 passed`.
- El click en `Apply` se ejecuta y el cambio `Product - Flowers` queda confirmado por las validaciones posteriores en `Order Entry` y BETA GR.
- El `Color` asignado se valida en `Products Definition`.
- `Variety` se valida solo si fue cambiada a una opcion valida.
- Si `Variety` no tiene opcion valida diferente, se conserva sin fallar la prueba.
- El `Code` de la fila Flowers validada en `Products Definition` queda guardado.
- En GR se consulta `Compras -> Asignacion de ordenes`, se expande la fila principal del item capturado con `+` y se visualiza `Receta del Producto`.
- En GR, despues de consultar con el prefijo y filtro `Todos`, se cambia siempre `Fecha` a `UC` y se vuelve a consultar antes de expandir la fila.
- El valor `Codigo Flor` de GR coincide con el `Code` guardado desde `Products Definition`.
- La consulta, expansion con `+` y comparacion de `Codigo Flor` se repiten solo cuando los valores no coinciden, hasta un maximo de 5 intentos.
- Tan pronto se valida la coincidencia, se guarda la evidencia final y se cierra Chrome.
- Se genera el documento Word en la ruta esperada.
- Cuando se ejecuta con video, se genera el archivo `.webm` en la ruta esperada.
- Si ya existe un video del mismo dia, se reemplaza por el de la ultima ejecucion.
- El documento Word incluye solamente la lista cerrada de capturas definida para Product Flowers, sin aplicar filtros de otros tests.
- Las imagenes del documento Word no quedan recortadas.
- El aviso de `qa_metrics` por firewall de Azure SQL se ignora como criterio funcional de aceptacion.

---

*webflowers-qa-automation - tests/specs-fuente/modulo-bulkchanges/bulk-changes_ProductFlowers.md*
*Actualizado: 2026-09-08*
