import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ImagePlus, Trash2, Loader2, Check, X, Clock, Send, AlertCircle,
  ChevronDown, ChevronUp, Eye, Pencil, Gem, DollarSign,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useUserRole } from '../contexts/UserRoleContext';
import { createEditRequest, getMyEditRequests, sendArtistMessage } from '../services/artistService';
import { uploadArtistFile } from '../services/api';
import FileUpload from './FileUpload';
import artistsData, { artistFormats, framePriceByFormat } from '../data/artists';
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
  const { user, updateProfile } = useAuth();
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
  const [uniqueFormat, setUniqueFormat] = useState('a3plus');
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
  const [removingId, setRemovingId] = useState(null);
  const handleRemove = async (itemId, category) => {
    if (pendingRemovalIds.includes(itemId)) return;

    const cat = CATEGORIES.find(c => c.id === category);
    if (!cat) return;

    setRemovingId(itemId);
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
      setSuccess(tx({ fr: 'Demande de suppression envoyée!', en: 'Removal request sent!', es: 'Solicitud de eliminacion enviada!' }));
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(tx({ fr: 'Erreur lors de la demande de suppression.', en: 'Error requesting removal.', es: 'Error al solicitar la eliminacion.' }));
    } finally {
      setRemovingId(null);
    }
  };

  // Renommer un item (sauvegarde locale + message admin)
  const handleRename = async (itemId, category) => {
    if (!renameValue.trim()) { setRenamingId(null); return; }
    try {
      // Sauvegarder dans Supabase user_metadata (persistant, multi-appareil)
      const meta = user?.user_metadata || {};
      const saved = meta.artist_renames || {};
      saved[itemId] = renameValue.trim();
      await updateProfile({ artist_renames: saved });

      // Envoyer un message admin pour que le code soit mis à jour
      await sendArtistMessage({
        artistSlug,
        artistName: artistName || artistSlug,
        email,
        subject: `Renommage: ${itemId}`,
        message: `L'artiste souhaite renommer "${itemId}" en "${renameValue.trim()}" (categorie: ${category})`,
        category: 'other',
      }).catch(() => {}); // pas grave si le message echoue

      setRenamingId(null);
      setRenameValue('');
      setSuccess(tx({
        fr: `Renomme: "${renameValue.trim()}"`,
        en: `Renamed: "${renameValue.trim()}"`,
        es: `Renombrado: "${renameValue.trim()}"`,
      }));
      setTimeout(() => setSuccess(''), 4000);
    } catch {
      setError(tx({ fr: 'Erreur lors du renommage.', en: 'Error renaming.', es: 'Error al renombrar.' }));
    }
  };

  // Prix minimum pour piece unique = prix studio du format choisi
  const getMinPrice = (format) => {
    const artistData = artistsData[artistSlug];
    if (artistData?.pricing?.studio?.[format] != null) return artistData.pricing.studio[format];
    return 35; // fallback A4
  };

  // Marquer comme piece unique
  const handleMarkUnique = async (itemId, category, itemTitle) => {
    const price = parseFloat(uniquePrice);
    const minPrice = getMinPrice(uniqueFormat);
    if (!price || price < minPrice) {
      setError(tx({ fr: `Le prix minimum est ${minPrice}$ pour ce format.`, en: `Minimum price is $${minPrice} for this format.`, es: `El precio minimo es $${minPrice} para este formato.` }));
      return;
    }
    setUniqueSending(true);
    try {
      const formatLabel = artistFormats.find(f => f.id === uniqueFormat)?.label || uniqueFormat;
      const res = await createEditRequest({
        artistSlug, artistName, email,
        requestType: 'mark-unique',
        changeData: { itemId, category, customPrice: price, fixedFormat: uniqueFormat, formatLabel, itemTitle },
      });
      const newReq = res.data?.data;
      if (newReq) setEditRequests(prev => [newReq, ...prev]);
      setUniqueFormId(null);
      setUniquePrice('');
      setSuccess(tx({
        fr: `Demande de pièce unique envoyée pour "${itemTitle}" à ${price}$`,
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

  const [selectedItemId, setSelectedItemId] = useState(null);

  // Renommages depuis Supabase user_metadata
  const localRenames = useMemo(() => {
    return user?.user_metadata?.artist_renames || {};
  }, [user, renamingId]); // re-read quand on finit un renommage

  const getTitle = (item) => {
    if (localRenames[item.id]) return localRenames[item.id];
    return item[`title${lang === 'fr' ? 'Fr' : lang === 'en' ? 'En' : 'Es'}`] || item.titleFr || item.title || '';
  };

  // Rendu d'une grille d'images
  const renderGalleryGrid = (items, category) => {
    if (!items || items.length === 0) return (
      <div className="text-center py-6">
        <p className="text-grey-muted text-sm">{tx({ fr: 'Aucune image', en: 'No images', es: 'Sin imagenes' })}</p>
      </div>
    );

    // Trier: portraits d'abord, paysages ensuite
    const sorted = [...items];
    const selectedItem = items.find(i => i.id === selectedItemId);

    return (
      <>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
        {sorted.map((item) => {
          const isPendingRemoval = pendingRemovalIds.includes(item.id);
          const isPendingUnique = pendingUniqueIds.includes(item.id);
          const thumbSrc = resolveThumb(item);
          const title = getTitle(item);
          const isUnique = item.unique;
          const isSelected = selectedItemId === item.id;

          return (
            <div
              key={item.id}
              onClick={() => setSelectedItemId(isSelected ? null : item.id)}
              className={`relative group rounded-lg overflow-hidden cursor-pointer transition-all ${
                isPendingRemoval ? 'opacity-40' : ''
              } ${isSelected ? 'ring-2 ring-accent' : 'hover:ring-1 hover:ring-white/20'}`}
            >
              {thumbSrc ? (
                <img
                  src={thumbSrc}
                  alt={title}
                  className={`w-full ${category === 'stickers' ? 'object-contain p-1 aspect-square' : 'object-cover'}`}
                  style={category !== 'stickers' ? { aspectRatio: 'auto' } : undefined}
                  loading="lazy"
                />
              ) : (
                <div className="w-full aspect-[2/3] bg-glass flex items-center justify-center">
                  <ImagePlus size={20} className="text-grey-muted/30" />
                </div>
              )}

              {/* Badge piece unique */}
              {isUnique && (
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-accent/90 text-white text-[8px] font-bold uppercase flex items-center gap-0.5 whitespace-nowrap z-10" title={item.customPrice ? `Unique - ${item.customPrice}$` : 'Unique'}>
                  <Gem size={8} />
                  Unique
                </div>
              )}

              {/* Badge pending */}
              {isPendingUnique && !isUnique && (
                <div className="absolute top-1 left-1 px-1 py-0.5 rounded-full bg-yellow-500/80 text-white text-[7px] font-bold flex items-center gap-0.5">
                  <Clock size={7} />
                </div>
              )}

              {/* Titre en bas */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1 pt-4">
                <p className="text-white text-[9px] truncate">{title || item.id}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Panneau de detail quand on selectionne un item */}
      {selectedItem && (
        <div className="mt-3 p-3 sm:p-4 rounded-xl bg-black/20 space-y-3 overflow-hidden">
          <div className="flex items-start gap-3 sm:gap-4">
            <img
              src={resolveThumb(selectedItem) || ''}
              alt=""
              className={`rounded-lg flex-shrink-0 ${category === 'stickers' ? 'w-12 h-12 sm:w-16 sm:h-16 object-contain' : 'w-16 h-24 sm:w-20 sm:h-28 object-cover'}`}
            />
            <div className="flex-1 min-w-0 overflow-hidden">
              {/* Nom editable */}
              <label className="text-grey-muted text-[10px] uppercase tracking-wider mb-1 block">
                {tx({ fr: 'Nom', en: 'Name', es: 'Nombre' })}
              </label>
              {renamingId === selectedItem.id ? (
                <form onSubmit={(e) => { e.preventDefault(); handleRename(selectedItem.id, category); }} className="flex gap-1 sm:gap-1.5 mb-2">
                  <input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="flex-1 min-w-0 bg-black/40 text-heading text-xs sm:text-sm px-2 py-1.5 rounded-lg border border-white/20 focus:outline-none focus:border-accent"
                    autoFocus
                  />
                  <button type="submit" className="flex-shrink-0 px-2 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30"><Check size={14} /></button>
                  <button type="button" onClick={() => setRenamingId(null)} className="flex-shrink-0 px-2 py-1.5 rounded-lg bg-white/10 text-grey-muted hover:bg-white/20"><X size={14} /></button>
                </form>
              ) : (
                <p
                  className="text-heading text-sm font-medium cursor-pointer hover:text-accent transition-colors flex items-center gap-1.5 mb-2"
                  onClick={() => { setRenamingId(selectedItem.id); setRenameValue(selectedItem[`title${lang === 'fr' ? 'Fr' : 'En'}`] || selectedItem.titleFr || ''); }}
                >
                  {selectedItem[`title${lang === 'fr' ? 'Fr' : lang === 'en' ? 'En' : 'Es'}`] || selectedItem.titleFr || selectedItem.id}
                  <Pencil size={12} className="text-grey-muted" />
                </p>
              )}

              {/* Status unique */}
              {selectedItem.unique ? (
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-bold">
                    <Gem size={10} />
                    {tx({ fr: 'Pièce unique', en: 'Unique piece', es: 'Pieza unica' })}
                    {selectedItem.customPrice ? ` - ${selectedItem.customPrice}$` : ''}
                  </span>
                  <button
                    onClick={() => handleUnmarkUnique(selectedItem.id, category, selectedItem.titleFr || selectedItem.id)}
                    className="text-grey-muted text-[10px] hover:text-red-400 transition-colors"
                  >
                    {tx({ fr: 'Retirer', en: 'Remove', es: 'Quitar' })}
                  </button>
                </div>
              ) : pendingUniqueIds.includes(selectedItem.id) ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-[10px] font-bold mb-2">
                  <Clock size={10} />
                  {tx({ fr: 'Validation en attente', en: 'Pending approval', es: 'Aprobacion pendiente' })}
                </span>
              ) : (
                /* Formulaire piece unique inline */
                <div className="space-y-2">
                  <button
                    onClick={() => { setUniqueFormId(uniqueFormId === selectedItem.id ? null : selectedItem.id); setUniquePrice(''); }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent/10 text-accent text-[11px] font-semibold hover:bg-accent/20 transition-colors"
                  >
                    <Gem size={12} />
                    {tx({ fr: 'Marquer comme pièce unique', en: 'Mark as unique piece', es: 'Marcar como pieza unica' })}
                  </button>

                  {uniqueFormId === selectedItem.id && (() => {
                    const minPrice = getMinPrice(uniqueFormat);
                    const currentPrice = parseFloat(uniquePrice) || 0;
                    const isValid = currentPrice >= minPrice;
                    return (
                      <div className="flex flex-wrap items-end gap-2 p-3 rounded-lg bg-black/30">
                        {/* Format */}
                        <div>
                          <p className="text-grey-muted text-[9px] uppercase mb-1">Format</p>
                          <div className="flex gap-1">
                            {artistFormats.map(f => (
                              <button
                                key={f.id}
                                onClick={() => setUniqueFormat(f.id)}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${uniqueFormat === f.id ? 'bg-accent text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                              >
                                {f.short}
                              </button>
                            ))}
                          </div>
                        </div>
                        {/* Prix */}
                        <div>
                          <p className="text-grey-muted text-[9px] uppercase mb-1">{tx({ fr: `Prix (min ${minPrice}$)`, en: `Price (min $${minPrice})`, es: `Precio (min $${minPrice})` })}</p>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={minPrice}
                              value={uniquePrice}
                              onChange={(e) => setUniquePrice(e.target.value)}
                              className={`w-20 bg-black/50 text-white text-sm px-2 py-1 rounded border ${isValid || !uniquePrice ? 'border-accent/50' : 'border-red-500'} focus:outline-none focus:border-accent text-center`}
                              placeholder={`${minPrice}`}
                              autoFocus
                            />
                            <span className="text-white text-sm font-bold">$</span>
                          </div>
                        </div>
                        {/* Boutons */}
                        <button
                          onClick={() => handleMarkUnique(selectedItem.id, category, selectedItem.titleFr || selectedItem.id)}
                          disabled={uniqueSending || !isValid || !uniquePrice}
                          className="px-3 py-1.5 rounded-lg bg-accent text-white text-[11px] font-semibold hover:bg-accent/80 disabled:opacity-50 flex items-center gap-1"
                        >
                          {uniqueSending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                          {tx({ fr: 'Valider', en: 'Submit', es: 'Enviar' })}
                        </button>
                        <button
                          onClick={() => { setUniqueFormId(null); setUniquePrice(''); }}
                          className="px-2 py-1.5 rounded-lg bg-white/10 text-grey-muted hover:bg-white/20"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {!pendingRemovalIds.includes(selectedItem.id) && (
              <button
                onClick={() => { handleRemove(selectedItem.id, category); setSelectedItemId(null); }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-[11px] font-medium hover:bg-red-500/20 transition-colors"
              >
                <Trash2 size={12} />
                {tx({ fr: 'Demander suppression', en: 'Request removal', es: 'Solicitar eliminacion' })}
              </button>
            )}
            <button
              onClick={() => setSelectedItemId(null)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 text-grey-muted text-[11px] font-medium hover:bg-white/10 transition-colors ml-auto"
            >
              <X size={12} />
              {tx({ fr: 'Fermer', en: 'Close', es: 'Cerrar' })}
            </button>
          </div>
        </div>
      )}
      </>
    );
  };

  // Historique des demandes
  const recentRequests = editRequests.filter(r =>
    ['add-prints', 'add-stickers', 'add-merch', 'remove-prints', 'remove-stickers', 'remove-merch', 'mark-unique', 'unmark-unique', 'rename-item'].includes(r.requestType)
  ).slice(0, 20);

  return (
    <div className="space-y-6">
      {/* Section: Galerie actuelle */}
      <div className="rounded-2xl p-5 md:p-8 card-bg">
        <h3 className="text-heading font-heading font-bold text-lg flex items-center gap-2 mb-4">
          <Eye size={20} className="text-accent" />
          {tx({ fr: 'Ma galerie', en: 'My gallery', es: 'Mi galeria' })}
        </h3>

        {/* Messages galerie */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={16} /> {error}
            <button onClick={() => setError('')} className="ml-auto text-red-400/60 hover:text-red-400"><X size={14} /></button>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-500/10 text-green-400 text-sm flex items-center gap-2">
            <Check size={16} /> {success}
          </div>
        )}

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
      <div className="rounded-2xl p-5 md:p-8 card-bg">
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
      <div className="rounded-2xl p-5 md:p-8 card-bg">
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
                    const isRename = req.requestType === 'rename-item';
                    const isUnique = req.requestType === 'mark-unique' || req.requestType === 'unmark-unique';
                    const count = isAdd
                      ? (req.changeData?.images?.length || 0)
                      : (req.changeData?.itemIds?.length || 0);

                    const getIcon = () => {
                      if (isRename) return <Pencil size={14} className="text-blue-400" />;
                      if (isUnique) return <Gem size={14} className="text-accent" />;
                      if (isAdd) return <ImagePlus size={14} className="text-accent" />;
                      return <Trash2 size={14} className="text-red-400" />;
                    };

                    const getLabel = () => {
                      if (isRename) return `${tx({ fr: 'Renommage', en: 'Rename', es: 'Renombrar' })} - "${req.changeData?.newTitle || ''}"`;
                      if (req.requestType === 'mark-unique') return `${tx({ fr: 'Pièce unique', en: 'Unique piece', es: 'Pieza unica' })} - ${req.changeData?.itemTitle || ''} (${req.changeData?.customPrice || 0}$)`;
                      if (req.requestType === 'unmark-unique') return `${tx({ fr: 'Retrait unique', en: 'Remove unique', es: 'Quitar unica' })} - ${req.changeData?.itemTitle || ''}`;
                      if (isAdd) return `${tx({ fr: 'Ajout', en: 'Add', es: 'Agregar' })} - ${req.requestType?.replace('add-', '')} (${count})`;
                      return `${tx({ fr: 'Suppression', en: 'Remove', es: 'Eliminar' })} - ${req.requestType?.replace('remove-', '')} (${count})`;
                    };

                    return (
                      <div key={req.documentId} className="rounded-lg border border-purple-main/10 p-4">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {getIcon()}
                            <span className="text-heading text-sm font-medium">
                              {getLabel()}
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
