import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ImagePlus, Trash2, Loader2, Check, X, Clock, Send, AlertCircle,
  ChevronDown, ChevronUp, Eye, Pencil, Gem, DollarSign,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useUserRole } from '../contexts/UserRoleContext';
import { createEditRequest, getMyEditRequests } from '../services/artistService';
import { uploadArtistFile } from '../services/api';
import FileUpload from './FileUpload';
import artistsData from '../data/artists';
import { useArtists } from '../hooks/useArtists';
import { thumb, img } from '../utils/paths';
import { mediaUrl } from '../utils/cms';

const CATEGORIES = [
  { id: 'prints', labelFr: 'Prints', labelEn: 'Prints', labelEs: 'Prints', requestAdd: 'add-prints', requestRemove: 'remove-prints' },
  { id: 'stickers', labelFr: 'Stickers', labelEn: 'Stickers', labelEs: 'Stickers', requestAdd: 'add-stickers', requestRemove: 'remove-stickers' },
  { id: 'merch', labelFr: 'Merch', labelEn: 'Merch', labelEs: 'Merch', requestAdd: 'add-merch', requestRemove: 'remove-merch' },
];

const STATUS_BADGE = {
  pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', labelFr: 'En attente', labelEn: 'Pending', labelEs: 'Pendiente' },
  approved: { bg: 'bg-green-500/20', text: 'text-green-400', labelFr: 'Approuve', labelEn: 'Approved', labelEs: 'Aprobado' },
  rejected: { bg: 'bg-red-500/20', text: 'text-red-400', labelFr: 'Refuse', labelEn: 'Rejected', labelEs: 'Rechazado' },
};

