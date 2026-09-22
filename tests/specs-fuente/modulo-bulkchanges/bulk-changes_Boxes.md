# Bulk Changes - Boxes

## Objetivo

Validar que el cambio masivo de `BOXES` realizado en QU desde `Sales -> Bulk Changes` se aplique correctamente sobre la orden seleccionada y se refleje en:

- QU / `Sales -> New -> Order Entry`
- BETA GR / `Compras -> Asignacion de ordenes`

El documento de evidencias debe generarse automaticamente en Word al finalizar la ejecucion.

## Archivos relacionados

- Spec automatizado: `tests/modulo-bulkchanges/bulk-changes_Boxes.spec.ts`
- Spec fuente: `tests/specs-fuente/modulo-bulkchanges/bulk-changes_Boxes.md`
- Script Word: `scripts/generate-bulkchanges-cajas-word.ps1`
- Comando con evidencia Word: `npm.cmd run test:bulkchanges:boxes:visible:word`
- Comando con evidencia Word y video: `npm.cmd run test:bulkchanges:boxes:visible:word:video`
- Documento esperado: `C:\Users\DianaSPS\Documents\Pruebas Bulk Changes\Bulk-changes-Boxes_AAAAMMDD.docx`
- Video esperado: `C:\Users\DianaSPS\Documents\Pruebas Bulk Changes\Vídeo_Bulk-changes-Boxes_AAAAMMDD.webm`

## Flujo esperado

1. Navegar a `ENV.url`.
2. Iniciar sesion con `ENV.usuario` y `ENV.password`.
3. Navegar a `Sales -> Bulk Changes`.
4. Ejecutar `Search` sin modificar fechas.
5. Seleccionar el checkbox del primer registro visible.
6. Capturar el `Order Reference` completo, derivar su prefijo `XX####`, conservar el item `###` y capturar el valor actual contenido en el campo `Boxes` de la fila seleccionada.
7. Abrir el selector de campo para cambio masivo.
8. Seleccionar la opcion `BOXES`.
9. Generar un valor aleatorio de `BOXES` entre `1` y `20`, validando que sea diferente al valor de `Boxes` capturado en el paso 6.
10. Ingresar el valor generado en el formulario de `BOXES`.
11. Guardar el cambio con `Save`.
12. Aplicar el cambio masivo con `Apply`.
13. Confirmar que el proceso `Apply` finalice correctamente mediante mensaje o estado de exito.
14. Navegar a `Sales -> New -> Order Entry`.
15. Buscar la orden usando el prefijo capturado.
16. Si despues de la consulta no se visualiza el valor `BOXES` esperado por carga lenta de la pagina, esperar hasta 1 minuto y volver a realizar la consulta en `Order Entry`.
17. Validar que el valor `BOXES` asignado se visualice en `Order Entry`.
18. Abrir BETA GR.
19. Navegar a `Compras -> Asignacion de ordenes`.
20. Aplicar el rango de fechas del mes actual.
21. Cambiar el filtro `Fecha` a `UC`.
22. Buscar la orden por el prefijo capturado, activar el filtro `Todos` y actualizar la busqueda.
23. Ubicar la fila exacta que coincida con la orden y el item capturados; si la grilla tiene varias paginas, cambiar de pagina hasta encontrar el item.
24. Validar que el campo `TOTAL` de esa fila exacta coincida con el valor `BOXES` aplicado en QU.
25. Si `TOTAL` aun no coincide, refrescar la busqueda hasta 5 intentos, esperando 30 segundos entre intentos.
26. Identificar nuevamente la fila validada usando las columnas `Orden#` e `Item` y resaltar toda la fila con borde azul y fondo azul claro.
27. Confirmar que la fila resaltada corresponde al item modificado y tomar la evidencia final en GR.
28. Cerrar las paginas del navegador y finalizar el test.
29. Generar el documento Word con las capturas recientes relevantes de la ejecucion, excluyendo capturas redundantes.
30. Generar el video completo de la ejecucion en la carpeta de evidencias, reemplazando el video del mismo dia si ya existe.

## Reglas de validacion

