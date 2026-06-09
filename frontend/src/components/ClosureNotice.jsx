import { AlertCircle } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { CLOSURE_ACTIVE, CLOSURE_NOTICE } from '../constants/closure';

// Notice de fermeture temporaire : rouge, discrete mais presente.
// - Si CLOSURE_ACTIVE est false (cf. constants/closure.js), ne rend RIEN (null),
//   donc aucune marge ni espace residuel quand la fermeture est terminee.
// - Bloc centre, encart rouge attenue (border + fond rouge tres leger + texte
//   rouge clair) lisible sur le fond hero-aurora sombre sans etre criard.
// - className permet de passer la marge depuis le parent (ex: "mt-6").
function ClosureNotice({ className = '' }) {
  const { tx } = useLang();
  if (!CLOSURE_ACTIVE) return null;
  return (
    <div className={`flex justify-center ${className}`}>
      <div
        role="status"
        className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-red-300 text-sm font-medium"
      >
        <AlertCircle size={15} className="flex-shrink-0" aria-hidden="true" />
        <span>{tx(CLOSURE_NOTICE)}</span>
      </div>
    </div>
  );
}

export default ClosureNotice;
