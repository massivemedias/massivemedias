import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, CheckCircle, ShoppingBag, Truck, Heart, Shield } from 'lucide-react';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const { t, lang, tx } = useLang();
  const { signIn, signUp, signInWithOAuth, resetPassword, updatePassword, verifyOtp, session, passwordRecovery } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get('expired') === '1';
  const redirectTo = searchParams.get('redirect') || '/';

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot' | 'update-password' | 'verify-otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  // Detect if we arrived with a recovery hash - must be checked BEFORE session redirect
  const [isRecoveryFlow, setIsRecoveryFlow] = useState(() => {
    return window.location.hash.includes('type=recovery');
  });

  // Redirect if already logged in (but NOT during password recovery flow)
  useEffect(() => {
    if (session && !passwordRecovery && !passwordUpdated && !isRecoveryFlow) {
      navigate(redirectTo);
    }
  }, [session, passwordRecovery, isRecoveryFlow]);

  // Detect password recovery event from Supabase
  useEffect(() => {
    if (passwordRecovery) {
      setMode('update-password');
      setError('');
      setIsRecoveryFlow(false); // Supabase confirmed recovery, safe to clear flag
    }
  }, [passwordRecovery]);

  // Detect recovery tokens or errors in URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash.substring(1));

    const errorCode = params.get('error_code');
    const errorDesc = params.get('error_description');
    if (errorCode || errorDesc) {
      setIsRecoveryFlow(false);
      if (errorCode === 'otp_expired') {
        setError(tx({
          fr: 'Le lien a expiré. Demande un nouveau lien de réinitialisation.',
          en: 'The link has expired. Request a new reset link.',
          es: 'El enlace ha expirado. Solicita un nuevo enlace de restablecimiento.',
        }));
        setMode('forgot');
      } else {
        setError(errorDesc?.replace(/\+/g, ' ') || tx({ fr: 'Une erreur est survenue.', en: 'An error occurred.', es: 'Ocurrio un error.' }));
      }
      window.history.replaceState(null, '', window.location.pathname);
      return;
    }

    if (hash.includes('type=recovery')) {
      setMode('update-password');
      setError('');
      // Don't clear hash yet - let Supabase client process the token first
    }
  }, []);

  function translateSupabaseError(err) {
    const msg = err?.message || '';
    if (msg.includes('Invalid login credentials')) {
      return tx({ fr: 'Email ou mot de passe incorrect', en: 'Invalid email or password', es: 'Correo o contrasena incorrectos' });
    }
    if (msg.includes('Email not confirmed')) {
      return tx({ fr: 'Ton email n\'est pas encore confirmé. Vérifie ta boîte de réception.', en: 'Your email is not confirmed. Check your inbox.', es: 'Tu correo aun no esta confirmado. Revisa tu bandeja de entrada.' });
    }
    if (msg.includes('User already registered')) {
      return tx({ fr: 'Un compte existe déjà avec cet email.', en: 'An account already exists with this email.', es: 'Ya existe una cuenta con este correo.' });
    }
    if (msg.includes('Password should be at least')) {
      return tx({ fr: 'Le mot de passe doit contenir au moins 6 caractères.', en: 'Password must be at least 6 characters.', es: 'La contrasena debe tener al menos 6 caracteres.' });
    }
    if (msg.includes('rate limit') || msg.includes('too many requests')) {
      return tx({ fr: 'Trop de tentatives. Attends quelques minutes.', en: 'Too many attempts. Wait a few minutes.', es: 'Demasiados intentos. Espera unos minutos.' });
    }
    if (msg.includes('network') || msg.includes('fetch')) {
      return tx({ fr: 'Erreur de connexion. Vérifie ta connexion internet.', en: 'Connection error. Check your internet.', es: 'Error de conexion. Verifica tu internet.' });
    }
    return msg || tx({ fr: 'Une erreur est survenue.', en: 'An error occurred.', es: 'Ocurrio un error.' });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'verify-otp') {
        if (!otpCode || otpCode.length < 6) {
          setError(tx({ fr: 'Entre le code à 6 chiffres reçu par courriel.', en: 'Enter the 6-digit code received by email.', es: 'Ingresa el codigo de 6 digitos recibido por correo.' }));
          return;
        }
        const { error: err } = await verifyOtp(email, otpCode);
        if (err) { setError(translateSupabaseError(err)); return; }
        navigate(redirectTo);
        return;
      }

      if (mode === 'update-password') {
        if (password !== confirmPassword) {
          setError(t('auth.passwordMismatch'));
          return;
        }
        if (password.length < 6) {
          setError(t('auth.passwordTooShort'));
          return;
        }
        const { error: err } = await updatePassword(password);
        if (err) { setError(translateSupabaseError(err)); return; }
        setPasswordUpdated(true);
        setTimeout(() => navigate(redirectTo), 2000);
        return;
      }

      if (mode === 'forgot') {
        if (!email || !email.includes('@')) {
          setError(tx({ fr: 'Entre une adresse email valide.', en: 'Enter a valid email address.', es: 'Ingresa un correo electronico valido.' }));
          return;
        }
        const { error: err } = await resetPassword(email);
        if (err) { setError(translateSupabaseError(err)); return; }
        setResetSent(true);
        return;
      }

      if (mode === 'register') {
        if (password !== confirmPassword) {
          setError(t('auth.passwordMismatch'));
          return;
        }
        if (password.length < 6) {
          setError(t('auth.passwordTooShort'));
          return;
        }
        const referralCode = localStorage.getItem('referralCode') || undefined;
        const { data, error: err } = await signUp(email, password, fullName, referralCode);
        if (err) { setError(translateSupabaseError(err)); return; }
        if (referralCode) localStorage.removeItem('referralCode');
        // Si l'email n'est pas encore confirme, montrer l'ecran OTP
        if (data?.user && !data.user.confirmed_at && !data.session) {
          setMode('verify-otp');
          setError('');
          setOtpCode('');
          return;
        }
        // Si confirmation desactivee ou deja confirmee, naviguer directement
        navigate(redirectTo);
        return;
      }

      // Login
      const { error: err } = await signIn(email, password);
      if (err) { setError(translateSupabaseError(err)); return; }
      navigate(redirectTo);
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(provider) {
    setError('');
    setLoading(true);
    try {
      const { error: err } = await signInWithOAuth(provider);
      if (err) setError(translateSupabaseError(err));
    } catch (err) {
      setError(translateSupabaseError(err));
    } finally {
      setLoading(false);
    }
  }

  function getTitle() {
    if (mode === 'verify-otp') return tx({ fr: 'Vérifie ton courriel', en: 'Verify your email', es: 'Verifica tu correo' });
    if (mode === 'update-password') return tx({ fr: 'Nouveau mot de passe', en: 'New password', es: 'Nueva contrasena' });
    if (mode === 'forgot') return t('auth.forgotTitle');
    if (mode === 'register') return t('auth.registerTitle');
    return t('auth.loginTitle');
  }

  function getSubtitle() {
    if (mode === 'verify-otp') return tx({ fr: `Un code de vérification a été envoyé à ${email}`, en: `A verification code was sent to ${email}`, es: `Se envio un codigo de verificacion a ${email}` });
    if (mode === 'update-password') return tx({ fr: 'Entre ton nouveau mot de passe', en: 'Enter your new password', es: 'Ingresa tu nueva contrasena' });
    if (mode === 'forgot') return t('auth.forgotSubtitle');
    if (mode === 'register') return t('auth.registerSubtitle');
    return t('auth.loginSubtitle');
  }

  const benefits = [
    {
      icon: ShoppingBag,
      title: tx({ fr: 'Suivi de commandes', en: 'Order tracking', es: 'Seguimiento de pedidos' }),
      desc: tx({ fr: 'Suis tes commandes en temps reel', en: 'Track your orders in real time', es: 'Sigue tus pedidos en tiempo real' }),
    },
    {
      icon: Heart,
      title: tx({ fr: 'Offres exclusives', en: 'Exclusive offers', es: 'Ofertas exclusivas' }),
      desc: tx({ fr: 'Acces aux promos membres', en: 'Access member-only promos', es: 'Acceso a promos para miembros' }),
    },
    {
      icon: Truck,
      title: tx({ fr: 'Commande rapide', en: 'Fast checkout', es: 'Compra rapida' }),
      desc: tx({ fr: 'Adresse et infos sauvegardees', en: 'Saved address and info', es: 'Direccion e info guardadas' }),
    },
    {
      icon: Shield,
      title: tx({ fr: 'Parrainage 10%', en: 'Referral 10%', es: 'Referidos 10%' }),
      desc: tx({ fr: 'Invite un ami, reçois 10% de rabais', en: 'Invite a friend, get 10% off', es: 'Invita a un amigo, recibe 10% de descuento' }),
    },
  ];

  return (
    <>
      <SEO title={`${getTitle()} - Massive`} description="" noindex />

      <section className="section-container pt-32 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
            {/* Left: Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="md:col-span-3 rounded-2xl p-8 md:p-10 backdrop-blur-xl login-card"
            >
              <h1 className="text-3xl font-heading font-bold text-heading mb-2">
                {getTitle()}
              </h1>
              <p className="text-grey-muted mb-8">
                {getSubtitle()}
              </p>

              {/* Password updated success */}
              {passwordUpdated ? (
                <div className="text-center py-6">
                  <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
                  <div className="text-green-400 mb-4">
                    {tx({ fr: 'Mot de passe mis a jour avec succes!', en: 'Password updated successfully!', es: 'Contrasena actualizada con exito!' })}
                  </div>
                  <p className="text-grey-muted text-sm">
                    {tx({ fr: 'Redirection en cours...', en: 'Redirecting...', es: 'Redirigiendo...' })}
                  </p>
                </div>
              ) : resetSent ? (
                <div className="text-center py-6">
                  <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
                  <div className="text-green-400 font-medium mb-2">{t('auth.resetSent')}</div>
                  <p className="text-grey-muted text-sm mb-1">
                    {tx({
                      fr: 'Tu vas recevoir un courriel de Supabase (notre service d\'authentification) avec un lien pour réinitialiser ton mot de passe.',
                      en: 'You will receive an email from Supabase (our authentication service) with a link to reset your password.',
                      es: 'Recibiras un correo de Supabase (nuestro servicio de autenticacion) con un enlace para restablecer tu contrasena.',
                    })}
                  </p>
                  <p className="text-grey-muted text-xs mb-1">
                    {tx({
                      fr: 'Vérifie ta boîte de réception et tes spams.',
                      en: 'Check your inbox and spam folder.',
                      es: 'Revisa tu bandeja de entrada y la carpeta de spam.',
                    })}
                  </p>
                  <p className="text-grey-muted text-xs mb-6">
                    {tx({
                      fr: 'Si tu ne reçois rien, assure-toi que l\'email est bien celui utilisé pour créer ton compte.',
                      en: 'If you don\'t receive anything, make sure the email matches the one used to create your account.',
                      es: 'Si no recibes nada, asegurate de que el correo es el que usaste para crear tu cuenta.',
                    })}
                  </p>
                  <button onClick={() => { setMode('login'); setResetSent(false); setError(''); }} className="text-accent hover:underline font-medium">
                    {t('auth.backToLogin')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* OTP verification screen */}
                  {mode === 'verify-otp' && (
                    <>
                      <div className="text-center py-4">
                        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                          <Shield size={28} className="text-accent" />
                        </div>
                        <p className="text-grey-muted text-sm mb-6">
                          {tx({
                            fr: 'Vérifie ta boîte de réception (et tes spams). Entre le code à 6 chiffres pour activer ton compte.',
                            en: 'Check your inbox (and spam folder). Enter the 6-digit code to activate your account.',
                            es: 'Revisa tu bandeja de entrada (y spam). Ingresa el codigo de 6 digitos para activar tu cuenta.',
                          })}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm text-grey-light mb-1.5">
                          {tx({ fr: 'Code de vérification', en: 'Verification code', es: 'Codigo de verificacion' })}
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          value={otpCode}
                          onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="input-field text-center text-2xl tracking-[0.5em] font-mono font-bold"
                          placeholder="000000"
                          autoFocus
                          required
                        />
                      </div>

                      {sessionExpired && !error && (
                        <p className="text-yellow-400 text-sm">{tx({ fr: 'Ta session a expire, reconnecte-toi.', en: 'Your session has expired, please sign in again.', es: 'Tu sesion ha expirado, inicia sesion de nuevo.' })}</p>
                      )}

                      {error && (
                        <p className="text-red-400 text-sm">{error}</p>
                      )}

                      <button
                        type="submit"
                        disabled={loading || otpCode.length < 6}
                        className="btn-primary w-full justify-center"
                      >
                        {loading ? (
                          <span className="animate-pulse">...</span>
                        ) : (
                          <>
                            {tx({ fr: 'Verifier et activer mon compte', en: 'Verify and activate my account', es: 'Verificar y activar mi cuenta' })}
                            <ArrowRight size={18} className="ml-2" />
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => { setMode('register'); setError(''); setOtpCode(''); }}
                        className="block w-full text-center text-sm text-grey-muted hover:text-accent transition-colors"
                      >
                        {tx({ fr: 'Retour a l\'inscription', en: 'Back to registration', es: 'Volver al registro' })}
                      </button>
                    </>
                  )}

                  {/* OAuth buttons - login & register only */}
                  {(mode === 'login' || mode === 'register') && (
                    <>
                      <div className="space-y-3">
                        <button
                          type="button"
                          onClick={() => handleOAuth('google')}
                          disabled={loading}
                          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-glass text-heading font-medium text-sm transition-all disabled:opacity-50"
                        >
                          <svg viewBox="0 0 24 24" width="20" height="20">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                          {tx({ fr: 'Continuer avec Google', en: 'Continue with Google', es: 'Continuar con Google' })}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOAuth('apple')}
                          disabled={loading}
                          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-glass text-heading font-medium text-sm transition-all disabled:opacity-50"
                        >
                          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                          </svg>
                          {tx({ fr: 'Continuer avec Apple', en: 'Continue with Apple', es: 'Continuar con Apple' })}
                        </button>
                      </div>

                      {/* Separator */}
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-purple-main/20" />
                        <span className="text-grey-muted text-xs uppercase tracking-wider">
                          {tx({ fr: 'ou', en: 'or', es: 'o' })}
                        </span>
                        <div className="flex-1 h-px bg-purple-main/20" />
                      </div>
                    </>
                  )}

                  {/* Full name (register only) */}
                  {mode === 'register' && (
                    <div>
                      <label className="block text-sm text-grey-light mb-1.5">{t('auth.fullName')}</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        className="input-field"
                        placeholder={t('auth.fullNamePlaceholder')}
                        required
                      />
                    </div>
                  )}

                  {/* Email (not for update-password or verify-otp mode) */}
                  {mode !== 'update-password' && mode !== 'verify-otp' && (
                    <div>
                      <label className="block text-sm text-grey-light mb-1.5">{t('auth.email')}</label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="input-field"
                        placeholder={t('auth.emailPlaceholder')}
                        required
                      />
                    </div>
                  )}

                  {/* Password (not for forgot or verify-otp mode) */}
                  {mode !== 'forgot' && mode !== 'verify-otp' && (
                    <div>
                      <label className="block text-sm text-grey-light mb-1.5">
                        {mode === 'update-password'
                          ? tx({ fr: 'Nouveau mot de passe', en: 'New password', es: 'Nueva contrasena' })
                          : t('auth.password')}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          className="input-field"
                          style={{ paddingRight: '2.5rem' }}
                          placeholder="--------"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-grey-muted hover:text-grey-light transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Confirm password (register + update-password, not verify-otp) */}
                  {(mode === 'register' || mode === 'update-password') && mode !== 'verify-otp' && (
                    <div>
                      <label className="block text-sm text-grey-light mb-1.5">{t('auth.confirmPassword')}</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          className="input-field"
                          style={{ paddingRight: '2.5rem' }}
                          placeholder="--------"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                  )}

                  {mode !== 'verify-otp' && error && (
                    <p className="text-red-400 text-sm">{error}</p>
                  )}

                  {mode !== 'verify-otp' && (
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full justify-center"
                  >
                    {loading ? (
                      <span className="animate-pulse">...</span>
                    ) : (
                      <>
                        {mode === 'update-password'
                          ? tx({ fr: 'Mettre a jour', en: 'Update password', es: 'Actualizar contrasena' })
                          : mode === 'forgot'
                            ? t('auth.sendReset')
                            : mode === 'register'
                              ? t('auth.createAccount')
                              : t('auth.loginButton')}
                        <ArrowRight size={18} className="ml-2" />
                      </>
                    )}
                  </button>
                  )}

                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setError(''); }}
                      className="block w-full text-center text-sm text-grey-muted hover:text-accent transition-colors"
                    >
                      {t('auth.forgotPassword')}
                    </button>
                  )}
                </form>
              )}

              {(mode === 'login' || mode === 'register') && !passwordUpdated && (
                <div className="mt-6 pt-6 border-t border-purple-main/20 text-center">
                  <p className="text-grey-muted text-sm">
                    {mode === 'login' ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
                    <button
                      onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                      className="text-accent hover:underline font-medium"
                    >
                      {mode === 'login' ? t('auth.registerLink') : t('auth.loginLink')}
                    </button>
                  </p>
                </div>
              )}

              {mode === 'forgot' && !resetSent && (
                <div className="mt-6 pt-6 border-t border-purple-main/20 text-center">
                  <button
                    onClick={() => { setMode('login'); setResetSent(false); setError(''); }}
                    className="text-accent hover:underline font-medium text-sm"
                  >
                    {t('auth.backToLogin')}
                  </button>
                </div>
              )}

              {mode === 'update-password' && !passwordUpdated && (
                <div className="mt-6 pt-6 border-t border-purple-main/20 text-center">
                  <button
                    onClick={() => { setMode('login'); setError(''); setPassword(''); setConfirmPassword(''); }}
                    className="text-accent hover:underline font-medium text-sm"
                  >
                    {t('auth.backToLogin')}
                  </button>
                </div>
              )}
            </motion.div>

            {/* Right: Benefits panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="md:col-span-2 rounded-2xl p-6 md:p-8 card-bg card-shadow"
            >
              <h2 className="text-lg font-heading font-bold text-heading mb-2">
                {mode === 'register'
                  ? tx({ fr: 'Pourquoi créer un compte?', en: 'Why create an account?', es: 'Por que crear una cuenta?' })
                  : tx({ fr: 'Avantages membres', en: 'Member benefits', es: 'Beneficios de miembros' })}
              </h2>
              <p className="text-grey-muted text-sm mb-6">
                {tx({
                  fr: 'Un compte gratuit pour profiter de tous les avantages.',
                  en: 'A free account to enjoy all the benefits.',
                  es: 'Una cuenta gratuita para disfrutar de todos los beneficios.',
                })}
              </p>

              <div className="space-y-4">
                {benefits.map((b, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <b.icon size={16} className="text-accent" />
                    </div>
                    <div>
                      <p className="text-heading text-sm font-medium">{b.title}</p>
                      <p className="text-grey-muted text-xs">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Trust signal */}
              <div className="mt-8 pt-6 border-t border-purple-main/10">
                <p className="text-grey-muted text-xs text-center">
                  {tx({
                    fr: 'Impression locale à Montréal - Pick-up gratuit Mile-End',
                    en: 'Local printing in Montreal - Free Mile-End pickup',
                    es: 'Impresion local en Montreal - Recogida gratis Mile-End',
                  })}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Login;
