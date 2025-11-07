# Script de lancement rapide
# Double-cliquez sur ce fichier pour lancer l'installation

Write-Host "Lancement de l'installateur OnlyOffice pour NotePad-Pro..." -ForegroundColor Cyan
Write-Host ""

# Obtenir le répertoire du script
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$installerScript = Join-Path $scriptPath "scripts\Install-OnlyOffice.ps1"

# Vérifier si le script existe
if (Test-Path $installerScript) {
    # Lancer le script principal
    & $installerScript
} else {
    Write-Host "Erreur: Script d'installation introuvable" -ForegroundColor Red
    Write-Host "Chemin attendu: $installerScript" -ForegroundColor Yellow
    pause
}
