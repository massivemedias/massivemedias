import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Sparkles, Upload, Image as ImageIcon, Loader2, AlertTriangle, Trash2, Camera, Check,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import api from '../services/api';

/**
 * PortfolioWizardModal
 * --------------------
 * Wizard de creation d'une etude de cas portfolio a partir d'une commande
 * livree. Modal multi-bloc :
 *   1. Header : titre dynamique avec le nom du client
 *   2. Guide de style Massive Medias (statique - rappels qualite photo)
 *   3. Zone d'upload multi-images avec preview + drag&drop
 *   4. CTA : POST /admin/orders/:id/generate-portfolio (multipart/form-data)
 *
 * Backend correspondant : order.generatePortfolio (controllers/order.ts).
 * Apres succes, le parent (AdminOrders) affiche un toast vert avec lien
 * direct vers la fiche projet dans Strapi (mode draft a completer).
 */

const STYLE_GUIDE = [
  {
    emoji: '🤘',
    title: { fr: 'Comment faire une belle photo', en: 'How to nail a good photo', es: 'Como hacer una buena foto' },
    body: {
      fr: 'La qualite de ton portfolio depend de tes photos.',
      en: 'Your portfolio quality depends on your photos.',
      es: 'La calidad de tu portafolio depende de tus fotos.',
    },
  },
  {
    emoji: '🏷️',
    title: { fr: 'Pour les Stickers', en: 'For Stickers', es: 'Para los Stickers' },
    body: {
      fr: 'Colle-le sur une surface (laptop, gourde) et prends une photo a la lumiere naturelle.',
      en: 'Stick it on a surface (laptop, water bottle) and shoot in natural light.',
      es: 'Pegalo en una superficie (laptop, botella) y toma la foto con luz natural.',
    },
  },
  {
    emoji: '🖼️',
    title: { fr: 'Pour les Prints', en: 'For Prints', es: 'Para los Prints' },
    body: {
      fr: 'Utilise un mockup de cadre (Placeit/MockupWorld) ou une photo d\'ambiance.',
      en: 'Use a frame mockup (Placeit/MockupWorld) or an ambient lifestyle shot.',
      es: 'Usa un mockup de marco (Placeit/MockupWorld) o una foto de ambiente.',
    },
  },
  {
    emoji: '✂️',
    title: { fr: 'Crop automatique', en: 'Auto crop', es: 'Recorte automatico' },
    body: {
      fr: 'Ne t\'inquiete pas, le site recadre automatiquement pour un look pro (object-fit: cover).',
      en: 'Don\'t worry, the site auto-crops for a pro look (object-fit: cover).',
      es: 'No te preocupes, el sitio recorta automaticamente (object-fit: cover).',
    },
  },
];

const MAX_FILE_MB = 10;
const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,image/heic,image/avif';

