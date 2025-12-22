import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { PlusCircle, Calendar, List } from 'lucide-react';
import { db } from '../services/dbAdapter';
import { Audit, Store, UserRole, AuditStatus } from '../types';
import { getCurrentUser } from '../utils/auth';
import { MonthPlanner } from '../components/calendar/MonthPlanner';

export const AmontDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [audits, setAudits] = useState<(Audit & { store: Store })[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');

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
      <>
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard AMONT</h1>
            <p className="text-gray-600 mt-1">Suas auditorias</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
              variant="secondary"
            >
              {viewMode === 'list' ? (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Calendário
                </>
              ) : (
                <>
                  <List className="w-4 h-4 mr-2" />
                  Lista
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Total</div>
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

        {/* Conteúdo */}
        {viewMode === 'calendar' ? (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Calendário de Auditorias</h2>
            <MonthPlanner
              audits={audits}
              onAuditClick={handleAuditClick}
            />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Lista de Auditorias</h2>
            </div>
            {audits.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Nenhuma auditoria criada ainda.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {audits.map(audit => (
                  <div
                    key={audit.id}
                    onClick={() => handleAuditClick(audit.id)}
                    className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {audit.store.nome || audit.store.codehex}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(audit.status)}`}>
                            {getStatusText(audit.status)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Loja: {audit.store.codehex}
                          {audit.store.numero && ` • Nº ${audit.store.numero}`}
                        </p>
                        <div className="flex gap-4 text-sm text-gray-500 mt-2">
                          <span>
                            Início: {new Date(audit.dtstart).toLocaleDateString('pt-PT')}
                          </span>
                          {audit.dtend && (
                            <span>
                              Fim: {new Date(audit.dtend).toLocaleDateString('pt-PT')}
                            </span>
                          )}
                        </div>
                      </div>
                      {audit.final_score !== null && audit.final_score !== undefined && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {audit.final_score.toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-500">Score</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
