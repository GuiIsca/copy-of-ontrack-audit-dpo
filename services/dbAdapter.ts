// Database adapter - calls PostgreSQL API instead of localStorage
import { api } from './api';
import { User, Store, Audit, Visit, ActionPlan, AuditScore, AuditComment, Checklist, AuditStatus } from '../types';

class DatabaseAdapter {
  // ============ USERS ============
  async getUsers(): Promise<User[]> {
    const users = await api.getUsers();
    return users.map((u: any) => ({
      ...u,
      dotTeamLeaderId: u.dot_team_leader_id,
      assignedStores: u.assigned_stores
    }));
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const users = await this.getUsers();
    return users.find((u: User) => u.email === email);
  }

  async getUserById(id: number): Promise<User | undefined> {
    try {
      const u = await api.getUserById(id);
      if (!u) return undefined;
      return {
        ...u,
        dotTeamLeaderId: u.dot_team_leader_id,
        assignedStores: u.assigned_stores
      };
    } catch {
      return undefined;
    }
  }

  async createUser(userData: Partial<User>): Promise<User> {
    return api.createUser({
      email: userData.email,
      fullname: userData.fullname,
      roles: userData.roles || ['ADERENTE'],
      dotTeamLeaderId: (userData as any).dotTeamLeaderId,
      assignedStores: userData.assignedStores || []
    });
  }

  async updateUser(user: User): Promise<void> {
    // Convert assignedStores to assigned_stores for backend compatibility
    const userData: any = { ...user };
    if ('assignedStores' in userData) {
      userData.assigned_stores = userData.assignedStores;
      delete userData.assignedStores;
    }
    await api.updateUser(user.id, userData);
  }

  async deleteUser(userId: number): Promise<void> {
    await api.deleteUser(userId);
  }

  async assignDOTOperacionalToStore(storeId: number, dotOperacionalId: number): Promise<void> {
    // Enviar o campo correto para o backend
    await api.updateStore(storeId, { dot_operacional_id: dotOperacionalId });
  }

  // Legacy alias for backward compatibility
  async assignDOTToStore(storeId: number, dotUserId: number): Promise<void> {
    return this.assignDOTOperacionalToStore(storeId, dotUserId);
  }

  async assignAderenteToStore(storeId: number, aderenteId: number): Promise<void> {
    await api.updateStore(storeId, { aderente_id: aderenteId });
  }

  // ============ STORES ============
  async getStores(): Promise<Store[]> {
    const stores = await api.getStores();
    // Normalize snake_case to camelCase; keep both legacy and new DOT fields
    return stores.map((s: any) => ({
      ...s,
      dotUserId: s.dot_user_id ?? s.dot_operacional_id, // legacy camelCase
      dot_operacional_id: s.dot_operacional_id,          // preferred field
      aderenteId: s.aderente_id
    }));
  }

  async getStoreById(id: number): Promise<Store | undefined> {
    const stores = await this.getStores();
    return stores.find((s: Store) => s.id === id);
  }

  async getStoresForDOTOperacional(dotOperacionalId: number): Promise<Store[]> {
    const stores = await this.getStores();
    // Convert to number for comparison to handle string IDs from localStorage
    const userId = Number(dotOperacionalId);
    return stores.filter((s: Store) => 
      Number(s.dotUserId) === userId || Number(s.dot_operacional_id) === userId
    );
  }

  // Legacy alias for backward compatibility
  async getStoresForDOT(dotUserId: number): Promise<Store[]> {
    return this.getStoresForDOTOperacional(dotUserId);
  }

  async createStore(storeData: Partial<Store>): Promise<Store> {
    return api.createStore(storeData);
  }

  async updateStore(store: Store): Promise<void> {
    await api.updateStore(store.id, store);
  }

  async deleteStore(storeId: number): Promise<void> {
    await api.deleteStore(storeId);
  }

