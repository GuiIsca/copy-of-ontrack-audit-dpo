import React from 'react';
import { Header } from '../components/layout/Header';

export const Inventario: React.FC = () => {
  return (
    <div>
      <Header />
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Inventário</h1>
        <p style={{ fontSize: '1.2rem', color: '#666' }}>Brevemente...</p>
      </div>
    </div>
  );
};
