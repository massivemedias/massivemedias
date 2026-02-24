import { useState, useRef } from 'react';
import { Upload, X, FileImage, FileText, Loader2 } from 'lucide-react';
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

function FileUpload({ files = [], onFilesChange, label, maxFiles = 5 }) {
  const { lang } = useLang();
  const isFr = lang === 'fr';
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = async (fileList) => {
    setError('');
    const toUpload = Array.from(fileList);

    if (files.length + toUpload.length > maxFiles) {
      setError(isFr ? `Maximum ${maxFiles} fichiers` : `Maximum ${maxFiles} files`);
      return;
    }

    for (const file of toUpload) {
      if (file.size > MAX_SIZE) {
        setError(isFr ? `${file.name} dépasse 50 MB` : `${file.name} exceeds 50 MB`);
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
      setError(isFr ? 'Erreur lors de l\'upload. Réessayez.' : 'Upload failed. Please try again.');
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

  return (
    <div className="mb-5">
      {label && (
        <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2.5">
          {label}
        </label>
      )}

      {/* Drop zone */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
          dragOver ? 'border-magenta bg-magenta/5' : 'border-grey-muted/30 hover:border-grey-muted/50'
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
            <Loader2 size={24} className="text-magenta animate-spin" />
            <span className="text-grey-muted text-sm">
              {isFr ? 'Upload en cours...' : 'Uploading...'}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <Upload size={24} className="text-grey-muted" />
            <span className="text-grey-muted text-sm">
              {isFr
                ? 'Glissez vos fichiers ici ou cliquez pour parcourir'
                : 'Drag files here or click to browse'}
            </span>
            <span className="text-grey-muted/60 text-xs">
              PNG, JPG, TIFF, SVG, PDF, AI, EPS, PSD - max 50 MB
            </span>
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-400 text-xs mt-2">{error}</p>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, i) => (
            <div
              key={file.id || i}
              className="flex items-center gap-3 p-2.5 rounded-lg text-sm bg-glass"
            >
              {isImage(file.mime) ? (
                <FileImage size={16} className="text-magenta flex-shrink-0" />
              ) : (
                <FileText size={16} className="text-magenta flex-shrink-0" />
              )}
              <span className="text-heading truncate flex-1">{file.name}</span>
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
