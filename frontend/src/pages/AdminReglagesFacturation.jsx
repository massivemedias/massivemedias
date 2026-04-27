// AdminReglagesFacturation - Page de configuration des parametres de
// facturation Massive Medias (TPS/TVQ/NEQ, email Interac, coordonnees bancaires).
//
// Ces donnees sont consommees par generateInvoice.js via options.settings
// pour apparaitre en bas de chaque facture PDF dans le bloc MODALITES DE
// PAIEMENT et dans le footer (NEQ/TPS/TVQ).

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, Save, CheckCircle, XCircle, Building2, Landmark, Receipt, AtSign,
  Download, ShieldCheck,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { getBillingSettings, updateBillingSettings, downloadBackup } from '../services/adminService';

// FIX-ADMIN (avril 2026) : valeurs par defaut Massive Medias pre-remplies
// dans le formulaire. Meme si l'API /billing-settings retourne vide (premiere
// utilisation) ou plante, l'admin voit des champs remplis qu'il peut valider
// en un click. Le merge se fait au fetch : API > defaults.
const DEFAULT_SETTINGS = Object.freeze({
  companyName: 'Massive Medias',
  companyOwner: 'Michael Sanchez',
  companyAddress: '5338 rue Marquette',
  companyCity: 'Montreal (QC) H2J 3Z3',
  companyPhone: '+1 514 653 1423',
  companyEmail: 'massivemedias@gmail.com',
  companyWebsite: 'massivemedias.com',
  neq: '2269057891',
  tps: '732457635RT0001',
  tvq: '4012577678TQ0001',
  interacEmail: 'massivemedias@gmail.com',
  bankName: 'RBC Banque Royale',
  bankTransit: '03981',
  bankInstitution: '003',
  bankAccount: '5129614',
  paymentNotes: '',
});

