import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, Lock, ArrowRight, ShieldCheck, LineChart } from 'lucide-react';
import { motion } from 'motion/react';
import FormInput from '../components/ui/FormInput';
import { logger } from '../lib/logger';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const navigate = useNavigate();

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Brute-force protection: Check cooldown on mount and tick countdown
  useEffect(() => {
    const checkCooldown = () => {
      const expiry = localStorage.getItem('login_cooldown_expiry');
      if (expiry) {
        const remaining = Math.ceil((Number(expiry) - Date.now()) / 1000);
        if (remaining > 0) {
          setCooldownRemaining(remaining);
          return remaining;
        } else {
          localStorage.removeItem('login_cooldown_expiry');
          localStorage.removeItem('login_attempts');
          setCooldownRemaining(0);
        }
      }
      return 0;
    };

    const remaining = checkCooldown();
    if (remaining > 0) {
      const interval = setInterval(() => {
        const rem = checkCooldown();
        if (rem <= 0) {
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [cooldownRemaining]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldownRemaining > 0) {
      setError(`Too many failed attempts. Cooldown active. Please wait ${cooldownRemaining}s.`);
      return;
    }

    console.log('[DEBUG] Login form submitted for email:', email.trim());
    setLoading(true);
    setError('');

    try {
      console.log('[DEBUG] Triggering supabase.auth.signInWithPassword...');
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      console.log('[DEBUG] signInWithPassword returned. authError:', authError);

      if (authError) {
        // Track brute-force attempts
        const attempts = Number(localStorage.getItem('login_attempts') || '0') + 1;
        localStorage.setItem('login_attempts', String(attempts));

        if (attempts >= 5) {
          const cooldownExpiry = Date.now() + 60000; // 60s cooldown
          localStorage.setItem('login_cooldown_expiry', String(cooldownExpiry));
          setCooldownRemaining(60);
          throw new Error('Too many failed login attempts. Please wait 60 seconds before trying again.');
        }

        if (authError.message.toLowerCase().includes('email not confirmed')) {
          throw new Error('Your email address is not confirmed. (Local Dev Tip: Disable "Confirm email" in Supabase Auth -> Providers dashboard, or run the manual SQL confirmation query for this user).');
        } else if (authError.message.toLowerCase().includes('invalid login credentials')) {
          throw new Error(`Invalid email or password. (Attempt ${attempts} of 5)`);
        } else {
          logger.error('Authentication process failed', authError);
          throw new Error(`Failed to sign in: ${authError.message}`);
        }
      }

      // Success: Reset brute-force variables
      console.log('[DEBUG] Sign in successful. Resetting brute force state and calling navigate(/dashboard)...');
      localStorage.removeItem('login_attempts');
      localStorage.removeItem('login_cooldown_expiry');
      navigate('/dashboard');
      console.log('[DEBUG] navigate(/dashboard) invoked.');
    } catch (err: any) {
      console.error('[DEBUG] Login form caught exception:', err);
      logger.error('Login form error caught', err);
      setError(err.message || 'An unexpected error occurred during login. Please try again.');
    } finally {
      console.log('[DEBUG] Login finally block running. Setting loading to false.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-paper">
      {/* Left column: brand panel (ink) */}
      <div className="hidden lg:flex lg:w-1/2 bg-ink text-paper relative overflow-hidden flex-col justify-between p-16">
        <div className="flex items-center gap-2.5 relative z-10">
          <div className="bg-paper text-ink w-9 h-9 rounded-sm flex items-center justify-center font-display font-semibold">SB</div>
          <span className="font-display font-semibold text-xl tracking-tight">SwiftBill</span>
        </div>

        <div className="relative z-10 max-w-lg my-auto space-y-12">
          <div className="space-y-5">
            <span className="text-[11px] font-semibold text-paper/50 uppercase tracking-[0.16em]">Welcome back</span>
            <h1 className="font-display text-4xl xl:text-5xl font-semibold tracking-[-0.02em] leading-[1.08]">
              Elegance in invoicing,<br />
              <span className="text-paper/55">precision in analytics.</span>
            </h1>
            <p className="text-paper/60 text-sm leading-relaxed max-w-md">
              Create branded invoice PDFs, track what you're owed, and read your business health in real time.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-paper/5 border border-paper/10 p-2.5 rounded-sm text-paper mt-0.5">
                <LineChart size={18} />
              </div>
              <div>
                <h4 className="font-medium text-sm text-paper">Live financial metrics</h4>
                <p className="text-xs text-paper/55 mt-1 leading-relaxed">Track outstanding balances, payment rate, and revenue in one dashboard.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-paper/5 border border-paper/10 p-2.5 rounded-sm text-paper mt-0.5">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h4 className="font-medium text-sm text-paper">Private by default</h4>
                <p className="text-xs text-paper/55 mt-1 leading-relaxed">Postgres Row-Level Security scopes every record to your account.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-paper/40 flex justify-between">
          <span>&copy; 2026 SwiftBill</span>
          <span className="hover:text-paper/70 transition-colors cursor-pointer">Security &amp; Privacy</span>
        </div>
      </div>

      {/* Right column: form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 md:p-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-sm w-full"
        >
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="bg-ink text-paper w-9 h-9 rounded-sm flex items-center justify-center font-display font-semibold">SB</div>
            <span className="font-display font-semibold text-xl tracking-tight text-ink">SwiftBill</span>
          </div>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-semibold text-ink tracking-[-0.02em]">Welcome back</h1>
            <p className="text-grey mt-2 text-sm">Sign in to manage your invoices.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 text-negative p-4 rounded border border-hairline text-xs font-medium leading-relaxed"
              >
                {error}
              </motion.div>
            )}

            <FormInput
              label="Email Address"
              type="email"
              required
              disabled={loading || cooldownRemaining > 0}
              placeholder="you@example.com"
              value={email}
              onChange={setEmail}
              icon={<Mail size={16} />}
            />

            <FormInput
              label="Password"
              type="password"
              required
              disabled={loading || cooldownRemaining > 0}
              placeholder="••••••••"
              value={password}
              onChange={setPassword}
              icon={<Lock size={16} />}
            />

            <motion.button
              type="submit"
              disabled={loading || cooldownRemaining > 0}
              whileTap={{ scale: cooldownRemaining > 0 ? 1 : 0.99 }}
              className="w-full bg-ink hover:bg-accent text-paper py-3.5 rounded font-medium text-sm transition-colors flex items-center justify-center gap-2 group disabled:opacity-60 disabled:hover:bg-ink mt-2 cursor-pointer"
            >
              {cooldownRemaining > 0
                ? `Locked (${cooldownRemaining}s)`
                : loading ? 'Signing in…' : 'Sign in'}
              {cooldownRemaining <= 0 && !loading && <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />}
            </motion.button>

            <p className="text-center text-sm text-grey pt-4">
              Don't have an account?{' '}
              <Link to="/signup" className="text-accent font-medium hover:underline">Create one</Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
