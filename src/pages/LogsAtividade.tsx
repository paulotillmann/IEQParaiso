import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../contexts/ToastContext';
import { 
  Search, 
  Filter, 
  Clock, 
  ShieldAlert, 
  Database, 
  X, 
  FileJson,
  Calendar,
  User,
  Activity,
  LogIn,
  PlusCircle,
  Edit,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LogAtividade {
  id: string;
  usuario_id: string | null;
  usuario_nome: string;
  usuario_email: string;
  acao: 'acesso' | 'inclusao' | 'alteracao' | 'exclusao' | string;
  tabela: string | null;
  registro_id: string | null;
  dados_anteriores: any;
  dados_novos: any;
  criado_em: string;
}

export const LogsAtividade: React.FC = () => {
  const { isAdmin } = useAuth();
  const { error: toastError } = useToast();
  
  const [logs, setLogs] = useState<LogAtividade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [acaoFilter, setAcaoFilter] = useState<string>('todos');
  const [tabelaFilter, setTabelaFilter] = useState<string>('todos');
  const [periodoFilter, setPeriodoFilter] = useState<string>('7'); // Default to last 7 days
  const [selectedLog, setSelectedLog] = useState<LogAtividade | null>(null);
  const [usingMocks, setUsingMocks] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('logs_atividade')
        .select('*')
        .order('criado_em', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
      setUsingMocks(false);
    } catch (err) {
      console.warn('Usando mock de logs (tabela não criada ou erro de conexão):', err);
      // Fallback mocks representing system activity
      setLogs([
        {
          id: '1',
          usuario_id: '6bb4be31-e555-40e2-8c70-0b4ea6dc47cc',
          usuario_nome: 'Paulo G. Tillmann',
          usuario_email: 'paulogtillmann@gmail.com',
          acao: 'acesso',
          tabela: 'sessao',
          registro_id: null,
          dados_anteriores: null,
          dados_novos: null,
          criado_em: new Date().toISOString()
        },
        {
          id: '2',
          usuario_id: '6bb4be31-e555-40e2-8c70-0b4ea6dc47cc',
          usuario_nome: 'Paulo G. Tillmann',
          usuario_email: 'paulogtillmann@gmail.com',
          acao: 'alteracao',
          tabela: 'cargos',
          registro_id: 'c35a8eb8-4228-4447-9758-154df66ea60a',
          dados_anteriores: { nome: 'Pastor Auxiliar', descricao: 'Auxilia o pastor titular no aconselhamento' },
          dados_novos: { nome: 'Pastor de Jovens', descricao: 'Líder do ministério de mocidade e eventos' },
          criado_em: new Date(Date.now() - 15 * 60000).toISOString()
        },
        {
          id: '3',
          usuario_id: '2',
          usuario_nome: 'Sarah Mendonça',
          usuario_email: 'secretaria@ieqparaiso.com',
          acao: 'inclusao',
          tabela: 'membros',
          registro_id: 'd9b7f52a-92b8-4c12-9c3b-5544aa33bb22',
          dados_anteriores: null,
          dados_novos: { nome_completo: 'Juliana Pires de Souza', telefone: '(34) 99122-3344', endereco: 'Rua das Flores, 123', cidade: 'Araguari', uf: 'MG', cargo_id: 'diacono' },
          criado_em: new Date(Date.now() - 45 * 60000).toISOString()
        },
        {
          id: '4',
          usuario_id: '2',
          usuario_nome: 'Sarah Mendonça',
          usuario_email: 'secretaria@ieqparaiso.com',
          acao: 'exclusao',
          tabela: 'visitantes',
          registro_id: 'f9b7f52a-92b8-4c12-9c3b-5544aa33bb22',
          dados_anteriores: { nome_completo: 'Carlos Eduardo Santos', telefone: '(34) 99222-1111', cidade: 'Araguari', uf: 'MG', observacoes: 'Visitou culto de jovens' },
          dados_novos: null,
          criado_em: new Date(Date.now() - 120 * 60000).toISOString()
        },
        {
          id: '5',
          usuario_id: '3',
          usuario_nome: 'Pr. Jefferson Alvarenga',
          usuario_email: 'pastor@ieqparaiso.com',
          acao: 'acesso',
          tabela: 'sessao',
          registro_id: null,
          dados_anteriores: null,
          dados_novos: null,
          criado_em: new Date(Date.now() - 180 * 60000).toISOString()
        },
        {
          id: '6',
          usuario_id: '2',
          usuario_nome: 'Sarah Mendonça',
          usuario_email: 'secretaria@ieqparaiso.com',
          acao: 'alteracao',
          tabela: 'cultos',
          registro_id: 'a8b7f52a-92b8-4c12-9c3b-5544aa33bb33',
          dados_anteriores: { titulo: 'Culto de Domingo - Família', horario_inicio: '18:00:00' },
          dados_novos: { titulo: 'Culto da Família e Santa Ceia', horario_inicio: '19:00:00' },
          criado_em: new Date(Date.now() - 240 * 60000).toISOString()
        },
        {
          id: '7',
          usuario_id: '6bb4be31-e555-40e2-8c70-0b4ea6dc47cc',
          usuario_nome: 'Paulo G. Tillmann',
          usuario_email: 'paulogtillmann@gmail.com',
          acao: 'inclusao',
          tabela: 'usuarios',
          registro_id: '5',
          dados_anteriores: null,
          dados_novos: { nome: 'Marcos Finanças', email: 'marcos@ieqparaiso.com', perfil: 'secretaria', ativo: true },
          criado_em: new Date(Date.now() - 1440 * 60000).toISOString() // 24 hours ago
        },
        {
          id: '8',
          usuario_id: '3',
          usuario_nome: 'Pr. Jefferson Alvarenga',
          usuario_email: 'pastor@ieqparaiso.com',
          acao: 'inclusao',
          tabela: 'presenca_membros',
          registro_id: 'e2b7f52a-92b8-4c12-9c3b-5544aa33bb44',
          dados_anteriores: null,
          dados_novos: { culto_id: 'a8b7f52a-92b8', membro_id: 'membro-1', presente: true },
          criado_em: new Date(Date.now() - 2880 * 60000).toISOString() // 2 days ago
        }
      ]);
      setUsingMocks(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && !isAdmin) {
      window.location.pathname = '/dashboard';
    }
  }, [isAdmin, loading]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'acesso':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
      case 'inclusao':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      case 'alteracao':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      case 'exclusao':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'acesso':
        return <LogIn size={14} className="mr-1" />;
      case 'inclusao':
        return <PlusCircle size={14} className="mr-1" />;
      case 'alteracao':
        return <Edit size={14} className="mr-1" />;
      case 'exclusao':
        return <Trash2 size={14} className="mr-1" />;
      default:
        return <Activity size={14} className="mr-1" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'acesso': return 'Acesso';
      case 'inclusao': return 'Inclusão';
      case 'alteracao': return 'Alteração';
      case 'exclusao': return 'Exclusão';
      default: return action;
    }
  };

  const getTableLabel = (tabela: string | null) => {
    if (!tabela) return '-';
    switch (tabela) {
      case 'usuarios': return 'Usuários';
      case 'membros': return 'Membros';
      case 'visitantes': return 'Visitantes';
      case 'cultos': return 'Cultos';
      case 'cargos': return 'Cargos';
      case 'presenca_membros': return 'Presença Membros';
      case 'presenca_visitantes': return 'Presença Visitantes';
      case 'sessao': return 'Sessão / Login';
      default: return tabela.charAt(0).toUpperCase() + tabela.slice(1);
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Filter logs logic
  const filteredLogs = logs.filter(log => {
    // 1. Search text (name, email, table)
    const matchesSearch = 
      log.usuario_nome.toLowerCase().includes(search.toLowerCase()) ||
      log.usuario_email.toLowerCase().includes(search.toLowerCase()) ||
      (log.tabela && getTableLabel(log.tabela).toLowerCase().includes(search.toLowerCase()));

    // 2. Action filter
    const matchesAcao = acaoFilter === 'todos' || log.acao === acaoFilter;

    // 3. Table filter
    const matchesTabela = tabelaFilter === 'todos' || log.tabela === tabelaFilter;

    // 4. Period filter
    const logDate = new Date(log.criado_em);
    const timeDiff = Date.now() - logDate.getTime();
    const diffDays = timeDiff / (1000 * 3600 * 24);
    
    let matchesPeriodo = true;
    if (periodoFilter === '1') matchesPeriodo = diffDays <= 1;
    else if (periodoFilter === '7') matchesPeriodo = diffDays <= 7;
    else if (periodoFilter === '30') matchesPeriodo = diffDays <= 30;

    return matchesSearch && matchesAcao && matchesTabela && matchesPeriodo;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, acaoFilter, tabelaFilter, periodoFilter]);

  if (!isAdmin) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center">
        <ShieldAlert size={48} className="text-red-500 animate-pulse" />
        <h2 className="text-xl font-bold">Acesso Negado</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Apenas administradores autorizados têm permissão para acessar a tela de logs de atividade.
        </p>
      </div>
    );
  }

  // Count actions for summary cards
  const counts = {
    total: filteredLogs.length,
    acessos: filteredLogs.filter(l => l.acao === 'acesso').length,
    inclusoes: filteredLogs.filter(l => l.acao === 'inclusao').length,
    alteracoes: filteredLogs.filter(l => l.acao === 'alteracao').length
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Logs de Atividade</h1>
        <p className="text-muted-foreground mt-1 text-sm font-medium">
          Rastreabilidade de todas as ações de inclusão, alteração, exclusão e acessos executados no painel.
        </p>
      </div>

      {usingMocks && (
        <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-800 dark:text-yellow-300 text-xs font-semibold">
          Exibindo logs de demonstração (mock). Triggers de banco não aplicados ou sem dados locais.
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: 'Total Filtro', count: counts.total, icon: Activity, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' },
          { title: 'Acessos', count: counts.acessos, icon: LogIn, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
          { title: 'Inclusões', count: counts.inclusoes, icon: PlusCircle, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
          { title: 'Alterações', count: counts.alteracoes, icon: Edit, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' }
        ].map((c, i) => (
          <div key={i} className="p-4 rounded-2xl border bg-card shadow-sm flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${c.color}`}>
              <c.icon size={22} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold">{c.title}</p>
              <h4 className="text-xl font-bold">{c.count}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="p-5 rounded-2xl border bg-card shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Search bar */}
          <div className="flex flex-1 items-center rounded-xl border bg-background px-4 py-2.5 w-full">
            <Search size={18} className="text-muted-foreground mr-3" />
            <input
              type="text"
              placeholder="Pesquisar por usuário, e-mail ou tabela..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm outline-none text-foreground placeholder-muted-foreground"
            />
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            {/* Action Filter */}
            <div className="flex items-center gap-1.5">
              <Filter size={15} className="text-muted-foreground" />
              <select
                value={acaoFilter}
                onChange={e => setAcaoFilter(e.target.value)}
                className="rounded-xl border bg-background px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-500"
              >
                <option value="todos">Todas Ações</option>
                <option value="acesso">Acesso / Login</option>
                <option value="inclusao">Inclusões</option>
                <option value="alteracao">Alterações</option>
                <option value="exclusao">Exclusões</option>
              </select>
            </div>

            {/* Table Filter */}
            <div className="flex items-center gap-1.5">
              <Database size={15} className="text-muted-foreground" />
              <select
                value={tabelaFilter}
                onChange={e => setTabelaFilter(e.target.value)}
                className="rounded-xl border bg-background px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-500"
              >
                <option value="todos">Todas Tabelas</option>
                <option value="sessao">Sessão</option>
                <option value="membros">Membros</option>
                <option value="visitantes">Visitantes</option>
                <option value="cultos">Cultos</option>
                <option value="cargos">Cargos</option>
                <option value="usuarios">Usuários</option>
                <option value="presenca_membros">Presença Membros</option>
                <option value="presenca_visitantes">Presença Visitantes</option>
              </select>
            </div>

            {/* Period Filter */}
            <div className="flex items-center gap-1.5">
              <Calendar size={15} className="text-muted-foreground" />
              <select
                value={periodoFilter}
                onChange={e => setPeriodoFilter(e.target.value)}
                className="rounded-xl border bg-background px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-500"
              >
                <option value="1">Últimas 24 horas</option>
                <option value="7">Últimos 7 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="all">Todo Histórico</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Carregando logs...</div>
        ) : currentLogs.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Nenhum log de atividade encontrado com esses filtros.</div>
        ) : (
          <div className="overflow-x-auto min-w-full">
            <table className="min-w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 text-xs font-semibold text-muted-foreground uppercase border-b">
                  <th className="px-6 py-4">Usuário</th>
                  <th className="px-6 py-4">Ação</th>
                  <th className="px-6 py-4">Tabela/Área</th>
                  <th className="px-6 py-4">Data/Hora</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {currentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border text-xs">
                          <User size={14} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-foreground truncate">{log.usuario_nome}</span>
                          <span className="text-xs text-muted-foreground truncate">{log.usuario_email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase leading-none ${getActionBadgeColor(log.acao)}`}>
                        {getActionIcon(log.acao)}
                        {getActionLabel(log.acao)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground">
                      {getTableLabel(log.tabela)}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-muted-foreground/60" />
                        {formatDate(log.criado_em)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(log.dados_anteriores || log.dados_novos) ? (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg border hover:bg-muted text-xs font-semibold transition-colors gap-1.5"
                        >
                          <FileJson size={13} />
                          Detalhes
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground/50 italic mr-3">Sem alteração</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            Exibindo <span className="font-semibold text-foreground">{indexOfFirstItem + 1}</span> a{' '}
            <span className="font-semibold text-foreground">
              {indexOfLastItem > filteredLogs.length ? filteredLogs.length : indexOfLastItem}
            </span>{' '}
            de <span className="font-semibold text-foreground">{filteredLogs.length}</span> logs
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded-lg text-xs font-semibold disabled:opacity-40 hover:bg-muted transition-all"
            >
              Anterior
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`h-7 w-7 rounded-lg text-xs font-bold transition-all ${
                  currentPage === page
                    ? 'bg-indigo-600 text-white'
                    : 'border hover:bg-muted text-muted-foreground'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded-lg text-xs font-semibold disabled:opacity-40 hover:bg-muted transition-all"
            >
              Próximo
            </button>
          </div>
        </div>
      )}

      {/* Modal: Detalhes do JSON */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLog(null)}
              className="fixed inset-0 bg-black"
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-card text-card-foreground rounded-2xl border p-6 w-full max-w-3xl shadow-xl relative z-10 flex flex-col max-h-[85vh]"
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedLog(null)}
                className="absolute right-4 top-4 p-2 border rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>

              <div className="mb-4">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase leading-none mb-2 ${getActionBadgeColor(selectedLog.acao)}`}>
                  {getActionLabel(selectedLog.acao)}
                </span>
                <h3 className="text-lg font-bold">
                  Detalhes do Log: {getTableLabel(selectedLog.tabela)}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  ID do Registro: {selectedLog.registro_id || 'N/A'} • Executado por {selectedLog.usuario_nome} em {formatDate(selectedLog.criado_em)}
                </p>
              </div>

              {/* Diff JSON Panel */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-[300px]">
                {selectedLog.acao === 'alteracao' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Before */}
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-red-500 uppercase tracking-wide flex items-center">
                        <Trash2 size={12} className="mr-1" /> Estado Anterior
                      </span>
                      <pre className="p-4 rounded-xl bg-red-500/5 border border-red-500/15 text-xs text-red-800 dark:text-red-300 font-mono overflow-auto max-h-[350px]">
                        {JSON.stringify(selectedLog.dados_anteriores, null, 2)}
                      </pre>
                    </div>
                    {/* After */}
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-emerald-500 uppercase tracking-wide flex items-center">
                        <PlusCircle size={12} className="mr-1" /> Novo Estado
                      </span>
                      <pre className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-xs text-emerald-800 dark:text-emerald-300 font-mono overflow-auto max-h-[350px]">
                        {JSON.stringify(selectedLog.dados_novos, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-indigo-500 uppercase tracking-wide flex items-center">
                      <FileJson size={12} className="mr-1" /> Dados do Registro
                    </span>
                    <pre className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/15 text-xs text-indigo-800 dark:text-indigo-300 font-mono overflow-auto max-h-[400px]">
                      {JSON.stringify(selectedLog.dados_novos || selectedLog.dados_anteriores, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 border rounded-xl text-sm font-semibold hover:bg-muted transition-all"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
export default LogsAtividade;
