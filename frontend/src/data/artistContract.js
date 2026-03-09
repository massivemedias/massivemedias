export const ARTIST_CONTRACT_VERSION = 'v1';

export const ARTIST_CONTRACT_TEXT = `
<h3 style="text-align:center;margin-bottom:4px;">ENTENTE DE PARTENARIAT ARTISTE</h3>
<p style="text-align:center;margin-bottom:4px;"><strong>Massive Medias</strong></p>
<p style="text-align:center;margin-bottom:24px;font-size:0.85em;opacity:0.7;">Impression fine art - Stickers - Merch - Distribution web</p>

<h4>1. IDENTIFICATION DES PARTIES</h4>

<p><strong>Partie A - Producteur / Distributeur</strong></p>
<ul>
  <li>Entreprise : Massive Medias</li>
  <li>Proprietaire : Michael Sanchez (NEQ : 2269057891)</li>
  <li>Adresse : 5338 rue Marquette, Montreal (QC) H2J 3Z3</li>
  <li>Courriel : hello@massivemedias.com</li>
  <li>Site web : massivemedias.com</li>
</ul>

<p><strong>Partie B - L'Artiste</strong></p>
<p style="font-style:italic;opacity:0.7;">Les informations de l'artiste seront collectees via le formulaire ci-dessous.</p>

<p><strong>Details du contrat</strong></p>
<ul>
  <li>Date d'entree en vigueur : a la signature</li>
  <li>Duree initiale : 12 mois, renouvelable automatiquement</li>
</ul>

<h4>2. OBJET DE L'ENTENTE</h4>
<p>La presente entente definit les conditions de collaboration entre Massive Medias et l'Artiste pour la production, la mise en vente et la distribution de produits derives physiques bases sur les oeuvres originales de l'Artiste.</p>
<p>Les produits couverts peuvent inclure, sans s'y limiter :</p>
<ul>
  <li>Impressions fine art sur papier mat, lustre ou coton (formats varies selon approbation)</li>
  <li>Stickers decoupes sur mesure (vinyle mat, brillant, holographique ou transparent)</li>
  <li>Vetements imprimes par sublimation ou transfert direct sur textile (t-shirts, hoodies)</li>
  <li>Articles sublimes (mugs, thermos, tapis de souris, etc.)</li>
  <li>Tout autre produit convenu par ecrit entre les parties</li>
</ul>
<p>Chaque produit ou serie doit faire l'objet d'une approbation ecrite prealable (courriel ou formulaire) de l'Artiste avant sa mise en production. Aucune decision unilaterale n'est permise.</p>

<h4>3. PROPRIETE INTELLECTUELLE</h4>

<p><strong>3.1 Droits de l'Artiste</strong></p>
<p>L'Artiste conserve l'entiere propriete de ses oeuvres originales, de ses droits d'auteur et de tous droits connexes. La presente entente ne constitue en aucun cas une cession ou un transfert de propriete intellectuelle.</p>

<p><strong>3.2 Licence accordee a Massive Medias</strong></p>
<p>L'Artiste accorde a Massive Medias une licence d'exploitation non exclusive, limitee, revocable et non transferable, afin de :</p>
<ul>
  <li>Reproduire les oeuvres approuvees sur les produits physiques definis a l'article 2</li>
  <li>Afficher les oeuvres en basse resolution avec filigrane sur massivemedias.com a des fins de vente</li>
  <li>Utiliser le nom d'artiste et les images des produits dans les communications marketing de Massive Medias liees a ce partenariat</li>
</ul>
<p>Cette licence est strictement limitee aux fins enumerees ci-dessus et ne peut etre etendue sans accord ecrit de l'Artiste.</p>

<h4>4. STRUCTURE FINANCIERE & REDDITION DE COMPTES</h4>

<p><strong>4.1 Mecanisme de repartition</strong></p>
<p>Pour chaque produit vendu, la repartition s'effectue dans l'ordre suivant :</p>
<ol>
  <li>Prix de vente final (montant paye par l'acheteur, taxes exclues)</li>
  <li>Deduction des couts de production (materiaux, consommables, amortissement equipement, emballage)</li>
  <li>Le montant restant constitue le profit net distribuable</li>
  <li>Ce profit net est partage selon la cle de repartition convenue entre les parties</li>
</ol>
<p><em>Exemple indicatif : une impression vendue 35 $ avec 12 $ de couts de production genere un profit net de 23 $. Avec un ratio 50/50, l'Artiste recoit 11,50 $ et Massive Medias conserve 11,50 $.</em></p>

<p><strong>4.2 Rapports de ventes</strong></p>
<p>Massive Medias s'engage a fournir a l'Artiste, chaque mois, un rapport de ventes detaille comprenant le nombre d'unites vendues par produit, le prix de vente unitaire, les couts de production appliques, le profit net calcule et la part revenant a l'Artiste.</p>
<p>Ce rapport est transmis par courriel dans les 10 premiers jours du mois suivant. Sur demande, un acces en lecture seule au tableau de bord de vente peut etre octroye a l'Artiste.</p>

<p><strong>4.3 Versements</strong></p>
<p>Les versements a l'Artiste sont effectues mensuellement par virement Interac, a condition que le montant du depasse 25 $ CAD. Les montants inferieurs a ce seuil sont reportes au mois suivant.</p>

<h4>5. ENGAGEMENT QUALITE</h4>
<p>Massive Medias s'engage a produire tous les articles au standard galerie ou premium, en adequation avec l'oeuvre de l'Artiste. Cet engagement comprend :</p>
<ul>
  <li>L'utilisation d'equipements d'impression professionnels adaptes a chaque type de produit</li>
  <li>L'utilisation de supports d'impression de grade musee ou galerie selon le type de produit commande</li>
  <li>La gestion rigoureuse des profils couleur et l'etalonnage regulier des equipements pour une fidelite maximale a l'oeuvre originale</li>
  <li>Un emballage soigne et une protection adequate lors de l'expedition</li>
</ul>
<p>En cas de defaut de production avere, Massive Medias reprend le produit a ses frais et produit un remplacement sans cout additionnel pour l'Artiste.</p>

<h4>6. FIN D'ENTENTE</h4>

<p><strong>6.1 Resiliation</strong></p>
<p>Chaque partie peut mettre fin a la presente entente en transmettant un preavis ecrit de 30 jours par courriel a l'autre partie. Pendant ce delai, les deux parties honorent leurs obligations respectives.</p>

<p><strong>6.2 Gestion des stocks existants</strong></p>
<p>A l'expiration du preavis, les parties conviennent mutuellement de l'une des options suivantes :</p>
<ul>
  <li><strong>Option A :</strong> L'Artiste rachete les unites restantes au cout de production, sans marge</li>
  <li><strong>Option B :</strong> Les unites restantes sont ecoulees sur le site jusqu'a epuisement, sans nouvelle production</li>
  <li><strong>Option C :</strong> Les stocks invendus sont detruits, avec confirmation ecrite transmise a l'Artiste</li>
</ul>

<p><strong>6.3 Retrait du site web</strong></p>
<p>Dans les 7 jours suivant la fin effective de l'entente, Massive Medias retire l'integralite des visuels et produits lies aux oeuvres de l'Artiste sur massivemedias.com.</p>

<h4>7. PROTECTION ET GESTION DES FICHIERS</h4>

<p><strong>7.1 Utilisation des fichiers haute resolution</strong></p>
<p>Les fichiers sources haute resolution fournis par l'Artiste sont utilises exclusivement a des fins d'impression physique. Ils ne sont jamais partages avec des tiers, utilises dans d'autres contextes non prevus par la presente entente, ni publies en ligne en haute resolution.</p>

<p><strong>7.2 Fichiers basse resolution pour le web</strong></p>
<p>Seules des versions basse resolution (72 DPI maximum) avec filigrane visible sont utilisees pour l'affichage sur le site de vente. L'Artiste peut fournir ces versions ou en approuver l'execution par Massive Medias.</p>

<p><strong>7.3 Destruction a la fin du contrat</strong></p>
<p>Dans les 14 jours suivant la fin de l'entente, Massive Medias s'engage a supprimer definitivement tous les fichiers haute resolution de l'Artiste de ses serveurs et equipements, et a fournir une confirmation ecrite de cette suppression.</p>

<h4>8. CONFIDENTIALITE</h4>

<p><strong>8.1 Obligations de Massive Medias</strong></p>
<p>Massive Medias s'engage a maintenir confidentielles toutes les informations commerciales, artistiques et personnelles transmises par l'Artiste dans le cadre de cette entente.</p>

<p><strong>8.2 Obligations de l'Artiste</strong></p>
<p>L'Artiste s'engage a ne pas divulguer a des tiers les informations suivantes :</p>
<ul>
  <li>Les couts de production reels (materiaux, consommables et leurs fournisseurs)</li>
  <li>Les configurations et processus techniques de production</li>
  <li>Les noms des fournisseurs et partenaires logistiques</li>
  <li>Les structures tarifaires internes et les marges commerciales</li>
</ul>
<p>Cette obligation de confidentialite demeure valide pour une periode de 2 ans suivant la fin de la presente entente.</p>

<h4>9. RESPONSABILITES & GARANTIES</h4>

<p><strong>9.1 Garanties de l'Artiste</strong></p>
<p>L'Artiste declare et garantit qu'il est le createur original et/ou le titulaire des droits des oeuvres fournies, que celles-ci ne violent pas les droits de propriete intellectuelle de tiers, et qu'il a le plein droit de conclure cette entente.</p>

<p><strong>9.2 Limitation de responsabilite de Massive Medias</strong></p>
<p>Massive Medias ne peut etre tenu responsable des pertes de revenus dues a des facteurs hors de son controle (panne d'equipement, rupture de stock de materiaux, cas de force majeure).</p>

<h4>10. DISPOSITIONS GENERALES</h4>
<ul>
  <li><strong>Droit applicable :</strong> Cette entente est regie par les lois de la province de Quebec et les lois federales du Canada applicables.</li>
  <li><strong>Modifications :</strong> Toute modification doit etre convenue par ecrit et signee par les deux parties pour etre valide.</li>
  <li><strong>Integralite :</strong> Cette entente constitue l'integralite de l'accord entre les parties et remplace tous accords anterieurs relatifs au meme objet.</li>
  <li><strong>Divisibilite :</strong> Si une disposition est jugee invalide, les autres dispositions demeurent pleinement en vigueur.</li>
  <li><strong>Langue :</strong> La version francaise de cette entente est la version officielle faisant foi.</li>
</ul>
`;
