import { useState, useEffect, useRef } from 'react';
import { X, Loader2, AlertCircle, User } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { updateOrderBilling } from '../services/adminService';

/**
 * Modal d'edition des informations de facturation/client d'une commande.
 *
 * Usage : permet a l'admin de corriger le nom, l'email, le telephone, la
 * raison sociale et l'adresse de livraison/facturation directement dans
 * la commande, sans toucher au profil utilisateur. Les champs modifies
 * sont sauvegardes en priorite absolue dans Order et utilises tel quel
 * par le generateur de PDF de facture (generateInvoice.js lit
 * order.customerName / customerEmail / companyName / customerPhone /
 * shippingAddress).
 *
 * Appel : PUT /api/orders/:documentId/billing avec le payload des champs.
 *
 * Props :
 *   order : { documentId, customerName, customerEmail, companyName,
 *             customerPhone, shippingAddress }
 *   onClose() : ferme le modal sans rien faire
 *   onUpdated(updatedOrder) : appele apres succes pour refresh parent
 */
function EditOrderBillingModal({ order, onClose, onUpdated }) {
  const { tx } = useLang();

  const initialAddr = order?.shippingAddress || {};
  const [customerName, setCustomerName] = useState(order?.customerName || '');
  const [customerEmail, setCustomerEmail] = useState(order?.customerEmail || '');
  const [companyName, setCompanyName] = useState(order?.companyName || '');
  const [customerPhone, setCustomerPhone] = useState(order?.customerPhone || '');
  const [address, setAddress] = useState(initialAddr.address || '');
  const [city, setCity] = useState(initialAddr.city || '');
  const [province, setProvince] = useState(initialAddr.province || '');
  const [postalCode, setPostalCode] = useState(initialAddr.postalCode || '');
  const [country, setCountry] = useState(initialAddr.country || 'CA');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const firstInputRef = useRef(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    setTimeout(() => firstInputRef.current?.focus(), 50);
  }, []);

  // Echap ferme (sauf pendant save)
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !loading) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, loading]);

  const submit = async (e) => {
    e?.preventDefault?.();
    if (submittingRef.current) return;
    setError('');

    const trimmedName = customerName.trim();
    const trimmedEmail = customerEmail.trim();
    if (!trimmedName) {
      setError(tx({ fr: 'Le nom du client est requis', en: 'Customer name is required', es: 'Nombre del cliente requerido' }));
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError(tx({ fr: 'Email valide requis', en: 'Valid email required', es: 'Email valido requerido' }));
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    try {
      const payload = {
        customerName: trimmedName,
        customerEmail: trimmedEmail.toLowerCase(),
        companyName: companyName.trim() || null,
        customerPhone: customerPhone.trim() || null,
        shippingAddress: (address.trim() || city.trim() || postalCode.trim()) ? {
          address: address.trim(),
          city: city.trim(),
          province: province.trim(),
          postalCode: postalCode.trim(),
          country: country.trim() || 'CA',
        } : null,
      };
      const { data } = await updateOrderBilling(order.documentId, payload);
      onUpdated?.(data?.data || { ...order, ...payload });
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.error?.message
        || err?.response?.data?.message
        || err?.message
        || 'Erreur inconnue';
      setError(msg);
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={() => !loading && onClose()}
    >
      <div
        className="w-full max-w-lg bg-glass border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <User size={18} className="text-accent" />
            <h2 className="text-heading font-semibold text-base">
              {tx({ fr: 'Modifier la facturation', en: 'Edit billing details', es: 'Editar facturación' })}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => !loading && onClose()}
            className="p-1 rounded-lg text-grey-muted hover:text-heading hover:bg-white/5 transition-colors"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="px-5 py-4 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Nom + Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-grey-muted text-xs font-medium mb-1">
                {tx({ fr: 'Nom complet *', en: 'Full name *', es: 'Nombre completo *' })}
              </label>
              <input
                ref={firstInputRef}
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:outline-none focus:border-accent"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-grey-muted text-xs font-medium mb-1">
                {tx({ fr: 'Email *', en: 'Email *', es: 'Email *' })}
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:outline-none focus:border-accent"
                disabled={loading}
              />
            </div>
          </div>

          {/* Company + Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-grey-muted text-xs font-medium mb-1">
                {tx({ fr: 'Entreprise (B2B)', en: 'Company (B2B)', es: 'Empresa (B2B)' })}
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:outline-none focus:border-accent"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-grey-muted text-xs font-medium mb-1">
                {tx({ fr: 'Téléphone', en: 'Phone', es: 'Teléfono' })}
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:outline-none focus:border-accent"
                disabled={loading}
              />
            </div>
          </div>

          {/* Address */}
          <div className="pt-2 border-t border-white/5">
            <h3 className="text-grey-muted text-xs font-semibold uppercase tracking-wider mb-2">
              {tx({ fr: 'Adresse de facturation / livraison', en: 'Billing / shipping address', es: 'Dirección facturación / envío' })}
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={tx({ fr: 'Adresse', en: 'Street address', es: 'Dirección' })}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:outline-none focus:border-accent"
                disabled={loading}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={tx({ fr: 'Ville', en: 'City', es: 'Ciudad' })}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:outline-none focus:border-accent"
                  disabled={loading}
                />
                <input
                  type="text"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder={tx({ fr: 'Province / État', en: 'Province / State', es: 'Provincia / Estado' })}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:outline-none focus:border-accent"
                  disabled={loading}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder={tx({ fr: 'Code postal', en: 'Postal code', es: 'Código postal' })}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:outline-none focus:border-accent"
                  disabled={loading}
                />
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder={tx({ fr: 'Pays (CA)', en: 'Country (CA)', es: 'País (CA)' })}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-heading text-sm focus:outline-none focus:border-accent"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-grey-muted text-[11px] leading-relaxed">
            {tx({
              fr: 'Ces informations remplacent celles du checkout initial uniquement pour cette commande. Le PDF de la facture sera regenere avec ces données.',
              en: 'These details override the checkout data for this order only. The invoice PDF will be regenerated with the new values.',
              es: 'Estos datos reemplazan los del pago inicial solo para este pedido. El PDF de factura se regenerará con los nuevos valores.',
            })}
          </p>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={() => !loading && onClose()}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-grey-muted text-sm hover:bg-white/5 hover:text-heading transition-colors disabled:opacity-50"
            >
              {tx({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' })}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {tx({ fr: 'Enregistrer', en: 'Save', es: 'Guardar' })}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditOrderBillingModal;
