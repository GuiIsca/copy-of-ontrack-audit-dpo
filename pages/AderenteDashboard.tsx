import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { CheckCircle, Clock, FileText, MapPin, Filter } from 'lucide-react';
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

  useEffect(() => {
    const loadData = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        setLoading(false);
        return;
      }

      const stores = await db.getStores();
      
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
      
      // Filtrar auditorias das lojas do Aderente que foram submetidas
      const enriched = allAudits
        .filter(a => myStoreIds.includes(a.store_id) && a.status >= AuditStatus.SUBMITTED)
        .map(a => {
          const auditStore = myStores.find(s => s.id === a.store_id);
          return {
            ...a,
            store: auditStore!
          };
        })
        .filter(a => a.store); // Garantir que tem store

      setAudits(enriched);

      // Filtrar visitas criadas pelo próprio Aderente (a outras lojas) - TODAS, não apenas submetidas
      console.log('AderenteDashboard: Filtering visits');
      console.log('  currentUser.userId:', currentUser.userId);
      console.log('  myStoreIds:', myStoreIds);
      console.log('  allAudits count:', allAudits.length);
      
      const myCreatedVisits = allAudits
        .filter(a => {
          const isCreatedByMe = a.createdBy === currentUser.userId;
          const isNotMyStore = !myStoreIds.includes(a.store_id);
          console.log(`  Audit ${a.id}: createdBy=${a.createdBy}, store_id=${a.store_id}, isCreatedByMe=${isCreatedByMe}, isNotMyStore=${isNotMyStore}, visit_source_type=${(a as any).visit_source_type}`);
          return isCreatedByMe && isNotMyStore;
        })
        .map(a => {
          const visitStore = stores.find(s => s.id === a.store_id);
          return {
            ...a,
            store: visitStore || myStores[0] // fallback
          };
        });

      console.log('  myCreatedVisits count:', myCreatedVisits.length);
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
    console.log('filteredMyVisits memo:');
    console.log('  selectedStoreFilter:', selectedStoreFilter);
    console.log('  myVisits.length:', myVisits.length);
    if (selectedStoreFilter === 'all') return myVisits;
    const filtered = myVisits.filter(v => v.store_id === selectedStoreFilter);
    console.log('  filtered.length:', filtered.length);
    return filtered;
  }, [myVisits, selectedStoreFilter]);

  const myVisitsInProgress = filteredMyVisits.filter(v => v.status < AuditStatus.SUBMITTED);
  const myVisitsCompleted = filteredMyVisits.filter(v => v.status >= AuditStatus.SUBMITTED);
  
  console.log('Stats computed:');
  console.log('  filteredMyVisits.length:', filteredMyVisits.length);
  if (filteredMyVisits.length > 0) {
    console.log('  Visit statuses:', filteredMyVisits.map(v => ({ id: v.id, status: v.status, statusType: typeof v.status })));
    console.log('  AuditStatus.SUBMITTED value:', AuditStatus.SUBMITTED);
  }
  console.log('  myVisitsInProgress.length:', myVisitsInProgress.length);
  console.log('  myVisitsCompleted.length:', myVisitsCompleted.length);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Aderente</h1>
          <p className="text-gray-500">Bem-vindo, {getCurrentUser()?.name}</p>
        </div>

        {/* Nova Visita Button */}
        <div className="mb-6">
          <Button
            onClick={() => navigate('/aderente/new-visit')}
            className="w-full sm:w-auto"
          >
            <MapPin className="mr-2" size={16} />
            Nova Visita de Auditoria
          </Button>
        </div>

        {/* Filtro por Loja (apenas se tiver mais de uma loja) */}
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
                    {store.city} - {store.codehex} ({store.brand})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button 
            type="button"
            onClick={() => {}}
            className="bg-yellow-50 rounded-lg shadow-sm border border-yellow-100 p-4 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">{myVisitsInProgress.length}</div>
                <div className="text-sm text-yellow-600">Minhas Visitas - Em Progresso</div>
              </div>
              <Clock className="text-yellow-400" size={32} />
            </div>
          </button>

          <button 
            type="button"
            onClick={() => {}}
            className="bg-green-50 rounded-lg shadow-sm border border-green-100 p-4 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{myVisitsCompleted.length}</div>
                <div className="text-sm text-green-600">Minhas Visitas - Concluídas</div>
              </div>
              <CheckCircle className="text-green-400" size={32} />
            </div>
          </button>

          <button 
            type="button"
            onClick={() => {
              if (filteredAudits.length > 0) {
                navigate(`/aderente/audit/${filteredAudits[0].id}`);
              }
            }}
            disabled={filteredAudits.length === 0}
            className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{filteredAudits.length}</div>
                <div className="text-sm text-gray-500">Visitas Recebidas</div>
              </div>
              <FileText className="text-gray-400" size={32} />
            </div>
          </button>
        </div>

        {/* Recent Audits */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-700">Visitas Recentes</h3>
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
                          {audit.store.brand} - {audit.store.city}
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
                          {visit.store.brand} - {visit.store.city}
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
