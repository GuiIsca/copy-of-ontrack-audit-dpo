
import React, { useEffect, useState } from 'react';
import { MonthPlanner } from '../components/calendar/MonthPlanner';
import { WeekPlanner } from '../components/calendar/WeekPlanner';
import { CustomDateRangePlanner } from '../components/calendar/CustomDateRangePlanner';
import { db } from '../services/dbAdapter';
import { Audit, Store, Visit, VisitType, UserRole } from '../types';
import { getCurrentUser } from '../utils/auth';

type VisitItem = (Audit & { store: Store; visitType: VisitType }) | (Visit & { store: Store; visitType: VisitType });


const DotOperacionalCalendarPage: React.FC = () => {
  const [scope, setScope] = useState<'month' | 'week' | 'custom'>('month');
  const [audits, setAudits] = useState<VisitItem[]>([]);
  const [allAudits, setAllAudits] = useState<VisitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [minhasVisitas, setMinhasVisitas] = useState(false);
  const currentUser = getCurrentUser();

  useEffect(() => {
    const loadData = async () => {
      const stores = await db.getStores();
      const allAuditsData = await db.getAudits();
      const allVisitsData = await db.getVisits();
      let auditsToShow: VisitItem[] = [];
      let visitsToShow: VisitItem[] = [];
      if (currentUser) {
        // Só mostrar auditorias do operacional logado
        auditsToShow = allAuditsData.filter(a => {
          const dotId = (a as any).dot_operacional_id || (a as any).dot_user_id;
          const createdBy = (a as any).createdBy ?? (a as any).created_by;
          return dotId === currentUser.userId || createdBy === currentUser.userId;
        });
        // Só mostrar visitas do operacional logado
        visitsToShow = allVisitsData.filter(v => {
          return v.user_id === currentUser.userId;
        });
      }
      function normalizeVisitType(type: any): VisitType {
        if (!type) return VisitType.OUTROS;
        const t = String(type).toLowerCase();
        if (t === 'auditoria') return VisitType.AUDITORIA;
        return VisitType.OUTROS;
      }
      const enrichedAudits: VisitItem[] = auditsToShow
        .map(audit => {
          const store = stores.find(s => s.id === audit.store_id);
          const createdBy = (audit as any).createdBy ?? (audit as any).created_by;
          let visitType: VisitType = VisitType.OUTROS;
          if ((audit as any).visitType) {
            visitType = normalizeVisitType((audit as any).visitType);
          } else if ((audit as any).type) {
            visitType = normalizeVisitType((audit as any).type);
          }
          return store ? { ...audit, createdBy, store, visitType, isAudit: true } as VisitItem & { isAudit: boolean } : null;
        })
        .filter((audit): audit is VisitItem & { isAudit: boolean } => audit !== null);
      const enrichedVisits: VisitItem[] = visitsToShow
        .map(visit => {
          const store = stores.find(s => s.id === visit.store_id);
          const createdBy = (visit as any).createdBy ?? (visit as any).created_by;
          let visitType: VisitType = VisitType.OUTROS;
          if ((visit as any).visitType) {
            visitType = normalizeVisitType((visit as any).visitType);
          } else if ((visit as any).type) {
            visitType = normalizeVisitType((visit as any).type);
          }
          return store ? { ...visit, createdBy, store, visitType, isAudit: false } as VisitItem & { isAudit: boolean } : null;
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
    // O DOT Operacional só vê as SUAS auditorias e visitas, sempre
    setAudits(allAudits);
  }, [allAudits, currentUser]);

  return (
    <div className="p-6">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={() => window.location.href = '/dot-operacional/menu'}
          style={{ position: 'relative', left: 0, top: 0, zIndex: 10 }}
          className="flex items-center gap-2 px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold shadow"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Voltar
        </button>
        {/* Botão 'Minhas Visitas' removido, pois não é necessário para DOT Operacional */}
      </div>
      <h2 style={{textAlign: 'center', fontWeight: 700, fontSize: 28, margin: '2rem 0 1rem'}}>Calendário DOT Operacional</h2>
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
              {scope === 'month' && <MonthPlanner audits={audits || []} onAuditClick={()=>{}} />}
              {scope === 'week' && <WeekPlanner audits={audits || []} onAuditClick={()=>{}} />}
              {scope === 'custom' && <CustomDateRangePlanner audits={audits || []} onAuditClick={()=>{}} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DotOperacionalCalendarPage;
