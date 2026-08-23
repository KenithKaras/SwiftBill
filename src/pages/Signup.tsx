import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, Lock, ArrowRight, ShieldCheck, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import FormInput from '../components/ui/FormInput';
import PasswordStrength, { isPasswordStrong } from '../components/ui/PasswordStrength';
import { logger } from '../lib/logger';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPasswordStrong(password)) {
      return setError('Please satisfy all password strength requirements.');
    }

    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setLoading(true);
    setSuccess(false);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (authError) {
        logger.error('Signup auth query error', authError);
        if (authError.message.toLowerCase().includes('user already registered')) {
          throw new Error('This email is already associated with an account. Please sign in.');
        } else if (authError.message.toLowerCase().includes('rate limit')) {
          throw new Error('Verification email rate limit exceeded. (Local Dev Tip: Turn off "Confirm email" in your Supabase Auth -> Providers -> Email dashboard to sign up instantly without emails).');
        } else {
          throw new Error(`Signup failed: ${authError.message}`);
        }
      }

      if (data.user && !data.session) {
        setSuccess(true);
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      logger.error('Signup catch error', err);
      setError(err.message || 'An error occurred during account creation.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-sm w-full bg-surface rounded border border-hairline shadow-sm shadow-black/3 p-8 sm:p-10 text-center space-y-6"
        >
          <div className="bg-accent-soft text-accent border border-hairline w-14 h-14 rounded flex items-center justify-center mx-auto">
            <Mail size={26} />
          </div>
          <div className="space-y-2">
            <h2 className="font-display text-2xl font-semibold text-ink tracking-[-0.02em]">Verify your email</h2>
            <p className="text-[11px] text-grey font-semibold uppercase tracking-[0.16em]">Confirmation link sent</p>
          </div>
          <p className="text-ink-soft text-sm leading-relaxed">
            We sent a verification link to <span className="font-medium text-ink font-mono text-xs bg-paper px-2 py-0.5 rounded-sm border border-hairline">{email}</span>. Click it to finish setting up your account.
          </p>
          <Link
            to="/login"
            className="block w-full bg-ink text-paper py-3.5 rounded font-medium text-sm hover:bg-accent transition-colors cursor-pointer text-center"
          >
            Return to sign in
          </Link>
        </motion.div>
      </div>
    );
  }

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
            <span className="text-[11px] font-semibold text-paper/50 uppercase tracking-[0.16em]">Get started</span>
            <h1 className="font-display text-4xl xl:text-5xl font-semibold tracking-[-0.02em] leading-[1.08]">
              Scale your invoicing<br />
              <span className="text-paper/55">without the overhead.</span>
            </h1>
            <p className="text-paper/60 text-sm leading-relaxed max-w-md">
              Create an account in seconds and set up branded letterheads, invoice defaults, and custom colors.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-paper/5 border border-paper/10 p-2.5 rounded-sm text-paper mt-0.5">
                <FileText size={18} />
              </div>
              <div>
                <h4 className="font-medium text-sm text-paper">Professional templates</h4>
                <p className="text-xs text-paper/55 mt-1 leading-relaxed">Modern, classic, or minimal PDF templates, branded with your logo and color.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-paper/5 border border-paper/10 p-2.5 rounded-sm text-paper mt-0.5">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h4 className="font-medium text-sm text-paper">Private by default</h4>
                <p className="text-xs text-paper/55 mt-1 leading-relaxed">Row-Level Security ensures only you can read or write your documents.</p>
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
            <h1 className="font-display text-3xl font-semibold text-ink tracking-[-0.02em]">Create account</h1>
            <p className="text-grey mt-2 text-sm">Get started with billing management.</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
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
              disabled={loading}
              placeholder="you@example.com"
              value={email}
              onChange={setEmail}
              icon={<Mail size={16} />}
            />

            <FormInput
              label="Password"
              type="password"
              required
              disabled={loading}
              placeholder="••••••••"
              value={password}
              onChange={setPassword}
              icon={<Lock size={16} />}
            />

            <PasswordStrength password={password} />

            <FormInput
              label="Confirm Password"
              type="password"
              required
              disabled={loading}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={setConfirmPassword}
              icon={<Lock size={16} />}
            />

            <motion.button
              type="submit"
              disabled={loading || !isPasswordStrong(password)}
              whileTap={{ scale: (loading || !isPasswordStrong(password)) ? 1 : 0.99 }}
              className="w-full bg-ink hover:bg-accent text-paper py-3.5 rounded font-medium text-sm transition-colors flex items-center justify-center gap-2 group disabled:opacity-60 disabled:hover:bg-ink mt-2 cursor-pointer"
            >
              {loading ? 'Creating account…' : 'Create account'}
              {!loading && <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />}
            </motion.button>

            <p className="text-center text-sm text-grey pt-4">
              Already have an account?{' '}
              <Link to="/login" className="text-accent font-medium hover:underline">Sign in</Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
