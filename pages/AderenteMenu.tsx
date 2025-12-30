import React from 'react';
import { getCurrentUser } from '../utils/auth';
import { UserRole } from '../types';
import { User } from 'lucide-react';
import { MenuGrid, MenuGridItem } from '../components/ui/MenuGrid';
import { Calendar, LayoutDashboard, BookOpen, Users, BarChart3, Plus, History, RefreshCw } from 'lucide-react';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AderenteMenu: React.FC = () => {
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
      title: 'Nova visita',
      icon: <Calendar size={48} />, 
      onClick: () => window.location.href = '/aderente/new-visit'
    },
    {
      title: 'Visitas recentes',
      icon: <Plus size={48} />,
      onClick: () => window.location.href = '/aderente/visitas-recentes'
    },
    {
      title: 'Histórico de visitas',
      icon: <Plus size={48} />,
      onClick: () => window.location.href = '/aderente/history'
    },
    {
      title: 'Plano de ação',
      icon: <History size={48} />,
      onClick: () => window.location.href = '/aderente/actions'
    },
    {
      title: 'Contacto Admin',
      icon: <Calendar size={48} />,
      onClick: () => window.location.href = '/aderente/contact-admin'
    },
    {
      title: 'Dashboard',
      icon: <LayoutDashboard size={48} />, 
      onClick: () => window.location.href = '/aderente/dashboard'
    },
    {
      title: 'Manual de Especialista',
      icon: <BookOpen size={48} />, 
      onClick: () => window.location.href = '/specialist-manuals'
    },
    {
      title: 'Book Negócio',
      icon: <span role="img" aria-label="Negócio" style={{fontSize: 48}}>📊</span>, 
      onClick: () => window.location.href = '/aderente/book-negocio'
    },
    {
      title: 'Dados da Concorrência',
      icon: <span role="img" aria-label="Concorrência" style={{fontSize: 48}}>🔍</span>, 
      onClick: () => window.location.href = '/aderente/dados-concorrencia'
    },
        {
          title: 'Mudar para Layout Base',
          icon: <LayoutDashboard size={48} />, 
          onClick: () => {
            localStorage.setItem('layoutMode', '1');
            window.location.href = '/aderente/dashboard';
          }
        },
        {
          title: 'Logout',
          icon: <LogOut size={48} color="#dc2626" />, 
          onClick: () => {
            handleLogout();
          }
        },
  ];
  return (
    <div>
      <div style={{ position: 'relative', margin: '2rem 0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ fontWeight: 700, fontSize: 28, textAlign: 'center', margin: 0 }}>Menu Aderente</h2>
        <div style={{ position: 'absolute', right: '15%', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 8, minWidth: 160 }}>
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
            <User size={20} />
          </div>
          <div style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div>
              <div style={{ fontWeight: 600, color: '#222', fontSize: 15 }}>{currentUser?.name || 'Utilizador'}</div>
              <div style={{ fontSize: 13, color: '#888' }}>{displayIcon} {displayRole}</div>
            </div>
          </div>
        </div>
      </div>
      <MenuGrid items={items} />
    </div>
  );
};

export default AderenteMenu;
