import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { PlusCircle, Store as StoreIcon, AlertCircle } from 'lucide-react';
import { db } from '../services/dbAdapter';
import { Audit, AuditStatus, Store, Visit, VisitType, UserRole } from '../types';
import { getCurrentUser } from '../utils/auth';
import { canCreateAudit } from '../utils/permissions';
import { ScoreGauge } from '../components/charts/ScoreGauge';
import { MonthPlanner } from '../components/calendar/MonthPlanner';
import { WeekPlanner } from '../components/calendar/WeekPlanner';
import { CustomDateRangePlanner } from '../components/calendar/CustomDateRangePlanner';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  // Redireciona DOT Operacional para o menu avançado se layoutMode=2
  React.useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser?.roles?.includes('DOT_OPERACIONAL') && localStorage.getItem('layoutMode') === '2') {
      window.location.href = '/dot-operacional/menu';
    }
  }, []);
  const [audits, setAudits] = useState<(Audit & { store: Store; visitType?: VisitType; isAudit?: boolean })[]>([]);
  const [assignedStores, setAssignedStores] = useState<Store[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStores, setShowStores] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  type CalendarScope = 'month' | 'week' | 'custom';
  const [calendarScope, setCalendarScope] = useState<CalendarScope>('month');
  const [weekFocusDate, setWeekFocusDate] = useState<Date | undefined>(undefined);

  const handleItemClick = (id: number, itemType: 'audit' | 'visit') => {
    const item = itemType === 'audit' 
      ? audits.find(a => (a as any).isAudit === true && a.id === id)
      : audits.find(a => (a as any).isAudit === false && a.id === id);
    
    if (!item) return;
    
    if (itemType === 'audit') {
      // Se está em progresso (NEW ou IN_PROGRESS), vai para execute (editar)
      // Se está finalizada (COMPLETED), vai para audit (visualizar)
      if (item.status === 0 || item.status === 1) { // NEW ou IN_PROGRESS
        navigate(`/dot-operacional/execute/${id}`);
      } else {
        navigate(`/dot-operacional/audit/${id}`);
      }
    } else {
      // É uma Visit
      navigate(`/visit/${id}`);
    }
  };

  // Wrapper para calendários - detecta automaticamente o tipo
  const handleCalendarClick = (id: number, isAudit?: boolean) => {
    // Se isAudit é passado do calendário, usa isso; senão, procura nos dados
    let itemType: 'audit' | 'visit' = 'audit';
    
    if (isAudit === false) {
      itemType = 'visit';
    } else if (isAudit === true) {
      itemType = 'audit';
    } else {
      // Fallback: procura primeiro por audit, depois por visit
      const auditItem = audits.find(a => (a as any).isAudit === true && a.id === id);
      itemType = auditItem ? 'audit' : 'visit';
    }
    
    handleItemClick(id, itemType);
  };

  useEffect(() => {
    const loadData = async () => {
      const currentUser = getCurrentUser();
      
      if (!currentUser) {
        navigate('/');
        return;
      }

      // Carregar lojas atribuídas ao DOT Operacional
      const user = await db.getUserByEmail(currentUser.email);
      if (user?.roles.includes(UserRole.DOT_OPERACIONAL as any)) {
        const stores = await db.getStoresForDOT(user.id);
        setAssignedStores(stores);
      } else {
        const stores = await db.getStores();
        setAssignedStores(stores);
      }

      // Carregar auditorias e visitas do usuário atual
      const rawAudits = user ? await db.getAudits(user.id) : [];
      const visits: Visit[] = user ? await db.getVisitsForDOT(user.id) : [];
      const stores = await db.getStores();
      const allUsers = await db.getUsers();
      
      // Helper to map visit type from backend
      const mapVisitType = (t: any): VisitType => {
        if (!t) return VisitType.OUTROS;
        const u = String(t).toUpperCase();
        switch(u) {
          case 'AUDITORIA': return VisitType.AUDITORIA;
          case 'FORMACAO':
          case 'FORMAÇÃO': return VisitType.FORMACAO;
          case 'ACOMPANHAMENTO': return VisitType.ACOMPANHAMENTO;
          case 'OUTROS': return VisitType.OUTROS;
          default: return VisitType.OUTROS;
        }
      };
      
      // Filter out admin-created items (but DOT/Aderente can see items assigned to them)
      const filterAdminItems = <T extends { createdBy?: number; created_by?: number; user_id?: number; dot_user_id?: number; dot_operacional_id?: number }>(items: T[]): T[] => {
        // If current user is admin, show everything
        if (user?.roles?.includes('ADMIN' as any)) {
          return items;
        }
        
        return items.filter(item => {
          const createdBy = (item as any).createdBy ?? (item as any).created_by;
          const dotOpId = (item as any).dot_operacional_id ?? (item as any).dot_user_id;
          const itemUserId = (item as any).user_id;
          
          // For DOT Operacional: show if assigned to this DOT (regardless of who created it)
          if (user?.roles?.includes(UserRole.DOT_OPERACIONAL as any)) {
            if (Number(dotOpId) === user?.id) {
              return true; // Show audits assigned to this DOT
            }
            if (Number(itemUserId) === user?.id) {
              return true; // Show visits created by this DOT
            }
          }
          
          if (!createdBy) return true;
          const creator = allUsers.find(u => u.id === createdBy);
          
          // If created by admin, only show if it's assigned to this user
          if (creator?.roles?.includes('ADMIN' as any)) {
            const isAssignedToMe = (item as any).dot_user_id === user?.id || (item as any).user_id === user?.id;
            return isAssignedToMe;
          }
          
          return true;
        });
      };

      const enrichedAudits = filterAdminItems(rawAudits).map(a => ({
          ...a,
          store: stores.find(s => s.id === a.store_id) as Store,
          visitType: VisitType.AUDITORIA,
          isAudit: true,
          sourceId: `audit_${a.id}`
      }));

      // Convert visits to audit-like shape for calendar display
      const enrichedVisits = filterAdminItems(visits).map(v => ({
          id: v.id,
          user_id: v.user_id,
          store_id: v.store_id,
          checklist_id: 0,
          dtstart: v.dtstart,
          status: v.status,
          store: stores.find(s => s.id === v.store_id) as Store,
          visitType: mapVisitType(v.type),
          isAudit: false,
          sourceId: `visit_${v.id}`
      })) as (Audit & { store: Store; visitType: VisitType })[];

      // Merge audits and visits for calendar display
      const merged = [...enrichedAudits, ...enrichedVisits];
      setAudits(merged);
      setAllUsers(allUsers);
      setLoading(false);
    };
    loadData();
  }, [navigate]);

  // Modal de Detalhes da Loja
  if (selectedStore) {
    // Renderizar modal
  }
  
  const StoreModal = () => {
    if (!selectedStore) return null;
    
    // Buscar aderente responsável
    const aderenteId = (selectedStore as any).aderente_id || (selectedStore as any).aderenteId;
    const aderente = aderenteId ? allUsers.find(u => u.id === aderenteId) : null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedStore(null)}>
        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
            <h3 className="text-2xl font-bold text-gray-900">{selectedStore.nome || 'Loja'}</h3>
            <button 
              onClick={() => setSelectedStore(null)}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Informações Básicas */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Informações Básicas</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500 block">Número</label>
                  <p className="text-base text-gray-900">{selectedStore.numero || '-'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500 block">Nome</label>
                  <p className="text-base text-gray-900">{selectedStore.nome || '-'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500 block">Formato</label>
                  <p className="text-base text-gray-900">{selectedStore.formato || '-'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500 block">Situação PdV</label>
                  <p className="text-base text-gray-900">{selectedStore.situacao_pdv || '-'}</p>
                </div>
              </div>
            </div>

            {/* Dados Operacionais */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Dados Operacionais</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500 block">Área (m²)</label>
                  <p className="text-base text-gray-900">{selectedStore.area ? `${selectedStore.area} m²` : '-'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500 block">Telefone</label>
                  <p className="text-base text-gray-900">{selectedStore.telefone || '-'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500 block">Amplitude Horária</label>
                  <p className="text-base text-gray-900">{selectedStore.amplitude_horaria || '-'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500 block">Distrito</label>
                  <p className="text-base text-gray-900">{selectedStore.distrito || '-'}</p>
                </div>
              </div>
            </div>

            {/* Localização */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Localização</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500 block">Morada</label>
                  <p className="text-base text-gray-900">{selectedStore.morada || '-'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500 block">Código Postal</label>
                  <p className="text-base text-gray-900">{selectedStore.codigo_postal || '-'}</p>
                </div>
              </div>
            </div>

            {/* Datas */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Histórico</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500 block">Data de Abertura</label>
                  <p className="text-base text-gray-900">{selectedStore.data_abertura ? new Date(selectedStore.data_abertura).toLocaleDateString('pt-PT') : '-'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500 block">Última Retoma</label>
                  <p className="text-base text-gray-900">{selectedStore.ultima_retoma ? new Date(selectedStore.ultima_retoma).toLocaleDateString('pt-PT') : '-'}</p>
                </div>
              </div>
            </div>

            {/* Contacto Responsável */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Contacto Responsável</h4>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 block">Cônjuge/Sócio</label>
                <p className="text-base text-gray-900">{selectedStore.conjugue_adh || '-'}</p>
              </div>
            </div>

            {/* Aderente */}
            {aderente && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Aderente Responsável</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-semibold text-gray-900">{aderente.fullname || 'N/A'}</p>
                  <p className="text-sm text-gray-600">{aderente.email || 'N/A'}</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end sticky bottom-0 bg-white">
            <button 
              onClick={() => setSelectedStore(null)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header com info de lojas atribuídas */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard DOT Operacional</h1>
          <p className="text-gray-500 mt-1">
            {assignedStores.length > 0 
              ? `${assignedStores.length} loja(s) atribuída(s)`
              : 'Nenhuma loja atribuída'}
          </p>
        </div>

        {/* Lojas Atribuídas - Colapsável */}
        {assignedStores.length > 0 && (
          <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-100">
            <button 
              onClick={() => setShowStores(!showStores)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-xl"
            >
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <StoreIcon size={20} className="text-mousquetaires" />
                Minhas Lojas ({assignedStores.length})
              </h2>
              <svg 
                className={`w-5 h-5 text-gray-500 transition-transform ${showStores ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showStores && (
              <div className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {assignedStores.slice(0, 20).map(store => (
                    <button
                      key={store.id}
                      onClick={() => setSelectedStore(store)}
                      className="border border-gray-200 rounded-lg p-4 hover:border-mousquetaires hover:shadow-md transition-all text-left cursor-pointer hover:bg-gray-50"
                    >
                      <div className="font-semibold text-gray-900">{store.nome}</div>
                      <div className="text-sm text-gray-600">{store.city}</div>
                      <div className="text-xs text-gray-500 mt-1">{store.numero}</div>
                    </button>
                  ))}
                </div>
                {assignedStores.length > 20 && (
                  <p className="text-sm text-gray-500 text-center mt-4">
                    +{assignedStores.length - 20} lojas adicionais (máximo 20 mostradas)
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {assignedStores.length === 0 && (
          <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6 flex items-start gap-3">
            <AlertCircle className="text-yellow-600 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">Sem lojas atribuídas</p>
              <p className="text-sm text-yellow-700 mt-1">
                Contacte o DOT Team Leader ou Administrador para atribuição de lojas.
              </p>
            </div>
          </div>
        )}



        {/* Month Planner Calendar */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
            <p className="text-center text-gray-500">A carregar...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8 overflow-y-auto min-h-[520px]" style={{ scrollbarGutter: 'stable' }}>
            {/* Calendar scope toggle */}
            <div className="mb-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setCalendarScope('month')}
                className={`px-4 py-2 rounded-lg text-sm ${calendarScope === 'month' ? 'bg-mousquetaires text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
              >
                Vista Mensal
              </button>
              <button
                onClick={() => setCalendarScope('week')}
                className={`px-4 py-2 rounded-lg text-sm ${calendarScope === 'week' ? 'bg-mousquetaires text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
              >
                Vista Semanal
              </button>
              <button
                onClick={() => setCalendarScope('custom')}
                className={`px-4 py-2 rounded-lg text-sm ${calendarScope === 'custom' ? 'bg-mousquetaires text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
              >
                Vista Personalizada
              </button>
            </div>

            {calendarScope === 'month' ? (
              <MonthPlanner 
                audits={audits} 
                onAuditClick={handleCalendarClick}
                onDateClick={(date) => {
                  // Navigate to select visit type with pre-selected date
                  navigate('/select-visit-type', { state: { selectedDate: date.toISOString() } });
                }}
                onShowWeek={(date) => { setWeekFocusDate(date); setCalendarScope('week'); }}
              />
            ) : calendarScope === 'week' ? (
              <WeekPlanner 
                audits={audits} 
                onAuditClick={handleCalendarClick}
                onDateClick={(date) => {
                  // Navigate to select visit type with pre-selected date
                  navigate('/select-visit-type', { state: { selectedDate: date.toISOString() } });
                }}
                initialDate={weekFocusDate}
              />
            ) : (
              <CustomDateRangePlanner 
                audits={audits} 
                onAuditClick={handleCalendarClick}
                onDateClick={(date) => {
                  // Navigate to select visit type with pre-selected date
                  navigate('/select-visit-type', { state: { selectedDate: date.toISOString() } });
                }}
              />
            )}

          </div>
        )}

        {/* Modal de Detalhes da Loja */}
        <StoreModal />

      </main>
    </div>
  );
};