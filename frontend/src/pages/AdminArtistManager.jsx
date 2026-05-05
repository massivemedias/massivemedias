// AdminArtistManager - Hub "God Mode" admin : mutations directes sur les artistes
// avec onglets Oeuvres / Finances / Stats.
//
// Routes backend :
//   GET    /admin/artists-list            - liste compacte
//   GET    /admin/artists-detail/:slug    - profil + oeuvres + financials + withdrawals + stats
//   PUT    /admin/artists-profile/:slug   - update profil
//   PUT    /admin/artists-item/:slug/:itemId   - update titre/prix
//   DELETE /admin/artists-item/:slug/:itemId   - hard delete + cleanup images
//   POST   /artist-payments/create        - enregistrer un paiement effectue

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Users, Loader2, ChevronLeft, Trash2, Save, CheckCircle,
  XCircle, Image as ImageIcon, Pencil, DollarSign, Sparkles, TrendingUp,
  BarChart3, Banknote, Eye, Plus, Wallet, Lock, ShieldCheck, Trophy,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import {
  getAdminArtistsList, getAdminArtistDetail, initAdminArtistProfile,
  updateAdminArtistProfile, updateAdminArtistItem, deleteAdminArtistItem,
  createArtistPayment, getCommissions, getArtistTopArtworks,
} from '../services/adminService';
import ActivatePrivateSaleModal from '../components/ActivatePrivateSaleModal';
import artistsHardcoded from '../data/artists';

