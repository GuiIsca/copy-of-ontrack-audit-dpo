import React, { useEffect, useState } from 'react';
import { db } from '../services/dbAdapter';
import { User, Store, UserRole } from '../types';
import { Button } from '../components/ui/Button';
import { Upload, Download } from 'lucide-react';

const AdminImport: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [dotCsv, setDotCsv] = useState<File | null>(null);
  const [aderenteCsv, setAderenteCsv] = useState<File | null>(null);
  const [storeCsv, setStoreCsv] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{created:number;errors:number}|null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setUsers(await db.getUsers());
      setStores(await db.getStores());
    };
    loadData();
  }, []);

  const parseCsvText = (text: string) => text.split('\n').filter(l => l.trim());
  const downloadDotTemplate = () => { const template = `email;fullname;dot_team_leader_email\n`+`dot1@mousquetaires.com;João Silva;leader1@mousquetaires.com\n`+`dot2@mousquetaires.com;Pedro Martins;leader1@mousquetaires.com`; const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'template_dots.csv'; link.click(); };
  const downloadAderenteTemplate = () => { const template = `email;fullname;store_codehex;dot_email\n`+`aderente100@intermarche.pt;Joana Lopes;LOJ018;dot1@mousquetaires.com\n`+`aderente101@intermarche.pt;Paulo Reis;;`; const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'template_aderentes.csv'; link.click(); };
  const downloadStoreTemplate = () => { const template = `codehex;brand;size;city;gpslat;gpslong;dot_email\n`+`LOJ001;Intermarché;Super;Lisboa;38.716;-9.13;dot1@mousquetaires.com\n`+`LOJ002;Bricomarché;Média;Porto;41.15;-8.62;`; const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'template_lojas.csv'; link.click(); };

  const importDOTs = async () => { if (!dotCsv) return; setFeedback(''); setErrorMsg(''); setImportBusy(true); setImportResult(null); try { const text = await dotCsv.text(); const lines = parseCsvText(text); const rows = lines.slice(1); let created = 0, errors = 0; const usersNow = await db.getUsers(); for (const line of rows) { const cols = line.split(';').map(c => c.trim()); if (cols.length < 3) { errors++; continue; } const [email, fullname, dot_team_leader_email] = cols; const leader = usersNow.find(u => u.email === dot_team_leader_email && u.roles.includes(UserRole.DOT_TEAM_LEADER)); if (!leader) { errors++; continue; } try { await db.createUser({ email, fullname, roles: [UserRole.DOT_OPERACIONAL], dotTeamLeaderId: leader.id, assignedStores: [] } as any); created++; } catch { errors++; } } setImportResult({ created, errors }); setFeedback('Importação de DOTs concluída'); } finally { setImportBusy(false); } };
  const importAderentes = async () => { if (!aderenteCsv) return; setFeedback(''); setErrorMsg(''); setImportBusy(true); setImportResult(null); try { const text = await aderenteCsv.text(); const lines = parseCsvText(text); const rows = lines.slice(1); let created = 0, errors = 0; const storesNow = await db.getStores(); const usersNow = await db.getUsers(); for (const line of rows) { const cols = line.split(';').map(c => c.trim()); if (cols.length < 2) { errors++; continue; } const [email, fullname, store_codehex, dot_email] = cols; try { const payload: any = { email, fullname, roles: [UserRole.ADERENTE] }; if (dot_email) { const dot = usersNow.find(u => u.email === dot_email && u.roles.includes(UserRole.DOT_OPERACIONAL)); if (dot) payload.dotTeamLeaderId = dot.id; } if (store_codehex) { const store = storesNow.find(s => s.codehex === store_codehex); if (store) { payload.assignedStores = [store.id]; } } await db.createUser(payload); created++; } catch { errors++; } } setImportResult({ created, errors }); setFeedback('Importação de Aderentes concluída'); } finally { setImportBusy(false); } };
  const importStores = async () => { if (!storeCsv) return; setFeedback(''); setErrorMsg(''); setImportBusy(true); setImportResult(null); try { const text = await storeCsv.text(); const lines = parseCsvText(text); const rows = lines.slice(1); let created = 0, errors = 0; const usersNow = await db.getUsers(); for (const line of rows) { const cols = line.split(';').map(c => c.trim()); if (cols.length < 4) { errors++; continue; } const [codehex, brand, size, city, gpslat, gpslong, dot_email] = cols; try { const payload: any = { codehex, brand: brand || 'Intermarché', size: size || 'Super', city, gpslat: Number(gpslat) || 0, gpslong: Number(gpslong) || 0 }; if (dot_email) { const dot = usersNow.find(u => u.email === dot_email && u.roles.includes(UserRole.DOT_OPERACIONAL)); if (dot) payload.dotUserId = dot.id; } await db.createStore(payload); created++; } catch { errors++; } } setImportResult({ created, errors }); setFeedback('Importação de Lojas concluída'); } finally { setImportBusy(false); } };

  return (
    <div className="max-w-5xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Importar CSV</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded shadow p-4">
          <div className="flex items-center gap-2 mb-3"><Upload className="w-4 h-4" /><h3 className="font-semibold text-gray-900">Importar DOTs (CSV)</h3></div>
          <p className="text-sm text-gray-600 mb-3">Formato: <code>email;fullname;dot_team_leader_email</code>. DOT Team Leader deve existir.</p>
          <div className="flex items-center gap-3 mb-3">
            <input type="file" accept=".csv" onChange={e=>setDotCsv(e.target.files?.[0]||null)} />
            <Button size="sm" onClick={downloadDotTemplate}><Download className="w-4 h-4 mr-2"/>Template</Button>
          </div>
          <Button onClick={importDOTs} disabled={!dotCsv || importBusy}>Importar DOTs</Button>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="flex items-center gap-2 mb-3"><Upload className="w-4 h-4" /><h3 className="font-semibold text-gray-900">Importar Aderentes (CSV)</h3></div>
          <p className="text-sm text-gray-600 mb-3">Formato: <code>email;fullname;store_codehex;dot_email</code> (loja/dot opcionais).</p>
          <div className="flex items-center gap-3 mb-3">
            <input type="file" accept=".csv" onChange={e=>setAderenteCsv(e.target.files?.[0]||null)} />
            <Button size="sm" onClick={downloadAderenteTemplate}><Download className="w-4 h-4 mr-2"/>Template</Button>
          </div>
          <Button onClick={importAderentes} disabled={!aderenteCsv || importBusy}>Importar Aderentes</Button>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="flex items-center gap-2 mb-3"><Upload className="w-4 h-4" /><h3 className="font-semibold text-gray-900">Importar Lojas (CSV)</h3></div>
          <p className="text-sm text-gray-600 mb-3">Formato: <code>codehex;brand;size;city;gpslat;gpslong;dot_email</code>.</p>
          <div className="flex items-center gap-3 mb-3">
            <input type="file" accept=".csv" onChange={e=>setStoreCsv(e.target.files?.[0]||null)} />
            <Button size="sm" onClick={downloadStoreTemplate}><Download className="w-4 h-4 mr-2"/>Template</Button>
          </div>
          <Button onClick={importStores} disabled={!storeCsv || importBusy}>Importar Lojas</Button>
        </div>
        {importResult && (
          <div className="lg:col-span-2 bg-gray-50 border border-gray-200 rounded p-3 mt-2">
            <div className="text-sm text-gray-800">Importação concluída: {importResult.created} criados, {importResult.errors} erros.</div>
          </div>
        )}
        {feedback && (
          <div className="lg:col-span-2 bg-green-50 border border-green-200 rounded p-3 mt-2">
            <div className="text-green-800 text-sm">{feedback}</div>
          </div>
        )}
        {errorMsg && (
          <div className="lg:col-span-2 bg-red-50 border border-red-200 rounded p-3 mt-2">
            <div className="text-red-800 text-sm">{errorMsg}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminImport;
