import React, { useState } from 'react';
import { Menu, X, LogOut, User, Settings, Users, Upload, LayoutDashboard, Plus, BookOpen, BarChart3 } from 'lucide-react';
import { APP_NAME, APP_SUBTITLE } from '../../constants';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../../utils/auth';
import { isAderente, isDotTeamLeader, isAdmin } from '../../utils/permissions';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useToast } from '../ui/Toast';
import { UserRole } from '../../types';

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const { show } = useToast();
  const userIsAdmin = isAdmin();
  const userIsDotTeamLeader = isDotTeamLeader();
  const userIsAderente = isAderente();
  const userIsAmont = !!currentUser?.roles?.includes(UserRole.AMONT);
  const userIsDotOperacional = !!currentUser?.roles?.includes(UserRole.DOT_OPERACIONAL);

  const handleLogout = () => {
    localStorage.removeItem('ontrack_auth');
    navigate('/');
  };

  const [confirmState, setConfirmState] = useState<{open:boolean; message:string; onConfirm:()=>void}>({open:false, message:'', onConfirm: ()=>{}});

  // Função resetSeeds removida - não é mais necessária com PostgreSQL

  const handleDashboardClick = () => {
    if (userIsAdmin) {
      navigate('/admin/dashboard');
    } else if (userIsDotTeamLeader) {
      navigate('/dot-team-leader/dashboard');
    } else if (userIsDotOperacional) {
      navigate('/dot-operacional/dashboard');
    } else if (userIsAderente) {
      navigate('/aderente/dashboard');
    } else if (userIsAmont) {
      navigate('/amont/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  // Determinar papel principal para exibição
  const displayRole = currentUser ? (
    currentUser.roles.includes(UserRole.ADMIN) ? 'Administrador' :
    currentUser.roles.includes(UserRole.DOT_TEAM_LEADER) ? 'DOT Team Leader' :
    currentUser.roles.includes(UserRole.DOT_OPERACIONAL) ? 'DOT Operacional' :
    currentUser.roles.includes(UserRole.ADERENTE) ? 'Aderente' :
    currentUser.roles.includes(UserRole.AMONT) ? 'Amont' :
    'Utilizador'
  ) : '';

  const displayIcon = currentUser ? (
    currentUser.roles.includes(UserRole.ADMIN) ? '⚙️' :
    currentUser.roles.includes(UserRole.DOT_TEAM_LEADER) ? '👔' :
    currentUser.roles.includes(UserRole.DOT_OPERACIONAL) ? '👨‍💼' :
    currentUser.roles.includes(UserRole.ADERENTE) ? '🏪' :
    currentUser.roles.includes(UserRole.AMONT) ? '🔍' :
    '👤'
  ) : '👤';

  return (
    <>
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={handleDashboardClick}>
            <div className="flex-shrink-0 flex items-center gap-2">
                <div className="bg-mousquetaires text-white p-1 rounded font-bold text-xl">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900 leading-none">{APP_NAME}</h1>
                    <p className="text-xs text-gray-500 font-medium">{APP_SUBTITLE}</p>
                </div>
            </div>
          </div>
          
          <div className="flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-mousquetaires"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="absolute top-16 right-0 w-64 bg-white shadow-lg border-l border-gray-100 max-h-[calc(100vh-4rem)] z-40 overflow-y-auto">
            <div className="pt-4 pb-3 border-b border-gray-100">
              <div className="flex items-center px-5">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                    <User size={20} />
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium leading-none text-gray-800">
                    {currentUser?.name || 'Utilizador'}
                  </div>
                  <div className="text-sm font-medium leading-none text-gray-400 mt-1">
                    {displayIcon} {displayRole}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              {userIsAdmin && (
                <>
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase">Administração</div>
                  <button 
                    onClick={() => { window.location.href = '/admin/dashboard'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <Settings size={18} />
                    Gestão do Sistema
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/admin/visitas'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <LayoutDashboard size={18} />
                    Visitas
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/admin/contact-messages'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Contacto
                  </button>
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase mt-2">Plano de Visitas</div>
                  <button 
                    onClick={() => { window.location.href = '/admin/new-visit-admin'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <Plus size={18} />
                    Nova Visita
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/admin/new-visit-dot'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <Users size={18} />
                    Visita DOT Operacional
                  </button>
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase mt-2">Ferramentas</div>
                  <button 
                    onClick={() => { window.location.href = '/admin/import-visitas'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <Upload size={18} />
                    Importar CSV
                  </button>
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase mt-2">Relatórios</div>
                  <button 
                    onClick={() => { window.location.href = '/admin/reports'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    Indicadores
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/analytics'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <BarChart3 size={18} />
                    Analítica
                  </button>
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase mt-2">Recursos</div>
                  <button 
                    onClick={() => { window.location.href = '/admin/planta-layout'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Planta" style={{fontSize: 18}}>📐</span>
                    Planta Layout
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/admin/specialist-manuals'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <BookOpen size={18} />
                    Manuais de Especialista
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/admin/folhetos'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Etiqueta" style={{fontSize: 18}}>🏷️</span>
                    Folhetos
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/admin/estudo-mercado'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Globo" style={{fontSize: 18}}>🌐</span>
                    Estudo de Mercado
                  </button>
                </>
              )}
              {userIsDotTeamLeader && (
                <>
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase">Supervisão</div>
                  <button 
                    onClick={() => { window.location.href = '/dot-team-leader/dashboard'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <LayoutDashboard size={18} />
                    Dashboard
                  </button>
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase mt-2">Plano de Visitas</div>
                  <button 
                    onClick={() => { window.location.href = '/dot-team-leader/new-visit-leader'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <Plus size={18} />
                    Nova visita
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/dot-team-leader/new-visit-dot'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <Users size={18} />
                    Visita DOT Operacional
                  </button>
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase mt-2">Ferramentas</div>
                  <button 
                    onClick={() => { window.location.href = '/dot-team-leader/import-visitas'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <Upload size={18} />
                    Importar CSV
                  </button>
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase mt-2">Relatórios</div>
                  <button 
                    onClick={() => { window.location.href = '/dot-team-leader/reports'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    Indicadores
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/analytics'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <BarChart3 size={18} />
                    Analítica
                  </button>
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase mt-2">Recursos</div>
                  <button 
                    onClick={() => { window.location.href = '/dot-team-leader/planta-layout'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Planta" style={{fontSize: 18}}>📐</span>
                    Planta Layout
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/dot-team-leader/specialist-manuals'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <BookOpen size={18} />
                    Manuais de Especialista
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/dot-team-leader/folhetos'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Etiqueta" style={{fontSize: 18}}>🏷️</span>
                    Folhetos
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/dot-team-leader/estudo-mercado'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Globo" style={{fontSize: 18}}>🌐</span>
                    Estudo de Mercado
                  </button>
                </>
              )}
              {userIsAderente && (
                <>
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase">Minhas Visitas</div>
                  <button 
                    onClick={() => { window.location.href = '/aderente/dashboard'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <LayoutDashboard size={18} />
                    Dashboard
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/aderente/new-visit'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <Users size={18} />
                    Nova Visita
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/aderente/history'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 10"/></svg>
                    Histórico
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/aderente/actions'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Plano de Ação
                  </button>
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase mt-2">Contacto</div>
                  <button 
                    onClick={() => { window.location.href = '/aderente/contact-admin'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Contacto Admin
                  </button>
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase mt-2">Recursos</div>
                  <button 
                    onClick={() => { window.location.href = '/aderente/planta-layout'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Planta" style={{fontSize: 18}}>📐</span>
                    Planta Layout
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/aderente/specialist-manuals'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <BookOpen size={18} />
                    Manuais de Especialista
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/aderente/folhetos'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Etiqueta" style={{fontSize: 18}}>🏷️</span>
                    Folhetos
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/aderente/estudo-mercado'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Globo" style={{fontSize: 18}}>🌐</span>
                    Estudo de Mercado
                  </button>
                </>
              )}
              {userIsAmont && (
                <>
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase">Auditorias AMONT</div>
                  <button 
                    onClick={() => { window.location.href = '/amont/dashboard'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <LayoutDashboard size={18} />
                    Dashboard
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/amont/new-audit'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                    Nova Visita (Auditoria)
                  </button>
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase mt-2">Recursos</div>
                  <button 
                    onClick={() => { window.location.href = '/amont/planta-layout'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Planta" style={{fontSize: 18}}>📐</span>
                    Planta Layout
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/amont/folhetos'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Etiqueta" style={{fontSize: 18}}>🏷️</span>
                    Folhetos
                  </button>
                </>
              )}
              {!userIsAdmin && !userIsDotTeamLeader && !userIsAderente && !userIsAmont && (
                <>
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase">Auditorias DOT Operacional</div>
                  <button 
                    onClick={() => { window.location.href = '/dot-operacional/dashboard'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <LayoutDashboard size={18} />
                    Dashboard
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/dot-operacional/select-visit-type'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                    Nova Visita
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/dot-operacional/history'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 10"/></svg>
                    Histórico
                  </button>
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase mt-2">Ferramentas</div>
                  <button 
                    onClick={() => { window.location.href = '/dot-operacional/import-visitas'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <Upload size={18} />
                    Importar CSV
                  </button>
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase mt-2">Relatórios</div>
                  <button 
                    onClick={() => { window.location.href = '/dot-operacional/reports'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                    Indicadores
                  </button>
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase mt-2">Recursos</div>
                  <button 
                    onClick={() => { window.location.href = '/dot-operacional/planta-layout'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Planta" style={{fontSize: 18}}>📐</span>
                    Planta Layout
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/dot-operacional/specialist-manuals'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <BookOpen size={18} />
                    Manuais de Especialista
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/dot-operacional/folhetos'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Etiqueta" style={{fontSize: 18}}>🏷️</span>
                    Folhetos
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/dot-operacional/estudo-mercado'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Globo" style={{fontSize: 18}}>🌐</span>
                    Estudo de Mercado
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  localStorage.setItem('layoutMode', '2');
                  if (userIsDotTeamLeader) {
                    window.location.href = '/dot-team-leader/menu';
                  } else if (userIsAderente) {
                    window.location.href = '/aderente/menu';
                  } else if (userIsDotOperacional) {
                    window.location.href = '/dot-operacional/menu';
                  } else if (userIsAdmin) {
                    window.location.href = '/admin/dashboard';
                  } else if (userIsAmont) {
                    window.location.href = '/amont/dashboard';
                  } else {
                    window.location.href = '/dashboard';
                  }
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 mt-4 border-t border-gray-100 pt-4"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                Mudar Layout
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-800 hover:bg-red-50 border-t border-gray-100 pt-4"
              >
                <LogOut size={18} />
                Sair
              </button>
            </div>
        </div>
      )}
    </header>
    <ConfirmDialog
      open={confirmState.open}
      message={confirmState.message}
      title="Confirmar reposição"
      confirmText="Repor"
      onCancel={() => setConfirmState(s=>({...s, open:false}))}
      onConfirm={() => { confirmState.onConfirm(); setConfirmState(s=>({...s, open:false})); }}
    />
    </>
  );
};