  // ============ AUDITS ============
  async getAudits(userId?: number): Promise<Audit[]> {
    const data = await api.getAudits(userId);
    return data.map(d => {
      // Convert status string to AuditStatus enum
      let statusNum = AuditStatus.NEW;
      if (typeof d.status === 'string') {
        switch (d.status) {
          case 'SCHEDULED': statusNum = AuditStatus.NEW; break;
          case 'IN_PROGRESS': statusNum = AuditStatus.IN_PROGRESS; break;
          case 'COMPLETED': statusNum = AuditStatus.SUBMITTED; break;
          case 'CANCELLED': statusNum = AuditStatus.CANCELLED; break;
          case 'REPLACED': statusNum = AuditStatus.REPLACED; break;
          default: statusNum = AuditStatus.NEW;
        }
      } else {
        statusNum = d.status;
      }
      
      const finalScore = d.finalScore || d.final_score;
      return {
        ...d,
        status: statusNum,
        // For Aderente visits (visit_source_type = ADERENTE_VISIT), use createdBy as user_id
        // For DOT audits, use dotUserId
        user_id: d.dotUserId || d.createdBy || d.user_id,
        // Preserve DOT operacional owner from any field name we may receive
        dot_operacional_id: d.dotOperacionalId || d.dot_operacional_id || d.dotUserId,
        createdBy: d.createdBy || d.created_by,
        store_id: d.storeId || d.store_id,
        checklist_id: d.checklistId || d.checklist_id,
        final_score: finalScore ? parseFloat(finalScore as any) : null,
        score: finalScore ? parseFloat(finalScore as any) : null,  // Map final_score to score for frontend
        visit_source_type: d.visitSourceType || d.visit_source_type
      };
    });
  }

  async getAuditById(id: number): Promise<Audit | undefined> {
    try {
      const data = await api.getAuditById(id);
      
      // Convert status string to AuditStatus enum
      let statusNum = AuditStatus.NEW;
      if (typeof data.status === 'string') {
        switch (data.status) {
          case 'SCHEDULED': statusNum = AuditStatus.NEW; break;
          case 'IN_PROGRESS': statusNum = AuditStatus.IN_PROGRESS; break;
          case 'COMPLETED': statusNum = AuditStatus.SUBMITTED; break;
          case 'CANCELLED': statusNum = AuditStatus.CANCELLED; break;
          default: statusNum = AuditStatus.NEW;
        }
      } else {
        statusNum = data.status;
      }
      
      // Normalize: For Aderente visits, use createdBy as user_id; for DOT, use dotUserId
      // Also map camelCase fields back to snake_case for type compatibility
      const finalScore = data.finalScore || data.final_score;
      return {
        ...data,
        status: statusNum,
        user_id: data.dotUserId || data.createdBy || data.user_id,
        dot_operacional_id: data.dotOperacionalId || data.dotUserId,
        createdBy: data.createdBy || data.created_by,
        store_id: data.storeId || data.store_id,
        checklist_id: data.checklistId || data.checklist_id,
        final_score: finalScore ? parseFloat(finalScore as any) : null,
        score: finalScore ? parseFloat(finalScore as any) : null,  // Map final_score to score for frontend
        visit_source_type: data.visitSourceType || data.visit_source_type
      };
    } catch (error) {
      console.error('Error fetching audit:', error);
      return undefined;
    }
  }

