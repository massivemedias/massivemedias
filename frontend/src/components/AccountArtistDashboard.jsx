import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  DollarSign, TrendingUp, Palette, Clock, CheckCircle,
  FileText, Loader2, AlertCircle, ExternalLink, Package,
  Send, MessageCircle, ImagePlus, Check, X, CreditCard,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useUserRole } from '../contexts/UserRoleContext';
import { getCommissions } from '../services/adminService';
import { sendArtistMessage, getMyMessages, createWithdrawal, getMyWithdrawals } from '../services/artistService';
import artistsData from '../data/artists';

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

const MSG_CATEGORIES = [
  { value: 'new-images', labelFr: 'Deposer de nouvelles images', labelEn: 'Submit new images', labelEs: 'Enviar nuevas imagenes' },
  { value: 'update-profile', labelFr: 'Modifier mon profil', labelEn: 'Update my profile', labelEs: 'Actualizar mi perfil' },
  { value: 'question', labelFr: 'Question generale', labelEn: 'General question', labelEs: 'Pregunta general' },
  { value: 'other', labelFr: 'Autre', labelEn: 'Other', labelEs: 'Otro' },
];

function AccountArtistDashboard() {
  const { tx, lang } = useLang();
  const { user } = useAuth();
  const { artistSlug } = useUserRole();
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Messages
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(true);
  const [showMsgForm, setShowMsgForm] = useState(false);
  const [msgForm, setMsgForm] = useState({ category: 'new-images', subject: '', message: '' });
  const [msgSending, setMsgSending] = useState(false);
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!msgForm.subject.trim() || !msgForm.message.trim()) return;

    setMsgSending(true);
    try {
      await sendArtistMessage({
        artistSlug,
        artistName: artist?.name || artistSlug,
        email,
        subject: msgForm.subject,
        message: msgForm.message,
        category: msgForm.category,
      });
      setMsgSuccess(tx({ fr: 'Message envoye!', en: 'Message sent!', es: 'Mensaje enviado!' }));
      setMsgForm({ category: 'new-images', subject: '', message: '' });
      setShowMsgForm(false);
      // Refresh messages
      const { data } = await getMyMessages(email);
      setMessages(data.data || []);
      setTimeout(() => setMsgSuccess(''), 3000);
    } catch {
      setToast(tx({ fr: 'Erreur envoi message', en: 'Error sending message', es: 'Error al enviar' }));
      setTimeout(() => setToast(''), 3000);
    } finally {
      setMsgSending(false);
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

  return (
    <div className="space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {(msgSuccess || wdSuccess || toast) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg text-sm flex items-center gap-2 shadow-lg ${
              toast ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-green-500/10 border border-green-500/20 text-green-400'
            }`}
          >
            <Check size={16} />
            {msgSuccess || wdSuccess || toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header artiste */}
      <div className="flex items-center gap-4 mb-2">
        {artist?.avatar && (
          <img src={artist.avatar} alt={artist?.name} className="w-12 h-12 rounded-full object-cover border-2 border-accent/40" />
        )}
        <div>
          <h3 className="text-heading font-heading font-bold text-lg flex items-center gap-2">
            <Palette size={18} className="text-accent" />
            {tx({ fr: 'Tableau de bord artiste', en: 'Artist Dashboard', es: 'Panel de artista' })}
          </h3>
          {artist && (
            <p className="text-grey-muted text-sm">
              {artist.name} - {artist.prints?.length || 0} {tx({ fr: 'oeuvres en ligne', en: 'artworks online', es: 'obras en linea' })}
            </p>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: DollarSign, value: loading ? '-' : formatMoney(totalEarned), label: tx({ fr: 'Gains totaux', en: 'Total earnings', es: 'Ganancias totales' }), color: 'text-green-400', bgColor: 'bg-green-500/10' },
          { icon: CheckCircle, value: loading ? '-' : formatMoney(totalPaid), label: tx({ fr: 'Deja paye', en: 'Already paid', es: 'Ya pagado' }), color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
          { icon: TrendingUp, value: loading ? '-' : formatMoney(balance), label: tx({ fr: 'Solde disponible', en: 'Available balance', es: 'Saldo disponible' }), color: balance > 0 ? 'text-accent' : 'text-grey-muted', bgColor: balance > 0 ? 'bg-accent/10' : 'bg-grey-500/10' },
          { icon: Package, value: loading ? '-' : orderCount, label: tx({ fr: 'Commandes', en: 'Orders', es: 'Pedidos' }), color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl border border-purple-main/20 p-4 card-bg card-shadow text-center">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${stat.bgColor} mb-2`}>
              <stat.icon size={18} className={stat.color} />
            </div>
            <p className="text-xl font-bold text-heading">{stat.value}</p>
            <p className="text-xs text-grey-muted mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ====== RETRAIT PAYPAL ====== */}
      <div className="rounded-2xl border border-purple-main/30 p-5 card-bg card-shadow">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-heading font-semibold text-sm flex items-center gap-2">
            <CreditCard size={16} className="text-accent" />
            {tx({ fr: 'Retirer mon argent (PayPal)', en: 'Withdraw money (PayPal)', es: 'Retirar dinero (PayPal)' })}
          </h4>
          {balance > 0 && !hasPendingWithdrawal && (
            <button
              onClick={() => setShowWdForm(!showWdForm)}
              className="btn-primary text-xs py-1.5 px-4"
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
        {!wdLoading && withdrawals.length > 0 && (
          <div className="space-y-2">
            {withdrawals.slice(0, 5).map((w, i) => {
              const badge = getStatusBadge(w.status);
              return (
                <div key={w.documentId || i} className="flex items-center justify-between py-2 border-b border-purple-main/10 last:border-0">
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
        )}

        {!wdLoading && withdrawals.length === 0 && !showWdForm && (
          <p className="text-grey-muted text-xs text-center py-2">
            {balance > 0
              ? tx({ fr: 'Aucun retrait effectue. Clique "Demander un retrait" pour recevoir ton argent via PayPal.', en: 'No withdrawals yet. Click "Request withdrawal" to receive your money via PayPal.', es: 'Sin retiros aun. Haz clic en "Solicitar retiro" para recibir tu dinero via PayPal.' })
              : tx({ fr: 'Aucun solde disponible pour le moment.', en: 'No balance available at this time.', es: 'Sin saldo disponible por el momento.' })
            }
          </p>
        )}
      </div>

      {/* ====== MESSAGERIE ====== */}
      <div className="rounded-2xl border border-purple-main/30 p-5 card-bg card-shadow">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-heading font-semibold text-sm flex items-center gap-2">
            <MessageCircle size={16} className="text-accent" />
            {tx({ fr: 'Messages a Massive', en: 'Messages to Massive', es: 'Mensajes a Massive' })}
          </h4>
          <button
            onClick={() => setShowMsgForm(!showMsgForm)}
            className="btn-primary text-xs py-1.5 px-4"
          >
            <ImagePlus size={14} className="mr-1" />
            {tx({ fr: 'Nouveau message', en: 'New message', es: 'Nuevo mensaje' })}
          </button>
        </div>

        {/* Formulaire message */}
        <AnimatePresence>
          {showMsgForm && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleSendMessage}
              className="overflow-hidden"
            >
              <div className="rounded-lg bg-accent/5 border border-accent/20 p-4 mb-4 space-y-3">
                <div>
                  <label className="text-[11px] text-grey-muted uppercase tracking-wider font-medium mb-1 block">
                    {tx({ fr: 'Categorie', en: 'Category', es: 'Categoria' })}
                  </label>
                  <select
                    value={msgForm.category}
                    onChange={(e) => setMsgForm(f => ({ ...f, category: e.target.value }))}
                    className="input-field text-sm"
                  >
                    {MSG_CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>
                        {lang === 'en' ? c.labelEn : lang === 'es' ? c.labelEs : c.labelFr}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-grey-muted uppercase tracking-wider font-medium mb-1 block">
                    {tx({ fr: 'Sujet', en: 'Subject', es: 'Asunto' })}
                  </label>
                  <input
                    type="text"
                    value={msgForm.subject}
                    onChange={(e) => setMsgForm(f => ({ ...f, subject: e.target.value }))}
                    className="input-field text-sm"
                    placeholder={tx({ fr: 'Ex: Nouvelles images a ajouter', en: 'Ex: New images to add', es: 'Ej: Nuevas imagenes para agregar' })}
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-grey-muted uppercase tracking-wider font-medium mb-1 block">
                    {tx({ fr: 'Message', en: 'Message', es: 'Mensaje' })}
                  </label>
                  <textarea
                    value={msgForm.message}
                    onChange={(e) => setMsgForm(f => ({ ...f, message: e.target.value }))}
                    className="input-field text-sm min-h-[100px] resize-y"
                    placeholder={tx({
                      fr: 'Decris ta demande... Pour les images, envoie les fichiers par email a massivemedias@gmail.com ou partage un lien Google Drive / WeTransfer.',
                      en: 'Describe your request... For images, send files by email to massivemedias@gmail.com or share a Google Drive / WeTransfer link.',
                      es: 'Describe tu solicitud... Para imagenes, envia los archivos por email a massivemedias@gmail.com o comparte un enlace de Google Drive / WeTransfer.',
                    })}
                    required
                  />
                </div>
                <p className="text-grey-muted text-[10px]">
                  {tx({
                    fr: 'Pour envoyer des fichiers images, utilise massivemedias@gmail.com ou partage un lien (Google Drive, WeTransfer, Dropbox).',
                    en: 'To send image files, use massivemedias@gmail.com or share a link (Google Drive, WeTransfer, Dropbox).',
                    es: 'Para enviar archivos de imagenes, usa massivemedias@gmail.com o comparte un enlace (Google Drive, WeTransfer, Dropbox).',
                  })}
                </p>
                <div className="flex gap-2">
                  <button type="submit" disabled={msgSending} className="btn-primary text-xs py-2 px-6 disabled:opacity-50">
                    {msgSending ? <Loader2 size={14} className="animate-spin mr-1" /> : <Send size={14} className="mr-1" />}
                    {tx({ fr: 'Envoyer', en: 'Send', es: 'Enviar' })}
                  </button>
                  <button type="button" onClick={() => setShowMsgForm(false)} className="text-grey-muted text-xs hover:text-heading transition-colors">
                    {tx({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' })}
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Liste des messages */}
        {!msgLoading && messages.length > 0 ? (
          <div className="space-y-2">
            {messages.slice(0, 10).map((m, i) => (
              <div key={m.documentId || i} className="rounded-lg border border-purple-main/10 p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-heading text-sm font-medium">{m.subject}</p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    m.status === 'replied' ? 'bg-green-500/20 text-green-400' :
                    m.status === 'read' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {m.status === 'replied' ? tx({ fr: 'Repondu', en: 'Replied', es: 'Respondido' }) :
                     m.status === 'read' ? tx({ fr: 'Lu', en: 'Read', es: 'Leido' }) :
                     tx({ fr: 'Envoye', en: 'Sent', es: 'Enviado' })}
                  </span>
                </div>
                <p className="text-grey-muted text-xs truncate">{m.message}</p>
                <p className="text-grey-muted/60 text-[10px] mt-1">{m.createdAt ? new Date(m.createdAt).toLocaleDateString('fr-CA') : ''}</p>
                {m.adminReply && (
                  <div className="mt-2 p-2 rounded bg-accent/5 border border-accent/10">
                    <p className="text-[10px] text-accent font-semibold mb-0.5">Massive :</p>
                    <p className="text-grey-light text-xs">{m.adminReply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : !msgLoading ? (
          <p className="text-grey-muted text-xs text-center py-2">
            {tx({
              fr: 'Aucun message. Envoie un message pour deposer de nouvelles images ou poser une question.',
              en: 'No messages. Send a message to submit new images or ask a question.',
              es: 'Sin mensajes. Envia un mensaje para enviar nuevas imagenes o hacer una pregunta.',
            })}
          </p>
        ) : null}
      </div>

      {/* ====== EXEMPLE CONCRET ====== */}
      <div className="rounded-2xl border border-purple-main/30 p-5 card-bg card-shadow">
        <h4 className="text-heading font-heading font-bold text-base mb-4 flex items-center gap-2">
          <DollarSign size={18} className="text-accent" />
          {tx({ fr: 'Comment ca marche', en: 'How it works', es: 'Como funciona' })}
        </h4>
        <div className="bg-purple-500/5 rounded-lg p-4 border border-purple-main/20 mb-4">
          <p className="text-sm text-heading font-medium leading-relaxed">
            <span className="text-accent font-bold">{tx({ fr: 'Exemple :', en: 'Example:', es: 'Ejemplo:' })}</span>{' '}
            {tx({
              fr: 'Le client achete un print qualite musee avec frame. Il paie',
              en: 'The client buys a museum quality print with frame. They pay',
              es: 'El cliente compra un print calidad museo con marco. Paga',
            })}{' '}
            <span className="text-heading font-bold text-lg">105$</span>{' '}
            <span className="text-grey-muted">{tx({ fr: '(+ taxes)', en: '(+ taxes)', es: '(+ impuestos)' })}</span>.{' '}
            {tx({ fr: 'Ou va l\'argent?', en: 'Where does the money go?', es: 'A donde va el dinero?' })}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="bg-green-500/10 rounded-xl p-4 text-center border border-green-500/20">
            <div className="text-3xl font-bold text-green-400">35$</div>
            <div className="text-xs text-green-400 font-bold mt-1 uppercase tracking-wider">Massive - Impression</div>
            <div className="text-[11px] text-grey-muted mt-3 text-left space-y-1">
              <p>{tx({ fr: '- Papier d\'archives', en: '- Archival paper', es: '- Papel de archivo' })}</p>
              <p>{tx({ fr: '- 12 encres pigmentees', en: '- 12 pigment inks', es: '- 12 tintas pigmentadas' })}</p>
              <p>{tx({ fr: '- Calibration couleurs', en: '- Color calibration', es: '- Calibracion de colores' })}</p>
              <p>{tx({ fr: '- Soft proofing', en: '- Soft proofing', es: '- Soft proofing' })}</p>
            </div>
          </div>
          <div className="bg-green-500/10 rounded-xl p-4 text-center border border-green-500/20">
            <div className="text-3xl font-bold text-green-400">30$</div>
            <div className="text-xs text-green-400 font-bold mt-1 uppercase tracking-wider">Massive - Frame</div>
            <div className="text-[11px] text-grey-muted mt-3 text-left space-y-1">
              <p>{tx({ fr: '- Cadre noir ou blanc', en: '- Black or white frame', es: '- Marco negro o blanco' })}</p>
              <p>{tx({ fr: '- Materiaux + assemblage', en: '- Materials + assembly', es: '- Materiales + ensamblaje' })}</p>
            </div>
          </div>
          <div className="bg-purple-500/15 rounded-xl p-4 text-center border border-purple-500/30">
            <div className="text-3xl font-bold text-purple-400">40$</div>
            <div className="text-xs text-purple-400 font-bold mt-1 uppercase tracking-wider">{tx({ fr: 'Toi - Profit net', en: 'You - Net profit', es: 'Tu - Beneficio neto' })}</div>
            <div className="text-[11px] text-grey-muted mt-3 text-left space-y-1">
              <p>{tx({ fr: '- Tu fournis ton fichier', en: '- You provide your file', es: '- Proporcionas tu archivo' })}</p>
              <p>{tx({ fr: '- Zero gestion', en: '- Zero management', es: '- Cero gestion' })}</p>
              <p>{tx({ fr: '- Zero frais', en: '- Zero fees', es: '- Cero costos' })}</p>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-grey-muted">
          35$ + 30$ + 40$ = <span className="text-heading font-bold">105$</span> &mdash; {tx({ fr: 'Sans frame: client paie 75$, Massive 35$, toi 40$', en: 'Without frame: client pays $75, Massive $35, you $40', es: 'Sin marco: cliente paga 75$, Massive 35$, tu 40$' })}
        </div>
      </div>

      {/* ====== GRILLE TARIFAIRE ====== */}
      <div className="rounded-2xl border border-purple-main/30 p-5 card-bg card-shadow">
        <h4 className="text-heading font-heading font-bold text-base mb-4 flex items-center gap-2">
          <FileText size={18} className="text-accent" />
          {tx({ fr: 'Grille tarifaire', en: 'Pricing grid', es: 'Grilla de precios' })}
        </h4>
        <p className="text-grey-muted text-xs mb-4">
          {tx({
            fr: 'Prix affiches aux clients dans ta boutique. Ta marge = prix client - cout impression Massive. Le cadre (30$) va entierement a Massive. TPS + TVQ en sus.',
            en: 'Prices shown to customers in your store. Your margin = client price - Massive print cost. Frame ($30) goes entirely to Massive. GST + QST extra.',
            es: 'Precios mostrados a los clientes en tu tienda. Tu margen = precio cliente - costo impresion Massive. El marco (30$) va completamente a Massive. Impuestos adicionales.',
          })}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-grey-muted text-xs uppercase tracking-wider border-b border-purple-main/20">
                <th className="text-left py-2 pr-3">{tx({ fr: 'Format', en: 'Format', es: 'Formato' })}</th>
                <th className="text-right py-2 px-2">{tx({ fr: 'Prix client', en: 'Client price', es: 'Precio cliente' })}</th>
                <th className="text-right py-2 px-2">{tx({ fr: 'Cout Massive', en: 'Massive cost', es: 'Costo Massive' })}</th>
                <th className="text-right py-2 px-2 text-green-400">{tx({ fr: 'Ta marge', en: 'Your margin', es: 'Tu margen' })}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-purple-main/10"><td colSpan="4" className="pt-3 pb-1 text-accent font-semibold text-xs">{tx({ fr: 'Serie Studio (4 encres pigmentees)', en: 'Studio Series (4 pigment inks)', es: 'Serie Studio (4 tintas pigmentadas)' })}</td></tr>
              {[{ format: 'A4 (8.5x11")', key: 'a4' }, { format: 'A3 (11x17")', key: 'a3' }, { format: 'A3+ (13x19")', key: 'a3plus' }].map(({ format, key }) => (
                <tr key={`s-${key}`} className="border-b border-purple-main/10 hover:bg-accent/5 transition-colors">
                  <td className="py-2 pr-3 text-heading">{format}</td>
                  <td className="py-2 px-2 text-right text-heading">{ARTIST_PRICES.studio[key]}$</td>
                  <td className="py-2 px-2 text-right text-grey-muted">{SERVICE_PRICES.studio[key]}$</td>
                  <td className="py-2 px-2 text-right text-green-400 font-semibold">{ARTIST_PRICES.studio[key] - SERVICE_PRICES.studio[key]}$</td>
                </tr>
              ))}
              <tr className="border-b border-purple-main/10"><td colSpan="4" className="pt-4 pb-1 text-accent font-semibold text-xs">{tx({ fr: 'Serie Musee (12 encres pigmentees)', en: 'Museum Series (12 pigment inks)', es: 'Serie Museo (12 tintas pigmentadas)' })}</td></tr>
              {[{ format: 'A4 (8.5x11")', key: 'a4' }, { format: 'A3 (11x17")', key: 'a3' }, { format: 'A3+ (13x19")', key: 'a3plus' }, { format: 'A2 (18x24")', key: 'a2' }].map(({ format, key }) => (
                <tr key={`m-${key}`} className="border-b border-purple-main/10 hover:bg-accent/5 transition-colors">
                  <td className="py-2 pr-3 text-heading">{format}</td>
                  <td className="py-2 px-2 text-right text-heading">{ARTIST_PRICES.museum[key]}$</td>
                  <td className="py-2 px-2 text-right text-grey-muted">{SERVICE_PRICES.museum[key]}$</td>
                  <td className="py-2 px-2 text-right text-green-400 font-semibold">{ARTIST_PRICES.museum[key] - SERVICE_PRICES.museum[key]}$</td>
                </tr>
              ))}
              <tr className="border-t-2 border-purple-main/20">
                <td className="py-2 pr-3 text-heading font-medium">{tx({ fr: 'Cadre (noir ou blanc)', en: 'Frame (black or white)', es: 'Marco (negro o blanco)' })}</td>
                <td className="py-2 px-2 text-right text-heading">{FRAME_PRICE}$</td>
                <td className="py-2 px-2 text-right text-grey-muted">{FRAME_PRICE}$</td>
                <td className="py-2 px-2 text-right text-grey-muted">0$</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-grey-muted text-[11px] mt-3 italic">
          {tx({
            fr: 'Note: Le format A2 (18x24") est imprime en qualite musee uniquement (12 encres pigmentees). Pas de cadre disponible pour ce format.',
            en: 'Note: A2 (18x24") is printed in museum quality only (12 pigment inks). No frame available for this format.',
            es: 'Nota: El formato A2 (18x24") se imprime en calidad museo unicamente (12 tintas pigmentadas). Sin marco disponible para este formato.',
          })}
        </p>
      </div>

      {/* ====== HISTORIQUE VENTES ====== */}
      <div className="rounded-2xl border border-purple-main/30 p-5 card-bg card-shadow">
        <h4 className="text-heading font-semibold text-sm mb-4 flex items-center gap-2">
          <Clock size={16} className="text-accent" />
          {tx({ fr: 'Historique des ventes', en: 'Sales history', es: 'Historial de ventas' })}
        </h4>
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

      {/* Liens rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {artist && (
          <Link to={`/artistes/${artistSlug}`} className="flex items-center gap-3 p-4 rounded-xl bg-accent/5 border border-accent/20 hover:bg-accent/10 transition-colors group">
            <Palette size={20} className="text-accent" />
            <div className="flex-grow">
              <p className="text-heading text-sm font-medium">{tx({ fr: 'Ma boutique', en: 'My store', es: 'Mi tienda' })}</p>
              <p className="text-grey-muted text-xs">massivemedias.com/artistes/{artistSlug}</p>
            </div>
            <ExternalLink size={16} className="text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        )}
        <a href="mailto:massivemedias@gmail.com" className="flex items-center gap-3 p-4 rounded-xl bg-green-500/5 border border-green-500/20 hover:bg-green-500/10 transition-colors group">
          <Send size={20} className="text-green-400" />
          <div className="flex-grow">
            <p className="text-heading text-sm font-medium">{tx({ fr: 'Envoyer des fichiers', en: 'Send files', es: 'Enviar archivos' })}</p>
            <p className="text-grey-muted text-xs">massivemedias@gmail.com</p>
          </div>
          <ExternalLink size={16} className="text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
      </div>
    </div>
  );
}

export default AccountArtistDashboard;
