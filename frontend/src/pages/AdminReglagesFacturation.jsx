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
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { getBillingSettings, updateBillingSettings } from '../services/adminService';

function AdminReglagesFacturation() {
  const { tx } = useLang();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({});
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.type === 'error' ? 6000 : 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const load = async () => {
    try {
      const { data } = await getBillingSettings();
      setSettings(data?.data || {});
    } catch (err) {
      setToast({ type: 'error', message: err?.message || 'Erreur chargement' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
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