  async createAudit(auditData: Partial<Audit> & { user_id?: number; store_id?: number; checklist_id?: number; created_by?: number; visitSourceType?: string }): Promise<Audit> {
    let statusStr = 'SCHEDULED';
    if (auditData.status) {
      switch (auditData.status) {
        case AuditStatus.NEW: statusStr = 'SCHEDULED'; break;
        case AuditStatus.IN_PROGRESS: statusStr = 'IN_PROGRESS'; break;
        case AuditStatus.SUBMITTED: statusStr = 'COMPLETED'; break;
        case AuditStatus.ENDED: statusStr = 'COMPLETED'; break;
        case AuditStatus.CLOSED: statusStr = 'COMPLETED'; break;
        case AuditStatus.CANCELLED: statusStr = 'CANCELLED'; break;
        default: statusStr = 'SCHEDULED';
      }
    }

    // Resolve checklistId dynamically to avoid FK errors when DB seed differs
    let checklistIdToUse = auditData.checklist_id;
    if (!checklistIdToUse) {
      try {
        const cls = await api.getChecklists();
        if (Array.isArray(cls) && cls.length > 0) {
          // Prefer a DOT-oriented checklist when available
          const preferred = cls.find((c: any) => ['DOT','DOT_TEAM_LEADER','DOT_OPERACIONAL'].includes((c.target_role || c.targetRole || '').toString().toUpperCase()));
          checklistIdToUse = (preferred?.id as number) || (cls[0]?.id as number) || 1;
        } else {
          checklistIdToUse = 1;
        }
      } catch {
        checklistIdToUse = 1;
      }
    }

    const result = await api.createAudit({
      storeId: auditData.store_id,
      // Accept any of the known DOT identifier fields
      dotUserId: (auditData as any).dot_operacional_id || (auditData as any).dot_user_id || auditData.user_id,
      checklistId: checklistIdToUse,
      dtstart: auditData.dtstart,
      status: statusStr,
      createdBy: auditData.created_by || auditData.createdBy,
      visitSourceType: auditData.visitSourceType || 'DOT_AUDIT'
    });

    // Normalize response - for Aderente visits, createdBy becomes user_id
    return {
      ...result,
      user_id: result.dotUserId || result.createdBy || result.user_id,
      dot_operacional_id: result.dotOperacionalId || result.dotUserId,
      store_id: result.storeId || result.store_id,
      checklist_id: result.checklistId || result.checklist_id,
      final_score: result.finalScore || result.final_score
    };
  }

  async updateAudit(auditOrId: Audit | number, partialData?: Partial<Audit>): Promise<void> {
    let id: number;
    let status: AuditStatus;
    let dtend: string | undefined;
    let final_score: number | undefined;
    let pontos_fortes: string | undefined;
    let pontos_melhorar: string | undefined;
    let acoes_criticas: string | undefined;
    let alertas: string | undefined;

    if (typeof auditOrId === 'number') {
      // Called with (id, partialData)
      id = auditOrId;
      status = partialData?.status ?? AuditStatus.NEW;
      dtend = partialData?.dtend;
      final_score = partialData?.final_score;
      // Try both snake_case and camelCase since API converts to camelCase
      pontos_fortes = partialData?.pontos_fortes || (partialData as any)?.pontosFortes;
      pontos_melhorar = partialData?.pontos_melhorar || (partialData as any)?.pontosMelhorar;
      acoes_criticas = partialData?.acoes_criticas || (partialData as any)?.acoesCriticas;
      alertas = partialData?.alertas;
    } else {
      // Called with (audit) - may have camelCase keys from API response
      id = auditOrId.id;
      status = auditOrId.status;
      dtend = auditOrId.dtend;
      final_score = auditOrId.final_score;
      // Try both snake_case and camelCase since API converts to camelCase
      pontos_fortes = auditOrId.pontos_fortes || (auditOrId as any)?.pontosFortes;
      pontos_melhorar = auditOrId.pontos_melhorar || (auditOrId as any)?.pontosMelhorar;
      acoes_criticas = auditOrId.acoes_criticas || (auditOrId as any)?.acoesCriticas;
      alertas = auditOrId.alertas;
    }

    let statusStr = 'SCHEDULED';
    // Map numeric enum to string enum for DB
    switch (status) {
      case AuditStatus.NEW: statusStr = 'SCHEDULED'; break;
      case AuditStatus.IN_PROGRESS: statusStr = 'IN_PROGRESS'; break;
      case AuditStatus.SUBMITTED: statusStr = 'COMPLETED'; break;
      case AuditStatus.ENDED: statusStr = 'COMPLETED'; break;
      case AuditStatus.CLOSED: statusStr = 'COMPLETED'; break;
      case AuditStatus.CANCELLED: statusStr = 'CANCELLED'; break;
      default: statusStr = 'SCHEDULED';
    }

    await api.updateAudit(id, {
      status: statusStr,
      dtend,
      finalScore: final_score,
      pontos_fortes,
      pontos_melhorar,
      acoes_criticas,
      alertas
    });
  }

  // ============ VISITS ============
  async getVisits(params?: { userId?: number; storeId?: number; type?: string }): Promise<Visit[]> {
    return api.getVisits(params);
  }

  async getVisitsForDOTOperacional(dotOperacionalId: number): Promise<Visit[]> {
    return api.getVisits({ userId: dotOperacionalId });
  }

