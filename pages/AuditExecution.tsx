import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { CommentThread } from '../components/audit/CommentThread';
import { db } from '../services/dbAdapter';
import { Audit, AuditScore, AuditStatus, Store, Section, Criteria, Checklist } from '../types';
import { ArrowLeft, ChevronLeft, ChevronRight, Camera, Save, CheckCircle, AlertTriangle, Send, X, ListTodo, MessageSquare } from 'lucide-react';
import { ScoreGauge } from '../components/charts/ScoreGauge';
import { canEditAudit, canDeleteAudit, canSubmitAudit } from '../utils/permissions';
import { getCurrentUser } from '../utils/auth';
import { UserRole } from '../types';

export const AuditExecution: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  
  const [audit, setAudit] = useState<Audit | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [scores, setScores] = useState<AuditScore[]>([]);
  
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generalComments, setGeneralComments] = useState('');
  const [criteriaComments, setCriteriaComments] = useState<Record<number, string>>({});
  const [criteriaPhotos, setCriteriaPhotos] = useState<Record<number, string[]>>({});
    const [savingCriteria, setSavingCriteria] = useState<Set<number>>(new Set());
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const [toastType, setToastType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const loadData = async () => {
      // Reset loading state when id changes
      setLoading(true);
      
      if (!id) {
        setLoading(false);
        return;
      }
      const aud = await db.getAuditById(parseInt(id));
      if (!aud) {
          // Redirecionar para o dashboard correto baseado no role
          if (currentUser?.roles.includes(UserRole.ADERENTE)) {
            navigate('/aderente/dashboard');
          } else {
            navigate('/dashboard');
          }
          return;
      }
      // Ensure user_id is set for DOT audits
      if (!aud.user_id && !aud.dot_user_id && currentUser?.userId) {
        aud.user_id = currentUser.userId;
        aud.dot_user_id = currentUser.userId;
      }
      setAudit(aud);
      
      const stores = await db.getStores();
      setStore(stores.find(s => s.id === aud.store_id) || null);
      
      const cl = await db.getChecklist();
      setChecklist(cl);

      const sc = await db.getScores(aud.id);
      setScores(sc);
      
      // Load comments and photos from scores
      const comments: Record<number, string> = {};
      const photos: Record<number, string[]> = {};
      sc.forEach(s => {
        if (s.comment) comments[s.criteria_id] = s.comment;
        if (s.photos) photos[s.criteria_id] = s.photos;
      });
      setCriteriaComments(comments);
      setCriteriaPhotos(photos);
      setGeneralComments(aud.auditorcomments || '');
      
      setLoading(false);
    };
    loadData();
  }, [id]);

    const handleScoreChange = async (criteriaId: number, value: number | null) => {
            if (!audit) return;
            
            console.log('Score change:', { criteriaId, value, auditId: audit.id });
            
            // First update local state immediately for responsive UI
            setScores(prev => {
                const existing = prev.find(s => s.criteria_id === criteriaId);
                if (existing) {
                    return prev.map(s => s.criteria_id === criteriaId ? { ...s, score: value } : s);
                }
                return [...prev, { id: Date.now(), audit_id: audit.id, criteria_id: criteriaId, score: value, comment: '', photos: [] } as AuditScore];
            });
            
            // Then persist to API
            try {
                setSavingCriteria(prev => new Set(prev).add(criteriaId));
                await db.saveScore({
                    audit_id: audit.id,
                    criteria_id: criteriaId,
                    score: value,
                    comment: criteriaComments[criteriaId] || '',
                    photo_url: (criteriaPhotos[criteriaId] || [])[0] // store first photo for now
                });
                
                console.log('Score saved successfully');
                setToastType('success');
                setToastMsg('Pontuação guardada');
                setTimeout(() => setToastMsg(null), 1500);
                
                // If audit was new, set to in progress
                if (audit && audit.status === AuditStatus.NEW) {
                    const updated = { ...audit, status: AuditStatus.IN_PROGRESS };
                    await db.updateAudit(updated);
                    setAudit(updated);
                }
            } catch (error) {
                console.error('Error saving score:', error);
                // Optionally: revert local state or show error message
                setToastType('error');
                setToastMsg('Falha ao guardar');
                setTimeout(() => setToastMsg(null), 2000);
            } finally {
                setSavingCriteria(prev => {
                  const next = new Set(prev);
                  next.delete(criteriaId);
                  return next;
                });
            }
    };

    const handleCommentChange = async (criteriaId: number, comment: string) => {
            // Update local state immediately
            setCriteriaComments(prev => ({ ...prev, [criteriaId]: comment }));
            
            if (!audit) return;
            const currentScore = scores.find(s => s.criteria_id === criteriaId)?.score || null;
            
            try {
                setSavingCriteria(prev => new Set(prev).add(criteriaId));
                await db.saveScore({
                    audit_id: audit.id,
                    criteria_id: criteriaId,
                    score: currentScore,
                    comment,
                    photo_url: (criteriaPhotos[criteriaId] || [])[0]
                });
                setToastType('success');
                setToastMsg('Comentário guardado');
                setTimeout(() => setToastMsg(null), 1500);
            } catch (error) {
                console.error('Error saving comment:', error);
                setToastType('error');
                setToastMsg('Falha ao guardar comentário');
                setTimeout(() => setToastMsg(null), 2000);
            } finally {
                setSavingCriteria(prev => {
                  const next = new Set(prev);
                  next.delete(criteriaId);
                  return next;
                });
            }
    };

    const handlePhotoUpload = (criteriaId: number, event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
          const file = files[0];
          const reader = new FileReader();
          reader.onloadend = async () => {
              const base64 = reader.result as string;
              
              // Update local state immediately
              setCriteriaPhotos(prev => ({
                  ...prev,
                  [criteriaId]: [...(prev[criteriaId] || []), base64]
              }));
              
              if (!audit) return;
              const currentScore = scores.find(s => s.criteria_id === criteriaId)?.score || null;
              
              try {
                  setSavingCriteria(prev => new Set(prev).add(criteriaId));
                  await db.saveScore({
                      audit_id: audit.id,
                      criteria_id: criteriaId,
                      score: currentScore,
                      comment: criteriaComments[criteriaId] || '',
                      photo_url: base64
                  });
                  setToastType('success');
                  setToastMsg('Foto anexada');
                  setTimeout(() => setToastMsg(null), 1500);
              } catch (error) {
                  console.error('Error saving photo:', error);
                  setToastType('error');
                  setToastMsg('Falha ao anexar foto');
                  setTimeout(() => setToastMsg(null), 2000);
              } finally {
                  setSavingCriteria(prev => {
                    const next = new Set(prev);
                    next.delete(criteriaId);
                    return next;
                  });
              }
          };
          reader.readAsDataURL(file);
      }
  };

    const handleRemovePhoto = async (criteriaId: number, photoIndex: number) => {
      // Update local state immediately
      const newPhotos = [...(criteriaPhotos[criteriaId] || [])];
      newPhotos.splice(photoIndex, 1);
      
      setCriteriaPhotos(prev => ({
          ...prev,
          [criteriaId]: newPhotos
      }));
      
      if (!audit) return;
      const currentScore = scores.find(s => s.criteria_id === criteriaId)?.score || null;
      
      try {
          setSavingCriteria(prev => new Set(prev).add(criteriaId));
          await db.saveScore({
              audit_id: audit.id,
              criteria_id: criteriaId,
              score: currentScore,
              comment: criteriaComments[criteriaId] || '',
              photo_url: newPhotos[0]
          });
          setToastType('success');
          setToastMsg('Foto removida');
          setTimeout(() => setToastMsg(null), 1500);
      } catch (error) {
          console.error('Error removing photo:', error);
          setToastType('error');
          setToastMsg('Falha ao remover foto');
          setTimeout(() => setToastMsg(null), 2000);
      } finally {
          setSavingCriteria(prev => {
            const next = new Set(prev);
            next.delete(criteriaId);
            return next;
          });
      }
  };

  const handleSave = async () => {
      if (audit) {
          const finalScore = calculateTotalScore();
          const updated = { 
              ...audit, 
              auditorcomments: generalComments,
              final_score: finalScore,
              score: finalScore
          };
          await db.updateAudit(updated);
          setAudit(updated);
      }
  };

  const handleSubmit = async () => {
            if (!audit) return;
            try {
                setSubmitting(true);
                const finalScore = Math.round(calculateTotalScore());
                const updated = { 
                        ...audit, 
                        status: AuditStatus.SUBMITTED,
                        auditorcomments: generalComments,
                        dtend: new Date().toISOString(),
                    final_score: finalScore,
                    score: finalScore
                };
                console.log('Submitting audit update:', { id: audit.id, status: updated.status, dtend: updated.dtend, finalScore });
                await db.updateAudit(updated);
                setAudit(updated);
                setShowSubmitModal(false);
                setToastType('success');
                setToastMsg('Visita submetida');
                setTimeout(() => setToastMsg(null), 1500);
        
                // Redirecionar para o dashboard correto
                if (currentUser?.roles.includes(UserRole.ADERENTE)) {
                    navigate('/aderente/dashboard');
                } else {
                    navigate('/dashboard');
                }
            } catch (err) {
                console.error('Submit error:', err);
                setToastType('error');
                setToastMsg('Falha ao submeter');
                setTimeout(() => setToastMsg(null), 2000);
            } finally {
                setSubmitting(false);
            }
  };

  const calculateSectionScore = (section: Section) => {
      let total = 0;
      let count = 0;
      section.items.forEach(item => {
          item.criteria.forEach(crit => {
              const s = scores.find(sc => sc.criteria_id === crit.id);
              if (s && s.score !== null && s.score > 0) { // Assuming 0 is N/A
                  total += s.score;
                  count++;
              }
          });
      });
      return count === 0 ? 0 : (total / (count * 5)) * 100; // Percentage
  };

  const calculateTotalScore = () => {
      let total = 0;
      let count = 0;
      scores.forEach(s => {
          if (s.score !== null && s.score > 0) {
              total += s.score;
              count++;
          }
      });
      return count === 0 ? 0 : (total / (count * 5)) * 100;
  };

  const handleFinish = () => {
      handleSave();
      setShowSubmitModal(true);
  };

  if (loading || !audit || !checklist || !store) return <div>Loading...</div>;

  const currentSection = checklist.sections[currentSectionIndex];
  const sectionScore = calculateSectionScore(currentSection);
  
  // Verificar se pode editar baseado nas permissões
  const canEdit = canEditAudit(audit.status, audit.user_id);
    const canSubmit = canSubmitAudit(audit.user_id, audit.status);
  const isReadOnly = !canEdit;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 px-4 py-3 flex items-center justify-between shadow-sm">
          <button onClick={() => {
            if (currentUser?.roles.includes(UserRole.ADERENTE)) {
              navigate('/aderente/dashboard');
            } else {
              navigate('/dashboard');
            }
          }} className="text-gray-600 hover:text-black">
              <ArrowLeft />
          </button>
          <div className="text-center">
              <h2 className="text-sm font-bold text-gray-900 uppercase">GUIÃO DA VISITA</h2>
              <p className="text-xs text-gray-500">{store.brand} {store.city}</p>
          </div>
          <button 
              onClick={() => navigate(`/audit/${id}/actions`)} 
              className="text-gray-600 hover:text-mousquetaires"
              title="Plano de Ação"
          >
              <ListTodo />
          </button>
      </div>

      <main className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full">
                    {/* Debug banner to verify permissions/state */}
                    <div className="mb-3 text-xs text-gray-600">
                        <div className="inline-flex gap-3 bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
                            <span>user: {currentUser?.email || 'none'}</span>
                            <span>roles: {currentUser?.roles?.join(', ') || 'none'}</span>
                            <span>audit.status: {String(audit.status)}</span>
                            <span>audit.user_id: {String(audit.user_id)}</span>
                            <span>canEdit: {String(canEdit)}</span>
                            <span>isReadOnly: {String(isReadOnly)}</span>
                        </div>
                    </div>
          
          {/* Section Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg">{currentSection.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${sectionScore < 50 ? 'bg-red-100 text-red-600' : sectionScore < 80 ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                      {sectionScore.toFixed(0)}%
                  </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full ${sectionScore < 50 ? 'bg-red-500' : sectionScore < 80 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${sectionScore}%` }}></div>
              </div>
          </div>

          {/* Items & Criteria */}
          <div className="space-y-6">
              {currentSection.items.map(item => (
                  <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                          <h4 className="font-semibold text-gray-700">{item.name}</h4>
                      </div>
                      <div className="divide-y divide-gray-100">
                          {item.criteria.map(crit => {
                              const scoreVal = scores.find(s => s.criteria_id === crit.id)?.score;
                              const isSaving = savingCriteria.has(crit.id);
                              
                              return (
                                  <div key={crit.id} className="p-4">
                                      <p className="text-sm font-medium text-gray-800 mb-3">{crit.name}</p>
                                      
                                      <div className="flex flex-wrap items-center justify-between gap-4">
                                          {/* Scoring Buttons */}
                                          <div className="flex items-center space-x-1">
                                              {[1, 2, 3, 4, 5].map(val => (
                                                  <button
                                                      key={val}
                                                      disabled={isReadOnly || isSaving}
                                                      onClick={() => handleScoreChange(crit.id, val)}
                                                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                                                          scoreVal === val 
                                                          ? val <= 2 ? 'bg-red-500 text-white' : val === 3 ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'
                                                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                      }`}
                                                  >
                                                      {val}
                                                  </button>
                                              ))}
                                              <div className="w-px h-6 bg-gray-300 mx-2"></div>
                                              <button
                                                  disabled={isReadOnly}
                                                  onClick={() => handleScoreChange(crit.id, 0)} // 0 for N/A
                                                  className={`px-2 py-1 text-xs rounded border ${scoreVal === 0 ? 'bg-gray-600 text-white border-gray-600' : 'bg-white text-gray-500 border-gray-200'}`}
                                              >
                                                  NA
                                              </button>
                                          </div>

                                          {/* Actions */}
                                          <div className="flex items-center space-x-2">
                                              <label className="cursor-pointer">
                                                  <input 
                                                      type="file" 
                                                      accept="image/*" 
                                                      className="hidden" 
                                                      onChange={(e) => handlePhotoUpload(crit.id, e)}
                                                      disabled={isReadOnly || isSaving}
                                                  />
                                                  <div className="p-2 text-gray-400 hover:text-mousquetaires rounded-full hover:bg-red-50">
                                                      <Camera size={20} />
                                                  </div>
                                              </label>
                                          </div>
                                      </div>
                                      
                                      {/* Photos Preview */}
                                      {criteriaPhotos[crit.id] && criteriaPhotos[crit.id].length > 0 && (
                                          <div className="mt-3 flex flex-wrap gap-2">
                                              {criteriaPhotos[crit.id].map((photo, idx) => (
                                                  <div key={idx} className="relative group">
                                                      <img src={photo} alt="" className="w-20 h-20 object-cover rounded border" />
                                                      {!isReadOnly && (
                                                          <button 
                                                              onClick={() => handleRemovePhoto(crit.id, idx)}
                                                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                          >
                                                              <X size={12} />
                                                          </button>
                                                      )}
                                                  </div>
                                              ))}
                                          </div>
                                      )}
                                      
                                      {/* Comment Input */}
                                      {scoreVal !== null && scoreVal !== undefined && (
                                                                                    <textarea 
                                            placeholder={scoreVal <= 2 ? "Ação corretiva obrigatória..." : "Observações (opcional)..."} 
                                            className={`mt-3 w-full text-sm border rounded bg-gray-50 px-3 py-2 focus:ring-1 focus:ring-mousquetaires outline-none resize-none ${scoreVal <= 2 ? 'border-red-300' : 'border-gray-200'}`}
                                            rows={2}
                                            value={criteriaComments[crit.id] || ''}
                                                                                        onChange={(e) => handleCommentChange(crit.id, e.target.value)}
                                                                                        disabled={isReadOnly || isSaving}
                                          />
                                      )}
                                  </div>
                              );
                          })}
                      </div>
                  </div>
              ))}
          </div>

          {/* General Observations Section */}
          {currentSectionIndex === checklist.sections.length - 1 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mt-6">
                  <h4 className="font-semibold text-gray-700 mb-3">Observações Gerais</h4>
                  <textarea
                      className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-mousquetaires outline-none resize-none"
                      rows={4}
                      placeholder="Comentários gerais sobre a visita..."
                      value={generalComments}
                      onChange={(e) => setGeneralComments(e.target.value)}
                      disabled={isReadOnly}
                  />
                  {!isReadOnly && (
                      <div className="mt-3 flex justify-end">
                          <Button variant="outline" onClick={handleSave}>
                              <Save className="mr-2" size={16} /> Guardar Rascunho
                          </Button>
                      </div>
                  )}
              </div>
          )}

      </main>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Submeter Visita</h3>
                  <p className="text-gray-600 mb-2">
                      Ao submeter, o guião ficará visível ao Aderente e não poderá ser editado.
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                      Pontuação final: <span className="font-bold text-mousquetaires">{calculateTotalScore().toFixed(0)}%</span>
                  </p>
                  <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setShowSubmitModal(false)} className="flex-1">
                          Cancelar
                      </Button>
                      <Button onClick={handleSubmit} className="flex-1" disabled={submitting}>
                          <Send className="mr-2" size={16} /> Submeter
                      </Button>
                  </div>
              </div>
          </div>
      )}

      {/* Comments Bottom Sheet */}
      {showComments && audit && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 pointer-events-auto transition-opacity"
            onClick={() => setShowComments(false)}
          />
          
          {/* Sheet */}
          <div className="bg-white w-full max-w-4xl rounded-t-xl shadow-2xl pointer-events-auto max-h-[80vh] flex flex-col animate-slide-up transform transition-transform">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h3 className="font-bold text-lg text-gray-800 flex items-center">
                <MessageSquare className="mr-2" size={20} />
                Comentários e Feedback
              </h3>
              <button onClick={() => setShowComments(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <CommentThread auditId={audit.id} />
            </div>
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="bg-white border-t border-gray-200 p-4 shadow-lg sticky bottom-0 z-40">
          <div className="max-w-4xl mx-auto flex justify-between items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => setCurrentSectionIndex(Math.max(0, currentSectionIndex - 1))}
                disabled={currentSectionIndex === 0}
                className="flex-1 sm:flex-none"
              >
                  <ChevronLeft className="mr-1" size={18} /> <span className="hidden sm:inline">Anterior</span>
              </Button>

              <div className="flex items-center gap-2">
                <div className="text-sm font-medium text-gray-500 whitespace-nowrap">
                    {currentSectionIndex + 1} / {checklist.sections.length}
                </div>
                
                {/* Comments Toggle Button */}
                <button 
                  onClick={() => setShowComments(true)}
                  className="p-2 text-gray-500 hover:text-mousquetaires hover:bg-red-50 rounded-full transition-colors relative"
                  title="Ver Comentários"
                >
                  <MessageSquare size={20} />
                  {/* Optional: Add indicator if there are comments */}
                </button>
              </div>

              {currentSectionIndex < checklist.sections.length - 1 ? (
                   <Button 
                    onClick={() => setCurrentSectionIndex(Math.min(checklist.sections.length - 1, currentSectionIndex + 1))}
                    className="flex-1 sm:flex-none"
                   >
                    <span className="hidden sm:inline">Próximo</span> <ChevronRight className="ml-1" size={18} />
                   </Button>
              ) : (
                  canSubmit && (
                    <Button onClick={handleFinish} className="flex-1 sm:flex-none">
                        Finalizar <CheckCircle className="ml-1" size={18} />
                    </Button>
                  )
              )}
          </div>
      </div>

            {/* Inline Toast */}
            {toastMsg && (
                <div className={`fixed bottom-20 right-4 px-3 py-2 rounded shadow-sm text-sm ${toastType === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    {toastMsg}
                </div>
            )}
    </div>
  );
};