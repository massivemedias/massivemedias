# Guide : Gérer les photos et textes du Portfolio

## 📁 Où sont les photos ?

Les photos sont dans : `frontend/public/images/`

```
frontend/public/images/
├── prints/         (26 photos - Impressions Fine Art)
├── stickers/       (12 photos - Stickers)
├── textile/        (24 photos - Sublimation textile)
└── locale/         (14 photos - Photos du studio)
```

### Pour supprimer une photo :

1. **Supprimer le fichier physique** dans `frontend/public/images/[categorie]/`
2. **Supprimer l'entrée** dans `frontend/src/pages/Portfolio.jsx` (lignes 8-89)
3. **Exemple** : pour supprimer `Prints5.jpeg`
   ```javascript
   // SUPPRIMER cette ligne dans Portfolio.jsx :
   { path: '/images/prints/Prints5.jpeg', titleKey: 'fineArtPaper', category: 'prints' },
   ```

## ✏️ Corriger les textes au survol

Les textes sont dans `frontend/src/pages/Portfolio.jsx` lignes **92-157**

### Structure :
```javascript
const projectTitles = {
  fr: {
    // Clé utilisée dans le code : 'Texte affiché'
    customHoodie: 'Hoodie personnalisé',
    customMug: 'Tasse sublimation',
    // ... etc
  },
  en: {
    customHoodie: 'Custom Hoodie',
    customMug: 'Sublimation Mug',
    // ... etc
  },
};
```

### Exemple de correction :

Si un **hoodie** (Textile2.jpeg) affiche "Sublimation sur tasse" au lieu de "Hoodie personnalisé" :

1. Trouve la ligne pour `Textile2.jpeg` (ligne ~51) :
   ```javascript
   { path: '/images/textile/Textile2.jpeg', titleKey: 'customHoodie', category: 'textile' },
   ```

2. Trouve la clé `customHoodie` dans `projectTitles` (lignes 92-157) et modifie le texte :
   ```javascript
   // Français
   customHoodie: 'Hoodie personnalisé sublimation',
   
   // Anglais
   customHoodie: 'Custom Sublimation Hoodie',
   ```

## 🔄 Processus complet

### 1. Supprimer des photos
```bash
# Supprimer la photo
rm frontend/public/images/prints/Prints5.jpeg

# Supprimer aussi le thumb
rm frontend/public/images/thumbs/prints/Prints5.webp

# Supprimer l'entrée dans Portfolio.jsx (ligne correspondante)
```

### 2. Corriger les textes
- Ouvrir `frontend/src/pages/Portfolio.jsx`
- Aller aux lignes 92-157 (objet `projectTitles`)
- Modifier le texte français ET anglais pour la clé concernée

### 3. Rebuild et redeploy
```bash
cd frontend
npm run build

# Puis deploy comme d'habitude
```

## 📝 Liste des clés actuelles par catégorie

### Prints (Impressions)
- `fineArtPrint`, `photoGraphicPoster`, `galleryPrint`, `artisticPoster`, etc.

### Stickers
- `holoStickers`, `customDieCut`, `matteVinyl`, `labelStickers`, etc.

### Textile (Sublimation)
- `subTshirt` → T-shirt sublimation
- `customHoodie` → Hoodie personnalisé
- `customMug` → Tasse sublimation
- `subTumbler` → Tumbler sublimation
- `mousepad` → Tapis de souris
- `subKeychain` → Porte-clés sublimation
- etc.

### Locale (Studio)
- `workspace`, `productionStudio`, `versatileSpace`, etc.

## 🎯 Améliorations du Lightbox

Le lightbox a maintenant :
- ✅ Navigation avec flèches (précédent/suivant)
- ✅ Images toujours centrées et bien dimensionnées
- ✅ Compteur (ex: "3 / 24")
- ✅ Responsive mobile et desktop
- ✅ Bouton fermer (X) en haut à droite
- ✅ Animation fluide entre les photos

### Raccourcis clavier (à venir si besoin)
- Flèche gauche/droite : naviguer
- Escape : fermer
