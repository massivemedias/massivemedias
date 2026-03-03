# Prompt Claude - Configuration complete Supabase & Stripe

Copie-colle ce prompt dans Claude quand tu es dans le dashboard Supabase ou Stripe.

---

## PROMPT A COPIER :

Je suis le proprietaire du site massivemedias.com. J'ai besoin que tu verifies et configures TOUS les parametres de mon projet Supabase et de mon compte Stripe pour que l'authentification, la recuperation de mot de passe, les paiements et la gestion des utilisateurs fonctionnent parfaitement.

### Contexte technique :
- **Frontend** : React + Vite, deploye sur GitHub Pages a https://massivemedias.com
- **Backend** : Strapi v5.36.1 sur Render (URL dynamique via RENDER_EXTERNAL_URL)
- **Auth** : Supabase Auth (login, register, password reset)
- **Paiements** : Stripe (PaymentIntents API, webhook) - SDK v20.3.1 backend, @stripe/stripe-js v8.7.0 + @stripe/react-stripe-js v5.6.0 frontend
- **Storage** : Supabase Storage (bucket `order-files`)
- **Supabase Project URL** : https://jmpznduhnbcqyyznsyhe.supabase.co
- **Devise** : CAD (dollars canadiens)
- **Admin Strapi** : accessible a `/mm-admin`

---

## 1. SUPABASE - Authentication Settings

Verifie et configure dans **Authentication > URL Configuration** :

- **Site URL** : `https://massivemedias.com`
- **Redirect URLs** (ajouter toutes ces URLs) :
  - `https://massivemedias.com/login`
  - `https://massivemedias.com/account`
  - `https://massivemedias.com/**`
  - `http://localhost:3000/login` (dev)
  - `http://localhost:3000/**` (dev)
  - `http://localhost:5173/login` (dev Vite)
  - `http://localhost:5173/**` (dev Vite)

Mon code de reset password utilise ce redirect :
```javascript
redirectTo: `${window.location.origin}/login`
```

Donc en production ca redirige vers `https://massivemedias.com/login`.

---

## 2. SUPABASE - Email Settings (CRITIQUE)

Le probleme principal : **les emails de recuperation de mot de passe ne sont pas recus**.

### Option A - Email Supabase natif (rapide) :
Dans **Authentication > Email Templates**, verifie :
- **Confirm signup** : template actif avec le bon lien `{{ .ConfirmationURL }}`
- **Reset password** : template actif avec le bon lien `{{ .ConfirmationURL }}`
- **Magic link** : peut etre desactive si non utilise

Dans **Authentication > Providers > Email** :
- **Enable Email** : ON
- **Confirm email** : tu peux le mettre OFF pour simplifier (les users peuvent se connecter sans confirmer)
- **Double confirm email changes** : OFF
- **Secure email change** : ON

### Option B - SMTP custom (recommande pour la fiabilite) :
Dans **Project Settings > Auth > SMTP Settings** :
- Configure un SMTP comme Gmail, SendGrid, Resend, ou Mailgun
- Exemple avec Gmail :
  - SMTP Host: `smtp.gmail.com`
  - SMTP Port: `587`
  - SMTP User: ton email Gmail
  - SMTP Pass: un App Password (pas ton mot de passe Gmail)
  - Sender email: `info@massivemedias.com` ou ton Gmail

**IMPORTANT** : Le plan gratuit Supabase est limite a 3-4 emails par heure. Pour un site en production, configure un SMTP custom.

### Rate Limits :
Dans **Authentication > Rate Limits** :
- Verifie que le rate limit pour les emails n'est pas trop restrictif
- Rate limit recommande : au moins 10 emails/heure

---

## 3. SUPABASE - Auth Providers

