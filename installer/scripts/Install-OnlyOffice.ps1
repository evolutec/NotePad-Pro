# ======================================================================
# Installateur Principal - NotePad-Pro OnlyOffice Setup
# ======================================================================
# Script d'installation automatisé pour déployer OnlyOffice Document Server
# avec toutes les configurations nécessaires pour NotePad-Pro
# ======================================================================

param(
    [switch]$Silent = $false,
    [switch]$SkipDocker = $false,
    [switch]$Force = $false,
    [switch]$Verbose = $false
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

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-ColorOutput "========================================" "Cyan"
    Write-ColorOutput $Title "Cyan"
    Write-ColorOutput "========================================" "Cyan"
    Write-Host ""
}

function Write-Banner {
    Clear-Host
    Write-Host ""
    Write-ColorOutput "╔════════════════════════════════════════════════════════╗" "Cyan"
    Write-ColorOutput "║                                                        ║" "Cyan"
    Write-ColorOutput "║          NotePad-Pro OnlyOffice Setup v1.0            ║" "Yellow"
    Write-ColorOutput "║                                                        ║" "Cyan"
    Write-ColorOutput "║    Installation automatisée d'OnlyOffice Document      ║" "White"
    Write-ColorOutput "║    Server pour l'application NotePad-Pro               ║" "White"
    Write-ColorOutput "║                                                        ║" "Cyan"
    Write-ColorOutput "╚════════════════════════════════════════════════════════╝" "Cyan"
    Write-Host ""
}

function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Get-ScriptDirectory {
    return Split-Path -Parent $PSCommandPath
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

function Install-DockerStep {
    Write-Section "🐳 Étape 1/2 : Installation de Docker Desktop"
    
    $scriptDir = Get-ScriptDirectory
    $dockerScriptPath = Join-Path $scriptDir "Install-Docker.ps1"
    
    if (-not (Test-Path $dockerScriptPath)) {
        Write-ColorOutput "✗ Script Install-Docker.ps1 introuvable" "Red"
        Write-ColorOutput "Chemin attendu: $dockerScriptPath" "Yellow"
        return $false
    }
    
    Write-ColorOutput "Lancement du script d'installation Docker..." "Yellow"
    
    try {
        $params = @{}
        if ($Silent) { $params['Silent'] = $true }
        
        & $dockerScriptPath @params
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "`n✓ Docker est prêt" "Green"
            return $true
        } else {
            Write-ColorOutput "`n⚠ L'installation de Docker nécessite des actions manuelles" "Yellow"
            return $false
        }
    } catch {
        Write-ColorOutput "`n✗ Erreur lors de l'installation de Docker : $_" "Red"
        return $false
    }
}

function Deploy-OnlyOfficeStep {
    Write-Section "📦 Étape 2/2 : Déploiement d'OnlyOffice Document Server"
    
    $scriptDir = Get-ScriptDirectory
    $onlyofficeScriptPath = Join-Path $scriptDir "Deploy-OnlyOffice.ps1"
    
    if (-not (Test-Path $onlyofficeScriptPath)) {
        Write-ColorOutput "✗ Script Deploy-OnlyOffice.ps1 introuvable" "Red"
        Write-ColorOutput "Chemin attendu: $onlyofficeScriptPath" "Yellow"
        return $false
    }
    
    Write-ColorOutput "Lancement du script de déploiement OnlyOffice..." "Yellow"
    
    try {
        $params = @{}
        if ($Force) { $params['Force'] = $true }
        if ($Verbose) { $params['Verbose'] = $true }
        
        & $onlyofficeScriptPath @params
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "`n✓ OnlyOffice Document Server est déployé" "Green"
            return $true
        } else {
            Write-ColorOutput "`n✗ Le déploiement d'OnlyOffice a échoué" "Red"
            return $false
        }
    } catch {
        Write-ColorOutput "`n✗ Erreur lors du déploiement : $_" "Red"
        return $false
    }
}

