# ======================================================================
# Script d'installation de Docker Desktop pour Windows
# ======================================================================
# Ce script vérifie si Docker est installé et l'installe si nécessaire
# Compatible avec l'application Electron NotePad-Pro
# ======================================================================

param(
    [switch]$Silent = $false
)

# Activer les couleurs dans la console
$Host.UI.RawUI.ForegroundColor = "White"

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

function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Test-DockerInstalled {
    try {
        $dockerPath = Get-Command docker -ErrorAction SilentlyContinue
        if ($dockerPath) {
            $version = docker --version 2>&1
            if ($version -match "Docker version") {
                Write-ColorOutput "✓ Docker est déjà installé : $version" "Green"
                return $true
            }
        }
    } catch {
        # Docker n'est pas installé
    }
    return $false
}

function Test-DockerDesktopInstalled {
    $dockerDesktopPath = "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerDesktopPath) {
        Write-ColorOutput "✓ Docker Desktop est installé" "Green"
        return $true
    }
    return $false
}

function Test-DockerRunning {
    try {
        $result = docker ps 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✓ Docker est en cours d'exécution" "Green"
            return $true
        }
    } catch {
        # Docker ne fonctionne pas
    }
    
    Write-ColorOutput "⚠ Docker n'est pas en cours d'exécution" "Yellow"
    return $false
}

function Start-DockerDesktop {
    Write-ColorOutput "Démarrage de Docker Desktop..." "Yellow"
    
    $dockerDesktopPath = "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe"
    
    if (Test-Path $dockerDesktopPath) {
        Start-Process $dockerDesktopPath
        
        Write-ColorOutput "Attente du démarrage de Docker (cela peut prendre 1-2 minutes)..." "Yellow"
        
        $maxAttempts = 60
        $attempt = 0
        
        while ($attempt -lt $maxAttempts) {
            Start-Sleep -Seconds 5
            $attempt++
            
            try {
                $result = docker ps 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-ColorOutput "✓ Docker est maintenant en cours d'exécution" "Green"
                    return $true
                }
            } catch {
                # Continue d'attendre
            }
            
            Write-Host "." -NoNewline
        }
        
        Write-ColorOutput "`n✗ Docker n'a pas démarré dans le délai imparti" "Red"
        return $false
    }
    
    Write-ColorOutput "✗ Docker Desktop n'est pas installé" "Red"
    return $false
}

function Install-DockerDesktop {
    Write-Section "Installation de Docker Desktop"
    
    $installerUrl = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
    $installerPath = "$env:TEMP\DockerDesktopInstaller.exe"
    
    Write-ColorOutput "Téléchargement de Docker Desktop..." "Yellow"
    Write-ColorOutput "URL: $installerUrl" "Gray"
    
    try {
        # Téléchargement avec barre de progression
        $ProgressPreference = 'SilentlyContinue'
        Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing
        $ProgressPreference = 'Continue'
        
        if (Test-Path $installerPath) {
            $fileSize = (Get-Item $installerPath).Length / 1MB
            Write-ColorOutput "✓ Téléchargement réussi ($([math]::Round($fileSize, 2)) MB)" "Green"
        } else {
            throw "Le fichier n'a pas été téléchargé"
        }
    } catch {
        Write-ColorOutput "✗ Erreur lors du téléchargement : $_" "Red"
        return $false
    }
    
    Write-ColorOutput "`nInstallation de Docker Desktop..." "Yellow"
    Write-ColorOutput "Cela peut prendre plusieurs minutes..." "Gray"
    
    try {
        # Installation silencieuse
        $installArgs = "install --quiet --accept-license"
        if ($Silent) {
            $installArgs += " --backend=wsl-2"
        }
        
        $process = Start-Process -FilePath $installerPath -ArgumentList $installArgs -Wait -PassThru
        
        if ($process.ExitCode -eq 0) {
            Write-ColorOutput "✓ Docker Desktop a été installé avec succès" "Green"
            
            # Nettoyage
            Remove-Item $installerPath -Force -ErrorAction SilentlyContinue
            
            Write-ColorOutput "`n⚠ IMPORTANT : Vous devez REDÉMARRER WINDOWS pour que Docker fonctionne correctement" "Yellow"
            
            if (-not $Silent) {
                $restart = Read-Host "Voulez-vous redémarrer maintenant? (O/N)"
                if ($restart -eq "O" -or $restart -eq "o") {
                    Write-ColorOutput "Redémarrage du système..." "Yellow"
                    Restart-Computer -Force
                } else {
                    Write-ColorOutput "Veuillez redémarrer manuellement avant d'utiliser Docker" "Yellow"
                }
            }
            
            return $true
        } else {
            Write-ColorOutput "✗ L'installation a échoué avec le code : $($process.ExitCode)" "Red"
            return $false
        }
    } catch {
        Write-ColorOutput "✗ Erreur lors de l'installation : $_" "Red"
        return $false
    }
}

