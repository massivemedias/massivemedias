import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ImagePlus, Trash2, Loader2, Check, X, Clock, Send, AlertCircle,
  ChevronDown, ChevronUp, Eye, Pencil, Gem, DollarSign, ImageIcon,
  LayoutGrid, Grid3X3, List, Lock, Hash,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useUserRole } from '../contexts/UserRoleContext';
import { createEditRequest, getMyEditRequests, sendArtistMessage } from '../services/artistService';
import api, { uploadArtistFile } from '../services/api';
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
  // Expose artistSlug for FileUpload large file uploads
  if (artistSlug) window.__artistSlug = artistSlug;
  const { artists: cmsArtists } = useArtists();

  // State
  const [editRequests, setEditRequests] = useState([]);
  const [reqLoading, setReqLoading] = useState(true);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadCategory, setUploadCategory] = useState('prints');
  const [uploadTitles, setUploadTitles] = useState({});
  // Options par image: { type: 'standard'|'unique'|'limited'|'private', limitedQty, clientEmail, customPrice, fixedFormat }
  const [uploadOptions, setUploadOptions] = useState({});
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [uniqueFormId, setUniqueFormId] = useState(null);
  const [uniquePrice, setUniquePrice] = useState('');
  const [uniqueFormat, setUniqueFormat] = useState('a3plus');
  const [viewMode, setViewMode] = useState('list'); // 'grid' | 'compact' | 'list'
  const [uniqueSending, setUniqueSending] = useState(false);
  const [uniqueEmail, setUniqueEmail] = useState('');

  const email = user?.email || '';
  const localArtist = artistsData[artistSlug] || null;

  // CMS artist data (priority)
  const cmsArtist = useMemo(() => {
    if (!cmsArtists || !artistSlug) return null;
    const arr = Array.isArray(cmsArtists) ? cmsArtists : Object.values(cmsArtists);
    return arr.find(a => a.slug === artistSlug) || null;
  }, [cmsArtists, artistSlug]);

  // Local = base, CMS override les champs existants + ajoute les nouveaux
  const mergeItems = (cmsItems, localItems) => {
    const cms = Array.isArray(cmsItems) ? cmsItems : [];
    const local = Array.isArray(localItems) ? localItems : [];
    if (cms.length === 0) return local;
    if (local.length === 0) return cms;
    const cmsMap = {};
    cms.forEach(p => { if (p.id) cmsMap[p.id] = p; });
    const merged = local.map(p => {
      if (p.id && cmsMap[p.id]) {
        const { image: cmsImg, fullImage: cmsFull, ...cmsRest } = cmsMap[p.id];
        return { ...p, ...cmsRest, image: cmsImg || p.image, fullImage: cmsFull || p.fullImage };
      }
      return p;
    });
    const localIds = new Set(local.map(p => p.id));
    const newFromCms = cms.filter(p => !localIds.has(p.id));
    return [...merged, ...newFromCms];
  };

  const artistPrints = useMemo(() => mergeItems(cmsArtist?.prints, localArtist?.prints), [cmsArtist, localArtist]);
  const artistStickers = useMemo(() => mergeItems(cmsArtist?.stickers, localArtist?.stickers), [cmsArtist, localArtist]);
  const artistMerch = useMemo(() => mergeItems(cmsArtist?.merch, localArtist?.merch), [cmsArtist, localArtist]);

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

  // Hero image - lue depuis user_metadata
  const currentHeroId = user?.user_metadata?.artist_hero_image || null;
  const handleSetHero = async (itemId) => {
    try {
      await updateProfile({ artist_hero_image: itemId });
      // Sauvegarder aussi dans le backend pour la page publique
      api.put('/user-roles/artist-data', { email, heroImageId: itemId }).catch(() => {});
      setSuccess(tx({ fr: 'Image hero mise a jour!', en: 'Hero image updated!', es: 'Imagen hero actualizada!' }));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(tx({ fr: 'Erreur', en: 'Error', es: 'Error' }));
    }
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
    const newName = renameValue.trim();
    const meta = user?.user_metadata || {};
    const saved = { ...(meta.artist_renames || {}), [itemId]: newName };

    // Tout est non-bloquant - le rename reussit toujours cote UI
    api.put('/user-roles/artist-data', { email, itemRenames: saved }).catch(() => {});
    updateProfile({ artist_renames: saved }).catch(() => {});
    sendArtistMessage({ artistSlug, artistName: artistName || artistSlug, email, subject: `Renommage: ${itemId}`, message: `Renommer "${itemId}" en "${newName}" (${category})`, category: 'other' }).catch(() => {});

    setRenamingId(null);
    setRenameValue('');
    setSuccess(tx({ fr: `Renomme: "${newName}"`, en: `Renamed: "${newName}"`, es: `Renombrado: "${newName}"` }));
    setTimeout(() => setSuccess(''), 4000);
  };

  // Prix minimum pour piece unique/privee = prix du format + tier choisis
  // (pour une vente privee A2 museum, min = prix museum A2, pas studio A2)
  const getMinPrice = (format, tier = 'studio') => {
    const artistData = artistsData[artistSlug];
    const pricing = artistData?.pricing;
    if (pricing?.[tier]?.[format] != null) return pricing[tier][format];
    if (pricing?.studio?.[format] != null) return pricing.studio[format];
    return 35; // fallback A4 studio
  };

  // Marquer comme piece unique
  const handleMarkUnique = async (itemId, category, itemTitle) => {
    const price = parseFloat(uniquePrice);
    // mark-unique utilise toujours le tier studio
    const minPrice = getMinPrice(uniqueFormat, 'studio');
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

    // Validation: pour une vente privee, le prix est obligatoire et >= prix du format+tier
    for (let i = 0; i < uploadFiles.length; i++) {
      const opts = uploadOptions[i] || { type: 'standard' };
      if (opts.type === 'private') {
        const fmt = opts.fixedFormat || 'a4';
        const tier = opts.fixedTier || 'studio';
        const minP = getMinPrice(fmt, tier);
        const p = parseFloat(opts.customPrice);
        if (!p || p < minP) {
          setError(tx({
            fr: `Vente privee image ${i + 1}: prix minimum ${minP}$ (${fmt.toUpperCase()} ${tier}). Le client paie ce montant, Massive garde le prix standard et tu recois le reste.`,
            en: `Private sale image ${i + 1}: minimum price $${minP} (${fmt.toUpperCase()} ${tier}).`,
            es: `Venta privada imagen ${i + 1}: precio minimo $${minP} (${fmt.toUpperCase()} ${tier}).`,
          }));
          setSending(false);
          return;
        }
      }
    }

    try {
      const cat = CATEGORIES.find(c => c.id === uploadCategory);
      const images = uploadFiles.map((f, i) => {
        const opts = uploadOptions[i] || { type: 'standard' };
        return {
          originalUrl: f.url,
          originalName: f.originalName || f.name || '',
          originalSize: f.originalSize || f.size || 0,
          title: uploadTitles[i] || f.name?.replace(/\.[^/.]+$/, '') || '',
          titleFr: uploadTitles[i] || f.name?.replace(/\.[^/.]+$/, '') || '',
          // Config commune (format, tier, cadre) pour unique/limited/private
          ...((opts.type === 'unique' || opts.type === 'limited' || opts.type === 'private') ? {
            fixedFormat: opts.fixedFormat || 'a4',
            fixedTier: opts.fixedTier || 'studio',
            frameOption: opts.frameOption || 'none',
            ...(opts.customPrice ? { customPrice: parseFloat(opts.customPrice) } : {}),
          } : {}),
          // Options specifiques
          ...(opts.type === 'unique' ? { unique: true, noFrame: (opts.frameOption || 'none') === 'none' } : {}),
          ...(opts.type === 'limited' ? { limitedEdition: true, limitedQty: parseInt(opts.limitedQty) || 50 } : {}),
          ...(opts.type === 'private' ? {
            private: true,
            clientEmail: opts.clientEmail || '',
            noFrame: (opts.frameOption || 'none') === 'none',
            ...(opts.frameOption === 'black' || opts.frameOption === 'white' ? { fixedFrame: opts.frameOption } : {}),
          } : {}),
        };
      });

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
      setUploadOptions({});
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

  // Rendu galerie (grid / compact / list)
  const renderGalleryGrid = (items, category) => {
    if (!items || items.length === 0) return (
      <div className="text-center py-6">
        <p className="text-grey-muted text-sm">{tx({ fr: 'Aucune image', en: 'No images', es: 'Sin imagenes' })}</p>
      </div>
    );

    // Vue grille (grid ou compact) - thumbs avec titre
    if (viewMode === 'grid' || viewMode === 'compact') {
      const cols = viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6';
      return (
        <div className={`grid ${cols} gap-2`}>
          {[...items].map((item) => {
            const thumbSrc = resolveThumb(item);
            const title = getTitle(item);
            const isHero = currentHeroId === item.id;
            const isUnique = item.unique;
            return (
              <div key={item.id} onClick={() => setSelectedItemId(selectedItemId === item.id ? null : item.id)}
                className={`relative rounded-lg overflow-hidden cursor-pointer transition-all hover:ring-1 hover:ring-white/20 ${selectedItemId === item.id ? 'ring-2 ring-accent' : ''}`}>
                {thumbSrc ? (
                  <img src={thumbSrc} alt={title} loading="lazy" className={`w-full ${category === 'stickers' ? 'object-contain p-1 aspect-square' : 'object-cover aspect-[3/4]'}`} />
                ) : (
                  <div className="w-full aspect-[3/4] bg-glass flex items-center justify-center"><ImagePlus size={16} className="text-grey-muted/30" /></div>
                )}
                {isHero && <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center"><ImageIcon size={8} className="text-white" /></div>}
                {isUnique && <div className="absolute top-1 left-1 px-1 py-0.5 rounded-full bg-accent/90 text-white text-[7px] font-bold flex items-center gap-0.5"><Gem size={7} /></div>}
                {item.limitedEdition && <div className="absolute top-1 left-1 px-1 py-0.5 rounded-full bg-blue-500/90 text-white text-[7px] font-bold flex items-center gap-0.5"><Hash size={7} />{item.limitedQty}</div>}
                {item.private && <div className="absolute top-1 right-7 px-1 py-0.5 rounded-full bg-orange-500/90 text-white text-[7px] font-bold flex items-center gap-0.5"><Lock size={7} /></div>}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1 pt-3">
                  <p className="text-white text-[9px] truncate">{title || item.id}</p>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Vue liste detaillee
    return (
      <div className="grid grid-cols-1 gap-3">
        {[...items].map((item) => {
          const isPendingRemoval = pendingRemovalIds.includes(item.id);
          const isPendingUnique = pendingUniqueIds.includes(item.id);
          const thumbSrc = resolveThumb(item);
          const title = getTitle(item);
          const isUnique = item.unique;
          const isHero = currentHeroId === item.id;
          const isRenaming = renamingId === item.id;
          const showUniqueForm = uniqueFormId === item.id || (uniqueFormId || '').startsWith(item.id + '_');

          return (
            <div key={item.id} className={`rounded-xl bg-black/20 overflow-hidden transition-all ${isPendingRemoval ? 'opacity-40' : ''}`}>
              <div className="flex gap-3 p-3">
                {/* Thumb */}
                <div className="relative flex-shrink-0">
                  {thumbSrc ? (
                    <img src={thumbSrc} alt={title} loading="lazy"
                      className={`rounded-lg ${category === 'stickers' ? 'w-16 h-16 object-contain' : 'w-20 h-28 object-cover'}`}
                    />
                  ) : (
                    <div className="w-20 h-28 rounded-lg bg-glass flex items-center justify-center">
                      <ImagePlus size={16} className="text-grey-muted/30" />
                    </div>
                  )}
                  {isHero && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center" title="Hero">
                      <ImageIcon size={10} className="text-white" />
                    </div>
                  )}
                  {isUnique && (
                    <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-accent flex items-center justify-center" title="Unique">
                      <Gem size={10} className="text-white" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  {/* Titre editable */}
                  {isRenaming ? (
                    <form onSubmit={(e) => { e.preventDefault(); handleRename(item.id, category); }} className="flex gap-1 mb-2">
                      <input value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                        className="flex-1 min-w-0 bg-black/40 text-heading text-xs px-2 py-1 rounded-lg border border-white/20 focus:outline-none focus:border-accent" autoFocus />
                      <button type="submit" className="px-1.5 py-1 rounded-lg bg-green-500/20 text-green-400"><Check size={12} /></button>
                      <button type="button" onClick={() => setRenamingId(null)} className="px-1.5 py-1 rounded-lg bg-white/10 text-grey-muted"><X size={12} /></button>
                    </form>
                  ) : (
                    <p className="text-heading text-base font-semibold truncate cursor-pointer hover:text-accent transition-colors flex items-center gap-1.5 mb-1.5"
                      onClick={() => { setRenamingId(item.id); setRenameValue(item[`title${lang === 'fr' ? 'Fr' : 'En'}`] || item.titleFr || ''); }}>
                      {title || item.id}
                      <Pencil size={10} className="text-grey-muted flex-shrink-0" />
                    </p>
                  )}

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {item.onSale && (
                      <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold">
                        -{item.salePercent || 20}%
                      </span>
                    )}
                    {isUnique && (
                      <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full bg-accent/20 text-accent text-xs font-bold">
                        <Gem size={8} /> {tx({ fr: 'Unique', en: 'Unique', es: 'Unica' })} {item.customPrice ? `${item.customPrice}$` : ''}
                      </span>
                    )}
                    {item.limitedEdition && (
                      <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold">
                        <Hash size={8} /> {item.limitedQty || '?'}
                      </span>
                    )}
                    {item.private && (
                      <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold">
                        <Lock size={8} /> {tx({ fr: 'Privee', en: 'Private', es: 'Privada' })}
                      </span>
                    )}
                    {isHero && (
                      <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold">
                        <ImageIcon size={8} /> Hero
                      </span>
                    )}
                    {isPendingRemoval && (
                      <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold">
                        <Trash2 size={8} /> {tx({ fr: 'Suppression demandee', en: 'Removal requested', es: 'Eliminacion solicitada' })}
                      </span>
                    )}
                    {isPendingUnique && !isUnique && (
                      <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold">
                        <Clock size={8} /> {tx({ fr: 'En attente', en: 'Pending', es: 'Pendiente' })}
                      </span>
                    )}
                  </div>
                  {/* Details du print */}
                  {category === 'prints' && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-grey-muted mb-2">
                      {item.fixedFormat && <span>Format: <strong className="text-heading">{item.fixedFormat.toUpperCase()}</strong></span>}
                      {item.fixedTier && <span>Qualite: <strong className="text-heading">{item.fixedTier === 'museum' ? 'Musee' : 'Studio'}</strong></span>}
                      {item.customPrice && <span>Prix: <strong className="text-accent">{item.customPrice}$</strong></span>}
                      {item.limitedQty && <span>Exemplaires: <strong className="text-heading">{item.limitedQty}</strong></span>}
                      {item.clientEmail && <span>Client: <strong className="text-orange-400">{item.clientEmail}</strong></span>}
                      {item.salePercent && <span>Rabais: <strong className="text-yellow-400">-{item.salePercent}%</strong></span>}
                      {item.sold && <span className="text-red-400 font-bold">VENDU</span>}
                      <span className="font-mono opacity-50">{item.id}</span>
                    </div>
                  )}

                  {/* Actions inline */}
                  <div className="flex flex-wrap gap-2">
                    {category === 'prints' && !isHero && (
                      <button onClick={() => handleSetHero(item.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-colors">
                        <ImageIcon size={14} /> Hero
                      </button>
                    )}
                    {/* Type: Standard / Unique / Limitee / Privee / Solde */}
                    {category === 'prints' && (
                      <button onClick={() => {
                        if (showUniqueForm) { setUniqueFormId(null); setUniquePrice(''); }
                        else {
                          // Pre-remplir avec les valeurs actuelles du print
                          const ct = item.onSale ? 'sale' : item.private ? 'private' : item.limitedEdition ? 'limited' : item.unique ? 'unique' : 'standard';
                          setUniqueFormId(`${item.id}_${ct}`);
                          setUniqueFormat(item.fixedFormat || 'a4');
                          setUniquePrice(item.customPrice ? String(item.customPrice) : item.salePercent ? String(item.salePercent) : item.limitedQty ? String(item.limitedQty) : '');
                          setUniqueEmail(item.clientEmail || '');
                        }
                      }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-colors">
                        <Gem size={14} /> {tx({ fr: 'Type / Config', en: 'Type / Config', es: 'Tipo / Config' })}
                      </button>
                    )}
                    {!isPendingRemoval && (
                      <button onClick={() => handleRemove(item.id, category)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors">
                        <Trash2 size={14} /> {tx({ fr: 'Supprimer', en: 'Delete', es: 'Eliminar' })}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Configurateur type - grand panneau */}
              {showUniqueForm && (() => {
                const currentType = item.onSale ? 'sale' : item.private ? 'private' : item.limitedEdition ? 'limited' : item.unique ? 'unique' : 'standard';
                const selectedType = (uniqueFormId || '').includes('_') ? (uniqueFormId || '').split('_').pop() : currentType;
                const minPrice = getMinPrice(uniqueFormat);

                const handleSubmitType = async () => {
                  setUniqueSending(true);
                  setError('');
                  try {
                    const changeData = {
                      itemId: item.id, category, itemTitle: item.titleFr || item.id,
                      printType: selectedType,
                      fixedFormat: uniqueFormat,
                    };
                    if (selectedType === 'unique' || selectedType === 'private') {
                      const price = parseFloat(uniquePrice);
                      if (!price || price < minPrice) {
                        setError(tx({ fr: `Prix minimum: ${minPrice}$`, en: `Min price: $${minPrice}`, es: `Precio minimo: $${minPrice}` }));
                        setUniqueSending(false);
                        return;
                      }
                      changeData.customPrice = price;
                    }
                    if (selectedType === 'limited') {
                      changeData.limitedQty = parseInt(uniquePrice) || 50;
                    }
                    if (selectedType === 'sale') {
                      changeData.salePercent = parseInt(uniquePrice) || 20;
                    }
                    if (selectedType === 'private') {
                      if (!uniqueEmail || !uniqueEmail.includes('@')) {
                        setError(tx({ fr: 'Email du client requis', en: 'Client email required', es: 'Email del cliente requerido' }));
                        setUniqueSending(false);
                        return;
                      }
                      changeData.clientEmail = uniqueEmail;
                    }

                    const res = await createEditRequest({
                      artistSlug, artistName, email,
                      requestType: selectedType === 'standard' ? 'unmark-unique' : 'mark-unique',
                      changeData,
                    });
                    const newReq = res.data?.data;
                    if (newReq) setEditRequests(prev => [newReq, ...prev]);
                    setUniqueFormId(null);
                    setUniquePrice('');
                    setSuccess(tx({ fr: 'Demande envoyee pour validation!', en: 'Request sent for approval!', es: 'Solicitud enviada!' }));
                    setTimeout(() => setSuccess(''), 5000);
                  } catch {
                    setError(tx({ fr: 'Erreur lors de la demande.', en: 'Error.', es: 'Error.' }));
                  } finally {
                    setUniqueSending(false);
                  }
                };

                return (
                  <div className="px-3 pb-3">
                    <div className="rounded-xl bg-black/30 border border-white/10 p-4 space-y-3">
                      {/* Selecteur de type */}
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { id: 'standard', label: 'Standard', desc: tx({ fr: 'Print normal', en: 'Normal print', es: 'Print normal' }) },
                          { id: 'unique', label: tx({ fr: 'Piece unique', en: 'Unique', es: 'Unica' }), desc: tx({ fr: 'Un seul exemplaire', en: 'One of a kind', es: 'Una sola copia' }) },
                          { id: 'limited', label: tx({ fr: 'Limitee', en: 'Limited', es: 'Limitada' }), desc: tx({ fr: 'Nombre limite', en: 'Limited copies', es: 'Copias limitadas' }) },
                          { id: 'private', label: tx({ fr: 'Privee', en: 'Private', es: 'Privada' }), desc: tx({ fr: 'Pour un client specifique', en: 'For a specific client', es: 'Para un cliente especifico' }) },
                          { id: 'sale', label: tx({ fr: 'Solde', en: 'Sale', es: 'Oferta' }), desc: tx({ fr: 'Prix reduit', en: 'Discounted', es: 'Descuento' }) },
                        ].map(t => (
                          <button key={t.id}
                            onClick={() => setUniqueFormId(`${item.id}_${t.id}`)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              selectedType === t.id ? 'bg-accent text-white' : 'bg-black/20 text-grey-muted hover:text-heading'
                            }`}>{t.label}</button>
                        ))}
                      </div>

                      {/* Formulaire selon le type */}
                      {selectedType !== 'standard' && (
                        <div className="space-y-3">
                          {/* Format (unique + private) */}
                          {(selectedType === 'unique' || selectedType === 'private') && (
                            <div>
                              <p className="text-grey-muted text-[10px] uppercase tracking-wider mb-1.5">Format</p>
                              <div className="flex gap-1.5">
                                {artistFormats.map(f => (
                                  <button key={f.id} onClick={() => setUniqueFormat(f.id)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${uniqueFormat === f.id ? 'bg-accent text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>
                                    {f.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Prix (unique + private) */}
                          {(selectedType === 'unique' || selectedType === 'private') && (
                            <div>
                              <p className="text-grey-muted text-[10px] uppercase tracking-wider mb-1.5">
                                Prix (min {minPrice}$)
                              </p>
                              <div className="flex items-center gap-2">
                                <input type="number" min={minPrice} value={uniquePrice} onChange={(e) => setUniquePrice(e.target.value)}
                                  className="w-24 bg-black/50 text-white text-sm px-3 py-2 rounded-lg border border-accent/50 focus:outline-none focus:border-accent"
                                  placeholder={String(minPrice)} />
                                <span className="text-white text-sm font-bold">$</span>
                                <span className="text-grey-muted text-[10px]">
                                  ({tx({ fr: `Format ${uniqueFormat.toUpperCase()} serie studio`, en: `${uniqueFormat.toUpperCase()} studio series`, es: `${uniqueFormat.toUpperCase()} serie studio` })})
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Nombre exemplaires (limited) */}
                          {selectedType === 'limited' && (
                            <div>
                              <p className="text-grey-muted text-[10px] uppercase tracking-wider mb-1.5">
                                {tx({ fr: 'Nombre d\'exemplaires', en: 'Number of copies', es: 'Numero de copias' })}
                              </p>
                              <input type="number" min="2" max="500" value={uniquePrice} onChange={(e) => setUniquePrice(e.target.value)}
                                className="w-24 bg-black/50 text-white text-sm px-3 py-2 rounded-lg border border-blue-500/50 focus:outline-none focus:border-blue-400"
                                placeholder="50" />
                            </div>
                          )}

                          {/* Pourcentage rabais (sale) */}
                          {selectedType === 'sale' && (
                            <div>
                              <p className="text-grey-muted text-[10px] uppercase tracking-wider mb-1.5">
                                {tx({ fr: 'Pourcentage de rabais', en: 'Discount percentage', es: 'Porcentaje de descuento' })}
                              </p>
                              <div className="flex items-center gap-2">
                                <input type="number" min="5" max="90" step="5" value={uniquePrice} onChange={(e) => setUniquePrice(e.target.value)}
                                  className="w-20 bg-black/50 text-white text-sm px-3 py-2 rounded-lg border border-yellow-500/50 focus:outline-none focus:border-yellow-400"
                                  placeholder="20" />
                                <span className="text-yellow-400 text-sm font-bold">%</span>
                              </div>
                            </div>
                          )}

                          {/* Email client (private) */}
                          {selectedType === 'private' && (
                            <div>
                              <p className="text-grey-muted text-[10px] uppercase tracking-wider mb-1.5">
                                {tx({ fr: 'Email du client', en: 'Client email', es: 'Email del cliente' })}
                              </p>
                              <input type="email" value={uniqueEmail || ''} onChange={(e) => setUniqueEmail(e.target.value)}
                                className="w-full bg-black/50 text-white text-sm px-3 py-2 rounded-lg border border-orange-500/50 focus:outline-none focus:border-orange-400"
                                placeholder="client@email.com" />
                              <p className="text-grey-muted text-[9px] mt-1">
                                {tx({ fr: 'Le client recevra un email avec un lien pour acheter cette oeuvre', en: 'Client will receive an email with a link to buy this artwork', es: 'El cliente recibira un email con un enlace para comprar' })}
                              </p>
                            </div>
                          )}

                          {/* Boutons */}
                          <div className="flex items-center gap-2 pt-1">
                            <button onClick={handleSubmitType}
                              disabled={uniqueSending}
                              className="px-4 py-2 rounded-lg bg-accent text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5 hover:bg-accent/90 transition-colors">
                              {uniqueSending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                              {tx({ fr: 'Envoyer pour validation', en: 'Submit for approval', es: 'Enviar para validacion' })}
                            </button>
                            <button onClick={() => { setUniqueFormId(null); setUniquePrice(''); }}
                              className="px-3 py-2 rounded-lg bg-white/10 text-grey-muted text-xs hover:bg-white/20 transition-colors">
                              {tx({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' })}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Standard: juste le bouton */}
                      {selectedType === 'standard' && currentType !== 'standard' && (
                        <div className="flex items-center gap-2">
                          <button onClick={handleSubmitType}
                            disabled={uniqueSending}
                            className="px-4 py-2 rounded-lg bg-white/10 text-heading text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5 hover:bg-white/20 transition-colors">
                            {uniqueSending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                            {tx({ fr: 'Remettre en standard', en: 'Set as standard', es: 'Poner estandar' })}
                          </button>
                          <button onClick={() => { setUniqueFormId(null); setUniquePrice(''); }}
                            className="px-3 py-2 rounded-lg bg-white/10 text-grey-muted text-xs hover:bg-white/20">
                            {tx({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' })}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>
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

        {/* View toggle */}
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-0.5 p-1 rounded-lg bg-black/20">
            {[
              { mode: 'grid', icon: LayoutGrid },
              { mode: 'compact', icon: Grid3X3 },
              { mode: 'list', icon: List },
            ].map(({ mode, icon: Icon }) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`p-1.5 rounded-md transition-all ${viewMode === mode ? 'bg-accent text-white shadow-md' : 'text-grey-muted hover:text-heading hover:bg-white/5'}`}>
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>

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

      {/* Section: Ajouter des fichiers */}
      <div id="artist-gallery-section" className="rounded-2xl p-5 md:p-8 card-bg">
        <h3 className="text-heading font-heading font-bold text-lg flex items-center gap-2 mb-2">
          <ImagePlus size={20} className="text-accent" />
          {tx({ fr: 'Ajouter des fichiers', en: 'Add files', es: 'Agregar archivos' })}
        </h3>
        <p className="text-grey-muted text-sm mb-3">
          {tx({
            fr: 'Depose tes fichiers haute-resolution. Ils seront soumis pour approbation avant d\'apparaitre sur ta page.',
            en: 'Upload your high-resolution files. They will be submitted for approval before appearing on your page.',
            es: 'Sube tus archivos de alta resolucion. Seran enviados para aprobacion antes de aparecer en tu pagina.',
          })}
        </p>
        <p className="text-grey-muted/70 text-xs mb-6">
          {tx({
            fr: 'Tes fichiers originaux sont conserves sur un serveur securise. Les images affichees sur le site sont en format ultra compresse (WebP) pour la fluidite du site et protegees par un filigrane.',
            en: 'Your original files are stored on a secure server. Images displayed on the site are in ultra-compressed format (WebP) for site performance and protected with a watermark.',
            es: 'Tus archivos originales se guardan en un servidor seguro. Las imagenes mostradas en el sitio estan en formato ultra comprimido (WebP) para el rendimiento del sitio y protegidas con marca de agua.',
          })}
        </p>
        <p className="text-accent/80 text-xs mb-6 flex items-center gap-1.5">
          <Check size={12} className="flex-shrink-0" />
          {tx({
            fr: 'Massive contacte le client pour valider le rendu par photo ou video avant chaque envoi.',
            en: 'Massive contacts the client to validate the result by photo or video before each shipment.',
            es: 'Massive contacta al cliente para validar el resultado por foto o video antes de cada envio.',
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

          {/* Config par image */}
          {uploadFiles.length > 0 && (
            <div className="space-y-4">
              {uploadFiles.map((f, i) => {
                const opts = uploadOptions[i] || { type: 'standard' };
                const setOpt = (key, val) => setUploadOptions(prev => ({ ...prev, [i]: { ...opts, [key]: val } }));
                return (
                  <div key={f.id || i} className="rounded-xl bg-black/10 p-3 space-y-2">
                    {/* Titre */}
                    <div className="flex items-center gap-2">
                      <span className="text-grey-muted text-[10px] truncate w-20 flex-shrink-0">{f.name}</span>
                      <input
                        type="text"
                        value={uploadTitles[i] || ''}
                        onChange={(e) => setUploadTitles(prev => ({ ...prev, [i]: e.target.value }))}
                        className="input-field text-sm py-1.5 flex-1"
                        placeholder={tx({ fr: 'Titre de l\'oeuvre', en: 'Artwork title', es: 'Titulo de la obra' })}
                      />
                    </div>

                    {/* Type d'oeuvre (seulement pour prints) */}
                    {uploadCategory === 'prints' && (
                      <>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { id: 'standard', label: 'Standard', icon: null },
                            { id: 'unique', label: tx({ fr: 'Piece unique', en: 'Unique', es: 'Unica' }), icon: Gem },
                            { id: 'limited', label: tx({ fr: 'Edition limitee', en: 'Limited edition', es: 'Edicion limitada' }), icon: Hash },
                            { id: 'private', label: tx({ fr: 'Privee', en: 'Private', es: 'Privada' }), icon: Lock },
                          ].map(t => {
                            const Icon = t.icon;
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => setOpt('type', t.id)}
                                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                                  opts.type === t.id ? 'bg-accent text-white' : 'bg-black/20 text-grey-muted hover:text-heading'
                                }`}
                              >
                                {Icon && <Icon size={10} />}
                                {t.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Mini-configurateur (unique, limitee, privee) */}
                        {(opts.type === 'unique' || opts.type === 'limited' || opts.type === 'private') && (
                          <div className="pl-2 space-y-2 border-l-2 border-accent/30 ml-1">
                            {/* Format */}
                            <div className="flex items-center gap-2">
                              <span className="text-grey-muted text-[9px] uppercase w-14 flex-shrink-0">Format</span>
                              <div className="flex flex-wrap gap-1">
                                {artistFormats.map(f => (
                                  <button key={f.id} type="button" onClick={() => setOpt('fixedFormat', f.id)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                                      (opts.fixedFormat || 'a4') === f.id ? 'bg-accent text-white' : 'bg-black/20 text-grey-muted hover:text-heading'
                                    }`}>{f.short || f.id.toUpperCase()}</button>
                                ))}
                              </div>
                            </div>

                            {/* Tier */}
                            <div className="flex items-center gap-2">
                              <span className="text-grey-muted text-[9px] uppercase w-14 flex-shrink-0">{tx({ fr: 'Qualite', en: 'Quality', es: 'Calidad' })}</span>
                              <div className="flex gap-1">
                                {[{ id: 'studio', label: 'Studio' }, { id: 'museum', label: tx({ fr: 'Musee', en: 'Museum', es: 'Museo' }) }].map(t => (
                                  <button key={t.id} type="button" onClick={() => setOpt('fixedTier', t.id)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                                      (opts.fixedTier || 'studio') === t.id ? 'bg-accent text-white' : 'bg-black/20 text-grey-muted hover:text-heading'
                                    }`}>{t.label}</button>
                                ))}
                              </div>
                            </div>

                            {/* Cadre */}
                            <div className="flex items-center gap-2">
                              <span className="text-grey-muted text-[9px] uppercase w-14 flex-shrink-0">{tx({ fr: 'Cadre', en: 'Frame', es: 'Marco' })}</span>
                              <div className="flex gap-1">
                                {[
                                  { id: 'none', label: tx({ fr: 'Sans', en: 'None', es: 'Sin' }) },
                                  { id: 'black', label: tx({ fr: 'Noir', en: 'Black', es: 'Negro' }) },
                                  { id: 'white', label: tx({ fr: 'Blanc', en: 'White', es: 'Blanco' }) },
                                ].map(c => (
                                  <button key={c.id} type="button" onClick={() => setOpt('frameOption', c.id)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                                      (opts.frameOption || 'none') === c.id ? 'bg-accent text-white' : 'bg-black/20 text-grey-muted hover:text-heading'
                                    }`}>{c.label}</button>
                                ))}
                              </div>
                            </div>

                            {/* Prix */}
                            {(() => {
                              const minP = getMinPrice(opts.fixedFormat || 'a4', opts.fixedTier || 'studio');
                              const isPrivate = opts.type === 'private';
                              return (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-grey-muted text-[9px] uppercase w-14 flex-shrink-0">Prix</span>
                                  <input
                                    type="number"
                                    value={opts.customPrice || ''}
                                    onChange={(e) => setOpt('customPrice', e.target.value)}
                                    placeholder={String(minP)}
                                    className={`w-24 rounded-lg bg-black/20 text-heading text-xs px-2 py-1.5 outline-none border ${
                                      isPrivate && (!opts.customPrice || parseFloat(opts.customPrice) < minP)
                                        ? 'border-red-500/40'
                                        : 'border-white/5'
                                    }`}
                                    min={isPrivate ? minP : 1}
                                  />
                                  <span className="text-grey-muted text-[9px]">
                                    {isPrivate
                                      ? tx({
                                          fr: `Min ${minP}$ (prix ${(opts.fixedTier || 'studio')} ${(opts.fixedFormat || 'a4').toUpperCase()}). Tout ce que tu mets en plus = ta part supplementaire.`,
                                          en: `Min $${minP} (${(opts.fixedTier || 'studio')} ${(opts.fixedFormat || 'a4').toUpperCase()} price). Anything extra = your bonus.`,
                                          es: `Min $${minP}. Extra = tu bono.`,
                                        })
                                      : tx({ fr: 'Laisser vide = prix standard', en: 'Leave empty = standard price', es: 'Dejar vacio = precio estandar' })}
                                  </span>
                                </div>
                              );
                            })()}

                            {/* Nombre d'exemplaires (edition limitee) */}
                            {opts.type === 'limited' && (
                              <div className="flex items-center gap-2">
                                <span className="text-grey-muted text-[9px] uppercase w-14 flex-shrink-0">{tx({ fr: 'Copies', en: 'Copies', es: 'Copias' })}</span>
                                <input
                                  type="number"
                                  value={opts.limitedQty || ''}
                                  onChange={(e) => setOpt('limitedQty', e.target.value)}
                                  placeholder="50"
                                  className="w-20 rounded-lg bg-black/20 text-heading text-xs px-2 py-1.5 outline-none border border-white/5"
                                  min="2"
                                />
                              </div>
                            )}

                            {/* Email client (privee) */}
                            {opts.type === 'private' && (
                              <div className="flex items-center gap-2">
                                <span className="text-grey-muted text-[9px] uppercase w-14 flex-shrink-0">Email</span>
                                <input
                                  type="email"
                                  value={opts.clientEmail || ''}
                                  onChange={(e) => setOpt('clientEmail', e.target.value)}
                                  placeholder={tx({ fr: 'Courriel du client', en: 'Client email', es: 'Email del cliente' })}
                                  className="flex-1 rounded-lg bg-black/20 text-heading text-xs px-2 py-1.5 outline-none border border-white/5"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
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
