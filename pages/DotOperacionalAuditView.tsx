import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { CommentThread } from '../components/audit/CommentThread';
import { ArrowLeft, Image as ImageIcon, FileText, CheckCircle, XCircle, ListTodo, User, Clock, Calendar } from 'lucide-react';
import { db } from '../services/dbAdapter';
import { Audit, AuditScore, AuditStatus, Checklist, Store, ActionPlan, SectionEvaluation } from '../types';

export const DotOperacionalAuditView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [audit, setAudit] = useState<Audit | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [scores, setScores] = useState<AuditScore[]>([]);
  const [actions, setActions] = useState<ActionPlan[]>([]);
  const [sectionEvaluations, setSectionEvaluations] = useState<SectionEvaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (!id) { setLoading(false); return; }
      const auditData = await db.getAuditById(Number(id));
      if (!auditData) { navigate('/dashboard'); return; }
      setAudit(auditData);
      console.log('DotOperacionalAuditView: audit =', auditData);
      
      const stores = await db.getStores();
      setStore(stores.find(s => s.id === auditData.store_id) || null);
      
      const checklistData = await db.getChecklist(auditData.checklist_id);
      setChecklist(checklistData || null);
      console.log('DotOperacionalAuditView: checklist =', checklistData);
      if (checklistData?.sections) {
        console.log('Section IDs:', checklistData.sections.map(s => ({ id: s.id, name: s.name })));
      }
      
      const scoresData = await db.getScores(Number(id));
      setScores(scoresData || []);
      console.log('DotOperacionalAuditView: scores =', scoresData);
      
      const actionsData = await db.getActions(Number(id));
      setActions(actionsData || []);
      console.log('DotOperacionalAuditView: actions =', actionsData);
      
      const sectionEvalsData = await db.getSectionEvaluations(Number(id));
      setSectionEvaluations(sectionEvalsData || []);
      console.log('DotOperacionalAuditView: sectionEvaluations =', sectionEvalsData);
      if (sectionEvalsData && sectionEvalsData.length > 0) {
        console.log('First section evaluation details:', JSON.stringify(sectionEvalsData[0], null, 2));
      }
      
      setLoading(false);
    };
    load();
  }, [id, navigate]);

  const getScoreForCriteria = (criteriaId: number): AuditScore | undefined => {
    return scores.find(s => s.criteria_id === criteriaId);
  };

  const getSectionEvaluation = (sectionId: number): SectionEvaluation | undefined => {
    return sectionEvaluations.find(se => Number(se.section_id) === sectionId);
  };

  const getScoreBadge = (score: number | null) => {
    if (score === null) return <span className="text-gray-400 text-sm">Não avaliado</span>;
    if (score === 1) {
      return (
        <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-semibold">✓ OK</span>
      );
    }
    if (score === 0) {
      return (
        <span className="bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full font-semibold">✗ KO</span>
      );
    }
    return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded font-medium">{score}</span>;
  };

  const getActionStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded font-medium">Pendente</span>;
      case 'in_progress':
        return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-medium">Em Progresso</span>;
      case 'completed':
        return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-medium">Concluída</span>;
      default:
        return null;
    }
  };

  if (loading || !audit || !store || !checklist) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-gray-500">A carregar...</p>
        </div>
      </div>
    );
  }

  const completedActions = actions.filter(a => a.status === 'completed').length;
  const totalActions = actions.length;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')} className="mb-4">
            <ArrowLeft size={16} className="mr-2" />
            Voltar ao Dashboard
          </Button>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">Visita de Auditoria</h1>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div><span className="font-medium">Número:</span> {store.numero}</div>
                  <div><span className="font-medium">Loja:</span> {store.nome} - {store.distrito}</div>
                  <div><span className="font-medium">Data:</span> {new Date(audit.dtstart).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                  {audit.score !== undefined && audit.score !== null && (
                    <div>
                      <span className="font-medium">Pontuação Final:</span>{' '}
                      <span className={`font-bold ${audit.score < 50 ? 'text-red-600' : audit.score < 80 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {audit.score.toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {totalActions > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                      <ListTodo size={16} />
                      Plano de Ação
                    </h3>
                    <p className="text-sm text-gray-600">{completedActions} de {totalActions} ações concluídas</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-48 bg-gray-200 rounded-full h-3">
                      <div className="bg-green-500 h-3 rounded-full transition-all" style={{ width: `${(completedActions / totalActions) * 100}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{Math.round((completedActions / totalActions) * 100)}%</span>
                  </div>
                </div>
              </div>
            )}

            {audit.auditorcomments && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FileText size={16} />
                  Observações Gerais do Auditor
                </h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">{audit.auditorcomments}</p>
              </div>
            )}
          </div>
        </div>

        {/* Checklist Results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Resultados da Avaliação
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Secções: {checklist.sections?.length || 0} | Scores: {scores.length}
            </p>
          </div>
          
          <div className="divide-y divide-gray-100">
            {!checklist.sections || checklist.sections.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Nenhuma secção encontrada na checklist.
              </div>
            ) : (
              checklist.sections.map(section => {
                const sectionEval = getSectionEvaluation(section.id);
                console.log(`Section ${section.id} (${section.name}):`, sectionEval);
                return (
                <div key={section.id} className="p-6">
                  <h3 className="text-base font-semibold text-gray-800 mb-4">
                    {section.name}
                  </h3>
                  
                  {/* Section Evaluation (Rating 1-5) */}
                  {sectionEval && sectionEval.rating && (
                    <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">Avaliação da Secção:</span>
                        <span className="bg-gray-600 text-white px-3 py-1 rounded-full font-bold">
                          {sectionEval.rating}/5
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Section Action Plan */}
                  {sectionEval && (sectionEval.action_plan || sectionEval.responsible || sectionEval.due_date) && (
                    <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <ListTodo size={16} />
                        Plano de Ação da Secção
                      </h4>
                      {sectionEval.action_plan && (
                        <p className="text-sm text-gray-700 mb-2">{sectionEval.action_plan}</p>
                      )}
                      <div className="flex gap-4 text-xs text-gray-600">
                        {sectionEval.responsible && (
                          <div className="flex items-center gap-1">
                            <User size={12} />
                            <span>Responsável: {sectionEval.responsible}</span>
                          </div>
                        )}
                        {sectionEval.due_date && (
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            <span>Data Limite: {new Date(sectionEval.due_date).toLocaleDateString('pt-PT')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {section.items.map(item => (
                    <div key={item.id} className="ml-4 mb-6 last:mb-0">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        {item.name}
                      </h4>
                      
                      <div className="space-y-3">
                        {item.criteria.map(criteria => {
                          const scoreData = getScoreForCriteria(criteria.id);
                          
                          return (
                            <div
                              key={criteria.id}
                              className="ml-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <p className="text-sm text-gray-900 font-medium">
                                    {criteria.name}
                                  </p>
                              </div>
                              <div className="ml-4">
                                {getScoreBadge(scoreData?.score ?? null)}
                              </div>
                            </div>

                              {/* Comment */}
                              {scoreData?.comment && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <p className="text-xs font-semibold text-gray-600 mb-1">
                                    💬 Comentário:
                                  </p>
                                  <p className="text-sm text-gray-700">
                                    {scoreData.comment}
                                  </p>
                                </div>
                              )}

                              {/* Photos */}
                              {scoreData?.photos && scoreData.photos.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                                    <ImageIcon size={14} />
                                    Fotografias ({scoreData.photos.length}):
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {scoreData.photos.map((photo, idx) => (
                                      <div
                                        key={idx}
                                        className="relative group cursor-pointer"
                                      >
                                        <img
                                          src={photo}
                                          alt={`Foto ${idx + 1}`}
                                          className="w-20 h-20 object-cover rounded border border-gray-300"
                                          onClick={() => window.open(photo, '_blank')}
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded flex items-center justify-center">
                                          <span className="text-white text-xs opacity-0 group-hover:opacity-100">
                                            🔍 Ampliar
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })
            )}
          </div>
        </div>

        {/* Comment Thread */}
        <CommentThread auditId={audit.id} />

        {/* Action Plan */}
        {actions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ListTodo size={20} />
                Plano de Ação
              </h2>
            </div>
            
            <div className="p-6">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="text-2xl font-bold text-gray-900">{actions.length}</div>
                  <div className="text-sm text-gray-500">Total</div>
                </div>
                <div className="bg-red-50 rounded-lg border border-red-200 p-4">
                  <div className="text-2xl font-bold text-red-600">{actions.filter(a => a.status === 'pending').length}</div>
                  <div className="text-sm text-red-600">Pendentes</div>
                </div>
                <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
                  <div className="text-2xl font-bold text-yellow-600">{actions.filter(a => a.status === 'in_progress').length}</div>
                  <div className="text-sm text-yellow-600">Em Progresso</div>
                </div>
                <div className="bg-green-50 rounded-lg border border-green-200 p-4">
                  <div className="text-2xl font-bold text-green-600">{completedActions}</div>
                  <div className="text-sm text-green-600">Concluídas</div>
                </div>
              </div>

              {/* Actions List */}
              <div className="space-y-4">
                {actions.map(action => {
                  const isOverdue = new Date(action.dueDate) < new Date() && action.status !== 'completed';
                  
                  return (
                    <div key={action.id} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{action.title}</h3>
                            {getActionStatusBadge(action.status)}
                            {isOverdue && (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                                Atrasada
                              </span>
                            )}
                          </div>
                          
                          {action.description && (
                            <p className="text-sm text-gray-600 mb-3">{action.description}</p>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <User size={14} />
                              <span>{action.responsible}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              <span>Prazo: {new Date(action.dueDate).toLocaleDateString('pt-PT')}</span>
                            </div>
                            {action.completedDate && (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle size={14} />
                                <span>Concluída: {new Date(action.completedDate).toLocaleDateString('pt-PT')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default DotOperacionalAuditView;
