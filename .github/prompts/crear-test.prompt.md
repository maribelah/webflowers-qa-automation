# 🧪 Prompt: Crear Test Completo

Este prompt genera un test completo desde cero, incluyendo:
- Page Class del módulo
- Spec con 3 casos de prueba (exitoso, fallido, borde)
- JSON de datos de prueba
- DB helper si se requiere validación de base de datos

---

## Instrucciones para el Agente

**Antes de generar código, lee:**
1. `.github/copilot-instructions.md` — Convenciones del proyecto
2. Solicita al QA los siguientes campos

---

## Datos a solicitar al QA

**Módulo:**
[Nombre del módulo, ej: "Inventario", "Pedidos", "Clientes"]

**Pantalla:**
[Nombre de la pantalla, ej: "Crear Producto", "Editar Cliente"]

**Funcionalidad:**
[Descripción de lo que se prueba, ej: "El sistema permite crear un nuevo producto con código, nombre y precio"]

**Pasos del flujo:**
1. [Paso 1]
2. [Paso 2]
3. [Paso 3]
...

**Resultado esperado:**
[Qué debe ocurrir al finalizar, ej: "El producto se crea exitosamente y aparece en la lista de inventario"]

**Validación en BD (opcional):**
[Qué validar en la base de datos, ej: "Verificar que existe el registro en la tabla Productos con el código generado"]

**Elementos de la pantalla:**
- Campo 1: [descripción, ej: "Input de código de producto"]
- Campo 2: [descripción, ej: "Input de nombre"]
- Botón 1: [descripción, ej: "Botón Guardar"]
...

**¿Requiere login previo?**
[Sí / No]

---

## Qué generar

Con la información anterior, genera:

### 1. Page Class (`src/pages/[Modulo]Page.ts`)
- Extiende de `BasePage`
- Localizadores `readonly` en el constructor
- Métodos de interacción con la pantalla
- JSDoc en cada método

### 2. Test Spec (`tests/modulo-[nombre]/[nombre].spec.ts`)
- Caso exitoso
- Caso fallido (validación de error)
- Caso borde (campos vacíos o valores límite)
- `test.step()` en cada acción
- Screenshots secuenciales

### 3. Datos de prueba (`src/data/[modulo]Data.json`)
- Tres casos: `exitoso`, `fallido`, `borde`
- Campo `descripcion` en cada caso

### 4. DB Helper (opcional, si aplica validación BD)
- Agregar función en `src/utils/dbHelper.ts`
- Usar `request().input()` con tipos explícitos

---

## Ejemplo de uso

```
Módulo: Inventario
Pantalla: Crear Producto
Funcionalidad: El sistema permite crear un nuevo producto ingresando código, nombre y precio
Pasos del flujo:
  1. Click en el botón "Nuevo Producto"
  2. Ingresar código del producto
  3. Ingresar nombre del producto
  4. Ingresar precio del producto
  5. Click en "Guardar"
Resultado esperado: El producto se crea y aparece en la lista de inventario
Validación en BD: Verificar que existe el registro en tabla Productos
Elementos de la pantalla:
  - Input código: [data-testid="product-code"]
  - Input nombre: [data-testid="product-name"]
  - Input precio: [data-testid="product-price"]
  - Botón Guardar: [data-testid="save-button"]
¿Requiere login previo? Sí
```

---

*webflowers-qa-automation — .github/prompts/crear-test.prompt.md*
