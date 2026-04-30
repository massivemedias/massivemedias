import { useState, useRef } from 'react';
import { Upload, X, FileText, Loader2, Plus } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import api, { uploadFile } from '../services/api';

const MAX_SIZE = 500 * 1024 * 1024; // 500 MB - les originaux vont sur Google Drive
const SUPABASE_MAX = 50 * 1024 * 1024; // 50 MB - limite Supabase free tier, gros fichiers passent par backend
const BROWSER_COMPRESSIBLE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/bmp']; // TIFF NOT supported by browsers
const COMPRESSIBLE = ['image/tiff', 'image/png', 'image/bmp', 'image/webp', 'image/jpeg'];

const ACCEPTED_TYPES = [
  'image/png', 'image/jpeg', 'image/tiff', 'image/svg+xml', 'image/webp',
  'application/pdf',
  'application/postscript',           // AI, EPS
  'image/vnd.adobe.photoshop',        // PSD
  'application/illustrator',
  'application/eps',
  'application/x-eps',
];

const ACCEPTED_EXT = '.png,.jpg,.jpeg,.tiff,.tif,.svg,.webp,.pdf,.ai,.eps,.psd';

// Compresse une image pour Supabase (< 50 Mo)
// L'original est conserve pour envoi direct a Google Drive via le backend
function compressForSupabase(file) {
  return new Promise((resolve) => {
    // Only compress types the browser can handle, and only if over limit
    if (!BROWSER_COMPRESSIBLE_TYPES.includes(file.type) || file.size <= SUPABASE_MAX) {
      return resolve(file);
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const maxDim = 6000;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      // Premiere passe: JPEG 92%
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size > SUPABASE_MAX) {
            // 2eme passe: JPEG 75%
            canvas.toBlob(
              (blob2) => {
                if (!blob2) return resolve(file);
                const name = file.name.replace(/\.[^.]+$/, '.jpg');
                resolve(new File([blob2], name, { type: 'image/jpeg' }));
              },
              'image/jpeg',
              0.75
            );
            return;
          }
          const name = file.name.replace(/\.[^.]+$/, '.jpg');
          resolve(new File([blob], name, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        0.92
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      // TIFF and other formats not supported by browser canvas - upload as-is
      resolve(file);
    };
    img.src = url;
  });
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Props pour classer les uploads Google Drive dans un sous-dossier dedie:
 *   - orderId: si on upload pour une commande existante (prioritaire)
 *   - contextLabel: override explicite du dossier (ex: 'psyqu33n' pour les edits artiste)
 * Sinon, FileUpload deduit automatiquement le dossier via useAuth() (email) et useCart() (cartId):
 *   - Logge: "{email} - cart-{cartId}"
 *   - Anonyme: "Guest_Cart_{cartId}"
 */
function FileUpload({ files = [], onFilesChange, label, maxFiles = 5, compact = false, uploadFn, hidePreview = false, orderId, contextLabel, defaultPreviewImage = null }) {
  const { tx } = useLang();
  const { user } = useAuth();
  const { cartId } = useCart();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  // Tracks which file IDs have failed to load their preview image.
  // When a preview fails, we fall back to the file-icon view.
  const [brokenPreviews, setBrokenPreviews] = useState(new Set());
  const markBroken = (id) => setBrokenPreviews(prev => {
    const next = new Set(prev);
    next.add(id);
    return next;
  });

  const handleFiles = async (fileList) => {
    setError('');
    const toUpload = Array.from(fileList);

    if (files.length + toUpload.length > maxFiles) {
      setError(tx({ fr: `Maximum ${maxFiles} fichiers`, en: `Maximum ${maxFiles} files`, es: `Maximo ${maxFiles} archivos` }));
      return;
    }

    for (const file of toUpload) {
      if (file.size > MAX_SIZE) {
        setError(tx({ fr: `${file.name} depasse 500 MB`, en: `${file.name} exceeds 500 MB`, es: `${file.name} excede 500 MB` }));
        return;
      }
    }

    setUploading(true);
    try {
      const uploaded = [];
      // Contexte pour classement Google Drive - le backend utilise ces champs pour
      // determiner le sous-dossier exact. Priorite:
      //   1. contextLabel prop (explicite, ex: admin artist-edit)
      //   2. window.__artistSlug legacy (panneau d'edition artist)
      //   3. orderId prop (upload dans le contexte d'une commande existante)
      //   4. email + cartId (logge client standard)
      //   5. cartId seul (guest, non logge)
      const clientEmail = user?.email || '';
      const explicitFolder = contextLabel || window.__artistSlug || '';

      for (const file of toUpload) {
        setUploadStatus(tx({
          fr: `Upload de ${file.name}... (peut prendre 30s si serveur en veille)`,
          en: `Uploading ${file.name}... (may take 30s if server is waking up)`,
          es: `Subiendo ${file.name}... (puede tardar 30s si el servidor esta despertando)`,
        }));
        const formData = new FormData();
        formData.append('file', file);
        // Priorite 1-2: override explicite (garde compat avec l'edition artiste)
        if (explicitFolder) {
          formData.append('artistSlug', explicitFolder);
        }
        // Priorite 3-5: nouveaux champs pour classement automatique
        if (orderId) formData.append('orderId', String(orderId));
        if (clientEmail) formData.append('clientEmail', clientEmail);
        if (cartId) formData.append('cartId', cartId);

        const { data: result } = await api.post('/artist-edit-requests/upload-direct', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 600000,
        });
        uploaded.push({
          id: result.file?.driveFileId || Date.now().toString(),
          name: result.file?.name || file.name,
          url: result.file?.url || result.file?.driveUrl || '',
          size: file.size,
          mime: file.type,
          originalName: file.name,
          originalSize: file.size,
          originalMime: file.type,
          driveUrl: result.file?.driveUrl || '',
        });
      }
      setUploadStatus('');
      onFilesChange([...files, ...uploaded]);
    } catch (err) {
      // Log technique pour debug + message clair pour l'utilisateur
      console.error('FileUpload error:', err);
      const serverMsg = err?.response?.data?.error?.message || err?.response?.data?.message || err?.message || '';
      const status = err?.response?.status;
      let friendly;
      if (err?.code === 'ECONNABORTED' || /timeout/i.test(err?.message || '')) {
        friendly = tx({
          fr: "Temps d'attente depassé. Le serveur se reveillait peut-etre - reessayez dans 10 secondes.",
          en: 'Request timed out. Server may have been waking up - please try again in 10 seconds.',
          es: 'Tiempo de espera agotado. Reintenta en 10 segundos.',
        });
      } else if (status === 413) {
        friendly = tx({ fr: 'Fichier trop volumineux pour le serveur.', en: 'File too large for the server.', es: 'Archivo demasiado grande para el servidor.' });
      } else if (status >= 500 || !status) {
        friendly = tx({
          fr: `Serveur injoignable. Contactez-nous directement: massivemedias@gmail.com ou WhatsApp +1 514 653 1423. ${serverMsg ? '(' + serverMsg + ')' : ''}`,
          en: `Server unreachable. Contact us directly: massivemedias@gmail.com or WhatsApp +1 514 653 1423.`,
          es: `Servidor inaccesible. Contactanos: massivemedias@gmail.com o WhatsApp +1 514 653 1423.`,
        });
      } else {
        friendly = tx({
          fr: `Erreur upload (${status || '?'}): ${serverMsg || 'Réessayez ou envoyez-nous votre fichier par courriel.'}`,
          en: `Upload error (${status || '?'}): ${serverMsg || 'Retry or send us your file by email.'}`,
          es: `Error de carga (${status || '?'}): ${serverMsg || 'Reintenta o envianos el archivo por correo.'}`,
        });
      }
      setError(friendly);
    } finally {
      setUploading(false);
      setUploadStatus('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemove = (index) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const NON_WEB_IMAGES = ['image/tiff', 'image/x-tiff', 'image/bmp', 'image/x-adobe-dng', 'image/vnd.adobe.photoshop'];
  const isImage = (mime) => mime && mime.startsWith('image/') && !NON_WEB_IMAGES.includes(mime);
  const canAddMore = files.length < maxFiles;

  // -- Compact mode: preview replaces drop zone --
  if (compact) {
    return (
      <div>
        {label && (
          <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
            {label}
          </label>
        )}

        {files.length === 0 ? (
          defaultPreviewImage ? (
            /* MOCKUP-DEFAULT (29 avril 2026) : aperçu par défaut quand le
                client n'a pas encore uploadé son fichier - le mockup
                Massive sert d'exemple visuel de ce qu'un print rendu
                peut donner. La zone reste 100% clickable + drag&drop. */
            <div
              className={`relative rounded-xl cursor-pointer transition-all overflow-hidden shadow-lg group ${
                dragOver ? 'ring-2 ring-accent' : 'hover:opacity-95'
              }`}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_EXT}
                multiple
                className="hidden"
                onChange={(e) => { if (e.target.files.length > 0) handleFiles(e.target.files); e.target.value = ''; }}
              />
              <img
                src={defaultPreviewImage}
                alt=""
                className="w-full h-auto object-contain block"
                loading="lazy"
              />
              <div className="absolute inset-x-0 bottom-0 px-3 py-2 bg-black/65 backdrop-blur-sm flex items-center justify-center gap-2">
                {uploading ? (
                  <Loader2 size={14} className="text-white animate-spin" />
                ) : (
                  <>
                    <Upload size={14} className="text-white" />
                    <span className="text-white text-xs font-semibold leading-tight">
                      {tx({ fr: 'Glissez ou cliquez pour téléverser votre fichier', en: 'Drop or click to upload your file', es: 'Arrastra o haz clic para subir tu archivo' })}
                    </span>
                  </>
                )}
              </div>
            </div>
          ) : (
          /* Empty: small drop zone */
          <div
            className={`rounded-xl text-center cursor-pointer transition-all p-3 min-h-[100px] flex flex-col items-center justify-center shadow-lg ${
              dragOver ? 'bg-accent/10 ring-2 ring-accent' : 'bg-black/20 hover:bg-black/25'
            }`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_EXT}
              multiple
              className="hidden"
              onChange={(e) => { if (e.target.files.length > 0) handleFiles(e.target.files); e.target.value = ''; }}
            />
            {uploading ? (
              <Loader2 size={20} className="text-accent animate-spin" />
            ) : (
              <>
                <Upload size={18} className="text-grey-muted mb-1" />
                <span className="text-grey-muted text-[11px] leading-tight">
                  {tx({ fr: 'Glissez ou cliquez', en: 'Drop or click', es: 'Arrastra o haz clic' })}
                </span>
                <span className="text-grey-muted/50 text-[9px] mt-0.5">PNG, JPG, PDF, AI</span>
              </>
            )}
          </div>
          )
        ) : (
          /* Has files: show previews or just names */
          <div className="space-y-2">
            {files.map((file, i) => {
              const fileKey = file.id || `${file.name}-${i}`;
              const showPreview = (isImage(file.mime) || (file.url && file.url.includes('.webp')))
                && file.url
                && !hidePreview
                && !brokenPreviews.has(fileKey);
              return (
              <div key={fileKey} className="relative group">
                {showPreview ? (
                  <div className="rounded-lg overflow-hidden bg-[#2a0050] border border-white/5">
                    <img
                      src={file.url}
                      alt=""
                      aria-label={file.name}
                      className="w-full h-24 object-contain"
                      loading="lazy"
                      onError={() => markBroken(fileKey)}
                    />
                    <div className="px-2 py-1 flex items-center gap-1 bg-black/30">
                      <FileText size={10} className="text-accent flex-shrink-0" />
                      <span className="text-heading text-[10px] truncate flex-1" title={file.name}>{file.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemove(i)}
                        aria-label={tx({ fr: 'Retirer', en: 'Remove', es: 'Quitar' })}
                        className="p-0.5 text-grey-muted hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-glass">
                    <FileText size={14} className="text-accent flex-shrink-0" />
                    <span className="text-heading text-[11px] truncate flex-1" title={file.name}>{file.name}</span>
                    {file.size && (
                      <span className="text-grey-muted text-[9px] flex-shrink-0">{formatSize(file.size)}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemove(i)}
                      aria-label={tx({ fr: 'Retirer', en: 'Remove', es: 'Quitar' })}
                      className="p-0.5 text-grey-muted hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
              );
            })}
            {canAddMore && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg border border-dashed border-grey-muted/30 text-grey-muted text-[10px] hover:border-accent hover:text-accent transition-colors"
              >
                <Plus size={12} />
                {tx({ fr: 'Ajouter', en: 'Add more', es: 'Agregar' })}
              </button>
            )}
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_EXT}
              multiple
              className="hidden"
              onChange={(e) => { if (e.target.files.length > 0) handleFiles(e.target.files); e.target.value = ''; }}
            />
          </div>
        )}

        {uploading && files.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <Loader2 size={14} className="text-accent animate-spin" />
            <span className="text-grey-muted text-[10px]">{tx({ fr: 'Upload...', en: 'Uploading...', es: 'Subiendo...' })}</span>
          </div>
        )}

        {error && <p className="text-red-400 text-[10px] mt-1">{error}</p>}
      </div>
    );
  }

  // -- Normal mode (full size) --
  return (
    <div className="mb-5">
      {label && (
        <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
          {label}
        </label>
      )}

      {/* Drop zone */}
      <div
        className={`relative rounded-xl text-center cursor-pointer transition-all p-5 shadow-lg ${
          dragOver ? 'bg-accent/10 ring-2 ring-accent' : 'bg-black/20 hover:bg-black/25'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXT}
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files.length > 0) handleFiles(e.target.files); e.target.value = ''; }}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <Loader2 size={24} className="text-accent animate-spin" />
            <span className="text-grey-muted text-xs">{uploadStatus || tx({ fr: 'Upload en cours...', en: 'Uploading...', es: 'Subiendo...' })}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <Upload size={24} className="text-grey-muted" />
            <span className="text-grey-muted text-sm">
              {tx({ fr: 'Glissez vos fichiers ici ou cliquez pour parcourir', en: 'Drag files here or click to browse', es: 'Arrastra archivos aqui o haz clic para explorar' })}
            </span>
            <span className="text-grey-muted/60 text-[10px]">PNG, JPG, TIFF, SVG, PDF, AI</span>
          </div>
        )}
      </div>

      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

      {/* File list with image previews */}
      {files.length > 0 && (() => {
        const imageFiles = files.map((f, i) => ({ ...f, _idx: i })).filter(f => isImage(f.mime) && f.url && !brokenPreviews.has(f.id || `${f.name}-${i}`));
        const otherFiles = files.map((f, i) => ({ ...f, _idx: i })).filter(f => !isImage(f.mime) || !f.url || brokenPreviews.has(f.id || `${f.name}-${i}`));
        return (
          <div className="mt-3 space-y-3">
            {/* Image grid */}
            {imageFiles.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {imageFiles.map((file) => {
                  const fileKey = file.id || `${file.name}-${file._idx}`;
                  return (
                  <div key={fileKey} className="relative group aspect-square rounded-lg overflow-hidden bg-[#2a0050] border border-white/5">
                    <img
                      src={file.url}
                      alt=""
                      aria-label={file.name}
                      className="w-full h-full object-contain"
                      loading="lazy"
                      onError={() => markBroken(fileKey)}
                    />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleRemove(file._idx); }}
                      aria-label={tx({ fr: 'Retirer', en: 'Remove', es: 'Quitar' })}
                      className="absolute top-1 right-1 p-1 rounded-full bg-red-500/90 text-white hover:bg-red-500 transition-colors z-10"
                    >
                      <X size={12} />
                    </button>
                    <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[9px] px-1 py-0.5 truncate" title={file.name}>{file.name}</span>
                  </div>
                  );
                })}
              </div>
            )}
            {/* Non-image files list */}
            {otherFiles.length > 0 && (
              <div className="space-y-2">
                {otherFiles.map((file) => (
                  <div
                    key={file.id || file._idx}
                    className="flex items-center gap-3 p-2 rounded-lg text-sm bg-glass"
                  >
                    <FileText size={16} className="text-accent flex-shrink-0" />
                    <span className="text-heading truncate flex-1 text-xs">{file.name}</span>
                    {file.size && (
                      <span className="text-grey-muted text-xs flex-shrink-0">{formatSize(file.size * 1000)}</span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleRemove(file._idx); }}
                      className="p-1 text-grey-muted hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

export default FileUpload;
