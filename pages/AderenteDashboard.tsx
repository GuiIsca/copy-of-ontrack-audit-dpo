import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { CheckCircle, Clock, FileText, MapPin, Filter, AlertCircle, Calendar, AlertTriangle, List as ListIcon, Building2 } from 'lucide-react';
import { db } from '../services/dbAdapter';
import { Audit, AuditStatus, Store } from '../types';
import { getCurrentUser } from '../utils/auth';

export const AderenteDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [audits, setAudits] = useState<(Audit & { store: Store })[]>([]);
  const [myVisits, setMyVisits] = useState<(Audit & { store: Store })[]>([]); // Visitas criadas pelo Aderente
  const [loading, setLoading] = useState(true);
  const [aderenteStores, setAderenteStores] = useState<Store[]>([]); // Lojas do Aderente
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<number | 'all'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'store'>('list');

  useEffect(() => {
    const loadData = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        setLoading(false);
        return;
      }

      const stores = await db.getStores();
      const allUsers = await db.getUsers();
      
      // Encontrar TODAS as lojas do Aderente (pode ter múltiplas)
      const myStores = stores.filter(s => s.aderenteId === currentUser.userId);
      setAderenteStores(myStores);
      
      if (myStores.length === 0) {
        console.warn('Aderente não tem loja atribuída');
        setLoading(false);
        return;
      }

      // IDs das lojas do Aderente
      const myStoreIds = myStores.map(s => s.id);

      // Carregar TODAS as auditorias (sem filtrar por userId)
      const allAudits = await db.getAudits(); // Sem parâmetro = retorna todas
      
      // Filtrar auditorias das lojas do Aderente que foram submetidas (de DOT ou AMONT, excluindo Admin)
      const enriched = allAudits
        .filter(a => {
          const isMyStore = myStoreIds.includes(a.store_id);
          const isSubmitted = a.status >= AuditStatus.SUBMITTED;
          // Exclude admin-created audits
          const createdBy = (a as any).createdBy ?? (a as any).created_by;
          if (createdBy) {
            const creator = allUsers.find(u => u.id === createdBy);
            if (creator?.roles?.includes('ADMIN' as any)) return false;
          }
          return isMyStore && isSubmitted;
        })
        .map(a => {
          const auditStore = myStores.find(s => s.id === a.store_id);
          return {
            ...a,
            store: auditStore!
          };
        })
        .filter(a => a.store); // Garantir que tem store

      setAudits(enriched);

      // Filtrar visitas criadas pelo próprio Aderente (a outras lojas)
      const myCreatedVisits = allAudits
        .filter(a => {
          const isCreatedByMe = a.createdBy === currentUser.userId;
          const isNotMyStore = !myStoreIds.includes(a.store_id);
          return isCreatedByMe && isNotMyStore;
        })
        .map(a => {
          const visitStore = stores.find(s => s.id === a.store_id);
          return {
            ...a,
            store: visitStore || myStores[0] // fallback
          };
        });

      setMyVisits(myCreatedVisits);

      setLoading(false);
    };
    loadData();
  }, []);

  // Auditorias filtradas por loja
  const filteredAudits = useMemo(() => {
    if (selectedStoreFilter === 'all') return audits;
    return audits.filter(a => a.store_id === selectedStoreFilter);
  }, [audits, selectedStoreFilter]);

  const getStatusBadge = (status: AuditStatus) => {
    switch(status) {
      case AuditStatus.IN_PROGRESS:
        return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-medium">Em Curso</span>;
      case AuditStatus.SUBMITTED:
        return <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded font-medium">Submetida</span>;
      case AuditStatus.ENDED:
        return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-medium">Concluída</span>;
      default:
        return null;
    }
  };

  // Stats for own visits
  const filteredMyVisits = useMemo(() => {
    if (selectedStoreFilter === 'all') return myVisits;
    return myVisits.filter(v => v.store_id === selectedStoreFilter);
  }, [myVisits, selectedStoreFilter]);

  const myVisitsInProgress = filteredMyVisits.filter(v => v.status < AuditStatus.SUBMITTED);
  const myVisitsCompleted = filteredMyVisits.filter(v => v.status >= AuditStatus.SUBMITTED);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Aderente</h1>
          <p className="text-gray-500">Bem-vindo, {getCurrentUser()?.name}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{filteredAudits.length}</div>
                <div className="text-sm text-gray-500">Auditorias Recebidas</div>
              </div>
              <FileText className="text-gray-400" size={32} />
            </div>
          </div>
        </div>



        {/* Filtro por Loja (apenas se tiver mais de uma loja) - mostrado em ambas abas */}
        {aderenteStores.length > 1 && (
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <Filter className="text-gray-500" size={20} />
              <label className="text-sm font-medium text-gray-700">Filtrar por Loja:</label>
              <select
                value={selectedStoreFilter}
                onChange={(e) => setSelectedStoreFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="flex-1 max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mousquetaires focus:border-mousquetaires"
              >
                <option value="all">Todas as Lojas ({aderenteStores.length})</option>
                {aderenteStores.map(store => (
                  <option key={store.id} value={store.id}>
                    {store.city} - {store.codehex} ({store.nome})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Recent Audits - Vista em Lista */}
        {viewMode === 'list' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-700">Visitas Recentes</h3>
            <p className="text-xs text-gray-500 mt-1">Visitas realizadas por DOTs às suas lojas</p>
          </div>
          <div className="divide-y divide-gray-100">
            {loading ? (
              <p className="p-4 text-gray-500">A carregar...</p>
            ) : filteredAudits.length === 0 ? (
              <p className="p-4 text-gray-500">Nenhuma visita recebida ainda.</p>
            ) : (
              filteredAudits.slice(0, 5).map(audit => (
                <div
                  key={audit.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex-1 cursor-pointer" 
                      onClick={() => navigate(`/aderente/audit/${audit.id}`)}
                    >
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-semibold text-gray-900">
                          {audit.store.nome} - {audit.store.city}
                        </h4>
                        {getStatusBadge(audit.status)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(audit.dtstart).toLocaleDateString('pt-PT', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                      {audit.score !== undefined && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-700">
                              Pontuação: {audit.score.toFixed(0)}%
                            </div>
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                              <div
                                className={`h-2 rounded-full ${
                                  audit.score < 50
                                    ? 'bg-red-500'
                                    : audit.score < 80
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                                }`}
                                style={{ width: `${audit.score}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/aderente/audit/${audit.id}`);
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
        )}

        {/* Audits by Store - Vista Agrupada por Loja */}
        {viewMode === 'store' && (
        <div className="space-y-4 mb-8">
          {loading ? (
            <p className="text-gray-500">A carregar...</p>
          ) : filteredAudits.length === 0 ? (
            <p className="text-gray-500">Nenhuma visita recebida ainda.</p>
          ) : (
            aderenteStores.map(store => {
              const storeAudits = filteredAudits.filter(a => a.store_id === store.id);
              if (storeAudits.length === 0) return null;
              
              return (
                <div key={store.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {store.city} <span className="text-sm text-gray-500">({store.codehex})</span>
                  </h3>
                  <div className="text-sm text-gray-600 mb-4">{store.nome} • {store.size}</div>
                  <div className="space-y-2">
                    {storeAudits.map(audit => (
                      <div
                        key={audit.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer transition-colors"
                        onClick={() => navigate(`/aderente/audit/${audit.id}`)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-sm text-gray-900">
                            {new Date(audit.dtstart).toLocaleDateString('pt-PT')}
                          </span>
                          {audit.status === 'SUBMITTED' && (
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Submetida</span>
                          )}
                          {audit.status === 'COMPLETED' && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Concluída</span>
                          )}
                        </div>
                        {audit.score !== undefined && (
                          <span className="text-sm font-bold text-gray-900">{audit.score.toFixed(0)}%</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
        )}

        {/* My Visits to Other Stores */}
        {filteredMyVisits.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-700">Minhas Visitas a Outras Lojas</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {filteredMyVisits.map(visit => (
                <div
                  key={visit.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex-1 cursor-pointer" 
                      onClick={() => navigate(`/aderente/visit/${visit.id}`)}
                    >
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-semibold text-gray-900">
                          {visit.store.nome} - {visit.store.city}
                        </h4>
                        {getStatusBadge(visit.status)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(visit.dtstart).toLocaleDateString('pt-PT', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                      {visit.score !== undefined && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-700">
                              Pontuação: {visit.score.toFixed(0)}%
                            </div>
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                              <div
                                className={`h-2 rounded-full ${
                                  visit.score < 50
                                    ? 'bg-red-500'
                                    : visit.score < 80
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                                }`}
                                style={{ width: `${visit.score}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
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
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
