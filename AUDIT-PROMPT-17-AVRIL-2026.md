# AUDIT PROMPT — Vérification du travail de Claude (session 17-18 avril 2026)

**Destinataire**: autre IA (Claude, GPT, Gemini, ou autre LLM senior)
**Mission**: auditer de façon indépendante le travail livré par Claude ce soir sur le codebase Massive Medias, dans le but d'identifier toute erreur, omission, faille de sécurité, bug résiduel, ou mauvaise pratique qui pourrait coûter cher en production.
**Langue de la réponse attendue**: français (informal, tu). Pas d'em-dash (`—` interdit, utiliser `-`). Pas de formules de politesse.

---

## 0. TON RÔLE D'AUDITEUR

Tu es un ingénieur senior full-stack (TypeScript/Node/React/Postgres/Strapi/Stripe) indépendant. Tu n'as **aucun intérêt** à ménager Claude: tu dois trouver tout ce qui cloche. L'utilisateur (Michael Sanchez, Massive Medias) a perdu ~2000$ aujourd'hui à cause de bugs non détectés et d'un mauvais diagnostic de Claude. Il a besoin que **tu confirmes ce qui est solide** et que **tu alertes sur ce qui reste fragile ou mal fait**.

Ton livrable attendu:
1. **Verdict global** par thème (OK / À CORRIGER / CRITIQUE)
2. **Liste précise des problèmes** avec file:line et recommandation
3. **Commandes de test** concrètes pour valider en prod
4. **Risques non adressés** que Claude n'a pas mentionnés
5. **Quick wins** supplémentaires <30 min à mettre en place

---

## 1. CONTEXTE DE LA SITUATION

### 1.1 Stack

- **Backend**: Strapi v5 (TypeScript), hébergé sur Render plan Standard (1 CPU / 2GB RAM, 25$/mois, PAS free tier). URL prod: `https://massivemedias-api.onrender.com`. Ne dort PAS. Admin: `/mm-admin`.
- **Frontend**: React + Vite, trilingue FR/EN/ES, déployé sur GitHub Pages derrière Cloudflare (DNS + Worker). URL prod: `https://massivemedias.com`
- **Paiements**: Stripe Checkout (mode `live`, vraies transactions)
- **Uploads**: Supabase Storage (WebP) + Google Drive (originaux haute-def)
- **Emails**: Resend
- **DB**: PostgreSQL sur Render

### 1.2 Les incidents du 17 avril 2026

1. **Cliente Jade (~2000$)**: n'a pas pu uploader son fichier (PDF/JPEG). A abandonné. Cause réelle non identifiée immédiatement.
2. **Preview image cassée**: après upload, affichage d'une icône broken + alt text en texte géant dans le configurateur stickers.
3. **Miniatures panier cassées**: `blob:` URLs mortes après navigation/reload.
4. **Cliente Cindy (Psyqu33n)**: paiement Stripe `live` de 40,82$ passé mais commande restée en `status: draft` dans Strapi. Pas d'email de confirmation envoyé. 3 clients perdus au total sur cette même cause.

### 1.3 Faux diagnostic initial de Claude

Claude a supposé que le backend Render était sur **free tier** et que les symptômes (lenteur 30-60s) venaient du **cold start après 15 min de sleep**. Il a déployé plusieurs "pansements":
- Cloudflare Worker cron `*/5 * * * *` pour ping /api/artists
- Client-side fetch dans `main.jsx` au chargement
- GitHub Actions workflow `keep-alive.yml`

**L'utilisateur a ensuite corrigé Claude**: il paye Render **Standard** (25$/mois), donc le serveur ne dort pas. Le vrai problème est ailleurs - probablement des crashs OOM silencieux liés au parsing de gros fichiers uploadés. Claude a alors pivoté vers le vrai diagnostic et livré les fixes ci-dessous.

### 1.4 Bug webhook Stripe

Le `STRIPE_WEBHOOK_SECRET` sur Render contenait un `O` (lettre majuscule) là où Stripe avait un `0` (zéro). Probable origine: passage via capture d'écran / OCR. Résultat: depuis le 13 avril 2026, **6/8 webhooks échouaient en 400** (signature verification failed), mais **aucune alerte** n'existait dans le code. Cindy s'en est plaint 4 jours après. Corrigé ce soir par l'utilisateur lui-même (re-paste via bouton Copier officiel Stripe).

---

## 2. COMMITS À AUDITER

Les commits poussés ce soir sont sur `main` dans le repo `github.com/massivemedias/massivemedias`. Liste dans l'ordre chronologique:

