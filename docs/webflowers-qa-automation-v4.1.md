# 🌸 WebFlowers QA Automation
### Software Design Document — Automatización de Pruebas con Playwright + GitHub Copilot

---

**Proyecto:** webflowers-qa-automation
**Área:** Quality Assurance (QA)
**Fecha:** Mayo 2026
**Empresa:** GHT
**Versión:** 4.2 — SDD

---


## Tabla de Contenido

1. Introducción
2. Descripción del Sistema Bajo Prueba
3. Resumen Ejecutivo
4. Problema que Resuelve
5. Visión y Objetivos
6. Stack Tecnológico
7. Arquitectura del Framework
8. Interfaces entre Componentes
9. Gestión de Ambientes
10. Decisiones de Diseño (ADR)
11. Estrategia de Persistencia de Métricas
12. Estrategia de Manejo de Errores
13. Consideraciones de Seguridad
14. Restricciones y Suposiciones
15. Flujo de Trabajo con GitHub Copilot
16. Arquitectura de Habilidades — Copilot como Agente QA
17. Reportes Gerenciales con Allure
18. Convenciones de Código
19. Fases del Proyecto
20. Glosario

---

## 1. Introducción

### 1.1 Propósito

Este documento describe el diseño técnico del framework de automatización de pruebas
`webflowers-qa-automation` para la plataforma WebFlowers CRM. Establece las decisiones
de arquitectura, los componentes del sistema, las interfaces entre ellos, las convenciones
de desarrollo y la estrategia de persistencia de métricas de calidad.

Sirve como referencia técnica para el equipo de QA durante la construcción, evolución
y mantenimiento del framework, y como documento de trazabilidad para líderes técnicos
y dirección.

### 1.2 Alcance

Este SDD cubre:

- El framework de automatización de pruebas UI y de base de datos para WebFlowers CRM
- La arquitectura de habilidades de GitHub Copilot como agente QA
- La estrategia de persistencia de métricas en Azure SQL (`qa_metrics`)
- La integración con Allure Report y Power BI para reportes gerenciales
- La integración futura con Azure DevOps Pipelines (CI/CD)

No cubre:

- El diseño interno de la aplicación WebFlowers CRM
- La infraestructura de Azure SQL ni su administración
- La configuración de GitHub Copilot a nivel organizacional

### 1.3 Audiencia

| Audiencia | Uso del documento |
|---|---|
| **QA Automation** | Referencia técnica de arquitectura, convenciones y componentes |
| **Líderes técnicos** | Validación de decisiones de diseño y cobertura técnica |
| **Gerencia / Dirección** | Comprensión del alcance, fases y valor del proyecto |
| **Nuevos integrantes QA** | Onboarding técnico al framework |

### 1.4 Referencias

| Documento | Ubicación |
|---|---|
| Documentación oficial de Playwright | https://playwright.dev/docs/intro |
| Documentación de GitHub Copilot | https://docs.github.com/en/copilot |
| Allure Report para Playwright | https://allurereport.org/docs/playwright |
| Documentación de `mssql` para Node.js | https://www.npmjs.com/package/mssql |
| Convenciones del proyecto | `.github/copilot-instructions.md` |

### 1.5 Glosario

| Término | Definición |
|---|---|
| **POM** | Page Object Model — patrón de diseño que encapsula los elementos y acciones de una pantalla en una clase TypeScript |
| **Spec** | Archivo `.spec.ts` que contiene los casos de prueba de un módulo |
| **Fixture** | Mecanismo de Playwright para compartir setup y teardown entre tests |
| **qa_metrics** | Schema de Azure SQL que persiste el historial de ejecuciones para análisis y proyección de cobertura |
| **Allure** | Herramienta de reportes HTML que genera dashboards visuales de ejecución de pruebas |
| **Ambiente** | Entorno de ejecución de WebFlowers: Alpha (desarrollo), Beta (pre-producción) o Producción |
| **ADR** | Architecture Decision Record — registro formal de una decisión de diseño con su contexto, opciones y justificación |
| **HU** | Historia de Usuario — descripción funcional de un requerimiento en Azure DevOps |
| **Flakiness** | Inestabilidad de un test que falla de forma intermitente sin cambios en el código |
| **Pipeline** | Flujo automatizado de CI/CD en Azure DevOps que ejecuta las pruebas post-deploy |

---

## 2. Descripción del Sistema Bajo Prueba

### 2.1 WebFlowers CRM

WebFlowers es un ERP especializado en la gestión del ciclo de vida de las flores,
desarrollado por GHT. Administra los procesos de producción, inventario, ventas
y distribución del sector floricultor.

### 2.2 Módulos principales

