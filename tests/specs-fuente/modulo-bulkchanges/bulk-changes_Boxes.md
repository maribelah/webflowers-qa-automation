# Bulk Changes Boxes - 2026-08-13

## Objetivo

Documentar las decisiones y ajustes realizados durante la sesion para que los proximos casos de prueba de Bulk Changes reutilicen los mismos criterios tecnicos y funcionales.

## Caso trabajado

- Spec principal: `tests/modulo-bulkchanges/bulk-changes_Boxes.spec.ts`
- Spec fuente: `tests/specs-fuente/modulo-bulkchanges/bulk-changes_Boxes.md`
- Caso base utilizado: `tests/modulo-bulkchanges/bulk-changes_Boxes.spec.ts`
- Modulo origen QU: Sales -> Bulk Changes
- Modulo de validacion QU: Sales -> New -> Order Entry
- Modulo de validacion BETA GR: Compras -> Asignacion de ordenes

## Flujo funcional consolidado

1. Navegar a `ENV.url`.
2. Autenticar con `ENV.usuario` y `ENV.password`.
3. Navegar a Sales -> Bulk Changes.
4. Ejecutar Search sin ajustar fechas.
5. Seleccionar el checkbox del primer registro.
6. Capturar el Order Reference completo y su prefijo `XX####`.
7. Abrir el selector de cambio masivo.
8. Seleccionar `Price`.
9. Generar un `FOB Price` aleatorio entre `1.00` y `3.00`.
10. Ingresar el valor con dos decimales en el formulario Price.
11. Guardar y aplicar el cambio masivo.
12. Ir a Order Entry y validar que el `FOB Price` asignado se visualice en QU.
13. Abrir BETA GR y navegar a Compras -> Asignacion de ordenes.
14. Buscar la orden por el prefijo capturado.
15. Validar que `Precio Unidad` coincida con el `FOB Price` asignado en QU desde Bulk Changes.
16. Reintentar hasta 5 veces si el valor aun no aparece.
17. Si coincide, cerrar las paginas del navegador y finalizar el test exitosamente.

## Regla actual de comparacion de precio

La regla vigente para `Precio Unidad` es comparar los primeros 3 numeros contra el `FOB Price` asignado en QU desde Bulk Changes.

- Se eliminan puntos, comas, simbolos de moneda y cualquier caracter no numerico.
- Se toman los primeros 3 numeros.
- Si quedan menos de 3 numeros, se completa con ceros a la derecha para formar una clave de 3 numeros.

Ejemplos:

- `1.51` -> `151`
- `151` -> `151`
- `1,51` -> `151`
- `$1.51` -> `151`

## Generacion de FOB Price

El valor se genera en centavos para evitar problemas de precision decimal:

```ts
const centavosPrice = Math.floor(Math.random() * (300 - 100 + 1)) + 100;
valorPriceAsignado = (centavosPrice / 100).toFixed(2);
```

Esto produce valores inclusivos entre `1.00` y `3.00`, siempre con un entero y dos decimales.

## Extraccion de Precio Unidad en BETA GR

La pantalla de BETA GR puede no exponer el valor visual de `Precio Unidad` alineado de forma confiable bajo el encabezado. Para reducir falsos negativos, el extractor combina:

- valores debajo del encabezado `Precio Unidad`;
- valores numericos visibles de la pantalla filtrada;
- `value`;
- atributo `value`;
- `innerText`;
- `textContent`;
- `title`;
- `aria-label`;
- tokens numericos dentro de textos compuestos.

Cada intento guarda diagnosticos en:

- `reports/html/16-betagr-precio-unidad-candidatos-intento-{intento}.json`
- `reports/html/16-betagr-precio-unidad-normalizados-intento-{intento}.json`

El JSON normalizado incluye:

- `fobPriceAsignadoQU`
- `primerosTresNumerosFobPrice`
- candidatos con `valorOriginal`, `primerosTresNumeros` y `coincideConFobPrice`

## Ejecucion visible en Chrome

Comando usado para ejecutar y visualizar:

