# ======================================================================
# Script de déploiement OnlyOffice Document Server
# ======================================================================
# Ce script déploie OnlyOffice avec toutes les configurations requises:
# - JWT désactivé pour le développement
# - Configuration réseau pour accéder à localhost:38274
# - Désactivation de la protection SSRF pour les adresses IP privées
# ======================================================================

param(
    [switch]$Force = $false,
    [switch]$Verbose = $false
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

function Test-DockerRunning {
    try {
        $result = docker ps 2>&1
        if ($LASTEXITCODE -eq 0) {
            return $true
        }
    } catch {
        return $false
    }
    return $false
}

function Test-OnlyOfficeRunning {
    try {
        $result = docker ps --filter "name=onlyoffice-documentserver" --format "{{.Status}}" 2>&1
        if ($result -match "Up") {
            Write-ColorOutput "✓ OnlyOffice Document Server est déjà en cours d'exécution" "Green"
            return $true
        }
    } catch {
        return $false
    }
    return $false
}

function Test-OnlyOfficeExists {
    try {
        $result = docker ps -a --filter "name=onlyoffice-documentserver" --format "{{.Names}}" 2>&1
        if ($result -eq "onlyoffice-documentserver") {
            return $true
        }
    } catch {
        return $false
    }
    return $false
}

function Remove-OnlyOfficeContainer {
    Write-ColorOutput "Suppression du conteneur existant..." "Yellow"
    
    try {
        # Arrêter le conteneur s'il est en cours d'exécution
        docker stop onlyoffice-documentserver 2>&1 | Out-Null
        Start-Sleep -Seconds 2
        
        # Supprimer le conteneur
        docker rm onlyoffice-documentserver 2>&1 | Out-Null
        
        Write-ColorOutput "✓ Conteneur supprimé" "Green"
        return $true
    } catch {
        Write-ColorOutput "⚠ Erreur lors de la suppression : $_" "Yellow"
        return $false
    }
}

function Pull-OnlyOfficeImage {
    Write-Section "📥 Téléchargement de l'image OnlyOffice"
    
    Write-ColorOutput "Téléchargement de onlyoffice/documentserver..." "Yellow"
    Write-ColorOutput "Cela peut prendre plusieurs minutes selon votre connexion..." "Gray"
    
    try {
        $output = docker pull onlyoffice/documentserver 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✓ Image téléchargée avec succès" "Green"
            return $true
        } else {
            Write-ColorOutput "✗ Erreur lors du téléchargement" "Red"
            Write-ColorOutput $output "Red"
            return $false
        }
    } catch {
        Write-ColorOutput "✗ Erreur : $_" "Red"
        return $false
    }
}

function Deploy-OnlyOffice {
    Write-Section "🚀 Déploiement d'OnlyOffice Document Server"
    
    # Paramètres de configuration
    $containerName = "onlyoffice-documentserver"
    $port = "80:80"
    $jwtEnabled = "false"
    
    Write-ColorOutput "Configuration:" "Cyan"
    Write-ColorOutput "  - Nom du conteneur: $containerName" "Gray"
    Write-ColorOutput "  - Port: $port" "Gray"
    Write-ColorOutput "  - JWT: Désactivé (développement)" "Gray"
    Write-ColorOutput "  - Accès localhost: Activé (host.docker.internal)" "Gray"
    Write-ColorOutput "  - Protection SSRF: Désactivée (allowPrivateIPAddress)" "Gray"
    Write-Host ""
    
    Write-ColorOutput "Lancement du conteneur OnlyOffice..." "Yellow"
    
    try {
        # Commande Docker complète
        $dockerCmd = "docker run -i -t -d " +
                     "-p $port " +
                     "-e JWT_ENABLED=$jwtEnabled " +
                     "--add-host=host.docker.internal:host-gateway " +
                     "--name $containerName " +
                     "--restart=unless-stopped " +
                     "onlyoffice/documentserver"
        
        if ($Verbose) {
            Write-ColorOutput "Commande: $dockerCmd" "Gray"
        }
        
        $containerId = Invoke-Expression $dockerCmd 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✓ Conteneur créé avec succès" "Green"
            Write-ColorOutput "ID du conteneur: $($containerId.Substring(0, 12))" "Gray"
            return $containerId
        } else {
            Write-ColorOutput "✗ Erreur lors du lancement" "Red"
            Write-ColorOutput $containerId "Red"
            return $null
        }
    } catch {
        Write-ColorOutput "✗ Erreur : $_" "Red"
        return $null
    }
}

