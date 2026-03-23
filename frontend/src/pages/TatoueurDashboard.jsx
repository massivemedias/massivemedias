import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Palette, CalendarDays, MessageSquare, User, Settings, BookOpen, BarChart3, Image, ShoppingBag } from 'lucide-react';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';
import { useUserRole } from '../contexts/UserRoleContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

import TatoueurFlashManager from '../components/tatoueur/TatoueurFlashManager';
import TatoueurReservations from '../components/tatoueur/TatoueurReservations';
import TatoueurMessages from '../components/tatoueur/TatoueurMessages';
import TatoueurProfile from '../components/tatoueur/TatoueurProfile';
import TatoueurSettings from '../components/tatoueur/TatoueurSettings';
import TatoueurCalendar from '../components/tatoueur/TatoueurCalendar';
import TatoueurRealisations from '../components/tatoueur/TatoueurRealisations';
import TatoueurShop from '../components/tatoueur/TatoueurShop';

const TABS = [
  { key: 'dashboard', icon: LayoutDashboard, labelFr: 'Tableau de bord', labelEn: 'Dashboard' },
  { key: 'flashs', icon: Palette, labelFr: 'Mes flashs', labelEn: 'My Flash Designs' },
  { key: 'reservations', icon: BookOpen, labelFr: 'Rendez-vous', labelEn: 'Appointments' },
  { key: 'calendrier', icon: CalendarDays, labelFr: 'Calendrier', labelEn: 'Calendar' },
  { key: 'realisations', icon: Image, labelFr: 'Realisations', labelEn: 'My Work' },
  { key: 'messages', icon: MessageSquare, labelFr: 'Messages', labelEn: 'Messages' },
  { key: 'boutique', icon: ShoppingBag, labelFr: 'Boutique', labelEn: 'Shop' },
  { key: 'profil', icon: User, labelFr: 'Mon profil', labelEn: 'My Profile' },
  { key: 'parametres', icon: Settings, labelFr: 'Parametres', labelEn: 'Settings' },
];

function DashboardOverview({ tatoueur, tx, setTab }) {
  const flashs = tatoueur?.flashs || [];
  const disponibles = flashs.filter(f => f.status === 'disponible').length;
  const reserves = flashs.filter(f => f.status === 'reserve').length;
  const tatoues = flashs.filter(f => f.status === 'tatoue').length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-heading font-bold text-heading">
        {tx({ fr: `Bienvenue, ${tatoueur?.name || 'Tatoueur'}`, en: `Welcome, ${tatoueur?.name || 'Artist'}` })}
      </h2>

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
            onClick={() => setTab('flashs')}
            className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated hover:bg-bg-elevated/80 transition-colors text-left"
          >
            <Palette size={18} className="text-accent" />
            <span className="text-sm text-heading">{tx({ fr: 'Ajouter un flash', en: 'Add a flash design' })}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function TatoueurDashboard() {
  const { tx } = useLang();
  const { tatoueurSlug, isAdmin } = useUserRole();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tatoueur, setTatoueur] = useState(null);
  const [loading, setLoading] = useState(true);

  const activeTab = searchParams.get('tab') || 'dashboard';

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
        const { data } = await api.get('/tatoueurs', {
          params: {
            'filters[slug][$eq]': slug,
            populate: '*',
          },
        });
        if (data.data?.length > 0) {
          setTatoueur(data.data[0]);
        }
      } catch (err) {
        console.warn('[TatoueurDashboard] Erreur fetch:', err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchTatoueur();
  }, [tatoueurSlug, isAdmin]);

  const setTab = (tab) => {
    setSearchParams({ tab });
  };

  if (loading) {
    return (
      <div className="section-container pt-32 text-center">
        <div className="animate-pulse text-grey-muted text-lg">
          {tx({ fr: 'Chargement...', en: 'Loading...' })}
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={tx({ fr: 'Dashboard Tatoueur | Massive', en: 'Tattoo Artist Dashboard | Massive' })}
        noindex
      />

      <div className="pt-20 pb-12 section-container">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <nav className="md:w-56 flex-shrink-0">
            <div className="bg-bg-card rounded-xl border border-white/5 overflow-hidden md:sticky md:top-24">
              {/* Tatoueur info */}
              <div className="p-4 border-b border-white/5">
                <p className="font-heading font-bold text-heading text-sm truncate">
                  {tatoueur?.name || tx({ fr: 'Mon espace', en: 'My space' })}
                </p>
                <p className="text-xs text-grey-muted truncate">
                  {tatoueur?.studio || tx({ fr: 'Tatoueur partenaire', en: 'Partner artist' })}
                </p>
              </div>

              {/* Tab list */}
              <div className="p-2 flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
                {TABS.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setTab(tab.key)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        isActive
                          ? 'bg-accent/15 text-accent'
                          : 'text-grey-muted hover:text-heading hover:bg-bg-elevated'
                      }`}
                    >
                      <Icon size={16} />
                      {tx({ fr: tab.labelFr, en: tab.labelEn })}
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>

          {/* Content */}
          <main className="flex-1 min-w-0">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <DashboardOverview tatoueur={tatoueur} tx={tx} setTab={setTab} />}
              {activeTab === 'flashs' && <TatoueurFlashManager tatoueur={tatoueur} setTatoueur={setTatoueur} />}
              {activeTab === 'reservations' && <TatoueurReservations tatoueur={tatoueur} />}
              {activeTab === 'calendrier' && <TatoueurCalendar tatoueur={tatoueur} />}
              {activeTab === 'realisations' && <TatoueurRealisations tatoueur={tatoueur} setTatoueur={setTatoueur} />}
              {activeTab === 'messages' && <TatoueurMessages tatoueur={tatoueur} />}
              {activeTab === 'boutique' && <TatoueurShop tatoueur={tatoueur} />}
              {activeTab === 'profil' && <TatoueurProfile tatoueur={tatoueur} setTatoueur={setTatoueur} />}
              {activeTab === 'parametres' && <TatoueurSettings tatoueur={tatoueur} />}
            </motion.div>
          </main>
        </div>
      </div>
    </>
  );
}

export default TatoueurDashboard;