```powershell
npx.cmd playwright test tests/modulo-bulkchanges/bulk-changes_Precio.spec.ts --project 'WebFlowers - Chrome QA' --headed
```

Cuando se requiera validar solo acceso hasta Bulk Changes:

```powershell
npx.cmd playwright test tests/modulo-bulkchanges/bulk-changes-step3.visual.spec.ts --project 'WebFlowers - Chrome QA' --headed
```

## Notas operativas

- Ignorar por ahora los errores de `qa_metrics`; no deben bloquear la validacion funcional.
- No modificar `BasePage.ts`, `base.fixture.ts`, `envConfig.ts` ni `helpers.ts` para este flujo.
- Mantener los localizadores dentro de iframes usando `iframe#left_page1` para menu y `iframe#center_page` para modulos.
- Si el test falla en la comparacion de precio, revisar primero el JSON normalizado para confirmar si el valor visual de `Precio Unidad` fue capturado.
- Si el valor visual existe pero no aparece en el JSON, ampliar el extractor antes de cambiar la regla funcional.

## Estado al cierre

- Caso Price creado y refactorizado.
- Rango actual de Price: `1.00` a `3.00`.
- Comparacion actual: primeros 3 numeros, ignorando puntos y comas.
- Especificacion fuente actualizada.
- Ejecucion visible por Chrome validada como mecanismo de observacion.

## Cierre operativo 2026-08-18

Flujos validados y dejados listos para reutilizar como base de nuevos tests:

- Cajas: `npm.cmd run test:bulkchanges:word`
- Precio: `npm.cmd run test:bulkchanges:precio:word`

Evidencias generadas en:

- `C:\Users\DianaSPS\Documents\Pruebas Bulk Changes\Bulk-changes-Boxes_20260818.docx`
- `C:\Users\DianaSPS\Documents\Pruebas Bulk Changes\Bulk-changes_Precio_20260818.docx`

Reglas de negocio confirmadas:

- El flujo de Bulk Changes debe capturar la orden seleccionada y reutilizar su prefijo para las validaciones posteriores.
- El cambio masivo debe confirmarse con Apply antes de navegar a validaciones.
- Para Cajas, el valor `BOXES` aplicado en QU debe visualizarse en Order Entry y coincidir con el campo `TOTAL` en BETA GR / Compras / Asignacion de ordenes.
- Para Precio, el `FOB Price` aplicado en QU debe visualizarse en Order Entry.
- Para Precio en BETA GR, la validacion de `Precio Unidad` compara los primeros 3 numeros normalizados contra el `FOB Price` aplicado, ignorando puntos, comas y simbolos.
- La validacion en BETA GR puede requerir refrescos/reintentos antes de que el cambio aplicado sea visible.

Ajuste integrado:

- `tests/modulo-bulkchanges/bulk-changes_Precio.spec.ts` ahora toma la captura final `reports/screenshots/17-betagr-precio-actualizado.png` despues de validar exitosamente `Precio Unidad` y antes de cerrar el navegador.
- El documento `Bulk-changes_Precio_AAAAMMDD.docx` debe incluir esa ultima imagen para evidenciar visualmente el precio actualizado.

Notas para el proximo test:

- Reutilizar los helpers locales del spec antes de mover logica compartida.
- Mantener ejecucion headed si se requiere observacion visual.
- Mantener generacion Word mediante los scripts de `scripts/generate-bulkchanges-*-word.ps1`.
- Los errores de `qa_metrics` por firewall de Azure SQL son no bloqueantes para la validacion funcional.

## Actualizacion operativa 2026-08-19

Se ejecuto nuevamente el caso base `tests/modulo-bulkchanges/bulk-changes_Boxes.spec.ts` en Chrome visible:

```powershell
npx.cmd playwright test tests/modulo-bulkchanges/bulk-changes_Boxes.spec.ts --project "WebFlowers - Chrome QA" --headed
```

Resultado de la ejecucion:

