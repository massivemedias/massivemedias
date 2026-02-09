# MASSIVE MEDIAS — GUIDE RAPIDE

## 🚀 ACCÉDER AU SITE

### Frontend (ce que tu vois)
```
http://localhost:3001
```

### Backend Strapi (pour gérer le contenu)
```
http://localhost:1337/admin
```
> À la première visite, crée ton compte administrateur

---

## 📁 STRUCTURE DU PROJET

```
massivemedias/
├── backend/          # API Strapi (gestion de contenu)
├── frontend/         # Site React (ce que les visiteurs voient)
└── _old/            # Ancien site (sauvegarde, non déployé)
```

---

## ✅ CE QUI EST FAIT ET FONCTIONNEL

### Pages créées et accessibles:
- **Accueil** (`http://localhost:3001/`) 
  - Hero avec logo MASSIVE
  - 6 services en cartes
  - Compteurs animés
  - 6 avantages
  - CTA de contact

- **Services** (`/services`)
  - Liste complète des 6 services

- **Contact** (`/contact`)
  - Formulaire complet avec tous les champs
  - Coordonnées et réseaux sociaux

- **À propos** (`/a-propos`)
  - Histoire de Massive Medias
  - Équipe (Mika + Christopher)
  - Équipement
  - Univers Massive

### Design
- ✅ Palette de couleurs Massive Medias (noir, violet, magenta)
- ✅ Logo intégré
- ✅ Typographie Space Grotesk + Inter
- ✅ Animations Framer Motion
- ✅ Navigation responsive avec dropdown
- ✅ Footer complet
- ✅ Effets de glow magenta
- ✅ Scrollbar personnalisée

---

## 📋 PROCHAINES ÉTAPES

### 1. Intégrer les images
Tes dossiers d'images sont sur le Desktop. Je vais les copier:
- `~/Desktop/Textile` → Produits sublimation
- `~/Desktop/Stickers` → Exemples stickers
- `~/Desktop/Prints` → Impressions fine art
- `~/Desktop/Locale` → Photos de l'espace

### 2. Créer les pages de services détaillées
Les 6 sous-pages avec tous les tableaux de prix:
- Impression Fine Art
- Stickers Custom
- Sublimation & Merch
- Flyers & Cartes
- Design Graphique
- Développement Web

### 3. Page Tarifs
Tous les prix consolidés en un seul endroit.

### 4. Strapi Content-Types
Pour que tu puisses modifier le contenu via Strapi:
- Services
- Projets Portfolio
- Produits Boutique
- Témoignages

### 5. Portfolio
Galerie filtrable de tes projets.

### 6. Boutique E-commerce
Avec Stripe pour les paiements.

---

## 🎨 NAVIGATION DU SITE

```
Header (fixe en haut)
├── Logo MASSIVE (→ Accueil)
├── Services ▾
│   ├── Impression Fine Art
│   ├── Stickers Custom
│   ├── Sublimation & Merch
│   ├── Flyers & Cartes
│   ├── Design Graphique
│   └── Développement Web
├── Tarifs
├── Portfolio
├── Boutique
├── À propos
├── Contact (bouton magenta)
└── Panier 🛒
```

---

## 🎯 OBJECTIFS DESIGN

### Inspiration
- WhiteWall (mais en mieux)
- ThePrintSpace (mais en mieux)

### Ce qui rend Massive Medias unique
- Animations plus fluides et modernes
- Palette audacieuse (noir/violet/magenta)
- Navigation intuitive
- Design qui reflète la scène créative montréalaise
- Expérience utilisateur exceptionnelle

---

## 💻 COMMANDES UTILES

### Démarrer les serveurs
```bash
# Backend (terminal 1)
cd backend
npm run develop

# Frontend (terminal 2)
cd frontend
npm run dev
```

### Arrêter les serveurs
`Ctrl + C` dans chaque terminal

---

## 📝 NOTES IMPORTANTES

### Tagline officielle
```
Create. Print. Repeat.
```

### Palette de couleurs
- Noir profond: `#0A0A0A`
- Violet foncé: `#1A0033`
- Violet moyen: `#310051`
- Violet principal: `#46015E`
- **Magenta (accent principal)**: `#FF00A4`
- Electric Purple: `#D700FE`
- Blanc: `#FFFFFF`
- Gris clair: `#E0D0F0`
- Gris sourd: `#A090B0`

### Boutons
- Primaire (CTA) = Gradient magenta avec glow
- Secondaire (outline) = Bordure blanche

---

## 🔥 CE QUI VA RENDRE TON SITE EXCEPTIONNEL

1. **Animations fluides** — Tout bouge élégamment avec Framer Motion
2. **Effets de glow** — Les éléments importants brillent en magenta
3. **Navigation intuitive** — Menu dropdown pour les services
4. **Design audacieux** — Palette noir/violet/magenta qui claque
5. **Responsive parfait** — Magnifique sur mobile et desktop
6. **Performance** — Vite ultra-rapide
7. **Éditable** — Strapi pour gérer ton contenu facilement

---

## 📞 BESOIN D'AIDE?

Tout le contenu est dans le prompt original. Chaque page a:
- Son titre exact
- Ses sections
- Son contenu textuel
- Ses tableaux de prix

Consulte `README_PROGRESSION.md` dans le dossier frontend pour voir la progression détaillée.

---

**Projet créé le:** 2026-02-09  
**Status:** Socle fonctionnel, prêt pour le contenu et les images