  // Legacy alias for backward compatibility
  async getVisitsForDOT(dotUserId: number): Promise<Visit[]> {
    return this.getVisitsForDOTOperacional(dotUserId);
  }

  async getVisitById(id: number): Promise<Visit | undefined> {
    try {
      return await api.getVisitById(id);
    } catch {
      return undefined;
    }
  }

  async createVisit(visitData: Partial<Visit>): Promise<Visit> {
    // Map frontend enums/values to DB enum strings
    let typeStr = 'OUTROS';
    if (visitData.type) {
      switch ((visitData.type as any).toString()) {
        case 'Auditoria':
        case 'AUDITORIA':
          typeStr = 'AUDITORIA';
          break;
        default:
          typeStr = 'OUTROS';
      }
    }

    let statusStr = 'SCHEDULED';
    if (visitData.status !== undefined && visitData.status !== null) {
      switch (visitData.status) {
        case AuditStatus.NEW:
          statusStr = 'SCHEDULED';
          break;
        case AuditStatus.IN_PROGRESS:
          statusStr = 'IN_PROGRESS';
          break;
        case AuditStatus.SUBMITTED:
        case AuditStatus.ENDED:
        case AuditStatus.CLOSED:
          statusStr = 'COMPLETED';
          break;
        case AuditStatus.CANCELLED:
          statusStr = 'CANCELLED';
          break;
        default:
          // accept already string statuses passed through
          if (typeof visitData.status === 'string') statusStr = visitData.status as string;
      }
    }

    // If this is an 'AUDITORIA' type, create an actual audit record
        if (typeStr === 'AUDITORIA') { 
      // Map statusStr back to AuditStatus enum where possible for createAudit helper
      // createAudit expects numeric AuditStatus values; map common strings
      let statusEnum = undefined as any;
      switch (statusStr) {
        case 'SCHEDULED': statusEnum = AuditStatus.NEW; break;
        case 'IN_PROGRESS': statusEnum = AuditStatus.IN_PROGRESS; break;
        case 'COMPLETED': statusEnum = AuditStatus.ENDED; break;
        case 'CANCELLED': statusEnum = AuditStatus.CANCELLED; break;
        default: statusEnum = AuditStatus.NEW;
      }

      const audit = await this.createAudit({
        store_id: visitData.store_id,
        dot_operacional_id: visitData.user_id, // user_id is the DOT Team Leader (executor)
        dtstart: visitData.dtstart,
        status: statusEnum,
        created_by: visitData.created_by
      } as any);

      return audit as any;
    }

    // userId é sempre o utilizador autenticado (DOT Team Leader ou DOT)
    return api.createVisit({
      storeId: visitData.store_id,
      userId: visitData.user_id, // quem está autenticado
      type: typeStr,
      title: visitData.title,
      description: visitData.description || '',
      dtstart: visitData.dtstart,
      dtend: visitData.dtend,
      status: statusStr,
      createdBy: visitData.created_by
    });
  }

  async updateVisit(visit: Visit): Promise<void> {
    await api.updateVisit(visit.id, {
      title: visit.title,
      description: visit.description,
      status: visit.status,
      dtend: visit.dtend
    });
  }

  async deleteVisit(visitId: number): Promise<void> {
    await api.deleteVisit(visitId);
  }

  // ============ ANALYTICS ============
  async getAnalytics(params?: { startDate?: string; endDate?: string; periodType?: string; storeId?: number }) {
    return api.getAnalytics(params);
  }

  async saveAnalyticsSnapshot(payload: any) {
    return api.saveAnalyticsSnapshot(payload);
  }

  async saveAnalyticsBatch(payload: any) {
    return api.saveAnalyticsBatch(payload);
  }

  async deleteAnalyticsSnapshot(id: number) {
    return api.deleteAnalyticsSnapshot(id);
  }

  // ============ SCORES ============
  async getScores(auditId: number): Promise<AuditScore[]> {
    return api.getScores(auditId);
  }