function PortfolioWizardModal({ order, onClose, onSuccess, submitting: parentSubmitting }) {
  const { tx } = useLang();
  const [files, setFiles] = useState([]); // [{ file, previewUrl, error? }]
  const [titleOverride, setTitleOverride] = useState('');
  const [descriptionOverride, setDescriptionOverride] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  // Cleanup des object URLs au demontage
  useEffect(() => {
    return () => {
      files.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Echap pour fermer
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !submitting && !parentSubmitting) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, submitting, parentSubmitting]);

  const clientLabel = order?.companyName || order?.customerName || tx({ fr: 'Client', en: 'Client', es: 'Cliente' });
  const orderRef = (order?.orderRef || String(order?.documentId || '').slice(-8) || '').toUpperCase();

  const addFiles = (incoming) => {
    if (!incoming || incoming.length === 0) return;
    const arr = Array.from(incoming);
    const next = arr.map((file) => {
      const sizeMb = file.size / (1024 * 1024);
      if (!file.type.startsWith('image/')) {
        return { file, previewUrl: null, error: tx({ fr: 'Format non supporte', en: 'Unsupported format', es: 'Formato no compatible' }) };
      }
      if (sizeMb > MAX_FILE_MB) {
        return { file, previewUrl: null, error: tx({
          fr: `Trop volumineux (${sizeMb.toFixed(1)} Mo > ${MAX_FILE_MB} Mo)`,
          en: `Too large (${sizeMb.toFixed(1)} MB > ${MAX_FILE_MB} MB)`,
          es: `Demasiado grande (${sizeMb.toFixed(1)} MB > ${MAX_FILE_MB} MB)`,
        }) };
      }
      return { file, previewUrl: URL.createObjectURL(file), error: null };
    });
    setFiles((prev) => [...prev, ...next]);
  };

  const removeFile = (idx) => {
    setFiles((prev) => {
      const target = prev[idx];
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer?.files) addFiles(e.dataTransfer.files);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitError('');
    setSubmitting(true);

    try {
      const validFiles = files.filter((f) => !f.error);
      const formData = new FormData();
      validFiles.forEach((f) => formData.append('files', f.file, f.file.name));
      if (titleOverride.trim()) formData.append('title', titleOverride.trim());
      if (descriptionOverride.trim()) formData.append('description', descriptionOverride.trim());

      const { data } = await api.post(
        `/admin/orders/${order.documentId}/generate-portfolio`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          // Strapi peut prendre quelques secondes pour traiter plusieurs images
          timeout: 90_000,
        },
      );

      onSuccess(data);
    } catch (err) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        tx({
          fr: 'Erreur lors de la generation du brouillon. Reessayez ou contactez le support.',
          en: 'Error generating the draft. Retry or contact support.',
          es: 'Error al generar el borrador.',
        });
      setSubmitError(msg);
      setSubmitting(false);
    }
  };

  const validFilesCount = files.filter((f) => !f.error).length;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[9500] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 overflow-y-auto"
        onClick={() => !submitting && !parentSubmitting && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl my-8 rounded-2xl border shadow-2xl overflow-hidden"
          style={{ background: 'var(--bg-card-solid)', borderColor: 'var(--bg-input-border)' }}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 px-6 py-5 border-b" style={{ borderColor: 'var(--bg-input-border)' }}>
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <span className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0">
                <Sparkles size={18} className="text-accent" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] uppercase tracking-wider text-grey-muted font-semibold mb-1">
                  {tx({ fr: 'Wizard portfolio', en: 'Portfolio wizard', es: 'Asistente portafolio' })}
                </p>
                <h3 className="text-heading font-heading font-bold text-base leading-tight truncate">
                  {tx({
                    fr: `Creer une etude de cas pour ${clientLabel}`,
                    en: `Create a case study for ${clientLabel}`,
                    es: `Crear un estudio de caso para ${clientLabel}`,
                  })}
                </h3>
                {orderRef && (
                  <p className="text-[11px] text-grey-muted mt-1">
                    {tx({ fr: 'Source : commande', en: 'Source: order', es: 'Origen: pedido' })}{' '}
                    <span className="font-mono font-semibold">#{orderRef}</span>
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting || parentSubmitting}
              className="p-1.5 rounded-lg text-grey-muted hover:text-heading transition-colors disabled:opacity-40 flex-shrink-0"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Style guide */}
            <div className="rounded-xl p-4 space-y-3" style={{ background: '#fafafa', border: '1px solid #e5e5e5' }}>
              <div className="flex items-center gap-2">
                <Camera size={14} style={{ color: '#1f1f1f' }} />
                <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: '#1f1f1f' }}>
                  {tx({ fr: 'Guide de style Massive Medias', en: 'Massive Medias style guide', es: 'Guia de estilo Massive Medias' })}
                </span>
              </div>
              <ul className="space-y-2">
                {STYLE_GUIDE.map((g, i) => (
                  <li key={i} className="text-[13px] leading-relaxed" style={{ color: '#444' }}>
                    <span className="mr-1.5">{g.emoji}</span>
                    <strong style={{ color: '#1f1f1f' }}>{tx(g.title)} :</strong>{' '}
                    {tx(g.body)}
                  </li>
                ))}
              </ul>
            </div>

            {/* Title + description overrides (optionnels) */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-grey-muted font-semibold mb-1.5">
                  {tx({ fr: 'Titre du projet (optionnel)', en: 'Project title (optional)', es: 'Titulo del proyecto (opcional)' })}
                </label>
                <input
                  type="text"
                  value={titleOverride}
                  onChange={(e) => setTitleOverride(e.target.value)}
                  placeholder={tx({
                    fr: `Ex : Projet ${clientLabel} - ...`,
                    en: `Ex: ${clientLabel} project - ...`,
                    es: `Ej: Proyecto ${clientLabel} - ...`,
                  })}
                  className="input-field text-sm"
                  maxLength={150}
                  disabled={submitting}
                />
                <p className="text-[10px] text-grey-muted mt-1">
                  {tx({
                    fr: 'Vide = genere automatiquement depuis les items.',
                    en: 'Leave empty for auto-generated title.',
                    es: 'Vacio = generado automaticamente.',
                  })}
                </p>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-grey-muted font-semibold mb-1.5">
                  {tx({ fr: 'Description / brief (optionnel)', en: 'Description / brief (optional)', es: 'Descripcion / brief (opcional)' })}
                </label>
                <textarea
                  value={descriptionOverride}
                  onChange={(e) => setDescriptionOverride(e.target.value)}
                  placeholder={tx({
                    fr: 'Histoire du projet, contraintes creatives, resultat... (markdown supporte)',
                    en: 'Project story, creative constraints, outcome... (markdown supported)',
                    es: 'Historia del proyecto, brief, resultado... (markdown)',
                  })}
                  rows={3}
                  className="input-field text-sm resize-none"
                  maxLength={3000}
                  disabled={submitting}
                />
                <p className="text-[10px] text-grey-muted mt-1">
                  {tx({
                    fr: 'Vide = brouillon markdown auto-genere depuis la commande.',
                    en: 'Leave empty for auto-generated draft.',
                    es: 'Vacio = borrador auto-generado.',
                  })}
                </p>
              </div>
            </div>

            {/* Dropzone */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-grey-muted font-semibold mb-1.5">
                {tx({ fr: 'Photos du projet livre', en: 'Photos of the delivered project', es: 'Fotos del proyecto entregado' })}
              </label>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => inputRef.current?.click()}
                className={`rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
                  dragOver ? 'border-accent bg-accent/5' : 'border-white/15 hover:border-accent/40 hover:bg-white/5'
                }`}
                role="button"
                tabIndex={0}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPTED_TYPES}
                  multiple
                  onChange={(e) => addFiles(e.target.files)}
                  className="hidden"
                  disabled={submitting}
                />
                <Upload size={28} className="mx-auto text-accent mb-2" />
                <p className="text-sm font-semibold text-heading">
                  {tx({
                    fr: 'Glisse tes photos ici ou clique pour parcourir',
                    en: 'Drop photos here or click to browse',
                    es: 'Arrastra tus fotos o haz clic para explorar',
                  })}
                </p>
                <p className="text-[11px] text-grey-muted mt-1">
                  {tx({
                    fr: `JPEG, PNG, WebP, HEIC, AVIF · jusqu'a ${MAX_FILE_MB} Mo / image`,
                    en: `JPEG, PNG, WebP, HEIC, AVIF · up to ${MAX_FILE_MB} MB per image`,
                    es: `JPEG, PNG, WebP, HEIC, AVIF · hasta ${MAX_FILE_MB} MB`,
                  })}
                </p>
              </div>

              {/* Previews grid */}
              {files.length > 0 && (
                <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {files.map((f, i) => (
                    <div
                      key={i}
                      className={`relative aspect-square rounded-lg overflow-hidden border ${
                        f.error ? 'border-red-500/50' : 'border-white/10'
                      }`}
                    >
                      {f.previewUrl ? (
                        <img src={f.previewUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-red-500/10 flex items-center justify-center">
                          <ImageIcon size={20} className="text-red-400" />
                        </div>
                      )}
                      {f.error && (
                        <div className="absolute inset-x-0 bottom-0 bg-red-500/85 text-white text-[10px] px-1.5 py-1 leading-tight">
                          {f.error}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                        disabled={submitting}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/65 hover:bg-red-500/90 text-white flex items-center justify-center transition-colors disabled:opacity-40"
                        aria-label="Retirer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-grey-muted mt-2">
                {validFilesCount > 0 ? (
                  <span className="text-green-400 inline-flex items-center gap-1">
                    <Check size={12} />
                    {tx({
                      fr: `${validFilesCount} image(s) prete(s) a televerser`,
                      en: `${validFilesCount} image(s) ready to upload`,
                      es: `${validFilesCount} imagen(es) listas`,
                    })}
                  </span>
                ) : (
                  tx({
                    fr: 'Tu peux generer le brouillon meme sans image - ajoute-les dans Strapi plus tard.',
                    en: 'You can generate the draft without images - add them in Strapi later.',
                    es: 'Puedes generar sin imagenes - agregalas luego en Strapi.',
                  })
                )}
              </p>
            </div>

            {/* Erreur globale */}
            {submitError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2.5 text-[13px] text-red-400"
              >
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{submitError}</span>
              </motion.div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 px-6 py-4 border-t" style={{ borderColor: 'var(--bg-input-border)' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg font-semibold text-sm transition-colors hover:brightness-110 disabled:opacity-40"
              style={{ background: 'var(--bg-glass)', color: 'var(--color-grey-muted)' }}
            >
              {tx({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' })}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg font-bold text-sm bg-accent text-white hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(var(--accent-rgb,255,82,160),0.35)]"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {tx({ fr: 'Generation...', en: 'Generating...', es: 'Generando...' })}
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  {tx({ fr: 'Generer le brouillon de projet', en: 'Generate project draft', es: 'Generar borrador' })}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default PortfolioWizardModal;