function Show-PreInstallationChecks {
    Write-Section "🔍 Vérifications préliminaires"
    
    $checks = @{
        "Privilèges administrateur" = Test-Administrator
        "Docker installé" = Test-DockerInstalled
        "Docker en cours d'exécution" = Test-DockerRunning
    }
    
    foreach ($check in $checks.GetEnumerator()) {
        $status = if ($check.Value) { "✓" } else { "✗" }
        $color = if ($check.Value) { "Green" } else { "Red" }
        Write-ColorOutput "$status $($check.Key)" $color
    }
    
    Write-Host ""
    
    return $checks
}

function Show-FinalSummary {
    param([bool]$Success)
    
    Write-Section "📊 Installation terminée"
    
    if ($Success) {
        Write-ColorOutput "╔════════════════════════════════════════════════════════╗" "Green"
        Write-ColorOutput "║                                                        ║" "Green"
        Write-ColorOutput "║         ✓ Installation réussie !                       ║" "Green"
        Write-ColorOutput "║                                                        ║" "Green"
        Write-ColorOutput "╚════════════════════════════════════════════════════════╝" "Green"
        Write-Host ""
        Write-ColorOutput "OnlyOffice Document Server est maintenant prêt à l'emploi!" "Green"
        Write-Host ""
        Write-ColorOutput "📍 Informations de connexion:" "Cyan"
        Write-ColorOutput "  • URL: http://localhost" "White"
        Write-ColorOutput "  • Port: 80" "White"
        Write-ColorOutput "  • JWT: Désactivé (développement)" "White"
        Write-Host ""
        Write-ColorOutput "🚀 Prochaines étapes:" "Cyan"
        Write-ColorOutput "  1. Ouvrez http://localhost dans votre navigateur pour vérifier" "White"
        Write-ColorOutput "  2. Lancez NotePad-Pro: npm run electron" "White"
        Write-ColorOutput "  3. Ouvrez un document Office et cliquez sur 'Ouvrir avec OnlyOffice'" "White"
        Write-Host ""
        Write-ColorOutput "🔧 Gestion du conteneur:" "Cyan"
        Write-ColorOutput "  • Démarrer:   docker start onlyoffice-documentserver" "White"
        Write-ColorOutput "  • Arrêter:    docker stop onlyoffice-documentserver" "White"
        Write-ColorOutput "  • Logs:       docker logs onlyoffice-documentserver" "White"
        Write-ColorOutput "  • Redémarrer: docker restart onlyoffice-documentserver" "White"
        Write-Host ""
        Write-ColorOutput "📚 Documentation:" "Cyan"
        Write-ColorOutput "  Voir ONLYOFFICE_DOCKER_SETUP.md pour plus d'informations" "White"
        Write-Host ""
    } else {
        Write-ColorOutput "╔════════════════════════════════════════════════════════╗" "Red"
        Write-ColorOutput "║                                                        ║" "Red"
        Write-ColorOutput "║         ✗ L'installation a échoué                      ║" "Red"
        Write-ColorOutput "║                                                        ║" "Red"
        Write-ColorOutput "╚════════════════════════════════════════════════════════╝" "Red"
        Write-Host ""
        Write-ColorOutput "Des erreurs se sont produites pendant l'installation." "Yellow"
        Write-Host ""
        Write-ColorOutput "🔧 Solutions possibles:" "Cyan"
        Write-ColorOutput "  1. Redémarrez Windows et relancez ce script" "White"
        Write-ColorOutput "  2. Vérifiez que Docker Desktop est bien installé et démarré" "White"
        Write-ColorOutput "  3. Consultez les logs ci-dessus pour plus de détails" "White"
        Write-Host ""
        Write-ColorOutput "📚 Besoin d'aide?" "Cyan"
        Write-ColorOutput "  • Consultez ONLYOFFICE_DOCKER_SETUP.md" "White"
        Write-ColorOutput "  • Vérifiez les logs Docker: docker logs onlyoffice-documentserver" "White"
        Write-ColorOutput "  • Installation manuelle de Docker: https://www.docker.com/products/docker-desktop" "White"
        Write-Host ""
    }
}

