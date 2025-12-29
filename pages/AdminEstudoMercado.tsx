import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Loader, X } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { api } from '../services/api';
import { useToast } from '../components/ui/Toast';

interface EstudoMercado {
  id: number;
  filename: string;
  original_filename: string;
  file_size: number;
  uploaded_by: number;
  created_at: string;
}

export const AdminEstudoMercado: React.FC = () => {
  const [documentos, setDocumentos] = useState<EstudoMercado[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const { show } = useToast();

  useEffect(() => {
    loadDocumentos();
  }, []);

  const loadDocumentos = async () => {
    try {
      setLoading(true);
      const data = await api.getAllEstudoMercado();
      setDocumentos(data);
    } catch (error) {
      console.error('Error loading estudo mercado:', error);
      show('Erro ao carregar estudos de mercado', 'error');
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

    if (!selectedFile) {
      show('Selecione um ficheiro', 'error');
      return;
    }

    try {
      setUploading(true);
      await api.uploadEstudoMercado(selectedFile);
      show('Estudo de mercado enviado com sucesso', 'success');
      setSelectedFile(null);
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      await loadDocumentos();
    } catch (error) {
      console.error('Error uploading estudo mercado:', error);
      show('Erro ao enviar estudo de mercado', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem a certeza que deseja eliminar este estudo de mercado?')) {
      return;
    }

    try {
      setDeleting(id);
      await api.deleteEstudoMercado(id);
      show('Estudo de mercado eliminado com sucesso', 'success');
      await loadDocumentos();
    } catch (error) {
      console.error('Error deleting estudo mercado:', error);
      show('Erro ao eliminar estudo de mercado', 'error');
    } finally {
      setDeleting(null);
    }
  };

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
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Estudo de Mercado</h1>
            <p className="text-gray-600">Faça upload e gerencie os documentos de estudo de mercado</p>
          </div>

        {/* Upload Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Enviar Novo Documento</h2>
          <form onSubmit={handleUpload} className="space-y-4">
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
                <p className="text-sm text-gray-600 mt-2">{selectedFile.name} ({formatFileSize(selectedFile.size)})</p>
              )}
            </div>

            <button
              type="submit"
              disabled={uploading || !selectedFile}
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
                  Enviar Documento
                </>
              )}
            </button>
          </form>
        </div>

        {/* Documentos List */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Documentos Carregados</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader className="animate-spin text-mousquetaires" size={32} />
            </div>
          ) : documentos.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              Nenhum documento carregado ainda
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Ficheiro</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tamanho</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Data</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {documentos.map((doc) => (
                    <tr key={doc.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{doc.original_filename}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatFileSize(doc.file_size)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(doc.created_at)}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(doc.id)}
                          disabled={deleting === doc.id}
                          className="p-2 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Eliminar"
                        >
                          {deleting === doc.id ? (
                            <Loader size={18} className="animate-spin" />
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
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
    </>
  );
};
