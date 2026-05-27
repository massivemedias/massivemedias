# Runbook - Seed manuel du product `affiche-standard` dans Strapi

**Contexte** : chantier `feat/affiches-standard-et-audit-tarifs`. On introduit une nouvelle
categorie d'impressions (affiches en volume avec paliers degressifs) qui complete
les Series Studio + Musee du product `fine-art` existant. Pour respecter la regle
"1 product Strapi = 1 categorie", on cree un product dedie `affiche-standard`
avec son propre `pricingData`.

**Pre-requis cote code (deja fait dans cette branche)** :
- `backend/src/api/product/content-types/product/schema.json` etend l'enum
  `category` avec `"affiche-standard"` (sans ca, Strapi refuse la creation
  avec une erreur de validation).
- Le code est sur la branche `feat/affiches-standard-et-audit-tarifs`. La migration
  prendra effet automatiquement au prochain deploy Render (push to main ->
  Render auto-deploy ~5 min -> Strapi reload schema).

**Pre-requis cote permissions** : verifie. Les routes publiques
`/api/products` `find` et `findOne` sont deja activees pour le role `Public`
sur Strapi prod (confirme par curl HTTP 200 sans Bearer sur `stickers` et
`fine-art`). Le nouveau product `affiche-standard` heritera automatiquement
de ces permissions des sa creation : **aucune action sur les permissions
n'est requise**.

---

## Etape 1 - Naviguer dans Strapi

1. Ouvrir https://massivemedias-api.onrender.com/admin (ou via le raccourci
   `/mm-admin` du site).
2. Se connecter avec le compte admin habituel.
3. Dans la sidebar gauche, cliquer **Content Manager**.
4. Sous **COLLECTION TYPES**, cliquer **Produit** (l'icone qui liste les
   products existants : stickers, fine-art, sublimation, etc.).
5. Verifier qu'on voit bien les autres products dans la liste (sanity check).
6. Bouton **+ Create new entry** en haut a droite.

---

## Etape 2 - Remplir les champs

A coller **EXACTEMENT** ces valeurs (les colonnes "Champ" et "Valeur" sont
non-negociables, la lecture cote frontend depend de slugs/cles exacts).

| Champ Strapi | Valeur a saisir |
|---|---|
| `name` | `Affiches Standard` |
| `slug` | `affiche-standard` |
| `category` | Selectionner **`affiche-standard`** dans la dropdown |
| `nameFr` | `Affiches Standard` |
| `nameEn` | `Standard Posters` |
| `nameEs` | `Carteles Estandar` |
| `descriptionFr` | `Affiches imprimees en volume sur papier mat ou semi-glace, ideales pour evenements, promo et affichage commercial. Tarifs degressifs des 5 unites. Pour les pieces uniques fine art (papier d'archive 100+ ans), voir la Serie Studio ou Serie Musee.` |
| `descriptionEn` | `Volume-printed posters on matte or semi-gloss paper, perfect for events, promotion and commercial display. Tiered pricing from 5 units. For fine art unique prints (100+ years archival paper), see the Studio or Museum Series.` |
| `descriptionEs` | `Carteles impresos en volumen sobre papel mate o semi-brillante, ideales para eventos, promocion y exhibicion comercial. Precios escalonados desde 5 unidades. Para impresiones unicas fine art (papel de archivo 100+ anos), ver la Serie Studio o Serie Museo.` |
| `popular` | Laisser **decoche** (cocher si tu veux promouvoir ce service) |
| `published` (en haut a droite, draft/publish) | Voir Etape 3 puis publier |

Le champ `pricingData` se remplit a l'Etape 3.

Champs `images`, `highlightsFr/En/Es`, `processFr/En/Es`, `faqFr/En/Es` etc. :
**laisser vides pour ce seed initial**. Tu pourras les remplir plus tard via
l'admin une fois la categorie validee.

---

## Etape 3 - `pricingData` (JSON brut a coller)