function Confirm-Continue {
    param([string]$Message)
    
    if ($Silent) {
        return $true
    }
    
    $response = Read-Host "$Message (O/N)"
    return ($response -eq "O" -or $response -eq "o")
}

# ======================================================================
# PROGRAMME PRINCIPAL
# ======================================================================

Write-Banner

# Vérifier les privilèges administrateur
if (-not (Test-Administrator)) {
    Write-ColorOutput "✗ Ce script nécessite des privilèges administrateur" "Red"
    Write-ColorOutput "Veuillez exécuter PowerShell en tant qu'administrateur:" "Yellow"
    Write-ColorOutput "  1. Clic droit sur PowerShell" "White"
    Write-ColorOutput "  2. Sélectionner 'Exécuter en tant qu'administrateur'" "White"
    Write-Host ""
    
    if (-not $Silent) {
        Read-Host "Appuyez sur Entrée pour quitter"
    }
    exit 1
}

# Afficher les vérifications préliminaires
$checks = Show-PreInstallationChecks

# Déterminer les étapes à exécuter
$needDockerInstall = -not $checks["Docker installé"]
$needDockerStart = $checks["Docker installé"] -and -not $checks["Docker en cours d'exécution"]

if ($needDockerInstall -and -not $SkipDocker) {
    Write-ColorOutput "Docker n'est pas installé sur votre système" "Yellow"
    
    if (Confirm-Continue "Voulez-vous installer Docker Desktop maintenant?") {
        $dockerInstalled = Install-DockerStep
        
        if (-not $dockerInstalled) {
            Write-ColorOutput "`n⚠ Docker n'a pas pu être installé automatiquement" "Yellow"
            Write-ColorOutput "Veuillez installer Docker manuellement et relancer ce script" "Yellow"
            Show-FinalSummary -Success $false
            exit 1
        }
        
        # Après l'installation de Docker, un redémarrage est probablement nécessaire
        Write-ColorOutput "`n⚠ Après le redémarrage, relancez ce script pour déployer OnlyOffice" "Yellow"
        exit 0
    } else {
        Write-ColorOutput "Installation annulée" "Yellow"
        exit 0
    }
} elseif ($needDockerStart) {
    Write-ColorOutput "Docker est installé mais ne fonctionne pas" "Yellow"
    Write-ColorOutput "Veuillez démarrer Docker Desktop et relancer ce script" "Yellow"
    
    if (Confirm-Continue "Voulez-vous que le script attende le démarrage de Docker?") {
        Write-ColorOutput "Démarrage de Docker Desktop..." "Yellow"
        Start-Process "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe"
        
        Write-ColorOutput "Attente du démarrage de Docker (cela peut prendre 1-2 minutes)..." "Yellow"
        
        $maxAttempts = 60
        $attempt = 0
        $dockerStarted = $false
        
        while ($attempt -lt $maxAttempts) {
            Start-Sleep -Seconds 5
            $attempt++
            
            if (Test-DockerRunning) {
                Write-ColorOutput "`n✓ Docker est maintenant en cours d'exécution" "Green"
                $dockerStarted = $true
                break
            }
            
            Write-Host "." -NoNewline
        }
        
        if (-not $dockerStarted) {
            Write-ColorOutput "`n✗ Docker n'a pas démarré dans le délai imparti" "Red"
            Write-ColorOutput "Veuillez démarrer Docker manuellement et relancer ce script" "Yellow"
            exit 1
        }
    } else {
        exit 0
    }
}

# Déployer OnlyOffice
Write-ColorOutput "`nDocker est prêt, déploiement d'OnlyOffice..." "Green"

$onlyofficeDeployed = Deploy-OnlyOfficeStep

if ($onlyofficeDeployed) {
    Show-FinalSummary -Success $true
    exit 0
} else {
    Show-FinalSummary -Success $false
    exit 1
}
