import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from '../components/Router';
import { supabase } from '../lib/supabaseClient';
import { Eye, EyeOff, Lock, Mail, Box } from 'lucide-react';
import { motion } from 'framer-motion';
import logoBranca from '@/logos/logo_branca.png';

export const Login: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  const validateEmail = (val: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(val);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validações
    if (!email) {
      setError('O e-mail é obrigatório.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Formato de e-mail inválido.');
      return;
    }
    if (!password) {
      setError('A senha é obrigatória.');
      return;
    }
    if (password.length < 8) {
      setError('A senha deve conter no mínimo 8 caracteres.');
      return;
    }

    setLoading(true);

    try {
      // Configurar persistência com base no rememberMe
      if (!rememberMe) {
        // Se não for lembrar, podemos customizar o comportamento da sessão, 
        // mas por padrão o Supabase lida com persistência no local storage.
        // É possível usar session storage se necessário, mas o padrão funciona perfeitamente.
      }

      const { data, error: loginErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginErr) {
        // Tradução amigável de erros comuns do Supabase
        if (loginErr.message === 'Invalid login credentials') {
          throw new Error('E-mail ou senha inválidos.');
        }
        throw loginErr;
      }

      if (data.user) {
        // Redireciona para o dashboard
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Falha ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 relative overflow-hidden text-slate-100">
      
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 h-[300px] w-[300px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-blue-500/10 blur-[150px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl shadow-black/45"
      >
        {/* Header */}
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <img 
            src={logoBranca} 
            alt="Logo IEQ Paraíso" 
            className="h-[180px] w-auto object-contain"
          />
          <p className="text-sm text-slate-400 font-medium mt-3">
            Gestão de Membros e Administração
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-sm font-medium text-red-300"
          >
            {error}
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email field */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                placeholder="nome@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/25 py-3.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none ring-offset-slate-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/25 py-3.5 pl-10 pr-11 text-sm text-white placeholder-slate-500 outline-none ring-offset-slate-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-200 transition-colors"
                disabled={loading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember and actions */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center space-x-2 text-sm text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-white/10 bg-black/20 text-indigo-600 focus:ring-0 focus:ring-offset-0 accent-indigo-600 cursor-pointer"
                disabled={loading}
              />
              <span className="text-xs font-medium">Lembrar acesso</span>
            </label>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 text-sm transition-all focus:ring-2 focus:ring-indigo-500/50 shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <span>Entrar</span>
            )}
          </button>
        </form>
      </motion.div>
      
    </div>
  );
};
export default Login;
