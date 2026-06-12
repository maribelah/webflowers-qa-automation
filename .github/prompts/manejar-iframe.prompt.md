# 🖼️ Habilidad: Manejo de Iframes en WebFlowers

## Propósito

WebFlowers usa iframes para separar las tres zonas de la aplicación.
Esta habilidad documenta la arquitectura de iframes, las reglas de uso
y los patrones obligatorios para interactuar correctamente con cada zona.

Invocar esta habilidad cuando se necesite generar código que interactúe
con elementos del menú, el header o el contenido de un módulo.

---

## Arquitectura de iframes de WebFlowers

```
MAIN_PAGE (page)
├── div.top
│   └── iframe id="top_Page2"               → this.frameHeader
│       └── Search Modules, nombre usuario, notificaciones
│
├── div#left.menu
│   └── iframe id="left_page1"              → this.frameMenu
│       └── Menú lateral: Sales, Products, Inventory, etc.
│
└── div#center.page
    └── iframe id="center_page" name="main" → this.frameCenter
        └── Módulo activo (siempre el mismo iframe, cambia el src)
            Sales Order Entry, Inventario, Clientes, etc.
```

---

## Regla absoluta — qué frame usar por zona

| Elemento | Frame | Ejemplo |
|---|---|---|
| Search Modules, usuario | `this.frameHeader` | `this.frameHeader.locator('#inputSearch')` |
| Menú lateral, submenús | `this.frameMenu` | `this.frameMenu.locator("//li[ul[@id='subSales']]/div[contains(@class,'ellipsis')]")` |
| Formularios, tablas, botones del módulo | `this.frameCenter` | `this.frameCenter.locator('#divForm')` |
| Login (única excepción) | `page` directo | `page.locator('#txtUserName')` |

> El login NO usa iframes. Es la única pantalla que usa `page.locator()` directamente.

---

## Métodos disponibles en BasePage

```typescript
// Espera a que un iframe esté listo antes de interactuar
await this.esperarFrameListo('menu');    // antes de hacer clic en el menú
await this.esperarFrameListo('header'); // antes de interactuar con el header
await this.esperarFrameListo('center'); // antes de leer el módulo activo

// Espera a que el módulo activo en frameCenter termine de cargar
await this.esperarCargaModulo(); // después de navegar a un módulo
```

---

## XPath correcto para ítems del menú lateral

### ⚠️ Problema con texto simple

El menú lateral tiene múltiples elementos con el mismo texto.
Por ejemplo, "Sales" aparece como subítem en Intercom, Vendor Management y Reports.
Un XPath por texto simple encuentra varios elementos y falla con error de modo estricto.

```typescript
// ❌ Ambiguo — puede encontrar múltiples elementos con texto 'Sales'
"//div[contains(@class,'ellipsis') and normalize-space(text())='Sales']"

// ❌ Frágil — selected-parent solo existe cuando el ítem ya está activo
"//div[@class='ellipsis selected-parent' and text()='Sales']"
```

### ✅ Patrón correcto — identificar por submenú hijo

Cada ítem principal del menú tiene un submenú con un `id` único y predecible.
Usar ese `id` para identificar unívocamente el ítem padre:

```typescript
// ✅ Único e inequívoco — el div del ítem que contiene el submenú Sales
"//li[ul[@id='subSales']]/div[contains(@class,'ellipsis')]"

// ✅ Aplicar el mismo patrón para cualquier módulo
"//li[ul[@id='subProducts']]/div[contains(@class,'ellipsis')]"
"//li[ul[@id='subInventory']]/div[contains(@class,'ellipsis')]"
"//li[ul[@id='subProcurement']]/div[contains(@class,'ellipsis')]"
"//li[ul[@id='subShipping']]/div[contains(@class,'ellipsis')]"
"//li[ul[@id='subAccounting']]/div[contains(@class,'ellipsis')]"
"//li[ul[@id='subReports']]/div[contains(@class,'ellipsis')]"
```

**Lógica del patrón:** *"el `div.ellipsis` dentro del `li` que tiene como hijo directo
el `ul` con el id del submenú"* — siempre único en el DOM.

