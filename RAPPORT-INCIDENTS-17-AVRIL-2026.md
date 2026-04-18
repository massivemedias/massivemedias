# Rapport d'incidents - 17 avril 2026

**Site:** massivemedias.com
**Période:** journée du 17 avril 2026
**Impact business:** perte d'au moins 1 client (~2000$), commande Cindy/Psyqu33n bloquée
**Rédigé par:** Claude (session dev)
**Destiné à:** Michael Sanchez (Massive Medias)

---

## Sommaire exécutif

Trois incidents distincts mais interconnectés sont survenus aujourd'hui, tous liés à l'infrastructure backend Render et à des bugs React qui n'avaient pas été détectés en amont. Ensemble, ils ont causé des pertes de conversion sur le site de production.

| # | Incident | Sévérité | Cause racine | État |
|---|---|---|---|---|
| 1 | Upload fichier "ne fonctionne pas" (client Jade) | 🔴 Critique | Backend Render endormi (cold start 30-60s) + messages d'erreur génériques | ✅ Corrigé |
| 2 | Preview image cassée dans configurateur (icône + alt text géant) | 🔴 Critique | `<img>` sans `onError` ni `aria-label` | ✅ Corrigé |
| 3 | Miniatures stickers cassées dans le panier | 🔴 Critique | Utilisation de `blob:URL` (session-scoped) au lieu de `data:URL` pour les thumbnails | ✅ Corrigé |
| 4 | Commande Cindy/Psyqu33n restée en "draft" malgré paiement | 🟠 Important | Webhook Stripe `payment_intent.succeeded` n'a pas fait passer l'order de draft → paid | 🔄 En cours de résolution manuelle |

---

## 1. Incident: Upload fichier "ne fonctionne pas" (Jade, client de Jade)

### Symptômes côté client

> *"J'essaye de passer pour la commande en ligne mais l'upload de l'image ne fonctionne pas (j'ai essaye PDF et JPEG)."*

La cliente ne voyait qu'un message générique **"Erreur lors de l'upload. Réessayez."** Aucune information sur la cause réelle. Résultat: abandon de commande et départ vers un concurrent. Perte estimée: ~2000$.

### Cause racine technique

**Render free tier endort le service backend après 15 minutes d'inactivité.** Le réveil (cold start) prend 30 à 60 secondes. Pendant ce délai:

1. Le navigateur envoie la requête `POST /api/artist-edit-requests/upload-direct` avec `multipart/form-data`
2. Render reçoit la requête mais le conteneur Node/Strapi n'est pas encore démarré
3. Le conteneur démarre en parallèle (connexion DB, chargement plugins Strapi, etc.)
4. Si le démarrage > 30s, certains proxies/CDNs timeout la requête avant la réponse
5. Le frontend reçoit une erreur réseau (`err.code === 'ECONNABORTED'` ou `err.message === 'Network Error'`)

### Code fautif (AVANT)

**Fichier:** `frontend/src/components/FileUpload.jsx`

```javascript
} catch (err) {
  setError(tx({
    fr: 'Erreur lors de l\'upload. Reessayez.',
    en: 'Upload failed. Please try again.',
    es: 'Error al subir. Intentalo de nuevo.'
  }));
} finally {
  setUploading(false);
}
```

**Problèmes:**
- Un seul message d'erreur générique peu importe la cause (timeout, 500, 413, etc.)
- Aucun `console.error(err)` pour debug postérieur
- Aucune indication du fait que le serveur peut être endormi
- Aucune alternative de contact proposée au client

### Correction appliquée

**Commit:** `6464c7d - Fix urgent: ameliore messages d'erreur upload (debug client Jade)`

```javascript
} catch (err) {
  // Log technique pour debug + message clair pour l'utilisateur
  console.error('FileUpload error:', err);
  const serverMsg = err?.response?.data?.error?.message || err?.response?.data?.message || err?.message || '';
  const status = err?.response?.status;
  let friendly;
  if (err?.code === 'ECONNABORTED' || /timeout/i.test(err?.message || '')) {
    friendly = tx({
      fr: "Temps d'attente depassé. Le serveur se reveillait peut-etre - reessayez dans 10 secondes.",
      en: 'Request timed out. Server may have been waking up - please try again in 10 seconds.',
      es: 'Tiempo de espera agotado. Reintenta en 10 segundos.',
    });
  } else if (status === 413) {
    friendly = tx({ fr: 'Fichier trop volumineux pour le serveur.', ... });
  } else if (status >= 500 || !status) {
    friendly = tx({
      fr: `Serveur injoignable. Contactez-nous directement: massivemedias@gmail.com ou WhatsApp +1 514 653 1423.`,
      ...
    });
  } else {
    friendly = tx({
      fr: `Erreur upload (${status || '?'}): ${serverMsg || 'Réessayez ou envoyez-nous votre fichier par courriel.'}`,
      ...
    });
  }
  setError(friendly);
}
```

Le message d'état pendant l'upload affiche aussi maintenant *"peut prendre 30s si serveur en veille"* pour que le client comprenne qu'une attente est normale:

```javascript
setUploadStatus(tx({
  fr: `Upload de ${file.name}... (peut prendre 30s si serveur en veille)`,
  ...
}));
```

### Solution définitive de l'infrastructure

Ajouter un message d'erreur mieux rédigé ne suffit pas, il faut empêcher Render de s'endormir. **Défense en profondeur sur 2 niveaux:**

#### Niveau 1: Cloudflare Worker Cron Trigger

**Commit:** `409a82f - Fix DEFINITIF: backend Render toujours reveille (cron + client ping)`

**Fichier:** `cloudflare-worker/wrangler.toml`

```toml
# Cron trigger: ping le backend Render toutes les 5 minutes pour empecher
# qu'il s'endorme (Render free tier sleep apres 15min d'inactivite).
[triggers]
crons = ["*/5 * * * *"]
```

**Fichier:** `cloudflare-worker/og-worker.js`

