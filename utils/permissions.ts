import { UserRole, AuditStatus } from '../types';
import { getCurrentUser, hasRole } from './auth';

// ====================================
// HIERARQUIA: ADMIN > DOT_TEAM_LEADER > DOT OPERACIONAL > ADERENTE
// ====================================

export const canCreateAudit = (): boolean => {
  // DOT Operacional pode criar auditorias nas suas próprias lojas
  // DOT Team Leader pode criar via CSV
  // ADMIN pode criar sempre
  return hasRole(UserRole.DOT_OPERACIONAL) || hasRole(UserRole.DOT_TEAM_LEADER) || hasRole(UserRole.ADMIN);
};

// Accept both numeric and string statuses to support mixed sources
export const canEditAudit = (auditStatus: number | string, auditUserId?: number, createdBy?: number): boolean => {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;

  // ADMIN pode editar sempre
  if (hasRole(UserRole.ADMIN)) return true;
  
  // Verificar se o status permite edição (tanto para DOT Team Leader como DOT Operacional)
  let isEditable = false;
  if (typeof auditStatus === 'number') {
    // Legacy numeric statuses: allow anything below submitted/closed
    isEditable = auditStatus < 3;
  } else {
    // String statuses: allow NEW and SCHEDULED and IN_PROGRESS only
    // COMPLETED, CANCELLED são read-only
    const statusStr = String(auditStatus).toUpperCase();
    isEditable = statusStr === 'NEW' || statusStr === 'SCHEDULED' || statusStr === 'IN_PROGRESS';
  }
  
  // DOT Team Leader pode editar enquanto não submetida
  if (hasRole(UserRole.DOT_TEAM_LEADER)) return isEditable;
  
  // DOT Operacional pode editar conteúdos enquanto não submetida.
  if (hasRole(UserRole.DOT_OPERACIONAL)) {
    return isEditable;
  }

  // Aderente pode editar suas próprias visitas enquanto não estão submetidas
  if (hasRole(UserRole.ADERENTE) && createdBy && createdBy === currentUser.userId) {
    let isEditable = false;
    if (typeof auditStatus === 'number') {
      // Legacy numeric statuses: allow anything below submitted/closed
      isEditable = auditStatus < 3;
    } else {
      // String statuses: allow NEW and SCHEDULED and IN_PROGRESS
      const statusStr = String(auditStatus).toUpperCase();
      isEditable = statusStr === 'NEW' || statusStr === 'SCHEDULED' || statusStr === 'IN_PROGRESS';
    }
    return isEditable;
  }
  
  return false;
};

export const canEditAuditDate = (createdBy?: number): boolean => {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;

  // ADMIN pode sempre alterar datas
  if (hasRole(UserRole.ADMIN)) return true;
  
  // DOT Team Leader pode alterar datas
  if (hasRole(UserRole.DOT_TEAM_LEADER)) return true;
  
  // DOT Operacional pode alterar datas APENAS de auditorias que ele próprio criou
  // NÃO pode alterar datas de auditorias criadas pelo DOT Team Leader
  if (hasRole(UserRole.DOT_OPERACIONAL) && createdBy) {
    return currentUser.userId === createdBy;
  }
  
  return false;
};

export const canDeleteAudit = (createdBy?: number): boolean => {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;
  
  // ADMIN pode apagar sempre
  if (hasRole(UserRole.ADMIN)) return true;
  
  // DOT Operacional pode apagar APENAS auditorias que ele próprio criou manualmente
  // NÃO pode apagar auditorias criadas pelo DOT Team Leader via CSV
  if (hasRole(UserRole.DOT_OPERACIONAL) && createdBy) {
    return currentUser.userId === createdBy;
  }
  
  return false;
};

export const canViewAudit = (): boolean => {
  // Todos podem ver auditorias (com filtros apropriados)
  return true;
};

export const canViewAuditAsAderente = (
  auditCreatedBy: number | undefined,
  storeAderenteId: number | undefined,
  visitSourceType?: string
): boolean => {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;

  // ADMIN e DOT Team Leader podem ver tudo
  if (hasRole(UserRole.ADMIN) || hasRole(UserRole.DOT_TEAM_LEADER)) return true;

  // Se não é uma visita do Aderente, retorna false (apenas DOT pode ver auditorias DOT_AUDIT)
  if (visitSourceType !== 'ADERENTE_VISIT') return false;

  // Aderente pode ver se:
  // 1. É o criador (Aderente visitante), OU
  // 2. É o Aderente da loja visitada (storeAderenteId = seu ID)
  if (hasRole(UserRole.ADERENTE)) {
    return currentUser.userId === auditCreatedBy || currentUser.userId === storeAderenteId;
  }

  return false;
};

export const canSubmitAudit = (auditUserId: number | undefined, auditStatus?: number | string): boolean => {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;
  
  // DOT Operacional pode submeter auditorias em curso (incluindo criadas pelo DOT Team Leader)
  if (hasRole(UserRole.DOT_OPERACIONAL)) {
    // If provided, respect creator when available but don't require it
    const isCreatorOrAssigned = auditUserId ? currentUser.userId === auditUserId : true;
    // Allow submission for NEW/SCHEDULED/IN_PROGRESS
    let isSubmittable = true;
    if (auditStatus !== undefined) {
      if (typeof auditStatus === 'number') {
        isSubmittable = auditStatus < 3; // before SUBMITTED/CLOSED
      } else {
        const statusStr = String(auditStatus).toUpperCase();
        isSubmittable = statusStr === 'NEW' || statusStr === 'SCHEDULED' || statusStr === 'IN_PROGRESS';
      }
    }
    return isCreatorOrAssigned && isSubmittable;
  }
  
  // DOT Team Leader and ADMIN can also manage submission in broader workflows
  if (hasRole(UserRole.DOT_TEAM_LEADER) || hasRole(UserRole.ADMIN)) return true;
  
  return false;
};

