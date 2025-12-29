import DOTTeamLeaderCalendarPage from './pages/DOTTeamLeaderCalendarPage';
import AderenteVisitasrecentes from './pages/AderenteVisitasrecentes';
import { getCurrentUser, hasRole } from './utils/auth';
import { UserRole } from './types';
console.log('DEBUG getCurrentUser:', getCurrentUser());
import AderenteMenu from './pages/AderenteMenu';
import DOTTeamLeaderMenu from './pages/DOTTeamLeaderMenu';
import DotOperacionalMenu from './pages/DotOperacionalMenu';
import DotOperacionalCalendarPage from './pages/DotOperacionalCalendarPage';
import React from 'react';
import { ToastProvider } from './components/ui/Toast';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { NewAudit } from './pages/NewAudit';
import { NewVisit } from './pages/NewVisit';
import { SelectVisitType } from './pages/SelectVisitType';
import { AuditExecution } from './pages/AuditExecution';
import { AuditList } from './pages/AuditList';
import { ActionsList } from './pages/ActionsList';
import { ActionPlans } from './pages/ActionPlans';
import { AderenteAuditView } from './pages/AderenteAuditView';
import { AderenteDashboard } from './pages/AderenteDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminContactMessages } from './pages/AdminContactMessages';
import { AmontDashboard } from './pages/AmontDashboard';
import { SpecialistManuals } from './pages/SpecialistManuals';
import { AdminSpecialistManuals } from './pages/AdminSpecialistManuals';
import MenuDashboard from './pages/MenuDashboard';
import { Analytics } from './pages/Analytics';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { NewAudit } from './pages/NewAudit';
import { NewVisit } from './pages/NewVisit';
import { SelectVisitType } from './pages/SelectVisitType';
import { AuditExecution } from './pages/AuditExecution';
import { AuditList } from './pages/AuditList';
import { ActionsList } from './pages/ActionsList';
import { ActionPlans } from './pages/ActionPlans';
import { AderenteAuditView } from './pages/AderenteAuditView';
import { AderenteDashboard } from './pages/AderenteDashboard';
import { AderenteNewVisit } from './pages/AderenteNewVisit';
import { AderenteContactAdmin } from './pages/AderenteContactAdmin';
import { DOTTeamLeaderDashboard } from './pages/DOTTeamLeaderDashboard';
import { DOTTeamLeaderAuditView } from './pages/DOTTeamLeaderAuditView';
import { DOTTeamLeaderImportTasksCSV } from './pages/DOTTeamLeaderImportTasksCSV';
import { DOTTeamLeaderNewVisit } from './pages/DOTTeamLeaderNewVisit';
import { DOTTeamLeaderNewVisitDOT } from './pages/DOTTeamLeaderNewVisitDOT';
import { DOTTeamLeaderSelectNewVisit } from './pages/DOTTeamLeaderSelectNewVisit';
import { DotOperacionalAuditPage } from './pages/DotOperacionalAuditPage';
import { DotOperacionalAuditView } from './pages/DotOperacionalAuditView';
import { AderenteVisitPage } from './pages/AderenteVisitPage';
import { VisitDetail } from './pages/VisitDetail';
import { Reports } from './pages/Reports';
import { getDefaultDashboard, canAccessDOTDashboard, canAccessAderenteDashboard, canAccessDotTeamLeaderDashboard, canViewReports, canAccessAdminDashboard, canAccessAmontDashboard, canViewAnalytics } from './utils/permissions';
import { AderenteNewVisit } from './pages/AderenteNewVisit';
import { AderenteContactAdmin } from './pages/AderenteContactAdmin';
import { DOTTeamLeaderDashboard } from './pages/DOTTeamLeaderDashboard';
import { DOTTeamLeaderAuditView } from './pages/DOTTeamLeaderAuditView';
import { DOTTeamLeaderImportTasksCSV } from './pages/DOTTeamLeaderImportTasksCSV';
import { DOTTeamLeaderNewVisit } from './pages/DOTTeamLeaderNewVisit';
import { DOTTeamLeaderNewVisitDOT } from './pages/DOTTeamLeaderNewVisitDOT';
import { DOTTeamLeaderSelectNewVisit } from './pages/DOTTeamLeaderSelectNewVisit';
import { DotOperacionalAuditPage } from './pages/DotOperacionalAuditPage';
import { DotOperacionalAuditView } from './pages/DotOperacionalAuditView';
import { AderenteVisitPage } from './pages/AderenteVisitPage';
import { VisitDetail } from './pages/VisitDetail';
import { Reports } from './pages/Reports';
import { getDefaultDashboard, canAccessDOTDashboard, canAccessAderenteDashboard, canAccessDotTeamLeaderDashboard, canViewReports, canAccessAdminDashboard, canAccessAmontDashboard, canViewAnalytics } from './utils/permissions';

