# 📊 Prompt: Crear Datos de Prueba

Este prompt genera o actualiza un JSON de datos de prueba para un módulo.

---

## Instrucciones para el Agente

**Antes de generar código, lee:**
`.github/copilot-instructions.md` — Sección "Al generar datos de prueba"

---

## Datos a solicitar al QA

**Nombre del módulo:**
[Nombre del módulo, ej: "inventario", "clientes", "pedidos"]

**Estructura de datos del caso exitoso:**
Describe los campos necesarios:
```
- Campo 1: [nombre] — [tipo] — [valor de ejemplo]
- Campo 2: [nombre] — [tipo] — [valor de ejemplo]
...
```

Ejemplo:
```
- codigo: string — "PROD-001"
- nombre: string — "Rosa Roja Premium"
- precio: number — 15000
```

**Descripción del caso exitoso:**
[Descripción breve, ej: "Producto válido con todos los campos completos"]

**Descripción del caso fallido:**
[Qué se prueba, ej: "Producto con precio negativo"]

**Descripción del caso borde:**
[Qué se prueba, ej: "Campos vacíos, validación de formulario"]

---

## Reglas obligatorias

1. **Siempre incluir los tres casos:** `exitoso`, `fallido`, `borde`
2. **Cada caso debe tener campo `descripcion`**
3. **URLs nunca en JSON** — van en `.env`
4. **Contraseñas reales nunca en JSON** — usar valores genéricos
5. **Valores de ejemplo realistas** — no usar "test123", etc.

---

## Qué generar

Genera el archivo `src/data/[modulo]Data.json` con esta estructura:

```json
{
  "exitoso": {
    "campo1": "valor1",
    "campo2": "valor2",
    "descripcion": "Descripción del caso exitoso"
  },
  "fallido": {
    "campo1": "valor_que_causa_error",
    "campo2": "valor2",
    "descripcion": "Descripción del caso fallido"
  },
  "borde": {
    "campo1": "",
    "campo2": "",
    "descripcion": "Descripción del caso borde"
  }
}
```

---

## Ejemplo de salida esperada

```json
{
  "exitoso": {
    "codigo": "PROD-001",
    "nombre": "Rosa Roja Premium",
    "precio": 15000,
    "descripcion": "Producto válido con todos los campos completos"
  },
  "fallido": {
    "codigo": "PROD-002",
    "nombre": "Rosa Blanca",
    "precio": -100,
    "descripcion": "Producto con precio negativo para validar error"
  },
  "borde": {
    "codigo": "",
    "nombre": "",
    "precio": 0,
    "descripcion": "Campos vacíos, validación de formulario"
  }
}
```

---

*webflowers-qa-automation — .github/prompts/crear-datos-prueba.prompt.md*
