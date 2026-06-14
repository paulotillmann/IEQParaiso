import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, usePath } from '../components/Router';
import { 
  ArrowLeft, 
  Printer, 
  Edit, 
  User, 
  MapPin, 
  Calendar, 
  Phone, 
  Mail, 
  Clock, 
  FileText,
  Bookmark
} from 'lucide-react';
import logoPreta from '@/logos/logo_preta.png';

interface MembroDetails {
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
  observacoes: string | null;
  ativo: boolean;
  cargo_id: string;
  criado_em: string;
  codigo_ieq: number | null;
  cargo: {
    nome: string;
  } | null;
}

export const FichaMembro: React.FC = () => {
  const { userDetails, isAdmin, isSecretaria } = useAuth();
  const navigate = useNavigate();
  const pathname = usePath();

  const [membro, setMembro] = useState<MembroDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingMocks, setUsingMocks] = useState(false);

  const canEdit = isAdmin || isSecretaria;

  // Extract ID from pathname e.g. /membros/123
  const memberId = pathname.split('/').pop() || '';

  const loadMember = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('membros')
        .select(`
          *,
          cargo:cargos(nome)
        `)
        .eq('id', memberId)
        .single();

      if (error) throw error;

      if (data) {
        const mapped = {
          ...data,
          cargo: Array.isArray(data.cargo) ? data.cargo[0] : data.cargo
        } as MembroDetails;
        
        setMembro(mapped);
        setUsingMocks(false);
      }
    } catch (err) {
      console.warn('Fallback para carregamento mock da ficha do membro:', err);
      // Fallback mocks
      const mockList = [
        { id: '1', nome_completo: 'Carlos Eduardo Oliveira', telefone: '(34) 99122-3344', whatsapp: '(34) 99122-3344', endereco: 'Rua das Flores, 123', cidade: 'Araguari', uf: 'MG', data_nascimento: '1988-05-15', estado_civil: 'casado', data_batismo: '2005-10-12', data_ingresso: '2010-01-10', foto_url: null, observacoes: 'Líder de jovens há 3 anos. Sempre ativo e prestativo.', ativo: true, cargo_id: '6', criado_em: new Date().toISOString(), codigo_ieq: 1001, cargo: { nome: 'Membro' } },
        { id: '2', nome_completo: 'Maria Eduarda Souza Silva', telefone: '(34) 99244-5566', whatsapp: '(34) 99244-5566', endereco: 'Av. Minas Gerais, 450', cidade: 'Araguari', uf: 'MG', data_nascimento: '1995-12-08', estado_civil: 'solteiro', data_batismo: '2012-06-17', data_ingresso: '2015-08-20', foto_url: null, observacoes: 'Ministério de louvor e adoração.', ativo: true, cargo_id: '3', criado_em: new Date().toISOString(), codigo_ieq: null, cargo: { nome: 'Líder' } },
        { id: '3', nome_completo: 'João Pedro Rezende', telefone: '(34) 98877-1122', whatsapp: '(34) 98877-1122', endereco: 'Rua Coronel Quirino, 89', cidade: 'Araguari', uf: 'MG', data_nascimento: '1975-03-24', estado_civil: 'casado', data_batismo: '1998-04-12', data_ingresso: '2002-05-14', foto_url: null, observacoes: 'Líder do ministério de casais. Membro do Conselho.', ativo: true, cargo_id: '4', criado_em: new Date().toISOString(), codigo_ieq: 1003, cargo: { nome: 'Diácono' } },
        { id: '4', nome_completo: 'Ana Beatriz Ferreira Santos', telefone: '(34) 99111-9988', whatsapp: '(34) 99111-9988', endereco: 'Rua Marcílio Dias, 1010', cidade: 'Uberlândia', uf: 'MG', data_nascimento: '2000-09-12', estado_civil: 'solteiro', data_batismo: null, data_ingresso: '2021-03-01', foto_url: null, observacoes: 'Estudante universitária.', ativo: true, cargo_id: '6', criado_em: new Date().toISOString(), codigo_ieq: 1004, cargo: { nome: 'Membro' } },
        { id: '5', nome_completo: 'Pr. Marcos Antônio da Silva', telefone: '(34) 99900-1122', whatsapp: '(34) 99900-1122', endereco: 'Av. Bahia, 12', cidade: 'Araguari', uf: 'MG', data_nascimento: '1965-07-20', estado_civil: 'casado', data_batismo: '1980-01-01', data_ingresso: '1995-10-10', foto_url: null, observacoes: 'Pastor Titular e Presidente Regional.', ativo: true, cargo_id: '1', criado_em: new Date().toISOString(), codigo_ieq: 1005, cargo: { nome: 'Pastor' } },
        { id: '6', nome_completo: 'Lucas Gabriel Albuquerque', telefone: '(34) 98765-4321', whatsapp: '', endereco: 'Rua São Paulo, 54', cidade: 'Araguari', uf: 'MG', data_nascimento: '1990-01-01', estado_civil: 'divorciado', data_batismo: '2010-05-05', data_ingresso: '2012-12-12', foto_url: null, observacoes: 'Mudou-se para outra cidade no final de 2025.', ativo: false, cargo_id: '5', criado_em: new Date().toISOString(), codigo_ieq: null, cargo: { nome: 'Obreiro' } }
      ];

      const found = mockList.find(m => m.id === memberId);
      if (found) {
        setMembro(found);
        setUsingMocks(true);
      } else {
        setMembro(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (memberId) {
      loadMember();
    }
  }, [memberId]);

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return <span className="italic text-muted-foreground/60">Não informado</span>;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      // YYYY-MM-DD to DD/MM/YYYY
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };

  const formatEstadoCivil = (status: string | null) => {
    switch (status) {
      case 'solteiro': return 'Solteiro(a)';
      case 'casado': return 'Casado(a)';
      case 'divorciado': return 'Divorciado(a)';
      case 'viuvo': return 'Viúvo(a)';
      default: return <span className="italic text-muted-foreground/60">Não informado</span>;
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-sm text-muted-foreground">Buscando ficha do membro...</div>
    );
  }

  if (!membro) {
    return (
      <div className="text-center p-12 space-y-4">
        <h2 className="text-lg font-bold">Membro não encontrado</h2>
        <button
          onClick={() => navigate('/membros')}
          className="px-4 py-2 border rounded-xl text-sm font-semibold hover:bg-muted"
        >
          Voltar para Lista
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      
      {/* Print styles override (Hidden sidebar and background normalization for printer) */}
      <style>{`
        @media print {
          /* Hide sidebars, buttons, layouts */
          header, aside, button, nav, footer, .no-print {
            display: none !important;
          }
          /* Reset root layout constraints to allow natural multi-page pagination */
          html, body, #root, 
          #root > div, 
          div.min-w-0, 
          main {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            min-height: 0 !important;
            display: block !important;
            position: relative !important;
          }
          .print-container {
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            padding: 20px !important;
            max-width: 100% !important;
          }
          .print-header {
            display: flex !important;
            align-items: center !important;
            border-bottom: 2px solid #333 !important;
            padding-bottom: 15px !important;
            margin-bottom: 25px !important;
          }
          .print-card {
            border: 1px solid #ccc !important;
            border-radius: 8px !important;
            padding: 20px !important;
            margin-bottom: 20px !important;
            page-break-inside: avoid !important;
          }
          .print-title {
            font-size: 18px !important;
            font-weight: bold !important;
            border-bottom: 1px solid #ddd !important;
            padding-bottom: 5px !important;
            margin-bottom: 15px !important;
          }
          .print-grid {
            display: grid !important;
            grid-template-cols: 1fr 1fr !important;
            gap: 15px !important;
          }
        }
      `}</style>

      {/* Action panel (Hidden on print) */}
      <div className="flex items-center justify-between border-b pb-4 no-print">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/membros')}
            className="flex h-10 w-10 items-center justify-center rounded-xl border hover:bg-muted text-muted-foreground transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Ficha do Membro</h1>
            <p className="text-xs text-muted-foreground">Visualização de prontuário ministerial individual.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center px-4 py-2 border hover:bg-muted text-foreground text-sm font-semibold rounded-xl transition-all"
          >
            <Printer size={16} className="mr-2" />
            Imprimir Ficha
          </button>
          
          {canEdit && (
            <button
              onClick={() => navigate(`/membros/novo?edit=${membro.id}`)}
              className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/20"
            >
              <Edit size={16} className="mr-2" />
              Editar Cadastro
            </button>
          )}
        </div>
      </div>

      {usingMocks && (
        <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-800 dark:text-yellow-300 text-xs font-semibold no-print">
          Exibindo informações de demonstração (mock).
        </div>
      )}

      {/* Main Print Container */}
      <div className="print-container space-y-6">
        
        {/* Print Only Header (Hidden on screen) */}
        <div className="hidden print-header">
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 w-full">
            <div className="flex items-center gap-4">
              <img src={logoPreta} alt="Logo IEQ Paraíso" className="h-14 w-auto object-contain" />
            </div>
            <div className="text-right text-xs text-gray-500 font-semibold">
              <p className="font-bold text-slate-800">FICHA DE MEMBRO</p>
              <p>Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </div>

        {/* Member Profile Header */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="h-28 w-28 rounded-full border bg-muted flex items-center justify-center overflow-hidden shrink-0">
            {membro.foto_url ? (
              <img src={membro.foto_url} alt={membro.nome_completo} className="h-full w-full object-cover" />
            ) : (
              <User size={48} className="text-muted-foreground/50" />
            )}
          </div>

          <div className="flex-1 flex flex-col justify-center text-center sm:text-left space-y-2.5">
            <div className="space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 justify-center sm:justify-start">
                <h2 className="text-2xl font-bold text-foreground">{membro.nome_completo}</h2>
                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider leading-none w-max mx-auto sm:mx-0 ${
                  membro.ativo 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                    : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                }`}>
                  {membro.ativo ? 'Membro Ativo' : 'Membro Inativo'}
                </span>
              </div>
              <p className="text-sm text-indigo-600 dark:text-indigo-400 font-bold">
                {membro.cargo?.nome || 'Membro regular'}
              </p>
            </div>

            <div className="flex flex-wrap justify-center sm:justify-start gap-y-2 gap-x-4 text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-slate-400" />
                {membro.cidade} - {membro.uf}
              </span>
              {membro.whatsapp && (
                <span className="flex items-center gap-1.5">
                  <Phone size={14} className="text-emerald-500" />
                  {membro.whatsapp}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card: Dados Pessoais */}
          <div className="print-card rounded-2xl border bg-card p-6 shadow-sm space-y-4">
            <h3 className="print-title font-bold text-base border-b pb-2 flex items-center">
              <User size={16} className="text-indigo-500 mr-2 no-print" /> Dados Pessoais e Contato
            </h3>

            <div className="print-grid space-y-3.5 text-sm font-medium">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Data de Nascimento:</span>
                <span className="text-foreground">{formatDate(membro.data_nascimento)}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Estado Civil:</span>
                <span className="text-foreground">{formatEstadoCivil(membro.estado_civil)}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Telefone Fixo:</span>
                <span className="text-foreground">{membro.telefone || <span className="italic text-xs text-muted-foreground/60">Não cadastrado</span>}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Endereço Residencial:</span>
                <span className="text-foreground text-right max-w-xs">{membro.endereco || <span className="italic text-xs text-muted-foreground/60">Não informado</span>}</span>
              </div>
            </div>
          </div>

          {/* Card: Dados Ministeriais */}
          <div className="print-card rounded-2xl border bg-card p-6 shadow-sm space-y-4">
            <h3 className="print-title font-bold text-base border-b pb-2 flex items-center">
              <Bookmark size={16} className="text-indigo-500 mr-2 no-print" /> Dados Eclesiásticos
            </h3>

            <div className="print-grid space-y-3.5 text-sm font-medium">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Código IEQ:</span>
                <span className="text-foreground font-bold">{membro.codigo_ieq || <span className="italic text-xs text-muted-foreground/60">Não informado</span>}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Cargo Ministerial:</span>
                <span className="text-foreground font-bold text-indigo-600 dark:text-indigo-400">{membro.cargo?.nome || 'Nenhum'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Data de Ingresso:</span>
                <span className="text-foreground">{formatDate(membro.data_ingresso)}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Data do Batismo:</span>
                <span className="text-foreground">{formatDate(membro.data_batismo)}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Ficha Criada em:</span>
                <span className="text-foreground">{new Date(membro.criado_em).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>

          {/* Card: Observações (Col-span 2) */}
          <div className="print-card rounded-2xl border bg-card p-6 shadow-sm space-y-3 sm:col-span-2">
            <h3 className="print-title font-bold text-base border-b pb-2 flex items-center">
              <FileText size={16} className="text-indigo-500 mr-2 no-print" /> Observações do Membro
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground font-semibold italic">
              {membro.observacoes || 'Sem observações adicionais gravadas nesta ficha.'}
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
export default FichaMembro;