- El `Order Reference` debe capturarse desde la fila seleccionada en Bulk Changes.
- El prefijo de orden debe tener formato `XX####`.
- El item de la orden debe capturarse desde el `Order Reference` completo y usarse en la validacion de BETA GR.
- El valor actual de `Boxes` debe capturarse desde la fila seleccionada antes de aplicar el cambio masivo.
- El valor `BOXES` debe ser numerico y estar entre `1` y `20`.
- El valor aleatorio de `BOXES` generado para el cambio debe ser diferente al valor de `Boxes` capturado en la fila seleccionada.
- El valor aplicado debe visualizarse en `Order Entry`.
- Si `Order Entry` tarda en cargar y no se visualiza el valor `BOXES` esperado despues de la primera consulta, la prueba debe esperar hasta 1 minuto, repetir la consulta del prefijo y volver a validar antes de fallar.
- En BETA GR, el campo `TOTAL` debe coincidir exactamente con el valor `BOXES` asignado en la fila de la orden-item capturada; no se permite validar contra otra fila de la misma orden.
- En BETA GR, despues de aplicar el rango de fechas del mes actual, se debe cambiar siempre el filtro `Fecha` a `UC` antes de validar `TOTAL`.
- En BETA GR, si la orden tiene varias paginas de resultados, la prueba debe cambiar la pagina de la grilla hasta ubicar el item capturado antes de comparar `TOTAL`; el cambio de pagina debe hacerse con espera controlada antes y despues de seleccionar la pagina para permitir que la grilla recargue.
- La evidencia final de Boxes debe resaltar toda la fila correspondiente a la orden y al item modificados, no solamente la celda `TOTAL`.
- La fila que se resalta debe identificarse mediante las celdas reales de las columnas `Orden#` e `Item`. No se debe buscar el numero del item entre todos los valores de la fila, porque valores como `1.00` en otras columnas pueden producir una coincidencia incorrecta con el item `001`.
- El resaltado debe usar borde azul `#0057d8` alrededor de la fila completa y fondo azul claro `#dbeafe` en todas sus celdas.
- Si no se puede localizar y resaltar la fila exacta de la orden-item validada, la prueba debe fallar antes de generar `17-betagr-cambio-gr-confirmado.png`.
- Esta regla de resaltar la fila completa pertenece solamente a la prueba de Boxes y no debe propagarse a otros escenarios de Bulk Changes.
- La validacion en GR puede requerir reintentos por latencia de propagacion.
- Los errores de persistencia de `qa_metrics` no bloquean la validacion funcional.

## Evidencias esperadas

El test debe generar capturas en `reports/screenshots`. El script Word debe consolidar solamente las capturas relevantes para la evidencia funcional, dejando fuera capturas redundantes aunque existan en la carpeta de screenshots.

Capturas generadas por el test:

- `01-inicio.png`
- `02-post-login.png`
- `03-bulk-changes.png`
- `04-post-search.png`
- `05-checkbox-selected.png`
- `06-after-click.png`
- `07-boxes-selected.png`
- `08-boxes-value-entered.png`
- `09-after-save.png`
- `10a-antes-apply.png`
- `10b-despues-apply-click.png`
- `10c-estado-final-apply.png`
- `11-final-state.png`
- `12-order-entry.png`
- `12-order-entry-frame.png`
- `12-order-entry-retry.png`, si aplica
- `12-order-entry-frame-retry.png`, si aplica
- `13-betagr-inicio.png`
- `14-betagr-compras.png`
- `15-betagr-asignacion-ordenes.png`
- `16-betagr-asignacion-actualizada.png`
- `16-betagr-asignacion-filtro-uc.png`, si aplica
- `16-betagr-asignacion-item-{item}-pagina-{pagina}.png`, si aplica
- `16-betagr-asignacion-refresh-{intento}.png`, si aplica
- `17-betagr-cambio-gr-confirmado.png`, con toda la fila de la orden-item modificada resaltada en azul

Capturas que deben incluirse en el documento Word:

- `01-inicio.png`
- `04-post-search.png`
- `08-boxes-value-entered.png`
- `11-final-state.png`
- `12-order-entry.png`
- `12-order-entry-frame.png`
- `13-betagr-inicio.png`
- `17-betagr-cambio-gr-confirmado.png`

Capturas redundantes que no deben incluirse en el documento Word:

- `02-post-login.png`
- `03-bulk-changes.png`
- `05-checkbox-selected.png`
- `06-after-click.png`
- `07-boxes-selected.png`
- `09-after-save.png`
- `10a-antes-apply.png`
- `10b-despues-apply-click.png`
- `10c-estado-final-apply.png`
- `14-betagr-compras.png`
- `15-betagr-asignacion-ordenes.png`
- `16-betagr-asignacion-actualizada.png`
- `16-betagr-asignacion-filtro-uc.png`

Diagnosticos principales:

- `reports/html/12-order-entry-inputs.json`
- `reports/html/12-order-entry-retry.html`, si aplica
- `reports/html/12-order-entry-inputs-retry.json`, si aplica
- `reports/html/16-betagr-total-item-{orden}-{item}-intento-{intento}-pagina-{pagina}.json`, si aplica
- `reports/html/16-betagr-total-candidatos-intento-{intento}.json`

## Documento Word

El documento Word debe generarse automaticamente en:

```text
C:\Users\DianaSPS\Documents\Pruebas Bulk Changes\Bulk-changes-Boxes_AAAAMMDD.docx
```

Las imagenes incluidas en el Word deben conservarse completas. El generador debe normalizarlas usando escalado tipo `contain`, dejando margen blanco si la proporcion de la captura no coincide con el tamano uniforme.

El Word de Boxes debe incluir `8` imagenes relevantes, segun la lista definida en `Evidencias esperadas`.

Tamano uniforme esperado:

```text
1710x971
```

## Video

La ejecucion debe guardar un video completo de la prueba en:

```text
C:\Users\DianaSPS\Documents\Pruebas Bulk Changes\Vídeo_Bulk-changes-Boxes_AAAAMMDD.webm
```

