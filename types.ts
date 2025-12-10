export enum UserRole {
  USER = 'USER',
  AUDITOR = 'AUDITOR',
  DOT = 'DOT',
  ADERENTE = 'ADERENTE',
  AMONT = 'AMONT',
  SUPERVISOR = 'SUPERVISOR',
  LEADER = 'LEADER',
  ADMIN = 'ADMIN'
}

export enum AuditStatus {
  NEW = 1,
  IN_PROGRESS = 2,
  SUBMITTED = 3, // Submetido ao Aderente
  ENDED = 4, // Validado/Fechado
  CLOSED = 5,
  CANCELLED = 6
}

export enum VisitType {
  AUDITORIA = 'Auditoria',
  FORMACAO = 'Formacao',
  ACOMPANHAMENTO = 'Acompanhamento',
  OUTROS = 'Outros'
}

export interface User {
  id: number;
  email: string;
  fullname: string;
  roles: UserRole[];
  assignedStores?: number[]; // IDs das lojas atribuídas ao DOT
  amontId?: number; // ID do Amont supervisor (apenas para DOT)
}

export interface Store {
  id: number;
  codehex: string;
  brand: string;
  size: string;
  city: string;
  gpslat: number;
  gpslong: number;
  dotUserId?: number; // Frontend camelCase
  dot_user_id?: number; // Backend snake_case
  aderenteId?: number; // Frontend camelCase
  aderente_id?: number; // Backend snake_case
}

export interface Checklist {
  id: number;
  name: string;
  sections: Section[];
  targetRole?: UserRole; // Para qual role este checklist se destina (DOT ou ADERENTE)
}

export enum EvaluationType {
  SCALE_1_5 = 'SCALE_1_5',
  OK_KO = 'OK_KO'
}

export interface Section {
  id: number;
  name: string;
  orderindex: number;
  is_mandatory?: boolean; // Secção obrigatória (Exterior, Frescos, Promocional)
  items: Item[];
}

export interface Item {
  id: number;
  name: string;
  criteria: Criteria[];
}

export interface Criteria {
  id: number;
  name: string;
  weight: number;
  evaluation_type?: EvaluationType; // Tipo de avaliação (padrão SCALE_1_5)
  requires_photo_on_ko?: boolean; // Foto obrigatória quando KO
}

export interface Audit {
  id: number;
  user_id: number;
  dot_user_id?: number; // Same as user_id, for backward compatibility with DB
  store_id: number;
  checklist_id: number;
  dtstart: string; // ISO Date
  dtend?: string; // ISO Date
  aderentes?: string;
  auditorcomments?: string;
  ownercomments?: string;
  status: AuditStatus;
  score?: number;
  final_score?: number; // Final calculated score
  createdBy?: number; // ID do user que criou (Amont ou DOT) - para controlar permissões
}

export interface Visit {
  id: number;
  type: VisitType;
  title: string;
  description?: string; // Changed from text to match backend
  text?: string; // Keep for backward compatibility
  user_id: number; // DOT responsável
  store_id: number;
  dtstart: string; // ISO Date
  dtend?: string; // ISO Date
  status: AuditStatus; // reutilizamos o status enum
  createdBy: number; // AMONT ou DOT
  created_by?: number; // Alias for backend compatibility
}

export interface AuditScore {
  id: number;
  audit_id: number;
  criteria_id: number;
  score: number | null; // OK_KO: 0=KO, 1=OK | SCALE_1_5: 1-5 | null=unscored
  evaluation_type?: EvaluationType; // Tipo de avaliação (padrão SCALE_1_5)
  requires_photo?: boolean; // Foto obrigatória para este score
  comment?: string; // Comentário específico do critério
  photo_url?: string; // URL da foto (backend usa singular)
  photos?: string[]; // URLs/base64 das fotos (frontend pode usar array)
}

export interface SectionEvaluation {
  id: number;
  audit_id: number;
  section_id: number;
  rating: number | null; // 1-5
  action_plan?: string;
  responsible?: string;
  due_date?: string; // ISO Date
}

export enum ActionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum ActionResponsible {
  DOT = 'DOT',
  ADERENTE = 'Aderente',
  BOTH = 'Ambos'
}

export interface ActionPlan {
  id: number;
  audit_id: number;
  criteria_id?: number; // Optional - pode ser ação geral
  title: string;
  description: string;
  responsible: ActionResponsible;
  dueDate: string; // ISO Date
  status: ActionStatus;
  progress: number; // 0-100
  createdBy: number; // user_id
  completedDate?: string; // ISO Date
  notes?: string;
}

export interface AuditComment {
  id: number;
  audit_id: number;
  user_id: number;
  username: string;
  userRole: string; // DOT, Aderente, etc
  comment: string;
  timestamp: string; // ISO Date
  isInternal?: boolean; // true = apenas DOT vê
}

// Helper types for UI
export interface AuditWithStore extends Audit {
  store: Store;
  progress: number;
}