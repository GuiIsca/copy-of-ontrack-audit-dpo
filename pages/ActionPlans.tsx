import React, { useEffect, useState } from 'react';
import { Header } from '../components/layout/Header';
import { db } from '../services/dbAdapter';
import { Audit, AuditStatus, Store } from '../types';
import { getCurrentUser } from '../utils/auth';

export const ActionPlans: React.FC = () => {
  const [audits, setAudits] = useState<(Audit & { store: Store })[]>([]);
  const [actionPlans, setActionPlans] = useState<any[]>([]);
  const [sectionNames, setSectionNames] = useState<Record<string, string>>({});
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [selectedActionPlan, setSelectedActionPlan] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        setLoading(false);
        return;
      }

      const stores = await db.getStores();
      
      // Encontrar TODAS as lojas do Aderente
      const myStores = stores.filter(s => s.aderenteId === currentUser.userId);
      
      if (myStores.length === 0) {
        setLoading(false);
        return;
      }

      const myStoreIds = myStores.map(s => s.id);

      // Carregar TODAS as auditorias
      const allAudits = await db.getAudits();
      
      // Filtrar auditorias das lojas do Aderente que foram submetidas
      const enriched = allAudits
        .filter(a => {
          const isMyStore = myStoreIds.includes(a.store_id);
          const isSubmitted = a.status >= AuditStatus.SUBMITTED;
          return isMyStore && isSubmitted;
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

      // Carregar planos de ação
      const allActionPlans: any[] = [];
      const nameMap: Record<string, string> = {};
      
      for (const audit of enriched) {
        try {
          const response = await fetch(`${window.location.origin}/api/section-evaluations?auditId=${audit.id}`);
          const data = await response.json();
          allActionPlans.push(...data);
          
          // Carregar o checklist para mapear nomes das secções
          try {
            const checklistResponse = await fetch(`${window.location.origin}/api/checklists`);
            const checklistsData = await checklistResponse.json();
            
            let checklist = null;
            
            // Tentar usar o checklist_id da auditoria
            if ((audit as any).checklist_id && Array.isArray(checklistsData)) {
              checklist = checklistsData.find((c: any) => c.id === (audit as any).checklist_id);
            }
            
            // Fallback: usar o primeiro checklist
            if (!checklist) {
              if (Array.isArray(checklistsData) && checklistsData.length > 0) {
                checklist = checklistsData[0];
              } else if (checklistsData && checklistsData.sections) {
                checklist = checklistsData;
              }
            }
            
            if (checklist && checklist.sections && Array.isArray(checklist.sections)) {
              // Mapear por índice
              checklist.sections.forEach((section: any, index: number) => {
                const sectionName = section.name || section.section_name;
                nameMap[String(index)] = sectionName;
              });
              
              // Mapear por ID da secção
              checklist.sections.forEach((section: any) => {
                if (section.id) {
                  const sectionName = section.name || section.section_name;
                  nameMap[String(section.id)] = sectionName;
                }
              });
            }
          } catch (_) {
            // Erro ao carregar checklist
          }
        } catch (_) {
          // Erro ao carregar planos de ação
        }
      }
      
      setActionPlans(allActionPlans);
      setSectionNames(nameMap);
      setLoading(false);
    };
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Planos de Ação</h1>
          <p className="text-gray-500">Tarefas atribuídas pelos DOTs durante as auditorias</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{actionPlans.length}</div>
                <div className="text-sm text-gray-500">Total Planos</div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg shadow-sm border border-green-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {actionPlans.filter(p => {
                    const dueDate = new Date(p.due_date);
                    return dueDate >= new Date();
                  }).length}
                </div>
                <div className="text-sm text-green-600">No Prazo</div>
              </div>
            </div>
          </div>

          <div className="bg-red-50 rounded-lg shadow-sm border border-red-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {actionPlans.filter(p => {
                    const dueDate = new Date(p.due_date);
                    return dueDate < new Date();
                  }).length}
                </div>
                <div className="text-sm text-red-600">Atrasados</div>
              </div>
            </div>
          </div>
        </div>

        {/* Planos de Ação */}
        <div className="space-y-4">
          {loading ? (
            <p className="text-gray-500">A carregar planos de ação...</p>
          ) : actionPlans.length === 0 ? (
            <p className="text-gray-500">Nenhum plano de ação pendente.</p>
          ) : (
            <>
              {/* Agrupar por secção */}
              {Array.from(new Set(actionPlans.map(p => p.section_id)))
                .sort((a, b) => parseInt(a) - parseInt(b))
                .map(sectionId => {
                  const sectionPlans = actionPlans.filter(p => p.section_id === sectionId);
                  const isExpanded = expandedSections.includes(String(sectionId));
                  
                  return (
                    <div key={sectionId} className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {sectionNames[String(sectionId)] || `Secção ${sectionId}`} <span className="text-sm text-gray-500">({sectionPlans.length})</span>
                      </h3>
                      <div className="text-sm text-gray-600 mb-3">
                        {Array.from(new Set(sectionPlans.map(p => {
                          const audit = audits.find(a => a.id === p.audit_id);
                          return audit?.store.nome;
                        }))).join(', ')}
                      </div>
                      <div className="space-y-2">
                        {(isExpanded ? sectionPlans : sectionPlans.slice(0, 5)).map((plan, idx) => {
                          const audit = audits.find(a => a.id === plan.audit_id);
                          const dueDate = new Date(plan.due_date);
                          const today = new Date();
                          const isOverdue = dueDate < today;
                          const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                          
                          return (
                            <div 
                              key={`${plan.audit_id}-${sectionId}-${idx}`} 
                              className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
                              onClick={() => setSelectedActionPlan({...plan, sectionId})}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <span className="text-sm text-gray-900 font-medium">Auditoria {new Date(audit?.dtstart || '').toLocaleDateString('pt-PT')}</span>
                                {isOverdue ? (
                                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded whitespace-nowrap">Atrasado</span>
                                ) : daysUntilDue <= 7 ? (
                                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded whitespace-nowrap">Urgente</span>
                                ) : null}
                              </div>
                              <span className="text-sm text-gray-600 ml-2 whitespace-nowrap">{plan.responsible}</span>
                            </div>
                          );
                        })}
                        {sectionPlans.length > 5 && !isExpanded && (
                          <div className="text-center pt-1">
                            <button
                              className="text-sm text-mousquetaires hover:text-red-900 font-medium"
                              onClick={() => setExpandedSections(prev => [...prev, String(sectionId)])}
                            >
                              Ver mais
                            </button>
                          </div>
                        )}
                        {sectionPlans.length > 5 && isExpanded && (
                          <div className="text-center pt-1">
                            <button
                              className="text-sm text-gray-600 hover:text-gray-800"
                              onClick={() => setExpandedSections(prev => prev.filter(id => id !== String(sectionId)))}
                            >
                              Ver menos
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </>
          )}
        </div>

        {/* Modal de Detalhes do Plano de Ação */}
        {selectedActionPlan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-mousquetaires text-white p-6 flex items-center justify-between border-b">
                <div>
                  <h2 className="text-2xl font-bold">Plano de Ação</h2>
                  <p className="text-sm text-gray-100 mt-1">{sectionNames[String(selectedActionPlan.sectionId)] || `Secção ${selectedActionPlan.sectionId}`}</p>
                </div>
                <button
                  onClick={() => setSelectedActionPlan(null)}
                  className="text-white hover:bg-opacity-80 p-2 rounded"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Plano de Ação */}
                <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Plano de Ação</h4>
                  <p className="text-sm text-gray-700">{selectedActionPlan.action_plan}</p>
                </div>

                {/* Avaliação da Secção */}
                {selectedActionPlan.score !== undefined && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Avaliação da Secção</h4>
                    <div className="flex items-center gap-2">
                      <div className="text-3xl font-bold text-blue-600">{selectedActionPlan.score.toFixed(1)}%</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-3 max-w-xs">
                        <div
                          className={`h-3 rounded-full ${
                            selectedActionPlan.score < 50
                              ? 'bg-red-500'
                              : selectedActionPlan.score < 80
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${selectedActionPlan.score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Detalhes */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-500">Responsável</div>
                    <div className="font-medium text-gray-900">{selectedActionPlan.responsible}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Data Limite</div>
                    <div className="font-medium text-gray-900">{new Date(selectedActionPlan.due_date).toLocaleDateString('pt-PT')}</div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 border-t flex justify-end gap-3">
                <button
                  onClick={() => setSelectedActionPlan(null)}
                  className="px-4 py-2 bg-mousquetaires text-white rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
