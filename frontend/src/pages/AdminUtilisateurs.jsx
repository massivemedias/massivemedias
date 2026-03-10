import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, UserCheck, UserX, Clock, Mail, Calendar,
  Loader2, Shield, Smartphone,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import api from '../services/api';

function AdminUtilisateurs() {
  const { tx } = useLang();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get('/clients/users');
        setUsers(data.data || []);
        setError('');
      } catch {
        setError(tx({ fr: 'Impossible de charger les utilisateurs', en: 'Unable to load users', es: 'No se pueden cargar los usuarios' }));
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
  const formatDateTime = (d) => d ? new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

  const confirmed = users.filter(u => u.emailConfirmed);
  const unconfirmed = users.filter(u => !u.emailConfirmed);

  // Derniere inscription
  const latestSignup = users.length > 0
    ? users.reduce((latest, u) => new Date(u.createdAt) > new Date(latest.createdAt) ? u : latest)
    : null;

  const summaryCards = [
    { label: tx({ fr: 'Total inscrits', en: 'Total users', es: 'Total usuarios' }), value: users.length, icon: Users, accent: 'text-accent' },
    { label: tx({ fr: 'Email confirme', en: 'Confirmed', es: 'Confirmado' }), value: confirmed.length, icon: UserCheck, accent: 'text-green-400' },
    { label: tx({ fr: 'Non confirme', en: 'Unconfirmed', es: 'Sin confirmar' }), value: unconfirmed.length, icon: UserX, accent: unconfirmed.length > 0 ? 'text-yellow-400' : 'text-grey-muted' },
    { label: tx({ fr: 'Dernier inscrit', en: 'Latest signup', es: 'Ultimo registro' }), value: latestSignup ? formatDate(latestSignup.createdAt) : '-', icon: Calendar, accent: 'text-purple-400' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl p-4 bg-glass card-border">
              <div className="flex items-center gap-2 mb-2"><Icon size={16} className={card.accent} /><span className="text-grey-muted text-xs">{card.label}</span></div>
              <span className="text-2xl font-heading font-bold text-heading">{card.value}</span>
            </motion.div>
          );
        })}
      </div>

      {error && (
        <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Users table */}
      {users.length > 0 && (
        <div className="rounded-xl bg-glass overflow-hidden card-border">
          <div className="hidden md:grid grid-cols-[1fr_1fr_120px_120px_80px] gap-3 px-4 py-3 text-xs font-semibold text-grey-muted uppercase tracking-wider border-b card-border">
            <span>{tx({ fr: 'Utilisateur', en: 'User', es: 'Usuario' })}</span>
            <span>Email</span>
            <span>{tx({ fr: 'Inscrit le', en: 'Signed up', es: 'Registrado' })}</span>
            <span>{tx({ fr: 'Derniere connexion', en: 'Last login', es: 'Ultima conexion' })}</span>
            <span>Status</span>
          </div>

          {users
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map((user) => (
              <div key={user.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_120px_120px_80px] gap-2 md:gap-3 px-4 py-3 items-center border-b last:border-b-0 card-border hover:bg-accent/5 transition-colors">
                {/* Nom + provider */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm flex-shrink-0">
                    {(user.fullName || user.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-heading font-semibold truncate">
                      {user.fullName || tx({ fr: 'Sans nom', en: 'No name', es: 'Sin nombre' })}
                    </p>
                    <p className="text-[10px] text-grey-muted flex items-center gap-1">
                      <Shield size={9} />
                      {user.provider}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <Mail size={12} className="text-grey-muted flex-shrink-0" />
                  <span className="text-xs text-grey-muted truncate">{user.email}</span>
                </div>

                {/* Inscrit le */}
                <span className="text-xs text-grey-muted">{formatDate(user.createdAt)}</span>

                {/* Derniere connexion */}
                <div className="flex items-center gap-1.5">
                  <Clock size={11} className="text-grey-muted flex-shrink-0" />
                  <span className="text-xs text-grey-muted">{user.lastSignIn ? formatDate(user.lastSignIn) : tx({ fr: 'Jamais', en: 'Never', es: 'Nunca' })}</span>
                </div>

                {/* Status */}
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold w-fit ${
                  user.emailConfirmed ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {user.emailConfirmed
                    ? tx({ fr: 'Verifie', en: 'Verified', es: 'Verificado' })
                    : tx({ fr: 'En attente', en: 'Pending', es: 'Pendiente' })
                  }
                </span>
              </div>
            ))}
        </div>
      )}

      {users.length === 0 && !error && (
        <div className="text-center py-20 text-grey-muted">
          <Users size={40} className="mx-auto mb-4 opacity-30" />
          <p>{tx({ fr: 'Aucun utilisateur inscrit', en: 'No registered users', es: 'Sin usuarios registrados' })}</p>
        </div>
      )}
    </div>
  );
}

export default AdminUtilisateurs;
