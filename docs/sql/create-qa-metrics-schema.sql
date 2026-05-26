-- ════════════════════════════════════════════════════════════════════════════════
-- Script de creación del schema qa_metrics
-- WebFlowers QA Automation — Base de datos de métricas de calidad
-- 
-- Este schema persiste el historial de ejecuciones para análisis y proyección
-- de cobertura, independiente del ambiente activo (ALPHA, BETA, PROD).
-- ════════════════════════════════════════════════════════════════════════════════

-- Crear el schema si no existe
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'qa_metrics')
BEGIN
    EXEC('CREATE SCHEMA qa_metrics');
END
GO

-- ════════════════════════════════════════════════════════════════════════════════
-- Tabla: qa_metrics.test_runs
-- Registro de cada ejecución completa del suite de pruebas
-- ════════════════════════════════════════════════════════════════════════════════

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'qa_metrics.test_runs') AND type in (N'U'))
BEGIN
    CREATE TABLE qa_metrics.test_runs (
        id              INT IDENTITY(1,1) PRIMARY KEY,
        ambiente        VARCHAR(10)   NOT NULL,          -- ALPHA, BETA, PROD
        fecha           DATETIME2     NOT NULL DEFAULT GETDATE(),
        total           INT           NOT NULL,
        passed          INT           NOT NULL,
        failed          INT           NOT NULL,
        skipped         INT           NOT NULL,
        duracion_seg    INT           NOT NULL,          -- Duración total en segundos
        pipeline_run    VARCHAR(100)  NULL               -- ID del pipeline en Azure DevOps (futuro)
    );

    CREATE INDEX IX_test_runs_ambiente_fecha ON qa_metrics.test_runs(ambiente, fecha);
    CREATE INDEX IX_test_runs_fecha ON qa_metrics.test_runs(fecha DESC);
END
GO

-- ════════════════════════════════════════════════════════════════════════════════
-- Tabla: qa_metrics.test_cases
-- Detalle de cada caso de prueba por ejecución
-- ════════════════════════════════════════════════════════════════════════════════

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'qa_metrics.test_cases') AND type in (N'U'))
BEGIN
    CREATE TABLE qa_metrics.test_cases (
        id              INT IDENTITY(1,1) PRIMARY KEY,
        run_id          INT           NOT NULL,
        modulo          VARCHAR(100)  NOT NULL,
        nombre          VARCHAR(255)  NOT NULL,
        estado          VARCHAR(20)   NOT NULL,          -- PASSED, FAILED, SKIPPED
        duracion_seg    INT           NOT NULL,
        screenshot_path VARCHAR(500)  NULL,
        error_mensaje   NVARCHAR(MAX) NULL,
        fecha           DATETIME2     NOT NULL DEFAULT GETDATE(),
        
        CONSTRAINT FK_test_cases_run FOREIGN KEY (run_id) 
            REFERENCES qa_metrics.test_runs(id) ON DELETE CASCADE
    );

    CREATE INDEX IX_test_cases_run_id ON qa_metrics.test_cases(run_id);
    CREATE INDEX IX_test_cases_modulo ON qa_metrics.test_cases(modulo);
    CREATE INDEX IX_test_cases_estado ON qa_metrics.test_cases(estado);
END
GO

-- ════════════════════════════════════════════════════════════════════════════════
-- Tabla: qa_metrics.coverage_log
-- Cobertura acumulada por módulo en cada ejecución
-- ════════════════════════════════════════════════════════════════════════════════

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'qa_metrics.coverage_log') AND type in (N'U'))
BEGIN
    CREATE TABLE qa_metrics.coverage_log (
        id              INT IDENTITY(1,1) PRIMARY KEY,
        run_id          INT           NOT NULL,
        modulo          VARCHAR(100)  NOT NULL,
        casos_cubiertos INT           NOT NULL,
        casos_totales   INT           NOT NULL,
        porcentaje      DECIMAL(5,2)  NOT NULL,          -- % de cobertura del módulo
        fecha           DATETIME2     NOT NULL DEFAULT GETDATE(),
        
        CONSTRAINT FK_coverage_log_run FOREIGN KEY (run_id) 
            REFERENCES qa_metrics.test_runs(id) ON DELETE CASCADE
    );

    CREATE INDEX IX_coverage_log_run_id ON qa_metrics.coverage_log(run_id);
    CREATE INDEX IX_coverage_log_modulo ON qa_metrics.coverage_log(modulo);
END
GO

PRINT '✅ Schema qa_metrics creado exitosamente';
PRINT '   Tablas: test_runs, test_cases, coverage_log';
GO

-- ════════════════════════════════════════════════════════════════════════════════
-- CONSULTAS DE VALOR PARA DIRECCIÓN Y LÍDERES TÉCNICOS
-- ════════════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────────────
-- Consulta 1: Evolución de la tasa de éxito por semana
-- ────────────────────────────────────────────────────────────────────────────────
/*
SELECT
    DATEPART(WEEK, fecha) AS semana,
    YEAR(fecha) AS año,
    ambiente,
    AVG(CAST(passed AS FLOAT) / total * 100) AS tasa_exito_pct,
    COUNT(*) AS cantidad_ejecuciones
FROM qa_metrics.test_runs
GROUP BY DATEPART(WEEK, fecha), YEAR(fecha), ambiente
ORDER BY año DESC, semana DESC;
*/

-- ────────────────────────────────────────────────────────────────────────────────
-- Consulta 2: Proyección de cobertura por módulo
-- ────────────────────────────────────────────────────────────────────────────────
/*
SELECT
    modulo,
    MAX(porcentaje) AS cobertura_actual,
    AVG(porcentaje) AS cobertura_promedio,
    MIN(porcentaje) AS cobertura_minima,
    COUNT(*) AS ejecuciones
FROM qa_metrics.coverage_log
GROUP BY modulo
ORDER BY cobertura_actual DESC;
*/

-- ────────────────────────────────────────────────────────────────────────────────
-- Consulta 3: Top 10 casos más inestables (flaky tests)
-- ────────────────────────────────────────────────────────────────────────────────
/*
SELECT TOP 10
    modulo,
    nombre,
    COUNT(*) AS total_ejecuciones,
    SUM(CASE WHEN estado = 'PASSED' THEN 1 ELSE 0 END) AS veces_passed,
    SUM(CASE WHEN estado = 'FAILED' THEN 1 ELSE 0 END) AS veces_failed,
    CAST(SUM(CASE WHEN estado = 'FAILED' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100 AS tasa_fallo_pct
FROM qa_metrics.test_cases
GROUP BY modulo, nombre
HAVING COUNT(*) > 3  -- Solo casos con más de 3 ejecuciones
ORDER BY tasa_fallo_pct DESC;
*/
