import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Mail, Sparkles, ArrowRight, KeyRound, CheckCircle2, Utensils } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useTableStore } from '../store/useTableStore';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { cn } from '../lib/cn';
import { pageVariants, scaleIn, springs } from '../lib/motion';

/* ── TAB BUTTON ──────────────────────────────────────── */
function Tab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      aria-selected={active}
      role="tab"
      className={cn(
        'relative flex-1 py-2.5 rounded-xl text-label font-bold transition-all duration-200 touch-target',
        active ? 'text-ink-primary' : 'text-ink-muted hover:text-ink-secondary',
      )}
    >
      {active && (
        <motion.div
          layoutId="auth-tab-bg"
          className="absolute inset-0 bg-surface-1 rounded-xl shadow-sm"
          transition={springs.snappy}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

/* ── AUTH PAGES ──────────────────────────────────────── */
export default function AuthPages() {
  const navigate = useNavigate();
  const { tableNumber } = useTableStore();
  const { login, signup, guestLogin, isLoading, error } = useAuthStore();

  const [activeTab, setActiveTab] = useState('guest');
  const [formData, setFormData]   = useState({ email: '', password: '', full_name: '', phone: '' });
  const [otpSent, setOtpSent]     = useState(false);
  const [otpCode, setOtpCode]     = useState('');
  const [formError, setFormError] = useState('');

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const switchTab = (tab) => { setActiveTab(tab); setFormError(''); };

  const handleGuestSubmit = async () => {
    setFormError('');
    try {
      await guestLogin(tableNumber);
      navigate('/menu');
    } catch (err) {
      setFormError(err.message || 'Guest login failed');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await login(formData.email, formData.password);
      navigate('/menu');
    } catch (err) {
      setFormError(err.message || 'Login failed');
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await signup(formData.full_name, formData.email, formData.password, formData.phone);
      navigate('/menu');
    } catch (err) {
      setFormError(err.message || 'Signup failed');
    }
  };

  const displayError = formError || error;

  return (
    <motion.div
      {...pageVariants}
      className="max-w-md mx-auto py-8 sm:py-14 space-y-6"
    >
      {/* ── HERO ─────────────────────────────── */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={springs.bouncy}
          className="w-16 h-16 rounded-2xl bg-gradient-to-b from-brand-400 to-brand-600 flex items-center justify-center shadow-glow mx-auto"
        >
          <Utensils className="w-8 h-8 text-white" aria-hidden="true" />
        </motion.div>
        <h1 className="text-h2 font-display font-extrabold text-ink-primary">Welcome to SmartServe</h1>
        <p className="text-caption text-ink-muted font-medium">
          {tableNumber ? `Dining at Table ${tableNumber}. ` : ''}Choose your access method.
        </p>
      </div>

      {/* ── TABS ─────────────────────────────── */}
      <div
        className="p-1.5 bg-surface-2 border border-subtle rounded-2xl flex gap-1"
        role="tablist"
        aria-label="Authentication options"
      >
        <Tab active={activeTab === 'guest'}  onClick={() => switchTab('guest')}>Guest</Tab>
        <Tab active={activeTab === 'login'}  onClick={() => switchTab('login')}>Sign In</Tab>
        <Tab active={activeTab === 'signup'} onClick={() => switchTab('signup')}>Sign Up</Tab>
      </div>

      {/* ── CARD ─────────────────────────────── */}
      <div className="bg-surface-1 border border-default rounded-3xl shadow-xl p-6 sm:p-8">
        {/* Error banner */}
        {displayError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3.5 bg-error-bg border border-error-border rounded-xl text-caption font-semibold text-error-text flex items-start gap-2"
            role="alert"
          >
            <span className="shrink-0 mt-0.5">⚠</span>
            {displayError}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* ── GUEST TAB ──────────────────────── */}
          {activeTab === 'guest' && (
            <motion.div key="guest" {...scaleIn} className="space-y-5 text-center">
              <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/30 border border-brand-200/60 dark:border-brand-800/40">
                <p className="text-caption font-medium text-brand-700 dark:text-brand-400 leading-relaxed">
                  No registration required — instantly order from Table {tableNumber || '?'} as a guest diner.
                </p>
              </div>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                icon={Sparkles}
                onClick={handleGuestSubmit}
                isLoading={isLoading}
              >
                Continue as Guest
              </Button>
              <p className="text-caption text-ink-muted">
                Already have an account?{' '}
                <button
                  onClick={() => switchTab('login')}
                  className="font-bold text-brand-500 hover:text-brand-600 transition-colors"
                >
                  Sign in
                </button>
              </p>
            </motion.div>
          )}

          {/* ── LOGIN TAB ──────────────────────── */}
          {activeTab === 'login' && (
            <motion.form key="login" {...scaleIn} onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
              <Input label="Email" type="email" name="email" required placeholder="you@example.com" value={formData.email} onChange={handleChange} icon={Mail} />
              <Input label="Password" type="password" name="password" required placeholder="••••••••" value={formData.password} onChange={handleChange} icon={Lock} />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => switchTab('forgot')}
                  className="text-label font-bold text-brand-500 hover:text-brand-600 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading} iconRight={ArrowRight}>
                Sign In
              </Button>

              <p className="text-center text-caption text-ink-muted">
                New here?{' '}
                <button
                  type="button"
                  onClick={() => switchTab('signup')}
                  className="font-bold text-brand-500 hover:text-brand-600 transition-colors"
                >
                  Create account
                </button>
              </p>
            </motion.form>
          )}

          {/* ── SIGNUP TAB ─────────────────────── */}
          {activeTab === 'signup' && (
            <motion.form key="signup" {...scaleIn} onSubmit={handleSignupSubmit} className="space-y-4" noValidate>
              <Input label="Full Name" type="text" name="full_name" required placeholder="Jane Doe" value={formData.full_name} onChange={handleChange} icon={User} />
              <Input label="Email" type="email" name="email" required placeholder="jane@example.com" value={formData.email} onChange={handleChange} icon={Mail} />
              <Input label="Password" type="password" name="password" required placeholder="Min. 8 characters" value={formData.password} onChange={handleChange} icon={Lock} hint="Use at least 8 characters with a number." />

              <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading} iconRight={ArrowRight}>
                Create Account
              </Button>

              <p className="text-center text-caption text-ink-muted">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => switchTab('login')}
                  className="font-bold text-brand-500 hover:text-brand-600 transition-colors"
                >
                  Sign in
                </button>
              </p>
            </motion.form>
          )}

          {/* ── FORGOT TAB ─────────────────────── */}
          {activeTab === 'forgot' && (
            <motion.div key="forgot" {...scaleIn} className="space-y-4">
              {!otpSent ? (
                <form onSubmit={(e) => { e.preventDefault(); setOtpSent(true); }} className="space-y-4" noValidate>
                  <p className="text-caption text-ink-muted">Enter your registered email to receive an OTP reset code.</p>
                  <Input label="Email / Phone" type="text" required placeholder="you@example.com" icon={Mail} />
                  <Button type="submit" variant="primary" size="lg" fullWidth>Send OTP Reset Code</Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-success-bg border border-success-border flex items-center gap-2 text-caption font-bold text-success-text">
                    <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                    OTP sent! (Demo code: 1234)
                  </div>
                  <Input label="4-Digit OTP Code" type="text" maxLength={4} placeholder="1234" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} icon={KeyRound} />
                  <Button variant="primary" size="lg" fullWidth onClick={() => { switchTab('login'); setOtpSent(false); }}>
                    Verify & Reset Password
                  </Button>
                </div>
              )}
              <button
                onClick={() => switchTab('login')}
                className="w-full text-caption font-bold text-ink-muted hover:text-ink-secondary transition-colors mt-1"
              >
                ← Back to Sign In
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
