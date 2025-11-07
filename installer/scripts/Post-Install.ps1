# ======================================================================
# Script de Post-Installation - NotePad-Pro
# ======================================================================
# Ce script s'exécute après l'installation de l'application
# Il configure Docker et OnlyOffice Document Server automatiquement
# ======================================================================

param(
    [string]$InstallDir = $PSScriptRoot
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

function Write-Banner {
    Clear-Host
    Write-Host ""
    Write-ColorOutput "╔════════════════════════════════════════════════════════╗" "Cyan"
    Write-ColorOutput "║                                                        ║" "Cyan"
    Write-ColorOutput "║          Configuration de NotePad-Pro                 ║" "Yellow"
    Write-ColorOutput "║                                                        ║" "Cyan"
    Write-ColorOutput "║    Installation de Docker et OnlyOffice Document      ║" "White"
    Write-ColorOutput "║    Server pour une expérience complète                ║" "White"
    Write-ColorOutput "║                                                        ║" "Cyan"
    Write-ColorOutput "╚════════════════════════════════════════════════════════╝" "Cyan"
    Write-Host ""
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

# ======================================================================
# PROGRAMME PRINCIPAL
# ======================================================================

Write-Banner

Write-ColorOutput "Bienvenue dans l'assistant de configuration de NotePad-Pro!" "Green"
Write-Host ""
Write-ColorOutput "Cette application nécessite OnlyOffice Document Server pour éditer" "White"
Write-ColorOutput "les documents Office (Word, Excel, PowerPoint)." "White"
Write-Host ""
Write-ColorOutput "OnlyOffice fonctionne via Docker. Si Docker n'est pas installé," "White"
Write-ColorOutput "nous pouvons l'installer automatiquement pour vous." "White"
Write-Host ""

# Vérifier si Docker est installé
$dockerInstalled = Test-DockerInstalled

if ($dockerInstalled) {
    Write-ColorOutput "✓ Docker est déjà installé sur votre système" "Green"
    Write-Host ""
    
    # Vérifier si Docker fonctionne
    if (Test-DockerRunning) {
        Write-ColorOutput "✓ Docker est en cours d'exécution" "Green"
        Write-Host ""
        
        $deployNow = Read-Host "Voulez-vous déployer OnlyOffice Document Server maintenant? (O/N)"
        
        if ($deployNow -eq "O" -or $deployNow -eq "o") {
            # Trouver le script de déploiement
            $resourcesPath = Join-Path $InstallDir "resources"
            if (-not (Test-Path $resourcesPath)) {
                $resourcesPath = Split-Path -Parent $InstallDir
            }
            
            $deployScript = Join-Path $resourcesPath "installer\scripts\Deploy-OnlyOffice.ps1"
            
            if (Test-Path $deployScript) {
                Write-ColorOutput "`nDéploiement d'OnlyOffice..." "Yellow"
                & $deployScript -Force
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host ""
                    Write-ColorOutput "✓ OnlyOffice a été déployé avec succès!" "Green"
                }
            } else {
                Write-ColorOutput "✗ Script de déploiement introuvable: $deployScript" "Red"
            }
        }
    } else {
        Write-ColorOutput "⚠ Docker est installé mais ne fonctionne pas" "Yellow"
        Write-ColorOutput "Veuillez démarrer Docker Desktop et relancer NotePad-Pro" "Yellow"
    }
} else {
    Write-ColorOutput "⚠ Docker n'est pas installé" "Yellow"
    Write-Host ""
    
    $installDocker = Read-Host "Voulez-vous installer Docker Desktop maintenant? (O/N)"
    
    if ($installDocker -eq "O" -or $installDocker -eq "o") {
        # Trouver le script d'installation Docker
        $resourcesPath = Join-Path $InstallDir "resources"
        if (-not (Test-Path $resourcesPath)) {
            $resourcesPath = Split-Path -Parent $InstallDir
        }
        
        $dockerScript = Join-Path $resourcesPath "installer\scripts\Install-Docker.ps1"
        
        if (Test-Path $dockerScript) {
            Write-ColorOutput "`nInstallation de Docker Desktop..." "Yellow"
            & $dockerScript
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-ColorOutput "✓ Docker a été installé!" "Green"
                Write-ColorOutput "⚠ Veuillez REDÉMARRER WINDOWS puis relancer NotePad-Pro" "Yellow"
                Write-ColorOutput "pour déployer OnlyOffice Document Server" "Yellow"
            }
        } else {
            Write-ColorOutput "✗ Script d'installation Docker introuvable: $dockerScript" "Red"
        }
    } else {
        Write-ColorOutput "`nVous pourrez installer Docker plus tard depuis:" "Yellow"
        Write-ColorOutput "https://www.docker.com/products/docker-desktop" "Cyan"
    }
}

Write-Host ""
Write-ColorOutput "════════════════════════════════════════════════════════" "Cyan"
Write-ColorOutput "Configuration terminée!" "Green"
Write-ColorOutput "════════════════════════════════════════════════════════" "Cyan"
Write-Host ""

if ($dockerInstalled -and (Test-DockerRunning)) {
    Write-ColorOutput "✓ Vous êtes prêt à utiliser NotePad-Pro!" "Green"
    Write-Host ""
    $launch = Read-Host "Voulez-vous lancer l'application maintenant? (O/N)"
    
    if ($launch -eq "O" -or $launch -eq "o") {
        $exePath = Join-Path $InstallDir "NotePad-Pro.exe"
        if (Test-Path $exePath) {
            Start-Process $exePath
        }
    }
} else {
    Write-ColorOutput "⚠ Configuration incomplète" "Yellow"
    Write-ColorOutput "Pour utiliser les fonctionnalités OnlyOffice:" "White"
    Write-ColorOutput "  1. Installez Docker Desktop" "White"
    Write-ColorOutput "  2. Redémarrez Windows" "White"
    Write-ColorOutput "  3. Relancez NotePad-Pro" "White"
}

Write-Host ""
Read-Host "Appuyez sur Entrée pour fermer cette fenêtre"