---

## Patrón obligatorio para navegación por menú

Siempre seguir este orden — sin saltarse ningún paso:

```typescript
// 1. Esperar que el frame del menú esté listo
await this.esperarFrameListo('menu');

// 2. Clic en el ítem principal — identificado por su submenú hijo
await this.frameMenu
  .locator("//li[ul[@id='subSales']]/div[contains(@class,'ellipsis')]")
  .click();

// 3. Esperar que aparezca el submenú
await this.frameMenu
  .locator("//ul[@id='subSales']")
  .waitFor({ state: 'visible' });

// 4. Clic en la opción del submenú
await this.frameMenu
  .locator("//ul[@id='subSales']/li[2]/div/div")
  .click();

// 5. Clic en el módulo dentro del submenú
await this.frameMenu
  .locator("//div[@title='Sales - Order Entry']")
  .click();

// 6. Esperar que el módulo cargue en frameCenter
await this.esperarCargaModulo();

// 7. Recién aquí interactuar con elementos del módulo
await this.frameCenter.locator('#divForm').waitFor({ state: 'visible' });
```

---

## Patrón para validar que el módulo cargó en frameCenter

```typescript
// Después de navegar al módulo, validar que el contenido cargó
await this.esperarCargaModulo();

// Validar elemento específico del módulo dentro de frameCenter
await expect(
  this.frameCenter.locator('#SALES_NEW_ORDER_ENTRY')
).toBeVisible();
```

---

## Ejemplo completo — Page Class con iframes

```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class SalesOrderEntryPage extends BasePage {

  // Localizadores en frameCenter — elementos del módulo activo
  readonly formularioPrincipal: Locator;

  constructor(page: Page) {
    super(page);
    this.formularioPrincipal = this.frameCenter.locator('#divForm');
  }

  /** Navega al módulo Sales Order Entry desde el menú principal */
  async navigateToOrderEntry(): Promise<void> {
    // 1. Esperar frame del menú
    await this.esperarFrameListo('menu');

    // 2. Clic en Sales — identificado por su submenú hijo
    await this.frameMenu
      .locator("//li[ul[@id='subSales']]/div[contains(@class,'ellipsis')]")
      .click();

    // 3. Esperar submenú
    await this.frameMenu
      .locator("//ul[@id='subSales']")
      .waitFor({ state: 'visible' });

    // 4. Clic en New (segunda opción)
    await this.frameMenu
      .locator("//ul[@id='subSales']/li[2]/div/div")
      .click();

    // 5. Clic en Order Entry
    await this.frameMenu
      .locator("//div[@title='Sales - Order Entry']")
      .click();

    // 6. Esperar carga del módulo
    await this.esperarCargaModulo();
  }

  /** Valida que el módulo Sales Order Entry cargó correctamente */
  async validarModuloCargado(): Promise<void> {
    await this.formularioPrincipal.waitFor({ state: 'visible' });
  }

  /** Verifica si el formulario principal está visible */
  async isOrderEntryWindowVisible(): Promise<boolean> {
    return this.formularioPrincipal.isVisible();
  }
}
```

---

## Checklist antes de generar código con iframes

- [ ] Elementos del menú → usar `this.frameMenu`
- [ ] Elementos del header → usar `this.frameHeader`
- [ ] Elementos del módulo activo → usar `this.frameCenter`
- [ ] Login → usar `page.locator()` directamente
- [ ] XPath del menú usa `//li[ul[@id='subXxx']]/div[contains(@class,'ellipsis')]`
- [ ] Nunca usar `selected-parent` para localizar ítems del menú
- [ ] Navegación al módulo incluye `esperarFrameListo('menu')` al inicio
- [ ] Después de navegar al módulo incluye `esperarCargaModulo()`
- [ ] Primera interacción con frameCenter usa `waitFor({ state: 'visible' })`

---

*webflowers-qa-automation — .github/prompts/manejar-iframe.prompt.md*
*Versión 2.0 — Mayo 2026 — Alineado con SDD v4.3*
*Cambios v2.0: Patrón XPath corregido — identificar ítems del menú por submenú hijo*