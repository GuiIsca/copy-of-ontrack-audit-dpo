import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/dbAdapter';
import { Store, User, UserRole } from '../types';
import { getCurrentUser } from '../utils/auth';
import { Header } from '../components/layout/Header';
import { MapPin, Phone, Mail, AlertCircle, X } from 'lucide-react';

const DadosDaLoja: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [availableStores, setAvailableStores] = useState<Store[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [phoneEdit, setPhoneEdit] = useState(false);
  const [phoneValue, setPhoneValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) {
        navigate('/');
        return;
      }

      // Aderente não tem acesso
      if (currentUser.roles.includes(UserRole.ADERENTE)) {
        navigate('/');
        return;
      }

      try {
        const users = await db.getUsers();
        setAllUsers(users);

        // Determinar quais lojas o utilizador pode ver
        let stores: Store[] = [];

        if (currentUser.roles.includes(UserRole.ADMIN) || 
            currentUser.roles.includes(UserRole.DOT_TEAM_LEADER) ||
            currentUser.roles.includes(UserRole.AMONT)) {
          // Admin, Team Leader e Amont podem ver todas as lojas
          stores = await db.getStores();
        } else if (currentUser.roles.includes(UserRole.DOT_OPERACIONAL)) {
          // DOT Operacional vê apenas suas lojas atribuídas
          stores = await db.getStoresForDOT(currentUser.userId);
        }

        setAvailableStores(stores);
        
        // Selecionar a primeira loja por defeito
        if (stores.length > 0) {
          setStore(stores[0]);
          setPhoneValue(stores[0].telefone || '');
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleStoreChange = (storeId: number) => {
    const selectedStore = availableStores.find(s => s.id === storeId);
    if (selectedStore) {
      setStore(selectedStore);
      setPhoneValue(selectedStore.telefone || '');
      setPhoneEdit(false);
    }
  };

  const handleSavePhone = async () => {
    if (!store) return;
    
    setSaving(true);
    try {
      await db.updateStore({ ...store, telefone: phoneValue });
      setStore({ ...store, telefone: phoneValue });
      setPhoneEdit(false);
    } catch (error) {
      console.error('Erro ao atualizar telefone:', error);
      alert('Erro ao atualizar telefone');
    } finally {
      setSaving(false);
    }
  };

  const handleMapClick = () => {
    setShowMapModal(true);
  };

  const handleContactAderente = () => {
    setShowContactModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-96">
          <div className="text-gray-500">A carregar...</div>
        </div>
      </div>
    );
  }

  if (!loading && availableStores.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 flex items-start gap-3">
            <AlertCircle className="text-yellow-600 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-1">Nenhuma loja disponível</h3>
              <p className="text-yellow-800">Não existe nenhuma loja atribuída ao seu perfil.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-96">
          <div className="text-gray-500">A carregar...</div>
        </div>
      </div>
    );
  }

  // Buscar utilizadores associados
  const aderenteId = store.aderente_id || store.aderenteId;
  const dotOperacionalId = store.dot_operacional_id || store.dot_user_id || store.dotUserId;
  
  const aderente = aderenteId ? allUsers.find(u => u.id === aderenteId) : null;
  const dotOperacional = dotOperacionalId ? allUsers.find(u => u.id === dotOperacionalId) : null;
  const dotTeamLeader = dotOperacional?.dotTeamLeaderId 
    ? allUsers.find(u => u.id === dotOperacional.dotTeamLeaderId) 
    : null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Título e Seleção de Loja */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dados da Loja</h1>
              <p className="text-gray-500 mt-1">Informações detalhadas da loja</p>
            </div>
            {availableStores.length > 1 && (
              <div className="min-w-[300px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecionar Loja
                </label>
                <select
                  value={store.id}
                  onChange={(e) => handleStoreChange(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  {availableStores.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nome || s.numero || `Loja ${s.id}`} - {s.distrito || s.city}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={handleMapClick}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <MapPin size={20} />
            Ver no mapa
          </button>
          <button
            onClick={handleContactAderente}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Mail size={20} />
            Contactar Aderente
          </button>
        </div>

        {/* Card com os dados */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 space-y-8">
            {/* Loja */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Loja
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500 block">Nome</label>
                  <p className="text-base text-gray-900">{store.nome || '-'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500 block">Morada</label>
                  <p className="text-base text-gray-900">{store.morada || '-'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500 block">Código Postal</label>
                  <p className="text-base text-gray-900">{store.codigo_postal || '-'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500 block">Distrito</label>
                  <p className="text-base text-gray-900">{store.distrito || '-'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500 block">Telefone da loja</label>
                  {phoneEdit ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={phoneValue}
                        onChange={(e) => setPhoneValue(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Telefone"
                      />
                      <button
                        onClick={handleSavePhone}
                        disabled={saving}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {saving ? 'A guardar...' : 'Guardar'}
                      </button>
                      <button
                        onClick={() => {
                          setPhoneEdit(false);
                          setPhoneValue(store.telefone || '');
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-gray-400" />
                      <p className="text-base text-gray-900">{store.telefone || '-'}</p>
                      <button
                        onClick={() => setPhoneEdit(true)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Editar
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500 block">Amplitude Horária</label>
                  <p className="text-base text-gray-900">{store.amplitude_horaria || '-'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500 block">Data de abertura</label>
                  <p className="text-base text-gray-900">
                    {store.data_abertura ? new Date(store.data_abertura).toLocaleDateString('pt-PT') : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Equipa e Contactos */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Equipa e Contactos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500 block">Aderente</label>
                  <p className="text-base text-gray-900">{aderente?.fullname || '-'}</p>
                  {aderente?.email && (
                    <p className="text-sm text-gray-500">{aderente.email}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500 block">DOT Operacional</label>
                  <p className="text-base text-gray-900">{dotOperacional?.fullname || '-'}</p>
                  {dotOperacional?.email && (
                    <p className="text-sm text-gray-500">{dotOperacional.email}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500 block">DOT Team Leader</label>
                  <p className="text-base text-gray-900">{dotTeamLeader?.fullname || '-'}</p>
                  {dotTeamLeader?.email && (
                    <p className="text-sm text-gray-500">{dotTeamLeader.email}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500 block">Cônjuge</label>
                  <p className="text-base text-gray-900">{store.conjugue_adh || '-'}</p>
                </div>
              </div>
            </div>

            {/* Estrutura e Serviços */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Estrutura e Serviços
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500 block">Formato</label>
                  <p className="text-base text-gray-900">{store.formato || '-'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500 block">Área</label>
                  <p className="text-base text-gray-900">
                    {store.area ? `${store.area} m²` : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Ver no Mapa */}
      {showMapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowMapModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MapPin className="text-blue-600" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Ver no Mapa</h3>
              </div>
              <button
                onClick={() => setShowMapModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="text-center py-8">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4">
                  <MapPin className="text-blue-500" size={32} />
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                A funcionalidade de visualização no mapa estará disponível brevemente.
              </p>
              <button
                onClick={() => setShowMapModal(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Contactar Aderente */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowContactModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Mail className="text-green-600" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Contacto do Aderente</h3>
              </div>
              <button
                onClick={() => setShowContactModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            {aderente ? (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Nome</label>
                      <p className="text-base text-gray-900 font-semibold">{aderente.fullname}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <a 
                        href={`mailto:${aderente.email}`}
                        className="text-base text-blue-600 hover:text-blue-700 flex items-center gap-2"
                      >
                        <Mail size={16} />
                        {aderente.email}
                      </a>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowContactModal(false)}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="mb-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-50 rounded-full mb-4">
                    <AlertCircle className="text-yellow-500" size={32} />
                  </div>
                </div>
                <p className="text-gray-600 mb-6">
                  Nenhum aderente está associado a esta loja.
                </p>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DadosDaLoja;
