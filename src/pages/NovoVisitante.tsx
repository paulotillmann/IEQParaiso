import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, usePath } from '../components/Router';
import { useToast } from '../contexts/ToastContext';
import { 
  ArrowLeft, 
  Save, 
  User, 
  MapPin, 
  Calendar, 
  FileText, 
  ShieldAlert,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';

interface VisitanteDetails {
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
}

export const NovoVisitante: React.FC = () => {
  const { userDetails, isAdmin, isSecretaria } = useAuth();
  const navigate = useNavigate();
  const { success } = useToast();

  // Mode check (Add or Edit)
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [usingMocks, setUsingMocks] = useState(false);

  // Form states
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [endereco, setEndereco] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('Araguari');
  const [uf, setUf] = useState('MG');
  const [quemConvidou, setQuemConvidou] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [ativo, setAtivo] = useState(true);

  // Validation
  const [formError, setFormError] = useState<string | null>(null);

  const canEdit = isAdmin || isSecretaria;

  useEffect(() => {
    if (!canEdit) {
      navigate('/visitantes');
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('edit');
    if (idParam) {
      setEditId(idParam);
      loadVisitanteDetails(idParam);
    }
  }, [canEdit, navigate]);

  const loadVisitanteDetails = async (id: string) => {
    setFetchingData(true);
    try {
      const { data, error } = await supabase
        .from('visitantes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (data) {
        populateForm(data);
        setUsingMocks(false);
      }
    } catch (err) {
      console.warn('Fallback para carregamento mock de visitante em edição:', err);
      // Fallback mocked data search
      const mockList = [
        { id: '1', nome_completo: 'Juliana Pires Martins', telefone: '(34) 99311-2233', whatsapp: '(34) 99311-2233', endereco: 'Av. Santos Dumont, 12', bairro: 'Centro', cidade: 'Araguari', uf: 'MG', quem_convidou: 'Luciana Diaconisa', observacoes: 'Primeira visita no culto de domingo à noite. Gostou muito do louvor e pediu oração pela família.', ativo: true },
        { id: '2', nome_completo: 'Roberto Albuquerque Neto', telefone: '(34) 98822-4411', whatsapp: '', endereco: 'Rua das Palmeiras, 99', bairro: 'Paraíso', cidade: 'Araguari', uf: 'MG', quem_convidou: 'Carlos Membro', observacoes: 'Visitou no culto da família. Demonstrou interesse em participar da célula de homens no bairro Paraíso.', ativo: true },
        { id: '3', nome_completo: 'Fernanda Lima Silva', telefone: '(34) 99123-4567', whatsapp: '(34) 99123-4567', endereco: 'Rua João Peixoto, 432', bairro: 'Bosque', cidade: 'Araguari', uf: 'MG', quem_convidou: 'Espontâneo', observacoes: 'Veio por conta própria após receber panfleto na rua. Solicitou visita pastoral.', ativo: true },
        { id: '4', nome_completo: 'Renato Nogueira', telefone: '(34) 99765-8822', whatsapp: '(34) 99765-8822', endereco: 'Av. João Pessoa, 555', bairro: 'Tibery', cidade: 'Uberlândia', uf: 'MG', quem_convidou: 'Pr. Marcos da Silva', observacoes: 'Visitante de Uberlândia. Estava de passagem em Araguari e assistiu ao culto da manhã.', ativo: true },
        { id: '5', nome_completo: 'Patrícia Garcia Bueno', telefone: '(34) 99988-7766', whatsapp: '(34) 99988-7766', endereco: 'Rua Paraná, 88', bairro: 'Industrial', cidade: 'Araguari', uf: 'MG', quem_convidou: 'Lucia Diaconisa', observacoes: 'Visitante antiga. Tornou-se membro regular recentemente.', ativo: false }
      ];
      
      const found = mockList.find(m => m.id === id);
      if (found) {
        populateForm(found);
        setUsingMocks(true);
      }
    } finally {
      setFetchingData(false);
    }
  };

  const populateForm = (data: any) => {
    setNomeCompleto(data.nome_completo);
    setTelefone(data.telefone || '');
    setWhatsapp(data.whatsapp || '');
    setEndereco(data.endereco || '');
    setBairro(data.bairro || '');
    setCidade(data.cidade);
    setUf(data.uf);
    setQuemConvidou(data.quem_convidou || '');
    setObservacoes(data.observacoes || '');
    setAtivo(data.ativo);
  };

  const handleSaveVisitante = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validações obrigatórias
    if (!nomeCompleto.trim()) {
      setFormError('O nome completo do visitante é obrigatório. (CA20)');
      return;
    }
    if (!cidade.trim()) {
      setFormError('A cidade é obrigatória. (CA21)');
      return;
    }
    if (!uf.trim() || uf.length !== 2) {
      setFormError('A UF é obrigatória e deve conter exatamente 2 caracteres.');
      return;
    }

    setLoading(true);

    const payload = {
      nome_completo: nomeCompleto.trim(),
      telefone: telefone.trim() || null,
      whatsapp: whatsapp.trim() || null,
      endereco: endereco.trim() || null,
      bairro: bairro.trim() || null,
      cidade: cidade.trim(),
      uf: uf.trim().toUpperCase(),
      quem_convidou: quemConvidou.trim() || null,
      observacoes: observacoes.trim() || null,
      ativo
    };

    if (usingMocks) {
      setTimeout(() => {
        success('Visitante salvo com sucesso (mock local).');
        navigate('/visitantes');
      }, 500);
      return;
    }

    try {
      if (editId) {
        const { error } = await supabase
          .from('visitantes')
          .update(payload)
          .eq('id', editId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('visitantes')
          .insert(payload);
          
        if (error) throw error;
      }

      success(editId ? 'Visitante atualizado com sucesso!' : 'Visitante cadastrado com sucesso!');
      navigate('/visitantes');
    } catch (err: any) {
      setFormError(err.message || 'Erro ao registrar visitante.');
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
          Seu perfil de acesso não possui permissões para cadastrar ou editar visitantes.
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
            onClick={() => navigate('/visitantes')}
            className="flex h-10 w-10 items-center justify-center rounded-xl border hover:bg-muted text-muted-foreground transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">
              {editId ? 'Editar Visitante' : 'Novo Visitante'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {editId ? 'Altere as informações registradas do visitante.' : 'Registre os dados de contato do visitante após o culto.'}
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
        <div className="p-12 text-center text-sm text-muted-foreground">Carregando dados do visitante...</div>
      ) : (
        <form onSubmit={handleSaveVisitante} className="space-y-6">
          
          {/* Card: Dados Básicos */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base border-b pb-2 flex items-center">
              <User size={16} className="text-indigo-500 mr-2" /> Dados Básicos e Convite
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nome Completo <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Nome completo do visitante"
                  value={nomeCompleto}
                  onChange={e => setNomeCompleto(e.target.value)}
                  className="w-full rounded-xl border bg-black/5 dark:bg-black/25 py-2.5 px-4 text-sm text-foreground outline-none transition-all focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quem Convidou</label>
                <input
                  type="text"
                  placeholder="Nome de quem convidou"
                  value={quemConvidou}
                  onChange={e => setQuemConvidou(e.target.value)}
                  className="w-full rounded-xl border bg-black/5 dark:bg-black/25 py-2.5 px-4 text-sm text-foreground outline-none transition-all focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status de Acompanhamento</label>
                <select
                  value={ativo ? 'ativo' : 'inativo'}
                  onChange={e => setAtivo(e.target.value === 'ativo')}
                  className="w-full rounded-xl border bg-black/5 dark:bg-black/25 py-2.5 px-4 text-sm text-foreground outline-none transition-all focus:border-indigo-500 cursor-pointer"
                >
                  <option value="ativo">Ativo (Em acompanhamento)</option>
                  <option value="inativo">Inativo (Concluído/Desistente)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card: Contato e Localização */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base border-b pb-2 flex items-center">
              <MapPin size={16} className="text-indigo-500 mr-2" /> Contato e Localização
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Telefone Fixo</label>
                <input
                  type="text"
                  placeholder="(34) 3241-0000"
                  value={telefone}
                  onChange={e => setTelefone(e.target.value)}
                  className="w-full rounded-xl border bg-black/5 dark:bg-black/25 py-2.5 px-4 text-sm text-foreground outline-none transition-all focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">WhatsApp</label>
                <input
                  type="text"
                  placeholder="(34) 99999-9999"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  className="w-full rounded-xl border bg-black/5 dark:bg-black/25 py-2.5 px-4 text-sm text-foreground outline-none transition-all focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Endereço Residencial</label>
                <input
                  type="text"
                  placeholder="Rua, número..."
                  value={endereco}
                  onChange={e => setEndereco(e.target.value)}
                  className="w-full rounded-xl border bg-black/5 dark:bg-black/25 py-2.5 px-4 text-sm text-foreground outline-none transition-all focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bairro</label>
                <input
                  type="text"
                  placeholder="Bairro"
                  value={bairro}
                  onChange={e => setBairro(e.target.value)}
                  className="w-full rounded-xl border bg-black/5 dark:bg-black/25 py-2.5 px-4 text-sm text-foreground outline-none transition-all focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cidade <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={cidade}
                    onChange={e => setCidade(e.target.value)}
                    className="w-full rounded-xl border bg-black/5 dark:bg-black/25 py-2.5 px-4 text-sm text-foreground outline-none transition-all focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">UF <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    maxLength={2}
                    value={uf}
                    onChange={e => setUf(e.target.value)}
                    className="w-full rounded-xl border bg-black/5 dark:bg-black/25 py-2.5 px-4 text-sm text-foreground outline-none transition-all focus:border-indigo-500 uppercase"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card: Histórico e Observações */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base border-b pb-2 flex items-center">
              <FileText size={16} className="text-indigo-500 mr-2" /> Histórico de Visitas / Acompanhamento
            </h3>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Observações do Histórico</label>
              <textarea
                placeholder="Ex: Visitou no culto de domingo, solicitou oração pela saúde, deseja receber visita na quinta-feira à tarde..."
                value={observacoes}
                onChange={e => setObservacoes(e.target.value)}
                rows={5}
                className="w-full rounded-xl border bg-black/5 dark:bg-black/25 py-3 px-4 text-sm text-foreground outline-none transition-all focus:border-indigo-500 resize-none"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/visitantes')}
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
                  Salvar Visitante
                </>
              )}
            </button>
          </div>

        </form>
      )}

    </div>
  );
};
export default NovoVisitante;