| Módulo | Descripción | Prioridad de automatización |
|---|---|---|
| **Login / Autenticación** | Control de acceso por rol de usuario | Alta — prerequisito de todos los flujos |
| **Dashboard** | Panel principal con indicadores de negocio | Alta — validación de carga post-login |
| **Inventario** | Gestión de productos y stock por variedad | Alta |
| **Pedidos** | Creación, seguimiento y cierre de pedidos | Alta |
| **Clientes** | Registro y gestión de clientes del CRM | Media |
| **Reportes** | Generación de reportes de negocio | Media |
| **Configuración** | Parámetros del sistema y usuarios | Baja |

### 2.3 Ambientes de WebFlowers

| Ambiente | Propósito | Base de datos |
|---|---|---|
| **Alpha** | Desarrollo activo — datos sintéticos | WebFlowersAlpha_MBB |
| **Beta** | Pre-producción — datos de staging | WebFlowersPruebas_MBB |
| **Producción** | Ambiente real — solo lectura en pruebas | WebFlowersProd_MBB |

### 2.4 Características relevantes para QA

- Aplicación web multi-módulo con autenticación por roles
- Base de datos SQL Server en Azure (un servidor por ambiente)
- Usuarios compartidos entre el equipo QA en ambientes Alpha y Beta
- Sesiones con timeout activo — requiere re-login en ejecuciones largas
- Certificados SSL válidos en Beta y Producción, locales en Alpha

---

## 3. Resumen Ejecutivo

WebFlowers QA Automation es la implementación de un framework de automatización
de pruebas para la plataforma WebFlowers CRM. El proyecto busca reducir los tiempos
de validación manual, estandarizar la calidad del software y aprovechar al máximo
la licencia de GitHub Copilot con la que cuenta la empresa como partner de Microsoft.

La propuesta se fundamenta en **cuatro pilares**:

- **Automatización inteligente** con Playwright y TypeScript
- **Generación de pruebas asistida por IA** mediante GitHub Copilot
- **Reportes gerenciales** con Allure Report (HTML y PDF)
- **Persistencia de métricas** en Azure SQL para análisis histórico y proyección de cobertura

---

## 4. Problema que Resuelve

| Situación Actual | Con QA Automation |
|---|---|
| Pruebas manuales repetitivas en cada ciclo | Pruebas automatizadas reutilizables |
| Tiempo elevado de regresión | Ejecución de regresión en minutos |
| Resultados de prueba sin trazabilidad visual | Screenshots automáticos por cada paso |
| Sin cobertura de BD en pruebas | Validaciones UI + Base de datos |
| Dependencia de un QA para recordar los flujos | Flujos documentados en código |
| Configuración manual por ambiente | Cambio de ambiente con una variable `.env` |
| Métricas de calidad efímeras, sin historial | Persistencia en Azure SQL con análisis de tendencias |
| Sin visibilidad de evolución de cobertura | Dashboard histórico con proyección por módulo |

---

## 5. Visión y Objetivos

### Corto Plazo — Fase 1
- Configurar el proyecto base `webflowers-qa-automation`
- Implementar flujos críticos: login, módulos principales
- Automatizar pruebas UI Web con Playwright + POM
- Integrar validaciones de base de datos
- Configurar reportes con Allure (HTML + PDF)
- Ejecución local en los 3 ambientes (Alpha, Beta, Producción)
- Implementar schema `qa_metrics` y el `metricsReporter.ts`

### Mediano Plazo — Fase 2
- Expandir cobertura a todos los módulos del CRM WebFlowers
- Documentación técnica completa del framework
- Configurar Azure DevOps Pipelines
- Activar escritura automática a `qa_metrics` desde el pipeline
- Ejecución en ambientes locales y staging
- Activar dashboard de evolución de cobertura por módulo

### Mediano Plazo — Fase 3
- Ejecución automática post-deploy en staging
- Notificaciones de resultados al equipo de desarrollo

### Largo Plazo — Fase 4
- Cobertura total de módulos del CRM WebFlowers con pruebas de API REST
- Generación de pruebas desde Historias de Usuario (HU)
- Dashboard histórico en Power BI con proyección de cobertura total para dirección

### Largo Plazo — Fase 5
- Gestión inteligente de bugs con creación automática de Work Items en Azure DevOps
- Deduplicación, cierre automático y detección de flakiness desde el framework
- Trazabilidad completa entre bugs, runs y módulos en `qa_metrics` y Power BI

---

## 6. Stack Tecnológico

| Tecnología | Rol en el proyecto | Justificación |
|---|---|---|
| **TypeScript** | Lenguaje principal | Tipado estático, mejor autocompletado con Copilot, estándar en proyectos modernos |
| **Playwright** | Framework de automatización UI y BD | Soporte nativo multi-browser, screenshots, trazas y métricas de red integradas |
| **GitHub Copilot** | Asistente de generación de código | Partner Microsoft, genera Page Classes, tests y datos de prueba desde lenguaje natural |
| **Allure Report** | Reportes HTML y PDF | Reportes visuales gerenciales con estadísticas, historial y screenshots integrados |
| **Azure SQL** | Persistencia de métricas de calidad | Almacena resultados históricos por ejecución, módulo y ambiente |
| **Power BI** | Dashboard gerencial de calidad | Visualización histórica y proyección de cobertura conectado a Azure SQL |
| **VS Code** | IDE principal | Integración nativa con Copilot, extensiones para Playwright y TypeScript |
| **npm** | Gestor de dependencias | Ecosistema nativo de TypeScript/Node.js |
| **dotenv** | Gestión de ambientes | Un solo `.env` con 3 ambientes, sin riesgo de exponer credenciales |