Dans **Authentication > Providers** :
- **Email** : ACTIVE (c'est le seul provider utilise)
- Tous les autres providers (Google, GitHub, etc.) : peuvent rester desactives sauf si tu veux les ajouter

---

## 4. SUPABASE - Storage

Dans **Storage** :
- Verifie que le bucket `order-files` existe
- Si non, cree-le avec :
  - Nom : `order-files`
  - Public : OUI (pour que les URLs soient accessibles)
  - Max file size : 50 MB

### Types de fichiers acceptes (MIME types) :
```
image/png, image/jpeg, image/tiff, image/svg+xml, image/webp,
application/pdf, application/postscript, application/illustrator,
image/vnd.adobe.photoshop
```

### Extensions acceptees :
PNG, JPEG, TIFF, SVG, WebP, PDF, AI, EPS, PSD

### Upload specs :
- Max 5 fichiers par upload
- Path dans le bucket : `orders/{timestamp}-{nomFichier}`
- Les URLs publiques sont stockees dans le JSON de la commande

### Policies RLS du bucket `order-files` :
- **SELECT** (read) : `true` (public)
- **INSERT** (upload) : `true` (tout le monde peut uploader - c'est pour les commandes)
- **UPDATE** : `false`
- **DELETE** : `auth.uid() IS NOT NULL` (seulement les users connectes)

---

## 5. SUPABASE - Database (RLS Policies)

Verifie que les Row Level Security (RLS) policies ne bloquent rien pour l'auth :

Table `auth.users` - c'est gere automatiquement par Supabase, ne touche pas.

Si tu as des tables custom liees aux users, assure-toi que les policies permettent l'acces.

---

## 6. SUPABASE - Project Settings

Dans **Project Settings > General** :
- **Project Name** : Massive Medias (ou similaire)

Dans **Project Settings > API** :
- Note le **Project URL** : `https://jmpznduhnbcqyyznsyhe.supabase.co`
- Note le **anon/public key** : doit correspondre a ce qui est dans le frontend
- Note le **service_role key** : NE JAMAIS l'exposer cote frontend

---

## 7. STRIPE - Dashboard Configuration

Dans le dashboard Stripe (https://dashboard.stripe.com) :

### Mode Test vs Live :
- Actuellement en mode **TEST** (les cles commencent par `pk_test_` et `sk_test_`)
- Pour passer en production : activer le mode Live et remplacer les cles

### Webhooks (CRITIQUE - pas encore configure) :
Dans **Developers > Webhooks** :
- **Ajouter un endpoint** :
  - **URL** : `https://[TON-URL-RENDER]/api/webhooks/stripe`
    (remplace [TON-URL-RENDER] par l'URL de ton backend sur Render, ex: `https://massivemedias-backend.onrender.com`)
  - **Events a ecouter** (selectionner exactement ces 2 events) :
    - `payment_intent.succeeded`
    - `payment_intent.payment_failed`
  - **Copie le Webhook Signing Secret** (`whsec_...`) et mets-le dans la variable d'environnement `STRIPE_WEBHOOK_SECRET` sur Render

### Verification du webhook :
Le backend verifie la signature avec :
```javascript
stripe.webhooks.constructEvent(rawBody, sig, endpointSecret)
```
Le raw body est recupere via `ctx.request.body[Symbol.for('unparsedBody')]` (configure dans le middleware Strapi avec `includeUnparsed: true`).

### Cles API :
Dans **Developers > API Keys** :
- **Publishable key** (`pk_test_...`) : doit etre dans le frontend (.env et GitHub Secrets)
- **Secret key** (`sk_test_...`) : doit etre UNIQUEMENT dans le backend (variable d'environnement sur Render)

### Payment Methods :
Dans **Settings > Payments > Payment methods** :
- Le code utilise `automatic_payment_methods: { enabled: true }`
- Ca active automatiquement : cartes, Apple Pay, Google Pay, et autres methodes disponibles au Canada
- Verifie que les methodes suivantes sont activees dans le dashboard :
  - **Cards** (Visa, Mastercard, Amex)
  - **Apple Pay** (si tu veux)
  - **Google Pay** (si tu veux)

### Branding Stripe Checkout :
Dans **Settings > Branding** :
- Tu peux personnaliser le logo et les couleurs (optionnel)
- Le formulaire de paiement utilise le theme custom suivant :
  ```
  theme: 'night'
  colorPrimary: '#e91e8c' (rose Massive Medias)
  colorBackground: '#1a1a2e' (bleu nuit)
  colorText: '#e4e4f0'
  borderRadius: '8px'
  ```

---

## 8. STRIPE - Flow de paiement complet (reference technique)

### Etape 1 : Panier (CartContext)
- Stockage : `localStorage` cle `'massive-cart'`
- Structure d'un item :
  ```json
  {
    "productId": "stickers-custom",
    "productName": "Stickers personnalises",
    "image": "/images/stickers/custom.webp",
    "quantity": 100,
    "unitPrice": 0.35,
    "totalPrice": 35,
    "finish": "mat",
    "shape": "rond",
    "size": "3x3",
    "uploadedFiles": [{"id": "...", "name": "design.pdf", "url": "https://...", "size": 1024, "mime": "application/pdf"}]
  }
  ```

### Etape 2 : Checkout - Formulaire client
- **Champs requis** : nom, email, adresse, ville, province (dropdown), code postal
- **Champs optionnels** : telephone, message/notes, design pret (oui/non)
- **Province** : dropdown des 13 provinces/territoires canadiens, defaut 'QC'
- **Code postal** : max 7 caracteres, converti en majuscules

### Etape 3 : Calculs (serveur + client)
Les calculs sont faits cote client pour l'affichage ET recalcules cote serveur pour la securite.

**Sous-total** : somme de tous les `item.totalPrice`

**Livraison** :
| Destination | Tarif |
|---|---|
| Montreal (code postal commence par 'H') | Gratuit ($0) |
| Reste du Quebec (province = QC) | $15 |
| Reste du Canada | $25 |

**Taxes canadiennes** :
| Taxe | Taux | Ou |
|---|---|---|
| TPS (GST) | 5% du sous-total | Partout au Canada |
| TVQ (QST) | 9.975% du sous-total | Quebec seulement |

**Total** : sous-total + livraison + TPS + TVQ

### Etape 4 : Creation du PaymentIntent (serveur)
- **Route** : `POST /api/orders/create-payment-intent`
- **Auth** : publique (pas de token requis)
- Le serveur recalcule tout (jamais confiance aux montants du client)
- PaymentIntent cree avec :
  ```javascript
  stripe.paymentIntents.create({
    amount: totalEnCents, // total * 100
    currency: 'cad',
    automatic_payment_methods: { enabled: true },
    metadata: { customerEmail, customerName, supabaseUserId, itemCount, shippingProvince, shippingCity }
  })
  ```
- Retourne : `{ clientSecret: "pi_...secret_..." }`

### Etape 5 : Paiement (frontend)
- Le formulaire utilise `<PaymentElement layout="tabs" />`
- Confirmation :
  ```javascript
  stripe.confirmPayment({
    elements,
    confirmParams: { return_url: `${window.location.origin}/checkout/success` }
  })
  ```
- Succes : redirect vers `/checkout/success?payment_intent={id}`
- Erreur : affiche le message d'erreur sur place

### Etape 6 : Webhook (serveur)
- **Route** : `POST /api/webhooks/stripe`
- `payment_intent.succeeded` :
  - Trouve la commande par `stripePaymentIntentId`
  - Met a jour le statut : `pending` -> `paid`
  - Met a jour le Client CRM : `totalSpent` += montant, `orderCount` += 1, `lastOrderDate` = aujourd'hui
- `payment_intent.payment_failed` :
  - Trouve la commande par `stripePaymentIntentId`
  - Met a jour le statut : `pending` -> `cancelled`

### Statuts de commande :
`pending` -> `paid` -> `processing` -> `shipped` -> `delivered`
(ou `pending` -> `cancelled` si paiement echoue)

---

## 9. STRIPE - Schema de la commande dans Strapi

Collection type `Commande` (api::order.order) :

| Champ | Type | Description |
|---|---|---|
| `stripePaymentIntentId` | string (unique, requis) | ID du PaymentIntent Stripe |
| `customerEmail` | email (requis) | Email du client (lowercase) |
| `customerName` | string (requis) | Nom complet du client |
| `customerPhone` | string | Telephone (optionnel) |
| `supabaseUserId` | string | ID utilisateur Supabase (optionnel) |
| `items` | JSON | Array des items du panier avec fichiers |
| `subtotal` | integer | Sous-total en cents |
| `shipping` | integer | Frais de livraison en cents |
| `tps` | integer | TPS en cents |
| `tvq` | integer | TVQ en cents |
| `total` | integer | Total en cents |
| `currency` | string | 'cad' |
| `status` | enum | pending/paid/processing/shipped/delivered/cancelled |
| `designReady` | boolean | Le design est pret (default: true) |
| `notes` | text | Notes du client |
| `shippingAddress` | JSON | {address, city, province, postalCode} |
| `client` | relation | Lien vers le Client CRM |

**IMPORTANT** : Tous les montants sont stockes en CENTS (integer), pas en dollars.

---

## 10. STRIPE - Schema Client CRM dans Strapi

Collection type `Client` (api::client.client) :

| Champ | Type | Description |
|---|---|---|
| `email` | email (unique, requis) | Email du client |
| `name` | string | Nom du client |
| `phone` | string | Telephone |
| `supabaseUserId` | string | Lien vers Supabase Auth |
| `totalSpent` | decimal | Total depense en dollars |
| `orderCount` | integer | Nombre de commandes |
| `lastOrderDate` | date | Date de la derniere commande |
| `notes` | text | Notes admin |
| `orders` | relation (one-to-many) | Commandes du client |

Le client est cree automatiquement lors de la premiere commande (recherche par email, cree si inexistant).

---

## 11. TOUTES LES ROUTES API BACKEND

### Routes commandes (backend/src/api/order/routes/) :

| Methode | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/orders/create-payment-intent` | Non | Cree un PaymentIntent + commande |
| POST | `/api/webhooks/stripe` | Non | Webhook Stripe (verifie signature) |
| GET | `/api/orders/my-orders?supabaseUserId={id}` | Non | Commandes d'un utilisateur |
| POST | `/api/orders/upload` | Non | Upload de fichiers |
| GET | `/api/orders/clients` | Non | Liste CRM clients |
| GET | `/api/orders/stats` | Non | Analytics (revenus, depenses, taxes, profit) |

### Middleware CORS :
Origins autorises :
```
http://localhost:3000
http://localhost:5173
https://massivemedias.com
https://www.massivemedias.com
```

---

## 12. RENDER - Variables d'environnement Backend

Sur Render (https://dashboard.render.com), dans les settings du service backend :

### Variables OBLIGATOIRES :
| Variable | Valeur | Notes |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_...` ou `sk_live_...` | Cle secrete Stripe |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Secret du webhook (PAS `whsec_REPLACE_ME`) |
| `HOST` | `0.0.0.0` | |
| `PORT` | `1337` | |
| `APP_KEYS` | (deja configure) | |
| `API_TOKEN_SALT` | (deja configure) | |
| `ADMIN_JWT_SECRET` | (deja configure) | |
| `JWT_SECRET` | (deja configure) | |
| `DATABASE_CLIENT` | `postgres` | PostgreSQL pour production |
| `DATABASE_URL` | (URL PostgreSQL Render) | Fourni par Render si DB attachee |
| `ADMIN_EMAIL` | `massivemedias@gmail.com` | Email admin Strapi |
| `ADMIN_PASSWORD` | `Massive1423!!` | Password admin Strapi |
| `NODE_ENV` | `production` | |

---

## 13. GITHUB SECRETS - Frontend

Dans le repo GitHub, **Settings > Secrets and variables > Actions** :

| Secret | Valeur |
|---|---|
| `VITE_API_URL` | URL du backend Render (ex: `https://massivemedias-backend.onrender.com/api`) |
| `VITE_STRIPE_PUBLIC_KEY` | `pk_test_...` ou `pk_live_...` |
| `VITE_SUPABASE_URL` | `https://jmpznduhnbcqyyznsyhe.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Cle anon/public de Supabase |

---

## 14. PASSER EN PRODUCTION (Checklist)

### Stripe :
1. [ ] Activer le mode **Live** dans le dashboard Stripe
2. [ ] Recuperer les nouvelles cles Live (`pk_live_...` et `sk_live_...`)
3. [ ] Creer un nouveau webhook endpoint en mode Live avec la meme URL
4. [ ] Recuperer le nouveau `whsec_...` Live
5. [ ] Mettre a jour `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET` sur Render
6. [ ] Mettre a jour `VITE_STRIPE_PUBLIC_KEY` dans GitHub Secrets
7. [ ] Redeploy le frontend (GitHub Actions) et le backend (Render)

### Supabase :
1. [ ] Configurer SMTP custom pour les emails (Resend, SendGrid, ou Gmail App Password)
2. [ ] Verifier les Redirect URLs en production
3. [ ] Verifier le bucket `order-files`

### General :
1. [ ] Verifier que `DATABASE_CLIENT=postgres` sur Render (pas SQLite en prod)
2. [ ] Tester un paiement complet avec une vraie carte (petit montant)
3. [ ] Verifier le webhook dans Stripe Dashboard > Webhooks > Recent events

---

## 15. CARTES DE TEST STRIPE

| Carte | Comportement |
|---|---|
| `4242 4242 4242 4242` | Paiement reussi |
| `4000 0000 0000 0002` | Carte refusee |
| `4000 0025 0000 3155` | Authentification 3D Secure requise |
| `4000 0000 0000 9995` | Fonds insuffisants |

Date d'expiration : n'importe quelle date future. CVC : n'importe quel 3 chiffres.

---

## 16. CE QUI N'EST PAS ENCORE IMPLEMENTE

Ces fonctionnalites ne sont PAS encore dans le code mais pourraient etre ajoutees :

1. **Emails de confirmation de commande** - Aucun service email configure cote backend. Le client ne recoit pas de confirmation apres paiement.
2. **Notifications admin** - L'admin n'est pas notifie quand une nouvelle commande arrive. Il doit verifier dans Strapi manuellement.
3. **Gestion d'inventaire automatique** - Les quantites en stock ne sont pas decrementees automatiquement apres un achat.
4. **Remboursements** - Pas de route pour initier un remboursement depuis Strapi. Doit se faire manuellement dans le dashboard Stripe.
5. **Factures/recus** - Pas de generation de facture PDF.
6. **Codes promo / coupons** - Pas implemente.

---

## RESUME DES ACTIONS CRITIQUES (par priorite) :

1. **Webhook Secret Stripe** : Creer le webhook dans Stripe Dashboard et remplacer `whsec_REPLACE_ME` par le vrai secret sur Render
2. **SMTP Email** : Configurer un SMTP dans Supabase pour que les emails de recuperation fonctionnent
3. **Redirect URLs** : Ajouter `https://massivemedias.com/**` dans Supabase Auth
4. **Storage bucket** : Verifier que `order-files` existe et est public avec les bonnes policies
5. **Variables Render** : S'assurer que toutes les variables d'environnement sont presentes
6. **GitHub Secrets** : S'assurer que les 4 secrets frontend sont configures
7. **Tester le flow complet** : inscription > connexion > reset password > ajout panier > checkout > paiement > verification webhook
