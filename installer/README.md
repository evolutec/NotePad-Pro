# 🚀 Installateur OnlyOffice pour NotePad-Pro

Cet installateur automatise complètement le déploiement d'OnlyOffice Document Server pour votre application Electron NotePad-Pro.

## 📋 Ce que fait cet installateur

L'installateur effectue automatiquement les tâches suivantes :

1. ✅ **Vérifie et installe Docker Desktop** si nécessaire
2. ✅ **Déploie OnlyOffice Document Server** via Docker
3. ✅ **Désactive la vérification JWT** pour le développement local
4. ✅ **Configure le réseau Docker** pour accéder à `localhost:38274` (serveur de fichiers Electron)
5. ✅ **Désactive la protection SSRF** en configurant `allowPrivateIPAddress: true`
6. ✅ **Applique la configuration** `/etc/onlyoffice/documentserver/local.json`

## ⚙️ Configuration appliquée

L'installateur configure automatiquement OnlyOffice avec les paramètres optimaux pour Electron :

### 🔧 Paramètres Docker
```bash
-e JWT_ENABLED=false                          # JWT désactivé
--add-host=host.docker.internal:host-gateway  # Accès à localhost
--restart=unless-stopped                       # Redémarrage automatique
```

### 🔐 Configuration SSRF (local.json)
```json
{
  "services": {
    "CoAuthoring": {
      "request-filtering-agent": {
        "allowPrivateIPAddress": true,
        "allowMetaIPAddress": true
      }
    }
  }
}
```

Cette configuration permet à OnlyOffice d'accéder aux fichiers locaux via le serveur HTTP Electron (`localhost:38274`).

## 🎯 Utilisation

### Option 1 : Installation complète automatique (Recommandé)

Ouvrez **PowerShell en tant qu'administrateur** et exécutez :

```powershell
cd installer\scripts
.\Install-OnlyOffice.ps1
```

**Le script va :**
1. Vérifier si Docker est installé
2. Installer Docker Desktop si nécessaire
3. Démarrer Docker
4. Télécharger l'image OnlyOffice
5. Créer et configurer le conteneur
6. Appliquer la configuration SSRF

### Option 2 : Installation silencieuse

Pour une installation sans interaction utilisateur :

```powershell
.\Install-OnlyOffice.ps1 -Silent
```

### Option 3 : Forcer la réinstallation

Si OnlyOffice est déjà installé et que vous voulez le réinstaller :

```powershell
.\Install-OnlyOffice.ps1 -Force
```

### Option 4 : Installation manuelle étape par étape

#### Étape 1 : Installer Docker

```powershell
.\Install-Docker.ps1
```

#### Étape 2 : Redémarrer Windows (si nécessaire)

#### Étape 3 : Déployer OnlyOffice

```powershell
.\Deploy-OnlyOffice.ps1
```

## 📂 Structure des fichiers

```
installer/
├── scripts/
│   ├── Install-OnlyOffice.ps1    # Script principal (orchestrateur)
│   ├── Install-Docker.ps1        # Installation de Docker Desktop
│   └── Deploy-OnlyOffice.ps1     # Déploiement d'OnlyOffice
├── docker/
│   └── local.json                # Configuration SSRF pour OnlyOffice
└── README.md                     # Ce fichier
```

## ✅ Vérification de l'installation

### 1. Vérifier que Docker fonctionne

```powershell
docker ps
```

Vous devriez voir le conteneur `onlyoffice-documentserver` avec le status `Up`.

### 2. Tester l'accès web

Ouvrez votre navigateur et allez sur :
```
http://localhost
```

Vous devriez voir la page d'accueil OnlyOffice Document Server.

### 3. Vérifier la configuration SSRF

```powershell
docker exec onlyoffice-documentserver cat /etc/onlyoffice/documentserver/local.json
```

Vous devriez voir :
```json
{
  "services": {
    "CoAuthoring": {
      "request-filtering-agent": {
        "allowPrivateIPAddress": true,
        "allowMetaIPAddress": true
      }
    }
  }
}
```

### 4. Tester dans NotePad-Pro

1. Lancez votre application : `npm run electron`
2. Ouvrez un fichier Office (.docx, .xlsx, .pptx)
3. Cliquez sur **"Ouvrir avec OnlyOffice"**
4. Le document devrait s'afficher correctement

## 🔧 Gestion du conteneur OnlyOffice

### Démarrer OnlyOffice

```powershell
docker start onlyoffice-documentserver
```

### Arrêter OnlyOffice

```powershell
docker stop onlyoffice-documentserver
```

### Redémarrer OnlyOffice

```powershell
docker restart onlyoffice-documentserver
```

### Voir les logs

```powershell
docker logs onlyoffice-documentserver
```

### Voir les logs en temps réel

```powershell
docker logs -f onlyoffice-documentserver
```

### Supprimer le conteneur

```powershell
docker stop onlyoffice-documentserver
docker rm onlyoffice-documentserver
```

### Réinstaller complètement

```powershell
docker stop onlyoffice-documentserver
docker rm onlyoffice-documentserver
docker rmi onlyoffice/documentserver
.\Deploy-OnlyOffice.ps1
```

## 🛠️ Résolution des problèmes

### Problème : "Ce script nécessite des privilèges administrateur"

**Solution :** Exécutez PowerShell en tant qu'administrateur
1. Clic droit sur PowerShell
2. Sélectionnez "Exécuter en tant qu'administrateur"

### Problème : "Docker n'est pas en cours d'exécution"

**Solution :** Démarrez Docker Desktop
1. Ouvrez Docker Desktop depuis le menu Démarrer
2. Attendez que l'icône Docker devienne verte
3. Relancez le script

### Problème : "Port 80 déjà utilisé"

