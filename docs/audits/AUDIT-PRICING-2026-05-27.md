# Audit de coherence des prix - Massive Medias

**Date** : 2026-05-27
**Branche** : `feat/affiches-standard-et-audit-tarifs`
**Phase** : 6A (audit READ-ONLY, aucun correctif)
**Auteur** : Claude (Sonnet 4.5)

## Methodologie

Cross-check de chaque categorie de prix entre 3 sources :
1. **Code hardcoded frontend** : `frontend/src/utils/pricingData.js` + `frontend/src/pages/AdminTarifs.jsx` + `frontend/src/data/artistPricing.js` + `frontend/src/data/products.js`
2. **Strapi prod** : `https://massivemedias-api.onrender.com/api/products` (19 products, tous avec `pricingData`)
3. **Backend** : `backend/src/utils/pricing-config.ts` (FRAME_PRICES_FALLBACK, STICKER_GRID, FLYER_TIERS, FINE_ART_*_PRICES, SUBLIMATION_UNIT_PRICES, BUSINESS_CARD_TIERS)

Statuts utilises :
- **OK** : 3 sources (ou 2 quand 1 est volontairement absent) concordent exactement
- **DIVERGENCE** : au moins 2 sources ne concordent pas sur la valeur
- **HARDCODED ONLY** : valeur uniquement dans le code (pas dans Strapi)
- **STRAPI ONLY** : valeur uniquement dans Strapi (pas dans code hardcoded ni backend)
- **A VERIFIER** : impossible de comparer (schema different, donnees absentes)

---

## A. Fine Art client - Studio (4 encres)

| Categorie | Item | Code hardcoded | Strapi | Backend | Statut |
|---|---|---|---|---|---|
| Fine Art Studio | A6 (postcard) | 15$ | absent | 15$ | DIVERGENCE (Strapi manque ce format) |
| Fine Art Studio | A4 | **20$** | **16$** | **20$** | **DIVERGENCE** |
| Fine Art Studio | A3 | **25$** | **22$** | **25$** | **DIVERGENCE** |
| Fine Art Studio | A3+ | **35$** | **30$** | **35$** | **DIVERGENCE** |
| Fine Art Studio | A2 | null (sur soumission) | **42$** | null | **DIVERGENCE** (Strapi expose un prix, code dit "sur soumission") |
| Fine Art Studio | 8x8 (sq8) | 20$ | absent | absent | HARDCODED ONLY |
| Fine Art Studio | 10x10 (sq10) | 28$ | absent | absent | HARDCODED ONLY |
| Fine Art Studio | 12x12 (sq12) | 38$ | absent | absent | HARDCODED ONLY |

## B. Fine Art client - Museum (12 encres)

| Categorie | Item | Code hardcoded | Strapi | Backend | Statut |
|---|---|---|---|---|---|
| Fine Art Museum | A6 (postcard) | 30$ | absent | 30$ | DIVERGENCE (Strapi manque ce format) |
| Fine Art Museum | A4 | **40$** | **35$** | **40$** | **DIVERGENCE** |
| Fine Art Museum | A3 | **55$** | **65$** | **55$** | **DIVERGENCE** |
| Fine Art Museum | A3+ | 95$ | 95$ | 95$ | OK |
| Fine Art Museum | A2 | **110$** | **125$** | **110$** | **DIVERGENCE** |
| Fine Art Museum | 8x8 (sq8) | 40$ | absent | absent | HARDCODED ONLY |
| Fine Art Museum | 10x10 (sq10) | 60$ | absent | absent | HARDCODED ONLY |
| Fine Art Museum | 12x12 (sq12) | 85$ | absent | absent | HARDCODED ONLY |

## C. Frame Fine Art (par format)

| Categorie | Item | Code hardcoded | Strapi | Backend | Statut |
|---|---|---|---|---|---|
| Frame | postcard (A6) | 20$ | 20$ | 20$ | OK |
| Frame | A4 | 20$ | 20$ | 20$ | OK |
| Frame | A3 | 30$ | 30$ | 30$ | OK |
| Frame | A3+ | 35$ | 35$ | 35$ | OK |
| Frame | A2 | 45$ | 45$ | 45$ | OK (PRIX-01 deja fixe en avril 2026 selon commentaire `pricing-config.ts` ligne 23) |

## D. Fine Art artistes (commission - prix client final)