function AdminReglagesFacturation() {
  const { tx } = useLang();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Initialisation avec les defaults Massive : l'admin voit IMMEDIATEMENT
  // les valeurs utiles, meme avant le fetch API. Si l'API renvoie quelque
  // chose, on merge (API a priorite sur defaults).
  const [settings, setSettings] = useState({ ...DEFAULT_SETTINGS });
  const [toast, setToast] = useState(null);
  // Etat dedie au backup pour ne pas interferer avec le saving des reglages -
  // l'admin pourrait cliquer Save ET Download en meme temps.
  const [downloadingBackup, setDownloadingBackup] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.type === 'error' ? 6000 : 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const load = async () => {
    try {
      const { data } = await getBillingSettings();
      // MERGE : les defaults Massive restent en fond, l'API override si presente.
      // Un champ vide cote API (string '' ou null) n'ecrase PAS le default -
      // l'admin voit toujours au moins les valeurs Massive pre-remplies.
      const apiData = data?.data || {};
      const merged = { ...DEFAULT_SETTINGS };
      for (const k of Object.keys(DEFAULT_SETTINGS)) {
        if (apiData[k] !== undefined && apiData[k] !== null && apiData[k] !== '') {
          merged[k] = apiData[k];
        }
      }
      setSettings(merged);
    } catch (err) {
      // Pas de toast d'erreur ici : l'admin voit quand meme les defaults
      // pre-remplis. On log juste pour le debug.
      console.warn('[billing-settings] load failed, using defaults:', err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  // Backup manuel JSON. Cote backend : GET /admin/backup/export retourne un
  // dump complet (clients/orders/invoices/products/artists/testimonials/
  // expenses/contact-submissions/user-roles) avec Content-Disposition pour
  // forcer le telechargement. Le filename suggere est extrait du header.
  //
  // Pourquoi tout faire ici (et pas via <a href> direct) : le endpoint exige
  // l'Authorization header (admin-only). Un <a href> ne porte pas le token
  // -> 401. On fait l'appel via axios (token auto-inject), recoit le blob,
  // cree une URL.createObjectURL et trigger le download programmatique.
  const handleDownloadBackup = async () => {
    setDownloadingBackup(true);
    try {
      const response = await downloadBackup();
      const blob = response.data instanceof Blob
        ? response.data
        : new Blob([JSON.stringify(response.data)], { type: 'application/json' });

      // Filename : on lit Content-Disposition, fallback sur la date du jour si
      // le header n'est pas accessible (CORS peut le bloquer en mode strict).
      let filename = `massive_medias_backup_${new Date().toISOString().slice(0, 10)}.json`;
      const cd = response.headers?.['content-disposition'] || response.headers?.['Content-Disposition'];
      if (cd) {
        const match = /filename="?([^";]+)"?/i.exec(cd);
        if (match && match[1]) filename = match[1];
      }

      // Trigger download en simulant un click sur un <a> invisible. Standard
      // pattern pour les downloads programmatic post-fetch.
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Cleanup memoire : revoque l'URL apres un court delai pour s'assurer
      // que le navigateur a eu le temps de demarrer le DL.
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      const totalRecords = response.headers?.['x-backup-total-records'];
      setToast({
        type: 'success',
        message: tx({
          fr: `Backup telecharge${totalRecords ? ` (${totalRecords} enregistrements)` : ''}. Conserve-le en lieu sur.`,
          en: `Backup downloaded${totalRecords ? ` (${totalRecords} records)` : ''}. Keep it in a safe place.`,
          es: `Copia descargada${totalRecords ? ` (${totalRecords} registros)` : ''}.`,
        }),
      });
    } catch (err) {
      const status = err?.response?.status;
      const msg = status === 401 || status === 403
        ? tx({
            fr: 'Acces refuse. Seuls les administrateurs peuvent telecharger un backup.',
            en: 'Access denied. Admin only.',
            es: 'Acceso denegado.',
          })
        : err?.response?.data?.error?.message || err?.message || tx({
            fr: 'Echec du telechargement du backup.',
            en: 'Backup download failed.',
            es: 'Fallo la descarga.',
          });
      setToast({ type: 'error', message: msg });
    } finally {
      setDownloadingBackup(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Whitelist : on envoie uniquement les champs du formulaire, pas
      // l'ensemble du document (eviter d'ecraser documentId, createdAt, etc.)
      const payload = {};
      const ALLOWED = [
        'companyName', 'companyOwner', 'companyAddress', 'companyCity',
        'companyPhone', 'companyEmail', 'companyWebsite',
        'neq', 'tps', 'tvq',
        'interacEmail',
        'bankName', 'bankTransit', 'bankInstitution', 'bankAccount',
        'paymentNotes',
      ];
      for (const k of ALLOWED) {
        if (settings[k] !== undefined) payload[k] = settings[k];
      }
      await updateBillingSettings(payload);
      setToast({
        type: 'success',
        message: tx({
          fr: 'Reglages enregistres. Les prochaines factures PDF les utiliseront.',
          en: 'Settings saved. Future invoices will use them.',
          es: 'Ajustes guardados.',
        }),
      });
    } catch (err) {
      const msg = err?.response?.data?.error?.message || err?.message || 'Erreur';
      setToast({ type: 'error', message: msg });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 z-[9999] max-w-sm rounded-xl shadow-2xl px-4 py-3 flex items-start gap-3 border ${
              toast.type === 'success' ? 'bg-green-600/95 border-green-400/60' : 'bg-red-600/95 border-red-400/60'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle size={20} className="text-white mt-0.5" /> : <XCircle size={20} className="text-white mt-0.5" />}
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">
                {toast.type === 'success' ? tx({ fr: 'Succes', en: 'Success', es: 'Exito' }) : tx({ fr: 'Erreur', en: 'Error', es: 'Error' })}
              </p>
              <p className="text-white/90 text-xs mt-0.5">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="text-white/70 hover:text-white"><XCircle size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h2 className="text-xl font-heading font-bold text-heading flex items-center gap-2">
          <Receipt size={20} className="text-accent" />
          {tx({ fr: 'Reglages Facturation', en: 'Billing Settings', es: 'Ajustes Facturacion' })}
        </h2>
        <p className="text-grey-muted text-sm mt-1">
          {tx({
            fr: 'Ces informations apparaissent sur toutes les factures PDF generees (footer + bloc Modalites de paiement).',
            en: 'This info appears on all generated invoice PDFs (footer + Payment terms block).',
            es: 'Esta informacion aparece en todas las facturas PDF.',
          })}
        </p>
      </div>

      {/* Section : coordonnees entreprise */}
      <SectionCard icon={Building2} title={tx({ fr: 'Entreprise', en: 'Company', es: 'Empresa' })}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <InputField label="Nom" value={settings.companyName} onChange={v => handleChange('companyName', v)} />
          <InputField label={tx({ fr: 'Proprietaire', en: 'Owner', es: 'Propietario' })} value={settings.companyOwner} onChange={v => handleChange('companyOwner', v)} />
          <InputField label={tx({ fr: 'Adresse', en: 'Address', es: 'Direccion' })} value={settings.companyAddress} onChange={v => handleChange('companyAddress', v)} />
          <InputField label={tx({ fr: 'Ville / Code postal', en: 'City / Postal', es: 'Ciudad' })} value={settings.companyCity} onChange={v => handleChange('companyCity', v)} />
          <InputField label={tx({ fr: 'Telephone', en: 'Phone', es: 'Telefono' })} value={settings.companyPhone} onChange={v => handleChange('companyPhone', v)} />
          <InputField label="Email" value={settings.companyEmail} onChange={v => handleChange('companyEmail', v)} />
          <InputField label={tx({ fr: 'Site web', en: 'Website', es: 'Sitio web' })} value={settings.companyWebsite} onChange={v => handleChange('companyWebsite', v)} />
        </div>
      </SectionCard>

      {/* Section : numeros de taxes */}
      <SectionCard icon={Receipt} title={tx({ fr: 'Numeros de taxes', en: 'Tax numbers', es: 'Numeros de impuestos' })}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <InputField label="NEQ" value={settings.neq} onChange={v => handleChange('neq', v)} placeholder="1234567890" />
          <InputField label="TPS" value={settings.tps} onChange={v => handleChange('tps', v)} placeholder="123456789 RT 0001" />
          <InputField label="TVQ" value={settings.tvq} onChange={v => handleChange('tvq', v)} placeholder="1234567890 TQ 0001" />
        </div>
        <p className="text-xs text-grey-muted">
          {tx({
            fr: 'Affiches dans le footer de chaque facture et sous l\'adresse de l\'entreprise.',
            en: 'Displayed in the footer of each invoice and below the company address.',
            es: 'Mostrados en el pie de cada factura.',
          })}
        </p>
      </SectionCard>

      {/* Section : Interac */}
      <SectionCard icon={AtSign} title="Interac e-Transfer">
        <InputField label={tx({ fr: 'Email pour virement Interac', en: 'Interac email', es: 'Email Interac' })}
          value={settings.interacEmail} onChange={v => handleChange('interacEmail', v)}
          placeholder="massivemedias@gmail.com" />
      </SectionCard>

      {/* Section : coordonnees bancaires */}
      <SectionCard icon={Landmark} title={tx({ fr: 'Depot direct (coordonnees bancaires)', en: 'Direct deposit (bank info)', es: 'Deposito directo' })}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <InputField label={tx({ fr: 'Nom de la banque', en: 'Bank name', es: 'Banco' })} value={settings.bankName} onChange={v => handleChange('bankName', v)} placeholder="RBC Banque Royale" />
          <InputField label="Transit" value={settings.bankTransit} onChange={v => handleChange('bankTransit', v)} placeholder="03981" />
          <InputField label="Institution" value={settings.bankInstitution} onChange={v => handleChange('bankInstitution', v)} placeholder="003" />
          <InputField label={tx({ fr: 'Numero de compte', en: 'Account number', es: 'Numero de cuenta' })} value={settings.bankAccount} onChange={v => handleChange('bankAccount', v)} placeholder="5129614" />
        </div>
        <p className="text-xs text-grey-muted">
          {tx({
            fr: 'Les 4 champs doivent etre remplis pour que le bloc Depot direct apparaisse sur les factures non-payees.',
            en: 'All 4 fields required for the Direct deposit block to appear on unpaid invoices.',
            es: 'Los 4 campos son requeridos.',
          })}
        </p>
      </SectionCard>

      {/* Section : notes libres */}
      <SectionCard icon={Receipt} title={tx({ fr: 'Notes de paiement (optionnel)', en: 'Payment notes (optional)', es: 'Notas de pago' })}>
        <textarea
          value={settings.paymentNotes || ''}
          onChange={e => handleChange('paymentNotes', e.target.value)}
          rows={3}
          placeholder={tx({
            fr: 'Ex: Delai de paiement 30 jours. Penalites de retard 2% par mois.',
            en: 'Ex: Net 30 days. Late fees 2% per month.',
            es: 'Ej: 30 dias netos.',
          })}
          className="input-field text-sm w-full resize-none"
        />
      </SectionCard>

      {/* Section : sauvegarde manuelle des donnees (backup JSON) */}
      <SectionCard icon={ShieldCheck} title={tx({ fr: 'Sauvegarde des donnees', en: 'Data backup', es: 'Copia de seguridad' })}>
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          <button
            onClick={handleDownloadBackup}
            disabled={downloadingBackup}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm shadow hover:bg-slate-800 transition-colors disabled:opacity-50 whitespace-nowrap self-start"
          >
            {downloadingBackup ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {downloadingBackup
              ? tx({ fr: 'Generation en cours...', en: 'Generating...', es: 'Generando...' })
              : tx({ fr: 'Exporter les donnees (Backup JSON)', en: 'Export data (JSON Backup)', es: 'Exportar datos (Copia JSON)' })
            }
          </button>
          <p className="text-xs text-grey-muted leading-relaxed flex-1">
            {tx({
              fr: 'Telecharge une copie complete de vos clients et commandes. Conservez ce fichier en lieu sur. Inclut clients, commandes (web et manuelles), factures, produits, artistes, temoignages, depenses, messages contact et roles utilisateurs. Les mots de passe et tokens sensibles sont exclus automatiquement.',
              en: 'Downloads a complete copy of your clients and orders. Keep this file in a safe place. Includes clients, orders (web and manual), invoices, products, artists, testimonials, expenses, contact messages and user roles. Passwords and sensitive tokens are excluded automatically.',
              es: 'Descarga una copia completa de tus clientes y pedidos. Guarda este archivo en un lugar seguro.',
            })}
          </p>
        </div>
        <p className="text-[11px] text-grey-muted/80 italic">
          {tx({
            fr: 'Note : l\'hebergeur (Render) effectue deja des backups quotidiens automatiques de la base. Cet export est un complement pour votre tranquillite d\'esprit - une copie physique sur votre ordinateur.',
            en: 'Note: hosting provider (Render) already performs daily automatic backups. This export is a complement for peace of mind - a physical copy on your computer.',
            es: 'Nota: el proveedor de hosting ya realiza copias diarias automaticas. Esta exportacion es un complemento para tu tranquilidad.',
          })}
        </p>
      </SectionCard>

      {/* CTA save */}
      <div className="flex justify-end sticky bottom-4 z-10">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-semibold text-sm shadow-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {tx({ fr: 'Enregistrer les reglages', en: 'Save settings', es: 'Guardar ajustes' })}
        </button>
      </div>
    </div>
  );
}

function SectionCard({ icon: Icon, title, children }) {
  return (
    <div className="card-bg rounded-xl p-4 space-y-3">
      <h3 className="text-heading font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
        <Icon size={14} className="text-accent" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="text-[10px] text-grey-muted uppercase tracking-wider block mb-1">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field text-sm w-full"
      />
    </div>
  );
}

export default AdminReglagesFacturation;