import { AdminContactMessages } from './pages/AdminContactMessages';

import { AmontDashboard } from './pages/AmontDashboard';

import { SpecialistManuals } from './pages/SpecialistManuals';

import { AdminSpecialistManuals } from './pages/AdminSpecialistManuals';

import MenuDashboard from './pages/MenuDashboard';


import { Analytics } from './pages/Analytics';

// Role-based protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; requireRole?: () => boolean }> = ({ children, requireRole }) => {
  console.log('🔐 ProtectedRoute start', { requireRole: !!requireRole });

  try {
    const auth = localStorage.getItem('ontrack_auth');
    console.log('🔐 auth raw:', auth);

    if (!auth) {
      console.log('🔐 No auth -> redirect /');
      return <Navigate to="/" replace />;
    }
    
    if (requireRole) {
      const hasPermission = requireRole();
      console.log('🔐 requireRole result:', hasPermission);
      if (!hasPermission) {
        const target = getDefaultDashboard();
        console.log('🔐 No permission -> redirect', target);
        return <Navigate to={target} replace />;
      }
    }

    console.log('🔐 Access granted, rendering children');
    return <>{children}</>;
  } catch (err) {
    console.error('❌ ProtectedRoute ERROR:', err);
    return <div style={{ color: 'red' }}>Erro na rota protegida</div>;
  }
};


