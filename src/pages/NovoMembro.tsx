import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, usePath } from '../components/Router';
import { 
  ArrowLeft, 
  Save, 
  X, 
  Upload, 
  User, 
  FileText, 
  Calendar, 
  MapPin, 
  ShieldAlert,
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Cargo {
  id: string;
  nome: string;
}

export const NovoMembro: React.FC = () => {
  const { userDetails, isAdmin, isSecretaria } = useAuth();
  const navigate = useNavigate();
  const path = usePath();

  // Mode check (Add or Edit)
  const [editId, setEditId] = useState<string | null>(null);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [usingMocks, setUsingMocks] = useState(false);

  // Form states
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cidade, setCidade] = useState('Araguari');
  const [uf, setUf] = useState('MG');
  const [dataNascimento, setDataNascimento] = useState('');
  const [estadoCivil, setEstadoCivil] = useState<'solteiro' | 'casado' | 'divorciado' | 'viuvo' | ''>('');
  const [dataBatismo, setDataBatismo] = useState('');
  const [dataIngresso, setDataIngresso] = useState(() => {
    return new Date().toISOString().substring(0, 10); // Today's date YYYY-MM-DD
  });
  const [cargoId, setCargoId] = useState('');
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [observacoes, setObservacoes] = useState('');
  const [ativo, setAtivo] = useState(true);

  // Status/Validation states
  const [formError, setFormError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const canEdit = isAdmin || isSecretaria;

  const fetchCargos = async () => {
    try {
      const { data } = await supabase.from('cargos').select('id, nome').eq('ativo', true);
      if (data) setCargos(data);
    } catch {
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

  useEffect(() => {
    if (!canEdit) {
      navigate('/membros');
      return;
    }
    
    fetchCargos();

    // Check if we are in Edit Mode
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('edit');
    if (idParam) {
      setEditId(idParam);
      loadMemberDetails(idParam);
    }
  }, [canEdit, navigate]);

  const loadMemberDetails = async (id: string) => {
    setFetchingData(true);
    try {
      const { data, error } = await supabase
        .from('membros')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (data) {
        populateForm(data);
        setUsingMocks(false);
      }
    } catch (err) {
      console.warn('Fallback para carregamento mock de membro:', err);
      // Mocked data if table is not loaded
      // We seek in localStorage or use a template
      const mockList = [
        { id: '1', nome_completo: 'Carlos Eduardo Oliveira', telefone: '(34) 99122-3344', whatsapp: '(34) 99122-3344', endereco: 'Rua das Flores, 123', cidade: 'Araguari', uf: 'MG', data_nascimento: '1988-05-15', estado_civil: 'casado', data_batismo: '2005-10-12', data_ingresso: '2010-01-10', foto_url: null, observacoes: 'Líder de jovens há 3 anos.', ativo: true, cargo_id: '6' },
        { id: '2', nome_completo: 'Maria Eduarda Souza Silva', telefone: '(34) 99244-5566', whatsapp: '(34) 99244-5566', endereco: 'Av. Minas Gerais, 450', cidade: 'Araguari', uf: 'MG', data_nascimento: '1995-12-08', estado_civil: 'solteiro', data_batismo: '2012-06-17', data_ingresso: '2015-08-20', foto_url: null, observacoes: '', ativo: true, cargo_id: '3' },
        { id: '3', nome_completo: 'João Pedro Rezende', telefone: '(34) 98877-1122', whatsapp: '(34) 98877-1122', endereco: 'Rua Coronel Quirino, 89', cidade: 'Araguari', uf: 'MG', data_nascimento: '1975-03-24', estado_civil: 'casado', data_batismo: '1998-04-12', data_ingresso: '2002-05-14', foto_url: null, observacoes: 'Líder do ministério de casais.', ativo: true, cargo_id: '4' },
        { id: '4', nome_completo: 'Ana Beatriz Ferreira Santos', telefone: '(34) 99111-9988', whatsapp: '(34) 99111-9988', endereco: 'Rua Marcílio Dias, 1010', cidade: 'Uberlândia', uf: 'MG', data_nascimento: '2000-09-12', estado_civil: 'solteiro', data_batismo: null, data_ingresso: '2021-03-01', foto_url: null, observacoes: '', ativo: true, cargo_id: '6' },
        { id: '5', nome_completo: 'Pr. Marcos Antônio da Silva', telefone: '(34) 99900-1122', whatsapp: '(34) 99900-1122', endereco: 'Av. Bahia, 12', cidade: 'Araguari', uf: 'MG', data_nascimento: '1965-07-20', estado_civil: 'casado', data_batismo: '1980-01-01', data_ingresso: '1995-10-10', foto_url: null, observacoes: 'Pastor Titular.', ativo: true, cargo_id: '1' },
        { id: '6', nome_completo: 'Lucas Gabriel Albuquerque', telefone: '(34) 98765-4321', whatsapp: '', endereco: 'Rua São Paulo, 54', cidade: 'Araguari', uf: 'MG', data_nascimento: '1990-01-01', estado_civil: 'divorciado', data_batismo: '2010-05-05', data_ingresso: '2012-12-12', foto_url: null, observacoes: 'Inativo por mudança.', ativo: false, cargo_id: '5' }
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
    setCidade(data.cidade);
    setUf(data.uf);
    setDataNascimento(data.data_nascimento || '');
    setEstadoCivil(data.estado_civil || '');
    setDataBatismo(data.data_batismo || '');
    setDataIngresso(data.data_ingresso);
    setCargoId(String(data.cargo_id));
    setFotoUrl(data.foto_url || null);
    setImagePreview(data.foto_url || null);
    setObservacoes(data.observacoes || '');
    setAtivo(data.ativo);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFormError(null);
    if (!file) return;

    // RNF6 - Validar formato
    const validFormats = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validFormats.includes(file.type)) {
      setFormError('Formato inválido. Apenas JPG, PNG ou WEBP são permitidos.');
      return;
    }

    // RNF6 - Validar tamanho (5MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setFormError('Imagem muito grande. O tamanho máximo permitido é 5 MB.');
      return;
    }

    setFotoFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setFotoFile(null);
    setImagePreview(null);
    setFotoUrl(null);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validações obrigatórias
    if (!nomeCompleto.trim()) {
      setFormError('O nome completo é obrigatório.');
      return;
    }
    if (!cidade.trim()) {
      setFormError('A cidade é obrigatória.');
      return;
    }
    if (!uf.trim() || uf.length !== 2) {
      setFormError('A UF é obrigatória e deve conter exatamente 2 caracteres.');
      return;
    }
    if (!cargoId) {
      setFormError('O cargo ministerial é obrigatório.');
      return;
    }
    if (!dataIngresso) {
      setFormError('A data de ingresso é obrigatória.');
      return;
    }

    setLoading(true);

    try {
      let finalFotoUrl = fotoUrl;

      // Realizar upload da foto se existir arquivo selecionado
      if (fotoFile && !usingMocks) {
        const fileExt = fotoFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `avatar/${fileName}`;

        // Upload to Bucket 'membros-fotos'
        const { error: uploadErr } = await supabase.storage
          .from('membros-fotos')
          .upload(filePath, fotoFile);

        if (uploadErr) throw uploadErr;

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('membros-fotos')
          .getPublicUrl(filePath);

        finalFotoUrl = publicUrlData.publicUrl;
      } else if (fotoFile && usingMocks) {
        // Simulation preview is local base64
        finalFotoUrl = imagePreview;
      }

      const payload = {
        nome_completo: nomeCompleto.trim(),
        telefone: telefone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        endereco: endereco.trim() || null,
        cidade: cidade.trim(),
        uf: uf.trim().toUpperCase(),
        data_nascimento: dataNascimento || null,
        estado_civil: estadoCivil || null,
        data_batismo: dataBatismo || null,
        data_ingresso: dataIngresso,
        foto_url: finalFotoUrl,
        observacoes: observacoes.trim() || null,
        ativo,
        cargo_id: cargoId
      };

      if (usingMocks) {
        // Mock saving logic
        setTimeout(() => {
          alert('Membro salvo com sucesso (mock local).');
          navigate('/membros');
        }, 500);
        return;
      }

      if (editId) {
        const { error } = await supabase
          .from('membros')
          .update(payload)
          .eq('id', editId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('membros')
          .insert(payload);
        
        if (error) throw error;
      }

      alert('Membro salvo com sucesso!');
      navigate('/membros');
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar informações do membro.');
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
          Seu perfil de acesso (Pastor) não possui permissões para cadastrar ou editar membros.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      
      {/* Back button & Title */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/membros')}
            className="flex h-10 w-10 items-center justify-center rounded-xl border hover:bg-muted text-muted-foreground transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">
              {editId ? 'Editar Membro' : 'Novo Membro'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {editId ? 'Atualize as informações cadastrais do membro.' : 'Preencha os dados abaixo para cadastrar um novo membro.'}
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
        <div className="p-12 text-center text-sm text-muted-foreground">Buscando informações do membro...</div>
      ) : (
        <form onSubmit={handleSaveMember} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Foto Upload Card */}
            <div className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col items-center text-center space-y-4 h-fit">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Foto do Membro</span>
              
              <div className="relative h-36 w-36 rounded-full bg-muted border flex items-center justify-center overflow-hidden">
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="absolute right-2 top-2 h-6 w-6 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                      title="Remover foto"
                    >
                      <X size={12} />
                    </button>
                  </>
                ) : (
                  <User size={48} className="text-muted-foreground/60" />
                )}
              </div>

              <div className="space-y-2 w-full">
                <label className="flex items-center justify-center px-4 py-2 border border-dashed rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors w-full">
                  <Upload size={14} className="mr-2" />
                  Selecionar Foto
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                <p className="text-[10px] text-muted-foreground font-semibold">
                  PNG, JPG ou WEBP. Máx. 5MB.
                </p>
              </div>
            </div>

            {/* Form details */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Card: Dados Pessoais */}
              <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-base border-b pb-2 flex items-center">
                  <User size={16} className="text-indigo-500 mr-2" /> Dados Pessoais
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nome Completo <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder="Nome completo do membro"
                      value={nomeCompleto}
                      onChange={e => setNomeCompleto(e.target.value)}
                      className="w-full rounded-xl border bg-black/5 dark:bg-black/25 py-2.5 px-4 text-sm text-foreground outline-none transition-all focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Data de Nascimento</label>
                    <input
                      type="date"
                      value={dataNascimento}
                      onChange={e => setDataNascimento(e.target.value)}
                      className="w-full rounded-xl border bg-black/5 dark:bg-black/25 py-2.5 px-4 text-sm text-foreground outline-none transition-all focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Estado Civil</label>
                    <select
                      value={estadoCivil}
                      onChange={e => setEstadoCivil(e.target.value as any)}
                      className="w-full rounded-xl border bg-black/5 dark:bg-black/25 py-2.5 px-4 text-sm text-foreground outline-none transition-all focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="">Selecione...</option>
                      <option value="solteiro">Solteiro(a)</option>
                      <option value="casado">Casado(a)</option>
                      <option value="divorciado">Divorciado(a)</option>
                      <option value="viuvo">Viúvo(a)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Card: Contato e Endereço */}
              <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-base border-b pb-2 flex items-center">
                  <MapPin size={16} className="text-indigo-500 mr-2" /> Contato e Localização
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Telefone</label>
                    <input
                      type="text"
                      placeholder="(34) 99999-9999"
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
                      placeholder="Rua, número, bairro..."
                      value={endereco}
                      onChange={e => setEndereco(e.target.value)}
                      className="w-full rounded-xl border bg-black/5 dark:bg-black/25 py-2.5 px-4 text-sm text-foreground outline-none transition-all focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
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

              {/* Card: Dados Ministeriais */}
              <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-base border-b pb-2 flex items-center">
                  <Calendar size={16} className="text-indigo-500 mr-2" /> Dados Ministeriais
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cargo Ministerial <span className="text-red-500">*</span></label>
                    <select
                      value={cargoId}
                      onChange={e => setCargoId(e.target.value)}
                      className="w-full rounded-xl border bg-black/5 dark:bg-black/25 py-2.5 px-4 text-sm text-foreground outline-none transition-all focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="">Selecione...</option>
                      {cargos.map(c => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Data de Ingresso <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      value={dataIngresso}
                      onChange={e => setDataIngresso(e.target.value)}
                      className="w-full rounded-xl border bg-black/5 dark:bg-black/25 py-2.5 px-4 text-sm text-foreground outline-none transition-all focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Data de Batismo nas Águas</label>
                    <input
                      type="date"
                      value={dataBatismo}
                      onChange={e => setDataBatismo(e.target.value)}
                      className="w-full rounded-xl border bg-black/5 dark:bg-black/25 py-2.5 px-4 text-sm text-foreground outline-none transition-all focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status da Membresia</label>
                    <select
                      value={ativo ? 'ativo' : 'inativo'}
                      onChange={e => setAtivo(e.target.value === 'ativo')}
                      className="w-full rounded-xl border bg-black/5 dark:bg-black/25 py-2.5 px-4 text-sm text-foreground outline-none transition-all focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Observações</label>
                    <textarea
                      placeholder="Observações ministeriais, histórico, atividades na igreja..."
                      value={observacoes}
                      onChange={e => setObservacoes(e.target.value)}
                      rows={4}
                      className="w-full rounded-xl border bg-black/5 dark:bg-black/25 py-3 px-4 text-sm text-foreground outline-none transition-all focus:border-indigo-500 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/membros')}
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
                      Salvar Membro
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>

        </form>
      )}

    </div>
  );
};
export default NovoMembro;