| Categorie | Item | Code hardcoded | Strapi | Backend | Statut |
|---|---|---|---|---|---|
| Artist Studio | A6 | 25$ | n/a (override per-artiste) | n/a | HARDCODED ONLY (AdminTarifs.jsx ligne 28) |
| Artist Studio | A4 | 35$ | n/a | n/a | HARDCODED ONLY |
| Artist Studio | A3 | 50$ | n/a | n/a | HARDCODED ONLY |
| Artist Studio | A3+ | 65$ | n/a | n/a | HARDCODED ONLY |
| Artist Studio | A2 | null | n/a | n/a | HARDCODED ONLY |
| Artist Museum | A6 | 50$ | n/a | n/a | HARDCODED ONLY |
| Artist Museum | A4 | 75$ | n/a | n/a | HARDCODED ONLY |
| Artist Museum | A3 | 120$ | n/a | n/a | HARDCODED ONLY |
| Artist Museum | A3+ | 160$ | n/a | n/a | HARDCODED ONLY |
| Artist Museum | A2 | 190$ | n/a | n/a | HARDCODED ONLY |

Note : Strapi gere les overrides per-artiste via `artist.pricing` (JSON libre par artiste), mais aucune grille "artiste generique" cote Strapi/Backend.

## E. Affiches Standard (paliers degressifs)

| Categorie | Item | Code hardcoded | Strapi | Backend | Statut |
|---|---|---|---|---|---|
| Affiches Standard | A4 paliers (6) | absent | 10/8/6/4/3/2.5 | absent | STRAPI ONLY (nouveau, par design) |
| Affiches Standard | A3 paliers (6) | absent | 15/12/8/5/4/3.5 | absent | STRAPI ONLY |
| Affiches Standard | A3+ paliers (6) | absent | 20/15/12/9/7/6 | absent | STRAPI ONLY |

Note : Helper `getAffichePrice()` consomme Strapi via `useProductPricing('affiche-standard')`. Pas de fallback hardcoded volontaire (design du chantier).

## F. Stickers (3 paliers de taille x 5 paliers quantite x 2 finis)

### F.1 Standard (taille <= 2.5") - matte

| Categorie | Qty | Code hardcoded | Strapi | Backend | Statut |
|---|---|---|---|---|---|
| Sticker Std Matte | 25 | 30$ | 30$ | 30$ | OK |
| Sticker Std Matte | 50 | **47.50$** | **45$** | **47.50$** | **DIVERGENCE** |
| Sticker Std Matte | 100 | **85$** | **75$** | **85$** | **DIVERGENCE** |
| Sticker Std Matte | 250 | **200$** | **150$** | **200$** | **DIVERGENCE** |
| Sticker Std Matte | 500 | **375$** | **250$** | **375$** | **DIVERGENCE** (ecart 125$) |

### F.2 Standard - FX (Holographic)

| Categorie | Qty | Code hardcoded | Strapi | Backend | Statut |
|---|---|---|---|---|---|
| Sticker Std FX | 25 | **35$** | **42$** | **35$** | **DIVERGENCE** |
| Sticker Std FX | 50 | **57.50$** | **65$** | **57.50$** | **DIVERGENCE** |
| Sticker Std FX | 100 | **100$** | **110$** | **100$** | **DIVERGENCE** |
| Sticker Std FX | 250 | **225$** | **220$** | **225$** | **DIVERGENCE** |
| Sticker Std FX | 500 | **425$** | **380$** | **425$** | **DIVERGENCE** (ecart 45$) |

### F.3 Medium et Large (taille 3-3.5" et 4-5")

| Categorie | Item | Code hardcoded | Strapi | Backend | Statut |
|---|---|---|---|---|---|
| Sticker Medium matte | 25/50/100/250/500 | 40/65/115/275/500 | absent | 40/65/115/275/500 | HARDCODED ONLY (Strapi pas de tier medium/large) |
| Sticker Medium FX | 25/50/100/250/500 | 50/80/135/305/575 | absent | 50/80/135/305/575 | HARDCODED ONLY |
| Sticker Large matte | 25/50/100/250/500 | 55/90/160/375/700 | absent | 55/90/160/375/700 | HARDCODED ONLY |
| Sticker Large FX | 25/50/100/250/500 | 65/105/185/415/785 | absent | 65/105/185/415/785 | HARDCODED ONLY |

**Note structure** : Strapi `stickers.tiers` n'a que 2 cles (`standard` + `holographic`) avec une structure d'array `[{qty, price, unitPrice}]`. Front+Backend ont la structure `{tier x kind x qty}` a 3 dimensions (standard/medium/large x matte/fx x qty).

