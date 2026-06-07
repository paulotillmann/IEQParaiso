import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from '../components/Router';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  UserCheck, 
  MapPin, 
  Calendar,
  Phone,
  Bookmark,
  ChevronRight,
  FileText,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Visitante {
  id: string;
  nome_completo: string;
  telefone: string | null;
  whatsapp: string | null;
  endereco: string | null;
  bairro: string | null;
  cidade: string;
  uf: string;
  quem_convidou: string | null;
  observacoes: string | null;
  ativo: boolean;
  criado_em: string;
}

export const Visitantes: React.FC = () => {
  const { userDetails, isAdmin, isSecretaria } = useAuth();
  const navigate = useNavigate();

  const [visitantes, setVisitantes] = useState<Visitante[]>([]);
  const [cidades, setCidades] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMocks, setUsingMocks] = useState(false);
  
  // Modal state for history (US23)
  const [selectedVisitante, setSelectedVisitante] = useState<Visitante | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [cidadeFilter, setCidadeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ativos');

  const canEdit = isAdmin || isSecretaria;

  const fetchVisitantes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('visitantes')
        .select('*')
        .order('nome_completo', { ascending: true });

      if (error) throw error;
      setVisitantes(data || []);
      
      // Cities extraction
      const uniqueCities = Array.from(new Set((data || []).map(v => v.cidade))).sort();
      setCidades(uniqueCities);
      setUsingMocks(false);
    } catch (err) {
      console.warn('Usando mock de visitantes (tabela não criada no Supabase):', err);
      // Fallback mocks
      const mockVisitantes: Visitante[] = [
        {
          id: '1',
          nome_completo: 'Juliana Pires Martins',
          telefone: '(34) 99311-2233',
          whatsapp: '(34) 99311-2233',
          endereco: 'Av. Santos Dumont, 12',
          bairro: 'Centro',
          cidade: 'Araguari',
          uf: 'MG',
          quem_convidou: 'Luciana Diaconisa',
          observacoes: 'Primeira visita no culto de domingo à noite. Gostou muito do louvor e pediu oração pela família.',
          ativo: true,
          criado_em: new Date(Date.now() - 3600000 * 24 * 3).toISOString() // 3 days ago
        },
        {
          id: '2',
          nome_completo: 'Roberto Albuquerque Neto',
          telefone: '(34) 98822-4411',
          whatsapp: null,
          endereco: 'Rua das Palmeiras, 99',
          bairro: 'Paraíso',
          cidade: 'Araguari',
          uf: 'MG',
          quem_convidou: 'Carlos Membro',
          observacoes: 'Visitou no culto da família. Demonstrou interesse em participar da célula de homens no bairro Paraíso.',
          ativo: true,
          criado_em: new Date(Date.now() - 3600000 * 24 * 10).toISOString() // 10 days ago
        },
        {
          id: '3',
          nome_completo: 'Fernanda Lima Silva',
          telefone: '(34) 99123-4567',
          whatsapp: '(34) 99123-4567',
          endereco: 'Rua João Peixoto, 432',
          bairro: 'Bosque',
          cidade: 'Araguari',
          uf: 'MG',
          quem_convidou: 'Espontâneo',
          observacoes: 'Veio por conta própria após receber panfleto na rua. Solicitou visita pastoral.',
          ativo: true,
          criado_em: new Date(Date.now() - 3600000 * 24 * 45).toISOString() // 45 days ago
        },
        {
          id: '4',
          nome_completo: 'Renato Nogueira',
          telefone: '(34) 99765-8822',
          whatsapp: '(34) 99765-8822',
          endereco: 'Av. João Pessoa, 555',
          bairro: 'Tibery',
          cidade: 'Uberlândia',
          uf: 'MG',
          quem_convidou: 'Pr. Marcos da Silva',
          observacoes: 'Visitante de Uberlândia. Estava de passagem em Araguari e assistiu ao culto da manhã.',
          ativo: true,
          criado_em: new Date(Date.now() - 3600000 * 24 * 5).toISOString() // 5 days ago
        },
        {
          id: '5',
          nome_completo: 'Patrícia Garcia Bueno',
          telefone: '(34) 99988-7766',
          whatsapp: '(34) 99988-7766',
          endereco: 'Rua Paraná, 88',
          bairro: 'Industrial',
          cidade: 'Araguari',
          uf: 'MG',
          quem_convidou: 'Lucia Diaconisa',
          observacoes: 'Visitante antiga. Tornou-se membro regular recentemente (inativada da lista de visitantes).',
          ativo: false,
          criado_em: new Date(Date.now() - 3600000 * 24 * 90).toISOString() // 90 days ago
        }
      ];
      setVisitantes(mockVisitantes);
      const uniqueCities = Array.from(new Set(mockVisitantes.map(v => v.cidade))).sort();
      setCidades(uniqueCities);
      setUsingMocks(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitantes();
  }, []);

  const openHistory = (visitante: Visitante) => {
    setSelectedVisitante(visitante);
    setShowHistoryModal(true);
  };

  // Filter visitors client-side
  const filteredVisitantes = visitantes.filter(v => {
    // Search Nome, Telefone, Cidade
    const matchesSearch = v.nome_completo.toLowerCase().includes(search.toLowerCase()) ||
      (v.telefone && v.telefone.includes(search)) ||
      (v.whatsapp && v.whatsapp.includes(search)) ||
      v.cidade.toLowerCase().includes(search.toLowerCase());

    const matchesCidade = cidadeFilter ? v.cidade === cidadeFilter : true;

    const matchesStatus = statusFilter === 'ativos'
      ? v.ativo === true
      : statusFilter === 'inativos'
        ? v.ativo === false
        : true; // todos

    return matchesSearch && matchesCidade && matchesStatus;
  });

  // US22: Recent Visitors (registered in the last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const visitantesRecentes = visitantes.filter(v => 
    v.ativo && new Date(v.criado_em) >= thirtyDaysAgo
  ).sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Visitantes</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Registro, acompanhamento e histórico de visitas das pessoas acolhidas no templo.
          </p>
        </div>
        
        {canEdit && (
          <button
            onClick={() => navigate('/visitantes/novo')}
            className="flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-600/20 w-max"
          >
            <Plus size={18} className="mr-2" />
            Novo Visitante
          </button>
        )}
      </div>

      {usingMocks && (
        <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-800 dark:text-yellow-300 text-xs font-semibold">
          Exibindo visitantes de demonstração (mock). Alterações serão mantidas em memória.
        </div>
      )}

      {/* US22 - Recent Visitors Section */}
      {visitantesRecentes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={16} className="text-indigo-500" /> Visitantes Recentes (Últimos 30 dias)
          </h2>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visitantesRecentes.slice(0, 3).map(v => (
              <div 
                key={v.id}
                onClick={() => openHistory(v)}
                className="rounded-2xl border bg-card p-5 shadow-sm hover:border-indigo-500/30 cursor-pointer transition-all flex flex-col justify-between space-y-3 relative group overflow-hidden"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-base text-foreground leading-tight truncate max-w-[80%]">{v.nome_completo}</h3>
                    <ChevronRight size={16} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold block mt-1">
                    Convidado por: {v.quem_convidou || 'Espontâneo'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t font-semibold">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} />
                    {v.cidade}
                  </span>
                  <span>Visitou em {formatDate(v.criado_em)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 items-center p-4 rounded-2xl border bg-card shadow-sm">
        
        {/* Search Input */}
        <div className="flex items-center border rounded-xl bg-black/5 dark:bg-black/25 px-3 py-2.5 sm:col-span-1">
          <Search size={18} className="text-muted-foreground mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Pesquisar por nome, tel, cidade..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm w-full outline-none text-foreground placeholder-muted-foreground"
          />
        </div>

        {/* City Filter */}
        <div className="flex items-center border rounded-xl bg-black/5 dark:bg-black/25 px-3 py-2">
          <MapPin size={16} className="text-muted-foreground mr-2 shrink-0" />
          <select
            value={cidadeFilter}
            onChange={e => setCidadeFilter(e.target.value)}
            className="bg-transparent text-sm w-full outline-none text-foreground cursor-pointer"
          >
            <option value="">Todas as Cidades</option>
            {cidades.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center border rounded-xl bg-black/5 dark:bg-black/25 px-3 py-2">
          <Filter size={16} className="text-muted-foreground mr-2 shrink-0" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-transparent text-sm w-full outline-none text-foreground cursor-pointer"
          >
            <option value="ativos">Apenas Ativos</option>
            <option value="inativos">Apenas Inativos</option>
            <option value="todos">Todos</option>
          </select>
        </div>

      </div>

      {/* Visitors Table */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Carregando visitantes...</div>
        ) : filteredVisitantes.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhum visitante encontrado.</div>
        ) : (
          <div className="overflow-x-auto min-w-full">
            <table className="min-w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 text-xs font-semibold text-muted-foreground uppercase border-b">
                  <th className="px-6 py-4">Nome Completo</th>
                  <th className="px-6 py-4">Contato</th>
                  <th className="px-6 py-4">Quem Convidou</th>
                  <th className="px-6 py-4">Primeira Visita</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {filteredVisitantes.map((v) => (
                  <tr key={v.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{v.nome_completo}</span>
                        <span className="text-[10px] text-muted-foreground font-semibold">{v.cidade} - {v.uf}</span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 text-muted-foreground">
                      {v.whatsapp ? (
                        <span className="flex items-center gap-1.5 text-xs">
                          <Phone size={12} className="text-emerald-500" />
                          {v.whatsapp}
                        </span>
                      ) : v.telefone ? (
                        <span className="flex items-center gap-1.5 text-xs">
                          <Phone size={12} className="text-slate-400" />
                          {v.telefone}
                        </span>
                      ) : (
                        <span className="italic text-xs text-muted-foreground/60">Sem contato</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-muted-foreground">
                      {v.quem_convidou || <span className="italic text-xs text-muted-foreground/60">Espontâneo</span>}
                    </td>

                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {formatDate(v.criado_em)}
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase leading-none ${
                        v.ativo 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}>
                        {v.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right space-x-2 shrink-0">
                      <button
                        onClick={() => openHistory(v)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Ver Histórico/Observações"
                      >
                        <Eye size={15} />
                      </button>
                      
                      {canEdit && (
                        <button
                          onClick={() => navigate(`/visitantes/novo?edit=${v.id}`)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-indigo-500/10 hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 transition-colors"
                          title="Editar Visitante"
                        >
                          <Edit size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* US23 - History / Details Modal */}
      <AnimatePresence>
        {showHistoryModal && selectedVisitante && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistoryModal(false)}
              className="fixed inset-0 bg-black"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-card text-card-foreground rounded-2xl border p-6 w-full max-w-lg shadow-xl relative z-10 space-y-5"
            >
              <div className="flex items-start justify-between border-b pb-3">
                <div>
                  <h3 className="text-lg font-bold leading-tight">{selectedVisitante.nome_completo}</h3>
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">Histórico e Observações do Visitante</span>
                </div>
                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                  selectedVisitante.ativo ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                }`}>
                  {selectedVisitante.ativo ? 'Acompanhamento Ativo' : 'Acompanhamento Inativo'}
                </span>
              </div>

              {/* Contact / Detail Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div className="p-3 border rounded-xl bg-muted/20">
                  <span className="text-[10px] text-muted-foreground uppercase block mb-1">Contato</span>
                  <span className="text-foreground flex items-center gap-1 font-bold">
                    <Phone size={12} className="text-indigo-500" />
                    {selectedVisitante.whatsapp || selectedVisitante.telefone || 'Sem contato cadastrado'}
                  </span>
                </div>

                <div className="p-3 border rounded-xl bg-muted/20">
                  <span className="text-[10px] text-muted-foreground uppercase block mb-1">Localização</span>
                  <span className="text-foreground flex items-center gap-1 font-bold">
                    <MapPin size={12} className="text-indigo-500" />
                    {selectedVisitante.cidade} - {selectedVisitante.uf}
                  </span>
                </div>
                
                <div className="p-3 border rounded-xl bg-muted/20 col-span-2">
                  <span className="text-[10px] text-muted-foreground uppercase block mb-1">Endereço Residencial</span>
                  <span className="text-foreground font-bold">
                    {selectedVisitante.endereco ? (
                      `${selectedVisitante.endereco}${selectedVisitante.bairro ? `, ${selectedVisitante.bairro}` : ''}`
                    ) : (
                      'Não informado'
                    )}
                  </span>
                </div>

                <div className="p-3 border rounded-xl bg-muted/20">
                  <span className="text-[10px] text-muted-foreground uppercase block mb-1">Quem Convidou</span>
                  <span className="text-foreground font-bold">{selectedVisitante.quem_convidou || 'Espontâneo'}</span>
                </div>

                <div className="p-3 border rounded-xl bg-muted/20">
                  <span className="text-[10px] text-muted-foreground uppercase block mb-1">Data de Cadastro</span>
                  <span className="text-foreground font-bold">{formatDate(selectedVisitante.criado_em)}</span>
                </div>
              </div>

              {/* History Log/Observações */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileText size={14} className="text-indigo-500" /> Histórico de Visitas / Observações
                </h4>
                <div className="p-4 border rounded-xl bg-muted/10 text-sm leading-relaxed text-foreground italic font-semibold">
                  {selectedVisitante.observacoes || 'Nenhum histórico adicional inserido para este visitante.'}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/20"
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
export default Visitantes;
