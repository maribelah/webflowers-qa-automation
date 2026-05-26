# Script de instalación completa - WebFlowers QA Automation
# Ejecuta este script para completar la instalación del proyecto

Write-Host "`n🌸 WebFlowers QA Automation - Instalación Completa`n" -ForegroundColor Magenta

# Paso 1: Verificar Node.js
Write-Host "📦 Verificando Node.js..." -ForegroundColor Cyan
$nodeVersion = node --version
Write-Host "   ✅ Node.js version: $nodeVersion" -ForegroundColor Green

# Paso 2: Instalar dependencias (si no están instaladas)
if (-not (Test-Path "node_modules")) {
    Write-Host "`n📦 Instalando dependencias npm..." -ForegroundColor Cyan
    npm install
} else {
    Write-Host "`n✅ Dependencias npm ya instaladas" -ForegroundColor Green
}

# Paso 3: Instalar navegadores de Playwright
Write-Host "`n🌐 Instalando navegadores de Playwright..." -ForegroundColor Cyan
Write-Host "   Esto puede tomar 5-10 minutos..." -ForegroundColor Yellow
npx playwright install

# Paso 4: Crear archivo .env desde .env.example
if (-not (Test-Path ".env")) {
    Write-Host "`n📝 Creando archivo .env..." -ForegroundColor Cyan
    Copy-Item .env.example -Destination .env
    Write-Host "   ✅ Archivo .env creado" -ForegroundColor Green
    Write-Host "   ⚠️  IMPORTANTE: Edita .env con tus credenciales reales" -ForegroundColor Yellow
} else {
    Write-Host "`n✅ Archivo .env ya existe" -ForegroundColor Green
}

# Paso 5: Verificar instalación
Write-Host "`n🔍 Verificando instalación..." -ForegroundColor Cyan

# Verificar Playwright
$playwrightVersion = npx playwright --version
Write-Host "   ✅ $playwrightVersion" -ForegroundColor Green

# Verificar TypeScript
$tscVersion = npx tsc --version
Write-Host "   ✅ $tscVersion" -ForegroundColor Green

# Resumen final
Write-Host "`n╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              INSTALACIÓN COMPLETADA ✅                        ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`n📋 PRÓXIMOS PASOS:" -ForegroundColor Cyan
Write-Host "   1. Edita el archivo .env con tus credenciales reales"
Write-Host "   2. Ejecuta las pruebas: npm run test:alpha"
Write-Host "   3. Genera el reporte: npm run allure:report"
Write-Host ""
