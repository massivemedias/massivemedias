import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const { t } = useLang();
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'forgot') {
        const { error: err } = await resetPassword(email);
        if (err) { setError(err.message); return; }
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
        if (err) { setError(err.message); return; }
        navigate('/');
        return;
      }

      // Login
      const { error: err } = await signIn(email, password);
      if (err) { setError(t('auth.invalidCredentials')); return; }
      navigate('/');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SEO title={`${mode === 'register' ? t('auth.registerTitle') : t('auth.loginTitle')} - Massive Medias`} description="" noindex />

      <section className="section-container pt-32 pb-20">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl border border-purple-main/30 p-8 md:p-10 backdrop-blur-xl login-card"
          >
            <h1 className="text-3xl font-heading font-bold text-heading mb-2 text-center">
              {mode === 'forgot' ? t('auth.forgotTitle') : mode === 'register' ? t('auth.registerTitle') : t('auth.loginTitle')}
            </h1>
            <p className="text-grey-muted text-center mb-8">
              {mode === 'forgot' ? t('auth.forgotSubtitle') : mode === 'register' ? t('auth.registerSubtitle') : t('auth.loginSubtitle')}
            </p>

            {resetSent ? (
              <div className="text-center">
                <div className="text-green-400 mb-4">{t('auth.resetSent')}</div>
                <button onClick={() => { setMode('login'); setResetSent(false); }} className="text-magenta hover:underline">
                  {t('auth.backToLogin')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
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

                {mode !== 'forgot' && (
                  <div>
                    <label className="block text-sm text-grey-light mb-1.5">{t('auth.password')}</label>
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

                {mode === 'register' && (
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
                      {mode === 'forgot' ? t('auth.sendReset') : mode === 'register' ? t('auth.createAccount') : t('auth.loginButton')}
                      <ArrowRight size={18} className="ml-2" />
                    </>
                  )}
                </button>

                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="block w-full text-center text-sm text-grey-muted hover:text-magenta transition-colors"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                )}
              </form>
            )}

            {mode !== 'forgot' && (
              <div className="mt-6 pt-6 border-t border-purple-main/20 text-center">
                <p className="text-grey-muted text-sm">
                  {mode === 'login' ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
                  <button
                    onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                    className="text-magenta hover:underline font-medium"
                  >
                    {mode === 'login' ? t('auth.registerLink') : t('auth.loginLink')}
                  </button>
                </p>
              </div>
            )}

            {mode === 'forgot' && (
              <div className="mt-6 pt-6 border-t border-purple-main/20 text-center">
                <button
                  onClick={() => { setMode('login'); setResetSent(false); setError(''); }}
                  className="text-magenta hover:underline font-medium text-sm"
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
