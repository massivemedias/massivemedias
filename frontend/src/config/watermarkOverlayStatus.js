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
export const WATERMARK_OVERLAY_ENABLED = true

/**
 * Opacite des tuiles (0 a 1). Discret par defaut : lisible de pres, ne mange pas
 * le design. Monter si Mika veut plus dissuasif, descendre si ca gene la vente.
 */
export const WATERMARK_OVERLAY_OPACITY = 0.06
