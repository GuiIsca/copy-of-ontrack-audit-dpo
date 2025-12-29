

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { FileText, Filter } from 'lucide-react';
import { db } from '../services/dbAdapter';
import { Audit, AuditStatus, Store } from '../types';
import { getCurrentUser } from '../utils/auth';

const AderenteVisitasrecentes: React.FC = () => {
  const navigate = useNavigate();
  const [audits, setAudits] = useState<(Audit & { store: Store })[]>([]);
  const [myVisits, setMyVisits] = useState<(Audit & { store: Store })[]>([]);
  const [loading, setLoading] = useState(true);
  const [aderenteStores, setAderenteStores] = useState<Store[]>([]);
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<number | 'all'>('all');

  useEffect(() => {
    const loadData = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        setLoading(false);
        return;
      }
      const stores = await db.getStores();
      const allUsers = await db.getUsers();
      const myStores = stores.filter(s => (s.aderente_id || (s as any).aderenteId) === currentUser.userId);
      setAderenteStores(myStores);
      if (myStores.length === 0) {
        setLoading(false);
        return;
      }
      const myStoreIds = myStores.map(s => s.id);
      const allAudits = await db.getAudits();
      const enriched = allAudits
        .filter(a => {
          const isMyStore = myStoreIds.includes(a.store_id);
          const isSubmittedOrReplaced = a.status >= AuditStatus.SUBMITTED;
          const createdBy = (a as any).createdBy ?? (a as any).created_by;
          if (createdBy) {
            const creator = allUsers.find(u => u.id === createdBy);
            if (creator?.roles?.includes('ADMIN' as any)) return false;
            if (creator?.roles?.includes('AMONT' as any)) return false;
          }
          return isMyStore && isSubmittedOrReplaced;
        })
        .map(a => {
          const auditStore = myStores.find(s => s.id === a.store_id);
          return {
            ...a,
            store: auditStore!
          };
        })
        .filter(a => a.store);
      setAudits(enriched);

      // Visitas criadas pelo próprio aderente a outras lojas
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
            store: visitStore || myStores[0]
          };
        });
      setMyVisits(myCreatedVisits);

      setLoading(false);
    };
    loadData();
  }, []);

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
      case AuditStatus.REPLACED:
        return <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded font-medium">Sobreposto</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Card de stats igual ao dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex items-center justify-between md:col-start-2 md:col-end-4 mx-auto" style={{ minWidth: 260 }}>
          <div>
            <div className="text-2xl font-bold text-gray-900">{filteredAudits.length}</div>
            <div className="text-sm text-gray-500">Auditorias Recebidas</div>
          </div>
          <FileText className="text-gray-400" size={32} />
        </div>
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
                  {store.city} - {store.codehex} ({store.nome})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Recent Audits - Vista em Lista */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700">Visitas Recentes</h3>
          <p className="text-xs text-gray-500 mt-1">Visitas realizadas por DOTs/Aderentes às suas lojas</p>
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
                    {audit.score != null && (
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
    </div>
  );
};

export default AderenteVisitasrecentes;
