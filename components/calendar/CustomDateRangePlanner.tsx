import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import { Audit, Store } from '../../types';

interface CustomDateRangePlannerProps {
  audits: (Audit & { store: Store; isAudit?: boolean })[];
  onAuditClick: (auditId: number, isAudit?: boolean) => void;
  onDateClick?: (date: Date) => void;
}

export const CustomDateRangePlanner: React.FC<CustomDateRangePlannerProps> = ({ audits, onAuditClick, onDateClick }) => {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // +7 days
  const [tempStartDate, setTempStartDate] = useState(startDate.toISOString().split('T')[0]);
  const [tempEndDate, setTempEndDate] = useState(endDate.toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleApplyDateRange = () => {
    const start = new Date(tempStartDate);
    const end = new Date(tempEndDate);
    
    if (start <= end) {
      setStartDate(start);
      setEndDate(end);
      setShowDatePicker(false);
    }
  };

  const handleCancel = () => {
    setTempStartDate(startDate.toISOString().split('T')[0]);
    setTempEndDate(endDate.toISOString().split('T')[0]);
    setShowDatePicker(false);
  };

  // Get all days in the date range
  const getRangeDays = () => {
    const days = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const rangeDays = getRangeDays();
  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  // Group audits by date
  const auditsByDate = audits.reduce((acc, audit) => {
    const dateKey = new Date(audit.dtstart).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(audit);
    return acc;
  }, {} as Record<string, (Audit & { store: Store })[]>);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getVisitTypeColor = (audit: Audit & { store: Store; isAudit?: boolean }) => {
    const visitType = (audit as any).visitType;
    
    switch(visitType) {
      case 'Auditoria': return 'bg-red-600';
      case 'Formacao': return 'bg-blue-600';
      case 'Acompanhamento': return 'bg-emerald-600';
      case 'Outros': return 'bg-gray-600';
      default: return 'bg-red-600';
    }
  };

  const getDateRangeLabel = () => {
    const startLabel = startDate.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
    const endLabel = endDate.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${startLabel} - ${endLabel}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b-2 border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-5 w-5 text-mousquetaires" />
            <div>
              <h3 className="font-bold text-gray-900">Planeador Personalizado</h3>
              <p className="text-xs text-gray-600">{getDateRangeLabel()}</p>
            </div>
          </div>
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="px-3 py-1 bg-mousquetaires text-white text-sm rounded-lg hover:bg-opacity-90 transition-all"
          >
            Alterar Datas
          </button>
        </div>

        {/* Date Picker Modal */}
        {showDatePicker && (
          <div className="mt-4 pt-4 border-t-2 border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
                <input
                  type="date"
                  value={tempStartDate}
                  onChange={(e) => setTempStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mousquetaires focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Fim</label>
                <input
                  type="date"
                  value={tempEndDate}
                  onChange={(e) => setTempEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mousquetaires focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancel}
                className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleApplyDateRange}
                className="px-3 py-2 bg-mousquetaires text-white text-sm rounded-lg hover:bg-opacity-90 transition-all"
              >
                Aplicar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Days Grid */}
      <div className="p-4">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {rangeDays.map((date) => {
            const dateKey = date.toDateString();
            const dayAudits = auditsByDate[dateKey] || [];

            return (
              <div
                key={dateKey}
                className={`min-h-32 rounded-lg border-2 p-2 cursor-pointer transition-all hover:shadow-md ${
                  isToday(date)
                    ? 'bg-blue-50 border-blue-300'
                    : 'border-gray-200 hover:border-mousquetaires'
                }`}
                onClick={() => onDateClick?.(date)}
              >
                <div className={`text-sm font-bold mb-2 ${isToday(date) ? 'text-blue-700' : 'text-gray-700'}`}>
                  {date.getDate()}
                </div>
                <div className="space-y-1 overflow-y-auto max-h-24">
                  {dayAudits.slice(0, 2).map((audit) => (
                    <button
                      key={audit.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAuditClick(audit.id, (audit as any).isAudit);
                      }}
                      className="w-full text-left p-1 rounded bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:border-mousquetaires transition-all group"
                      title={`${audit.store.nome} - ${audit.store.city} às ${new Date(audit.dtstart).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`}
                    >
                      <div className="flex items-center gap-1">
                        <div
                          className={`w-1 h-5 ${getVisitTypeColor(audit)} rounded-full flex-shrink-0`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-gray-900 truncate group-hover:text-mousquetaires">
                            {audit.store.nome.substring(0, 12)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(audit.dtstart).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                  {dayAudits.length > 2 && (
                    <div className="text-xs text-center text-gray-600 font-medium pt-1">
                      +{dayAudits.length - 2} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 p-3 border-t border-gray-200 bg-gray-50 rounded-lg">
          <div className="text-xs font-semibold text-gray-700 mb-2 text-center">Tipos de Visita:</div>
          <div className="flex items-center justify-center gap-4 text-xs flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-red-600 rounded-full"></div>
              <span className="text-gray-600">Auditoria</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span className="text-gray-600">Formação</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-emerald-600 rounded-full"></div>
              <span className="text-gray-600">Acompanhamento</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
              <span className="text-gray-600">Outros</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
