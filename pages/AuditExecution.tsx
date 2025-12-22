import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { CommentThread } from '../components/audit/CommentThread';
import { db } from '../services/dbAdapter';
import { Audit, AuditScore, AuditStatus, Store, Section, Criteria, Checklist, EvaluationType } from '../types';
import { ArrowLeft, ChevronLeft, ChevronRight, Camera, Save, CheckCircle, AlertTriangle, Send, X, ListTodo, MessageSquare } from 'lucide-react';
import { ScoreGauge } from '../components/charts/ScoreGauge';
import { canEditAudit, canDeleteAudit, canSubmitAudit, getDefaultDashboard } from '../utils/permissions';
import { getCurrentUser } from '../utils/auth';
import { UserRole } from '../types';

export const AuditExecution: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  
  const [audit, setAudit] = useState<Audit | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [aderenteName, setAderenteName] = useState<string | null>(null);
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
  
  // Section evaluations state (support both number keys for sections and string keys for subsections like "3_3.1")
  const [sectionRatings, setSectionRatings] = useState<Record<number | string, number | null>>({});
  const [sectionActionPlans, setSectionActionPlans] = useState<Record<number | string, string>>({});
  const [sectionResponsible, setSectionResponsible] = useState<Record<number | string, string>>({});
  const [sectionDueDates, setSectionDueDates] = useState<Record<number | string, string>>({});

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
          navigate(getDefaultDashboard());
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
        const selectedStore = allStores.find(s => s.id === aud.store_id || s.id === (aud as any).storeId) || null;
        setStore(selectedStore);
        
        // Load aderente name if store has aderente_id
        if (selectedStore?.aderente_id) {
          try {
            const aderenteUser = await db.getUserById?.(selectedStore.aderente_id) || 
                                 (await fetch(`/api/users/${selectedStore.aderente_id}`).then(r => r.json()).catch(() => null));
            setAderenteName(aderenteUser?.fullname || `Aderente ${selectedStore.aderente_id}`);
          } catch (error) {
            console.error('Error loading aderente name:', error);
            setAderenteName(`Aderente ${selectedStore.aderente_id}`);
          }
        }
        
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
          comments[21002] = `${visitedStore.nome} - ${visitedStore.city}`;
        }
        
        setCriteriaComments(comments);
        setCriteriaPhotos(photos);
        setGeneralComments(aud.auditorcomments || '');
        
        // Load section evaluations
        console.log('AuditExecution: Fetching section evaluations');
        const sectionEvals = await db.getSectionEvaluations(aud.id);
        const ratings: Record<number | string, number | null> = {};
        const actions: Record<number | string, string> = {};
        const responsibles: Record<number | string, string> = {};
        const dueDates: Record<number | string, string> = {};
        
        sectionEvals.forEach((ev: any) => {
          const key = ev.section_id; // Can be number or string (e.g., "3_3.1" for subsections)
          if (ev.rating) ratings[key] = ev.rating;
          if (ev.action_plan) actions[key] = ev.action_plan;
          if (ev.responsible) responsibles[key] = ev.responsible;
          if (ev.due_date) dueDates[key] = ev.due_date;
        });
        
        setSectionRatings(ratings);
        setSectionActionPlans(actions);
        setSectionResponsible(responsibles);
        setSectionDueDates(dueDates);
        
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
                const evalType = getEvaluationTypeById(criteriaId);
                console.log('handleScoreChange: evaluation_type for criteriaId', criteriaId, '=', evalType, 'checklist=', checklist?.name);
                await db.saveScore({
                    audit_id: audit.id,
                    criteria_id: criteriaId,
                    score: value,
                    comment: criteriaComments[criteriaId] || '',
                    photo_url: (criteriaPhotos[criteriaId] || [])[0], // store first photo for now
                    evaluation_type: evalType as EvaluationType,
                    requires_photo: value === 0
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
            
            // Don't auto-save on every keystroke - let it happen on blur or explicit save
    };

    // Save comment with debounce to avoid excessive API calls
    const saveComment = async (criteriaId: number) => {
            if (!audit) return;
            const comment = criteriaComments[criteriaId] || '';
            const currentScore = scores.find(s => s.criteria_id === criteriaId)?.score ?? null;
            
            try {
                setSavingCriteria(prev => new Set(prev).add(criteriaId));
                const evalType = getEvaluationTypeById(criteriaId);
                console.log('saveComment: evaluation_type for criteriaId', criteriaId, '=', evalType);
                await db.saveScore({
                    audit_id: audit.id,
                    criteria_id: criteriaId,
                    score: currentScore,
                    comment,
                    photo_url: (criteriaPhotos[criteriaId] || [])[0],
                    evaluation_type: evalType as EvaluationType,
                    requires_photo: currentScore === 0
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

    // Format rating for display (remove .0 for integers)
    const formatRating = (score: number): string => {
        const scaled = score / 20; // Convert 0-100 to 0-5
        const formatted = scaled.toFixed(1);
        // Remove .0 if it's an integer
        return formatted.endsWith('.0') ? Math.round(scaled).toString() : formatted;
    };
    
    // Determine evaluation type for a criteria (OK_KO vs SCALE_1_5)
    const getEvaluationType = (crit: any): 'OK_KO' | 'SCALE_1_5' => {
        const evalType = (crit as any).evaluation_type;
        const critType = (crit as any).type;
        
        if (evalType === 'OK_KO') return 'OK_KO';
        if (critType === 'rating') return 'SCALE_1_5';
        return 'OK_KO';
    };
    
    // Get evaluation type by criteria ID from checklist
    const getEvaluationTypeById = (criteriaId: number): 'OK_KO' | 'SCALE_1_5' => {
        if (!checklist) {
            console.warn('getEvaluationTypeById: checklist not available, returning OK_KO');
            return 'OK_KO';
        }
        
        for (const section of checklist.sections) {
            // All criteria are inside items (no direct section.criteria)
            if (section.items && Array.isArray(section.items)) {
                for (const item of section.items) {
                    if (item.criteria) {
                        const found = item.criteria.find((c: any) => c.id === criteriaId);
                        if (found) {
                            const evalType = getEvaluationType(found);
                            console.log(`getEvaluationTypeById(${criteriaId}): found in item.criteria, type=${evalType}, crit=`, found);
                            return evalType;
                        }
                    }
                }
            }
        }
        
        console.warn(`getEvaluationTypeById(${criteriaId}): not found in checklist, returning OK_KO`);
        return 'OK_KO';
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
              const currentScore = scores.find(s => s.criteria_id === criteriaId)?.score ?? null;
              
              try {
                  setSavingCriteria(prev => new Set(prev).add(criteriaId));
                  const evalType = getEvaluationTypeById(criteriaId);
                  console.log('handlePhotoUpload: evaluation_type for criteriaId', criteriaId, '=', evalType);
                  await db.saveScore({
                      audit_id: audit.id,
                      criteria_id: criteriaId,
                      score: currentScore,
                      comment: criteriaComments[criteriaId] || '',
                      photo_url: base64,
                      evaluation_type: evalType as EvaluationType,
                      requires_photo: currentScore === 0
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
      const currentScore = scores.find(s => s.criteria_id === criteriaId)?.score ?? null;
      
      try {
          setSavingCriteria(prev => new Set(prev).add(criteriaId));
          const evalType = getEvaluationTypeById(criteriaId);
          console.log('handleRemovePhoto: evaluation_type for criteriaId', criteriaId, '=', evalType);
          await db.saveScore({
              audit_id: audit.id,
              criteria_id: criteriaId,
              score: currentScore,
              comment: criteriaComments[criteriaId] || '',
              allPhotos: newPhotos, // Send all remaining photos
              evaluation_type: evalType as EvaluationType,
              requires_photo: currentScore === 0
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

  // Section evaluation handlers
  // Extract subsection prefix from item name (e.g., "3.1", "3.2", etc.)
  const getSubsectionPrefix = (itemName: string): string | null => {
    const match = itemName.match(/^(\d+\.\d+)/);
    return match ? match[1] : null;
  };

  // Group items by subsection for FRESCOS section
  const groupItemsBySubsection = (section: Section) => {
    const groups: { [prefix: string]: typeof section.items } = {};
    section.items.forEach(item => {
      const prefix = getSubsectionPrefix(item.name);
      if (prefix) {
        if (!groups[prefix]) groups[prefix] = [];
        groups[prefix].push(item);
      } else {
        // Items without subsection prefix go to their own group
        if (!groups['_other']) groups['_other'] = [];
        groups['_other'].push(item);
      }
    });
    return groups;
  };

  const handleSectionFieldChange = async (sectionId: number | string, field: 'action_plan' | 'responsible' | 'due_date', value: string) => {
    if (!audit) return;
    
    if (field === 'action_plan') {
      setSectionActionPlans(prev => ({ ...prev, [sectionId]: value }));
    } else if (field === 'responsible') {
      setSectionResponsible(prev => ({ ...prev, [sectionId]: value }));
    } else if (field === 'due_date') {
      setSectionDueDates(prev => ({ ...prev, [sectionId]: value }));
    }
    
    // Debounce save - only save after user stops typing
    // For now, save immediately on blur (we'll add onBlur to inputs)
  };

  const handleSaveSectionEvaluation = async (sectionId: number, subsectionPrefix?: string, items?: typeof currentSection.items) => {
    if (!audit || !checklist) return;
    
    // Use subsection-specific unique key if provided
    const evalKey = subsectionPrefix ? `${sectionId}_${subsectionPrefix}` : sectionId;
    
    // Calculate rating from items (either full section or subsection items)
    let autoRating: number;
    if (items) {
      autoRating = calculateRatingFromItems(items);
    } else {
      const section = checklist.sections.find(s => s.id === sectionId);
      if (!section) return;
      autoRating = calculateSectionRating(section);
    }
    
    try {
      await db.saveSectionEvaluation({
        audit_id: audit.id,
        section_id: evalKey as any, // Store compound key for subsections
        rating: autoRating,
        action_plan: sectionActionPlans[evalKey],
        responsible: sectionResponsible[evalKey] || aderenteName || `Aderente (ID: ${store?.aderente_id})`,
        due_date: sectionDueDates[evalKey],
        aderente_id: store?.aderente_id, // Automatically add aderente_id from store
        store_id: store?.id, // Add store_id for action_plans
        created_by: currentUser?.userId // Add created_by for action_plans
      });
      setToastType('success');
      setToastMsg('Plano de ação guardado');
      setTimeout(() => setToastMsg(null), 1500);
    } catch (error) {
      console.error('Error saving section evaluation:', error);
      setToastType('error');
      setToastMsg('Erro ao guardar');
      setTimeout(() => setToastMsg(null), 2000);
    }
  };

  const handleSave = async () => {
      if (audit) {
          const finalScore = calculateTotalScore();
          console.log('handleSave: finalScore =', finalScore);
          const updated = { 
              ...audit, 
              auditorcomments: generalComments,
              final_score: finalScore,
              score: finalScore
          };
          console.log('handleSave: saving audit with score =', finalScore);
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
              // Redirect to default dashboard
              navigate(getDefaultDashboard());
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
            
            // Validate that all KO scores have photos
            const koScoresWithoutPhotos: number[] = [];
            scores.forEach(s => {
                if (s.score === 0) { // KO score
                    const hasPhoto = criteriaPhotos[s.criteria_id]?.length > 0;
                    if (!hasPhoto) {
                        koScoresWithoutPhotos.push(s.criteria_id);
                    }
                }
            });
            
            if (koScoresWithoutPhotos.length > 0) {
                setToastType('error');
                setToastMsg(`${koScoresWithoutPhotos.length} critério(s) KO sem foto obrigatória`);
                setTimeout(() => setToastMsg(null), 3000);
                return;
            }
            
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
        
                // Redirect to default dashboard
                navigate(getDefaultDashboard());
            } catch (err) {
                console.error('Submit error:', err);
                setToastType('error');
                setToastMsg('Falha ao submeter');
                setTimeout(() => setToastMsg(null), 2000);
            } finally {
                setSubmitting(false);
            }
  };

  // Calculate score for a specific set of items (used for both sections and subsections)
  const calculateItemsScore = (items: typeof currentSection.items) => {
      let okCount = 0;
      let totalCount = 0;
      items.forEach(item => {
          item.criteria.forEach(crit => {
              const critType = (crit as any).type || 'rating';
              // Only count rating criteria (not text or dropdown)
              if (critType === 'rating') {
                  const s = scores.find(sc => sc.criteria_id === crit.id);
                  if (s && s.score !== null) {
                      totalCount++;
                      if (s.score === 1) okCount++; // 1 = OK, 0 = KO
                  }
              }
          });
      });
      return totalCount === 0 ? 0 : (okCount / totalCount) * 100; // Percentage based on OK/KO
  };

  const calculateSectionScore = (section: Section) => {
      return calculateItemsScore(section.items);
  };

  // Calculate average score from all sections
  const calculateSectionsAverageScore = () => {
      if (!checklist || checklist.sections.length === 0) return 0;
      
      let totalScore = 0;
      let count = 0;
      
      checklist.sections.forEach(section => {
          const sectionScore = calculateSectionScore(section);
          if (sectionScore !== null && sectionScore !== undefined) {
              totalScore += sectionScore;
              count++;
          }
      });
      
      return count === 0 ? 0 : totalScore / count;
  };

  // Calculate automatic section/subsection rating (1-5) based on OK/KO percentage
  const calculateRatingFromItems = (items: typeof currentSection.items): number => {
      const percentage = calculateItemsScore(items);
      // Convert percentage to 1-5 scale: 0-20% = 1, 20-40% = 2, 40-60% = 3, 60-80% = 4, 80-100% = 5
      if (percentage >= 80) return 5;
      if (percentage >= 60) return 4;
      if (percentage >= 40) return 3;
      if (percentage >= 20) return 2;
      return 1;
  };

  const calculateSectionRating = (section: Section): number => {
      return calculateRatingFromItems(section.items);
  };

  const calculateTotalScore = () => {
      // Return the average of all sections' scores
      const score = calculateSectionsAverageScore();
      console.log('calculateTotalScore called, returning:', score);
      return score;
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
            if (currentUser?.roles.includes(UserRole.ADMIN)) {
              navigate('/admin/visitas');
            } else if (currentUser?.roles.includes(UserRole.DOT_TEAM_LEADER)) {
              navigate('/dot-team-leader/dashboard');
            } else if (currentUser?.roles.includes(UserRole.ADERENTE)) {
              navigate('/aderente/dashboard');
            } else {
              navigate(getDefaultDashboard());
            }
          }} className="text-gray-600 hover:text-black">
              <ArrowLeft />
          </button>
          <div className="text-center">
              <h2 className="text-sm font-bold text-gray-900 uppercase">GUIÃO DA VISITA</h2>
              <p className="text-xs text-gray-500">{store.nome} {store.city}</p>
          </div>
          <div className="w-6"></div>
      </div>

      <main className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full">

          
          {/* Render all sections for Aderente visits, or single section for DOT audits */}
          {isAderenteVisit ? (
            // Show all sections in one page for Aderente
            <div className="space-y-6">
              {checklist.sections.map((section, sectionIndex) => {
                return (
                  <div key={sectionIndex}>
                    {/* Section Header */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-lg">{section.name}</h3>
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
                                  
                                  {/* Rating Buttons - OK/KO or SCALE_1_5 */}
                                  {critType === 'rating' && (
                                    <div className="space-y-3">
                                      {(() => {
                                        const evalType = getEvaluationType(crit);
                                        
                                        if (evalType === 'OK_KO') {
                                          // OK/KO for DOTs
                                          return (
                                            <>
                                              <div className="flex items-center space-x-3">
                                                <button
                                                  disabled={isReadOnly || isSaving}
                                                  onClick={() => handleScoreChange(crit.id, 1)}
                                                  className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                                                    scoreVal === 1
                                                    ? 'bg-green-500 text-white shadow-md'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700 border border-gray-200'
                                                  }`}
                                                >
                                                  ✓ OK
                                                </button>
                                                <button
                                                  disabled={isReadOnly || isSaving}
                                                  onClick={() => handleScoreChange(crit.id, 0)}
                                                  className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                                                    scoreVal === 0
                                                    ? 'bg-red-500 text-white shadow-md'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-700 border border-gray-200'
                                                  }`}
                                                >
                                                  ✗ KO
                                                </button>
                                              </div>
                                              
                                              {/* Comment field */}
                                              <textarea
                                                disabled={isReadOnly || isSaving}
                                                placeholder="Comentário (opcional)..."
                                                className="w-full text-sm border border-gray-200 rounded-lg bg-gray-50 px-3 py-2 focus:ring-2 focus:ring-mousquetaires focus:border-mousquetaires outline-none resize-none"
                                                rows={2}
                                                value={criteriaComments[crit.id] || ''}
                                                onChange={(e) => handleCommentChange(crit.id, e.target.value)}
                                                onBlur={() => saveComment(crit.id)}
                                              />
                                              
                                              {/* Photo upload section */}
                                              <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                  <label className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 text-sm text-gray-700">
                                                    <Camera size={16} />
                                                    <span>{scoreVal === 0 ? 'Foto obrigatória' : 'Adicionar foto'}</span>
                                                    <input
                                                      type="file"
                                                      accept="image/*"
                                                      className="hidden"
                                                      disabled={isReadOnly || isSaving}
                                                      onChange={(e) => handlePhotoUpload(crit.id, e)}
                                                    />
                                                  </label>
                                                  {scoreVal === 0 && (!criteriaPhotos[crit.id] || criteriaPhotos[crit.id].length === 0) && (
                                                    <span className="text-xs text-red-600 font-medium">* Obrigatória para KO</span>
                                                  )}
                                                </div>
                                                {criteriaPhotos[crit.id]?.length > 0 && (
                                                  <div className="flex flex-wrap gap-2">
                                                    {criteriaPhotos[crit.id].map((photo, idx) => (
                                                      <div key={idx} className="relative group">
                                                        <img src={photo} alt="" className="w-20 h-20 object-cover rounded border border-gray-200" />
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
                                              </div>
                                            </>
                                          );
                                        } else {
                                          // SCALE_1_5 for Aderente
                                          return (
                                            <>
                                              <div className="flex items-center gap-2">
                                                {[1, 2, 3, 4, 5].map(rating => (
                                                  <button
                                                    key={rating}
                                                    disabled={isReadOnly || isSaving}
                                                    onClick={() => handleScoreChange(crit.id, rating)}
                                                    className={`flex-1 px-3 py-2 rounded font-semibold text-sm transition-all ${
                                                      scoreVal === rating
                                                      ? 'bg-mousquetaires text-white shadow-md'
                                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                                                    }`}
                                                  >
                                                    {rating}
                                                  </button>
                                                ))}
                                              </div>
                                            </>
                                          );
                                        }
                                      })()}
                                    </div>
                                  )}
                                  
                                  {/* Dropdown */}
                                  {critType === 'dropdown' && (
                                    <select
                                      disabled={isReadOnly || isSaving}
                                      value={criteriaComments[crit.id] || ''}
                                      onChange={(e) => handleCommentChange(crit.id, e.target.value)}
                                      onBlur={() => saveComment(crit.id)}
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
                                            <option key={s.id} value={`${s.nome} - ${s.city}`}>
                                              {s.nome} - {s.city}
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
              {(() => {
                // Check if this is FRESCOS section (id=3) with subsections
                const isFrescosSection = currentSection.id === 3;
                const subsectionGroups = isFrescosSection ? groupItemsBySubsection(currentSection) : null;
                
                if (isFrescosSection && subsectionGroups) {
                  // Render subsections with individual evaluations
                  return Object.entries(subsectionGroups).map(([prefix, items]) => {
                    const subsectionScore = calculateItemsScore(items);
                    const subsectionRating = calculateRatingFromItems(items);
                    const evalKey = `${currentSection.id}_${prefix}`;
                    
                    // Extract subsection name from first item
                    const subsectionName = prefix !== '_other' 
                      ? items[0]?.name.match(/^\d+\.\d+\s+([^-]+)/)?.[1]?.trim() || prefix
                      : 'Outros';
                    
                    return (
                      <div key={prefix} className="space-y-4">
                        {/* Subsection Header */}
                        <div className="bg-gradient-to-r from-mousquetaires to-red-700 rounded-lg shadow-md p-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-white text-base">{prefix} {subsectionName}</h4>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              subsectionScore < 50 ? 'bg-red-100 text-red-600' 
                              : subsectionScore < 80 ? 'bg-yellow-100 text-yellow-600' 
                              : 'bg-green-100 text-green-600'
                            }`}>
                              {subsectionScore.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        
                        {/* Subsection Items */}
                        {items.map(item => (
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
                                      
                                      {/* Rating Buttons - OK/KO or SCALE_1_5 */}
                                      {critType === 'rating' && (
                                          <div className="space-y-3">
                                              {(() => {
                                                  const evalType = getEvaluationType(crit);
                                                  
                                                  if (evalType === 'OK_KO') {
                                                      // OK/KO for DOTs
                                                      return (
                                                          <>
                                                              <div className="flex items-center space-x-3">
                                                                  <button
                                                                      disabled={isReadOnly || isSaving}
                                                                      onClick={() => handleScoreChange(crit.id, 1)}
                                                                      className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                                                                          scoreVal === 1
                                                                          ? 'bg-green-500 text-white shadow-md'
                                                                          : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700 border border-gray-200'
                                                                      }`}
                                                                  >
                                                                      ✓ OK
                                                                  </button>
                                                                  <button
                                                                      disabled={isReadOnly || isSaving}
                                                                      onClick={() => handleScoreChange(crit.id, 0)}
                                                                      className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                                                                          scoreVal === 0
                                                                          ? 'bg-red-500 text-white shadow-md'
                                                                          : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-700 border border-gray-200'
                                                                      }`}
                                                                  >
                                                                      ✗ KO
                                                                  </button>
                                                              </div>
                                                              
                                                              {/* Comment field */}
                                                              <textarea
                                                                  disabled={isReadOnly || isSaving}
                                                                  placeholder="Comentário (opcional)..."
                                                                  className="w-full text-sm border border-gray-200 rounded-lg bg-gray-50 px-3 py-2 focus:ring-2 focus:ring-mousquetaires focus:border-mousquetaires outline-none resize-none"
                                                                  rows={2}
                                                                  value={criteriaComments[crit.id] || ''}
                                                                  onChange={(e) => handleCommentChange(crit.id, e.target.value)}
                                                                  onBlur={() => saveComment(crit.id)}
                                                              />
                                                              
                                                              {/* Photo upload section */}
                                                              <div className="space-y-2">
                                                                  <div className="flex items-center gap-2">
                                                                      <label className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 text-sm text-gray-700">
                                                                          <Camera size={16} />
                                                                          <span>{scoreVal === 0 ? 'Foto obrigatória' : 'Adicionar foto'}</span>
                                                                          <input
                                                                              type="file"
                                                                              accept="image/*"
                                                                              className="hidden"
                                                                              disabled={isReadOnly || isSaving}
                                                                              onChange={(e) => handlePhotoUpload(crit.id, e)}
                                                                          />
                                                                      </label>
                                                                      {scoreVal === 0 && (!criteriaPhotos[crit.id] || criteriaPhotos[crit.id].length === 0) && (
                                                                          <span className="text-xs text-red-600 font-medium">* Obrigatória para KO</span>
                                                                      )}
                                                                  </div>
                                                                  {criteriaPhotos[crit.id]?.length > 0 && (
                                                                      <div className="flex flex-wrap gap-2">
                                                                          {criteriaPhotos[crit.id].map((photo, idx) => (
                                                                              <div key={idx} className="relative group">
                                                                                  <img src={photo} alt="" className="w-20 h-20 object-cover rounded border border-gray-200" />
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
                                                              </div>
                                                          </>
                                                      );
                                                  } else {
                                                      // SCALE_1_5 for Aderente
                                                      return (
                                                          <>
                                                              <div className="flex items-center gap-2">
                                                                  {[1, 2, 3, 4, 5].map(rating => (
                                                                      <button
                                                                          key={rating}
                                                                          disabled={isReadOnly || isSaving}
                                                                          onClick={() => handleScoreChange(crit.id, rating)}
                                                                          className={`flex-1 px-3 py-2 rounded font-semibold text-sm transition-all ${
                                                                              scoreVal === rating
                                                                              ? 'bg-mousquetaires text-white shadow-md'
                                                                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                                                                          }`}
                                                                      >
                                                                          {rating}
                                                                      </button>
                                                                  ))}
                                                              </div>
                                                          </>
                                                      );
                                                  }
                                              })()}
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
                                                          <option key={s.id} value={`${s.nome} - ${s.city}`}>
                                                              {s.nome} - {s.city}
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
                        
                        {/* Subsection Action Plan */}
                        {!isReadOnly && (
                          <div className="bg-white rounded-xl shadow-sm border border-mousquetaires p-4">
                            <div className="flex items-center justify-between mb-4">
                              <h5 className="font-semibold text-gray-900">Plano de Ação - {prefix} {subsectionName}</h5>
                              <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                                subsectionRating <= 2 ? 'bg-red-100 text-red-700' 
                                : subsectionRating === 3 ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-green-100 text-green-700'
                              }`}>
                                Avaliação: {formatRating(subsectionScore)}/5
                              </span>
                            </div>
                            
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Ação
                                </label>
                                <textarea
                                  placeholder="Descrever ações a tomar para melhorias..."
                                  className="w-full text-sm border border-gray-200 rounded-lg bg-gray-50 px-3 py-2 focus:ring-2 focus:ring-mousquetaires focus:border-mousquetaires outline-none resize-none"
                                  rows={3}
                                  value={sectionActionPlans[evalKey] || ''}
                                  onChange={(e) => handleSectionFieldChange(evalKey as any, 'action_plan', e.target.value)}
                                  onBlur={() => handleSaveSectionEvaluation(currentSection.id, prefix, items)}
                                />
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Responsável
                                  </label>
                                  <div className="w-full text-sm border border-gray-200 rounded-lg bg-gray-100 px-3 py-2 text-gray-700 font-medium flex items-center">
                                    {aderenteName || `Aderente (ID: ${store?.aderente_id})`}
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Prazo
                                  </label>
                                  <input
                                    type="date"
                                    className="w-full text-sm border border-gray-200 rounded-lg bg-gray-50 px-3 py-2 focus:ring-2 focus:ring-mousquetaires focus:border-mousquetaires outline-none"
                                    value={sectionDueDates[evalKey] || ''}
                                    onChange={(e) => handleSectionFieldChange(evalKey as any, 'due_date', e.target.value)}
                                    onBlur={() => handleSaveSectionEvaluation(currentSection.id, prefix, items)}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  });
                } else {
                  // Regular section rendering (non-FRESCOS)
                  return currentSection.items.map(item => (
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
                              </p>
                              
                              {critType === 'rating' && (
                                <div className="space-y-3">
                                  {(() => {
                                    const evalType = getEvaluationType(crit);
                                    
                                    if (evalType === 'OK_KO') {
                                      // OK/KO for DOTs
                                      return (
                                        <>
                                          <div className="flex items-center space-x-3">
                                            <button
                                              disabled={isReadOnly || isSaving}
                                              onClick={() => handleScoreChange(crit.id, 1)}
                                              className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                                                scoreVal === 1
                                                ? 'bg-green-500 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700 border border-gray-200'
                                              }`}
                                            >
                                              ✓ OK
                                            </button>
                                            <button
                                              disabled={isReadOnly || isSaving}
                                              onClick={() => handleScoreChange(crit.id, 0)}
                                              className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                                                scoreVal === 0
                                                ? 'bg-red-500 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-700 border border-gray-200'
                                              }`}
                                            >
                                              ✗ KO
                                            </button>
                                          </div>
                                          
                                          <textarea
                                            disabled={isReadOnly || isSaving}
                                            placeholder="Comentário (opcional)..."
                                            className="w-full text-sm border border-gray-200 rounded-lg bg-gray-50 px-3 py-2 focus:ring-2 focus:ring-mousquetaires focus:border-mousquetaires outline-none resize-none"
                                            rows={2}
                                            value={criteriaComments[crit.id] || ''}
                                            onChange={(e) => handleCommentChange(crit.id, e.target.value)}
                                            onBlur={() => saveComment(crit.id)}
                                          />
                                          
                                          <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                              <label className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 text-sm text-gray-700">
                                                <Camera size={16} />
                                                <span>{scoreVal === 0 ? 'Foto obrigatória' : 'Adicionar foto'}</span>
                                                <input
                                                  type="file"
                                                  accept="image/*"
                                                  className="hidden"
                                                  disabled={isReadOnly || isSaving}
                                                  onChange={(e) => handlePhotoUpload(crit.id, e)}
                                                />
                                              </label>
                                              {scoreVal === 0 && (!criteriaPhotos[crit.id] || criteriaPhotos[crit.id].length === 0) && (
                                                <span className="text-xs text-red-600 font-medium">* Obrigatória para KO</span>
                                              )}
                                            </div>
                                            {criteriaPhotos[crit.id]?.length > 0 && (
                                              <div className="flex flex-wrap gap-2">
                                                {criteriaPhotos[crit.id].map((photo, idx) => (
                                                  <div key={idx} className="relative group">
                                                    <img src={photo} alt="" className="w-20 h-20 object-cover rounded border border-gray-200" />
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
                                          </div>
                                        </>
                                      );
                                    } else {
                                      // SCALE_1_5 for Aderente
                                      return (
                                        <>
                                          <div className="flex items-center gap-2">
                                            {[1, 2, 3, 4, 5].map(rating => (
                                              <button
                                                key={rating}
                                                disabled={isReadOnly || isSaving}
                                                onClick={() => handleScoreChange(crit.id, rating)}
                                                className={`flex-1 px-3 py-2 rounded font-semibold text-sm transition-all ${
                                                  scoreVal === rating
                                                  ? 'bg-mousquetaires text-white shadow-md'
                                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                                                }`}
                                              >
                                                {rating}
                                              </button>
                                            ))}
                                          </div>
                                        </>
                                      );
                                    }
                                  })()}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                }
              })()}
          </div>
          
          {/* Section Action Plan - Only for non-FRESCOS sections */}
          {!isReadOnly && currentSection.id !== 3 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">Plano de Ação da Secção</h4>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                  calculateSectionRating(currentSection) <= 2 ? 'bg-red-100 text-red-700' 
                  : calculateSectionRating(currentSection) === 3 ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-green-100 text-green-700'
                }`}>
                  Avaliação: {formatRating(sectionScore)}/5
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ação
                  </label>
                  <textarea
                    placeholder="Descrever ações a tomar para melhorias..."
                    className="w-full text-sm border border-gray-200 rounded-lg bg-gray-50 px-3 py-2 focus:ring-2 focus:ring-mousquetaires focus:border-mousquetaires outline-none resize-none"
                    rows={3}
                    value={sectionActionPlans[currentSection.id] || ''}
                    onChange={(e) => handleSectionFieldChange(currentSection.id, 'action_plan', e.target.value)}
                    onBlur={() => handleSaveSectionEvaluation(currentSection.id)}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Responsável
                    </label>
                    <div className="w-full text-sm border border-gray-200 rounded-lg bg-gray-100 px-3 py-2 text-gray-700 font-medium flex items-center">
                      {aderenteName || `Aderente (ID: ${store?.aderente_id})`}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prazo
                    </label>
                    <input
                      type="date"
                      className="w-full text-sm border border-gray-200 rounded-lg bg-gray-50 px-3 py-2 focus:ring-2 focus:ring-mousquetaires focus:border-mousquetaires outline-none"
                      value={sectionDueDates[currentSection.id] || ''}
                      onChange={(e) => handleSectionFieldChange(currentSection.id, 'due_date', e.target.value)}
                      onBlur={() => handleSaveSectionEvaluation(currentSection.id)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
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

              <div className="flex items-center gap-3">
                <div className="text-sm font-medium text-gray-500 whitespace-nowrap">
                    {currentSectionIndex + 1} / {checklist.sections.length}
                </div>
                
                {/* Save Button - only show if not readonly and not on last section */}
                {!isReadOnly && currentSectionIndex < checklist.sections.length - 1 && (
                  <Button 
                    variant="outline"
                    onClick={handleSaveVisit}
                    disabled={submitting}
                    className="flex-1 sm:flex-none"
                    title="Guardar Progresso"
                  >
                    <Save size={18} className="mr-1" /> Guardar
                  </Button>
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
                  // Show Save/Submit buttons for Aderente visits, or Save/Finalize for DOTs audits
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
                    !isReadOnly && (
                      <div className="flex gap-2 flex-1 sm:flex-none">
                        <Button 
                          variant="outline"
                          onClick={handleSaveVisit}
                          disabled={submitting}
                          className="flex-1 sm:flex-none"
                        >
                          <Save className="mr-1" size={18} /> Guardar
                        </Button>
                        <Button onClick={handleFinish} disabled={submitting} className="flex-1 sm:flex-none">
                          Submeter <Send className="ml-1" size={18} />
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