function Test-WSL2 {
    try {
        $wslVersion = wsl --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✓ WSL2 est installé" "Green"
            return $true
        }
    } catch {
        # WSL2 n'est pas installé
    }
    
    Write-ColorOutput "⚠ WSL2 n'est pas installé (recommandé pour Docker)" "Yellow"
    return $false
}

function Enable-WSL2 {
    Write-Section "Configuration de WSL2"
    
    Write-ColorOutput "Activation de WSL2..." "Yellow"
    
    try {
        # Activer WSL
        dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
        
        # Activer Virtual Machine Platform
        dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
        
        Write-ColorOutput "✓ WSL2 a été activé" "Green"
        Write-ColorOutput "⚠ Un redémarrage est nécessaire pour terminer l'installation" "Yellow"
        
        return $true
    } catch {
        Write-ColorOutput "✗ Erreur lors de l'activation de WSL2 : $_" "Red"
        return $false
    }
}

# ======================================================================
# PROGRAMME PRINCIPAL
# ======================================================================

Write-Section "🐳 Installation de Docker Desktop pour NotePad-Pro"

# Vérifier les privilèges administrateur
if (-not (Test-Administrator)) {
    Write-ColorOutput "✗ Ce script nécessite des privilèges administrateur" "Red"
    Write-ColorOutput "Veuillez exécuter PowerShell en tant qu'administrateur" "Yellow"
    exit 1
}

# Vérifier si Docker est déjà installé et fonctionne
if (Test-DockerInstalled) {
    if (Test-DockerRunning) {
        Write-ColorOutput "`n✓ Docker est déjà installé et fonctionne correctement" "Green"
        Write-ColorOutput "Aucune action nécessaire" "Green"
        exit 0
    } else {
        # Docker est installé mais ne fonctionne pas
        if (Test-DockerDesktopInstalled) {
            Write-ColorOutput "`nDocker Desktop est installé mais ne fonctionne pas" "Yellow"
            $start = Start-DockerDesktop
            
            if ($start) {
                Write-ColorOutput "`n✓ Docker est maintenant prêt à l'emploi" "Green"
                exit 0
            } else {
                Write-ColorOutput "`n✗ Impossible de démarrer Docker Desktop" "Red"
                Write-ColorOutput "Veuillez le démarrer manuellement ou réinstaller" "Yellow"
                exit 1
            }
        }
    }
}

# Docker n'est pas installé - procéder à l'installation
Write-ColorOutput "`nDocker n'est pas installé sur cette machine" "Yellow"

# Vérifier WSL2
if (-not (Test-WSL2)) {
    Write-ColorOutput "`nWSL2 n'est pas installé. Docker Desktop le nécessite." "Yellow"
    
    if (-not $Silent) {
        $install = Read-Host "Voulez-vous installer WSL2 maintenant? (O/N)"
        if ($install -eq "O" -or $install -eq "o") {
            Enable-WSL2
            Write-ColorOutput "`n⚠ Veuillez redémarrer Windows, puis relancer ce script" "Yellow"
            exit 0
        } else {
            Write-ColorOutput "Installation de WSL2 annulée" "Yellow"
            Write-ColorOutput "⚠ Docker Desktop nécessite WSL2 pour fonctionner" "Red"
            exit 1
        }
    } else {
        Enable-WSL2
        Write-ColorOutput "`n⚠ Veuillez redémarrer Windows, puis relancer ce script" "Yellow"
        exit 0
    }
}

# Installer Docker Desktop
$installed = Install-DockerDesktop

if ($installed) {
    Write-Section "✓ Installation terminée avec succès"
    Write-ColorOutput "Docker Desktop a été installé" "Green"
    Write-ColorOutput "Après le redémarrage, vous pourrez déployer OnlyOffice Document Server" "Green"
    exit 0
} else {
    Write-Section "✗ L'installation a échoué"
    Write-ColorOutput "Veuillez installer Docker Desktop manuellement depuis:" "Yellow"
    Write-ColorOutput "https://www.docker.com/products/docker-desktop" "Cyan"
    exit 1
}
