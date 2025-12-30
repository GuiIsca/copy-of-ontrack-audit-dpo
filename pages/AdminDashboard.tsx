  // Função para download do template de lojas
  const downloadStoreTemplate = () => {
    const headers = [
      'numero', 'nome', 'formato', 'area', 'telefone', 'situacao_pdv', 'data_abertura', 'ultima_retoma', 'distrito', 'amplitude_horaria', 'morada', 'codigo_postal', 'conjugue_adh', 'dot_operacional_id', 'aderente_id'
    ];
    const example = [
      '12345', 'Supermercado Exemplo', 'Super 1500', '1200', '912345678', 'Exploração', '2022-01-01', '', 'Lisboa', '09:00-21:00', 'Rua Exemplo, 123', '1000-001', '', '2', '5'
    ];
    const csvContent = headers.join(';') + '\n' + example.join(';');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_lojas.csv';
    link.click();
  };
  // Função para exportar lojas para CSV
  const exportStoresToCSV = (stores: Store[], users: User[]) => {
    const headers = [
      'numero', 'nome', 'formato', 'area', 'telefone', 'situacao_pdv', 'data_abertura', 'ultima_retoma', 'distrito', 'amplitude_horaria', 'morada', 'codigo_postal', 'conjugue_adh', 'dot_operacional_id', 'aderente_id'
    ];
    const csvRows = [headers.join(';')];
    stores.forEach(store => {
      const row = [
        store.numero || '',
        store.nome || '',
        store.formato || '',
        store.area || '',
        store.telefone || '',
        store.situacao_pdv || '',
        store.data_abertura || '',
        store.ultima_retoma || '',
        store.distrito || '',
        store.amplitude_horaria || '',
        store.morada || '',
        store.codigo_postal || '',
        store.conjugue_adh || '',
        store.dot_operacional_id || store.dotUserId || '',
        store.aderente_id || store.aderenteId || ''
      ];
      csvRows.push(row.join(';'));
    });
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'lojas.csv';
    link.click();
  };
  // Template para AMONT
  const downloadAmontTemplate = () => {
    const template = `email;fullname\namont1@exemplo.com;Ana Amont\namont2@exemplo.com;Rui Auditor`;
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_amont.csv';
    link.click();
  };