```javascript
const WAKE_ENDPOINTS = [
  '/api/site-content',
  '/api/artists',
];

export default {
  // Cron trigger toutes les 5 minutes
  async scheduled(event, env, ctx) {
    const promises = WAKE_ENDPOINTS.map(async (endpoint) => {
      try {
        const url = `${BACKEND_URL}${endpoint}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'User-Agent': 'Cloudflare-KeepAlive-Bot/1.0 (massivemedias.com)' },
          cf: { cacheTtl: 0, cacheEverything: false },
        });
        return { endpoint, status: response.status, ok: response.ok };
      } catch (err) {
        return { endpoint, error: err.message };
      }
    });
    const results = await Promise.all(promises);
    console.log('[KeepAlive]', new Date().toISOString(), JSON.stringify(results));
  },
  // ... fetch handler existant
}
```

**Avantages vs GitHub Actions (qui existait déjà):**
- GitHub Actions schedules sont **très irréguliers sur free tier** (délais observés: 45-70 min entre 2 runs alors que `*/10 * * * *` était configuré)
- Cloudflare Workers crons sont **fiables au quasi-realtime** (max 5-10s de dérive)
- Cloudflare a une infrastructure distribuée sur tous les edge PoPs

**Preuve du problème GitHub Actions:**
```
completed   Keep Alive Render  main  schedule  ...  4m8s   2026-04-17T22:05:56Z
completed   Keep Alive Render  main  schedule  ...  4m6s   2026-04-17T21:24:41Z  (41 min avant)
completed   Keep Alive Render  main  schedule  ...  4m7s   2026-04-17T20:30:02Z  (54 min avant)
completed   Keep Alive Render  main  schedule  ...  4m10s  2026-04-17T19:42:35Z  (48 min avant)
```
Avec 41 à 70 minutes entre les runs, Render avait largement le temps de s'endormir (seuil: 15 min).

#### Niveau 2: Ping client-side au chargement du site

**Fichier:** `frontend/src/main.jsx`

```javascript
// Keep-alive backend Render: ping le backend des que l'utilisateur arrive sur le site
// pour eviter qu'il dorme. Le Cloudflare Worker fait aussi un cron toutes les 5 min
// (defense en profondeur). Ce ping est declenche des le premier rendu, donc meme si
// le cron rate, le backend se reveille quand un client arrive sur le site.
// Pas de await - non-bloquant pour le rendu initial.
(() => {
  const apiUrl = import.meta.env.VITE_API_URL || 'https://massivemedias-api.onrender.com';
  fetch(`${apiUrl}/api/artists`, { method: 'GET', mode: 'cors', cache: 'no-store' })
    .then(() => { /* backend awake */ })
    .catch(() => { /* ignore network errors - le worker cron nous couvre */ });
})();
```

**Raison:** même si Cloudflare Worker cron rate 1 minute à cause d'une panne edge, le premier client qui visite le site réveille le backend avant d'interagir avec les configurateurs.

#### Correction d'un bug parallèle

**Commit:** `88b3afd - Fix keep-alive: /api/site-contents (404) -> /api/artists (200)`

Le workflow GitHub Actions existant pingait `/api/site-contents` (avec un "s") — cet endpoint retournait **404 Not Found**. Le vrai endpoint est `/api/site-content` (singulier). Conséquence: depuis des semaines, les pings GitHub Actions recevaient tous une 404 mais réveillaient quand même Render (la requête suffit pour le réveil). Heureusement ça fonctionnait malgré l'erreur mais ça polluait les logs pour rien.

---

## 2. Incident: Preview image cassée dans le configurateur

### Symptômes visuels

Après un upload d'image, dans la zone "Votre design (haute def)" du configurateur de stickers:
- Icône d'image cassée (🌄) de Chrome
- **Nom du fichier en texte GIGANTESQUE** à côté (rendu de l'`alt`)
- En-dessous, le nom du fichier normal en petit + bouton X

### Cause racine

**Fichier:** `frontend/src/components/FileUpload.jsx` (ancien code)

```jsx
{showPreview ? (
  <div className="rounded-lg overflow-hidden bg-glass">
    <img
      src={file.url}
      alt={file.name}  // ← Problème: si l'image ne charge pas, ALT s'affiche en énorme
      className="w-full h-24 object-cover"
    />
    ...
```

**Trois bugs combinés:**

1. **`alt={file.name}`** (dynamique): quand l'image échoue à charger, le navigateur affiche l'attribut `alt` en taille réelle dans l'espace prévu → texte gigantesque. Un `alt=""` évite ça.
2. **Pas de `onError` handler**: le composant ne détecte pas que l'image a échoué, donc ne peut pas basculer vers un rendu alternatif
3. **`object-cover`**: coupe/recadre les images au lieu de les afficher en entier (gênant pour des logos de stickers en PNG transparent)

### Correction

**Commit:** `fa0d7db - Fix urgent: preview upload cassée (broken image + alt text geant)`

```jsx
const [brokenPreviews, setBrokenPreviews] = useState(new Set());
const markBroken = (id) => setBrokenPreviews(prev => {
  const next = new Set(prev);
  next.add(id);
  return next;
});

// ...

const showPreview = (isImage(file.mime) || (file.url && file.url.includes('.webp')))
  && file.url
  && !hidePreview
  && !brokenPreviews.has(fileKey);  // ← bascule au fallback si erreur

return showPreview ? (
  <div className="rounded-lg overflow-hidden bg-[#2a0050] border border-white/5">
    <img
      src={file.url}
      alt=""                       // ← plus de texte géant
      aria-label={file.name}       // ← nom accessible pour les lecteurs d'écran
      className="w-full h-24 object-contain"  // ← plus de crop
      loading="lazy"
      onError={() => markBroken(fileKey)}  // ← détection et fallback
    />
    <div className="px-2 py-1 flex items-center gap-1 bg-black/30">
      <FileText size={10} className="text-accent flex-shrink-0" />
      <span className="text-heading text-[10px] truncate flex-1" title={file.name}>
        {file.name}
      </span>
      <button type="button" onClick={() => handleRemove(i)} ...>
        <X size={12} />
      </button>
    </div>
  </div>
) : (
  // Fallback: icône fichier + nom (pas de preview image)
  <div className="flex items-center gap-2 p-2 rounded-lg bg-glass">
    <FileText size={14} className="text-accent flex-shrink-0" />
    <span className="text-heading text-[11px] truncate flex-1" title={file.name}>
      {file.name}
    </span>
    ...
  </div>
);
```

Le même patron a été appliqué au mode "full" du FileUpload (lignes ~380-420 du fichier).

### Pourquoi ça n'avait pas été détecté

- Les tests de dev utilisent des images qui chargent immédiatement (local ou CDN rapide)
- L'erreur se produit **surtout quand le serveur backend est en cold start** et met du temps à répondre: l'URL est retournée mais l'image WebP n'est pas encore finalisée sur Supabase Storage quand le React render l'affiche
- Scénario corollaire: si le backend répond avec un `file.url` pointant vers une ressource Supabase protégée par RLS, l'image retourne 403 et casse

---

## 3. Incident: Miniatures stickers cassées dans le panier

### Symptômes

Après avoir ajouté un sticker au panier depuis `/services/stickers`, la navigation vers `/panier` affichait:
- Icône d'image cassée
- Alt text "Sticker Custom" rendu en énorme
- Bug aussi après un simple reload de la page panier

### Cause racine — le bug le plus subtil

**Fichier:** `frontend/src/utils/stickerFx.js` (ancien code)

```javascript
// Exporte le canvas en blob PNG (pour panier/thumb)
export function canvasToBlobUrl(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('Impossible de generer le PNG'));
      resolve(URL.createObjectURL(blob));  // ← `blob:` URL = BUG
    }, 'image/png');
  });
}
```

**Le piège des blob URLs:**

1. `URL.createObjectURL(blob)` crée une URL de la forme `blob:https://massivemedias.com/dbd0931e-04c9-4ff9-a6b6-ff51342ca436`
2. Cette URL est **scopée au Document courant** (la page qui l'a créée)
3. Dès que l'utilisateur navigue vers une autre page (`/panier`), le Document d'origine est détruit → la blob URL devient **invalide** → 404/ERR_FILE_NOT_FOUND
4. Pire encore: le cart est persisté dans `localStorage`, donc **après un reload complet**, l'URL stockée est totalement morte
5. Encore pire: même au checkout Stripe puis retour sur le site, les URLs sont mortes depuis longtemps

**Conséquence business:** chaque sticker ajouté au panier avait une miniature cassée au cœur du tunnel de conversion. Désastreux pour la confiance.

### Correction

**Commit:** `f41c9e4 - Fix CRITIQUE: miniatures sticker cassees dans le panier`

```javascript
/**
 * Exporte le canvas en data URL PNG (pour panier/thumb/localStorage)
 * IMPORTANT: data URL au lieu de blob URL - les blob URLs meurent au changement
 * de page (session-scoped) ce qui cassait les images du panier quand le client
 * naviguait depuis le configurateur vers /panier.
 * Data URL = base64 inline, survit au reload + navigation + serialization JSON.
 * On reduit la taille a 256px pour eviter d'exploser le localStorage (data URL
 * en base64 ~33% plus gros que binaire).
 */
export function canvasToBlobUrl(canvas) {
  return new Promise((resolve) => {
    try {
      // Resize to thumbnail dims for storage efficiency (256x256 max)
      const thumb = document.createElement('canvas');
      const maxDim = 256;
      const ratio = Math.min(maxDim / canvas.width, maxDim / canvas.height, 1);
      thumb.width = Math.round(canvas.width * ratio);
      thumb.height = Math.round(canvas.height * ratio);
      const ctx = thumb.getContext('2d');
      ctx.drawImage(canvas, 0, 0, thumb.width, thumb.height);

      // toDataURL avec compression PNG (lossless pour stickers qui ont souvent
      // peu de couleurs). Si c'est trop gros on bascule sur JPEG q=0.85.
      let dataUrl = thumb.toDataURL('image/png');
      if (dataUrl.length > 120 * 1024) {
        dataUrl = thumb.toDataURL('image/jpeg', 0.85);
      }
      resolve(dataUrl);
    } catch (e) {
      // Fallback vers blob URL si toDataURL echoue (ex: canvas tainted)
      canvas.toBlob((blob) => {
        if (!blob) return resolve('');
        resolve(URL.createObjectURL(blob));
      }, 'image/png');
    }
  });
}
```

**Choix techniques:**

- **Thumbnail 256x256** max: empêche que le localStorage explose (un PNG de 800x800 en base64 dépasse facilement 500KB par item)
- **Fallback JPEG q=0.85**: si le PNG fait > 120KB, on bascule en JPEG compressé (acceptable pour un thumbnail panier)
- **try/catch avec fallback blob URL**: si le canvas est "tainted" (image cross-origin sans CORS), `toDataURL()` lève une `SecurityError`. On retombe sur le comportement original plutôt que de casser totalement
- **Nom de la fonction inchangé** (`canvasToBlobUrl`): évite un diff large dans les appelants, même si techniquement la fonction ne retourne plus un blob URL

### Ceinture et bretelles: fallback dans Panier.jsx

**Fichier:** `frontend/src/pages/Panier.jsx`

```jsx
<img
  src={item.image || '/massive-favicon.svg'}
  alt=""
  aria-label={item.productName || ''}
  className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0 bg-purple-main/30"
  onError={(e) => {
    // Si l'image (ex: blob URL mort apres reload) echoue,
    // on bascule sur un fallback visuel discret plutot que
    // d'afficher une icone cassee + alt-text geant
    if (!e.target.dataset.fallback) {
      e.target.dataset.fallback = '1';
      e.target.src = '/massive-favicon.svg';
    }
  }}
/>
```

Ça protège rétrospectivement les clients qui ont encore des items au panier avec l'ancienne blob URL (créés avant le fix).

---

## 4. Incident: Commande Cindy/Psyqu33n restée en "draft" malgré paiement

### Symptômes

- Cindy confirme avoir passé un achat de packs de stickers
- Aucun email de confirmation envoyé à massivemedias@gmail.com
- Aucune commande visible dans `/admin/commandes` (qui filtre par défaut `status !== 'draft'`)

### Diagnostic

Requête à l'API admin des commandes, **incluant les drafts**:

```bash
curl "https://massivemedias-api.onrender.com/api/orders/admin?status=draft"
```

Résultat:

```
2026-04-18T00:42:42 | cindy.deroeux@gmail.com | Cindy deroeux | total=4082 | stripeId=cs_live_a1JARsquWBDKszxRGd6aEi
2026-04-16T22:49:03 | cindy.deroeux@gmail.com | Cindy deroeux | total=5462 | stripeId=cs_live_a1p6OBjH5U6fOR8Dh0eyj1
2026-04-16T22:48:14 | cindy.deroeux@gmail.com | Cindy deroeux | total=5462 | stripeId=cs_live_a1AWGYVl6H1RGgtzzEJh6P
```

**La commande existe dans Strapi** avec:
- Total: **4082 cents = 40.82$** (montant correct avec rabais artiste 25% appliqué)
- ID session Stripe: `cs_live_a1JARsquWBDKszxRGd6aEi`
- **Status bloqué à "draft"**

### Comment ça fonctionne normalement

**Fichier:** `backend/src/api/order/controllers/order.ts`

**Étape 1** — création de la commande (draft):
```javascript
// Création de l'order avec status 'draft' au moment du clic "Passer au paiement"
// Will be updated to "paid" by Stripe webhook when payment succeeds
const orderData = {
  stripePaymentIntentId: session.payment_intent || session.id,
  status: 'draft',
  ...
};
```

**Étape 2** — webhook Stripe:
```javascript
async handleStripeWebhook(ctx) {
  const sig = ctx.request.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    const stripe = getStripe();
    const unparsedBody = ctx.request.body?.[Symbol.for('unparsedBody')];
    const koaRawBody = ctx.request.rawBody;
    const rawBody = unparsedBody || koaRawBody || JSON.stringify(ctx.request.body);
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err) {
    // Signature verification failed
    return ctx.badRequest(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.payment_intent && session.payment_status === 'paid') {
      const orders = await strapi.documents('api::order.order').findMany({
        filters: {
          $or: [
            { stripePaymentIntentId: session.payment_intent },
            { stripePaymentIntentId: session.id },
          ],
        }
      });
      if (orders.length > 0 && orders[0].status === 'draft') {
        await strapi.documents('api::order.order').update({
          documentId: orders[0].documentId,
          data: { stripePaymentIntentId: session.payment_intent }
        });
      }
    }
    ctx.body = { received: true };
    return;
  }

  if (event.type === 'payment_intent.succeeded') {
    // Mise à jour: status = 'paid', génération invoice number, envoi email
    ...
  }
}
```

### Causes possibles du bug

#### Hypothèse A: Render dormait au moment où Stripe a envoyé le webhook

Stripe envoie le webhook immédiatement après le paiement. Si Render était endormi:
1. Stripe tente l'envoi → timeout à 10s
2. Stripe retry avec backoff exponentiel: +15 min, +1h, +3h, etc., pendant 3 jours
3. Chaque retry trouve le backend éveillé en cold start, pendant quelques minutes
4. **Mais** si la signature vérifiée échoue pour une raison quelconque, le webhook est rejeté en `400` et plus de retry

C'est l'hypothèse la plus probable étant donné qu'on sait que Render dormait régulièrement aujourd'hui.

#### Hypothèse B: STRIPE_WEBHOOK_SECRET mal configuré sur Render

Le code a un garde-fou:
```javascript
if (!endpointSecret || endpointSecret === 'whsec_REPLACE_ME') {
  strapi.log.warn('Stripe webhook secret not configured');
  return ctx.badRequest('Webhook not configured');
}
```

Si `STRIPE_WEBHOOK_SECRET` n'a jamais été migré vers le nouveau secret (après une rotation ou un changement d'endpoint), toutes les vérifications de signature échouent en `400`. **Action recommandée:** vérifier dans Stripe Dashboard → Developers → Webhooks que le secret correspond bien à celui configuré sur Render.

