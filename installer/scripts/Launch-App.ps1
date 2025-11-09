# ======================================================================
# Script de Lancement - Fusion
# ======================================================================
# Ce script vérifie que Docker et OnlyOffice sont configurés
# avant de lancer l'application
# ======================================================================

param(
    [switch]$Silent = $false
)

# Activer les couleurs dans la console
$Host.UI.RawUI.ForegroundColor = "White"
$ErrorActionPreference = "Continue"

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    
    $previousColor = $Host.UI.RawUI.ForegroundColor
    $Host.UI.RawUI.ForegroundColor = $Color
    Write-Host $Message
    $Host.UI.RawUI.ForegroundColor = $previousColor
}

function Test-DockerInstalled {
    try {
        $dockerPath = Get-Command docker -ErrorAction SilentlyContinue
        if ($dockerPath) {
            $version = docker --version 2>&1
            if ($version -match "Docker version") {
                return $true
            }
        }
    } catch {
        return $false
    }
    return $false
}

function Test-DockerRunning {
    try {
        docker ps 2>&1 | Out-Null
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

function Test-OnlyOfficeRunning {
    try {
        $result = docker ps --filter "name=onlyoffice-documentserver" --format "{{.Status}}" 2>&1
        if ($result -match "Up") {
            return $true
        }
    } catch {
        return $false
    }
    return $false
}

function Start-DockerDesktop {
    $dockerDesktopPath = "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe"
    
    if (Test-Path $dockerDesktopPath) {
        Write-ColorOutput "Démarrage de Docker Desktop..." "Yellow"
        Start-Process $dockerDesktopPath
        
        # Attendre que Docker démarre
        $maxAttempts = 30
        $attempt = 0
        
        while ($attempt -lt $maxAttempts) {
            Start-Sleep -Seconds 2
            $attempt++
            
            if (Test-DockerRunning) {
                Write-ColorOutput "✓ Docker est maintenant en cours d'exécution" "Green"
                return $true
            }
        }
        
        Write-ColorOutput "⚠ Docker met du temps à démarrer" "Yellow"
        return $false
    }
    
    return $false
}

function Deploy-OnlyOfficeIfNeeded {
    if (-not (Test-OnlyOfficeRunning)) {
        Write-ColorOutput "OnlyOffice Document Server n'est pas en cours d'exécution" "Yellow"
        
        if (-not $Silent) {
            $deploy = Read-Host "Voulez-vous démarrer OnlyOffice maintenant? (O/N)"
            
            if ($deploy -ne "O" -and $deploy -ne "o") {
                return $false
            }
        }
        
        # Trouver le répertoire d'installation
        $scriptDir = Split-Path -Parent $PSCommandPath
        $deployScript = Join-Path (Split-Path -Parent $scriptDir) "scripts\Deploy-OnlyOffice.ps1"
        
        if (Test-Path $deployScript) {
            Write-ColorOutput "Déploiement d'OnlyOffice Document Server..." "Yellow"
            & $deployScript -Force
            
            if ($LASTEXITCODE -eq 0) {
                Write-ColorOutput "✓ OnlyOffice est prêt" "Green"
                return $true
            }
        } else {
            Write-ColorOutput "⚠ Script de déploiement introuvable" "Yellow"
        }
        
        return $false
    }
    
    return $true
}

function Launch-App {
    # Trouver l'exécutable de l'application
    $scriptDir = Split-Path -Parent $PSCommandPath
    $installDir = Split-Path -Parent (Split-Path -Parent $scriptDir)
    
    $exePath = Join-Path $installDir "Fusion.exe"
    
    if (Test-Path $exePath) {
        Write-ColorOutput "Lancement de Fusion..." "Green"
        Start-Process $exePath
        return $true
    } else {
        Write-ColorOutput "✗ Application introuvable: $exePath" "Red"
        return $false
    }
}

# ======================================================================
# PROGRAMME PRINCIPAL
# ======================================================================

if (-not $Silent) {
    Write-ColorOutput "═══════════════════════════════════════" "Cyan"
    Write-ColorOutput "  Lancement de Fusion" "Yellow"
    Write-ColorOutput "═══════════════════════════════════════" "Cyan"
    Write-Host ""
}

# Vérifier Docker
$dockerInstalled = Test-DockerInstalled

if (-not $dockerInstalled) {
    if (-not $Silent) {
        Write-ColorOutput "⚠ Docker n'est pas installé" "Yellow"
        Write-ColorOutput "L'application va démarrer, mais les fonctionnalités OnlyOffice" "White"
        Write-ColorOutput "ne seront pas disponibles." "White"
        Write-Host ""
        Write-ColorOutput "Pour installer Docker, consultez:" "White"
        Write-ColorOutput "https://www.docker.com/products/docker-desktop" "Cyan"
        Write-Host ""
        
        $continue = Read-Host "Voulez-vous continuer sans OnlyOffice? (O/N)"
        
        if ($continue -ne "O" -and $continue -ne "o") {
            exit 0
        }
    }
    
    Launch-App
    exit 0
}

# Docker est installé - vérifier s'il fonctionne
if (-not (Test-DockerRunning)) {
    if (-not $Silent) {
        Write-ColorOutput "⚠ Docker n'est pas en cours d'exécution" "Yellow"
        $start = Read-Host "Voulez-vous démarrer Docker Desktop? (O/N)"
        
        if ($start -eq "O" -or $start -eq "o") {
            $started = Start-DockerDesktop
            
            if (-not $started) {
                Write-ColorOutput "⚠ Veuillez démarrer Docker Desktop manuellement" "Yellow"
                Write-ColorOutput "L'application va démarrer sans OnlyOffice" "White"
                Write-Host ""
                Read-Host "Appuyez sur Entrée pour continuer"
            }
        }
    } else {
        # Mode silencieux - démarrer Docker automatiquement
        Start-DockerDesktop | Out-Null
    }
}

# Vérifier/Déployer OnlyOffice si Docker fonctionne
if (Test-DockerRunning) {
    if (-not $Silent) {
        Write-Host ""
    }
    
    Deploy-OnlyOfficeIfNeeded | Out-Null
}

# Lancer l'application
if (-not $Silent) {
    Write-Host ""
}

$launched = Launch-App

if ($launched) {
    if (-not $Silent) {
        Write-Host ""
        Write-ColorOutput "✓ Fusion a été lancé avec succès!" "Green"
        Start-Sleep -Seconds 2
    }
} else {
    if (-not $Silent) {
        Write-ColorOutput "✗ Impossible de lancer l'application" "Red"
        Read-Host "Appuyez sur Entrée pour fermer"
    }
    exit 1
}
