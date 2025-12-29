import React from 'react';
import { MenuGrid, MenuGridItem } from '../components/ui/MenuGrid';
import { Calendar, LayoutDashboard, BookOpen, Users, BarChart3, Plus, History, RefreshCw } from 'lucide-react';

export const DotOperacionalMenu: React.FC = () => {
  const items: MenuGridItem[] = [


    {
      title: 'Minhas Auditorias',
      icon: <Calendar size={48} />, 
      onClick: () => window.location.href = '/dot-operacional/history'
    },
    {
      title: 'Nova Visita',
      icon: <Plus size={48} />,
      onClick: () => window.location.href = '/dot-operacional/select-visit-type'
    },
    {
      title: 'Histórico',
      icon: <History size={48} />,
      onClick: () => window.location.href = '/dot-operacional/history'
    },
    {
      title: 'Calendário',
      icon: <Calendar size={48} />,
      onClick: () => window.location.href = '/dot-operacional/calendar'
    },
    {
      title: 'Dashboard',
      icon: <LayoutDashboard size={48} />, 
      onClick: () => window.location.href = '/dot-operacional/dashboard'
    },
    {
      title: 'Manual de Especialista',
      icon: <BookOpen size={48} />, 
      onClick: () => window.location.href = '/dot-operacional/specialist-manuals'
    },
    {
      title: 'Folhetos',
      icon: <span role="img" aria-label="Etiqueta" style={{fontSize: 48}}>🏷️</span>, 
      onClick: () => window.location.href = '/dot-operacional/folhetos'
    },
    {
      title: 'Estudo de Mercado',
      icon: <span role="img" aria-label="Globo" style={{fontSize: 48}}>🌐</span>, 
      onClick: () => window.location.href = '/dot-operacional/estudo-mercado'
    },
    {
      title: 'Indicadores',
      icon: <BarChart3 size={48} />, 
      onClick: () => window.location.href = '/dot-operacional/reports'
    },
        {
          title: 'Mudar para Layout Base',
          icon: <LayoutDashboard size={48} />, 
          onClick: () => {
            localStorage.setItem('layoutMode', '1');
            window.location.href = '/dot-operacional/dashboard';
          }
        },
  ];
  return (
    <div>
      <h2 style={{textAlign: 'center', fontWeight: 700, fontSize: 28, margin: '2rem 0 1rem'}}>Menu DOT Operacional</h2>
      <MenuGrid items={items} />
    </div>
  );
};

export default DotOperacionalMenu;