  async saveScore(score: Partial<AuditScore> & { photo_url?: string; allPhotos?: string[]; evaluation_type?: string; requires_photo?: boolean }): Promise<void> {
    await api.saveScore({
      auditId: score.audit_id,
      criteriaId: score.criteria_id,
      score: score.score,
      comment: score.comment,
      photoUrl: (score as any).photo_url || (score as any).photoUrl,
      allPhotos: (score as any).allPhotos,
      evaluationType: (score as any).evaluation_type,
      requiresPhoto: (score as any).requires_photo
    });
  }

  // ============ SECTION EVALUATIONS ============
  async getSectionEvaluations(auditId: number): Promise<any[]> {
    return api.getSectionEvaluations(auditId);
  }

  async saveSectionEvaluation(evaluation: { audit_id: number; section_id: number | string; rating?: number; action_plan?: string; responsible?: string; due_date?: string; aderente_id?: number; store_id?: number; created_by?: number }): Promise<void> {
    await api.saveSectionEvaluation({
      auditId: evaluation.audit_id,
      sectionId: evaluation.section_id,
      rating: evaluation.rating,
      actionPlan: evaluation.action_plan,
      responsible: evaluation.responsible,
      dueDate: evaluation.due_date,
      aderenteId: evaluation.aderente_id,
      storeId: evaluation.store_id,
      createdBy: evaluation.created_by
    });
  }

  // ============ ACTIONS ============
  async getActions(auditId?: number): Promise<ActionPlan[]> {
    return api.getActions(auditId);
  }

  async createAction(actionData: Partial<ActionPlan> & { audit_id?: number; criteria_id?: number; due_date?: string; created_by?: number }): Promise<ActionPlan> {
    return api.createAction({
      auditId: (actionData as any).audit_id || actionData.audit_id,
      criteriaId: (actionData as any).criteria_id || actionData.criteria_id,
      title: actionData.title,
      description: actionData.description,
      responsible: actionData.responsible,
      dueDate: (actionData as any).due_date || actionData.dueDate,
      createdBy: (actionData as any).created_by || actionData.createdBy
    });
  }

  async updateAction(action: ActionPlan): Promise<void> {
    await api.updateAction(action.id, {
      title: action.title,
      description: action.description,
      status: action.status,
      progress: action.progress,
      completedDate: action.completedDate || (action as any).completed_date
    });
  }

  async deleteAction(actionId: number): Promise<void> {
    await api.deleteAction(actionId);
  }

  // ============ COMMENTS ============
  async getComments(auditId: number): Promise<AuditComment[]> {
    return api.getComments(auditId);
  }

  async createComment(commentData: Partial<AuditComment> & { audit_id?: number; user_id?: number; is_internal?: boolean }): Promise<AuditComment> {
    return api.createComment({
      auditId: commentData.audit_id,
      userId: commentData.user_id,
      // accept both 'comment' (UI) and 'content' (API) keys
      content: (commentData as any).comment ?? (commentData as any).content ?? '',
      // accept both 'isInternal' (UI) and 'is_internal' (API) keys
      isInternal: (commentData as any).isInternal ?? (commentData as any).is_internal ?? false
    });
  }

  // ============ CHECKLISTS ============
  async getChecklist(id?: number): Promise<Checklist | null> {
    if (id) {
      return this.getChecklistById(id);
    }
    const checklists = await api.getChecklists();
    return checklists[0] || null;
  }

  async getChecklists(): Promise<Checklist[]> {
    const checklists = await api.getChecklists();
    // Normalize target_role to targetRole for frontend compatibility
    return checklists.map((c: any) => ({
      ...c,
      targetRole: c.target_role || c.targetRole
    }));
  }

  async getChecklistById(id: number): Promise<Checklist | undefined> {
    try {
      return await api.getChecklistById(id);
    } catch {
      return undefined;
    }
  }

  // ============ HELPERS ============
  async getDOTsForTeamLeader(teamLeaderId: number): Promise<User[]> {
    const users = await api.getUsers();
    return users.filter((u: any) => (u.dot_team_leader_id || u.dotTeamLeaderId) === teamLeaderId);
  }

  // No-op for compatibility (data now persists in PostgreSQL)
  resetSeeds(): void {
    console.warn('resetSeeds() is deprecated - data is now in PostgreSQL');
  }
}

// Export singleton instance
export const db = new DatabaseAdapter();
