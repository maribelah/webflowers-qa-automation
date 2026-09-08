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
6. Capturar el `Order Reference` completo y derivar su prefijo `XX####`.
7. Abrir el selector de campo para cambio masivo.
8. Seleccionar la opcion `BOXES`.
9. Generar un valor aleatorio de `BOXES` entre `1` y `20`.
10. Ingresar el valor generado en el formulario de `BOXES`.
11. Guardar el cambio con `Save`.
12. Aplicar el cambio masivo con `Apply`.
13. Confirmar que el proceso `Apply` finalice correctamente mediante mensaje o estado de exito.
14. Navegar a `Sales -> New -> Order Entry`.
15. Buscar la orden usando el prefijo capturado.
16. Validar que el valor `BOXES` asignado se visualice en `Order Entry`.
17. Abrir BETA GR.
18. Navegar a `Compras -> Asignacion de ordenes`.
19. Aplicar el rango de fechas del mes actual.
20. Buscar la orden por el prefijo capturado y activar el filtro `Todos`.
21. Si no se encuentran ordenes despues de buscar por prefijo con el filtro `Todos`, cambiar el filtro `Fecha` a `UC` y actualizar nuevamente.
22. Validar que el campo `TOTAL` coincida exactamente con el valor `BOXES` aplicado en QU.
23. Si `TOTAL` aun no coincide, refrescar la busqueda hasta 5 intentos, esperando 30 segundos entre intentos.
24. Tomar evidencia final en GR.
25. Cerrar las paginas del navegador y finalizar el test.
26. Generar el documento Word con las capturas recientes relevantes de la ejecucion, excluyendo capturas redundantes.
27. Generar el video completo de la ejecucion en la carpeta de evidencias, reemplazando el video del mismo dia si ya existe.

## Reglas de validacion

- El `Order Reference` debe capturarse desde la fila seleccionada en Bulk Changes.
- El prefijo de orden debe tener formato `XX####`.
- El valor `BOXES` debe ser numerico y estar entre `1` y `20`.
- El valor aplicado debe visualizarse en `Order Entry`.
- En BETA GR, el campo `TOTAL` debe coincidir exactamente con el valor `BOXES` asignado.
- Si BETA GR no devuelve ordenes usando el filtro de fecha inicial y `Todos`, se debe cambiar el filtro `Fecha` a `UC` antes de validar `TOTAL`.
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
- `13-betagr-inicio.png`
- `14-betagr-compras.png`
- `15-betagr-asignacion-ordenes.png`
- `16-betagr-asignacion-actualizada.png`
- `16-betagr-asignacion-filtro-uc.png`, si aplica
- `16-betagr-asignacion-refresh-{intento}.png`, si aplica
- `17-betagr-cambio-gr-confirmado.png`

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
- `reports/html/16-betagr-total-candidatos-filtro-fecha-original.json`, si aplica
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
- El valor `BOXES` coincide con `TOTAL` en BETA GR.
- Si no hay ordenes visibles en GR con el filtro de fecha inicial, la prueba cambia `Fecha` a `UC` y repite la busqueda antes de fallar.
- Se genera el documento Word en la ruta esperada.
- Se genera el video completo de la prueba en la ruta esperada.
- Si ya existe un video del mismo dia, se reemplaza por el de la ultima ejecucion.
- El documento Word incluye solo las 8 capturas relevantes definidas para Boxes.
- Las imagenes del documento Word no quedan recortadas.

## Ajuste 2026-09-01 - Filtro Fecha UC en GR

Cuando BETA GR no devuelve ordenes despues de buscar por el prefijo capturado y activar el filtro `Todos`, la prueba debe cambiar el selector `Fecha` a `UC` y ejecutar `Actualizar` nuevamente. La validacion de `TOTAL` se realiza despues de ese fallback.

Este ajuste cubre el caso observado con `PD5309`, donde la orden no aparecia con el filtro de fecha inicial, pero si estaba disponible al cambiar `Fecha` a `UC`.

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
- Validacion inicial BETA GR: no se encontraron ordenes con el filtro de fecha del mes actual y filtro `Todos`.
- Fallback aplicado en BETA GR: cambio del filtro `Fecha` a `UC` y nueva ejecucion de `Actualizar`.
- Validacion final BETA GR: campo `TOTAL` coincide con `BOXES=1` para `PD5309`.
- Documento generado: `C:\Users\DianaSPS\Documents\Pruebas Bulk Changes\Bulk-changes-Boxes_20260901.docx`.
- Imagenes incluidas en el documento: `21`.