## G. Flyers (5 paliers x recto/recto-verso)

| Categorie | Qty | Code hardcoded | Strapi | Backend | Statut |
|---|---|---|---|---|---|
| Flyers Recto | 50 | 40$ | 40$ | 40$ | OK |
| Flyers Recto | 100 | **70$** | **65$** | **70$** | **DIVERGENCE** |
| Flyers Recto | 150 | **98$** | **90$** | **98$** | **DIVERGENCE** |
| Flyers Recto | 250 | **138$** | **130$** | **138$** | **DIVERGENCE** |
| Flyers Recto | 500 | **250$** | **225$** | **250$** | **DIVERGENCE** (ecart 25$) |
| Flyers Recto-Verso | 50 | 52$ | 52$ (= 40 * 1.3) | 52$ | OK |
| Flyers Recto-Verso | 100 | 91$ | 84.50$ (= 65 * 1.3) | 91$ | DIVERGENCE (Strapi multiplier 1.3, hardcoded fixe) |
| Flyers Recto-Verso | 150 | 127$ | 117$ | 127$ | DIVERGENCE |
| Flyers Recto-Verso | 250 | 179$ | 169$ | 179$ | DIVERGENCE |
| Flyers Recto-Verso | 500 | 325$ | 292.50$ | 325$ | DIVERGENCE |

**Note structure** : Strapi `flyers.priceTiers` ne contient que recto + un `multiplier 1.3` pour recto-verso. Front+Back ont les deux grilles separees.

## H. Sublimation / Merch (7 produits x 3-5 paliers)

| Categorie | Item | Code hardcoded | Strapi | Backend | Statut |
|---|---|---|---|---|---|
| Sublim tshirt | 1/5/10/25 | 30/27/25/23 | absent du dump (peut etre present) | 30/27/25/23 | A VERIFIER STRAPI |
| Sublim longsleeve | 1/5/10/25 | 40/37/35/33 | absent du dump | 40/37/35/33 | A VERIFIER STRAPI |
| Sublim hoodie | 1/5/10/25 | 50/45/42/40 | absent du dump | 50/45/42/40 | A VERIFIER STRAPI |
| Sublim totebag | 1/10/25/50 | 15/13/12/10 | absent du dump | 15/13/12/10 | A VERIFIER STRAPI |
| Sublim mug | 1/5/10/25 | 15/13/12/10 | absent du dump | 15/13/12/10 | A VERIFIER STRAPI |
| Sublim tumbler | 1/5/10/25 | 25/22/20/18 | absent du dump | 25/22/20/18 | A VERIFIER STRAPI |
| Sublim bag (sac banane) | 1/5/10 | 80/75/70 | **80/70/60** (Strapi !) | 80/75/70 | **DIVERGENCE** (Strapi 5u=70 vs code 75, Strapi 10u=60 vs code 70) |
| Sublim Design Fee | unique | 125$ | absent du dump | 125$ | A VERIFIER STRAPI |

## I. Pret-a-porter (Massive Medias - own brand)

| Categorie | Item | Code hardcoded | Strapi | Backend | Statut |
|---|---|---|---|---|---|
| Pret-a-porter T-shirt | toutes tailles | absent | 35$ | absent | STRAPI ONLY |
| Pret-a-porter Hoodie | toutes tailles | absent | 65$ | absent | STRAPI ONLY |
| Pret-a-porter Crewneck | toutes tailles | absent | 55$ | absent | STRAPI ONLY |

## J. Merch Massive (broderie / pret-a-porter alternatif)

| Categorie | Item | Code hardcoded | Strapi | Backend | Statut |
|---|---|---|---|---|---|
| Merch tshirt | toutes tailles | 22$ (AdminTarifs MERCH_MASSIVE) | 22$ (merch-tshirt) | absent | OK (Front + Strapi, backend absent) |
| Merch hoodie | toutes tailles | 39$ | 39$ | absent | OK |
| Merch crewneck | toutes tailles | (AdminTarifs ne liste pas crewneck) | 30$ | absent | DIVERGENCE (AdminTarifs liste Long Sleeve a 30$, Strapi liste Crewneck a 30$ - meme valeur, label different) |
| Merch totebag | toutes tailles | absent | 15$ (base) | absent | STRAPI ONLY |

## K. Sticker packs (vrstl, cosmo, fusion, massive, maudite)

