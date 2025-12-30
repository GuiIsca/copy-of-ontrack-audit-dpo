import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { FileCheck, GraduationCap, Users, FileText, ArrowLeft } from 'lucide-react';
import { VisitType, UserRole } from '../types';
import { getCurrentUser } from '../utils/auth';
import { getDefaultDashboard, canAccessDOTDashboard } from '../utils/permissions';
import { db } from '../services/dbAdapter';

export const SelectVisitType: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedDate = location.state?.selectedDate;
  
  // Determine audit route based on user role
  const isDOTOperacional = canAccessDOTDashboard();
  const auditRoute = isDOTOperacional ? '/dot-operacional/new-audit' : '/new-audit';

  const visitTypes = [
    {
      type: VisitType.AUDITORIA,
      icon: FileCheck,
      title: 'Auditoria',
      description: 'Auditoria completa com checklist de qualidade e segurança',
      color: 'bg-red-50 border-red-200 hover:bg-red-100',
      iconColor: 'text-red-600',
      route: auditRoute
    },
    {
      type: VisitType.OUTROS,
      icon: FileText,
      title: 'Outros',
      description: 'Visita genérica ou outro tipo de intervenção',
      color: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
      iconColor: 'text-gray-600',
      route: '/new-visit?type=Outros'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center gap-4">
          <button 
            onClick={() => navigate(getDefaultDashboard())} 
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nova Visita</h1>
            <p className="text-gray-600 mt-1">Selecione o tipo de visita que deseja criar</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visitTypes.map((vt) => {
            const Icon = vt.icon;
            return (
              <button
                key={vt.type}
                onClick={() => navigate(vt.route, { state: { selectedDate } })}
                className={`${vt.color} border-2 rounded-xl p-6 text-left transition-all duration-200 transform hover:scale-105 hover:shadow-lg`}
              >
                <div className="flex items-start gap-4">
                  <div className={`${vt.iconColor} bg-white p-3 rounded-lg shadow-sm`}>
                    <Icon size={32} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-xl font-bold ${vt.iconColor} mb-2`}>
                      {vt.title}
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {vt.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
};
