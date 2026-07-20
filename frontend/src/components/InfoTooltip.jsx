import { useState, useRef, useEffect, useId } from 'react';
import { HelpCircle } from 'lucide-react';

/**
 * InfoTooltip - TOOLTIPS-ADMIN
 * ----------------------------
 * Petite icone "?" discrete qui explique une metrique du dashboard admin.
 *
 * - Desktop : survol (hover) OU focus clavier -> affiche la bulle.
 * - Mobile : pas de hover -> le TAP sur l'icone ouvre/ferme la bulle ; un tap
 *   ailleurs (ou Echap) la ferme.
 * - Accessible : <button> focusable, aria-label, role="tooltip", contenu lisible
 *   au clavier et par lecteur d'ecran.
 *
 * Le texte passe DOIT decrire ce que la metrique mesure REELLEMENT (pas ce que
 * le label laisse croire). Themable : utilise les jetons du theme (surface
 * sombre --bg-footer + texte clair), jamais de couleur en dur.
 *
 * Usage :
 *   <span className="flex items-center gap-1">
 *     Taux rebond <InfoTooltip text="…" />
 *   </span>
 *
 * `side` : 'top' | 'bottom' (defaut 'top') - cote d'apparition de la bulle.
 * `size` : diametre de l'icone en px (defaut 13).
 */
export default function InfoTooltip({ text, label, side = 'top', size = 13, className = '' }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const tipId = useId();

  // Fermer sur clic exterieur (utile apres un tap mobile) + touche Echap.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('touchstart', onDoc, { passive: true });
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('touchstart', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span
      ref={wrapRef}
      className={`relative inline-flex items-center align-middle ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={label || 'Explication'}
        aria-describedby={open ? tipId : undefined}
        aria-expanded={open}
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen((o) => !o); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex items-center justify-center text-grey-muted/70 hover:text-accent focus:text-accent focus:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-full transition-colors cursor-help"
      >
        <HelpCircle size={size} />
      </button>

      {open && (
        <span
          id={tipId}
          role="tooltip"
          className={`absolute z-50 left-1/2 -translate-x-1/2 w-max max-w-[240px] px-3 py-2 rounded-lg text-[11px] leading-snug font-normal normal-case tracking-normal text-left shadow-lg shadow-black/30 pointer-events-none ${
            side === 'bottom' ? 'top-full mt-1.5' : 'bottom-full mb-1.5'
          }`}
          style={{
            background: 'var(--bg-footer, #14001f)',
            color: 'var(--color-heading, #fff)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}
