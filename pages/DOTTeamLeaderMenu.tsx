import React from 'react';
import { MenuGrid, MenuGridItem } from '../components/ui/MenuGrid';
import { useNavigate } from 'react-router-dom';
import { BarChart3, BookOpen, Calendar, LayoutDashboard, Upload, Users, Plus } from 'lucide-react';

export const DOTTeamLeaderMenu: React.FC = () => {
  const items: MenuGridItem[] = [
    {
      title: 'Calendário',
      icon: <Calendar size={48} />, 
      onClick: () => {
        window.location.href = '/dot-team-leader/calendar';
      }
    },
    {
      title: 'Dashboard',
      icon: <LayoutDashboard size={48} />, 
      onClick: () => window.location.href = '/dot-team-leader/dashboard'
    },
    {
      title: 'Importar CSV',
      icon: <Upload size={48} />, 
      onClick: () => window.location.href = '/dot-team-leader/import-visitas'
    },
    {
      title: 'Selecionar Nova Visita',
      icon: <Users size={48} />, 
      onClick: () => window.location.href = '/dot-team-leader/select-new-visit'
    },
    {
      title: 'Indicadores',
      icon: <BarChart3 size={48} />, 
      onClick: () => window.location.href = '/dot-team-leader/reports'
    },
    {
      title: 'Analítica',
      icon: <BarChart3 size={48} />, 
      onClick: () => window.location.href = '/analytics'
    },
    {
      title: 'Manual de Especialista',
      icon: <BookOpen size={48} />, 
      onClick: () => window.location.href = '/specialist-manuals'
    },
    {
      title: 'Folhetos',
      icon: <span role="img" aria-label="Etiqueta" style={{fontSize: 48}}>🏷️</span>, 
      onClick: () => window.location.href = '/folhetos'
    },
    {
      title: 'Estudo de Mercado',
      icon: <span role="img" aria-label="Globo" style={{fontSize: 48}}>🌐</span>, 
      onClick: () => window.location.href = '/estudo-mercado'
    },
    {
      title: 'Mudar para Layout Base',
      icon: <LayoutDashboard size={48} />, 
      onClick: () => {
        localStorage.setItem('layoutMode', '1');
        window.location.href = '/dot-team-leader/dashboard';
      }
    },
  ];
  return (
    <div>
      <h2 style={{textAlign: 'center', fontWeight: 700, fontSize: 28, margin: '2rem 0 1rem'}}>Menu DOT Team Leader</h2>
      <MenuGrid items={items} />
    </div>
  );
};

export default DOTTeamLeaderMenu;