| SHA | Titre | Périmètre |
|---|---|---|
| `6464c7d` | Fix urgent: ameliore messages d'erreur upload (debug client Jade) | `frontend/src/components/FileUpload.jsx` |
| `409a82f` | Fix DEFINITIF: backend Render toujours reveille (cron + client ping) | `cloudflare-worker/` + `frontend/src/main.jsx` |
| `fa0d7db` | Fix urgent: preview upload cassée (broken image + alt text geant) | `frontend/src/components/FileUpload.jsx` |
| `88b3afd` | Fix keep-alive: /api/site-contents (404) -> /api/artists (200) | `.github/workflows/keep-alive.yml` |
| `f41c9e4` | Fix CRITIQUE: miniatures sticker cassees dans le panier | `frontend/src/utils/stickerFx.js` + `Panier.jsx` |
| `827c86d` | Add Stripe reconciliation endpoint + hourly cron + Cindy fix script | `backend/src/api/order/` + `.github/workflows/reconcile-stripe.yml` + `scripts/reconcile-order-cindy.sh` + `RAPPORT-INCIDENTS-17-AVRIL-2026.md` |
| `877b283` | Admin orders: afficher le detail des packDetails (stickers a imprimer) | `frontend/src/pages/AdminOrders.jsx` |
| `4f5da39` | Fix affichage stickers: utiliser detail.qty (total deja calcule) et packComposition | `frontend/src/pages/AdminOrders.jsx` |
| `74de497` | updateStatus accepte invoiceNumber + autoInvoice + sendEmails optionnels | `backend/src/api/order/controllers/order.ts` |
| **`45d43ce`** | **Fix OOM + alerte webhook + memory health endpoint** | `backend/src/api/artist-edit-request/controllers/artist-edit-request.ts` + `order.ts` + `email.ts` + `google-drive.ts` + routes |
| **`b241e4e`** | **Node GC flags + resilience frontend (retry + banner backend down)** | `backend/package.json` + `frontend/src/utils/apiResilient.js` + `BackendHealthBanner.jsx` + `App.jsx` |

Les deux commits en gras (`45d43ce` et `b241e4e`) sont les fixes techniques majeurs demandés par l'utilisateur à la fin de la session, en réponse à son feedback "Ton dernier rapport d'incident est basé sur une erreur fondamentale d'analyse de l'infrastructure". Ce sont ceux à auditer en priorité.

---

## 3. LES 5 DEMANDES EXPLICITES DE L'UTILISATEUR

L'utilisateur a demandé, en fin de session, un audit de 5 points. Claude a répondu par du code + un plan. À toi de vérifier que chaque point est correctement traité.

### 3.1 Point 1 — ARRÊT DES PANSEMENTS

**Demande**: "Oublie tes crons Cloudflare pour garder le serveur réveillé. Le vrai problème est que l'application Strapi consomme trop de mémoire (RAM) et crash."

**Ce que Claude a fait**: reconnu, mais a laissé les "pansements" en place. A documenté quels fichiers peuvent être supprimés (`keep-alive.yml`) et quels sont neutres (`cloudflare-worker` cron, `main.jsx` ping) sans forcer leur suppression.

**À vérifier par toi**:
- Est-ce qu'un des pansements pourrait masquer un futur vrai bug (ex: cron réveille le serveur qui vient de crash → masque la gravité)?
- Le `cloudflare-worker/og-worker.js` contient-il toujours le `scheduled` handler qui ping Render? Si oui, est-ce vraiment sans danger?
- Le `main.jsx` fetch-at-boot peut-il devenir problématique dans certains scénarios (DNS blocking, CORS, CSP)?

### 3.2 Point 2 — INVESTIGATION DES CRASHS OOM

**Demande**: "Dis-moi exactement comment identifier les fuites de mémoire (OOM) dans les logs de Render. Est-ce le parsing des gros fichiers lors des uploads qui sature la RAM de mon instance Standard?"

**Ce que Claude a fait**:
- Listé 4 signatures log précises: `FATAL ERROR: Allocation failed`, `Ineffective mark-compacts near heap limit`, `killed by Render because memory usage exceeded`, `npm ERR! errno 137`
- Ajouté endpoint `GET /api/orders/memory-health` qui retourne `process.memoryUsage()` + calcul % du limite Render (2048 MB par défaut) + statut OK/WARNING/CRITICAL
- A confirmé que la cause racine probable est bien le parsing d'uploads (voir point 3)

