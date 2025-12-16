import { UserRole, AuditStatus } from '../types';
import { getCurrentUser, hasRole } from './auth';

// ====================================
// HIERARQUIA: ADMIN > AMONT > DOT > ADERENTE
// ====================================

export const canCreateAudit = (): boolean => {
  // DOT pode criar auditorias nas suas próprias lojas
  // AMONT pode criar via CSV
  // ADMIN pode criar sempre
  return hasRole(UserRole.DOT) || hasRole(UserRole.AMONT) || hasRole(UserRole.ADMIN);
};

// Accept both numeric and string statuses to support mixed sources
export const canEditAudit = (auditStatus: number | string, auditUserId?: number, createdBy?: number): boolean => {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;

  // ADMIN pode editar sempre
  if (hasRole(UserRole.ADMIN)) return true;
  
  // Verificar se o status permite edição (tanto para AMONT como DOT)
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
  
  // AMONT pode editar enquanto não submetida
  if (hasRole(UserRole.AMONT)) return isEditable;
  
  // DOT pode editar conteúdos enquanto não submetida.
  if (hasRole(UserRole.DOT)) {
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
  
  // AMONT pode alterar datas
  if (hasRole(UserRole.AMONT)) return true;
  
  // DOT pode alterar datas APENAS de auditorias que ele próprio criou
  // NÃO pode alterar datas de auditorias criadas pelo Amont
  if (hasRole(UserRole.DOT) && createdBy) {
    return currentUser.userId === createdBy;
  }
  
  return false;
};

export const canDeleteAudit = (createdBy?: number): boolean => {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;
  
  // ADMIN pode apagar sempre
  if (hasRole(UserRole.ADMIN)) return true;
  
  // DOT pode apagar APENAS auditorias que ele próprio criou manualmente
  // NÃO pode apagar auditorias criadas pelo Amont via CSV
  if (hasRole(UserRole.DOT) && createdBy) {
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

  // ADMIN e AMONT podem ver tudo
  if (hasRole(UserRole.ADMIN) || hasRole(UserRole.AMONT)) return true;

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
  
  // DOT pode submeter auditorias em curso (incluindo criadas pelo AMONT)
  if (hasRole(UserRole.DOT)) {
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
  
  // AMONT and ADMIN can also manage submission in broader workflows
  if (hasRole(UserRole.AMONT) || hasRole(UserRole.ADMIN)) return true;
  
  return false;
};

export const canManageActions = (): boolean => {
  // DOT e Aderente podem ver ações
  // AMONT e ADMIN também podem
  return hasRole(UserRole.DOT) || hasRole(UserRole.ADERENTE) || hasRole(UserRole.AMONT) || hasRole(UserRole.ADMIN);
};

export const canCreateActions = (): boolean => {
  // Apenas DOT pode criar ações (após auditoria)
  return hasRole(UserRole.DOT) || hasRole(UserRole.ADMIN);
};

export const canUpdateActionStatus = (actionResponsible: string): boolean => {
  const user = getCurrentUser();
  if (!user) return false;
  
  // ADMIN pode sempre atualizar
  if (hasRole(UserRole.ADMIN)) return true;
  
  // DOT pode sempre atualizar ações que criou
  if (hasRole(UserRole.DOT)) return true;
  
  // Aderente pode atualizar apenas se for responsável
  if (hasRole(UserRole.ADERENTE)) {
    return actionResponsible === 'Aderente' || actionResponsible === 'Ambos';
  }
  
  return false;
};

export const canCloseAudit = (): boolean => {
  // Apenas AMONT e ADMIN podem fechar auditorias
  return hasRole(UserRole.AMONT) || hasRole(UserRole.ADMIN);
};

export const canViewReports = (): boolean => {
  // Apenas AMONT e ADMIN podem ver relatórios
  return hasRole(UserRole.DOT) || hasRole(UserRole.AMONT) || hasRole(UserRole.ADMIN);
};

export const canImportAuditsCSV = (): boolean => {
  // Apenas AMONT e ADMIN podem importar auditorias via CSV
  return hasRole(UserRole.AMONT) || hasRole(UserRole.ADMIN);
};

export const canManageUsers = (): boolean => {
  // Apenas ADMIN pode criar/editar/apagar utilizadores
  return hasRole(UserRole.ADMIN);
};

export const canAssignDOTsToStores = (): boolean => {
  // ADMIN e AMONT podem atribuir DOTs a lojas
  return hasRole(UserRole.ADMIN) || hasRole(UserRole.AMONT);
};

export const canAccessAmontDashboard = (): boolean => {
  return hasRole(UserRole.AMONT);
};

export const canAccessAderenteDashboard = (): boolean => {
  return hasRole(UserRole.ADERENTE);
};

export const canAccessDOTDashboard = (): boolean => {
  return hasRole(UserRole.DOT) || hasRole(UserRole.ADMIN);
};

export const canAddInternalComments = (): boolean => {
  // Apenas DOT pode adicionar comentários internos
  return hasRole(UserRole.DOT) || hasRole(UserRole.ADMIN);
};

export const canAccessAdminDashboard = (): boolean => {
  return hasRole(UserRole.ADMIN);
};

// Helper functions para verificação de roles
export const isAdmin = (): boolean => hasRole(UserRole.ADMIN);
export const isAmont = (): boolean => hasRole(UserRole.AMONT);
export const isDOT = (): boolean => hasRole(UserRole.DOT);
export const isAderente = (): boolean => hasRole(UserRole.ADERENTE);

export const canViewAllVisits = (): boolean => {
  // Apenas AMONT pode ver todas as visitas
  return hasRole(UserRole.AMONT);
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
  
  // AMONT pode editar enquanto não submetida
  if (hasRole(UserRole.AMONT)) return isEditable;
  
  // DOT pode editar enquanto não submetida
  if (hasRole(UserRole.DOT)) return isEditable;

  // Aderente pode editar suas próprias visitas enquanto não estão submetidas
  if (hasRole(UserRole.ADERENTE) && createdBy && createdBy === currentUser.userId) {
    return isEditable;
  }
  
  return false;
};

export const getDefaultDashboard = (): string => {
  if (hasRole(UserRole.ADMIN)) return '/admin/dashboard';
  if (hasRole(UserRole.AMONT)) return '/amont/dashboard';
  if (hasRole(UserRole.ADERENTE)) return '/aderente/dashboard';
  if (hasRole(UserRole.DOT)) return '/dashboard';
  return '/';
};
