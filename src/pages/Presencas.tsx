import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../contexts/ToastContext';
import { 
  Check, 
  Search, 
  Calendar, 
  Users, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ClipboardCheck, 
  Lock,
  Sparkles,
  Percent,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Culto {
  id: string;
  titulo: string;
  tipo: 'normal' | 'especial';
  descricao: string | null;
  data_culto: string;
  horario_inicio: string | null;
}

interface Membro {
  id: string;
  nome_completo: string;
  ativo: boolean;
  cargo_id: string;
  cargo: {
    nome: string;
  } | null;
}

export const Presencas: React.FC = () => {
  const { user, userDetails, isPastor } = useAuth();
  const { error: toastError } = useToast();

  const [cultos, setCultos] = useState<Culto[]>([]);
  const [membros, setMembros] = useState<Membro[]>([]);
  const [selectedCultoId, setSelectedCultoId] = useState<string>('');
  
  // Maps member_id -> presenca_id
  const [presencas, setPresencas] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadingPresencas, setLoadingPresencas] = useState(false);
  const [usingMocks, setUsingMocks] = useState(false);
  const [search, setSearch] = useState('');
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  // In-memory mocks for demo/fallback purposes
  const [mockPresencasMem, setMockPresencasMem] = useState<Record<string, Map<string, string>>>({});

  // Fetch cultos and members on mount
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([fetchCultos(), fetchMembros()]);
      setLoading(false);
    };
    initData();
  }, []);

  // Fetch attendance when selected culto changes
  useEffect(() => {
    if (selectedCultoId) {
      fetchPresencas(selectedCultoId);
    } else {
      setPresencas(new Map());
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
    } catch (err) {
      console.warn('Usando mock de cultos na tela de presenças:', err);
      const today = new Date();
      const mockCultos: Culto[] = [
        {
          id: 'c1',
          titulo: 'Culto de Celebração e Louvor',
          tipo: 'normal',
          descricao: 'Culto tradicional de domingo',
          data_culto: today.toISOString().substring(0, 10),
          horario_inicio: '19:00:00'
        },
        {
          id: 'c2',
          titulo: 'Grande Culto de Milagres',
          tipo: 'especial',
          descricao: 'Culto com Pr. convidado',
          data_culto: new Date(Date.now() - 3600000 * 24 * 3).toISOString().substring(0, 10), // 3 days ago
          horario_inicio: '19:30:00'
        },
        {
          id: 'c3',
          titulo: 'Culto de Doutrina e Ensino',
          tipo: 'normal',
          descricao: 'Ensino bíblico',
          data_culto: new Date(Date.now() - 3600000 * 24 * 5).toISOString().substring(0, 10), // 5 days ago
          horario_inicio: '19:30:00'
        }
      ];
      setCultos(mockCultos);
    }
  };

  const fetchMembros = async () => {
    try {
      const { data, error } = await supabase
        .from('membros')
        .select(`
          id,
          nome_completo,
          ativo,
          cargo_id,
          cargo:cargos(nome)
        `)
        .eq('ativo', true)
        .order('nome_completo', { ascending: true });

      if (error) throw error;

      const mapped = (data || []).map((m: any) => ({
        ...m,
        cargo: Array.isArray(m.cargo) ? m.cargo[0] : m.cargo
      }));
      setMembros(mapped);
    } catch (err) {
      console.warn('Usando mock de membros na tela de presenças:', err);
      const mockMembros: Membro[] = [
        { id: 'm1', nome_completo: 'Carlos Eduardo Oliveira', ativo: true, cargo_id: '6', cargo: { nome: 'Membro' } },
        { id: 'm2', nome_completo: 'Maria Eduarda Souza Silva', ativo: true, cargo_id: '3', cargo: { nome: 'Líder' } },
        { id: 'm3', nome_completo: 'João Pedro Rezende', ativo: true, cargo_id: '4', cargo: { nome: 'Diácono' } },
        { id: 'm4', nome_completo: 'Ana Beatriz Ferreira Santos', ativo: true, cargo_id: '6', cargo: { nome: 'Membro' } },
        { id: 'm5', nome_completo: 'Pr. Marcos Antônio da Silva', ativo: true, cargo_id: '1', cargo: { nome: 'Pastor' } }
      ];
      setMembros(mockMembros);
    }
  };

  const fetchPresencas = async (cultoId: string) => {
    setLoadingPresencas(true);
    try {
      const { data, error } = await supabase
        .from('presenca_membros')
        .select('id, membro_id, presente')
        .eq('culto_id', cultoId);

      if (error) throw error;

      const presencaMap = new Map<string, string>();
      (data || []).forEach((p: any) => {
        if (p.presente) {
          presencaMap.set(p.membro_id, p.id);
        }
      });
      setPresencas(presencaMap);
      setUsingMocks(false);
    } catch (err) {
      console.warn('Usando mock de presença de membros:', err);
      // Initialize mock memory for this culto if not present
      if (!mockPresencasMem[cultoId]) {
        const initialMockMap = new Map<string, string>();
        // Check some random members as present by default for older mock cultos
        if (cultoId !== 'c1') {
          initialMockMap.set('m1', 'pm1');
          initialMockMap.set('m3', 'pm3');
          initialMockMap.set('m5', 'pm5');
        }
        setMockPresencasMem(prev => ({
          ...prev,
          [cultoId]: initialMockMap
        }));
        setPresencas(initialMockMap);
      } else {
        setPresencas(mockPresencasMem[cultoId]);
      }
      setUsingMocks(true);
    } finally {
      setLoadingPresencas(false);
    }
  };

  const togglePresenca = async (membroId: string) => {
    if (isPastor) return; // Pastor is read-only
    if (!selectedCultoId) return;

    // Add to saving set to show indicator
    setSavingIds(prev => {
      const next = new Set(prev);
      next.add(membroId);
      return next;
    });

    const isCurrentlyPresent = presencas.has(membroId);
    const presencaRecordId = presencas.get(membroId);

    try {
      if (isCurrentlyPresent && presencaRecordId) {
        // DELETE presence (CA43, toggle off)
        if (!usingMocks) {
          const { error } = await supabase
            .from('presenca_membros')
            .delete()
            .eq('id', presencaRecordId);
          if (error) throw error;
        } else {
          // Mock delete
          const updatedMap = new Map(presencas);
          updatedMap.delete(membroId);
          setMockPresencasMem(prev => ({
            ...prev,
            [selectedCultoId]: updatedMap
          }));
        }

        setPresencas(prev => {
          const next = new Map(prev);
          next.delete(membroId);
          return next;
        });
      } else {
        // INSERT presence (CA43, toggle on)
        const loggedUserId = userDetails?.id || user?.id;
        const newRecordId = 'pm_' + Math.random().toString(36).substring(2, 9);

        if (!usingMocks) {
          const { data, error } = await supabase
            .from('presenca_membros')
            .insert({
              culto_id: selectedCultoId,
              membro_id: membroId,
              presente: true,
              registrado_por: loggedUserId // CA41
            })
            .select('id')
            .single();

          if (error) throw error;

          setPresencas(prev => {
            const next = new Map(prev);
            next.set(membroId, data.id);
            return next;
          });
        } else {
          // Mock insert
          const updatedMap = new Map(presencas);
          updatedMap.set(membroId, newRecordId);
          setMockPresencasMem(prev => ({
            ...prev,
            [selectedCultoId]: updatedMap
          }));

          setPresencas(prev => {
            const next = new Map(prev);
            next.set(membroId, newRecordId);
            return next;
          });
        }
      }
    } catch (err) {
      console.error('Erro ao salvar presença:', err);
      toastError('Houve um erro ao registrar a presença no banco de dados.');
    } finally {
      setSavingIds(prev => {
        const next = new Set(prev);
        next.delete(membroId);
        return next;
      });
    }
  };

  const formatDate = (dateString: string) => {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
  };

  // Filter members by search input
  const filteredMembros = membros.filter(m => 
    m.nome_completo.toLowerCase().includes(search.toLowerCase())
  );

  // Totalizers
  const totalMembrosAtivos = membros.length;
  const totalPresentes = membros.filter(m => presencas.has(m.id)).length;
  const totalAusentes = totalMembrosAtivos - totalPresentes;
  const frequenciaPercent = totalMembrosAtivos > 0 
    ? Math.round((totalPresentes / totalMembrosAtivos) * 100) 
    : 0;

  const selectedCulto = cultos.find(c => c.id === selectedCultoId);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Controle de Presença (Membros)</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Registre a frequência de membros ativos nos cultos da igreja em tempo real.
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
            <label htmlFor="culto-select" className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
              Culto Selecionado
            </label>
            {loading ? (
              <span className="text-xs text-muted-foreground font-semibold">Carregando cultos...</span>
            ) : (
              <select
                id="culto-select"
                value={selectedCultoId}
                onChange={e => setSelectedCultoId(e.target.value)}
                className="bg-transparent text-sm font-bold text-foreground outline-none border-b border-muted hover:border-indigo-500 focus:border-indigo-500 pb-1 cursor-pointer transition-colors max-w-xs md:max-w-md"
              >
                <option value="" disabled className="text-muted-foreground font-medium">Selecione um culto para marcar presença...</option>
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
          <div className="flex flex-wrap gap-2 text-xs font-semibold shrink-0">
            <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl border bg-black/5 dark:bg-black/25">
              <Clock size={14} className="text-indigo-500" />
              {selectedCulto.horario_inicio ? selectedCulto.horario_inicio.substring(0, 5) : 'Horário não cadastrado'}
            </span>
            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border ${
              selectedCulto.tipo === 'especial'
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
            }`}>
              {selectedCulto.tipo === 'especial' ? (
                <>
                  <Sparkles size={12} />
                  Especial
                </>
              ) : (
                'Culto Normal'
              )}
            </span>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!selectedCultoId ? (
          /* Placeholder - Select Culto first (CA42) */
          <motion.div
            key="select-culto-placeholder"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="p-12 text-center border-2 border-dashed rounded-3xl bg-card/50 flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto mt-6"
          >
            <div className="h-16 w-16 rounded-full bg-indigo-500/5 text-indigo-500 border border-indigo-500/10 flex items-center justify-center shadow-inner">
              <ClipboardCheck size={32} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground">Escolha um Culto</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
                Para iniciar a chamada e registrar presenças, selecione um culto ativo no seletor acima.
              </p>
            </div>
          </motion.div>
        ) : (
          /* Attendance panel */
          <motion.div
            key="attendance-panel"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Totalizers cards (CA43 real-time state) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Members */}
              <div className="p-5 rounded-2xl border bg-card shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">Membros Ativos</span>
                  <span className="text-3xl font-extrabold">{totalMembrosAtivos}</span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400 flex items-center justify-center">
                  <Users size={20} />
                </div>
              </div>

              {/* Present */}
              <div className="p-5 rounded-2xl border bg-card shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">Presentes</span>
                  <span className="text-3xl font-extrabold text-emerald-500">{totalPresentes}</span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 size={20} />
                </div>
              </div>

              {/* Absent */}
              <div className="p-5 rounded-2xl border bg-card shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">Ausentes</span>
                  <span className="text-3xl font-extrabold text-red-500">{totalAusentes}</span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
                  <XCircle size={20} />
                </div>
              </div>

              {/* Frequency % */}
              <div className="p-5 rounded-2xl border bg-card shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">Frequência</span>
                  <span className="text-3xl font-extrabold text-indigo-500">{frequenciaPercent}%</span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Percent size={18} />
                </div>
              </div>
            </div>

            {/* Toolbar: Search and Read-only warning */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border bg-card shadow-sm">
              <div className="flex items-center border rounded-xl bg-black/5 dark:bg-black/25 px-3 py-2 w-full max-w-sm">
                <Search size={18} className="text-muted-foreground mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Pesquisar membro por nome..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="bg-transparent text-sm w-full outline-none text-foreground placeholder-muted-foreground"
                />
              </div>

              {isPastor && (
                <div className="flex items-center gap-2 px-4 py-2 border border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs font-semibold rounded-xl w-fit">
                  <Lock size={14} className="shrink-0" />
                  <span>Perfil Pastor: Apenas visualização da frequência (Modo Leitura).</span>
                </div>
              )}
            </div>

            {/* Members List */}
            {loadingPresencas ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Carregando lista de chamada...</div>
            ) : filteredMembros.length === 0 ? (
              <div className="p-8 text-center border rounded-2xl bg-card border-dashed">
                <AlertCircle size={32} className="text-muted-foreground/60 mx-auto mb-2" />
                <p className="text-sm font-semibold text-muted-foreground">Nenhum membro encontrado.</p>
              </div>
            ) : (
              <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto min-w-full">
                  <table className="min-w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/30 text-xs font-semibold text-muted-foreground uppercase border-b">
                        <th className="px-6 py-4">Membro</th>
                        <th className="px-6 py-4">Cargo</th>
                        <th className="px-6 py-4 text-center">Frequência</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                      {filteredMembros.map((membro) => {
                        const isPresent = presencas.has(membro.id);
                        const isSaving = savingIds.has(membro.id);

                        return (
                          <tr key={membro.id} className="hover:bg-muted/10 transition-colors">
                            {/* Member profile info */}
                            <td className="px-6 py-4 font-semibold text-foreground">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-xs shrink-0 select-none">
                                  {membro.nome_completo.substring(0, 2).toUpperCase()}
                                </div>
                                <span>{membro.nome_completo}</span>
                              </div>
                            </td>

                            {/* Cargo */}
                            <td className="px-6 py-4 text-muted-foreground font-semibold">
                              {membro.cargo?.nome || 'Nenhum'}
                            </td>

                            {/* Checkbox (toggle / attendance control) */}
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center">
                                <button
                                  disabled={isPastor || isSaving}
                                  onClick={() => togglePresenca(membro.id)}
                                  className={`h-6 w-6 rounded-lg border flex items-center justify-center transition-all ${
                                    isPresent
                                      ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                                      : 'border-muted hover:border-slate-400 dark:hover:border-slate-600 bg-background'
                                  } ${isPastor ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'} ${
                                    isSaving ? 'animate-pulse' : ''
                                  }`}
                                  title={
                                    isPastor 
                                      ? 'Modo de leitura. Apenas pastor pode ver' 
                                      : isPresent 
                                        ? 'Marcar como ausente' 
                                        : 'Marcar como presente'
                                  }
                                >
                                  {isSaving ? (
                                    <span className="h-2 w-2 rounded-full bg-current animate-ping" />
                                  ) : isPresent ? (
                                    <Check size={14} className="stroke-[3]" />
                                  ) : null}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
export default Presencas;
