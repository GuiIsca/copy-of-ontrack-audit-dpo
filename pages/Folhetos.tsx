import React, { useState, useEffect } from 'react';
import { Download, Loader } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../components/ui/Toast';

interface Folheto {
  id: number;
  filename: string;
  original_filename: string;
  file_size: number;
  uploaded_by: number;
  created_at: string;
}

export const Folhetos: React.FC = () => {
  const [folhetos, setFolhetos] = useState<Folheto[]>([]);
  const [loading, setLoading] = useState(true);
  const { show } = useToast();

  useEffect(() => {
    loadFolhetos();
  }, []);

  const loadFolhetos = async () => {
    try {
      setLoading(true);
      const data = await api.getAllFolhetos();
      setFolhetos(data);
    } catch (error) {
      console.error('Error loading folhetos:', error);
      show('Erro ao carregar folhetos', 'error');
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
    link.href = `/folhetos/${filename}`;
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Folhetos</h1>
          <p className="text-gray-600">Aceda aos folhetos informativos disponíveis</p>
        </div>

        {folhetos.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-500">Nenhum folheto disponível no momento</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="space-y-2 p-4">
              {folhetos.map((folheto) => (
                <div
                  key={folheto.id}
                  className="border border-gray-200 rounded p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <p className="font-medium text-gray-900">{folheto.original_filename}</p>
                    <p className="text-sm text-gray-500 mt-1">{formatFileSize(folheto.file_size)}</p>
                  </div>
                  <button
                    onClick={() => handleDownload(folheto.filename, folheto.original_filename)}
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
      </div>
    </div>
  );
};
