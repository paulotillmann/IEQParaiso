import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from '../components/Router';
import { supabase } from '../lib/supabaseClient';
import { Eye, EyeOff, Lock, Mail, User, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logoPreta from '@/logos/logo_preta.png';

export const Login: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Mode: 'login' | 'register' | 'forgot' | 'recovery'
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'recovery'>('login');

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check URL hash for recovery parameters
  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash.includes('type=recovery') || hash.includes('recovery')) {
        setMode('recovery');
      }
    };
    checkHash();

    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  // Redirect if already logged in (but not in recovery flow)
  useEffect(() => {
    const isRecovery = window.location.hash.includes('type=recovery');
    if (!authLoading && user && !isRecovery && mode !== 'recovery') {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate, mode]);

  const validateEmail = (val: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(val);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

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
      const { data, error: loginErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginErr) {
        if (loginErr.message === 'Invalid login credentials') {
          throw new Error('E-mail ou senha inválidos.');
        }
        throw loginErr;
      }

      if (data.user) {
        try {
          await supabase.rpc('registrar_login');
        } catch (rpcErr) {
          console.warn('Falha ao registrar login (a migração de banco pode não ter sido aplicada):', rpcErr);
        }
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Falha ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!nome.trim()) {
      setError('O nome é obrigatório.');
      return;
    }
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
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome: nome.trim(),
            perfil: 'secretaria', // Default profile triggers set_perfil rules
            ativo: false,
          },
        },
      });

      if (signUpErr) {
        throw signUpErr;
      }

      setSuccessMessage(
        'Cadastro solicitado com sucesso! Se a confirmação de e-mail estiver ativa, verifique sua caixa de entrada para ativar a conta antes de entrar.'
      );
      
      // Reset fields
      setNome('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');

      // Auto redirect to login mode after some seconds
      setTimeout(() => {
        setMode('login');
        setSuccessMessage(null);
      }, 7000);
    } catch (err: any) {
      if (err.message?.includes('already registered') || err.message?.includes('User already exists')) {
        setError('Este e-mail já está cadastrado.');
      } else {
        setError(err.message || 'Falha ao cadastrar usuário.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email) {
      setError('O e-mail é obrigatório.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Formato de e-mail inválido.');
      return;
    }

    setLoading(true);

    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (resetErr) {
        throw resetErr;
      }

      setSuccessMessage(
        'Se este e-mail estiver registrado em nosso sistema, você receberá um link para redefinir sua senha em instantes.'
      );
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar e-mail de recuperação.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!password) {
      setError('A nova senha é obrigatória.');
      return;
    }
    if (password.length < 8) {
      setError('A senha deve conter no mínimo 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateErr } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateErr) {
        throw updateErr;
      }

      setSuccessMessage('Senha atualizada com sucesso! Redirecionando...');
      setPassword('');
      setConfirmPassword('');

      // Clean hash parameters from URL
      window.history.replaceState(null, '', window.location.origin + window.location.pathname);

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar a senha.');
    } finally {
      setLoading(false);
    }
  };

  // Navigate helper to clear messages and errors when switching modes
  const changeMode = (newMode: 'login' | 'register' | 'forgot' | 'recovery') => {
    setError(null);
    setSuccessMessage(null);
    setPassword('');
    setConfirmPassword('');
    setMode(newMode);
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 bg-gradient-to-tr from-slate-50 via-[#f5faff] to-indigo-50/50 relative overflow-hidden text-slate-900">
      
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 h-[300px] w-[300px] rounded-full bg-indigo-300/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-blue-300/15 blur-[150px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white/80 backdrop-blur-xl p-8 shadow-2xl shadow-slate-200/50"
      >
        {/* Header */}
        <div className="flex flex-col items-center justify-center text-center mb-6">
          <img 
            src={logoPreta} 
            alt="Logo IEQ Paraíso" 
            className="w-[270px] h-auto object-contain"
          />
          <p className="text-sm text-slate-500 font-medium mt-3">
            {mode === 'login' && 'Gestão de Membros e Administração'}
            {mode === 'register' && 'Cadastrar Nova Conta'}
            {mode === 'forgot' && 'Recuperação de Senha'}
            {mode === 'recovery' && 'Redefinir Sua Senha'}
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm font-medium text-red-700"
          >
            {error}
          </motion.div>
        )}

        {/* Success Notification */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-sm font-medium text-emerald-800 flex items-start space-x-2"
          >
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {mode === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <form onSubmit={handleLogin} className="space-y-5">
                {/* Email field */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="nome@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none ring-offset-white transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Password field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Senha
                    </label>
                    <button
                      type="button"
                      onClick={() => changeMode('forgot')}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
                      disabled={loading}
                    >
                      Esqueceu sua senha?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-10 pr-11 text-sm text-slate-900 placeholder-slate-400 outline-none ring-offset-white transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Remember access */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center space-x-2 text-sm text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 bg-white text-indigo-600 focus:ring-0 focus:ring-offset-0 accent-indigo-600 cursor-pointer"
                      disabled={loading}
                    />
                    <span className="text-xs font-medium">Lembrar acesso</span>
                  </label>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 text-sm transition-all focus:ring-2 focus:ring-indigo-500/50 shadow-lg shadow-indigo-600/10 flex items-center justify-center space-x-2 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <span>Entrar</span>
                  )}
                </button>

                {/* Switch to Register */}
                <div className="text-center pt-2">
                  <span className="text-xs text-slate-500 font-medium">Ainda não tem conta? </span>
                  <button
                    type="button"
                    onClick={() => changeMode('register')}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
                    disabled={loading}
                  >
                    Cadastre-se
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {mode === 'register' && (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <form onSubmit={handleRegister} className="space-y-4">
                {/* Nome field */}
                <div className="space-y-2.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Seu nome completo"
                      value={nome}
                      onChange={e => setNome(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none ring-offset-white transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Email field */}
                <div className="space-y-2.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="nome@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none ring-offset-white transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Password field */}
                <div className="space-y-2.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo de 8 caracteres"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-10 pr-11 text-sm text-slate-900 placeholder-slate-400 outline-none ring-offset-white transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password field */}
                <div className="space-y-2.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Repita sua senha"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-10 pr-11 text-sm text-slate-900 placeholder-slate-400 outline-none ring-offset-white transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                      disabled={loading}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 text-sm transition-all focus:ring-2 focus:ring-indigo-500/50 shadow-lg shadow-indigo-600/10 flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <span>Criar Conta</span>
                  )}
                </button>

                {/* Back to Login */}
                <button
                  type="button"
                  onClick={() => changeMode('login')}
                  className="w-full py-2 flex items-center justify-center space-x-1.5 text-xs text-slate-500 hover:text-slate-700 font-semibold transition-colors mt-1"
                  disabled={loading}
                >
                  <ArrowLeft size={14} />
                  <span>Voltar para o Login</span>
                </button>
              </form>
            </motion.div>
          )}

          {mode === 'forgot' && (
            <motion.div
              key="forgot"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <p className="text-xs text-slate-500 text-center leading-relaxed">
                  Digite o seu e-mail cadastrado. Nós lhe enviaremos um link seguro para a redefinição de sua senha.
                </p>

                {/* Email field */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="nome@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none ring-offset-white transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 text-sm transition-all focus:ring-2 focus:ring-indigo-500/50 shadow-lg shadow-indigo-600/10 flex items-center justify-center space-x-2 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <span>Enviar Link de Recuperação</span>
                  )}
                </button>

                {/* Back to Login */}
                <button
                  type="button"
                  onClick={() => changeMode('login')}
                  className="w-full py-2 flex items-center justify-center space-x-1.5 text-xs text-slate-500 hover:text-slate-700 font-semibold transition-colors"
                  disabled={loading}
                >
                  <ArrowLeft size={14} />
                  <span>Voltar para o Login</span>
                </button>
              </form>
            </motion.div>
          )}

          {mode === 'recovery' && (
            <motion.div
              key="recovery"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-xs text-slate-500 text-center leading-relaxed mb-1">
                  Insira sua nova senha abaixo para restaurar o acesso à sua conta.
                </p>

                {/* Password field */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo de 8 caracteres"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-10 pr-11 text-sm text-slate-900 placeholder-slate-400 outline-none ring-offset-white transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password field */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Repita a nova senha"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-10 pr-11 text-sm text-slate-900 placeholder-slate-400 outline-none ring-offset-white transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                      disabled={loading}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 text-sm transition-all focus:ring-2 focus:ring-indigo-500/50 shadow-lg shadow-indigo-600/10 flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <span>Salvar Nova Senha</span>
                  )}
                </button>

                {/* Return button if something went wrong */}
                <button
                  type="button"
                  onClick={() => {
                    // Clean hash and return to login
                    window.history.replaceState(null, '', window.location.origin + window.location.pathname);
                    changeMode('login');
                  }}
                  className="w-full py-2 flex items-center justify-center space-x-1.5 text-xs text-slate-500 hover:text-slate-700 font-semibold transition-colors mt-1"
                  disabled={loading}
                >
                  <ArrowLeft size={14} />
                  <span>Cancelar e Ir ao Login</span>
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
    </div>
  );
};

export default Login;