---

## 7. Arquitectura del Framework

### 7.1 Estructura de directorios

```
webflowers-qa-automation/
│
├── .github/
│   ├── copilot-instructions.md       ← Contexto global del agente Copilot
│   └── prompts/
│       ├── crear-test.prompt.md
│       ├── crear-page-class.prompt.md
│       ├── crear-datos-prueba.prompt.md
│       ├── crear-db-helper.prompt.md
│       └── analizar-pagina.prompt.md
│
├── .env                              ← Variables reales — NO se sube al repo
├── .env.example                      ← Plantilla — SÍ se sube al repo
│
├── src/
│   ├── pages/                        ← POM: una clase por pantalla
│   │   ├── BasePage.ts               ← Clase base heredada por todas las páginas
│   │   ├── LoginPage.ts
│   │   ├── DashboardPage.ts
│   │   └── ...
│   ├── tasks/                        ← Flujos de negocio reutilizables
│   │   ├── AuthTasks.ts
│   │   ├── DatabaseTasks.ts
│   │   └── ...
│   ├── fixtures/
│   │   └── base.fixture.ts           ← Setup y teardown compartido entre tests
│   ├── data/                         ← Datos de prueba en JSON
│   │   ├── loginData.json
│   │   └── ...
│   ├── utils/
│   │   ├── envConfig.ts              ← Fuente única de variables de entorno
│   │   ├── dbHelper.ts               ← Conector a BD de WebFlowers
│   │   ├── metricsReporter.ts        ← Reporter custom — escribe en qa_metrics
│   │   └── helpers.ts
│   └── types/
│       └── index.ts
│
├── tests/
│   ├── modulo-login/
│   │   ├── login-exitoso.spec.ts
│   │   └── login-fallido.spec.ts
│   ├── modulo-dashboard/
│   └── ...
│
├── reports/                          ← Solo última ejecución — en .gitignore
│   ├── allure-results/
│   ├── allure-report/
│   ├── screenshots/
│   └── outputs/
│
├── docs/
├── playwright.config.ts
├── package.json
├── tsconfig.json
└── .gitignore
```

### 7.2 Diagrama de flujo de datos

```
  QA ejecuta suite
        │
        ▼
  playwright.config.ts
  (lee AMBIENTE del .env)
        │
        ▼
  base.fixture.ts ──────────────────► verificarConexion() ──► BD WebFlowers
  (beforeAll / beforeEach)
        │
        ▼
  Test Spec (.spec.ts)
  (importa fixture, Pages y datos JSON)
        │
        ├──► Page Class (POM) ──────────────────────────────► WebFlowers UI
        │    (acciones e interacciones)
        │
        ├──► dbHelper.ts ──────────────────────────────────► BD WebFlowers
        │    (validaciones de BD)
        │
        └──► reports/screenshots/
             (screenshots por paso)
        │
        ▼
  onTestEnd() x N
  (acumula resultados en memoria)
        │
        ▼
  onEnd()
  (metricsReporter.ts)
        │
        ├──► qa_metrics.test_runs
        ├──► qa_metrics.test_cases     ──► Azure SQL
        └──► qa_metrics.coverage_log
        │
        ▼
  allure-playwright
  (genera reports/allure-results/)
        │
        ▼
  allure generate
  (genera reports/allure-report/ — HTML navegable)
        │
        ▼
  Power BI
  (conecta a qa_metrics — dashboard histórico)
```

---

## 8. Interfaces entre Componentes

### 8.1 Mapa de dependencias

```
playwright.config.ts
    └── metricsReporter.ts
    └── allure-playwright

base.fixture.ts
    ├── envConfig.ts
    └── dbHelper.ts

Test Spec
    ├── base.fixture.ts       (test, expect)
    ├── Page Class            (interacciones UI)
    ├── Tasks                 (flujos de negocio)
    └── data/*.json           (datos de prueba)

Page Class
    ├── BasePage.ts           (herencia)
    └── envConfig.ts          (ENV.app.url)

Tasks
    ├── Page Class            (orquesta Pages)
    └── dbHelper.ts           (validaciones BD)

dbHelper.ts
    └── envConfig.ts          (ENV.db)

metricsReporter.ts
    └── envConfig.ts          (ENV.metrics, ENV.app.ambiente)
```

### 8.2 Contrato de cada componente

