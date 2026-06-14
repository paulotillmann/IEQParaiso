import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../contexts/ToastContext';
import { 
  Plus, 
  Edit2, 
  ToggleLeft, 
  ToggleRight,
  Info,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Cargo {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  criado_em: string;
}

export const Cargos: React.FC = () => {
  const { userDetails, isAdmin } = useAuth();
  const { error: toastError } = useToast();
  
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMocks, setUsingMocks] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Form state
  const [editId, setEditId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchCargos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cargos')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      setCargos(data || []);
      setUsingMocks(false);
    } catch (err) {
      console.warn('Usando mock de cargos (tabela não criada no Supabase):', err);
      // Fallback mocks representing default PRD cargos
      setCargos([
        { id: '1', nome: 'Pastor', descricao: 'Pastor titular ou auxiliar da igreja', ativo: true, criado_em: new Date().toISOString() },
        { id: '2', nome: 'Secretária', descricao: 'Responsável pela gestão administrativa', ativo: true, criado_em: new Date().toISOString() },
        { id: '3', nome: 'Líder', descricao: 'Líder de célula ou ministério', ativo: true, criado_em: new Date().toISOString() },
        { id: '4', nome: 'Diácono', descricao: 'Membro integrado ao corpo diaconal', ativo: true, criado_em: new Date().toISOString() },
        { id: '5', nome: 'Obreiro', descricao: 'Obreiro credenciado', ativo: true, criado_em: new Date().toISOString() },
        { id: '6', nome: 'Membro', descricao: 'Membro comungante regular', ativo: true, criado_em: new Date().toISOString() }
      ]);
      setUsingMocks(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCargos();
  }, []);

  const openAddModal = () => {
    if (!isAdmin) return;
    setEditId(null);
    setNome('');
    setDescricao('');
    setAtivo(true);
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (cargo: Cargo) => {
    if (!isAdmin) return;
    setEditId(cargo.id);
    setNome(cargo.nome);
    setDescricao(cargo.descricao || '');
    setAtivo(cargo.ativo);
    setFormError(null);
    setShowModal(true);
  };

  const handleSaveCargo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setFormError(null);

    // Validações
    if (!nome.trim()) {
      setFormError('O nome do cargo é obrigatório.');
      return;
    }

    // CA4 - Verificar duplicidade local
    const duplicado = cargos.some(c => 
      c.nome.toLowerCase() === nome.trim().toLowerCase() && c.id !== editId
    );
    if (duplicado) {
      setFormError('Já existe um cargo cadastrado com este nome.');
      return;
    }

    setSubmitting(true);

    if (usingMocks) {
      // Mock saving logic
      setTimeout(() => {
        if (editId) {
          setCargos(prev => prev.map(c => 
            c.id === editId 
              ? { ...c, nome: nome.trim(), descricao: descricao.trim() || null, ativo }
              : c
          ));
        } else {
          const newCargo: Cargo = {
            id: String(cargos.length + 1),
            nome: nome.trim(),
            descricao: descricao.trim() || null,
            ativo: true,
            criado_em: new Date().toISOString()
          };
          setCargos(prev => [...prev, newCargo]);
        }
        setSubmitting(false);
        setShowModal(false);
      }, 500);
      return;
    }

    try {
      if (editId) {
        const { error } = await supabase
          .from('cargos')
          .update({
            nome: nome.trim(),
            descricao: descricao.trim() || null,
            ativo
          })
          .eq('id', editId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cargos')
          .insert({
            nome: nome.trim(),
            descricao: descricao.trim() || null,
            ativo: true
          });
        
        if (error) throw error;
      }
      
      await fetchCargos();
      setShowModal(false);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar cargo no banco.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (cargo: Cargo) => {
    if (!isAdmin) return;

    if (usingMocks) {
      setCargos(prev => prev.map(c => 
        c.id === cargo.id ? { ...c, ativo: !c.ativo } : c
      ));
      return;
    }

    try {
      const { error } = await supabase
        .from('cargos')
        .update({ ativo: !cargo.ativo })
        .eq('id', cargo.id);

      if (error) throw error;
      await fetchCargos();
    } catch (err: any) {
      toastError(err.message || 'Erro ao alterar status do cargo.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Cargos Ministeriais</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Cadastro e listagem dos cargos utilizados na membresia da igreja.
          </p>
        </div>
        
        {/* Only Admin can add cargos */}
        {isAdmin && (
          <button
            onClick={openAddModal}
            className="flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-600/20 w-max"
          >
            <Plus size={18} className="mr-2" />
            Novo Cargo
          </button>
        )}
      </div>

      {/* Warning if mocks are active */}
      {usingMocks && (
        <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-800 dark:text-yellow-300 text-xs font-semibold">
          Exibindo cargos de demonstração (mock). Alterações serão salvas localmente na memória.
        </div>
      )}

      {/* Cargos List Table */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Carregando cargos...</div>
        ) : cargos.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhum cargo encontrado.</div>
        ) : (
          <div className="overflow-x-auto min-w-full">
            <table className="min-w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 text-xs font-semibold text-muted-foreground uppercase border-b">
                  <th className="px-6 py-4">Nome do Cargo</th>
                  <th className="px-6 py-4">Descrição</th>
                  <th className="px-6 py-4">Status</th>
                  {isAdmin && <th className="px-6 py-4 text-right">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {cargos.map((cargo) => (
                  <tr key={cargo.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 font-semibold text-foreground">
                      {cargo.nome}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground max-w-xs truncate">
                      {cargo.descricao || <span className="italic text-xs text-muted-foreground/60">Sem descrição</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase leading-none ${
                        cargo.ativo 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}>
                        {cargo.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    
                    {/* Admin Actions */}
                    {isAdmin && (
                      <td className="px-6 py-4 text-right space-x-2 shrink-0">
                        <button
                          onClick={() => openEditModal(cargo)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Editar Cargo"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(cargo)}
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                            cargo.ativo 
                              ? 'border-red-500/20 hover:bg-red-500/10 text-red-500' 
                              : 'border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-500'
                          }`}
                          title={cargo.ativo ? 'Inativar Cargo' : 'Ativar Cargo'}
                        >
                          {cargo.ativo ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info notice about physical deletion */}
      <div className="flex items-center gap-3 p-4 rounded-xl border bg-muted/20 text-muted-foreground text-xs font-semibold">
        <Info size={16} className="text-indigo-500 shrink-0" />
        <span>
          <strong>Nota de Regra de Negócio:</strong> De acordo com os critérios de aceitação (CA4), a exclusão física de cargos é proibida. Caso um cargo não seja mais necessário, utilize o botão de inativação para bloquear novas membresias neste cargo.
        </span>
      </div>

      {/* Modal - Add/Edit Cargo */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black"
            />
            
            {/* Card Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-card text-card-foreground rounded-2xl border p-6 w-full max-w-md shadow-xl relative z-10 space-y-4"
            >
              <div>
                <h3 className="text-lg font-bold">
                  {editId ? 'Editar Cargo Ministerial' : 'Adicionar Cargo Ministerial'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Preencha as informações necessárias para salvar o cargo.
                </p>
              </div>

              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-600 dark:text-red-400 font-medium">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSaveCargo} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Nome do Cargo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Diácono, Obreiro..."
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    className="w-full rounded-xl border bg-black/5 dark:bg-black/25 py-3 px-4 text-sm text-foreground outline-none transition-all focus:border-indigo-500"
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Descrição
                  </label>
                  <textarea
                    placeholder="Breve resumo das atividades do cargo..."
                    value={descricao}
                    onChange={e => setDescricao(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border bg-black/5 dark:bg-black/25 py-3 px-4 text-sm text-foreground outline-none transition-all focus:border-indigo-500 resize-none"
                    disabled={submitting}
                  />
                </div>

                {/* Edit status - Active/Inactive toggle in form */}
                {editId && (
                  <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/10">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">Status do Cargo</span>
                      <span className="text-[10px] text-muted-foreground">Inativar o cargo impede que novos membros o usem.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAtivo(!ativo)}
                      className="text-indigo-600 hover:text-indigo-500 transition-colors"
                    >
                      {ativo ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                    </button>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border rounded-xl text-sm font-semibold hover:bg-muted transition-all"
                    disabled={submitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
                    disabled={submitting}
                  >
                    {submitting ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
export default Cargos;
