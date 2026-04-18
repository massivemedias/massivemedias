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
        if (prevStatus === 'down' && newStatus === 'up') {
          setJustRecovered(true);
          setTimeout(() => setJustRecovered(false), 4000);
        }
        return newStatus;
      });
    });
    return unsub;
  }, []);

  if (status !== 'down' && !justRecovered) return null;

  const t = {
    fr: {
      down: 'Nos serveurs sont temporairement ralentis. Votre travail est sauvegarde localement, on reessaie automatiquement.',
      recovered: 'Connexion retablie.',
      retry: 'Reessayer maintenant',
    },
    en: {
      down: 'Our servers are temporarily slow. Your work is saved locally, we retry automatically.',
      recovered: 'Connection restored.',
      retry: 'Retry now',
    },
    es: {
      down: 'Nuestros servidores estan lentos. Tu trabajo se guarda localmente, reintentamos automaticamente.',
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
