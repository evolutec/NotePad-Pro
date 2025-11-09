# ======================================================================
# Script de Post-Installation - Fusion
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
    Write-ColorOutput "║          Configuration de Fusion                      ║" "Yellow"
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
# CONFIGURATION DU CHEMIN DE STOCKAGE DES NOTES
# ======================================================================

function Set-NotesPath {
    Write-Host ""
    Write-ColorOutput "╔════════════════════════════════════════════════════════╗" "Cyan"
    Write-ColorOutput "║   Configuration du dossier de stockage des notes     ║" "Yellow"
    Write-ColorOutput "╚════════════════════════════════════════════════════════╝" "Cyan"
    Write-Host ""
    
    $defaultPath = Join-Path ([Environment]::GetFolderPath("MyDocuments")) "Notes"
    
    Write-ColorOutput "Fusion a besoin d'un dossier pour stocker vos notes." "White"
    Write-Host ""
    Write-ColorOutput "Chemin par défaut proposé:" "White"
    Write-ColorOutput "  $defaultPath" "Cyan"
    Write-Host ""
    
    $useDefault = Read-Host "Utiliser ce dossier? (O/N)"
    
    $notesPath = $defaultPath
    if ($useDefault -ne "O" -and $useDefault -ne "o") {
        Write-Host ""
        Write-ColorOutput "Entrez le chemin complet du dossier (ex: C:\MesNotes):" "Yellow"
        $customPath = Read-Host
        
        if ($customPath -and $customPath.Trim() -ne "") {
            $notesPath = $customPath.Trim()
        }
    }
    
    # Créer le dossier s'il n'existe pas
    if (-not (Test-Path $notesPath)) {
        try {
            New-Item -ItemType Directory -Path $notesPath -Force | Out-Null
            Write-ColorOutput "✓ Dossier créé: $notesPath" "Green"
        } catch {
            Write-ColorOutput "✗ Impossible de créer le dossier: $_" "Red"
            Write-ColorOutput "Utilisation du chemin par défaut..." "Yellow"
            $notesPath = $defaultPath
            New-Item -ItemType Directory -Path $notesPath -Force | Out-Null
        }
    } else {
        Write-ColorOutput "✓ Dossier existant: $notesPath" "Green"
    }
    
    return $notesPath
}

function Create-ConfigFile {
    param(
        [string]$NotesPath
    )
    
    # Trouver le répertoire d'installation de l'application
    $resourcesPath = Join-Path $InstallDir "resources"
    if (-not (Test-Path $resourcesPath)) {
        $resourcesPath = Split-Path -Parent $InstallDir
    }
    
    $appPath = Split-Path -Parent $resourcesPath
    $configPath = Join-Path $appPath "config.json"
    
    # Créer la configuration
    $config = @{
        stylus = @{
            pressureSensitivity = 1
            offsetX = 0
            offsetY = 0
            minPressure = 0.1
            maxPressure = 1
            smoothing = 0.5
            palmRejection = $true
        }
        files = @{
            rootPath = $NotesPath
            autoSave = $true
            autoSaveInterval = 30
            backupEnabled = $true
            maxFileSize = 50
        }
        app = @{
            theme = "system"
            language = "fr"
            startWithWindows = $false
            minimizeToTray = $true
        }
    }
    
    try {
        $configJson = $config | ConvertTo-Json -Depth 10
        $configJson | Out-File -FilePath $configPath -Encoding UTF8 -Force
        Write-ColorOutput "✓ Configuration sauvegardée: $configPath" "Green"
        return $true
    } catch {
        Write-ColorOutput "✗ Erreur lors de la création de config.json: $_" "Red"
        return $false
    }
}

# ======================================================================
# PROGRAMME PRINCIPAL
# ======================================================================

Write-Banner

Write-ColorOutput "Bienvenue dans l'assistant de configuration de Fusion!" "Green"
Write-Host ""

# Étape 1 : Configuration du chemin de stockage des notes
$notesPath = Set-NotesPath
Write-Host ""

# Créer le fichier config.json
$configCreated = Create-ConfigFile -NotesPath $notesPath
Write-Host ""

if (-not $configCreated) {
    Write-ColorOutput "⚠ Attention: La configuration n'a pas pu être créée" "Yellow"
    Write-ColorOutput "Vous pourrez la configurer depuis l'application" "White"
    Write-Host ""
}

# Étape 2 : Configuration de Docker et OnlyOffice
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
        Write-ColorOutput "Veuillez démarrer Docker Desktop et relancer Fusion" "Yellow"
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
                Write-ColorOutput "⚠ Veuillez REDÉMARRER WINDOWS puis relancer Fusion" "Yellow"
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
    Write-ColorOutput "✓ Vous êtes prêt à utiliser Fusion!" "Green"
    Write-Host ""
    $launch = Read-Host "Voulez-vous lancer l'application maintenant? (O/N)"
    
    if ($launch -eq "O" -or $launch -eq "o") {
        $exePath = Join-Path $InstallDir "Fusion.exe"
        if (Test-Path $exePath) {
            Start-Process $exePath
        }
    }
} else {
    Write-ColorOutput "⚠ Configuration incomplète" "Yellow"
    Write-ColorOutput "Pour utiliser les fonctionnalités OnlyOffice:" "White"
    Write-ColorOutput "  1. Installez Docker Desktop" "White"
    Write-ColorOutput "  2. Redémarrez Windows" "White"
    Write-ColorOutput "  3. Relancez Fusion" "White"
}

Write-Host ""
Read-Host "Appuyez sur Entrée pour fermer cette fenêtre"
