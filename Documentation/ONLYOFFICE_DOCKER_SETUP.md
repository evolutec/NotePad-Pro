# 🚀 Installation OnlyOffice Document Server avec Docker

## 📋 Prérequis

### 1. Installer Docker Desktop pour Windows
- **Télécharger** : https://www.docker.com/products/docker-desktop
- **Installer** : Suivre l'assistant d'installation
- **Redémarrer** : Redémarrer Windows si demandé
- **Vérifier** : Ouvrir Docker Desktop et attendre qu'il soit prêt

### 2. Vérifier l'installation
```powershell
docker --version
# Devrait afficher : Docker version XX.XX.X
```

---

## 🐳 Installation OnlyOffice Document Server

### Option 1 : Installation simple (Recommandée)

```powershell
# Lancer OnlyOffice Document Server (JWT désactivé pour développement local)
docker run -i -t -d -p 80:80 -e JWT_ENABLED=false --add-host=host.docker.internal:host-gateway --name onlyoffice-documentserver onlyoffice/documentserver
```

**Explications** :
- `-i -t` : Mode interactif
- `-d` : Détaché (en arrière-plan)
- `-p 80:80` : Expose le port 80
- `-e JWT_ENABLED=false` : **IMPORTANT** - Désactive la vérification JWT pour le développement
- `--add-host=host.docker.internal:host-gateway` : **CRUCIAL** - Permet au conteneur d'accéder au serveur de fichiers Electron (localhost:38274) sur Windows
- `--name onlyoffice-documentserver` : Nom du conteneur
- `onlyoffice/documentserver` : Image officielle

⚠️ **Important** : Les flags `-e JWT_ENABLED=false` et `--add-host=host.docker.internal:host-gateway` sont **essentiels** pour :
- Éviter l'erreur "jeton de sécurité mal formé"
- Permettre au Document Server d'accéder aux fichiers locaux via le serveur HTTP Electron

### Option 2 : Installation avec persistance des données

```powershell
# Créer des dossiers pour la persistance
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\onlyoffice\DocumentServer\logs"
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\onlyoffice\DocumentServer\data"
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\onlyoffice\DocumentServer\lib"

# Lancer avec volumes montés
docker run -i -t -d -p 80:80 -e JWT_ENABLED=false --add-host=host.docker.internal:host-gateway --restart=always `
  --name onlyoffice-documentserver `
  -v "$env:USERPROFILE\onlyoffice\DocumentServer\logs:/var/log/onlyoffice" `
  -v "$env:USERPROFILE\onlyoffice\DocumentServer\data:/var/www/onlyoffice/Data" `
  -v "$env:USERPROFILE\onlyoffice\DocumentServer\lib:/var/lib/onlyoffice" `
  onlyoffice/documentserver
```

⚠️ **Note** : `-e JWT_ENABLED=false` et `--add-host=host.docker.internal:host-gateway` sont ajoutés pour le développement local.

---

## ✅ Vérification de l'installation

### 1. Vérifier que le conteneur est en cours d'exécution
```powershell
docker ps
# Devrait afficher le conteneur onlyoffice-documentserver avec STATUS "Up"
```

### 2. Tester l'accès au serveur
Ouvrir dans votre navigateur : **http://localhost**

Vous devriez voir la page d'accueil OnlyOffice Document Server.

### 3. Vérifier les logs
```powershell
docker logs onlyoffice-documentserver
```

---

## 🔧 Configuration de l'application

### Étape 1 : L'URL est déjà configurée
Dans `components/onlyoffice-viewer.tsx`, l'URL est configurée sur :
```typescript
documentServerUrl="http://localhost"
```

✅ **Aucune modification nécessaire !**

### Étape 2 : Serveur de fichiers local
Votre application Electron a déjà un serveur de fichiers qui écoute sur :
```
http://localhost:38274
```

### Étape 3 : Configuration CORS pour OnlyOffice

OnlyOffice doit pouvoir accéder aux fichiers via HTTP. Ajoutez cette configuration dans `electron-main.js` si ce n'est pas déjà fait :

```javascript
// Le serveur de fichiers existe déjà sur le port 38274
// Il sert les fichiers locaux via HTTP
```

---

## 🎯 Tester l'intégration

### 1. Démarrer Docker Desktop
- Ouvrir Docker Desktop
- Attendre que le conteneur `onlyoffice-documentserver` soit "Running"

### 2. Lancer l'application
```powershell
npm run electron
```

### 3. Ouvrir un document Office
- Ouvrir un fichier .docx, .xlsx ou .pptx
- Cliquer sur **"Ouvrir avec OnlyOffice"**
- Le document devrait s'afficher dans OnlyOffice

---

## 🛠️ Commandes Docker utiles

### Démarrer le conteneur
```powershell
docker start onlyoffice-documentserver
```

### Arrêter le conteneur
```powershell
docker stop onlyoffice-documentserver
```

### Redémarrer le conteneur
```powershell
docker restart onlyoffice-documentserver
```

### Voir les logs
```powershell
docker logs onlyoffice-documentserver
docker logs -f onlyoffice-documentserver  # Mode suivi en temps réel
```

### Supprimer le conteneur (si besoin de réinstaller)
```powershell
docker stop onlyoffice-documentserver
docker rm onlyoffice-documentserver
```

### Mettre à jour OnlyOffice
```powershell
# Arrêter et supprimer l'ancien conteneur
docker stop onlyoffice-documentserver
docker rm onlyoffice-documentserver