**À vérifier par toi**:
- Les signatures log sont-elles les BONNES (vérifie sur les docs Node.js et Render)? Y en a-t-il d'autres importantes manquées?
- L'endpoint `memory-health` est-il bien exposé sans auth (diagnostic public)? Y a-t-il un risque de leak d'info sensible (PID, version Node, etc.)?
- `process.memoryUsage()` retourne-t-il bien RSS en bytes? Le calcul de conversion `/1024/1024` est-il correct?
- Le seuil `rssPct > 85 ? 'CRITICAL'` est-il pertinent vu que Render kill à 100%? 85% laisse 307MB de marge - suffisant?
- Le `renderMemLimitMB = 2048` est-il correct pour le plan Standard? Vérifie sur render.com/docs.

### 3.3 Point 3 — OPTIMISATION BACKEND

**Demande**: "Donne-moi le code exact pour optimiser l'utilisation de la mémoire de Strapi (ex: utiliser des streams pour les uploads au lieu de charger les fichiers en RAM, configurer le garbage collection de Node, etc.)"

**Ce que Claude a fait** (commit `45d43ce`):

**A. Upload streaming dans `backend/src/api/artist-edit-request/controllers/artist-edit-request.ts`**:
- Suppression de `fs.readFileSync(filepath)` (chargeait tout en RAM)
- `sharp(filepath, { limitInputPixels: 100_000_000 }).resize().webp().toFile(tmpWebp)` au lieu de `.toBuffer()`
- Nouvelle fonction `uploadStreamToGoogleDrive(readStream, ...)` dans `backend/src/utils/google-drive.ts` qui pipe le `fs.createReadStream(filepath)` directement dans le PUT resumable via `fetch` + `duplex: 'half'`
- Hard limit `MAX_FILE_SIZE = 50 * 1024 * 1024` (50MB) avec rejet `400 Bad Request` + cleanup fichier temp
- Cleanup systématique des fichiers temp (formidable + webp) via `fs.unlinkSync` dans `finally`
- Logging mémoire RSS avant/après chaque upload pour diagnostic

**B. Node flags dans `backend/package.json`**:
- Script `start` modifié: `NODE_OPTIONS='--max-old-space-size=1536 --expose-gc' strapi start`
- Justification: force GC avant 1536MB (vs défaut ~1700MB) pour laisser 512MB de marge sur les 2GB Render.

**À vérifier par toi CRITIQUE**:
1. **Fonction `uploadStreamToGoogleDrive`** dans `backend/src/utils/google-drive.ts` lignes ~196-250:
   - Est-ce que `fetch` de Node (undici) accepte vraiment un `NodeJS.ReadableStream` comme `body` avec `duplex: 'half'`?
   - Que se passe-t-il si le stream est interrompu en cours de upload (client qui ferme la connexion)? Y a-t-il un leak de handle file?
   - Le `Content-Length` est optionnel — est-ce que l'API Google Drive resumable l'exige vraiment pour les streams?
   - La retry-logic en cas d'erreur réseau partielle (resumable upload standard) est-elle correctement gérée? Stripe Drive attend un retry avec `Content-Range` pour reprendre.
