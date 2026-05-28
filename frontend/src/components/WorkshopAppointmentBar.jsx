import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { WORKSHOP_NOTICE } from '../constants/workshop';

// WorkshopAppointmentBar (27 mai 2026) : bandeau permanent NON-DISMISSIBLE
// au-dessus du Header. Avertit que l'atelier 5338 Marquette est sur rendez
// vous uniquement, pour eviter les visites spontanees.
// - Prerender-safe : pas de useEffect, pas de window/localStorage en render
// - i18n via useLang().tx() (3 langues)
// - Lien direct vers /contact pour prendre RDV
// - bg-red-700 : avis dissuasif, pas marketing
// - Mobile h-12 (texte wrap sur 2 lignes), desktop h-9 (1 ligne)
function WorkshopAppointmentBar() {
  const { tx } = useLang();
  return (
    <div
      role="region"
      aria-label={tx({
        fr: 'Avis atelier sur rendez-vous',
        en: 'Workshop by appointment notice',
        es: 'Aviso de taller con cita previa',
      })}
      className="fixed top-0 left-0 right-0 z-[60] bg-red-700 text-white h-12 sm:h-9 flex items-center justify-center px-3 shadow-sm"
    >
      <p className="text-center text-xs sm:text-sm flex items-center justify-center gap-x-2 gap-y-0 flex-wrap leading-tight">
        <Calendar size={14} className="flex-shrink-0" aria-hidden="true" />
        <span className="font-medium">{tx(WORKSHOP_NOTICE)}</span>
        <span className="opacity-60 hidden sm:inline" aria-hidden="true">·</span>
        <Link
          to="/contact"
          className="font-bold underline underline-offset-2 hover:opacity-80 transition-opacity whitespace-nowrap"
        >
          {tx({ fr: 'Prendre RDV', en: 'Book now', es: 'Reservar' })}
        </Link>
      </p>
    </div>
  );
}

export default WorkshopAppointmentBar;