# Télécharger la dernière version
docker pull onlyoffice/documentserver

# Relancer avec la nouvelle version
docker run -i -t -d -p 80:80 --name onlyoffice-documentserver onlyoffice/documentserver
```

---

## ⚠️ Résolution des problèmes

### Problème : "Port 80 déjà utilisé"

**Solution 1** : Utiliser un autre port
```powershell
docker run -i -t -d -p 8080:80 --name onlyoffice-documentserver onlyoffice/documentserver
```
Puis modifier dans `onlyoffice-viewer.tsx` :
```typescript
documentServerUrl="http://localhost:8080"
```

**Solution 2** : Libérer le port 80
- Vérifier quel programme utilise le port 80
- Arrêter IIS ou autre serveur web qui occupe le port

### Problème : "Cannot connect to Docker daemon"

**Solution** :
1. Ouvrir Docker Desktop
2. Attendre qu'il soit complètement démarré
3. Réessayer la commande

### Problème : "Document ne se charge pas"

**Vérifications** :
1. Docker est-il en cours d'exécution ?
   ```powershell
   docker ps
   ```

2. OnlyOffice est-il accessible ?
   - Ouvrir http://localhost dans le navigateur

3. Le fichier est-il accessible via HTTP ?
   - Vérifier que le serveur de fichiers Electron fonctionne (port 38274)

4. Vérifier les logs OnlyOffice
   ```powershell
   docker logs onlyoffice-documentserver
   ```

### Problème : "ERR_NAME_NOT_RESOLVED"

**Cause** : L'URL du Document Server est incorrecte

**Solution** : Vérifier dans `onlyoffice-viewer.tsx` :
```typescript
documentServerUrl="http://localhost" // Doit être exactement ça
```

---

## 📊 Ressources système requises

### Minimum
- **RAM** : 4 GB
- **CPU** : 2 cœurs
- **Disque** : 10 GB

### Recommandé
- **RAM** : 8 GB ou plus
- **CPU** : 4 cœurs ou plus
- **Disque** : 20 GB

---

## 🔒 Sécurité

### Configuration de production

Pour un usage en production, configurez :

1. **JWT Secret** (authentification)
```powershell
docker run -i -t -d -p 80:80 `
  -e JWT_ENABLED=true `
  -e JWT_SECRET=my_jwt_secret `
  --name onlyoffice-documentserver `
  onlyoffice/documentserver
```

2. **HTTPS** (recommandé pour production)
- Configurer un certificat SSL
- Utiliser un reverse proxy (nginx, traefik)

---

## 📚 Documentation officielle

- **Docker Hub** : https://hub.docker.com/r/onlyoffice/documentserver
- **Documentation** : https://helpcenter.onlyoffice.com/installation/docs-docker-install.aspx
- **GitHub** : https://github.com/ONLYOFFICE/Docker-DocumentServer
- **Forum** : https://forum.onlyoffice.com/

---

## ✨ Alternative : OnlyOffice Desktop

Si Docker n'est pas souhaité, vous pouvez installer **OnlyOffice Desktop** :
- Télécharger : https://www.onlyoffice.com/desktop.aspx
- C'est une application de bureau pour éditer les documents
- Ne nécessite pas de serveur
- Mais ne s'intègre pas dans votre application

**Note** : Pour l'intégration web dans votre app, Docker est la meilleure solution.
