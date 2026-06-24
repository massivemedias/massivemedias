import { useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { TIER_EXPLAINER_SHORT, TIER_EXPLAINER_TITLE, TIER_EXPLAINER_TITLE_ALL, TIER_EXPLAINER_LONG, TIER_DESCRIPTION } from '../constants/printTiers'

// Explication Studio vs Musee, partagee partout ou les deux series apparaissent.
// Disclosure CLIQUABLE (pas de hover-only, mobile-friendly) :
// - variant="short" : 2 mini-paragraphes (tuiles de configurateur, grilles de prix).
// - variant="long"  : 3 paragraphes complets (pages tarifs, sections explicatives).
// - defaultOpen     : true pour afficher deplie d'office (sections editoriales).
// Les textes viennent de constants/printTiers.js (SSOT, 3 langues via tx()).
function TierExplainer({ variant = 'short', defaultOpen = false, includeAffiche = false, className = '' }) {
  const { tx } = useLang();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`rounded-lg bg-white/5 border border-white/10 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <span className="text-xs font-semibold text-heading flex items-center gap-1.5">
          <Info size={13} className="text-accent flex-shrink-0" aria-hidden="true" />
          {tx(includeAffiche ? TIER_EXPLAINER_TITLE_ALL : TIER_EXPLAINER_TITLE)}
        </span>
        <ChevronDown
          size={14}
          className={`text-accent flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2 text-xs text-grey-light leading-relaxed">
          {variant === 'short' ? (
            <>
              <p>
                <strong className="text-heading">Studio. </strong>
                {tx(TIER_EXPLAINER_SHORT.studio)}
              </p>
              <p>
                <strong className="text-heading">{tx({ fr: 'Musée', en: 'Museum', es: 'Museo' })}. </strong>
                {tx(TIER_EXPLAINER_SHORT.museum)}
              </p>
              {includeAffiche && (
                <p>
                  <strong className="text-heading">{tx({ fr: 'Affiches Standard', en: 'Standard Posters', es: 'Carteles Estandar' })}. </strong>
                  {tx(TIER_DESCRIPTION['affiche-standard'])}
                </p>
              )}
            </>
          ) : (
            <>
              <p>{tx(TIER_EXPLAINER_LONG.studio)}</p>
              <p>{tx(TIER_EXPLAINER_LONG.museum)}</p>
              <p className="font-semibold text-heading">{tx(TIER_EXPLAINER_LONG.summary)}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default TierExplainer;
