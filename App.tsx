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
import { AmontDashboard } from './pages/AmontDashboard';
import { AmontAuditView } from './pages/AmontAuditView';
import { AmontImportCSV } from './pages/AmontImportCSV';
import { AmontImportTasksCSV } from './pages/AmontImportTasksCSV';
import { AmontNewVisitAmont } from './pages/AmontNewVisitAmont';
import { AmontNewVisitDOT } from './pages/AmontNewVisitDOT';
import { AmontSelectNewVisit } from './pages/AmontSelectNewVisit';
import { DotAuditPage } from './pages/DotAuditPage';
import { AderenteVisitPage } from './pages/AderenteVisitPage';
import { VisitDetail } from './pages/VisitDetail';
import { Reports } from './pages/Reports';
import { getDefaultDashboard, canAccessDOTDashboard, canAccessAderenteDashboard, canAccessAmontDashboard, canViewReports, canAccessAdminDashboard } from './utils/permissions';
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
            <ProtectedRoute requireRole={() => canAccessDOTDashboard() || canAccessAmontDashboard()}>
                <NewAudit />
            </ProtectedRoute>
        } />
        <Route path="/new-audit" element={
            <ProtectedRoute requireRole={() => canAccessDOTDashboard() || canAccessAmontDashboard()}>
                <NewAudit />
            </ProtectedRoute>
        } />
        <Route path="/dot/select-visit-type" element={
            <ProtectedRoute requireRole={() => canAccessDOTDashboard() || canAccessAmontDashboard()}>
                <SelectVisitType />
            </ProtectedRoute>
        } />
        <Route path="/amont/select-visit-type" element={
            <ProtectedRoute requireRole={() => canAccessDOTDashboard() || canAccessAmontDashboard()}>
                <SelectVisitType />
            </ProtectedRoute>
        } />
        <Route path="/select-visit-type" element={
            <ProtectedRoute requireRole={() => canAccessDOTDashboard() || canAccessAmontDashboard()}>
                <SelectVisitType />
            </ProtectedRoute>
        } />
        <Route path="/dot/new-visit" element={
            <ProtectedRoute requireRole={() => canAccessDOTDashboard() || canAccessAmontDashboard()}>
                <NewVisit />
            </ProtectedRoute>
        } />
        <Route path="/amont/new-visit" element={
            <ProtectedRoute requireRole={() => canAccessDOTDashboard() || canAccessAmontDashboard()}>
                <NewVisit />
            </ProtectedRoute>
        } />
        <Route path="/new-visit" element={
            <ProtectedRoute requireRole={() => canAccessDOTDashboard() || canAccessAmontDashboard()}>
                <NewVisit />
            </ProtectedRoute>
        } />
        <Route path="/dot/audit/:id" element={
            <ProtectedRoute requireRole={canAccessDOTDashboard}>
                <DotAuditPage />
            </ProtectedRoute>
        } />
        <Route path="/visit/:id" element={
            <ProtectedRoute requireRole={canAccessDOTDashboard}>
                <VisitDetail />
            </ProtectedRoute>
        } />
         <Route path="/actions" element={
            <ProtectedRoute requireRole={canAccessDOTDashboard}>
                <ActionsList />
            </ProtectedRoute>
        } />
         <Route path="/history" element={
            <ProtectedRoute requireRole={canAccessDOTDashboard}>
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
        <Route path="/amont/dashboard" element={
            <ProtectedRoute requireRole={canAccessAmontDashboard}>
                <AmontDashboard />
            </ProtectedRoute>
        } />
        <Route path="/amont/import-visitas" element={
            <ProtectedRoute requireRole={canAccessAmontDashboard}>
                <AmontImportTasksCSV />
            </ProtectedRoute>
        } />
        <Route path="/amont/audit/:id" element={
            <ProtectedRoute requireRole={canAccessAmontDashboard}>
                <AmontAuditView />
            </ProtectedRoute>
        } />
        <Route path="/amont/execute/:id" element={
            <ProtectedRoute requireRole={canAccessAmontDashboard}>
                <AuditExecution />
            </ProtectedRoute>
        } />
        <Route path="/amont/visit/:id" element={
            <ProtectedRoute requireRole={canAccessAmontDashboard}>
                <VisitDetail />
            </ProtectedRoute>
        } />
        <Route path="/amont/reports" element={
            <ProtectedRoute requireRole={canViewReports}>
                <Reports />
            </ProtectedRoute>
        } />
        <Route path="/amont/new-visit-amont" element={
            <ProtectedRoute requireRole={canAccessAmontDashboard}>
                <AmontNewVisitAmont />
            </ProtectedRoute>
        } />
        <Route path="/amont/new-visit-dot" element={
            <ProtectedRoute requireRole={canAccessAmontDashboard}>
                <AmontNewVisitDOT />
            </ProtectedRoute>
        } />
        <Route path="/amont/select-new-visit" element={
            <ProtectedRoute requireRole={canAccessAmontDashboard}>
                <AmontSelectNewVisit />
            </ProtectedRoute>
        } />
        <Route path="/admin/dashboard" element={
            <ProtectedRoute requireRole={canAccessAdminDashboard}>
                <AdminDashboard />
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