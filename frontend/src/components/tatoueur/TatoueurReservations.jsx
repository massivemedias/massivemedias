import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Clock, Calendar, User, MessageSquare } from 'lucide-react';
import { useLang } from '../../i18n/LanguageContext';
import api from '../../services/api';

const STATUS_CONFIG = {
  demandee: { labelFr: 'Demandée', labelEn: 'Requested', color: 'bg-blue-500', textColor: 'text-blue-500' },
  confirmee: { labelFr: 'Confirmée', labelEn: 'Confirmed', color: 'bg-green-500', textColor: 'text-green-500' },
  planifiee: { labelFr: 'Planifiée', labelEn: 'Scheduled', color: 'bg-accent', textColor: 'text-accent' },
  realisee: { labelFr: 'Réalisée', labelEn: 'Completed', color: 'bg-gray-500', textColor: 'text-gray-400' },
  annulee: { labelFr: 'Annulée', labelEn: 'Cancelled', color: 'bg-red-500', textColor: 'text-red-500' },
};

export default function TatoueurReservations({ tatoueur }) {
  const { tx } = useLang();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function fetchReservations() {
      if (!tatoueur?.documentId) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/reservations', {
          params: {
            'filters[tatoueur][documentId][$eq]': tatoueur.documentId,
            'populate[flash]': '*',
            'populate[client]': '*',
            sort: 'createdAt:desc',
          },
        });
        setReservations(data.data || []);
      } catch (err) {
        console.warn('[TatoueurReservations] Erreur:', err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchReservations();
  }, [tatoueur?.documentId]);

  const filtered = filter === 'all' ? reservations : reservations.filter(r => r.status === filter);

  if (loading) {
    return <div className="text-center py-12 text-grey-muted animate-pulse">...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-bold text-heading">
          {tx({ fr: 'Rendez-vous', en: 'Appointments' })}
        </h2>
        <span className="text-sm text-grey-muted">
          {reservations.length} {tx({ fr: 'total', en: 'total' })}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`text-xs px-3 py-1.5 rounded-full transition-colors ${filter === 'all' ? 'bg-accent text-black font-bold' : 'bg-bg-card text-grey-light border border-white/5'}`}
        >
          {tx({ fr: 'Tout', en: 'All' })}
        </button>
        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setFilter(filter === key ? 'all' : key)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${
              filter === key ? 'bg-accent text-black font-bold' : 'bg-bg-card text-grey-light border border-white/5'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${config.color}`} />
            {tx({ fr: config.labelFr, en: config.labelEn })}
          </button>
        ))}
      </div>

      {/* Reservation list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-bg-card rounded-xl border border-white/5">
          <Calendar className="w-12 h-12 text-grey-muted/30 mx-auto mb-3" />
          <p className="text-grey-muted">
            {tx({ fr: 'Aucune reservation pour le moment.', en: 'No reservations yet.' })}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((reservation) => {
            const status = STATUS_CONFIG[reservation.status] || STATUS_CONFIG.demandee;
            return (
              <motion.div
                key={reservation.documentId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-bg-card rounded-xl border border-white/5 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Client info */}
                    <div className="flex items-center gap-2 mb-2">
                      <User size={14} className="text-grey-muted" />
                      <span className="font-bold text-heading text-sm">{reservation.clientName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${status.color} text-white font-bold`}>
                        {tx({ fr: status.labelFr, en: status.labelEn })}
                      </span>
                    </div>

                    <div className="text-xs text-grey-muted space-y-1">
                      <p>{reservation.clientEmail}</p>
                      {reservation.clientPhone && <p>{reservation.clientPhone}</p>}
                      {reservation.placement && (
                        <p>{tx({ fr: 'Emplacement:', en: 'Placement:' })} {reservation.placement}</p>
                      )}
                      {reservation.requestedDate && (
                        <p className="flex items-center gap-1">
                          <Clock size={12} />
                          {tx({ fr: 'Date souhaitee:', en: 'Requested date:' })} {new Date(reservation.requestedDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Client message */}
                    {reservation.messageDuClient && (
                      <div className="mt-3 p-3 bg-bg-elevated rounded-lg">
                        <p className="text-xs text-grey-muted flex items-center gap-1 mb-1">
                          <MessageSquare size={12} />
                          {tx({ fr: 'Message du client:', en: 'Client message:' })}
                        </p>
                        <p className="text-sm text-grey-light">{reservation.messageDuClient}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {reservation.status === 'demandee' && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={async () => {
                          try {
                            await api.put(`/reservations/${reservation.documentId}`, {
                              data: { status: 'confirmee', confirmedDate: new Date().toISOString() },
                            });
                            setReservations(prev => prev.map(r =>
                              r.documentId === reservation.documentId ? { ...r, status: 'confirmee' } : r
                            ));
                          } catch (err) {
                            console.error('[Reservations] Accept error:', err);
                          }
                        }}
                        className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
                        title={tx({ fr: 'Accepter', en: 'Accept' })}
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await api.put(`/reservations/${reservation.documentId}`, {
                              data: { status: 'annulee' },
                            });
                            setReservations(prev => prev.map(r =>
                              r.documentId === reservation.documentId ? { ...r, status: 'annulee' } : r
                            ));
                          } catch (err) {
                            console.error('[Reservations] Decline error:', err);
                          }
                        }}
                        className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                        title={tx({ fr: 'Refuser', en: 'Decline' })}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
