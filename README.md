# Massive Medias

Plateforme e-commerce et portfolio d'artistes, trilingue (FR/EN/ES), avec 10 themes de couleurs dynamiques. Impression fine art, stickers, merch, design graphique et services web.

**Production:** [massivemedias.com](https://massivemedias.com)

---

## Architecture

```
massivemedias/
├── frontend/              # React 19 + Vite + Tailwind CSS
├── backend/               # Strapi v5 (headless CMS)
├── cloudflare-worker/     # Worker OG images + keep-alive cron
├── scripts/               # Utilitaires (reconcile Stripe, Google Drive, etc.)
├── .github/workflows/     # CI/CD (GitHub Actions)
└── _old/                  # Ancien site (archive)
```

### Stack technique

| Composant | Technologie |
|---|---|
| Frontend | React 19, Vite 7, Tailwind CSS 4, Framer Motion |
| Backend | Strapi v5, Node.js 20+ |
| Base de donnees | SQLite (dev), PostgreSQL (prod) |
| Paiements | Stripe Checkout (live) |
| Stockage fichiers | Supabase Storage (WebP) + Google Drive (originaux HD) |
| Auth | Supabase Auth (JWT) |
| Hebergement frontend | GitHub Pages + Cloudflare |
| Hebergement backend | Render.com **Standard plan (2GB RAM)** |
| Emails transactionnels | Resend |
| Traduction auto | DeepL API |
| Traitement images | Sharp (WebP, compression, thumbs, streaming) |
| Analytics | Google Analytics 4 |
| PDF | jsPDF (factures) |
| Icons | Lucide React |

---

## Infrastructure production

```
Navigateur client
    │
    ▼
Cloudflare (DNS + SSL + CDN + Worker cron)
    │
    ├─► GitHub Pages (frontend statique React)
    │
    └─► Render.com (backend Strapi + PostgreSQL)
             │
             ├─► Supabase Storage (WebP affichage)
             ├─► Supabase Auth (JWT users)
             ├─► Google Drive (originaux HD, OAuth2)
             ├─► Stripe (paiements + webhooks)
             └─► Resend (emails)
```

---

## Configuration par plateforme

### Render.com (backend Strapi)

**Service:** `massivemedias-api` - Plan **Standard** (25$/mois, 1 CPU / 2GB RAM).

**Variables d'environnement obligatoires:**

```env
# --- Strapi core ---
HOST=0.0.0.0
PORT=10000
APP_KEYS=cle1,cle2,cle3,cle4
API_TOKEN_SALT=<random>
ADMIN_JWT_SECRET=<random>
JWT_SECRET=<random>
TRANSFER_TOKEN_SALT=<random>
NODE_VERSION=20
NODE_ENV=production

# --- Database Postgres (Render managed) ---
DATABASE_CLIENT=postgres
DATABASE_URL=postgres://...

# --- Stripe (mode live) ---
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...     # Copier EXACTEMENT depuis Stripe dashboard

# --- Supabase ---
SUPABASE_API_URL=https://xxx.supabase.co
SUPABASE_API_KEY=<service-role-key>
SUPABASE_BUCKET=order-files

# --- Google Drive OAuth2 ---
GOOGLE_DRIVE_CLIENT_ID=...
GOOGLE_DRIVE_CLIENT_SECRET=...
GOOGLE_DRIVE_REFRESH_TOKEN=...
GOOGLE_DRIVE_FOLDER_ID=<parent folder id>

# --- Resend (emails) ---
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@massivemedias.com

# --- Admin auth (securite endpoints destructifs) ---
ADMIN_API_TOKEN=<uuid 64 chars, openssl rand -hex 32>
ADMIN_EMAILS=massivemedias@gmail.com,mauditemachine@gmail.com
ADMIN_EMAIL=massivemedias@gmail.com   # alertes webhook + fallback

# --- Reconciliation cron ---
RECONCILE_TOKEN=<meme uuid que GitHub Secret, doit matcher>
```

**Node flags (package.json `start`):**
```
NODE_OPTIONS='--max-old-space-size=1536 --expose-gc' strapi start
```

### GitHub Secrets (Actions)

`https://github.com/massivemedias/massivemedias/settings/secrets/actions`

| Secret | Utilise par | Doit matcher |
|---|---|---|
| `RECONCILE_TOKEN` | `.github/workflows/reconcile-stripe.yml` | `RECONCILE_TOKEN` sur Render |
| `CLOUDFLARE_API_TOKEN` | Deploy du Worker | Token Cloudflare |

### Stripe Dashboard

**Webhook endpoint:** `https://massivemedias-api.onrender.com/api/webhooks/stripe`

**Evenements ecoutes:**
- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

**Cle secrete de signature (whsec_...):** copier depuis Stripe dashboard vers `STRIPE_WEBHOOK_SECRET` sur Render. **Critique:** verifier bit-par-bit (O vs 0). Une erreur d'un caractere = tous les webhooks echouent en 400 et les commandes restent en draft silencieusement.

### Cloudflare

**DNS:**
- `massivemedias.com` -> GitHub Pages (proxied)
- `*.massivemedias.com` -> artist-proxy worker (proxied)

**Worker `og-worker.js`:**
- Route: `*.massivemedias.com/*`
- Genere les images Open Graph dynamiques pour les pages artistes
- Cron trigger `*/5 * * * *` - ping backend toutes les 5 min (defense en profondeur anti-OOM-restart)

**Sous-domaines artistes:** CNAME `<slug>` -> `massivemedias.github.io` (proxied)

### Supabase

**Storage bucket:** `order-files` (public read)
**Structure:**
```
order-files/
├── artist-submissions/<artistSlug>/       # Prints artistes (WebP)
├── client-submissions/<email-folder>/     # Uploads clients configurateurs (WebP)
└── orders/<timestamp>/                    # Fichiers de commande
```

**Auth:**
- JWT Supabase utilise a la fois cote frontend (requetes API) et validation cote backend (endpoints admin protects via `ADMIN_EMAILS`)
- Le frontend stocke le JWT dans `localStorage['token']` via `AuthContext.syncToken()` pour que l'intercepteur axios l'attache automatiquement

### Google Drive

**OAuth2 app:** mauditemachine@gmail.com, 2TB storage.

**Nomenclature des dossiers d'upload** (nouveau systeme avril 2026):
- `<artistSlug>` - override admin pour l'edition artiste (legacy)
- `<email> - order-<orderId>` - upload dans le contexte d'une commande
- `<email> - cart-<cartId>` - client connecte, pas encore d'order
- `Guest_Cart_<cartId>` - visiteur anonyme (cartId genere dans localStorage)

**Optimisation memoire (avril 2026):** uploads streaming via `uploadStreamToGoogleDrive()`. Aucun fichier n'est charge entierement en RAM pendant l'upload, ce qui evite les OOM crashes sur l'instance Standard de Render.

---

## Fonctionnalites principales

### Boutique e-commerce

- **Prints fine art** - Impression musee et studio (A4, A3, A3+, A2). Cadre optionnel 20$/20$/30$/35$/45$ par format.
- **Stickers** - Custom shapes, finitions standards (matte, glossy, die-cut) et FX (holographic, broken-glass, stars). Tarifs par tiers 25/50/100/250/500.
- **Size multiplier stickers** (avril 2026) - 2"=0.8x / 3"=1.0x ref / 4"=1.5x / 5"=2.0x. Les tailles differentes ne cumulent pas pour debloquer un tier superieur.
- **Merch/Sublimation** - T-shirts, hoodies, longsleeves, tote bags, mugs, tumblers. **Actuellement en pause** (demenagement ateliers). Voir section Merch Pause System.
- **BYOT (Bring Your Own Textile)** - Option "J'apporte mon propre vetement" sur tshirt/longsleeve/hoodie/totebag. Deduit le cout blank du total.
- **Design graphique** - Logos, affiches, flyers (sur devis).
- **Services web** - Sites vitrine, e-commerce (sur devis).

### Systeme d'artistes

- Page artiste dediee avec sous-domaine (`<slug>.massivemedias.com`)
- Dashboard artiste complet (profil, galerie, ventes, retraits)
- Auto-gestion du contenu (ajout/suppression d'images avec validation admin)
- Upload fichiers haute-resolution -> Google Drive (originaux preserves)
- Compression WebP automatique via Sharp (affichage site)
- Contrat artiste numerique avec signature electronique
- Suivi des commissions et paiements
- Rabais artiste de 25% sur leurs propres prints

### Admin

**Protection auth:** tous les endpoints destructifs (update/delete/list) sont proteges par `requireAdminAuth` (Supabase JWT avec email dans `ADMIN_EMAILS`, ou service token `ADMIN_API_TOKEN`).

**Dashboard:**
- Commandes (avec edition manuelle du total + audit trail dans les notes)
- Inventaire, depenses, stats, tarification
- Messages (contact + artistes + candidatures)
- Approbation/rejet des modifications artistes (avec vignettes)
- Facturation conforme Quebec (TPS 5% + TVQ 9.975% + NEQ)

**Notifications admin:**
- Badge rouge sur l'icone Settings du header (total non-lus)
- Badges separes dans la sidebar admin sur `/admin/messages`, `/admin/commandes`, `/admin/utilisateurs`
- Son de cloche (880Hz + 1100Hz) quand nouvelle notif
- Polling toutes les 2 min

### QR Code Dynamic Tracking (avril 2026)

Admin panel -> Massive IA -> onglet QR Code.

**Generation:**
- Defaults: 1200px, style square (Simple), EC level 'L'
- Logo optionnel au centre avec padding blanc arrondi
- **Regle critique:** logo present -> EC force a 'H' (High 30%) pour garantir la lisibilite

**Tracking (QR dynamiques):**
- `POST /api/qr-codes/create` genere un shortId 8 chars base62
- Le QR encode `https://massivemedias-api.onrender.com/api/qr/:shortId` (pas l'URL finale)
- Chaque scan: log dans `qr_scans` (IP, user-agent, referer, timestamp) puis 302 redirect
- Onglet "Mes QR" dans l'admin: liste avec compteur de scans et bouton "Copier URL tracke"

### Merch Pause System (avril 2026)

Fichier de config: `frontend/src/config/merchStatus.js`.

```javascript
export const MERCH_PAUSED = true;  // Basculer a false pour reactiver
```

Quand `true`:
- Banniere `<MerchPauseBanner />` affichee en haut des pages Merch
- Boutons "Ajouter au panier" visuellement disabled (opacity-40 + cursor-not-allowed)
- Click force -> `window.alert` avec message explicatif tri-lingue
- CTA "Faire une demande speciale (Vinyle)" -> `/contact?sujet=demande-speciale-vinyle`

Pages affectees: `ServiceMerch`, `MerchDetail`, `BoutiqueMerch`, `BoutiqueMerchTshirt`, `MerchTshirt`, `ConfiguratorSublimation`.

### 10 themes de couleurs

| # | Theme | Description |
|---|---|---|
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

Themes adaptes via CSS custom properties dans `frontend/src/styles/themes.css`.

### Multilingue (FR/EN/ES)

- Detection automatique de la langue du navigateur
- Fallback: ES -> EN -> FR
- Helper `bl()` pour resolution bilingue des champs CMS
- Helper `tx({ fr, en, es })` pour traduction inline dans le JSX
- Traduction automatique via DeepL API (backend, pour l'ajout de contenu)

---

## Resilience & monitoring

### Anti-OOM (memoire)

- **Node flags:** `--max-old-space-size=1536` force GC avant 1536 MB (laisse 512 MB de marge sur 2 GB)
- **Upload streaming:** `fs.createReadStream` + `sharp().toFile()` - aucun fichier complet en RAM
- **Hard limit uploads:** 50 MB par fichier (rejet 400 BadRequest au-dela)
- **Endpoint monitoring:** `GET /api/orders/memory-health` retourne `{ status: OK|WARNING|CRITICAL, memory: { rss, heapUsed, ... } }`

### Anti-webhook-silencieux

- **Alerte email instantanee** (via Resend) a chaque echec de signature Stripe -> l'admin recoit un email rouge 🚨
- **Cron de reconciliation horaire** (`.github/workflows/reconcile-stripe.yml`) - scanne les orders `status=draft` des 72 dernieres heures, interroge Stripe, flip en `paid` si le paiement est confirme
- **Logs structures** - chaque webhook a un `requestId` pour correlation dans les logs Render

### Resilience frontend

- **Retry automatique:** `frontend/src/utils/apiResilient.js` - retry 5x avec backoff exponentiel (1s/2s/4s/8s/16s) sur network errors et 5xx
- **Banner pause globale:** `BackendHealthBanner.jsx` affiche une banniere ambre quand le backend est detecte down, avec auto-ping toutes les 30s pour detection rapide du recovery
- **Cart persistance localStorage** + cartId stable pour survivre aux reloads et crashes

---

## Demarrage rapide (dev local)

### Prerequisites
- Node.js 20+
- npm

### Backend (Strapi)

```bash
cd backend
cp .env.example .env          # Configurer les variables
npm install
npm run develop               # http://localhost:1337
```

### Frontend (React)

```bash
cd frontend
cp .env.example .env          # Configurer les variables
npm install
npm run dev                   # http://localhost:3000
```

Le frontend proxy automatiquement `/api/*` vers le backend.

---

## Variables d'environnement (dev local)

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:1337
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_GA_ID=G-XXXXXXXXXX
VITE_GOOGLE_PLACES_API_KEY=AIza...
```

### Backend (`backend/.env`)

Voir la section **Render.com** ci-dessus pour la liste complete (les memes variables s'appliquent en dev local, avec `STRIPE_SECRET_KEY=sk_test_...`).

---

## API Backend - endpoints critiques

### Orders

| Methode | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/orders/create-payment-intent` | Public | Cree un Payment Intent Stripe |
| POST | `/api/orders/create-checkout-session` | Public | Cree une Checkout Session Stripe |
| GET | `/api/orders/my-orders` | Public (filtre email) | Commandes du user |
| POST | `/api/webhooks/stripe` | Signature Stripe | Webhook evenements Stripe |
| GET | `/api/orders/memory-health` | Public (diagnostic) | Stats memoire process |
| GET | `/api/orders/admin` | **Admin** | Liste toutes les orders |
| PUT | `/api/orders/:documentId/status` | **Admin** | Change status (body: `{status, invoiceNumber?, autoInvoice?, sendEmails?}`) |
| PUT | `/api/orders/:documentId/total` | **Admin** | Ajuste manuellement le total (body: `{total, reason}`) - audit trail auto |
| PUT | `/api/orders/:documentId/notes` | **Admin** | Met a jour les notes admin |
| PUT | `/api/orders/:documentId/tracking` | **Admin** | Ajoute numero de suivi |
| DELETE | `/api/orders/:documentId` | **Admin** | Supprime une commande |
| POST | `/api/orders/admin-create` | **Admin** | Creation manuelle d'une commande |
| POST | `/api/orders/reconcile-stripe` | Bearer `RECONCILE_TOKEN` | Reconciliation draft -> paid |
| GET | `/api/orders/clients` | **Admin** | Liste des clients (CRM) |
| GET | `/api/orders/stats` | **Admin** | Stats business (revenue, depenses, etc.) |
| GET | `/api/orders/commissions` | **Admin** | Commissions artistes |

### QR Codes

| Methode | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/qr-codes/create` | **Admin** | Cree un QR dynamique trackable |
| GET | `/api/qr-codes/list` | **Admin** | Liste des QR avec compteur de scans |
| DELETE | `/api/qr-codes/:documentId` | **Admin** | Supprime un QR et ses scans |
| GET | `/api/qr-codes/:documentId/scans` | **Admin** | Drilldown des scans |
| GET | `/api/qr/:shortId` | Public | **Redirect 302 + log scan** (endpoint que le QR encode) |

### Uploads

| Methode | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/artist-edit-requests/upload-direct` | Public | Upload streaming vers Google Drive + WebP Supabase. Body: `{file, clientEmail?, cartId?, orderId?, artistSlug?}` |
| POST | `/api/orders/upload` | Public | Upload via plugin Strapi (Supabase) |

---

## Content-Types Strapi (21 collections)

| Collection | Description |
|---|---|
| `artist` | Profils artistes (bio, prints, pricing, socials) |
| `artist-edit-request` | Demandes de modification artiste |
| `artist-message` | Messagerie artiste-admin |
| `artist-payment` | Suivi paiements artistes |
| `artist-submission` | Candidatures artistes |
| `boutique-item` | Produits boutique |
| `client` | Clients/utilisateurs (CRM) |
| `contact-submission` | Formulaires de contact |
| `expense` | Depenses entreprise |
| `inventory-item` | Stock et inventaire |
| `news-article` | Articles/nouvelles |
| `order` | Commandes e-commerce (inclut `stripeCheckoutSessionId` separe de `stripePaymentIntentId` depuis avril 2026) |
| `product` | Definitions produits (stickers, etc.) |
| `qr-code` | QR codes dynamiques trackables |
| `qr-scan` | Evenements de scan (IP, UA, referer, timestamp) |
| `service-package` | Forfaits services |
| `service-page` | Pages services (contenu CMS) |
| `site-content` | Contenu global du site (single type) |
| `testimonial` | Temoignages clients |
| `user-role` | Roles et permissions (user, artist, admin) |
| `withdrawal-request` | Demandes de retrait artistes |

---

## Routes frontend

### Pages publiques

| Route | Page |
|---|---|
| `/` | Accueil |
| `/artistes` | Listing des artistes |
| `/artistes/:slug` | Boutique artiste |
| `/boutique` | Boutique principale |
| `/boutique/stickers` | Stickers |
| `/boutique/fine-art` | Prints fine art & flyers |
| `/boutique/sublimation` | Merch sublimation (en pause) |
| `/boutique/design` | Services design |
| `/boutique/web` | Services web |
| `/services/:slug` | Detail service |
| `/services/merch` | Configurateur Merch/Sublimation (en pause) |
| `/services/stickers` | Configurateur stickers |
| `/panier` | Panier |
| `/checkout` | Paiement Stripe |
| `/contact` | Contact |
| `/a-propos` | A propos |

### Dashboard utilisateur

| Route | Page |
|---|---|
| `/account` | Mon compte (commandes, profil, adresse, securite) |
| `/account?tab=artist-dashboard` | Dashboard artiste |
| `/account?tab=artist-profile` | Profil artiste + galerie |

### Administration

| Route | Page |
|---|---|
| `/admin` | Dashboard admin |
| `/admin/commandes` | Gestion des commandes (edition manuelle total) |
| `/admin/commissions` | Commissions artistes |
| `/admin/inventaire` | Inventaire |
| `/admin/messages` | Messages et candidatures |
| `/admin/utilisateurs` | Gestion utilisateurs |
| `/admin/depenses` | Depenses |
| `/admin/stats` | Statistiques |
| `/admin/tarifs` | Tarification |
| `/admin/temoignages` | Temoignages |
| `/admin/massive-ia` | Outils IA (chat, stickers, prints, merch, resize, QR Code, lens) |

---

## CI/CD (GitHub Actions)

### `.github/workflows/deploy.yml`
Deploy automatique frontend sur push vers `main`:
1. Build Vite avec variables d'environnement
2. Generation des routes SPA (pour GitHub Pages)
3. Deploiement sur GitHub Pages

### `.github/workflows/reconcile-stripe.yml`
Cron horaire a `7 * * * *`:
- Appelle `POST /api/orders/reconcile-stripe` avec `RECONCILE_TOKEN`
- Scanne les drafts des 72 dernieres heures
- Flip en `paid` si Stripe confirme le paiement
- Auto-genere facture + envoie emails
- Tolerant aux erreurs de config (pas d'email d'echec sauf si vrai probleme business)

### `.github/workflows/keep-alive.yml`
Ping Render toutes les 10 min (backup du Cloudflare Worker cron). Endpoint `/api/artists`.

### `cloudflare-worker/og-worker.js` (cron)
Cron `*/5 * * * *` - ping 2 endpoints backend (`/api/site-content` + `/api/artists`) pour garder le conteneur chaud. Defense en profondeur anti-OOM-restart.

---

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
- `getStickerPrice(finish, shape, qty, size)` - Prix avec size multiplier
- `getSublimationPrice(product, qtyIndex, withDesign, bringOwnGarment)` - Prix avec BYOT
- `blockIfMerchPaused(tx)` - Guard merch pause dans les handlers `addToCart`

### Flow d'upload (depuis avril 2026)
```
Client upload fichier (PDF/TIFF/PNG/JPEG, max 50MB)
  -> Frontend: envoie { file, clientEmail, cartId, orderId, artistSlug }
  -> Backend: resolve driveFolderName selon la priorite:
      1. artistSlug (legacy admin)
      2. "{email|Guest} - order-{orderId}"
      3. "{email} - cart-{cartId}"
      4. "Guest_Cart_{cartId}"
  -> Sharp streaming disk->disk -> WebP (1600px)
  -> Supabase Storage (WebP pour affichage site)
  -> Google Drive streaming (original HD, fetch duplex half)
  -> Cleanup garanti via try/finally (fichier temp + tmpWebp)
  -> Admin recoit notification avec vignette + lien Drive
```

### Flow de commande (depuis avril 2026)
```
Client ajoute items au panier (cartId localStorage)
  -> Panier -> Checkout -> Stripe Checkout Session
  -> Backend cree Order avec status=draft
      - stripeCheckoutSessionId = session.id (cs_live_...)
      - stripePaymentIntentId = session.id temporaire
  -> Client paye sur Stripe
  -> Webhook checkout.session.completed recu
      - Trouve order par cs_live
      - Update stripePaymentIntentId avec le vrai pi_...
  -> Webhook payment_intent.succeeded recu
      - Trouve order par pi_ OU cs_live (fallback resistant a la race)
      - status: draft -> paid
      - Genere invoiceNumber MM-YYYY-XXXX (sequentiel)
      - Envoie email confirmation au client
      - Envoie notification vente a l'admin (avec son + badge rouge)
      - Update stats client (totalSpent, orderCount)
      - Decrement inventaire si applicable
      - Notifie artistes concernes
      - Marque pieces uniques comme vendues
  -> [Si le webhook echoue silencieusement]
  -> Cron horaire reconcile-stripe detecte l'order draft
  -> Re-applique la logique de paiement
```

---

## Scripts utilitaires

```bash
# Reconcilier la commande Cindy (ou toute commande specifique)
RECONCILE_TOKEN=xxx ./scripts/reconcile-order-cindy.sh

# Obtenir un refresh token Google Drive OAuth2
node scripts/get-drive-token.js <CLIENT_ID> <CLIENT_SECRET>

# Generer les routes SPA pour GitHub Pages
cd frontend && bash scripts/generate-spa-routes.sh

# Generer images OG pour nouveaux artistes
node frontend/scripts/generate-og-images.mjs

# Deploy Cloudflare Worker
cd cloudflare-worker && CLOUDFLARE_API_TOKEN=xxx npx wrangler deploy
```

---

## Documentation complementaire

- **`RAPPORT-INCIDENTS-17-AVRIL-2026.md`** - Post-mortem complet + plan de prevention (20 sections, ~12 pages)
- **`AUDIT-PROMPT-17-AVRIL-2026.md`** - Prompt prepare pour audit externe par autre IA
- **`scripts/reconcile-order-cindy.sh`** - Script de recuperation pour orders bloquees

---

## Changelog recent (avril 2026)

### 17-18 avril - Refonte technique majeure

- **Securite endpoints admin** - `requireAdminAuth` sur 10 endpoints destructifs (update/delete/list). Accepte `ADMIN_API_TOKEN` ou Supabase JWT avec email dans `ADMIN_EMAILS`.
- **Streaming uploads Google Drive** - Plus de `readFileSync` complet en RAM. Upload de fichiers 50MB sans impact memoire.
- **Alerte email webhook Stripe** - Toute signature invalide declenche un email admin immediat (fin des echecs silencieux de 4 jours).
- **Memory health endpoint** - `GET /api/orders/memory-health` pour monitoring.
- **Race Stripe webhook** - Nouveau champ `stripeCheckoutSessionId` dans le schema order, resistant au desordre d'arrivee checkout.session vs payment_intent.
- **Resilience frontend** - `apiResilient.js` avec retry + backoff + `BackendHealthBanner`.
- **Size multiplier stickers** - 2"/3"/4"/5" facturation correcte selon la taille.
- **Nomenclature Google Drive** - `[email] - cart/order-[id]` au lieu du vrac `client-uploads/`.
- **Merch pause system** - Flag `MERCH_PAUSED` dans `config/merchStatus.js` avec banniere et boutons disabled.
- **BYOT (Bring Your Own Textile)** - Option "J'apporte mon propre vetement" prete pour la reouverture Merch.
- **QR Code Dynamic Tracking** - Content-types `qr-code` + `qr-scan`, endpoint 302 redirect, liste avec scansCount.
- **Admin edit order total** - Icone crayon a cote du total, modal avec audit trail.
- **Admin notifications** - Badges rouges sur sidebar pour `/messages`, `/commandes`, `/utilisateurs` + son + email.
- **Timezone Montreal** - Tous les emails affichent l'heure `America/Toronto` (fin du decalage UTC).
- **Fix prix cadre A2** - 40$ -> 45$ (aligne avec FAQ et AdminTarifs).
- **Cart ID stable** - Identifiant localStorage pour tracking uploads guest.

---

## Licence

Projet prive - Massive Medias - Tous droits reserves.
