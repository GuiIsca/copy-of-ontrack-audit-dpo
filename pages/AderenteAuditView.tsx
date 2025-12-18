import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { CommentThread } from '../components/audit/CommentThread';
import { ArrowLeft, Image as ImageIcon, FileText, ListTodo, User as UserIcon, Calendar } from 'lucide-react';
import { db } from '../services/dbAdapter';
import { Audit, AuditScore, Checklist, Store, User, SectionEvaluation } from '../types';

export const AderenteAuditView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [audit, setAudit] = useState<Audit | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [creator, setCreator] = useState<User | null>(null);
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [scores, setScores] = useState<AuditScore[]>([]);
  const [sectionEvaluations, setSectionEvaluations] = useState<SectionEvaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      // Reset loading state when id changes
      setLoading(true);
      
      if (!id) {
        setLoading(false);
        return;
      }
      
      // Get audit by ID directly (all audits are stored globally)
      const auditData = await db.getAuditById(Number(id));
      if (!auditData) {
        navigate('/aderente/dashboard');
        return;
      }

      setAudit(auditData);
      const stores = await db.getStores();
      const storeId = auditData.store_id || (auditData as any).storeId;
      const foundStore = stores.find(s => s.id === storeId) || null;
      setStore(foundStore);
      
      // Get the creator of the audit
      const creatorData = await db.getUserById(auditData.createdBy);
      setCreator(creatorData || null);
      
      const checklistData = await db.getChecklist(auditData.checklist_id);
      setChecklist(checklistData);
      const scoresData = await db.getScores(Number(id));
      
      // Auto-fill "Loja visitada" (criteria 21002) if not already in scores
      if (foundStore && !scoresData.find(s => s.criteria_id === 21002)) {
        scoresData.push({
          audit_id: Number(id),
          criteria_id: 21002,
          score: null,
          comment: `${foundStore.nome} - ${foundStore.city}`,
          photos: []
        } as AuditScore);
      }
      
      setScores(scoresData);
      const sectionEvalsData = await db.getSectionEvaluations(Number(id));
      setSectionEvaluations(sectionEvalsData || []);
      setLoading(false);
    };
    loadData();
  }, [id, navigate]);

  const getScoreForCriteria = (criteriaId: number): AuditScore | undefined => {
    return scores.find(s => s.criteria_id === criteriaId);
  };

  const getSectionEvaluation = (sectionId: number): SectionEvaluation | undefined => {
    return sectionEvaluations.find(se => Number(se.section_id) === sectionId);
  };

  const getScoreBadge = (score: number | null, criteria?: any) => {
    if (score === null) return <span className="text-gray-400 text-sm">Não avaliado</span>;
    
    // Para critérios de escala 1-5 (Aderente)
    if (criteria && !criteria.evaluation_type && criteria.type === 'rating') {
      // Escala 1-5: 1=Muito Mau, 5=Excelente
      const colors: Record<number, string> = {
        1: 'bg-red-100 text-red-800',
        2: 'bg-orange-100 text-orange-800',
        3: 'bg-yellow-100 text-yellow-800',
        4: 'bg-lime-100 text-lime-800',
        5: 'bg-green-100 text-green-800'
      };
      const labels: Record<number, string> = {
        1: 'Muito Mau',
        2: 'Mau',
        3: 'Aceitável',
        4: 'Bom',
        5: 'Excelente'
      };
      return (
        <span className={`${colors[score] || 'bg-gray-100 text-gray-800'} text-xs px-3 py-1 rounded-full font-semibold`}>
          {score} - {labels[score] || 'N/A'}
        </span>
      );
    }
    
    // OK/KO system: 1 = OK, 0 = KO (default for other types)
    if (score === 1) {
      return (
        <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-semibold">
          ✓ OK
        </span>
      );
    }
    if (score === 0) {
      return (
        <span className="bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full font-semibold">
          ✗ KO
        </span>
      );
    }
    
    // Fallback para outros valores
    return (
      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded font-medium">
        {score}
      </span>
    );
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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/aderente/dashboard')}
            className="mb-4"
          >
            <ArrowLeft size={16} className="mr-2" />
            Voltar ao Dashboard
          </Button>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Visita de Auditoria
                </h1>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Loja:</span> {store?.nome && store?.city ? `${store.nome} - ${store.city}` : 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Data:</span>{' '}
                    {new Date(audit.dtstart).toLocaleDateString('pt-PT', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                  {creator && (
                    <div>
                      <span className="font-medium">Nome:</span> {creator.fullname}
                    </div>
                  )}
                  {audit.score !== undefined && (
                    <div>
                      <span className="font-medium">Pontuação Final:</span>{' '}
                      <span className={`font-bold ${
                        audit.score < 50 ? 'text-red-600' :
                        audit.score < 80 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {audit.score.toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* General Observations */}
            {audit.auditorcomments && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FileText size={16} />
                  Observações Gerais do Auditor
                </h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                  {audit.auditorcomments}
                </p>
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
          </div>
          
          <div className="divide-y divide-gray-100">
            {checklist.sections.map(section => {
              const sectionEval = getSectionEvaluation(section.id);
              return (
              <div key={section.id} className="p-6">
                <h3 className="text-base font-semibold text-gray-800 mb-4">
                  {section.name}
                </h3>
                
                {/* Show identification fields for section 1 */}
                {section.name === "1. Identificação" && (
                  <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="space-y-2 text-sm">
                      {scores.find(s => s.criteria_id === 21001)?.comment && (
                        <div>
                          <span className="font-medium text-gray-700">Microsetor:</span>{' '}
                          <span className="text-gray-900 font-semibold">{scores.find(s => s.criteria_id === 21001)?.comment}</span>
                        </div>
                      )}
                      {scores.find(s => s.criteria_id === 21002)?.comment && (
                        <div>
                          <span className="font-medium text-gray-700">Loja Visitada:</span>{' '}
                          <span className="text-gray-900 font-semibold">{scores.find(s => s.criteria_id === 21002)?.comment}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
                          <UserIcon size={12} />
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
                  // Skip "Dados da Loja" item (id 2101) as it only contains identification fields
                  item.id === 2101 ? null : (
                  <div key={item.id} className="ml-4 mb-6 last:mb-0">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      {item.name}
                    </h4>
                    
                    <div className="space-y-3">
                      {item.criteria.map(criteria => {
                        const scoreData = getScoreForCriteria(criteria.id);
                        
                        // Skip identification fields (Microsetor and Loja visitada) from criteria list
                        if ([21001, 21002].includes(criteria.id)) {
                          return null;
                        }
                        
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
                              {scoreData?.score !== undefined && scoreData?.score !== null ? getScoreBadge(scoreData.score, criteria) : null}
                            </div>
                            </div>

                            {/* Comment */}
                            {scoreData?.comment && (![21001, 21002].includes(criteria.id)) && (
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
                  )
                ))}
              </div>
            );
            })}
          </div>
        </div>

        {/* Comment Thread */}
        <CommentThread auditId={audit.id} />

        {/* Action Plan Link */}
        <div className="mt-6 text-center">
          <Button
            variant="primary"
            onClick={() => navigate('/aderente/actions')}
          >
            Ver Plano de Ação
          </Button>
        </div>

      </main>
    </div>
  );
};