| Componente | Recibe | Expone |
|---|---|---|
| `envConfig.ts` | Variables del `.env` | `ENV.app`, `ENV.db`, `ENV.metrics` |
| `BasePage.ts` | `Page` de Playwright | Métodos de navegación, esperas, screenshots y validaciones |
| `Page Class` | `Page` de Playwright | Localizadores y métodos de interacción de una pantalla específica |
| `Tasks` | `Page` de Playwright | Flujos de negocio reutilizables (login, logout, crear entidad) |
| `base.fixture.ts` | — | `test` y `expect` extendidos con setup/teardown automático |
| `dbHelper.ts` | Query SQL, parámetros opcionales | Resultados tipados, booleano de existencia, conteo de registros |
| `metricsReporter.ts` | Eventos del ciclo de vida de Playwright | Inserciones en `qa_metrics` (sin retorno al suite) |

### 8.3 Regla de dependencia unidireccional

```
Tests → Tasks → Pages → BasePage
  └───────────────────► envConfig
  └───────────────────► dbHelper ──► envConfig
  └───────────────────► data JSON

metricsReporter ──► envConfig
                (nunca ◄── tests ni pages)
```

> Ningún componente de nivel inferior (BasePage, envConfig, dbHelper)
> debe importar de un componente de nivel superior (Tasks, Tests).
> La dependencia siempre fluye hacia abajo.

---

## 9. Gestión de Ambientes

El proyecto maneja **3 ambientes** a través de un único archivo `.env`.
El QA solo cambia la variable `AMBIENTE` para apuntar al ambiente deseado:

```
AMBIENTE=ALPHA    ← cambia a BETA o PROD según necesidad
```

| Variable | Alpha (Desarrollo) | Beta (Pre-producción) | Producción |
|---|---|---|---|
| URL | azurewebsites.net | ghtcorptest.com | url-producción |
| BD | WebFlowersAlpha_MBB | WebFlowersPruebas_MBB | WebFlowersProd_MBB |
| Servidor BD | ghalphaserver... | 260601.database... | prod-server... |

> Las credenciales reales **nunca se suben al repositorio**.
> Solo se comparte el `.env.example` con valores de plantilla.

---

## 10. Decisiones de Diseño (ADR)

### ADR-001 — Patrón POM sobre Screenplay

**Contexto**
El proyecto arranca desde cero con un equipo QA pequeño y la necesidad de entregar
valor rápidamente. Se evaluaron dos patrones de diseño: POM y Screenplay.

**Opciones evaluadas**

| Criterio | POM | Screenplay |
|---|---|---|
| Curva de aprendizaje | Baja — estructura simple y directa | Alta — múltiples capas de abstracción |
| Velocidad de adopción | Alta — cualquier QA entiende el proyecto en horas | Media — requiere capacitación en el patrón |
| Compatibilidad con Copilot | Alta — genera Page Classes de forma nativa | Media — las abstracciones confunden al agente |
| Mantenimiento | Directo — un cambio de UI = un archivo | Distribuido — el cambio puede afectar Tasks, Actions y Abilities |
| Escalabilidad | Adecuada hasta ~500 pruebas | Superior en proyectos con +500 pruebas y equipos maduros |
| Soporte oficial Playwright | Sí — documentación oficial usa POM | No — Playwright no lo promueve |

**Decisión:** POM

**Consecuencias**
- Estructura predecible y fácil de auditar
- GitHub Copilot genera código consistente con el patrón
- En el largo plazo (>500 pruebas), evaluar migración a Screenplay

---

### ADR-002 — TypeScript sobre JavaScript

**Contexto**
El proyecto podría implementarse en JavaScript (nativo de Playwright) o TypeScript.

**Opciones evaluadas**

| Criterio | JavaScript | TypeScript |
|---|---|---|
| Tipado | Dinámico — errores en runtime | Estático — errores en compilación |
| Autocompletado con Copilot | Básico | Superior — Copilot usa tipos para generar código más preciso |
| Calidad del código generado | Variable | Consistente y tipado |
| Curva de aprendizaje | Baja | Baja para quien conoce JS |
| Estándar del mercado | Legacy | Estándar actual en proyectos modernos |

**Decisión:** TypeScript con `strict: true`

**Consecuencias**
- Mayor calidad en el código generado por Copilot
- Errores detectados en desarrollo, no en ejecución
- Requiere `tsconfig.json` bien configurado

---

### ADR-003 — Azure SQL para persistencia de métricas

**Contexto**
Allure Report es stateless por defecto. Se necesita una capa de persistencia
para análisis histórico y proyección de cobertura.

**Opciones evaluadas**

| Criterio | Azure SQL | SQLite local | Sin persistencia |
|---|---|---|---|
| Acceso multi-usuario | Sí | No | N/A |
| Integración con Power BI | Nativa | Limitada | No |
| Disponibilidad en CI/CD | Sí | No | N/A |
| Infraestructura requerida | Azure SQL existente | Ninguna | Ninguna |
| Historial entre máquinas | Sí | No | No |

