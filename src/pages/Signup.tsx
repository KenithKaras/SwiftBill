import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Receipt, Mail, Lock, ArrowRight, User as UserIcon } from 'lucide-react';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (authError) throw authError;
      
      if (data.user && !data.session) {
        setSuccess(true);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-10 text-center space-y-6">
          <div className="bg-emerald-100 text-emerald-600 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
            <Mail size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Confirm your email</h2>
          <p className="text-slate-500">We've sent a confirmation link to <span className="font-bold text-slate-900 font-mono">{email}</span>. Please check your inbox and click the link to activate your account.</p>
          <Link to="/login" className="block w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-100">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-10 pb-0 flex flex-col items-center">
          <div className="bg-blue-600 text-white p-4 rounded-2xl mb-8 shadow-lg shadow-blue-200">
            <Receipt size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight text-center">Create Account</h1>
          <p className="text-slate-500 mt-3 font-medium text-center">Start your premium billing journey today</p>
        </div>

        <form onSubmit={handleSignup} className="p-10 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 font-medium">
              {error}
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                required
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all font-medium"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                required
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all font-medium"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] ml-1">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                required
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all font-medium"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3 group disabled:opacity-70 mt-4 active:scale-[0.98]"
          >
            {loading ? 'Creating Account...' : 'Get Started Now'}
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="text-center text-sm text-slate-500 font-medium pt-2">
            Already have an account? {' '}
            <Link to="/login" className="text-blue-600 font-bold hover:underline">Log in here</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
