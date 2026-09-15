# Bulk Changes - Product Name

## Objetivo

Validar que el cambio masivo de `Product Name` realizado en QU desde `Sales -> Bulk Changes` se aplique correctamente sobre la orden seleccionada, se refleje en `Sales -> New -> Order Entry` en el campo `Product`, y quede registrado en BETA GR dentro de la seccion `Historia` del detalle asociado a la fila principal capturada.

El documento de evidencias debe generarse automaticamente en Word al finalizar la ejecucion.

## Archivos relacionados

- Spec automatizado: `tests/modulo-bulkchanges/bulk-changes_ProductName.spec.ts`
- Spec fuente: `tests/specs-fuente/modulo-bulkchanges/bulk-changes_ProductName.md`
- Script Word: `scripts/generate-bulkchanges-productname-word.ps1`
- Comando con evidencia Word: `npm.cmd run test:bulkchanges:productname:visible:word`
- Comando con evidencia Word y video: `npm.cmd run test:bulkchanges:productname:visible:word:video`
- Documento esperado: `C:\Users\DianaSPS\Documents\Pruebas Bulk Changes\Bulk-changes-ProductName_AAAAMMDD.docx`

## Flujo esperado

1. Navegar a `ENV.url`.
2. Iniciar sesion con `ENV.usuario` y `ENV.password`.
3. Navegar a `Sales -> Bulk Changes`.
4. Ejecutar `Search` sin modificar fechas.
5. Seleccionar el checkbox del primer registro visible.
6. Capturar el `Order Reference` completo y derivar su prefijo `XX####`.
7. Capturar el item del `Order Reference` completo.
8. Capturar los 15 primeros caracteres del campo `Product Name`.
9. Abrir el selector de campo para cambio masivo.
10. Seleccionar la opcion `Product Name`.
11. Ingresar en la caja de texto `Adjusted Name` el valor del campo `Product Name` capturado, concatenarlo con el texto `PRUEBAS QA` y finalmente concatenarlo con el dia y hora de ejecucion en formato `AAAA/MM/DD HH:MM:SS`.
12. Guardar el cambio con `Save`.
13. Aplicar el cambio masivo con `Apply`.
14. Confirmar que el proceso `Apply` finalice correctamente mediante mensaje o estado de exito.
15. Navegar a `Sales -> New -> Order Entry`.
16. Buscar la orden usando el prefijo capturado.
17. Validar que el valor `Adjusted Name` asignado se visualice en `Order Entry` en el campo `Product`.
18. Abrir BETA GR.
19. Navegar a `Compras -> Asignacion de ordenes`.
20. Aplicar el rango de fechas del mes actual.
21. Cambiar el filtro `Fecha` a `UC`.
22. Buscar la orden por el prefijo capturado y activar el filtro `Todos`.
23. Ubicar el registro correspondiente al `Order Reference` e item capturados usando solo celdas directas de la fila principal.
24. Presionar el boton `+` de la fila encontrada para desplegar el detalle.
25. Hacer clic explicitamente en la pestana `Historia` del detalle expandido.
26. Confirmar que el detalle quede expandido y la pestana `Historia` quede visible/activa.
27. Leer, en la ultima fila del bloque generado donde la columna `Changed By` sea igual a `BK - Diana Davila`, la columna `Log Date` sea igual a la fecha actual en formato `MM/DD/YYYY` y la columna `Field Name` sea igual a `Product Name`, el valor visible en la columna `New Value` de la seccion `Historia`.
28. Comparar el `Adjusted Name` guardado contra `New Value`.
29. Si `Adjusted Name` no coincide o el detalle no queda desplegado, repetir el proceso completo hasta 5 intentos.
30. La coincidencia en GR debe salir del bloque de detalle asociado a la fila principal del item capturado; no se permite usar una busqueda global en toda la pantalla.
31. Tan pronto se valide la coincidencia, guardar la evidencia visual del detalle expandido en GR con la pestana `Historia` activa y la celda `New Value` validada resaltada.
32. Dejar que Playwright cierre el navegador al finalizar.
33. Generar el documento Word con las capturas recientes de la ejecucion.

