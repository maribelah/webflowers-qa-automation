# 🧪 Habilidad: Crear Datos de Prueba

## Propósito

Generar el archivo JSON de datos de prueba para un módulo de WebFlowers,
con los tres casos obligatorios (exitoso, fallido, borde) y valores representativos
del negocio listos para usar en los tests sin modificación manual.

Invocar esta habilidad cuando se necesite crear o actualizar el JSON de datos
de un requerimiento antes de escribir los tests.

---

## Cómo invocar esta habilidad

```
@workspace /crear-datos-prueba
Módulo: [nombre del módulo]
Requerimiento: [REQ-ID]
Entidad: [entidad principal — ej: Login, Purchase Order, Cliente]
Campos:
  - [campo 1]: [tipo y descripción]
  - [campo 2]: [tipo y descripción]
  - ...
Valores de catálogo reales de WebFlowers Alpha:
  - [campo de catálogo]: [valor real existente en Alpha]
  - [campo de catálogo]: [valor real existente en Alpha]
Reglas de negocio relevantes:
  - [regla 1]
  - [regla 2]
  - ...
```

---

## ⚠️ Valores de catálogo — NUNCA inventar

Campos que provienen de listas maestras de WebFlowers (vendors, clientes,
productos, métodos de envío, categorías, etc.) **nunca pueden ser inventados
por Copilot** — no tiene acceso a los datos reales del ambiente Alpha.

Si no se proporcionan los valores reales, Copilot genera datos ficticios
que no existen en el sistema y los tests fallarán.

```
// ❌ Copilot inventó este vendor — no existe en WebFlowers Alpha
"vendor": "Flores Colombianas S.A."

// ✅ Valor real proporcionado por el QA en el prompt
"vendor": "Florexpo - Central"
```

**Regla:** antes de invocar `/crear-datos-prueba`, consulta en WebFlowers Alpha
los valores reales de cada campo de catálogo e inclúyelos en el prompt bajo
la sección `Valores de catálogo reales de WebFlowers Alpha`.

---

## Nombre del archivo

```
src/data/REQ-[ID]-data.json

✅ REQ-001-data.json
✅ REQ-002-data.json
❌ loginData.json     (sin REQ-ID)
❌ procurementData.json
```

---

## Estructura obligatoria del JSON

Todo archivo en `src/data/` debe tener los tres casos obligatorios
con campo `descripcion` en cada uno:

```typescript
// Contrato de referencia (no incluir en el JSON)
interface DatosPrueba<T> {
  exitoso: T & { descripcion: string };
  fallido: T & { descripcion: string };
  borde:   T & { descripcion: string };
}
```

### Los tres casos son obligatorios

| Caso | Propósito | Qué debe representar |
|---|---|---|
| `exitoso` | Happy path | Datos válidos con valores reales de Alpha que producen el resultado esperado |
| `fallido` | Error esperado | Datos inválidos que producen un rechazo del sistema |
| `borde` | Límite del sistema | Datos en el límite exacto de las validaciones |

### Reglas para los valores

- `descripcion` en cada caso — explica la intención, no el dato
- Valores de catálogo — siempre reales de Alpha, nunca inventados
- URLs siempre en `.env` — nunca en los JSON
- Contraseñas reales solo en `.env` — usar valores genéricos en JSON
- Fechas en formato `DD/MM/YYYY` — formato colombiano de WebFlowers
- Valores monetarios como entero COP sin decimales: `15500`
- IDs de referencia cruzada — usar valores conocidos de Alpha

---

## Ejemplos completos generados

### Login

```json
{
  "exitoso": {
    "usuario": "qaauto",
    "password": "qaauto",
    "descripcion": "Usuario con acceso completo al sistema"
  },
  "fallido": {
    "usuario": "qaauto",
    "password": "password_incorrecta",
    "descripcion": "Contraseña incorrecta — debe mostrar mensaje de error"
  },
  "borde": {
    "usuario": "",
    "password": "",
    "descripcion": "Campos vacíos — el formulario debe bloquear el envío"
  }
}
```

### Purchase Order (con valores reales de Alpha)

```json
{
  "exitoso": {
    "vendor": "Florexpo - Central",
    "shipVia": "Express 24h",
    "orderDate": "01/06/2026",
    "requiredDate": "03/06/2026",
    "quantity": 50,
    "unitPrice": 15500,
    "descripcion": "Pedido válido con vendor real de WebFlowers Alpha"
  },
  "fallido": {
    "vendor": "",
    "shipVia": "Standard",
    "orderDate": "02/06/2026",
    "requiredDate": "01/06/2026",
    "quantity": -10,
    "unitPrice": 0,
    "descripcion": "Vendor vacío, requiredDate anterior a orderDate, cantidad negativa, precio cero"
  },
  "borde": {
    "vendor": "Florexpo - Central",
    "shipVia": "Local",
    "orderDate": "01/06/2026",
    "requiredDate": "01/06/2026",
    "quantity": 1,
    "unitPrice": 1,
    "descripcion": "Fecha requerida igual a fecha de orden, cantidad mínima, precio mínimo"
  }
}
```

---

## Casos adicionales opcionales

```json
{
  "exitoso": { ... },
  "fallido": { ... },
  "borde": { ... },

  "sinPermiso": {
    "usuario": "usuario_consulta",
    "password": "qaauto",
    "descripcion": "Usuario con rol solo lectura intentando ejecutar acción de escritura"
  }
}
```

> Los casos adicionales complementan los tres obligatorios, nunca los reemplazan.

---

## Consideraciones de métricas

- El campo `descripcion` debe ser claro para que en Power BI
  se entienda qué se probó sin abrir el código
- Valores de catálogo incorrectos generan fallos en los tests
  que se registran como `FAILED` en `qa_metrics` — afectan
  las métricas de cobertura del módulo

---

## Checklist de entregables

Antes de dar por completado el JSON, verificar:

- [ ] Nombre: `REQ-[ID]-data.json` en `src/data/`
- [ ] Tres casos obligatorios: `exitoso`, `fallido`, `borde`
- [ ] Campo `descripcion` en cada caso
- [ ] Valores de catálogo verificados en WebFlowers Alpha — no inventados
- [ ] Sin URLs ni contraseñas reales
- [ ] Fechas en formato `DD/MM/YYYY`
- [ ] Valores monetarios como entero COP sin decimales
- [ ] Caso `exitoso` produce el happy path sin ambigüedad
- [ ] Caso `fallido` produce un rechazo específico y conocido
- [ ] Caso `borde` prueba el límite real del sistema

---

*webflowers-qa-automation — .github/prompts/crear-datos-prueba.prompt.md*
*Versión 2.0 — Mayo 2026 — Alineado con SDD v4.3*
*Cambios v2.0: REQ-ID en nombre del archivo, sección de valores de catálogo,
advertencia explícita de no inventar datos de listas maestras de WebFlowers*