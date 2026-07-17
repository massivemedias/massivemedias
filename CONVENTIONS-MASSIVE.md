# CONVENTIONS MASSIVE MEDIAS, fichier de référence permanent

Ce fichier s'applique à TOUS les prompts et chantiers Claude Code du projet.
Le lire avant toute action. Aucune exception.

---

## 1. Stack (ne pas deviner, c'est ça)

- Frontend : React 19 + Vite 7 + Tailwind 4, déployé sur Cloudflare Pages
- Backend : Strapi v5 sur Render (Standard), PostgreSQL géré par Render
- Auth : Supabase Auth (JWT). Storage : Supabase (bucket order-files, WebP)
- Paiements : Stripe LIVE (production réelle, clients réels)
- Emails : Resend (getResend singleton, getSender, massiveEmailWrapper)
- Traduction : DeepL. Images : Sharp. Worker : Cloudflare
- Repo : github.com/massivemedias/massivemedias

## 1 bis. Interdits absolus (aucune exception, aucun chantier)

- **Dossier Drive stickers : LECTURE SEULE STRICTE.** Ne JAMAIS renommer, deplacer
  ni supprimer un fichier de `My Drive/Massive/Projets/Massive/Stickers`.
  TOUS ces fichiers sont LIES (Place) dans les .ai Illustrator, rien n'est incorpore :
  toucher a un nom casse les liens des .ai. La casse est SILENCIEUSE, aucun test ne
  la voit, elle apparait a l'ouverture du .ai des mois plus tard.
  Pour croiser slug site et fichier Drive : `frontend/src/data/drive-mapping.csv`
  (regenerable via `frontend/scripts/audit-drive-mapping.mjs`). On croise, on ne
  renomme pas. Chantier NOMS-UNIFIES phase 2 annule definitivement (16 juillet 2026).
- **Designs sous licence : hors catalogue public, definitif.** Voir
  `frontend/src/data/neverPublish.js` (garde-fou technique) et `fanartPrivate.js`
  (memoire metier). Toute sync catalogue filtre via `isNeverPublish()` AVANT de
  proposer un ajout. Risque IP + risque Stripe.
- **Le filigrane CUIT dans le pixel ne se remplace jamais par du CSS.** Un overlay
  CSS est contournable en un clic droit ; le contrat artiste exige le cuit. Les deux
  coexistent : cuit = preuve, CSS = dissuasion.

## 2. Workflow obligatoire

1. Phase d'inspection en LECTURE SEULE avant toute modification.
2. Gates de validation : s'arrêter après chaque chantier et attendre "go next".
3. Un chantier = une branche = un PR. Jamais de mélange de scopes.
4. Pas de refactoring opportuniste. Pas de suppression de code, utiliser des feature flags.
5. Raisonnement AVANT le code (expliquer la cause racine, puis implémenter).
6. Blocs de code complets et déployables, avec chemin de fichier exact.
7. Tout endpoint destructif ou admin passe par requireAdminAuth (réf audit SEC-01/02/03).
8. Webhook Stripe touché = test Stripe CLI obligatoire avant commit.
9. Migration de schema = backup avant.
10. Tests vitest pour les helpers de pricing (pattern établi : 51 tests sur getAffichePrice).

## 3. Règles de formatage (absolues, partout)

- JAMAIS de tiret cadratin ni semi-cadratin. Virgule ou reformulation.
- Prix en convention québécoise : symbole en suffixe (25 $).
- JAMAIS de nom de modèle d'imprimante dans le contenu public ou client-facing
  (OK dans docs internes et business plan uniquement).
- JAMAIS nommer le collaborateur graphiste externe dans un document client ou institutionnel.
- Mika = "compositeur de musique électronique" ou "producteur", jamais "DJ"
  (sauf contexte VRSTL Records).
- Français partout. Contenu site : FR/EN/ES via le système de traduction existant.

## 4. Patterns de code établis

- Constantes multilingues centralisées : pattern constants/workshop.js (WORKSHOP_NOTICE FR/EN/ES).
  Tout nouveau texte transverse suit ce pattern.
- Helpers pricing : fonctions pures dans frontend/src/data/products.js
  (getStickerPrice, getSublimationPrice, getAffichePrice).
- Flags : MERCH_PAUSED dans frontend/src/config/merchStatus.js (modèle de référence).
- Source de vérité prix : divergences Strapi vs frontend connues (~25), résolution
  reportée au chantier PRIX-02 Vague 3 (migration vers /api/pricing-config).
  Ne PAS corriger ces divergences en passant.
- SKU : pattern affiche-standard-${formatId}, qty stockée séparément (réf INVENTORY-A1).
- Loi 25 : IP toujours hashée (SHA-256 salé), salt en variable d'environnement Render,
  jamais en clair dans le code ou le chat.
- QR : redirections en 302 (jamais 301), endpoints de scan publics (auth: false).
- Uploads : streaming obligatoire, jamais de readFileSync en RAM.
- Stripe : toujours supporter le fallback cs_live_ en plus du pi_.

## 5. Vocabulaire métier

- Tiers d'impression Fine Art : "Studio" (qualité premium accessible) et
  "Musée" (Fine Art 12 encres pigmentaires, papier archive, sans acide).
- "Boutique" est BANNI du site, remplacé par "Artistes" (chantier rename en cours,
  fichiers Boutique*.jsx morts à supprimer dans une session dédiée).
- Atelier sur rendez-vous uniquement : messaging systémique via WORKSHOP_NOTICE.
- Affiches Standard : catégorie B2B, exclue du PDF Artiste et du bouton
  "Copier pour artiste" (incompatible avec le modèle de commission artiste).

## 6. Contexte business

- Massive Médias, NEQ 2269057891, 5338 rue Marquette, Montréal H2J 3Z3.
- TPS/TVQ inscrits (effectif 2026-02-08), TPS 5 %, TVQ 9,975 %, déclaration annuelle.
- Production en environnement Stripe LIVE : prudence maximale, progrès incrémental
  avec gates, jamais de "tout corriger d'un coup".

## 7. Format de sortie attendu de Claude Code

- Rapports en markdown unique par chantier.
- Tableaux récapitulatifs courts.
- Chemins de fichiers exacts dans chaque bloc.
- À la fin de chaque chantier : résumé en 5 lignes max + attente du GO.
