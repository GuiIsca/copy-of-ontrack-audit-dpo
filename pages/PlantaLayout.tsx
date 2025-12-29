import React, { useEffect, useMemo, useState } from 'react';
import { Header } from '../components/layout/Header';
import { api } from '../services/api';
import { Loader } from 'lucide-react';
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

export const PlantaLayout: React.FC = () => {
  const { show } = useToast();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [layouts, setLayouts] = useState<StoreLayout[]>([]);

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
    (async () => {
      try {
        setLoadingFiles(true);
        const data = await api.getStoreLayouts(selectedStoreId, true);
        setLayouts(data);
      } catch (e) {
        show('Erro ao carregar ficheiros da loja', 'error');
      } finally {
        setLoadingFiles(false);
      }
    })();
  }, [selectedStoreId]);

  const planta = useMemo(()=> layouts.find(l=> l.layout_type==='PLANTA_LOJA'), [layouts]);
  const formato = useMemo(()=> layouts.find(l=> l.layout_type==='LAYOUT_FORMATO'), [layouts]);

  const FilePreview: React.FC<{ item?: StoreLayout; label: string }>= ({ item, label }) => {
    if (!item) return <div className="text-gray-500">Sem ficheiro</div>;
    const isPdf = (item.original_filename||'').toLowerCase().endsWith('.pdf');
    return (
      <div>
        <div className="mb-2">
          <a className="text-mousquetaires underline" href={item.file_path} target="_blank" rel="noreferrer">{item.original_filename}</a>
        </div>
        {isPdf ? (
          <div className="border rounded overflow-hidden" style={{height: 520}}>
            <iframe
              title={label}
              src={`/pdf-viewer.html?file=${encodeURIComponent(item.file_path)}`}
              className="w-full h-full"
            />
          </div>
        ) : (
          <p className="text-sm text-gray-600">Pré-visualização indisponível. Faça download para ver o ficheiro.</p>
        )}
      </div>
    );
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Planta Layout</h1>
            <p className="text-gray-600">Selecione a loja e visualize a Planta da Loja e o Layout do Formato</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-12"><Loader className="animate-spin text-mousquetaires"/></div>
          ) : (
            <div className="space-y-6">
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
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Planta da Loja</h2>
                  {loadingFiles ? <Loader className="animate-spin text-mousquetaires"/> : <FilePreview item={planta} label="Planta da Loja"/>}
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Layout do Formato</h2>
                  {loadingFiles ? <Loader className="animate-spin text-mousquetaires"/> : <FilePreview item={formato} label="Layout do Formato"/>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PlantaLayout;
