import React, { useEffect, useMemo, useState } from 'react';
import { Header } from '../components/layout/Header';
import { api } from '../services/api';
import { Loader, Trash2, Upload } from 'lucide-react';
import { useToast } from '../components/ui/Toast';

interface Store { id: number; numero?: string; nome?: string; formato?: string }
interface StoreLayout {
  id: number;
  store_id: number;
  layout_type: 'PLANTA_LOJA' | 'LAYOUT_FORMATO';
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type?: string;
  created_at: string;
}

export const AdminPlantaLayout: React.FC = () => {
  const { show } = useToast();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [layouts, setLayouts] = useState<StoreLayout[]>([]);
  const [filePlanta, setFilePlanta] = useState<File | null>(null);
  const [fileLayout, setFileLayout] = useState<File | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await api.getStores();
        setStores(s);
        if (s?.length) setSelectedStoreId(s[0].id);
      } catch (e) {
        show('Erro ao carregar lojas', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedStoreId) return;
    loadLayouts(selectedStoreId);
  }, [selectedStoreId]);

  const loadLayouts = async (storeId: number) => {
    try {
      const data = await api.getStoreLayouts(storeId);
      setLayouts(data);
    } catch (e) {
      show('Erro ao carregar ficheiros da loja', 'error');
    }
  };

  const handleUpload = async (type: 'PLANTA_LOJA' | 'LAYOUT_FORMATO') => {
    const file = type === 'PLANTA_LOJA' ? filePlanta : fileLayout;
    if (!selectedStoreId || !file) {
      show('Selecione a loja e o ficheiro', 'error');
      return;
    }

    // Validate extensions
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (type === 'PLANTA_LOJA') {
      if (ext !== 'pdf') { show('Planta da Loja deve ser PDF', 'error'); return; }
    } else {
      if (!(ext === 'pdf' || ext === 'dwg')) { show('Layout do Formato deve ser PDF ou DWG', 'error'); return; }
    }

    try {
      setSaving(true);
      await api.uploadStoreLayout(file, selectedStoreId, type);
      show('Ficheiro enviado com sucesso', 'success');
      if (type === 'PLANTA_LOJA') setFilePlanta(null); else setFileLayout(null);
      await loadLayouts(selectedStoreId);
    } catch (e) {
      show('Erro ao enviar ficheiro', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Eliminar este ficheiro?')) return;
    try {
      setDeleting(id);
      await api.deleteStoreLayout(id);
      if (selectedStoreId) await loadLayouts(selectedStoreId);
      show('Eliminado', 'success');
    } catch (e) {
      show('Erro ao eliminar', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const latestByType = useMemo(() => {
    const latest: { [k: string]: StoreLayout | undefined } = {};
    for (const item of layouts.sort((a,b)=> new Date(b.created_at).getTime()-new Date(a.created_at).getTime())) {
      if (!latest[item.layout_type]) latest[item.layout_type] = item;
    }
    return latest;
  }, [layouts]);

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return '0 Bytes';
    const k = 1024; const sizes = ['Bytes','KB','MB','GB'];
    const i = Math.floor(Math.log(bytes)/Math.log(k));
    return `${Math.round((bytes/Math.pow(k,i))*100)/100} ${sizes[i]}`;
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Planta Layout por Loja</h1>
            <p className="text-gray-600">Faça upload da Planta da Loja (PDF) e do Layout do Formato (PDF/DWG) por loja</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-12"><Loader className="animate-spin text-mousquetaires"/></div>
          ) : (
            <div className="space-y-8">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Loja</label>
                <select
                  value={selectedStoreId ?? ''}
                  onChange={(e)=> setSelectedStoreId(Number(e.target.value))}
                  className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mousquetaires"
                >
                  {stores.map(s=> (
                    <option key={s.id} value={s.id}>{s.numero ? `${s.numero} - `: ''}{s.nome || `Loja ${s.id}`}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Planta da Loja */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Planta da Loja (PDF)</h2>
                  <p className="text-sm text-amber-600 mb-3">⚠️ Não usar ficheiros com espaços e acentos</p>
                  <input type="file" accept=".pdf" onChange={(e)=> setFilePlanta(e.target.files?.[0]||null)} />
                  <button
                    onClick={()=>handleUpload('PLANTA_LOJA')}
                    disabled={!filePlanta || saving || !selectedStoreId}
                    className="mt-3 inline-flex items-center gap-2 bg-mousquetaires text-white px-4 py-2 rounded-md disabled:opacity-50"
                  >
                    {saving ? <Loader size={18} className="animate-spin"/> : <Upload size={18}/>} Enviar
                  </button>

                  {latestByType['PLANTA_LOJA'] && (
                    <div className="mt-4 text-sm text-gray-700">
                      <div className="font-medium">Último ficheiro:</div>
                      <div className="flex items-center justify-between mt-1">
                        <a className="text-mousquetaires underline" href={latestByType['PLANTA_LOJA']!.file_path} target="_blank" rel="noreferrer">{latestByType['PLANTA_LOJA']!.original_filename}</a>
                        <span className="text-gray-500 ml-2">{formatFileSize(latestByType['PLANTA_LOJA']!.file_size)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Layout do Formato */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Layout do Formato (PDF ou DWG)</h2>
                  <p className="text-sm text-amber-600 mb-3">⚠️ Não usar ficheiros com espaços e acentos</p>
                  <input type="file" accept=".pdf,.dwg" onChange={(e)=> setFileLayout(e.target.files?.[0]||null)} />
                  <button
                    onClick={()=>handleUpload('LAYOUT_FORMATO')}
                    disabled={!fileLayout || saving || !selectedStoreId}
                    className="mt-3 inline-flex items-center gap-2 bg-mousquetaires text-white px-4 py-2 rounded-md disabled:opacity-50"
                  >
                    {saving ? <Loader size={18} className="animate-spin"/> : <Upload size={18}/>} Enviar
                  </button>

                  {latestByType['LAYOUT_FORMATO'] && (
                    <div className="mt-4 text-sm text-gray-700">
                      <div className="font-medium">Último ficheiro:</div>
                      <div className="flex items-center justify-between mt-1">
                        <a className="text-mousquetaires underline" href={latestByType['LAYOUT_FORMATO']!.file_path} target="_blank" rel="noreferrer">{latestByType['LAYOUT_FORMATO']!.original_filename}</a>
                        <span className="text-gray-500 ml-2">{formatFileSize(latestByType['LAYOUT_FORMATO']!.file_size)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* History list */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Histórico de Ficheiros</h3>
                </div>
                <div className="overflow-x-auto">
                  {layouts.length === 0 ? (
                    <div className="px-6 py-8 text-center text-gray-500">Sem ficheiros</div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tipo</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Ficheiro</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tamanho</th>
                          <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {layouts.map(item => (
                          <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-6 py-3 text-sm">{item.layout_type === 'PLANTA_LOJA' ? 'Planta da Loja' : 'Layout do Formato'}</td>
                            <td className="px-6 py-3 text-sm"><a className="text-mousquetaires underline" href={item.file_path} target="_blank" rel="noreferrer">{item.original_filename}</a></td>
                            <td className="px-6 py-3 text-sm text-gray-500">{formatFileSize(item.file_size)}</td>
                            <td className="px-6 py-3 text-right">
                              <button
                                onClick={()=>handleDelete(item.id)}
                                disabled={deleting===item.id}
                                className="p-2 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                              >{deleting===item.id ? <Loader size={18} className="animate-spin"/> : <Trash2 size={18}/>}</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminPlantaLayout;
