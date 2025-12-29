import React, { useEffect, useState } from 'react';
import { db } from '../services/dbAdapter';
import { Store, User, UserRole } from '../types';
import { Button } from '../components/ui/Button';
import { PlusCircle, Store as StoreIcon, Trash2 } from 'lucide-react';

const AdminLojas: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [storeForm, setStoreForm] = useState({ codehex: '', brand: 'Intermarché', size: 'Super', city: '', gpslat: '', gpslong: '', nome: '', dotUserId: '', aderenteId: '' });
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setStores(await db.getStores());
      setUsers(await db.getUsers());
    };
    loadData();
  }, []);

  const handleCreateStore = async () => {
    try {
      const payload: any = {
        codehex: storeForm.codehex.trim(),
        nome: storeForm.nome,
        size: storeForm.size,
        city: storeForm.city.trim(),
        gpslat: Number(storeForm.gpslat) || 0,
        gpslong: Number(storeForm.gpslong) || 0,
        brand: storeForm.brand,
      };
      if (storeForm.dotUserId) payload.dotUserId = Number(storeForm.dotUserId);
      if (storeForm.aderenteId) payload.aderenteId = Number(storeForm.aderenteId);
      await db.createStore(payload);
      setStoreForm({ codehex: '', brand: 'Intermarché', size: 'Super', city: '', gpslat: '', gpslong: '', nome: '', dotUserId: '', aderenteId: '' });
      setStores(await db.getStores());
      setErrorMsg('');
    } catch (e: any) {
      setErrorMsg(e.message || 'Erro ao criar Loja');
    }
  };

  const handleDeleteStore = async (id: number) => {
    await db.deleteStore(id);
    setStores(await db.getStores());
  };

  // Funções para atribuir DOT/Aderente (mock, ajuste conforme backend real)
  const handleChangeStoreDot = async (storeId: number, dotId: number) => {
    await db.updateStore({ id: storeId, dotUserId: dotId });
    setStores(await db.getStores());
  };
  const handleAddAderenteToStore = async (storeId: number, aderenteId: number) => {
    await db.assignAderenteToStore(storeId, aderenteId);
    setStores(await db.getStores());
  };
  const handleUnassignAderente = async (storeId: number, aderente: User) => {
    await db.unassignAderenteFromStore(storeId, aderente.id);
    setStores(await db.getStores());
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Lojas</h1>
      <div className="bg-white rounded shadow p-4 mb-8">
        <div className="flex items-center mb-4 gap-2">
          <PlusCircle className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-lg">Criar Loja</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="border rounded px-2 py-2 text-sm" placeholder="Código (codehex)" value={storeForm.codehex} onChange={e=>setStoreForm({...storeForm,codehex:e.target.value})} />
          <input className="border rounded px-2 py-2 text-sm" placeholder="Nome" value={storeForm.nome} onChange={e=>setStoreForm({...storeForm,nome:e.target.value})} />
          <input className="border rounded px-2 py-2 text-sm" placeholder="Tamanho" value={storeForm.size} onChange={e=>setStoreForm({...storeForm,size:e.target.value})} />
          <input className="border rounded px-2 py-2 text-sm" placeholder="Cidade" value={storeForm.city} onChange={e=>setStoreForm({...storeForm,city:e.target.value})} />
          <input className="border rounded px-2 py-2 text-sm" placeholder="GPS Lat" value={storeForm.gpslat} onChange={e=>setStoreForm({...storeForm,gpslat:e.target.value})} />
          <input className="border rounded px-2 py-2 text-sm" placeholder="GPS Long" value={storeForm.gpslong} onChange={e=>setStoreForm({...storeForm,gpslong:e.target.value})} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DOT Operacional (opcional)</label>
            <select className="w-full border rounded px-3 py-2 text-sm" value={storeForm.dotUserId} onChange={e=>setStoreForm({...storeForm,dotUserId:e.target.value})}>
              <option value="">—</option>
              {users.filter(u=>u.roles.includes(UserRole.DOT_OPERACIONAL)).map(d => (<option key={d.id} value={d.id}>{d.fullname}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Aderente (opcional)</label>
            <select className="w-full border rounded px-3 py-2 text-sm" value={storeForm.aderenteId} onChange={e=>setStoreForm({...storeForm,aderenteId:e.target.value})}>
              <option value="">—</option>
              {users.filter(u=>u.roles.includes(UserRole.ADERENTE)).map(a => {
                const hasStore = stores.some(s => (s.aderente_id || s.aderenteId) === a.id);
                return (
                  <option key={a.id} value={a.id} disabled={hasStore}>
                    {a.fullname} {hasStore ? '(Já tem loja)' : ''}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
        <div className="mt-3">
          <Button onClick={handleCreateStore}>Criar Loja</Button>
          {errorMsg && <span className="text-red-600 ml-4">{errorMsg}</span>}
        </div>
      </div>
      <div className="bg-white rounded shadow p-4">
        <div className="flex items-center mb-4 gap-2">
          <StoreIcon className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-lg">Lojas existentes</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Código</th>
                <th className="px-3 py-2 text-left">Marca</th>
                <th className="px-3 py-2 text-left">Cidade</th>
                <th className="px-3 py-2 text-left">DOT Operacional</th>
                <th className="px-3 py-2 text-left">Aderente</th>
                <th className="px-3 py-2 text-left">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stores.map(s => {
                const dotId = s.dot_user_id || s.dotUserId;
                const adId = s.aderente_id || s.aderenteId;
                const dot = users.find(d=>d.id===dotId);
                const ad = users.find(a=>a.id===adId);
                return (
                  <tr key={s.id}>
                    <td className="px-3 py-2 whitespace-nowrap">{s.numero || s.codehex}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{s.brand || '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{s.city}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <select className="border rounded px-2 py-1 text-sm" value={dotId || ''} onChange={e=>handleChangeStoreDot(s.id, Number(e.target.value))}>
                        <option value="">—</option>
                        {users.filter(u=>u.roles.includes(UserRole.DOT_OPERACIONAL)).map(d => (<option key={d.id} value={d.id}>{d.fullname}</option>))}
                      </select>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex flex-col gap-1 min-w-[150px]">
                        {/* List existing */}
                        {users.filter(u => u.assignedStores?.includes(s.id) || (u.id === (s.aderente_id || s.aderenteId))).map(u => (
                          <span key={u.id} className="text-xs bg-gray-100 px-2 py-1 rounded flex justify-between items-center border border-gray-200">
                            <span className="truncate max-w-[100px]" title={u.fullname}>{u.fullname}</span>
                            <button onClick={() => handleUnassignAderente(s.id, u)} className="ml-1 text-red-500 hover:text-red-700 font-bold">×</button>
                          </span>
                        ))}
                        {/* Add new */}
                        <select 
                          className="border rounded px-2 py-1 text-xs mt-1 w-full bg-white" 
                          value="" 
                          onChange={e => handleAddAderenteToStore(s.id, Number(e.target.value))}
                        >
                          <option value="">+ Adicionar</option>
                          {users.filter(u => u.roles.includes(UserRole.ADERENTE) && !u.assignedStores?.includes(s.id) && u.id !== (s.aderente_id || s.aderenteId)).map(a => (
                            <option key={a.id} value={a.id}>{a.fullname}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <button onClick={() => handleDeleteStore(s.id)} className="text-red-600 hover:text-red-800" title="Eliminar loja">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminLojas;