**Solution 1 :** Libérez le port 80
- Arrêtez IIS ou autre serveur web utilisant le port 80

**Solution 2 :** Utilisez un autre port
```powershell
# Éditez Deploy-OnlyOffice.ps1 et changez la ligne:
$port = "8080:80"  # Au lieu de "80:80"
```

Puis dans votre application, changez l'URL dans `components/onlyoffice-editor.tsx`:
```typescript
documentServerUrl="http://localhost:8080"
```

### Problème : "Le conteneur s'arrête immédiatement"

**Causes possibles :**
- Mémoire insuffisante (minimum 4GB requis)
- Problème de configuration

**Diagnostic :**
```powershell
# Voir les logs du conteneur
docker logs onlyoffice-documentserver

# Vérifier l'utilisation des ressources
docker stats
```

### Problème : "OnlyOffice ne peut pas accéder aux fichiers locaux"

**Vérifications :**

1. Le serveur de fichiers Electron fonctionne-t-il sur le port 38274 ?
2. La configuration réseau est-elle correcte ?
```powershell
docker inspect onlyoffice-documentserver | Select-String "host.docker.internal"
```

3. La configuration SSRF est-elle appliquée ?
```powershell
docker exec onlyoffice-documentserver cat /etc/onlyoffice/documentserver/local.json
```

**Solution :** Réappliquer la configuration
```powershell
.\Deploy-OnlyOffice.ps1 -Force
```

### Problème : "Cannot connect to Docker daemon"

**Causes :**
- Docker Desktop n'est pas démarré
- Docker n'est pas installé
- Services Docker défaillants

**Solution :**
1. Vérifiez que Docker Desktop est ouvert et en cours d'exécution
2. Redémarrez Docker Desktop
3. Si le problème persiste, réinstallez Docker :
```powershell
.\Install-Docker.ps1
```

## 🔒 Sécurité

### ⚠️ Configuration de développement

Cette installation est optimisée pour le **développement local** avec les paramètres suivants :

- ✅ JWT désactivé (pas de token requis)
- ✅ Protection SSRF désactivée (accès aux IPs privées)
- ✅ Accès au réseau local (localhost:38274)

### 🛡️ Pour un usage en production

Si vous déployez en production, modifiez la configuration :

1. **Activer JWT**
```powershell
docker run -e JWT_ENABLED=true -e JWT_SECRET=mon_secret_securise ...
```

2. **Configurer HTTPS**
- Utilisez un reverse proxy (nginx, traefik)
- Configurez des certificats SSL

3. **Restreindre l'accès réseau**
- Ne pas exposer le port 80 publiquement
- Utiliser un réseau Docker privé

## 📊 Configuration système requise

### Minimum
- **OS :** Windows 10/11 64-bit
- **RAM :** 4 GB (8 GB recommandé)
- **CPU :** 2 cœurs
- **Disque :** 10 GB libres
- **Virtualisation :** Activée dans le BIOS

### Recommandé
- **RAM :** 8 GB ou plus
- **CPU :** 4 cœurs ou plus
- **Disque :** 20 GB libres (SSD de préférence)

## 🚀 Démarrage automatique

Le conteneur est configuré avec `--restart=unless-stopped`, ce qui signifie :
- ✅ Démarre automatiquement avec Docker Desktop
- ✅ Redémarre automatiquement en cas de crash
- ❌ Ne démarre pas si vous l'arrêtez manuellement

Pour changer ce comportement :
```powershell
docker update --restart=always onlyoffice-documentserver  # Toujours redémarrer
docker update --restart=no onlyoffice-documentserver      # Ne jamais redémarrer
```

## 📚 Documentation supplémentaire

- [ONLYOFFICE_DOCKER_SETUP.md](../../ONLYOFFICE_DOCKER_SETUP.md) - Guide détaillé Docker
- [ONLYOFFICE_INTEGRATION.md](../../ONLYOFFICE_INTEGRATION.md) - Guide d'intégration
- [Documentation OnlyOffice officielle](https://helpcenter.onlyoffice.com/)
- [Docker Hub - OnlyOffice](https://hub.docker.com/r/onlyoffice/documentserver)

## 🆘 Support

En cas de problème :

1. **Vérifiez les logs**
   ```powershell
   docker logs onlyoffice-documentserver
   ```

2. **Vérifiez l'état du conteneur**
   ```powershell
   docker ps -a
   docker inspect onlyoffice-documentserver
   ```

3. **Testez la connectivité**
   ```powershell
   Test-NetConnection -ComputerName localhost -Port 80
   ```

4. **Consultez la documentation**
   - README de l'installateur (ce fichier)
   - ONLYOFFICE_DOCKER_SETUP.md
   - ONLYOFFICE_INTEGRATION.md

## ✨ Fonctionnalités

- ✅ Installation automatisée complète
- ✅ Détection de Docker existant
- ✅ Installation de Docker si nécessaire
- ✅ Configuration optimale pour Electron
- ✅ Désactivation JWT (développement)
- ✅ Configuration réseau pour localhost:38274
- ✅ Désactivation protection SSRF
- ✅ Redémarrage automatique du conteneur
- ✅ Scripts de gestion inclus
- ✅ Vérifications et diagnostics
- ✅ Mode silencieux disponible

## 🎉 Vous êtes prêt !

Après l'installation, OnlyOffice Document Server est entièrement configuré et prêt à l'emploi avec votre application NotePad-Pro.

**Pour commencer :**
1. Lancez votre application : `npm run electron`
2. Ouvrez un document Office
3. Profitez de l'édition OnlyOffice intégrée !

---

**Version :** 1.0  
**Date :** Novembre 2024  
**Auteur :** NotePad-Pro Team