**Decisión:** Azure SQL — schema `qa_metrics` en servidor independiente

**Consecuencias**
- El historial es centralizado, accesible desde cualquier máquina y pipeline
- Power BI conecta directamente para el dashboard gerencial
- Requiere configurar 4 variables `METRICS_*` en el `.env`
- Un error de conexión a `qa_metrics` nunca interrumpe el suite

---

### ADR-004 — Ejecución secuencial sobre paralela

**Contexto**
Playwright soporta ejecución paralela nativa. WebFlowers tiene ambientes
compartidos con usuarios comunes entre pruebas.

**Opciones evaluadas**

| Criterio | Paralela | Secuencial |
|---|---|---|
| Velocidad | Alta | Menor |
| Conflictos de sesión | Alto riesgo — usuarios compartidos | Sin riesgo |
| Conflictos de datos | Alto riesgo en Alpha/Beta | Sin riesgo |
| Complejidad de setup | Alta — requiere usuarios exclusivos por worker | Baja |

**Decisión:** Secuencial (`fullyParallel: false`, `workers: 1`)

**Consecuencias**
- Ejecución más lenta pero confiable en ambientes compartidos
- En el largo plazo, evaluar usuarios exclusivos por worker para habilitar paralelismo

---

## 11. Estrategia de Persistencia de Métricas

### 11.1 Problema que resuelve

Allure Report, por defecto, es **stateless**: si se elimina la carpeta de resultados,
el historial desaparece. El proyecto requiere una capa de persistencia independiente
que permita:

- Analizar la **evolución de la cobertura** por módulo a lo largo del tiempo
- **Proyectar** cuándo se alcanzará cobertura completa de un módulo
- Detectar **tendencias de flakiness** antes de que escalen
- Entregar un **dashboard gerencial** con visibilidad histórica real

### 11.2 Modelo de datos — Schema `qa_metrics`

```sql
-- Registro de cada ejecución del suite de pruebas
CREATE TABLE qa_metrics.test_runs (
    id            INT IDENTITY PRIMARY KEY,
    fecha         DATETIME2     NOT NULL DEFAULT GETDATE(),
    ambiente      VARCHAR(10)   NOT NULL,  -- ALPHA | BETA | PROD
    total         INT           NOT NULL,
    passed        INT           NOT NULL,
    failed        INT           NOT NULL,
    skipped       INT           NOT NULL,
    duracion_seg  INT           NOT NULL,
    pipeline_run  VARCHAR(100)  NULL       -- ID del pipeline en Azure DevOps
);

-- Detalle de cada caso de prueba por ejecución
CREATE TABLE qa_metrics.test_cases (
    id              INT IDENTITY PRIMARY KEY,
    run_id          INT           NOT NULL REFERENCES qa_metrics.test_runs(id),
    modulo          VARCHAR(100)  NOT NULL,
    nombre          VARCHAR(300)  NOT NULL,
    estado          VARCHAR(10)   NOT NULL,  -- PASSED | FAILED | SKIPPED
    duracion_seg    INT           NOT NULL,
    screenshot_path VARCHAR(500)  NULL,
    error_mensaje   NVARCHAR(MAX) NULL
);

-- Cobertura acumulada por módulo en cada ejecución
CREATE TABLE qa_metrics.coverage_log (
    id              INT IDENTITY PRIMARY KEY,
    run_id          INT           NOT NULL REFERENCES qa_metrics.test_runs(id),
    modulo          VARCHAR(100)  NOT NULL,
    casos_cubiertos INT           NOT NULL,
    casos_totales   INT           NOT NULL,
    porcentaje      DECIMAL(5,2)  NOT NULL,
    fecha           DATETIME2     NOT NULL DEFAULT GETDATE()
);
```

### 11.3 Mecanismo de escritura

Al finalizar cada ejecución, `metricsReporter.ts` actúa automáticamente:

```typescript
// Integración en playwright.config.ts
reporter: [
  ['allure-playwright'],
  ['./src/utils/metricsReporter.ts']  // ← siempre al final
]
```

### 11.4 Flujo end-to-end de persistencia

```
Playwright ejecuta los tests
        ↓
metricsReporter.ts escribe en Azure SQL (qa_metrics)
        ↓
Allure Report lee historial de qa_metrics
        ↓
Power BI conecta a qa_metrics y actualiza el dashboard gerencial
```

### 11.5 Consultas de valor para dirección

