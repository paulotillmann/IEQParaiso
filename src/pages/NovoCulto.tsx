import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, usePath } from '../components/Router';
import { 
  ArrowLeft, 
  Save, 
  Calendar, 
  Clock, 
  FileText, 
  Sparkles,
  ShieldAlert,
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';

export const NovoCulto: React.FC = () => {
  const { userDetails, isAdmin, isSecretaria } = useAuth();
  const navigate = useNavigate();

  // Mode check (Add or Edit)
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [usingMocks, setUsingMocks] = useState(false);

  // Form states
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<'normal' | 'especial'>('normal');
  const [dataCulto, setDataCulto] = useState(() => {
    return new Date().toISOString().substring(0, 10); // Default to today
  });
  const [horarioInicio, setHorarioInicio] = useState('19:00');
  const [horarioFim, setHorarioFim] = useState('20:30');
  const [descricao, setDescricao] = useState('');

  // Validations
  const [formError, setFormError] = useState<string | null>(null);

  const canEdit = isAdmin || isSecretaria;

  useEffect(() => {
    if (!canEdit) {
      navigate('/cultos');
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('edit');
    if (idParam) {
      setEditId(idParam);
      loadCultoDetails(idParam);
    }
  }, [canEdit, navigate]);

  const loadCultoDetails = async (id: string) => {
    setFetchingData(true);
    try {
      const { data, error } = await supabase
        .from('cultos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (data) {
        populateForm(data);
        setUsingMocks(false);
      }
    } catch (err) {
      console.warn('Fallback para carregamento mock de culto em edição:', err);
      // Fallback mocks
      const mockList = [
        { id: '1', titulo: 'Culto de Celebração e Louvor', tipo: 'normal', descricao: 'Nosso tradicional culto de celebração de domingo à noite com ministração da palavra e louvor.', data_culto: new Date(Date.now() + 3600000 * 24 * 2).toISOString().substring(0, 10), horario_inicio: '19:00:00', horario_fim: '20:30:00' },
        { id: '2', titulo: 'Grande Culto de Milagres', tipo: 'especial', descricao: 'Culto especial com a presença do Pr. convidado e imposição de mãos. Traga a sua família!', data_culto: new Date(Date.now() + 3600000 * 24 * 6).toISOString().substring(0, 10), horario_inicio: '19:30:00', horario_fim: '21:30:00' },
        { id: '3', titulo: 'Culto de Doutrina e Ensino', tipo: 'normal', descricao: 'Culto de ensino bíblico e doutrina realizado todas as terças-feiras.', data_culto: new Date(Date.now() + 3600000 * 24 * 4).toISOString().substring(0, 10), horario_inicio: '19:30:00', horario_fim: '21:00:00' },
        { id: '4', titulo: 'Festa da Primavera Quadrangular', tipo: 'especial', descricao: 'Abertura oficial da festa de primavera da igreja com apresentações teatrais e musicais.', data_culto: new Date(Date.now() + 3600000 * 24 * 12).toISOString().substring(0, 10), horario_inicio: '18:00:00', horario_fim: '22:00:00' }
      ];

      const found = mockList.find(c => c.id === id);
      if (found) {
        populateForm(found);
        setUsingMocks(true);
      }
    } finally {
      setFetchingData(false);
    }
  };

  const populateForm = (data: any) => {
    setTitulo(data.titulo);
    setTipo(data.tipo);
    setDataCulto(data.data_culto);
    // Format times from HH:MM:SS to HH:MM
    setHorarioInicio(data.horario_inicio ? data.horario_inicio.substring(0, 5) : '19:00');
    setHorarioFim(data.horario_fim ? data.horario_fim.substring(0, 5) : '20:30');
    setDescricao(data.descricao || '');
  };

  const handleSaveCulto = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validações obrigatórias
    if (!titulo.trim()) {
      setFormError('O título do culto é obrigatório. (CA32)');
      return;
    }
    if (!tipo) {
      setFormError('O tipo do culto (Normal / Especial) é obrigatório. (CA31)');
      return;
    }
    if (!dataCulto) {
      setFormError('A data do culto é obrigatória. (CA30)');
      return;
    }

    setLoading(true);

    // Prepare payload
    // Time values should be HH:MM:SS or null
    const payload = {
      titulo: titulo.trim(),
      tipo,
      data_culto: dataCulto,
      horario_inicio: horarioInicio ? `${horarioInicio}:00` : null,
      horario_fim: horarioFim ? `${horarioFim}:00` : null,
      descricao: descricao.trim() || null
    };

    if (usingMocks) {
      setTimeout(() => {
        alert('Culto salvo com sucesso (mock local).');
        navigate('/cultos');
      }, 500);
      return;
    }

    try {
      if (editId) {
        const { error } = await supabase
          .from('cultos')
          .update(payload)
          .eq('id', editId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cultos')
          .insert(payload);

        if (error) throw error;
      }

      alert('Culto agendado com sucesso!');
      navigate('/cultos');
    } catch (err: any) {
      setFormError(err.message || 'Erro ao registrar culto no banco.');
    } finally {
      setLoading(false);
    }
  };

  if (!canEdit) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center">
        <ShieldAlert size={48} className="text-red-500 animate-pulse" />
        <h2 className="text-xl font-bold">Acesso Negado</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Seu perfil de acesso (Pastor) não possui permissões para cadastrar ou editar cultos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      
      {/* Back button & Title */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/cultos')}
            className="flex h-10 w-10 items-center justify-center rounded-xl border hover:bg-muted text-muted-foreground transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">
              {editId ? 'Editar Culto' : 'Novo Culto'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {editId ? 'Altere as informações do culto agendado.' : 'Agende uma nova celebração na agenda da igreja.'}
            </p>
          </div>
        </div>
      </div>

      {formError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-600 dark:text-red-400 font-medium">
          {formError}
        </div>
      )}

      {usingMocks && (
        <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-800 dark:text-yellow-300 text-xs font-semibold">
          Modo de Demonstração (Mock) ativo.
        </div>
      )}

      {fetchingData ? (
        <div className="p-12 text-center text-sm text-muted-foreground">Buscando dados do culto...</div>
      ) : (
        <form onSubmit={handleSaveCulto} className="space-y-6">
          
          {/* Card: Dados do Culto */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base border-b pb-2 flex items-center">
              <Calendar size={16} className="text-indigo-500 mr-2" /> Informações do Culto
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Título do Culto <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Ex: Culto da Família, Grande Culto de Missões..."
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  className="w-full rounded-xl border bg-black/5 dark:bg-black/25 py-2.5 px-4 text-sm text-foreground outline-none transition-all focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tipo de Culto <span className="text-red-500">*</span></label>
                <select
                  value={tipo}
                  onChange={e => setTipo(e.target.value as any)}
                  className="w-full rounded-xl border bg-black/5 dark:bg-black/25 py-2.5 px-4 text-sm text-foreground outline-none transition-all focus:border-indigo-500 cursor-pointer"
                >
                  <option value="normal">Culto Normal</option>
                  <option value="especial">Culto Especial (Festas, Missões, Convidado)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Data do Culto <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={dataCulto}
                  onChange={e => setDataCulto(e.target.value)}
                  className="w-full rounded-xl border bg-black/5 dark:bg-black/25 py-2.5 px-4 text-sm text-foreground outline-none transition-all focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center"><Clock size={12} className="mr-1 text-slate-400" /> Horário de Início</label>
                <input
                  type="time"
                  value={horarioInicio}
                  onChange={e => setHorarioInicio(e.target.value)}
                  className="w-full rounded-xl border bg-black/5 dark:bg-black/25 py-2.5 px-4 text-sm text-foreground outline-none transition-all focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center"><Clock size={12} className="mr-1 text-slate-400" /> Horário de Término</label>
                <input
                  type="time"
                  value={horarioFim}
                  onChange={e => setHorarioFim(e.target.value)}
                  className="w-full rounded-xl border bg-black/5 dark:bg-black/25 py-2.5 px-4 text-sm text-foreground outline-none transition-all focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Descrição / Observações</label>
                <textarea
                  placeholder="Detalhes adicionais, pregador convidado, temas e escalas..."
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border bg-black/5 dark:bg-black/25 py-3 px-4 text-sm text-foreground outline-none transition-all focus:border-indigo-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/cultos')}
              className="px-5 py-3 border rounded-xl text-sm font-semibold hover:bg-muted transition-all"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <Save size={16} />
                  Salvar Culto
                </>
              )}
            </button>
          </div>

        </form>
      )}

    </div>
  );
};
export default NovoCulto;
