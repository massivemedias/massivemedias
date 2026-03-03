import { useState, useRef } from 'react';
import { Upload, X, FileText, Loader2, Plus } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { uploadFile } from '../services/api';

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

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

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileUpload({ files = [], onFilesChange, label, maxFiles = 5, compact = false }) {
  const { tx } = useLang();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
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
        setError(tx({ fr: `${file.name} depasse 50 MB`, en: `${file.name} exceeds 50 MB`, es: `${file.name} excede 50 MB` }));
        return;
      }
    }

    setUploading(true);
    try {
      const uploaded = [];
      for (const file of toUpload) {
        const result = await uploadFile(file);
        uploaded.push({
          id: result.id,
          name: result.name,
          url: result.url,
          size: result.size,
          mime: result.mime,
        });
      }
      onFilesChange([...files, ...uploaded]);
    } catch (err) {
      setError(tx({ fr: 'Erreur lors de l\'upload. Reessayez.', en: 'Upload failed. Please try again.', es: 'Error al subir. Intentalo de nuevo.' }));
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
            className={`border-2 border-dashed rounded-xl text-center cursor-pointer transition-all p-3 min-h-[100px] flex flex-col items-center justify-center ${
              dragOver ? 'border-accent bg-accent/5' : 'border-grey-muted/30 hover:border-grey-muted/50'
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
        className={`relative border-2 border-dashed rounded-xl text-center cursor-pointer transition-all p-5 ${
          dragOver ? 'border-accent bg-accent/5' : 'border-grey-muted/30 hover:border-grey-muted/50'
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
            <span className="text-grey-muted text-xs">{tx({ fr: 'Upload...', en: 'Uploading...', es: 'Subiendo...' })}</span>
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
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, i) => (
            <div
              key={file.id || i}
              className="flex items-center gap-3 p-2 rounded-lg text-sm bg-glass"
            >
              {isImage(file.mime) && file.url ? (
                <img src={file.url} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
              ) : (
                <FileText size={16} className="text-accent flex-shrink-0" />
              )}
              <span className="text-heading truncate flex-1 text-xs">{file.name}</span>
              {file.size && (
                <span className="text-grey-muted text-xs flex-shrink-0">{formatSize(file.size * 1000)}</span>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleRemove(i); }}
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
}

export default FileUpload;