export const canManageActions = (): boolean => {
  // DOT Operacional e Aderente podem ver ações
  // DOT Team Leader e ADMIN também podem
  return hasRole(UserRole.DOT_OPERACIONAL) || hasRole(UserRole.ADERENTE) || hasRole(UserRole.DOT_TEAM_LEADER) || hasRole(UserRole.ADMIN);
};

export const canCreateActions = (): boolean => {
  // Apenas DOT Operacional pode criar ações (após auditoria)
  return hasRole(UserRole.DOT_OPERACIONAL) || hasRole(UserRole.ADMIN);
};

export const canUpdateActionStatus = (actionResponsible: string): boolean => {
  const user = getCurrentUser();
  if (!user) return false;
  
  // ADMIN pode sempre atualizar
  if (hasRole(UserRole.ADMIN)) return true;
  
  // DOT Operacional pode sempre atualizar ações que criou
  if (hasRole(UserRole.DOT_OPERACIONAL)) return true;
  
  // Aderente pode atualizar apenas se for responsável
  if (hasRole(UserRole.ADERENTE)) {
    return actionResponsible === 'Aderente' || actionResponsible === 'Ambos';
  }
  
  return false;
};

export const canCloseAudit = (): boolean => {
  // Apenas DOT Team Leader e ADMIN podem fechar auditorias
  return hasRole(UserRole.DOT_TEAM_LEADER) || hasRole(UserRole.ADMIN);
};

export const canViewReports = (): boolean => {
  // Apenas DOT Team Leader e ADMIN podem ver relatórios
  return hasRole(UserRole.DOT_OPERACIONAL) || hasRole(UserRole.DOT_TEAM_LEADER) || hasRole(UserRole.ADMIN);
};

export const canImportAuditsCSV = (): boolean => {
  // Apenas DOT Team Leader e ADMIN podem importar auditorias via CSV
  return hasRole(UserRole.DOT_TEAM_LEADER) || hasRole(UserRole.ADMIN);
};

export const canManageUsers = (): boolean => {
  // Apenas ADMIN pode criar/editar/apagar utilizadores
  return hasRole(UserRole.ADMIN);
};

export const canAssignDOTsToStores = (): boolean => {
  // ADMIN e DOT Team Leader podem atribuir DOTs a lojas
  return hasRole(UserRole.ADMIN) || hasRole(UserRole.DOT_TEAM_LEADER);
};

export const canAccessDotTeamLeaderDashboard = (): boolean => {
  // Admin reutiliza as rotas do DOT Team Leader para gestão de visitas
  return hasRole(UserRole.DOT_TEAM_LEADER) || hasRole(UserRole.ADMIN);
};

export const canAccessAderenteDashboard = (): boolean => {
  return hasRole(UserRole.ADERENTE);
};

export const canAccessDOTDashboard = (): boolean => {
  return hasRole(UserRole.DOT_OPERACIONAL) || hasRole(UserRole.ADMIN);
};

export const canAddInternalComments = (): boolean => {
  // Apenas DOT Operacional pode adicionar comentários internos
  return hasRole(UserRole.DOT_OPERACIONAL) || hasRole(UserRole.ADMIN);
};

export const canAccessAdminDashboard = (): boolean => {
  return hasRole(UserRole.ADMIN);
};

// Helper functions para verificação de roles
export const isAdmin = (): boolean => hasRole(UserRole.ADMIN);
export const isDotTeamLeader = (): boolean => hasRole(UserRole.DOT_TEAM_LEADER);
export const isDOTOperacional = (): boolean => hasRole(UserRole.DOT_OPERACIONAL);
export const isAderente = (): boolean => hasRole(UserRole.ADERENTE);

export const canViewAllVisits = (): boolean => {
  // Apenas DOT Team Leader pode ver todas as visitas
  return hasRole(UserRole.DOT_TEAM_LEADER);
};

export const canEditVisit = (visitStatus: number | string, createdBy?: number): boolean => {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;

  // Verificar se o status permite edição
  let isEditable = false;
  if (typeof visitStatus === 'number') {
    // Legacy numeric statuses: allow anything below submitted/closed
    isEditable = visitStatus < 3;
  } else {
    // String statuses: allow NEW and SCHEDULED and IN_PROGRESS only
    // SUBMITTED, ENDED, CLOSED, CANCELLED são read-only
    const statusStr = String(visitStatus).toUpperCase();
    isEditable = statusStr === 'NEW' || statusStr === 'SCHEDULED' || statusStr === 'IN_PROGRESS';
  }

  // ADMIN pode editar apenas visitas em progresso (mesma regra que outros perfis)
  if (hasRole(UserRole.ADMIN)) return isEditable;
  
  // DOT Team Leader pode editar enquanto não submetida
  if (hasRole(UserRole.DOT_TEAM_LEADER)) return isEditable;
  
  // DOT Operacional pode editar enquanto não submetida
  if (hasRole(UserRole.DOT_OPERACIONAL)) return isEditable;

  // Aderente pode editar suas próprias visitas enquanto não estão submetidas
  if (hasRole(UserRole.ADERENTE) && createdBy && createdBy === currentUser.userId) {
    return isEditable;
  }
  
  return false;
};

export const getDefaultDashboard = (): string => {
  if (hasRole(UserRole.ADMIN)) return '/admin/dashboard';
  if (hasRole(UserRole.DOT_TEAM_LEADER)) return '/dot-team-leader/dashboard';
  if (hasRole(UserRole.ADERENTE)) return '/aderente/dashboard';
  if (hasRole(UserRole.DOT_OPERACIONAL)) return '/dot-operacional/dashboard';
  return '/';
};
