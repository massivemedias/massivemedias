import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, Mail, Lock, LogIn } from 'lucide-react';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { trackPurchase } from '../utils/analytics';
import { getOrderByPaymentIntent } from '../services/orderService';
import { getUserRoleByEmail } from '../services/userRoleService';

function CheckoutSuccess() {
  const { t, tx } = useLang();
  const { items, cartTotal, clearCart } = useCart();
  const { signUp, user } = useAuth();
  const [searchParams] = useSearchParams();
  const paymentIntent = searchParams.get('payment_intent');
  const tracked = useRef(false);

  // Order info + signup state
  const [orderInfo, setOrderInfo] = useState(null);
  const [accountStatus, setAccountStatus] = useState('loading'); // loading | none | exists | logged-in
  const [password, setPassword] = useState('');
  const [signingUp, setSigningUp] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupError, setSignupError] = useState('');

  // Track purchase + clear cart on successful payment
  useEffect(() => {
    if (!tracked.current && paymentIntent && items.length > 0) {
      trackPurchase(paymentIntent, items, cartTotal, 0, 0);
      tracked.current = true;
    }
    clearCart();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch order info + check account status
  useEffect(() => {
    if (!paymentIntent) {
      setAccountStatus('none');
      return;
    }
    if (user) {
      setAccountStatus('logged-in');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const order = await getOrderByPaymentIntent(paymentIntent);
        if (cancelled) return;
        setOrderInfo(order);
        if (!order?.customerEmail) {
          setAccountStatus('none');
          return;
        }
        // Check if email already has account
        try {
          const existing = await getUserRoleByEmail(order.customerEmail);
          if (cancelled) return;
          setAccountStatus(existing?.email ? 'exists' : 'none');
        } catch {
          // 404 = no account, treat as 'none'
          if (!cancelled) setAccountStatus('none');
        }
      } catch (err) {
        if (!cancelled) setAccountStatus('none');
      }
    })();
    return () => { cancelled = true; };
  }, [paymentIntent, user]);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!orderInfo?.customerEmail || password.length < 6) {
      setSignupError(tx({ fr: 'Mot de passe trop court (6 caracteres min)', en: 'Password too short (6 chars min)', es: 'Contrasena muy corta (6 caracteres min)' }));
      return;
    }
    setSigningUp(true);
    setSignupError('');
    try {
      const { error } = await signUp(orderInfo.customerEmail, password, orderInfo.customerName || '');
      if (error) {
        setSignupError(error.message || tx({ fr: 'Erreur lors de la creation du compte', en: 'Account creation error', es: 'Error al crear cuenta' }));
      } else {
        setSignupSuccess(true);
      }
    } catch (err) {
      setSignupError(err?.message || tx({ fr: 'Erreur reseau', en: 'Network error', es: 'Error de red' }));
    } finally {
      setSigningUp(false);
    }
  };

  return (
    <>
      <SEO title={`${t('checkout.successTitle')} - Massive`} description="" noindex />

      <section className="section-container pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-xl mx-auto text-center"
        >
          <CheckCircle size={64} className="text-green-400 mx-auto mb-6" />
          <h1 className="text-4xl font-heading font-bold text-heading mb-4">{t('checkout.successTitle')}</h1>
          <p className="text-grey-light text-lg mb-4">{t('checkout.successMessage')}</p>

          {paymentIntent && (
            <p className="text-grey-muted text-sm mb-8">
              {tx({ fr: 'Reference', en: 'Reference', es: 'Referencia' })}: <span className="font-mono text-heading">{paymentIntent.slice(-8)}</span>
            </p>
          )}

          {/* === SIGNUP / LOGIN PROMPT === */}
          {accountStatus === 'none' && orderInfo?.customerEmail && !signupSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8 p-6 rounded-xl bg-glass border border-accent/20 text-left"
            >
              <h3 className="text-heading font-heading font-bold text-lg mb-2 text-center">
                {tx({ fr: 'Sauvegarder vos infos pour la prochaine fois?', en: 'Save your info for next time?', es: 'Guardar tus datos para la proxima vez?' })}
              </h3>
              <p className="text-grey-muted text-sm mb-4 text-center">
                {tx({
                  fr: 'Creez un compte en 1 clic pour suivre vos commandes et accelerer vos prochains achats.',
                  en: 'Create an account in 1 click to track your orders and speed up future purchases.',
                  es: 'Crea una cuenta en 1 clic para seguir tus pedidos y agilizar futuras compras.',
                })}
              </p>
              <form onSubmit={handleSignup} className="space-y-3">
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-muted" />
                  <input
                    type="email"
                    value={orderInfo.customerEmail}
                    readOnly
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-black/30 border border-white/10 text-grey-muted text-sm cursor-not-allowed"
                  />
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-muted" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={tx({ fr: 'Choisir un mot de passe (6 caracteres min)', en: 'Choose a password (6 chars min)', es: 'Elige una contrasena (6 caracteres min)' })}
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-black/30 border border-white/10 text-heading text-sm focus:border-accent focus:outline-none transition-colors"
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                </div>
                {signupError && (
                  <p className="text-red-400 text-xs">{signupError}</p>
                )}
                <button
                  type="submit"
                  disabled={signingUp || password.length < 6}
                  className="btn-primary w-full justify-center text-sm py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {signingUp ? (
                    <><Loader2 size={16} className="animate-spin mr-2" />{tx({ fr: 'Creation...', en: 'Creating...', es: 'Creando...' })}</>
                  ) : (
                    tx({ fr: 'Creer mon compte', en: 'Create my account', es: 'Crear mi cuenta' })
                  )}
                </button>
              </form>
              <p className="text-grey-muted text-[11px] text-center mt-3">
                {tx({
                  fr: 'En continuant sans creer de compte, vous pouvez quand meme suivre votre commande via le courriel de confirmation.',
                  en: 'Without an account, you can still track your order via the confirmation email.',
                  es: 'Sin una cuenta, aun puedes rastrear tu pedido por el correo de confirmacion.',
                })}
              </p>
            </motion.div>
          )}

          {accountStatus === 'exists' && orderInfo?.customerEmail && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8 p-6 rounded-xl bg-glass border border-accent/20 text-center"
            >
              <p className="text-heading font-semibold text-base mb-2">
                {tx({ fr: 'Vous avez deja un compte!', en: 'You already have an account!', es: 'Ya tienes una cuenta!' })}
              </p>
              <p className="text-grey-muted text-sm mb-4">
                {tx({
                  fr: 'Connectez-vous pour lier cette commande a votre compte et la suivre.',
                  en: 'Sign in to link this order to your account and track it.',
                  es: 'Inicia sesion para vincular este pedido a tu cuenta y seguirlo.',
                })}
              </p>
              <Link
                to={`/login?email=${encodeURIComponent(orderInfo.customerEmail)}&redirect=/account`}
                className="btn-primary inline-flex justify-center text-sm py-2.5 px-6"
              >
                <LogIn size={16} className="mr-2" />
                {tx({ fr: 'Se connecter', en: 'Sign in', es: 'Iniciar sesion' })}
              </Link>
            </motion.div>
          )}

          {signupSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-6 rounded-xl bg-green-500/10 border border-green-400/30 text-center"
            >
              <CheckCircle size={32} className="text-green-400 mx-auto mb-3" />
              <p className="text-heading font-semibold mb-2">
                {tx({ fr: 'Compte cree!', en: 'Account created!', es: 'Cuenta creada!' })}
              </p>
              <p className="text-grey-muted text-sm">
                {tx({
                  fr: 'Verifiez votre courriel pour confirmer votre compte. Votre commande est deja liee.',
                  en: 'Check your email to confirm your account. Your order is already linked.',
                  es: 'Revisa tu correo para confirmar tu cuenta. Tu pedido ya esta vinculado.',
                })}
              </p>
            </motion.div>
          )}

          <div className="flex gap-4 justify-center">
            <Link to="/artistes" className="btn-primary">{t('checkout.continueShopping')}</Link>
            <Link to="/account" className="px-6 py-3 rounded-lg border border-purple-main/30 text-heading hover:border-magenta/50 transition-colors">
              {t('account.orders')}
            </Link>
          </div>
        </motion.div>
      </section>
    </>
  );
}

export default CheckoutSuccess;
