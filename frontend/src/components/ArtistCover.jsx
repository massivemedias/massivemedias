/**
 * ArtistCover - COVER-FALLBACK (17 juillet 2026).
 *
 * Rend le cover d'un artiste. S'il a un vrai cover (heroImage/avatar), on affiche
 * l'<img> normalement. Sinon (nouvel artiste sans upload, ex: Woosmak) on genere
 * un fallback SOBRE cote composant - ZERO fichier image par artiste :
 *   - degrade sur les violets du theme (#1f003f -> plus sombre) ;
 *   - nom de l'artiste centre, dans la typo des TITRES du site (Montserrat Black
 *     italique - la SEULE graisse Montserrat chargee, cf. index.html) ;
 *   - petit monogramme "M" Massive discret en coin.
 *
 * POURQUOI UN SVG INLINE (et pas un data-URI dans src) : un SVG passe en `src`
 * d'<img> est rendu ISOLE et ne peut PAS charger la webfont Montserrat. Inline
 * dans le DOM, il herite des polices de la page -> on obtient la vraie typo du
 * site. Le viewBox + preserveAspectRatio="slice" reproduit `object-cover` et le
 * texte se met a l'echelle tout seul avec le conteneur (aucune media-query).
 *
 * Des que l'artiste uploade un vrai cover, `src` devient non-vide -> le fallback
 * disparait automatiquement, rien d'autre a faire.
 *
 * `className` est applique A LA FOIS a l'<img> et au fallback : les callers
 * passent les memes classes de remplissage (absolute inset-0 w-full h-full +
 * transitions/hover), et le fallback herite du meme cadrage et du meme zoom au survol.
 */
export default function ArtistCover({ src, name, className = '', loading = 'lazy' }) {
  if (src) {
    return <img src={src} alt={name || ''} loading={loading} className={className} />
  }

  const label = (name || 'Massive').trim()
  // Taille auto pour tenir sur UNE ligne SANS etre rognee par le slice. Le format
  // le plus etroit ou ce cover apparait est la carte vedette 4:5 (portrait) : en
  // `slice`, le viewBox carre 600 y est coupe a ~480px de large visible. On vise
  // donc ~440px de texte (marge), pas 600. Montserrat Black ITALIQUE ~0,64 * fontSize
  // par glyphe (l'italique elargit). Borne 28..90.
  const fontSize = Math.max(28, Math.min(90, Math.round(440 / (0.64 * Math.max(label.length, 4)))))

  return (
    <svg
      className={className}
      viewBox="0 0 600 600"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={label}
    >
      <defs>
        <linearGradient id="acf-grad" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="#2a0a4a" />
          <stop offset="52%" stopColor="#1f003f" />
          <stop offset="100%" stopColor="#0c0018" />
        </linearGradient>
      </defs>
      <rect width="600" height="600" fill="url(#acf-grad)" />
      {/* nom centre - typo titres du site (Montserrat Black italique) */}
      <text
        x="300"
        y="300"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Montserrat, 'Space Grotesk', sans-serif"
        fontWeight="900"
        fontStyle="italic"
        fontSize={fontSize}
        fill="#ffffff"
        fillOpacity="0.92"
      >
        {label}
      </text>
      {/* monogramme Massive discret, coin bas-droit */}
      <text
        x="574"
        y="576"
        textAnchor="end"
        fontFamily="Montserrat, 'Space Grotesk', sans-serif"
        fontWeight="900"
        fontStyle="italic"
        fontSize="40"
        fill="#ffffff"
        fillOpacity="0.13"
      >
        M
      </text>
    </svg>
  )
}
