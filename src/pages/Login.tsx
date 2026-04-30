import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Receipt, Mail, Lock, ArrowRight } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        if (authError.message.toLowerCase().includes('email not confirmed')) {
          setError('Please confirm your email address before logging in. Check your inbox for the activation link.');
          return;
        }
        throw authError;
      }
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-10 pb-0 flex flex-col items-center">
          <div className="bg-blue-600 text-white p-4 rounded-2xl mb-8 shadow-lg shadow-blue-200">
            <Receipt size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight text-center">Welcome back</h1>
          <p className="text-slate-500 mt-3 font-medium text-center">Manage your business invoices with elegance.</p>
        </div>

        <form onSubmit={handleLogin} className="p-10 space-y-6">
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3 group disabled:opacity-70 mt-4 active:scale-[0.98]"
          >
            {loading ? 'Logging in...' : 'Sign In to Dashboard'}
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="text-center text-sm text-slate-500 font-medium pt-2">
            Don't have an account? {' '}
            <Link to="/signup" className="text-blue-600 font-bold hover:underline">Create Account</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
