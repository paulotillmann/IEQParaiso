import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from '../components/Router';
import { 
  Users, 
  UserCheck, 
  Calendar, 
  Plus, 
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '../contexts/ToastContext';

interface DashboardStats {
  totalMembros: number;
  visitantesAtivos: number;
}

interface RecenteVisitante {
  id: string;
  nome_completo: string;
  whatsapp: string | null;
  telefone: string | null;
  cidade: string;
  uf: string;
  criado_em: string;
  ativo: boolean;
  quem_convidou: string | null;
}

export const Dashboard: React.FC = () => {
  const { userDetails } = useAuth();
  const navigate = useNavigate();
  const { info } = useToast();

  const [stats, setStats] = useState<DashboardStats>({
    totalMembros: 0,
    visitantesAtivos: 0
  });
  const [recentes, setRecentes] = useState<RecenteVisitante[]>([]);
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

        const { count: visitantesCount, error: vErr } = await supabase
          .from('visitantes')
          .select('*', { count: 'exact', head: true })
          .eq('ativo', true);

        // If any query fails, we fall back to mock data
        if (mErr || vErr) {
          throw new Error('Database tables not initialized yet.');
        }

        // Fetch recent visitors
        const { data: visitantesData, error: recErr } = await supabase
          .from('visitantes')
          .select(`
            id,
            nome_completo,
            whatsapp,
            telefone,
            cidade,
            uf,
            quem_convidou,
            criado_em,
            ativo
          `)
          .order('criado_em', { ascending: false })
          .limit(5);

        if (recErr) throw recErr;

        setStats({
          totalMembros: membrosCount || 0,
          visitantesAtivos: visitantesCount || 0
        });
        
        setRecentes(visitantesData || []);
        setUsingMocks(false);
      } catch (err) {
        console.warn('Usando dados fictícios para fins de demonstração:', err);
        // Fallback Mock Data
        setStats({
          totalMembros: 148,
          visitantesAtivos: 27
        });
        setRecentes([
          {
            id: '1',
            nome_completo: 'Juliana Pires Martins',
            whatsapp: '(34) 99311-2233',
            telefone: '(34) 99311-2233',
            cidade: 'Araguari',
            uf: 'MG',
            quem_convidou: 'Luciana Diaconisa',
            criado_em: new Date(Date.now() - 3600000 * 2).toISOString(),
            ativo: true
          },
          {
            id: '2',
            nome_completo: 'Roberto Albuquerque Neto',
            whatsapp: null,
            telefone: '(34) 98822-4411',
            cidade: 'Araguari',
            uf: 'MG',
            quem_convidou: 'Carlos Membro',
            criado_em: new Date(Date.now() - 3600000 * 24).toISOString(),
            ativo: true
          },
          {
            id: '3',
            nome_completo: 'Fernanda Lima Silva',
            whatsapp: '(34) 99123-4567',
            telefone: '(34) 99123-4567',
            cidade: 'Araguari',
            uf: 'MG',
            quem_convidou: 'Espontâneo',
            criado_em: new Date(Date.now() - 3600000 * 48).toISOString(),
            ativo: true
          },
          {
            id: '4',
            nome_completo: 'Renato Nogueira',
            whatsapp: '(34) 99765-8822',
            telefone: '(34) 99765-8822',
            cidade: 'Uberlândia',
            uf: 'MG',
            quem_convidou: 'Pr. Marcos da Silva',
            criado_em: new Date(Date.now() - 3600000 * 72).toISOString(),
            ativo: true
          },
          {
            id: '5',
            nome_completo: 'Patrícia Garcia Bueno',
            whatsapp: '(34) 99988-7766',
            telefone: '(34) 99988-7766',
            cidade: 'Araguari',
            uf: 'MG',
            quem_convidou: 'Lucia Diaconisa',
            criado_em: new Date(Date.now() - 3600000 * 120).toISOString(),
            ativo: false
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
            onClick={() => navigate('/visitantes/novo')}
            className="flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-600/20 w-max"
          >
            <Plus size={18} className="mr-2" />
            Cadastrar Visitantes
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
              info('Copie o arquivo db_schema.sql e cole no editor SQL do seu Supabase.');
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

        {/* Card: Visitantes Ativos */}
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border bg-card p-6 shadow-sm flex items-center gap-5 relative overflow-hidden cursor-pointer"
          onClick={() => navigate('/visitantes')}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <UserCheck size={24} />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Visitantes Ativos</span>
            <span className="text-3xl font-extrabold mt-1 block">{loading ? '...' : stats.visitantesAtivos}</span>
          </div>
          <div className="absolute right-2 -bottom-2 opacity-5 text-blue-600 pointer-events-none">
            <UserCheck size={90} />
          </div>
        </motion.div>

        {/* Card: Dados Ministeriais */}
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col justify-between relative overflow-hidden"
        >
          <div className="flex items-center justify-between pb-1.5 border-b">
            <span className="text-xs text-muted-foreground font-extrabold uppercase tracking-wider">Dados Ministeriais</span>
            <Calendar size={16} className="text-indigo-500" />
          </div>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2.5 text-xs font-semibold">
            <div>
              <span className="text-muted-foreground block text-[9px] uppercase tracking-wide">Igreja local</span>
              <span className="text-foreground truncate block">IEQ Paraíso</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[9px] uppercase tracking-wide">Cidade / UF</span>
              <span className="text-foreground truncate block">Araguari / MG</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[9px] uppercase tracking-wide">Região</span>
              <span className="text-foreground truncate block">Triângulo Mineiro</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[9px] uppercase tracking-wide">Superintendência</span>
              <span className="text-foreground truncate block">Célula Quadrangular</span>
            </div>
          </div>
          
          <div className="border-t pt-1.5 mt-2 flex items-center justify-between text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
            <span>Data Atual</span>
            <span>
              {new Date().toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Recentes */}
      <div className="rounded-2xl border bg-card shadow-sm flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="font-bold text-lg leading-none">Últimos Visitantes Cadastrados</h2>
            <p className="text-xs text-muted-foreground mt-1">Lista de acolhimentos mais recentes no templo.</p>
          </div>
          <button
            onClick={() => navigate('/visitantes')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            Ver todos <ArrowRight size={14} />
          </button>
        </div>

        <div className="flex-1 divide-y overflow-x-auto min-w-full">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Carregando visitantes...</div>
          ) : recentes.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Nenhum visitante cadastrado.</div>
          ) : (
            <table className="min-w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 text-xs font-semibold text-muted-foreground uppercase border-b">
                  <th className="px-6 py-3">Visitante</th>
                  <th className="px-6 py-3">Quem Convidou</th>
                  <th className="px-6 py-3">Contato</th>
                  <th className="px-6 py-3">Data Cadastro</th>
                  <th className="px-6 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {recentes.map((visitante) => (
                  <tr 
                    key={visitante.id}
                    onClick={() => navigate('/visitantes')}
                    className="hover:bg-muted/40 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{visitante.nome_completo}</span>
                        <span className="text-[10px] text-muted-foreground font-semibold">{visitante.cidade} - {visitante.uf}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-semibold">
                      {visitante.quem_convidou || <span className="italic text-xs text-muted-foreground/60 font-normal">Espontâneo</span>}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {visitante.whatsapp || visitante.telefone || <span className="italic text-xs text-muted-foreground/60">Sem contato</span>}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground font-semibold">
                      {formatDate(visitante.criado_em)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase leading-none ${
                        visitante.ativo 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}>
                        {visitante.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
