# 🌸 WebFlowers QA Automation

Framework de automatización de pruebas para WebFlowers CRM — Sistema de gestión del ciclo de vida de flores.

---

## 📋 Descripción

`webflowers-qa-automation` es un framework profesional de automatización de pruebas UI y de base de datos para la plataforma WebFlowers CRM, construido con:
- **TypeScript** para código tipado y mantenible
- **Playwright** para automatización multi-browser
- **Page Object Model (POM)** para estructura escalable
- **Allure Report** para reportes visuales gerenciales
- **Azure SQL** para persistencia de métricas históricas
- **GitHub Copilot** para generación asistida de pruebas

---

## 🛠️ Stack Tecnológico

| Tecnología | Versión | Rol |
|---|---|---|
| **Node.js** | ≥ 18 | Runtime de JavaScript |
| **TypeScript** | ^5.4 | Lenguaje principal |
| **Playwright** | ^1.44 | Framework de automatización |
| **Allure Report** | ^2.15 | Reportes HTML/PDF |
| **mssql** | ^10.0 | Conector a SQL Server |
| **dotenv** | ^16.4 | Gestión de ambientes |

---

## 📦 Prerequisitos

Instala las siguientes herramientas antes de comenzar:

1. **Node.js** ≥ 18 — [Descargar](https://nodejs.org/)
2. **npm** (incluido con Node.js)
3. **Allure CLI** (opcional, para reportes locales):
   ```powershell
   npm install -g allure-commandline
   ```
4. **Git** para control de versiones

---

## 🚀 Instalación

### 1. Clonar el repositorio

```powershell
git clone <url-del-repositorio>
cd webflowers-qa-automation
```

### 2. Instalar dependencias

```powershell
npm install
```

### 3. Instalar navegadores de Playwright

```powershell
npx playwright install
```

### 4. Configurar variables de entorno

Copia el archivo de plantilla y completa con los valores reales:

```powershell
Copy-Item .env.example -Destination .env
```

Edita `.env` con tus credenciales reales:
- URLs de ambientes (ALPHA, BETA, PROD)
- Usuarios y contraseñas de la aplicación
- Credenciales de bases de datos
- Credenciales del servidor de métricas (`qa_metrics`)

> ⚠️ **IMPORTANTE:** Nunca subas el archivo `.env` al repositorio. Solo se comparte `.env.example`.

---

## ▶️ Ejecución

### Ejecutar por ambiente

```powershell
# Ambiente ALPHA (por defecto)
npm run test:alpha

# Ambiente BETA (pre-producción)
npm run test:beta

# Ambiente PRODUCCIÓN
npm run test:prod
```

### Ejecutar en modo headed (ver el navegador)

```powershell
npm run test:headed
```

### Ejecutar un test específico

```powershell
npx playwright test tests/modulo-login/login-exitoso.spec.ts
```

---

## 📊 Reportes

### Generar y abrir reporte Allure

```powershell
# Generar reporte HTML
npm run allure:generate

# Abrir reporte en el navegador
npm run allure:open

# Generar y abrir en un solo comando
npm run allure:report
```

Los reportes se generan en `reports/allure-report/`.

### Métricas históricas (qa_metrics)

Al finalizar cada ejecución, el framework persiste automáticamente los resultados en Azure SQL (`qa_metrics`):
- **test_runs**: Registro de cada ejecución completa
- **test_cases**: Detalle de cada caso de prueba
- **coverage_log**: Cobertura por módulo

Estas métricas alimentan el dashboard gerencial en Power BI.

---

## 📁 Estructura del Proyecto

```
webflowers-qa-automation/
├── .github/
│   ├── copilot-instructions.md       ← Contexto del agente Copilot
│   └── prompts/                      ← Prompts especializados
├── src/
│   ├── pages/                        ← Page Object Model
│   │   ├── BasePage.ts               ← Clase base
│   │   ├── LoginPage.ts
│   │   └── DashboardPage.ts
│   ├── tasks/                        ← Flujos de negocio reutilizables
│   │   └── AuthTasks.ts
│   ├── fixtures/                     ← Setup y teardown compartido
│   │   └── base.fixture.ts
│   ├── data/                         ← Datos de prueba en JSON
│   │   └── loginData.json
│   ├── utils/                        ← Utilidades del framework
│   │   ├── envConfig.ts              ← Variables de entorno
│   │   ├── dbHelper.ts               ← Conector a BD WebFlowers
│   │   ├── metricsReporter.ts        ← Reporter custom a qa_metrics
│   │   └── helpers.ts
│   └── types/                        ← Tipos TypeScript compartidos
│       └── index.ts
├── tests/
│   └── modulo-login/
│       ├── login-exitoso.spec.ts
│       └── login-fallido.spec.ts
├── docs/
│   ├── sql/
│   │   └── create-qa-metrics-schema.sql
│   └── webflowers-qa-automation-v4.1.md  ← SDD completo
├── .env.example                      ← Plantilla de variables
├── .gitignore
├── package.json
├── playwright.config.ts
├── tsconfig.json
└── README.md
```

---

## 📖 Convenciones

Este proyecto sigue convenciones estrictas definidas en [.github/copilot-instructions.md](.github/copilot-instructions.md):

- **Page Classes:** PascalCase + `Page.ts` (ej: `LoginPage.ts`)
- **Tests:** kebab-case + `.spec.ts` (ej: `login-exitoso.spec.ts`)
- **Localizadores:** Orden de preferencia: `data-testid` → `role` → `text` → `css`
- **Screenshots:** Nombre secuencial `01-descripcion.png`
- **Datos de prueba:** JSON con 3 casos: `exitoso`, `fallido`, `borde`
- **Sin hardcodeo:** URLs, credenciales y datos siempre desde `ENV` o JSON

---

## 🌐 Ambientes

El proyecto opera en 3 ambientes, controlados por la variable `AMBIENTE` en el archivo `.env`:

| Ambiente | Variable | Descripción |
|---|---|---|
| **ALPHA** | `AMBIENTE=ALPHA` | Desarrollo — datos sintéticos |
| **BETA** | `AMBIENTE=BETA` | Pre-producción — staging |
| **PROD** | `AMBIENTE=PROD` | Producción — solo lectura |

Cambiar de ambiente es tan simple como:
```powershell
# En .env
AMBIENTE=BETA
```

O usar los scripts predefinidos:
```powershell
npm run test:alpha
npm run test:beta
npm run test:prod
```

---

## 🤖 GitHub Copilot Integration

Este proyecto está optimizado para trabajar con GitHub Copilot como agente de generación de pruebas:

### Prompts disponibles

| Prompt | Ubicación | Uso |
|---|---|---|
| Crear test completo | `.github/prompts/crear-test.prompt.md` | Genera spec + Page + JSON |
| Crear Page Class | `.github/prompts/crear-page-class.prompt.md` | Nueva pantalla |
| Crear datos de prueba | `.github/prompts/crear-datos-prueba.prompt.md` | JSON de datos |
| Crear helper de BD | `.github/prompts/crear-db-helper.prompt.md` | Validaciones BD |
| Analizar página | `.github/prompts/analizar-pagina.prompt.md` | Explorar pantalla |

### Ejemplo de uso con Copilot

1. Abre GitHub Copilot Chat en VS Code
2. Usa `@workspace` para contexto completo
3. Consulta el prompt que necesites (ej: `.github/prompts/crear-test.prompt.md`)
4. Sigue las instrucciones del prompt

---

## 🏗️ Fases del Proyecto

### Fase 1 — Fundación ✅
- [x] Configuración del proyecto base
- [x] Estructura de carpetas y convenciones
- [x] Gestión de ambientes con `.env`
- [x] Automatización de flujos críticos (login)
- [x] Pruebas UI Web con Playwright + POM
- [x] Validaciones de base de datos
- [x] Reportes Allure (HTML + PDF)
- [x] Schema `qa_metrics` y `metricsReporter.ts`

### Fase 2 — Crecimiento (En progreso)
- [ ] Expansión de cobertura a todos los módulos
- [ ] Documentación técnica completa
- [ ] Azure DevOps Pipelines
- [ ] Dashboard de evolución de cobertura

### Fase 3 — CI/CD
- [ ] Ejecución automática post-deploy
- [ ] Notificaciones al equipo de desarrollo

### Fase 4 — Escala e Inteligencia
- [ ] Cobertura de pruebas de API REST
- [ ] Generación desde Historias de Usuario
- [ ] Dashboard en Power BI con proyección de cobertura

### Fase 5 — Gestión Inteligente de Bugs
- [ ] Creación automática de Work Items en Azure DevOps
- [ ] Deduplicación y cierre automático de bugs
- [ ] Detección de flakiness

---

## 📚 Documentación

- **SDD v4.1:** [docs/webflowers-qa-automation-v4.1.md](docs/webflowers-qa-automation-v4.1.md)
- **Copilot Instructions:** [.github/copilot-instructions.md](.github/copilot-instructions.md)
- **Playwright Docs:** https://playwright.dev/docs/intro
- **Allure Report:** https://allurereport.org/docs/playwright

---

## 🧪 Desarrollo

### Crear un nuevo test

```powershell
# Usa el prompt especializado
code .github/prompts/crear-test.prompt.md
```

### Agregar una nueva Page Class

```powershell
# Usa el prompt especializado
code .github/prompts/crear-page-class.prompt.md
```

### Validar configuración

```powershell
# Verificar que las variables de entorno están correctas
node -e "require('./src/utils/envConfig'); console.log('✅ Configuración válida')"
```

---

## 🤝 Contribución

1. Crea una rama desde `main`: `git checkout -b feature/nueva-funcionalidad`
2. Sigue las convenciones en `.github/copilot-instructions.md`
3. Ejecuta los tests: `npm test`
4. Crea un Pull Request

---

## 📞 Soporte

Para dudas o problemas:
- Revisa la documentación en `docs/`
- Consulta el SDD v4.1
- Contacta al equipo QA

---

**webflowers-qa-automation** — Framework de QA Automation para WebFlowers CRM  
© 2026 GHT — Todos los derechos reservados