function Wait-OnlyOfficeReady {
    param([string]$ContainerId)
    
    Write-Section "⏳ Attente du démarrage d'OnlyOffice"
    
    Write-ColorOutput "OnlyOffice démarre (cela prend 30-60 secondes)..." "Yellow"
    
    $maxAttempts = 60
    $attempt = 0
    
    while ($attempt -lt $maxAttempts) {
        Start-Sleep -Seconds 5
        $attempt++
        
        try {
            # Vérifier si le conteneur est toujours en cours d'exécution
            $status = docker inspect -f "{{.State.Running}}" $ContainerId 2>&1
            
            if ($status -ne "true") {
                Write-ColorOutput "`n✗ Le conteneur s'est arrêté" "Red"
                Write-ColorOutput "Logs:" "Yellow"
                docker logs $ContainerId
                return $false
            }
            
            # Vérifier si OnlyOffice répond
            try {
                $response = Invoke-WebRequest -Uri "http://localhost/healthcheck" -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
                if ($response.StatusCode -eq 200) {
                    Write-ColorOutput "`n✓ OnlyOffice Document Server est prêt!" "Green"
                    return $true
                }
            } catch {
                # Continuer d'attendre
            }
            
            Write-Host "." -NoNewline
        } catch {
            Write-Host "." -NoNewline
        }
    }
    
    Write-ColorOutput "`n⚠ OnlyOffice met du temps à démarrer" "Yellow"
    Write-ColorOutput "Le conteneur continue de démarrer en arrière-plan" "Yellow"
    return $true
}

function Configure-OnlyOfficeSSRF {
    param([string]$ContainerId)
    
    Write-Section "🔧 Configuration de la protection SSRF"
    
    Write-ColorOutput "Désactivation de la protection SSRF pour les adresses IP privées..." "Yellow"
    
    # Chemin du fichier de configuration dans le conteneur
    $configPath = "/etc/onlyoffice/documentserver/local.json"
    
    # Obtenir le chemin du fichier local.json
    $scriptDir = Split-Path -Parent $PSCommandPath
    $localConfigPath = Join-Path (Split-Path -Parent $scriptDir) "docker\local.json"
    
    if (-not (Test-Path $localConfigPath)) {
        Write-ColorOutput "✗ Fichier local.json introuvable: $localConfigPath" "Red"
        return $false
    }
    
    Write-ColorOutput "Copie de la configuration personnalisée..." "Yellow"
    
    try {
        # Copier le fichier de configuration dans le conteneur
        docker cp $localConfigPath "${ContainerId}:$configPath" 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✓ Configuration copiée" "Green"
            
            # Redémarrer les services OnlyOffice pour appliquer la configuration
            Write-ColorOutput "Redémarrage des services OnlyOffice..." "Yellow"
            
            docker exec $ContainerId supervisorctl restart all 2>&1 | Out-Null
            
            Start-Sleep -Seconds 10
            
            Write-ColorOutput "✓ Configuration SSRF appliquée" "Green"
            Write-ColorOutput "  - allowPrivateIPAddress: true" "Gray"
            Write-ColorOutput "  - allowMetaIPAddress: true" "Gray"
            
            return $true
        } else {
            Write-ColorOutput "✗ Erreur lors de la copie de la configuration" "Red"
            return $false
        }
    } catch {
        Write-ColorOutput "✗ Erreur : $_" "Red"
        return $false
    }
}

function Test-OnlyOfficeAccess {
    Write-Section "✅ Vérification de l'accès"
    
    Write-ColorOutput "Test de l'accès à OnlyOffice Document Server..." "Yellow"
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost" -TimeoutSec 10 -UseBasicParsing
        
        if ($response.StatusCode -eq 200) {
            Write-ColorOutput "✓ OnlyOffice est accessible sur http://localhost" "Green"
            return $true
        }
    } catch {
        Write-ColorOutput "⚠ OnlyOffice n'est pas encore accessible" "Yellow"
        Write-ColorOutput "Attendez quelques secondes et testez manuellement" "Yellow"
        return $false
    }
}

