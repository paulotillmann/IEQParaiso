import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../contexts/ToastContext';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  Calendar, 
  Coins, 
  DollarSign, 
  Save, 
  X, 
  Lock, 
  AlertCircle, 
  TrendingUp, 
  Check, 
  UserCheck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Culto {
  id: string;
  titulo: string;
  tipo: 'normal' | 'especial';
  data_culto: string;
  horario_inicio: string | null;
}

interface Membro {
  id: string;
  nome_completo: string;
  ativo: boolean;
  codigo_ieq?: number | null;
}

interface Lancamento {
  id: string;
  culto_id: string;
  membro_id: string;
  valor_dizimo: number;
  valor_oferta_adoracao: number;
  valor_oferta_gerais: number;
  valor_oferta_missoes: number; // Novo campo
  tipo_entrada: 'dinheiro' | 'pix'; // Novo campo
  registrado_por: string;
  criado_em: string;
  membro?: {
    nome_completo: string;
    codigo_ieq?: number | null;
  } | null;
}

export const DizimosOfertas: React.FC = () => {
  const { user, userDetails, isPastor } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [cultos, setCultos] = useState<Culto[]>([]);
  const [membros, setMembros] = useState<Membro[]>([]);
  const [selectedCultoId, setSelectedCultoId] = useState<string>('');
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingLancamentos, setLoadingLancamentos] = useState(false);
  const [saving, setSaving] = useState(false);
  const [usingMocks, setUsingMocks] = useState(false);

  // Form states
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedMembro, setSelectedMembro] = useState<Membro | null>(null);
  const [membroSearch, setMembroSearch] = useState('');
  const [showMembroDropdown, setShowMembroDropdown] = useState(false);
  const [valorDizimo, setValorDizimo] = useState('0,00');
  const [valorOfertaAdoracao, setValorOfertaAdoracao] = useState('0,00');
  const [valorOfertaGerais, setValorOfertaGerais] = useState('0,00');
  const [valorOfertaMissoes, setValorOfertaMissoes] = useState('0,00');
  const [tipoEntrada, setTipoEntrada] = useState<'dinheiro' | 'pix'>('dinheiro');
  const [searchFilter, setSearchFilter] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // In-memory mock states for fallback
  const [mockLancamentosMem, setMockLancamentosMem] = useState<Lancamento[]>([
    {
      id: 'l1',
      culto_id: 'c1',
      membro_id: 'm1',
      valor_dizimo: 150.00,
      valor_oferta_adoracao: 20.00,
      valor_oferta_gerais: 10.00,
      valor_oferta_missoes: 15.00,
      tipo_entrada: 'dinheiro',
      registrado_por: 'u1',
      criado_em: new Date().toISOString(),
      membro: { nome_completo: 'CARLOS EDUARDO OLIVEIRA', codigo_ieq: 1001 }
    },
    {
      id: 'l2',
      culto_id: 'c1',
      membro_id: 'm3',
      valor_dizimo: 300.00,
      valor_oferta_adoracao: 50.00,
      valor_oferta_gerais: 0.00,
      valor_oferta_missoes: 0.00,
      tipo_entrada: 'pix',
      registrado_por: 'u1',
      criado_em: new Date().toISOString(),
      membro: { nome_completo: 'JOÃO PEDRO REZENDE', codigo_ieq: 1003 }
    },
    {
      id: 'l3',
      culto_id: 'c2',
      membro_id: 'm2',
      valor_dizimo: 0.00,
      valor_oferta_adoracao: 30.00,
      valor_oferta_gerais: 15.00,
      valor_oferta_missoes: 50.00,
      tipo_entrada: 'pix',
      registrado_por: 'u1',
      criado_em: new Date().toISOString(),
      membro: { nome_completo: 'MARIA EDUARDA SOUZA SILVA', codigo_ieq: null }
    }
  ]);

  const canEdit = !isPastor;

  // Click outside member search dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMembroDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Init data
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([fetchCultos(), fetchMembros()]);
      setLoading(false);
    };
    initData();
  }, []);

  // Fetch lancamentos when selected culto changes
  useEffect(() => {
    if (selectedCultoId) {
      fetchLancamentos(selectedCultoId);
      // Reset form on culto change to avoid launching for wrong culto
      resetForm();
    } else {
      setLancamentos([]);
    }
  }, [selectedCultoId]);

  const fetchCultos = async () => {
    try {
      const { data, error } = await supabase
        .from('cultos')
        .select('id, titulo, tipo, data_culto, horario_inicio')
        .order('data_culto', { ascending: false });

      if (error) throw error;
      setCultos(data || []);
      if (data && data.length > 0) {
        setSelectedCultoId(data[0].id); // Select most recent by default
      }
    } catch (err) {
      console.warn('Usando mock de cultos na tela de finanças:', err);
      const today = new Date();
      const mockCultos: Culto[] = [
        {
          id: 'c1',
          titulo: 'Culto de Celebração e Louvor',
          tipo: 'normal',
          data_culto: today.toISOString().substring(0, 10),
          horario_inicio: '19:00:00'
        },
        {
          id: 'c2',
          titulo: 'Grande Culto de Milagres',
          tipo: 'especial',
          data_culto: new Date(Date.now() - 3600000 * 24 * 3).toISOString().substring(0, 10),
          horario_inicio: '19:30:00'
        },
        {
          id: 'c3',
          titulo: 'Culto de Doutrina e Ensino',
          tipo: 'normal',
          data_culto: new Date(Date.now() - 3600000 * 24 * 5).toISOString().substring(0, 10),
          horario_inicio: '19:30:00'
        }
      ];
      setCultos(mockCultos);
      if (mockCultos.length > 0) {
        setSelectedCultoId(mockCultos[0].id);
      }
    }
  };

  const fetchMembros = async () => {
    try {
      const { data, error } = await supabase
        .from('membros')
        .select('id, nome_completo, ativo, codigo_ieq')
        .eq('ativo', true)
        .order('nome_completo', { ascending: true });

      if (error) throw error;
      setMembros(data || []);
    } catch (err) {
      console.warn('Usando mock de membros na tela de finanças:', err);
      const mockMembros: Membro[] = [
        { id: 'm1', nome_completo: 'CARLOS EDUARDO OLIVEIRA', ativo: true, codigo_ieq: 1001 },
        { id: 'm2', nome_completo: 'MARIA EDUARDA SOUZA SILVA', ativo: true, codigo_ieq: null },
        { id: 'm3', nome_completo: 'JOÃO PEDRO REZENDE', ativo: true, codigo_ieq: 1003 },
        { id: 'm4', nome_completo: 'ANA BEATRIZ FERREIRA SANTOS', ativo: true, codigo_ieq: 1004 },
        { id: 'm5', nome_completo: 'PR. MARCOS ANTÔNIO DA SILVA', ativo: true, codigo_ieq: 1005 }
      ];
      setMembros(mockMembros);
    }
  };

  const fetchLancamentos = async (cultoId: string) => {
    setLoadingLancamentos(true);
    try {
      const { data, error } = await supabase
        .from('dizimos_ofertas')
        .select(`
          id,
          culto_id,
          membro_id,
          valor_dizimo,
          valor_oferta_adoracao,
          valor_oferta_gerais,
          valor_oferta_missoes,
          tipo_entrada,
          registrado_por,
          criado_em,
          membro:membros(nome_completo, codigo_ieq)
        `)
        .eq('culto_id', cultoId)
        .order('criado_em', { ascending: false });

      if (error) throw error;

      // Map response to handle nested relation
      const mapped: Lancamento[] = (data || []).map((l: any) => ({
        ...l,
        valor_dizimo: Number(l.valor_dizimo),
        valor_oferta_adoracao: Number(l.valor_oferta_adoracao),
        valor_oferta_gerais: Number(l.valor_oferta_gerais),
        valor_oferta_missoes: Number(l.valor_oferta_missoes || 0),
        tipo_entrada: l.tipo_entrada || 'dinheiro',
        membro: Array.isArray(l.membro) ? l.membro[0] : l.membro
      }));

      setLancamentos(mapped);
      setUsingMocks(false);
    } catch (err) {
      console.warn('Usando mock de lançamentos financeiros:', err);
      const filtered = mockLancamentosMem.filter(l => l.culto_id === cultoId);
      setLancamentos(filtered);
      setUsingMocks(true);
    } finally {
      setLoadingLancamentos(false);
    }
  };

  const handleSaveLancamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPastor) return;
    if (!selectedCultoId) {
      toastError('Selecione um culto primeiro.');
      return;
    }
    if (!selectedMembro) {
      toastError('Selecione um membro para o lançamento.');
      return;
    }

    const dizimo = Math.max(0, parseCurrencyToFloat(valorDizimo));
    const adoracao = Math.max(0, parseCurrencyToFloat(valorOfertaAdoracao));
    const gerais = Math.max(0, parseCurrencyToFloat(valorOfertaGerais));
    const missoes = Math.max(0, parseCurrencyToFloat(valorOfertaMissoes));
 
    if (dizimo === 0 && adoracao === 0 && gerais === 0 && missoes === 0) {
      toastError('Informe o valor de pelo menos um dízimo ou oferta.');
      return;
    }

    setSaving(true);
    const loggedUserId = userDetails?.id || user?.id || 'anonymous';

    try {
      const payload = {
        culto_id: selectedCultoId,
        membro_id: selectedMembro.id,
        valor_dizimo: dizimo,
        valor_oferta_adoracao: adoracao,
        valor_oferta_gerais: gerais,
        valor_oferta_missoes: missoes,
        tipo_entrada: tipoEntrada,
        registrado_por: loggedUserId
      };

      if (!usingMocks) {
        if (editId) {
          // UPDATE
          const { error } = await supabase
            .from('dizimos_ofertas')
            .update(payload)
            .eq('id', editId);

          if (error) throw error;
          toastSuccess('Lançamento atualizado com sucesso!');
        } else {
          // INSERT / UPSERT (if they try to add same member twice, it updates)
          const { error } = await supabase
            .from('dizimos_ofertas')
            .upsert(payload, { onConflict: 'culto_id,membro_id' });

          if (error) throw error;
          toastSuccess('Lançamento registrado com sucesso!');
        }
      } else {
        // Mock execution
        if (editId) {
          // Mock update
          const updated = mockLancamentosMem.map(l => {
            if (l.id === editId) {
              return {
                ...l,
                valor_dizimo: dizimo,
                valor_oferta_adoracao: adoracao,
                valor_oferta_gerais: gerais,
                valor_oferta_missoes: missoes,
                tipo_entrada: tipoEntrada,
                registrado_por: loggedUserId
              };
            }
            return l;
          });
          setMockLancamentosMem(updated);
        } else {
          // Mock insert (upsert checks if member already exists in current culto)
          const existingIndex = mockLancamentosMem.findIndex(l => l.culto_id === selectedCultoId && l.membro_id === selectedMembro.id);
          
          if (existingIndex > -1) {
            const updated = [...mockLancamentosMem];
            updated[existingIndex] = {
              ...updated[existingIndex],
              valor_dizimo: dizimo,
              valor_oferta_adoracao: adoracao,
              valor_oferta_gerais: gerais,
              valor_oferta_missoes: missoes,
              tipo_entrada: tipoEntrada,
              registrado_por: loggedUserId
            };
            setMockLancamentosMem(updated);
            toastSuccess('Lançamento existente atualizado com sucesso!');
          } else {
            const newRecord: Lancamento = {
              id: 'l_' + Math.random().toString(36).substring(2, 9),
              culto_id: selectedCultoId,
              membro_id: selectedMembro.id,
              valor_dizimo: dizimo,
              valor_oferta_adoracao: adoracao,
              valor_oferta_gerais: gerais,
              valor_oferta_missoes: missoes,
              tipo_entrada: tipoEntrada,
              registrado_por: loggedUserId,
              criado_em: new Date().toISOString(),
              membro: {
                nome_completo: selectedMembro.nome_completo,
                codigo_ieq: selectedMembro.codigo_ieq
              }
            };
            setMockLancamentosMem(prev => [newRecord, ...prev]);
            toastSuccess('Lançamento registrado com sucesso!');
          }
        }
      }

      resetForm();
      // Reload lancamentos for current culto
      await fetchLancamentos(selectedCultoId);
    } catch (err: any) {
      console.error('Erro ao salvar lançamento:', err);
      // Friendly message for constraint violation if database returned it instead of handles it
      if (err.code === '23505') {
        toastError('Este membro já possui dízimo/oferta registrado neste culto. Edite o lançamento existente.');
      } else {
        toastError(err.message || 'Erro ao registrar os valores no banco de dados.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (lancamento: Lancamento) => {
    if (isPastor) return;
    setEditId(lancamento.id);
    
    // Find member details
    const memberObj = membros.find(m => m.id === lancamento.membro_id) || {
      id: lancamento.membro_id,
      nome_completo: lancamento.membro?.nome_completo || 'Membro não encontrado',
      ativo: true,
      codigo_ieq: lancamento.membro?.codigo_ieq
    };
    
    setSelectedMembro(memberObj);
    setMembroSearch(memberObj.nome_completo);
    setValorDizimo(formatFloatToInput(lancamento.valor_dizimo));
    setValorOfertaAdoracao(formatFloatToInput(lancamento.valor_oferta_adoracao));
    setValorOfertaGerais(formatFloatToInput(lancamento.valor_oferta_gerais));
    setValorOfertaMissoes(formatFloatToInput(lancamento.valor_oferta_missoes));
    setTipoEntrada(lancamento.tipo_entrada || 'dinheiro');
    setShowMembroDropdown(false);
  };

  const handleDeleteLancamento = async (id: string) => {
    if (isPastor) return;
    if (!window.confirm('Tem certeza que deseja remover este lançamento financeiro?')) return;

    try {
      if (!usingMocks) {
        const { error } = await supabase
          .from('dizimos_ofertas')
          .delete()
          .eq('id', id);

        if (error) throw error;
      } else {
        const updated = mockLancamentosMem.filter(l => l.id !== id);
        setMockLancamentosMem(updated);
      }

      toastSuccess('Lançamento financeiro removido com sucesso.');
      // Refresh list
      if (selectedCultoId) {
        fetchLancamentos(selectedCultoId);
      }
    } catch (err: any) {
      console.error('Erro ao excluir lançamento:', err);
      toastError('Erro ao excluir lançamento do banco de dados.');
    }
  };

  const resetForm = () => {
    setEditId(null);
    setSelectedMembro(null);
    setMembroSearch('');
    setValorDizimo('0,00');
    setValorOfertaAdoracao('0,00');
    setValorOfertaGerais('0,00');
    setValorOfertaMissoes('0,00');
    setTipoEntrada('dinheiro');
    setShowMembroDropdown(false);
  };

  const formatCurrencyInput = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '0,00';
    const cents = parseInt(digits, 10) / 100;
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(cents);
  };

  const parseCurrencyToFloat = (value: string) => {
    if (!value) return 0;
    const normalized = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(normalized) || 0;
  };

  const formatFloatToInput = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
  };

  // Filter members by search text
  const filteredMembros = membros.filter(m => {
    const searchLower = membroSearch.toLowerCase();
    const matchName = m.nome_completo.toLowerCase().includes(searchLower);
    const matchCode = m.codigo_ieq ? String(m.codigo_ieq).includes(searchLower) : false;
    return matchName || matchCode;
  });

  // Filter lancamentos by search box
  const filteredLancamentos = lancamentos.filter(l => {
    const searchLower = searchFilter.toLowerCase();
    const matchName = l.membro?.nome_completo.toLowerCase().includes(searchLower) || false;
    const matchCode = l.membro?.codigo_ieq ? String(l.membro.codigo_ieq).includes(searchLower) : false;
    return matchName || matchCode;
  });

  // Calculate totals
  const totalDizimo = lancamentos.reduce((acc, curr) => acc + curr.valor_dizimo, 0);
  const totalAdoracao = lancamentos.reduce((acc, curr) => acc + curr.valor_oferta_adoracao, 0);
  const totalGerais = lancamentos.reduce((acc, curr) => acc + curr.valor_oferta_gerais, 0);
  const totalMissoes = lancamentos.reduce((acc, curr) => acc + curr.valor_oferta_missoes, 0);
  const totalGeral = totalDizimo + totalAdoracao + totalGerais + totalMissoes;

  const selectedCulto = cultos.find(c => c.id === selectedCultoId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Dízimos e Ofertas</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Gerencie os lançamentos de dízimos e ofertas realizados pelos membros em cada culto.
          </p>
        </div>
      </div>

      {usingMocks && (
        <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-800 dark:text-yellow-300 text-xs font-semibold">
          Exibindo dados em modo de demonstração (mock). Alterações serão mantidas em memória.
        </div>
      )}

      {/* Select Culto Card */}
      <div className="p-5 rounded-2xl border bg-card shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Calendar size={20} />
          </div>
          <div>
            <label htmlFor="culto-select-fin" className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
              Culto Selecionado
            </label>
            {loading ? (
              <span className="text-xs text-muted-foreground font-semibold">Carregando cultos...</span>
            ) : (
              <select
                id="culto-select-fin"
                value={selectedCultoId}
                onChange={e => setSelectedCultoId(e.target.value)}
                className="bg-transparent text-sm font-bold text-foreground outline-none border-b border-muted hover:border-indigo-500 focus:border-indigo-500 pb-1 cursor-pointer transition-colors max-w-xs md:max-w-md"
              >
                <option value="" disabled className="text-muted-foreground font-medium">Selecione um culto...</option>
                {cultos.map(c => (
                  <option key={c.id} value={c.id} className="text-foreground bg-card">
                    {formatDate(c.data_culto)} - {c.titulo} ({c.tipo === 'especial' ? 'Especial' : 'Normal'})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {selectedCulto && (
          <div className="flex items-center gap-2 text-xs font-semibold shrink-0">
            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border ${
              selectedCulto.tipo === 'especial'
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
            }`}>
              {selectedCulto.tipo === 'especial' ? 'Culto Especial' : 'Culto Normal'}
            </span>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!selectedCultoId ? (
          /* Placeholder */
          <motion.div
            key="select-culto-placeholder"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="p-12 text-center border-2 border-dashed rounded-3xl bg-card/50 flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto mt-6"
          >
            <div className="h-16 w-16 rounded-full bg-indigo-500/5 text-indigo-500 border border-indigo-500/10 flex items-center justify-center shadow-inner">
              <Coins size={32} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground">Selecione um Culto</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
                Escolha um culto na caixa de seleção acima para lançar ou ver os relatórios de dízimos e ofertas.
              </p>
            </div>
          </motion.div>
        ) : (
          /* Main Content */
          <motion.div
            key="financial-panel"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Totalizers */}
            <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
              {/* Total Dizimos */}
              <div className="p-4 rounded-2xl border bg-card shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">Dízimos</span>
                  <span className="text-lg md:text-xl font-extrabold text-indigo-600 dark:text-indigo-400">{formatBRL(totalDizimo)}</span>
                </div>
                <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Coins size={18} />
                </div>
              </div>

              {/* Total Oferta Adoracao */}
              <div className="p-4 rounded-2xl border bg-card shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">Oferta Adoração</span>
                  <span className="text-lg md:text-xl font-extrabold text-emerald-500">{formatBRL(totalAdoracao)}</span>
                </div>
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <DollarSign size={18} />
                </div>
              </div>

              {/* Total Oferta Gerais */}
              <div className="p-4 rounded-2xl border bg-card shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">Ofertas Gerais</span>
                  <span className="text-lg md:text-xl font-extrabold text-blue-500">{formatBRL(totalGerais)}</span>
                </div>
                <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <DollarSign size={18} />
                </div>
              </div>

              {/* Total Oferta Missoes */}
              <div className="p-4 rounded-2xl border bg-card shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">Oferta Missões</span>
                  <span className="text-lg md:text-xl font-extrabold text-amber-500">{formatBRL(totalMissoes)}</span>
                </div>
                <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Coins size={18} />
                </div>
              </div>

              {/* Total Geral */}
              <div className="p-4 rounded-2xl border bg-card shadow-sm flex items-center justify-between col-span-2 xl:col-span-1">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">Total Arrecadado</span>
                  <span className="text-lg md:text-xl font-extrabold text-slate-800 dark:text-slate-100">{formatBRL(totalGeral)}</span>
                </div>
                <div className="h-9 w-9 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                  <TrendingUp size={18} />
                </div>
              </div>
            </div>

            {/* Layout Grid: Form (Left) & Table (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Form Column */}
              <div className="lg:col-span-4 space-y-4">
                <div className="p-6 rounded-2xl border bg-card shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                      <Coins size={18} className="text-indigo-500" />
                      {editId ? 'Editar Lançamento' : 'Novo Lançamento'}
                    </h3>
                    {editId && (
                      <button 
                        onClick={resetForm}
                        className="text-xs text-muted-foreground hover:text-foreground font-semibold flex items-center gap-0.5 border px-2 py-1 rounded-lg"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>

                  {isPastor ? (
                    <div className="flex items-start gap-2 p-3 border border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs font-semibold rounded-xl">
                      <Lock size={16} className="shrink-0 mt-0.5" />
                      <span>Modo de Leitura: Apenas administradores e secretárias podem registrar dízimos e ofertas.</span>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveLancamento} className="space-y-4">
                      {/* Member Select with Search Autocomplete */}
                      <div className="space-y-1 relative" ref={dropdownRef}>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Membro <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <input
                            type="text"
                            ref={searchInputRef}
                            placeholder={editId ? selectedMembro?.nome_completo : "Buscar membro por nome ou código..."}
                            value={membroSearch}
                            disabled={!!editId} // Cannot change member when editing, only values
                            onChange={e => {
                              setMembroSearch(e.target.value);
                              setShowMembroDropdown(true);
                              if (selectedMembro) setSelectedMembro(null);
                            }}
                            onFocus={() => {
                              if (!editId) setShowMembroDropdown(true);
                            }}
                            className="w-full rounded-xl border bg-black/5 dark:bg-black/25 py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-all focus:border-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed"
                          />
                          <Search size={16} className="absolute left-3.5 top-3.5 text-muted-foreground" />
                          {selectedMembro && (
                            <div className="absolute right-3 top-3.5 flex items-center text-emerald-500">
                              <UserCheck size={16} />
                            </div>
                          )}
                        </div>

                        {/* Dropdown list */}
                        {showMembroDropdown && !editId && (
                          <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto border bg-card rounded-xl shadow-lg z-50 divide-y">
                            {filteredMembros.length === 0 ? (
                              <div className="p-3 text-xs text-muted-foreground font-semibold text-center">Nenhum membro ativo encontrado</div>
                            ) : (
                              filteredMembros.map(m => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedMembro(m);
                                    setMembroSearch(m.nome_completo);
                                    setShowMembroDropdown(false);
                                  }}
                                  className="w-full text-left p-3 hover:bg-muted/60 text-xs font-semibold text-foreground flex justify-between items-center transition-colors"
                                >
                                  <span>{m.nome_completo}</span>
                                  {m.codigo_ieq && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                                      Cód: {m.codigo_ieq}
                                    </span>
                                  )}
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>

                      {/* Tipo de Entrada */}
                      <div className="space-y-1">
                        <label htmlFor="tipo-entrada-select" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tipo de Entrada <span className="text-red-500">*</span></label>
                        <select
                          id="tipo-entrada-select"
                          value={tipoEntrada}
                          onChange={e => setTipoEntrada(e.target.value as any)}
                          className="w-full rounded-xl border bg-black/5 dark:bg-black/25 py-2.5 px-4 text-sm text-foreground outline-none transition-all focus:border-indigo-500 cursor-pointer text-foreground"
                        >
                          <option value="dinheiro" className="text-foreground bg-card">Dinheiro</option>
                          <option value="pix" className="text-foreground bg-card">Pix</option>
                        </select>
                      </div>

                      {/* Valor Dizimo */}
                      <div className="space-y-1">
                        <label htmlFor="dizimo-val" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Valor do Dízimo (R$)</label>
                        <div className="relative">
                          <input
                            id="dizimo-val"
                            type="text"
                            placeholder="0,00"
                            value={valorDizimo}
                            onChange={e => setValorDizimo(formatCurrencyInput(e.target.value))}
                            className="w-full rounded-xl border bg-black/5 dark:bg-black/25 py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-all focus:border-indigo-500"
                          />
                          <Coins size={16} className="absolute left-3.5 top-3.5 text-muted-foreground" />
                        </div>
                      </div>

                      {/* Valor Oferta Adoracao */}
                      <div className="space-y-1">
                        <label htmlFor="adoracao-val" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Oferta Adoração (R$)</label>
                        <div className="relative">
                          <input
                            id="adoracao-val"
                            type="text"
                            placeholder="0,00"
                            value={valorOfertaAdoracao}
                            onChange={e => setValorOfertaAdoracao(formatCurrencyInput(e.target.value))}
                            className="w-full rounded-xl border bg-black/5 dark:bg-black/25 py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-all focus:border-indigo-500"
                          />
                          <DollarSign size={16} className="absolute left-3.5 top-3.5 text-muted-foreground" />
                        </div>
                      </div>

                      {/* Valor Oferta Gerais */}
                      <div className="space-y-1">
                        <label htmlFor="gerais-val" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Oferta Geral / Gerais (R$)</label>
                        <div className="relative">
                          <input
                            id="gerais-val"
                            type="text"
                            placeholder="0,00"
                            value={valorOfertaGerais}
                            onChange={e => setValorOfertaGerais(formatCurrencyInput(e.target.value))}
                            className="w-full rounded-xl border bg-black/5 dark:bg-black/25 py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-all focus:border-indigo-500"
                          />
                          <DollarSign size={16} className="absolute left-3.5 top-3.5 text-muted-foreground" />
                        </div>
                      </div>

                      {/* Valor Oferta Missões */}
                      <div className="space-y-1">
                        <label htmlFor="missoes-val" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Oferta Missões (R$)</label>
                        <div className="relative">
                          <input
                            id="missoes-val"
                            type="text"
                            placeholder="0,00"
                            value={valorOfertaMissoes}
                            onChange={e => setValorOfertaMissoes(formatCurrencyInput(e.target.value))}
                            className="w-full rounded-xl border bg-black/5 dark:bg-black/25 py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-all focus:border-indigo-500"
                          />
                          <Coins size={16} className="absolute left-3.5 top-3.5 text-muted-foreground" />
                        </div>
                      </div>

                      {/* Save Button */}
                      <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
                      >
                        {saving ? (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <>
                            <Save size={16} />
                            {editId ? 'Atualizar Lançamento' : 'Confirmar Lançamento'}
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Table Column */}
              <div className="lg:col-span-8 space-y-4">
                {/* Search Bar */}
                <div className="p-4 rounded-2xl border bg-card shadow-sm flex items-center bg-black/5 dark:bg-black/25 px-3 py-2">
                  <Search size={18} className="text-muted-foreground mr-2 shrink-0" />
                  <input
                    type="text"
                    placeholder="Filtrar lançamentos por membro ou código..."
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                    className="bg-transparent text-sm w-full outline-none text-foreground placeholder-muted-foreground"
                  />
                </div>

                {/* Table */}
                {loadingLancamentos ? (
                  <div className="p-12 text-center text-sm text-muted-foreground border rounded-2xl bg-card">Carregando lançamentos...</div>
                ) : filteredLancamentos.length === 0 ? (
                  <div className="p-12 text-center border rounded-2xl bg-card border-dashed flex flex-col items-center justify-center space-y-2">
                    <AlertCircle size={32} className="text-muted-foreground/60" />
                    <p className="text-sm font-semibold text-muted-foreground">Nenhum lançamento encontrado para este culto.</p>
                  </div>
                ) : (
                  <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
                    <div className="overflow-x-auto min-w-full">
                      <table className="min-w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-muted/30 text-xs font-semibold text-muted-foreground uppercase border-b">
                            <th className="px-5 py-4">Membro</th>
                            <th className="px-4 py-4 text-right">Dízimo</th>
                            <th className="px-4 py-4 text-right">Adoração</th>
                            <th className="px-4 py-4 text-right">Gerais</th>
                            <th className="px-4 py-4 text-right">Missões</th>
                            <th className="px-4 py-4 text-right">Total</th>
                            {canEdit && <th className="px-5 py-4 text-center">Ações</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                          {filteredLancamentos.map((l) => {
                            const totalLancado = l.valor_dizimo + l.valor_oferta_adoracao + l.valor_oferta_gerais + l.valor_oferta_missoes;
                            const isPix = l.tipo_entrada === 'pix';
                            return (
                              <tr key={l.id} className="hover:bg-muted/10 transition-colors">
                                <td className="px-5 py-4 font-semibold text-foreground">
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-1.5">
                                      <span className="truncate max-w-[150px] md:max-w-[200px]">{l.membro?.nome_completo || 'Sem Nome'}</span>
                                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                        isPix 
                                          ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20' 
                                          : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
                                      }`}>
                                        {l.tipo_entrada}
                                      </span>
                                    </div>
                                    {l.membro?.codigo_ieq && (
                                      <span className="text-[10px] text-indigo-500 font-bold mt-0.5">Cód: {l.membro.codigo_ieq}</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-right text-indigo-600 dark:text-indigo-400 font-semibold">
                                  {formatBRL(l.valor_dizimo)}
                                </td>
                                <td className="px-4 py-4 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                                  {formatBRL(l.valor_oferta_adoracao)}
                                </td>
                                <td className="px-4 py-4 text-right text-blue-600 dark:text-blue-400 font-semibold">
                                  {formatBRL(l.valor_oferta_gerais)}
                                </td>
                                <td className="px-4 py-4 text-right text-amber-600 dark:text-amber-400 font-semibold">
                                  {formatBRL(l.valor_oferta_missoes)}
                                </td>
                                <td className="px-4 py-4 text-right text-foreground font-extrabold">
                                  {formatBRL(totalLancado)}
                                </td>
                                {canEdit && (
                                  <td className="px-5 py-4 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        onClick={() => handleEditClick(l)}
                                        className="p-1.5 border hover:bg-indigo-500/10 text-indigo-500 rounded-lg transition-colors"
                                        title="Editar Lançamento"
                                      >
                                        <Edit2 size={14} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteLancamento(l.id)}
                                        className="p-1.5 border hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                                        title="Excluir Lançamento"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DizimosOfertas;