function AdminArtistManager() {
  const { tx } = useLang();

  const [view, setView] = useState('list'); // 'list' | 'detail'
  const [artists, setArtists] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'sales' | 'balance'

  // FIX-STATS-GOD (avril 2026) : commissions agregees en parallele de la liste
  // pour afficher un bloc "stats globales God Mode" en tete.
  const [commissionsData, setCommissionsData] = useState({ artists: [], loaded: false });

  const [selectedSlug, setSelectedSlug] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('items'); // 'items' | 'finances' | 'stats'

  // Toast global
  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.type === 'error' ? 6500 : 4000);
    return () => clearTimeout(t);
  }, [toast]);
  const showSuccess = (message) => setToast({ type: 'success', message });
  const showError = (err) => {
    const msg = err?.response?.data?.error?.message
      || err?.response?.data?.message
      || err?.message
      || 'Erreur inconnue';
    setToast({ type: 'error', message: msg });
  };

  // ------- Liste -------
  // FIX-COUNT-MOK (3 mai 2026) : la BDD Strapi (api::artist.artist) stocke
  // prints/stickers comme champ JSON. Quand l'admin a cree l'entree initiale
  // mais que les vraies oeuvres ont ete ajoutees seulement dans le file
  // hardcoded artists.js (source de verite produit), le compte backend
  // affichait 1 print pour Mok au lieu des 36 reels.
  // Fix : on merge le listing backend avec artists.js et on prend le MAX
  // des 2 sources pour printsCount/stickersCount. La BDD reste la source
  // pour active/commissionRate/email/etc., mais les counts visibles cote
  // admin reflettent la realite produit.
  const loadList = useCallback(async () => {
    setListLoading(true);
    try {
      const { data } = await getAdminArtistsList();
      const list = Array.isArray(data?.data) ? data.data : [];
      // Index artists.js par slug pour lookup O(1)
      const hardcodedBySlug = {};
      for (const a of artistsHardcoded) {
        if (a.slug) hardcodedBySlug[a.slug] = a;
      }
      const enriched = list.map(item => {
        const hard = item.slug ? hardcodedBySlug[item.slug] : null;
        if (!hard) return item;
        const hardPrintsCount = Array.isArray(hard.prints) ? hard.prints.length : 0;
        const hardStickersCount = Array.isArray(hard.stickers) ? hard.stickers.length : 0;
        return {
          ...item,
          // Override avec le max BDD vs hardcoded - reflet de la realite produit
          printsCount: Math.max(item.printsCount || 0, hardPrintsCount),
          stickersCount: Math.max(item.stickersCount || 0, hardStickersCount),
        };
      });
      setArtists(enriched);
    } catch (err) {
      // DEBUG-CRASH (3 mai 2026) : log brut de l'erreur native pour
      // diagnostic. Inclut response.status, response.data, message, stack.
      // A retirer une fois la cause racine identifiee.
      console.error('[CRASH ADMIN ARTISTS]', err);
      console.error('[CRASH ADMIN ARTISTS] response:', err?.response?.status, err?.response?.data);
      console.error('[CRASH ADMIN ARTISTS] config:', err?.config?.method, err?.config?.url, '- token sent:', !!err?.config?.headers?.Authorization);
      showError(err);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  // Fetch commissions parallele pour le bloc stats globales (list view)
  useEffect(() => {
    let cancelled = false;
    getCommissions()
      .then(({ data }) => {
        if (cancelled) return;
        const arr = Array.isArray(data?.artists) ? data.artists : [];
        setCommissionsData({ artists: arr, loaded: true });
      })
      .catch(() => {
        if (cancelled) return;
        setCommissionsData({ artists: [], loaded: true });
      });
    return () => { cancelled = true; };
  }, []);

  // Map slug -> commissions pour enrichir les cards de la liste
  const commissionBySlug = useMemo(() => {
    const m = {};
    for (const c of commissionsData.artists) m[c.slug] = c;
    return m;
  }, [commissionsData]);

  // Stats globales God Mode (sommes sur tous les artistes)
  const globalStats = useMemo(() => {
    const a = commissionsData.artists;
    const totalRevenue = a.reduce((s, x) => s + (Number(x.totalSales) || 0), 0);
    const artistsMargin = a.reduce((s, x) => s + (Number(x.totalCommission) || 0), 0);
    const totalPaid = a.reduce((s, x) => s + (Number(x.totalPaid) || 0), 0);
    const totalBalance = a.reduce((s, x) => s + (Number(x.balance) || 0), 0);
    const massiveMargin = Math.max(0, totalRevenue - artistsMargin);
    return {
      totalRevenue,
      artistsMargin,
      massiveMargin,
      totalPaid,
      totalBalance,
    };
  }, [commissionsData]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q
      ? artists.filter(a =>
          (a.name || '').toLowerCase().includes(q)
          || (a.slug || '').toLowerCase().includes(q)
          || (a.email || '').toLowerCase().includes(q))
      : artists;

    // Tri selon le critere choisi. Les enrichissements viennent de commissionBySlug.
    const withStats = base.map(a => ({
      ...a,
      _sales: commissionBySlug?.[a.slug]?.totalSales || 0,
      _balance: commissionBySlug?.[a.slug]?.balance || 0,
    }));
    if (sortBy === 'sales') return [...withStats].sort((x, y) => y._sales - x._sales);
    if (sortBy === 'balance') return [...withStats].sort((x, y) => y._balance - x._balance);
    return [...withStats].sort((x, y) => (x.name || '').localeCompare(y.name || ''));
  }, [artists, search, sortBy, commissionBySlug]);

  // ------- Detail -------
  // FIX-INCOMPLETE-DETAIL (3 mai 2026) : pour les artistes qui ont un
  // user-role role='artist' mais aucun api::artist.artist (flag incomplete=
  // true dans la liste God Mode), le backend retourne 404 -> avant, on
  // affichait un toast d'erreur bloquant + spinner infini. Maintenant on
  // intercepte le 404 et on rebascule sur les donnees minimales connues
  // depuis la liste, avec un flag _incomplete=true qui declenche la vue
  // d'initialisation cote UI.
  // FIX-DETAIL-MERGE (4 mai 2026) : meme strategie de merge que loadList -
  // le panel God Mode doit afficher TOUTES les oeuvres + bio + pricing +
  // socials de chaque artiste. La BDD Strapi ne contient que la coquille
  // initiale (ex: Mok = 1 print en BDD) tandis que artists.js hardcoded
  // detient la source de verite produit (ex: Mok = 36 prints).
  // Strategie merge :
  //   - Backend BDD : source pour active/commissionRate/email/createdByEmail
  //   - artists.js : source pour prints/stickers/bio/tagline/pricing/socials
  //     (uniquement utilise si la BDD est vide ou plus pauvre)
  //   - Marquage _hardcodedFallback : true sur les items issus du fallback
  //     pour que l'UI puisse afficher un badge "data hardcoded"
  const loadDetail = useCallback(async (slug, fallbackEntry) => {
    setDetailLoading(true);
    try {
      // Lookup hardcoded data en parallele
      const hard = (slug && artistsHardcoded && typeof artistsHardcoded === 'object')
        ? (artistsHardcoded[slug] || null)
        : null;

      let backendDetail = null;
      try {
        const { data } = await getAdminArtistDetail(slug);
        backendDetail = data?.data || null;
      } catch (err) {
        const status = err?.response?.status;
        if (status === 404) {
          // 404 attendu pour les artists incomplete OU artists qui n'ont
          // pas encore de api::artist.artist - on rebascule sur hardcoded.
          backendDetail = null;
        } else {
          throw err; // erreur reseau/auth -> remonte au catch global
        }
      }

      // Si rien en backend ET rien en hardcoded -> mode incomplete
      if (!backendDetail && !hard) {
        setDetail({
          _incomplete: true,
          slug: fallbackEntry?.slug || slug || '',
          name: fallbackEntry?.name || '',
          email: fallbackEntry?.email || '',
          active: false,
          commissionRate: fallbackEntry?.commissionRate ?? 0.5,
          prints: [],
          stickers: [],
        });
        setDetailLoading(false);
        return;
      }

      // Merge defensif : backend prime sur les champs admin, hardcoded
      // prend le relais pour le contenu produit si plus riche.
      const safeArr = (a) => Array.isArray(a) ? a : [];
      const backendPrints = safeArr(backendDetail?.prints);
      const backendStickers = safeArr(backendDetail?.stickers);
      const hardPrints = safeArr(hard?.prints);
      const hardStickers = safeArr(hard?.stickers);
      // On garde celui qui a le plus d'items (et on tag les hardcoded)
      const finalPrints = hardPrints.length > backendPrints.length
        ? hardPrints.map(p => ({ ...p, _hardcodedFallback: true }))
        : backendPrints;
      const finalStickers = hardStickers.length > backendStickers.length
        ? hardStickers.map(s => ({ ...s, _hardcodedFallback: true }))
        : backendStickers;

      setDetail({
        ...(hard || {}),       // socials/pricing/tagline depuis hardcoded
        ...(backendDetail || {}), // backend prime pour active/commission/email/etc.
        // Si backend n'a pas la bio, fallback sur hardcoded (objet { fr, en, es })
        bioFr: backendDetail?.bioFr || hard?.bio?.fr || '',
        bioEn: backendDetail?.bioEn || hard?.bio?.en || '',
        bioEs: backendDetail?.bioEs || hard?.bio?.es || '',
        taglineFr: backendDetail?.taglineFr || hard?.tagline?.fr || '',
        taglineEn: backendDetail?.taglineEn || hard?.tagline?.en || '',
        taglineEs: backendDetail?.taglineEs || hard?.tagline?.es || '',
        prints: finalPrints,
        stickers: finalStickers,
        // Flag pour l'UI : si on utilise du hardcoded, l'admin doit le savoir
        _hasHardcodedFallback: (
          (hardPrints.length > backendPrints.length) ||
          (hardStickers.length > backendStickers.length)
        ),
      });
    } catch (err) {
      console.error('[ADMIN ARTISTS] loadDetail failed:', err);
      showError(err);
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const openArtist = (entry) => {
    // entry peut etre un objet artist (depuis la liste) ou un string (legacy)
    const artist = typeof entry === 'string' ? { slug: entry } : entry;
    const slug = artist.slug || '';
    setSelectedSlug(slug);
    setView('detail');
    setDetail(null);
    setActiveTab('items');

    if (artist.incomplete || !slug) {
      // Bypass backend - vue d'init directe avec les infos de la liste.
      setDetail({
        _incomplete: true,
        slug,
        name: artist.name || '',
        email: artist.email || '',
        active: false,
        commissionRate: 0.5,
        prints: [],
        stickers: [],
      });
      setDetailLoading(false);
      return;
    }
    loadDetail(slug, artist);
  };

  // ------- Init profil artiste (artist incomplete) -------
  const [initSaving, setInitSaving] = useState(false);
  const handleInitProfile = async () => {
    if (!detail?._incomplete) return;
    if (!detail.email) {
      showError(new Error('Email manquant - impossible d\'initialiser le profil'));
      return;
    }
    setInitSaving(true);
    try {
      const { data } = await initAdminArtistProfile({
        email: detail.email,
        name: detail.name || undefined,
        slug: detail.slug || undefined,
      });
      const created = data?.data;
      if (!created?.slug) throw new Error('Reponse backend invalide (slug manquant)');
      showSuccess(tx({
        fr: `Profil artiste cree (slug: ${created.slug})`,
        en: `Artist profile created (slug: ${created.slug})`,
        es: `Perfil de artista creado (slug: ${created.slug})`,
      }));
      // Refresh la liste + ouvre le detail complet du nouveau profil
      loadList();
      setSelectedSlug(created.slug);
      loadDetail(created.slug);
    } catch (err) {
      showError(err);
    } finally {
      setInitSaving(false);
    }
  };

  const backToList = () => {
    setView('list');
    setSelectedSlug(null);
    setDetail(null);
  };

  // ------- Profil -------
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileDraft, setProfileDraft] = useState(null);
  useEffect(() => { setProfileDraft(null); }, [selectedSlug]);

  const handleProfileField = (field, value) => {
    setProfileDraft(prev => ({ ...(prev || {}), [field]: value }));
  };

  const saveProfile = async () => {
    if (!detail || !profileDraft || Object.keys(profileDraft).length === 0) return;

    // OPTIMISTIC UI : patch local IMMEDIATE avant l'appel reseau.
    // L'admin voit les changements instantanement. Si l'API echoue, on rollback au
    // snapshot pris ci-dessous.
    const snapshot = detail;
    setDetail(prev => ({ ...prev, ...profileDraft }));

    setProfileSaving(true);
    try {
      await updateAdminArtistProfile(detail.slug, profileDraft);
      showSuccess(tx({
        fr: `Profil de ${detail.name} mis a jour.`,
        en: `${detail.name}'s profile updated.`,
        es: `Perfil de ${detail.name} actualizado.`,
      }));
      setProfileDraft(null);
      // Refresh silencieux pour resync avec la BDD (ecrase l'optimistic si divergence)
      loadDetail(detail.slug);
      loadList();
    } catch (err) {
      // ROLLBACK : restaurer le snapshot
      setDetail(snapshot);
      showError(err);
    } finally {
      setProfileSaving(false);
    }
  };

  // ------- Items (edit + delete + private sale) -------
  const [editingItem, setEditingItem] = useState(null);
  const [itemSaving, setItemSaving] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  // Private sale modal : { item, category } OU null
  const [privateSaleTarget, setPrivateSaleTarget] = useState(null);

  const openEditItem = (item, category) => {
    setEditingItem({
      id: item.id,
      category,
      titleFr: item.titleFr || item.titleEn || '',
      customPrice: item.customPrice != null ? String(item.customPrice) : '',
    });
  };

  const saveItem = async () => {
    if (!editingItem || !detail) return;
    const patch = { category: editingItem.category, titleFr: editingItem.titleFr, titleEn: editingItem.titleFr };
    if (editingItem.customPrice !== '' && editingItem.customPrice != null) {
      const p = parseFloat(String(editingItem.customPrice).replace(',', '.'));
      if (!Number.isFinite(p) || p < 0) { showError(new Error('Prix invalide')); return; }
      patch.customPrice = p;
    }

    // OPTIMISTIC UI : patch local du item concerne dans detail.prints ou detail.stickers
    const snapshot = detail;
    const cat = editingItem.category;
    setDetail(prev => {
      if (!prev || !Array.isArray(prev[cat])) return prev;
      const updated = prev[cat].map(it => it.id === editingItem.id
        ? { ...it, titleFr: patch.titleFr, titleEn: patch.titleEn, customPrice: patch.customPrice }
        : it);
      return { ...prev, [cat]: updated };
    });

    setItemSaving(true);
    try {
      await updateAdminArtistItem(detail.slug, editingItem.id, patch);
      showSuccess(tx({ fr: `Oeuvre ${editingItem.id} mise a jour.`, en: `Item ${editingItem.id} updated.`, es: `Obra ${editingItem.id} actualizada.` }));
      setEditingItem(null);
      // Refresh silencieux pour sync
      loadDetail(detail.slug);
    } catch (err) {
      // ROLLBACK
      setDetail(snapshot);
      showError(err);
    } finally {
      setItemSaving(false);
    }
  };

  const deleteItem = async (item, category) => {
    if (!detail) return;
    const label = item.titleFr || item.titleEn || item.id;
    const confirmMsg = tx({
      fr: `Supprimer DEFINITIVEMENT "${label}" (${item.id}) de ${detail.name}?\n\nImage Supabase aussi supprimee.\nIrreversible.`,
      en: `PERMANENTLY delete "${label}" (${item.id}) from ${detail.name}?\n\nSupabase image also deleted.\nCannot be undone.`,
      es: `Eliminar DEFINITIVAMENTE "${label}"?`,
    });
    if (!window.confirm(confirmMsg)) return;

    // OPTIMISTIC UI : retirer l'item du state local IMMEDIATEMENT pour que
    // l'admin voie la disparition visuelle sans attendre l'API.
    const snapshot = detail;
    setDetail(prev => {
      if (!prev || !Array.isArray(prev[category])) return prev;
      return { ...prev, [category]: prev[category].filter(it => it.id !== item.id) };
    });

    setDeletingItem(item.id);
    try {
      await deleteAdminArtistItem(detail.slug, item.id, category);
      showSuccess(tx({ fr: `"${label}" supprimee.`, en: `"${label}" deleted.`, es: `"${label}" eliminada.` }));
      // Refresh silencieux pour confirmer sync avec BDD + updater counts dans la liste
      loadDetail(detail.slug);
      loadList();
    } catch (err) {
      // ROLLBACK si l'API refuse
      setDetail(snapshot);
      showError(err);
    } finally {
      setDeletingItem(null);
    }
  };

  // ------- Payment (marquer un paiement effectue) -------
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentDraft, setPaymentDraft] = useState({ amount: '', method: 'interac', date: new Date().toISOString().split('T')[0], notes: '' });
  const [paymentSaving, setPaymentSaving] = useState(false);

  const handleMarkPayment = async () => {
    if (!detail) return;
    const amount = parseFloat(String(paymentDraft.amount).replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) {
      showError(new Error(tx({ fr: 'Montant invalide', en: 'Invalid amount', es: 'Monto invalido' })));
      return;
    }
    setPaymentSaving(true);
    try {
      await createArtistPayment({
        artistSlug: detail.slug,
        artistName: detail.name,
        amount,
        method: paymentDraft.method,
        date: paymentDraft.date,
        notes: paymentDraft.notes || '',
      });
      showSuccess(tx({
        fr: `Paiement de ${amount}$ enregistre pour ${detail.name}.`,
        en: `Payment of $${amount} recorded for ${detail.name}.`,
        es: `Pago de ${amount}$ registrado para ${detail.name}.`,
      }));
      setShowPaymentForm(false);
      setPaymentDraft({ amount: '', method: 'interac', date: new Date().toISOString().split('T')[0], notes: '' });
      await loadDetail(detail.slug);
    } catch (err) {
      showError(err);
    } finally {
      setPaymentSaving(false);
    }
  };

  // ================= RENDER =================

  const ToastView = (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className={`fixed bottom-6 right-6 z-[9999] max-w-sm rounded-xl shadow-2xl px-4 py-3 flex items-start gap-3 border ${
            toast.type === 'success' ? 'bg-green-600/95 border-green-400/60' : 'bg-red-600/95 border-red-400/60'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle size={20} className="text-white flex-shrink-0 mt-0.5" /> : <XCircle size={20} className="text-white flex-shrink-0 mt-0.5" />}
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">{toast.type === 'success' ? tx({ fr: 'Succes', en: 'Success', es: 'Exito' }) : tx({ fr: 'Erreur', en: 'Error', es: 'Error' })}</p>
            <p className="text-white/90 text-xs mt-0.5 whitespace-pre-wrap">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-white/70 hover:text-white"><XCircle size={16} /></button>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ----- LIST VIEW -----
  if (view === 'list') {
    return (
      <div className="space-y-6">
        {ToastView}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-accent" />
            <h2 className="text-xl font-heading font-bold text-heading">
              {tx({ fr: 'Gestion Artistes (God Mode)', en: 'Artist Management (God Mode)', es: 'Gestion Artistas' })}
            </h2>
          </div>
          {/* Badge "acces admin" : design sleek, fond semi-transparent tres sombre
              (bg-black/40), bordure subtile (border-white/10), texte gris clair
              (text-slate-200), icone ShieldCheck neutre. Zero emoji, zero couleur
              or/jaune, s'integre parfaitement au theme sombre Massive. */}
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-black/40 text-slate-200 border border-white/10 px-2.5 py-1 rounded-lg backdrop-blur-sm">
            <ShieldCheck size={13} className="text-slate-300" strokeWidth={2} />
            {tx({
              fr: 'Acces Administrateur Total',
              en: 'Total Admin Access',
              es: 'Acceso de Administrador Total',
            })}
          </span>
        </div>
        {/* ===== STATS GLOBALES GOD MODE =====
            4 cartes agregees sur TOUS les artistes actifs :
              - Revenus generes (somme totalSales)
              - Part Massive (revenus - commissions totales)
              - Part Artistes (somme totalCommission due)
              - Balance due (commissions non encore payees) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl card-bg p-3 md:p-4 border border-accent/15">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign size={14} className="text-accent" />
              <span className="text-grey-muted text-[10px] md:text-xs uppercase tracking-wider">
                {tx({ fr: 'Revenus generes', en: 'Total revenue', es: 'Ingresos' })}
              </span>
            </div>
            <span className="text-lg md:text-xl font-heading font-bold text-heading">
              {commissionsData.loaded ? `${Math.round(globalStats.totalRevenue)}$` : <Loader2 size={16} className="animate-spin text-grey-muted" />}
            </span>
          </div>
          <div className="rounded-xl card-bg p-3 md:p-4 border border-green-500/15">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp size={14} className="text-green-400" />
              <span className="text-grey-muted text-[10px] md:text-xs uppercase tracking-wider">
                {tx({ fr: 'Part Massive', en: 'Massive margin', es: 'Margen Massive' })}
              </span>
            </div>
            <span className="text-lg md:text-xl font-heading font-bold text-green-400">
              {commissionsData.loaded ? `${Math.round(globalStats.massiveMargin)}$` : '-'}
            </span>
          </div>
          <div className="rounded-xl card-bg p-3 md:p-4 border border-purple-500/15">
            <div className="flex items-center gap-1.5 mb-1">
              <Banknote size={14} className="text-purple-400" />
              <span className="text-grey-muted text-[10px] md:text-xs uppercase tracking-wider">
                {tx({ fr: 'Part Artistes', en: 'Artists margin', es: 'Margen Artistas' })}
              </span>
            </div>
            <span className="text-lg md:text-xl font-heading font-bold text-purple-400">
              {commissionsData.loaded ? `${Math.round(globalStats.artistsMargin)}$` : '-'}
            </span>
          </div>
          <div className="rounded-xl card-bg p-3 md:p-4 border border-yellow-500/15">
            <div className="flex items-center gap-1.5 mb-1">
              <Wallet size={14} className="text-yellow-400" />
              <span className="text-grey-muted text-[10px] md:text-xs uppercase tracking-wider">
                {tx({ fr: 'A payer aux artistes', en: 'Owed to artists', es: 'Por pagar' })}
              </span>
            </div>
            <span className="text-lg md:text-xl font-heading font-bold text-yellow-400">
              {commissionsData.loaded ? `${Math.round(globalStats.totalBalance)}$` : '-'}
            </span>
          </div>
        </div>

        {/* Search + sort */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tx({ fr: 'Chercher un artiste...', en: 'Search artist...', es: 'Buscar artista...' })}
              className="input-field text-sm w-full pl-9"
            />
          </div>
          <div className="flex items-center gap-1 card-bg rounded-xl p-1">
            {[
              { id: 'name',    label: tx({ fr: 'Nom',     en: 'Name',     es: 'Nombre' }) },
              { id: 'sales',   label: tx({ fr: 'Ventes',  en: 'Sales',    es: 'Ventas' }) },
              { id: 'balance', label: tx({ fr: 'A payer', en: 'Owed',     es: 'Por pagar' }) },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setSortBy(opt.id)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                  sortBy === opt.id ? 'bg-accent text-white' : 'text-grey-muted hover:text-heading'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {listLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-accent" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-grey-muted py-12">{tx({ fr: 'Aucun artiste.', en: 'No artists.', es: 'Sin artistas.' })}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(a => (
              <button key={a.documentId || `incomplete-${a.email || a.slug || Math.random()}`} onClick={() => openArtist(a)}
                className={`text-left card-bg rounded-xl p-4 hover:bg-accent/5 transition-colors border ${a.incomplete ? 'border-yellow-500/30 hover:border-yellow-500/60' : 'border-white/5 hover:border-accent/40'}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-heading font-semibold text-base">{a.name}</h3>
                    <p className="text-grey-muted text-xs">{a.slug || a.email || '(profil non initialise)'}</p>
                  </div>
                  {a.incomplete
                    ? <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">{tx({ fr: 'À compléter', en: 'Incomplete', es: 'Por completar' })}</span>
                    : !a.active && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded">{tx({ fr: 'Inactif', en: 'Inactive', es: 'Inactivo' })}</span>}
                </div>
                {a.email && <p className="text-xs text-grey-muted truncate">{a.email}</p>}
                <div className="flex items-center gap-3 mt-3 text-xs">
                  <span className="inline-flex items-center gap-1 text-heading"><ImageIcon size={11} className="text-accent" />{a.printsCount} prints</span>
                  <span className="inline-flex items-center gap-1 text-heading"><Sparkles size={11} className="text-purple-400" />{a.stickersCount} stickers</span>
                </div>
                {/* Enrichissement stats (avril 2026) : revenus + balance due */}
                {commissionsData.loaded && (a._sales > 0 || a._balance > 0) && (
                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                    <span className="inline-flex items-center gap-1 text-green-400 font-semibold">
                      <DollarSign size={10} />{Math.round(a._sales)}$ {tx({ fr: 'vendu', en: 'sold', es: 'vendido' })}
                    </span>
                    {a._balance > 0 && (
                      <span className="inline-flex items-center gap-1 text-yellow-400 font-semibold">
                        {Math.round(a._balance)}$ {tx({ fr: 'a payer', en: 'owed', es: 'por pagar' })}
                      </span>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ----- DETAIL VIEW -----
  return (
    <div className="space-y-6">
      {ToastView}
      <button onClick={backToList} className="inline-flex items-center gap-1.5 text-grey-muted hover:text-heading text-sm">
        <ChevronLeft size={14} /> {tx({ fr: 'Retour', en: 'Back', es: 'Volver' })}
      </button>
      {detailLoading || !detail ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-accent" /></div>
      ) : detail._incomplete ? (
        // VUE INCOMPLETE : artist promu mais sans api::artist.artist record.
        // L'admin peut initialiser le profil pour debloquer le detail complet.
        <div className="space-y-5">
          <div className="card-bg rounded-2xl p-6 border border-yellow-500/30">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-lg bg-yellow-500/15 flex-shrink-0">
                <Loader2 size={20} className="text-yellow-400" />
              </div>
              <div>
                <h2 className="text-xl font-heading font-bold text-heading">{detail.name || tx({ fr: '(Sans nom)', en: '(No name)', es: '(Sin nombre)' })}</h2>
                {detail.email && <p className="text-grey-muted text-sm mt-0.5">{detail.email}</p>}
                <span className="inline-block mt-2 text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded uppercase font-semibold">
                  {tx({ fr: 'Profil à compléter', en: 'Incomplete profile', es: 'Perfil por completar' })}
                </span>
              </div>
            </div>
            <p className="text-grey-muted text-sm leading-relaxed mb-4">
              {tx({
                fr: "Ce compte a le rôle 'artiste' mais aucun profil détaillé n'existe encore (pas d'entrée dans la collection api::artist.artist). Initialise le profil pour débloquer la gestion des prints, stickers, bio, commission et statistiques.",
                en: "This account has the 'artist' role but no detailed profile exists yet (no api::artist.artist record). Initialize the profile to unlock prints, stickers, bio, commission and stats management.",
                es: "Esta cuenta tiene el rol 'artista' pero aún no existe un perfil detallado (sin registro api::artist.artist). Inicializa el perfil para desbloquear la gestión de prints, stickers, biografía, comisión y estadísticas.",
              })}
            </p>
            <button
              type="button"
              onClick={handleInitProfile}
              disabled={initSaving || !detail.email}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {initSaving ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {tx({ fr: 'Initialiser le profil artiste', en: 'Initialize artist profile', es: 'Inicializar perfil de artista' })}
            </button>
            {!detail.email && (
              <p className="mt-3 text-xs text-red-400">
                {tx({
                  fr: 'Email manquant - impossible d\'initialiser. Vérifier le user-role dans /admin/utilisateurs.',
                  en: 'Email missing - cannot initialize. Check the user-role in /admin/utilisateurs.',
                  es: 'Email faltante - no se puede inicializar. Verificar el user-role.',
                })}
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-heading font-bold text-heading">{detail.name}</h2>
              <p className="text-grey-muted text-sm">/artistes/{detail.slug}</p>
              {detail.email && <p className="text-grey-muted text-xs mt-1">{detail.email}</p>}
              {/* COUNT-VISIBLE (4 mai 2026) : compteurs explicites de prints +
                  stickers + autres data importantes (bio, socials) pour que
                  l'admin voie d'un coup d'oeil ce qui est dispo. */}
              <div className="flex items-center gap-3 mt-2 text-xs">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent/15 text-accent font-semibold">
                  <ImageIcon size={11} />
                  {(detail.prints || []).length} prints
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 font-semibold">
                  <Sparkles size={11} />
                  {(detail.stickers || []).length} stickers
                </span>
                {(detail.bioFr || detail.bioEn || detail.bioEs) && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-500/15 text-green-400 font-semibold">
                    <CheckCircle size={11} />
                    bio
                  </span>
                )}
                {detail.socials && Object.keys(detail.socials).length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 font-semibold">
                    <CheckCircle size={11} />
                    {Object.keys(detail.socials).length} socials
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded ${detail.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {detail.active ? tx({ fr: 'Actif', en: 'Active', es: 'Activo' }) : tx({ fr: 'Inactif', en: 'Inactive', es: 'Inactivo' })}
              </span>
              <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">
                {tx({ fr: 'Prints', en: 'Prints', es: 'Prints' })}: {Math.round((detail.printCommissionRate ?? detail.commissionRate ?? 0.5) * 100)}%
              </span>
              <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                {tx({ fr: 'Stickers', en: 'Stickers', es: 'Stickers' })}: {Math.round((detail.stickerCommissionRate ?? 0.15) * 100)}%
              </span>
            </div>
          </div>

          {/* HARDCODED-WARN (4 mai 2026) : si on a fallback sur artists.js
              hardcoded pour les prints/stickers (BDD vide ou plus pauvre),
              on prevent l'admin que les modifs via cette UI ne touchent
              QUE la BDD - pour synchroniser les data hardcoded il faut
              passer par src/data/artists.js (ou un script de sync). */}
          {detail._hasHardcodedFallback && (
            <div className="rounded-lg p-3 bg-yellow-500/10 border border-yellow-500/30 text-xs text-yellow-200/90 leading-relaxed">
              <strong className="text-yellow-300">Données depuis artists.js :</strong> les prints / stickers visibles ci-dessous proviennent du fichier source <code className="px-1 rounded bg-black/30">frontend/src/data/artists.js</code> (la BDD Strapi en a moins ou aucun). Les modifications faites ici écrivent dans la BDD - pour synchroniser le file hardcoded, modifier directement <code className="px-1 rounded bg-black/30">artists.js</code>.
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-white/10 flex items-center gap-0 flex-wrap">
            <TabBtn active={activeTab === 'items'} onClick={() => setActiveTab('items')} icon={ImageIcon}
              label={tx({ fr: 'Oeuvres & Profil', en: 'Items & Profile', es: 'Obras y Perfil' })} />
            <TabBtn active={activeTab === 'finances'} onClick={() => setActiveTab('finances')} icon={Banknote}
              label={tx({ fr: 'Finances & Payouts', en: 'Finances & Payouts', es: 'Finanzas y Pagos' })}
              badge={detail.financials?.balance > 0 ? `${detail.financials.balance.toFixed(2)}$` : null} />
            <TabBtn active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={BarChart3}
              label={tx({ fr: 'Stats & Trafic', en: 'Stats & Traffic', es: 'Stats y Trafico' })} />
          </div>

          {/* ===== TAB 1: ITEMS & PROFILE ===== */}
          {activeTab === 'items' && (
            <div className="space-y-4">
              {/* Profil */}
              <div className="card-bg rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-heading font-semibold text-sm uppercase tracking-wider">{tx({ fr: 'Profil', en: 'Profile', es: 'Perfil' })}</h3>
                  {profileDraft && Object.keys(profileDraft).length > 0 && (
                    <button onClick={saveProfile} disabled={profileSaving}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent/80 disabled:opacity-50">
                      {profileSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      {tx({ fr: 'Enregistrer', en: 'Save', es: 'Guardar' })}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <InputField label="Nom" value={profileDraft?.name ?? detail.name} onChange={v => handleProfileField('name', v)} />
                  <InputField label="Email" value={profileDraft?.email ?? detail.email} onChange={v => handleProfileField('email', v)} />
                  <InputField label="Tagline FR" value={profileDraft?.taglineFr ?? detail.taglineFr} onChange={v => handleProfileField('taglineFr', v)} />
                  <InputField label="Tagline EN" value={profileDraft?.taglineEn ?? detail.taglineEn} onChange={v => handleProfileField('taglineEn', v)} />
                  <InputField label="Tagline ES" value={profileDraft?.taglineEs ?? detail.taglineEs} onChange={v => handleProfileField('taglineEs', v)} />
                  <TextareaField label="Bio FR" value={profileDraft?.bioFr ?? detail.bioFr} onChange={v => handleProfileField('bioFr', v)} />
                  <TextareaField label="Bio EN" value={profileDraft?.bioEn ?? detail.bioEn} onChange={v => handleProfileField('bioEn', v)} />
                  <TextareaField label="Bio ES" value={profileDraft?.bioEs ?? detail.bioEs} onChange={v => handleProfileField('bioEs', v)} />
                  {/* FIX-COMMISSIONS (avril 2026) : deux champs distincts Prints /
                      Stickers. Le legacy `commissionRate` est conserve en BDD
                      comme fallback mais n'est plus edite depuis l'UI God Mode. */}
                  <InputField
                    label={tx({ fr: 'Commission Prints (0-1 = %)', en: 'Prints commission (0-1 = %)', es: 'Comision Prints (0-1)' })}
                    type="number" step="0.01" min="0" max="1"
                    value={profileDraft?.printCommissionRate ?? detail.printCommissionRate ?? detail.commissionRate ?? 0.5}
                    onChange={v => handleProfileField('printCommissionRate', parseFloat(v))} />
                  <InputField
                    label={tx({ fr: 'Commission Stickers (0-1 = %)', en: 'Stickers commission (0-1 = %)', es: 'Comision Stickers (0-1)' })}
                    type="number" step="0.01" min="0" max="1"
                    value={profileDraft?.stickerCommissionRate ?? detail.stickerCommissionRate ?? 0.15}
                    onChange={v => handleProfileField('stickerCommissionRate', parseFloat(v))} />
                  <div>
                    <label className="text-xs text-grey-muted block mb-1">{tx({ fr: 'Actif', en: 'Active', es: 'Activo' })}</label>
                    <select value={(profileDraft?.active ?? detail.active) ? 'true' : 'false'}
                      onChange={e => handleProfileField('active', e.target.value === 'true')}
                      className="input-field text-sm w-full">
                      <option value="true">{tx({ fr: 'Oui', en: 'Yes', es: 'Si' })}</option>
                      <option value="false">{tx({ fr: 'Non', en: 'No', es: 'No' })}</option>
                    </select>
                  </div>
                </div>
              </div>
              <ItemsGrid category="prints" items={detail.prints} onEdit={(it) => openEditItem(it, 'prints')}
                onDelete={(it) => deleteItem(it, 'prints')}
                onPrivateSale={(it) => setPrivateSaleTarget({ item: it, category: 'prints' })}
                deletingItemId={deletingItem} tx={tx} />
              <ItemsGrid category="stickers" items={detail.stickers} onEdit={(it) => openEditItem(it, 'stickers')}
                onDelete={(it) => deleteItem(it, 'stickers')}
                onPrivateSale={(it) => setPrivateSaleTarget({ item: it, category: 'stickers' })}
                deletingItemId={deletingItem} tx={tx} />
            </div>
          )}

          {/* ===== TAB 2: FINANCES & PAYOUTS ===== */}
          {activeTab === 'finances' && (
            <FinancesTab
              detail={detail}
              tx={tx}
              onMarkPayment={() => setShowPaymentForm(true)}
              showPaymentForm={showPaymentForm}
              setShowPaymentForm={setShowPaymentForm}
              paymentDraft={paymentDraft}
              setPaymentDraft={setPaymentDraft}
              handleMarkPayment={handleMarkPayment}
              paymentSaving={paymentSaving}
            />
          )}

          {/* ===== TAB 3: STATS ===== */}
          {activeTab === 'stats' && <StatsTab detail={detail} tx={tx} />}

          {/* Edit item modal */}
          <AnimatePresence>
            {editingItem && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setEditingItem(null)}
                className="fixed inset-0 z-[9500] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                  onClick={e => e.stopPropagation()}
                  className="bg-[#1a0030] rounded-2xl border border-white/10 shadow-2xl p-5 max-w-md w-full space-y-4">
                  <h3 className="text-heading font-bold text-base">
                    {tx({ fr: 'Editer l\'oeuvre', en: 'Edit item', es: 'Editar obra' })}
                    <span className="text-xs text-grey-muted ml-2 font-mono">{editingItem.id}</span>
                  </h3>
                  <InputField label={tx({ fr: 'Titre', en: 'Title', es: 'Titulo' })}
                    value={editingItem.titleFr} onChange={v => setEditingItem(prev => ({ ...prev, titleFr: v }))} />
                  <InputField label={tx({ fr: 'Prix custom ($) - 0 pour standard', en: 'Custom price', es: 'Precio' })}
                    type="number" step="0.01" min="0"
                    value={editingItem.customPrice}
                    onChange={v => setEditingItem(prev => ({ ...prev, customPrice: v }))} />
                  <div className="flex gap-2">
                    <button onClick={() => setEditingItem(null)} className="flex-1 py-2 rounded-lg bg-white/5 text-grey-muted text-sm hover:bg-white/10">
                      {tx({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' })}
                    </button>
                    <button onClick={saveItem} disabled={itemSaving}
                      className="flex-[2] py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/80 disabled:opacity-50 flex items-center justify-center gap-2">
                      {itemSaving && <Loader2 size={14} className="animate-spin" />}
                      {tx({ fr: 'Enregistrer', en: 'Save', es: 'Guardar' })}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Modal activation vente privee (3 clics : email + prix + checkbox) */}
          {privateSaleTarget && (
            <ActivatePrivateSaleModal
              artistSlug={detail.slug}
              item={privateSaleTarget.item}
              category={privateSaleTarget.category}
              onClose={() => setPrivateSaleTarget(null)}
              onActivated={(result) => {
                // Optimistic update : marquer l'item comme prive dans le state local
                setDetail(prev => {
                  if (!prev || !Array.isArray(prev[privateSaleTarget.category])) return prev;
                  const updated = prev[privateSaleTarget.category].map(it => it.id === privateSaleTarget.item.id
                    ? { ...it, private: true, clientEmail: result.clientEmail, basePrice: result.basePrice, allowCustomPrice: result.allowCustomPrice, privateToken: result.token }
                    : it);
                  return { ...prev, [privateSaleTarget.category]: updated };
                });
                showSuccess(result.emailSent
                  ? tx({
                      fr: `Vente privee activee - courriel envoye a ${result.clientEmail}.`,
                      en: `Private sale activated - email sent to ${result.clientEmail}.`,
                      es: `Venta privada activada - correo enviado.`,
                    })
                  : tx({
                      fr: `Vente activee mais l'envoi de courriel a echoue. Copiez le lien et envoyez-le manuellement.`,
                      en: `Sale activated but email failed. Copy the link and send manually.`,
                      es: `Venta activada pero el correo fallo.`,
                    }));
                // Refresh silencieux (ne touche pas au privateSaleTarget - on reste sur l'ecran de succes du modal)
                loadDetail(detail.slug);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

// ================== SUB COMPONENTS ==================

function TabBtn({ active, onClick, icon: Icon, label, badge }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
        active ? 'border-accent text-accent' : 'border-transparent text-grey-muted hover:text-heading'
      }`}
    >
      <Icon size={14} />
      {label}
      {badge && <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">{badge}</span>}
    </button>
  );
}

function InputField({ label, value, onChange, type = 'text', ...rest }) {
  return (
    <div>
      <label className="text-xs text-grey-muted block mb-1">{label}</label>
      <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)}
        className="input-field text-sm w-full" {...rest} />
    </div>
  );
}

function TextareaField({ label, value, onChange }) {
  return (
    <div className="md:col-span-2">
      <label className="text-xs text-grey-muted block mb-1">{label}</label>
      <textarea value={value ?? ''} onChange={e => onChange(e.target.value)} rows={3}
        className="input-field text-sm w-full resize-none" />
    </div>
  );
}

function ItemsGrid({ category, items, onEdit, onDelete, onPrivateSale, deletingItemId, tx }) {
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div className="card-bg rounded-xl p-4">
        <h3 className="text-heading font-semibold text-sm uppercase tracking-wider mb-2">{category}</h3>
        <p className="text-grey-muted text-xs">{tx({ fr: 'Aucune oeuvre.', en: 'No items.', es: 'Sin obras.' })}</p>
      </div>
    );
  }
  return (
    <div className="card-bg rounded-xl p-4">
      <h3 className="text-heading font-semibold text-sm uppercase tracking-wider mb-3">{category} ({items.length})</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {items.map(item => (
          <div key={item.id} className="relative rounded-lg overflow-hidden bg-black/20 border border-white/5 group">
            <div className="aspect-square bg-black/30">
              {item.image
                ? <img src={item.image} alt={item.titleFr || item.id} className="w-full h-full object-cover" loading="lazy" />
                : <div className="w-full h-full flex items-center justify-center text-grey-muted text-[10px]">{item.id}</div>}
            </div>
            <div className="p-2">
              <p className="text-[11px] text-heading font-semibold truncate">{item.titleFr || item.titleEn || item.id}</p>
              <p className="text-[9px] text-grey-muted font-mono truncate">{item.id}</p>
              {item.customPrice != null && <p className="text-[10px] text-accent mt-0.5">{item.customPrice}$</p>}
              <div className="flex flex-wrap gap-1 mt-1">
                {item.unique && <span className="inline-block text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">unique</span>}
                {item.sold && <span className="inline-block text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">sold</span>}
                {item.private && !item.sold && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] bg-accent/20 text-accent px-1.5 py-0.5 rounded font-semibold">
                    <Lock size={8} /> {tx({ fr: 'prive', en: 'private', es: 'privado' })}
                  </span>
                )}
                {/* HARDCODED-BADGE (4 mai 2026) : visuel pour distinguer les
                    items qui viennent du file artists.js (read-only depuis
                    l'UI - mod via Strapi admin necessaire) vs ceux en BDD. */}
                {item._hardcodedFallback && (
                  <span className="inline-block text-[9px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded font-semibold" title="Donnée depuis artists.js - non éditable via cette UI">
                    file
                  </span>
                )}
              </div>
            </div>
            {/* Hover overlay : Edit / Private Sale / Delete. Sur mobile on affiche
                en permanence (touch-only) via opacity conditionnelle sur le groupe.
                Items hardcoded (file artists.js) : read-only -> pas de boutons d'edition
                pour eviter une mutation BDD qui ne refleterait pas la realite. */}
            {!item._hardcodedFallback && (
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Bouton Create/Edit Private Sale - masque si deja vendu */}
                {onPrivateSale && !item.sold && (
                  <button
                    onClick={() => onPrivateSale(item)}
                    title={item.private
                      ? tx({ fr: 'Modifier la vente privee', en: 'Edit private sale', es: 'Editar venta privada' })
                      : tx({ fr: 'Creer une vente privee', en: 'Create private sale', es: 'Crear venta privada' })}
                    className={`p-1.5 rounded-lg text-white shadow-lg transition-colors ${
                      item.private
                        ? 'bg-accent/90 hover:bg-accent'
                        : 'bg-purple-500/80 hover:bg-purple-500'
                    }`}
                  >
                    <Lock size={11} />
                  </button>
                )}
                <button onClick={() => onEdit(item)} title={tx({ fr: 'Editer', en: 'Edit', es: 'Editar' })}
                  className="p-1.5 rounded-lg bg-accent/80 text-white hover:bg-accent shadow-lg">
                  <Pencil size={11} />
                </button>
                <button onClick={() => onDelete(item)} disabled={deletingItemId === item.id}
                  title={tx({ fr: 'Supprimer definitivement', en: 'Delete permanently', es: 'Eliminar' })}
                  className="p-1.5 rounded-lg bg-red-500/80 text-white hover:bg-red-500 shadow-lg disabled:opacity-50">
                  {deletingItemId === item.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ========== TAB 2: FINANCES ==========

function FinancesTab({ detail, tx, onMarkPayment, showPaymentForm, setShowPaymentForm, paymentDraft, setPaymentDraft, handleMarkPayment, paymentSaving }) {
  const fin = detail.financials || { totalSales: 0, totalCommission: 0, totalPaid: 0, balance: 0, orders: [], payments: [] };
  const withdrawals = Array.isArray(detail.withdrawals) ? detail.withdrawals : [];

  const METHOD_LABELS = {
    interac: 'Interac',
    cash: tx({ fr: 'Comptant', en: 'Cash', es: 'Efectivo' }),
    cheque: tx({ fr: 'Cheque', en: 'Cheque', es: 'Cheque' }),
    other: tx({ fr: 'Autre', en: 'Other', es: 'Otro' }),
  };
  const STATUS_COLORS = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    processing: 'bg-blue-500/20 text-blue-400',
    completed: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="space-y-4">
      {/* Metriques cles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={TrendingUp} label={tx({ fr: 'Ventes totales', en: 'Total sales', es: 'Ventas' })}
          value={`${fin.totalSales.toFixed(2)}$`} color="text-blue-400" />
        <MetricCard icon={DollarSign} label={tx({ fr: 'Commission due', en: 'Commission due', es: 'Comision' })}
          value={`${fin.totalCommission.toFixed(2)}$`} color="text-accent" />
        <MetricCard icon={CheckCircle} label={tx({ fr: 'Deja verse', en: 'Already paid', es: 'Ya pagado' })}
          value={`${fin.totalPaid.toFixed(2)}$`} color="text-green-400" />
        <MetricCard icon={Wallet} label={tx({ fr: 'Solde a payer', en: 'Balance owed', es: 'Saldo a pagar' })}
          value={`${fin.balance.toFixed(2)}$`} color={fin.balance > 0 ? 'text-yellow-400' : 'text-grey-muted'} />
      </div>

      {/* Email paiement + CTA */}
      <div className="card-bg rounded-xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-heading font-semibold text-sm uppercase tracking-wider mb-1">{tx({ fr: 'Paiements', en: 'Payments', es: 'Pagos' })}</h3>
            <p className="text-xs text-grey-muted">
              {tx({ fr: 'Email PayPal (depuis demandes de retrait)', en: 'PayPal email (from withdrawal requests)', es: 'Email PayPal' })}:
              {' '}<span className="text-heading font-mono">{detail.paypalEmail || tx({ fr: 'non renseigne', en: 'not set', es: 'no definido' })}</span>
            </p>
          </div>
          {!showPaymentForm && (
            <button onClick={onMarkPayment}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent/80">
              <Plus size={13} />
              {tx({ fr: 'Marquer un paiement effectue', en: 'Record payment made', es: 'Registrar pago' })}
            </button>
          )}
        </div>
        {showPaymentForm && (
          <div className="rounded-lg bg-black/20 p-3 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] text-grey-muted uppercase block mb-1">{tx({ fr: 'Montant ($)', en: 'Amount ($)', es: 'Monto ($)' })}</label>
              <input type="number" step="0.01" min="0" value={paymentDraft.amount}
                onChange={e => setPaymentDraft(prev => ({ ...prev, amount: e.target.value }))}
                className="input-field text-sm w-full" placeholder="100.00" />
            </div>
            <div>
              <label className="text-[10px] text-grey-muted uppercase block mb-1">{tx({ fr: 'Methode', en: 'Method', es: 'Metodo' })}</label>
              <select value={paymentDraft.method}
                onChange={e => setPaymentDraft(prev => ({ ...prev, method: e.target.value }))}
                className="input-field text-sm w-full">
                <option value="interac">Interac</option>
                <option value="cash">{METHOD_LABELS.cash}</option>
                <option value="cheque">{METHOD_LABELS.cheque}</option>
                <option value="other">{METHOD_LABELS.other}</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-grey-muted uppercase block mb-1">Date</label>
              <input type="date" value={paymentDraft.date}
                onChange={e => setPaymentDraft(prev => ({ ...prev, date: e.target.value }))}
                className="input-field text-sm w-full" />
            </div>
            <div>
              <label className="text-[10px] text-grey-muted uppercase block mb-1">Notes</label>
              <input type="text" value={paymentDraft.notes}
                onChange={e => setPaymentDraft(prev => ({ ...prev, notes: e.target.value }))}
                className="input-field text-sm w-full" />
            </div>
            <div className="md:col-span-4 flex gap-2 justify-end">
              <button onClick={() => setShowPaymentForm(false)} className="px-3 py-2 rounded-lg bg-white/5 text-grey-muted text-xs hover:bg-white/10">
                {tx({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' })}
              </button>
              <button onClick={handleMarkPayment} disabled={paymentSaving}
                className="px-3 py-2 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent/80 disabled:opacity-50 flex items-center gap-1.5">
                {paymentSaving && <Loader2 size={12} className="animate-spin" />}
                {tx({ fr: 'Enregistrer', en: 'Save', es: 'Guardar' })}
              </button>
            </div>
          </div>
        )}

        {/* Historique paiements effectues */}
        {fin.payments && fin.payments.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] text-grey-muted uppercase tracking-wider">{tx({ fr: 'Paiements effectues', en: 'Payments made', es: 'Pagos hechos' })}</p>
            <div className="rounded-lg bg-black/20 divide-y divide-white/5">
              {fin.payments.map(p => (
                <div key={p.documentId} className="px-3 py-2 flex items-center justify-between text-xs">
                  <span className="text-heading font-semibold">{p.amount.toFixed(2)}$</span>
                  <span className="text-grey-muted">{METHOD_LABELS[p.method] || p.method}</span>
                  <span className="text-grey-muted">{p.date}</span>
                  {p.notes && <span className="text-grey-muted truncate max-w-[200px]">{p.notes}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Demandes de retrait */}
      <div className="card-bg rounded-xl p-4 space-y-3">
        <h3 className="text-heading font-semibold text-sm uppercase tracking-wider">
          {tx({ fr: 'Demandes de retrait', en: 'Withdrawal requests', es: 'Solicitudes de retiro' })} ({withdrawals.length})
        </h3>
        {withdrawals.length === 0 ? (
          <p className="text-xs text-grey-muted">{tx({ fr: 'Aucune demande.', en: 'No requests.', es: 'Sin solicitudes.' })}</p>
        ) : (
          <div className="rounded-lg bg-black/20 divide-y divide-white/5">
            {withdrawals.map(w => (
              <div key={w.documentId} className="px-3 py-2 flex items-center gap-3 flex-wrap text-xs">
                <span className="text-heading font-semibold">{w.amount.toFixed(2)}$</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_COLORS[w.status] || 'bg-grey-500/20 text-grey-400'}`}>
                  {w.status}
                </span>
                <span className="text-grey-muted font-mono">{w.paypalEmail}</span>
                <span className="text-grey-muted ml-auto">{new Date(w.createdAt).toLocaleDateString('fr-CA')}</span>
                {w.paypalTransactionId && <span className="text-[10px] text-green-400 font-mono">Tx: {w.paypalTransactionId.slice(0, 12)}...</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail des ventes (ordres) */}
      {fin.orders && fin.orders.length > 0 && (
        <div className="card-bg rounded-xl p-4 space-y-3">
          <h3 className="text-heading font-semibold text-sm uppercase tracking-wider">
            {tx({ fr: 'Detail des ventes', en: 'Sales breakdown', es: 'Detalle ventas' })} ({fin.orders.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-grey-muted">
                  <th className="text-left py-1.5 pr-3">Date</th>
                  <th className="text-left py-1.5 pr-3">{tx({ fr: 'Produit', en: 'Product', es: 'Producto' })}</th>
                  <th className="text-right py-1.5 pr-3">{tx({ fr: 'Vente', en: 'Sale', es: 'Venta' })}</th>
                  <th className="text-right py-1.5 pr-3">{tx({ fr: 'Prod', en: 'Prod', es: 'Prod' })}</th>
                  <th className="text-right py-1.5 pr-3">{tx({ fr: 'Profit', en: 'Profit', es: 'Profit' })}</th>
                  <th className="text-right py-1.5">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {fin.orders.map((o, i) => (
                  <tr key={i} className="text-heading">
                    <td className="py-1.5 pr-3 text-grey-muted">{new Date(o.orderDate).toLocaleDateString('fr-CA')}</td>
                    <td className="py-1.5 pr-3 truncate max-w-[200px]">{o.productName} {o.size && `· ${o.size}`}</td>
                    <td className="py-1.5 pr-3 text-right">{o.salePrice.toFixed(2)}$</td>
                    <td className="py-1.5 pr-3 text-right text-grey-muted">-{o.productionCost.toFixed(2)}$</td>
                    <td className="py-1.5 pr-3 text-right">{o.netProfit.toFixed(2)}$</td>
                    <td className="py-1.5 text-right text-accent font-semibold">{o.commission.toFixed(2)}$</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== TAB 3: STATS ==========

function StatsTab({ detail, tx }) {
  const stats = detail.stats || { profileViews: 0, itemsViews: [], totalItemViews: 0 };
  const topItems = [...(stats.itemsViews || [])].sort((a, b) => b.views - a.views).slice(0, 10);

  // MISSION TOP 3 GA4 (29 avril 2026) : top 3 oeuvres reelles d'apres
  // Google Analytics 4. Le backend filtre les pageviews virtuels emis
  // par trackArtworkView() apres exclusion de l'admin et de l'artiste
  // lui-meme via setAnalyticsIdentity. Tres deconnecte des stats
  // internes (`stats.itemsViews`) qui peuvent rester en placeholder.
  //
  // Le backend renvoie TOUJOURS { success: true, topArtworks, status }
  // meme en cas d'echec GA4 silencieux (status='pending_data'). On
  // n'expose volontairement aucun bandeau d'erreur cote UI - une
  // erreur reseau brute est mappee vers le meme etat calme.
  const [gaTop, setGaTop] = useState(null);
  const [gaLoading, setGaLoading] = useState(true);

  useEffect(() => {
    if (!detail?.slug) return;
    let cancelled = false;
    setGaLoading(true);
    setGaTop(null);
    getArtistTopArtworks(detail.slug)
      .then(({ data }) => { if (!cancelled) setGaTop(data); })
      .catch(() => {
        // Erreur reseau brute (backend down, timeout, etc) : on degrade
        // proprement vers le meme etat calme que les autres cas non-ok
        // (missing_config / api_error / no_data) plutot que d'afficher
        // un bandeau rouge anxiogene cote admin.
        if (!cancelled) setGaTop({ success: false, topArtworks: [], status: 'api_error' });
      })
      .finally(() => { if (!cancelled) setGaLoading(false); });
    return () => { cancelled = true; };
  }, [detail?.slug]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <MetricCard icon={Eye} label={tx({ fr: 'Vues du profil', en: 'Profile views', es: 'Vistas perfil' })}
          value={stats.profileViews} color="text-blue-400" />
        <MetricCard icon={ImageIcon} label={tx({ fr: 'Vues sur oeuvres (total)', en: 'Items views (total)', es: 'Vistas obras' })}
          value={stats.totalItemViews} color="text-accent" />
        <MetricCard icon={BarChart3} label={tx({ fr: 'Oeuvres trackees', en: 'Items tracked', es: 'Obras rastreadas' })}
          value={stats.itemsViews?.length || 0} color="text-grey-muted" />
      </div>

      {/* GA4 Top 3 oeuvres - source verite vue reelle.
          Backend : { success, topArtworks: [{ slug, title, image, views }], status }.
          status = 'ok' (donnees presentes) | 'pending_data' (GA non
          configure OU pas encore de trafic public). Aucun etat "rouge"
          - les erreurs reelles deviennent "pending_data" cote backend
          pour rester calme cote UI. */}
      <div className="card-bg rounded-xl p-4 space-y-3 ring-1 ring-yellow-400/20">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-heading font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
            <Trophy size={14} className="text-yellow-400" />
            {tx({
              fr: 'Top 3 des oeuvres les plus populaires',
              en: 'Top 3 most popular artworks',
              es: 'Top 3 obras mas populares',
            })}
          </h3>
          {gaTop?.windowDays && gaTop?.topArtworks?.length > 0 && (
            <span className="text-[10px] text-grey-muted">
              {tx({
                fr: `Source : Google Analytics · ${gaTop.windowDays} derniers jours`,
                en: `Source: Google Analytics · last ${gaTop.windowDays} days`,
                es: `Fuente: Google Analytics · ultimos ${gaTop.windowDays} dias`,
              })}
            </span>
          )}
        </div>

        {gaLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 size={18} className="animate-spin text-yellow-400" />
          </div>
        ) : !gaTop?.topArtworks || gaTop.topArtworks.length === 0 ? (
          // Etat discret unique : pending_data couvre tous les cas calmes
          // (GA non configure, pas encore de donnees, erreur API silencieuse).
          // Aucune coloration rouge - on guide l'admin sans le stresser.
          <p className="text-xs text-grey-muted/80 italic leading-relaxed py-2">
            {tx({
              fr: 'En attente de synchronisation des données Google Analytics.',
              en: 'Waiting for Google Analytics data to sync.',
              es: 'Esperando la sincronización de datos de Google Analytics.',
            })}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {gaTop.topArtworks.map((art, i) => (
              <div
                key={`${art.slug || art.pagePath || i}`}
                className="rounded-lg overflow-hidden bg-black/30 border border-white/5"
              >
                <div className="relative aspect-square bg-white/5">
                  {art.image ? (
                    <img
                      src={art.image}
                      alt={art.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-grey-muted/50">
                      <ImageIcon size={24} />
                    </div>
                  )}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-yellow-400/90 text-black text-[10px] font-bold uppercase tracking-wider">
                    #{i + 1}
                  </span>
                </div>
                <div className="p-3 space-y-1.5">
                  <p className="text-sm text-heading font-semibold truncate" title={art.title}>
                    {art.title}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Eye size={12} className="text-yellow-400" />
                    <span className="text-yellow-400 font-bold tabular-nums">{art.views}</span>
                    <span className="text-grey-muted">{tx({ fr: 'vues', en: 'views', es: 'vistas' })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top 10 internal counters (placeholder data, kept for legacy view) */}
      <div className="card-bg rounded-xl p-4 space-y-3">
        <h3 className="text-heading font-semibold text-sm uppercase tracking-wider">
          {tx({ fr: 'Top 10 oeuvres par vues', en: 'Top 10 items by views', es: 'Top 10 obras' })}
        </h3>
        {topItems.length === 0 ? (
          <p className="text-xs text-grey-muted">
            {tx({
              fr: 'Aucune donnee de tracking pour le moment. Les compteurs de vues seront remplis des que le tracking sera active (champ `views` prepare dans le modele prints/stickers).',
              en: 'No tracking data yet. View counters will populate once tracking is enabled (field `views` prepared in prints/stickers model).',
              es: 'Sin datos de tracking por ahora. Contadores se llenaran cuando el tracking este activado.',
            })}
          </p>
        ) : (
          <div className="divide-y divide-white/5">
            {topItems.map((it, i) => (
              <div key={it.id} className="px-1 py-2 flex items-center gap-3 text-xs">
                <span className="text-grey-muted w-6">#{i + 1}</span>
                <span className="text-heading flex-1 truncate">{it.title}</span>
                <span className="text-grey-muted text-[10px] font-mono">{it.id}</span>
                <span className="text-accent font-semibold tabular-nums">{it.views} {tx({ fr: 'vues', en: 'views', es: 'vistas' })}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color = 'text-heading' }) {
  return (
    <div className="card-bg rounded-xl p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center ${color}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[10px] text-grey-muted uppercase tracking-wider">{label}</p>
        <p className={`text-lg font-heading font-bold ${color}`}>{value}</p>
      </div>
    </div>
  );
}

export default AdminArtistManager;
