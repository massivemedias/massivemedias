/**
 * SOURCE UNIQUE de l'etat "filigrane CSS en surimpression" (WATERMARK-CSS).
 *
 * CE QUE C'EST : des tuiles MASSIVE discretes posees PAR-DESSUS les images
 * produits affichees en grand (fiche sticker, lightbox, zoom). Role =
 * DISSUASION visible, decourager la capture d'ecran opportuniste.
 *
 * ================== CE QUE CE N'EST PAS : UNE PROTECTION ==================
 * Un overlay CSS est un element du DOM pose A COTE de l'image. Le <img> en dessous
 * n'est pas touche : clic droit > "Enregistrer l'image sous" sort un fichier PROPRE.
 * La VRAIE protection reste le filigrane CUIT dans le pixel (scripts/
 * generate-watermarks.mjs, 1 tampon diagonal 5 % centre sur la bbox silhouette),
 * exige par le contrat artiste et prouve par soustraction (cf ~/Downloads/
 * preuve-filigrane.png). Les deux coexistent :
 *   - cuit  = la PREUVE   (invisible a l'oeil, indelebile, dans le fichier)
 *   - CSS   = l'EPOUVANTAIL (visible, trivial a contourner, dans la page)
 * NE JAMAIS remplacer le cuit par ce CSS. Ne jamais le presenter comme une securite.
 * =========================================================================
 *
 * Pour ETEINDRE : passer WATERMARK_OVERLAY_ENABLED a `false`. C'est tout, les
 * composants retombent en affichage nu, aucune image n'est touchee.
 *
 * ====================== HISTORIQUE : LA v1 ET SA MORT ======================
 * La v1 (#124) a vecu ~1 jour en prod. Verdict Mika : "BEAUCOUP trop visible,
 * rayures sur le fond des fiches, logos lisibles dans la lightbox". Constat
 * MESURE en prod avant de toucher quoi que ce soit : l'opacite appliquee etait
 * bien 0.06, la valeur exacte demandee, avec `overflow: hidden`. LA VALEUR
 * N'ETAIT PAS EN CAUSE. Trois defauts de conception, tous corriges en v2 :
 *   1. logo quasi blanc (luminosite 0.98) -> a 6 % sur un fond plat sombre, un
 *      voile blanc se voit, point. v2 : logo NOIR, il se fond dans le sombre.
 *   2. `background-size: 200px 190px` sur une image 200x36 -> logo ETIRE 5,3x
 *      en hauteur, d'ou les "rayures". v2 : tuile deja padee + `Xpx auto`.
 *   3. couche entiere tournee a -30deg -> `inset: -60%` pour couvrir les coins,
 *      overlay qui bave. v2 : rotation cuite dans la tuile, `inset: 0`.
 * Detail complet des 3 corrections dans le bloc `.wm-overlay` de index.css.
 * ==========================================================================
 */
export const WATERMARK_OVERLAY_ENABLED = true

/**
 * Opacite des tuiles. UNE seule valeur pour les 11 palettes, et c'est l'ombre
 * cuite dans la tuile qui le permet (cf. le bloc .wm-overlay d'index.css).
 *
 * Blanc tres transparent (choix Mika). A ne pas confondre avec le 6 % de la
 * v1, qui n'a rien a voir : la v1 etait blanche AUSSI. Ce qui la rendait laide
 * n'etait pas sa couleur mais son logo ETIRE 5,3x - des rayures, pas un logo.
 *
 * CE QUE CETTE VALEUR NE FERA PAS, ET C'EST NORMAL : le filigrane est bien pose
 * PAR-DESSUS le dessin (z-index 2, verifie en poussant l'opacite a 85 % : les
 * tuiles traversent le sticker). Mais si bas, sur un dessin clair et charge, il
 * reste presque invisible - c'est le prix de "tres transparent". Le rendre
 * franchement lisible SUR le dessin demanderait de monter ce chiffre : les deux
 * ne peuvent pas etre vrais en meme temps. Si Mika veut plus mordant sur le
 * dessin, c'est ce chiffre qui monte, pas autre chose.
 */
export const WATERMARK_OVERLAY_OPACITY = 0.035

/**
 * Largeur d'UNE tuile a l'ecran (la hauteur suit toute seule, cf. le `auto` de
 * `background-size` dans index.css). C'est donc l'ESPACEMENT autant que la
 * taille du logo : le padding transparent est cuit dans la tuile, tout est
 * proportionnel. Monter = logos plus gros ET plus espaces.
 *
 * DEUX LEVIERS, NE PAS LES CONFONDRE :
 *   - ce reglage change la taille du logo ET l'espacement ensemble ;
 *   - le PADDING de la tuile (dans le PNG) change leur RAPPORT.
 * Pour "des logos plus petits sans les serrer", il faut elargir le padding du
 * PNG, pas seulement baisser ce chiffre - sinon on gagne des logos plus petits
 * mais deux fois plus nombreux, ce qui se voit PLUS, pas moins.
 *
 * Etat au 17 juillet : tuile 896x768, logo 360px dedans (40 % de la tuile).
 * A 240px -> logo 96px sur une boite de 560, soit 17 % de sa largeur, contre
 * 32 % avant. Repere : la demo Figma de Mika est a ~10 %.
 */
export const WATERMARK_OVERLAY_TILE = '240px'
