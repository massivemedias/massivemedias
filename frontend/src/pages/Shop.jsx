import { Link } from 'react-router-dom';
import { ArrowRight, Sticker, Printer } from 'lucide-react';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';
import { MASSIVE_STICKERS } from '../data/massiveStickers';

/**
 * BOUTIQUE-V2 (20 juillet 2026) : /boutique redevient LA vitrine mixte, hub
 * canonique de la boutique (decision Mika, audit SEO-2026). Fini l'ancienne page
 * a 2 vues + sidebar + panier in-page (doublon de /stickers et /artistes) : ici
 * c'est une VITRINE claire en 2 sections qui DIRIGE vers les vraies pages produit.
 *   - Section Stickers : apercu de designs -> CTA /stickers (les 385, checkout la-bas).
 *   - Section Prints d'artistes : print encadre + CTA -> /artistes (la galerie vit la-bas).
 * Visuels STATIQUES fiables (rendus au prerender, propres pour le SEO) : eventail
 * de mini-thumbs stickers + le print encadre de la home. Fond sobre du site, jetons
 * de theme, zero couleur en dur. Seul /boutique reste au sitemap ; les ex-sous-pages
 * /boutique/* redirigent (cf public/_redirects).
 */

const MINI = '/images/thumbs-mini/stickers-massive';
const PRINT_CARD = '/images/home/print-card.webp';
// eventail d'apercu stickers : des designs nets et lisibles en vignette.
const STICKER_PREVIEW = [
  'massive-dj-skull', 'massive-chameleon', 'massive-alien-hot', 'massive-panda-cute',
  'massive-cute-ourson', 'massive-papillon', 'massive-fox', 'massive-astro',
  'massive-requin', 'massive-poulpon', 'massive-renard', 'massive-tortue',
];

export default function Shop() {
  const { tx } = useLang();
  const stickerCount = MASSIVE_STICKERS.length;

  return (
    <div className="min-h-screen">
      <SEO
        title={tx({
          fr: 'Boutique - Stickers & Prints d’artistes | Massive Medias',
          en: 'Shop - Stickers & Artist Prints | Massive Medias',
          es: 'Tienda - Stickers y Prints de artistas | Massive Medias',
        })}
        description={tx({
          fr: `La boutique Massive : ${stickerCount} stickers originaux dès 3 $ et les prints fine art des artistes du collectif. Conçu et imprimé à Montréal.`,
          en: `The Massive shop: ${stickerCount} original stickers from $3 and fine art prints by our collective artists. Designed and printed in Montreal.`,
          es: `La tienda Massive: ${stickerCount} stickers originales desde 3 $ y prints fine art de los artistas del colectivo. Diseñado e impreso en Montreal.`,
        })}
        breadcrumbs={[
          { name: tx({ fr: 'Accueil', en: 'Home', es: 'Inicio' }), url: '/' },
          { name: tx({ fr: 'Boutique', en: 'Shop', es: 'Tienda' }), url: '/boutique' },
        ]}
      />

      {/* ── Hero ── */}
      <section className="section-container pt-28 md:pt-32 pb-6 text-center">
        <h1 className="section-title-lg text-heading mb-4">
          {tx({ fr: 'La boutique', en: 'The shop', es: 'La tienda' })}
        </h1>
        <p className="text-grey-light text-base md:text-lg max-w-2xl mx-auto">
          {tx({
            fr: 'Stickers originaux et prints d’artistes du collectif. Conçu et imprimé à Montréal.',
            en: 'Original stickers and prints by our collective artists. Designed and printed in Montreal.',
            es: 'Stickers originales y prints de los artistas del colectivo. Diseñado e impreso en Montreal.',
          })}
        </p>
      </section>

      {/* ── Section STICKERS ── */}
      <section className="section-container py-8">
        <div className="surface-vitrine card-shadow rounded-3xl p-6 md:p-8">
          <div className="flex items-center gap-2.5 mb-5">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-accent/10 shrink-0">
              <Sticker size={18} className="text-accent" />
            </span>
            <div>
              <h2 className="section-title-sm text-heading text-xl md:text-2xl">
                {tx({ fr: 'Stickers', en: 'Stickers', es: 'Stickers' })}
              </h2>
              <p className="text-grey-light text-sm">
                {tx({
                  fr: `${stickerCount} designs originaux dès 3 $, résistants à l’eau.`,
                  en: `${stickerCount} original designs from $3, water resistant.`,
                  es: `${stickerCount} diseños originales desde 3 $, resistentes al agua.`,
                })}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mb-6">
            {STICKER_PREVIEW.map((slug) => (
              <img
                key={slug}
                src={`${MINI}/${slug}.webp`}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="sticker-stroke w-full aspect-square object-contain"
              />
            ))}
          </div>
          <Link to="/stickers" className="btn-primary inline-flex items-center gap-2">
            {tx({ fr: `Voir les ${stickerCount} stickers`, en: `See all ${stickerCount} stickers`, es: `Ver los ${stickerCount} stickers` })}
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      {/* ── Section PRINTS D'ARTISTES (promo -> galerie /artistes) ── */}
      <section className="section-container py-8 pb-16">
        <div className="surface-vitrine card-shadow rounded-3xl p-6 md:p-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* print encadre (objet physique : cadre noir + passe-partout blanc,
                sa couleur ne suit pas le theme, comme la home) */}
            <div className="flex justify-center order-1 md:order-2">
              <div className="bg-white p-2.5 shadow-2xl" style={{ border: '6px solid #14141a', transform: 'rotate(-2deg)' }}>
                <img src={PRINT_CARD} alt="" aria-hidden="true" loading="lazy" decoding="async" className="w-44 md:w-52 aspect-[4/5] object-cover object-top block" />
              </div>
            </div>
            <div className="order-2 md:order-1">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-accent/10 shrink-0">
                  <Printer size={18} className="text-accent" />
                </span>
                <h2 className="section-title-sm text-heading text-xl md:text-2xl">
                  {tx({ fr: 'Prints d’artistes', en: 'Artist prints', es: 'Prints de artistas' })}
                </h2>
              </div>
              <p className="text-grey-light text-sm md:text-base mb-6 max-w-md">
                {tx({
                  fr: 'Les œuvres des artistes du collectif Massive, en tirage fine art encadré. Chaque artiste a sa galerie et ses formats.',
                  en: 'Works by the Massive collective artists, as framed fine art prints. Each artist has their own gallery and formats.',
                  es: 'Obras de los artistas del colectivo Massive, en impresión fine art enmarcada. Cada artista tiene su galería y formatos.',
                })}
              </p>
              <Link to="/artistes" className="btn-primary inline-flex items-center gap-2">
                {tx({ fr: 'Découvrir les artistes', en: 'Meet the artists', es: 'Conocer los artistas' })}
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
