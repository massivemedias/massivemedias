import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  DollarSign, Palette, Clock, CheckCircle,
  FileText, Loader2, AlertCircle, Package,
  Send, ImagePlus, Check, X, CreditCard, Download, ChevronDown, ChevronUp, ScrollText,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useUserRole } from '../contexts/UserRoleContext';
import { getCommissions } from '../services/adminService';
import { sendArtistMessage, getMyMessages, createWithdrawal, getMyWithdrawals } from '../services/artistService';
import { uploadArtistFile } from '../services/api';
import FileUpload from './FileUpload';
import artistsData from '../data/artists';
import { ARTIST_CONTRACT_TEXT, ARTIST_CONTRACT_TEXT_EN, ARTIST_CONTRACT_TEXT_ES, ARTIST_CONTRACT_VERSION } from '../data/artistContract';
import { generateContractPDF } from '../utils/generateContractPDF';

// Prix service (cout Massive) et prix artiste (prix client)
const SERVICE_PRICES = {
  studio: { a4: 20, a3: 25, a3plus: 35 },
  museum: { a4: 35, a3: 65, a3plus: 95, a2: 110 },
};
const ARTIST_PRICES = {
  studio: { a4: 35, a3: 50, a3plus: 65 },
  museum: { a4: 75, a3: 120, a3plus: 160, a2: 190 },
};
const FRAME_PRICE = 30;


