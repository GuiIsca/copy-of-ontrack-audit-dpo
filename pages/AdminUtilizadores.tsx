import React, { useEffect, useState } from 'react';
import { db } from '../services/dbAdapter';
import { User, Store, UserRole } from '../types';
import { Edit2, Trash2, ChevronDown, ChevronRight, Users as UsersIcon, Store as StoreIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const AdminUtilizadores: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [expandedTeamLeaders, setExpandedTeamLeaders] = useState<Set<number>>(new Set());
  const [expandedDots, setExpandedDots] = useState<Set<number>>(new Set());

  // Form states for quick create
  const [teamLeaderForm, setTeamLeaderForm] = useState({ fullname: '', email: '' });
  const [dotForm, setDotForm] = useState({ fullname: '', email: '', dotTeamLeaderId: '' });
  const [amontForm, setAmontForm] = useState({ fullname: '', email: '' });
  const [aderenteForm, setAderenteForm] = useState({ fullname: '', email: '', dotId: '', storeId: '' });

  // Handlers for creating users (dummy, should be replaced with real logic)
  const handleCreateTeamLeader = async () => {
    if (!teamLeaderForm.fullname || !teamLeaderForm.email) return;
    await db.createUser({ ...teamLeaderForm, roles: [UserRole.DOT_TEAM_LEADER] });
    setTeamLeaderForm({ fullname: '', email: '' });
    const usersData = await db.getUsers();
    setUsers(usersData);
  };
  const handleCreateDOT = async () => {
    if (!dotForm.fullname || !dotForm.email) return;
    await db.createUser({ ...dotForm, roles: [UserRole.DOT_OPERACIONAL], dotTeamLeaderId: Number(dotForm.dotTeamLeaderId) });
    setDotForm({ fullname: '', email: '', dotTeamLeaderId: '' });
    const usersData = await db.getUsers();
    setUsers(usersData);
  };
  const handleCreateAmont = async () => {
    if (!amontForm.fullname || !amontForm.email) return;
    await db.createUser({ ...amontForm, roles: [UserRole.AMONT] });
    setAmontForm({ fullname: '', email: '' });
    const usersData = await db.getUsers();
    setUsers(usersData);
  };
  const handleCreateAderente = async () => {
    if (!aderenteForm.fullname || !aderenteForm.email) return;
    await db.createUser({ ...aderenteForm, roles: [UserRole.ADERENTE], dotId: aderenteForm.dotId ? Number(aderenteForm.dotId) : undefined, storeId: aderenteForm.storeId ? Number(aderenteForm.storeId) : undefined });
    setAderenteForm({ fullname: '', email: '', dotId: '', storeId: '' });
    const usersData = await db.getUsers();
    setUsers(usersData);
  };

  useEffect(() => {
    const loadData = async () => {
      const usersData = await db.getUsers();
      const storesData = await db.getStores();
      setUsers(usersData);
      setStores(storesData);
      setExpandedTeamLeaders(new Set(usersData.filter(u => u.roles.includes(UserRole.DOT_TEAM_LEADER)).map(u => u.id)));
    };
    loadData();
  }, []);

  const toggleTeamLeader = (id: number) => {
    const newSet = new Set(expandedTeamLeaders);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setExpandedTeamLeaders(newSet);
  };

  const toggleDot = (id: number) => {
    const newSet = new Set(expandedDots);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setExpandedDots(newSet);
  };

  // Hierarchy logic (simplified, can be expanded as needed)
  const teamLeaders = users.filter(u => u.roles.includes(UserRole.DOT_TEAM_LEADER));
  const dots = users.filter(u => u.roles.includes(UserRole.DOT_OPERACIONAL));
  const amonts = users.filter(u => u.roles.includes(UserRole.AMONT));
  const aderentes = users.filter(u => u.roles.includes(UserRole.ADERENTE));

  return (
    <div className="max-w-5xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Utilizadores</h1>
      {/* Quick Create Actions */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 mb-8">
        <h3 className="font-semibold text-gray-800 mb-4">Adicionar Novo Utilizador</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Create Team Leader */}
          <div className="border rounded p-3 bg-gray-50">
            <h4 className="text-sm font-bold mb-2">Novo DOT Team Leader</h4>
            <div className="space-y-2">
              <input className="w-full border rounded px-2 py-2 text-sm" placeholder="Nome" value={teamLeaderForm.fullname} onChange={e=>setTeamLeaderForm({...teamLeaderForm,fullname:e.target.value})} />
              <input className="w-full border rounded px-2 py-2 text-sm" placeholder="Email" value={teamLeaderForm.email} onChange={e=>setTeamLeaderForm({...teamLeaderForm,email:e.target.value})} />
              <Button size="sm" fullWidth onClick={handleCreateTeamLeader}>Criar</Button>
            </div>
          </div>
          {/* Create DOT */}
          <div className="border rounded p-3 bg-gray-50">
            <h4 className="text-sm font-bold mb-2">Novo DOT Operacional</h4>
            <div className="space-y-2">
              <input className="w-full border rounded px-2 py-2 text-sm" placeholder="Nome" value={dotForm.fullname} onChange={e=>setDotForm({...dotForm,fullname:e.target.value})} />
              <input className="w-full border rounded px-2 py-2 text-sm" placeholder="Email" value={dotForm.email} onChange={e=>setDotForm({...dotForm,email:e.target.value})} />
              <select className="w-full border rounded px-2 py-2 text-sm" value={dotForm.dotTeamLeaderId} onChange={e=>setDotForm({...dotForm, dotTeamLeaderId: e.target.value})}>
                <option value="">Selecione DOT Team Leader</option>
                {users.filter(u=>u.roles.includes(UserRole.DOT_TEAM_LEADER)).map(a=><option key={a.id} value={a.id}>{a.fullname}</option>)}
              </select>
              <Button size="sm" fullWidth onClick={handleCreateDOT}>Criar</Button>
            </div>
          </div>
          {/* Create AMONT */}
          <div className="border rounded p-3 bg-gray-50">
            <h4 className="text-sm font-bold mb-2">Novo AMONT</h4>
            <div className="space-y-2">
              <input className="w-full border rounded px-2 py-2 text-sm" placeholder="Nome" value={amontForm.fullname} onChange={e=>setAmontForm({...amontForm,fullname:e.target.value})} />
              <input className="w-full border rounded px-2 py-2 text-sm" placeholder="Email" value={amontForm.email} onChange={e=>setAmontForm({...amontForm,email:e.target.value})} />
              <Button size="sm" fullWidth onClick={handleCreateAmont}>Criar</Button>
            </div>
          </div>
          {/* Create Aderente */}
          <div className="border rounded p-3 bg-gray-50">
            <h4 className="text-sm font-bold mb-2">Novo Aderente</h4>
            <div className="space-y-2">
              <input className="w-full border rounded px-2 py-2 text-sm" placeholder="Nome" value={aderenteForm.fullname} onChange={e=>setAderenteForm({...aderenteForm,fullname:e.target.value})} />
              <input className="w-full border rounded px-2 py-2 text-sm" placeholder="Email" value={aderenteForm.email} onChange={e=>setAderenteForm({...aderenteForm,email:e.target.value})} />
              <select className="w-full border rounded px-2 py-2 text-sm" value={aderenteForm.dotId} onChange={e=>setAderenteForm({...aderenteForm,dotId:e.target.value})}>
                <option value="">Selecione DOT Operacional (opcional)</option>
                {users.filter(u=>u.roles.includes(UserRole.DOT_OPERACIONAL)).map(d=><option key={d.id} value={d.id}>{d.fullname}</option>)}
              </select>
              <select className="w-full border rounded px-2 py-2 text-sm" value={aderenteForm.storeId} onChange={e=>setAderenteForm({...aderenteForm,storeId:e.target.value})}>
                <option value="">Selecione Loja (opcional)</option>
                {stores.map(s => {
                  const isOccupied = s.aderente_id || s.aderenteId;
                  return (
                    <option key={s.id} value={s.id} disabled={!!isOccupied}>
                      {s.codehex} - {s.city} {isOccupied ? '(Ocupada)' : ''}
                    </option>
                  );
                })}
              </select>
              <Button size="sm" fullWidth onClick={handleCreateAderente}>Criar</Button>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-800">Estrutura Organizacional</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {teamLeaders.map(teamLeader => (
            <div key={teamLeader.id} className="bg-white">
              {/* DOT Team Leader Row */}
              <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <button onClick={() => toggleTeamLeader(teamLeader.id)} className="text-gray-400 hover:text-gray-600">
                    {expandedTeamLeaders.has(teamLeader.id) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </button>
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900">{teamLeader.fullname}</span>
                    <span className="text-xs text-gray-500 bg-purple-100 text-purple-800 px-2 py-0.5 rounded w-fit">DOT Team Leader</span>
                  </div>
                  <span className="text-sm text-gray-500 hidden md:inline">{teamLeader.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-full" title="Editar">
                    <Edit2 size={16} />
                  </button>
                  <button className="p-2 text-red-600 hover:bg-red-50 rounded-full" title="Eliminar">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {/* DOTs List (simplified, can be expanded) */}
              {expandedTeamLeaders.has(teamLeader.id) && (
                <div className="pl-8 md:pl-12 border-l-2 border-gray-100 ml-6 my-2 space-y-2">
                  {dots.filter(dot => (dot.dotTeamLeaderId || dot.dot_team_leader_id) === teamLeader.id).map(dot => (
                    <div key={dot.id} className="bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-3 flex-1">
                          <button onClick={() => toggleDot(dot.id)} className="text-gray-400 hover:text-gray-600">
                            {expandedDots.has(dot.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </button>
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-800">{dot.fullname}</span>
                            <span className="text-xs text-gray-500 bg-blue-100 text-blue-800 px-2 py-0.5 rounded w-fit">DOT Operacional</span>
                          </div>
                          <span className="text-xs text-gray-500 hidden md:inline">{dot.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full">
                            <Edit2 size={14} />
                          </button>
                          <button className="p-1.5 text-red-600 hover:bg-red-50 rounded-full">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {/* AMONT Section */}
          {amonts.length > 0 && (
            <div className="bg-indigo-50 p-4 border-t border-indigo-200">
              <h4 className="font-bold text-indigo-900 mb-3">AMONT - Auditores Independentes</h4>
              <div className="space-y-2">
                {amonts.map(amont => (
                  <div key={amont.id} className="flex items-center justify-between bg-white p-3 rounded border border-indigo-200">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">{amont.fullname}</span>
                        <span className="text-xs text-gray-500">{amont.email}</span>
                      </div>
                      <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">AMONT</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-800">
                        <Edit2 size={16} />
                      </button>
                      <button className="text-red-600 hover:text-red-800">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUtilizadores;
