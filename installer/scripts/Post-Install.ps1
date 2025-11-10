# Post-Install.ps1
# Script de post-installation pour NotePad-Pro
# Configure Docker Desktop et OnlyOffice Document Server

param(
    [Parameter(Mandatory=$false)]
    [string]$InstallDir = "C:\Program Files\NotePad-Pro"
)

$ErrorActionPreference = "Stop"
$ProgressPreference = 'SilentlyContinue'

# Fonction pour afficher les messages colorés
function Write-ColorOutput {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Message,
        [ValidateSet('Info','Success','Warning','Error')]
        [string]$Type = 'Info'
    )
    
    $color = switch($Type) {
        'Info' { 'Cyan' }
        'Success' { 'Green' }
        'Warning' { 'Yellow' }
        'Error' { 'Red' }
    }
    
    $prefix = switch($Type) {
        'Info' { '[INFO]' }
        'Success' { '[✓]' }
        'Warning' { '[!]' }
        'Error' { '[✗]' }
    }
    
    Write-Host "$prefix $Message" -ForegroundColor $color
}

# Fonction pour vérifier si Docker est installé
function Test-DockerInstalled {
    try {
        $docker = Get-Command docker -ErrorAction SilentlyContinue
        if ($docker) {
            Write-ColorOutput "Docker est déjà installé" -Type Success
            return $true
        }
        Write-ColorOutput "Docker n'est pas installé" -Type Warning
        return $false
    } catch {
        Write-ColorOutput "Docker n'est pas installé" -Type Warning
        return $false
    }
}

# Fonction pour vérifier si Docker Desktop est en cours d'exécution
function Test-DockerRunning {
    try {
        $result = docker ps 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "Docker Desktop est en cours d'exécution" -Type Success
            return $true
        }
        Write-ColorOutput "Docker Desktop n'est pas en cours d'exécution" -Type Warning
        return $false
    } catch {
        Write-ColorOutput "Docker Desktop n'est pas en cours d'exécution" -Type Warning
        return $false
    }
}

# Fonction pour installer Docker Desktop
function Install-DockerDesktop {
    Write-ColorOutput "=========================================" -Type Info
    Write-ColorOutput "Installation de Docker Desktop" -Type Info
    Write-ColorOutput "=========================================" -Type Info
    Write-Host ""
    
    try {
        # Télécharger Docker Desktop
        $dockerInstallerUrl = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
        $dockerInstallerPath = "$env:TEMP\DockerDesktopInstaller.exe"
        
        Write-ColorOutput "Téléchargement de Docker Desktop..." -Type Info
        Write-ColorOutput "Cela peut prendre plusieurs minutes selon votre connexion..." -Type Warning
        
        Invoke-WebRequest -Uri $dockerInstallerUrl -OutFile $dockerInstallerPath -UseBasicParsing
        
        if (Test-Path $dockerInstallerPath) {
            Write-ColorOutput "Téléchargement terminé!" -Type Success
            Write-Host ""
            Write-ColorOutput "Lancement de l'installation de Docker Desktop..." -Type Info
            Write-ColorOutput "IMPORTANT: Suivez les instructions de l'installeur Docker" -Type Warning
            Write-ColorOutput "L'ordinateur pourrait redémarrer pendant l'installation" -Type Warning
            Write-Host ""
            
            # Lancer l'installeur Docker
            Start-Process -FilePath $dockerInstallerPath -ArgumentList "install --quiet --accept-license" -Wait
            
            Write-Host ""
            Write-ColorOutput "Installation de Docker Desktop terminée!" -Type Success
            Write-ColorOutput "Docker Desktop va démarrer automatiquement..." -Type Info
            Write-Host ""
            
            # Attendre que Docker démarre (max 2 minutes)
            Write-ColorOutput "Attente du démarrage de Docker Desktop..." -Type Info
            $timeout = 120
            $elapsed = 0
            while (-not (Test-DockerRunning) -and $elapsed -lt $timeout) {
                Start-Sleep -Seconds 5
                $elapsed += 5
                Write-Host "." -NoNewline
            }
            Write-Host ""
            
            if (Test-DockerRunning) {
                Write-ColorOutput "Docker Desktop est maintenant opérationnel!" -Type Success
                return $true
            } else {
                Write-ColorOutput "Docker Desktop a été installé mais n'a pas démarré automatiquement" -Type Warning
                Write-ColorOutput "Veuillez le démarrer manuellement depuis le menu démarrer" -Type Warning
                return $false
            }
        } else {
            Write-ColorOutput "Échec du téléchargement de Docker Desktop" -Type Error
            return $false
        }
    } catch {
        Write-ColorOutput "Erreur lors de l'installation de Docker Desktop: $_" -Type Error
        return $false
    }
}