2. **`sharp({ limitInputPixels: 100_000_000 })`** — 100M pixels = image de 10000x10000. Raisonnable?
3. **Le cleanup `fs.unlinkSync(filepath)` en fin de fonction** — mais si une exception saute avant, est-ce que le fichier reste sur le disque? (Vérifie les chemins d'erreur)
4. **Node flags**:
   - `--max-old-space-size=1536` va-t-il être lu correctement par Render? Render a aussi un env var `NODE_OPTIONS` parfois. Conflit possible?
   - `--expose-gc` est-il sans risque en prod (certains profilers désactivent ce flag par sécurité)?
5. **Pas de config connection pool PostgreSQL** — Claude a mentionné que c'est "à faire" mais n'a rien poussé. Est-ce un oubli critique? Strapi v5 avec knex par défaut ouvre combien de connections?

**Commande de test suggérée**:
```bash
# Upload un fichier de 40MB vers /api/artist-edit-requests/upload-direct
# Verifier dans les logs Render le message "uploadDirect memory: before=XMB, after=YMB, delta=ZMB"
# delta doit rester < 10MB peu importe la taille du fichier source
```

### 3.4 Point 4 — RÉSILIENCE FRONTEND

**Demande**: "Je veux la certitude absolue qu'un redémarrage/crash du backend ne détruira plus jamais la session ou le panier d'un client."

**Ce que Claude a fait** (commit `b241e4e`):

**A. `frontend/src/utils/apiResilient.js`** (nouveau):
- `apiFetch(path, options)`: retry 5x avec backoff `1s/2s/4s/8s/16s` (total ~31s)
- Retry sur: network errors, 500, 502, 503, 504
- PAS retry sur: 400, 401, 403, 404, 409, 413
- Timeout 30s par défaut via AbortController
- Tracker global `currentBackendStatus = 'up' | 'down' | 'unknown'`
- `onBackendStatusChange(cb)` pour abonnement
- `pingBackend()` pour probe manuelle
- Auto-ping `setInterval(pingBackend, 30000)` quand status = 'down' pour recovery detection

**B. `frontend/src/components/BackendHealthBanner.jsx`** (nouveau):
- Banner ambre sticky top quand `status === 'down'`
- Message FR/EN/ES: "Nos serveurs sont temporairement ralentis. Votre travail est sauvegardé localement, on réessaie automatiquement."
- Bouton "Réessayer maintenant" → appelle `pingBackend()`
- Banner vert 4s quand `down → up` (recovery)

**C. `frontend/src/App.jsx`** modifié: `<BackendHealthBanner />` ajouté à la racine dans `<BrowserRouter>`.

**À vérifier par toi**:
1. **Cart persistence**: Claude affirme que "Cart reste en localStorage (déjà en place via CartContext)". Vérifie `frontend/src/contexts/CartContext.jsx` (si existe) ou équivalent - le panier est-il vraiment persisté côté client, y compris en cas de crash mid-checkout?
2. **apiResilient non utilisé**: Le wrapper est créé mais **aucun des `fetch()` existants** dans le codebase n'a été migré pour l'utiliser. Claude le mentionne ("migration progressive"). Est-ce que ça veut dire que le wrapper est actuellement **mort code** qui ne protège personne? Check combien d'appels `fetch()` existent dans `frontend/src/` et lesquels devraient passer par `apiResilient` en priorité.
3. **Race condition dans `setBackendStatus`**: la fonction utilise un `Set` de listeners. Si un listener mute le Set pendant l'itération, ça peut crasher. Vérifie.
4. **Auto-ping 30s**: si le user ouvre 10 onglets, ça fait 10 pings/30s. OK? Devrait-on coordonner via localStorage/BroadcastChannel?
5. **`AbortSignal.timeout`** utilisé dans `pingBackend` — compatibilité navigateurs? (Requiert Chrome 103+, Safari 15.4+)
6. **Le banner sticky top z-9999** peut-il se mettre au-dessus de modales existantes et bloquer l'UX? Check les modales du site.
7. **Traductions**: FR/EN/ES sont-elles toutes correctes linguistiquement (pas de franglais, pas d'accent mal encodé)?

### 3.5 Point 5 — SÉCURITÉ ET ALERTES WEBHOOK

**Demande**: "L'erreur du 0 vs O aurait dû être détectée. Pourquoi le code de mon webhook ne m'a envoyé AUCUNE alerte admin (email/log critique) quand les signatures échouaient systématiquement en erreur 400? Donne-moi le code pour blinder ce webhook et m'alerter instantanément si une signature échoue."

**Ce que Claude a fait** (commit `45d43ce`):

**A. `backend/src/api/order/controllers/order.ts` — `handleStripeWebhook`**:
- Ajout d'un `requestId = crypto.randomBytes(4).toString('hex')` pour corrélation logs
- Si `STRIPE_WEBHOOK_SECRET` manquant ou placeholder → alerte admin immédiate via `sendWebhookFailureAlert()`
- Si `constructEvent()` throw (signature invalide) → alerte admin throttlée 1/10min (anti-email-storm) via global `__webhook_fail_alert_last__`
- Logs enrichis: `[webhook:${requestId}] ...`

**B. `backend/src/utils/email.ts` — nouvelle fonction `sendWebhookFailureAlert()`**:
- Envoie via Resend à `process.env.ADMIN_EMAIL || 'massivemedias@gmail.com'`
- Subject: `🚨 [ALERTE CRITIQUE] Webhook Stripe signature failed - {requestId}`
- Body HTML rouge avec: requestId, raison, sigHeader tronqué, bodyPresent, timestamp, causes probables, action à faire
- Helper `escapeHtml()` pour éviter XSS dans le body

**À vérifier par toi CRITIQUE**:
1. **Fuite de données sensibles dans l'email**:
   - `sigHeader: sig.substring(0, 80)` — 80 chars d'un header Stripe signature, est-ce safe? Le format est `t=timestamp,v1=HEX`. Les 80 premiers chars ne contiennent pas le HMAC complet mais peuvent révéler la structure.
   - Le body ne contient pas le rawBody du webhook (bien) mais y a-t-il un autre chemin où des PII pourraient leaker?
2. **Throttle via `global[cacheKey]`**:
   - Si le process Strapi redémarre (crash OOM), le throttle est reset → email storm potentiel
   - Si Render scale horizontalement (plusieurs instances), chaque instance a son propre `global` → N×email au lieu de 1
   - Alternative plus robuste: utiliser la DB Strapi ou une table dédiée ou Redis
3. **Alerte sur signature fail = alerte sur chaque retry Stripe**: Stripe retry 3 jours avec backoff exponentiel sur les webhooks en échec. Le throttle 10min est-il suffisant? Stripe envoie combien de webhooks en 4 jours typiquement?
4. **Alerte manquante pour autres cas critiques**:
   - Webhook reçu mais handler crash en runtime (try/catch pas présent dans handleStripeWebhook après verifyEvent, check)
   - Order.update() fail → order reste en draft silencieusement
   - Email.send() fail → le client ne reçoit pas son confirm
   - Ces cas sont-ils alerteds? Si non, ils deviennent le NEXT bug silencieux.
5. **Pas de `ctx.throw()` — `ctx.badRequest()` retourne 400**: Stripe va retry. Bien. Mais si la signature est vraiment invalide (pas juste config mismatch), on retry à l'infini pour rien. C'est OK?
6. **Le `crypto` import**: est-il déjà importé en haut de `order.ts`? Sinon compile error.

**Commandes de test suggérées**:
```bash
# Simuler un webhook avec signature invalide:
curl -X POST https://massivemedias-api.onrender.com/api/webhooks/stripe \
  -H "stripe-signature: t=1234,v1=faaakek" \
  -H "Content-Type: application/json" \
  -d '{"type":"test"}'
# Attendu: 400 Webhook Error + email dans les 10s a ADMIN_EMAIL

# Relancer 3x dans la meme minute:
# Attendu: 400 a chaque fois mais 1 seul email (throttle)
```

---

## 4. ÉTAT DE LA COMMANDE CINDY (post-session)

Commande documentId: `k0nhkr9nas855ks2z5f31r28`
- Email: `cindy.deroeux@gmail.com`
- Total: 40.82 $CA (4082 cents)
- Status actuel: **`paid`** (flippé manuellement via endpoint `PUT /api/orders/{doc}/status`)
- Invoice: **`MM-2026-0003`** (généré via endpoint étendu avec `autoInvoice: true`)
- StripePaymentIntentId actuel: `cs_live_a1JARsquWBDKszxRGd6aEi8xTnu82IjDGMF4MBZAn0GoUY2PZeGeKAGlsp` (session ID, pas le pi_)
- Emails envoyés (client + notif admin) via `sendEmails: true` du endpoint étendu

**À vérifier**:
- Est-ce que le fait de stocker un `cs_live_*` dans `stripePaymentIntentId` au lieu du vrai `pi_*` va casser des fonctionnalités futures (recherche par payment intent, refunds, etc.)?
- L'endpoint `PUT /orders/:documentId/status` (commit `74de497`) accepte maintenant `status`, `invoiceNumber`, `autoInvoice`, `sendEmails`. Est-il correctement sécurisé (auth: false! publique!)? Quelqu'un peut-il flipper n'importe quelle commande en paid depuis l'extérieur?

---

## 5. ENDPOINTS EXPOSÉS À AUDITER

Voici les endpoints backend publics (auth: false) — chaque ligne doit être évaluée pour risque de sécurité:

| Méthode | Path | Handler | Risque |
|---|---|---|---|
| POST | `/api/orders/create-payment-intent` | order.createPaymentIntent | Bas (validé côté serveur) |
| POST | `/api/orders/create-checkout-session` | order.createCheckoutSession | Bas |
| GET | `/api/orders/my-orders` | order.myOrders | ??? filtre par email? |
| POST | `/api/webhooks/stripe` | order.handleStripeWebhook | OK (signature verif) |
| GET | `/api/orders/clients` | order.clients | ??? liste tous les clients!? |
| GET | `/api/orders/stats` | order.stats | ??? stats business!? |
| GET | `/api/orders/commissions` | order.commissions | ??? commissions artistes!? |
| GET | `/api/orders/admin` | order.adminList | ??? liste toutes les orders!? |
| PUT | `/api/orders/:documentId/status` | order.updateStatus | **CRITIQUE - flip status sans auth** |
| PUT | `/api/orders/:documentId/notes` | order.updateNotes | **CRITIQUE - edit notes sans auth** |
| PUT | `/api/orders/:documentId/tracking` | order.addTracking | **CRITIQUE** |
| DELETE | `/api/orders/:documentId` | order.deleteOrder | **CRITIQUE - supprime orders sans auth!!!** |
| POST | `/api/orders/admin-create` | order.adminCreate | **CRITIQUE - crée orders sans auth** |
| POST | `/api/orders/:documentId/resend-notification` | order.resendAdminNotification | Bas |
| GET | `/api/orders/by-payment-intent/:id` | order.getByPaymentIntent | Bas |
| POST | `/api/orders/link-by-email` | order.linkByEmail | ??? |
| POST | `/api/orders/reconcile-stripe` | order.reconcileStripe | OK (token Bearer) |
| GET | `/api/orders/memory-health` | order.memoryHealth | **Diagnostic — leak PID/version?** |

**Question centrale à auditer**: est-ce que tous ces endpoints `auth: false` sont justifiés? Claude n'a **rien changé** à cette architecture ce soir mais c'est un sujet de fond. **Signale si tu vois des risques immédiats.**

---

## 6. FICHIERS MODIFIÉS CE SOIR — LISTE COMPLÈTE

### Backend
- `backend/src/api/order/controllers/order.ts` — ajout `memoryHealth`, `reconcileStripe`, extension `updateStatus`, logging webhook + alerte
- `backend/src/api/order/routes/custom-order.ts` — 2 nouvelles routes (reconcile, memory-health)
- `backend/src/api/artist-edit-request/controllers/artist-edit-request.ts` — refonte `uploadDirect` en streaming
- `backend/src/utils/email.ts` — ajout `sendWebhookFailureAlert` + helper `escapeHtml`
- `backend/src/utils/google-drive.ts` — ajout `uploadStreamToGoogleDrive`
- `backend/package.json` — script `start` avec NODE_OPTIONS

### Frontend
- `frontend/src/utils/apiResilient.js` — nouveau (wrapper fetch avec retry)
- `frontend/src/components/BackendHealthBanner.jsx` — nouveau (banner down/up)
- `frontend/src/App.jsx` — mount du banner
- `frontend/src/pages/AdminOrders.jsx` — section "STICKERS À IMPRIMER"
- `frontend/src/components/FileUpload.jsx` — messages erreur + onError preview
- `frontend/src/utils/stickerFx.js` — `canvasToBlobUrl` → data URL au lieu de blob URL
- `frontend/src/pages/Panier.jsx` — fallback `onError` sur `<img>`
- `frontend/src/main.jsx` — ping backend au chargement

### Infrastructure
- `.github/workflows/reconcile-stripe.yml` — nouveau (cron horaire réconciliation)
- `.github/workflows/keep-alive.yml` — endpoint fixé `/api/artists` (était 404)
- `cloudflare-worker/wrangler.toml` — triggers cron `*/5 * * * *`
- `cloudflare-worker/og-worker.js` — handler `scheduled` pour ping

### Autres
- `RAPPORT-INCIDENTS-17-AVRIL-2026.md` — 20 sections, ~12 pages
- `scripts/reconcile-order-cindy.sh` — one-shot script pour fix Cindy
- `AUDIT-PROMPT-17-AVRIL-2026.md` — ce fichier que tu lis

---

## 7. VARIABLES D'ENVIRONNEMENT CRITIQUES (Render)

Vérifie que ces ENV vars existent et sont valides:

| Nom | Requis pour | Notes |
|---|---|---|
| `STRIPE_SECRET_KEY` | Paiements | Format `sk_live_...` en prod |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature | Format `whsec_...` — **corrigé ce soir** |
| `RESEND_API_KEY` | Emails | Format `re_...` |
| `RESEND_FROM_EMAIL` | Expéditeur | Domaine vérifié Resend |
| `ADMIN_EMAIL` | Alertes webhook + notifs | **À vérifier que présent**, fallback `massivemedias@gmail.com` |
| `SUPABASE_API_URL` | Upload WebP | |
| `SUPABASE_API_KEY` | Upload WebP | Service role key |
| `GOOGLE_DRIVE_FOLDER_ID` | Upload originaux | |
| `RECONCILE_TOKEN` | Cron réconciliation | **Pas encore ajouté** — user doit créer |
| `RENDER_MEMORY_LIMIT_MB` | `/memory-health` | Optionnel, défaut 2048 |
| `NODE_OPTIONS` | Custom flags | Peut entrer en conflit avec le script `start` modifié |

---

## 8. TESTS FONCTIONNELS À EXÉCUTER

### Test 1 — Upload streaming

```bash
# Generer un fichier test de 40MB
dd if=/dev/urandom of=/tmp/big.bin bs=1M count=40

# Upload via l'endpoint
curl -X POST https://massivemedias-api.onrender.com/api/artist-edit-requests/upload-direct \
  -F "file=@/tmp/big.bin" \
  -F "artistSlug=test"

# Attendu:
# - HTTP 200 avec JSON contenant driveFileId et url WebP
# - Dans les logs Render: "uploadDirect memory: before=XMB, after=YMB, delta=ZMB"
# - delta DOIT etre < 15MB (le fichier etant 40MB)
```

### Test 2 — Memory health

```bash
curl https://massivemedias-api.onrender.com/api/orders/memory-health | jq .

# Attendu:
# {
#   "status": "OK",
#   "renderLimitMB": 2048,
#   "uptime": ...,
#   "memory": { "rss": "XXX MB", "rssPctOfLimit": "XX.X%", ... }
# }
```

### Test 3 — Alerte webhook signature

```bash
# Envoyer un webhook avec signature invalide
curl -X POST https://massivemedias-api.onrender.com/api/webhooks/stripe \
  -H "stripe-signature: t=9999999999,v1=0000000000000000000000000000000000000000000000000000000000000000" \
  -H "Content-Type: application/json" \
  -d '{"id":"evt_test","type":"test.event"}'

# Attendu:
# - HTTP 400 avec body {"error":{...,"message":"Webhook Error: ..."}}
# - Email dans ADMIN_EMAIL dans les 30 secondes
# - Dans les logs Render: "[webhook:XXXX] SIGNATURE VERIFICATION FAILED" + "Admin alert email dispatched"
```

### Test 4 — Frontend resilience banner

1. Ouvre `https://massivemedias.com` dans Chrome DevTools
2. Dans l'onglet Network, active "Offline" ou bloque `massivemedias-api.onrender.com`
3. Naviguer dans le site (ex: cliquer sur un produit)
4. **Attendu**: banner ambre apparaît en haut avec message multilingue et bouton "Réessayer"
5. Retire le blocage réseau, clique "Réessayer"
6. **Attendu**: banner vert "Connexion rétablie" pendant 4s puis disparaît

### Test 5 — Retry automatique

Dans la console Chrome:
```javascript
import('/src/utils/apiResilient.js').then(m => {
  m.apiFetch('/api/orders/memory-health').then(r => r.json()).then(console.log);
});
// Si backend down, doit retry 5x avec backoff avant de throw
```

---

## 9. FICHIERS À OUVRIR ABSOLUMENT (priorité d'audit)

1. `backend/src/api/order/controllers/order.ts` — le gros fichier (1600+ lignes), vérifier les 3 ajouts:
   - `handleStripeWebhook` (lignes ~541-610) — alerte + requestId
   - `updateStatus` (lignes ~1157-1270) — extension invoice + emails
   - `memoryHealth` + `reconcileStripe` (lignes ~1580-1820)
2. `backend/src/api/artist-edit-request/controllers/artist-edit-request.ts` (lignes ~515-620) — streaming upload
3. `backend/src/utils/google-drive.ts` (lignes ~196-260) — `uploadStreamToGoogleDrive`
4. `backend/src/utils/email.ts` (lignes ~935-1005) — `sendWebhookFailureAlert`
5. `frontend/src/utils/apiResilient.js` — entier (nouveau, 180 lignes)
6. `frontend/src/components/BackendHealthBanner.jsx` — entier (nouveau, 75 lignes)
7. `backend/package.json` — script `start`

---

## 10. CHECKLIST DE VALIDATION (format attendu pour ta réponse)

Pour chaque item, réponds: ✅ OK / ⚠️ À CORRIGER / 🚨 CRITIQUE / ❓ INFO NEEDED, avec file:line et recommandation concrète.

### Diagnostic
- [ ] Le pivot de "cold start Render" vers "OOM sur uploads" est-il le bon diagnostic?
- [ ] Y a-t-il d'autres causes possibles de lenteur 30-60s que Claude n'a pas explorées?

### Streaming upload
- [ ] `uploadStreamToGoogleDrive` est-il techniquement correct (duplex, content-length, resumable)?
- [ ] Le cleanup `fs.unlinkSync` est-il robuste face aux exceptions mid-processing?
- [ ] `sharp().toFile()` vs `.toBuffer()` — bon choix?
- [ ] Hard limit 50MB — trop bas/haut/correct?
- [ ] Cas edge: client qui upload 49MB puis déconnecte à 80% — comportement?

### Node flags
- [ ] `--max-old-space-size=1536` bon calcul vs 2GB Render?
- [ ] `--expose-gc` risque sécurité?
- [ ] Conflit avec `NODE_OPTIONS` env var Render?
- [ ] La syntaxe `NODE_OPTIONS='...'` en inline dans un script npm marche sur Linux (Render) ET sur macOS (dev local)?

### Webhook alert
- [ ] Throttle 10min via `global[cacheKey]` — pertinent en prod Render?
- [ ] Fuite d'info dans le body email (sigHeader)?
- [ ] Alerte activée aussi pour les autres failures (runtime crash, DB fail, email fail)?
- [ ] `crypto.randomBytes` correctement importé?

### Frontend resilience
- [ ] `apiResilient` est-il vraiment utilisé (ou dead code)?
- [ ] Banner n'interfère pas avec les modales existantes?
- [ ] Race conditions dans le listeners Set?
- [ ] `AbortSignal.timeout` support navigateurs?

### Sécurité endpoints
- [ ] Les endpoints `auth: false` sont-ils tous justifiés?
- [ ] `PUT /orders/:id/status` public = n'importe qui peut flipper en paid?
- [ ] `DELETE /orders/:id` public = risque de destruction de données?
- [ ] `memory-health` leak info?

### Commande Cindy
- [ ] Stocker `cs_live_*` dans `stripePaymentIntentId` au lieu de `pi_*` — OK ou bug futur?
- [ ] Invoice `MM-2026-0003` correctement généré (pas de duplicate, pas de race condition)?

### Pansements legacy
- [ ] Workflow `keep-alive.yml` devrait-il être supprimé?
- [ ] Cloudflare Worker cron à supprimer?
- [ ] Client-side ping dans `main.jsx` à garder?

### Omissions potentielles
- [ ] Connection pool Postgres non configuré — impact?
- [ ] Pas de Sentry/APM — aveugle aux crashes React?
- [ ] Pas de rate limiting sur endpoints publics?
- [ ] Pas de monitoring automatique (GitHub Actions cron sur memory-health)?

---

## 11. QUICK WINS ADDITIONNELS SUGGÉRÉS

Si tu identifies des quick wins (<30 min chacun) qui feraient du bien au projet, liste-les avec:
- Titre
- Fichier:ligne ou zone du code
- Estimation temps
- Impact business

Exemples attendus: ajout d'index DB manquants, endpoints qui retournent trop de données, images non lazy-loadées, bundle frontend trop gros, etc.

---

## 12. FORMAT DE TA RÉPONSE

**Structure attendue:**

```markdown
# AUDIT — Réponse [ton nom/modèle]

## 1. Verdict global
[Une ligne par thème avec ✅/⚠️/🚨]

## 2. Problèmes identifiés
[Liste avec file:line + recommandation concrète]

## 3. Code buggy détecté
[Snippet problématique avec explication du bug]

## 4. Risques non adressés par Claude
[Ce que Claude a raté ou sous-estimé]

## 5. Quick wins additionnels
[<30min chacun, avec impact business]

## 6. Commandes de test à exécuter maintenant
[Bash snippets concrets]

## 7. Recommandation finale
[Est-ce que ces changements doivent partir en prod tel quel? Rollback nécessaire? Prochaine priorité?]
```

**Contraintes**:
- Français informel (tu, pas de formalités)
- Pas d'em-dashes (`—` interdit, utiliser `-`)
- Pas d'emojis sauf dans les verdicts ✅⚠️🚨
- Sois direct et technique, pas de fluff
- Cite toujours le fichier et la ligne précise quand tu identifies un problème
- Si tu vois un bug que Claude n'a pas vu, décris comment l'exploiter pour le prouver (proof of concept)

---

## 13. RESSOURCES CONTEXTUELLES

- Le `RAPPORT-INCIDENTS-17-AVRIL-2026.md` à la racine du repo contient l'historique complet de la session, avec 20 sections couvrant les incidents et le plan de prévention
- L'utilisateur préfère les explications en français
- L'utilisateur paye 320$ CAD/mois pour Claude Max — il est sensible au coût des tokens, donc sois efficace dans ta réponse (pas de remplissage)
- Il a perdu ~2000$ aujourd'hui et est émotionnellement à bout — sois factuel mais pas condescendant
- **Ne pas répéter tout ce qu'a déjà fait Claude** — focus sur ce qui cloche ou manque

---

**Début de ton audit après cette ligne.**