const App: React.FC = () => {
    return (
        <ToastProvider>
                <Router>
                      <Routes>
                                        <Route path="/dot-team-leader/menu" element={
                                            <ProtectedRoute requireRole={() => hasRole(UserRole.DOT_TEAM_LEADER)}>
                                                <DOTTeamLeaderMenu />
                                            </ProtectedRoute>
                                        } />
                                        <Route path="/dot-operacional/menu" element={
                                            <ProtectedRoute requireRole={() => hasRole(UserRole.DOT_OPERACIONAL)}>
                                                <DotOperacionalMenu />
                                            </ProtectedRoute>
                                        } />
                                        <Route path="/aderente/menu" element={
                                            <ProtectedRoute requireRole={() => hasRole(UserRole.ADERENTE)}>
                                                <AderenteMenu />
                                            </ProtectedRoute>
                                        } />
            <Route path="/menu-geral" element={<MenuDashboard />} />
        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={
            <ProtectedRoute requireRole={canAccessDOTDashboard}>
                <Dashboard />
            </ProtectedRoute>
        } />
        {/* Alias route for DOT dashboard to avoid navigation mismatches */}
        <Route path="/dot/dashboard" element={
            <ProtectedRoute requireRole={canAccessDOTDashboard}>
                {localStorage.getItem('layoutMode') === '2' ? <DotOperacionalMenu /> : <Dashboard />}
            </ProtectedRoute>
        } />
        {/* NEW: DOT Operacional specific routes */}
        <Route path="/dot-operacional/dashboard" element={
            <ProtectedRoute requireRole={canAccessDOTDashboard}>
                {localStorage.getItem('layoutMode') === '2' ? <DotOperacionalMenu /> : <Dashboard />}
            </ProtectedRoute>
        } />
        <Route path="/dot-operacional/new-audit" element={
            <ProtectedRoute requireRole={() => canAccessDOTDashboard() || canAccessDotTeamLeaderDashboard()}>
                <NewAudit />
            </ProtectedRoute>
        } />
            {/* Redirecting /dot/new-audit to /dot-operacional/new-audit */}
            <Route path="/dot/new-audit" element={<Navigate to="/dot-operacional/new-audit" replace />} />
        <Route path="/dot-operacional/execute/:id" element={
            <ProtectedRoute requireRole={() => canAccessDOTDashboard() || canAccessDotTeamLeaderDashboard()}>
                <AuditExecution />
            </ProtectedRoute>
        } />
        <Route path="/dot-operacional/audit/:id" element={
            <ProtectedRoute requireRole={() => canAccessDOTDashboard() || canAccessDotTeamLeaderDashboard()}>
                <DotOperacionalAuditPage />
            </ProtectedRoute>
        } />
        <Route path="/dot-operacional/new-visit" element={
            <ProtectedRoute requireRole={() => canAccessDOTDashboard() || canAccessDotTeamLeaderDashboard()}>
                <NewVisit />
            </ProtectedRoute>
        } />
        <Route path="/dot-operacional/select-visit-type" element={
            <ProtectedRoute requireRole={() => canAccessDOTDashboard() || canAccessDotTeamLeaderDashboard()}>
                <SelectVisitType />
            </ProtectedRoute>
        } />
        <Route path="/dot-operacional/calendar" element={
            <ProtectedRoute requireRole={() => hasRole(UserRole.DOT_OPERACIONAL)}>
                <DotOperacionalCalendarPage />
            </ProtectedRoute>
        } />
        <Route path="/dot-operacional/history" element={
            <ProtectedRoute requireRole={() => canAccessDOTDashboard() || canAccessDotTeamLeaderDashboard()}>
                <AuditList />
            </ProtectedRoute>
        } />
        <Route path="/dot-operacional/reports" element={
            <ProtectedRoute requireRole={canViewReports}>
                <Reports />
            </ProtectedRoute>
        } />
        <Route path="/dot-operacional/import-visitas" element={
            <ProtectedRoute requireRole={canAccessDOTDashboard}>
                <DOTTeamLeaderImportTasksCSV />
            </ProtectedRoute>
        } />
        <Route path="/dot/new-audit" element={
            <ProtectedRoute requireRole={() => canAccessDOTDashboard() || canAccessDotTeamLeaderDashboard()}>
                <Navigate to="/dot-operacional/new-audit" replace />
            </ProtectedRoute>
        } />
            {/* Back-compat: route moved to /dot-operacional/new-audit */}
            <Route path="/dot/new-audit" element={<Navigate to="/dot-operacional/new-audit" replace />} />
        <Route path="/dot/select-visit-type" element={
            <ProtectedRoute requireRole={() => canAccessDOTDashboard() || canAccessDotTeamLeaderDashboard()}>
                <SelectVisitType />
            </ProtectedRoute>
        } />
        <Route path="/dot-team-leader/select-visit-type" element={
            <ProtectedRoute requireRole={() => canAccessDOTDashboard() || canAccessDotTeamLeaderDashboard()}>
                <SelectVisitType />
            </ProtectedRoute>
        } />
        <Route path="/select-visit-type" element={
            <ProtectedRoute requireRole={() => canAccessDOTDashboard() || canAccessDotTeamLeaderDashboard()}>
                <SelectVisitType />
            </ProtectedRoute>
        } />
        <Route path="/dot/new-visit" element={
            <ProtectedRoute requireRole={() => canAccessDOTDashboard() || canAccessDotTeamLeaderDashboard()}>
                <NewVisit />
            </ProtectedRoute>
        } />
        <Route path="/dot-team-leader/new-visit" element={
            <ProtectedRoute requireRole={() => canAccessDOTDashboard() || canAccessDotTeamLeaderDashboard()}>
                <NewVisit />
            </ProtectedRoute>
        } />
        <Route path="/new-visit" element={
            <ProtectedRoute requireRole={() => canAccessDOTDashboard() || canAccessDotTeamLeaderDashboard()}>
                <NewVisit />
            </ProtectedRoute>
        } />
        {/* Removed duplicate/conflicting route for /dot/new-audit to avoid ambiguity */}
        <Route path="/dot/audit/:id" element={
            <ProtectedRoute requireRole={() => canAccessDOTDashboard() || canAccessDotTeamLeaderDashboard()}>
                <DotOperacionalAuditView />
            </ProtectedRoute>
        } />
        <Route path="/dot/execute/:id" element={
            <ProtectedRoute requireRole={() => canAccessDOTDashboard() || canAccessDotTeamLeaderDashboard()}>
                <AuditExecution />
            </ProtectedRoute>
        } />
        <Route path="/visit/:id" element={
            <ProtectedRoute requireRole={() => canAccessDOTDashboard() || canAccessDotTeamLeaderDashboard()}>
                <VisitDetail />
            </ProtectedRoute>
        } />
         <Route path="/actions" element={
            <ProtectedRoute requireRole={() => canAccessDOTDashboard() || canAccessDotTeamLeaderDashboard()}>
                <ActionsList />
            </ProtectedRoute>
        } />
         <Route path="/history" element={
            <ProtectedRoute requireRole={() => canAccessDOTDashboard() || canAccessDotTeamLeaderDashboard()}>
                <AuditList />
            </ProtectedRoute>
        } />
        
        <Route path="/aderente/dashboard" element={
            <ProtectedRoute requireRole={canAccessAderenteDashboard}>
                {localStorage.getItem('layoutMode') === '2' ? <AderenteMenu /> : <AderenteDashboard />}

            </ProtectedRoute>
        } />        
        <Route path="/aderente/audit/:id" element={
            <ProtectedRoute requireRole={canAccessAderenteDashboard}>
                <AderenteAuditView />
            </ProtectedRoute>
        } />
        <Route path="/aderente/visitas-recentes" element={
            <ProtectedRoute requireRole={canAccessAderenteDashboard}>
                <AderenteVisitasrecentes />
            </ProtectedRoute>
        } />
        <Route path="/aderente/actions" element={
            <ProtectedRoute requireRole={canAccessAderenteDashboard}>
                <ActionPlans />
            </ProtectedRoute>
        } />
        <Route path="/aderente/history" element={
            <ProtectedRoute requireRole={canAccessAderenteDashboard}>
                <AuditList />
            </ProtectedRoute>
        } />
        <Route path="/aderente/new-visit" element={
            <ProtectedRoute requireRole={canAccessAderenteDashboard}>
                <AderenteNewVisit />
            </ProtectedRoute>
        } />
        <Route path="/aderente/visit/:id" element={
            <ProtectedRoute requireRole={canAccessAderenteDashboard}>
                <AderenteVisitPage />
            </ProtectedRoute>
        } />
        <Route path="/aderente/contact-admin" element={
            <ProtectedRoute requireRole={canAccessAderenteDashboard}>
                <AderenteContactAdmin />
            </ProtectedRoute>
        } />
        <Route path="/dot-team-leader/dashboard" element={
            <ProtectedRoute requireRole={canAccessDotTeamLeaderDashboard}>
                {localStorage.getItem('layoutMode') === '2' ? <DOTTeamLeaderMenu /> : <DOTTeamLeaderDashboard />}
            </ProtectedRoute>
        } />
        
        <Route path="/dot-team-leader/import-visitas" element={
            <ProtectedRoute requireRole={canAccessDotTeamLeaderDashboard}>
                <DOTTeamLeaderImportTasksCSV />
            </ProtectedRoute>
        } />
        <Route path="/dot-team-leader/calendar" element={
            <ProtectedRoute requireRole={canAccessDotTeamLeaderDashboard}>
                <DOTTeamLeaderCalendarPage />
            </ProtectedRoute>
        } />
        <Route path="/dot-team-leader/audit/:id" element={
            <ProtectedRoute requireRole={canAccessDotTeamLeaderDashboard}>
                <DOTTeamLeaderAuditView />
            </ProtectedRoute>
        } />
        <Route path="/dot-team-leader/execute/:id" element={
            <ProtectedRoute requireRole={canAccessDotTeamLeaderDashboard}>
                <AuditExecution />
            </ProtectedRoute>
        } />
        <Route path="/dot-team-leader/visit/:id" element={
            <ProtectedRoute requireRole={canAccessDotTeamLeaderDashboard}>
                <VisitDetail />
            </ProtectedRoute>
        } />
        <Route path="/dot-team-leader/reports" element={
            <ProtectedRoute requireRole={canViewReports}>
                <Reports />
            </ProtectedRoute>
        } />
        <Route path="/analytics" element={
            <ProtectedRoute requireRole={canViewAnalytics}>
                <Analytics />
            </ProtectedRoute>
        } />
        <Route path="/dot-team-leader/new-visit-leader" element={
            <ProtectedRoute requireRole={canAccessDotTeamLeaderDashboard}>
                <DOTTeamLeaderNewVisit />
            </ProtectedRoute>
        } />
        <Route path="/dot-team-leader/new-visit-dot" element={
            <ProtectedRoute requireRole={canAccessDotTeamLeaderDashboard}>
                <DOTTeamLeaderNewVisitDOT />
            </ProtectedRoute>
        } />
        <Route path="/dot-team-leader/select-new-visit" element={
            <ProtectedRoute requireRole={canAccessDotTeamLeaderDashboard}>
                <DOTTeamLeaderSelectNewVisit />
            </ProtectedRoute>
        } />
        <Route path="/admin/dashboard" element={
            <ProtectedRoute requireRole={canAccessAdminDashboard}>
                <AdminDashboard />
            </ProtectedRoute>
        } />
        <Route path="/admin/visitas" element={
            <ProtectedRoute requireRole={canAccessAdminDashboard}>
                <DOTTeamLeaderDashboard adminView />
            </ProtectedRoute>
        } />
        <Route path="/admin/audit/:id" element={
            <ProtectedRoute requireRole={canAccessAdminDashboard}>
                <DOTTeamLeaderAuditView />
            </ProtectedRoute>
        } />
        <Route path="/admin/execute/:id" element={
            <ProtectedRoute requireRole={canAccessAdminDashboard}>
                <AuditExecution />
            </ProtectedRoute>
        } />
        <Route path="/admin/visit/:id" element={
            <ProtectedRoute requireRole={canAccessAdminDashboard}>
                <VisitDetail />
            </ProtectedRoute>
        } />
        <Route path="/admin/new-visit-admin" element={
            <ProtectedRoute requireRole={canAccessAdminDashboard}>
                <DOTTeamLeaderNewVisit />
            </ProtectedRoute>
        } />
        {/* Backward-compat alias -> redirect to new admin path */}
        <Route path="/admin/new-visit-leader" element={<Navigate to="/admin/new-visit-admin" replace />} />
        <Route path="/admin/new-visit-dot" element={
            <ProtectedRoute requireRole={canAccessAdminDashboard}>
                <DOTTeamLeaderNewVisitDOT />
            </ProtectedRoute>
        } />
        <Route path="/admin/import-visitas" element={
            <ProtectedRoute requireRole={canAccessAdminDashboard}>
                <DOTTeamLeaderImportTasksCSV />
            </ProtectedRoute>
        } />
        <Route path="/admin/reports" element={
            <ProtectedRoute requireRole={canAccessAdminDashboard}>
                <Reports />
            </ProtectedRoute>
        } />
        <Route path="/admin/contact-messages" element={
            <ProtectedRoute requireRole={canAccessAdminDashboard}>
                <AdminContactMessages />
            </ProtectedRoute>
        } />
        <Route path="/admin/contact-messages/:messageId" element={
            <ProtectedRoute requireRole={canAccessAdminDashboard}>
                <AdminContactMessages />
            </ProtectedRoute>
        } />
        <Route path="/admin/specialist-manuals" element={
            <ProtectedRoute requireRole={canAccessAdminDashboard}>
                <AdminSpecialistManuals />
            </ProtectedRoute>
        } />
        <Route path="/specialist-manuals" element={
            <ProtectedRoute>
                <SpecialistManuals />
            </ProtectedRoute>
        } />
        {/* AMONT Routes */}
        <Route path="/amont/dashboard" element={
            <ProtectedRoute requireRole={canAccessAmontDashboard}>
                <AmontDashboard />
            </ProtectedRoute>
        } />
        <Route path="/amont/new-audit" element={
            <ProtectedRoute requireRole={canAccessAmontDashboard}>
                <NewAudit />
            </ProtectedRoute>
        } />
        <Route path="/amont/execute/:id" element={
            <ProtectedRoute requireRole={canAccessAmontDashboard}>
                <AuditExecution />
            </ProtectedRoute>
        } />
        <Route path="/amont/audit/:id" element={
            <ProtectedRoute requireRole={canAccessAmontDashboard}>
                <DotOperacionalAuditView />
            </ProtectedRoute>
        } />
                {/* Fallback for unknown routes */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
                </Router>
        </ToastProvider>
  );
};

export default App;