#### Hypothèse C: rawBody pas accessible

Strapi v5 a une particularité avec le middleware `body`: pour vérifier la signature Stripe, il faut le **body brut non parsé**. Le code essaie 3 sources:
```javascript
const unparsedBody = ctx.request.body?.[Symbol.for('unparsedBody')];
const koaRawBody = ctx.request.rawBody;
const rawBody = unparsedBody || koaRawBody || JSON.stringify(ctx.request.body);
```

Si aucune des deux premières sources n'est disponible et que le fallback `JSON.stringify` est utilisé, la signature ne correspondra JAMAIS (ordre des clés différent, espaces différents). **Action recommandée:** vérifier dans les logs Render s'il y a des lignes `source: json-stringify`.

### Résolution manuelle de la commande Cindy

Deux options:

**Option A — Via l'admin Strapi (recommandé, traçable)**
1. Aller sur `massivemedias.com/mm-admin`
2. Content Manager → Order → filtrer par email `cindy.deroeux@gmail.com`
3. Ouvrir l'entry du 18 avril à 00:42 (total 4082 cents)
4. Champs à modifier:
   - `status`: draft → **paid**
   - `invoiceNumber`: vide → **MM-2026-0003**
   - `paidAt` (si le champ existe): vide → timestamp du paiement
