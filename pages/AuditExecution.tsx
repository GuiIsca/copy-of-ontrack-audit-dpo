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
  const [stores, setStores] = useState<Store[]>([]);
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
      
      console.log('AuditExecution: Starting loadData, id:', id);
      
      if (!id) {
        console.log('AuditExecution: No id provided');
        setLoading(false);
        return;
      }
      
      try {
        console.log('AuditExecution: Fetching audit with id:', id);
        const aud = await db.getAuditById(parseInt(id));
        console.log('AuditExecution: Audit fetched:', aud);
        
        if (!aud) {
          console.log('AuditExecution: Audit not found, redirecting');
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
        
        console.log('AuditExecution: Fetching stores');
        const allStores = await db.getStores();
        setStores(allStores);
        setStore(allStores.find(s => s.id === aud.store_id || s.id === (aud as any).storeId) || null);
        
        console.log('AuditExecution: Fetching checklist, checklist_id:', aud.checklist_id || (aud as any).checklistId);
        const cl = await db.getChecklist(aud.checklist_id || (aud as any).checklistId);
        console.log('AuditExecution: Checklist fetched:', cl);
        setChecklist(cl);

        console.log('AuditExecution: Fetching scores');
        const sc = await db.getScores(aud.id);
        setScores(sc);
        
        // Load comments and photos from scores
        const comments: Record<number, string> = {};
        const photos: Record<number, string[]> = {};
        sc.forEach(s => {
          if (s.comment) comments[s.criteria_id] = s.comment;
          if (s.photos) photos[s.criteria_id] = s.photos;
        });
        
        // Auto-fill "Loja visitada" (criteria 21002) if not already filled
        const visitedStore = allStores.find(s => s.id === aud.store_id);
        if (visitedStore && !comments[21002]) {
          comments[21002] = `${visitedStore.brand} - ${visitedStore.city}`;
        }
        
        setCriteriaComments(comments);
        setCriteriaPhotos(photos);
        setGeneralComments(aud.auditorcomments || '');
        
        console.log('AuditExecution: All data loaded successfully');
        setLoading(false);
      } catch (error) {
        console.error('AuditExecution: Error loading data:', error);
        setLoading(false);
      }
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
                // Não mostrar toast ao guardar automaticamente
                
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
    
    // For text fields, only update local state without auto-save
    const handleTextChange = (criteriaId: number, text: string) => {
        setCriteriaComments(prev => ({ ...prev, [criteriaId]: text }));
    };
    
    // Save text fields manually (can be called on blur or via save button)
    const saveTextField = async (criteriaId: number) => {
        if (!audit) return;
        const comment = criteriaComments[criteriaId] || '';
        
        try {
            await db.saveScore({
                audit_id: audit.id,
                criteria_id: criteriaId,
                score: null,
                comment,
                photo_url: null
            });
        } catch (error) {
            console.error('Error saving text field:', error);
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

  const handleSaveVisit = async () => {
      if (!audit) return;
      try {
          setSubmitting(true);
          const isAderenteVisit = (audit as any).visit_source_type === 'ADERENTE_VISIT';
          const finalScore = Math.round(isAderenteVisit ? calculateAderenteFinalScore() : calculateTotalScore());
          
          console.log('handleSaveVisit called');
          console.log('  audit.id:', audit.id);
          console.log('  audit.status (before):', audit.status);
          console.log('  finalScore:', finalScore);
          
          const updated = { 
              ...audit,
              auditorcomments: generalComments,
              final_score: finalScore,
              score: finalScore,
              status: audit.status // Keep current status (IN_PROGRESS)
          };
          
          console.log('  Calling db.updateAudit with:', updated);
          await db.updateAudit(updated);
          setAudit(updated);
          
          console.log('  Save successful');
          setToastType('success');
          setToastMsg('Progresso guardado com sucesso');
          setTimeout(() => {
              setToastMsg(null);
              // Redirecionar para o dashboard
              if (currentUser?.roles.includes(UserRole.AMONT)) {
                  navigate('/amont/dashboard');
              } else if (currentUser?.roles.includes(UserRole.ADERENTE)) {
                  navigate('/aderente/dashboard');
              } else {
                  navigate('/dashboard');
              }
          }, 1500);
      } catch (err) {
          console.error('Save error:', err);
          setToastType('error');
          setToastMsg('Falha ao guardar');
          setTimeout(() => setToastMsg(null), 2000);
      } finally {
          setSubmitting(false);
      }
  };

  const handleSubmit = async () => {
            if (!audit) return;
            try {
                setSubmitting(true);
                const isAderenteVisit = (audit as any).visit_source_type === 'ADERENTE_VISIT';
                const finalScore = Math.round(isAderenteVisit ? calculateAderenteFinalScore() : calculateTotalScore());
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

  // Calculate final score for Aderente visits based on Section 2 (criteria 22001-22006)
  const calculateAderenteFinalScore = () => {
      // Criteria 22001-22006 are the rating criteria in Section 2
      const section2Criteria = [22001, 22002, 22003, 22004, 22005, 22006];
      let total = 0;
      let count = 0;
      
      section2Criteria.forEach(criteriaId => {
          const score = scores.find(s => s.criteria_id === criteriaId)?.score;
          if (score !== null && score !== undefined && score > 0) {
              total += score;
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
  console.log('AuditExecution: audit.status =', audit.status, 'type =', typeof audit.status);
  const canEdit = canEditAudit(audit.status, audit.user_id, audit.createdBy);
  console.log('AuditExecution: canEdit =', canEdit);
    const canSubmit = canSubmitAudit(audit.user_id, audit.status);
  const isReadOnly = !canEdit;
  
  // Check if this is an Aderente visit
  const isAderenteVisit = (audit as any).visit_source_type === 'ADERENTE_VISIT';

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
                            <span>visit_source_type: {String((audit as any).visit_source_type || 'none')}</span>
                            <span>isAderenteVisit: {String(isAderenteVisit)}</span>
                            <span>canEdit: {String(canEdit)}</span>
                            <span>isReadOnly: {String(isReadOnly)}</span>
                        </div>
                    </div>
          
          {/* Render all sections for Aderente visits, or single section for DOT audits */}
          {isAderenteVisit ? (
            // Show all sections in one page for Aderente
            <div className="space-y-6">
              {checklist.sections.map((section, sectionIndex) => {
                const secScore = calculateSectionScore(section);
                return (
                  <div key={sectionIndex}>
                    {/* Section Header */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-lg">{section.name}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${secScore < 50 ? 'bg-red-100 text-red-600' : secScore < 80 ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                          {secScore.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full ${secScore < 50 ? 'bg-red-500' : secScore < 80 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${secScore}%` }}></div>
                      </div>
                    </div>

                    {/* Items & Criteria */}
                    <div className="space-y-6">
                      {section.items.map(item => (
                        <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                          <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                            <h4 className="font-semibold text-gray-700">{item.name}</h4>
                          </div>
                          <div className="divide-y divide-gray-100">
                            {item.criteria.map(crit => {
                              const scoreVal = scores.find(s => s.criteria_id === crit.id)?.score;
                              const isSaving = savingCriteria.has(crit.id);
                              const critType = (crit as any).type || 'rating';
                              
                              return (
                                <div key={crit.id} className="p-4">
                                  <p className={`text-sm ${critType === 'text' ? 'font-bold' : 'font-medium'} text-gray-800 mb-3`}>
                                    {crit.name}
                                    {critType === 'text' && (crit.id === 23001 || crit.id === 23002) && (
                                      <span className="text-red-500 ml-1">*</span>
                                    )}
                                  </p>
                                  
                                  {/* Rating Buttons (1-5) */}
                                  {critType === 'rating' && (
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
                                    </div>
                                  )}
                                  
                                  {/* Dropdown */}
                                  {critType === 'dropdown' && (
                                    <select
                                      disabled={isReadOnly || isSaving}
                                      value={criteriaComments[crit.id] || ''}
                                      onChange={(e) => handleCommentChange(crit.id, e.target.value)}
                                      className="w-full text-sm border border-gray-200 rounded bg-gray-50 px-3 py-2 focus:ring-1 focus:ring-mousquetaires outline-none"
                                    >
                                      <option value="">Selecionar...</option>
                                      {crit.id === 21001 && (
                                        <>
                                          <option value="FRUTAS E LEGUMES">FRUTAS E LEGUMES</option>
                                          <option value="PADARIA">PADARIA</option>
                                          <option value="TALHO">TALHO</option>
                                          <option value="PEIXARIA">PEIXARIA</option>
                                          <option value="CHARCUTARIA">CHARCUTARIA</option>
                                          <option value="LACTICÍNIOS/CONGELADOS">LACTICÍNIOS/CONGELADOS</option>
                                        </>
                                      )}
                                      {crit.id === 21002 && stores.length > 0 && (
                                        <>
                                          {stores.map(s => (
                                            <option key={s.id} value={`${s.brand} - ${s.city}`}>
                                              {s.brand} - {s.city}
                                            </option>
                                          ))}
                                        </>
                                      )}
                                    </select>
                                  )}
                                  
                                  {/* Text Area */}
                                  {critType === 'text' && (
                                    <textarea
                                      disabled={isReadOnly || isSaving}
                                      placeholder="Clique aqui para digitar..."
                                      className="w-full text-sm border border-gray-200 rounded bg-gray-50 px-3 py-2 focus:ring-1 focus:ring-mousquetaires outline-none resize-none"
                                      rows={3}
                                      value={criteriaComments[crit.id] || ''}
                                      onChange={(e) => handleTextChange(crit.id, e.target.value)}
                                      onBlur={() => saveTextField(crit.id)}
                                      required={crit.id === 23001 || crit.id === 23002}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Original section-by-section navigation for DOT audits
            <>
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
                              const critType = (crit as any).type || 'rating'; // Default to rating for DOT audits
                              
                              return (
                                  <div key={crit.id} className="p-4">
                                      <p className={`text-sm ${critType === 'text' ? 'font-bold' : 'font-medium'} text-gray-800 mb-3`}>
                                          {crit.name}
                                          {critType === 'text' && (crit.id === 23001 || crit.id === 23002) && (
                                              <span className="text-red-500 ml-1">*</span>
                                          )}
                                      </p>
                                      
                                      {/* Rating Buttons (1-5) */}
                                      {critType === 'rating' && (
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
                                          </div>
                                      )}
                                      
                                      {/* Dropdown */}
                                      {critType === 'dropdown' && (
                                          <select
                                              disabled={isReadOnly || isSaving}
                                              value={criteriaComments[crit.id] || ''}
                                              onChange={(e) => handleCommentChange(crit.id, e.target.value)}
                                              className="w-full text-sm border border-gray-200 rounded bg-gray-50 px-3 py-2 focus:ring-1 focus:ring-mousquetaires outline-none"
                                          >
                                              <option value="">Selecionar...</option>
                                              {crit.id === 21001 && (
                                                  <>
                                                      <option value="FRUTAS E LEGUMES">FRUTAS E LEGUMES</option>
                                                      <option value="PADARIA">PADARIA</option>
                                                      <option value="TALHO">TALHO</option>
                                                      <option value="PEIXARIA">PEIXARIA</option>
                                                      <option value="CHARCUTARIA">CHARCUTARIA</option>
                                                      <option value="LACTICÍNIOS/CONGELADOS">LACTICÍNIOS/CONGELADOS</option>
                                                  </>
                                              )}
                                              {crit.id === 21002 && stores.length > 0 && (
                                                  <>
                                                      {stores.map(s => (
                                                          <option key={s.id} value={`${s.brand} - ${s.city}`}>
                                                              {s.brand} - {s.city}
                                                          </option>
                                                      ))}
                                                  </>
                                              )}
                                          </select>
                                      )}
                                      
                                      {/* Text Area */}
                                      {critType === 'text' && (
                                          <textarea
                                              disabled={isReadOnly || isSaving}
                                              placeholder="Clique aqui para digitar..."
                                              className="w-full text-sm border border-gray-200 rounded bg-gray-50 px-3 py-2 focus:ring-1 focus:ring-mousquetaires outline-none resize-none"
                                              rows={3}
                                              value={criteriaComments[crit.id] || ''}
                                              onChange={(e) => handleTextChange(crit.id, e.target.value)}
                                              onBlur={() => saveTextField(crit.id)}
                                              required={crit.id === 23001 || crit.id === 23002}
                                          />
                                      )}
                                  </div>
                              );
                          })}
                      </div>
                  </div>
              ))}
          </div>
          </>
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
                      Pontuação final: <span className="font-bold text-mousquetaires">{((audit as any).visit_source_type === 'ADERENTE_VISIT' ? calculateAderenteFinalScore() : calculateTotalScore()).toFixed(0)}%</span>
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
              {isAderenteVisit ? (
                // Aderente visits: Show only Save and Submit buttons (no section navigation)
                <div className="flex gap-2 flex-1 justify-end">
                  <Button 
                    variant="outline"
                    onClick={handleSaveVisit}
                    disabled={submitting || isReadOnly}
                    className="flex-1 sm:flex-none"
                  >
                    <Save className="mr-1" size={18} /> Guardar
                  </Button>
                  <Button 
                    onClick={handleFinish}
                    disabled={submitting || isReadOnly}
                    className="flex-1 sm:flex-none"
                  >
                    Submeter <Send className="ml-1" size={18} />
                  </Button>
                </div>
              ) : (
                // DOT audits: Show section navigation
                <>
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
                
                {/* Save Button - only show if not readonly */}
                {!isReadOnly && (
                  <button 
                    onClick={handleSaveVisit}
                    disabled={submitting}
                    className="p-2 text-gray-500 hover:text-mousquetaires hover:bg-red-50 rounded-full transition-colors relative disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Guardar Progresso"
                  >
                    <Save size={20} />
                  </button>
                )}

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
                  // Show Save/Submit buttons for Aderente visits, or Save/Finalize for DOT/AMONT audits
                  (audit as any).visit_source_type === 'ADERENTE_VISIT' ? (
                    <div className="flex gap-2 flex-1 sm:flex-none">
                      <Button 
                        variant="outline"
                        onClick={handleSaveVisit}
                        disabled={submitting || isReadOnly}
                        className="flex-1 sm:flex-none"
                      >
                        <Save className="mr-1" size={18} /> Guardar
                      </Button>
                      <Button 
                        onClick={handleFinish}
                        disabled={submitting || isReadOnly}
                        className="flex-1 sm:flex-none"
                      >
                        Submeter <Send className="ml-1" size={18} />
                      </Button>
                    </div>
                  ) : (
                    canSubmit && !isReadOnly && (
                      <div className="flex gap-2 flex-1 sm:flex-none">
                        <Button 
                          variant="outline"
                          onClick={handleSaveVisit}
                          disabled={submitting}
                          className="flex-1 sm:flex-none"
                        >
                          <Save className="mr-1" size={18} /> Guardar
                        </Button>
                        <Button onClick={handleFinish} className="flex-1 sm:flex-none">
                          Finalizar <CheckCircle className="ml-1" size={18} />
                        </Button>
                      </div>
                    )
                  )
              )}
              </>
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