```sql
-- Evolución de la tasa de éxito por semana
SELECT
    DATEPART(WEEK, fecha)  AS semana,
    ambiente,
    AVG(CAST(passed AS FLOAT) / total * 100) AS tasa_exito_pct
FROM qa_metrics.test_runs
GROUP BY DATEPART(WEEK, fecha), ambiente
ORDER BY semana;

-- Proyección de cobertura por módulo
SELECT
    modulo,
    MAX(porcentaje)                          AS cobertura_actual,
    MIN(porcentaje)                          AS cobertura_inicial,
    MAX(porcentaje) - MIN(porcentaje)        AS delta_total,
    COUNT(*)                                 AS ejecuciones
FROM qa_metrics.coverage_log
GROUP BY modulo
ORDER BY cobertura_actual DESC;

-- Top 10 casos más inestables (flaky tests)
SELECT TOP 10
    modulo,
    nombre,
    COUNT(*)                                                          AS total_ejecuciones,
    SUM(CASE WHEN estado = 'FAILED' THEN 1 ELSE 0 END)               AS total_fallos,
    CAST(SUM(CASE WHEN estado = 'FAILED' THEN 1 ELSE 0 END) AS FLOAT)
        / COUNT(*) * 100                                              AS tasa_fallo_pct
FROM qa_metrics.test_cases
GROUP BY modulo, nombre
HAVING COUNT(*) > 3
ORDER BY tasa_fallo_pct DESC;
```

### 11.6 Audiencias y valor por capa

| Audiencia | Qué obtiene de `qa_metrics` |
|---|---|
| **Gerencia / Dirección** | Dashboard Power BI: % cobertura por módulo, tendencia semanal, proyección de cierre |
| **Líderes técnicos** | Tasa de flakiness por módulo, tiempo promedio por suite, comparativa entre ambientes |
| **QA** | Historial de cada caso de prueba, detalle de fallos recurrentes, velocidad de ejecución |

---

## 12. Estrategia de Manejo de Errores

### 12.1 Niveles de error y respuesta

| Nivel | Origen | Respuesta del framework |
|---|---|---|
| **Error de configuración** | Variable faltante en `.env` | `envConfig.ts` lanza error en startup — el suite no inicia |
| **Error de conexión a BD** | BD WebFlowers no disponible | `verificarConexion()` en `beforeAll` detiene el suite con mensaje claro |
| **Error de navegación** | URL no disponible o timeout | Playwright captura screenshot automático y marca el test como `FAILED` |
| **Error de aserción** | Elemento no encontrado o valor incorrecto | Test marcado como `FAILED` con detalle en Allure |
| **Error de métricas** | Fallo al escribir en `qa_metrics` | `metricsReporter.ts` registra en consola pero **no interrumpe el suite** |
| **Error de timeout** | Test supera el límite de 60 segundos | Playwright marca como `timedOut` → `metricsReporter` lo registra como `FAILED` |

### 12.2 Principios de manejo de errores

**Fallo rápido en configuración**
Los errores de `.env` se detectan antes de ejecutar cualquier test.
Es preferible un error en startup a 50 tests fallando con mensajes confusos.

**Aislamiento de fallos**
Un test fallido no afecta los demás. Cada test tiene su propio contexto
de navegador gracias al `base.fixture.ts`.

**Trazabilidad total en fallos**
Cuando un test falla, el framework captura automáticamente:
- Screenshot del estado final de la pantalla
- Video de la ejecución (si `retain-on-failure` está activo)
- Traza de red con requests y responses
- Mensaje de error adjunto al reporte de Allure

**Resiliencia del reporter de métricas**
`metricsReporter.ts` nunca lanza excepciones al hilo principal de Playwright.
Un fallo en la persistencia de métricas es un problema de observabilidad,
no un fallo de las pruebas.

### 12.3 Mensajes de error estandarizados

Todos los errores del framework siguen el formato:

```
❌ [Componente] — Descripción del error.
   Campo 1  : valor
   Campo 2  : valor
   Detalle  : mensaje original de la excepción
```

---

## 13. Consideraciones de Seguridad

### 13.1 Gestión de credenciales

| Credencial | Almacenamiento | Control |
|---|---|---|
| URLs de ambientes | `.env` local | No se sube al repo — `.gitignore` |
| Usuarios y contraseñas de la app | `.env` local | No se sube al repo |
| Credenciales de BD WebFlowers | `.env` local | No se sube al repo |
| Credenciales de `qa_metrics` | `.env` local / Variables de pipeline | No se sube al repo |
| Valores de plantilla | `.env.example` | Sí se sube — sin valores reales |

**Regla absoluta:** ningún valor de credencial puede aparecer en código fuente,
archivos JSON de datos de prueba ni comentarios del repositorio.

### 13.2 Acceso a la base de datos de Producción

- Las pruebas en Producción deben ser exclusivamente de **solo lectura**
- No se permiten `INSERT`, `UPDATE` ni `DELETE` en la BD de Producción desde los tests
- Las ejecuciones en Producción deben coordinarse con el equipo de desarrollo
  y realizarse en horarios de bajo tráfico
- El `dbHelper.ts` no tiene restricción técnica — la responsabilidad es del QA
  al construir las queries

### 13.3 Screenshots y datos sensibles

- Los screenshots pueden capturar información sensible (datos de clientes, precios, etc.)
- La carpeta `reports/screenshots/` está en `.gitignore` — nunca se sube al repo
- En CI/CD, los artefactos de reportes deben manejarse con las políticas de retención
  de Azure DevOps

