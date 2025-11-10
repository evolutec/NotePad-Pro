# Build-Installer.ps1
# Script pour construire l'installateur Fusion avec toutes les ressources

param(
    [switch]$SkipBuild,
    [switch]$SkipClean
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "[✓] $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "[i] $Message" -ForegroundColor Cyan
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[!] $Message" -ForegroundColor Yellow
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "[✗] $Message" -ForegroundColor Red
}

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "package.json")) {
    Write-ErrorMsg "package.json introuvable! Assurez-vous d'exécuter ce script depuis la racine du projet."
    exit 1
}

Write-Step "Préparation du build de l'installateur Fusion"

# Étape 1: Nettoyage (optionnel)
if (-not $SkipClean) {
    Write-Info "Nettoyage des fichiers de build précédents..."
    
    if (Test-Path "dist") {
        Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Success "Dossier 'dist' supprimé"
    }
    
    if (Test-Path "out") {
        Remove-Item -Path "out" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Success "Dossier 'out' supprimé"
    }
    
    if (Test-Path ".next") {
        Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Success "Dossier '.next' supprimé"
    }
} else {
    Write-Warning "Nettoyage ignoré (-SkipClean)"
}

# Étape 2: Vérifier les icônes
Write-Step "Vérification des ressources"

$requiredIcons = @(
    "public/icon.ico",
    "public/icon-512.png",
    "public/favicon.ico"
)

$missingIcons = @()
foreach ($icon in $requiredIcons) {
    if (Test-Path $icon) {
        Write-Success "Trouvé: $icon"
    } else {
        Write-Warning "Manquant: $icon"
        $missingIcons += $icon
    }
}

if ($missingIcons.Count -gt 0) {
    Write-Warning "Certaines icônes sont manquantes, mais le build continuera"
}

# Étape 3: Vérifier les scripts d'installation
Write-Info "Vérification des scripts d'installation..."

$requiredScripts = @(
    "installer/scripts/Post-Install.ps1",
    "installer/scripts/Launch-App.ps1"
)

foreach ($script in $requiredScripts) {
    if (Test-Path $script) {
        Write-Success "Trouvé: $script"
    } else {
        Write-ErrorMsg "Script manquant: $script"
        Write-Warning "Le build peut échouer sans ce script"
    }
}

# Étape 4: Build Next.js
if (-not $SkipBuild) {
    Write-Step "Build de l'application Next.js"
    
    Write-Info "Exécution de: pnpm run build"
    try {
        & pnpm run build
        if ($LASTEXITCODE -ne 0) {
            throw "Le build Next.js a échoué"
        }
        Write-Success "Build Next.js terminé"
    } catch {
        Write-ErrorMsg "Erreur lors du build Next.js: $_"
        exit 1
    }
} else {
    Write-Warning "Build Next.js ignoré (-SkipBuild)"
}

# Étape 5: Build Electron
Write-Step "Build de l'installateur Electron"

Write-Info "Exécution de: pnpm run build:electron"
Write-Info "Cela peut prendre plusieurs minutes..."

try {
    & pnpm run build:electron
    if ($LASTEXITCODE -ne 0) {
        throw "Le build Electron a échoué"
    }
    Write-Success "Build Electron terminé"
} catch {
    Write-ErrorMsg "Erreur lors du build Electron: $_"
    exit 1
}

# Étape 6: Vérifier le résultat
Write-Step "Vérification du build"

if (Test-Path "dist") {
    $installers = Get-ChildItem -Path "dist" -Filter "*.exe"
    
    if ($installers.Count -gt 0) {
        Write-Success "Installateur(s) créé(s) avec succès!"
        Write-Host ""
        Write-Info "Fichier(s) créé(s):"
        foreach ($installer in $installers) {
            $size = [math]::Round($installer.Length / 1MB, 2)
            Write-Host "  - $($installer.Name) ($size MB)" -ForegroundColor Green
            Write-Host "    Chemin: $($installer.FullName)" -ForegroundColor Gray
        }
        
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "✓ BUILD TERMINÉ AVEC SUCCÈS!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Info "L'installateur est prêt à être distribué"
        Write-Info "Il inclut:"
        Write-Host "  ✓ Application Fusion" -ForegroundColor Gray
        Write-Host "  ✓ Scripts d'installation Docker" -ForegroundColor Gray
        Write-Host "  ✓ Scripts de déploiement OnlyOffice" -ForegroundColor Gray
        Write-Host "  ✓ Configuration automatique" -ForegroundColor Gray
        Write-Host "  ✓ Icônes et ressources" -ForegroundColor Gray
        
    } else {
        Write-ErrorMsg "Aucun installateur trouvé dans le dossier 'dist'"
        exit 1
    }
} else {
    Write-ErrorMsg "Le dossier 'dist' n'a pas été créé"
    exit 1
}

Write-Host ""