Champ `pricingData` (type JSON). Cliquer dans la zone, puis coller
**exactement** ce bloc (vire les commentaires si Strapi rejette le JSON, mais
JSON5 est generalement accepte en JSON strict aussi par l'admin Strapi v5) :

```json
{
  "afficheStandardPaliers": {
    "A4":  { "1": 10, "5": 8,  "10": 6,  "25": 4, "50": 3, "100": 2.50 },
    "A3":  { "1": 15, "5": 12, "10": 8,  "25": 5, "50": 4, "100": 3.50 },
    "A3+": { "1": 20, "5": 15, "10": 12, "25": 9, "50": 7, "100": 6    }
  },
  "formats": [
    { "id": "A4",  "label": "A4 (8.5x11\")", "w": 8.5, "h": 11 },
    { "id": "A3",  "label": "A3 (11x17\")",  "w": 11,  "h": 17 },
    { "id": "A3+", "label": "A3+ (13x19\")", "w": 13,  "h": 19 }
  ]
}
```

**Lecture des paliers** :
- Cle = quantite minimale du palier (`"25"` = palier "25 unites et plus")
- Valeur = prix unitaire en CAD pour ce palier
- Exemple : 17 unites A3 -> palier "10" (10 <= 17 < 25) -> 8 $/unite -> total 136 $
- Exemple : 25 unites A3 -> palier "25" -> 5 $/unite -> total 125 $

**Pas inclus volontairement** :
- **A6 (4x6")** : reste dans la categorie Flyers/Cartes (grille recto/verso
  separee dans `FLYER_GRID`).
- **A2 (18x24")** : reste "sur soumission" via le configurateur fine-art
  (12 encres pigmentees uniquement).

---

## Etape 4 - Publier + checklist visuelle

1. Bouton **Save** (en haut a droite).
2. Bouton **Publish** (qui devient vert apres Save).
3. **Verification visuelle dans l'admin** :
   - [ ] L'entree apparait dans la liste **Produit** avec le slug `affiche-standard`.
   - [ ] La colonne `category` affiche bien `affiche-standard`.
   - [ ] Le statut est **Published** (point vert).
   - [ ] En cliquant l'entree, le JSON `pricingData` affiche les 3 cles
         `A4`, `A3`, `A3+` avec leurs paliers.
   - [ ] Aucune erreur rouge dans le formulaire.

---

## Etape 5 - Verification publique (curl)

Depuis ton terminal local :

```bash
curl -s 'https://massivemedias-api.onrender.com/api/products?filters%5Bslug%5D%5B%24eq%5D=affiche-standard' \
  | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); const p=d.data?.[0]; if(!p){console.error('FAIL : product introuvable'); process.exit(1);} console.log('Slug :', p.slug); console.log('Category :', p.category); console.log('NameFr :', p.nameFr); console.log('Paliers A3 :', JSON.stringify(p.pricingData?.afficheStandardPaliers?.A3)); console.log('OK');"
```

**Sortie attendue** :
```
Slug : affiche-standard
Category : affiche-standard
NameFr : Affiches Standard
Paliers A3 : {"1":15,"5":12,"10":8,"25":5,"50":4,"100":3.5}
OK
```

**Si echec** :
- HTTP 401 ou 403 : permissions Public role manquantes. Va dans Strapi admin
  -> Settings -> Roles & Permissions -> Public -> Product : cocher `find` et
  `findOne`. Reessayer le curl.
- HTTP 404 ou data vide : product pas publie. Retour Etape 4.
- HTTP 500 : reload Strapi (push commit vide sur main, attendre Render
  re-deploy, ou redemarrer le service Render manuellement).

---

## Etape 6 - Apres la creation du product

Une fois le curl OK, signaler-le pour passer aux etapes suivantes du chantier :
- **Etape 3** du chantier : creer le helper `getAffichePrice()` dans
  `frontend/src/data/products.js` qui consomme `pricingData.afficheStandardPaliers`.
- **Etape 4** du chantier : modifier `ConfiguratorFineArt.jsx` pour ajouter
  la 3eme tuile QUALITE "Affiches Standard".
- **Etape 5** du chantier : tests unitaires (vitest) sur le helper.

---

## Rollback

Pour annuler ce seed si necessaire :
1. Strapi admin -> Content Manager -> Produit -> entree `affiche-standard`
2. Menu **...** en haut a droite -> **Delete**
3. Le product `fine-art` n'est pas affecte (modification isolee).
4. L'extension d'enum dans le schema reste appliquee (pas de regression,
   c'est additif).

---

**Date de creation du runbook** : 2026-05-26
**Branche** : `feat/affiches-standard-et-audit-tarifs`
**Commit du schema** : a determiner apres ton go pour commit