### 13.4 Conexiones a Azure SQL

- Todas las conexiones usan `encrypt: true`
- `trustServerCertificate: false` en Beta y Producción
- Los pools de conexión se cierran siempre en bloque `finally`
- Nunca se interpolan variables en queries SQL — siempre `request().input()`

---

## 14. Restricciones y Suposiciones

### 14.1 Restricciones

| Restricción | Descripción |
|---|---|
| **Ambientes compartidos** | Alpha y Beta tienen usuarios comunes entre QAs — ejecución secuencial obligatoria |
| **Sin acceso a código fuente** | El framework opera sobre la UI y la BD — no tiene acceso al código de WebFlowers |
| **Certificados locales en Alpha** | `ignoreHTTPSErrors: true` solo en Alpha |
| **Motor de BD** | SQL Server exclusivamente — `mssql` como driver |
| **Node.js** | Versión 18 o superior requerida por Playwright y TypeScript |

### 14.2 Suposiciones

| Suposición | Descripción |
|---|---|
| **Alpha siempre disponible** | El ambiente Alpha está disponible durante el horario laboral para ejecución local |
| **Datos de prueba estables** | Los datos de prueba en Alpha no son limpiados por otros procesos durante la ejecución |
| **Estructura de BD estable** | Los nombres de tablas y campos en la BD no cambian sin notificación al equipo QA |
| **Licencia Copilot activa** | La licencia de GitHub Copilot de la empresa permanece activa durante el proyecto |
| **Servidor `qa_metrics` disponible** | El servidor Azure SQL de métricas está disponible al finalizar cada ejecución |
| **`test.describe` consistente** | El nombre del módulo en `test.describe` no cambia entre ejecuciones para garantizar agrupamiento histórico en Power BI |

---

## 15. Flujo de Trabajo con GitHub Copilot

El diferencial de este proyecto es el uso de **GitHub Copilot como agente generador de pruebas**.

### Flujo por cada nueva prueba

```
QA describe la prueba        Copilot analiza         Copilot genera
en lenguaje natural    →     el contexto y      →    código listo para
(prompt estructurado)        las Copilot              ejecutar:
                             Instructions             - Page Class (POM)
                                                      - Archivo .spec.ts
                                                      - JSON de datos
                                                      - DB Helper (si aplica)
```

### Ejemplo de prompt del QA

```
Módulo: Login
Flujo: El usuario ingresa a WebFlowers con credenciales válidas
Pasos:
  1. Navegar a la URL del ambiente activo
  2. Ingresar usuario y contraseña desde el JSON de datos
  3. Hacer clic en el botón de ingresar
  4. Validar que se carga el Dashboard
Resultado esperado: Se muestra el Dashboard con el nombre del usuario
Genera: Page Class, test (exitoso, fallido, borde), JSON de datos
```

---

## 16. Arquitectura de Habilidades — Copilot como Agente QA

### Estructura de habilidades del agente

```
.github/
├── copilot-instructions.md          ← Contexto global siempre activo
└── prompts/
    ├── crear-test.prompt.md
    ├── crear-page-class.prompt.md
    ├── crear-datos-prueba.prompt.md
    ├── crear-db-helper.prompt.md
    └── analizar-pagina.prompt.md
```

### Dos capas de inteligencia

| Capa | Archivo | Función |
|---|---|---|
| **Contexto global** | `copilot-instructions.md` | Define stack, arquitectura y reglas. Siempre activo. |
| **Habilidades invocables** | `prompts/*.prompt.md` | Prompts especializados para tareas específicas |

### ¿Por qué esta arquitectura es diferenciadora?

| Enfoque tradicional | Con Copilot como agente QA |
|---|---|
| El QA escribe el código manualmente | El QA describe en lenguaje natural |
| Horas por cada nuevo test | Minutos por cada nuevo test |
| Requiere conocimiento profundo de Playwright | El QA se enfoca en el negocio |
| Inconsistencias entre QAs | Todos los tests siguen las mismas convenciones |

---

## 17. Reportes Gerenciales con Allure

| Audiencia | Qué obtiene |
|---|---|
| **Gerencia / Dirección** | Resumen ejecutivo: % pruebas pasadas, fallidas, tiempo total. Exportable a PDF |
| **Líderes técnicos** | Detalle por módulo, tendencias históricas, tasa de flakiness |
| **QA** | Detalle de cada paso, screenshots por pantalla, logs de red, trazas de BD |

**Características clave:**
- Screenshots automáticos en cada paso ejecutado
- Métricas de tiempo de respuesta por pantalla
- Historial de ejecuciones comparativas (alimentado por `qa_metrics`)
- Navegable en HTML, exportable a PDF
- Integrable con Azure DevOps Pipelines

---

## 18. Convenciones de Código