function ArtistGalleryManager() {
  const { tx, lang } = useLang();
  const { user } = useAuth();
  const { artistSlug } = useUserRole();
  const { artists: cmsArtists } = useArtists();

  // State
  const [editRequests, setEditRequests] = useState([]);
  const [reqLoading, setReqLoading] = useState(true);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadCategory, setUploadCategory] = useState('prints');
  const [uploadTitles, setUploadTitles] = useState({});
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [uniqueFormId, setUniqueFormId] = useState(null);
  const [uniquePrice, setUniquePrice] = useState('');
  const [uniqueSending, setUniqueSending] = useState(false);

  const email = user?.email || '';
  const localArtist = artistsData[artistSlug] || null;

  // CMS artist data (priority)
  const cmsArtist = useMemo(() => {
    if (!cmsArtists || !artistSlug) return null;
    return cmsArtists.find(a => a.slug === artistSlug) || null;
  }, [cmsArtists, artistSlug]);

  // Merge prints/stickers from CMS + local data (CMS prioritaire si non-vide)
  const artistPrints = useMemo(() => {
    if (cmsArtist?.prints && Array.isArray(cmsArtist.prints) && cmsArtist.prints.length > 0) return cmsArtist.prints;
    return localArtist?.prints || [];
  }, [cmsArtist, localArtist]);

  const artistStickers = useMemo(() => {
    if (cmsArtist?.stickers && Array.isArray(cmsArtist.stickers) && cmsArtist.stickers.length > 0) return cmsArtist.stickers;
    return localArtist?.stickers || [];
  }, [cmsArtist, localArtist]);

  const artistMerch = useMemo(() => {
    if (cmsArtist?.merch && Array.isArray(cmsArtist.merch) && cmsArtist.merch.length > 0) return cmsArtist.merch;
    return localArtist?.merch || [];
  }, [cmsArtist, localArtist]);

  const artistName = cmsArtist?.name || localArtist?.name || artistSlug || '';

  // Charger les edit requests
  useEffect(() => {
    if (!email) return;
    let cancelled = false;
    async function fetch() {
      try {
        const res = await getMyEditRequests(email);
        if (!cancelled) setEditRequests(res.data?.data || []);
      } catch (err) {
        console.warn('Failed to fetch edit requests:', err.message);
      } finally {
        if (!cancelled) setReqLoading(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, [email]);

  // Pending removal IDs
  const pendingRemovalIds = useMemo(() => {
    return editRequests
      .filter(r => r.status === 'pending' && r.requestType?.startsWith('remove-'))
      .flatMap(r => r.changeData?.itemIds || []);
  }, [editRequests]);

  // Pending additions
  const pendingAdditions = useMemo(() => {
    return editRequests
      .filter(r => r.status === 'pending' && r.requestType?.startsWith('add-'))
      .map(r => ({ ...r, images: r.changeData?.images || [] }));
  }, [editRequests]);

  // Resolve image URL
  // Les images locales (artists.js) sont deja resolues via thumb()/img() a l'import
  // Les images CMS commencent par http
  // On detecte si c'est deja resolu en verifiant le prefix BASE_URL ou http
  const resolveThumb = (item) => {
    if (!item?.image) return '';
    // Deja une URL absolue ou deja resolue avec le base path
    if (item.image.startsWith('http') || item.image.startsWith('/')) return item.image;
    return thumb(item.image);
  };

  const resolveFull = (item) => {
    if (!item) return '';
    const src = item.fullImage || item.image;
    if (!src) return '';
    if (src.startsWith('http') || src.startsWith('/')) return src;
    return img(src);
  };

  // Supprimer une image
  const handleRemove = async (itemId, category) => {
    if (pendingRemovalIds.includes(itemId)) return;

    const cat = CATEGORIES.find(c => c.id === category);
    if (!cat) return;

    try {
      const res = await createEditRequest({
        artistSlug,
        artistName,
        email,
        requestType: cat.requestRemove,
        changeData: { itemIds: [itemId] },
      });
      const newReq = res.data?.data;
      if (newReq) {
        setEditRequests(prev => [newReq, ...prev]);
      }
    } catch (err) {
      setError(tx({ fr: 'Erreur lors de la demande de suppression.', en: 'Error requesting removal.', es: 'Error al solicitar la eliminacion.' }));
    }
  };

  // Renommer un item
  const handleRename = async (itemId, category) => {
    if (!renameValue.trim()) { setRenamingId(null); return; }
    try {
      await createEditRequest({
        artistSlug, artistName, email,
        requestType: 'rename-item',
        changeData: { itemId, newTitle: renameValue.trim(), field: category },
      });
      setRenamingId(null);
      setRenameValue('');
    } catch {
      setError(tx({ fr: 'Erreur lors du renommage.', en: 'Error renaming.', es: 'Error al renombrar.' }));
    }
  };

  // Marquer comme piece unique
  const handleMarkUnique = async (itemId, category, itemTitle) => {
    const price = parseFloat(uniquePrice);
    if (!price || price <= 0) {
      setError(tx({ fr: 'Entre un prix valide.', en: 'Enter a valid price.', es: 'Ingresa un precio valido.' }));
      return;
    }
    setUniqueSending(true);
    try {
      const res = await createEditRequest({
        artistSlug, artistName, email,
        requestType: 'mark-unique',
        changeData: { itemId, category, customPrice: price, itemTitle },
      });
      const newReq = res.data?.data;
      if (newReq) setEditRequests(prev => [newReq, ...prev]);
      setUniqueFormId(null);
      setUniquePrice('');
      setSuccess(tx({
        fr: `Demande de piece unique envoyee pour "${itemTitle}" a ${price}$`,
        en: `Unique piece request sent for "${itemTitle}" at $${price}`,
        es: `Solicitud de pieza unica enviada para "${itemTitle}" a $${price}`,
      }));
      setTimeout(() => setSuccess(''), 5000);
    } catch {
      setError(tx({ fr: 'Erreur lors de la demande.', en: 'Error submitting request.', es: 'Error al enviar la solicitud.' }));
    } finally {
      setUniqueSending(false);
    }
  };

  // Retirer le statut piece unique
  const handleUnmarkUnique = async (itemId, category, itemTitle) => {
    try {
      const res = await createEditRequest({
        artistSlug, artistName, email,
        requestType: 'unmark-unique',
        changeData: { itemId, category, itemTitle },
      });
      const newReq = res.data?.data;
      if (newReq) setEditRequests(prev => [newReq, ...prev]);
    } catch {
      setError(tx({ fr: 'Erreur lors de la demande.', en: 'Error submitting request.', es: 'Error al enviar la solicitud.' }));
    }
  };

  // Pending unique requests
  const pendingUniqueIds = useMemo(() => {
    return editRequests
      .filter(r => r.status === 'pending' && (r.requestType === 'mark-unique' || r.requestType === 'unmark-unique'))
      .map(r => r.changeData?.itemId)
      .filter(Boolean);
  }, [editRequests]);

  // Soumettre de nouvelles images
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (uploadFiles.length === 0) return;

    setSending(true);
    setError('');
    setSuccess('');

    try {
      const cat = CATEGORIES.find(c => c.id === uploadCategory);
      const images = uploadFiles.map((f, i) => ({
        originalUrl: f.url,
        originalName: f.originalName || f.name || '',
        originalSize: f.originalSize || f.size || 0,
        title: uploadTitles[i] || f.name?.replace(/\.[^/.]+$/, '') || '',
        titleFr: uploadTitles[i] || f.name?.replace(/\.[^/.]+$/, '') || '',
      }));

      const res = await createEditRequest({
        artistSlug,
        artistName,
        email,
        requestType: cat.requestAdd,
        changeData: { images },
      });

      const newReq = res.data?.data;
      if (newReq) {
        setEditRequests(prev => [{ ...newReq, changeData: { images } }, ...prev]);
      }

      setUploadFiles([]);
      setUploadTitles({});
      setSuccess(tx({
        fr: `${images.length} image(s) soumise(s) pour approbation!`,
        en: `${images.length} image(s) submitted for approval!`,
        es: `${images.length} imagen(es) enviada(s) para aprobacion!`,
      }));
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(tx({ fr: 'Erreur lors de l\'envoi.', en: 'Error submitting.', es: 'Error al enviar.' }));
    } finally {
      setSending(false);
    }
  };

  // Rendu d'une grille d'images
  const renderGalleryGrid = (items, category) => {
    if (!items || items.length === 0) return (
      <div className="text-center py-6">
        <p className="text-grey-muted text-sm">{tx({ fr: 'Aucune image', en: 'No images', es: 'Sin imagenes' })}</p>
      </div>
    );

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {items.map((item) => {
          const isPendingRemoval = pendingRemovalIds.includes(item.id);
          const isPendingUnique = pendingUniqueIds.includes(item.id);
          const thumbSrc = resolveThumb(item);
          const title = item[`title${lang === 'fr' ? 'Fr' : lang === 'en' ? 'En' : 'Es'}`] || item.titleFr || item.title || '';
          const isUnique = item.unique;
          const showUniqueForm = uniqueFormId === item.id;

          return (
            <div
              key={item.id}
              className={`relative group rounded-xl overflow-hidden aspect-square ${
                isPendingRemoval ? 'opacity-40' : ''
              }`}
            >
              {thumbSrc ? (
                <img
                  src={thumbSrc}
                  alt={title}
                  className={`w-full h-full ${category === 'stickers' ? 'object-contain p-2' : 'object-cover'}`}
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-glass flex items-center justify-center">
                  <ImagePlus size={24} className="text-grey-muted/30" />
                </div>
              )}

              {/* Badge piece unique */}
              {isUnique && (
                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full bg-accent/90 text-white text-[8px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                  <Gem size={8} />
                  {tx({ fr: 'Unique', en: 'Unique', es: 'Unica' })}
                  {item.customPrice ? ` ${item.customPrice}$` : ''}
                </div>
              )}

              {/* Badge pending unique */}
              {isPendingUnique && !isUnique && (
                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full bg-yellow-500/80 text-white text-[8px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                  <Clock size={8} />
                  {tx({ fr: 'Unique en attente', en: 'Pending unique', es: 'Unica pendiente' })}
                </div>
              )}

              {/* Overlay avec titre (editable) */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6">
                {renamingId === item.id ? (
                  <form onSubmit={(e) => { e.preventDefault(); handleRename(item.id, category); }} className="flex gap-1">
                    <input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className="flex-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded border border-white/30 focus:outline-none focus:border-accent"
                      autoFocus
                      onBlur={() => setTimeout(() => setRenamingId(null), 200)}
                    />
                    <button type="submit" className="text-green-400 hover:text-green-300"><Check size={12} /></button>
                  </form>
                ) : (
                  <p className="text-white text-[10px] truncate cursor-pointer hover:text-accent transition-colors"
                    onClick={(e) => { e.stopPropagation(); setRenamingId(item.id); setRenameValue(title || ''); }}>
                    {title || item.id} <Pencil size={8} className="inline ml-0.5 opacity-50" />
                  </p>
                )}
              </div>

              {/* Formulaire piece unique (overlay) */}
              {showUniqueForm && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-3 z-10" onClick={(e) => e.stopPropagation()}>
                  <Gem size={20} className="text-accent mb-2" />
                  <p className="text-white text-[10px] text-center mb-2 font-medium">
                    {tx({ fr: 'Prix de la piece unique', en: 'Unique piece price', es: 'Precio de la pieza unica' })}
                  </p>
                  <div className="flex items-center gap-1 mb-3">
                    <input
                      type="number"
                      min="1"
                      value={uniquePrice}
                      onChange={(e) => setUniquePrice(e.target.value)}
                      className="w-20 bg-black/50 text-white text-sm px-2 py-1.5 rounded border border-accent/50 focus:outline-none focus:border-accent text-center"
                      placeholder="150"
                      autoFocus
                    />
                    <span className="text-white text-sm font-bold">$</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMarkUnique(item.id, category, title)}
                      disabled={uniqueSending}
                      className="px-3 py-1.5 rounded-lg bg-accent text-white text-[10px] font-semibold hover:bg-accent/80 disabled:opacity-50 flex items-center gap-1"
                    >
                      {uniqueSending ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
                      {tx({ fr: 'Envoyer', en: 'Submit', es: 'Enviar' })}
                    </button>
                    <button
                      onClick={() => { setUniqueFormId(null); setUniquePrice(''); }}
                      className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-[10px] font-semibold hover:bg-white/20"
                    >
                      <X size={10} />
                    </button>
                  </div>
                </div>
              )}

              {/* Badge pending removal */}
              {isPendingRemoval && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
                  <div className="bg-red-500/80 rounded-full p-2">
                    <Clock size={16} className="text-white" />
                  </div>
                </div>
              )}

              {/* Boutons d'action (hover) */}
              {!isPendingRemoval && !showUniqueForm && (
                <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Bouton supprimer */}
                  <button
                    onClick={() => handleRemove(item.id, category)}
                    className="p-1.5 rounded-full bg-red-500/80 text-white hover:bg-red-500"
                    title={tx({ fr: 'Demander la suppression', en: 'Request removal', es: 'Solicitar eliminacion' })}
                  >
                    <Trash2 size={12} />
                  </button>
                  {/* Bouton piece unique */}
                  {!isUnique && !isPendingUnique && category === 'prints' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setUniqueFormId(item.id); setUniquePrice(''); }}
                      className="p-1.5 rounded-full bg-accent/80 text-white hover:bg-accent"
                      title={tx({ fr: 'Designer comme piece unique', en: 'Mark as unique piece', es: 'Marcar como pieza unica' })}
                    >
                      <Gem size={12} />
                    </button>
                  )}
                  {/* Bouton retirer unique */}
                  {isUnique && !isPendingUnique && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUnmarkUnique(item.id, category, title); }}
                      className="p-1.5 rounded-full bg-yellow-500/80 text-white hover:bg-yellow-500"
                      title={tx({ fr: 'Retirer le statut piece unique', en: 'Remove unique status', es: 'Quitar estado de pieza unica' })}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Historique des demandes
  const recentRequests = editRequests.filter(r =>
    ['add-prints', 'add-stickers', 'add-merch', 'remove-prints', 'remove-stickers', 'remove-merch', 'mark-unique', 'unmark-unique'].includes(r.requestType)
  ).slice(0, 20);

  return (
    <div className="space-y-6">
      {/* Section: Galerie actuelle */}
      <div className="rounded-2xl p-5 md:p-8 card-bg card-shadow">
        <h3 className="text-heading font-heading font-bold text-lg flex items-center gap-2 mb-6">
          <Eye size={20} className="text-accent" />
          {tx({ fr: 'Ma galerie', en: 'My gallery', es: 'Mi galeria' })}
        </h3>

        {/* Prints */}
        <div className="mb-6">
          <h4 className="text-heading font-semibold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent" />
            Prints ({artistPrints.length})
          </h4>
          {renderGalleryGrid(artistPrints, 'prints')}
        </div>

        {/* Stickers */}
        {(artistStickers.length > 0 || pendingAdditions.some(a => a.requestType === 'add-stickers')) && (
          <div className="mb-6">
            <h4 className="text-heading font-semibold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pink-400" />
              Stickers ({artistStickers.length})
            </h4>
            {renderGalleryGrid(artistStickers, 'stickers')}
          </div>
        )}

        {/* Merch */}
        {(artistMerch.length > 0 || pendingAdditions.some(a => a.requestType === 'add-merch')) && (
          <div className="mb-6">
            <h4 className="text-heading font-semibold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              Merch ({artistMerch.length})
            </h4>
            {renderGalleryGrid(artistMerch, 'merch')}
          </div>
        )}

        {/* Pending additions preview */}
        {pendingAdditions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-purple-main/10">
            <h4 className="text-heading font-semibold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock size={14} className="text-yellow-400" />
              {tx({ fr: 'En attente d\'approbation', en: 'Pending approval', es: 'Pendiente de aprobacion' })}
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {pendingAdditions.flatMap(req =>
                req.images.map((img, i) => (
                  <div key={`${req.documentId}-${i}`} className="relative rounded-lg overflow-hidden aspect-square">
                    <img
                      src={img.originalUrl}
                      alt={img.title || ''}
                      className="w-full h-full object-cover opacity-60"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="px-2 py-0.5 rounded-full bg-yellow-500/30 text-yellow-300 text-[9px] font-semibold">
                        {tx({ fr: 'En attente', en: 'Pending', es: 'Pendiente' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Section: Ajouter des images */}
      <div className="rounded-2xl p-5 md:p-8 card-bg card-shadow">
        <h3 className="text-heading font-heading font-bold text-lg flex items-center gap-2 mb-2">
          <ImagePlus size={20} className="text-accent" />
          {tx({ fr: 'Ajouter des images', en: 'Add images', es: 'Agregar imagenes' })}
        </h3>
        <p className="text-grey-muted text-sm mb-6">
          {tx({
            fr: 'Depose tes images haute-resolution. Elles seront soumises pour approbation avant d\'apparaitre sur ta page.',
            en: 'Upload your high-resolution images. They will be submitted for approval before appearing on your page.',
            es: 'Sube tus imagenes de alta resolucion. Seran enviadas para aprobacion antes de aparecer en tu pagina.',
          })}
        </p>

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2"
          >
            <Check size={16} />
            {success}
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2"
          >
            <AlertCircle size={16} />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Categorie */}
          <div>
            <label className="text-[11px] text-grey-muted uppercase tracking-wider font-medium mb-2 block">
              {tx({ fr: 'Categorie', en: 'Category', es: 'Categoria' })}
            </label>
            <div className="flex gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setUploadCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    uploadCategory === cat.id
                      ? 'bg-accent text-white'
                      : 'bg-glass text-grey-muted hover:text-heading'
                  }`}
                >
                  {cat[`label${lang === 'fr' ? 'Fr' : lang === 'en' ? 'En' : 'Es'}`]}
                </button>
              ))}
            </div>
          </div>

          {/* Upload */}
          <FileUpload
            label={tx({ fr: 'Images (max 20, 130 MB chacun)', en: 'Images (max 20, 130 MB each)', es: 'Imagenes (max 20, 130 MB c/u)' })}
            files={uploadFiles}
            onFilesChange={(files) => {
              setUploadFiles(files);
              // Reset titles
              const titles = {};
              files.forEach((f, i) => {
                titles[i] = uploadTitles[i] || '';
              });
              setUploadTitles(titles);
            }}
            maxFiles={20}
            uploadFn={uploadArtistFile}
          />

          {/* Titres par image */}
          {uploadFiles.length > 0 && (
            <div className="space-y-2">
              <label className="text-[11px] text-grey-muted uppercase tracking-wider font-medium block">
                {tx({ fr: 'Titres (optionnel)', en: 'Titles (optional)', es: 'Titulos (opcional)' })}
              </label>
              {uploadFiles.map((f, i) => (
                <div key={f.id || i} className="flex items-center gap-2">
                  <span className="text-grey-muted text-[10px] truncate w-24 flex-shrink-0">{f.name}</span>
                  <input
                    type="text"
                    value={uploadTitles[i] || ''}
                    onChange={(e) => setUploadTitles(prev => ({ ...prev, [i]: e.target.value }))}
                    className="input-field text-sm py-1.5 flex-1"
                    placeholder={tx({ fr: 'Titre de l\'oeuvre', en: 'Artwork title', es: 'Titulo de la obra' })}
                  />
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={sending || uploadFiles.length === 0}
            className="btn-primary text-sm py-2.5 px-6 disabled:opacity-50"
          >
            {sending ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Send size={14} className="mr-1.5" />}
            {tx({ fr: 'Soumettre pour approbation', en: 'Submit for approval', es: 'Enviar para aprobacion' })}
          </button>
        </form>
      </div>

      {/* Section: Historique des demandes */}
      <div className="rounded-2xl p-5 md:p-8 card-bg card-shadow">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between text-heading font-heading font-bold text-base"
        >
          <span className="flex items-center gap-2">
            <Clock size={18} className="text-accent" />
            {tx({ fr: 'Historique des demandes', en: 'Request history', es: 'Historial de solicitudes' })}
            {recentRequests.length > 0 && (
              <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full">{recentRequests.length}</span>
            )}
          </span>
          {showHistory ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-3">
                {reqLoading ? (
                  <div className="flex items-center gap-2 text-grey-muted py-4 justify-center">
                    <Loader2 size={16} className="animate-spin" />
                  </div>
                ) : recentRequests.length === 0 ? (
                  <p className="text-grey-muted text-sm text-center py-4">
                    {tx({ fr: 'Aucune demande pour l\'instant.', en: 'No requests yet.', es: 'Sin solicitudes por el momento.' })}
                  </p>
                ) : (
                  recentRequests.map((req) => {
                    const badge = STATUS_BADGE[req.status] || STATUS_BADGE.pending;
                    const isAdd = req.requestType?.startsWith('add-');
                    const count = isAdd
                      ? (req.changeData?.images?.length || 0)
                      : (req.changeData?.itemIds?.length || 0);

                    return (
                      <div key={req.documentId} className="rounded-lg border border-purple-main/10 p-4">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {isAdd ? <ImagePlus size={14} className="text-accent" /> : <Trash2 size={14} className="text-red-400" />}
                            <span className="text-heading text-sm font-medium">
                              {isAdd ? tx({ fr: 'Ajout', en: 'Add', es: 'Agregar' }) : tx({ fr: 'Suppression', en: 'Remove', es: 'Eliminar' })}
                              {' - '}
                              {req.requestType?.replace('add-', '').replace('remove-', '')}
                              {` (${count})`}
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge.bg} ${badge.text}`}>
                            {badge[`label${lang === 'fr' ? 'Fr' : lang === 'en' ? 'En' : 'Es'}`]}
                          </span>
                        </div>
                        <p className="text-grey-muted text-xs">
                          {req.createdAt ? new Date(req.createdAt).toLocaleDateString('fr-CA') : ''}
                        </p>
                        {req.adminNotes && (
                          <div className="mt-2 p-2 rounded bg-red-500/5 border border-red-500/10">
                            <p className="text-red-400 text-xs">{req.adminNotes}</p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default ArtistGalleryManager;
