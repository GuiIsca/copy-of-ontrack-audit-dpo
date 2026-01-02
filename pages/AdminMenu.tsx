import React from 'react';
import { getCurrentUser } from '../utils/auth';
import { UserRole } from '../types';
import { User } from 'lucide-react';
import { MenuGrid, MenuGridItem } from '../components/ui/MenuGrid';
import { Calendar, LayoutDashboard, BookOpen, Users, BarChart3, Plus, History, RefreshCw, Store, Upload, Settings } from 'lucide-react';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';

export const AdminMenu: React.FC = () => {
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
      title: 'Gestão do Sistema',
      icon: <span role="img" aria-label="Sistema" style={{fontSize: 48}}>⚙️</span>, 
      onClick: () => {
        localStorage.setItem('layoutMode', '1');
        window.location.href = '/admin/dashboard';
      }
    },
    
    // Plano de Visitas
    {
      title: 'Visitas',
      icon: <span role="img" aria-label="Visitas" style={{fontSize: 48}}>📋</span>, 
      onClick: () => window.location.href = '/admin/visitas'
    },
    {
      title: 'Nova visita',
      icon: <span role="img" aria-label="Nova" style={{fontSize: 48}}>➕</span>, 
      onClick: () => window.location.href = '/admin/new-visit-admin'
    },  
    {
      title: 'Nova visita Dot Operacional',
      icon: <span role="img" aria-label="Utilizadores" style={{fontSize: 48}}>👥</span>, 
      onClick: () => window.location.href = '/admin/new-visit-dot'
    },
    {
      title: 'Histórico',
      icon: <span role="img" aria-label="Histórico" style={{fontSize: 48}}>📋</span>, 
      onClick: () => window.location.href = '/admin/history'
    },
    {
      title: 'Plano de Ação',
      icon: <span role="img" aria-label="Plano" style={{fontSize: 48}}>🔄</span>, 
      onClick: () => window.location.href = '/admin/actions'
    },
    
    // Ferramentas
    {
      title: 'Importar CSV',
      icon: <span role="img" aria-label="Upload" style={{fontSize: 48}}>📤</span>, 
      onClick: () => window.location.href = '/admin/import'
    },
    {
      title: 'Contacto',
      icon: <span role="img" aria-label="Mensagem" style={{fontSize: 48}}>💬</span>, 
      onClick: () => window.location.href = '/admin/contact-messages'
    },
    
    // Relatórios
    {
      title: 'Indicadores',
      icon: <span role="img" aria-label="Indicadores" style={{fontSize: 48}}>📊</span>, 
      onClick: () => window.location.href = '/admin/reports'
    },
    {
      title: 'Analítica',
      icon: <span role="img" aria-label="Analítica" style={{fontSize: 48}}>📈</span>, 
      onClick: () => window.location.href = '/admin/analytics'
    },
    
    // Recursos
    {
      title: 'Planta Layout',
      icon: <span role="img" aria-label="Planta" style={{fontSize: 48}}>📐</span>, 
      onClick: () => window.location.href = '/admin/planta-layout'
    },
    {
      title: 'Dados da Loja',
      icon: <span role="img" aria-label="Loja" style={{fontSize: 48}}>🏬</span>,
      onClick: () => window.location.href = '/admin/dados-da-loja'
    },
    {
      title: 'Manual de Especialista',
      icon: <span role="img" aria-label="Manual" style={{fontSize: 48}}>📚</span>, 
      onClick: () => window.location.href = '/admin/specialist-manuals'
    },
    {
      title: 'Folhetos',
      icon: <span role="img" aria-label="Folhetos" style={{fontSize: 48}}>🏷️</span>, 
      onClick: () => window.location.href = '/admin/folhetos'
    },  
    {
      title: 'Estudo de mercado',
      icon: <span role="img" aria-label="Globo" style={{fontSize: 48}}>🌐</span>, 
      onClick: () => window.location.href = '/admin/estudo-mercado'
    },
    {
      title: 'Book Negócio',
      icon: <span role="img" aria-label="Negócio" style={{fontSize: 48}}>📊</span>, 
      onClick: () => window.location.href = '/admin/book-negocio'
    },
    {
      title: 'Análises Importantes',
      icon: <span role="img" aria-label="Análises" style={{fontSize: 48}}>📈</span>, 
      onClick: () => window.location.href = '/admin/analises-importantes'
    },
    {
      title: 'Inventário',
      icon: <span role="img" aria-label="Inventário" style={{fontSize: 48}}>📦</span>, 
      onClick: () => window.location.href = '/admin/inventario'
    },
    {
      title: 'Dados da Concorrência',
      icon: <span role="img" aria-label="Concorrência" style={{fontSize: 48}}>🔍</span>, 
      onClick: () => window.location.href = '/admin/dados-concorrencia'
    },
            
    {
      title: 'Mudar para Layout Base',
      icon: <span role="img" aria-label="Layout" style={{fontSize: 48}}>📱</span>, 
      onClick: () => {
        localStorage.setItem('layoutMode', '1');
        window.location.href = '/admin/dashboard';
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
          <h2 style={{ fontWeight: 700, fontSize: 28, textAlign: 'center', margin: 0 }}>Menu Administrador</h2>
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

export default AdminMenu;