- Estado: exitoso, `1 passed`.
- Duracion aproximada: `2.4m`.
- Ambiente: BETA / `https://betaqu.ghtcorptest.com`.
- Orden seleccionada: `PB9925-001`.
- Prefijo usado para validaciones: `PB9925`.
- Valor `BOXES` aplicado: `15`.
- Confirmacion Apply: mensaje de exito detectado por `toast-success`.
- Validacion QU Order Entry: `BOXES 15` visible para el prefijo `PB9925`.
- Validacion BETA GR: campo `TOTAL` coincide con `15` en Compras -> Asignacion de ordenes.
- Documento de evidencia vigente para el caso Boxes: `Bulk-changes-Boxes_AAAAMMDD.docx`.
- Error de `qa_metrics`: no bloqueante para la validacion funcional.

## Casos de prueba Bulk Changes de inicio a fin

### Caso 1 - Cambio masivo de Cajas / BOXES

- Spec automatizado: `tests/modulo-bulkchanges/bulk-changes_Boxes.spec.ts`
- Comando con documento de evidencias: `npm.cmd run test:bulkchanges:word`
- Documento esperado: `C:\Users\DianaSPS\Documents\Pruebas Bulk Changes\Bulk-changes-Boxes_AAAAMMDD.docx`
- Modulo origen QU: Sales -> Bulk Changes
- Modulo validacion QU: Sales -> New -> Order Entry
- Modulo validacion BETA GR: Compras -> Asignacion de ordenes

Flujo funcional:

1. Navegar a `ENV.url`.
2. Iniciar sesion con `ENV.usuario` y `ENV.password`.
3. Navegar en el menu lateral a Sales -> Bulk Changes.
4. Ejecutar Search sin modificar fechas.
5. Seleccionar el checkbox del primer registro.
6. Capturar el Order Reference completo y derivar el prefijo `XX####`.
7. Abrir el selector de campo masivo.
8. Seleccionar la opcion `BOXES`.
9. Generar un valor aleatorio entre `1` y `20`.
10. Ingresar el valor en el formulario de BOXES.
11. Guardar con `Save`.
12. Aplicar el cambio masivo con `Apply`.
13. Confirmar que el proceso Apply termino correctamente mediante mensaje/estado de exito.
14. Navegar a Sales -> New -> Order Entry.
15. Buscar la orden usando el prefijo capturado.
16. Validar que el valor `BOXES` asignado se visualice en Order Entry.
17. Abrir BETA GR.
18. Navegar a Compras -> Asignacion de ordenes.
19. Aplicar el rango de fechas del mes actual.
20. Buscar por el prefijo capturado y activar el filtro Todos.
21. Validar que el campo `TOTAL` coincida exactamente con el valor `BOXES` asignado en QU.
22. Si `TOTAL` aun no coincide, refrescar la busqueda hasta 5 intentos, esperando 30 segundos entre intentos.
23. Cuando el valor coincida, tomar evidencia final y finalizar el test.

Evidencias principales:

- `reports/screenshots/01-inicio.png`
- `reports/screenshots/03-bulk-changes.png`
- `reports/screenshots/05-checkbox-selected.png`
- `reports/screenshots/08-boxes-value-entered.png`
- `reports/screenshots/10a-antes-apply.png`
- `reports/screenshots/10b-despues-apply-click.png`
- `reports/screenshots/10c-estado-final-apply.png`
- `reports/screenshots/12-order-entry.png`
- `reports/screenshots/16-betagr-asignacion-actualizada.png`
- `reports/screenshots/17-betagr-cambio-gr-confirmado.png`

Diagnosticos:

- `reports/html/12-order-entry-inputs.json`
- `reports/html/16-betagr-total-candidatos-intento-{intento}.json`

### Caso 2 - Cambio masivo de Precio / FOB Price

- Spec automatizado: `tests/modulo-bulkchanges/bulk-changes_Precio.spec.ts`
- Spec fuente: `tests/specs-fuente/modulo-bulkchanges/bulk-changes_Precio.md`
- Comando con documento de evidencias: `npm.cmd run test:bulkchanges:precio:word`
- Documento esperado: `C:\Users\DianaSPS\Documents\Pruebas Bulk Changes\Bulk-changes_Precio_AAAAMMDD.docx`

Flujo funcional:

