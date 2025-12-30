import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Star, Loader, X } from 'lucide-react';
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

export const AdminSpecialistManuals: React.FC = () => {
  const [areas, setAreas] = useState<string[]>([]);
  const [manuals, setManuals] = useState<Manual[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isMasterManual, setIsMasterManual] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [filterArea, setFilterArea] = useState<string>('');
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
    setAreas(specialistAreas);
    loadManuals();
  }, []);

  const loadManuals = async () => {
    try {
      setLoading(true);
      const data = await api.getAllSpecialistManuals();
      setManuals(data);
    } catch (error) {
      console.error('Error loading manuals:', error);
      show('Erro ao carregar manuais', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        show('Apenas ficheiros PDF são permitidos', 'error');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        show('O ficheiro não pode exceder 50MB', 'error');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile || !selectedArea) {
      show('Selecione um ficheiro e uma área', 'error');
      return;
    }

    try {
      setUploading(true);
      await api.uploadSpecialistManual(selectedFile, selectedArea, isMasterManual);
      show('Manual enviado com sucesso', 'success');
      setSelectedFile(null);
      setSelectedArea('');
      setIsMasterManual(false);
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      await loadManuals();
    } catch (error) {
      console.error('Error uploading manual:', error);
      show('Erro ao enviar manual', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem a certeza que deseja eliminar este manual?')) {
      return;
    }

    try {
      setDeleting(id);
      await api.deleteSpecialistManual(id);
      show('Manual eliminado com sucesso', 'success');
      await loadManuals();
    } catch (error) {
      console.error('Error deleting manual:', error);
      show('Erro ao eliminar manual', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleMasterManual = async (id: number, currentValue: boolean) => {
    try {
      await api.updateSpecialistManual(id, !currentValue);
      show('Manual atualizado com sucesso', 'success');
      await loadManuals();
    } catch (error) {
      console.error('Error updating manual:', error);
      show('Erro ao atualizar manual', 'error');
    }
  };

  const filteredManuals = filterArea
    ? manuals.filter((m) => m.area === filterArea)
    : manuals;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
         <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Manuais de Especialista</h1>
          <p className="text-gray-600">Faça upload e gerencie os manuais técnicos por área</p>
        </div>

        {/* Upload Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Enviar Novo Manual</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Área de Especialização</label>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mousquetaires"
                  required
                >
                  <option value="">Selecione uma área...</option>
                  {areas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ficheiro PDF</label>
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mousquetaires"
                  required
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-2">{selectedFile.name}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="master-manual"
                checked={isMasterManual}
                onChange={(e) => setIsMasterManual(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="master-manual" className="text-sm font-medium text-gray-700">
                Marcar como Manual para Master User
              </label>
            </div>

            <button
              type="submit"
              disabled={uploading || !selectedFile || !selectedArea}
              className="flex items-center gap-2 bg-mousquetaires text-white px-4 py-2 rounded-md hover:bg-mousquetaires-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  A enviar...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Enviar Manual
                </>
              )}
            </button>
          </form>
        </div>

        {/* Manuals List */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Manuais Carregados</h2>
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Filtrar por área:</label>
              <select
                value={filterArea}
                onChange={(e) => setFilterArea(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mousquetaires"
              >
                <option value="">Todas as áreas</option>
                {areas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader className="animate-spin text-mousquetaires" size={32} />
            </div>
          ) : filteredManuals.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              {filterArea ? 'Nenhum manual nesta área' : 'Nenhum manual carregado ainda'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Área</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Ficheiro</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tamanho</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tipo</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Data</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredManuals.map((manual) => (
                    <tr key={manual.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{manual.area}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{manual.original_filename}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatFileSize(manual.file_size)}</td>
                      <td className="px-6 py-4 text-sm">
                        {manual.master_user_manual ? (
                          <span className="inline-block bg-mousquetaires text-white text-xs font-bold px-2 py-1 rounded">
                            Master User
                          </span>
                        ) : (
                          <span className="text-gray-500">Padrão</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(manual.created_at)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleMasterManual(manual.id, manual.master_user_manual)}
                            className={`p-2 rounded transition-colors ${
                              manual.master_user_manual
                                ? 'text-mousquetaires bg-mousquetaires-light'
                                : 'text-gray-400 hover:text-mousquetaires hover:bg-gray-100'
                            }`}
                            title={
                              manual.master_user_manual
                                ? 'Remover de Master User'
                                : 'Marcar como Master User'
                            }
                          >
                            <Star size={18} fill="currentColor" />
                          </button>
                          <button
                            onClick={() => handleDelete(manual.id)}
                            disabled={deleting === manual.id}
                            className="p-2 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                            title="Eliminar"
                          >
                            {deleting === manual.id ? (
                              <Loader size={18} className="animate-spin" />
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
