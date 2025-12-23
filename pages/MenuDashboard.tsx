import React from 'react';
import { MenuGrid, MenuGridItem } from '../components/ui/MenuGrid';
import { useNavigate } from 'react-router-dom';
import { BookOpen, BarChart3, LayoutDashboard, Users, Upload, Settings, Plus, User, LogOut } from 'lucide-react';

const icons = {
  dadosLoja: <span role="img" aria-label="Loja" style={{fontSize: 48}}>🏬</span>,
  indicadores: <BarChart3 size={48} />,
  historico: <span role="img" aria-label="Calendário" style={{fontSize: 48}}>🗓️</span>,
  planoAcao: <span role="img" aria-label="Bússola" style={{fontSize: 48}}>🧭</span>,
  auditoria: <span role="img" aria-label="Clipboard" style={{fontSize: 48}}>📋</span>,
  folhetos: <span role="img" aria-label="Etiqueta" style={{fontSize: 48}}>🏷️</span>,
  bookNegocio: <span role="img" aria-label="Book" style={{fontSize: 48}}>📰</span>,
  manuais: <BookOpen size={48} />,
  analises: <span role="img" aria-label="Gráfico" style={{fontSize: 48}}>📈</span>,
  inventario: <span role="img" aria-label="Caixa" style={{fontSize: 48}}>📦</span>,
  plantaLayout: <span role="img" aria-label="Tijolo" style={{fontSize: 48}}>🧱</span>,
  estudoMercado: <span role="img" aria-label="Globo" style={{fontSize: 48}}>🌐</span>,
  concorrencia: <span role="img" aria-label="Balança" style={{fontSize: 48}}>⚖️</span>,
  analiseArtigo: <span role="img" aria-label="Carrinho" style={{fontSize: 48}}>🛒</span>,
  contactoAmont: <span role="img" aria-label="Envelope" style={{fontSize: 48}}>✉️</span>,
  dashboard: <LayoutDashboard size={48} />,
  users: <Users size={48} />,
  upload: <Upload size={48} />,
  settings: <Settings size={48} />,
  plus: <Plus size={48} />,
  user: <User size={48} />,
  logout: <LogOut size={48} />,
};

export const MenuDashboard: React.FC = () => {
  const navigate = useNavigate();
  const items: MenuGridItem[] = [
    { title: 'Dados da Loja', icon: icons.dadosLoja, onClick: () => navigate('/dados-loja') },
    { title: 'Indicadores Comerciais', icon: icons.indicadores, onClick: () => navigate('/indicadores') },
    { title: 'Histórico de Visitas', icon: icons.historico, onClick: () => navigate('/historico-visitas') },
    { title: 'Plano de Ação', icon: icons.planoAcao, onClick: () => navigate('/plano-acao') },
    { title: 'Auditoria Comercial', icon: icons.auditoria, onClick: () => navigate('/auditoria-comercial') },
    { title: 'Folhetos', icon: icons.folhetos, onClick: () => navigate('/folhetos') },
    { title: 'Book Negócio', icon: icons.bookNegocio, onClick: () => navigate('/book-negocio') },
    { title: 'Manuais de Especialista', icon: icons.manuais, onClick: () => navigate('/manuais-especialista') },
    { title: 'Análises Importantes', icon: icons.analises, onClick: () => navigate('/analises-importantes') },
    { title: 'Inventário', icon: icons.inventario, onClick: () => navigate('/inventario') },
    { title: 'Planta Layout', icon: icons.plantaLayout, onClick: () => navigate('/planta-layout') },
    { title: 'Estudo de Mercado', icon: icons.estudoMercado, onClick: () => navigate('/estudo-mercado') },
    { title: 'Dados da Concorrência', icon: icons.concorrencia, onClick: () => navigate('/dados-concorrencia') },
    { title: 'Análise Artigo', icon: icons.analiseArtigo, onClick: () => navigate('/analise-artigo') },
    { title: 'Contacto Amont', icon: icons.contactoAmont, onClick: () => navigate('/contacto-amont') },
  ];
  return (
    <div>
      <h2 style={{textAlign: 'center', fontWeight: 700, fontSize: 28, margin: '2rem 0 1rem'}}>Menu Geral</h2>
      <MenuGrid items={items} />
    </div>
  );
};

export default MenuDashboard;
