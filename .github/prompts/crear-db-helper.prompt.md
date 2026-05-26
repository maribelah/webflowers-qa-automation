# 🗄️ Prompt: Crear Helper de Base de Datos

Este prompt agrega funciones de validación de base de datos a `dbHelper.ts`.

---

## Instrucciones para el Agente

**Antes de generar código, lee:**
`.github/copilot-instructions.md` — Sección "Al generar helpers de base de datos"

---

## Datos a solicitar al QA

**Nombre de la función:**
[Nombre descriptivo, ej: "verificarProductoExiste", "obtenerClientePorCodigo"]

**Descripción de la validación:**
[Qué valida, ej: "Verifica si existe un producto con el código dado en la tabla Productos"]

**Tabla(s) involucrada(s):**
[Nombre de la tabla, ej: "Productos", "Clientes", "Pedidos"]

**Campos a validar:**
Describe los campos:
```
- Campo 1: [nombre del campo, ej: "codigo"]
- Campo 2: [nombre del campo, ej: "nombre"]
```

**Parámetros de entrada:**
Describe los parámetros que recibirá la función:
```
- Parámetro 1: [nombre] — [tipo] — [descripción]
```

Ejemplo:
```
- codigo: string — Código del producto a buscar
```

**Tipo de retorno esperado:**
[Qué devuelve, ej: "boolean", "objeto con datos del producto", "cantidad de registros"]

---

## Reglas obligatorias

1. **Usar `request().input()` con tipos explícitos** — nunca interpolación
2. **Cerrar el pool en bloque `finally`**
3. **Incluir `ENV.ambiente` en mensajes de error**
4. **Usar tipos TypeScript genéricos**
5. **Agregar JSDoc completo**

---

## Qué generar

Agrega la función en `src/utils/dbHelper.ts` siguiendo este patrón:

```typescript
/**
 * [Descripción de la función]
 * @param [parametro] - [Descripción del parámetro]
 * @returns [Descripción del retorno]
 */
export async function [nombreFuncion](
  [parametro]: [tipo]
): Promise<[tipoRetorno]> {
  let pool: sql.ConnectionPool | null = null;
  try {
    pool = await sql.connect(config);
    const result = await pool.request()
      .input('[parametro]', sql.[TipoSQL], [parametro])
      .query(`
        SELECT * FROM [Tabla]
        WHERE [campo] = @[parametro]
      `);
    
    return [procesamiento del resultado];
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error);
    throw new Error(
      `❌ [dbHelper — ${ENV.ambiente}] — Error en [nombreFuncion].\n` +
      `   Detalle: ${mensaje}`
    );
  } finally {
    if (pool) await pool.close();
  }
}
```

---

## Ejemplo de salida esperada

```typescript
/**
 * Verifica si existe un producto con el código dado
 * @param codigo - Código del producto a buscar
 * @returns true si el producto existe, false en caso contrario
 */
export async function verificarProductoExiste(codigo: string): Promise<boolean> {
  let pool: sql.ConnectionPool | null = null;
  try {
    pool = await sql.connect(config);
    const result = await pool.request()
      .input('codigo', sql.VarChar, codigo)
      .query(`
        SELECT COUNT(*) as cantidad
        FROM Productos
        WHERE codigo = @codigo
      `);
    
    return result.recordset[0].cantidad > 0;
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error);
    throw new Error(
      `❌ [dbHelper — ${ENV.ambiente}] — Error en verificarProductoExiste.\n` +
      `   Código: ${codigo}\n` +
      `   Detalle: ${mensaje}`
    );
  } finally {
    if (pool) await pool.close();
  }
}
```

---

*webflowers-qa-automation — .github/prompts/crear-db-helper.prompt.md*
