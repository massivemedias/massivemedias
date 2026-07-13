import { TUMBLER_DESIGN } from '../utils/tumblerMockup'

/**
 * Design pose sur le mockup tumbler, avec fausse courbure cylindrique CSS.
 * PARTAGE par les 3 surfaces (fiche produit, bande "In the wild", banniere
 * home) : une seule implementation, un seul calibrage (TUMBLER_DESIGN).
 *
 * Courbure = compression horizontale (scaleX) + ombrage lateral degrade masque
 * a l'alpha du design (bords assombris = surface du cylindre qui fuit). Voir
 * TUMBLER_DESIGN dans utils/tumblerMockup.js.
 *
 * Le conteneur doit etre `position: relative` et contenir l'image du tumbler ;
 * ce composant se positionne en absolute, centre sur le corps.
 */
export default function TumblerDesign({ design, rotate = -2 }) {
  return (
    <div
      className="absolute"
      style={{
        left: '50%',
        top: TUMBLER_DESIGN.top,
        height: TUMBLER_DESIGN.height,
        aspectRatio: '1',
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div
        className="relative w-full h-full"
        style={{ transform: `rotate(${rotate}deg) scaleX(${TUMBLER_DESIGN.scaleX})` }}
      >
        <img
          src={design}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-contain"
          style={{ filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.4))' }}
          loading="lazy"
          decoding="async"
        />
        {/* Ombrage cylindrique masque a l'alpha du design. */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background: TUMBLER_DESIGN.shading,
            WebkitMaskImage: `url(${design})`,
            WebkitMaskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskImage: `url(${design})`,
            maskSize: 'contain',
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
          }}
        />
      </div>
    </div>
  )
}