| Categorie | Item | Code hardcoded | Strapi | Backend | Statut |
|---|---|---|---|---|---|
| Pack vrstl | 1/5/10/25 | absent | 35/25/20/15 | absent | STRAPI ONLY |
| Pack cosmo | 1/5/10/25 | absent | 35/25/20/15 | absent | STRAPI ONLY |
| Pack fusion | 1/5/10/25 | absent | 35/25/20/15 | absent | STRAPI ONLY |
| Pack massive | 1/5/10/25 | absent | 35/25/20/15 | absent | STRAPI ONLY |
| Pack maudite | 1/5/10/25 | absent | 35/25/20/15 | absent | STRAPI ONLY |

Note : tous identiques en prix, structures identiques.

## L. Design graphique (5 services)

| Categorie | Item | Code hardcoded | Strapi | Backend | Statut |
|---|---|---|---|---|---|
| Design Logo | range | 300$-600$ | 300$-600$ | absent | OK |
| Design Identite | range | 800$-1 500$ | 800$-1 500$ | absent | OK |
| Design Affiche/Flyer event | range | 150$-300$ | 150$-300$ | absent | OK |
| Design Pochette album | range | 200$-400$ | 200$-400$ | absent | OK |
| Design Retouche photo | range | 15$-50$ | **absent** (Strapi liste "Icons" 200-500 a la place) | absent | **DIVERGENCE** (catalogue different) |
| Design Icones | absent | 200$-500$ | absent | absent | STRAPI ONLY |

## M. Developpement Web (5 services)

| Categorie | Item | Code hardcoded | Strapi | Backend | Statut |
|---|---|---|---|---|---|
| Web Landing | prix | 900$ | 900$ | absent | OK |
| Web Vitrine (5-10 pages) | range | **1 000$-1 500$** | **2 000$-3 500$** | absent | **DIVERGENCE MAJEURE** (ecart +1 000$-2 000$) |
| Web E-commerce | range | **1 500$-2 500$** | **4 000$-6 000$** | absent | **DIVERGENCE MAJEURE** (ecart +2 500$-3 500$) |
| Web Refonte | range | Sur soumission | Sur soumission | absent | OK |
| Web Maintenance | mensuel | 100$-200$/mois | 100$-200$/mois | absent | OK |
| Web Taux horaire | h | 85$/h | 85$/h | absent | OK |

## N. Business cards

| Categorie | Item | Code hardcoded | Strapi | Backend | Statut |
|---|---|---|---|---|---|
| Business card standard | 100/250/500/1000 | absent | absent | 55/75/95/130 | HARDCODED ONLY (backend uniquement, orphelin probable) |
| Business card lamine | 100/250/500/1000 | absent | absent | 70/95/120/165 | HARDCODED ONLY |
| Business card premium | 100/250/500 | absent | absent | 120/175/250 | HARDCODED ONLY |

Note : Aucun consumer visible cote frontend ni Strapi. Code mort potentiel.

---

# Section RESUME

## 1. Total de lignes auditees
**~80 lignes** (formats x tiers x qty x finis pour les categories paliers, plus 1 ligne par item simple)

## 2. Nombre de DIVERGENCE

**~25 lignes DIVERGENCE** identifiees :

| Categorie | Nombre divergences | Severite |
|---|---|---|
| Fine Art Studio (A4/A3/A3+/A2) | 4 | Moyenne (ecarts 3-7$ par tirage) |
| Fine Art Museum (A4/A3/A2) | 3 | Moyenne (ecarts 5-15$ par tirage) |
| Stickers Standard matte (50/100/250/500) | 4 | **Haute** (ecart 500u: 125$) |
| Stickers Standard FX (25/50/100/250/500) | 5 | **Haute** (Strapi a +7$ a +30$ que hardcoded selon palier) |
| Flyers Recto (100/150/250/500) | 4 | Moyenne (ecart 500u: 25$) |
| Flyers Recto-Verso (4 paliers) | 4 | Moyenne (Strapi calcule via multiplier 1.3, hardcoded fixe) |
| Sublimation bag (5u/10u) | 2 | Moyenne (Strapi 5u=70$ vs 75$, 10u=60$ vs 70$) |
| Design Retouche vs Icones | 1 | **Catalogue different** (services differents) |
| Web Vitrine / E-commerce | 2 | **TRES HAUTE** (Strapi a quasi double les prix) |

## 3. Nombre de OK

**~15 lignes OK** (Frame all formats, Fine Art Museum A3+, Stickers Std matte 25u, Flyers 50u, Web Landing/Refonte/Maintenance/Taux horaire, Design 4 services concordants, Merch tshirt/hoodie front-vs-Strapi).