Si la prueba se ejecuta mas de una vez el mismo dia, el ultimo video debe reemplazar al anterior.

## Comando oficial

Para ejecutar la prueba visible y generar solo Word:

```powershell
npm.cmd run test:bulkchanges:boxes:visible:word
```

Para ejecutar la prueba visible y generar Word + video:

```powershell
npm.cmd run test:bulkchanges:boxes:visible:word:video
```

## Criterios de aceptacion

- La prueba finaliza con `1 passed`.
- El cambio `BOXES` queda confirmado con `Apply`.
- El valor `BOXES` se valida en `Order Entry`.
- El valor `BOXES` coincide con `TOTAL` en BETA GR para la orden-item capturada.
- La captura final de BETA GR resalta en azul toda la fila exacta de la orden-item modificada.
- El test falla si no puede identificar la fila por sus columnas `Orden#` e `Item`; no se permite resaltar otra fila por coincidencias numericas en columnas diferentes.
- En BETA GR, la prueba cambia siempre `Fecha` a `UC` despues de aplicar el rango de fechas del mes actual y antes de validar `TOTAL`.
- Se genera el documento Word en la ruta esperada.
- Se genera el video completo de la prueba en la ruta esperada.
- Si ya existe un video del mismo dia, se reemplaza por el de la ultima ejecucion.
- El documento Word incluye solo las 8 capturas relevantes definidas para Boxes.
- Las imagenes del documento Word no quedan recortadas.

## Ajuste 2026-09-01 - Filtro Fecha UC en GR

En BETA GR, despues de aplicar el rango de fechas del mes actual, la prueba debe cambiar siempre el selector `Fecha` a `UC` antes de ejecutar `Actualizar` y validar `TOTAL`.

Este ajuste deja `UC` como condicion obligatoria de consulta en BETA GR para Boxes antes de validar el campo `TOTAL`.

## Ajuste 2026-09-11 - Validacion por orden-item en GR

La validacion de BETA GR debe comparar el campo `TOTAL` en la fila exacta que coincida con la orden y el item capturados desde Bulk Changes. Si la orden tiene mas filas que las visibles en la primera pagina de la grilla, la prueba debe recorrer las paginas disponibles hasta encontrar el item objetivo y solo entonces comparar `TOTAL`. Al cambiar de pagina, la prueba debe esperar antes y despues de seleccionar la pagina para evitar leer la grilla antes de que termine de cargar.

## Ajuste 2026-09-22 - Resaltado de la fila modificada en GR

Despues de validar que `TOTAL` coincide con el valor `BOXES`, la prueba debe localizar nuevamente la fila usando las columnas `Orden#` e `Item`. La evidencia `17-betagr-cambio-gr-confirmado.png` debe mostrar toda esa fila con borde azul y fondo azul claro.

La busqueda del item debe hacerse en su celda correspondiente. No se consideran validas coincidencias del numero del item en otras columnas de la fila. Este comportamiento es especifico de Boxes.

### Ejecucion validada 2026-09-22

Comando ejecutado:

```powershell
npm.cmd run test:bulkchanges:boxes:visible:word
```

Resultado:

- Estado: exitoso, `1 passed`.
- Duracion aproximada: `2.7m`.
- Ambiente: BETA / `https://betaqu.ghtcorptest.com`.
- Orden seleccionada: `PD7028-001`.
- Prefijo usado para validaciones: `PD7028`.
- Item validado en BETA GR: `001`.
- Valor `BOXES` aplicado y validado: `1`.
- Validacion BETA GR: `TOTAL=1` para `PD7028-001`, pagina 1.
- Evidencia final revisada visualmente: toda la fila del item `001` quedo resaltada en azul; no se resalto la primera fila de la grilla.
- Documento generado: `C:\Users\DianaSPS\Documents\Pruebas Bulk Changes\Bulk-changes-Boxes_20260922.docx`.
- Imagenes incluidas en el documento: `8`.
- Error de `qa_metrics`: no bloqueante para la validacion funcional.

### Ejecucion validada 2026-09-01

Comando ejecutado:

```powershell
npm.cmd run test:bulkchanges:boxes:visible:word
```

Resultado:

- Estado: exitoso, `1 passed`.
- Ambiente: BETA / `https://betaqu.ghtcorptest.com`.
- Orden seleccionada: `PD5309-001`.
- Prefijo usado para validaciones: `PD5309`.
- Valor `BOXES` aplicado en QU: `1`.
- Confirmacion Apply: proceso finalizado correctamente con indicador de exito.
- Validacion QU Order Entry: `BOXES=1` visible para el prefijo `PD5309`.
- Regla aplicada en BETA GR: cambio obligatorio del filtro `Fecha` a `UC` despues de aplicar el rango de fecha del mes actual.
- Validacion final BETA GR: campo `TOTAL` coincide con `BOXES=1` para `PD5309`.
- Documento generado: `C:\Users\DianaSPS\Documents\Pruebas Bulk Changes\Bulk-changes-Boxes_20260901.docx`.
- Imagenes incluidas en el documento: `21`.