## Reglas de validacion

- El `Order Reference` completo debe capturarse desde la fila seleccionada en Bulk Changes.
- El prefijo de orden debe tener formato `XX####`.
- El item capturado debe provenir del sufijo del `Order Reference`, por ejemplo `001`.
- El valor base de `Product Name` debe tomarse de la fila seleccionada y recortarse a sus primeros 15 caracteres visibles.
- El `Adjusted Name` esperado se construye como `<Product Name 15 caracteres> PRUEBAS QA <AAAA/MM/DD HH:MM:SS>`.
- La fecha/hora concatenada al `Adjusted Name` debe corresponder al momento de inicio de la ejecucion del test y debe usar formato de 24 horas.
- El valor aplicado debe visualizarse en `Order Entry` en el campo `Product`.
- En BETA GR, la validacion debe hacerse dentro del detalle expandido de la fila principal que coincida con el prefijo y el item capturados.
- En BETA GR, la pestana `Historia` debe abrirse con clic explicito antes de leer `New Value`; no es valido quedarse en `Receta del Producto`.
- En BETA GR, el filtro `Fecha` debe cambiarse a `UC` antes de validar `Historia`.
- El valor de `New Value` en la ultima fila de `Historia` cuyo `Changed By` sea igual a `BK - Diana Davila`, cuyo `Log Date` sea igual a la fecha actual en formato `MM/DD/YYYY` y cuyo `Field Name` sea igual a `Product Name` debe coincidir con el `Adjusted Name` asignado.
- La validacion en GR puede requerir reintentos por latencia de propagacion, hasta un maximo de 5 intentos.
- Los errores de persistencia de `qa_metrics` no bloquean la validacion funcional.

## Evidencias esperadas

El test debe generar capturas en `reports/screenshots`. El script Word debe consolidar solamente las capturas relevantes para la evidencia funcional.

Capturas principales generadas por el test:

- `01-inicio.png`
- `02-post-login.png`
- `03-bulk-changes.png`
- `04-post-search.png`
- `05-checkbox-selected.png`
- `06-after-click.png`
- `07-product-name-selected.png`
- `08-product-name-value-entered.png`
- `09-after-save.png`
- `10a-antes-apply.png`
- `10b-despues-apply-click.png`
- `10c-estado-final-apply.png`
- `11-final-state.png`
- `12-order-entry.png`
- `12-order-entry-frame.png`
- `13-betagr-inicio.png`
- `14-betagr-compras.png`
- `15-betagr-asignacion-ordenes.png`
- `16-betagr-asignacion-actualizada.png`
- `16-betagr-asignacion-refresh-{intento}.png`, si aplica
- `16d-betagr-asignacion-historia-intento-{intento}.png`
- `17-betagr-product-name-historia-confirmado.png`

Capturas incluidas en el documento Word:

- `01-inicio.png`
- `04-post-search.png`
- `05-checkbox-selected.png`
- `08-product-name-value-entered.png`
- `11-final-state.png`
- `12-order-entry.png`
- `12-order-entry-frame.png`
- `13-betagr-inicio.png`
- `16d-betagr-asignacion-historia-intento-1.png`
- `17-betagr-product-name-historia-confirmado.png`

Diagnosticos principales:

- `reports/html/04-center.html`
- `reports/html/05a-antes-checkbox.html`
- `reports/html/05b-despues-checkbox.html`
- `reports/html/10-apply-final.html`
- `reports/html/11-final-state.html`
- `reports/html/12-order-entry.html`
- `reports/html/12-order-entry-product-values-intento-{intento}.json`
- `reports/html/16-betagr-product-name-historia-intento-{intento}.json`

## Documento Word

El documento Word debe generarse automaticamente en:

```text
C:\Users\DianaSPS\Documents\Pruebas Bulk Changes\Bulk-changes-ProductName_AAAAMMDD.docx
```

Si la prueba se ejecuta mas de una vez el mismo dia, el archivo Word del mismo dia debe sobrescribirse con la ultima ejecucion cuando no este abierto o bloqueado por Word.

