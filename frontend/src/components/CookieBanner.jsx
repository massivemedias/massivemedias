import { useState } from 'react';
import { Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { useCookies } from '../contexts/CookieContext';
import { useLang } from '../i18n/LanguageContext';

function CookieBanner() {
  const { showBanner, acceptAll, rejectAll, acceptSelected } = useCookies();
  const { lang } = useLang();
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  if (!showBanner) return null;

  const t = lang === 'fr' ? {
    title: 'Respect de votre vie privée',
    desc: 'Nous utilisons des cookies pour analyser le trafic et améliorer votre expérience. Conformément à la Loi 25 du Québec, votre consentement est requis.',
    acceptAll: 'Tout accepter',
    rejectAll: 'Refuser',
    customize: 'Personnaliser',
    save: 'Enregistrer mes choix',
    necessary: 'Essentiels',
    necessaryDesc: 'Fonctionnement du site (panier, thème, langue). Toujours actifs.',
    analyticsLabel: 'Analytique',
    analyticsDesc: 'Google Analytics - comprendre comment vous utilisez le site pour l\'améliorer.',
    marketingLabel: 'Marketing',
    marketingDesc: 'Permettre le suivi pour des publicités personnalisées (Meta Pixel, etc.).',
    always: 'Toujours actif',
  } : {
    title: 'Your privacy matters',
    desc: 'We use cookies to analyze traffic and improve your experience. As required by Quebec\'s Law 25, your consent is needed.',
    acceptAll: 'Accept all',
    rejectAll: 'Decline',
    customize: 'Customize',
    save: 'Save my choices',
    necessary: 'Essential',
    necessaryDesc: 'Site functionality (cart, theme, language). Always active.',
    analyticsLabel: 'Analytics',
    analyticsDesc: 'Google Analytics - understand how you use the site to improve it.',
    marketingLabel: 'Marketing',
    marketingDesc: 'Allow tracking for personalized ads (Meta Pixel, etc.).',
    always: 'Always active',
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
              <Shield size={18} className="text-magenta" />
            </div>
            <h3 className="text-heading font-heading font-bold text-base">{t.title}</h3>
          </div>

          <p className="text-grey-muted text-sm leading-relaxed mb-4">{t.desc}</p>

          {/* Details toggle */}
          {showDetails && (
            <div className="space-y-3 mb-4">
              {/* Essential */}
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-glass)' }}>
                <div>
                  <span className="text-heading text-sm font-semibold">{t.necessary}</span>
                  <p className="text-grey-muted text-xs mt-0.5">{t.necessaryDesc}</p>
                </div>
                <span className="text-xs text-magenta font-medium whitespace-nowrap ml-3">{t.always}</span>
              </div>

              {/* Analytics */}
              <label className="flex items-center justify-between p-3 rounded-lg cursor-pointer" style={{ background: 'var(--bg-glass)' }}>
                <div className="flex-1">
                  <span className="text-heading text-sm font-semibold">{t.analyticsLabel}</span>
                  <p className="text-grey-muted text-xs mt-0.5">{t.analyticsDesc}</p>
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
                  <span className="text-heading text-sm font-semibold">{t.marketingLabel}</span>
                  <p className="text-grey-muted text-xs mt-0.5">{t.marketingDesc}</p>
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
              {t.acceptAll}
            </button>

            {showDetails ? (
              <button
                onClick={() => acceptSelected({ analytics, marketing })}
                className="btn-outline flex-1 justify-center text-sm py-2.5"
              >
                {t.save}
              </button>
            ) : (
              <button
                onClick={() => setShowDetails(true)}
                className="btn-outline flex-1 justify-center text-sm py-2.5 gap-1.5"
              >
                {t.customize}
                <ChevronDown size={14} />
              </button>
            )}

            <button onClick={rejectAll} className="text-grey-muted hover:text-heading text-sm py-2.5 px-4 transition-colors">
              {t.rejectAll}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CookieBanner;
