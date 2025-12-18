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
import { AderenteNewVisit } from './pages/AderenteNewVisit';
import { DOTTeamLeaderDashboard } from './pages/DOTTeamLeaderDashboard';
import { DOTTeamLeaderAuditView } from './pages/DOTTeamLeaderAuditView';
import { DOTTeamLeaderImportCSV } from './pages/DOTTeamLeaderImportCSV';
import { DOTTeamLeaderImportTasksCSV } from './pages/DOTTeamLeaderImportTasksCSV';
import { DOTTeamLeaderNewVisit } from './pages/DOTTeamLeaderNewVisit';
import { DOTTeamLeaderNewVisitDOT } from './pages/DOTTeamLeaderNewVisitDOT';
import { DOTTeamLeaderSelectNewVisit } from './pages/DOTTeamLeaderSelectNewVisit';
import { DotAuditPage } from './pages/DotAuditPage';
import { AderenteVisitPage } from './pages/AderenteVisitPage';
import { VisitDetail } from './pages/VisitDetail';
import { Reports } from './pages/Reports';
import { getDefaultDashboard, canAccessDOTDashboard, canAccessAderenteDashboard, canAccessDotTeamLeaderDashboard, canViewReports, canAccessAdminDashboard } from './utils/permissions';
import { AdminDashboard } from './pages/AdminDashboard';

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
                <Dashboard />
            </ProtectedRoute>
        } />
        <Route path="/dot/new-audit" element={
            <ProtectedRoute requireRole={() => canAccessDOTDashboard() || canAccessDotTeamLeaderDashboard()}>
                <NewAudit />
            </ProtectedRoute>
        } />
        <Route path="/new-audit" element={
            <ProtectedRoute requireRole={() => canAccessDOTDashboard() || canAccessDotTeamLeaderDashboard()}>
                <NewAudit />
            </ProtectedRoute>
        } />
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
        <Route path="/dot/new-audit" element={
            <ProtectedRoute requireRole={() => canAccessDOTDashboard() || canAccessDotTeamLeaderDashboard()}>
                <DotAuditPage />
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
                <AderenteDashboard />
            </ProtectedRoute>
        } />
        <Route path="/aderente/audit/:id" element={
            <ProtectedRoute requireRole={canAccessAderenteDashboard}>
                <AderenteAuditView />
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
        <Route path="/dot-team-leader/dashboard" element={
            <ProtectedRoute requireRole={canAccessDotTeamLeaderDashboard}>
                <DOTTeamLeaderDashboard />
            </ProtectedRoute>
        } />
        <Route path="/dot-team-leader/import-visitas" element={
            <ProtectedRoute requireRole={canAccessDotTeamLeaderDashboard}>
                <DOTTeamLeaderImportTasksCSV />
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
                {/* Fallback for unknown routes */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
                </Router>
        </ToastProvider>
  );
};

export default App;