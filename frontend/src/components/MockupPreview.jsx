/**
 * MockupPreview - Genere un mockup AI d'un print dans un interieur
 *
 * Utilise Gemini 2.0 Flash via le backend Strapi /mockup/generate
 * Props:
 *   - imageUrl: URL de l'oeuvre (fullImage)
 *   - frameColor: 'black' | 'white' (passe depuis le configurateur)
 *   - className: classes CSS additionnelles
 */
import { useState, useCallback, useEffect } from 'react';
import {
  Loader2, Download, Image, RefreshCw,
  Sofa, BedDouble, Briefcase, Flower2, UtensilsCrossed, BookOpen,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import useMockupGenerator from '../hooks/useMockupGenerator';
import { downloadImage } from '../utils/imageUtils';

const SCENES = [
  { id: 'living_room', icon: Sofa, fr: 'Salon', en: 'Living Room', es: 'Salon' },
  { id: 'bedroom', icon: BedDouble, fr: 'Chambre', en: 'Bedroom', es: 'Dormitorio' },
  { id: 'office', icon: Briefcase, fr: 'Bureau', en: 'Office', es: 'Oficina' },
  { id: 'dining', icon: UtensilsCrossed, fr: 'Salle a manger', en: 'Dining Room', es: 'Comedor' },
  { id: 'studio', icon: BookOpen, fr: 'Studio', en: 'Studio', es: 'Estudio' },
  { id: 'zen', icon: Flower2, fr: 'Zen', en: 'Zen', es: 'Zen' },
];

const ERROR_MESSAGES = {
  rate_limited: {
    fr: 'Limite atteinte (5/heure). Reessayez plus tard.',
    en: 'Rate limit reached (5/hour). Try again later.',
    es: 'Limite alcanzado (5/hora). Intente mas tarde.',
  },
  generation_failed: {
    fr: 'Generation echouee. Reessayez.',
    en: 'Generation failed. Try again.',
    es: 'Generacion fallida. Intente de nuevo.',
  },
  network_error: {
    fr: 'Erreur reseau. Verifiez votre connexion.',
    en: 'Network error. Check your connection.',
    es: 'Error de red. Verifique su conexion.',
  },
};

function MockupPreview({ imageUrl, frameColor = 'black', className = '' }) {
  const { tx } = useLang();
  const {
    mockupData, loading, error, scene, setScene,
    generate, reset, remaining,
  } = useMockupGenerator();

  const [showMockup, setShowMockup] = useState(false);

  // URL absolue pour le backend (les chemins relatifs ne sont pas fetchables cote serveur)
  const absoluteUrl = imageUrl?.startsWith('http')
    ? imageUrl
    : imageUrl?.startsWith('data:')
      ? imageUrl
      : `${window.location.origin}${imageUrl?.startsWith('/') ? '' : '/'}${imageUrl}`;

  // Reset quand l'image ou la couleur de cadre change
  useEffect(() => {
    if (showMockup) {
      reset();
      setShowMockup(false);
    }
  }, [imageUrl, frameColor]);

  const handleGenerate = useCallback((selectedScene) => {
    const s = selectedScene || scene;
    generate(absoluteUrl, s, frameColor);
    setShowMockup(true);
  }, [absoluteUrl, scene, frameColor, generate]);

  const handleSceneChange = (newScene) => {
    setScene(newScene);
    if (showMockup) {
      generate(absoluteUrl, newScene, frameColor);
    }
  };

  const handleDownload = () => {
    if (!mockupData) return;
    const artistName = imageUrl.split('/').pop()?.split('.')[0] || 'art';
    downloadImage(mockupData, `mockup-${artistName}-${scene}.png`);
  };

  if (!imageUrl) return null;

  const errorMsg = error ? (ERROR_MESSAGES[error] || ERROR_MESSAGES.generation_failed) : null;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Bouton principal - visible quand pas de mockup affiche */}
      {!showMockup && !loading && (
        <button
          onClick={() => handleGenerate()}
          disabled={remaining <= 0}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent/10 text-accent text-sm font-semibold hover:bg-accent/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Image size={16} />
          {tx({ fr: 'Voir dans un interieur', en: 'See in a room', es: 'Ver en una habitacion' })}
          {remaining <= 2 && remaining > 0 && (
            <span className="text-[10px] opacity-60">({remaining})</span>
          )}
        </button>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-8 rounded-xl bg-black/20">
          <Loader2 size={28} className="animate-spin text-accent mb-3" />
          <p className="text-heading text-sm font-medium">
            {tx({ fr: 'Generation en cours...', en: 'Generating...', es: 'Generando...' })}
          </p>
          <p className="text-grey-muted text-xs mt-1">
            {tx({ fr: '~15-25 secondes', en: '~15-25 seconds', es: '~15-25 segundos' })}
          </p>
          <button
            onClick={() => { reset(); setShowMockup(false); }}
            className="text-grey-muted text-xs mt-3 hover:text-heading transition-colors"
          >
            {tx({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' })}
          </button>
        </div>
      )}

      {/* Erreur */}
      {error && !loading && (
        <div className="text-center py-4 rounded-xl bg-red-500/10">
          <p className="text-red-400 text-sm mb-2">{tx(errorMsg)}</p>
          {error !== 'rate_limited' && (
            <button
              onClick={() => handleGenerate()}
              className="text-accent text-xs hover:underline flex items-center gap-1 mx-auto"
            >
              <RefreshCw size={12} />
              {tx({ fr: 'Réessayer', en: 'Retry', es: 'Reintentar' })}
            </button>
          )}
        </div>
      )}

      {/* Mockup genere */}
      {showMockup && mockupData && !loading && (
        <div className="space-y-2">
          <img
            src={mockupData}
            alt={tx({ fr: 'Aperçu mockup', en: 'Mockup preview', es: 'Vista previa mockup' })}
            className="w-full rounded-xl shadow-lg"
          />

          {/* Scene selector */}
          <div className="flex items-center gap-1.5 justify-center flex-wrap">
            {SCENES.map(s => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => handleSceneChange(s.id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    scene === s.id
                      ? 'bg-accent text-white'
                      : 'bg-black/20 text-grey-muted hover:text-heading'
                  }`}
                >
                  <Icon size={12} />
                  {tx({ fr: s.fr, en: s.en, es: s.es })}
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-center">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 text-heading text-xs hover:bg-white/15 transition-colors"
            >
              <Download size={12} />
              {tx({ fr: 'Télécharger', en: 'Download', es: 'Descargar' })}
            </button>
            <button
              onClick={() => { reset(); setShowMockup(false); }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 text-grey-muted text-xs hover:text-heading transition-colors"
            >
              {tx({ fr: 'Voir l\'oeuvre', en: 'View artwork', es: 'Ver obra' })}
            </button>
          </div>

          {remaining <= 2 && (
            <p className="text-center text-grey-muted text-[10px]">
              {tx({
                fr: `${remaining} generation${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''} cette heure`,
                en: `${remaining} generation${remaining > 1 ? 's' : ''} remaining this hour`,
                es: `${remaining} generacion${remaining > 1 ? 'es' : ''} restante${remaining > 1 ? 's' : ''} esta hora`,
              })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default MockupPreview;
