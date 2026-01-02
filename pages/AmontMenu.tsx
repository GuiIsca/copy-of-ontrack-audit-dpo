import React from 'react';
import { getCurrentUser } from '../utils/auth';
import { UserRole } from '../types';
import { User } from 'lucide-react';
import { MenuGrid, MenuGridItem } from '../components/ui/MenuGrid';
import { Calendar, LayoutDashboard, BookOpen, Users, BarChart3, Plus, History, RefreshCw, Store } from 'lucide-react';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';

export const AmontMenu: React.FC = () => {
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
    // Dashboard
    {
      title: 'Dashboard',
      icon: <span role="img" aria-label="Dashboard" style={{fontSize: 48}}>🏠</span>, 
      onClick: () => {
        localStorage.setItem('layoutMode', '1');
        window.location.href = '/amont/dashboard';
      }
    },
    
    // Plano de Visitas
    {
      title: 'Nova Auditoria',
      icon: <span role="img" aria-label="Nova" style={{fontSize: 48}}>➕</span>, 
      onClick: () => window.location.href = '/amont/new-audit'
    },
    
    // Ferramentas
    {
      title: 'Contacto Admin',
      icon: <span role="img" aria-label="Contacto" style={{fontSize: 48}}>💬</span>, 
      onClick: () => window.location.href = '/amont/contact-admin'
    },
    
    // Relatórios
    {
      title: 'Analítica',
      icon: <span role="img" aria-label="Analítica" style={{fontSize: 48}}>📈</span>, 
      onClick: () => window.location.href = '/amont/analytics'
    },
    
    // Recursos
    {
      title: 'Planta Layout',
      icon: <span role="img" aria-label="Planta" style={{fontSize: 48}}>📐</span>, 
      onClick: () => window.location.href = '/amont/planta-layout'
    },
    {
      title: 'Dados da Loja',
      icon: <span role="img" aria-label="Loja" style={{fontSize: 48}}>🏬</span>,
      onClick: () => window.location.href = '/amont/dados-da-loja'
    },
    {
      title: 'Manuais de Especialista',
      icon: <span role="img" aria-label="Manual" style={{fontSize: 48}}>📚</span>, 
      onClick: () => window.location.href = '/amont/specialist-manuals'
    },
    {
      title: 'Folhetos',
      icon: <span role="img" aria-label="Etiqueta" style={{fontSize: 48}}>🏷️</span>, 
      onClick: () => window.location.href = '/amont/folhetos'
    },
    {
      title: 'Book Negócio',
      icon: <span role="img" aria-label="Negócio" style={{fontSize: 48}}>📊</span>, 
      onClick: () => window.location.href = '/amont/book-negocio'
    },
    {
      title: 'Inventário',
      icon: <span role="img" aria-label="Inventário" style={{fontSize: 48}}>📦</span>, 
      onClick: () => window.location.href = '/amont/inventario'
    },
    {
      title: 'Dados da Concorrência',
      icon: <span role="img" aria-label="Concorrência" style={{fontSize: 48}}>🔍</span>, 
      onClick: () => window.location.href = '/amont/dados-concorrencia'
    },
        {
          title: 'Mudar para Layout Base',
          icon: <span role="img" aria-label="Layout" style={{fontSize: 48}}>📱</span>, 
          onClick: () => {
            localStorage.setItem('layoutMode', '1');
            window.location.href = '/amont/dashboard';
          }
        },
        {
          title: 'Logout',
          icon: <LogOut size={48} aria-label="Sair" />, 
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
          <h2 style={{ fontWeight: 700, fontSize: 28, textAlign: 'center', margin: 0 }}>Menu Amont</h2>
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
    </>
  );
};

export default AmontMenu;
