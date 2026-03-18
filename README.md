# Massive Medias

Plateforme e-commerce et portfolio d'artistes, trilingue (FR/EN/ES), avec 10 themes de couleurs dynamiques. Impression fine art, stickers, merch, design graphique et services web.

**Production:** [massivemedias.com](https://massivemedias.com)

## Architecture

```
massivemedias/
├── frontend/              # React 19 + Vite + Tailwind CSS
├── backend/               # Strapi v5 (headless CMS)
├── scripts/               # Utilitaires (Google Drive, etc.)
├── .github/workflows/     # CI/CD (GitHub Actions)
└── _old/                  # Ancien site (archive)
```

### Stack technique

| Composant | Technologie |
|-----------|-------------|
| Frontend | React 19, Vite 7, Tailwind CSS 4, Framer Motion |
| Backend | Strapi v5, Node.js 20+ |
| Base de donnees | SQLite (dev), PostgreSQL (prod) |
| Paiements | Stripe Checkout |
| Stockage fichiers | Supabase Storage |
| Auth | Supabase Auth |
| Hebergement frontend | GitHub Pages + Cloudflare |
| Hebergement backend | Render.com |
| Images artistes HD | Google Drive API (OAuth2) |
| Emails | Resend |
| Traduction auto | DeepL API |
| Traitement images | Sharp (WebP, compression, thumbs) |
| Analytics | Google Analytics 4 |
| PDF | jsPDF (factures) |
| Icons | Lucide React |

## Fonctionnalites principales

### Boutique e-commerce
- **Prints fine art** - Impression musee et studio (A4, A3, A3+, A2)
- **Stickers** - Custom shapes, finitions (mat, brillant, holographique, transparent)
- **Merch** - T-shirts, hoodies, sublimation
- **Design graphique** - Logos, affiches, flyers
- **Services web** - Sites vitrine, e-commerce

### Systeme d'artistes
- Page artiste dediee avec sous-domaine (`artiste.massivemedias.com`)
- Dashboard artiste complet (profil, galerie, ventes, retraits)
- Auto-gestion du contenu (ajout/suppression d'images avec validation admin)
- Upload fichiers haute-resolution -> Google Drive 2 To (originaux)
- Compression WebP automatique (affichage site)
- Contrat artiste numerique avec signature electronique
- Suivi des commissions et paiements

### Admin
- Dashboard complet: commandes, inventaire, depenses, stats
- Gestion des messages (contact, artistes, candidatures)
- Approbation/rejet des modifications artistes (avec vignettes)
- Tarification dynamique et gestion des prix
- Suivi analytics (Google Analytics 4)
- Facturation conforme aux normes fiscales du Quebec (TPS/TVQ/NEQ)

### 10 themes de couleurs

| # | Theme | Description |
|---|-------|-------------|
| 0 | Massive | Violet profond (defaut) |
| 1 | Bleu Nuit | Bleu marine |
| 2 | Ocean | Turquoise/cyan |
| 3 | Foret | Vert fonce |
| 4 | Bordeaux | Rouge vin |
| 5 | Espresso | Brun chaud |
| 6 | Charbon | Gris fonce |
| 7 | Ardoise | Bleu-gris |
| 8 | Creme | Beige clair |
| 9 | Blanc | Blanc pur |

Chaque theme adapte les couleurs, ombres, et contrastes via CSS custom properties.

### Multilingue (FR/EN/ES)
- Detection automatique de la langue du navigateur
- Fallback: ES -> EN -> FR
- Helper `bl()` pour resolution bilingue des champs CMS
- Traduction automatique via DeepL API (backend)

## Demarrage rapide

### Prerequisites
- Node.js 20+
- npm

### Backend (Strapi)

```bash
cd backend
cp .env.example .env  # Configurer les variables
npm install
npm run develop       # http://localhost:1337
```

### Frontend (React)

```bash
cd frontend
cp .env.example .env  # Configurer les variables
npm install
npm run dev           # http://localhost:3000
```

Le frontend proxy automatiquement `/api/*` vers le backend.

## Variables d'environnement

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:1337/api
VITE_STRIPE_PUBLIC_KEY=pk_...
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_GA_ID=G-XXXXXXXXXX
VITE_GOOGLE_PLACES_API_KEY=AIza...
```

### Backend (`backend/.env`)

```env
HOST=0.0.0.0
PORT=1337
APP_KEYS=cle1,cle2,cle3,cle4
API_TOKEN_SALT=...
ADMIN_JWT_SECRET=...
JWT_SECRET=...
DATABASE_CLIENT=sqlite          # ou postgres en prod
DATABASE_URL=postgres://...     # prod seulement
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
GOOGLE_DRIVE_CLIENT_ID=...
GOOGLE_DRIVE_CLIENT_SECRET=...
GOOGLE_DRIVE_REFRESH_TOKEN=...
GOOGLE_DRIVE_FOLDER_ID=...
```

## API Backend (21 collections Strapi)

| Collection | Description |
|------------|-------------|
| `artist` | Profils artistes (bio, prints, pricing, socials) |
| `artist-edit-request` | Demandes de modification artiste |
| `artist-message` | Messagerie artiste-admin |
| `artist-payment` | Suivi paiements artistes |
| `artist-submission` | Candidatures artistes |
| `boutique-item` | Produits boutique |
| `client` | Clients/utilisateurs |
| `contact-submission` | Formulaires de contact |
| `expense` | Depenses entreprise |
| `inventory-item` | Stock et inventaire |
| `news-article` | Articles/nouvelles |
| `order` | Commandes e-commerce |
| `product` | Definitions produits (stickers, etc.) |
| `service-package` | Forfaits services |
| `service-page` | Pages services (contenu CMS) |
| `site-content` | Contenu global du site (single type) |
| `testimonial` | Temoignages clients |
| `user-role` | Roles et permissions |
| `withdrawal-request` | Demandes de retrait artistes |
| `analytics` | Donnees analytiques |

## Routes frontend

### Pages publiques
| Route | Page |
|-------|------|
| `/` | Accueil |
| `/artistes` | Listing des artistes |
| `/artistes/:slug` | Boutique artiste |
| `/boutique` | Boutique principale |
| `/boutique/stickers` | Stickers |
| `/boutique/fine-art` | Prints fine art & flyers |
| `/boutique/sublimation` | Merch sublimation |
| `/boutique/design` | Services design |
| `/boutique/web` | Services web |
| `/services/:slug` | Detail service |
| `/panier` | Panier |
| `/checkout` | Paiement Stripe |
| `/contact` | Contact |
| `/a-propos` | A propos |

### Dashboard utilisateur
| Route | Page |
|-------|------|
| `/account` | Mon compte (commandes, profil, adresse, securite) |
| `/account?tab=artist-dashboard` | Dashboard artiste |
| `/account?tab=artist-profile` | Profil artiste + galerie |

### Administration
| Route | Page |
|-------|------|
| `/admin/commandes` | Gestion des commandes |
| `/admin/commissions` | Commissions artistes |
| `/admin/inventaire` | Inventaire |
| `/admin/messages` | Messages et candidatures |
| `/admin/utilisateurs` | Gestion utilisateurs |
| `/admin/depenses` | Depenses |
| `/admin/stats` | Statistiques |
| `/admin/tarifs` | Tarification |
| `/admin/temoignages` | Temoignages |

## Deploiement

### CI/CD (GitHub Actions)

**`deploy.yml`** - Deploy automatique sur push vers `main`
1. Build Vite avec variables d'environnement
2. Generation des routes SPA (pour GitHub Pages)
3. Deploiement sur GitHub Pages

**`keep-alive.yml`** - Ping Render toutes les 10 minutes
- Empeche le serveur Render free tier de se mettre en veille

### Infrastructure production

```
Client -> Cloudflare (CDN/SSL)
       -> GitHub Pages (frontend statique)
       -> Render.com (API Strapi + PostgreSQL)
       -> Supabase (fichiers + auth)
       -> Google Drive (originaux artistes HD)
```

## Patterns cles

### CMS-first avec fallback
```
Donnees CMS (Strapi API) -> Donnees locales (src/data/) -> Fallback vide
```
Le site fonctionne meme si le backend est indisponible grace aux donnees hardcodees.

### Helpers utilitaires
- `bl(item, field)` - Resolution bilingue des champs CMS
- `mediaUrl(url)` - URL complete pour les medias CMS
- `thumb(path)` / `img(path)` - Chemins images locales
- `tx({ fr, en, es })` - Traduction inline

### Flow d'upload artiste
```
Artiste upload image (TIFF, PNG, JPEG...)
  -> Compression JPEG client-side (si > 50 Mo)
  -> Supabase Storage (temporaire)
  -> Backend: Google Drive (original HD)
  -> Backend: Sharp -> WebP (affichage site)
  -> Admin recoit notification avec vignette + lien Drive
  -> Admin approuve -> WebP conserve, original sur Drive
```

## Scripts

```bash
# Google Drive - obtenir un refresh token OAuth2
node scripts/get-drive-token.js <CLIENT_ID> <CLIENT_SECRET>

# SPA routes pour GitHub Pages
cd frontend && bash scripts/generate-spa-routes.sh
```

## Licence

Projet prive - Massive Medias - Tous droits reserves.
