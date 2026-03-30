import { useState, useRef } from 'react';
import { Upload, X, FileText, Loader2, Plus } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
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

function FileUpload({ files = [], onFilesChange, label, maxFiles = 5, compact = false, uploadFn, hidePreview = false }) {
  const { tx } = useLang();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
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
        setError(tx({ fr: `${file.name} depasse 500 MB`, en: `${file.name} exceeds 500 MB`, es: `${file.name} excede 500 MB` }));
        return;
      }
    }

    setUploading(true);
    try {
      const uploaded = [];
      for (const file of toUpload) {
        const wasCompressed = file.size > SUPABASE_MAX && COMPRESSIBLE.includes(file.type);
        // Compresser pour Supabase si nécessaire (les originaux iront sur Google Drive via le backend)
        if (wasCompressed) {
          setUploadStatus(tx({ fr: 'Compression...', en: 'Compressing...', es: 'Comprimiendo...' }));
        }
        let fileForUpload = await compressForSupabase(file);

        // If file is still too big for Supabase after compression, upload via backend direct to Google Drive
        if (fileForUpload.size > SUPABASE_MAX) {
          setUploadStatus(tx({ fr: 'Upload vers le serveur securise...', en: 'Uploading to secure server...', es: 'Subiendo al servidor seguro...' }));
          const formData = new FormData();
          formData.append('file', fileForUpload);
          // Get artistSlug from the page context if available
          const artistSlug = window.__artistSlug || 'unknown';
          formData.append('artistSlug', artistSlug);
          const { data: result } = await api.post('/artist-edit-requests/upload-direct', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 600000, // 10 min timeout for large files
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
            wasCompressed: false,
            driveUrl: result.file?.driveUrl || '',
          });
          continue;
        }

        setUploadStatus(tx({ fr: 'Upload en cours...', en: 'Uploading...', es: 'Subiendo...' }));
        const doUpload = uploadFn || uploadFile;
        const result = await doUpload(fileForUpload);
        uploaded.push({
          id: result.id,
          name: result.name || file.name,
          url: result.url,
          size: result.size || fileForSupabase.size,
          mime: result.mime || fileForSupabase.type,
          originalName: file.name,
          originalSize: file.size,
          originalMime: file.type,
          wasCompressed,
        });
      }
      setUploadStatus('');
      onFilesChange([...files, ...uploaded]);
    } catch (err) {
      setError(tx({ fr: 'Erreur lors de l\'upload. Reessayez.', en: 'Upload failed. Please try again.', es: 'Error al subir. Intentalo de nuevo.' }));
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
          /* Has files: show previews or just names */
          <div className="space-y-2">
            {files.map((file, i) => (
              <div key={file.id || i} className="relative group">
                {isImage(file.mime) && file.url && !hidePreview ? (
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
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleRemove(file._idx); }}
                      className="absolute top-1 right-1 p-1 rounded-full bg-red-500/90 text-white hover:bg-red-500 transition-colors z-10"
                    >
                      <X size={12} />
                    </button>
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
