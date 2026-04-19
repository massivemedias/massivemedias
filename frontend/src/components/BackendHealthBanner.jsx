import { useEffect, useState } from 'react';
import { onBackendStatusChange, pingBackend } from '../utils/apiResilient';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';

/**
 * Banner global qui apparait en haut du site quand le backend est detecte
 * indisponible. Garantit que le client sait que ses actions echouent pour une
 * raison transitoire (pas sa faute) et qu'on est en train de retry.
 *
 * Mount une seule fois dans App.jsx en dehors des Routes.
 */
export default function BackendHealthBanner() {
  const { lang } = useLang();
  const [status, setStatus] = useState('unknown');
  const [justRecovered, setJustRecovered] = useState(false);

  useEffect(() => {
    const unsub = onBackendStatusChange((newStatus) => {
      setStatus((prevStatus) => {
        // Recovery si on sort de down/slow vers up
        if ((prevStatus === 'down' || prevStatus === 'slow') && newStatus === 'up') {
          setJustRecovered(true);
          setTimeout(() => setJustRecovered(false), 4000);
        }
        return newStatus;
      });
    });
    return unsub;
  }, []);

  // MON-01 : banner ambre si down, banner amber plus subtil si slow.
  if (status !== 'down' && status !== 'slow' && !justRecovered) return null;

  const t = {
    fr: {
      down: 'Nos serveurs sont temporairement indisponibles. Votre travail est sauvegarde localement, on reessaie automatiquement.',
      slow: 'Les serveurs sont plus lents que d\'habitude. Les actions peuvent prendre quelques secondes de plus.',
      recovered: 'Connexion retablie.',
      retry: 'Reessayer maintenant',
    },
    en: {
      down: 'Our servers are temporarily unavailable. Your work is saved locally, we retry automatically.',
      slow: 'Our servers are slower than usual. Actions may take a few extra seconds.',
      recovered: 'Connection restored.',
      retry: 'Retry now',
    },
    es: {
      down: 'Nuestros servidores no estan disponibles. Tu trabajo se guarda localmente, reintentamos automaticamente.',
      slow: 'Los servidores estan mas lentos de lo habitual. Las acciones pueden tardar unos segundos mas.',
      recovered: 'Conexion restablecida.',
      retry: 'Reintentar ahora',
    },
  };
  const tx = t[lang] || t.fr;

  if (justRecovered) {
    return (
      <div
        role="status"
        className="fixed top-0 left-0 right-0 z-[9999] bg-emerald-600 text-white px-4 py-2 text-sm flex items-center justify-center gap-2 shadow-lg"
      >
        <CheckCircle2 size={16} />
        <span>{tx.recovered}</span>
      </div>
    );
  }

  if (status === 'slow') {
    return (
      <div
        role="status"
        className="fixed top-0 left-0 right-0 z-[9999] bg-amber-300 text-black px-4 py-2 text-sm flex items-center justify-center gap-2 shadow-lg"
      >
        <AlertTriangle size={14} />
        <span>{tx.slow}</span>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-black px-4 py-2 text-sm flex items-center justify-center gap-3 shadow-lg"
    >
      <AlertTriangle size={16} />
      <span>{tx.down}</span>
      <button
        type="button"
        onClick={() => pingBackend()}
        className="underline font-semibold hover:no-underline"
      >
        {tx.retry}
      </button>
    </div>
  );
}