## 4. Liste des HARDCODED ONLY

A discuter pour migration eventuelle vers Strapi :

- **Fine Art carres (sq8/sq10/sq12)** : 3 formats x 2 tiers x 1 frame = 9 valeurs uniquement dans `pricingData.js`. Strapi `fine-art` ne les liste pas.
- **Fine Art artistes (ARTIST_PRICES)** : 5 formats x 2 tiers + frames = 12 valeurs uniquement dans `AdminTarifs.jsx`. **Note importante** : la grille "artiste generique" n'a aucune contrepartie Strapi (les overrides per-artiste vivent dans `artist.pricing` JSON libre, mais pas la grille de base).
- **Stickers Medium + Large** : 4 sous-grilles (Medium matte/fx + Large matte/fx) x 5 paliers = 20 valeurs uniquement dans `pricingData.js` + `pricing-config.ts`. Strapi `stickers.tiers` n'a que les paliers standard.
- **Business cards** (`backend/src/utils/pricing-config.ts` -> `BUSINESS_CARD_TIERS`) : 3 types x 3-4 paliers = 11 valeurs uniquement dans le backend, **aucun consumer detectable** cote front/Strapi. Code mort potentiel.

## 5. STRAPI ONLY (a confirmer si attendu)

- **Affiches Standard** : par design (chantier en cours, helper consomme directement Strapi via `useProductPricing`)
- **Pret-a-porter** (tshirt 35$, hoodie 65$, crewneck 55$) : 3 valeurs uniquement dans Strapi
- **Sticker packs** (5 packs x 4 paliers = 20 valeurs) : uniquement dans Strapi
- **Design Icones** (200$-500$) : uniquement dans Strapi (le code propose "Retouche photo" a la place)
- **Merch totebag** : uniquement dans Strapi

## 6. Top 5 divergences avec le plus gros ecart $

Classees par ecart en valeur absolue sur un item type :

1. **Web E-commerce range** : Strapi 4000$-6000$ vs Code 1500$-2500$ -> **ecart +2 500$ a +3 500$** par projet. **Priorite critique** (un client qui voit le code paye 2x moins que ce que Strapi annonce).
2. **Web Vitrine range** : Strapi 2000$-3500$ vs Code 1000$-1500$ -> **ecart +1 000$ a +2 000$** par projet. **Priorite critique**.
3. **Stickers Standard matte 500u** : Code/Backend 375$ vs Strapi 250$ -> **ecart 125$ par commande** (le code rejetterait une commande Strapi a 250$).
4. **Stickers Standard FX 250u** : Code/Backend 225$ vs Strapi 220$ -> ecart 5$. Plus sous forme **structurelle** que monetaire (chaque palier de la grille diverge).
5. **Fine Art Museum A2** : Code/Backend 110$ vs Strapi 125$ -> **ecart 15$**. Multipliable par toutes les ventes A2 musee passees.

---

# Observations meta

## Pattern recurrent

Les divergences **systematiques** suivent un motif :
- Frontend `pricingData.js` et Backend `pricing-config.ts` sont **alignes entre eux** (PRIX-02 a deja unifie ces 2 sources en avril 2026, cf commentaires en tete de `pricing-config.ts`).
- **Strapi diverge de cette paire** dans de nombreuses categories (Fine Art Studio/Museum, Stickers, Flyers, Web).
- Hypothese : Strapi a ete edite avec des **anciennes valeurs** ou des **valeurs experimentales** (par exemple Studio 16$ au lieu de 20$ pourrait etre une periode promo, prix Web augmentes apres reflexion business sans repercute sur le code).

## Endpoint backend `/api/pricing-config`

Documente dans `pricing-config.ts` (commentaire ligne 6-9) : le backend EXPOSE un endpoint `GET /api/pricing-config` pour que le frontend puisse fetcher au runtime. **Le commentaire indique que la migration frontend vers ce fetch est l'objet du chantier PRIX-02-frontend (Vague 3)**, **non encore termine**. Donc la voie "officielle" prevue est `Backend -> /api/pricing-config -> Frontend`, et **Strapi devient secondaire / redondant**.

## PRIX-01 (frame A2)

Mentionne explicitement dans `pricing-config.ts` ligne 21-23. **Deja fixe en avril 2026** : A2 frame est 45$ partout (frontend + backend + Strapi). **Pas un bug actif aujourd'hui**, juste un historique documente.

---

**Aucune ligne de code modifiee.** Le rapport est strictement READ-ONLY.