function Show-Summary {
    Write-Section "📊 Résumé de l'installation"
    
    Write-ColorOutput "OnlyOffice Document Server a été déployé avec succès!" "Green"
    Write-Host ""
    Write-ColorOutput "📍 Configuration:" "Cyan"
    Write-ColorOutput "  • URL: http://localhost" "White"
    Write-ColorOutput "  • JWT: Désactivé (développement)" "White"
    Write-ColorOutput "  • Accès localhost:38274: Activé" "White"
    Write-ColorOutput "  • Protection SSRF: Désactivée" "White"
    Write-Host ""
    Write-ColorOutput "🔧 Commandes utiles:" "Cyan"
    Write-ColorOutput "  • Démarrer:   docker start onlyoffice-documentserver" "White"
    Write-ColorOutput "  • Arrêter:    docker stop onlyoffice-documentserver" "White"
    Write-ColorOutput "  • Logs:       docker logs onlyoffice-documentserver" "White"
    Write-ColorOutput "  • Redémarrer: docker restart onlyoffice-documentserver" "White"
    Write-Host ""
    Write-ColorOutput "🌐 Testez l'accès:" "Cyan"
    Write-ColorOutput "  Ouvrez http://localhost dans votre navigateur" "White"
    Write-Host ""
    Write-ColorOutput "✅ Vous pouvez maintenant utiliser OnlyOffice dans NotePad-Pro!" "Green"
    Write-Host ""
}

# ======================================================================
# PROGRAMME PRINCIPAL
# ======================================================================

Write-Section "🐳 Déploiement d'OnlyOffice Document Server"

# Vérifier que Docker est en cours d'exécution
if (-not (Test-DockerRunning)) {
    Write-ColorOutput "✗ Docker n'est pas en cours d'exécution" "Red"
    Write-ColorOutput "Veuillez démarrer Docker Desktop et réessayer" "Yellow"
    exit 1
}

Write-ColorOutput "✓ Docker est en cours d'exécution" "Green"

# Vérifier si OnlyOffice est déjà en cours d'exécution
if (Test-OnlyOfficeRunning) {
    if (-not $Force) {
        Write-ColorOutput "`nOnlyOffice est déjà en cours d'exécution" "Yellow"
        $recreate = Read-Host "Voulez-vous recréer le conteneur? (O/N)"
        
        if ($recreate -ne "O" -and $recreate -ne "o") {
            Write-ColorOutput "Installation annulée" "Yellow"
            exit 0
        }
        
        $Force = $true
    }
}

# Supprimer le conteneur existant si nécessaire
if ($Force -and (Test-OnlyOfficeExists)) {
    Remove-OnlyOfficeContainer
}

# Télécharger l'image OnlyOffice
$pulled = Pull-OnlyOfficeImage

if (-not $pulled) {
    Write-ColorOutput "`n✗ Impossible de télécharger l'image OnlyOffice" "Red"
    exit 1
}

# Déployer OnlyOffice
$containerId = Deploy-OnlyOffice

if (-not $containerId) {
    Write-ColorOutput "`n✗ Le déploiement a échoué" "Red"
    exit 1
}

# Attendre que OnlyOffice soit prêt
$ready = Wait-OnlyOfficeReady -ContainerId $containerId

if (-not $ready) {
    Write-ColorOutput "`n✗ OnlyOffice n'a pas démarré correctement" "Red"
    Write-ColorOutput "Vérifiez les logs: docker logs onlyoffice-documentserver" "Yellow"
    exit 1
}

# Configurer la protection SSRF
$configured = Configure-OnlyOfficeSSRF -ContainerId $containerId

if (-not $configured) {
    Write-ColorOutput "`n⚠ La configuration SSRF a échoué" "Yellow"
    Write-ColorOutput "OnlyOffice fonctionne mais peut bloquer les adresses IP privées" "Yellow"
}

# Vérifier l'accès
Test-OnlyOfficeAccess | Out-Null

# Afficher le résumé
Show-Summary

exit 0
