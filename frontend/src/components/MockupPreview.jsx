import { useState, useCallback } from 'react';
import { Loader2, Download, Image, RefreshCw, Sofa, BedDouble, Briefcase } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import api from '../services/api';

const SCENES = [
  { id: 'living_room', icon: Sofa, fr: 'Salon', en: 'Living Room', es: 'Salon' },
  { id: 'bedroom', icon: BedDouble, fr: 'Chambre', en: 'Bedroom', es: 'Dormitorio' },
  { id: 'office', icon: Briefcase, fr: 'Bureau', en: 'Office', es: 'Oficina' },
];

function MockupPreview({ imageUrl, frameColor = 'black', className = '' }) {
  const { tx } = useLang();
  const [mockupData, setMockupData] = useState(null); // base64 image data
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scene, setScene] = useState('living_room');
  const [showMockup, setShowMockup] = useState(false);

  const generateMockup = useCallback(async (selectedScene) => {
    if (!imageUrl) return;
    setLoading(true);
    setError('');
    setMockupData(null);

    try {
      const res = await api.post('/mockup/generate', {
        imageUrl,
        scene: selectedScene || scene,
        frameColor,
      }, { timeout: 60000 }); // 60s timeout

      if (res.data?.success && res.data?.image) {
        const { mimeType, data } = res.data.image;
        setMockupData(`data:${mimeType};base64,${data}`);
        setShowMockup(true);
      } else {
        setError(tx({ fr: 'Generation echouee', en: 'Generation failed', es: 'Generacion fallida' }));
      }
    } catch (err) {
      setError(tx({ fr: 'Erreur de generation. Reessayez.', en: 'Generation error. Try again.', es: 'Error de generacion. Intente de nuevo.' }));
    } finally {
      setLoading(false);
    }
  }, [imageUrl, scene, frameColor, tx]);

  const handleSceneChange = (newScene) => {
    setScene(newScene);
    if (showMockup) generateMockup(newScene);
  };

  const handleDownload = () => {
    if (!mockupData) return;
    const link = document.createElement('a');
    link.href = mockupData;
    link.download = `mockup-${scene}.png`;
    link.click();
  };

  if (!imageUrl) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Bouton principal */}
      {!showMockup && !loading && (
        <button
          onClick={() => generateMockup()}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent/10 text-accent text-sm font-semibold hover:bg-accent/20 transition-colors"
        >
          <Image size={16} />
          {tx({ fr: 'Voir dans un salon', en: 'See in a room', es: 'Ver en una habitacion' })}
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
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="text-center py-4 rounded-xl bg-red-500/10">
          <p className="text-red-400 text-sm mb-2">{error}</p>
          <button onClick={() => generateMockup()} className="text-accent text-xs hover:underline flex items-center gap-1 mx-auto">
            <RefreshCw size={12} /> {tx({ fr: 'Reessayer', en: 'Retry', es: 'Reintentar' })}
          </button>
        </div>
      )}

      {/* Mockup genere */}
      {showMockup && mockupData && !loading && (
        <div className="space-y-2">
          <img
            src={mockupData}
            alt="Mockup"
            className="w-full rounded-xl shadow-lg"
          />

          {/* Scene selector */}
          <div className="flex items-center gap-2 justify-center">
            {SCENES.map(s => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => handleSceneChange(s.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    scene === s.id ? 'bg-accent text-white' : 'bg-black/20 text-grey-muted hover:text-heading'
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
            <button onClick={handleDownload} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 text-heading text-xs hover:bg-white/15 transition-colors">
              <Download size={12} />
              {tx({ fr: 'Telecharger', en: 'Download', es: 'Descargar' })}
            </button>
            <button onClick={() => { setShowMockup(false); setMockupData(null); }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 text-grey-muted text-xs hover:text-heading transition-colors">
              {tx({ fr: 'Voir l\'oeuvre', en: 'View artwork', es: 'Ver obra' })}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MockupPreview;
