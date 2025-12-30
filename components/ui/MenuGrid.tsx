import React from 'react';

export interface MenuGridItem {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
}

interface MenuGridProps {
  items: MenuGridItem[];
}

export const MenuGrid: React.FC<MenuGridProps> = ({ items }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '1.5rem',
    padding: '2rem',
    justifyItems: 'center',
    alignItems: 'stretch',
  }}>
    {items.map((item, idx) => (
      <button
        key={idx}
        onClick={item.onClick}
        style={{
          background: '#fff',
          border: '2px solid #e5e7eb',
          borderRadius: '16px',
          padding: '1.5rem 1rem',
          width: '100%',
          minWidth: 150,
          height: 170,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px #0001',
          cursor: 'pointer',
          transition: 'box-shadow 0.2s',
        }}
        onMouseOver={e => (e.currentTarget.style.boxShadow = '0 4px 16px #0002')}
        onMouseOut={e => (e.currentTarget.style.boxShadow = '0 2px 8px #0001')}
      >
        <div style={{ fontSize: 48, marginBottom: 12, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</div>
        <div style={{ fontWeight: 700, fontSize: 16, textAlign: 'center', lineHeight: 1.3 }}>{item.title}</div>
      </button>
    ))}
  </div>
);
