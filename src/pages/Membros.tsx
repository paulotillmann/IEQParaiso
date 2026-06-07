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
  UserPlus, 
  MapPin, 
  Tag, 
  CheckCircle, 
  XCircle,
  Phone
} from 'lucide-react';

interface Cargo {
  id: string;
  nome: string;
}

interface Membro {
  id: string;
  nome_completo: string;
  telefone: string | null;
  whatsapp: string | null;
  endereco: string | null;
  cidade: string;
  uf: string;
  data_nascimento: string | null;
  estado_civil: string | null;
  data_batismo: string | null;
  data_ingresso: string;
  foto_url: string | null;
  ativo: boolean;
  cargo_id: string;
  cargo: {
    nome: string;
  } | null;
}

export const Membros: React.FC = () => {
  const { userDetails, isAdmin, isSecretaria } = useAuth();
  const navigate = useNavigate();

  const [membros, setMembros] = useState<Membro[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [cidades, setCidades] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMocks, setUsingMocks] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [cargoFilter, setCargoFilter] = useState('');
  const [cidadeFilter, setCidadeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ativos'); // default show active

  const canEdit = isAdmin || isSecretaria;

  const fetchFiltersData = async (membrosList: Membro[]) => {
    // Extract unique cities from member list for filter dropdown
    const uniqueCities = Array.from(new Set(membrosList.map(m => m.cidade))).sort();
    setCidades(uniqueCities);

    try {
      const { data } = await supabase.from('cargos').select('id, nome').eq('ativo', true);
      if (data) setCargos(data);
    } catch {
      // Fallback cargos for filters
      setCargos([
        { id: '1', nome: 'Pastor' },
        { id: '2', nome: 'Secretária' },
        { id: '3', nome: 'Líder' },
        { id: '4', nome: 'Diácono' },
        { id: '5', nome: 'Obreiro' },
        { id: '6', nome: 'Membro' }
      ]);
    }
  };

  const fetchMembros = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('membros')
        .select(`
          *,
          cargo:cargos(nome)
        `)
        .order('nome_completo', { ascending: true });

      if (error) throw error;
      
      const mapped = (data || []).map((m: any) => ({
        ...m,
        cargo: Array.isArray(m.cargo) ? m.cargo[0] : m.cargo
      }));

      setMembros(mapped);
      await fetchFiltersData(mapped);
      setUsingMocks(false);
    } catch (err) {
      console.warn('Usando mock de membros (tabelas não criadas no Supabase):', err);
      // Fallback Mock Data
      const mockMembros: Membro[] = [
        {
          id: '1',
          nome_completo: 'Carlos Eduardo Oliveira',
          telefone: '(34) 99122-3344',
          whatsapp: '(34) 99122-3344',
          endereco: 'Rua das Flores, 123',
          cidade: 'Araguari',
          uf: 'MG',
          data_nascimento: '1988-05-15',
          estado_civil: 'casado',
          data_batismo: '2005-10-12',
          data_ingresso: '2010-01-10',
          foto_url: null,
          ativo: true,
          cargo_id: '6',
          cargo: { nome: 'Membro' }
        },
        {
          id: '2',
          nome_completo: 'Maria Eduarda Souza Silva',
          telefone: '(34) 99244-5566',
          whatsapp: '(34) 99244-5566',
          endereco: 'Av. Minas Gerais, 450',
          cidade: 'Araguari',
          uf: 'MG',
          data_nascimento: '1995-12-08',
          estado_civil: 'solteiro',
          data_batismo: '2012-06-17',
          data_ingresso: '2015-08-20',
          foto_url: null,
          ativo: true,
          cargo_id: '3',
          cargo: { nome: 'Líder' }
        },
        {
          id: '3',
          nome_completo: 'João Pedro Rezende',
          telefone: '(34) 98877-1122',
          whatsapp: '(34) 98877-1122',
          endereco: 'Rua Coronel Quirino, 89',
          cidade: 'Araguari',
          uf: 'MG',
          data_nascimento: '1975-03-24',
          estado_civil: 'casado',
          data_batismo: '1998-04-12',
          data_ingresso: '2002-05-14',
          foto_url: null,
          ativo: true,
          cargo_id: '4',
          cargo: { nome: 'Diácono' }
        },
        {
          id: '4',
          nome_completo: 'Ana Beatriz Ferreira Santos',
          telefone: '(34) 99111-9988',
          whatsapp: '(34) 99111-9988',
          endereco: 'Rua Marcílio Dias, 1010',
          cidade: 'Uberlândia',
          uf: 'MG',
          data_nascimento: '2000-09-12',
          estado_civil: 'solteiro',
          data_batismo: null,
          data_ingresso: '2021-03-01',
          foto_url: null,
          ativo: true,
          cargo_id: '6',
          cargo: { nome: 'Membro' }
        },
        {
          id: '5',
          nome_completo: 'Pr. Marcos Antônio da Silva',
          telefone: '(34) 99900-1122',
          whatsapp: '(34) 99900-1122',
          endereco: 'Av. Bahia, 12',
          cidade: 'Araguari',
          uf: 'MG',
          data_nascimento: '1965-07-20',
          estado_civil: 'casado',
          data_batismo: '1980-01-01',
          data_ingresso: '1995-10-10',
          foto_url: null,
          ativo: true,
          cargo_id: '1',
          cargo: { nome: 'Pastor' }
        },
        {
          id: '6',
          nome_completo: 'Lucas Gabriel Albuquerque',
          telefone: '(34) 98765-4321',
          whatsapp: null,
          endereco: 'Rua São Paulo, 54',
          cidade: 'Araguari',
          uf: 'MG',
          data_nascimento: '1990-01-01',
          estado_civil: 'divorciado',
          data_batismo: '2010-05-05',
          data_ingresso: '2012-12-12',
          foto_url: null,
          ativo: false,
          cargo_id: '5',
          cargo: { nome: 'Obreiro' }
        }
      ];
      setMembros(mockMembros);
      fetchFiltersData(mockMembros);
      setUsingMocks(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembros();
  }, []);

  // Filter members client-side based on options chosen
  const filteredMembros = membros.filter(m => {
    // Name search
    const matchesSearch = m.nome_completo.toLowerCase().includes(search.toLowerCase());
    
    // Cargo filter
    const matchesCargo = cargoFilter ? String(m.cargo_id) === cargoFilter || m.cargo?.nome === cargoFilter : true;
    
    // City filter
    const matchesCidade = cidadeFilter ? m.cidade === cidadeFilter : true;
    
    // Status filter
    const matchesStatus = statusFilter === 'ativos' 
      ? m.ativo === true 
      : statusFilter === 'inativos' 
        ? m.ativo === false 
        : true; // 'todos'

    return matchesSearch && matchesCargo && matchesCidade && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Membresia</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Listagem, busca e filtragem da membresia da igreja IEQ Paraíso.
          </p>
        </div>
        
        {/* Only admins or secretaries can add new members */}
        {canEdit && (
          <button
            onClick={() => navigate('/membros/novo')}
            className="flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-600/20 w-max"
          >
            <UserPlus size={18} className="mr-2" />
            Novo Membro
          </button>
        )}
      </div>

      {usingMocks && (
        <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-800 dark:text-yellow-300 text-xs font-semibold">
          Exibindo membros de demonstração (mock). Alterações serão mantidas em memória.
        </div>
      )}

      {/* Filter Options Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 items-center p-4 rounded-2xl border bg-card shadow-sm">
        
        {/* Search */}
        <div className="flex items-center border rounded-xl bg-black/5 dark:bg-black/25 px-3 py-2.5">
          <Search size={18} className="text-muted-foreground mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Pesquisar por nome..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm w-full outline-none text-foreground placeholder-muted-foreground"
          />
        </div>

        {/* Cargo Filter */}
        <div className="flex items-center border rounded-xl bg-black/5 dark:bg-black/25 px-3 py-2">
          <Tag size={16} className="text-muted-foreground mr-2 shrink-0" />
          <select
            value={cargoFilter}
            onChange={e => setCargoFilter(e.target.value)}
            className="bg-transparent text-sm w-full outline-none text-foreground cursor-pointer"
          >
            <option value="">Todos os Cargos</option>
            {cargos.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
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

      {/* Members Grid/List */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Carregando membros...</div>
        ) : filteredMembros.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhum membro encontrado com os filtros selecionados.</div>
        ) : (
          <div className="overflow-x-auto min-w-full">
            <table className="min-w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 text-xs font-semibold text-muted-foreground uppercase border-b">
                  <th className="px-6 py-4">Nome Completo</th>
                  <th className="px-6 py-4">Cargo</th>
                  <th className="px-6 py-4">Contato</th>
                  <th className="px-6 py-4">Cidade / UF</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {filteredMembros.map((membro) => (
                  <tr key={membro.id} className="hover:bg-muted/10 transition-colors">
                    {/* Name with initials placeholder or picture */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-xs shrink-0">
                          {membro.foto_url ? (
                            <img src={membro.foto_url} alt={membro.nome_completo} className="h-full w-full rounded-full object-cover" />
                          ) : (
                            membro.nome_completo.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <span className="font-semibold text-foreground">{membro.nome_completo}</span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 text-muted-foreground">
                      {membro.cargo?.nome || 'Nenhum'}
                    </td>
                    
                    <td className="px-6 py-4 text-muted-foreground">
                      {membro.whatsapp ? (
                        <span className="flex items-center gap-1.5 text-xs">
                          <Phone size={12} className="text-emerald-500" />
                          {membro.whatsapp}
                        </span>
                      ) : membro.telefone ? (
                        <span className="flex items-center gap-1.5 text-xs">
                          <Phone size={12} className="text-slate-400" />
                          {membro.telefone}
                        </span>
                      ) : (
                        <span className="italic text-xs text-muted-foreground/60">Sem contato</span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 text-muted-foreground">
                      {membro.cidade} - {membro.uf}
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase leading-none ${
                        membro.ativo 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}>
                        {membro.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="px-6 py-4 text-right space-x-2 shrink-0">
                      <button
                        onClick={() => navigate(`/membros/${membro.id}`)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Visualizar Ficha"
                      >
                        <Eye size={15} />
                      </button>
                      
                      {canEdit && (
                        <button
                          onClick={() => navigate(`/membros/novo?edit=${membro.id}`)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-indigo-500/10 hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 transition-colors"
                          title="Editar Cadastro"
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

    </div>
  );
};
export default Membros;
