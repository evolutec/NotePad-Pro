# Script de test rapide de l'application packagée
# Lance l'application depuis dist/win-unpacked

$exePath = "dist\win-unpacked\NotePad-Pro.exe"

if (Test-Path $exePath) {
    Write-Host "Lancement de l'application de test..." -ForegroundColor Green
    & $exePath
} else {
    Write-Host "Application non trouvée. Lancez d'abord: npm run electron:build" -ForegroundColor Red
}
