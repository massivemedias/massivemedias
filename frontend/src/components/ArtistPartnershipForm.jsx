import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle, AlertCircle, FileText, Palette } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import api, { uploadArtistFile } from '../services/api';
import FileUpload from './FileUpload';
import { ARTIST_CONTRACT_TEXT, ARTIST_CONTRACT_TEXT_EN, ARTIST_CONTRACT_TEXT_ES, ARTIST_CONTRACT_VERSION } from '../data/artistContract';

function ArtistPartnershipForm() {
  const { tx, lang } = useLang();
  const contractText = lang === 'en' ? ARTIST_CONTRACT_TEXT_EN : lang === 'es' ? ARTIST_CONTRACT_TEXT_ES : ARTIST_CONTRACT_TEXT;

  const [formData, setFormData] = useState({
    nomLegal: '',
    nomArtiste: '',
    adresse: '',
    email: '',
    telephone: '',
    tpsTvq: '',
    bio: '',
  });
  const [profilePhoto, setProfilePhoto] = useState([]);
  const [portfolioFiles, setPortfolioFiles] = useState([]);
  const [contractAccepted, setContractAccepted] = useState(false);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const canSubmit =
    formData.nomLegal &&
    formData.email &&
    formData.telephone &&
    formData.adresse &&
    formData.bio &&
    profilePhoto.length > 0 &&
    portfolioFiles.length > 0 &&
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
        photoProfilUrl: profilePhoto[0].url,
        portfolioUrls: portfolioFiles.map(f => ({
          name: f.name,
          url: f.url,
          size: f.size,
          mime: f.mime,
        })),
        contractAccepted: true,
        contractVersion: ARTIST_CONTRACT_VERSION,
      });
      setStatus('success');
    } catch (err) {
      setError(
        err?.response?.data?.error?.message ||
        tx({ fr: 'Une erreur est survenue. Reessaie plus tard.', en: 'An error occurred. Please try again later.', es: 'Ocurrio un error. Intentalo mas tarde.' })
      );
      setStatus('error');
    }
  };

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
          {tx({ fr: 'Soumission envoyee!', en: 'Submission sent!', es: 'Solicitud enviada!' })}
        </h3>
        <p className="text-grey-muted text-lg mb-2">
          {tx({
            fr: 'Merci pour ta soumission! On examine ton portfolio et on te revient rapidement.',
            en: 'Thanks for your submission! We are reviewing your portfolio and will get back to you soon.',
            es: 'Gracias por tu solicitud! Estamos revisando tu portafolio y te contactaremos pronto.',
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
        className="mb-10 text-center"
      >
        <h2 className="text-3xl font-heading font-bold text-gradient mb-4 flex items-center justify-center gap-3">
          <Palette size={28} className="text-accent" />
          {tx({ fr: 'Devenir artiste partenaire', en: 'Become a partner artist', es: 'Conviertete en artista asociado' })}
        </h2>
        <p className="text-grey-light text-base leading-relaxed max-w-2xl mx-auto mb-3">
          {tx({
            fr: 'Massive Medias offre aux artistes visuels une vitrine professionnelle pour vendre leurs oeuvres en tirages fine art et stickers de qualite. On s\'occupe de l\'impression, de la boutique en ligne et de la logistique - tu te concentres sur ta creation.',
            en: 'Massive Medias offers visual artists a professional showcase to sell their work as fine art prints and quality stickers. We handle printing, the online store, and logistics - you focus on your art.',
            es: 'Massive Medias ofrece a los artistas visuales un escaparate profesional para vender sus obras como impresiones fine art y stickers de calidad. Nosotros nos encargamos de la impresion, la tienda en linea y la logistica - tu te concentras en tu arte.',
          })}
        </p>
        <p className="text-grey-muted text-sm">
          {tx({
            fr: 'Soumets ton portfolio ci-dessous. On examine chaque candidature et on te contacte rapidement.',
            en: 'Submit your portfolio below. We review every application and will get back to you quickly.',
            es: 'Envia tu portafolio a continuacion. Revisamos cada solicitud y te contactamos rapidamente.',
          })}
        </p>
      </motion.div>

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
        <p className="text-grey-muted text-sm mb-4">
          {tx({
            fr: 'Lis attentivement le contrat ci-dessous avant de soumettre ta candidature.',
            en: 'Please read the contract below carefully before submitting your application.',
            es: 'Lee atentamente el contrato a continuacion antes de enviar tu solicitud.',
          })}
        </p>

        <div
          className="rounded-xl bg-glass border border-purple-main/20 p-6 max-h-[500px] overflow-y-auto mb-6 text-sm text-grey-light leading-relaxed contract-content"
          dangerouslySetInnerHTML={{ __html: contractText }}
        />

        {/* Checkbox contrat - juste apres le contrat */}
        <div className="mb-10">
          <label className="flex items-start gap-3 cursor-pointer group p-4 rounded-xl border border-purple-main/20 bg-glass/50 hover:border-accent/40 transition-colors">
            <input
              type="checkbox"
              checked={contractAccepted}
              onChange={(e) => setContractAccepted(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded border-2 border-grey-muted/50 accent-accent cursor-pointer flex-shrink-0"
            />
            <span className="text-heading text-sm leading-relaxed group-hover:text-accent transition-colors">
              {tx({
                fr: "J'ai lu et j'accepte les conditions du contrat de partenariat artiste ci-dessus.",
                en: 'I have read and accept the terms of the artist partnership contract above.',
                es: 'He leido y acepto los terminos del contrato de asociacion artistica anterior.',
              })}
            </span>
          </label>
        </div>
      </motion.div>

      {/* Formulaire */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <h2 className="text-2xl font-heading font-bold text-heading mb-6 flex items-center gap-3">
          <Palette size={24} className="text-accent" />
          {tx({ fr: 'Ta candidature', en: 'Your application', es: 'Tu solicitud' })}
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
                placeholder={tx({ fr: 'Prenom Nom', en: 'First Last', es: 'Nombre Apellido' })}
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="nomArtiste" className="block text-heading font-semibold text-sm mb-2">
                {tx({ fr: "Nom d'artiste", en: 'Artist name', es: 'Nombre artistico' })}
              </label>
              <input
                type="text" id="nomArtiste" name="nomArtiste"
                value={formData.nomArtiste} onChange={handleChange}
                placeholder={tx({ fr: 'Si different du nom legal', en: 'If different from legal name', es: 'Si es diferente del nombre legal' })}
                className="input-field"
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
                placeholder="ton@email.com"
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="artistTel" className="block text-heading font-semibold text-sm mb-2">
                {tx({ fr: 'Telephone', en: 'Phone', es: 'Telefono' })} *
              </label>
              <input
                type="tel" id="artistTel" name="telephone" required
                value={formData.telephone} onChange={handleChange}
                placeholder="514-xxx-xxxx"
                className="input-field"
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
              placeholder={tx({ fr: '123 rue Exemple, Montreal, QC H2X 1Y4', en: '123 Example St, Montreal, QC H2X 1Y4', es: '123 Calle Ejemplo, Montreal, QC H2X 1Y4' })}
              className="input-field"
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
              placeholder={tx({ fr: 'Si applicable', en: 'If applicable', es: 'Si aplica' })}
              className="input-field"
            />
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-heading font-semibold text-sm mb-2">
              {tx({ fr: 'Bio / Demarche artistique', en: 'Bio / Artistic statement', es: 'Bio / Declaracion artistica' })} *
            </label>
            <textarea
              id="bio" name="bio" required
              value={formData.bio} onChange={handleChange}
              rows={5}
              placeholder={tx({
                fr: 'Decris ton parcours artistique, ta demarche, tes influences, les mediums que tu utilises...',
                en: 'Describe your artistic journey, your approach, your influences, the mediums you use...',
                es: 'Describe tu trayectoria artistica, tu enfoque, tus influencias, los medios que utilizas...',
              })}
              className="input-field resize-none"
            />
          </div>

          {/* Photo de profil */}
          <div>
            <FileUpload
              label={tx({ fr: 'Photo de profil *', en: 'Profile photo *', es: 'Foto de perfil *' })}
              files={profilePhoto}
              onFilesChange={setProfilePhoto}
              maxFiles={1}
              compact
              uploadFn={uploadArtistFile}
            />
          </div>

          {/* Portfolio */}
          <div>
            <FileUpload
              label={tx({ fr: 'Portfolio / Oeuvres (max 20 fichiers, 130 MB chacun) *', en: 'Portfolio / Artworks (max 20 files, 130 MB each) *', es: 'Portafolio / Obras (max 20 archivos, 130 MB c/u) *' })}
              files={portfolioFiles}
              onFilesChange={setPortfolioFiles}
              maxFiles={20}
              uploadFn={uploadArtistFile}
            />
          </div>

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
            className="btn-primary w-full justify-center text-base py-3.5 disabled:opacity-40 disabled:cursor-not-allowed"
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
                {tx({ fr: 'Soumettre ma candidature', en: 'Submit my application', es: 'Enviar mi solicitud' })}
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default ArtistPartnershipForm;
