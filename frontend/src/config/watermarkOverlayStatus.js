/**
 * SOURCE UNIQUE de l'etat "filigrane CSS en surimpression" (WATERMARK-CSS, 16 juillet).
 *
 * CE QUE C'EST : des tuiles MASSIVE en diagonale, discretes, posees PAR-DESSUS les
 * images produits affichees en grand (fiche sticker, lightbox, zoom). Role =
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
 */
/**
 * ETEINT le 17 juillet 2026 (verdict Mika : "BEAUCOUP trop visible, rayures sur
 * le fond des fiches, logos lisibles dans la lightbox"). Constat mesure en prod
 * AVANT de toucher quoi que ce soit : l'opacite appliquee etait bien 0.06, la
 * valeur demandee, et `overflow: hidden` etait bien la. LA VALEUR N'EST PAS EN
 * CAUSE, la baisser ne reglerait rien. Trois defauts de conception cumules :
 *
 *   1. La tuile est un logo QUASI BLANC et QUASI OPAQUE (alpha moyen 0.81,
 *      luminosite 0.98). A 6 % sur un fond sombre PLAT, un voile blanc se voit,
 *      point. C'est de la physique, pas un reglage.
 *   2. `background-size: 200px 190px` sur une image de 200x36 : le logo est
 *      ETIRE 5,3x en hauteur -> des rayures, pas un logo. L'intention etait
 *      d'espacer les tuiles ; background-size REDIMENSIONNE, il n'espace pas
 *      (il fallait `background-repeat: space` ou une tuile deja padee).
 *   3. L'overlay couvre TOUTE la boite produit (560x480), dont l'essentiel est
 *      du fond plat `bg-black/25`. Sur le dessin lui-meme il serait quasi
 *      invisible : ce sont les zones VIDES qui trahissent le filigrane.
 *
 * POUR REPRENDRE : tuile a taille native + `background-repeat: space`, et
 * surtout masquer l'overlay sur la SILHOUETTE du design (mask-image avec le
 * webp du sticker) pour qu'il ne bave pas sur le fond. C'est un vrai chantier,
 * pas un ajustement de valeur.
 *
 * RIEN N'EST PERDU EN PROTECTION : le filigrane CUIT dans le pixel (5 %,
 * generate-watermarks.mjs) est intact et reste la vraie protection, celle
 * exigee par le contrat artiste. Ce flag ne pilotait que l'epouvantail.
 */
export const WATERMARK_OVERLAY_ENABLED = false

/**
 * Opacite des tuiles (0 a 1). Sans effet tant que ENABLED est false.
 * Cf. ci-dessus : ce n'est pas ce reglage qu'il faut retoucher.
 */
export const WATERMARK_OVERLAY_OPACITY = 0.06
