import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { PlusCircle, Calendar, List } from 'lucide-react';
import { db } from '../services/dbAdapter';
import { Audit, Store, UserRole, AuditStatus } from '../types';
import { getCurrentUser } from '../utils/auth';
import { MonthPlanner } from '../components/calendar/MonthPlanner';
import { WeekPlanner } from '../components/calendar/WeekPlanner';
import { CustomDateRangePlanner } from '../components/calendar/CustomDateRangePlanner';

export const AmontCalendario: React.FC = () => {
  const navigate = useNavigate();
  const [audits, setAudits] = useState<(Audit & { store: Store })[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'custom'>('month');

  useEffect(() => {
    const loadData = async () => {
      const currentUser = getCurrentUser();
      
      if (!currentUser) {
        navigate('/');
        return;
      }

      try {
        // Carregar apenas auditorias criadas pelo AMONT
        const user = await db.getUserByEmail(currentUser.email);
        if (!user || !user.roles.includes(UserRole.AMONT as any)) {
          navigate('/');
          return;
        }

        const rawAudits = await db.getAudits(user.id);
        const stores = await db.getStores();

        // Filtrar apenas auditorias criadas por este AMONT
        const amontAudits = rawAudits.filter(audit => audit.createdBy === user.id);

        // Enriquecer com dados da loja
        const enrichedAudits = amontAudits.map(audit => {
          const store = stores.find(s => s.id === audit.store_id);
          return {
            ...audit,
            store: store || {
              id: audit.store_id,
              codehex: 'N/A',
              nome: 'Loja desconhecida'
            }
          } as Audit & { store: Store };
        });

        setAudits(enrichedAudits);
      } catch (error) {
        console.error('Erro ao carregar auditorias:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [navigate]);

  const handleAuditClick = (id: number) => {
    const audit = audits.find(a => a.id === id);
    if (!audit) return;
    
    // Em Curso: NEW/IN_PROGRESS -> execute; Submetida -> audit view
    if (audit.status === AuditStatus.NEW || audit.status === AuditStatus.IN_PROGRESS) {
      navigate(`/amont/execute/${id}`);
    } else {
      navigate(`/amont/audit/${id}`);
    }
  };

  const handleNewAudit = () => {
    navigate('/amont/new-audit');
  };

  const getStatusText = (status: number): string => {
    // Only two states: Em Curso (NEW/IN_PROGRESS) and Submetida (SUBMITTED)
    if (status === AuditStatus.SUBMITTED) return 'Submetida';
    if (status === AuditStatus.NEW || status === AuditStatus.IN_PROGRESS) return 'Em Curso';
    return 'Em Curso';
  };

  const getStatusColor = (status: number): string => {
    if (status === AuditStatus.SUBMITTED) return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">Total de Auditorias</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{audits.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">Em Curso</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">
            {audits.filter(a => a.status === AuditStatus.NEW || a.status === AuditStatus.IN_PROGRESS).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">Submetidas</div>
          <div className="text-3xl font-bold text-yellow-600 mt-2">
            {audits.filter(a => a.status === AuditStatus.SUBMITTED).length}
          </div>
        </div>
      </div>
      <div className="flex gap-2 mb-4">
        <Button variant={viewMode === 'month' ? 'default' : 'secondary'} onClick={() => setViewMode('month')}>
          Mensal
        </Button>
        <Button variant={viewMode === 'week' ? 'default' : 'secondary'} onClick={() => setViewMode('week')}>
          Semanal
        </Button>
        <Button variant={viewMode === 'custom' ? 'default' : 'secondary'} onClick={() => setViewMode('custom')}>
          Personalizada
        </Button>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Calendário de Auditorias</h2>
        {viewMode === 'month' && (
          <MonthPlanner audits={audits} onAuditClick={handleAuditClick} />
        )}
        {viewMode === 'week' && (
          <WeekPlanner audits={audits} onAuditClick={handleAuditClick} />
        )}
        {viewMode === 'custom' && (
          <CustomDateRangePlanner audits={audits} onAuditClick={handleAuditClick} />
        )}
      </div>
    </div>
  );
};
