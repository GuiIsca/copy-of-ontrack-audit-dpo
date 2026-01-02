import React, { useState } from 'react';
import { Menu, X, LogOut, User, Settings, Users, Upload, LayoutDashboard, Plus, BookOpen, BarChart3, Store } from 'lucide-react';
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
                  {/* Dashboard */}
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase">Dashboard</div>
                  <button 
                    onClick={() => { window.location.href = '/admin/dashboard'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Sistema" style={{fontSize: 18}}>⚙️</span>
                    Gestão do Sistema
                  </button>
                  
                  {/* Plano de Visitas */}
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase mt-2">Plano de Visitas</div>
                  <button 
                    onClick={() => { window.location.href = '/admin/visitas'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Visitas" style={{fontSize: 18}}>📋</span>
                    Visitas
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/admin/new-visit-admin'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Nova" style={{fontSize: 18}}>➕</span>
                    Nova Visita
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/admin/new-visit-dot'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Utilizadores" style={{fontSize: 18}}>👥</span>
                    Visita DOT Operacional
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/admin/history'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Histórico" style={{fontSize: 18}}>📋</span>
                    Histórico
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/admin/actions'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Plano" style={{fontSize: 18}}>🔄</span>
                    Plano de Ação
                  </button>
                  
                  {/* Ferramentas */}
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase mt-2">Ferramentas</div>
                  <button 
                    onClick={() => { window.location.href = '/admin/import-visitas'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Upload" style={{fontSize: 18}}>📤</span>
                    Importar CSV
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/admin/contact-messages'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Contacto" style={{fontSize: 18}}>💬</span>
                    Contacto
                  </button>
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase mt-2">Relatórios</div>
                  <button 
                    onClick={() => { window.location.href = '/admin/reports'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Planta" style={{fontSize: 18}}>📊</span>
                    Indicadores
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/admin/analytics'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Planta" style={{fontSize: 18}}>📈</span>
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
                    onClick={() => { window.location.href = '/admin/dados-da-loja'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Loja" style={{fontSize: 18}}>🏬</span>
                    Dados da Loja
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/admin/specialist-manuals'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Manuais" style={{fontSize: 18}}>📚</span>
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
                  <button 
                    onClick={() => { window.location.href = '/admin/book-negocio'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Negócio" style={{fontSize: 18}}>📊</span>
                    Book Negócio
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/admin/analises-importantes'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Análises" style={{fontSize: 18}}>�</span>
                    Análises Importantes
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/admin/inventario'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Inventário" style={{fontSize: 18}}>📦</span>
                    Inventário
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/admin/dados-concorrencia'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Concorrência" style={{fontSize: 18}}>🔍</span>
                    Dados da Concorrência
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
                    <span role="img" aria-label="Dashboard" style={{fontSize: 18}}>🏠</span>
                    Dashboard
                  </button>
                  
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase mt-2">Plano de Visitas</div>
                  <button 
                    onClick={() => { window.location.href = '/dot-team-leader/new-visit-leader'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Nova" style={{fontSize: 18}}>👥</span>
                    Nova visita
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/dot-team-leader/new-visit-dot'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="DOT" style={{fontSize: 18}}>👥</span>
                    Visita DOT Operacional
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/dot-team-leader/history'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Histórico" style={{fontSize: 18}}>📋</span>
                    Histórico
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/dot-team-leader/actions'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Plano" style={{fontSize: 18}}>🔄</span>
                    Plano de Ação
                  </button>
                  
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase mt-2">Ferramentas</div>
                  <button 
                    onClick={() => { window.location.href = '/dot-team-leader/import-visitas'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Importar CSV" style={{fontSize: 18}}>📤</span>
                    Importar CSV
                  </button>
                  
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase mt-2">Relatórios</div>
                  <button 
                    onClick={() => { window.location.href = '/dot-team-leader/reports'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Indicadores" style={{fontSize: 18}}>📊</span>
                    Indicadores
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/dot-team-leader/analytics'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Analítica" style={{fontSize: 18}}>📈</span>
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
                    onClick={() => { window.location.href = '/dot-team-leader/dados-da-loja'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Loja" style={{fontSize: 18}}>🏬</span>
                    Dados da Loja
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/dot-team-leader/specialist-manuals'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Manuais" style={{fontSize: 18}}>📚</span>
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
                  <button 
                    onClick={() => { window.location.href = '/dot-team-leader/book-negocio'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Negócio" style={{fontSize: 18}}>📊</span>
                    Book Negócio
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/dot-team-leader/analises-importantes'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Análises" style={{fontSize: 18}}>�</span>
                    Análises Importantes
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/dot-team-leader/inventario'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Inventário" style={{fontSize: 18}}>📦</span>
                    Inventário
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/dot-team-leader/dados-concorrencia'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Concorrência" style={{fontSize: 18}}>🔍</span>
                    Dados da Concorrência
                  </button>
                  
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase mt-2">Contacto</div>
                  <button 
                    onClick={() => { window.location.href = '/dot-team-leader/contact-admin'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Contacto" style={{fontSize: 18}}>💬</span>
                    Contacto Admin
                  </button>
                </>
              )}
              {userIsAderente && (
                <>
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase">Supervisão</div>
                  <button 
                    onClick={() => { window.location.href = '/aderente/dashboard'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Dashboard" style={{fontSize: 18}}>🏠</span>
                    Dashboard
                  </button>
                  
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase mt-2">Plano de Visitas</div>
                  <button 
                    onClick={() => { window.location.href = '/aderente/new-visit'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Nova" style={{fontSize: 18}}>👥</span>
                    Nova Visita
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/aderente/visitas'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Visitas" style={{fontSize: 18}}>🏬</span>
                    Visitas
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/aderente/history'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Histórico" style={{fontSize: 18}}>📋</span>
                    Histórico
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/aderente/actions'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Plano" style={{fontSize: 18}}>🔄</span>
                    Plano de Ação
                  </button>
                  
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase mt-2">Relatórios</div>
                  <button 
                    onClick={() => { window.location.href = '/aderente/analytics'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Analítica" style={{fontSize: 18}}>📈</span>
                    Analítica
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/aderente/reports'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Indicadores" style={{fontSize: 18}}>📊</span>
                    Indicadores
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
                    <span role="img" aria-label="Manuais" style={{fontSize: 18}}>📚</span>
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
                  <button 
                    onClick={() => { window.location.href = '/aderente/book-negocio'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Negócio" style={{fontSize: 18}}>📊</span>
                    Book Negócio
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/aderente/dados-concorrencia'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Concorrência" style={{fontSize: 18}}>🔍</span>
                    Dados da Concorrência
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/aderente/inventario'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Inventário" style={{fontSize: 18}}>📦</span>
                    Inventário
                  </button>
                  
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase mt-2">Contacto</div>
                  <button 
                    onClick={() => { window.location.href = '/aderente/contact-admin'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Contacto" style={{fontSize: 18}}>💬</span>
                    Contacto Admin
                  </button>
                </>
              )}
              {userIsAmont && (
                <>
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase">Supervisão</div>
                  <button 
                    onClick={() => { window.location.href = '/amont/dashboard'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Dashboard" style={{fontSize: 18}}>🏠</span>
                    Dashboard
                  </button>
                  
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase mt-2">Plano de Visitas</div>
                  <button 
                    onClick={() => { window.location.href = '/amont/new-audit'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Nova" style={{fontSize: 18}}>📋</span>
                    Nova Visita (Auditoria)
                  </button>
                  
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase mt-2">Relatórios</div>
                  <button 
                    onClick={() => { window.location.href = '/amont/analytics'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Analítica" style={{fontSize: 18}}>📈</span>
                    Analítica
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
                    onClick={() => { window.location.href = '/amont/dados-da-loja'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Loja" style={{fontSize: 18}}>🏬</span>
                    Dados da Loja
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/amont/folhetos'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Etiqueta" style={{fontSize: 18}}>🏷️</span>
                    Folhetos
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/amont/book-negocio'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Negócio" style={{fontSize: 18}}>📊</span>
                    Book Negócio
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/amont/inventario'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Inventário" style={{fontSize: 18}}>📦</span>
                    Inventário
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/amont/dados-concorrencia'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Concorrência" style={{fontSize: 18}}>🔍</span>
                    Dados da Concorrência
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/amont/specialist-manuals'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Manuais" style={{fontSize: 18}}>📚</span>
                    Manuais de Especialista
                  </button>
                  
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase mt-2">Contacto</div>
                  <button 
                    onClick={() => { window.location.href = '/amont/contact-admin'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Contacto" style={{fontSize: 18}}>💬</span>
                    Contacto Admin
                  </button>
                </>
              )}
              {!userIsAdmin && !userIsDotTeamLeader && !userIsAderente && !userIsAmont && (
                <>
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase">Supervisão</div>
                  <button 
                    onClick={() => { window.location.href = '/dot-operacional/dashboard'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Dashboard" style={{fontSize: 18}}>🏠</span>
                    Dashboard
                  </button>
                  
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase mt-2">Plano de Visitas</div>
                  <button 
                    onClick={() => { window.location.href = '/dot-operacional/select-visit-type'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Nova" style={{fontSize: 18}}>📋</span>
                    Nova Visita
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/dot-operacional/history'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Histórico" style={{fontSize: 18}}>📋</span>
                    Histórico
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/dot-operacional/actions'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Plano" style={{fontSize: 18}}>🔄</span>
                    Plano de Ação
                  </button>
                  
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase mt-2">Ferramentas</div>
                  <button 
                    onClick={() => { window.location.href = '/dot-operacional/import-visitas'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Importar CSV" style={{fontSize: 18}}>📤</span>
                    Importar CSV
                  </button>
                  
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase mt-2">Relatórios</div>
                  <button 
                    onClick={() => { window.location.href = '/dot-operacional/reports'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Indicadores" style={{fontSize: 18}}>📊</span>
                    Indicadores
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/dot-operacional/analytics'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Analítica" style={{fontSize: 18}}>📈</span>
                    Analítica
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
                    onClick={() => { window.location.href = '/dot-operacional/dados-da-loja'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Loja" style={{fontSize: 18}}>🏬</span>
                    Dados da Loja
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/dot-operacional/specialist-manuals'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Manuais" style={{fontSize: 18}}>📚</span>
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
                  <button 
                    onClick={() => { window.location.href = '/dot-operacional/book-negocio'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Negócio" style={{fontSize: 18}}>📊</span>
                    Book Negócio
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/dot-operacional/analises-importantes'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Análises" style={{fontSize: 18}}>�</span>
                    Análises Importantes
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/dot-operacional/inventario'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Inventário" style={{fontSize: 18}}>📦</span>
                    Inventário
                  </button>
                  <button 
                    onClick={() => { window.location.href = '/dot-operacional/dados-concorrencia'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Concorrência" style={{fontSize: 18}}>🔍</span>
                    Dados da Concorrência
                  </button>
                  
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase mt-2">Contacto</div>
                  <button 
                    onClick={() => { window.location.href = '/dot-operacional/contact-admin'; setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <span role="img" aria-label="Contacto" style={{fontSize: 18}}>💬</span>
                    Contacto Admin
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  const currentLayout = localStorage.getItem('layoutMode');
                  if (currentLayout === '2') {
                    localStorage.setItem('layoutMode', '1');
                  } else {
                    localStorage.setItem('layoutMode', '2');
                  }
                  window.location.reload();
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