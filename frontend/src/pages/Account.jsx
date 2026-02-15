import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Package, LogOut } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

function Account() {
  const { t } = useLang();
  const { user, signOut } = useAuth();

  return (
    <>
      <Helmet>
        <title>{t('account.title')} - Massive Medias</title>
      </Helmet>

      <section className="section-container pt-32 pb-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between mb-10">
              <h1 className="text-4xl font-heading font-bold text-heading">{t('account.title')}</h1>
              <button onClick={signOut} className="flex items-center gap-2 text-grey-muted hover:text-red-400 transition-colors text-sm">
                <LogOut size={16} />
                {t('auth.logout')}
              </button>
            </div>

            {/* Profile */}
            <div className="rounded-2xl border border-purple-main/30 p-8 mb-8" style={{ background: 'var(--bg-card)', boxShadow: 'var(--card-shadow)' }}>
              <h2 className="text-2xl font-heading font-bold text-heading mb-6 flex items-center gap-2">
                <User size={22} className="text-magenta" />
                {t('account.profile')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-grey-light">
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-grey-muted" />
                  <span>{user?.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <User size={16} className="text-grey-muted" />
                  <span>{user?.user_metadata?.full_name || '—'}</span>
                </div>
              </div>
            </div>

            {/* Orders - placeholder for Phase 4 */}
            <div className="rounded-2xl border border-purple-main/30 p-8" style={{ background: 'var(--bg-card)', boxShadow: 'var(--card-shadow)' }}>
              <h2 className="text-2xl font-heading font-bold text-heading mb-6 flex items-center gap-2">
                <Package size={22} className="text-magenta" />
                {t('account.orders')}
              </h2>
              <p className="text-grey-muted">{t('account.noOrders')}</p>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}

export default Account;
