# 🔍 Prompt: Analizar Página

Este prompt explora una pantalla y genera el código base de su Page Class.

---

## Instrucciones para el Agente

El QA describe los elementos visibles en una pantalla y el agente genera
los localizadores y métodos básicos de la Page Class.

---

## Datos a solicitar al QA

**URL de la pantalla (opcional):**
[URL donde está la pantalla, si aplica]

**Nombre descriptivo de la pantalla:**
[Ej: "Formulario de Crear Cliente", "Lista de Productos"]

**Elementos visibles:**
Por cada elemento, describir:
- **Nombre lógico:** [ej: "Botón Guardar"]
- **Texto visible:** [el texto que se ve en pantalla, si aplica]
- **Tipo de elemento:** [input, button, select, link, div, etc.]
- **Identificadores visibles:** [id, class, data-testid, si están disponibles]

Formato sugerido:
```
1. [Nombre lógico] — Tipo: [tipo] — Texto: "[texto]" — ID/Class: [identificadores]
2. [Nombre lógico] — Tipo: [tipo] — Texto: "[texto]" — ID/Class: [identificadores]
...
```

**Acciones que se pueden realizar:**
Lista de acciones posibles:
```
- [Acción 1, ej: "Ingresar nombre del cliente"]
- [Acción 2, ej: "Seleccionar tipo de cliente"]
- [Acción 3, ej: "Guardar el cliente"]
```

---

## Qué generar

Con la información proporcionada, genera:

### 1. Localizadores sugeridos
Para cada elemento, proponer el mejor localizador siguiendo el orden de preferencia:
`data-testid` → `role` → `text` → `css`

### 2. Código de la Page Class
Genera el archivo `src/pages/[Nombre]Page.ts` con:
- Todos los localizadores como `readonly`
- Métodos para cada acción identificada
- JSDoc en cada método

---

## Ejemplo de uso

**Entrada del QA:**
```
URL: /clientes/nuevo
Nombre: Formulario de Crear Cliente
Elementos visibles:
  1. Campo nombre — Tipo: input — ID: customer-name
  2. Campo email — Tipo: input — ID: customer-email
  3. Select tipo de cliente — Tipo: select — ID: customer-type
  4. Botón Guardar — Tipo: button — Texto: "Guardar Cliente"
  5. Mensaje de éxito — Tipo: div — Class: success-msg

Acciones:
  - Ingresar nombre del cliente
  - Ingresar email del cliente
  - Seleccionar tipo de cliente
  - Hacer clic en Guardar
  - Obtener mensaje de confirmación
```

**Salida del Agente:**

```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class CrearClientePage extends BasePage {
  readonly inputNombre: Locator;
  readonly inputEmail: Locator;
  readonly selectTipoCliente: Locator;
  readonly btnGuardar: Locator;
  readonly mensajeExito: Locator;

  constructor(page: Page) {
    super(page);
    this.inputNombre = page.locator('#customer-name');
    this.inputEmail = page.locator('#customer-email');
    this.selectTipoCliente = page.locator('#customer-type');
    this.btnGuardar = page.locator('button:has-text("Guardar Cliente")');
    this.mensajeExito = page.locator('.success-msg');
  }

  /** Ingresa el nombre del cliente */
  async ingresarNombre(nombre: string): Promise<void> {
    await this.inputNombre.fill(nombre);
  }

  /** Ingresa el email del cliente */
  async ingresarEmail(email: string): Promise<void> {
    await this.inputEmail.fill(email);
  }

  /** Selecciona el tipo de cliente */
  async seleccionarTipoCliente(tipo: string): Promise<void> {
    await this.selectTipoCliente.selectOption(tipo);
  }

  /** Hace clic en el botón Guardar */
  async clickGuardar(): Promise<void> {
    await this.btnGuardar.click();
  }

  /** Obtiene el mensaje de confirmación */
  async obtenerMensajeExito(): Promise<string> {
    return await this.obtenerTexto(this.mensajeExito);
  }
}
```

---

*webflowers-qa-automation — .github/prompts/analizar-pagina.prompt.md*