| Elemento | Convención | Ejemplo |
|---|---|---|
| Archivos de página | PascalCase + `Page.ts` | `LoginPage.ts` |
| Archivos de test | kebab-case + `.spec.ts` | `login-exitoso.spec.ts` |
| Archivos de tasks | PascalCase + `Tasks.ts` | `AuthTasks.ts` |
| Clases | PascalCase | `class LoginPage` |
| Métodos | camelCase | `async clickLoginButton()` |
| Variables | camelCase | `const userEmail` |
| Constantes globales | UPPER_SNAKE_CASE | `const BASE_URL` |
| Carpetas de tests | kebab-case por módulo | `modulo-login/` |
| Datos de prueba | camelCase + módulo | `loginData.json` |

---

## 19. Fases del Proyecto

### Fase 1 — Fundación
- Configuración del proyecto base `webflowers-qa-automation`
- Estructura de carpetas, convenciones y Copilot Instructions
- Gestión de ambientes con `.env` (Alpha, Beta, Producción)
- Automatización de flujos críticos: login, módulos principales
- Pruebas UI Web con Playwright + POM
- Validaciones de base de datos por ambiente
- Reportes Allure en ejecución local (HTML + PDF)
- **Implementación del schema `qa_metrics` y el `metricsReporter.ts`**

### Fase 2 — Crecimiento
- Expansión de cobertura a todos los módulos del CRM WebFlowers
- Documentación técnica completa del framework
- **Configuración de Azure DevOps Pipelines**
- **Escritura automática a `qa_metrics` desde el pipeline**
- Ejecución en ambientes locales y staging
- **Activación del dashboard de evolución de cobertura por módulo**

### Fase 3 — Integración CI/CD
- Ejecución automática post-deploy en staging
- Notificaciones de resultados al equipo de desarrollo

### Fase 4 — Escala e Inteligencia
- Cobertura de pruebas de API REST
- Generación de pruebas desde Historias de Usuario (HU)
- **Dashboard histórico en Power BI con proyección de cobertura total para dirección**

### Fase 5 — Gestión Inteligente de Bugs

> **Prerequisitos:** Fases 2 y 3 completadas — Azure DevOps Pipelines operativo
> y ejecución post-deploy estable con historial suficiente en `qa_metrics`.

- **Implementación de `bugReporter.ts`** — reporter custom que evalúa cada test fallido
  y decide si crear o actualizar un Work Item de tipo Bug en Azure DevOps
- **Creación automática de bugs** desde tests fallidos con screenshot adjunto,
  mensaje de error, módulo, ambiente y vínculo al `run_id` de `qa_metrics`
- **Deduplicación inteligente** — si ya existe un bug `Active` o `New` para el mismo
  `módulo + nombre de test + ambiente`, agrega un comentario con el nuevo screenshot
  en lugar de crear un duplicado
- **Cierre automático de bugs** — cuando un test vuelve a pasar, el Work Item
  asociado se cierra automáticamente en Azure DevOps
- **Detección de flakiness** — tests que alternan entre `PASSED` y `FAILED`
  se marcan como Flaky en el Work Item sin cerrarlo ni reabrirlo
- **Tabla `qa_metrics.bug_reports`** — persiste la trazabilidad completa entre
  bugs de Azure DevOps y runs de `qa_metrics` (`bug_id ↔ run_id ↔ test_case_id`)
- **Dashboard de bugs activos por módulo** en Power BI integrado al dashboard
  de cobertura existente

---

## 20. Glosario

| Término | Definición |
|---|---|
| **ADR** | Architecture Decision Record — registro formal de una decisión de diseño |
| **Allure** | Herramienta de reportes HTML para pruebas automatizadas |
| **Ambiente** | Entorno de ejecución: Alpha, Beta o Producción |
| **BasePage** | Clase TypeScript base heredada por todas las Page Classes del proyecto |
| **bug_reports** | Tabla de `qa_metrics` que persiste la trazabilidad entre bugs de Azure DevOps y runs del framework |
| **bugReporter** | Reporter custom de Playwright (Fase 5) que crea y gestiona Work Items de tipo Bug en Azure DevOps |
| **Fixture** | Mecanismo de Playwright para setup y teardown compartido entre tests |
| **Flakiness** | Inestabilidad de un test que falla de forma intermitente |
| **HU** | Historia de Usuario en Azure DevOps |
| **Pipeline** | Flujo automatizado de CI/CD en Azure DevOps |
| **POM** | Page Object Model — patrón de diseño para encapsular páginas en clases |
| **qa_metrics** | Schema de Azure SQL con historial de ejecuciones, cobertura y bugs |
| **Spec** | Archivo `.spec.ts` con los casos de prueba de un módulo |
| **Task** | Clase TypeScript que orquesta flujos de negocio reutilizables |
| **Work Item** | Elemento de trabajo en Azure DevOps — en este contexto, un Bug creado automáticamente por el framework |

---

*Documento generado en el marco del proyecto `webflowers-qa-automation`*
*Área de QA — GHT — Mayo 2026*

