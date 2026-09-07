# Prompts fuente de pruebas - WebFlowers QA Automation

## Arquitectura revalidada

El proyecto mantiene una arquitectura de automatizacion UI con Playwright y TypeScript basada en separacion por responsabilidades:

- `tests/`: specs ejecutables por modulo y requerimiento.
- `src/pages/`: Page Objects con localizadores y acciones de pantalla.
- `src/tasks/`: flujos de negocio reutilizables que orquestan Page Objects.
- `src/fixtures/`: fixture base con setup, teardown, conexion BD y screenshots en fallo.
- `src/utils/`: configuracion de ambiente, helpers, conexion BD y reporter de metricas.
- `src/data/`: datos de prueba estaticos para casos negativos o borde.
- `tests/specs-fuente/`: prompts, requerimientos y trazabilidad funcional de los tests.

Reglas vigentes observadas:

- Los specs importan `test` y `expect` desde `src/fixtures/base.fixture.ts`.
- Las credenciales del ambiente activo se consumen desde `ENV`.
- Las pantallas principales de WebFlowers usan iframes:
  - Header: `iframe#top_Page2`.
  - Menu lateral: `iframe#left_page1`.
  - Contenido principal: `iframe#center_page`.
- Las pruebas generan screenshots en `reports/screenshots/`.
- REQ001 genera evidencia adicional como attachment `REQ001-evidencia-flujo.md`.

---

## Prompt fuente - Login exitoso

**Archivo spec:** `tests/modulo-login/login-exitoso.spec.ts`

```text
@Workspace

Modulo: Login
Requerimiento: Login exitoso
Funcionalidad: autenticar un usuario valido en WebFlowers CRM.

Objetivo:
Validar que un usuario con credenciales validas del ambiente activo pueda iniciar sesion y acceder al dashboard principal.

Datos:
- Usuario: tomar desde ENV.usuario.
- Password: tomar desde ENV.password.
- URL: tomar desde ENV.url.

Flujo exitoso:
1. Navegar a la URL del ambiente activo.
2. Capturar screenshot de la pagina de login.
3. Ingresar usuario y password validos.
4. Hacer clic en el boton Sign In / Ingresar.
5. Capturar screenshot posterior al envio de credenciales.
6. Validar que no se muestre mensaje de error de login.
7. Validar que el dashboard haya cargado usando elementos del iframe `iframe#top_Page2`.
8. Validar que `#txtWFLabel` sea visible.
9. Validar que `#headerWFLogoContainer` sea visible.
10. Capturar screenshot del dashboard cargado.
11. Intentar obtener el nombre del usuario visible en el dashboard.
12. Registrar el nombre como anotacion si existe.
13. Capturar screenshot final de validacion.

Resultado esperado:
El usuario inicia sesion correctamente y se visualiza el dashboard de WebFlowers.

Page Classes:
- `LoginPage.ts`
- `DashboardPage.ts`

Validacion BD:
No aplica para el flujo funcional, aunque el fixture base verifica conexion BD antes de ejecutar.
```

---

## Prompt fuente - Login fallido con password incorrecto

**Archivo spec:** `tests/modulo-login/login-fallido.spec.ts`

```text
@Workspace

Modulo: Login
Requerimiento: Login fallido
Funcionalidad: validar rechazo de credenciales invalidas.

Objetivo:
Confirmar que WebFlowers no permite iniciar sesion con password incorrecto y muestra un mensaje de error.

Datos:
- Usuario: `loginData.fallido.usuario`.
- Password: `loginData.fallido.password`.
- URL: tomar desde ENV.url mediante `LoginPage.navegarAlInicio()`.

Flujo negativo:
1. Navegar a la pagina de login del ambiente activo.
2. Capturar screenshot inicial.
3. Ingresar usuario valido con password incorrecto.
4. Hacer clic en el boton Sign In / Ingresar.
5. Capturar screenshot posterior al envio.
6. Validar que el mensaje de error sea visible.
7. Obtener el texto del mensaje de error.
8. Validar que el texto del error no este vacio.
9. Capturar screenshot del error visible.
10. Validar que el usuario permanece en la pantalla de login.
11. Capturar screenshot final.

Resultado esperado:
La aplicacion rechaza las credenciales invalidas, muestra error y mantiene al usuario en login.

Page Classes:
- `LoginPage.ts`

Datos de prueba:
- `src/data/loginData.json`

Validacion BD:
No aplica para el flujo funcional, aunque el fixture base verifica conexion BD antes de ejecutar.
```

---

## Prompt fuente - Login con campos vacios

**Archivo spec:** `tests/modulo-login/login-fallido.spec.ts`

```text
@Workspace

