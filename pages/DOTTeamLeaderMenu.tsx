import React from 'react';
import { getCurrentUser } from '../utils/auth';
import { UserRole } from '../types';
import { User } from 'lucide-react';
import { MenuGrid, MenuGridItem } from '../components/ui/MenuGrid';
import { Calendar, LayoutDashboard, Upload, BookOpen, Users, BarChart3, Plus, History, RefreshCw, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Header } from '../components/layout/Header';

export const DOTTeamLeaderMenu: React.FC = () => {
      const navigate = useNavigate();
    const handleLogout = () => {
      localStorage.removeItem('ontrack_auth');
      navigate('/');
    };
  const currentUser = getCurrentUser();
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
  const items: MenuGridItem[] = [
    {
      title: 'Dashboard',
      icon: <span role="img" aria-label="Dashboard" style={{fontSize: 48}}>🏠</span>, 
      onClick: () => {
        localStorage.setItem('layoutMode', '1');
        window.location.href = '/dot-team-leader/dashboard';
      }
    },
    {
      title: 'Planta Layout',
      icon: <span role="img" aria-label="Planta" style={{fontSize: 48}}>📐</span>, 
      onClick: () => window.location.href = '/dot-team-leader/planta-layout'
    },
    {
      title: 'Dados da Loja',
      icon: <span role="img" aria-label="Loja" style={{fontSize: 48}}>🏬</span>,
      onClick: () => window.location.href = '/dot-team-leader/dados-da-loja'
    },
    {
      title: 'Importar CSV',
      icon: <span role="img" aria-label="Upload" style={{fontSize: 48}}>📤</span>, 
      onClick: () => window.location.href = '/dot-team-leader/import-visitas'
    },
    {
      title: 'Selecionar Nova Visita',
      icon: <span role="img" aria-label="Utilizadores" style={{fontSize: 48}}>👥</span>, 
      onClick: () => window.location.href = '/dot-team-leader/select-new-visit'
    },
    {
      title: 'Indicadores',
      icon: <span role="img" aria-label="Indicadores" style={{fontSize: 48}}>📊</span>, 
      onClick: () => window.location.href = '/dot-team-leader/reports'
    },
    {
      title: 'Analítica',
      icon: <span role="img" aria-label="Analítica" style={{fontSize: 48}}>📈</span>, 
      onClick: () => window.location.href = '/analytics'
    },
    {
      title: 'Manual de Especialista',
      icon: <span role="img" aria-label="Manual" style={{fontSize: 48}}>📚</span>, 
      onClick: () => window.location.href = '/dot-team-leader/specialist-manuals'
    },
    {
      title: 'Folhetos',
      icon: <span role="img" aria-label="Etiqueta" style={{fontSize: 48}}>🏷️</span>, 
      onClick: () => window.location.href = '/dot-team-leader/folhetos'
    },
    {
      title: 'Estudo de Mercado',
      icon: <span role="img" aria-label="Globo" style={{fontSize: 48}}>🌐</span>, 
      onClick: () => window.location.href = '/dot-team-leader/estudo-mercado'
    },
    {
      title: 'Book Negócio',
      icon: <span role="img" aria-label="Negócio" style={{fontSize: 48}}>📊</span>, 
      onClick: () => window.location.href = '/dot-team-leader/book-negocio'
    },
    {
      title: 'Análises Importantes',
      icon: <span role="img" aria-label="Análises" style={{fontSize: 48}}>📈</span>, 
      onClick: () => window.location.href = '/dot-team-leader/analises-importantes'
    },
    {
      title: 'Inventário',
      icon: <span role="img" aria-label="Inventário" style={{fontSize: 48}}>📦</span>, 
      onClick: () => window.location.href = '/dot-team-leader/inventario'
    },
    {
      title: 'Dados da Concorrência',
      icon: <span role="img" aria-label="Concorrência" style={{fontSize: 48}}>🔍</span>, 
      onClick: () => window.location.href = '/dot-team-leader/dados-concorrencia'
    },
    {
      title: 'Mudar para Layout Base',
      icon: <span role="img" aria-label="Layout" style={{fontSize: 48}}>📱</span>, 
      onClick: () => {
        localStorage.setItem('layoutMode', '1');
        window.location.href = '/dot-team-leader/dashboard';
      }
    },
                    {
              title: 'Logout',
              icon: <span role="img" aria-label="Sair" style={{fontSize: 48}}>🚺</span>, 
              onClick: () => {
                handleLogout();
              }
            },
  ];
  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div style={{ position: 'relative', margin: '2rem 0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ fontWeight: 700, fontSize: 28, textAlign: 'center', margin: 0 }}>Menu DOT Team Leader</h2>
        <div style={{ position: 'absolute', right: '15%', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 8, minWidth: 160 }}>
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
            <User size={20} />
          </div>
          <div style={{ marginLeft: 8 }}>
            <div style={{ fontWeight: 600, color: '#222', fontSize: 15 }}>{currentUser?.name || 'Utilizador'}</div>
            <div style={{ fontSize: 13, color: '#888' }}>{displayIcon} {displayRole}</div>
          </div>
        </div>
        </div>
        <MenuGrid items={items} />
      </div>
    </>
  );
};

export default DOTTeamLeaderMenu;
