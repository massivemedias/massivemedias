import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, CheckCircle } from 'lucide-react';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const { t, lang } = useLang();
  const { signIn, signUp, resetPassword, updatePassword, session, passwordRecovery } = useAuth();
  const navigate = useNavigate();
  const isFr = lang === 'fr';

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot' | 'update-password'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  // Detect password recovery event from Supabase
  useEffect(() => {
    if (passwordRecovery) {
      setMode('update-password');
      setError('');
    }
  }, [passwordRecovery]);

  // Also detect recovery tokens in URL hash (Supabase redirects with #access_token=...&type=recovery)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setMode('update-password');
      setError('');
    }
  }, []);

  function translateSupabaseError(err) {
    const msg = err?.message || '';
    // Map common Supabase errors to user-friendly messages
    if (msg.includes('Invalid login credentials')) {
      return isFr ? 'Email ou mot de passe incorrect' : 'Invalid email or password';
    }
    if (msg.includes('Email not confirmed')) {
      return isFr ? 'Ton email n\'est pas encore confirme. Verifie ta boite de reception.' : 'Your email is not confirmed. Check your inbox.';
    }
    if (msg.includes('User already registered')) {
      return isFr ? 'Un compte existe deja avec cet email.' : 'An account already exists with this email.';
    }
    if (msg.includes('Password should be at least')) {
      return isFr ? 'Le mot de passe doit contenir au moins 6 caracteres.' : 'Password must be at least 6 characters.';
    }
    if (msg.includes('rate limit') || msg.includes('too many requests')) {
      return isFr ? 'Trop de tentatives. Attends quelques minutes.' : 'Too many attempts. Wait a few minutes.';
    }
    if (msg.includes('network') || msg.includes('fetch')) {
      return isFr ? 'Erreur de connexion. Verifie ta connexion internet.' : 'Connection error. Check your internet.';
    }
    // Fallback: show the original error
    return msg || (isFr ? 'Une erreur est survenue.' : 'An error occurred.');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
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
        setTimeout(() => navigate('/'), 2000);
        return;
      }

      if (mode === 'forgot') {
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
        const { error: err } = await signUp(email, password, fullName);
        if (err) { setError(translateSupabaseError(err)); return; }
        navigate('/');
        return;
      }

      // Login
      const { error: err } = await signIn(email, password);
      if (err) { setError(translateSupabaseError(err)); return; }
      navigate('/');
    } finally {
      setLoading(false);
    }
  }

  // Title and subtitle based on mode
  function getTitle() {
    if (mode === 'update-password') return isFr ? 'Nouveau mot de passe' : 'New password';
    if (mode === 'forgot') return t('auth.forgotTitle');
    if (mode === 'register') return t('auth.registerTitle');
    return t('auth.loginTitle');
  }

  function getSubtitle() {
    if (mode === 'update-password') return isFr ? 'Entre ton nouveau mot de passe' : 'Enter your new password';
    if (mode === 'forgot') return t('auth.forgotSubtitle');
    if (mode === 'register') return t('auth.registerSubtitle');
    return t('auth.loginSubtitle');
  }

  return (
    <>
      <SEO title={`${getTitle()} - Massive Medias`} description="" noindex />

      <section className="section-container pt-32 pb-20">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl border border-purple-main/30 p-8 md:p-10 backdrop-blur-xl login-card"
          >
            <h1 className="text-3xl font-heading font-bold text-heading mb-2 text-center">
              {getTitle()}
            </h1>
            <p className="text-grey-muted text-center mb-8">
              {getSubtitle()}
            </p>

            {/* Password updated success */}
            {passwordUpdated ? (
              <div className="text-center">
                <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
                <div className="text-green-400 mb-4">
                  {isFr ? 'Mot de passe mis a jour avec succes!' : 'Password updated successfully!'}
                </div>
                <p className="text-grey-muted text-sm">
                  {isFr ? 'Redirection en cours...' : 'Redirecting...'}
                </p>
              </div>
            ) : resetSent ? (
              <div className="text-center">
                <div className="text-green-400 mb-4">{t('auth.resetSent')}</div>
                <button onClick={() => { setMode('login'); setResetSent(false); }} className="text-accent hover:underline">
                  {t('auth.backToLogin')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
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

                {/* Email (not for update-password mode) */}
                {mode !== 'update-password' && (
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

                {/* Password (not for forgot mode) */}
                {mode !== 'forgot' && (
                  <div>
                    <label className="block text-sm text-grey-light mb-1.5">
                      {mode === 'update-password'
                        ? (isFr ? 'Nouveau mot de passe' : 'New password')
                        : t('auth.password')}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="input-field"
                        style={{ paddingRight: '2.5rem' }}
                        placeholder="••••••••"
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

                {/* Confirm password (register + update-password) */}
                {(mode === 'register' || mode === 'update-password') && (
                  <div>
                    <label className="block text-sm text-grey-light mb-1.5">{t('auth.confirmPassword')}</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="input-field"
                        style={{ paddingRight: '2.5rem' }}
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <p className="text-red-400 text-sm text-center">{error}</p>
                )}

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
                        ? (isFr ? 'Mettre a jour' : 'Update password')
                        : mode === 'forgot'
                          ? t('auth.sendReset')
                          : mode === 'register'
                            ? t('auth.createAccount')
                            : t('auth.loginButton')}
                      <ArrowRight size={18} className="ml-2" />
                    </>
                  )}
                </button>

                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
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
        </div>
      </section>
    </>
  );
}

export default Login;
