import { useState, useEffect, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import {
  Palette, BarChart3, Loader2, BookOpen, CalendarDays, MessageSquare,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { useUserRole } from '../contexts/UserRoleContext';
import api from '../services/api';
import tatoueursData from '../data/tatoueurs';

const TatoueurFlashManager = lazy(() => import('./tatoueur/TatoueurFlashManager'));
const TatoueurReservations = lazy(() => import('./tatoueur/TatoueurReservations'));
const TatoueurCalendar = lazy(() => import('./tatoueur/TatoueurCalendar'));
const TatoueurRealisations = lazy(() => import('./tatoueur/TatoueurRealisations'));
const TatoueurMessages = lazy(() => import('./tatoueur/TatoueurMessages'));
const TatoueurShop = lazy(() => import('./tatoueur/TatoueurShop'));
const TatoueurProfile = lazy(() => import('./tatoueur/TatoueurProfile'));
const TatoueurSettings = lazy(() => import('./tatoueur/TatoueurSettings'));

function DashboardOverview({ tatoueur, tx, onNavigate }) {
  const flashs = tatoueur?.flashs || [];
  const disponibles = flashs.filter(f => f.status === 'disponible').length;
  const reserves = flashs.filter(f => f.status === 'reserve').length;
  const tatoues = flashs.filter(f => f.status === 'tatoue').length;

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-bg-card rounded-xl p-5 border border-white/5">
          <div className="text-3xl font-heading font-bold text-green-500">{disponibles}</div>
          <div className="text-xs text-grey-muted mt-1">{tx({ fr: 'Flashs disponibles', en: 'Available flash designs' })}</div>
        </div>
        <div className="bg-bg-card rounded-xl p-5 border border-white/5">
          <div className="text-3xl font-heading font-bold text-amber-500">{reserves}</div>
          <div className="text-xs text-grey-muted mt-1">{tx({ fr: 'Reserves', en: 'Reserved' })}</div>
        </div>
        <div className="bg-bg-card rounded-xl p-5 border border-white/5">
          <div className="text-3xl font-heading font-bold text-grey-light">{tatoues}</div>
          <div className="text-xs text-grey-muted mt-1">{tx({ fr: 'Tatoues', en: 'Tattooed' })}</div>
        </div>
        <div className="bg-bg-card rounded-xl p-5 border border-white/5">
          <div className="text-3xl font-heading font-bold text-accent">{tatoueur?.pageViews || 0}</div>
          <div className="text-xs text-grey-muted mt-1">{tx({ fr: 'Vues de page', en: 'Page views' })}</div>
        </div>
      </div>

      {/* Quick links */}
      <div className="bg-bg-card rounded-xl p-6 border border-white/5">
        <h3 className="text-lg font-heading font-bold text-heading mb-4">
          {tx({ fr: 'Actions rapides', en: 'Quick actions' })}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link
            to={`/tatoueurs/${tatoueur?.slug}`}
            target="_blank"
            className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated hover:bg-bg-elevated/80 transition-colors"
          >
            <BarChart3 size={18} className="text-accent" />
            <span className="text-sm text-heading">{tx({ fr: 'Voir ma page publique', en: 'View my public page' })}</span>
          </Link>
          <button
            onClick={() => onNavigate('flashs')}
            className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated hover:bg-bg-elevated/80 transition-colors text-left"
          >
            <Palette size={18} className="text-accent" />
            <span className="text-sm text-heading">{tx({ fr: 'Ajouter un flash', en: 'Add a flash design' })}</span>
          </button>
          <button
            onClick={() => onNavigate('reservations')}
            className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated hover:bg-bg-elevated/80 transition-colors text-left"
          >
            <BookOpen size={18} className="text-accent" />
            <span className="text-sm text-heading">{tx({ fr: 'Voir les rendez-vous', en: 'View appointments' })}</span>
          </button>
          <button
            onClick={() => onNavigate('messages')}
            className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated hover:bg-bg-elevated/80 transition-colors text-left"
          >
            <MessageSquare size={18} className="text-accent" />
            <span className="text-sm text-heading">{tx({ fr: 'Mes messages', en: 'My messages' })}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function AccountTatoueurDashboard({ section = 'dashboard-tatoueur', onNavigate }) {
  const { tx } = useLang();
  const { tatoueurSlug, isAdmin } = useUserRole();
  const [tatoueur, setTatoueur] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTatoueur() {
      if (!tatoueurSlug && !isAdmin) {
        setLoading(false);
        return;
      }
      try {
        const slug = tatoueurSlug;
        if (!slug) {
          setLoading(false);
          return;
        }

        // Donnees locales en priorite (toujours disponibles)
        const local = tatoueursData[slug] || null;

        // Essayer le CMS en complement
        let cms = null;
        try {
          const { data } = await api.get('/tatoueurs', {
            params: {
              'filters[slug][$eq]': slug,
              populate: '*',
            },
          });
          if (data.data?.length > 0) {
            cms = data.data[0];
          }
        } catch {
          // CMS indisponible, on utilise les donnees locales
        }

        // Merger: CMS prioritaire sur local, mais local comme fallback
        const merged = {
          ...local,
          ...(cms || {}),
          flashs: cms?.flashs?.length > 0 ? cms.flashs : (local?.flashs || []),
          realisations: cms?.realisations?.length > 0 ? cms.realisations : (local?.realisations || []),
          calendarSettings: cms?.calendarSettings || local?.calendarSettings || {},
          slug,
        };
        setTatoueur(merged);
      } catch (err) {
        console.warn('[AccountTatoueurDashboard] Erreur fetch:', err.message);
        // Fallback donnees locales
        const local = tatoueursData[tatoueurSlug];
        if (local) setTatoueur({ ...local, slug: tatoueurSlug });
      } finally {
        setLoading(false);
      }
    }
    fetchTatoueur();
  }, [tatoueurSlug, isAdmin]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-grey-muted py-8 justify-center">
        <Loader2 size={16} className="animate-spin" />
      </div>
    );
  }

  const fallback = (
    <div className="flex items-center gap-2 text-grey-muted py-8 justify-center">
      <Loader2 size={16} className="animate-spin" />
    </div>
  );

  return (
    <Suspense fallback={fallback}>
      {section === 'dashboard-tatoueur' && <DashboardOverview tatoueur={tatoueur} tx={tx} onNavigate={onNavigate} />}
      {section === 'flashs' && <TatoueurFlashManager tatoueur={tatoueur} setTatoueur={setTatoueur} />}
      {section === 'reservations' && <TatoueurReservations tatoueur={tatoueur} />}
      {section === 'calendrier' && <TatoueurCalendar tatoueur={tatoueur} />}
      {section === 'realisations' && <TatoueurRealisations tatoueur={tatoueur} setTatoueur={setTatoueur} />}
      {section === 'messages' && <TatoueurMessages tatoueur={tatoueur} />}
      {section === 'boutique-tatoueur' && <TatoueurShop tatoueur={tatoueur} />}
      {section === 'profil-tatoueur' && <TatoueurProfile tatoueur={tatoueur} setTatoueur={setTatoueur} />}
      {section === 'parametres' && <TatoueurSettings tatoueur={tatoueur} />}
    </Suspense>
  );
}

export default AccountTatoueurDashboard;