1. Navegar a `ENV.url`.
2. Iniciar sesion con `ENV.usuario` y `ENV.password`.
3. Navegar a Sales -> Bulk Changes.
4. Ejecutar Search sin modificar fechas.
5. Seleccionar el checkbox del primer registro.
6. Capturar el Order Reference completo y el prefijo `XX####`.
7. Abrir el selector de campo masivo.
8. Seleccionar `Price`.
9. Generar un `FOB Price` aleatorio entre `1.00` y `3.00`.
10. Ingresar el valor con dos decimales en el formulario Price.
11. Guardar con `Save`.
12. Aplicar el cambio con `Apply` y confirmar exito.
13. Navegar a Sales -> New -> Order Entry.
14. Buscar la orden por el prefijo capturado.
15. Validar que el `FOB Price` asignado se visualice en Order Entry.
16. Abrir BETA GR y navegar a Compras -> Asignacion de ordenes.
17. Buscar la orden por prefijo, aplicar rango del mes y filtro Todos.
18. Extraer candidatos del campo `Precio Unidad`.
19. Normalizar el precio removiendo puntos, comas, simbolos y caracteres no numericos.
20. Comparar los primeros 3 numeros de `Precio Unidad` contra los primeros 3 numeros del `FOB Price` asignado.
21. Reintentar hasta 5 veces si el valor aun no se refleja.
22. Tomar evidencia final `17-betagr-precio-actualizado.png` y finalizar el test.

### Caso 3 - Cambio masivo de Box Code

- Spec automatizado: `tests/modulo-bulkchanges/bulk-changes_Box code.spec.ts`
- Spec fuente: `tests/specs-fuente/modulo-bulkchanges/bulk-changes_Box code.md`
- Comando con documento de evidencias: `npm.cmd run test:bulkchanges:boxcode:word`
- Documento esperado: `C:\Users\DianaSPS\Documents\Pruebas Bulk Changes\Bulk-changes_BoxCode_AAAAMMDD.docx`

Flujo funcional:

1. Navegar a `ENV.url`.
2. Iniciar sesion con `ENV.usuario` y `ENV.password`.
3. Navegar a Sales -> Bulk Changes.
4. Ejecutar Search sin modificar fechas.
5. Seleccionar el checkbox del primer registro.
6. Capturar Order Reference completo, prefijo `XX####` y Box Code actual de la fila.
7. Abrir el selector de campo masivo.
8. Seleccionar `Box Code`.
9. Leer las opciones disponibles del select del formulario.
10. Intentar seleccionar el segundo codigo disponible.
11. Si el segundo codigo coincide con el Box Code actual de la fila, seleccionar el siguiente codigo disponible.
12. Validar que exista un Box Code diferente al actual antes de continuar.
13. Guardar con `Save`.
14. Aplicar el cambio masivo con `Apply` y confirmar exito.
15. Navegar a Sales -> New -> Order Entry.
16. Buscar la orden usando el prefijo capturado.
17. Validar que el Box Code asignado se visualice en Order Entry.
18. Abrir BETA GR y navegar a Compras -> Asignacion de ordenes.
19. Buscar por prefijo, aplicar rango del mes y filtro Todos.
20. Validar que el campo `Caja` coincida con el Box Code asignado en QU.
21. Reintentar hasta 5 veces si `Caja` aun no coincide.
22. Tomar evidencia final natural en GR, incluyendo `17-betagr-box-code-confirmado.png` y `18-betagr-box-code-evidencia-gr.png`, sin modificar colores ni estilos de la pantalla.

## Reglas comunes vigentes

- Todos los flujos capturan la orden seleccionada en Bulk Changes y reutilizan su prefijo para validar en Order Entry y BETA GR.
- Todos los cambios masivos deben pasar por `Save` y luego por `Apply`.
- Las validaciones en BETA GR pueden requerir reintentos por latencia en la propagacion del cambio.
- La evidencia Word se genera desde las capturas recientes de `reports/screenshots`.
- Los documentos de evidencia quedan bajo `C:\Users\DianaSPS\Documents\Pruebas Bulk Changes`.
- Los errores de persistencia de `qa_metrics` no bloquean la prueba funcional.
