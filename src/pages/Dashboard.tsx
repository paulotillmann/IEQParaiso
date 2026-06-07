import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from '../components/Router';
import { 
  Users, 
  UserCheck, 
  FileText, 
  Calendar, 
  Plus, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardStats {
  totalMembros: number;
  usuariosAtivos: number;
  cargosCadastrados: number;
}

interface RecenteMembro {
  id: string;
  nome_completo: string;
  criado_em: string;
  ativo: boolean;
  cargo: {
    nome: string;
  } | null;
}

export const Dashboard: React.FC = () => {
  const { userDetails } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats>({
    totalMembros: 0,
    usuariosAtivos: 0,
    cargosCadastrados: 0
  });
  const [recentes, setRecentes] = useState<RecenteMembro[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMocks, setUsingMocks] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch stats
        const { count: membrosCount, error: mErr } = await supabase
          .from('membros')
          .select('*', { count: 'exact', head: true });

        const { count: usuariosCount, error: uErr } = await supabase
          .from('usuarios')
          .select('*', { count: 'exact', head: true });

        const { count: cargosCount, error: cErr } = await supabase
          .from('cargos')
          .select('*', { count: 'exact', head: true });

        // If any query fails, we fall back to mock data
        if (mErr || uErr || cErr) {
          throw new Error('Database tables not initialized yet.');
        }

        // Fetch recent members with cargo info
        const { data: membrosData, error: recErr } = await supabase
          .from('membros')
          .select(`
            id,
            nome_completo,
            criado_em,
            ativo,
            cargo:cargos(nome)
          `)
          .order('criado_em', { ascending: false })
          .limit(5);

        if (recErr) throw recErr;

        setStats({
          totalMembros: membrosCount || 0,
          usuariosAtivos: usuariosCount || 0,
          cargosCadastrados: cargosCount || 0
        });
        
        // Map to expected shape (supabase returns an object or array for single joins)
        const mappedMembros = (membrosData || []).map((m: any) => ({
          id: m.id,
          nome_completo: m.nome_completo,
          criado_em: m.criado_em,
          ativo: m.ativo,
          cargo: Array.isArray(m.cargo) ? m.cargo[0] : m.cargo
        }));

        setRecentes(mappedMembros);
        setUsingMocks(false);
      } catch (err) {
        console.warn('Usando dados fictícios para fins de demonstração (tabelas não criadas ou erro de conexão):', err);
        // Fallback Mock Data
        setStats({
          totalMembros: 148,
          usuariosAtivos: 5,
          cargosCadastrados: 6
        });
        setRecentes([
          {
            id: '1',
            nome_completo: 'Carlos Eduardo Oliveira',
            criado_em: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
            ativo: true,
            cargo: { nome: 'Membro' }
          },
          {
            id: '2',
            nome_completo: 'Maria Eduarda Souza Silva',
            criado_em: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
            ativo: true,
            cargo: { nome: 'Líder' }
          },
          {
            id: '3',
            nome_completo: 'João Pedro Rezende',
            criado_em: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
            ativo: true,
            cargo: { nome: 'Diácono' }
          },
          {
            id: '4',
            nome_completo: 'Ana Beatriz Ferreira Santos',
            criado_em: new Date(Date.now() - 3600000 * 72).toISOString(), // 3 days ago
            ativo: true,
            cargo: { nome: 'Membro' }
          },
          {
            id: '5',
            nome_completo: 'Pr. Marcos Antônio da Silva',
            criado_em: new Date(Date.now() - 3600000 * 120).toISOString(), // 5 days ago
            ativo: true,
            cargo: { nome: 'Pastor' }
          }
        ]);
        setUsingMocks(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <div className="space-y-6">
      
      {/* Greeting Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {getGreeting()}, {userDetails?.nome.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Bem-vindo ao painel administrativo da IEQ Paraíso Araguari.
          </p>
        </div>
        
        {/* Quick action button for secretaria/admin */}
        {userDetails && ['administrador', 'secretaria'].includes(userDetails.perfil) && (
          <button
            onClick={() => navigate('/membros/novo')}
            className="flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-600/20 w-max"
          >
            <Plus size={18} className="mr-2" />
            Cadastrar Membro
          </button>
        )}
      </div>

      {/* Mock Data Warning Badge */}
      {usingMocks && (
        <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-800 dark:text-yellow-300 text-xs font-semibold flex items-center justify-between">
          <span>
            <strong>Aviso de Ambiente:</strong> Exibindo dados de demonstração (mock). Para conectar a base de dados oficial, execute as migrações fornecidas no painel do Supabase.
          </span>
          <a
            href="/db_schema.sql"
            className="underline hover:text-yellow-600 dark:hover:text-yellow-200 transition-colors shrink-0 ml-4"
            onClick={(e) => {
              e.preventDefault();
              alert('Copie o arquivo db_schema.sql e cole no editor SQL do seu Supabase.');
            }}
          >
            Ver DDL Schema
          </a>
        </div>
      )}

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Card: Total Membros */}
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border bg-card p-6 shadow-sm flex items-center gap-5 relative overflow-hidden"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Users size={24} />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Total de Membros</span>
            <span className="text-3xl font-extrabold mt-1 block">{loading ? '...' : stats.totalMembros}</span>
          </div>
          <div className="absolute right-2 -bottom-2 opacity-5 text-indigo-600 pointer-events-none">
            <Users size={90} />
          </div>
        </motion.div>

        {/* Card: Usuários Ativos */}
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border bg-card p-6 shadow-sm flex items-center gap-5 relative overflow-hidden"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <UserCheck size={24} />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Usuários Ativos</span>
            <span className="text-3xl font-extrabold mt-1 block">{loading ? '...' : stats.usuariosAtivos}</span>
          </div>
          <div className="absolute right-2 -bottom-2 opacity-5 text-blue-600 pointer-events-none">
            <UserCheck size={90} />
          </div>
        </motion.div>

        {/* Card: Cargos Cadastrados */}
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border bg-card p-6 shadow-sm flex items-center gap-5 relative overflow-hidden"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <FileText size={24} />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Cargos Cadastrados</span>
            <span className="text-3xl font-extrabold mt-1 block">{loading ? '...' : stats.cargosCadastrados}</span>
          </div>
          <div className="absolute right-2 -bottom-2 opacity-5 text-emerald-600 pointer-events-none">
            <FileText size={90} />
          </div>
        </motion.div>
      </div>

      {/* Recentes & Infos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recentes list */}
        <div className="lg:col-span-2 rounded-2xl border bg-card shadow-sm flex flex-col">
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="font-bold text-lg leading-none">Últimos Membros Cadastrados</h2>
              <p className="text-xs text-muted-foreground mt-1">Lista das adesões mais recentes na membresia.</p>
            </div>
            <button
              onClick={() => navigate('/membros')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              Ver todos <ArrowRight size={14} />
            </button>
          </div>

          <div className="flex-1 divide-y overflow-x-auto min-w-full">
            {loading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Carregando membros...</div>
            ) : recentes.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Nenhum membro cadastrado.</div>
            ) : (
              <table className="min-w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/30 text-xs font-semibold text-muted-foreground uppercase border-b">
                    <th className="px-6 py-3">Membro</th>
                    <th className="px-6 py-3">Cargo</th>
                    <th className="px-6 py-3">Data Cadastro</th>
                    <th className="px-6 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {recentes.map((membro) => (
                    <tr 
                      key={membro.id}
                      onClick={() => navigate(`/membros/${membro.id}`)}
                      className="hover:bg-muted/40 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 font-semibold text-foreground">
                        {membro.nome_completo}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {membro.cargo?.nome || 'Nenhum'}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {formatDate(membro.criado_em)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase leading-none ${
                          membro.ativo 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-red-500/10 text-red-600 dark:text-red-400'
                        }`}>
                          {membro.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Informações da Igreja e Estatísticas Extras */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col space-y-5">
          <div>
            <h2 className="font-bold text-lg leading-none">Dados Ministeriais</h2>
            <p className="text-xs text-muted-foreground mt-1">Informações básicas do templo local.</p>
          </div>
          
          <div className="divide-y text-sm font-medium">
            <div className="flex py-3 justify-between">
              <span className="text-muted-foreground">Igreja local:</span>
              <span className="text-foreground">IEQ Paraíso</span>
            </div>
            <div className="flex py-3 justify-between">
              <span className="text-muted-foreground">Cidade / UF:</span>
              <span className="text-foreground">Araguari / MG</span>
            </div>
            <div className="flex py-3 justify-between">
              <span className="text-muted-foreground">Região Eclesiástica:</span>
              <span className="text-foreground">Triângulo Mineiro</span>
            </div>
            <div className="flex py-3 justify-between">
              <span className="text-muted-foreground">Superintendência:</span>
              <span className="text-foreground">Célula Quadrangular</span>
            </div>
          </div>

          <div className="pt-4 border-t flex flex-col space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Calendar size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-semibold leading-none uppercase">Data Atual</span>
                <span className="text-sm font-bold text-foreground mt-1">
                  {new Date().toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
export default Dashboard;
