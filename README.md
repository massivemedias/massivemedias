# 🚀 Massive Medias OS

> L'infrastructure technique de l'agence. Studio creatif independant a Montreal (Mile-End) - impression fine art, stickers vinyle premium, sublimation textile, design graphique, agence web.

**Production:** [massivemedias.com](https://massivemedias.com) · **Atelier:** 5338 rue Marquette, Montreal QC H2J 3Z3

---

## ✨ Vue d'ensemble

`Massive Medias OS` n'est pas un site vitrine. C'est une **plateforme d'agence complete** qui automatise la quasi totalite du cycle de vie commercial : acquisition, devis, vente, production, suivi client, recolte d'avis et social proof. Le code est multi-langue (FR/EN/ES), trilingue par design avec fallback CMS.

L'architecture est decoupee en quatre piliers metier qui se parlent par API :

```
🎯 Acquisition  →  💳 Vente  →  📦 Service  →  📊 Back-office  →  ⭐ Croissance
   (frontend)      (Stripe)     (portail)       (Money Board)       (Google reviews)
```

---

## 🏛️ Les 5 Piliers (fonctionnalites cles)

### 🎯 1. Acquisition & Frontend

* **UI React 19 + Vite 7 + Tailwind 4** : 10 themes de couleurs dynamiques (CSS custom properties), animations Framer Motion, composants accessibles.
* **Trilingue natif** (FR/EN/ES) avec helper `tx({fr, en, es})` et fallback CMS Strapi -> donnees locales `src/data/`.
* **Formulaire de contact intelligent** : qualification premium (budget, urgence, service), upload direct vers **Google Drive** via `FileUpload` (originaux HD conserves), honeypot anti-spam + delai d'affichage minimal, escapeHtmlAttr cote backend.
* **Auto-reponse prospect** + notification admin avec lien drive du brief.
* **SEO extreme** :
  * Balises meta tri-langue avec mots-cles a haute intention locale (`Impression Stickers & Autocollants Vinyle Montreal`, `Agence Web & Creation Site Internet Montreal`, etc).
  * `JSON-LD` enrichi par slug : `Service` schema avec `serviceType`, `category`, `keywords`, `audience`, `priceRange`, `AggregateOffer` (lowPrice/highPrice CAD), `OfferCatalog` des sous-services.
  * `LocalBusiness` schema dans `index.html` avec adresse 5338 rue Marquette, telephone, openingHoursSpecification, hasMap Google Maps.
  * Sitemap dynamique genere par le backend (`GET /api/sitemap.xml`) avec lastmod par artiste.
  * `react-helmet-async` pour les balises per-page (canonical, Open Graph, Twitter Card).

### 💳 2. Vente & Facturation

* **Stripe Checkout live** : creation de session avec recalcul serveur des prix (jamais de confiance dans le frontend), `idempotencyKey` pour resister aux double-soumissions, webhook `/api/webhooks/stripe` pour transitions automatiques `pending` -> `paid`.
* **Stripe Payment Links** generes a la demande (commandes manuelles, B2B, recovery) avec retry loop sur conflit unique.
* **Factures PDF** generees cote frontend avec `jsPDF` + `jspdf-autotable` : entete adresse atelier, taxes ventilees TPS 5% / TVQ 9.975% (numeros NEQ), total TTC, footer reglementaire.
* **Backup JSON manuel** : export complet des commandes / factures / clients en un clic depuis l'admin.
* **Recovery one-click** : regeneration manuelle d'un Stripe Payment Link sur les commandes pending dont la creation initiale avait echoue (Stripe down, race condition, deploy mid-flight).
* **Reconciliation Stripe** : endpoint `/orders/reconcile-stripe` qui matche les paiements Stripe orphelins avec les commandes en pending.
* **PayPal** : utilise uniquement pour les **payouts de commissions artistes** (pas pour le checkout client).

### 📦 3. Portail Client (Service)

* **Page de suivi publique securisee** `/suivi` (alias `/tracking`) :
  * Form a 2 inputs (orderId + email), auto-prefill et auto-submit via query params `?id=X&email=Y` (lien insere dans tous les emails post-paiement).
  * Backend `GET /api/orders/track` : double cle `orderId+email` matchant, 404 generique pour empecher l'enumeration des emails clients, log audit masque (`abcd***`).
  * **Timeline visuelle a 5 etapes** : Recue (draft/pending) -> Payee (paid) -> En production (processing) -> Prete/Expediee (ready/shipped) -> Livree (delivered). L'etape active pulse en couleur d'accent.
  * Cas terminaux negatifs (`cancelled`/`refunded`) : bandeau rouge avec `XCircle`, message dedie.
  * Reponse minimale (status + dates uniquement), aucune donnee sensible exposee.
* **🔁 Reorder en 1 clic** :
  * Bouton `Recommander a l'identique (Reprint)` visible uniquement si la commande est `delivered`.
  * Backend `POST /api/orders/reorder` : meme double cle de securite, gate `status='delivered'` (409 si non eligible), throttle in-memory `1/60s/email` (429 avec `retryAfter`).
  * Clone : items, totaux, taxes, adresse, files (relation media). Nouveaux uniques generes, status force a `pending`, notes prefixees `[REORDER]`.
  * UI : 4 etats (idle / loading / success / error) avec bandeau vert qui affiche la nouvelle reference de commande.

### 📊 4. Back-Office (Admin)

* **Money Board** (tour de controle financiere et commerciale) :
  * Endpoint `GET /api/admin/stats` (`requireAdminAuth`) avec 4 buckets SQL paralleles (`Promise.all`), bornes mois en TZ Montreal (`America/Toronto`), comparaison MoM automatique.
  * 4 KPIs visuels au-dessus de la liste des commandes :
    * 💰 **CA du mois** (vert) - `SUM(total) WHERE status='paid'` - cents.
    * ⏳ **A encaisser** (orange) - `SUM(total) WHERE status IN (pending, draft, processing)`.
    * 📥 **Nouveaux leads** (sky) - `COUNT(contact_submissions)` du mois.
    * 📦 **Commandes actives** (purple, snapshot) - `COUNT(orders) WHERE status NOT IN (delivered, cancelled, refunded)`.
  * Chaque carte affiche un trend `+X% vs mois dernier` (null si previous = 0 pour eviter Infinity).
  * Refetch auto sur changement de filtre + apres mutation (delete, manual create).
* **Liste des commandes** :
  * Tri logique par priorite de status (pending > paid > processing > ready > shipped > delivered > cancelled > refunded).
  * Mise en surbrillance de l'accordeon actif, chevron rotatif.
  * Filtres + recherche debounced, pagination cote serveur, polling silencieux toutes les 30s.
* **Modale de changement de statut** :
  * Apercu du courriel client (sujet + corps tri-langue) avant envoi.
  * Choix explicite admin : `Avec courriel` (sendEmail=true) ou `Sans courriel` (mise a jour silencieuse).
  * Box d'apercu en style "vraie lettre" (fond creme, bordure douce, padding genereux).
* **Modale d'envoi de facture** :
  * Generation de lien Stripe in-place si manquant, avec animation pulse orange tant que pas genere.
  * Section Stripe conditionnelle selon le status (pending/draft requierent un lien, post-paiement non).
  * Bouton confirmer desactive tant que le lien n'est pas genere (anti-erreur fantome).
* **Edition de sous-total** avec auto-recalc TPS/TVQ/total, validation cote backend (recalcul serveur, jamais de confiance dans le client).
* **Workflow d'emails transactionnels automatises** (declenches par changement de statut + toggle admin) :

| Statut | Email envoye | Helper |
|---|---|---|
| `paid` | Confirmation de commande + facture PDF | `sendOrderConfirmationEmail` |
| `ready` | Commande prete a recuperer (cueillette locale ou boite securisee) | `sendOrderReadyEmail` |
| `shipped` | Numero de suivi colis + lien transporteur | `sendTrackingEmail` |
| `delivered` | **Remerciement + demande d'avis Google** (fire-and-forget) | `sendOrderDeliveredEmail` |
| Manuel (admin) | Envoi de facture (PDF + lien Stripe si requis) | `sendInvoiceEmail` |

* Tous les emails post-paiement embarquent un **bouton "Suivre l'avancement de ma commande"** qui pointe vers `/suivi?id=X&email=Y` pre-rempli.

### ⭐ 5. Croissance & Preuve sociale

* **Demande automatique d'avis Google** sur transition `delivered` :
  * Sujet : `Votre projet avec Massive Medias : Votre avis compte ! 🤘`
  * Copy avec **prenom uniquement** (`nom.split(' ')[0]`) pour un ton chaleureux.
  * **Bouton CTA rose massif** (#FF52A0, padding genereux, shadow rose) pointant directement vers la fiche Google My Business : `https://g.page/r/CWPO3peuM-5nEBM/review` (avis en un clic).
  * Note de bas : `En tant que studio independant a Montreal, chaque avis nous aide enormement a faire grandir l'atelier.`
* **Demarrage en mode fire-and-forget** : pas d'`await` -> reponse admin instantanee, erreurs Resend juste loguees (non bloquant).
* **Sous-domaines artistes** (en cours) : `slug.massivemedias.com` -> page artiste dedie via Cloudflare Worker `og-worker` qui personnalise les balises OG.

---

## 🏗️ Architecture technique

```
massivemedias/
├── frontend/                # React 19 + Vite 7 + Tailwind 4
│   ├── src/
│   │   ├── pages/          # AdminOrders, Tracking, ServiceDetail, Home, Contact...
│   │   ├── components/     # SEO, StatusChangeModal, FileUpload, KPI cards...
│   │   ├── components/seo/ # schemas.js (Organization, LocalBusiness, Service...)
│   │   ├── data/           # services.js / -en.js / -es.js (SSOT trilingue)
│   │   ├── services/       # adminService, api (axios), artistService
│   │   ├── contexts/       # CartContext, AuthContext, NotificationContext
│   │   ├── i18n/           # LanguageContext, ThemeContext
│   │   └── layouts/        # MainLayout (HelmetProvider + Header + Footer)
│   ├── public/images/      # full res 1600px webp
│   └── public/images/thumbs/  # 800px webp (thumb() fallback)
│
├── backend/                 # Strapi v5 (headless CMS)
│   ├── src/api/
│   │   ├── order/          # routes/custom-order.ts + controllers/order.ts (~4000 LOC)
│   │   ├── contact-submission/
│   │   ├── client/, artist/, testimonial/, expense/, invoice/, ...
│   ├── src/utils/
│   │   ├── email.ts        # Templates Resend (16+ helpers send*)
│   │   ├── auth.ts         # requireAdminAuth (SEC-01)
│   │   ├── google-drive.ts # Upload OAuth2 + lien permanent
│   │   └── pricing-config.ts  # Source de verite des prix (mirroir frontend)
│   └── dist/               # Compiled TS (committe pour Render auto-deploy)
│
├── cloudflare-worker/       # OG dynamique + proxy artist subdomains
├── scripts/                 # reconcile-stripe, drive-upload, og-images, ...
├── _old/                    # Ancien site (archive)
└── .github/workflows/       # CI/CD GitHub Actions (deploy GitHub Pages)
```

### 📦 Stack technique

| Composant | Technologie |
|---|---|
| Frontend | React 19, Vite 7, Tailwind CSS 4, Framer Motion |
| SEO | `react-helmet-async`, JSON-LD inline + per-page |
| HTTP client | axios |
| PDF | jsPDF + jspdf-autotable (factures) |
| Icons | lucide-react |
| Backend | Strapi v5, Node.js 20+, TypeScript |
| ORM / DB | Knex.js + PostgreSQL (prod) / SQLite (dev) |
| Auth | Supabase Auth (JWT), `requireAdminAuth` middleware backend |
| Paiements | Stripe Checkout + Payment Links (live) |
| Stockage | Supabase Storage (WebP affichage) + Google Drive (originaux HD) |
| Emails | Resend (templates HTML, BCC admin auto) |
| Traduction | DeepL API (pour le contenu CMS multi-langue) |
| Images | Sharp (WebP, compression, thumbs) |
| Hosting frontend | GitHub Pages + Cloudflare (DNS, SSL, CDN, Worker OG) |
| Hosting backend | Render.com (Standard plan, 1 CPU / 2GB RAM) |

### 🔐 Architecture des routes API

Le backend Strapi expose deux familles de routes, separees par leur niveau d'auth :

#### Routes publiques (auth: false) avec garde double cle ou rate-limit

| Methode | Path | Description | Securite |
|---|---|---|---|
| `POST` | `/orders/create-checkout-session` | Demarre un checkout Stripe | recalcul serveur des prix |
| `POST` | `/webhooks/stripe` | Webhook Stripe (paid/refund) | signature HMAC verifiee |
| `GET` | `/orders/track` | Portail public de suivi | double cle orderId+email |
| `POST` | `/orders/reorder` | Reorder 1-clic | double cle + gate delivered + throttle 1/60s/email |
| `GET` | `/sitemap.xml` | Sitemap SEO dynamique | cache 1h |
| `GET` | `/pricing-config` | Prix publics (boutique) | non sensible |
| `POST` | `/contact-submissions` | Soumission formulaire | honeypot + delai + escapeHtmlAttr |

#### Routes admin (`requireAdminAuth` dans le controller, route `auth: false`)

| Methode | Path | Description |
|---|---|---|
| `GET` | `/orders/admin` | Liste paginee des commandes |
| `PUT` | `/orders/:documentId/status` | Change le status + envoie email conditionnel |
| `PUT` | `/orders/:documentId/total` | Edition du sous-total avec recalc taxes |
| `POST` | `/orders/manual` | Creation d'une commande manuelle (B2B) |
| `POST` | `/orders/admin-create` | Creation admin avec invoice + Stripe link |
| `GET` | `/admin/stats` | KPIs Money Board (current vs previous month) |
| `GET` | `/orders/stats` | Stats comptables annuelles |
| `GET` | `/orders/clients` | Liste clients agreges |
| `GET` | `/orders/commissions` | Calcul commissions artistes |
| `POST` | `/orders/:documentId/regenerate-stripe-link` | Recovery lien Stripe |
| `POST` | `/orders/:documentId/send-invoice` | Envoi facture par email (PDF + Stripe) |

### 🔌 Services tiers integres

* **Stripe** (live) - checkout sessions, payment links, webhooks. Cles `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` sur Render.
* **Resend** - emails transactionnels avec BCC automatique sur `massivemedias@gmail.com` pour visibilite admin. Templates HTML inline avec wrapper `massiveEmailWrapper`.
* **Google Drive API** - OAuth2 service account, dossier dedie par artiste, lien `webContentLink` permanent stocke en DB.
* **Supabase** - Auth (JWT verifies cote backend) + Storage (WebP optimises pour le rendu boutique).
* **DeepL** - traduction automatique du contenu CMS lors d'une creation FR (helpers `bl()` et fallback hardcoded data).
* **Cloudflare** - DNS + SSL + CDN + 1 Worker `og-worker` pour personnaliser les balises OG par artiste sur les sous-domaines.

---

## 🔄 Workflows principaux

### 📦 Cycle de vie d'une commande

```
1. 🌐 Acquisition
   └─ Visite /services/stickers (SEO local)
      └─ Configurator -> Cart -> Checkout

2. 💳 Paiement
   └─ POST /orders/create-checkout-session
      ├─ Recalcul serveur des prix (anti-tampering)
      ├─ Creation Stripe Session (idempotencyKey)
      └─ Order cree en status='pending'
   └─ Stripe redirige vers Checkout
      └─ Webhook /webhooks/stripe (signature HMAC)
         └─ status: pending -> paid
            └─ 📧 sendOrderConfirmationEmail
               └─ Email avec PDF facture + bouton "Suivre ma commande"
                  (pointe vers /suivi?id=X&email=Y)

3. 🏭 Production
   └─ Admin passe a 'processing' (avec ou sans email)

4. ✅ Pret / Expedie
   ├─ Statut 'ready'   -> 📧 sendOrderReadyEmail (cueillette locale)
   └─ Statut 'shipped' -> 📧 sendTrackingEmail (no de tracking + carrier)

5. 📍 Suivi cote client
   └─ /suivi?id=X&email=Y
      ├─ Form auto-preremplie + auto-submit
      ├─ Timeline 5 etapes avec etape active qui pulse
      └─ GET /orders/track (double cle, reponse minimale)

6. 🎯 Livre
   └─ Statut 'delivered'
      └─ 📧 sendOrderDeliveredEmail (fire-and-forget)
         ├─ Sujet : "Votre avis compte ! 🤘"
         ├─ CTA rose massif -> Google My Business
         └─ Note "studio independant a Montreal"

7. 🔁 (Optionnel) Reorder
   └─ Bouton "Recommander a l'identique" sur /suivi
      └─ POST /orders/reorder
         ├─ Gate status='delivered'
         ├─ Throttle 1/60s/email
         ├─ Clone items + totaux + adresse + files
         └─ Nouvelle commande en status='pending'
            (l'admin reissue la facture via le panneau admin)

📊 A chaque etape, le Money Board se met a jour automatiquement
   (refetch sur filter change + apres mutations).
```

### 📨 Cycle de vie d'un lead (formulaire de contact)

```
1. Visite /contact
   └─ Form qualifie (budget, urgence, service, message, fileLink Google Drive)
      ├─ Honeypot anti-spam (champ cache)
      ├─ Delai d'affichage minimal (anti-bot)
      └─ POST /contact-submissions
         ├─ escapeHtmlAttr cote backend
         ├─ Status default 'new'
         └─ 2 emails parallels :
            ├─ 📧 sendNewContactNotificationEmail (admin)
            └─ 📧 sendAutoReplyToProspect (client)

2. Reception cote admin
   └─ Money Board : "Nouveaux leads" incremente
   └─ Visible dans le panneau /admin/messages
      ├─ Tri par status (new -> read -> replied -> archived)
      └─ Reponse en 1 clic via sendContactReplyEmail
```

---

## 🚀 Deploiement

### Frontend - GitHub Pages + Cloudflare

* Push sur `main` -> GitHub Action build (`vite build`) -> deploy `gh-pages`.
* Cloudflare en front : DNS + SSL + CDN + Worker `og-worker` pour la personnalisation OG des sous-domaines artistes.
* Domaine : `massivemedias.com` (CNAME vers `massivemedias.github.io`, proxie Cloudflare actif).
* CI : `.github/workflows/deploy.yml`.

### Backend - Render.com

* Service `massivemedias-api` - Plan **Standard** (25$/mois, 1 CPU / 2GB RAM).
* Auto-deploy sur push `main` (~5 min de build TypeScript + Strapi).
* `backend/dist/` est **committe** pour eviter les compilations cote Render (les tsbuildinfo + JS compiles font partie du repo).
* Healthcheck : `GET /api/orders/memory-health`.
* PostgreSQL provisionne par Render (env `DATABASE_URL`).

### 🔐 Variables d'environnement critiques (Render)

```env
# Strapi core
HOST=0.0.0.0
PORT=10000
APP_KEYS=...
ADMIN_JWT_SECRET=...
JWT_SECRET=...
NODE_VERSION=20

# Database
DATABASE_URL=postgres://...

# Email (Resend)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=hello@massivemedias.com
ADMIN_BCC_EMAIL=massivemedias@gmail.com  # BCC auto sur tous les transactionnels

# Stripe (live)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...

# Google Drive (OAuth2 service account)
GOOGLE_DRIVE_CLIENT_EMAIL=...
GOOGLE_DRIVE_PRIVATE_KEY=...

# DeepL (traduction CMS)
DEEPL_API_KEY=...

# Site URL (pour les liens dans les emails)
SITE_URL=https://massivemedias.com
```

---

## 🛠️ Developpement local

```bash
# Frontend
cd frontend
npm install
npm run dev          # Vite dev server sur http://localhost:5173

# Backend (autre terminal)
cd backend
npm install
npm run develop      # Strapi sur http://localhost:1337
```

* Admin Strapi : `http://localhost:1337/admin` (creer un compte au premier lancement).
* DB locale : SQLite dans `backend/.tmp/data.db` (par defaut).
* Verification TS avant push : `cd backend && npx tsc --noEmit`.

### 📐 Conventions

* **Pas de em dash** (`-`) - regular hyphens uniquement (`-`).
* **Commits en francais**, pattern `feat(scope):`, `fix(scope):`, `style(scope):`, `docs:`, `refactor(scope):`.
* **Communication** : francais informel (tu/toi).
* **Adresse facturation** (toujours) : Massive Medias, Michael Sanchez, 5338 rue Marquette, Montreal QC H2J 3Z3, NEQ 2269057891.
* **Images** : toujours dans `frontend/public/images/` (1600px WebP q80) **ET** `frontend/public/images/thumbs/` (800px WebP q75). Sinon `thumb()` retourne 404.

---

## 📋 Roadmap

* 🟡 NFT pieces uniques (certificat numerique pour les pieces uniques artiste).
* 🟡 Refonte du mega-menu Boutique (en attendant le merch Massive).
* 🟡 Sous-domaines artistes finalises (psyqu33n / mok / etc).
* 🟡 Sidebar sticky panneau admin/artiste.
* 🟡 Facture PDF dans le panneau client (bouton telecharger pour les commandes payees).

---

## 📄 Licence & contact

Projet proprietaire - Massive Medias Inc.

* **Site** : [massivemedias.com](https://massivemedias.com)
* **Email** : [massivemedias@gmail.com](mailto:massivemedias@gmail.com)
* **Atelier** : 5338 rue Marquette, Montreal QC H2J 3Z3
* **Instagram** : [@massivemedias](https://instagram.com/massivemedias)

---

🤖 Documente avec amour et un peu de TypeScript.
