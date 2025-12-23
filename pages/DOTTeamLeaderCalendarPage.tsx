
import React, { useEffect, useState } from 'react';
import { MonthPlanner } from '../components/calendar/MonthPlanner';
import { WeekPlanner } from '../components/calendar/WeekPlanner';
import { CustomDateRangePlanner } from '../components/calendar/CustomDateRangePlanner';
import { db } from '../services/dbAdapter';
import { Audit, Store, Visit, VisitType, UserRole } from '../types';
import { getCurrentUser } from '../utils/auth';

type VisitItem = (Audit & { store: Store; visitType: VisitType }) | (Visit & { store: Store; visitType: VisitType });

const DOTTeamLeaderCalendarPage: React.FC = () => {
  const [scope, setScope] = useState<'month' | 'week' | 'custom'>('month');
  const [audits, setAudits] = useState<VisitItem[]>([]);
  const [allAudits, setAllAudits] = useState<VisitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [minhasVisitas, setMinhasVisitas] = useState(false);
  const currentUser = getCurrentUser();

  useEffect(() => {
    const loadData = async () => {
      const stores = await db.getStores();
      const allUsers = await db.getUsers();
      const allAuditsData = await db.getAudits();
      let auditsToShow = allAuditsData;
      if (currentUser) {
        const myDots = allUsers
          .filter(u => u.roles?.includes(UserRole.DOT_OPERACIONAL) && (u as any).dotTeamLeaderId === currentUser?.userId)
          .map(u => u.id);
        auditsToShow = allAuditsData.filter(a => {
          const createdBy = (a as any).createdBy ?? (a as any).created_by;
          const isAderenteVisit = (a as any).visit_source_type === 'ADERENTE_VISIT' || (a as any).visitSourceType === 'ADERENTE_VISIT';
          return isAderenteVisit || myDots.includes(a.dot_operacional_id) || createdBy === currentUser?.userId;
        });
      }
      const enrichedAudits: VisitItem[] = auditsToShow
        .map(audit => {
          const store = stores.find(s => s.id === audit.store_id);
          const createdBy = (audit as any).createdBy ?? (audit as any).created_by;
          return store ? { ...audit, createdBy, store, visitType: VisitType.AUDITORIA, isAudit: true } as VisitItem & { isAudit: boolean } : null;
        })
        .filter((audit): audit is VisitItem & { isAudit: boolean } => audit !== null);
      const allVisitsData = await db.getVisits();
      const enrichedVisits: VisitItem[] = allVisitsData
        .map(visit => {
          const store = stores.find(s => s.id === visit.store_id);
          const createdBy = (visit as any).createdBy ?? (visit as any).created_by;
          return store ? { ...visit, createdBy, store, visitType: visit.type as VisitType, isAudit: false } as VisitItem & { isAudit: boolean } : null;
        })
        .filter((visit): visit is VisitItem & { isAudit: boolean } => visit !== null);

      const allItems = [...enrichedAudits, ...enrichedVisits];
      setAllAudits(allItems);
      setLoading(false);
    };
    loadData();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    let filtered = allAudits;
    if (minhasVisitas) {
      filtered = filtered.filter(v => {
        const isAudit = (v as any).isAudit === true || v.visitType === VisitType.AUDITORIA;
        if (isAudit) {
          const dotId = (v as any).dot_operacional_id || (v as any).dot_user_id;
          return dotId === currentUser.userId;
        }
        return v.user_id === currentUser.userId;
      });
    } else {
      // Ocultar visitas próprias quando não está em "Minhas Visitas"
      filtered = filtered.filter(v => {
        const isAudit = (v as any).isAudit === true || v.visitType === VisitType.AUDITORIA;
        const createdBy = Number((v as any).createdBy ?? (v as any).created_by);
        const dotId = (v as any).dot_operacional_id || (v as any).dot_user_id;
        const ownerId = isAudit ? (dotId || createdBy) : (v.user_id || createdBy);
        // Só mostrar auditorias SUBMITTED ou ENDED
        if (isAudit) {
          const status = v.status;
          const isSubmitted = status === 'SUBMITTED' || status === 'ENDED' || status === 2 || status === 3;
          return ownerId !== currentUser.userId && isSubmitted;
        }
        return ownerId !== currentUser.userId;
      });
    }
    setAudits(filtered);
  }, [minhasVisitas, allAudits, currentUser]);

  return (
    <div className="p-6">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={() => window.location.href = '/dot-team-leader/menu'}
          style={{ position: 'relative', left: 0, top: 0, zIndex: 10 }}
          className="flex items-center gap-2 px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold shadow"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Voltar
        </button>
        <button
          type="button"
          onClick={() => setMinhasVisitas(v => !v)}
          className={`px-4 py-1 rounded font-medium transition-colors ${minhasVisitas ? 'bg-mousquetaires text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
          style={{ marginLeft: 8 }}
        >
          Minhas Visitas
        </button>
      </div>
      <h2 style={{textAlign: 'center', fontWeight: 700, fontSize: 28, margin: '2rem 0 1rem'}}>Calendário DOT Team Leader</h2>
      <div className="flex justify-center gap-2 mb-4">
        <button onClick={() => setScope('month')} className={`px-4 py-2 rounded-lg text-sm ${scope==='month'?'bg-mousquetaires text-white':'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>Vista Mensal</button>
        <button onClick={() => setScope('week')} className={`px-4 py-2 rounded-lg text-sm ${scope==='week'?'bg-mousquetaires text-white':'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>Vista Semanal</button>
        <button onClick={() => setScope('custom')} className={`px-4 py-2 rounded-lg text-sm ${scope==='custom'?'bg-mousquetaires text-white':'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>Vista Personalizada</button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ transform: 'scale(0.85)', maxWidth: 1100, width: '100%' }}>
          {loading ? (
            <div style={{textAlign:'center',marginTop:'2rem'}}>A carregar...</div>
          ) : (
            <>
              {scope === 'month' && <MonthPlanner audits={Object.assign([...audits], {_minhasVisitas: minhasVisitas})} onAuditClick={()=>{}} />}
              {scope === 'week' && <WeekPlanner audits={audits} onAuditClick={()=>{}} />}
              {scope === 'custom' && <CustomDateRangePlanner audits={audits} onAuditClick={()=>{}} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DOTTeamLeaderCalendarPage;
