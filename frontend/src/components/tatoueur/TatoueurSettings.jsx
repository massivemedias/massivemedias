import { useState } from 'react';
import { Save, Bell, Eye, EyeOff, Lock } from 'lucide-react';
import { useLang } from '../../i18n/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

export default function TatoueurSettings({ tatoueur }) {
  const { tx } = useLang();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({
    newReservation: true,
    newMessage: true,
    flashApproved: true,
    reminderRdv: true,
  });
  const [profileVisible, setProfileVisible] = useState(tatoueur?.active !== false);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-heading font-bold text-heading">
        {tx({ fr: 'Parametres', en: 'Settings' })}
      </h2>

      {/* Account */}
      <div className="bg-bg-card rounded-xl border border-white/5 p-6">
        <h3 className="text-lg font-heading font-bold text-heading mb-4 flex items-center gap-2">
          <Lock size={18} className="text-accent" />
          {tx({ fr: 'Compte', en: 'Account' })}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-grey-light mb-1">Email</label>
            <input type="email" value={user?.email || ''} disabled className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-grey-muted text-sm" />
            <p className="text-xs text-grey-muted mt-1">
              {tx({ fr: 'Pour changer ton email, va dans les parametres de ton compte.', en: 'To change your email, go to your account settings.' })}
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-bg-card rounded-xl border border-white/5 p-6">
        <h3 className="text-lg font-heading font-bold text-heading mb-4 flex items-center gap-2">
          <Bell size={18} className="text-accent" />
          {tx({ fr: 'Notifications email', en: 'Email notifications' })}
        </h3>
        <div className="space-y-3">
          {[
            { key: 'newReservation', fr: 'Nouvelle reservation de flash', en: 'New flash reservation' },
            { key: 'newMessage', fr: 'Nouveau message d\'un client', en: 'New message from a client' },
            { key: 'flashApproved', fr: 'Flash approuve par Massive', en: 'Flash approved by Massive' },
            { key: 'reminderRdv', fr: 'Rappel de rendez-vous (24h avant)', en: 'Appointment reminder (24h before)' },
          ].map(item => (
            <label key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-bg-elevated cursor-pointer hover:bg-bg-elevated/80 transition-colors">
              <span className="text-sm text-grey-light">{tx({ fr: item.fr, en: item.en })}</span>
              <input
                type="checkbox"
                checked={notifications[item.key]}
                onChange={(e) => setNotifications(n => ({ ...n, [item.key]: e.target.checked }))}
                className="accent-accent"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Visibility */}
      <div className="bg-bg-card rounded-xl border border-white/5 p-6">
        <h3 className="text-lg font-heading font-bold text-heading mb-4 flex items-center gap-2">
          {profileVisible ? <Eye size={18} className="text-green-500" /> : <EyeOff size={18} className="text-red-500" />}
          {tx({ fr: 'Visibilite', en: 'Visibility' })}
        </h3>
        <label className="flex items-center justify-between p-3 rounded-lg bg-bg-elevated cursor-pointer">
          <div>
            <span className="text-sm text-grey-light block">
              {tx({ fr: 'Profil visible publiquement', en: 'Publicly visible profile' })}
            </span>
            <span className="text-xs text-grey-muted">
              {tx({
                fr: 'Desactiver rend ta page invisible sans supprimer tes donnees.',
                en: 'Disabling makes your page invisible without deleting your data.',
              })}
            </span>
          </div>
          <input
            type="checkbox"
            checked={profileVisible}
            onChange={(e) => setProfileVisible(e.target.checked)}
            className="accent-accent"
          />
        </label>
      </div>
    </div>
  );
}
