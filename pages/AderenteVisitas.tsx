import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Plus, Filter } from 'lucide-react';
import { db } from '../services/dbAdapter';
import { Audit, AuditStatus, Store } from '../types';
import { getCurrentUser } from '../utils/auth';

export const AderenteVisitas: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  
  const [myVisits, setMyVisits] = useState<(Audit & { store: Store })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<number | 'all'>('all');
  const [visitStores, setVisitStores] = useState<Store[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) {
        navigate('/');
        return;
      }

      try {
        // Carregar todas as auditorias
        const allAudits = await db.getAudits();
        const allStores = await db.getStores();
        
        // Encontrar TODAS as lojas do Aderente
        const myStoreIds = allStores
          .filter(s => (s.aderente_id || (s as any).aderenteId) === currentUser.userId)
          .map(s => s.id);

        // Filtrar visitas criadas pelo próprio Aderente (a outras lojas)
        const myCreatedVisits = allAudits
          .filter(a => {
            const isCreatedByMe = a.createdBy === currentUser.userId;
            const isNotMyStore = !myStoreIds.includes(a.store_id);
            return isCreatedByMe && isNotMyStore;
          })
          .map(a => {
            const visitStore = allStores.find(s => s.id === a.store_id);
            return {
              ...a,
              store: visitStore || { id: a.store_id } as Store
            };
          })
          .filter(a => a.store);

        setMyVisits(myCreatedVisits);
        
        // Obter lojas únicas visitadas
        const uniqueStores = Array.from(
          new Map(myCreatedVisits.map(v => [v.store.id, v.store])).values()
        );
        setVisitStores(uniqueStores);
      } catch (error) {
        console.error('Erro ao carregar visitas:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [currentUser, navigate]);

  // Filtrar visitas por loja selecionada
  const filteredVisits = useMemo(() => {
    if (selectedStoreFilter === 'all') return myVisits;
    return myVisits.filter(v => v.store_id === selectedStoreFilter);
  }, [myVisits, selectedStoreFilter]);

  const getStatusBadge = (status: AuditStatus) => {
    switch(status) {
      case AuditStatus.IN_PROGRESS:
        return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-medium">Em Curso</span>;
      case AuditStatus.SUBMITTED:
        return <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded font-medium">Submetida</span>;
      case AuditStatus.ENDED:
        return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-medium">Concluída</span>;
      case AuditStatus.REPLACED:
        return <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded font-medium">Sobreposto</span>;
      default:
        return null;
    }
  };

  const stats = {
    total: filteredVisits.length,
    inProgress: filteredVisits.filter(v => v.status < AuditStatus.SUBMITTED).length,
    completed: filteredVisits.filter(v => v.status >= AuditStatus.SUBMITTED).length,
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/aderente/dashboard')}
          >
            <ArrowLeft className="mr-2" size={16} />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Minhas Visitas</h1>
            <p className="text-sm text-gray-500">Visitas realizadas a outras lojas da rede</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Total de Visitas</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
            <div className="text-sm text-gray-500">Em Curso</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-500">Concluídas</div>
          </div>
        </div>

        {/* Botão para Nova Visita */}
        <div className="mb-6">
          <Button
            onClick={() => navigate('/aderente/new-visit')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="mr-2" size={16} />
            Nova Visita
          </Button>
        </div>

        {/* Filtro por Loja */}
        {visitStores.length > 1 && (
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <Filter className="text-gray-500" size={20} />
              <label className="text-sm font-medium text-gray-700">Filtrar por Loja:</label>
              <select
                value={selectedStoreFilter}
                onChange={(e) => setSelectedStoreFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="flex-1 max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">Todas as Lojas ({visitStores.length})</option>
                {visitStores.map(store => (
                  <option key={store.id} value={store.id}>
                    {store.city || 'Sem cidade'} - {store.codehex || store.numero}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Visitas List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">
              {selectedStoreFilter === 'all' ? 'Todas as Visitas' : 'Visitas Filtradas'}
            </h3>
            <p className="text-xs text-gray-500 mt-1">Total: {filteredVisits.length}</p>
          </div>
          <div className="divide-y divide-gray-100">
            {loading ? (
              <p className="p-4 text-gray-500">A carregar...</p>
            ) : filteredVisits.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 mb-4">Ainda não tem visitas registadas</p>
                <Button
                  onClick={() => navigate('/aderente/new-visit')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Plus className="mr-2" size={16} />
                  Criar Primeira Visita
                </Button>
              </div>
            ) : (
              filteredVisits.map(visit => (
                <div
                  key={visit.id}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/aderente/visit/${visit.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-semibold text-gray-900">
                          {visit.store.nome || `Loja ${visit.store.codehex}`}
                        </h4>
                        <span className="text-sm text-gray-500">
                          {visit.store.city}
                        </span>
                        {getStatusBadge(visit.status)}
                      </div>
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>
                          Data: {new Date(visit.dtstart).toLocaleDateString('pt-PT', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                        {visit.score != null && (
                          <span className="font-medium text-gray-700">
                            Pontuação: {visit.score.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/aderente/visit/${visit.id}`);
                      }}
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </main>
    </div>
  );
};