// Função para download do template de DOT Team Leader
const downloadDotTeamLeaderTemplate = () => {
  const template = `email;fullname\nteamleader1@mousquetaires.com;Maria TeamLeader\nteamleader2@mousquetaires.com;Carlos Supervisor`;
  const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'template_dot_team_leaders.csv';
  link.click();
};
import React, { useMemo, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { db } from '../services/dbAdapter';
import { Store, User, UserRole } from '../types';
import { Download, Upload, Users as UsersIcon, Store as StoreIcon, Settings, PlusCircle, CheckCircle, AlertCircle, KeyRound, Mail, ChevronDown, ChevronRight, Edit2, Save, X } from 'lucide-react';
import { Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

const useQuery = () => new URLSearchParams(useLocation().search);

// --- Edit User Modal ---
interface EditUserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User, additionalData?: any) => Promise<void>;
  allUsers: User[];
  allStores: Store[];
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, isOpen, onClose, onSave, allUsers, allStores }) => {
  const [formData, setFormData] = useState<Partial<User>>({});
  const [selectedStores, setSelectedStores] = useState<number[]>([]); // For DOTs
  const [selectedStore, setSelectedStore] = useState<number | ''>(''); // For Aderentes
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({ ...user });
      if (user.roles.includes(UserRole.DOT_OPERACIONAL)) {
        // Find stores assigned to this DOT
        const assigned = allStores.filter(s => (s.dot_user_id || s.dotUserId) === user.id).map(s => s.id);
        setSelectedStores(assigned);
      }
      if (user.roles.includes(UserRole.ADERENTE)) {
        // Find store assigned to this Aderente
        // Support new assignedStores (array) or legacy store.aderenteId
        const assignedId = user.assignedStores?.[0];
        const legacyStore = allStores.find(s => (s.aderente_id || s.aderenteId) === user.id);
        setSelectedStore(assignedId || legacyStore?.id || '');
      }
    } else {
      setFormData({});
      setSelectedStores([]);
      setSelectedStore('');
    }
    setPassword('');
  }, [user, allStores, isOpen]);

  if (!isOpen || !user) return null;

  const isTeamLeader = user.roles.includes(UserRole.DOT_TEAM_LEADER);
  const isDot = user.roles.includes(UserRole.DOT_OPERACIONAL);
  const isAderente = user.roles.includes(UserRole.ADERENTE);

  const handleSave = async () => {
    setLoading(true);
    try {
      const updatedUser = { ...user, ...formData };
      if (password) {
        (updatedUser as any).password = password;
      }
      
      // Prepare additional data
      const additionalData: any = {};
      if (isDot) {
        additionalData.assignedStoreIds = selectedStores;
      }
      if (isAderente) {
        additionalData.assignedStoreId = selectedStore;
      }

      await onSave(updatedUser as User, additionalData);
      onClose();
    } catch (error) {
      console.error(error);
      alert('Erro ao guardar');
    } finally {
      setLoading(false);
    }
  };

  const teamLeaders = allUsers.filter(u => u.roles.includes(UserRole.DOT_TEAM_LEADER));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="text-lg font-bold text-gray-900">Editar Utilizador</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>
        
        <div className="p-6 space-y-6 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Nome Completo" 
              value={formData.fullname || ''} 
              onChange={e => setFormData({...formData, fullname: e.target.value})} 
            />
            <Input 
              label="Email" 
              value={formData.email || ''} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nova Password (opcional)</label>
            <div className="flex gap-2">
              <Input 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="Deixe em branco para manter a atual"
                type="text"
              />
              <Button variant="outline" onClick={() => setPassword(Math.random().toString(36).slice(-8))}>
                Gerar
              </Button>
            </div>
          </div>

          {isDot && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-semibold text-gray-900">Configurações DOT</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor (DOT Team Leader)</label>
                <select 
                  className="w-full border rounded-lg px-3 py-2"
                  value={(formData as any).dotTeamLeaderId || ''}
                  onChange={e => setFormData({...formData, dotTeamLeaderId: Number(e.target.value)})}
                >
                  <option value="">Selecione DOT Team Leader</option>
                  {teamLeaders.map(a => (
                    <option key={a.id} value={a.id}>{a.fullname}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lojas Atribuídas</label>
                <div className="border rounded-lg p-3 max-h-60 overflow-y-auto bg-gray-50 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {allStores.map(store => {
                    const isAssigned = selectedStores.includes(store.id);
                    const dotId = store.dot_user_id || store.dotUserId;
                    const assignedToOther = dotId && dotId !== user.id;
                    const otherDot = assignedToOther ? allUsers.find(u => u.id === dotId) : null;
                    
                    return (
                      <label key={store.id} className={`flex items-start gap-2 p-2 rounded border ${isAssigned ? 'bg-blue-50 border-blue-200' : assignedToOther ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed' : 'bg-white border-gray-200 cursor-pointer hover:bg-gray-100'}`}>
                        <input 
                          type="checkbox"
                          checked={isAssigned}
                          disabled={!!assignedToOther}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStores([...selectedStores, store.id]);
                            } else {
                              setSelectedStores(selectedStores.filter(id => id !== store.id));
                            }
                          }}
                          className="mt-1"
                        />
                        <div className="text-sm">
                          <div className="font-medium">{store.nome}</div>
                          {assignedToOther && (
                            <div className="text-xs text-orange-600 mt-1">
                              Atribuída a: {otherDot?.fullname || 'Outro DOT'}
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {isAderente && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-semibold text-gray-900">Configurações Aderente</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DOT Operacional Responsável</label>
                <select 
                  className="w-full border rounded-lg px-3 py-2"
                  value={(formData as any).dotTeamLeaderId || ''}
                  onChange={e => setFormData({...formData, dotTeamLeaderId: Number(e.target.value)})}
                >
                  <option value="">Selecione um DOT</option>
                  {allUsers.filter(u => u.roles.includes(UserRole.DOT_OPERACIONAL)).map(d => (
                    <option key={d.id} value={d.id}>{d.fullname}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loja Vinculada</label>
                <select 
                  className="w-full border rounded-lg px-3 py-2"
                  value={selectedStore}
                  onChange={e => setSelectedStore(Number(e.target.value))}
                >
                  <option value="">Sem loja</option>
                  {allStores.map(s => {
                    return (
                    <option key={s.id} value={s.id}>
                      {s.nome}
                    </option>
                  )})}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'A guardar...' : 'Guardar Alterações'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export const AdminDashboard: React.FC = () => {
  const query = useQuery();
  const initialTab = query.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState<'overview'|'users'|'stores'|'import'>(
    initialTab === 'users' || initialTab === 'stores' || initialTab === 'import' ? (initialTab as any) : 'overview'
  );

  const [users, setUsers] = useState<User[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [feedback, setFeedback] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // Edit Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Hierarchy Expansion State
  const [expandedTeamLeaders, setExpandedTeamLeaders] = useState<Set<number>>(new Set());
  const [expandedDots, setExpandedDots] = useState<Set<number>>(new Set());

  const toggleTeamLeader = (id: number) => {
    const newSet = new Set(expandedTeamLeaders);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setExpandedTeamLeaders(newSet);
  };

  const toggleDot = (id: number) => {
    const newSet = new Set(expandedDots);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setExpandedDots(newSet);
  };

  useEffect(() => {
    const loadData = async () => {
      const usersData = await db.getUsers();
      const storesData = await db.getStores();
      setUsers(usersData);
      setStores(storesData);
      
      // Auto-expand all initially
      setExpandedTeamLeaders(new Set(usersData.filter(u => u.roles.includes(UserRole.DOT_TEAM_LEADER)).map(u => u.id)));
    };
    loadData();
  }, []);

  const refresh = async () => {
    const usersData = await db.getUsers();
    const storesData = await db.getStores();
    setUsers(usersData);
    setStores(storesData);
  };

  const handleSaveUser = async (updatedUser: User, additionalData?: any) => {
    try {
      await db.updateUser(updatedUser);
      
      if (updatedUser.roles.includes(UserRole.DOT_OPERACIONAL) && additionalData?.assignedStoreIds) {
        // Handle store assignments for DOT
        const storeIds = additionalData.assignedStoreIds as number[];
        
        // 1. Unassign stores that were previously assigned to this DOT but are not anymore
        const currentStores = stores.filter(s => (s.dot_user_id || s.dotUserId) === updatedUser.id);
        for (const store of currentStores) {
          if (!storeIds.includes(store.id)) {
            await db.assignDOTToStore(store.id, null as any); // Unassign
          }
        }
        
        // 2. Assign new stores
        for (const storeId of storeIds) {
          await db.assignDOTToStore(storeId, updatedUser.id);
        }
      }

      if (updatedUser.roles.includes(UserRole.ADERENTE)) {
        const storeId = additionalData?.assignedStoreId;
        // Update user's assignedStores directly
        updatedUser.assignedStores = storeId ? [Number(storeId)] : [];
        
        // Legacy: If we want to be clean, we could clear the old store.aderenteId if it matches this user
        // But since we are moving to assignedStores, we can just ignore the store.aderenteId field from now on.
        // However, to avoid confusion in the UI if it falls back to legacy, we might want to clear it.
        // Let's leave it for now to avoid side effects on other users if logic was shared.
      }

      setFeedback('Utilizador atualizado com sucesso');
      await refresh();
    } catch (e: any) {
      setErrorMsg(e.message || 'Erro ao atualizar utilizador');
    }
  };

  const openEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  // --- Hierarchy Data Preparation ---
  const hierarchy = useMemo(() => {
    const teamLeaders = users.filter(u => u.roles.includes(UserRole.DOT_TEAM_LEADER));
    const dots = users.filter(u => u.roles.includes(UserRole.DOT_OPERACIONAL));
    const aderentes = users.filter(u => u.roles.includes(UserRole.ADERENTE));
    
    const tree = teamLeaders.map(teamLeader => {
      const myDots = dots.filter(d => Number((d as any).dotTeamLeaderId) === Number(teamLeader.id));
      const myDotsWithStores = myDots.map(dot => {
        const myStores = stores.filter(s => Number(s.dot_user_id || s.dotUserId) === Number(dot.id));
        const myStoresWithAderentes = myStores.map(store => {
          // Find aderentes who have this store assigned
          const storeAderentes = aderentes.filter(a => 
            a.assignedStores?.some(id => Number(id) === Number(store.id))
          );
          
          // Also check legacy field on the store
          const legacyId = store.aderente_id || store.aderenteId;
          if (legacyId) {
             const legacyUser = aderentes.find(a => Number(a.id) === Number(legacyId));
             // Add if found AND not already in the list
             if (legacyUser && !storeAderentes.some(a => a.id === legacyUser.id)) {
                storeAderentes.push(legacyUser);
             }
          }
          return { store, aderentes: storeAderentes };
        });
        
        // Aderentes assigned to this DOT but not in the stores list above
        const directAderentes = aderentes.filter(a => {
          if (Number((a as any).dotTeamLeaderId) !== Number(dot.id)) return false;
            // Check if this aderente is already shown in any of the stores above
            const isShownInStore = myStoresWithAderentes.some(item => item.aderentes.some(ad => ad.id === a.id));
            return !isShownInStore;
        });
        
        return { dot, stores: myStoresWithAderentes, directAderentes };
      });
      return { teamLeader, dots: myDotsWithStores };
    });

      const unassignedDots = dots.filter(d => !(d as any).dotTeamLeaderId);
    const unassignedAderentes = aderentes.filter(a => {
        const hasStore = (a.assignedStores && a.assignedStores.length > 0) || stores.some(s => Number(s.aderente_id || s.aderenteId) === Number(a.id));
        return !hasStore && !(a as any).dotTeamLeaderId;
    });

    return { tree, unassignedDots, unassignedAderentes };
  }, [users, stores]);

  // --- Create forms state (Simplified for Modal or keep as is? Keeping as is for now but maybe hidden) ---
  // ... (Keeping existing create logic but maybe moving it to a "New" button later if requested, 
  // but for now let's focus on the list view replacement)
  const [teamLeaderForm, setTeamLeaderForm] = useState({ email: '', fullname: '' });
  const [dotForm, setDotForm] = useState({ email: '', fullname: '', dotTeamLeaderId: '' as string });
  const [aderenteForm, setAderenteForm] = useState({ email: '', fullname: '', storeId: '' as string, dotId: '' as string });
  const [amontForm, setAmontForm] = useState({ email: '', fullname: '' });
  const [storeForm, setStoreForm] = useState({ brand: 'Intermarché', size: 'Super', nome: '', dotUserId: '' as string, aderenteId: '' as string });

  const clearFeedback = () => { setFeedback(''); setErrorMsg(''); };

  const handleCreateTeamLeader = async () => {
    clearFeedback();
    try {
      await db.createUser({ email: teamLeaderForm.email.trim(), fullname: teamLeaderForm.fullname.trim(), roles: [UserRole.DOT_TEAM_LEADER] });
      setTeamLeaderForm({ email: '', fullname: '' });
      setFeedback('DOT Team Leader criado com sucesso');
      await refresh();
    } catch (e: any) {
      setErrorMsg(e.message || 'Erro ao criar DOT Team Leader');
    }
  };

  const handleCreateDOT = async () => {
    clearFeedback();
    try {
      const dotTeamLeaderId = Number((dotForm as any).dotTeamLeaderId);
      if (!dotTeamLeaderId) throw new Error('Selecione o supervisor DOT Team Leader');
      await db.createUser({ email: dotForm.email.trim(), fullname: dotForm.fullname.trim(), roles: [UserRole.DOT_OPERACIONAL], dotTeamLeaderId, assignedStores: [] } as any);
      setDotForm({ email: '', fullname: '', dotTeamLeaderId: '' } as any);
      setFeedback('DOT Operacional criado com sucesso');
      await refresh();
    } catch (e: any) {
      setErrorMsg(e.message || 'Erro ao criar DOT Operacional');
    }
  };

  const handleCreateAderente = async () => {
    clearFeedback();
    try {
      const payload: any = { 
        email: aderenteForm.email.trim(), 
        fullname: aderenteForm.fullname.trim(), 
        roles: [UserRole.ADERENTE] 
      };
      
      if (aderenteForm.dotId) {
        payload.dotTeamLeaderId = Number(aderenteForm.dotId);
      }

      const storeId = Number(aderenteForm.storeId);
      if (storeId) {
        payload.assignedStores = [storeId];
      }

      await db.createUser(payload);
      // Legacy assignment removed in favor of assignedStores
      
      setAderenteForm({ email: '', fullname: '', storeId: '', dotId: '' });
      setFeedback('Aderente criado com sucesso');
      await refresh();
    } catch (e: any) {
      setErrorMsg(e.message || 'Erro ao criar Aderente');
    }
  };

  const handleCreateAmont = async () => {
    clearFeedback();
    try {
      await db.createUser({ 
        email: amontForm.email.trim(), 
        fullname: amontForm.fullname.trim(), 
        roles: [UserRole.AMONT] 
      });
      setAmontForm({ email: '', fullname: '' });
      setFeedback('AMONT criado com sucesso');
      await refresh();
    } catch (e: any) {
      setErrorMsg(e.message || 'Erro ao criar AMONT');
    }
  };
  // --- Store handlers ---
  const handleCreateStore = async () => {
    clearFeedback();
    // Validação obrigatória
    const requiredFields = [
      'numero', 'nome', 'formato', 'area', 'telefone', 'situacao_pdv', 'data_abertura', 'distrito', 'amplitude_horaria', 'morada', 'codigo_postal'
    ];
    for (const field of requiredFields) {
      if (!storeForm[field]) {
        setErrorMsg(`O campo "${field}" é obrigatório.`);
        return;
      }
    }
    try {
      const payload: any = {
        numero: storeForm.numero,
        nome: storeForm.nome,
        formato: storeForm.formato,
        area: storeForm.area,
        telefone: storeForm.telefone,
        situacao_pdv: storeForm.situacao_pdv,
        data_abertura: storeForm.data_abertura,
        distrito: storeForm.distrito,
        amplitude_horaria: storeForm.amplitude_horaria,
        morada: storeForm.morada,
        codigo_postal: storeForm.codigo_postal,
      };
      // Campos opcionais
      if (storeForm.ultima_retoma) payload.ultima_retoma = storeForm.ultima_retoma;
      if (storeForm.conjugue_adh) payload.conjugue_adh = storeForm.conjugue_adh;
      if (storeForm.dotUserId) payload.dot_operacional_id = Number(storeForm.dotUserId);
      if (storeForm.aderenteId) payload.aderente_id = Number(storeForm.aderenteId);
      await db.createStore(payload);
      setStoreForm({
        numero: '',
        nome: '',
        formato: '',
        area: '',
        telefone: '',
        situacao_pdv: '',
        data_abertura: '',
        ultima_retoma: '',
        distrito: '',
        amplitude_horaria: '',
        morada: '',
        codigo_postal: '',
        conjugue_adh: '',
        dotUserId: '',
        aderenteId: ''
      });
      setFeedback('Loja criada com sucesso');
      await refresh();
    } catch (e: any) {
      setErrorMsg(e.message || 'Erro ao criar Loja');
    }
  };

  const handleChangeStoreDot = async (storeId: number, dotUserId: number) => {
    clearFeedback();
    try { await db.assignDOTToStore(storeId, dotUserId); setFeedback('DOT atribuído à loja'); await refresh(); } catch (e: any) { setErrorMsg(e.message || 'Erro na atribuição'); }
  };

  const handleAddAderenteToStore = async (storeId: number, userId: number) => {
    if (!userId) return;
    clearFeedback();
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;
      
      const newStores = [...(user.assignedStores || []), storeId];
      // Ensure unique
      const unique = [...new Set(newStores)];
      
      await db.updateUser({ ...user, assignedStores: unique });
      setFeedback('Aderente adicionado à loja');
      await refresh();
    } catch (e: any) {
      setErrorMsg(e.message || 'Erro ao adicionar aderente');
    }
  };

  const handleUnassignAderente = async (storeId: number, user: User) => {
    clearFeedback();
    try {
      const newStores = (user.assignedStores || []).filter(id => id !== storeId);
      await db.updateUser({ ...user, assignedStores: newStores });
      
      // Also clear legacy if needed
      const store = stores.find(s => s.id === storeId);
      if (store && (store.aderente_id === user.id || store.aderenteId === user.id)) {
         await db.assignAderenteToStore(storeId, null as any);
      }
      
      setFeedback('Aderente removido da loja');
      await refresh();
    } catch (e: any) {
      setErrorMsg(e.message || 'Erro ao remover aderente');
    }
  };

  // --- Delete handlers and Confirm dialog state ---
  const [confirmState, setConfirmState] = useState<{open:boolean; message:string; onConfirm:()=>void}>({open:false, message:'', onConfirm: ()=>{}});
  const openConfirm = (message: string, onConfirm: () => void) => { setConfirmState({ open: true, message, onConfirm }); };
  const closeConfirm = () => setConfirmState(s => ({...s, open:false}));

  const handleDeleteUser = (userId: number, role: string) => { 
    openConfirm(`Tem certeza que deseja eliminar este ${role}?`, async () => { 
      clearFeedback(); 
      try { 
        await db.deleteUser(userId); 
        setFeedback(`${role} eliminado com sucesso`); 
        await refresh(); 
      } catch (e: any) { 
        // If user not found (404), consider it deleted
        if (e.message && e.message.includes('404')) {
           setFeedback(`${role} já tinha sido eliminado`);
           await refresh();
        } else {
           setErrorMsg(e.message || `Erro ao eliminar ${role}`); 
        }
      } 
    }); 
  };
  
  const handleDeleteStore = (storeId: number) => { openConfirm('Tem certeza que deseja eliminar esta Loja?', async () => { clearFeedback(); try { await db.deleteStore(storeId); setFeedback('Loja eliminada com sucesso'); await refresh(); } catch (e: any) { setErrorMsg(e.message || 'Erro ao eliminar Loja'); } }); };

  // --- CSV Import ---
  const [dotTeamLeaderCsv, setDotTeamLeaderCsv] = useState<File | null>(null);
  const [dotCsv, setDotCsv] = useState<File | null>(null);
  const [aderenteCsv, setAderenteCsv] = useState<File | null>(null);
  const [storeCsv, setStoreCsv] = useState<File | null>(null);
    // Importação de DOT Team Leaders
    const importDotTeamLeaders = async () => {
      if (!dotTeamLeaderCsv) return;
      clearFeedback();
      setImportBusy(true);
      setImportResult(null);
      try {
        const text = await dotTeamLeaderCsv.text();
        const lines = parseCsvText(text);
        const rows = lines.slice(1);
        let created = 0, errors = 0;
        for (const line of rows) {
          const cols = line.split(';').map(c => c.trim());
          if (cols.length < 2) { errors++; continue; }
          const [email, fullname] = cols;
          try {
            await db.createUser({ email, fullname, roles: [UserRole.DOT_TEAM_LEADER] });
            created++;
          } catch { errors++; }
        }
        setImportResult({ created, errors });
        await refresh();
      } finally {
        setImportBusy(false);
      }
    };
  const [importResult, setImportResult] = useState<{created:number;errors:number}|null>(null);
  const [importBusy, setImportBusy] = useState(false);

  const parseCsvText = (text: string) => text.split('\n').filter(l => l.trim());
  const downloadDotTemplate = () => {
    // Pega os Team Leaders atuais
    const teamLeaders = users.filter(u => u.roles.includes(UserRole.DOT_TEAM_LEADER));
    const teamLeadersList = teamLeaders.length
      ? teamLeaders.map(tl => `- ${tl.fullname} <${tl.email}>`).join('\n')
      : '- Nenhum Team Leader cadastrado';
    const comment = `# Team Leaders atuais:\n${teamLeadersList}\n`;
    const template = `${comment}email;fullname;dot_team_leader_email\n`+
      `dot1@mousquetaires.com;João Silva;leader1@mousquetaires.com\n`+
      `dot2@mousquetaires.com;Pedro Martins;leader1@mousquetaires.com`;
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_dots.csv';
    link.click();
  };
  const downloadAderenteTemplate = () => { const template = `email;fullname;dot_email\n`+`aderente100@intermarche.pt;Joana Lopes;dot1@mousquetaires.com\n`+`aderente101@intermarche.pt;Paulo Reis;`; const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'template_aderentes.csv'; link.click(); };
  const downloadStoreTemplate = () => {
    // All required/optional fields for store import
    const headers = [
      'numero',
      'nome',
      'formato',
      'area',
      'telefone',
      'situacao_pdv',
      'data_abertura',
      'ultima_retoma',
      'distrito',
      'amplitude_horaria',
      'morada',
      'codigo_postal',
      'conjugue_adh',
      'dot_operacional_id',
      'aderente_id'
    ];
    // Example row (can be empty or filled with example values)
    const example = [
      '123',
      'Intermarché Porto',
      'Super',
      '1200',
      '222333444',
      'Ativo',
      '2022-01-01',
      '2023-01-01',
      'Porto',
      '08:00-22:00',
      'Rua Exemplo 123',
      '4000-123',
      '',
      '',
      ''
    ];
    const csvContent = headers.join(';') + '\n' + example.join(';');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_lojas.csv';
    link.click();
  };

  const importDOTs = async () => { if (!dotCsv) return; clearFeedback(); setImportBusy(true); setImportResult(null); try { const text = await dotCsv.text(); const lines = parseCsvText(text); const rows = lines.slice(1); let created = 0, errors = 0; const usersNow = await db.getUsers(); for (const line of rows) { const cols = line.split(';').map(c => c.trim()); if (cols.length < 3) { errors++; continue; } const [email, fullname, dot_team_leader_email] = cols; const leader = usersNow.find(u => u.email === dot_team_leader_email && u.roles.includes(UserRole.DOT_TEAM_LEADER)); if (!leader) { errors++; continue; } try { await db.createUser({ email, fullname, roles: [UserRole.DOT_OPERACIONAL], dotTeamLeaderId: leader.id, assignedStores: [] } as any); created++; } catch { errors++; } } setImportResult({ created, errors }); await refresh(); } finally { setImportBusy(false); } };
  const importAderentes = async () => { 
    if (!aderenteCsv) return; 
    clearFeedback(); 
    setImportBusy(true); 
    setImportResult(null); 
    try { 
      const text = await aderenteCsv.text(); 
      const lines = parseCsvText(text); 
      const rows = lines.slice(1); 
      let created = 0, errors = 0; 
      const storesNow = await db.getStores(); 
      const usersNow = await db.getUsers();
      
      for (const line of rows) { 
        const cols = line.split(';').map(c => c.trim()); 
        if (cols.length < 2) { errors++; continue; } 
        const [email, fullname, dot_email] = cols; 
        
        try { 
          const payload: any = { email, fullname, roles: [UserRole.ADERENTE] };
          
          // Find DOT if provided
          if (dot_email) {
            const dot = usersNow.find(u => u.email === dot_email && u.roles.includes(UserRole.DOT_OPERACIONAL));
            if (dot) payload.dotTeamLeaderId = dot.id;
          }

          // Não há mais store_codehex, só dot_email
          
          await db.createUser(payload); 
          created++; 
        } catch { errors++; } 
      } 
      setImportResult({ created, errors }); 
      await refresh(); 
    } finally { setImportBusy(false); } 
  };

  const importStores = async () => {
    if (!storeCsv) return;
    clearFeedback();
    setImportBusy(true);
    setImportResult(null);
    try {
      const text = await storeCsv.text();
      const lines = parseCsvText(text);
      const rows = lines.slice(1);
      let created = 0, errors = 0;
      const usersNow = await db.getUsers();

      for (const line of rows) {
        const cols = line.split(';').map(c => c.trim());
        // Expecting 15 columns as per template
        if (cols.length < 2) { errors++; continue; }
        const [
          numero,
          nome,
          formato,
          area,
          telefone,
          situacao_pdv,
          data_abertura,
          ultima_retoma,
          distrito,
          amplitude_horaria,
          morada,
          codigo_postal,
          conjugue_adh,
          dot_operacional_id,
          aderente_id
        ] = cols;

        try {
          // Always send all fields, even if empty
          let dot_operacional_final = dot_operacional_id || '';
          if (dot_operacional_id && isNaN(Number(dot_operacional_id))) {
            const dot = usersNow.find(u => u.email === dot_operacional_id && u.roles.includes(UserRole.DOT_OPERACIONAL));
            if (dot) dot_operacional_final = dot.id;
          }
          let aderente_final = aderente_id || '';
          if (aderente_id && isNaN(Number(aderente_id))) {
            const ad = usersNow.find(u => u.email === aderente_id && u.roles.includes(UserRole.ADERENTE));
            if (ad) aderente_final = ad.id;
          }
          const payload: any = {
            numero: numero || '',
            nome: nome || '',
            formato: formato || '',
            area: area || '',
            telefone: telefone || '',
            situacao_pdv: situacao_pdv || '',
            data_abertura: data_abertura || '',
            ultima_retoma: ultima_retoma || '',
            distrito: distrito || '',
            amplitude_horaria: amplitude_horaria || '',
            morada: morada || '',
            codigo_postal: codigo_postal || '',
            conjugue_adh: conjugue_adh || '',
            dot_operacional_id: dot_operacional_final || null,
            aderente_id: aderente_final || null
          };
          await db.createStore(payload);
          created++;
        } catch { errors++; }
      }
      setImportResult({ created, errors });
      await refresh();
    } finally { setImportBusy(false); }
  };

  const SectionHeader: React.FC<{title:string; icon?: React.ReactNode}> = ({ title, icon }) => (
    <div className="flex items-center gap-2 mb-3"><span>{icon}</span><h3 className="font-semibold text-gray-900">{title}</h3></div>
  );
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard do Administrador</h1>
          <p className="text-sm text-gray-500">Gestão de Utilizadores e Lojas</p>
        </div>

        <div className="sticky top-16 z-40 bg-gray-50 pt-2 pb-2 mb-6 flex gap-2 overflow-x-auto border-b border-gray-200">
          <Button variant={activeTab==='overview'?'primary':'outline'} onClick={() => setActiveTab('overview')}>Visão Geral</Button>
          <Button variant={activeTab==='users'?'primary':'outline'} onClick={() => setActiveTab('users')}>Utilizadores (Hierarquia)</Button>
          <Button variant={activeTab==='stores'?'primary':'outline'} onClick={() => setActiveTab('stores')}>Lojas</Button>
          <Button variant={activeTab==='import'?'primary':'outline'} onClick={() => setActiveTab('import')}>Importar CSV</Button>
        </div>

        {feedback && (
          <div className="bg-green-50 border border-green-200 rounded p-3 mb-4 flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div className="text-green-800 text-sm">{feedback}</div>
          </div>
        )}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div className="text-red-800 text-sm">{errorMsg}</div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded shadow p-4">
              <SectionHeader title="DOT Team Leader" icon={<UsersIcon className="w-4 h-4" />} />
              <div className="text-3xl font-bold">{users.filter(u => u.roles.includes(UserRole.DOT_TEAM_LEADER)).length}</div>
              <div className="text-sm text-gray-500">Supervisores</div>
            </div>
            <div className="bg-white rounded shadow p-4">
              <SectionHeader title="DOT Operacional" icon={<UsersIcon className="w-4 h-4" />} />
              <div className="text-3xl font-bold">{users.filter(u => u.roles.includes(UserRole.DOT_OPERACIONAL)).length}</div>
              <div className="text-sm text-gray-500">Auditores</div>
            </div>
            <div className="bg-white rounded shadow p-4">
              <SectionHeader title="AMONT" icon={<UsersIcon className="w-4 h-4" />} />
              <div className="text-3xl font-bold">{users.filter(u => u.roles.includes(UserRole.AMONT)).length}</div>
              <div className="text-sm text-gray-500">Auditores Independentes</div>
            </div>
            <div className="bg-white rounded shadow p-4">
              <SectionHeader title="Lojas" icon={<StoreIcon className="w-4 h-4" />} />
              <div className="text-3xl font-bold">{stores.length}</div>
              <div className="text-sm text-gray-500">Ativas no sistema</div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Quick Create Actions */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4">Adicionar Novo Utilizador</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Create Team Leader */}
                <div className="border rounded p-3 bg-gray-50">
                  <h4 className="text-sm font-bold mb-2">Novo DOT Team Leader</h4>
                  <div className="space-y-2">
                    <Input placeholder="Nome" value={teamLeaderForm.fullname} onChange={e=>setTeamLeaderForm({...teamLeaderForm,fullname:e.target.value})} />
                    <Input placeholder="Email" value={teamLeaderForm.email} onChange={e=>setTeamLeaderForm({...teamLeaderForm,email:e.target.value})} />
                    <Button size="sm" fullWidth onClick={handleCreateTeamLeader}>Criar</Button>
                  </div>
                </div>
                {/* Create DOT */}
                <div className="border rounded p-3 bg-gray-50">
                  <h4 className="text-sm font-bold mb-2">Novo DOT Operacional</h4>
                  <div className="space-y-2">
                    <Input placeholder="Nome" value={dotForm.fullname} onChange={e=>setDotForm({...dotForm,fullname:e.target.value})} />
                    <Input placeholder="Email" value={dotForm.email} onChange={e=>setDotForm({...dotForm,email:e.target.value})} />
                    <select className="w-full border rounded px-2 py-2 text-sm" value={(dotForm as any).dotTeamLeaderId} onChange={e=>setDotForm({...dotForm, dotTeamLeaderId: e.target.value} as any)}>
                      <option value="">Selecione DOT Team Leader</option>
                      {users.filter(u=>u.roles.includes(UserRole.DOT_TEAM_LEADER)).map(a=><option key={a.id} value={a.id}>{a.fullname}</option>)}
                    </select>
                    <Button size="sm" fullWidth onClick={handleCreateDOT}>Criar</Button>
                  </div>
                </div>
                {/* Create AMONT */}
                <div className="border rounded p-3 bg-gray-50">
                  <h4 className="text-sm font-bold mb-2">Novo AMONT</h4>
                  <div className="space-y-2">
                    <Input placeholder="Nome" value={amontForm.fullname} onChange={e=>setAmontForm({...amontForm,fullname:e.target.value})} />
                    <Input placeholder="Email" value={amontForm.email} onChange={e=>setAmontForm({...amontForm,email:e.target.value})} />
                    <Button size="sm" fullWidth onClick={handleCreateAmont}>Criar</Button>
                  </div>
                </div>
                {/* Create Aderente */}
                <div className="border rounded p-3 bg-gray-50">
                  <h4 className="text-sm font-bold mb-2">Novo Aderente</h4>
                  <div className="space-y-2">
                    <Input placeholder="Nome" value={aderenteForm.fullname} onChange={e=>setAderenteForm({...aderenteForm,fullname:e.target.value})} />
                    <Input placeholder="Email" value={aderenteForm.email} onChange={e=>setAderenteForm({...aderenteForm,email:e.target.value})} />
                    <select className="w-full border rounded px-2 py-2 text-sm" value={aderenteForm.dotId} onChange={e=>setAderenteForm({...aderenteForm,dotId:e.target.value})}>
                      <option value="">Selecione DOT Operacional (opcional)</option>
                      {users.filter(u=>u.roles.includes(UserRole.DOT_OPERACIONAL)).map(d=><option key={d.id} value={d.id}>{d.fullname}</option>)}
                    </select>
                    <select className="w-full border rounded px-2 py-2 text-sm" value={aderenteForm.storeId} onChange={e=>setAderenteForm({...aderenteForm,storeId:e.target.value})}>
                      <option value="">Selecione Loja (opcional)</option>
                      {stores.map(s => {
                        const isOccupied = s.aderente_id || s.aderenteId;
                        return (
                          <option key={s.id} value={s.id} disabled={!!isOccupied}>
                            {s.nome} {isOccupied ? '(Ocupada)' : ''}
                          </option>
                        );
                      })}
                    </select>
                    <Button size="sm" fullWidth onClick={handleCreateAderente}>Criar</Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Hierarchy Tree */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-bold text-gray-800">Estrutura Organizacional</h3>
              </div>
              
              <div className="divide-y divide-gray-100">
                {hierarchy.tree.map(({ teamLeader, dots }) => (
                  <div key={teamLeader.id} className="bg-white">
                    {/* DOT Team Leader Row */}
                    <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <button onClick={() => toggleTeamLeader(teamLeader.id)} className="text-gray-400 hover:text-gray-600">
                          {expandedTeamLeaders.has(teamLeader.id) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        </button>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{teamLeader.fullname}</span>
                          <span className="text-xs text-gray-500 bg-purple-100 text-purple-800 px-2 py-0.5 rounded w-fit">DOT Team Leader</span>
                        </div>
                        <span className="text-sm text-gray-500 hidden md:inline">{teamLeader.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditUser(teamLeader)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full" title="Editar">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteUser(teamLeader.id, 'DOT Team Leader')} className="p-2 text-red-600 hover:bg-red-50 rounded-full" title="Eliminar">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* DOTs List */}
                    {expandedTeamLeaders.has(teamLeader.id) && (
                      <div className="pl-8 md:pl-12 border-l-2 border-gray-100 ml-6 my-2 space-y-2">
                        {dots.length === 0 && <div className="text-sm text-gray-400 italic p-2">Sem DOTs Operacionais atribuídos</div>}
                        {dots.map(({ dot, stores: dotStores, directAderentes }) => (
                          <div key={dot.id} className="bg-gray-50 rounded-lg border border-gray-200">
                            {/* DOT Row */}
                            <div className="flex items-center justify-between p-3">
                              <div className="flex items-center gap-3 flex-1">
                                <button onClick={() => toggleDot(dot.id)} className="text-gray-400 hover:text-gray-600">
                                  {expandedDots.has(dot.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                </button>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-gray-800">{dot.fullname}</span>
                                  <span className="text-xs text-gray-500 bg-blue-100 text-blue-800 px-2 py-0.5 rounded w-fit">DOT Operacional</span>
                                </div>
                                <span className="text-xs text-gray-500 hidden md:inline">{dot.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => openEditUser(dot)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full">
                                  <Edit2 size={14} />
                                </button>
                                <button onClick={() => handleDeleteUser(dot.id, 'DOT Operacional')} className="p-1.5 text-red-600 hover:bg-red-50 rounded-full">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            {/* Stores & Aderentes List */}
                            {expandedDots.has(dot.id) && (
                              <div className="pl-8 pr-2 pb-2 space-y-1">
                                {dotStores.length === 0 && directAderentes.length === 0 && <div className="text-xs text-gray-400 italic">Sem lojas ou aderentes atribuídos</div>}
                                
                                {dotStores.map(({ store, aderentes }) => (
                                  <div key={store.id} className="flex items-center justify-between bg-white p-2 rounded border border-gray-100 text-sm">
                                    <div className="flex items-center gap-2">
                                      <StoreIcon size={14} className="text-gray-400" />
                                      <span className="font-medium">{store.nome}</span>
                                    </div>
                                    <div className="flex flex-col gap-1 items-end">
                                      {aderentes.length > 0 ? (
                                        aderentes.map(aderente => (
                                          <div key={aderente.id} className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs">
                                            <UsersIcon size={12} />
                                            <span>{aderente.fullname}</span>
                                            <button onClick={() => openEditUser(aderente)} className="ml-1 hover:text-green-900"><Edit2 size={10} /></button>
                                          </div>
                                        ))
                                      ) : (
                                        <span className="text-xs text-orange-400 italic">Sem Aderente</span>
                                      )}
                                    </div>
                                  </div>
                                ))}

                                {directAderentes.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-gray-100">
                                    <div className="text-xs font-semibold text-gray-500 mb-1">Aderentes sem Loja (Associados ao DOT Operacional)</div>
                                    {directAderentes.map(aderente => (
                                      <div key={aderente.id} className="flex items-center justify-between bg-white p-2 rounded border border-gray-100 text-sm">
                                        <div className="flex items-center gap-2 text-gray-500 italic">
                                          <StoreIcon size={14} className="text-gray-300" />
                                          <span>Sem Loja</span>
                                        </div>
                                        <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs">
                                          <UsersIcon size={12} />
                                          <span>{aderente.fullname}</span>
                                          <button onClick={() => openEditUser(aderente)} className="ml-1 hover:text-green-900"><Edit2 size={10} /></button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Unassigned Section */}
                {(hierarchy.unassignedDots.length > 0 || hierarchy.unassignedAderentes.length > 0) && (
                  <div className="bg-gray-50 p-4 border-t border-gray-200">
                    <h4 className="font-bold text-gray-700 mb-3">Não Atribuídos / Outros</h4>
                    
                    {hierarchy.unassignedDots.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-xs font-bold text-gray-500 uppercase mb-2">DOT Operacional sem Supervisor</h5>
                        <div className="space-y-2">
                          {hierarchy.unassignedDots.map(dot => (
                            <div key={dot.id} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                              <span>{dot.fullname} ({dot.email})</span>
                              <div className="flex gap-2">
                                <button onClick={() => openEditUser(dot)} className="text-blue-600"><Edit2 size={16} /></button>
                                <button onClick={() => handleDeleteUser(dot.id, 'DOT Operacional')} className="text-red-600"><Trash2 size={16} /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {hierarchy.unassignedAderentes.length > 0 && (
                      <div>
                        <h5 className="text-xs font-bold text-gray-500 uppercase mb-2">Aderentes sem Loja</h5>
                        <div className="space-y-2">
                          {hierarchy.unassignedAderentes.map(ad => (
                            <div key={ad.id} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                              <span>{ad.fullname} ({ad.email})</span>
                              <div className="flex gap-2">
                                <button onClick={() => openEditUser(ad)} className="text-blue-600"><Edit2 size={16} /></button>
                                <button onClick={() => handleDeleteUser(ad.id, 'Aderente')} className="text-red-600"><Trash2 size={16} /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* AMONT Section - Independent Auditors */}
                {users.filter(u => u.roles.includes(UserRole.AMONT)).length > 0 && (
                  <div className="bg-indigo-50 p-4 border-t border-indigo-200">
                    <h4 className="font-bold text-indigo-900 mb-3">AMONT - Auditores Independentes</h4>
                    <div className="space-y-2">
                      {users.filter(u => u.roles.includes(UserRole.AMONT)).map(amont => (
                        <div key={amont.id} className="flex items-center justify-between bg-white p-3 rounded border border-indigo-200">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-900">{amont.fullname}</span>
                              <span className="text-xs text-gray-500">{amont.email}</span>
                            </div>
                            <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">AMONT</span>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => openEditUser(amont)} className="text-blue-600 hover:text-blue-800">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDeleteUser(amont.id, 'AMONT')} className="text-red-600 hover:text-red-800">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stores' && (
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white rounded shadow p-4">
              <SectionHeader title="Criar Loja" icon={<PlusCircle className="w-4 h-4" />} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input label="Número (único)" value={storeForm.numero || ''} onChange={e=>setStoreForm({...storeForm,numero:e.target.value})} required />
                <Input label="Nome" value={storeForm.nome || ''} onChange={e=>setStoreForm({...storeForm,nome:e.target.value})} required />
                <Input label="Formato" value={storeForm.formato || ''} onChange={e=>setStoreForm({...storeForm,formato:e.target.value})} required />
                <Input label="Área (m²)" type="number" value={storeForm.area || ''} onChange={e=>setStoreForm({...storeForm,area:e.target.value})} required />
                <Input label="Telefone" value={storeForm.telefone || ''} onChange={e=>setStoreForm({...storeForm,telefone:e.target.value})} required />
                <Input label="Situação PDV" value={storeForm.situacao_pdv || ''} onChange={e=>setStoreForm({...storeForm,situacao_pdv:e.target.value})} required />
                <Input label="Data de Abertura" type="date" value={storeForm.data_abertura || ''} onChange={e=>setStoreForm({...storeForm,data_abertura:e.target.value})} required />
                <Input label="Última Retoma" type="date" value={storeForm.ultima_retoma || ''} onChange={e=>setStoreForm({...storeForm,ultima_retoma:e.target.value})} />
                <Input label="Distrito" value={storeForm.distrito || ''} onChange={e=>setStoreForm({...storeForm,distrito:e.target.value})} required />
                <Input label="Amplitude Horária" value={storeForm.amplitude_horaria || ''} onChange={e=>setStoreForm({...storeForm,amplitude_horaria:e.target.value})} required />
                <Input label="Morada" value={storeForm.morada || ''} onChange={e=>setStoreForm({...storeForm,morada:e.target.value})} required />
                <Input label="Código Postal" value={storeForm.codigo_postal || ''} onChange={e=>setStoreForm({...storeForm,codigo_postal:e.target.value})} required />
                <Input label="Conjugue ADH" value={storeForm.conjugue_adh || ''} onChange={e=>setStoreForm({...storeForm,conjugue_adh:e.target.value})} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">DOT Operacional (opcional)</label>
                  <select className="w-full border rounded px-3 py-2 text-sm" value={storeForm.dotUserId} onChange={e=>setStoreForm({...storeForm,dotUserId:e.target.value})}>
                    <option value="">—</option>
                    {/* Só DOTs que não estão já atribuídos a uma loja (dot_user_id) */}
                    {users.filter(u => u.roles.includes(UserRole.DOT_OPERACIONAL) && !stores.some(s => (s.dot_user_id || s.dotUserId) === u.id)).map(d => (
                      <option key={d.id} value={d.id}>{d.fullname}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aderente (opcional)</label>
                  <select className="w-full border rounded px-3 py-2 text-sm" value={storeForm.aderenteId} onChange={e=>setStoreForm({...storeForm,aderenteId:e.target.value})}>
                    <option value="">—</option>
                    {/* Só aderentes que não têm loja atribuída (nem por assignedStores nem por aderente_id) */}
                    {users.filter(u => u.roles.includes(UserRole.ADERENTE) &&
                      !u.assignedStores?.length &&
                      !stores.some(s => (s.aderente_id || s.aderenteId) === u.id)
                    ).map(a => (
                      <option key={a.id} value={a.id}>{a.fullname}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-3"><Button onClick={handleCreateStore}>Criar Loja</Button></div>
            </div>

            <div className="bg-white rounded shadow p-4">
              <SectionHeader title="Lojas existentes" icon={<StoreIcon className="w-4 h-4" />} />
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Numero</th>
                      <th className="px-3 py-2 text-left">Nome</th>
                        <th className="px-3 py-2 text-left">DOT Operacional</th>
                      <th className="px-3 py-2 text-left">Aderente</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stores.map(s => {
                      const dotId = s.dot_user_id || s.dotUserId;
                      const adId = s.aderente_id || s.aderenteId;
                      const dot = users.find(d=>d.id===dotId);
                      const ad = users.find(a=>a.id===adId);
                      return (
                        <tr key={s.id}>
                          <td className="px-3 py-2 whitespace-nowrap">{s.numero}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{s.nome}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <select className="border rounded px-2 py-1 text-sm" value={dotId || ''} onChange={e=>handleChangeStoreDot(s.id, Number(e.target.value))}>
                              <option value="">—</option>
                              {users.filter(u=>u.roles.includes(UserRole.DOT_OPERACIONAL)).map(d => (<option key={d.id} value={d.id}>{d.fullname}</option>))}
                            </select>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex flex-col gap-1 min-w-[150px]">
                              {/* List existing */}
                              {users.filter(u => u.assignedStores?.includes(s.id) || (u.id === (s.aderente_id || s.aderenteId))).map(u => (
                                <span key={u.id} className="text-xs bg-gray-100 px-2 py-1 rounded flex justify-between items-center border border-gray-200">
                                  <span className="truncate max-w-[100px]" title={u.fullname}>{u.fullname}</span>
                                  <button onClick={() => handleUnassignAderente(s.id, u)} className="ml-1 text-red-500 hover:text-red-700 font-bold">×</button>
                                </span>
                              ))}
                              {/* Add new */}
                              <select 
                                className="border rounded px-2 py-1 text-xs mt-1 w-full bg-white" 
                                value="" 
                                onChange={e => handleAddAderenteToStore(s.id, Number(e.target.value))}
                              >
                                <option value="">+ Adicionar</option>
                                {users.filter(u => u.roles.includes(UserRole.ADERENTE) && !u.assignedStores?.includes(s.id) && u.id !== (s.aderente_id || s.aderenteId)).map(a => (
                                  <option key={a.id} value={a.id}>{a.fullname}</option>
                                ))}
                              </select>
                            </div>
                          </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <button onClick={() => handleDeleteStore(s.id)} className="text-red-600 hover:text-red-800" title="Eliminar loja">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'import' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded shadow p-4">
              <SectionHeader title="Importar DOT Team Leaders (CSV)" icon={<Upload className="w-4 h-4" />} />
              <p className="text-sm text-gray-600 mb-3">Formato: <code>email;fullname</code></p>
              <div className="flex items-center gap-3 mb-3">
                <input type="file" accept=".csv" onChange={e=>setDotTeamLeaderCsv && setDotTeamLeaderCsv(e.target.files?.[0]||null)} />
                <Button size="sm" onClick={downloadDotTeamLeaderTemplate}><Download className="w-4 h-4 mr-2"/>Template</Button>
              </div>
              <Button onClick={importDotTeamLeaders} disabled={!dotTeamLeaderCsv || importBusy}>Importar DOT Team Leaders</Button>
            </div>

            <div className="bg-white rounded shadow p-4">
              <SectionHeader title="Importar DOTs (CSV)" icon={<Upload className="w-4 h-4" />} />
              <p className="text-sm text-gray-600 mb-3">Formato: <code>email;fullname;dot_team_leader_email</code>. DOT Team Leader deve existir.</p>
              <div className="flex items-center gap-3 mb-3">
                <input type="file" accept=".csv" onChange={e=>setDotCsv(e.target.files?.[0]||null)} />
                <Button size="sm" onClick={downloadDotTemplate}><Download className="w-4 h-4 mr-2"/>Template</Button>
              </div>
              <Button onClick={importDOTs} disabled={!dotCsv || importBusy}>Importar DOTs</Button>
            </div>



            <div className="bg-white rounded shadow p-4">
              <SectionHeader title="Importar Aderentes (CSV)" icon={<Upload className="w-4 h-4" />} />
              <p className="text-sm text-gray-600 mb-3">Formato: <code>email;fullname;store_codehex;dot_email</code> (loja/dot opcionais).</p>
              <div className="flex items-center gap-3 mb-3">
                <input type="file" accept=".csv" onChange={e=>setAderenteCsv(e.target.files?.[0]||null)} />
                <Button size="sm" onClick={downloadAderenteTemplate}><Download className="w-4 h-4 mr-2"/>Template</Button>
              </div>
              <Button onClick={importAderentes} disabled={!aderenteCsv || importBusy}>Importar Aderentes</Button>
            </div>

            <div className="bg-white rounded shadow p-4">
              <SectionHeader title="Importar Lojas (CSV)" icon={<Upload className="w-4 h-4" />} />
              <p className="text-sm text-gray-600 mb-3">Formato: <code>codehex;brand;size;city;gpslat;gpslong;dot_email</code>.</p>
              <div className="flex items-center gap-3 mb-3">
                <input type="file" accept=".csv" onChange={e=>setStoreCsv(e.target.files?.[0]||null)} />
                <Button size="sm" onClick={downloadStoreTemplate}><Download className="w-4 h-4 mr-2"/>Template</Button>
              </div>
              <Button onClick={importStores} disabled={!storeCsv || importBusy}>Importar Lojas</Button>
            </div>

            {importResult && (
              <div className="lg:col-span-2 bg-gray-50 border border-gray-200 rounded p-3">
                <div className="text-sm text-gray-800">Importação concluída: {importResult.created} criados, {importResult.errors} erros.</div>
              </div>
            )}
          </div>
        )}
        <ConfirmDialog
          open={confirmState.open}
          message={confirmState.message}
          onCancel={closeConfirm}
          onConfirm={() => { confirmState.onConfirm(); closeConfirm(); }}
          title="Confirmar eliminação"
          confirmText="Eliminar"
        />
        
        <EditUserModal 
          user={editingUser}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveUser}
          allUsers={users}
          allStores={stores}
        />
      </main>
    </div>
  );
};
