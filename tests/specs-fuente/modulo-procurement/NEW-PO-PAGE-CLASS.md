# New Purchase Order — Page Class

## Prompt original

@workspace /crear-page-class
Módulo: Procurement
Pantalla: New Purchase Order
URL relativa: No aplica — navegación por menú
Elementos:
  - Formulario principal del módulo New PO
Acciones principales:
  - Navegar al módulo: clic en Procurement → Products → New PO
  - Validar que el formulario de New PO cargó
Localizadores conocidos:
  - Procurement: //div[@class='div-parent' and @title='Procurement']
  - Products:    //div[@class='div-parent' and @title='Procurement']/ul/li[3]/div
  - New PO:      //ul[@id='sub2_Products_11']/li[4]/div
  - Formulario:  frameCenter → #divForm (patrón estándar de WebFlowers)
NO MODIFICAR: BasePage.ts, base.fixture.ts, envConfig.ts

---

## Análisis UI y localizadores

### Pantallas involucradas
- Login
- Dashboard
- Menú lateral → Procurement → Products → New PO
- Formulario New Purchase Order (iframe #center_page)

### Elementos y localizadores

#### Navegación (frameMenu = iframe #left_page1)
- **Procurement:** `//div[@class='div-parent' and @title='Procurement']`
- **Products:** `//div[@class='div-parent' and @title='Procurement']/ul/li[3]/div`
- **New PO:** `//ul[@id='sub2_Products_11']/li[4]/div`

#### Formulario (frameCenter = iframe #center_page)
- **Formulario principal:** `#divForm`
- **Header módulo:** `//span[@id='pageHeader']`

### Artefactos generados
- `src/pages/NewPurchaseOrderPage.ts` ✅ ya existe
- `src/data/procurement-data.json` ✅ creado

### Notas
- Mismo patrón de iframes que SalesOrderEntryPage
- `networkidle` NO funciona — usar `esperarCargaModulo()`
- Pendiente confirmar localizadores internos del formulario (Vendor, Carrier, Due Date, etc.)

---

*webflowers-qa-automation — tests/specs-fuente/modulo-procurement/NEW-PO-PAGE-CLASS.md*
*Generado: 2026-06-03*
