import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from '../components/Router';
import { 
  Plus, 
  Calendar, 
  Clock, 
  Edit, 
  Sparkles, 
  CalendarDays,
  Bookmark,
  ChevronRight,
  Filter,
  CheckCircle,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Culto {
  id: string;
  titulo: string;
  tipo: 'normal' | 'especial';
  descricao: string | null;
  data_culto: string;
  horario_inicio: string | null;
  horario_fim: string | null;
  criado_em: string;
}

export const Cultos: React.FC = () => {
  const { userDetails, isAdmin, isSecretaria } = useAuth();
  const navigate = useNavigate();

  const [cultos, setCultos] = useState<Culto[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMocks, setUsingMocks] = useState(false);

  // Filters
  const [tipoFilter, setTipoFilter] = useState<'todos' | 'normal' | 'especial'>('todos');
  const [periodoFilter, setPeriodoFilter] = useState<'todos' | 'futuros' | 'passados'>('futuros'); // default show future agenda

  const canEdit = isAdmin || isSecretaria;

  const fetchCultos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cultos')
        .select('*')
        .order('data_culto', { ascending: true }); // CA33 - Ordenado por data

      if (error) throw error;
      setCultos(data || []);
      setUsingMocks(false);
    } catch (err) {
      console.warn('Usando mock de cultos (tabela não criada no Supabase):', err);
      // Fallback mocks
      const mockCultos: Culto[] = [
        {
          id: '1',
          titulo: 'Culto de Celebração e Louvor',
          tipo: 'normal',
          descricao: 'Nosso tradicional culto de celebração de domingo à noite com ministração da palavra e louvor.',
          data_culto: new Date(Date.now() + 3600000 * 24 * 2).toISOString().substring(0, 10), // in 2 days
          horario_inicio: '19:00:00',
          horario_fim: '20:30:00',
          criado_em: new Date().toISOString()
        },
        {
          id: '2',
          titulo: 'Grande Culto de Milagres',
          tipo: 'especial',
          descricao: 'Culto especial com a presença do Pr. convidado e imposição de mãos. Traga a sua família!',
          data_culto: new Date(Date.now() + 3600000 * 24 * 6).toISOString().substring(0, 10), // in 6 days
          horario_inicio: '19:30:00',
          horario_fim: '21:30:00',
          criado_em: new Date().toISOString()
        },
        {
          id: '3',
          titulo: 'Culto de Doutrina e Ensino',
          tipo: 'normal',
          descricao: 'Culto de ensino bíblico e doutrina realizado todas as terças-feiras.',
          data_culto: new Date(Date.now() + 3600000 * 24 * 4).toISOString().substring(0, 10), // in 4 days
          horario_inicio: '19:30:00',
          horario_fim: '21:00:00',
          criado_em: new Date().toISOString()
        },
        {
          id: '4',
          titulo: 'Festa da Primavera Quadrangular',
          tipo: 'especial',
          descricao: 'Abertura oficial da festa de primavera da igreja com apresentações teatrais e musicais.',
          data_culto: new Date(Date.now() + 3600000 * 24 * 12).toISOString().substring(0, 10), // in 12 days
          horario_inicio: '18:00:00',
          horario_fim: '22:00:00',
          criado_em: new Date().toISOString()
        },
        {
          id: '5',
          titulo: 'Culto de Ação de Graças Passado',
          tipo: 'normal',
          descricao: 'Culto de gratidão do mês passado.',
          data_culto: new Date(Date.now() - 3600000 * 24 * 5).toISOString().substring(0, 10), // 5 days ago
          horario_inicio: '19:00:00',
          horario_fim: '20:30:00',
          criado_em: new Date().toISOString()
        }
      ];
      // Sort cronologicamente por padrão (CA33)
      mockCultos.sort((a, b) => new Date(a.data_culto).getTime() - new Date(b.data_culto).getTime());
      setCultos(mockCultos);
      setUsingMocks(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCultos();
  }, []);

  const formatDate = (dateString: string) => {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '';
    // timeString is HH:MM:SS, extract HH:MM
    const parts = timeString.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return timeString;
  };

  const getDayOfWeek = (dateString: string) => {
    const parts = dateString.split('-');
    // Create date using local timezone to avoid off-by-one errors
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return date.toLocaleDateString('pt-BR', { weekday: 'long' });
  };

  // Client-side filtering
  const todayStr = new Date().toISOString().substring(0, 10);
  
  const filteredCultos = cultos.filter(c => {
    // Tipo filter
    const matchesTipo = tipoFilter === 'todos' ? true : c.tipo === tipoFilter;
    
    // Period filter
    const matchesPeriodo = 
      periodoFilter === 'futuros' 
        ? c.data_culto >= todayStr
        : periodoFilter === 'passados'
          ? c.data_culto < todayStr
          : true; // todos

    return matchesTipo && matchesPeriodo;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Agenda de Cultos</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Programação e cronograma de cultos normais e celebrações especiais (CA33).
          </p>
        </div>
        
        {canEdit && (
          <button
            onClick={() => navigate('/cultos/novo')}
            className="flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-600/20 w-max"
          >
            <Plus size={18} className="mr-2" />
            Novo Culto
          </button>
        )}
      </div>

      {usingMocks && (
        <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-800 dark:text-yellow-300 text-xs font-semibold">
          Exibindo cultos de demonstração (mock). Alterações serão mantidas em memória.
        </div>
      )}

      {/* Filter and Navigation Options */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border bg-card shadow-sm">
        
        {/* Toggle between future / past / all */}
        <div className="flex border rounded-xl overflow-hidden p-1 bg-muted/40 max-w-max text-xs font-semibold shrink-0">
          <button
            onClick={() => setPeriodoFilter('futuros')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              periodoFilter === 'futuros'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Futuros
          </button>
          <button
            onClick={() => setPeriodoFilter('passados')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              periodoFilter === 'passados'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Histórico / Passados
          </button>
          <button
            onClick={() => setPeriodoFilter('todos')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              periodoFilter === 'todos'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Todos
          </button>
        </div>

        {/* Filter by Type */}
        <div className="flex items-center gap-2 border rounded-xl bg-black/5 dark:bg-black/25 px-3 py-2 text-xs font-semibold">
          <Filter size={14} className="text-muted-foreground shrink-0" />
          <select
            value={tipoFilter}
            onChange={e => setTipoFilter(e.target.value as any)}
            className="bg-transparent outline-none text-foreground cursor-pointer"
          >
            <option value="todos">Todos os Tipos</option>
            <option value="normal">Culto Normal</option>
            <option value="especial">Culto Especial</option>
          </select>
        </div>

      </div>

      {/* Cultos Timeline list */}
      {loading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Carregando agenda...</div>
      ) : filteredCultos.length === 0 ? (
        <div className="p-12 text-center border rounded-2xl bg-card border-dashed">
          <CalendarDays size={36} className="text-muted-foreground/60 mx-auto mb-3" />
          <p className="text-sm font-semibold text-muted-foreground">Nenhum culto agendado para esta seleção.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCultos.map((culto) => {
            const isEspecial = culto.tipo === 'especial';
            const isFuture = culto.data_culto >= todayStr;

            return (
              <motion.div
                key={culto.id}
                layoutId={culto.id}
                className={`rounded-2xl border bg-card p-6 shadow-sm flex flex-col md:flex-row gap-5 relative overflow-hidden transition-all hover:shadow-md ${
                  isEspecial 
                    ? 'border-indigo-500/30 dark:border-indigo-500/20 shadow-indigo-500/[0.02]' 
                    : ''
                } ${!isFuture ? 'opacity-75' : ''}`}
              >
                
                {/* Date Badge */}
                <div className="flex md:flex-col items-center justify-center shrink-0 p-3 rounded-xl bg-indigo-500/5 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/10 min-w-[100px] h-fit text-center">
                  <span className="text-xs uppercase font-extrabold tracking-wider">{getDayOfWeek(culto.data_culto).substring(0, 3)}</span>
                  <span className="text-2xl font-extrabold md:my-0.5">{culto.data_culto.split('-')[2]}</span>
                  <span className="text-xs font-semibold">{formatDate(culto.data_culto).substring(3, 10)}</span>
                </div>

                {/* Details */}
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    
                    {/* Culto Title */}
                    <h3 className="font-bold text-lg text-foreground leading-tight truncate">{culto.titulo}</h3>
                    
                    {/* Type Badge */}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider leading-none border ${
                      isEspecial 
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 shadow-sm shadow-amber-500/10' 
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-950 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                    }`}>
                      {isEspecial ? (
                        <>
                          <Sparkles size={10} />
                          Especial
                        </>
                      ) : (
                        'Normal'
                      )}
                    </span>
                  </div>

                  {/* Time info */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-semibold">
                    <span className="flex items-center gap-1">
                      <Clock size={14} className="text-slate-400" />
                      {formatTime(culto.horario_inicio)}
                      {culto.horario_fim && ` às ${formatTime(culto.horario_fim)}`}
                    </span>
                  </div>

                  {/* Description */}
                  {culto.descricao && (
                    <p className="text-sm text-muted-foreground font-medium line-clamp-2 pt-1">{culto.descricao}</p>
                  )}
                </div>

                {/* Edit Action for secretaria / admin */}
                {canEdit && (
                  <div className="flex items-center md:justify-end shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-muted/50">
                    <button
                      onClick={() => navigate(`/cultos/novo?edit=${culto.id}`)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/10 hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 transition-colors"
                      title="Editar Culto"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                )}
                
                {/* Visual decoration for Especial */}
                {isEspecial && (
                  <div className="absolute right-0 top-0 h-16 w-16 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full pointer-events-none" />
                )}
              </motion.div>
            );
          })}
        </div>
      )}

    </div>
  );
};
export default Cultos;
