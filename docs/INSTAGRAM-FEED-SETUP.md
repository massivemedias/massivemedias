# IG-FEED : ce que Mika doit faire côté Meta / Instagram (Phase 2)

La mécanique est déjà montée et **live avec des données de test** (fallback). Pour
brancher le **vrai** feed, il faut un jeton d'accès Instagram. Voici les étapes
exactes. Compte ~30 min. Résultat attendu : **une seule valeur**, un
`INSTAGRAM_ACCESS_TOKEN`, que tu me donnes et que je pose sur Render en Phase 2.

> On utilise **« Instagram API with Instagram Login »** (l'API officielle
> actuelle). L'ancienne « Basic Display API » est **fermée depuis décembre 2024**,
> on ne l'utilise pas. Pas besoin de créer une Page Facebook avec cette méthode.

---

## Étape 1 — Passer @massivemedias en compte Professionnel (si ce n'est pas déjà fait)

Dans l'app Instagram sur ton téléphone :
1. Profil → menu ☰ (en haut à droite) → **Paramètres et confidentialité**.
2. **Type de compte et outils** → **Passer à un compte professionnel**.
3. Choisis **Entreprise** (ou Créateur, les deux marchent).

Si @massivemedias est déjà en compte pro, passe à l'étape 2.

---

## Étape 2 — Créer une app Meta

1. Va sur **https://developers.facebook.com/apps/** (connecte-toi avec ton compte
   Facebook ; s'il n'y en a pas, Meta t'en fait créer un — c'est juste le
   compte développeur, pas une Page).
2. Clique **Créer une application** (bouton vert, en haut à droite).
3. À « Cas d'utilisation », choisis **« Accéder à l'API Instagram avec la
   connexion Instagram »** (en anglais : *Access the Instagram API with Instagram
   Login*). Si ce choix n'apparaît pas, prends **« Autre »** puis type
   **« Business »**.
4. Donne un nom (ex. « Massive Feed »), ton courriel, crée l'app.

---

## Étape 3 — Ajouter le produit Instagram

1. Dans le tableau de bord de l'app, colonne de gauche : **Ajouter un produit**
   → trouve **Instagram** → **Configurer**.
2. Ouvre **API setup with Instagram login** (ou « Configuration de l'API avec
   connexion Instagram »).

---

## Étape 4 — Connecter le compte et générer le jeton

1. Dans cette page, section **« 3. Generate access tokens »** (Générer des jetons
   d'accès), clique **Add account** / **Ajouter un compte**.
2. Une fenêtre Instagram s'ouvre → connecte-toi avec **@massivemedias** → autorise.
3. De retour sur la page Meta, à côté du compte, clique **Generate token**
   (Générer un jeton). Copie la longue chaîne qui apparaît (ça commence souvent
   par `IGAA...`).
   - C'est déjà un **jeton longue durée (~60 jours)**. Notre backend le
     rafraîchit tout seul avant qu'il expire.
4. **Colle-moi cette chaîne** (par un canal privé, pas dans le repo). C'est la
   seule chose dont j'ai besoin.

> Permissions demandées automatiquement par ce flux : `instagram_business_basic`
> (lecture du profil et des médias). Rien de plus, pas d'écriture, pas de DM.

---

## Étape 5 — (moi, Phase 2)

Quand tu me donnes le jeton :
1. Je pose `INSTAGRAM_ACCESS_TOKEN=IGAA…` dans les **variables d'environnement
   Render** (jamais dans le code / git).
2. Je déclenche une première sync (`POST /instagram-posts/sync-now`, admin) pour
   remplir le cache tout de suite, sans attendre le cron.
3. Je vérifie que la section « Nouveautés » de la home montre tes **vrais** 4
   derniers posts (vignette + légende + date + lien).
4. Ensuite le cron reprend seul **toutes les 6 h**.

---

## Ce qui est déjà garanti par l'architecture

- **Zéro cookie tiers / zéro appel Meta côté client** : le navigateur ne parle
  qu'à notre API. Les images sont recopiées sur notre stockage.
- **Jamais de section vide** : si Meta tombe, on ressert le dernier cache ; si
  même l'API interne échoue, la home retombe sur les posts de test.
- **Le jeton n'est jamais commité** : uniquement en variable Render.
- **Rien à refaire tous les 60 jours** : le backend rafraîchit le jeton. (Le seul
  cas où tu devrais regénérer un jeton : si tu changes le mot de passe Instagram
  ou révoques l'app.)