function AccountArtistDashboard({ section = 'dashboard' }) {
  const { tx, lang } = useLang();
  const { user, updateProfile } = useAuth();
  const { artistSlug } = useUserRole();
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Artist profile
  const [artistProfileForm, setArtistProfileForm] = useState({ nomArtiste: '', bio: '', profileImage: '' });
  const [artistProfileSaving, setArtistProfileSaving] = useState(false);
  const [artistProfileMsg, setArtistProfileMsg] = useState('');
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImageUploading, setProfileImageUploading] = useState(false);

  // Images deposit
  const [imgFiles, setImgFiles] = useState([]);
  const [imgSending, setImgSending] = useState(false);
  const [imgSuccess, setImgSuccess] = useState('');
  const [imgNote, setImgNote] = useState('');

  // Messages (kept for sending image deposits as messages)
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(true);
  const [msgSuccess, setMsgSuccess] = useState('');

  // Retrait PayPal
  const [withdrawals, setWithdrawals] = useState([]);
  const [wdLoading, setWdLoading] = useState(true);
  const [showWdForm, setShowWdForm] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState('');
  const [wdAmount, setWdAmount] = useState('');
  const [wdNotes, setWdNotes] = useState('');
  const [wdSending, setWdSending] = useState(false);
  const [wdSuccess, setWdSuccess] = useState('');
  const [wdError, setWdError] = useState('');

  // Toast
  const [toast, setToast] = useState('');

  const artist = artistsData[artistSlug] || null;
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

  // Init artist profile form from user metadata
  useEffect(() => {
    if (!user) return;
    const meta = user.user_metadata || {};
    setArtistProfileForm({
      nomArtiste: meta.nomArtiste || '',
      bio: meta.bio || '',
      profileImage: meta.profileImage || '',
    });
  }, [user]);

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
      });
      if (error) throw error;

      // Send profile update to admin as a message
      const profileDetails = [
        `Nom d'artiste: ${artistProfileForm.nomArtiste || '-'}`,
        `Bio: ${artistProfileForm.bio || '-'}`,
        `Image de profil: ${artistProfileForm.profileImage || 'Aucune'}`,
        `Email: ${email}`,
        `Slug: ${artistSlug}`,
      ].join('\n');

      await sendArtistMessage({
        artistSlug,
        artistName: artistProfileForm.nomArtiste || artistSlug,
        email,
        subject: 'Mise a jour du profil artiste',
        message: profileDetails,
        category: 'update-profile',
        attachments: artistProfileForm.profileImage ? [{ name: 'photo-profil', url: artistProfileForm.profileImage }] : null,
      }).catch(() => {}); // silent fail if message fails

      setArtistProfileMsg(tx({ fr: 'Profil artiste sauvegarde!', en: 'Artist profile saved!', es: 'Perfil artista guardado!' }));
      setTimeout(() => setArtistProfileMsg(''), 3000);
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
      await sendArtistMessage({
        artistSlug,
        artistName: artist?.name || artistSlug,
        email,
        subject: tx({ fr: 'Depot de nouvelles images', en: 'New image deposit', es: 'Deposito de nuevas imagenes' }),
        message: imgNote.trim() || tx({ fr: 'Nouvelles images deposees', en: 'New images deposited', es: 'Nuevas imagenes depositadas' }),
        category: 'new-images',
        attachments: imgFiles.map(f => ({ name: f.name, url: f.url, size: f.size, mime: f.mime })),
      });
      setImgSuccess(tx({ fr: 'Images envoyees avec succes!', en: 'Images sent successfully!', es: 'Imagenes enviadas con exito!' }));
      setImgFiles([]);
      setImgNote('');
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
      setWdSuccess(tx({ fr: 'Demande de retrait envoyee!', en: 'Withdrawal request sent!', es: 'Solicitud de retiro enviada!' }));
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
        setWdError(tx({ fr: 'Tu as deja une demande en cours', en: 'You already have a pending request', es: 'Ya tienes una solicitud pendiente' }));
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
      completed: { label: tx({ fr: 'Complete', en: 'Completed', es: 'Completado' }), cls: 'bg-green-500/20 text-green-400' },
      rejected: { label: tx({ fr: 'Refuse', en: 'Rejected', es: 'Rechazado' }), cls: 'bg-red-500/20 text-red-400' },
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
            toast ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-green-500/10 border border-green-500/20 text-green-400'
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
            { value: loading ? '-' : formatMoney(totalEarned), label: tx({ fr: 'Gains totaux', en: 'Total earnings', es: 'Ganancias totales' }), color: 'text-green-400' },
            { value: loading ? '-' : formatMoney(totalPaid), label: tx({ fr: 'Deja paye', en: 'Already paid', es: 'Ya pagado' }), color: 'text-blue-400' },
            { value: loading ? '-' : formatMoney(balance), label: tx({ fr: 'Solde dispo', en: 'Balance', es: 'Saldo' }), color: balance > 0 ? 'text-accent' : 'text-grey-muted' },
            { value: loading ? '-' : orderCount, label: tx({ fr: 'Ventes', en: 'Sales', es: 'Ventas' }), color: 'text-purple-400' },
          ].map((s, i) => (
            <div key={i} className="text-center py-4 px-3 rounded-xl border border-purple-main/20 card-bg card-shadow">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-grey-muted uppercase tracking-wider mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Liens rapides */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {artist && (
            <Link to={`/artistes/${artistSlug}`} className="flex items-center gap-3 p-4 rounded-xl bg-accent/5 border border-accent/20 hover:bg-accent/10 transition-colors group">
              <Palette size={20} className="text-accent" />
              <div className="flex-grow">
                <p className="text-heading text-sm font-medium">{tx({ fr: 'Ma boutique', en: 'My store', es: 'Mi tienda' })}</p>
                <p className="text-grey-muted text-xs">massivemedias.com/artistes/{artistSlug}</p>
              </div>
            </Link>
          )}
          <a href="mailto:massivemedias@gmail.com" className="flex items-center gap-3 p-4 rounded-xl bg-green-500/5 border border-green-500/20 hover:bg-green-500/10 transition-colors group">
            <Send size={20} className="text-green-400" />
            <div className="flex-grow">
              <p className="text-heading text-sm font-medium">{tx({ fr: 'Envoyer des fichiers', en: 'Send files', es: 'Enviar archivos' })}</p>
              <p className="text-grey-muted text-xs">massivemedias@gmail.com</p>
            </div>
          </a>
        </div>

        {/* Rappels-cles du contrat */}
        <div className="rounded-2xl border border-purple-main/30 p-5 card-bg card-shadow">
          <h4 className="text-heading font-heading font-bold text-base mb-4 flex items-center gap-2">
            <ScrollText size={18} className="text-accent" />
            {tx({ fr: 'Points-cles de ton contrat', en: 'Key contract points', es: 'Puntos clave de tu contrato' })}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
              <p className="text-green-400 text-sm font-bold mb-1.5 flex items-center gap-2">
                <CheckCircle size={14} />
                {tx({ fr: 'Tes droits d\'auteur', en: 'Your copyrights', es: 'Tus derechos de autor' })}
              </p>
              <p className="text-grey-light text-xs leading-relaxed">
                {tx({
                  fr: 'Tu conserves 100% de tes droits. Massive detient uniquement une licence limitee, non-exclusive et revocable pour l\'impression et la vente en ligne.',
                  en: 'You keep 100% of your rights. Massive only holds a limited, non-exclusive, revocable license for printing and online sales.',
                  es: 'Conservas el 100% de tus derechos. Massive solo tiene una licencia limitada, no exclusiva y revocable para impresion y venta en linea.',
                })}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
              <p className="text-blue-400 text-sm font-bold mb-1.5 flex items-center gap-2">
                <CheckCircle size={14} />
                {tx({ fr: 'Prix uniformes', en: 'Uniform pricing', es: 'Precios uniformes' })}
              </p>
              <p className="text-grey-light text-xs leading-relaxed">
                {tx({
                  fr: 'La grille tarifaire est identique pour tous les artistes partenaires - memes prix, memes couts, memes marges. Aucun traitement preferentiel.',
                  en: 'The pricing grid is identical for all partner artists - same prices, same costs, same margins. No preferential treatment.',
                  es: 'La grilla de precios es identica para todos los artistas asociados - mismos precios, mismos costos, mismos margenes. Sin trato preferencial.',
                })}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
              <p className="text-purple-400 text-sm font-bold mb-1.5 flex items-center gap-2">
                <CheckCircle size={14} />
                {tx({ fr: 'Prints uniques (edition unique)', en: 'Unique prints (single edition)', es: 'Prints unicos (edicion unica)' })}
              </p>
              <p className="text-grey-light text-xs leading-relaxed">
                {tx({
                  fr: 'Un seul exemplaire produit, format fixe A2 qualite musee, sans cadre, non-reproductible. Une fois vendu, c\'est fini - piece de collection.',
                  en: 'Only one copy produced, fixed A2 museum quality format, no frame, non-reproducible. Once sold, it\'s gone - collector\'s piece.',
                  es: 'Solo una copia producida, formato fijo A2 calidad museo, sin marco, no reproducible. Una vez vendido, se acabo - pieza de coleccion.',
                })}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
              <p className="text-yellow-400 text-sm font-bold mb-1.5 flex items-center gap-2">
                <CheckCircle size={14} />
                {tx({ fr: 'Zero production sans accord', en: 'No production without approval', es: 'Sin produccion sin aprobacion' })}
              </p>
              <p className="text-grey-light text-xs leading-relaxed">
                {tx({
                  fr: 'Massive ne produit jamais de prints sans commande confirmee et payee. Aucune production speculative. Ton approbation ecrite est requise pour tout produit.',
                  en: 'Massive never produces prints without a confirmed, paid order. No speculative production. Your written approval is required for every product.',
                  es: 'Massive nunca produce prints sin pedido confirmado y pagado. Sin produccion especulativa. Tu aprobacion escrita es necesaria para cada producto.',
                })}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
              <p className="text-green-400 text-sm font-bold mb-1.5 flex items-center gap-2">
                <DollarSign size={14} />
                {tx({ fr: 'Copies perso au coutant', en: 'Personal copies at cost', es: 'Copias personales al costo' })}
              </p>
              <p className="text-grey-light text-xs leading-relaxed">
                {tx({
                  fr: 'Tu peux commander tes propres prints au prix coutant (colonne "Cout Massive") pour usage personnel, portfolio ou expos. Stickers: prix regulier pour tous.',
                  en: 'You can order your own prints at cost price ("Massive cost" column) for personal use, portfolio or exhibitions. Stickers: regular price for everyone.',
                  es: 'Puedes pedir tus propios prints al precio de costo (columna "Costo Massive") para uso personal, portafolio o exposiciones. Stickers: precio regular para todos.',
                })}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
              <p className="text-purple-400 text-sm font-bold mb-1.5 flex items-center gap-2">
                <Package size={14} />
                {tx({ fr: 'Vente en personne (festivals, galeries)', en: 'In-person sales (festivals, galleries)', es: 'Venta en persona (festivales, galerias)' })}
              </p>
              <p className="text-grey-light text-xs leading-relaxed">
                {tx({
                  fr: 'Commande en volume au prix regulier et revends au prix que tu veux. Le profit supplementaire est 100% pour toi.',
                  en: 'Order in bulk at regular price and resell at whatever price you want. The extra profit is 100% yours.',
                  es: 'Pide en volumen al precio regular y revende al precio que quieras. La ganancia adicional es 100% tuya.',
                })}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
              <p className="text-blue-400 text-sm font-bold mb-1.5 flex items-center gap-2">
                <CheckCircle size={14} />
                {tx({ fr: 'Fichiers proteges', en: 'Protected files', es: 'Archivos protegidos' })}
              </p>
              <p className="text-grey-light text-xs leading-relaxed">
                {tx({
                  fr: 'Tes fichiers haute-resolution ne sont jamais partages, publies en ligne en haute-res, ni utilises hors du cadre du contrat. Seulement 72 DPI + watermark sur le site.',
                  en: 'Your high-resolution files are never shared, published online in high-res, or used outside the scope of the contract. Only 72 DPI + watermark on the website.',
                  es: 'Tus archivos de alta resolucion nunca se comparten, publican en alta-res en linea, ni se usan fuera del alcance del contrato. Solo 72 DPI + watermark en el sitio.',
                })}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
              <p className="text-yellow-400 text-sm font-bold mb-1.5 flex items-center gap-2">
                <Clock size={14} />
                {tx({ fr: 'Resiliation libre', en: 'Free termination', es: 'Terminacion libre' })}
              </p>
              <p className="text-grey-light text-xs leading-relaxed">
                {tx({
                  fr: 'Tu peux quitter a tout moment avec 30 jours de preavis par email. Tes fichiers sont supprimes de nos serveurs sous 14 jours, confirmation ecrite incluse.',
                  en: 'You can leave at any time with 30 days written notice by email. Your files are deleted from our servers within 14 days, written confirmation included.',
                  es: 'Puedes salir en cualquier momento con 30 dias de preaviso por email. Tus archivos se eliminan de nuestros servidores en 14 dias, confirmacion escrita incluida.',
                })}
              </p>
            </div>
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
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-purple-main/30 p-5 md:p-8 card-bg card-shadow">
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
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent/10 border border-accent/30 text-accent text-sm font-semibold hover:bg-accent/20 transition-colors flex-shrink-0"
            >
              <Download size={16} />
              {tx({ fr: 'PDF', en: 'PDF', es: 'PDF' })}
            </button>
          </div>
          <div
            className="contract-content prose prose-invert prose-sm max-w-none max-h-[70vh] overflow-y-auto rounded-xl bg-glass p-5 md:p-6 border border-purple-main/10 text-grey-light text-sm md:text-base leading-relaxed"
            dangerouslySetInnerHTML={{ __html: contractText }}
          />
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
        <div className="rounded-2xl border border-purple-main/30 p-5 md:p-8 card-bg card-shadow">
          <h3 className="text-heading font-heading font-bold text-lg mb-2 flex items-center gap-2">
            <FileText size={20} className="text-accent" />
            {tx({ fr: 'Grille tarifaire', en: 'Pricing grid', es: 'Grilla de precios' })}
          </h3>
          <p className="text-grey-muted text-xs mb-6">
            {tx({
              fr: 'Prix affiches aux clients dans ta boutique. Ta marge = prix client - cout impression Massive. Le cadre (30$) va entierement a Massive. TPS + TVQ en sus.',
              en: 'Prices shown to customers in your store. Your margin = client price - Massive print cost. Frame ($30) goes entirely to Massive. GST + QST extra.',
              es: 'Precios mostrados a los clientes en tu tienda. Tu margen = precio cliente - costo impresion Massive. El marco (30$) va completamente a Massive. Impuestos adicionales.',
            })}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-grey-muted text-[10px] sm:text-xs uppercase tracking-wider border-b border-purple-main/20">
                  <th className="text-left py-2 pr-1 sm:pr-3">{tx({ fr: 'Format', en: 'Format', es: 'Formato' })}</th>
                  <th className="text-right py-2 px-1 sm:px-2">{tx({ fr: 'Prix client', en: 'Client price', es: 'Precio cliente' })}</th>
                  <th className="text-right py-2 px-1 sm:px-2">{tx({ fr: 'Cout Massive', en: 'Massive cost', es: 'Costo Massive' })}</th>
                  <th className="text-right py-2 px-1 sm:px-2 text-green-400">{tx({ fr: 'Ta marge', en: 'Your margin', es: 'Tu margen' })}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-purple-main/10"><td colSpan="4" className="pt-3 pb-1 text-accent font-semibold text-xs">{tx({ fr: 'Serie Studio (4 encres pigmentees)', en: 'Studio Series (4 pigment inks)', es: 'Serie Studio (4 tintas pigmentadas)' })}</td></tr>
                {[{ format: 'A4 (8.5x11")', key: 'a4' }, { format: 'A3 (11x17")', key: 'a3' }, { format: 'A3+ (13x19")', key: 'a3plus' }].map(({ format, key }) => (
                  <tr key={`s-${key}`} className="border-b border-purple-main/10 hover:bg-accent/5 transition-colors">
                    <td className="py-2 pr-1 sm:pr-3 text-heading text-xs sm:text-sm">{format}</td>
                    <td className="py-2 px-1 sm:px-2 text-right text-heading text-xs sm:text-sm">{ARTIST_PRICES.studio[key]}$</td>
                    <td className="py-2 px-1 sm:px-2 text-right text-grey-muted text-xs sm:text-sm">{SERVICE_PRICES.studio[key]}$</td>
                    <td className="py-2 px-1 sm:px-2 text-right text-green-400 font-semibold text-xs sm:text-sm">{ARTIST_PRICES.studio[key] - SERVICE_PRICES.studio[key]}$</td>
                  </tr>
                ))}
                <tr className="border-b border-purple-main/10"><td colSpan="4" className="pt-4 pb-1 text-accent font-semibold text-xs">{tx({ fr: 'Serie Musee (12 encres pigmentees)', en: 'Museum Series (12 pigment inks)', es: 'Serie Museo (12 tintas pigmentadas)' })}</td></tr>
                {[{ format: 'A4 (8.5x11")', key: 'a4' }, { format: 'A3 (11x17")', key: 'a3' }, { format: 'A3+ (13x19")', key: 'a3plus' }, { format: 'A2 (18x24")', key: 'a2' }].map(({ format, key }) => (
                  <tr key={`m-${key}`} className="border-b border-purple-main/10 hover:bg-accent/5 transition-colors">
                    <td className="py-2 pr-1 sm:pr-3 text-heading text-xs sm:text-sm">{format}</td>
                    <td className="py-2 px-1 sm:px-2 text-right text-heading text-xs sm:text-sm">{ARTIST_PRICES.museum[key]}$</td>
                    <td className="py-2 px-1 sm:px-2 text-right text-grey-muted text-xs sm:text-sm">{SERVICE_PRICES.museum[key]}$</td>
                    <td className="py-2 px-1 sm:px-2 text-right text-green-400 font-semibold text-xs sm:text-sm">{ARTIST_PRICES.museum[key] - SERVICE_PRICES.museum[key]}$</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-purple-main/20">
                  <td className="py-2 pr-1 sm:pr-3 text-heading font-medium text-xs sm:text-sm">{tx({ fr: 'Cadre (noir ou blanc)', en: 'Frame (black or white)', es: 'Marco (negro o blanco)' })}</td>
                  <td className="py-2 px-2 text-right text-heading">{FRAME_PRICE}$</td>
                  <td className="py-2 px-1 sm:px-2 text-right text-grey-muted text-xs sm:text-sm">{FRAME_PRICE}$</td>
                  <td className="py-2 px-1 sm:px-2 text-right text-grey-muted text-xs sm:text-sm">0$</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-grey-muted text-xs mt-4 italic">
            {tx({
              fr: 'Note: Le format A2 (18x24") est imprime en qualite musee uniquement. Pas de cadre disponible pour ce format.',
              en: 'Note: A2 (18x24") is printed in museum quality only. No frame available for this format.',
              es: 'Nota: El formato A2 (18x24") se imprime en calidad museo unicamente. Sin marco disponible para este formato.',
            })}
          </p>
        </div>

        {/* Notes copies perso + festivals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-yellow-500/5 border border-yellow-500/20 card-shadow">
            <p className="text-yellow-400 text-sm font-bold mb-2">
              {tx({ fr: 'Copies personnelles', en: 'Personal copies', es: 'Copias personales' })}
            </p>
            <p className="text-grey-light text-xs leading-relaxed">
              {tx({
                fr: 'Prints: tu peux commander tes propres copies au prix coutant (colonne "Cout Massive"), pour usage personnel, portfolio ou expos uniquement. Stickers: prix regulier, meme pour toi.',
                en: 'Prints: you can order your own copies at cost price ("Massive cost" column), for personal use, portfolio or exhibitions only. Stickers: regular price, even for you.',
                es: 'Prints: puedes pedir tus propias copias al precio de costo (columna "Costo Massive"), solo para uso personal, portafolio o exposiciones. Stickers: precio regular, incluso para ti.',
              })}
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-purple-500/5 border border-purple-500/20 card-shadow">
            <p className="text-purple-400 text-sm font-bold mb-2">
              {tx({ fr: 'Festivals, galeries et boutiques', en: 'Festivals, galleries and shops', es: 'Festivales, galerias y tiendas' })}
            </p>
            <p className="text-grey-light text-xs leading-relaxed">
              {tx({
                fr: 'Commande en volume au prix regulier (colonne "Prix client"), et revends au prix que tu veux. Le profit supplementaire est 100% pour toi.',
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
  // SECTION: PROFIL ARTISTE
  // ===========================
  if (section === 'profil-artiste') {
    return (
      <div className="space-y-6">
        {toastElement}
        <div className="rounded-2xl border border-purple-main/30 p-5 md:p-8 card-bg card-shadow">
          <h3 className="text-heading font-heading font-bold text-lg flex items-center gap-2 mb-6">
            <Palette size={20} className="text-accent" />
            {tx({ fr: 'Mon profil artiste', en: 'My artist profile', es: 'Mi perfil artista' })}
          </h3>

          {artistProfileMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2"
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
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-accent/30 flex-shrink-0 bg-glass flex items-center justify-center">
                  {artistProfileForm.profileImage ? (
                    <img src={artistProfileForm.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Palette size={28} className="text-accent/40" />
                  )}
                </div>
                <div className="flex-grow">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 border border-accent/20 text-accent text-sm font-semibold hover:bg-accent/20 transition-colors">
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
                    {tx({ fr: 'JPG, PNG ou WebP. Carre recommande.', en: 'JPG, PNG or WebP. Square recommended.', es: 'JPG, PNG o WebP. Cuadrado recomendado.' })}
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

            {/* Info boutique */}
            {artist ? (
              <div className="rounded-lg bg-accent/5 border border-accent/20 p-4">
                <p className="text-grey-muted text-xs flex items-center gap-2">
                  <Palette size={14} className="text-accent" />
                  {tx({ fr: 'Ta boutique:', en: 'Your store:', es: 'Tu tienda:' })}
                  <a href={`/artistes/${artistSlug}`} className="text-accent hover:underline font-medium">
                    massivemedias.com/artistes/{artistSlug}
                  </a>
                </p>
              </div>
            ) : (
              <div className="rounded-lg bg-yellow-500/5 border border-yellow-500/20 p-4">
                <p className="text-yellow-400 text-xs flex items-center gap-2">
                  <Clock size={14} />
                  {tx({
                    fr: 'Ta page artiste sera creee par Massive une fois ton profil complete. Tu recevras une notification.',
                    en: 'Your artist page will be created by Massive once your profile is complete. You\'ll be notified.',
                    es: 'Tu pagina de artista sera creada por Massive una vez que tu perfil este completo. Seras notificado.',
                  })}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={artistProfileSaving}
              className="btn-primary text-sm py-2.5 px-6 disabled:opacity-50"
            >
              {artistProfileSaving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Check size={14} className="mr-1.5" />}
              {tx({ fr: 'Sauvegarder', en: 'Save', es: 'Guardar' })}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ===========================
  // SECTION: MES IMAGES
  // ===========================
  if (section === 'images') {
    // Filter image deposit messages
    const imageDeposits = messages.filter(m => m.category === 'new-images' && m.attachments?.length > 0);

    return (
      <div className="space-y-6">
        {toastElement}

        {/* Formulaire depot d'images */}
        <div className="rounded-2xl border border-purple-main/30 p-5 md:p-8 card-bg card-shadow">
          <h3 className="text-heading font-heading font-bold text-lg flex items-center gap-2 mb-2">
            <ImagePlus size={20} className="text-accent" />
            {tx({ fr: 'Deposer de nouvelles images', en: 'Submit new images', es: 'Enviar nuevas imagenes' })}
          </h3>
          <p className="text-grey-muted text-sm mb-6">
            {tx({
              fr: 'Depose tes images haute-resolution ici. On les traitera et les ajoutera a ta boutique.',
              en: 'Upload your high-resolution images here. We\'ll process them and add them to your store.',
              es: 'Sube tus imagenes de alta resolucion aqui. Las procesaremos y las agregaremos a tu tienda.',
            })}
          </p>

          {imgSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2"
            >
              <Check size={16} />
              {imgSuccess}
            </motion.div>
          )}

          <form onSubmit={handleImageDeposit} className="space-y-4">
            <FileUpload
              label={tx({ fr: 'Images a deposer (max 20 fichiers, 130 MB chacun)', en: 'Images to submit (max 20 files, 130 MB each)', es: 'Imagenes a enviar (max 20 archivos, 130 MB c/u)' })}
              files={imgFiles}
              onFilesChange={setImgFiles}
              maxFiles={20}
              uploadFn={uploadArtistFile}
            />

            <div>
              <label className="text-[11px] text-grey-muted uppercase tracking-wider font-medium mb-1 block">
                {tx({ fr: 'Note (optionnel)', en: 'Note (optional)', es: 'Nota (opcional)' })}
              </label>
              <textarea
                value={imgNote}
                onChange={(e) => setImgNote(e.target.value)}
                className="input-field text-sm min-h-[80px] resize-y"
                placeholder={tx({
                  fr: 'Instructions speciales, titres des oeuvres, formats souhaites...',
                  en: 'Special instructions, artwork titles, desired formats...',
                  es: 'Instrucciones especiales, titulos de las obras, formatos deseados...',
                })}
              />
            </div>

            <button
              type="submit"
              disabled={imgSending || imgFiles.length === 0}
              className="btn-primary text-sm py-2.5 px-6 disabled:opacity-50"
            >
              {imgSending ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Send size={14} className="mr-1.5" />}
              {tx({ fr: 'Envoyer les images', en: 'Send images', es: 'Enviar imagenes' })}
            </button>
          </form>
        </div>

        {/* Historique des depots */}
        <div className="rounded-2xl border border-purple-main/30 p-5 md:p-8 card-bg card-shadow">
          <h3 className="text-heading font-heading font-bold text-base flex items-center gap-2 mb-4">
            <Clock size={18} className="text-accent" />
            {tx({ fr: 'Historique des depots', en: 'Deposit history', es: 'Historial de depositos' })}
          </h3>

          {!msgLoading && imageDeposits.length > 0 ? (
            <div className="space-y-3">
              {imageDeposits.map((m, i) => (
                <div key={m.documentId || i} className="rounded-lg border border-purple-main/10 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-grey-muted text-xs">{m.createdAt ? new Date(m.createdAt).toLocaleDateString('fr-CA') : ''}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      m.status === 'replied' ? 'bg-green-500/20 text-green-400' :
                      m.status === 'read' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {m.status === 'replied' ? tx({ fr: 'Traite', en: 'Processed', es: 'Procesado' }) :
                       m.status === 'read' ? tx({ fr: 'En cours', en: 'In progress', es: 'En progreso' }) :
                       tx({ fr: 'Envoye', en: 'Sent', es: 'Enviado' })}
                    </span>
                  </div>
                  {m.message && m.message !== 'Nouvelles images deposees' && (
                    <p className="text-grey-light text-xs mb-2">{m.message}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {m.attachments.map((att, j) => (
                      <a key={j} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-1 rounded bg-accent/10 border border-accent/20 text-[10px] text-accent hover:bg-accent/20 transition-colors">
                        <ImagePlus size={10} />
                        {att.name?.length > 25 ? att.name.substring(0, 25) + '...' : att.name}
                      </a>
                    ))}
                  </div>
                  {m.adminReply && (
                    <div className="mt-2 p-3 rounded bg-accent/5 border border-accent/10">
                      <p className="text-[10px] text-accent font-semibold mb-0.5">Massive :</p>
                      <p className="text-grey-light text-xs">{m.adminReply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : !msgLoading ? (
            <div className="text-center py-8">
              <ImagePlus size={32} className="text-grey-muted/20 mx-auto mb-2" />
              <p className="text-grey-muted text-sm">
                {tx({
                  fr: 'Aucun depot d\'images pour l\'instant.',
                  en: 'No image deposits yet.',
                  es: 'Sin depositos de imagenes por el momento.',
                })}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-grey-muted py-8 justify-center"><Loader2 size={16} className="animate-spin" /></div>
          )}
        </div>
      </div>
    );
  }

  // ===========================
  // SECTION: RETRAIT PAYPAL
  // ===========================
  if (section === 'retrait') {
    return (
      <div className="space-y-6">
        {toastElement}
        <div className="rounded-2xl border border-purple-main/30 p-5 md:p-8 card-bg card-shadow">
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
            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3 mb-4 flex items-center gap-2">
              <Clock size={14} className="text-yellow-400 flex-shrink-0" />
              <p className="text-yellow-400 text-xs">
                {tx({
                  fr: 'Tu as deja une demande de retrait en cours. Massive va traiter ta demande sous 24-48h.',
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
                <div className="rounded-lg bg-accent/5 border border-accent/20 p-4 mb-4 space-y-3">
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
                  <div key={w.documentId || i} className="flex items-center justify-between py-3 border-b border-purple-main/10 last:border-0">
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

  // ===========================
  // SECTION: VENTES
  // ===========================
  if (section === 'ventes') {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-purple-main/30 p-5 md:p-8 card-bg card-shadow">
          <h3 className="text-heading font-heading font-bold text-lg mb-6 flex items-center gap-2">
            <Clock size={20} className="text-accent" />
            {tx({ fr: 'Historique des ventes', en: 'Sales history', es: 'Historial de ventas' })}
          </h3>

          {/* Mini stats en haut */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="text-center py-3 px-2 rounded-xl border border-purple-main/15 card-bg">
              <p className="text-lg font-bold text-green-400">{loading ? '-' : formatMoney(totalEarned)}</p>
              <p className="text-[10px] text-grey-muted uppercase tracking-wider">{tx({ fr: 'Gains totaux', en: 'Total earnings', es: 'Ganancias totales' })}</p>
            </div>
            <div className="text-center py-3 px-2 rounded-xl border border-purple-main/15 card-bg">
              <p className="text-lg font-bold text-blue-400">{loading ? '-' : formatMoney(totalPaid)}</p>
              <p className="text-[10px] text-grey-muted uppercase tracking-wider">{tx({ fr: 'Deja paye', en: 'Already paid', es: 'Ya pagado' })}</p>
            </div>
            <div className="text-center py-3 px-2 rounded-xl border border-purple-main/15 card-bg">
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
                <div key={c.documentId || i} className="flex items-center justify-between py-3 border-b border-purple-main/10 last:border-0">
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
      </div>
    );
  }

  // Fallback
  return null;
}

export default AccountArtistDashboard;