Modulo: Login
Requerimiento: Validacion de formulario de login
Funcionalidad: validar comportamiento cuando usuario y password estan vacios.

Objetivo:
Confirmar que WebFlowers no permite enviar login con campos vacios y muestra validacion o mensaje de error.

Datos:
- Usuario: `loginData.borde.usuario`.
- Password: `loginData.borde.password`.
- URL: tomar desde ENV.url mediante `LoginPage.navegarAlInicio()`.

Flujo borde:
1. Navegar a la pagina de login del ambiente activo.
2. Capturar screenshot inicial.
3. Intentar hacer login con usuario vacio y password vacio.
4. Capturar screenshot posterior al submit.
5. Validar que la aplicacion permanece en login.
6. Validar que se muestra mensaje de error o validacion de formulario.
7. Obtener el mensaje visible.
8. Validar que el mensaje no sea nulo y no este vacio.
9. Capturar screenshot final.

Resultado esperado:
La aplicacion no navega al dashboard y muestra una validacion visible para los campos requeridos.

Page Classes:
- `LoginPage.ts`

Datos de prueba:
- `src/data/loginData.json`

Validacion BD:
No aplica para el flujo funcional, aunque el fixture base verifica conexion BD antes de ejecutar.
```

---

## Prompt fuente - REQ001 New PO

**Archivo spec:** `tests/modulo-procurement/REQ001-new-po.spec.ts`

```text
@Workspace

Modulo: Procurement / Products / New PO
Requerimiento: REQ001 - New PO
Funcionalidad: generar una Purchase Order de productos.

Objetivo:
Validar que un usuario autenticado pueda crear una nueva Purchase Order desde Procurement > Products > New PO, agregando producto, customer, FOB y guardando la PO.

Datos:
- URL, usuario y password desde ENV.
- Integration code: `CBMC-C165`.
- Vendor preferido: `HOLEX`.
- Customer preferido: `10156083-6083 BC TEMPLE WAL-MART`.
- Boxes: `6`.
- FOB Location Type: `Miami, FL`.

Flujo exitoso:
1. Navegar a la URL del ambiente activo.
2. Iniciar sesion con credenciales del ambiente activo.
3. Validar dashboard usando el iframe `iframe#top_Page2`.
4. Navegar por el menu lateral a Procurement.
5. Expandir Products.
6. Hacer clic en New PO.
7. Validar que cargue `Procurement - New Purchase Order [Products]`.
8. Validar campos visibles: Vendor, Order Type, Due Date, Vendor Shipment Date, Storage y Save.
9. Ingresar la fecha actual en Due Date.
10. Ingresar la fecha actual en Vendor Shipment Date.
11. Seleccionar vendor preferido `HOLEX`; si no existe, usar vendor valido de respaldo.
12. Si aparece SweetAlert de landed cost, aceptar `Yes, overwrite!`.
13. Seleccionar Quick Search desde `cmbAddProduct`.
14. Validar que aparezca el modal Search Quick Product.
15. Buscar el producto por integration code `CBMC-C165`.
16. Seleccionar el resultado encontrado.
17. Hacer clic en Add.
18. Validar que el integration code aparezca en el panel inferior.
19. Ingresar `6` en Boxes.
20. Seleccionar el customer preferido `10156083-6083 BC TEMPLE WAL-MART`; si no queda visible, usar customer valido de respaldo.
21. Seleccionar FOB Location Type `Miami, FL`.
22. Hacer clic en Save.
23. Esperar que aparezca y desaparezca el mensaje `Working...`.
24. Validar que el campo P.O. # cambie de `New Order` a un numero.
25. Capturar screenshot de la PO guardada.
26. Aceptar popup de Purchase Order guardada si aparece.
27. Validar que el numero de PO visible coincide con el numero capturado despues de guardar.
28. Adjuntar evidencia paso a paso como `REQ001-evidencia-flujo.md`.

Resultado esperado:
La Purchase Order se crea correctamente y se visualiza un numero de P.O. numerico.

Page Classes:
- `DashboardPage.ts`
- `REQ001-NewPOPage.ts`

Tasks:
- `AuthTasks.ts`
- `ProcurementTasks.ts`

Validacion BD:
No aplica para este requerimiento.

Evidencias:
- Screenshots secuenciales en `reports/screenshots/REQ001-*`.
- Attachment markdown `REQ001-evidencia-flujo.md` con estado, detalle y duracion de cada paso.
```

