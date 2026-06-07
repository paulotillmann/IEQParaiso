import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { 
  Plus, 
  Edit2, 
  ToggleLeft, 
  ToggleRight, 
  Search,
  ShieldAlert,
  Mail,
  User,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: 'administrador' | 'secretaria' | 'pastor';
  ativo: boolean;
  ultimo_acesso: string | null;
  criado_em: string;
}

export const Usuarios: React.FC = () => {
  const { userDetails, isAdmin } = useAuth();
  
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [usingMocks, setUsingMocks] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [editId, setEditId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [perfil, setPerfil] = useState<'administrador' | 'secretaria' | 'pastor'>('secretaria');
  const [password, setPassword] = useState(''); // Only for new users
  const [ativo, setAtivo] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      setUsuarios(data || []);
      setUsingMocks(false);
    } catch (err) {
      console.warn('Usando mock de usuários (tabela não criada no Supabase):', err);
      // Fallback mocks representing church administrative users
      setUsuarios([
        { id: '1', nome: 'Administrador Geral', email: 'admin@ieqparaiso.com', perfil: 'administrador', ativo: true, ultimo_acesso: new Date().toISOString(), criado_em: new Date().toISOString() },
        { id: '2', nome: 'Sarah Secretária Mendonça', email: 'secretaria@ieqparaiso.com', perfil: 'secretaria', ativo: true, ultimo_acesso: new Date(Date.now() - 3600000).toISOString(), criado_em: new Date().toISOString() },
        { id: '3', nome: 'Pr. Jefferson Alvarenga', email: 'pastor@ieqparaiso.com', perfil: 'pastor', ativo: true, ultimo_acesso: new Date(Date.now() - 7200000).toISOString(), criado_em: new Date().toISOString() },
        { id: '4', nome: 'Paula Auxiliar Secretaria', email: 'paula.sec@ieqparaiso.com', perfil: 'secretaria', ativo: false, ultimo_acesso: null, criado_em: new Date().toISOString() }
      ]);
      setUsingMocks(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // RLS/Permissão Guard: Apenas administradores podem ver esta tela
    if (!loading && !isAdmin) {
      window.location.pathname = '/dashboard'; // Safe redirect fallback
    }
  }, [isAdmin, loading]);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleOpenAdd = () => {
    setEditId(null);
    setNome('');
    setEmail('');
    setPerfil('secretaria');
    setPassword('');
    setAtivo(true);
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (usuario: Usuario) => {
    setEditId(usuario.id);
    setNome(usuario.nome);
    setEmail(usuario.email);
    setPerfil(usuario.perfil);
    setPassword('');
    setAtivo(usuario.ativo);
    setFormError(null);
    setShowModal(true);
  };

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleSaveUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validações
    if (!nome.trim()) {
      setFormError('O nome é obrigatório.');
      return;
    }
    if (!email.trim()) {
      setFormError('O e-mail é obrigatório.');
      return;
    }
    if (!validateEmail(email)) {
      setFormError('Formato de e-mail inválido.');
      return;
    }
    if (!perfil) {
      setFormError('O perfil é obrigatório.');
      return;
    }
    if (!editId && password.length < 8) {
      setFormError('Para novos usuários, a senha deve ter no mínimo 8 caracteres.');
      return;
    }

    // Verificar duplicidade de e-mail local
    const emailDuplicado = usuarios.some(u => 
      u.email.toLowerCase() === email.trim().toLowerCase() && u.id !== editId
    );
    if (emailDuplicado) {
      setFormError('Este e-mail já está sendo utilizado por outro usuário.');
      return;
    }

    setSubmitting(true);

    if (usingMocks) {
      setTimeout(() => {
        if (editId) {
          setUsuarios(prev => prev.map(u => 
            u.id === editId 
              ? { ...u, nome: nome.trim(), email: email.trim(), perfil, ativo }
              : u
          ));
        } else {
          const newU: Usuario = {
            id: String(usuarios.length + 1),
            nome: nome.trim(),
            email: email.trim(),
            perfil,
            ativo: true,
            ultimo_acesso: null,
            criado_em: new Date().toISOString()
          };
          setUsuarios(prev => [...prev, newU]);
        }
        setSubmitting(false);
        setShowModal(false);
      }, 500);
      return;
    }

    try {
      if (editId) {
        // Atualizar perfil do usuário na tabela public.usuarios
        const { error: updateErr } = await supabase
          .from('usuarios')
          .update({
            nome: nome.trim(),
            email: email.trim(),
            perfil,
            ativo
          })
          .eq('id', editId);

        if (updateErr) throw updateErr;
      } else {
        // Criar novo usuário administrativamente
        // Nota: A criação de usuários em Supabase Auth via Client exige chamadas ou convites por e-mail.
        // Se a Edge Function de administração não estiver disponível, podemos disparar o convite do Supabase
        // ou criar diretamente o perfil inserindo na tabela se a trigger auth.users disparar no signup.
        // Como o admin está criando, tentaremos cadastrar via supabase.auth.signUp que é a chamada cliente de cadastro.
        // (Nota: Isso fará o cadastro na base pública, e a trigger do banco cuidará do resto).
        
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              nome: nome.trim(),
              perfil,
              ativo: true
            }
          }
        });

        if (signUpErr) throw signUpErr;

        // Se deu tudo certo, mostramos uma notificação
        alert('Usuário pré-cadastrado! Um e-mail de confirmação foi enviado.');
      }

      await fetchUsuarios();
      setShowModal(false);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar usuário no Supabase.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (userObj: Usuario) => {
    // Evitar que o próprio admin logado se inative
    if (userDetails && userDetails.id === userObj.id) {
      alert('Você não pode desativar sua própria conta de administrador.');
      return;
    }

    if (usingMocks) {
      setUsuarios(prev => prev.map(u => 
        u.id === userObj.id ? { ...u, ativo: !u.ativo } : u
      ));
      return;
    }

    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ ativo: !userObj.ativo })
        .eq('id', userObj.id);

      if (error) throw error;
      await fetchUsuarios();
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status do usuário.');
    }
  };

  // Filter users based on search query
  const filteredUsuarios = usuarios.filter(u => 
    u.nome.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const getProfileName = (per: string) => {
    switch (per) {
      case 'administrador': return 'Administrador';
      case 'secretaria': return 'Secretária';
      case 'pastor': return 'Pastor';
      default: return per;
    }
  };

  const getProfileColor = (per: string) => {
    switch (per) {
      case 'administrador': return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20';
      case 'secretaria': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
      case 'pastor': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (isoString: string | null) => {
    if (!isoString) return <span className="italic text-xs text-muted-foreground/60">Nunca acessou</span>;
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAdmin) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center">
        <ShieldAlert size={48} className="text-red-500 animate-pulse" />
        <h2 className="text-xl font-bold">Acesso Negado</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Apenas administradores autorizados têm permissão para acessar a tela de gestão de usuários.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Gestão de Usuários</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Gerenciamento das contas com permissão de acesso ao painel administrativo.
          </p>
        </div>
        
        <button
          onClick={handleOpenAdd}
          className="flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-600/20 w-max"
        >
          <Plus size={18} className="mr-2" />
          Novo Usuário
        </button>
      </div>

      {/* Warnings & Search */}
      {usingMocks && (
        <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-800 dark:text-yellow-300 text-xs font-semibold">
          Exibindo usuários de demonstração (mock). Alterações serão salvas localmente na memória.
        </div>
      )}

      {/* Filters bar */}
      <div className="flex items-center rounded-2xl border bg-card px-4 py-3 shadow-sm max-w-md">
        <Search size={20} className="text-muted-foreground mr-3" />
        <input
          type="text"
          placeholder="Pesquisar por nome ou e-mail..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-transparent text-sm outline-none text-foreground placeholder-muted-foreground"
        />
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Carregando usuários...</div>
        ) : filteredUsuarios.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhum usuário encontrado.</div>
        ) : (
          <div className="overflow-x-auto min-w-full">
            <table className="min-w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 text-xs font-semibold text-muted-foreground uppercase border-b">
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">E-mail</th>
                  <th className="px-6 py-4">Perfil</th>
                  <th className="px-6 py-4">Último Acesso</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {filteredUsuarios.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 font-semibold text-foreground">
                      {usuario.nome}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {usuario.email}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase leading-none ${getProfileColor(usuario.perfil)}`}>
                        {getProfileName(usuario.perfil)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {formatDate(usuario.ultimo_acesso)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase leading-none ${
                        usuario.ativo 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}>
                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(usuario)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Editar Usuário"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(usuario)}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                          usuario.ativo 
                            ? 'border-red-500/20 hover:bg-red-500/10 text-red-500' 
                            : 'border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-500'
                        }`}
                        title={usuario.ativo ? 'Desativar Conta' : 'Reativar Conta'}
                        disabled={userDetails?.id === usuario.id}
                      >
                        {usuario.ativo ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Novo/Editar Usuário */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black"
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-card text-card-foreground rounded-2xl border p-6 w-full max-w-md shadow-xl relative z-10 space-y-4"
            >
              <div>
                <h3 className="text-lg font-bold">
                  {editId ? 'Editar Usuário' : 'Novo Usuário do Sistema'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {editId ? 'Altere as informações do usuário administrador ou secretaria.' : 'Insira as credenciais do novo colaborador.'}
                </p>
              </div>

              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-600 dark:text-red-400 font-medium">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSaveUsuario} className="space-y-4">
                {/* Nome */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center">
                    <User size={12} className="mr-1" /> Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nome do colaborador"
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    className="w-full rounded-xl border bg-black/5 dark:bg-black/25 py-3 px-4 text-sm text-foreground outline-none transition-all focus:border-indigo-500"
                    disabled={submitting}
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center">
                    <Mail size={12} className="mr-1" /> E-mail <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="email@ieqparaiso.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-xl border bg-black/5 dark:bg-black/25 py-3 px-4 text-sm text-foreground outline-none transition-all focus:border-indigo-500"
                    disabled={submitting || !!editId} // Cannot edit email after creation
                  />
                </div>

                {/* Password - Only for new users */}
                {!editId && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Senha Provisória <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full rounded-xl border bg-black/5 dark:bg-black/25 py-3 px-4 text-sm text-foreground outline-none transition-all focus:border-indigo-500"
                      disabled={submitting}
                    />
                  </div>
                )}

                {/* Profile Selector */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Perfil de Acesso <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={perfil}
                    onChange={e => setPerfil(e.target.value as any)}
                    className="w-full rounded-xl border bg-black/5 dark:bg-black/25 py-3 px-4 text-sm text-foreground outline-none transition-all focus:border-indigo-500"
                    disabled={submitting}
                  >
                    <option value="secretaria">Secretária (Cadastro e Consulta)</option>
                    <option value="pastor">Pastor (Apenas Leitura)</option>
                    <option value="administrador">Administrador (Acesso Total)</option>
                  </select>
                </div>

                {/* Edit active status in form */}
                {editId && userDetails?.id !== editId && (
                  <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/10">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">Status da Conta</span>
                      <span className="text-[10px] text-muted-foreground">Usuários inativos perdem todo o acesso ao painel.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAtivo(!ativo)}
                      className="text-indigo-600 hover:text-indigo-500 transition-colors"
                    >
                      {ativo ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                    </button>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border rounded-xl text-sm font-semibold hover:bg-muted transition-all"
                    disabled={submitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
                    disabled={submitting}
                  >
                    {submitting ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
export default Usuarios;
