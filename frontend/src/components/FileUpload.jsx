import { useState, useRef } from 'react';
import { Upload, X, FileText, Loader2, Plus } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { uploadFile } from '../services/api';

const MAX_SIZE = 130 * 1024 * 1024; // 130 MB
const UPLOAD_MAX = 50 * 1024 * 1024; // 50 MB - limite Supabase
const COMPRESS_QUALITY = 0.92; // JPEG quality for auto-compression

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

// Compresse les images trop grosses (TIFF, PNG haute-res) en JPEG cote client
const COMPRESSIBLE = ['image/tiff', 'image/png', 'image/bmp', 'image/webp'];

function compressImage(file, maxBytes = UPLOAD_MAX) {
  return new Promise((resolve) => {
    // Si le fichier est petit ou non-compressible, on le garde tel quel
    if (file.size <= maxBytes || !COMPRESSIBLE.includes(file.type)) {
      return resolve(file);
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      // Garder la resolution originale (max 8000px pour eviter crash navigateur)
      const maxDim = 8000;
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
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size > maxBytes) {
            // 2eme passe avec qualite reduite
            canvas.toBlob(
              (blob2) => {
                if (!blob2) return resolve(file);
                const name = file.name.replace(/\.[^.]+$/, '.jpg');
                resolve(new File([blob2], name, { type: 'image/jpeg' }));
              },
              'image/jpeg',
              0.80
            );
            return;
          }
          const name = file.name.replace(/\.[^.]+$/, '.jpg');
          resolve(new File([blob], name, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        COMPRESS_QUALITY
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // fallback: upload tel quel
    };
    img.src = url;
  });
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileUpload({ files = [], onFilesChange, label, maxFiles = 5, compact = false, uploadFn }) {
  const { tx } = useLang();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = async (fileList) => {
    setError('');
    const toUpload = Array.from(fileList);

    if (files.length + toUpload.length > maxFiles) {
      setError(tx({ fr: `Maximum ${maxFiles} fichiers`, en: `Maximum ${maxFiles} files`, es: `Maximo ${maxFiles} archivos` }));
      return;
    }

    for (const file of toUpload) {
      if (file.size > MAX_SIZE) {
        setError(tx({ fr: `${file.name} depasse 130 MB`, en: `${file.name} exceeds 130 MB`, es: `${file.name} excede 130 MB` }));
        return;
      }
    }

    setUploading(true);
    try {
      const uploaded = [];
      for (const file of toUpload) {
        // Compression auto des gros fichiers image (TIFF, PNG > 50 Mo)
        if (file.size > UPLOAD_MAX && COMPRESSIBLE.includes(file.type)) {
          setCompressing(true);
        }
        const processedFile = await compressImage(file);
        setCompressing(false);
        const doUpload = uploadFn || uploadFile;
        const result = await doUpload(processedFile);
        uploaded.push({
          id: result.id,
          name: result.name || processedFile.name,
          url: result.url,
          size: result.size || processedFile.size,
          mime: result.mime || processedFile.type,
        });
      }
      onFilesChange([...files, ...uploaded]);
    } catch (err) {
      const msg = err?.message || '';
      if (msg.includes('Payload too large') || msg.includes('413') || msg.includes('exceeded')) {
        setError(tx({
          fr: `Fichier trop volumineux pour le serveur (max 50 Mo). Essayez un format JPEG.`,
          en: `File too large for server (max 50 MB). Try JPEG format.`,
          es: `Archivo demasiado grande para el servidor (max 50 MB). Prueba formato JPEG.`
        }));
      } else {
        setError(tx({ fr: 'Erreur lors de l\'upload. Reessayez.', en: 'Upload failed. Please try again.', es: 'Error al subir. Intentalo de nuevo.' }));
      }
    } finally {
      setUploading(false);
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

  const isImage = (mime) => mime && mime.startsWith('image/');
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
        ) : (
          /* Has files: show previews */
          <div className="space-y-2">
            {files.map((file, i) => (
              <div key={file.id || i} className="relative group">
                {isImage(file.mime) && file.url ? (
                  <div className="rounded-lg overflow-hidden bg-glass">
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-24 object-cover"
                    />
                    <div className="px-2 py-1 flex items-center gap-1">
                      <span className="text-heading text-[10px] truncate flex-1">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemove(i)}
                        className="p-0.5 text-grey-muted hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-glass">
                    <FileText size={14} className="text-accent flex-shrink-0" />
                    <span className="text-heading text-[10px] truncate flex-1">{file.name}</span>
                    {file.size && (
                      <span className="text-grey-muted text-[9px] flex-shrink-0">{formatSize(file.size * 1000)}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemove(i)}
                      className="p-0.5 text-grey-muted hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))}
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
            <span className="text-grey-muted text-xs">{compressing ? tx({ fr: 'Compression en cours...', en: 'Compressing...', es: 'Comprimiendo...' }) : tx({ fr: 'Upload...', en: 'Uploading...', es: 'Subiendo...' })}</span>
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
        const imageFiles = files.map((f, i) => ({ ...f, _idx: i })).filter(f => isImage(f.mime) && f.url);
        const otherFiles = files.map((f, i) => ({ ...f, _idx: i })).filter(f => !isImage(f.mime) || !f.url);
        return (
          <div className="mt-3 space-y-3">
            {/* Image grid */}
            {imageFiles.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {imageFiles.map((file) => (
                  <div key={file.id || file._idx} className="relative group aspect-square rounded-lg overflow-hidden bg-glass">
                    <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemove(file._idx); }}
                        className="p-1.5 rounded-full bg-red-500/80 text-white hover:bg-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] px-1 py-0.5 truncate">{file.name}</span>
                  </div>
                ))}
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