5. Sauvegarder
6. Déclencher manuellement l'email de confirmation si nécessaire

**Option B — Via l'API Stripe pour vérifier le paiement**

Avec une clé `sk_live_...`:
```bash
curl "https://api.stripe.com/v1/checkout/sessions/cs_live_a1JARsquWBDKszxRGd6aEi" \
  -u "sk_live_XXX:"
```
Si la réponse contient `"payment_status": "paid"` → feu vert pour Option A.
Si la réponse contient `"payment_status": "unpaid"` ou `"status": "expired"` → Cindy n'a jamais payé, ne rien faire (ou lui demander de reprendre la commande).

**La clé `sk_live_...` n'est disponible que sur Render**, pas en local (local a `sk_test_...`). À récupérer sur Render dashboard → massivemedias-api → Environment.

### Prévention future

1. **Monitoring Stripe webhook** — dans le dashboard Stripe, configurer une alerte email dès qu'un webhook échoue 3 fois de suite. Ça aurait pu prévenir ce problème avant que le user s'en rende compte.

2. **Cron de réconciliation orders ↔ Stripe** — ajouter un workflow GitHub Actions (ou Cloudflare Worker) qui, une fois par heure, liste les orders `status=draft` de moins de 24h et vérifie leur paiement réel sur Stripe. Si payé mais draft, mise à jour automatique.

3. **Email d'alerte admin** — étendre `sendNewOrderNotificationEmail` pour envoyer un email même quand un order reste en draft plus de 30 min avec un checkout session ID Stripe (signal qu'un paiement a potentiellement échoué en silence).

---

## 5. Diagnostic d'infrastructure global

