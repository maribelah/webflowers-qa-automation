# 📄 Prompt: Crear Page Class

Este prompt genera una Page Class nueva para encapsular una pantalla del sistema.

---

## Instrucciones para el Agente

**Antes de generar código, lee:**
`github/copilot-instructions.md` — Sección "Al generar una Page Class"

---

## Datos a solicitar al QA

**Nombre del módulo:**
[Nombre del módulo, ej: "Inventario", "Clientes", "Reportes"]

**Nombre de la pantalla:**
[Nombre descriptivo, ej: "CrearProducto", "EditarCliente", "ListaPedidos"]

**Elementos visibles:**
Describe cada elemento con:
- Nombre lógico: [ej: "Campo de búsqueda"]
- Selector preferido: [ej: `[data-testid="search-input"]`]
- Tipo de elemento: [input, button, link, select, etc.]

Ejemplo:
```
- Campo código producto: [data-testid="product-code"], input
- Campo nombre: [data-testid="product-name"], input
- Botón guardar: [data-testid="save-button"], button
- Mensaje de éxito: .success-message, div
```

**Acciones disponibles en la pantalla:**
Describe las acciones que el usuario puede realizar:
- [ej: "Ingresar datos del producto"]
- [ej: "Guardar el producto"]
- [ej: "Cancelar la operación"]
- [ej: "Validar que se muestra mensaje de éxito"]

---

## Qué generar

Genera el archivo `src/pages/[Nombre]Page.ts` con:

1. **Import de dependencias**
   ```typescript
   import { Page, Locator } from '@playwright/test';
   import { BasePage } from './BasePage';
   ```

2. **Clase que extiende BasePage**
   ```typescript
   export class [Nombre]Page extends BasePage {
   ```

3. **Localizadores readonly**
   ```typescript
   readonly inputCodigo: Locator;
   readonly btnGuardar: Locator;
   ```

4. **Constructor con inicialización de localizadores**
   - Usar el orden de preferencia: `data-testid` → `role` → `text` → `css`

5. **Métodos de interacción**
   - Todos `async` con tipos explícitos
   - JSDoc en cada método
   - Sin lógica de negocio (eso va en Tasks)

---

## Ejemplo de salida esperada

```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class CrearProductoPage extends BasePage {
  readonly inputCodigo: Locator;
  readonly inputNombre: Locator;
  readonly inputPrecio: Locator;
  readonly btnGuardar: Locator;
  readonly mensajeExito: Locator;

  constructor(page: Page) {
    super(page);
    this.inputCodigo = page.locator('[data-testid="product-code"]');
    this.inputNombre = page.locator('[data-testid="product-name"]');
    this.inputPrecio = page.locator('[data-testid="product-price"]');
    this.btnGuardar = page.locator('[data-testid="save-button"]');
    this.mensajeExito = page.locator('.success-message');
  }

  /** Ingresa los datos del producto */
  async ingresarDatosProducto(codigo: string, nombre: string, precio: number): Promise<void> {
    await this.inputCodigo.fill(codigo);
    await this.inputNombre.fill(nombre);
    await this.inputPrecio.fill(String(precio));
  }

  /** Hace clic en el botón Guardar */
  async clickGuardar(): Promise<void> {
    await this.btnGuardar.click();
  }

  /** Obtiene el mensaje de éxito mostrado */
  async obtenerMensajeExito(): Promise<string> {
    return await this.obtenerTexto(this.mensajeExito);
  }
}
```

---

*webflowers-qa-automation — .github/prompts/crear-page-class.prompt.md*