# Fonction pour déployer OnlyOffice Document Server
function Deploy-OnlyOfficeDocumentServer {
    Write-ColorOutput "=========================================" -Type Info
    Write-ColorOutput "Déploiement d'OnlyOffice Document Server" -Type Info
    Write-ColorOutput "=========================================" -Type Info
    Write-Host ""
    
    try {
        # Vérifier si le conteneur existe déjà
        $existingContainer = docker ps -a --filter "name=onlyoffice-documentserver" --format "{{.Names}}" 2>$null
        
        if ($existingContainer -eq "onlyoffice-documentserver") {
            Write-ColorOutput "Le conteneur OnlyOffice existe déjà" -Type Info
            
            # Vérifier s'il est en cours d'exécution
            $runningContainer = docker ps --filter "name=onlyoffice-documentserver" --format "{{.Names}}" 2>$null
            
            if ($runningContainer -eq "onlyoffice-documentserver") {
                Write-ColorOutput "OnlyOffice Document Server est déjà en cours d'exécution" -Type Success
                Write-ColorOutput "URL: http://localhost:8000" -Type Info
                return $true
            } else {
                Write-ColorOutput "Démarrage du conteneur existant..." -Type Info
                docker start onlyoffice-documentserver
                
                if ($LASTEXITCODE -eq 0) {
                    Write-ColorOutput "OnlyOffice Document Server démarré avec succès!" -Type Success
                    Write-ColorOutput "URL: http://localhost:8000" -Type Info
                    return $true
                } else {
                    Write-ColorOutput "Erreur lors du démarrage du conteneur" -Type Error
                    Write-ColorOutput "Suppression du conteneur défectueux..." -Type Warning
                    docker rm -f onlyoffice-documentserver 2>$null
                }
            }
        }
        
        # Télécharger et démarrer le conteneur OnlyOffice
        Write-ColorOutput "Téléchargement de l'image OnlyOffice Document Server..." -Type Info
        Write-ColorOutput "Cela peut prendre 10-15 minutes selon votre connexion..." -Type Warning
        Write-Host ""
        
        docker pull onlyoffice/documentserver:latest
        
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput "Échec du téléchargement de l'image OnlyOffice" -Type Error
            return $false
        }
        
        Write-Host ""
        Write-ColorOutput "Démarrage du conteneur OnlyOffice Document Server..." -Type Info
        
        # Créer et démarrer le conteneur avec les bonnes configurations
        docker run -d `
            --name onlyoffice-documentserver `
            -p 8000:80 `
            -e JWT_ENABLED=false `
            -e JWT_SECRET="" `
            -e WOPI_ENABLED=true `
            --restart unless-stopped `
            onlyoffice/documentserver:latest
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-ColorOutput "OnlyOffice Document Server déployé avec succès!" -Type Success
            Write-ColorOutput "Le serveur démarre, cela peut prendre 1-2 minutes..." -Type Info
            Write-Host ""
            Write-ColorOutput "Configuration:" -Type Info
            Write-ColorOutput "  - URL: http://localhost:8000" -Type Info
            Write-ColorOutput "  - Port: 8000" -Type Info
            Write-ColorOutput "  - JWT: Désactivé (pour développement)" -Type Info
            Write-ColorOutput "  - WOPI: Activé" -Type Info
            Write-Host ""
            
            # Attendre que OnlyOffice soit prêt (max 2 minutes)
            Write-ColorOutput "Vérification de la disponibilité d'OnlyOffice..." -Type Info
            $timeout = 120
            $elapsed = 0
            $ready = $false
            
            while (-not $ready -and $elapsed -lt $timeout) {
                try {
                    $response = Invoke-WebRequest -Uri "http://localhost:8000/healthcheck" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
                    if ($response.StatusCode -eq 200) {
                        $ready = $true
                    }
                } catch {
                    # Continuer à attendre
                }
                
                if (-not $ready) {
                    Start-Sleep -Seconds 5
                    $elapsed += 5
                    Write-Host "." -NoNewline
                }
            }
            Write-Host ""
            
            if ($ready) {
                Write-ColorOutput "OnlyOffice Document Server est maintenant opérationnel!" -Type Success
            } else {
                Write-ColorOutput "OnlyOffice Document Server démarre toujours..." -Type Warning
                Write-ColorOutput "Il sera prêt dans quelques instants" -Type Info
            }
            
            return $true
        } else {
            Write-ColorOutput "Échec du démarrage du conteneur OnlyOffice" -Type Error
            return $false
        }
    } catch {
        Write-ColorOutput "Erreur lors du déploiement d'OnlyOffice: $_" -Type Error
        return $false
    }
}

# Fonction pour créer un fichier de configuration
function Create-ConfigFile {
    param([string]$InstallDir)
    
    try {
        $configPath = Join-Path $InstallDir "config.json"
        
        if (Test-Path $configPath) {
            # Lire la configuration existante
            $config = Get-Content $configPath -Raw | ConvertFrom-Json
        } else {
            # Créer une nouvelle configuration
            $config = @{
                onlyoffice = @{
                    url = "http://localhost:8000"
                    enabled = $true
                }
                docker = @{
                    installed = $true
                    version = (docker --version 2>$null)
                }
                firstRun = $false
            }
        }
        
        # Mettre à jour la configuration
        $config.onlyoffice.url = "http://localhost:8000"
        $config.onlyoffice.enabled = $true
        $config.docker.installed = $true
        $config.firstRun = $false
        
        # Sauvegarder
        $config | ConvertTo-Json -Depth 10 | Set-Content $configPath -Encoding UTF8
        
        Write-ColorOutput "Fichier de configuration créé: $configPath" -Type Success
        return $true
    } catch {
        Write-ColorOutput "Erreur lors de la création du fichier de configuration: $_" -Type Warning
        return $false
    }
}

# ========================================
# MAIN SCRIPT
# ========================================

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "NotePad-Pro - Configuration initiale" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-ColorOutput "Répertoire d'installation: $InstallDir" -Type Info
Write-Host ""

# Étape 1: Vérifier/Installer Docker
Write-ColorOutput "Étape 1/3: Vérification de Docker Desktop" -Type Info
Write-Host ""

$dockerInstalled = Test-DockerInstalled

if (-not $dockerInstalled) {
    $response = Read-Host "Docker n'est pas installé. Voulez-vous l'installer maintenant? (O/N)"
    
    if ($response -eq 'O' -or $response -eq 'o') {
        $dockerInstalled = Install-DockerDesktop
        
        if (-not $dockerInstalled) {
            Write-Host ""
            Write-ColorOutput "Installation de Docker annulée ou échouée" -Type Error
            Write-ColorOutput "Vous devrez installer Docker manuellement pour utiliser OnlyOffice" -Type Warning
            Write-Host ""
            Write-Host "Appuyez sur une touche pour continuer..."
            $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
            exit 1
        }
    } else {
        Write-Host ""
        Write-ColorOutput "Installation de Docker ignorée" -Type Warning
        Write-ColorOutput "NotePad-Pro fonctionnera sans OnlyOffice Document Server" -Type Info
        Write-Host ""
        Write-Host "Appuyez sur une touche pour quitter..."
        $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
        exit 0
    }
}

# Étape 2: Vérifier que Docker est en cours d'exécution
Write-Host ""
Write-ColorOutput "Étape 2/3: Vérification de Docker Desktop" -Type Info
Write-Host ""

$dockerRunning = Test-DockerRunning

if (-not $dockerRunning) {
    Write-ColorOutput "Docker Desktop n'est pas en cours d'exécution" -Type Warning
    Write-ColorOutput "Tentative de démarrage de Docker Desktop..." -Type Info
    
    # Essayer de démarrer Docker Desktop
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe" -ErrorAction SilentlyContinue
    
    # Attendre que Docker démarre
    Write-ColorOutput "Attente du démarrage de Docker Desktop (max 2 minutes)..." -Type Info
    $timeout = 120
    $elapsed = 0
    while (-not (Test-DockerRunning) -and $elapsed -lt $timeout) {
        Start-Sleep -Seconds 5
        $elapsed += 5
        Write-Host "." -NoNewline
    }
    Write-Host ""
    
    if (-not (Test-DockerRunning)) {
        Write-Host ""
        Write-ColorOutput "Docker Desktop n'a pas démarré automatiquement" -Type Error
        Write-ColorOutput "Veuillez démarrer Docker Desktop manuellement et relancer ce script" -Type Warning
        Write-Host ""
        Write-Host "Appuyez sur une touche pour quitter..."
        $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
        exit 1
    }
}

# Étape 3: Déployer OnlyOffice Document Server
Write-Host ""
Write-ColorOutput "Étape 3/3: Déploiement d'OnlyOffice Document Server" -Type Info
Write-Host ""

$onlyofficeDeployed = Deploy-OnlyOfficeDocumentServer

if ($onlyofficeDeployed) {
    # Créer le fichier de configuration
    Create-ConfigFile -InstallDir $InstallDir
    
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "Configuration terminée avec succès!" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host ""
    Write-ColorOutput "NotePad-Pro est prêt à être utilisé!" -Type Success
    Write-ColorOutput "OnlyOffice Document Server: http://localhost:8000" -Type Info
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Yellow
    Write-Host "Configuration partiellement terminée" -ForegroundColor Yellow
    Write-Host "=========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-ColorOutput "OnlyOffice Document Server n'a pas pu être déployé" -Type Warning
    Write-ColorOutput "Vous pouvez relancer ce script depuis le menu démarrer" -Type Info
    Write-Host ""
}

Write-Host ""
Write-Host "Appuyez sur une touche pour fermer cette fenêtre..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
