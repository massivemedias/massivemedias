import { useLang } from '../../i18n/LanguageContext';
import { ShoppingBag, Printer, Sticker, Shirt, ArrowRight, Percent } from 'lucide-react';
import { Link } from 'react-router-dom';

const DISCOUNT_RATE = 0.30; // 30% tatoueur discount

const SHOP_SECTIONS = [
  {
    key: 'prints',
    icon: Printer,
    titleFr: 'Prints Fine Art',
    titleEn: 'Fine Art Prints',
    descFr: 'Tes flashs imprimes en qualite galerie sur papier Hahnemuhle.',
    descEn: 'Your flash designs printed in gallery quality on Hahnemuhle paper.',
    discounted: true,
    link: '/boutique/fine-art',
  },
  {
    key: 'stickers',
    icon: Sticker,
    titleFr: 'Stickers',
    titleEn: 'Stickers',
    descFr: 'Stickers de tes designs. Prix standard, pas de rabais.',
    descEn: 'Stickers of your designs. Standard pricing, no discount.',
    discounted: false,
    link: '/services/stickers',
  },
  {
    key: 'merch',
    icon: Shirt,
    titleFr: 'Merch (T-shirts, Hoodies)',
    titleEn: 'Merch (T-shirts, Hoodies)',
    descFr: 'Tes designs sur du merch premium. 30% de rabais tatoueur.',
    descEn: 'Your designs on premium merch. 30% tattoo artist discount.',
    discounted: true,
    link: '/boutique/merch/tshirt',
  },
];

export default function TatoueurShop({ tatoueur }) {
  const { tx } = useLang();
  const discount = tatoueur?.discountRate || DISCOUNT_RATE;
  const discountPercent = Math.round(discount * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-bold text-heading">
          {tx({ fr: 'Boutique tatoueur', en: 'Tattoo Artist Shop' })}
        </h2>
      </div>

      {/* Discount banner */}
      <div className="bg-accent/10 border border-accent/30 rounded-xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
          <Percent size={24} className="text-accent" />
        </div>
        <div>
          <h3 className="font-heading font-bold text-heading text-sm">
            {tx({ fr: `Rabais tatoueur de ${discountPercent}%`, en: `${discountPercent}% tattoo artist discount` })}
          </h3>
          <p className="text-xs text-grey-muted mt-0.5">
            {tx({
              fr: 'Ton rabais est applique automatiquement sur les prints et le merch quand tu commandes depuis ton dashboard.',
              en: 'Your discount is automatically applied on prints and merch when you order from your dashboard.',
            })}
          </p>
        </div>
      </div>

      {/* Shop sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SHOP_SECTIONS.map(section => {
          const Icon = section.icon;
          return (
            <Link
              key={section.key}
              to={section.link}
              className="group bg-bg-card rounded-xl border border-white/5 p-6 hover:border-accent/20 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-bg-elevated flex items-center justify-center">
                  <Icon size={20} className="text-accent" />
                </div>
                <h3 className="font-heading font-bold text-heading text-sm">
                  {tx({ fr: section.titleFr, en: section.titleEn })}
                </h3>
              </div>

              <p className="text-xs text-grey-muted mb-4">
                {tx({ fr: section.descFr, en: section.descEn })}
              </p>

              <div className="flex items-center justify-between">
                {section.discounted ? (
                  <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2.5 py-1 rounded-full">
                    -{discountPercent}%
                  </span>
                ) : (
                  <span className="text-xs text-grey-muted">
                    {tx({ fr: 'Prix standard', en: 'Standard pricing' })}
                  </span>
                )}
                <ArrowRight size={16} className="text-grey-muted group-hover:text-accent group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          );
        })}
      </div>

      <p className="text-xs text-grey-muted text-center">
        {tx({
          fr: 'Le rabais est applique automatiquement au checkout. Commande comme d\'habitude via la boutique.',
          en: 'The discount is automatically applied at checkout. Order as usual through the shop.',
        })}
      </p>
    </div>
  );
}
