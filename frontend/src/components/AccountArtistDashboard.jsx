import { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const ArtistGalleryManager = lazy(() => import('./ArtistGalleryManager'));
const ArtistStats = lazy(() => import('./ArtistStats'));
import {
  DollarSign, Palette, Clock, CheckCircle,
  FileText, Loader2, AlertCircle, Package,
  Send, ImagePlus, Check, X, CreditCard, Download, ChevronDown, ChevronUp, ScrollText, Gem, MessageCircle,
  User, Heart, BarChart3, Banknote, Receipt, ExternalLink, Globe, Link2,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useUserRole } from '../contexts/UserRoleContext';
import { getCommissions } from '../services/adminService';
import { sendArtistMessage, getMyMessages, createWithdrawal, getMyWithdrawals, createEditRequest } from '../services/artistService';
import api, { uploadArtistFile } from '../services/api';
import FileUpload from './FileUpload';
import artistsData from '../data/artists';
import { useArtists } from '../hooks/useArtists';
import { ARTIST_CONTRACT_TEXT, ARTIST_CONTRACT_TEXT_EN, ARTIST_CONTRACT_TEXT_ES, ARTIST_CONTRACT_VERSION, ARTIST_FAQ } from '../data/artistContract';
import { HelpCircle } from 'lucide-react';
import { generateContractPDF } from '../utils/generateContractPDF';
import { supabase } from '../lib/supabase';

// Prix client et prix artiste (rabais 30% sur prix client)
const ARTIST_DISCOUNT = 0.25;
const CLIENT_PRICES = {
  studio: { postcard: 15, a4: 35, a3: 50, a3plus: 65, a2: 85 },
  museum: { postcard: 25, a4: 75, a3: 120, a3plus: 160, a2: 190 },
};
const ARTIST_DISCOUNT_PRICES = {
  studio: { postcard: Math.floor(15 * (1 - ARTIST_DISCOUNT)), a4: Math.floor(35 * (1 - ARTIST_DISCOUNT)), a3: Math.floor(50 * (1 - ARTIST_DISCOUNT)), a3plus: Math.floor(65 * (1 - ARTIST_DISCOUNT)), a2: Math.floor(85 * (1 - ARTIST_DISCOUNT)) },
  museum: { postcard: Math.floor(25 * (1 - ARTIST_DISCOUNT)), a4: Math.floor(75 * (1 - ARTIST_DISCOUNT)), a3: Math.floor(120 * (1 - ARTIST_DISCOUNT)), a3plus: Math.floor(160 * (1 - ARTIST_DISCOUNT)), a2: Math.floor(190 * (1 - ARTIST_DISCOUNT)) },
};
const FRAME_PRICES = { postcard: 20, a4: 20, a3: 30, a3plus: 35, a2: 45 };
const PRODUCTION_COSTS = {
  studio: { postcard: 5, a4: 12, a3: 16, a3plus: 20, a2: 28 },
  museum: { postcard: 10, a4: 25, a3: 38, a3plus: 48, a2: 65 },
};


function AccountArtistDashboard({ section = 'dashboard' }) {
  const { tx, lang } = useLang();
  const { user, updateProfile } = useAuth();
  const { artistSlug } = useUserRole();
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Artist profile
  const [artistProfileForm, setArtistProfileForm] = useState({ nomArtiste: '', bio: '', profileImage: '', paypalEmail: '' });
  const [artistProfileSaving, setArtistProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [artistProfileMsg, setArtistProfileMsg] = useState('');
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImageUploading, setProfileImageUploading] = useState(false);

  // Images deposit
  const [imgFiles, setImgFiles] = useState([]);
  const [imgSending, setImgSending] = useState(false);
  const [imgSuccess, setImgSuccess] = useState('');
  const [imgNote, setImgNote] = useState('');
  const [imgSocials, setImgSocials] = useState({ instagram: '', website: '', facebook: '', tiktok: '', youtube: '', other: '' });
  const [socialsSaved, setSocialsSaved] = useState(false);

  // Messages (kept for sending image deposits as messages)
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(true);
  const [msgSuccess, setMsgSuccess] = useState('');

  // Retrait PayPal
  const [withdrawals, setWithdrawals] = useState([]);
  const [wdLoading, setWdLoading] = useState(true);
  const [showWdForm, setShowWdForm] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState(user?.user_metadata?.paypalEmail || '');
  const [wdAmount, setWdAmount] = useState('');
  const [wdNotes, setWdNotes] = useState('');
  const [wdSending, setWdSending] = useState(false);
  const [wdSuccess, setWdSuccess] = useState('');
  const [wdError, setWdError] = useState('');

  // Toast
  const [toast, setToast] = useState('');

  const artist = artistsData[artistSlug] || null;
  const { artists: cmsArtists } = useArtists();
  const cmsArtist = (Array.isArray(cmsArtists) ? cmsArtists : []).find(a => a.slug === artistSlug) || null;
  const email = user?.email || '';

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const { data } = await getCommissions();
        if (!cancelled) {
          const all = data.data || data || [];
          const mine = all.filter(c =>
            c.artistSlug === artistSlug ||
            c.items?.some(item =>
              item.productName?.toLowerCase().includes(artistSlug) ||
              item.artistSlug === artistSlug
            )
          );
          setCommissions(mine);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [artistSlug]);

  // Init artist profile form from user metadata, fallback to artistsData
  useEffect(() => {
    if (!user) return;
    const meta = user.user_metadata || {};
    const artistData = artist; // from artistsData[artistSlug]
    setArtistProfileForm({
      nomArtiste: meta.nomArtiste || (artistData?.name) || '',
      bio: meta.bio || (artistData?.bio?.[lang] || artistData?.bio?.fr) || '',
      profileImage: meta.profileImage || (artistData?.avatar) || '',
      paypalEmail: meta.paypalEmail || '',
    });
  }, [user, artist, lang]);

  // Pre-remplir les liens sociaux : Supabase user_metadata > artists.js
  useEffect(() => {
    if (!user) return;
    const meta = user.user_metadata || {};
    const saved = meta.artist_socials || {};
    const socials = Object.keys(saved).length > 0
      ? saved
      : artist?.socials || {};
    setImgSocials(prev => ({
      instagram: socials.instagram || prev.instagram || '',
      website: socials.website || prev.website || '',
      facebook: socials.facebook || prev.facebook || '',
      tiktok: socials.tiktok || prev.tiktok || '',
      youtube: socials.youtube || prev.youtube || '',
      other: socials.other || socials.gallea || socials.email || prev.other || '',
    }));
  }, [user, artist]);

  // Fetch messages + withdrawals
  useEffect(() => {
    if (!email) return;
    let cancelled = false;

    async function fetchMessages() {
      try {
        const { data } = await getMyMessages(email);
        if (!cancelled) setMessages(data.data || []);
      } catch { /* ignore */ }
      finally { if (!cancelled) setMsgLoading(false); }
    }

    async function fetchWithdrawals() {
      try {
        const { data } = await getMyWithdrawals(email);
        if (!cancelled) setWithdrawals(data.data || []);
      } catch { /* ignore */ }
      finally { if (!cancelled) setWdLoading(false); }
    }

    fetchMessages();
    fetchWithdrawals();
    return () => { cancelled = true; };
  }, [email]);

  const { totalEarned, totalPaid, balance, orderCount } = useMemo(() => {
    let totalEarned = 0;
    let totalPaid = 0;
    let orderCount = commissions.length;

    commissions.forEach(c => {
      const artistEarning = c.artistEarning || c.commission || 0;
      totalEarned += artistEarning;
      if (c.paid || c.status === 'paid') {
        totalPaid += artistEarning;
      }
    });

    // Soustraire les retraits completes
    const completedWithdrawals = withdrawals
      .filter(w => w.status === 'completed')
      .reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0);

    return {
      totalEarned,
      totalPaid: totalPaid + completedWithdrawals,
      balance: totalEarned - totalPaid - completedWithdrawals,
      orderCount,
    };
  }, [commissions, withdrawals]);

  const hasPendingWithdrawal = withdrawals.some(w => w.status === 'pending' || w.status === 'processing');

  const formatMoney = (n) => `${n.toFixed(2)}$`;

  // Save artist profile (nom, bio, image) + notify admin
  const handleArtistProfileSave = async (e) => {
    e.preventDefault();
    setArtistProfileSaving(true);
    try {
      const { error } = await updateProfile({
        nomArtiste: artistProfileForm.nomArtiste,
        bio: artistProfileForm.bio,
        profileImage: artistProfileForm.profileImage,
        paypalEmail: artistProfileForm.paypalEmail,
      });
      if (error) throw error;

      // Auto-apply bio update to CMS via edit request (admin gets notified)
      await createEditRequest({
        artistSlug,
        artistName: artistProfileForm.nomArtiste || artistSlug,
        email,
        requestType: 'update-bio',
        changeData: {
          bioFr: artistProfileForm.bio || '',
          name: artistProfileForm.nomArtiste || '',
        },
      }).catch(() => {});

      // If avatar changed, send avatar update too
      if (artistProfileForm.profileImage) {
        await createEditRequest({
          artistSlug,
          artistName: artistProfileForm.nomArtiste || artistSlug,
          email,
          requestType: 'update-avatar',
          changeData: { avatarUrl: artistProfileForm.profileImage },
        }).catch(() => {});
      }

      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch {
      setArtistProfileMsg(tx({ fr: 'Erreur lors de la sauvegarde', en: 'Error saving', es: 'Error al guardar' }));
      setTimeout(() => setArtistProfileMsg(''), 3000);
    } finally {
      setArtistProfileSaving(false);
    }
  };

  // Upload profile image
  const handleProfileImageUpload = async (file) => {
    if (!file) return;
    setProfileImageUploading(true);
    try {
      const result = await uploadArtistFile(file);
      setArtistProfileForm(f => ({ ...f, profileImage: result.url }));
      setProfileImageFile(null);
    } catch {
      setToast(tx({ fr: 'Erreur upload image', en: 'Error uploading image', es: 'Error al subir imagen' }));
      setTimeout(() => setToast(''), 3000);
    } finally {
      setProfileImageUploading(false);
    }
  };

  // Submit images deposit
  const handleImageDeposit = async (e) => {
    e.preventDefault();
    if (imgFiles.length === 0) return;

    setImgSending(true);
    try {
      // Build message with socials
      const socialsLines = Object.entries(imgSocials)
        .filter(([, v]) => v.trim())
        .map(([k, v]) => `${k}: ${v.trim()}`)
        .join('\n');
      const fullMessage = [
        imgNote.trim() || tx({ fr: 'Nouvelles images deposees', en: 'New images deposited', es: 'Nuevas imagenes depositadas' }),
        socialsLines ? `\n---\nLiens:\n${socialsLines}` : '',
      ].join('');

      await sendArtistMessage({
        artistSlug,
        artistName: artist?.name || artistSlug,
        email,
        subject: tx({ fr: 'Dépôt de nouvelles images', en: 'New image deposit', es: 'Deposito de nuevas imagenes' }),
        message: fullMessage,
        category: 'new-images',
        attachments: imgFiles.map(f => ({ name: f.name, url: f.url, size: f.size, mime: f.mime })),
      });
      setImgSuccess(tx({ fr: 'Images envoyées avec succès!', en: 'Images sent successfully!', es: 'Imagenes enviadas con exito!' }));
      setImgFiles([]);
      setImgNote('');
      setImgSocials({ instagram: '', website: '', facebook: '', tiktok: '', youtube: '', other: '' });
      // Refresh messages
      const { data } = await getMyMessages(email);
      setMessages(data.data || []);
      setTimeout(() => setImgSuccess(''), 4000);
    } catch {
      setToast(tx({ fr: 'Erreur envoi images', en: 'Error sending images', es: 'Error al enviar imagenes' }));
      setTimeout(() => setToast(''), 3000);
    } finally {
      setImgSending(false);
    }
  };

  const handleWithdrawal = async (e) => {
    e.preventDefault();
    setWdError('');

    const amount = parseFloat(wdAmount);
    if (!paypalEmail.trim() || !amount || amount <= 0) {
      setWdError(tx({ fr: 'Email PayPal et montant requis', en: 'PayPal email and amount required', es: 'Email PayPal y monto requeridos' }));
      return;
    }
    if (amount > balance) {
      setWdError(tx({ fr: 'Le montant depasse ton solde disponible', en: 'Amount exceeds your available balance', es: 'El monto excede tu saldo disponible' }));
      return;
    }

    setWdSending(true);
    try {
      await createWithdrawal({
        artistSlug,
        artistName: artist?.name || artistSlug,
        email,
        paypalEmail: paypalEmail.trim(),
        amount,
        notes: wdNotes,
      });
      setWdSuccess(tx({ fr: 'Demande de retrait envoyée!', en: 'Withdrawal request sent!', es: 'Solicitud de retiro enviada!' }));
      setShowWdForm(false);
      setWdAmount('');
      setWdNotes('');
      // Refresh withdrawals
      const { data } = await getMyWithdrawals(email);
      setWithdrawals(data.data || []);
      setTimeout(() => setWdSuccess(''), 4000);
    } catch (err) {
      const msg = err?.response?.data?.error?.message || '';
      if (msg.includes('pending')) {
        setWdError(tx({ fr: 'Tu as déjà une demande en cours', en: 'You already have a pending request', es: 'Ya tienes una solicitud pendiente' }));
      } else {
        setWdError(tx({ fr: 'Erreur lors de la demande', en: 'Error creating request', es: 'Error al crear solicitud' }));
      }
    } finally {
      setWdSending(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: { label: tx({ fr: 'En attente', en: 'Pending', es: 'Pendiente' }), cls: 'bg-yellow-500/20 text-yellow-400' },
      processing: { label: tx({ fr: 'En traitement', en: 'Processing', es: 'En proceso' }), cls: 'bg-blue-500/20 text-blue-400' },
      completed: { label: tx({ fr: 'Complété', en: 'Completed', es: 'Completado' }), cls: 'bg-green-500/20 text-green-400' },
      rejected: { label: tx({ fr: 'Refusé', en: 'Rejected', es: 'Rechazado' }), cls: 'bg-red-500/20 text-red-400' },
    };
    return map[status] || map.pending;
  };

  // ---- Toast commun ----
  const toastElement = (
    <AnimatePresence>
      {(msgSuccess || wdSuccess || imgSuccess || artistProfileMsg || toast) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg text-sm flex items-center gap-2 shadow-lg ${
            toast ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
          }`}
        >
          <Check size={16} />
          {msgSuccess || wdSuccess || imgSuccess || artistProfileMsg || toast}
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ===========================
  // SECTION: DASHBOARD (rappels-cles + mini stats)
  // ===========================
  if (section === 'dashboard') {
    return (
      <div className="space-y-6">
        {toastElement}

        {/* Mini stats compacts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { value: loading ? '-' : formatMoney(totalEarned), label: tx({ fr: 'Gains totaux', en: 'Total earnings', es: 'Ganancias totales' }), color: 'text-green-400', tooltip: tx({ fr: 'Total de tes commissions sur toutes les ventes de tes prints', en: 'Total commissions earned from all your print sales', es: 'Total de comisiones de todas las ventas de tus prints' }) },
            { value: loading ? '-' : formatMoney(totalPaid), label: tx({ fr: 'Déjà payé', en: 'Already paid', es: 'Ya pagado' }), color: 'text-blue-400', tooltip: tx({ fr: 'Montant total qui t\'a déjà été versé via PayPal', en: 'Total amount already paid out to you via PayPal', es: 'Monto total que ya se te ha pagado via PayPal' }) },
            { value: loading ? '-' : formatMoney(balance), label: tx({ fr: 'Solde dispo', en: 'Balance', es: 'Saldo' }), color: balance > 0 ? 'text-accent' : 'text-grey-muted', tooltip: tx({ fr: 'Montant disponible que tu peux demander en retrait', en: 'Available amount you can request as a withdrawal', es: 'Monto disponible que puedes solicitar como retiro' }) },
            { value: loading ? '-' : orderCount, label: tx({ fr: 'Ventes', en: 'Sales', es: 'Ventas' }), color: 'text-purple-400', tooltip: tx({ fr: 'Nombre total de commandes contenant tes prints', en: 'Total number of orders containing your prints', es: 'Numero total de pedidos que contienen tus prints' }) },
          ].map((s, i) => (
            <div key={i} className="text-center py-4 px-3 rounded-xl card-bg relative group cursor-default">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-grey-muted uppercase tracking-wider mt-1">{s.label}</p>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-[#1a1a2e] text-grey-light text-xs whitespace-normal max-w-[200px] text-center opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-lg z-20 hidden md:block">
                {s.tooltip}
              </div>
            </div>
          ))}
        </div>

        {/* Actions rapides artiste */}
        <div className="rounded-2xl p-5 md:p-6 card-bg">
          <h4 className="text-heading font-heading font-bold text-base md:text-lg mb-4 flex items-center gap-2">
            <Palette size={20} className="text-accent" />
            {tx({ fr: 'Actions rapides', en: 'Quick actions', es: 'Acciones rapidas' })}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {artist && (
              <Link to={`/artistes/${artistSlug}`} className="flex flex-col items-center gap-2 p-4 md:p-5 rounded-xl bg-black/20 shadow-lg hover:bg-black/30 transition-all group text-center">
                <ExternalLink size={22} className="text-accent group-hover:scale-110 transition-transform" />
                <p className="text-heading text-sm font-semibold">{tx({ fr: 'Ma boutique', en: 'My store', es: 'Mi tienda' })}</p>
              </Link>
            )}
            <Link to="/account?tab=profil-artiste" className="flex flex-col items-center gap-2 p-4 md:p-5 rounded-xl bg-black/20 shadow-lg hover:bg-black/30 transition-all group text-center">
              <User size={22} className="text-purple-400 group-hover:scale-110 transition-transform" />
              <p className="text-heading text-sm font-semibold">{tx({ fr: 'Page Artiste', en: 'Artist Page', es: 'Pagina Artista' })}</p>
            </Link>
            <Link to="/account?tab=ventes" className="flex flex-col items-center gap-2 p-4 md:p-5 rounded-xl bg-black/20 shadow-lg hover:bg-black/30 transition-all group text-center">
              <BarChart3 size={22} className="text-green-400 group-hover:scale-110 transition-transform" />
              <p className="text-heading text-sm font-semibold">{tx({ fr: 'Ventes', en: 'Sales', es: 'Ventas' })}</p>
            </Link>
            <Link to="/account?tab=tarifs" className="flex flex-col items-center gap-2 p-4 md:p-5 rounded-xl bg-black/20 shadow-lg hover:bg-black/30 transition-all group text-center">
              <Receipt size={22} className="text-blue-400 group-hover:scale-110 transition-transform" />
              <p className="text-heading text-sm font-semibold">{tx({ fr: 'Tarifs', en: 'Pricing', es: 'Precios' })}</p>
            </Link>
            <Link to="/account?tab=contrat" className="flex flex-col items-center gap-2 p-4 md:p-5 rounded-xl bg-black/20 shadow-lg hover:bg-black/30 transition-all group text-center">
              <ScrollText size={22} className="text-orange-400 group-hover:scale-110 transition-transform" />
              <p className="text-heading text-sm font-semibold">{tx({ fr: 'Contrat', en: 'Contract', es: 'Contrato' })}</p>
            </Link>
            <button onClick={() => { const url = new URL(window.location); url.searchParams.set('tab', 'profil-artiste'); window.history.pushState({}, '', url); window.dispatchEvent(new PopStateEvent('popstate')); setTimeout(() => { const el = document.getElementById('artist-gallery-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 500); }} className="flex flex-col items-center gap-2 p-4 md:p-5 rounded-xl bg-black/20 shadow-lg hover:bg-black/30 transition-all group text-center">
              <Send size={22} className="text-green-400 group-hover:scale-110 transition-transform" />
              <p className="text-heading text-sm font-semibold">{tx({ fr: 'Envoyer fichiers', en: 'Send files', es: 'Enviar archivos' })}</p>
            </button>
          </div>
        </div>

        {/* Statistiques de la page artiste */}
        <Suspense fallback={<div className="flex items-center gap-2 text-grey-muted py-8 justify-center"><Loader2 size={16} className="animate-spin" /></div>}>
          <ArtistStats artistSlug={artistSlug} />
        </Suspense>

        {/* Rappels-cles du contrat */}
        <div className="rounded-2xl p-5 md:p-8 card-bg">
          <h4 className="text-heading font-heading font-bold text-lg md:text-xl mb-5 flex items-center gap-2">
            <ScrollText size={22} className="text-accent" />
            {tx({ fr: 'Points-cles de ton contrat', en: 'Key contract points', es: 'Puntos clave de tu contrato' })}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 md:p-6 rounded-xl bg-black/20 shadow-lg">
              <p className="text-green-400 text-sm md:text-base font-bold mb-2 flex items-center gap-2">
                <CheckCircle size={16} />
                {tx({ fr: 'Tes droits d\'auteur', en: 'Your copyrights', es: 'Tus derechos de autor' })}
              </p>
              <p className="text-grey-light text-xs md:text-sm leading-relaxed">
                {tx({
                  fr: 'Tu conserves 100% de tes droits. Massive detient uniquement une licence limitee, non-exclusive et revocable pour l\'impression et la vente en ligne.',
                  en: 'You keep 100% of your rights. Massive only holds a limited, non-exclusive, revocable license for printing and online sales.',
                  es: 'Conservas el 100% de tus derechos. Massive solo tiene una licencia limitada, no exclusiva y revocable para impresion y venta en linea.',
                })}
              </p>
            </div>
            <div className="p-5 md:p-6 rounded-xl bg-black/20 shadow-lg">
              <p className="text-blue-400 text-sm md:text-base font-bold mb-2 flex items-center gap-2">
                <CheckCircle size={16} />
                {tx({ fr: 'Prix uniformes', en: 'Uniform pricing', es: 'Precios uniformes' })}
              </p>
              <p className="text-grey-light text-xs md:text-sm leading-relaxed">
                {tx({
                  fr: 'La grille tarifaire est identique pour tous les artistes partenaires - memes prix, memes couts, memes marges. Aucun traitement preferentiel.',
                  en: 'The pricing grid is identical for all partner artists - same prices, same costs, same margins. No preferential treatment.',
                  es: 'La grilla de precios es identica para todos los artistas asociados - mismos precios, mismos costos, mismos margenes. Sin trato preferencial.',
                })}
              </p>
            </div>
            <div className="p-5 md:p-6 rounded-xl bg-gradient-to-br from-purple-900/40 to-pink-900/20 shadow-lg md:col-span-2">
              <p className="text-pink-400 text-sm md:text-base font-bold mb-3 flex items-center gap-2">
                <Gem size={18} />
                {tx({ fr: 'Pièces uniques - Édition unique', en: 'Unique pieces - Single edition', es: 'Piezas unicas - Edicion unica' })}
              </p>
              <p className="text-grey-light text-xs md:text-sm leading-relaxed mb-3">
                {tx({
                  fr: 'Tu peux désigner certains de tes produits comme "pièce unique" - prints, merch, textile, stickers ou tout autre medium. Un seul exemplaire sera produit. Une fois vendue, la pièce disparaît définitivement. Le prix est fixé par toi en accord avec Massive.',
                  en: 'You can designate any of your products as a "unique piece" - prints, merch, textiles, stickers or any other medium. Only one copy will ever be produced. Once sold, it permanently disappears. Pricing is set by you in agreement with Massive.',
                  es: 'Puedes designar cualquiera de tus productos como "pieza unica" - prints, merch, textil, stickers o cualquier otro medio. Solo una copia sera producida. Una vez vendida, desaparece definitivamente. El precio es fijado por ti en acuerdo con Massive.',
                })}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-black/20">
                  <span className="text-pink-400 font-bold">1x</span>
                  <span className="text-grey-light">{tx({ fr: 'Un seul exemplaire', en: 'One copy only', es: 'Un solo ejemplar' })}</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-black/20">
                  <span className="text-pink-400 font-bold">$</span>
                  <span className="text-grey-light">{tx({ fr: 'Prix fixé par l\'artiste', en: 'Price set by artist', es: 'Precio fijado por el artista' })}</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-black/20">
                  <span className="text-pink-400 font-bold">&times;</span>
                  <span className="text-grey-light">{tx({ fr: 'Retirée après vente', en: 'Removed after sale', es: 'Retirada tras venta' })}</span>
                </div>
              </div>
            </div>
            <div className="p-5 md:p-6 rounded-xl bg-black/20 shadow-lg">
              <p className="text-yellow-400 text-sm md:text-base font-bold mb-2 flex items-center gap-2">
                <CheckCircle size={16} />
                {tx({ fr: 'Zéro production sans accord', en: 'No production without approval', es: 'Sin produccion sin aprobacion' })}
              </p>
              <p className="text-grey-light text-xs md:text-sm leading-relaxed">
                {tx({
                  fr: 'Massive ne produit jamais de prints sans commande confirmée et payée. Aucune production spéculative. Ton approbation écrite est requise pour tout produit.',
                  en: 'Massive never produces prints without a confirmed, paid order. No speculative production. Your written approval is required for every product.',
                  es: 'Massive nunca produce prints sin pedido confirmado y pagado. Sin produccion especulativa. Tu aprobacion escrita es necesaria para cada producto.',
                })}
              </p>
            </div>
            <div className="p-5 md:p-6 rounded-xl bg-black/20 shadow-lg">
              <p className="text-green-400 text-sm md:text-base font-bold mb-2 flex items-center gap-2">
                <DollarSign size={16} />
                {tx({ fr: 'Rabais artiste partenaire', en: 'Partner artist discount', es: 'Descuento artista asociado' })}
              </p>
              <p className="text-grey-light text-xs md:text-sm leading-relaxed">
                {tx({
                  fr: 'Tu beneficies d\'un rabais exclusif de 25% sur tes propres prints et stickers. Pour usage personnel, portfolio ou expos.',
                  en: 'You get an exclusive 25% discount on your own prints and stickers. For personal use, portfolio or exhibitions.',
                  es: 'Tienes un descuento exclusivo del 25% en tus propios prints y stickers. Para uso personal, portafolio o exposiciones.',
                })}
              </p>
            </div>
            <div className="p-5 md:p-6 rounded-xl bg-black/20 shadow-lg">
              <p className="text-purple-400 text-sm md:text-base font-bold mb-2 flex items-center gap-2">
                <Package size={16} />
                {tx({ fr: 'Vente en personne (festivals, galeries)', en: 'In-person sales (festivals, galleries)', es: 'Venta en persona (festivales, galerias)' })}
              </p>
              <p className="text-grey-light text-xs md:text-sm leading-relaxed">
                {tx({
                  fr: 'Commande en volume au prix régulier et revends au prix que tu veux. Le profit supplémentaire est 100% pour toi.',
                  en: 'Order in bulk at regular price and resell at whatever price you want. The extra profit is 100% yours.',
                  es: 'Pide en volumen al precio regular y revende al precio que quieras. La ganancia adicional es 100% tuya.',
                })}
              </p>
            </div>
            <div className="p-5 md:p-6 rounded-xl bg-black/20 shadow-lg">
              <p className="text-blue-400 text-sm md:text-base font-bold mb-2 flex items-center gap-2">
                <CheckCircle size={16} />
                {tx({ fr: 'Fichiers proteges', en: 'Protected files', es: 'Archivos protegidos' })}
              </p>
              <p className="text-grey-light text-xs md:text-sm leading-relaxed">
                {tx({
                  fr: 'Tes fichiers haute-resolution ne sont jamais partages, publies en ligne en haute-res, ni utilises hors du cadre du contrat. Seulement 72 DPI + watermark sur le site.',
                  en: 'Your high-resolution files are never shared, published online in high-res, or used outside the scope of the contract. Only 72 DPI + watermark on the website.',
                  es: 'Tus archivos de alta resolucion nunca se comparten, publican en alta-res en linea, ni se usan fuera del alcance del contrato. Solo 72 DPI + watermark en el sitio.',
                })}
              </p>
            </div>
            <div className="p-5 md:p-6 rounded-xl bg-black/20 shadow-lg">
              <p className="text-yellow-400 text-sm md:text-base font-bold mb-2 flex items-center gap-2">
                <Clock size={16} />
                {tx({ fr: 'Résiliation libre', en: 'Free termination', es: 'Terminacion libre' })}
              </p>
              <p className="text-grey-light text-xs md:text-sm leading-relaxed">
                {tx({
                  fr: 'Tu peux quitter à tout moment avec 30 jours de préavis par email. Tes fichiers sont supprimés de nos serveurs sous 14 jours, confirmation écrite incluse.',
                  en: 'You can leave at any time with 30 days written notice by email. Your files are deleted from our servers within 14 days, written confirmation included.',
                  es: 'Puedes salir en cualquier momento con 30 dias de preaviso por email. Tus archivos se eliminan de nuestros servidores en 14 dias, confirmacion escrita incluida.',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="rounded-2xl p-5 md:p-8 card-bg">
          <h4 className="text-heading font-heading font-bold text-lg md:text-xl mb-5 flex items-center gap-2">
            <HelpCircle size={22} className="text-accent" />
            {tx({ fr: 'Questions fréquentes', en: 'Frequently asked questions', es: 'Preguntas frecuentes' })}
          </h4>
          <div className="space-y-2">
            {(ARTIST_FAQ[lang] || ARTIST_FAQ.fr).map((item, idx) => (
              <details key={idx} className="group rounded-xl bg-black/20 shadow-lg overflow-hidden">
                <summary className="flex items-center justify-between cursor-pointer px-4 py-3 text-sm font-medium text-heading hover:bg-white/[0.03] transition-colors">
                  {item.q}
                  <ChevronDown size={16} className="text-grey-muted flex-shrink-0 ml-2 transition-transform group-open:rotate-180" />
                </summary>
                <p className="px-4 pb-4 text-sm text-grey-light leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ===========================
  // SECTION: CONTRAT
  // ===========================
  if (section === 'contrat') {
    const contractText = lang === 'en' ? ARTIST_CONTRACT_TEXT_EN : lang === 'es' ? ARTIST_CONTRACT_TEXT_ES : ARTIST_CONTRACT_TEXT;
    const isSigned = user?.user_metadata?.contractSigned === true;
    const signedAt = user?.user_metadata?.contractSignedAt;
    const signedVersion = user?.user_metadata?.contractVersion;

    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    const contractRef = useRef(null);

    const handleContractScroll = () => {
      const el = contractRef.current;
      if (!el) return;
      // Considere "en bas" quand il reste moins de 50px a scroller
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
        setHasScrolledToBottom(true);
      }
    };

    const handleSignContract = async () => {
      try {
        const { error } = await supabase.auth.updateUser({
          data: {
            contractSigned: true,
            contractSignedAt: new Date().toISOString(),
            contractVersion: ARTIST_CONTRACT_VERSION,
          },
        });
        if (!error) window.location.reload();
      } catch { /* ignore */ }
    };

    return (
      <div className="space-y-6">
        <div className="rounded-2xl p-5 md:p-8 card-bg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-heading font-heading font-bold text-lg flex items-center gap-2">
                <ScrollText size={20} className="text-accent" />
                {tx({ fr: 'Contrat de partenariat', en: 'Partnership Agreement', es: 'Contrato de asociacion' })}
              </h3>
              <p className="text-grey-muted text-sm mt-1">
                {tx({ fr: `Version ${ARTIST_CONTRACT_VERSION} - Clauses, tarifs et FAQ`, en: `Version ${ARTIST_CONTRACT_VERSION} - Terms, pricing and FAQ`, es: `Version ${ARTIST_CONTRACT_VERSION} - Clausulas, precios y FAQ` })}
              </p>
            </div>
            <button
              onClick={() => generateContractPDF(lang)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 shadow-lg shadow-black/20 text-white/90 text-sm font-semibold hover:bg-white/15 transition-colors flex-shrink-0"
            >
              <Download size={16} />
              {tx({ fr: 'PDF', en: 'PDF', es: 'PDF' })}
            </button>
          </div>
          <div
            ref={contractRef}
            onScroll={handleContractScroll}
            className="contract-content prose prose-invert prose-sm max-w-none max-h-[70vh] overflow-y-auto rounded-xl bg-glass p-5 md:p-6 text-grey-light text-sm md:text-base leading-relaxed"
            dangerouslySetInnerHTML={{ __html: contractText }}
          />

          {/* Signature du contrat */}
          <div className="mt-6 rounded-xl p-5 border border-white/10">
            {isSigned ? (
              <div className="flex items-center gap-3">
                <CheckCircle size={24} className="text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-green-400 font-semibold">
                    {tx({ fr: 'Contrat accepte', en: 'Contract accepted', es: 'Contrato aceptado' })}
                  </p>
                  <p className="text-grey-muted text-sm">
                    {tx({ fr: 'Signe le', en: 'Signed on', es: 'Firmado el' })}{' '}
                    {signedAt ? new Date(signedAt).toLocaleDateString(lang === 'en' ? 'en-CA' : lang === 'es' ? 'es-MX' : 'fr-CA', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                    {signedVersion ? ` (v${signedVersion})` : ''}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-grey-light text-sm">
                  {tx({
                    fr: 'En cochant cette case, tu confirmes avoir lu et accepte les termes du contrat de partenariat Massive Medias ci-dessus.',
                    en: 'By checking this box, you confirm that you have read and accepted the terms of the Massive Medias partnership agreement above.',
                    es: 'Al marcar esta casilla, confirmas haber leido y aceptado los terminos del contrato de asociacion de Massive Medias anterior.',
                  })}
                </p>
                {!hasScrolledToBottom && (
                  <p className="text-yellow-400/70 text-xs flex items-center gap-1.5">
                    <ScrollText size={14} />
                    {tx({ fr: 'Lis le contrat en entier avant de pouvoir l\'accepter', en: 'Read the entire contract before you can accept it', es: 'Lee el contrato completo antes de poder aceptarlo' })}
                  </p>
                )}
                <button
                  onClick={handleSignContract}
                  disabled={!hasScrolledToBottom}
                  className={`flex items-center gap-3 px-5 py-3 rounded-xl border transition-colors group ${hasScrolledToBottom ? 'bg-accent/10 border-accent/30 hover:bg-accent/20 cursor-pointer' : 'bg-white/5 border-white/10 opacity-40 cursor-not-allowed'}`}
                >
                  <div className="w-5 h-5 rounded border-2 border-accent/50 group-hover:border-accent flex items-center justify-center">
                  </div>
                  <span className="text-heading font-medium">
                    {tx({
                      fr: 'J\'accepte les termes du contrat',
                      en: 'I accept the contract terms',
                      es: 'Acepto los terminos del contrato',
                    })}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===========================
  // SECTION: TARIFS
  // ===========================
  if (section === 'tarifs') {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl p-5 md:p-8 card-bg">
          <h3 className="text-heading font-heading font-bold text-lg mb-2 flex items-center gap-2">
            <FileText size={20} className="text-accent" />
            {tx({ fr: 'Grille tarifaire', en: 'Pricing grid', es: 'Grilla de precios' })}
          </h3>
          <p className="text-grey-muted text-xs mb-6">
            {tx({
              fr: 'Quand un client achete ton oeuvre, ta commission = 50% du profit net (prix de vente - couts de production). Quand tu achetes pour toi, tu as un rabais de 30% sur le prix client. TPS + TVQ en sus.',
              en: 'When a client buys your work, your commission = 50% of net profit (sale price - production costs). When you buy for yourself, you get 30% off client price. GST + QST extra.',
              es: 'Cuando un cliente compra tu obra, tu comision = 50% del beneficio neto (precio de venta - costos de produccion). Cuando compras para ti, tienes 30% de descuento. Impuestos adicionales.',
            })}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-grey-muted text-[10px] sm:text-xs uppercase tracking-wider shadow-[0_1px_0_rgba(255,255,255,0.04)]">
                  <th className="text-left py-2 pr-1 sm:pr-3">{tx({ fr: 'Format', en: 'Format', es: 'Formato' })}</th>
                  <th className="text-right py-2 px-1 sm:px-2">{tx({ fr: 'Prix client', en: 'Client price', es: 'Precio cliente' })}</th>
                  <th className="text-right py-2 px-1 sm:px-2 text-grey-muted">{tx({ fr: 'Production', en: 'Production', es: 'Produccion' })}</th>
                  <th className="text-right py-2 px-1 sm:px-2 text-purple-400">{tx({ fr: 'Massive (50%)', en: 'Massive (50%)', es: 'Massive (50%)' })}</th>
                  <th className="text-right py-2 px-1 sm:px-2 text-green-400">{tx({ fr: 'Ta commission (50%)', en: 'Your commission (50%)', es: 'Tu comision (50%)' })}</th>
                  <th className="text-right py-2 px-1 sm:px-2 text-accent">
                    <button type="button" onClick={() => alert(tx({ fr: 'Ce prix est exclusivement reserve a l\'artiste pour son usage personnel (impression uniquement). Aucune revente permise.', en: 'This price is exclusively for the artist\'s personal use (printing only). No resale permitted.', es: 'Este precio es exclusivamente para uso personal del artista (solo impresion). No se permite la reventa.' }))} className="underline decoration-dotted cursor-pointer">
                      {tx({ fr: 'Ton prix (-30%)', en: 'Your price (-30%)', es: 'Tu precio (-30%)' })}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="shadow-[0_1px_0_rgba(255,255,255,0.03)]"><td colSpan="6" className="pt-3 pb-1 text-accent font-semibold text-xs">{tx({ fr: 'Série Studio (4 encres pigmentées)', en: 'Studio Series (4 pigment inks)', es: 'Serie Studio (4 tintas pigmentadas)' })}</td></tr>
                {[{ format: 'A6 (4x6")', key: 'postcard' }, { format: 'A4 (8.5x11")', key: 'a4' }, { format: 'A3 (11x17")', key: 'a3' }, { format: 'A3+ (13x19")', key: 'a3plus' }, { format: 'A2 (18x24")', key: 'a2' }].map(({ format, key }) => {
                  const clientPrice = CLIENT_PRICES.studio[key];
                  const prodCost = PRODUCTION_COSTS.studio[key] || 0;
                  const netProfit = clientPrice - prodCost;
                  const commission = Math.round(netProfit * 0.5);
                  const artistPrice = ARTIST_DISCOUNT_PRICES.studio[key];
                  return (
                    <tr key={`s-${key}`} className="shadow-[0_1px_0_rgba(255,255,255,0.03)] hover:bg-accent/5 transition-colors">
                      <td className="py-2 pr-1 sm:pr-3 text-heading text-xs sm:text-sm">{format}</td>
                      <td className="py-2 px-1 sm:px-2 text-right text-heading text-xs sm:text-sm">{clientPrice}$</td>
                      <td className="py-2 px-1 sm:px-2 text-right text-grey-muted text-xs sm:text-sm">{prodCost}$</td>
                      <td className="py-2 px-1 sm:px-2 text-right text-purple-400 text-xs sm:text-sm">{commission}$</td>
                      <td className="py-2 px-1 sm:px-2 text-right text-green-400 font-semibold text-xs sm:text-sm">{commission}$</td>
                      <td className="py-2 px-1 sm:px-2 text-right text-accent text-xs sm:text-sm">{artistPrice}$</td>
                    </tr>
                  );
                })}
                <tr className="shadow-[0_1px_0_rgba(255,255,255,0.03)]"><td colSpan="6" className="pt-4 pb-1 text-accent font-semibold text-xs">{tx({ fr: 'Série Musée (12 encres pigmentées)', en: 'Museum Series (12 pigment inks)', es: 'Serie Museo (12 tintas pigmentadas)' })}</td></tr>
                {[{ format: 'A6 (4x6")', key: 'postcard' }, { format: 'A4 (8.5x11")', key: 'a4' }, { format: 'A3 (11x17")', key: 'a3' }, { format: 'A3+ (13x19")', key: 'a3plus' }, { format: 'A2 (18x24")', key: 'a2' }].map(({ format, key }) => {
                  const clientPrice = CLIENT_PRICES.museum[key];
                  const prodCost = PRODUCTION_COSTS.museum[key] || 0;
                  const netProfit = clientPrice - prodCost;
                  const commission = Math.round(netProfit * 0.5);
                  const artistPrice = ARTIST_DISCOUNT_PRICES.museum[key];
                  return (
                    <tr key={`m-${key}`} className="shadow-[0_1px_0_rgba(255,255,255,0.03)] hover:bg-accent/5 transition-colors">
                      <td className="py-2 pr-1 sm:pr-3 text-heading text-xs sm:text-sm">{format}</td>
                      <td className="py-2 px-1 sm:px-2 text-right text-heading text-xs sm:text-sm">{clientPrice}$</td>
                      <td className="py-2 px-1 sm:px-2 text-right text-grey-muted text-xs sm:text-sm">{prodCost}$</td>
                      <td className="py-2 px-1 sm:px-2 text-right text-purple-400 text-xs sm:text-sm">{commission}$</td>
                      <td className="py-2 px-1 sm:px-2 text-right text-green-400 font-semibold text-xs sm:text-sm">{commission}$</td>
                      <td className="py-2 px-1 sm:px-2 text-right text-accent text-xs sm:text-sm">{artistPrice}$</td>
                    </tr>
                  );
                })}
                <tr className="shadow-[0_1px_0_rgba(255,255,255,0.03)]"><td colSpan="6" className="pt-4 pb-1 text-accent font-semibold text-xs">{tx({ fr: 'Cadres (noir ou blanc)', en: 'Frames (black or white)', es: 'Marcos (negro o blanco)' })}</td></tr>
                {[{ format: 'A6 / A4', key: 'a4' }, { format: 'A3', key: 'a3' }, { format: 'A3+', key: 'a3plus' }, { format: 'A2', key: 'a2' }].map(({ format, key }) => (
                  <tr key={`f-${key}`} className="shadow-[0_1px_0_rgba(255,255,255,0.03)]">
                    <td className="py-2 pr-1 sm:pr-3 text-heading text-xs sm:text-sm">{format}</td>
                    <td className="py-2 px-1 sm:px-2 text-right text-heading text-xs sm:text-sm">{FRAME_PRICES[key]}$</td>
                    <td className="py-2 px-1 sm:px-2 text-right text-grey-muted text-xs sm:text-sm">{FRAME_PRICES[key]}$</td>
                    <td className="py-2 px-1 sm:px-2 text-right text-grey-muted text-xs sm:text-sm">-</td>
                    <td className="py-2 px-1 sm:px-2 text-right text-grey-muted text-xs sm:text-sm">0$</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-grey-muted text-xs mt-4 italic">
            {tx({
              fr: 'Note: Rabais artiste de 30% sur tous les formats. Le cadre est facture au client, pas de marge artiste sur les cadres.',
              en: 'Note: 30% artist discount on all formats. Frames are charged to the client, no artist margin on frames.',
              es: 'Nota: Descuento artista del 30% en todos los formatos. Los marcos se cobran al cliente, sin margen artista en marcos.',
            })}
          </p>
        </div>

        {/* Notes copies perso + festivals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-black/20 shadow-none">
            <p className="text-yellow-400 text-sm font-bold mb-2">
              {tx({ fr: 'Copies personnelles', en: 'Personal copies', es: 'Copias personales' })}
            </p>
            <p className="text-grey-light text-xs leading-relaxed">
              {tx({
                fr: 'En tant qu\'artiste partenaire, tu beneficies d\'un rabais exclusif de 25% sur tes propres prints et stickers.',
                en: 'As a partner artist, you get an exclusive 25% discount on your own prints and stickers.',
                es: 'Como artista asociado, tienes un descuento exclusivo del 25% en tus propios prints y stickers.',
              })}
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-black/20 shadow-none">
            <p className="text-purple-400 text-sm font-bold mb-2">
              {tx({ fr: 'Festivals, galeries et boutiques', en: 'Festivals, galleries and shops', es: 'Festivales, galerias y tiendas' })}
            </p>
            <p className="text-grey-light text-xs leading-relaxed">
              {tx({
                fr: 'Commande en volume au prix régulier (colonne "Prix client"), et revends au prix que tu veux. Le profit supplémentaire est 100% pour toi.',
                en: 'Order in bulk at regular price ("Client price" column), and resell at whatever price you want. The extra profit is 100% yours.',
                es: 'Pide en volumen al precio regular (columna "Precio cliente"), y revende al precio que quieras. La ganancia adicional es 100% tuya.',
              })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ===========================
  // SECTION: PROFIL ARTISTE (fusionné profil + images)
  // ===========================
  if (section === 'profil-artiste') {
    const imageDeposits = messages.filter(m => m.category === 'new-images' && m.attachments?.length > 0);

    return (
      <div className="space-y-6">
        {toastElement}

        {/* Profil artiste */}
        <div className="rounded-2xl p-5 md:p-8 card-bg">
          <h3 className="text-heading font-heading font-bold text-lg flex items-center gap-2 mb-6">
            <Palette size={20} className="text-accent" />
            {tx({ fr: 'Page Artiste', en: 'Artist Page', es: 'Pagina Artista' })}
          </h3>

          {artistProfileMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-lg bg-green-500/10 text-green-400 text-sm flex items-center gap-2"
            >
              <Check size={16} />
              {artistProfileMsg}
            </motion.div>
          )}

          <form onSubmit={handleArtistProfileSave} className="space-y-5">
            {/* Image de profil */}
            <div>
              <label className="text-[11px] text-grey-muted uppercase tracking-wider font-medium mb-2 block">
                {tx({ fr: 'Image de profil', en: 'Profile image', es: 'Imagen de perfil' })}
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg shadow-black/30 flex-shrink-0 bg-glass flex items-center justify-center">
                  {artistProfileForm.profileImage ? (
                    <img src={artistProfileForm.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Palette size={28} className="text-accent/40" />
                  )}
                </div>
                <div className="flex-grow">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 shadow-lg shadow-black/20 text-white/90 text-sm font-semibold hover:bg-white/15 transition-colors">
                    {profileImageUploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                    {tx({ fr: 'Changer l\'image', en: 'Change image', es: 'Cambiar imagen' })}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleProfileImageUpload(file);
                      }}
                      disabled={profileImageUploading}
                    />
                  </label>
                  {artistProfileForm.profileImage && (
                    <button
                      type="button"
                      onClick={() => setArtistProfileForm(f => ({ ...f, profileImage: '' }))}
                      className="ml-2 text-red-400/60 hover:text-red-400 text-xs transition-colors"
                    >
                      {tx({ fr: 'Retirer', en: 'Remove', es: 'Eliminar' })}
                    </button>
                  )}
                  <p className="text-grey-muted/60 text-[10px] mt-1">
                    {tx({ fr: 'JPG, PNG ou WebP. Carré recommandé.', en: 'JPG, PNG or WebP. Square recommended.', es: 'JPG, PNG o WebP. Cuadrado recomendado.' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Nom d'artiste */}
            <div>
              <label className="text-[11px] text-grey-muted uppercase tracking-wider font-medium mb-1 block">
                {tx({ fr: 'Nom d\'artiste', en: 'Artist name', es: 'Nombre artistico' })}
              </label>
              <input
                type="text"
                value={artistProfileForm.nomArtiste}
                onChange={(e) => setArtistProfileForm(f => ({ ...f, nomArtiste: e.target.value }))}
                className="input-field text-sm"
                placeholder={tx({ fr: 'Ton nom d\'artiste', en: 'Your artist name', es: 'Tu nombre artistico' })}
              />
            </div>

            {/* Bio */}
            <div>
              <label className="text-[11px] text-grey-muted uppercase tracking-wider font-medium mb-1 block">
                Bio
              </label>
              <textarea
                value={artistProfileForm.bio}
                onChange={(e) => setArtistProfileForm(f => ({ ...f, bio: e.target.value }))}
                className="input-field text-sm min-h-[120px] resize-y"
                placeholder={tx({
                  fr: 'Parle de toi, de ton art, de tes inspirations...',
                  en: 'Tell us about yourself, your art, your inspirations...',
                  es: 'Cuentanos sobre ti, tu arte, tus inspiraciones...',
                })}
              />
              <p className="text-grey-muted/60 text-[10px] mt-1">
                {tx({
                  fr: 'Cette bio sera visible sur ta page artiste.',
                  en: 'This bio will be visible on your artist page.',
                  es: 'Esta bio sera visible en tu pagina de artista.',
                })}
              </p>
            </div>

            {/* Email PayPal */}
            <div>
              <label className="text-[11px] text-grey-muted uppercase tracking-wider font-medium mb-1 block">
                {tx({ fr: 'Email PayPal (pour les virements)', en: 'PayPal email (for payouts)', es: 'Email PayPal (para transferencias)' })}
              </label>
              <input
                type="email"
                value={artistProfileForm.paypalEmail}
                onChange={(e) => setArtistProfileForm(f => ({ ...f, paypalEmail: e.target.value }))}
                className="input-field text-sm"
                placeholder={tx({ fr: 'ton@email-paypal.com', en: 'your@paypal-email.com', es: 'tu@email-paypal.com' })}
              />
              <p className="text-grey-muted/60 text-[10px] mt-1">
                {tx({
                  fr: 'Adresse email associee a ton compte PayPal pour recevoir tes paiements.',
                  en: 'Email address linked to your PayPal account to receive your payments.',
                  es: 'Direccion de email asociada a tu cuenta PayPal para recibir tus pagos.',
                })}
              </p>
            </div>

            {/* Info boutique */}
            {artist ? (
              <div className="rounded-lg bg-accent/5 shadow-lg shadow-black/20 p-4">
                <p className="text-grey-muted text-xs flex items-center gap-2">
                  <Palette size={14} className="text-accent" />
                  {tx({ fr: 'Ta boutique:', en: 'Your store:', es: 'Tu tienda:' })}
                  <a href={`https://${artistSlug}.massivemedias.com`} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-medium">
                    {artistSlug}.massivemedias.com
                  </a>
                </p>
              </div>
            ) : (
              <div className="rounded-lg bg-black/20 shadow-lg p-4">
                <p className="text-yellow-400 text-xs flex items-center gap-2">
                  <Clock size={14} />
                  {tx({
                    fr: 'Ta page artiste sera créée par Massive une fois ton profil complété. Tu recevras une notification.',
                    en: 'Your artist page will be created by Massive once your profile is complete. You\'ll be notified.',
                    es: 'Tu pagina de artista sera creada por Massive una vez que tu perfil este completo. Seras notificado.',
                  })}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={artistProfileSaving}
              className={`text-sm py-2.5 px-6 rounded-full font-semibold flex items-center gap-1.5 transition-all duration-300 disabled:opacity-50 ${profileSaved ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'btn-primary'}`}
            >
              {artistProfileSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {profileSaved ? tx({ fr: 'Sauvegarde!', en: 'Saved!', es: 'Guardado!' }) : tx({ fr: 'Sauvegarder', en: 'Save', es: 'Guardar' })}
            </button>
          </form>
        </div>

        {/* Liens sociaux */}
        <div className="rounded-2xl p-5 md:p-8 card-bg">
          <h3 className="text-heading font-heading font-bold text-lg flex items-center gap-2 mb-4">
            <Link2 size={20} className="text-accent" />
            {tx({ fr: 'Liens sociaux', en: 'Social links', es: 'Enlaces sociales' })}
          </h3>
          <p className="text-grey-muted text-sm mb-4">
            {tx({
              fr: 'Ces liens apparaitront sur ta page artiste. Sauvegarde pour appliquer les changements.',
              en: 'These links will appear on your artist page. Save to apply changes.',
              es: 'Estos enlaces apareceran en tu pagina de artista. Guarda para aplicar los cambios.',
            })}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-[10px] text-grey-muted mb-0.5 block">Instagram</label>
              <input type="url" value={imgSocials.instagram} onChange={(e) => setImgSocials(s => ({ ...s, instagram: e.target.value }))} className="input-field text-sm py-2" placeholder="https://instagram.com/..." />
            </div>
            <div>
              <label className="text-[10px] text-grey-muted mb-0.5 block">Site web</label>
              <input type="url" value={imgSocials.website} onChange={(e) => setImgSocials(s => ({ ...s, website: e.target.value }))} className="input-field text-sm py-2" placeholder="https://..." />
            </div>
            <div>
              <label className="text-[10px] text-grey-muted mb-0.5 block">Facebook</label>
              <input type="url" value={imgSocials.facebook} onChange={(e) => setImgSocials(s => ({ ...s, facebook: e.target.value }))} className="input-field text-sm py-2" placeholder="https://facebook.com/..." />
            </div>
            <div>
              <label className="text-[10px] text-grey-muted mb-0.5 block">TikTok</label>
              <input type="url" value={imgSocials.tiktok} onChange={(e) => setImgSocials(s => ({ ...s, tiktok: e.target.value }))} className="input-field text-sm py-2" placeholder="https://tiktok.com/@..." />
            </div>
            <div>
              <label className="text-[10px] text-grey-muted mb-0.5 block">YouTube</label>
              <input type="url" value={imgSocials.youtube} onChange={(e) => setImgSocials(s => ({ ...s, youtube: e.target.value }))} className="input-field text-sm py-2" placeholder="https://youtube.com/@..." />
            </div>
            <div>
              <label className="text-[10px] text-grey-muted mb-0.5 block">{tx({ fr: 'Autre lien', en: 'Other link', es: 'Otro enlace' })}</label>
              <input type="url" value={imgSocials.other} onChange={(e) => setImgSocials(s => ({ ...s, other: e.target.value }))} className="input-field text-sm py-2" placeholder="https://..." />
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              try {
                const socials = {};
                Object.entries(imgSocials).forEach(([k, v]) => { if (v.trim()) socials[k] = v.trim(); });
                // Sauvegarder dans Supabase user_metadata (persistant, multi-appareil)
                const { error } = await updateProfile({ artist_socials: socials });
                if (error) throw error;
                // Aussi sauvegarder dans le CMS Strapi pour la page publique
                if (cmsArtist?.documentId) {
                  try {
                    await api.put(`/artists/${cmsArtist.documentId}`, { data: { socials } });
                  } catch { /* ignore si CMS indisponible */ }
                }
                setSocialsSaved(true);
                setTimeout(() => setSocialsSaved(false), 3000);
              } catch {
                setToast(tx({ fr: 'Erreur', en: 'Error', es: 'Error' }));
                setTimeout(() => setToast(''), 3000);
              }
            }}
            className={`text-sm py-2.5 px-6 rounded-full font-semibold flex items-center gap-1.5 transition-all duration-300 ${socialsSaved ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'btn-primary'}`}
          >
            <Check size={14} />
            {socialsSaved ? tx({ fr: 'Sauvegarde!', en: 'Saved!', es: 'Guardado!' }) : tx({ fr: 'Sauvegarder les liens', en: 'Save links', es: 'Guardar enlaces' })}
          </button>
        </div>

        {/* Gestion galerie artiste */}
        <Suspense fallback={<div className="flex items-center justify-center py-10"><Loader2 size={24} className="animate-spin text-accent" /></div>}>
          <ArtistGalleryManager />
        </Suspense>
      </div>
    );
  }

  // ===========================
  // SECTION: VENTES (+ retrait integre)
  // ===========================
  if (section === 'ventes') {
    return (
      <div className="space-y-6">
        {toastElement}
        <div className="rounded-2xl p-5 md:p-8 card-bg">
          <h3 className="text-heading font-heading font-bold text-lg mb-6 flex items-center gap-2">
            <Clock size={20} className="text-accent" />
            {tx({ fr: 'Historique des ventes', en: 'Sales history', es: 'Historial de ventas' })}
          </h3>

          {/* Mini stats en haut */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="text-center py-3 px-2 rounded-xl card-bg">
              <p className="text-lg font-bold text-green-400">{loading ? '-' : formatMoney(totalEarned)}</p>
              <p className="text-[10px] text-grey-muted uppercase tracking-wider">{tx({ fr: 'Gains totaux', en: 'Total earnings', es: 'Ganancias totales' })}</p>
            </div>
            <div className="text-center py-3 px-2 rounded-xl card-bg">
              <p className="text-lg font-bold text-blue-400">{loading ? '-' : formatMoney(totalPaid)}</p>
              <p className="text-[10px] text-grey-muted uppercase tracking-wider">{tx({ fr: 'Déjà payé', en: 'Already paid', es: 'Ya pagado' })}</p>
            </div>
            <div className="text-center py-3 px-2 rounded-xl card-bg">
              <p className="text-lg font-bold text-purple-400">{loading ? '-' : orderCount}</p>
              <p className="text-[10px] text-grey-muted uppercase tracking-wider">{tx({ fr: 'Ventes', en: 'Sales', es: 'Ventas' })}</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-grey-muted py-8 justify-center"><Loader2 size={16} className="animate-spin" /></div>
          ) : error ? (
            <div className="flex items-center gap-2 text-yellow-400 py-4"><AlertCircle size={16} /><span className="text-sm">{tx({ fr: 'Impossible de charger les ventes', en: 'Unable to load sales', es: 'No se pueden cargar las ventas' })}</span></div>
          ) : commissions.length === 0 ? (
            <div className="text-center py-8">
              <Package size={32} className="text-grey-muted/20 mx-auto mb-2" />
              <p className="text-grey-muted text-sm">{tx({ fr: 'Aucune vente pour le moment', en: 'No sales yet', es: 'Sin ventas por el momento' })}</p>
              <p className="text-grey-muted/60 text-xs mt-1">{tx({ fr: 'Les ventes de tes prints apparaitront ici automatiquement.', en: 'Sales of your prints will appear here automatically.', es: 'Las ventas de tus prints apareceran aqui automaticamente.' })}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {commissions.map((c, i) => (
                <div key={c.documentId || i} className="flex items-center justify-between py-3 shadow-[0_1px_0_rgba(255,255,255,0.03)] last:shadow-none">
                  <div>
                    <p className="text-heading text-sm font-medium">{c.customerName || c.customerEmail || 'Client'}</p>
                    <p className="text-grey-muted text-xs">{c.createdAt ? new Date(c.createdAt).toLocaleDateString('fr-CA') : '-'}{c.items && ` - ${c.items.length} article${c.items.length > 1 ? 's' : ''}`}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.paid || c.status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {c.paid || c.status === 'paid' ? tx({ fr: 'Paye', en: 'Paid', es: 'Pagado' }) : tx({ fr: 'En attente', en: 'Pending', es: 'Pendiente' })}
                    </span>
                    <span className="text-green-400 font-bold text-sm">+{formatMoney(c.artistEarning || c.commission || 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Retrait PayPal */}
        <div className="rounded-2xl p-5 md:p-8 card-bg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-heading font-heading font-bold text-lg flex items-center gap-2">
                <CreditCard size={20} className="text-accent" />
                {tx({ fr: 'Retrait PayPal', en: 'PayPal Withdrawal', es: 'Retiro PayPal' })}
              </h3>
              <p className="text-grey-muted text-sm mt-1">
                {tx({ fr: 'Solde disponible:', en: 'Available balance:', es: 'Saldo disponible:' })} <span className={`font-bold ${balance > 0 ? 'text-accent' : 'text-grey-muted'}`}>{formatMoney(balance)}</span>
              </p>
            </div>
            {balance > 0 && !hasPendingWithdrawal && (
              <button
                onClick={() => setShowWdForm(!showWdForm)}
                className="btn-primary text-xs py-2 px-4"
              >
                <DollarSign size={14} className="mr-1" />
                {tx({ fr: 'Demander un retrait', en: 'Request withdrawal', es: 'Solicitar retiro' })}
              </button>
            )}
          </div>

          {hasPendingWithdrawal && (
            <div className="rounded-lg bg-yellow-500/10 p-3 mb-4 flex items-center gap-2">
              <Clock size={14} className="text-yellow-400 flex-shrink-0" />
              <p className="text-yellow-400 text-xs">
                {tx({
                  fr: 'Tu as déjà une demande de retrait en cours. Massive va traiter ta demande sous 24-48h.',
                  en: 'You already have a pending withdrawal request. Massive will process it within 24-48h.',
                  es: 'Ya tienes una solicitud de retiro pendiente. Massive la procesara en 24-48h.',
                })}
              </p>
            </div>
          )}

          {/* Formulaire retrait */}
          <AnimatePresence>
            {showWdForm && (
              <motion.form
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                onSubmit={handleWithdrawal}
                className="overflow-hidden"
              >
                <div className="rounded-lg bg-accent/5 shadow-lg shadow-black/20 p-4 mb-4 space-y-3">
                  <p className="text-grey-muted text-xs">
                    {tx({
                      fr: 'Entre ton email PayPal et le montant a retirer. Massive enverra le paiement sous 24-48h.',
                      en: 'Enter your PayPal email and amount to withdraw. Massive will send payment within 24-48h.',
                      es: 'Ingresa tu email PayPal y el monto a retirar. Massive enviara el pago en 24-48h.',
                    })}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-grey-muted uppercase tracking-wider font-medium mb-1 block">
                        {tx({ fr: 'Email PayPal', en: 'PayPal Email', es: 'Email PayPal' })}
                      </label>
                      <input
                        type="email"
                        value={paypalEmail}
                        onChange={(e) => setPaypalEmail(e.target.value)}
                        placeholder="ton@email.com"
                        className="input-field text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-grey-muted uppercase tracking-wider font-medium mb-1 block">
                        {tx({ fr: 'Montant a retirer', en: 'Amount to withdraw', es: 'Monto a retirar' })} ({tx({ fr: 'max', en: 'max', es: 'max' })}: {formatMoney(balance)})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        max={balance}
                        value={wdAmount}
                        onChange={(e) => setWdAmount(e.target.value)}
                        placeholder="0.00"
                        className="input-field text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-grey-muted uppercase tracking-wider font-medium mb-1 block">
                      {tx({ fr: 'Notes (optionnel)', en: 'Notes (optional)', es: 'Notas (opcional)' })}
                    </label>
                    <input
                      type="text"
                      value={wdNotes}
                      onChange={(e) => setWdNotes(e.target.value)}
                      className="input-field text-sm"
                      placeholder={tx({ fr: 'Ex: Merci!', en: 'Ex: Thanks!', es: 'Ej: Gracias!' })}
                    />
                  </div>
                  {wdError && <p className="text-red-400 text-xs">{wdError}</p>}
                  <div className="flex gap-2">
                    <button type="submit" disabled={wdSending} className="btn-primary text-xs py-2 px-6 disabled:opacity-50">
                      {wdSending ? <Loader2 size={14} className="animate-spin mr-1" /> : <Send size={14} className="mr-1" />}
                      {tx({ fr: 'Envoyer la demande', en: 'Send request', es: 'Enviar solicitud' })}
                    </button>
                    <button type="button" onClick={() => { setShowWdForm(false); setWdError(''); }} className="text-grey-muted text-xs hover:text-heading transition-colors">
                      {tx({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' })}
                    </button>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Historique retraits */}
          {!wdLoading && withdrawals.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-heading font-semibold text-sm mb-3">{tx({ fr: 'Historique des retraits', en: 'Withdrawal history', es: 'Historial de retiros' })}</h4>
              {withdrawals.map((w, i) => {
                const badge = getStatusBadge(w.status);
                return (
                  <div key={w.documentId || i} className="flex items-center justify-between py-3 shadow-[0_1px_0_rgba(255,255,255,0.03)] last:shadow-none">
                    <div>
                      <p className="text-heading text-sm font-medium">{formatMoney(parseFloat(w.amount) || 0)}</p>
                      <p className="text-grey-muted text-xs">
                        PayPal: {w.paypalEmail} - {w.createdAt ? new Date(w.createdAt).toLocaleDateString('fr-CA') : '-'}
                      </p>
                      {w.adminNotes && <p className="text-grey-muted text-[10px] italic mt-0.5">Massive: {w.adminNotes}</p>}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge.cls}`}>{badge.label}</span>
                  </div>
                );
              })}
            </div>
          ) : !wdLoading ? (
            <div className="text-center py-8">
              <CreditCard size={32} className="text-grey-muted/20 mx-auto mb-2" />
              <p className="text-grey-muted text-sm">
                {balance > 0
                  ? tx({ fr: 'Aucun retrait effectue. Clique "Demander un retrait" pour recevoir ton argent via PayPal.', en: 'No withdrawals yet. Click "Request withdrawal" to receive your money via PayPal.', es: 'Sin retiros aun. Haz clic en "Solicitar retiro" para recibir tu dinero via PayPal.' })
                  : tx({ fr: 'Aucun solde disponible pour le moment.', en: 'No balance available at this time.', es: 'Sin saldo disponible por el momento.' })
                }
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-grey-muted py-8 justify-center"><Loader2 size={16} className="animate-spin" /></div>
          )}
        </div>
      </div>
    );
  }

  // Messages recus du public
  if (section === 'messages-artiste') {
    const [inboxMessages, setInboxMessages] = useState([]);
    const [inboxLoading, setInboxLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [replyingId, setReplyingId] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [replySending, setReplySending] = useState(false);
    const [showArchived, setShowArchived] = useState(false);

    useEffect(() => {
      if (!artist?.slug) return;
      api.get(`/artist-messages/inbox?artistSlug=${artist.slug}`)
        .then(res => setInboxMessages(res.data?.data || []))
        .catch(() => {})
        .finally(() => setInboxLoading(false));
    }, [artist?.slug]);

    const handleReply = async (documentId) => {
      if (!replyText.trim()) return;
      setReplySending(true);
      try {
        await api.put(`/artist-messages/${documentId}/artist-reply`, { artistReply: replyText.trim() });
        setInboxMessages(msgs => msgs.map(m => m.documentId === documentId ? { ...m, artistReply: replyText.trim(), status: 'replied' } : m));
        setReplyingId(null);
        setReplyText('');
      } catch (err) {
        console.error(err);
      } finally {
        setReplySending(false);
      }
    };

    const handleArchive = async (documentId) => {
      try {
        await api.put(`/artist-messages/${documentId}/status`, { status: 'archived' });
        setInboxMessages(msgs => msgs.map(m => m.documentId === documentId ? { ...m, status: 'archived' } : m));
      } catch (err) { console.error(err); }
    };

    const handleDelete = async (documentId) => {
      try {
        await api.delete(`/artist-messages/${documentId}`);
        setInboxMessages(msgs => msgs.filter(m => m.documentId !== documentId));
        if (expandedId === documentId) setExpandedId(null);
      } catch (err) { console.error(err); }
    };

    const filtered = inboxMessages.filter(m => showArchived ? m.status === 'archived' : m.status !== 'archived');
    const newCount = inboxMessages.filter(m => m.status === 'new').length;

    return (
      <div className="space-y-6">
        {toastElement}
        <div className="rounded-2xl p-5 md:p-8 card-bg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-heading font-heading font-bold text-lg flex items-center gap-2">
              <MessageCircle size={20} className="text-accent" />
              {tx({ fr: 'Messages recus', en: 'Received messages', es: 'Mensajes recibidos' })}
              {newCount > 0 && (
                <span className="bg-accent text-white text-[10px] font-bold rounded-full px-2 py-0.5 animate-pulse">{newCount}</span>
              )}
            </h3>
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="text-grey-muted text-xs hover:text-heading transition-colors"
            >
              {showArchived ? tx({ fr: 'Voir actifs', en: 'Show active', es: 'Ver activos' }) : tx({ fr: 'Voir archives', en: 'Show archived', es: 'Ver archivados' })}
            </button>
          </div>

          {inboxLoading ? (
            <div className="flex items-center gap-2 text-grey-muted py-8 justify-center">
              <Loader2 size={16} className="animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-grey-muted text-sm text-center py-8">
              {showArchived
                ? tx({ fr: 'Aucun message archive.', en: 'No archived messages.', es: 'Sin mensajes archivados.' })
                : tx({ fr: 'Aucun message pour l\'instant.', en: 'No messages yet.', es: 'Sin mensajes por ahora.' })}
            </p>
          ) : (
            <div className="space-y-2">
              {filtered.map(msg => {
                const isExpanded = expandedId === msg.documentId;
                const isNew = msg.status === 'new';
                return (
                  <div key={msg.documentId} className={`rounded-xl overflow-hidden ${isNew ? 'ring-1 ring-accent/30' : ''}`}>
                    {/* Accordion header */}
                    <button
                      onClick={() => {
                        setExpandedId(isExpanded ? null : msg.documentId);
                        if (!isExpanded && isNew) {
                          api.put(`/artist-messages/${msg.documentId}/status`, { status: 'read' })
                            .then(() => setInboxMessages(msgs => msgs.map(m => m.documentId === msg.documentId ? { ...m, status: 'read' } : m)))
                            .catch(() => {});
                        }
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-black/20 hover:bg-black/30 transition-colors text-left focus:outline-none"
                    >
                      {isNew && <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0 animate-pulse" />}
                      <div className="flex-grow min-w-0">
                        <span className="text-heading font-semibold text-sm">{msg.senderName}</span>
                        <span className="text-grey-muted text-xs ml-2">{msg.senderEmail}</span>
                      </div>
                      <span className="text-grey-muted text-xs flex-shrink-0">{new Date(msg.createdAt).toLocaleDateString()}</span>
                      <ChevronDown size={14} className={`text-grey-muted flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Accordion body */}
                    {isExpanded && (
                      <div className="px-4 py-4 bg-black/10">
                        <p className="text-heading text-sm whitespace-pre-line mb-4">{msg.message}</p>

                        {msg.artistReply ? (
                          <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 mb-3">
                            <p className="text-accent text-xs font-semibold mb-1">{tx({ fr: 'Votre reponse', en: 'Your reply', es: 'Tu respuesta' })}</p>
                            <p className="text-heading text-sm whitespace-pre-line">{msg.artistReply}</p>
                          </div>
                        ) : replyingId === msg.documentId ? (
                          <div className="space-y-2 mb-3">
                            <textarea
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              rows={3}
                              placeholder={tx({ fr: 'Votre reponse...', en: 'Your reply...', es: 'Tu respuesta...' })}
                              className="w-full rounded-lg bg-black/20 border border-white/10 px-3 py-2 text-sm text-heading placeholder:text-grey-muted/50 focus:border-accent focus:outline-none resize-none"
                            />
                            <div className="flex gap-2">
                              <button onClick={() => handleReply(msg.documentId)} disabled={replySending || !replyText.trim()} className="btn-primary text-xs py-1.5 px-4 disabled:opacity-50">
                                {replySending ? '...' : tx({ fr: 'Envoyer', en: 'Send', es: 'Enviar' })}
                              </button>
                              <button onClick={() => { setReplyingId(null); setReplyText(''); }} className="text-grey-muted text-xs hover:text-heading">
                                {tx({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' })}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setReplyingId(msg.documentId)} className="text-accent text-xs hover:underline mb-3 block">
                            {tx({ fr: 'Repondre', en: 'Reply', es: 'Responder' })}
                          </button>
                        )}

                        <div className="flex gap-2 pt-2 border-t border-white/5">
                          {msg.status !== 'archived' && (
                            <button onClick={() => handleArchive(msg.documentId)} className="text-grey-muted text-xs hover:text-heading transition-colors">
                              {tx({ fr: 'Archiver', en: 'Archive', es: 'Archivar' })}
                            </button>
                          )}
                          <button onClick={() => handleDelete(msg.documentId)} className="text-red-400/60 text-xs hover:text-red-400 transition-colors">
                            {tx({ fr: 'Supprimer', en: 'Delete', es: 'Eliminar' })}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}

export default AccountArtistDashboard;
