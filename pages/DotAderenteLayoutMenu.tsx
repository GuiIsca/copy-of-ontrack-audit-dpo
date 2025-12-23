import React from 'react';
import { MenuGrid, MenuGridItem } from '../components/ui/MenuGrid';
import { useNavigate } from 'react-router-dom';
import { BarChart3, BookOpen, Calendar, LayoutDashboard, Upload, Users, Plus } from 'lucide-react';

export const DotAderenteLayoutMenu: React.FC = () => {
  const items: MenuGridItem[] = [
    {
      title: 'Calendário',
      icon: <Calendar size={48} />, 
      onClick: () => window.location.href = '/dot-aderente/calendar'
    },
    {
      title: 'Minhas Lojas',
      icon: <LayoutDashboard size={48} />, 
      onClick: () => window.location.href = '/dot-aderente/lojas'
    },
    {
      title: 'Visitas/Auditorias dos DOTs',
      icon: <Users size={48} />, 
      onClick: () => window.location.href = '/dot-aderente/visitas-dots'
    },
    {
      title: 'Minhas Visitas/Auditorias',
      icon: <Users size={48} />, 
      onClick: () => window.location.href = '/dot-aderente/minhas-visitas'
    },
    {
      title: 'Nova Visita',
      icon: <Plus size={48} />, 
      onClick: () => window.location.href = '/dot-aderente/nova-visita'
    },
    {
      title: 'Importar CSV',
      icon: <Upload size={48} />, 
      onClick: () => window.location.href = '/dot-aderente/importar-csv'
    },
    {
      title: 'Indicadores',
      icon: <BarChart3 size={48} />, 
      onClick: () => window.location.href = '/dot-aderente/indicadores'
    },
    {
      title: 'Analítica',
      icon: <BarChart3 size={48} />, 
      onClick: () => window.location.href = '/dot-aderente/analitica'
    },
    {
      title: 'Manual de Especialista',
      icon: <BookOpen size={48} />, 
      onClick: () => window.location.href = '/dot-aderente/manual-especialista'
    },
  ];
  return (
    <div>
      <h2 style={{textAlign: 'center', fontWeight: 700, fontSize: 28, margin: '2rem 0 1rem'}}>Menu DOT Aderente</h2>
      <MenuGrid items={items} />
    </div>
  );
};

export default DotAderenteLayoutMenu;