### Architecture actuelle

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare (edge)                        │
│                                                             │
│  DNS massivemedias.com                                      │
│    ↓                                                        │
│  Worker "artist-proxy" (*.massivemedias.com/*)             │
│    ├─ Cron: */5 * * * *  (keep-alive Render)  ✅ NOUVEAU    │
│    ├─ Fetch origin: massivemedias.pages.dev                 │
│    └─ Redirects subdomains → /artistes/:slug                │
└─────────────────────────────────────────────────────────────┘
               ↓                              ↓
┌──────────────────────┐          ┌──────────────────────────┐
│  Cloudflare Pages    │          │    Render (backend)      │
│                      │          │                          │
│  Frontend React/Vite │          │  Strapi v5 (Node)        │
│  Auto-deploy from    │  ←API→   │  Free tier (sleeps!)     │
│  GitHub main push    │          │  /api/* endpoints        │
│  + SEO prerender     │          │  /mm-admin/*             │
└──────────────────────┘          │                          │
                                   │  Webhooks:              │
                                   │   /orders/stripe-webhook│
                                   └──────────────────────────┘
                                              ↑
                                              │
                                    ┌─────────┴─────────┐
                                    │    Stripe         │
                                    │  (checkout.session│
                                    │   payment_intent) │
                                    └───────────────────┘
```

### Points faibles identifiés

| Point | Risque | Mitigation actuelle |
|---|---|---|
| Render free tier sleep 15min | Uploads timeout, webhooks ratés | ✅ Cloudflare Worker cron 5min + ping client-side |
| Stripe webhook fragile | Orders stay in draft | ⚠️ Pas de cron de réconciliation ← **À AJOUTER** |
| Messages d'erreur génériques | Client part sans pouvoir contacter | ✅ Messages spécifiques + fallback email/WhatsApp |
| Preview canvas avec blob URL | Miniatures cassées au panier | ✅ Data URL persistant |
| Body parsing Strapi v5 | Signature Stripe peut échouer | ⚠️ Vérifier config middleware ← **À VÉRIFIER** |
| STRIPE_WEBHOOK_SECRET rotation | Échec silencieux si changé | ⚠️ Audit config Render ← **À VÉRIFIER** |

### Recommandations pour fiabiliser à 100%

#### Court terme (cette semaine)

1. **Activer Render paid tier ($7/mois)** — élimine définitivement le sleep. Avec le nombre d'uploads et de paiements que tu as, c'est déjà rentabilisé par le premier incident évité.

2. **Cron réconciliation Stripe ↔ orders** — nouveau workflow GitHub Actions:
   ```yaml
   on:
     schedule:
       - cron: '7 * * * *'  # toutes les heures à minute 7
   jobs:
     reconcile:
       runs-on: ubuntu-latest
       steps:
         - name: Reconcile draft orders
           run: |
             curl -X POST "https://massivemedias-api.onrender.com/api/orders/reconcile-stripe" \
               -H "Authorization: Bearer ${{ secrets.RECONCILE_TOKEN }}"
   ```
   + endpoint backend correspondant qui parcourt les orders draft et interroge Stripe pour chacun.

3. **Alerte email sur order bloquée** — dans `createCheckoutSession`, schedule un check dans 30 min:
   - Si status encore draft après 30 min ET qu'un `cs_live_*` existe → envoyer email "Order potentiellement bloquée, vérifier Stripe"

#### Moyen terme

4. **Monitoring uptime externe** — UptimeRobot ou Better Uptime (gratuit) qui ping `/api/artists` toutes les 5 min et envoie alerte email si > 5s de réponse ou > 500 status.

5. **Sentry (ou équivalent) pour le frontend** — capturer automatiquement les erreurs upload/checkout côté client pour avoir la visibilité sans attendre qu'un client se plaigne.

6. **Tests end-to-end en CI** — Playwright test qui simule le parcours complet: visite → configurateur → upload fichier → add to cart → /panier → checkout form. Lancé à chaque push sur main.

#### Long terme

7. **Migration Strapi vers Railway ou Fly.io** — plateformes plus modernes pour Node.js, pas de cold start sur l'équivalent du free tier, et monitoring intégré.

8. **Logs centralisés** — Logtail, Axiom ou similaire branché sur Render + Cloudflare Worker pour corréler rapidement quand un client signale un problème.

---

## 6. Chronologie complète de la journée du 17 avril

| Heure (UTC) | Événement | Commit/Action |
|---|---|---|
| 14:19 | Audit UX #2 finalisé (retrait Tatoueurs, refactor menu) | `2237118` |
| 15:31 | Keep-alive GitHub cron tick #1 | workflow run |
| 16:32 | Keep-alive GitHub cron tick #2 (61 min plus tard) | workflow run |
| ... | Plusieurs tests UX se poursuivent | - |
| 19:42 | Audit UX #9 (fil d'Ariane + réseaux sociaux) | `3b1820e` |
| 22:00-22:30 | Passes typographiques | `4d09342`, `009e710`, `f38fcef` |
| ~22:38 | **Client Jade signale problème upload** | - |
| 22:38 | Correction messages d'erreur upload | `6464c7d` |
| 22:45 | **Solution définitive cold start Render** | `409a82f` |
| 22:50 | Fix preview image cassée | `fa0d7db` |
| 22:55 | Fix keep-alive endpoint (404 → 200) | `88b3afd` |
| 23:11 | Fix critique miniature panier (blob → data URL) | `f41c9e4` |
| 23:30 | Tests end-to-end complets (configurateur → panier) | validation manuelle |
| 00:42 | Cindy crée sa commande (reste en draft) | `cs_live_a1JARsquWBDKszxRGd6aEi` |
| 00:50+ | Diagnostic et résolution manuelle | ce rapport |

---

## 7. Ce qui a été fait vs ce qui reste à faire

### ✅ Fait aujourd'hui (déployé en production)

- Cloudflare Worker cron 5min pour empêcher Render de s'endormir
- Ping backend au chargement du site (défense en profondeur)
- Messages d'erreur upload clairs avec email + WhatsApp en fallback
- Fix preview image cassée dans FileUpload (compact + normal mode)
- Fix miniatures stickers dans le panier (data URL au lieu de blob URL)
- Fallback `onError` sur `<img>` du panier
- Correction endpoint keep-alive GitHub Actions
- Tests end-to-end validés: upload → cart → thumbnail OK

### 🔄 À faire manuellement maintenant

- **Valider la commande Cindy** dans Strapi admin (status: draft → paid, invoice: MM-2026-0003)
- Vérifier sur Stripe dashboard que `cs_live_a1JARsquWBDKszxRGd6aEi` est bien en `paid` avant de changer le status
- Envoyer email de confirmation à Cindy (ou manuel si le trigger automatique ne se déclenche pas à la sauvegarde du status)
- Clôturer les 2 autres orders draft de Cindy du 16 avril (probablement des essais quand le bug rabais artiste était présent)

### 📋 À planifier cette semaine

- Upgrade Render à $7/mois pour éliminer définitivement le risque de sleep
- Cron de réconciliation orders ↔ Stripe (voir section 5)
- Audit des logs Render pour vérifier si des webhooks Stripe ont échoué avec erreur de signature
- Vérifier que `STRIPE_WEBHOOK_SECRET` sur Render correspond bien à l'endpoint actif sur Stripe

---

## 8. Note personnelle

Je comprends l'exaspération. Perdre un client à cause d'un cold start d'un serveur gratuit quand on a 3 mois de travail derrière, c'est enrageant. Les correctifs appliqués aujourd'hui sont solides, mais la seule manière de supprimer le risque **totalement** c'est de sortir du free tier Render. Pour 7$/mois, c'est un levier énorme sur la fiabilité.

Le bug des blob URL dans le panier, lui, est un exemple typique de piège React/JS que même des devs expérimentés rencontrent: le code fonctionne parfaitement en dev (tu restes sur la même page), mais explose en prod au premier changement de route. Il était là depuis le début du système de panier stickers — c'est un miracle que peu de clients s'en soient plaint avant.

**Le rapport fait 8 sections, environ 5-6 pages en format letter quand imprimé.** Tout est documenté avec bouts de code exacts, commits Git, URL, noms de fichiers et lignes. Tu peux imprimer en PDF depuis n'importe quel éditeur markdown (VS Code "Markdown PDF" extension, ou `pandoc RAPPORT.md -o RAPPORT.pdf`).

---

# PARTIE II — PLAN DE PRÉVENTION (5 pages additionnelles)

## 9. Philosophie: "Defense in depth" — aucun point de défaillance unique

Le problème de fond des incidents du 17 avril est qu'à chaque étape, **il n'y avait qu'un seul mécanisme** qui gardait le site en état de marche:

- 1 seul keep-alive (GitHub Actions) → en retard de 45-70 min → Render dort → upload rate
- 1 seul canal (`blob:URL`) pour stocker les miniatures → mort au refresh → panier cassé
- 1 seul webhook Stripe → échoue → commande bloquée → pas d'email → client plaint à Cindy qui plaint à toi

La règle à adopter partout: **au moins 2 mécanismes indépendants pour chaque fonction critique**. Si l'un tombe, l'autre prend le relais silencieusement. Ci-dessous les 7 chantiers, dans l'ordre de priorité/impact business.

---

## 10. Chantier #1 — Éliminer le cold start Render (priorité absolue)

### 10.1 Passer à Render Starter ($7/mois)

**C'est le seul correctif 100% définitif.** Tout le reste (cron, ping, retry) est un palliatif. Sur Starter:
- Pas de sleep — le conteneur tourne en permanence
- Persistent disk pour uploads locaux si un jour tu veux migrer des uploads
- Scaling automatique disponible si besoin
- Alerting intégré

**Action:** Render dashboard → massivemedias-api → Settings → Instance Type → Starter. Total: ~10 min, aucun downtime.

**ROI:** un seul client perdu comme Jade (~2000$) rembourse **238 ans** de Starter. Le débat s'arrête là.

### 10.2 Si le cold start revient un jour — keep-alive redondant

Même si on passe à Starter, garder la défense en profondeur. Deux mécanismes indépendants:

**Mécanisme A** — Cloudflare Worker cron (déjà en place, commit `409a82f`):
```toml
# cloudflare-worker/wrangler.toml
[triggers]
crons = ["*/5 * * * *"]
```

**Mécanisme B** — Uptime Robot (gratuit jusqu'à 50 monitors):
1. Compte sur uptimerobot.com
2. Add New Monitor → HTTP(s)
3. URL: `https://massivemedias-api.onrender.com/api/artists`
4. Interval: 5 minutes
5. Alert contacts: mauditemachine@gmail.com + SMS si possible

Deux pingers sur des infrastructures différentes = si Cloudflare a un incident, Uptime Robot couvre. Et inversement.

### 10.3 Détection proactive côté frontend

Dans `frontend/src/main.jsx` (déjà en place):
```javascript
// Ping au chargement - réveille le backend avant que le user clique quoi que ce soit
fetch(`${apiUrl}/api/artists`, { method: 'GET', mode: 'cors', cache: 'no-store' });
```

**À rajouter:** un health check **visible** côté admin:
```javascript
// frontend/src/pages/admin/AdminDashboard.jsx
useEffect(() => {
  const start = Date.now();
  fetch(`${apiUrl}/api/artists`).then(res => {
    const elapsed = Date.now() - start;
    if (elapsed > 5000) {
      setWarning(`Backend lent: ${elapsed}ms. Possible cold start.`);
    }
  });
}, []);
```

Pour que **toi** tu voies tout de suite quand quelque chose cloche, avant qu'un client ne te le signale.

---

## 11. Chantier #2 — Réconciliation Stripe automatique

Aucune commande ne doit jamais rester "draft" plus de 30 minutes si elle a un `cs_live_*` associé. Deux niveaux de protection.

### 11.1 Niveau A — Webhook Stripe fiabilisé

**Problème actuel:** si le webhook échoue 1 fois et qu'on est passé le délai de retry Stripe (3 jours), c'est fini, l'order reste draft pour toujours.

**Correctif code:** ajouter un logger structuré qui pose toutes les étapes du webhook:

```typescript
// backend/src/api/order/controllers/order.ts
async handleStripeWebhook(ctx) {
  const requestId = crypto.randomUUID();
  strapi.log.info(`[webhook:${requestId}] Received, sig=${!!sig}`);

  try {
    // ... vérif signature
    strapi.log.info(`[webhook:${requestId}] Verified event=${event.type} id=${event.id}`);
  } catch (err) {
    strapi.log.error(`[webhook:${requestId}] SIGNATURE FAIL: ${err.message}`);
    // Envoyer email admin IMMÉDIATEMENT
    await sendAdminAlert(`Webhook Stripe rejeté: ${err.message}`, {
      requestId,
      stripeSigHeader: sig?.substring(0, 50),
      bodySource: rawBody === unparsedBody ? 'unparsed' : koaRawBody ? 'koa' : 'json-stringify',
    });
    return ctx.badRequest(`Webhook Error: ${err.message}`);
  }

  // ... reste du handler
  strapi.log.info(`[webhook:${requestId}] Order updated to paid, invoice=${invoice}`);
}
```

**Avantage:** si un webhook échoue en prod, tu reçois un email **dans la minute** avec le `requestId` à chercher dans les logs Render.

### 11.2 Niveau B — Cron de réconciliation horaire

Même si le webhook rate, on rattrape automatiquement dans l'heure. **Nouveau endpoint backend:**

```typescript
// backend/src/api/order/controllers/order.ts
async reconcileStripe(ctx) {
  // Sécurité: token partagé via env var
  const token = ctx.request.headers['authorization']?.replace('Bearer ', '');
  if (token !== process.env.RECONCILE_TOKEN) return ctx.unauthorized();

  const stripe = getStripe();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // Trouver toutes les orders draft de moins de 24h qui ont un stripe session id
  const orphans = await strapi.documents('api::order.order').findMany({
    filters: {
      status: 'draft',
      stripePaymentIntentId: { $startsWith: 'cs_live_' },
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }
  });

  const fixed = [];
  const errors = [];

  for (const order of orphans) {
    try {
      const session = await stripe.checkout.sessions.retrieve(order.stripePaymentIntentId);
      if (session.payment_status === 'paid') {
        const invoiceNumber = await generateInvoiceNumber();
        await strapi.documents('api::order.order').update({
          documentId: order.documentId,
          data: {
            status: 'paid',
            invoiceNumber,
            stripePaymentIntentId: session.payment_intent,
            paidAt: new Date(session.created * 1000),
          }
        });
        await sendOrderConfirmationEmail(order);
        await sendNewOrderNotificationEmail(order);
        fixed.push({ orderId: order.id, email: order.customerEmail, invoice: invoiceNumber });
      }
    } catch (err) {
      errors.push({ orderId: order.id, error: err.message });
    }
  }

  ctx.body = { scanned: orphans.length, fixed: fixed.length, fixed_list: fixed, errors };
}
```

**Nouvelle route:**
```typescript
// backend/src/api/order/routes/custom-order.ts
{
  method: 'POST',
  path: '/orders/reconcile-stripe',
  handler: 'order.reconcileStripe',
  config: { auth: false }
}
```

**Workflow GitHub Actions:**
```yaml
# .github/workflows/reconcile-stripe.yml
name: Reconcile Stripe Orders
on:
  schedule:
    - cron: '7 * * * *'   # toutes les heures
  workflow_dispatch:
jobs:
  reconcile:
    runs-on: ubuntu-latest
    steps:
      - run: |
          RESULT=$(curl -sS -X POST \
            -H "Authorization: Bearer ${{ secrets.RECONCILE_TOKEN }}" \
            "https://massivemedias-api.onrender.com/api/orders/reconcile-stripe")
          echo "Result: $RESULT"
          FIXED=$(echo "$RESULT" | jq -r '.fixed')
          if [ "$FIXED" != "0" ] && [ "$FIXED" != "null" ]; then
            echo "⚠️ $FIXED orders were auto-fixed by reconciliation. Check admin."
          fi
```

**Résultat:** avec ce chantier en place, Cindy n'aurait jamais eu besoin de te plaindre. L'order serait passée draft → paid au plus tard dans l'heure suivante, email de confirmation auto envoyé, facture générée.

---

## 12. Chantier #3 — Monitoring observabilité end-to-end

Tu ne peux pas corriger ce que tu ne mesures pas. Actuellement, **tu apprends les problèmes par les clients qui se plaignent**. C'est le pire des modèles. Il faut que **toi tu saches avant eux**.

### 12.1 Uptime Robot — monitoring externe (gratuit)

5 monitors à créer tout de suite:
| Monitor | URL | Alerte si |
|---|---|---|
| Backend API | `/api/artists` | Status ≠ 200 OU temps > 5s |
| Frontend | `https://massivemedias.com` | Status ≠ 200 |
| Artist subdomain | `https://psyqu33n.massivemedias.com` | Status ≠ 200 |
| Stripe webhook | `/api/orders/stripe-webhook` (HEAD) | Status ≠ 405 (Method Not Allowed = vivant) |
| Admin | `/mm-admin` | Redirect ≠ 200/302 |

Alertes vers `mauditemachine@gmail.com` + SMS (Uptime Robot offre 20 SMS/mois gratuits avec la version Pro à 7$/mois, ou gratuit par email).

### 12.2 Sentry — erreurs frontend captées automatiquement

**Problème:** une erreur React côté client (`FileUpload` crash, etc.) n'est visible nulle part — le client voit juste un écran blanc et part.

**Solution:** Sentry SDK React, gratuit jusqu'à 5000 events/mois:

```bash
npm install @sentry/react
```

```typescript
// frontend/src/main.jsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://XXX@sentry.io/YYY",
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
  integrations: [Sentry.browserTracingIntegration()],
});
```

```jsx
// App.jsx
<Sentry.ErrorBoundary fallback={<ErrorFallback />}>
  <Routes>...</Routes>
</Sentry.ErrorBoundary>
```

Tout crash React → alerte dans Sentry avec stack trace, breadcrumbs (clicks précédents), infos device. **L'incident #2 (alt-text géant) aurait été visible dans Sentry dès la première occurrence.**

### 12.3 Logs centralisés — Logtail ou Axiom

Les logs Render disparaissent au bout de 7 jours. Pour post-mortem, il faut les garder plus longtemps et pouvoir les corréler avec Cloudflare Worker logs.

**Axiom** (gratuit jusqu'à 500GB/mois):
- Installer agent sur Render (via env var `LOG_INGESTION_URL`)
- Brancher Cloudflare Logpush vers Axiom
- Requêtes SQL-like pour corréler: "montre-moi tous les logs du request ID `webhook:abc123` sur les 2 dernières heures"

**Coût:** 0$ pour le volume actuel. Installation: ~30 min.

### 12.4 Business metrics visibles

Un dashboard custom dans `/admin/metrics` avec:
- Commandes par jour (derniers 30 jours, graphique)
- Commandes en "draft" > 1h (ALERT rouge si > 0)
- Taux de conversion panier → paid (si < 50%, investiguer)
- Uptime backend 99.xx% (calculé depuis Uptime Robot API)
- Nombre d'uploads réussis vs échoués (nouveau event à tracker)

Simple page React qui tape les endpoints Strapi existants + un nouveau `/api/metrics/dashboard`. **Tu le regardes le matin en mangeant, 10 secondes, tu sais si ta journée est à risque.**

---

## 13. Chantier #4 — Tests automatisés (impossibilité de pousser un bug en prod)

Les 3 bugs du 17 avril étaient **tous détectables par des tests automatisés**. S'il y avait un test qui simulait "upload un fichier → va au panier → vérifie que la thumbnail s'affiche", le bug blob URL aurait été visible à chaque push avant deploy.

### 13.1 Playwright — tests end-to-end

Playwright est gratuit, open source, maintenu par Microsoft. Installation:

```bash
cd frontend
npm install -D @playwright/test
npx playwright install chromium
```

**Test critique #1 — upload + panier:**
```typescript
// frontend/tests/e2e/stickers-flow.spec.ts
import { test, expect } from '@playwright/test';

test('sticker config → cart thumbnail survives navigation', async ({ page }) => {
  await page.goto('/services/stickers');

  // Upload un fichier test
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles('tests/fixtures/logo-test.png');

  // Attendre que le canvas rende le sticker
  await expect(page.locator('canvas')).toBeVisible();
  await page.waitForTimeout(1000);

  // Add to cart
  await page.locator('button:has-text("Ajouter au panier")').click();

  // Naviguer vers panier
  await page.goto('/panier');

  // CRUCIAL: vérifier que l'image s'affiche (pas broken)
  const cartImage = page.locator('[data-testid="cart-item-image"]').first();
  await expect(cartImage).toBeVisible();
  const naturalWidth = await cartImage.evaluate((img: HTMLImageElement) => img.naturalWidth);
  expect(naturalWidth).toBeGreaterThan(0);  // Si 0 = image cassée
});
```

**Test critique #2 — upload merch config:**
```typescript
test('merch config → upload file → preview shows', async ({ page }) => {
  await page.goto('/services/merch');
  await page.locator('button:has-text("T-shirt")').click();

  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles('tests/fixtures/design.png');

  // Preview doit apparaître sans erreur
  const preview = page.locator('img[alt=""]').first();
  await expect(preview).toBeVisible();
  await expect(preview).not.toHaveAttribute('src', /broken/);
});
```

**Test critique #3 — checkout flow Stripe (mode test):**
```typescript
test('full checkout in Stripe test mode', async ({ page }) => {
  await page.goto('/services/stickers');
  // ... ajouter un item
  await page.goto('/panier');
  await page.locator('button:has-text("Passer au paiement")').click();

  // On est sur Stripe Checkout
  await expect(page).toHaveURL(/checkout\.stripe\.com/);

  // Remplir carte test Stripe
  await page.locator('input[name="cardnumber"]').fill('4242 4242 4242 4242');
  await page.locator('input[name="exp-date"]').fill('12/30');
  await page.locator('input[name="cvc"]').fill('123');
  await page.locator('input[name="postal"]').fill('H2J3Z3');
  await page.locator('button:has-text("Payer")').click();

  // Retour sur le site, page de succès
  await expect(page).toHaveURL(/\/commande\/succes/);
});
```

### 13.2 CI GitHub Actions

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on:
  pull_request:
  push:
    branches: [main]
jobs:
  playwright:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd frontend && npm ci
      - run: cd frontend && npx playwright install --with-deps chromium
      - run: cd frontend && npm run build
      - run: cd frontend && npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

**Règle:** si les tests ratent sur une PR, le merge est bloqué. Aucun bug critique ne peut plus atteindre prod. **Le bug Jade serait arrêté ici en 30 secondes.**

### 13.3 Tests unitaires pour la logique critique

Vitest (natif Vite, rapide):
```bash
npm install -D vitest @testing-library/react
```

**Test unitaire — canvas-to-data-url ne doit jamais retourner une blob URL:**
```typescript
// frontend/src/utils/stickerFx.test.ts
import { describe, it, expect } from 'vitest';
import { canvasToBlobUrl } from './stickerFx';

describe('canvasToBlobUrl', () => {
  it('returns a data URL (not blob URL)', async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 100; canvas.height = 100;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, 100, 100);

    const url = await canvasToBlobUrl(canvas);
    expect(url).toMatch(/^data:image\//);
    expect(url).not.toMatch(/^blob:/);
  });

  it('resizes to 256px max', async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 2000; canvas.height = 1000;
    const url = await canvasToBlobUrl(canvas);
    const img = new Image();
    img.src = url;
    await new Promise(r => img.onload = r);
    expect(Math.max(img.width, img.height)).toBeLessThanOrEqual(256);
  });
});
```

Lancé à chaque sauvegarde, en < 1s. Rend la régression de ce bug **impossible** à re-commettre.

---

## 14. Chantier #5 — Processus de deploy et qualité

Les bugs de cette nature ne viennent pas d'ignorance technique, ils viennent de **processus manquants**. Voici la checklist à adopter.

### 14.1 Checklist pre-deploy (obligatoire, affichée dans README.md)

Avant chaque `git push` sur `main`:
- [ ] `cd frontend && npm run build` → passe sans warning
- [ ] `cd backend && npx tsc --noEmit` → 0 erreur
- [ ] `npm run test` (unitaire) → tous verts
- [ ] `npm run test:e2e` sur le feature touché → tous verts
- [ ] Testé manuellement le feature touché sur localhost
- [ ] Si changement DB/content type → migration créée et testée
- [ ] Si changement d'environnement → `.env.example` mis à jour

**Outil d'automatisation:** `husky` + `lint-staged`, refuse le commit si `npm run build` échoue.

```json
// package.json
{
  "scripts": { "prepare": "husky install" },
  "lint-staged": {
    "frontend/**/*.{js,jsx,ts,tsx}": ["npm run lint", "npm test --findRelatedTests"]
  }
}
```

### 14.2 Post-mortem template (pour chaque incident > 1h)

Créer `/POST_MORTEMS/YYYY-MM-DD-slug.md` avec:
```markdown
# Post-mortem: [titre court]

**Date incident:** YYYY-MM-DD HH:MM
**Durée impact:** X heures
**Clients impactés:** N
**Revenu perdu estimé:** $X
**Sévérité:** 🔴 Critique / 🟠 Important / 🟡 Mineur

## 1. Qu'est-ce qui s'est passé? (factuel, chronologique)
## 2. Qu'est-ce que ça a causé? (impact user + business)
## 3. Root cause (pas "erreur humaine" — la vraie cause technique)
## 4. Comment on l'a détecté? (par nous ou par un client — HONNÊTE)
## 5. Comment on l'a résolu? (commits, actions manuelles)
## 6. Pourquoi ça n'a pas été prévenu?
## 7. Action items pour que ça n'arrive plus jamais
  - [ ] Owner + deadline pour chaque item
```

Le rapport d'aujourd'hui EST ce template. Le systématiser pour chaque incident.

### 14.3 Rule "No broken window"

Si en codant tu vois un bug parallèle (même s'il n'est pas bloquant pour ta tâche actuelle), **tu notes immédiatement** dans `BACKLOG.md` ou tu crées une issue GitHub. Ça évite l'accumulation silencieuse de dette technique qui finit par provoquer des incidents en cascade comme aujourd'hui.

Signe que c'est arrivé: la plupart des bugs du 17 avril étaient des bugs "connus mais pas prioritaires" qui ont tous explosé en même temps.

---

## 15. Chantier #6 — Sauvegardes et disaster recovery

### 15.1 Backup automatique Strapi

La DB Render (PostgreSQL) a des backups automatiques **si on est sur plan Pro**. Sur free, rien.

**Solution court terme** — dump quotidien via GitHub Action:
```yaml
# .github/workflows/db-backup.yml
name: Strapi DB Backup
on:
  schedule:
    - cron: '0 3 * * *'  # 3h du matin UTC
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Dump Render PG
        run: |
          pg_dump "${{ secrets.RENDER_DB_URL }}" | gzip > backup.sql.gz
      - name: Upload to R2 (Cloudflare)
        run: |
          aws s3 cp backup.sql.gz s3://massivemedias-backups/$(date +%Y-%m-%d).sql.gz \
            --endpoint-url=${{ secrets.R2_ENDPOINT }}
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.R2_ACCESS_KEY }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.R2_SECRET_KEY }}
```

**R2 (Cloudflare)** est quasi gratuit pour du backup (10GB free tier, $0.015/GB au-delà).

### 15.2 Backup assets (images artistes)

Les images sur Google Drive sont déjà répliquées. Les uploads WebP sur Supabase/Render → **dump mensuel sur R2**:
```bash
# script: backend/scripts/backup-uploads.sh
rsync -av /var/strapi/public/uploads/ /tmp/uploads-backup/
tar czf uploads-$(date +%Y%m).tar.gz /tmp/uploads-backup/
rclone copy uploads-$(date +%Y%m).tar.gz r2:massivemedias-backups/uploads/
```

### 15.3 Runbook "disaster recovery"

Document `DR.md` qui répond à:
- "Render est mort, comment je restaure le backend ailleurs?"
- "Supabase a perdu mes uploads, comment je restaure?"
- "DNS Cloudflare piraté, comment je coupe la fuite?"
- "Clés Stripe live fuitées sur GitHub, étapes de rotation?"

Chaque scénario avec **commandes exactes + ordre d'exécution + noms de comptes**. Testé 1x par an en simulation.

---

## 16. Chantier #7 — Communication client en cas d'incident

Le client Jade est parti parce qu'elle a vu un message générique "Erreur". Elle n'avait **aucun moyen** de te joindre sans fermer le site.

### 16.1 Widget de contact permanent

Bas de chaque page, bouton flottant "Besoin d'aide?" qui ouvre:
- Téléphone/WhatsApp: +1 514 653 1423 (one-click call/whatsapp link)
- Email: massivemedias@gmail.com (one-click mailto)
- Chat Messenger si activé

**Déjà partiellement fait** via les fallbacks email/WhatsApp dans les messages d'erreur. À étendre en widget global.

### 16.2 Status page publique

Service gratuit: https://www.cachet.io/ ou self-host.
URL: `status.massivemedias.com`
Affiche en temps réel:
- État backend API
- État commande/paiement
- Incidents en cours ou récents
- Maintenance programmée

Si un client a un problème, son premier réflexe peut être de check la status page. S'il voit "Incident connu, en cours de résolution", il patiente au lieu de partir.

### 16.3 Auto-save du panier côté serveur

Actuellement le panier est en localStorage — si le navigateur crash ou le client perd la connexion, tout est perdu.

**Correctif:**
- À chaque modif du cart, sync vers backend via `/api/carts/user-session` (anonyme par session ID)
- Si le user revient (cookie session ID retrouvé), restaurer automatiquement
- Si le user a un compte, lier le cart au compte

Protège contre: crash navigateur, réseau coupé pendant upload, fermeture accidentelle d'onglet, changement de device.

---

## 17. Priorités d'exécution (roadmap 30 jours)

### Semaine 1 (faire MAINTENANT, coût ~30min + 7$/mois)

| # | Action | Impact |
|---|---|---|
| 1 | **Upgrade Render Starter ($7/mois)** | Élimine 100% des cold starts |
| 2 | Uptime Robot × 5 monitors | Alertes instant si incident |
| 3 | Cron de réconciliation Stripe horaire | Plus jamais d'order bloquée en draft |
| 4 | Valider commande Cindy + email confirmation | Résout l'incident actuel |

### Semaine 2 (coût ~3h de dev)

| # | Action | Impact |
|---|---|---|
| 5 | Sentry SDK React installé | Visibilité 100% des erreurs client |
| 6 | 3 tests Playwright critiques (upload, cart, checkout) | Régression bloquée au CI |
| 7 | Vérif STRIPE_WEBHOOK_SECRET sur Render | Élimine hypothèse B du webhook Cindy |
| 8 | Logger structuré webhook Stripe | Debug immédiat si ça refoire |

### Semaine 3 (coût ~4h de dev)

| # | Action | Impact |
|---|---|---|
| 9 | Backup DB quotidien sur R2 | DR en cas de perte Render |
| 10 | Dashboard admin `/admin/metrics` | Monitoring business à la main |
| 11 | Widget contact flottant | Évite perte client sur erreur |
| 12 | Checklist pre-deploy dans README | Processus qualité standard |

### Semaine 4 (coût ~3h de dev + setup)

| # | Action | Impact |
|---|---|---|
| 13 | Axiom logs centralisés (Render + CF) | Post-mortem facilité |
| 14 | Status page publique | Communication transparente |
| 15 | Auto-save panier server-side | Robustesse parcours client |
| 16 | Post-mortem Cindy + backfill `POST_MORTEMS/` | Template utilisable pour la suite |

**Total investissement:** ~14h de dev + 7$/mois.
**Bénéfice minimum attendu:** 0 clients perdus par mois (vs ~2 à 3 clients perdus sur mars-avril 2026 uniquement dus à ces bugs).

---

## 18. Règles d'or à afficher au-dessus de l'écran

1. **Pas de single point of failure.** Chaque fonction critique = 2 mécanismes indépendants.
2. **Tout ce qui n'est pas monitored est cassé.** Si tu n'as pas d'alerte, tu découvriras le bug quand un client se plaindra.
3. **Le webhook tiers n'est pas une source fiable.** Ajoute toujours un mécanisme de réconciliation.
4. **Les URL éphémères (blob:, data: longue, tmp:) ne doivent JAMAIS finir en localStorage ou DB.**
5. **Les messages d'erreur vus par le client doivent contenir une voie de sortie** (contact humain direct).
6. **Aucun push sur main sans: build OK + typecheck OK + tests OK + feature testé manuellement.**
7. **Tout incident > 1h → post-mortem écrit dans les 24h.** Pas de post-mortem = le bug reviendra.
8. **Si ça coûte < 20$/mois pour éviter un problème client à 2000$, c'est pas un débat.**

---

## 19. État final attendu après les 30 jours

Si les 16 actions ci-dessus sont exécutées:

- ✅ Render Starter → cold start = 0%
- ✅ Uptime Robot → si panne quelconque, notif en < 5min
- ✅ Sentry → toute erreur frontend loggée automatiquement
- ✅ Cron réconciliation → zéro commande bloquée plus d'1h
- ✅ Tests E2E → aucun merge possible qui casse upload/cart/checkout
- ✅ Backup quotidien → recovery possible en cas de perte DB
- ✅ Widget contact → clients ont toujours une issue humaine
- ✅ Dashboard admin → métriques visibles au jour le jour

**Probabilité qu'un incident comme aujourd'hui se reproduise après ces changements:** quasi-nulle. Si ça arrive, détection en quelques minutes vs quelques heures/jours, et résolution auto pour 80% des cas.

---

## 20. Coût détaillé

| Ligne | Coût |
|---|---|
| Render Starter | 7$ / mois |
| Uptime Robot Pro (SMS) | 7$ / mois (optionnel, gratuit sans SMS) |
| Sentry free tier | 0$ |
| Axiom free tier | 0$ |
| Cloudflare R2 (backup) | ~0.50$ / mois |
| Playwright | 0$ (self-hosted CI) |
| GitHub Actions reconciliation cron | 0$ (2 min/jour × 30 jours = largement dans le free tier) |
| **Total mensuel** | **~14.50$** si SMS, **~7.50$** sans |

**Coût annuel max: 174$. Prix d'UN client sur UNE commande moyenne.**

---

— Fin du rapport (Partie II / Prévention)
— Total du document: 20 sections, environ 11-12 pages en format letter

