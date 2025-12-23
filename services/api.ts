// Use relative URLs in production (works with tunnels/proxies)
// In development, use localhost explicitly
// Force same-origin absolute API using current origin to prevent any resolution issues
const API_URL = `${window.location.origin}/api`;
// Derive server root (without /api) for legacy endpoints
const SERVER_URL = API_URL.replace(/\/api$/, '');

// Convert snake_case keys to camelCase
const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      result[camelKey] = toCamelCase(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
};

class ApiClient {
  async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(email: string, password?: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyResetToken(token: string) {
    return this.request('/auth/verify-reset-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async resetPassword(token: string, password: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  // Users
  async getUsers() {
    return this.request('/users');
  }

  async getUserById(id: number) {
    return this.request(`/users/${id}`);
  }

  async createUser(data: any) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: number, data: any) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: number) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Stores
  async getStores() {
    return this.request('/stores');
  }

  async createStore(data: any) {
    return this.request('/stores', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateStore(id: number, data: any) {
    return this.request(`/stores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteStore(id: number) {
    return this.request(`/stores/${id}`, {
      method: 'DELETE',
    });
  }

  // Audits
  async getAudits(userId?: number) {
    const query = userId ? `?userId=${userId}` : '';
    const data = await this.request(`/audits${query}`);
    return data.map((d: any) => toCamelCase(d));
  }

  async getAuditById(id: number) {
    const data = await this.request(`/audits/${id}`);
    return toCamelCase(data);
  }

  async createAudit(data: any) {
    const result = await this.request('/audits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return toCamelCase(result);
  }

  async updateAudit(id: number, data: any) {
    const result = await this.request(`/audits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return toCamelCase(result);
  }

  // Visits
  async getVisits(params?: { userId?: number; storeId?: number; type?: string }) {
    const query = new URLSearchParams();
    if (params?.userId) query.append('userId', params.userId.toString());
    if (params?.storeId) query.append('storeId', params.storeId.toString());
    if (params?.type) query.append('type', params.type);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request(`/visits${queryString}`);
  }

  async getVisitById(id: number) {
    return this.request(`/visits/${id}`);
  }

  async createVisit(data: any) {
    return this.request('/visits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateVisit(id: number, data: any) {
    return this.request(`/visits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteVisit(id: number) {
    return this.request(`/visits/${id}`, {
      method: 'DELETE',
    });
  }

  // Scores
  async getScores(auditId: number) {
    return this.request(`/scores?auditId=${auditId}`);
  }

  async saveScore(data: any) {
    return this.request('/scores', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Actions
  async getActions(auditId?: number) {
    const query = auditId ? `?auditId=${auditId}` : '';
    return this.request(`/actions${query}`);
  }

  async createAction(data: any) {
    return this.request('/actions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAction(id: number, data: any) {
    return this.request(`/actions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAction(id: number) {
    return this.request(`/actions/${id}`, {
      method: 'DELETE',
    });
  }

  // Comments
  async getComments(auditId: number) {
    return this.request(`/comments?auditId=${auditId}`);
  }

  async createComment(data: any) {
    return this.request('/comments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Checklists
  async getChecklists() {
    return this.request('/checklists');
  }

  async getChecklistById(id: number) {
    return this.request(`/checklists/${id}`);
  }

  // Section Evaluations
  async getSectionEvaluations(auditId: number) {
    return this.request(`/section-evaluations?auditId=${auditId}`);
  }

  async saveSectionEvaluation(data: any) {
    return this.request('/section-evaluations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // DOT Team Leader legacy: import visitas from CSV string
  async importVisitasFromCsv(csv: string) {
    const response = await fetch(`${SERVER_URL}/dot-team-leader/import-visitas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  }

  async importVisitasFromFile(file: File) {
    const form = new FormData();
    form.append('file', file);
    const response = await fetch(`${SERVER_URL}/dot-team-leader/import-visitas`, {
      method: 'POST',
      body: form,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  }

  // Specialist Manuals
  async getSpecialistAreas() {
    return this.request('/specialist-manuals/areas');
  }

  async getSpecialistManualsByArea(area: string) {
    return this.request(`/specialist-manuals/area/${encodeURIComponent(area)}`);
  }

  async getAllSpecialistManuals() {
    return this.request('/specialist-manuals');
  }

  async uploadSpecialistManual(file: File, area: string, masterUserManual: boolean) {
    const auth = localStorage.getItem('ontrack_auth');
    const user = auth ? JSON.parse(auth) : null;
    const userId = user?.userId || user?.id;

    const form = new FormData();
    form.append('file', file);
    form.append('area', area);
    form.append('masterUserManual', String(masterUserManual));

    const response = await fetch(`${API_URL}/specialist-manuals/upload`, {
      method: 'POST',
      body: form,
      headers: {
        'x-user-id': String(userId || ''),
      },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  }

  async deleteSpecialistManual(id: number) {
    return this.request(`/specialist-manuals/${id}`, {
      method: 'DELETE',
    });
  }

  async updateSpecialistManual(id: number, masterUserManual: boolean) {
    return this.request(`/specialist-manuals/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ masterUserManual }),
    });
  }

  // Analytics
  async getAnalytics(params?: { startDate?: string; endDate?: string; periodType?: string; storeId?: number }) {
    const search = new URLSearchParams();
    if (params?.startDate) search.append('startDate', params.startDate);
    if (params?.endDate) search.append('endDate', params.endDate);
    if (params?.periodType) search.append('periodType', params.periodType);
    if (params?.storeId !== undefined) search.append('storeId', String(params.storeId));
    const qs = search.toString() ? `?${search.toString()}` : '';
    return this.request(`/analytics${qs}`);
  }

  async saveAnalyticsSnapshot(payload: any) {
    return this.request('/analytics', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async saveAnalyticsBatch(payload: any) {
    return this.request('/analytics/batch', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const api = new ApiClient();
