import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Heart, MessageSquare, Clock, Check, X, ArrowRight, Palette } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

// FIX-I18N (3 mai 2026) : accents FR + ajout colonne ES (i18n complet).
const STATUS_LABELS = {
  demandee:  { fr: 'Demandée',  en: 'Requested',  es: 'Solicitada',   color: 'text-blue-500' },
  confirmee: { fr: 'Confirmée', en: 'Confirmed',  es: 'Confirmada',   color: 'text-green-500' },
  planifiee: { fr: 'Planifiée', en: 'Scheduled',  es: 'Planificada',  color: 'text-accent' },
  realisee:  { fr: 'Réalisée',  en: 'Completed',  es: 'Realizada',    color: 'text-gray-400' },
  annulee:   { fr: 'Annulée',   en: 'Cancelled',  es: 'Cancelada',    color: 'text-red-500' },
};

export default function AccountTattooPanel() {
  const { tx } = useLang();
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reservations');

  useEffect(() => {
    async function fetchMyReservations() {
      if (!user?.email) { setLoading(false); return; }
      try {
        const { data } = await api.get('/reservations', {
          params: {
            'filters[clientEmail][$eq]': user.email,
            'populate[tatoueur]': '*',
            'populate[flash]': '*',
            sort: 'createdAt:desc',
          },
        });
        setReservations(data.data || []);
      } catch (err) {
        console.warn('[AccountTattooPanel] Erreur:', err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchMyReservations();
  }, [user?.email]);

  if (loading) {
    return <div className="text-center py-8 text-grey-muted animate-pulse">...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-2">
        {[
          { key: 'reservations', icon: Calendar, label: tx({ fr: 'Mes reservations', en: 'My bookings' }) },
          { key: 'favoris', icon: Heart, label: tx({ fr: 'Flashs favoris', en: 'Saved flash designs' }) },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.key ? 'text-accent border-b-2 border-accent' : 'text-grey-muted'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'reservations' && (
        <>
          {reservations.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-grey-muted/30 mx-auto mb-3" />
              <p className="text-grey-muted mb-4">
                {tx({ fr: 'Aucune reservation de tatouage.', en: 'No tattoo bookings yet.' })}
              </p>
              <Link to="/tatoueurs" className="btn-primary !py-2 !px-4 text-sm">
                {tx({ fr: 'Decouvrir les tatoueurs', en: 'Discover tattoo artists' })}
                <ArrowRight size={16} className="ml-2" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {reservations.map((res) => {
                const status = STATUS_LABELS[res.status] || STATUS_LABELS.demandee;
                return (
                  <div key={res.documentId} className="bg-bg-card rounded-xl border border-white/5 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-heading text-sm">
                            {res.tatoueur?.name || tx({ fr: 'Tatoueur', en: 'Artist' })}
                          </span>
                          <span className={`text-xs font-bold ${status.color}`}>
                            {tx({ fr: status.fr, en: status.en })}
                          </span>
                        </div>
                        <div className="text-xs text-grey-muted space-y-0.5">
                          {res.placement && <p>{tx({ fr: 'Emplacement:', en: 'Placement:' })} {res.placement}</p>}
                          {res.requestedDate && (
                            <p className="flex items-center gap-1">
                              <Clock size={12} />
                              {new Date(res.requestedDate).toLocaleDateString()}
                            </p>
                          )}
                          {res.confirmedDate && (
                            <p className="flex items-center gap-1 text-green-500">
                              <Check size={12} />
                              {tx({ fr: 'Confirme:', en: 'Confirmed:' })} {new Date(res.confirmedDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      {res.tatoueur?.slug && (
                        <Link
                          to={`/tatoueurs/${res.tatoueur.slug}`}
                          className="text-xs text-grey-muted hover:text-accent transition-colors"
                        >
                          <ArrowRight size={14} />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'favoris' && (
        <div className="text-center py-12">
          <Heart className="w-12 h-12 text-grey-muted/30 mx-auto mb-3" />
          <p className="text-grey-muted mb-4">
            {tx({ fr: 'Tu n\'as pas encore de flashs favoris.', en: 'You have no saved flash designs yet.' })}
          </p>
          <Link to="/tatoueurs" className="btn-primary !py-2 !px-4 text-sm">
            {tx({ fr: 'Parcourir les flashs', en: 'Browse flash designs' })}
            <ArrowRight size={16} className="ml-2" />
          </Link>
        </div>
      )}
    </div>
  );
}