Las imagenes incluidas en el Word deben conservarse completas. El generador debe normalizarlas usando escalado tipo `contain`, dejando margen blanco si la proporcion de la captura no coincide con el tamano uniforme.

Tamano uniforme esperado:

```text
1710x971
```

## Comando oficial

Para ejecutar la prueba visible y generar Word:

```powershell
npm.cmd run test:bulkchanges:productname:visible:word
```

Para ejecutar la prueba visible y generar Word + video:

```powershell
npm.cmd run test:bulkchanges:productname:visible:word:video
```

Para ejecutar solo la prueba visible sin generar Word:

```powershell
npm.cmd run test:bulkchanges:productname:visible
```

## Criterios de aceptacion

- La prueba finaliza con `1 passed`.
- El cambio `Product Name` queda confirmado con `Apply`.
- El valor `Adjusted Name` se valida en `Order Entry` como `Product`.
- En BETA GR se consulta `Compras -> Asignacion de ordenes`, se cambia `Fecha` a `UC`, se expande la fila principal del item capturado con `+` y se visualiza `Historia`.
- El valor `New Value` de la ultima fila de `Historia` cuyo `Changed By` sea igual a `BK - Diana Davila`, cuyo `Log Date` sea igual a la fecha actual en formato `MM/DD/YYYY` y cuyo `Field Name` sea igual a `Product Name` coincide con el `Adjusted Name` asignado y queda resaltado en la evidencia visual.
- La validacion de `New Value` se hace dentro del detalle asociado a la fila principal del item capturado.
- Se genera el documento Word en la ruta esperada.
- Si ya existe un documento Word del mismo dia y no esta bloqueado, se reemplaza por el de la ultima ejecucion.

## Ajuste 2026-09-10 - Validacion precisa de Historia en GR

La validacion de BETA GR debe abrir explicitamente la pestana `Historia` despues de expandir la fila principal del item capturado. La fila usada para comparar `New Value` no debe ser la ultima fila absoluta del historial, porque otros usuarios pueden registrar cambios sobre la misma orden durante el dia.

La fila valida de `Historia` debe ser la ultima fila visible que cumpla simultaneamente:

- `Changed By` igual a `BK - Diana Davila`.
- `Log Date` igual a la fecha actual de ejecucion en formato `MM/DD/YYYY`.
- `Field Name` igual a `Product Name`.

Una vez ubicada esa fila, el test compara el valor de `New Value` contra el `Adjusted Name` aplicado en QU y validado en Order Entry. El `Adjusted Name` incluye el sufijo `PRUEBAS QA` y la fecha/hora de ejecucion en formato `AAAA/MM/DD HH:MM:SS`. La evidencia visual final debe mostrar la pestana `Historia` activa y la fila/celda validada resaltada.

### Ejecucion validada 2026-09-10

Comando ejecutado:

```powershell
npm.cmd run test:bulkchanges:productname:visible:word
```

Resultado:

- Estado: exitoso, `1 passed`.
- Ambiente: BETA / `https://betaqu.ghtcorptest.com`.
- Orden seleccionada: `PD4377-004`.
- Prefijo usado para validaciones: `PD4377`.
- Item validado en GR: `004`.
- `Product Name` base capturado: `PHOENIX - POM 9`.
- `Adjusted Name` aplicado: `PHOENIX - POM 9 PRUEBAS QA 2026/09/10 16:29:29`.
- Validacion QU Order Entry: `Product` muestra `PHOENIX - POM 9 PRUEBAS QA 2026/09/10 16:29:29`.
- Validacion BETA GR: detalle de `Asignacion de ordenes` expandido y pestana `Historia` abierta.
- Fila de Historia validada: `Changed By = BK - Diana Davila`, `Log Date = 09/10/2026`, `Field Name = Product Name`.
- `New Value` validado: `PHOENIX - POM 9 PRUEBAS QA 2026/09/10 16:29:29`.
- Documento generado: `C:\Users\DianaSPS\Documents\Pruebas Bulk Changes\Bulk-changes-ProductName_20260910.docx`.
- Imagenes incluidas en el documento: `10`.
