import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, CheckCircle, AlertCircle, FileText, Palette, Download, LogIn } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { ARTIST_CONTRACT_TEXT, ARTIST_CONTRACT_TEXT_EN, ARTIST_CONTRACT_TEXT_ES, ARTIST_CONTRACT_VERSION } from '../data/artistContract';
import { generateContractPDF } from '../utils/generateContractPDF';

function ArtistPartnershipForm() {
  const { tx, lang } = useLang();
  const { user, updateProfile } = useAuth();
  const contractText = lang === 'en' ? ARTIST_CONTRACT_TEXT_EN : lang === 'es' ? ARTIST_CONTRACT_TEXT_ES : ARTIST_CONTRACT_TEXT;

  const [formData, setFormData] = useState({
    nomLegal: user?.user_metadata?.full_name || '',
    nomArtiste: '',
    adresse: '',
    email: user?.email || '',
    telephone: '',
    tpsTvq: '',
  });
  const [contractAccepted, setContractAccepted] = useState(false);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    if (!user) return; // champs bloques si pas connecte
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const canSubmit =
    user &&
    formData.nomLegal &&
    formData.email &&
    formData.telephone &&
    formData.adresse &&
    contractAccepted &&
    status !== 'sending';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setStatus('sending');
    setError('');

    try {
      await api.post('/artist-submissions/submit', {
        ...formData,
        supabaseUserId: user?.id || null,
        contractAccepted: true,
        contractVersion: ARTIST_CONTRACT_VERSION,
      });
      // Enregistrer la signature du contrat dans le profil Supabase
      if (user && updateProfile) {
        try {
          await updateProfile({
            contractSigned: true,
            contractSignedAt: new Date().toISOString(),
            contractVersion: ARTIST_CONTRACT_VERSION,
            nomArtiste: formData.nomArtiste || null,
            phone: formData.telephone || null,
            address: formData.adresse || null,
          });
        } catch (e) {
          console.warn('Could not update profile with contract info:', e);
        }
      }
      setStatus('success');
    } catch (err) {
      setError(
        err?.response?.data?.error?.message ||
        tx({ fr: 'Une erreur est survenue. Reessaie plus tard.', en: 'An error occurred. Please try again later.', es: 'Ocurrio un error. Intentalo mas tarde.' })
      );
      setStatus('error');
    }
  };

  // Signature numerique - nom avec font manuscrite
  const signatureName = formData.nomLegal || user?.user_metadata?.full_name || '';

  // -- Succes --
  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-3xl mx-auto text-center py-16 px-8 rounded-2xl bg-glass"
      >
        <CheckCircle size={64} className="text-green-400 mx-auto mb-6" />
        <h3 className="font-heading text-3xl font-bold text-heading mb-4">
          {tx({ fr: 'Contrat signe et candidature envoyee!', en: 'Contract signed and application sent!', es: 'Contrato firmado y solicitud enviada!' })}
        </h3>
        <p className="text-grey-muted text-lg mb-2">
          {tx({
            fr: 'Tu recevras une copie du contrat signe par courriel. On examine ta candidature et on te revient rapidement.',
            en: 'You will receive a copy of the signed contract by email. We are reviewing your application and will get back to you soon.',
            es: 'Recibiras una copia del contrato firmado por correo. Estamos revisando tu solicitud y te contactaremos pronto.',
          })}
        </p>
        <p className="text-grey-muted text-sm mt-4">
          {tx({
            fr: 'Une fois accepte, tu pourras envoyer ton portfolio et ta bio depuis ton espace compte.',
            en: 'Once accepted, you can submit your portfolio and bio from your account page.',
            es: 'Una vez aceptado, podras enviar tu portafolio y bio desde tu cuenta.',
          })}
        </p>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Intro */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 text-center"
      >
        <h2 className="text-3xl font-heading font-bold text-gradient mb-4 flex items-center justify-center gap-3">
          <Palette size={28} className="text-accent" />
          {tx({ fr: 'Devenir artiste partenaire', en: 'Become a partner artist', es: 'Conviertete en artista asociado' })}
        </h2>
        <p className="text-grey-light text-base leading-relaxed max-w-2xl mx-auto mb-3">
          {tx({
            fr: 'Un artiste Massive, c\'est un createur visuel qui rejoint notre reseau pour transformer ses oeuvres en produits physiques de qualite professionnelle - prints fine art, stickers, merch. Massive s\'occupe de tout : impression sur equipement pro, boutique en ligne, gestion des commandes et livraison. Toi, tu te concentres sur ta creation et tu touches ta part sur chaque vente. C\'est un partenariat gagnant-gagnant : ton art prend forme, et ton public peut enfin le tenir entre ses mains.',
            en: 'A Massive artist is a visual creator who joins our network to turn their artwork into professional-quality physical products - fine art prints, stickers, merch. Massive handles everything: printing on pro equipment, online store, order management and shipping. You focus on creating and earn your share on every sale. It\'s a win-win partnership: your art comes to life, and your audience can finally hold it in their hands.',
            es: 'Un artista Massive es un creador visual que se une a nuestra red para transformar sus obras en productos fisicos de calidad profesional - impresiones fine art, stickers, merch. Massive se encarga de todo: impresion en equipo profesional, tienda en linea, gestion de pedidos y envios. Tu te concentras en crear y ganas tu parte en cada venta. Es una asociacion donde todos ganan: tu arte cobra vida, y tu publico por fin puede tenerlo en sus manos.',
          })}
        </p>
      </motion.div>

      {/* Login requis - en haut, bien visible */}
      {!user && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row items-center gap-4 p-6 rounded-2xl border-2 border-accent/40 bg-accent/5 text-center sm:text-left">
            <LogIn size={32} className="text-accent flex-shrink-0" />
            <div className="flex-1">
              <p className="text-heading font-bold text-lg mb-1">
                {tx({
                  fr: 'Connecte-toi ou cree un compte pour commencer',
                  en: 'Sign in or create an account to get started',
                  es: 'Inicia sesion o crea una cuenta para comenzar',
                })}
              </p>
              <p className="text-grey-muted text-sm">
                {tx({
                  fr: 'Tu dois être connecté pour signer le contrat et soumettre ta candidature.',
                  en: 'You must be signed in to sign the contract and submit your application.',
                  es: 'Debes estar conectado para firmar el contrato y enviar tu solicitud.',
                })}
              </p>
            </div>
            <Link to="/login" className="btn-primary text-base py-3 px-8 whitespace-nowrap flex items-center gap-2 shadow-[0_0_20px_rgba(var(--accent-rgb,255,200,0),0.3)] animate-subtle-glow">
              <LogIn size={18} />
              {tx({ fr: 'Connexion / Inscription', en: 'Sign in / Register', es: 'Conectarse / Registro' })}
            </Link>
          </div>
        </motion.div>
      )}

      {/* Contrat */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <h2 className="text-2xl font-heading font-bold text-heading mb-4 flex items-center gap-3">
          <FileText size={24} className="text-accent" />
          {tx({ fr: 'Contrat de partenariat', en: 'Partnership contract', es: 'Contrato de asociacion' })}
        </h2>
        <div className="flex items-center justify-between mb-4">
          <p className="text-grey-muted text-sm">
            {tx({
              fr: 'Lis attentivement le contrat ci-dessous avant de soumettre ta candidature.',
              en: 'Please read the contract below carefully before submitting your application.',
              es: 'Lee atentamente el contrato a continuacion antes de enviar tu solicitud.',
            })}
          </p>
          <button
            type="button"
            onClick={() => generateContractPDF(lang, contractText)}
            className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1.5 flex-shrink-0 ml-4"
            title={tx({ fr: 'Télécharger en PDF', en: 'Download as PDF', es: 'Descargar en PDF' })}
          >
            <Download size={14} />
            PDF
          </button>
        </div>

        <div
          className="rounded-xl bg-glass p-6 max-h-[500px] overflow-y-auto mb-6 text-sm text-grey-light leading-relaxed contract-content"
          dangerouslySetInnerHTML={{ __html: contractText }}
        />

        {/* Checkbox contrat */}
        <div className="mb-8">
          <label className={`flex items-start gap-3 p-4 rounded-xl bg-glass/50 transition-colors ${
            user
              ? 'cursor-pointer group'
              : 'cursor-not-allowed opacity-50'
          }`}>
            <input
              type="checkbox"
              checked={contractAccepted}
              onChange={(e) => user && setContractAccepted(e.target.checked)}
              disabled={!user}
              className="mt-0.5 w-5 h-5 rounded border-2 border-grey-muted/50 accent-accent cursor-pointer flex-shrink-0 disabled:cursor-not-allowed"
            />
            <span className="text-heading text-sm leading-relaxed group-hover:text-accent transition-colors">
              {tx({
                fr: "En cochant cette case, je confirme avoir lu et compris les termes du contrat de partenariat artiste ci-dessus. Cette validation fait office de signature et constitue une entente entre Massive Medias et l'artiste.",
                en: 'By checking this box, I confirm that I have read and understood the terms of the artist partnership contract above. This validation serves as a signature and constitutes an agreement between Massive Medias and the artist.',
                es: 'Al marcar esta casilla, confirmo haber leido y comprendido los terminos del contrato de asociacion artistica anterior. Esta validacion sirve como firma y constituye un acuerdo entre Massive Medias y el artista.',
              })}
            </span>
          </label>
        </div>
      </motion.div>

      {/* Formulaire - coordonnees */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className={!user ? 'opacity-40 pointer-events-none select-none' : ''}
      >
        <h2 className="text-2xl font-heading font-bold text-heading mb-6 flex items-center gap-3">
          <Palette size={24} className="text-accent" />
          {tx({ fr: 'Tes coordonnees', en: 'Your information', es: 'Tu informacion' })}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nom legal + Nom artiste */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="nomLegal" className="block text-heading font-semibold text-sm mb-2">
                {tx({ fr: 'Nom legal', en: 'Legal name', es: 'Nombre legal' })} *
              </label>
              <input
                type="text" id="nomLegal" name="nomLegal" required
                value={formData.nomLegal} onChange={handleChange}
                disabled={!user}
                placeholder={tx({ fr: 'Prenom Nom', en: 'First Last', es: 'Nombre Apellido' })}
                className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label htmlFor="nomArtiste" className="block text-heading font-semibold text-sm mb-2">
                {tx({ fr: "Nom d'artiste", en: 'Artist name', es: 'Nombre artistico' })}
              </label>
              <input
                type="text" id="nomArtiste" name="nomArtiste"
                value={formData.nomArtiste} onChange={handleChange}
                disabled={!user}
                placeholder={tx({ fr: 'Si different du nom legal', en: 'If different from legal name', es: 'Si es diferente del nombre legal' })}
                className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Email + Telephone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="artistEmail" className="block text-heading font-semibold text-sm mb-2">
                {tx({ fr: 'Courriel', en: 'Email', es: 'Correo' })} *
              </label>
              <input
                type="email" id="artistEmail" name="email" required
                value={formData.email} onChange={handleChange}
                disabled={!user}
                placeholder="ton@email.com"
                className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label htmlFor="artistTel" className="block text-heading font-semibold text-sm mb-2">
                {tx({ fr: 'Telephone', en: 'Phone', es: 'Telefono' })} *
              </label>
              <input
                type="tel" id="artistTel" name="telephone" required
                value={formData.telephone} onChange={handleChange}
                disabled={!user}
                placeholder="514-xxx-xxxx"
                className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Adresse */}
          <div>
            <label htmlFor="artistAdresse" className="block text-heading font-semibold text-sm mb-2">
              {tx({ fr: 'Adresse complete', en: 'Full address', es: 'Direccion completa' })} *
            </label>
            <input
              type="text" id="artistAdresse" name="adresse" required
              value={formData.adresse} onChange={handleChange}
              disabled={!user}
              placeholder={tx({ fr: '123 rue Exemple, Montreal, QC H2X 1Y4', en: '123 Example St, Montreal, QC H2X 1Y4', es: '123 Calle Ejemplo, Montreal, QC H2X 1Y4' })}
              className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* TPS/TVQ */}
          <div className="md:w-1/2">
            <label htmlFor="tpsTvq" className="block text-heading font-semibold text-sm mb-2">
              {tx({ fr: 'Numero TPS / TVQ', en: 'GST / QST number', es: 'Numero TPS / TVQ' })}
            </label>
            <input
              type="text" id="tpsTvq" name="tpsTvq"
              value={formData.tpsTvq} onChange={handleChange}
              disabled={!user}
              placeholder={tx({ fr: 'Si applicable', en: 'If applicable', es: 'Si aplica' })}
              className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Signature numerique */}
          {user && contractAccepted && signatureName && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-green-500/30 bg-green-500/5 p-5"
            >
              <p className="text-grey-muted text-xs uppercase tracking-wider mb-3 font-semibold">
                {tx({ fr: 'Signature numerique - L\'artiste', en: 'Digital signature - The artist', es: 'Firma digital - El artista' })}
              </p>
              <p
                className="text-green-400 text-3xl md:text-4xl"
                style={{ fontFamily: "'Caveat', 'Dancing Script', 'Segoe Script', 'Comic Sans MS', cursive" }}
              >
                {signatureName}
              </p>
              <p className="text-grey-muted text-xs mt-2">
                {tx({ fr: 'Date :', en: 'Date:', es: 'Fecha:' })} {new Date().toLocaleDateString(lang === 'en' ? 'en-CA' : lang === 'es' ? 'es-CA' : 'fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </motion.div>
          )}

          {/* Erreur */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-lg border border-red-500/30 error-bg">
              <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className={`btn-primary w-full justify-center text-base py-3.5 disabled:cursor-not-allowed ${!user ? 'opacity-30' : 'disabled:opacity-40'}`}
          >
            {status === 'sending' ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {tx({ fr: 'Envoi en cours...', en: 'Sending...', es: 'Enviando...' })}
              </>
            ) : (
              <>
                <Send size={18} />
                {tx({ fr: 'Signer et soumettre ma candidature', en: 'Sign and submit my application', es: 'Firmar y enviar mi solicitud' })}
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default ArtistPartnershipForm;
