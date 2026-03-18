import { useState } from 'react';
import { Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { useCookies } from '../contexts/CookieContext';
import { useLang } from '../i18n/LanguageContext';

function CookieBanner() {
  const { showBanner, acceptAll, rejectAll, acceptSelected } = useCookies();
  const { tx } = useLang();
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  if (!showBanner) return null;

  const labels = {
    title: tx({ fr: 'Respect de votre vie privee', en: 'Your privacy matters', es: 'Su privacidad importa' }),
    desc: tx({
      fr: 'Nous utilisons des cookies pour analyser le trafic et améliorer votre expérience. Conformément à la Loi 25 du Québec, votre consentement est requis.',
      en: 'We use cookies to analyze traffic and improve your experience. As required by Quebec\'s Law 25, your consent is needed.',
      es: 'Usamos cookies para analizar el trafico y mejorar su experiencia. Segun la Ley 25 de Quebec, se requiere su consentimiento.',
    }),
    acceptAll: tx({ fr: 'Tout accepter', en: 'Accept all', es: 'Aceptar todo' }),
    rejectAll: tx({ fr: 'Refuser', en: 'Decline', es: 'Rechazar' }),
    customize: tx({ fr: 'Personnaliser', en: 'Customize', es: 'Personalizar' }),
    save: tx({ fr: 'Enregistrer mes choix', en: 'Save my choices', es: 'Guardar mis opciones' }),
    necessary: tx({ fr: 'Essentiels', en: 'Essential', es: 'Esenciales' }),
    necessaryDesc: tx({
      fr: 'Fonctionnement du site (panier, theme, langue). Toujours actifs.',
      en: 'Site functionality (cart, theme, language). Always active.',
      es: 'Funcionamiento del sitio (carrito, tema, idioma). Siempre activos.',
    }),
    analyticsLabel: tx({ fr: 'Analytique', en: 'Analytics', es: 'Analitica' }),
    analyticsDesc: tx({
      fr: 'Google Analytics - comprendre comment vous utilisez le site pour l\'améliorer.',
      en: 'Google Analytics - understand how you use the site to improve it.',
      es: 'Google Analytics - entender como usa el sitio para mejorarlo.',
    }),
    marketingLabel: tx({ fr: 'Marketing', en: 'Marketing', es: 'Marketing' }),
    marketingDesc: tx({
      fr: 'Permettre le suivi pour des publicites personnalisees (Meta Pixel, etc.).',
      en: 'Allow tracking for personalized ads (Meta Pixel, etc.).',
      es: 'Permitir el seguimiento para anuncios personalizados (Meta Pixel, etc.).',
    }),
    always: tx({ fr: 'Toujours actif', en: 'Always active', es: 'Siempre activo' }),
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6">
      <div className="max-w-2xl mx-auto rounded-2xl shadow-2xl border overflow-hidden"
        style={{
          background: 'var(--bg-card-solid)',
          borderColor: 'var(--bg-card-border)',
        }}
      >
        <div className="p-5 md:p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--icon-bg)' }}>
              <Shield size={18} className="text-accent" />
            </div>
            <h3 className="text-heading font-heading font-bold text-base">{labels.title}</h3>
          </div>

          <p className="text-grey-muted text-sm leading-relaxed mb-4">{labels.desc}</p>

          {/* Details toggle */}
          {showDetails && (
            <div className="space-y-3 mb-4">
              {/* Essential */}
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-glass)' }}>
                <div>
                  <span className="text-heading text-sm font-semibold">{labels.necessary}</span>
                  <p className="text-grey-muted text-xs mt-0.5">{labels.necessaryDesc}</p>
                </div>
                <span className="text-xs text-accent font-medium whitespace-nowrap ml-3">{labels.always}</span>
              </div>

              {/* Analytics */}
              <label className="flex items-center justify-between p-3 rounded-lg cursor-pointer" style={{ background: 'var(--bg-glass)' }}>
                <div className="flex-1">
                  <span className="text-heading text-sm font-semibold">{labels.analyticsLabel}</span>
                  <p className="text-grey-muted text-xs mt-0.5">{labels.analyticsDesc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="w-5 h-5 accent-magenta ml-3 flex-shrink-0"
                />
              </label>

              {/* Marketing */}
              <label className="flex items-center justify-between p-3 rounded-lg cursor-pointer" style={{ background: 'var(--bg-glass)' }}>
                <div className="flex-1">
                  <span className="text-heading text-sm font-semibold">{labels.marketingLabel}</span>
                  <p className="text-grey-muted text-xs mt-0.5">{labels.marketingDesc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="w-5 h-5 accent-magenta ml-3 flex-shrink-0"
                />
              </label>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={acceptAll} className="btn-primary flex-1 justify-center text-sm py-2.5">
              {labels.acceptAll}
            </button>

            {showDetails ? (
              <button
                onClick={() => acceptSelected({ analytics, marketing })}
                className="btn-outline flex-1 justify-center text-sm py-2.5"
              >
                {labels.save}
              </button>
            ) : (
              <button
                onClick={() => setShowDetails(true)}
                className="btn-outline flex-1 justify-center text-sm py-2.5 gap-1.5"
              >
                {labels.customize}
                <ChevronDown size={14} />
              </button>
            )}

            <button onClick={rejectAll} className="text-grey-muted hover:text-heading text-sm py-2.5 px-4 transition-colors">
              {labels.rejectAll}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CookieBanner;
