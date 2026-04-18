import { Link } from 'react-router-dom';
import { Package, Mail } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { MERCH_PAUSED, MERCH_PAUSE_COPY } from '../config/merchStatus';

/**
 * Banniere de maintenance affichee en haut des pages Merch / Sublimation
 * pendant que le service est en pause. S'auto-cache si MERCH_PAUSED=false.
 *
 * Design: encart ambre/doux plutot que rouge (information, pas erreur).
 * Responsive, accessible (role="status"), respecte les couleurs du theme.
 */
function MerchPauseBanner() {
  const { tx } = useLang();
  if (!MERCH_PAUSED) return null;

  // On split le body sur \n\n pour avoir un espacement propre entre paragraphes
  const bodyText = tx(MERCH_PAUSE_COPY.body);
  const paragraphs = bodyText.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <section
      role="status"
      aria-live="polite"
      className="mb-8 md:mb-10 rounded-2xl overflow-hidden border border-amber-400/30 bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-transparent shadow-lg backdrop-blur-sm"
    >
      <div className="p-5 md:p-8 lg:p-10">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center">
            <Package size={24} className="text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl md:text-2xl lg:text-[26px] font-heading font-bold text-heading leading-tight">
              {tx(MERCH_PAUSE_COPY.title)}
            </h2>
          </div>
        </div>

        <div className="space-y-3 md:pl-[4.25rem]">
          {paragraphs.map((p, i) => (
            <p
              key={i}
              className={`text-sm md:text-base leading-relaxed ${
                p.startsWith('⚡️')
                  ? 'text-amber-200 font-medium'
                  : 'text-grey-muted'
              }`}
            >
              {p}
            </p>
          ))}

          <div className="pt-2">
            <Link
              to="/contact?sujet=demande-speciale-vinyle"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 transition-colors shadow-md"
            >
              <Mail size={16} />
              {tx(MERCH_PAUSE_COPY.ctaLabel)}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MerchPauseBanner;
