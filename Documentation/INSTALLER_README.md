# 📦 Installation Rapide - NotePad-Pro

## Pour les utilisateurs

### Télécharger et installer

1. **Téléchargez l'installateur** : `NotePad-Pro-Setup-1.0.0.exe`
2. **Double-cliquez** sur l'installateur
3. **Suivez l'assistant** d'installation
4. **Configurez Docker et OnlyOffice** (automatique ou assisté)
5. **Lancez l'application** depuis le bureau ou le menu Démarrer

✅ **C'est tout !** L'application est prête à l'emploi avec toutes les fonctionnalités OnlyOffice.

---

## Pour les développeurs

### Créer l'installateur

```powershell
# 1. Installer les dépendances
npm install

# 2. Créer l'installateur
npm run electron:build

# 3. L'installateur est créé dans dist/
# NotePad-Pro-Setup-1.0.0.exe
```

### Documentation complète

📖 Voir [BUILD_GUIDE.md](BUILD_GUIDE.md) pour :
- Instructions de build détaillées
- Configuration de l'installateur
- Signature de code
- Distribution
- Dépannage

---

## Ce que fait l'installateur

L'installateur automatise complètement :

1. ✅ **Installation de NotePad-Pro**
2. ✅ **Vérification et installation de Docker Desktop**
3. ✅ **Déploiement d'OnlyOffice Document Server**
4. ✅ **Configuration optimale pour Electron**
   - JWT désactivé
   - Accès localhost:38274
   - Protection SSRF désactivée
5. ✅ **Création des raccourcis intelligents**
6. ✅ **Lancement automatique**

## Support

- 📖 [BUILD_GUIDE.md](BUILD_GUIDE.md) - Guide complet de build
- 📖 [installer/README.md](installer/README.md) - Documentation des scripts
- 📖 [ONLYOFFICE_DOCKER_SETUP.md](ONLYOFFICE_DOCKER_SETUP.md) - Configuration OnlyOffice

---

**Version :** 1.0.0  
**Plateforme :** Windows 10/11 (x64)
