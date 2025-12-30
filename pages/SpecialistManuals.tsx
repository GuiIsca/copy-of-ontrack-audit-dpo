
import React, { useState, useEffect } from 'react';
import { ChevronRight, Download, Loader } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { Header } from '../components/layout/Header';

interface Manual {
  id: number;
  area: string;
  filename: string;
  original_filename: string;
  file_size: number;
  master_user_manual: boolean;
  uploaded_by: number;
  created_at: string;
}

interface AreaSection {
  area: string;
  masterManual: Manual | null;
  otherManuals: Manual[];
}

export const SpecialistManuals: React.FC = () => {
  const [areas, setAreas] = useState<AreaSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedArea, setExpandedArea] = useState<string | null>(null);
  const { show } = useToast();

  const specialistAreas = [
    'Frutas e Legumes',
    'Padaria Pastelaria LS',
    'Charcutaria e Queijos',
    'Talho',
    'Peixaria',
    'Pronto a Comer'
  ];

  useEffect(() => {
    loadManuals();
  }, []);

  const loadManuals = async () => {
    try {
      setLoading(true);
      const areaSections: AreaSection[] = [];

      for (const area of specialistAreas) {
        const manuals = await api.getSpecialistManualsByArea(area);
        const masterManual = manuals.find((m: Manual) => m.master_user_manual);
        const otherManuals = manuals.filter((m: Manual) => !m.master_user_manual);

        areaSections.push({
          area,
          masterManual: masterManual || null,
          otherManuals
        });
      }

      setAreas(areaSections);
    } catch (error) {
      console.error('Error loading manuals:', error);
      show('Erro ao carregar manuais', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDownload = (filename: string, originalFilename: string) => {
    const link = document.createElement('a');
    link.href = `/specialist-manuals/${filename}`;
    link.download = originalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin text-mousquetaires" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manuais de Especialista</h1>
          <p className="text-gray-600">Aceda aos manuais técnicos organizados por área de especialização</p>
        </div>

        <div className="space-y-3">
          {areas.map((section) => (
            <div key={section.area} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              {/* Area Header */}
              <button
                onClick={() => setExpandedArea(expandedArea === section.area ? null : section.area)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 text-left">
                  <h2 className="text-lg font-semibold text-gray-900">{section.area}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {(section.masterManual ? 1 : 0) + section.otherManuals.length} manual(is) disponível(is)
                  </p>
                </div>
                <ChevronRight
                  size={20}
                  className={`text-gray-400 transition-transform ${
                    expandedArea === section.area ? 'rotate-90' : ''
                  }`}
                />
              </button>

              {/* Expanded Content */}
              {expandedArea === section.area && (
                <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                  {section.masterManual && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-block bg-mousquetaires text-white text-xs font-bold px-2 py-1 rounded">
                          Master User
                        </span>
                      </div>
                      <div className="bg-white rounded border border-gray-200 p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                        <div>
                          <p className="font-medium text-gray-900">{section.masterManual.original_filename}</p>
                          <p className="text-sm text-gray-500 mt-1">{formatFileSize(section.masterManual.file_size)}</p>
                        </div>
                        <button
                          onClick={() =>
                            handleDownload(
                              section.masterManual!.filename,
                              section.masterManual!.original_filename
                            )
                          }
                          className="bg-mousquetaires text-white p-2 rounded hover:bg-mousquetaires-dark transition-colors"
                          title="Descarregar"
                        >
                          <Download size={18} />
                        </button>
                      </div>
                    </div>
                  )}

                  {section.otherManuals.length > 0 && (
                    <div>
                      {section.masterManual && (
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 mt-4">Outros manuais</h4>
                      )}
                      <div className="space-y-2">
                        {section.otherManuals.map((manual) => (
                          <div
                            key={manual.id}
                            className="bg-white rounded border border-gray-200 p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                          >
                            <div>
                              <p className="font-medium text-gray-900">{manual.original_filename}</p>
                              <p className="text-sm text-gray-500 mt-1">{formatFileSize(manual.file_size)}</p>
                            </div>
                            <button
                              onClick={() =>
                                handleDownload(manual.filename, manual.original_filename)
                              }
                              className="bg-mousquetaires text-white p-2 rounded hover:bg-mousquetaires-dark transition-colors"
                              title="Descarregar"
                            >
                              <Download size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!section.masterManual && section.otherManuals.length === 0 && (
                    <p className="text-gray-500 text-center py-4">Nenhum manual disponível nesta área</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
