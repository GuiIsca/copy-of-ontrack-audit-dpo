import React, { useEffect, useMemo, useState } from 'react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/Toast';
import { db } from '../services/dbAdapter';
import { AnalyticsPeriod, AnalyticsResponse, AnalyticsKpi } from '../types';
import { getCurrentUser } from '../utils/auth';
import { isAdmin } from '../utils/permissions';
import { BarChart3, Calendar, RefreshCw, Trash2 } from 'lucide-react';

const formatPercent = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return `${Number(value).toFixed(1)}%`;
};

const formatEuro = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return Number(value).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
};

const formatNumber = (value?: number | null, decimals = 0) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return Number(value).toLocaleString('pt-PT', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

const todayISO = () => new Date().toISOString().slice(0, 10);
const thirtyDaysAgoISO = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
};

const parseNumberOrNull = (value: string) => {
  if (value === '') return null;
  // Replace comma with dot for decimal separator (pt-PT locale support)
  const normalized = value.replace(',', '.');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
};

export const Analytics: React.FC = () => {
  const [startDate, setStartDate] = useState(thirtyDaysAgoISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [response, setResponse] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingDaily, setSavingDaily] = useState<boolean>(false);
  const [savingMonthly, setSavingMonthly] = useState<boolean>(false);
  const { show } = useToast();
  const currentUser = getCurrentUser();
  const userIsAdmin = isAdmin();

  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [deleting, setDeleting] = useState<boolean>(false);

  const [dailyForm, setDailyForm] = useState({
    periodDate: todayISO(),
    storeId: '',
    vendas_total: '',
    vendas_evolucao_pct: '',
    variacao_absoluta_eur: '',
    seca_pct: '',
    fresca_pct: '',
    cesto_medio: '',
    clientes_total: '',
    margem_pct: '',
    stock_total: ''
  });

  const [monthlyForm, setMonthlyForm] = useState({
    periodMonth: todayISO().slice(0, 7),
    produtividade: '',
    custos_pessoal: '',
    margem_seminet_pct: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await db.getAnalytics({ startDate, endDate });
      console.log('📊 Loaded analytics data:', data);
      setResponse(data as AnalyticsResponse);
    } catch (error) {
      console.error('Analytics load error:', error);
      show('Não foi possível obter os dados de analítica.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = async (event: React.FormEvent) => {
    event.preventDefault();
    await loadData();
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    if (endDate && new Date(value) > new Date(endDate)) {
      setEndDate(value);
    }
  };

  const handleEndDateChange = (value: string) => {
    if (new Date(value) < new Date(startDate)) {
      show('Data fim não pode ser anterior à data início.', 'error');
      return;
    }
    setEndDate(value);
  };

  const handleDailySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingDaily(true);
    try {
      const payload: any = {
        periodType: AnalyticsPeriod.DAILY,
        periodDate: dailyForm.periodDate,
        storeId: dailyForm.storeId ? Number(dailyForm.storeId) : null,
        vendas_total: parseNumberOrNull(dailyForm.vendas_total),
        vendas_evolucao_pct: parseNumberOrNull(dailyForm.vendas_evolucao_pct),
        variacao_absoluta_eur: parseNumberOrNull(dailyForm.variacao_absoluta_eur),
        seca_pct: parseNumberOrNull(dailyForm.seca_pct),
        fresca_pct: parseNumberOrNull(dailyForm.fresca_pct),
        cesto_medio: parseNumberOrNull(dailyForm.cesto_medio),
        clientes_total: parseNumberOrNull(dailyForm.clientes_total),
        margem_pct: parseNumberOrNull(dailyForm.margem_pct),
        stock_total: parseNumberOrNull(dailyForm.stock_total),
        source: 'manual-ui',
        uploadedBy: currentUser?.userId || currentUser?.id || null
      };

      await db.saveAnalyticsSnapshot(payload);
      show('Snapshot diário atualizado com sucesso.', 'success');
      await loadData();
      
      // Reset form
      setDailyForm({
        periodDate: todayISO(),
        storeId: '',
        vendas_total: '',
        vendas_evolucao_pct: '',
        variacao_absoluta_eur: '',
        seca_pct: '',
        fresca_pct: '',
        cesto_medio: '',
        clientes_total: '',
        margem_pct: '',
        stock_total: ''
      });
    } catch (error) {
      console.error('Analytics daily save error:', error);
      show('Não foi possível gravar o snapshot diário.', 'error');
    } finally {
      setSavingDaily(false);
    }
  };

  const handleMonthlySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingMonthly(true);
    try {
      const periodDate = `${monthlyForm.periodMonth}-01`;
      const payload: any = {
        periodType: AnalyticsPeriod.MONTHLY,
        periodDate,
        produtividade: parseNumberOrNull(monthlyForm.produtividade),
        custos_pessoal: parseNumberOrNull(monthlyForm.custos_pessoal),
        margem_seminet_pct: parseNumberOrNull(monthlyForm.margem_seminet_pct),
        source: 'manual-ui',
        uploadedBy: currentUser?.userId || currentUser?.id || null
      };

      await db.saveAnalyticsSnapshot(payload);
      show('Snapshot mensal atualizado com sucesso.', 'success');
      await loadData();
      
      // Reset form
      setMonthlyForm({
        periodMonth: todayISO().slice(0, 7),
        produtividade: '',
        custos_pessoal: '',
        margem_seminet_pct: ''
      });
    } catch (error) {
      console.error('Analytics monthly save error:', error);
      show('Não foi possível gravar o snapshot mensal.', 'error');
    } finally {
      setSavingMonthly(false);
    }
  };

  const handleDeleteSnapshot = async () => {
    if (deleteConfirm.id === null) return;
    setDeleting(true);
    try {
      console.log('🗑️ Deleting snapshot with ID:', deleteConfirm.id);
      await db.deleteAnalyticsSnapshot(deleteConfirm.id);
      show('Snapshot apagado com sucesso.', 'success');
      setDeleteConfirm({ open: false, id: null });
      await loadData();
    } catch (error) {
      console.error('Analytics delete error:', error);
      show('Não foi possível apagar o snapshot.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const lastSnapshotDate = useMemo(() => {
    if (!response?.lastSnapshot?.period_date) return null;
    return new Date(response.lastSnapshot.period_date).toLocaleDateString('pt-PT');
  }, [response]);

  const series = response?.series || [];

  const metricCards = [
    {
      label: '% evolução de vendas',
      value: formatPercent(response?.summary?.vendasEvolucaoPct as number | null),
      helper: 'Média no período (diário)',
      color: 'text-emerald-600'
    },
    {
      label: 'Variação absoluta (€)',
      value: formatEuro(response?.summary?.variacaoAbsolutaEur as number | null),
      helper: 'Soma no período',
      color: 'text-blue-600'
    },
    {
      label: 'Vendas',
      value: formatEuro(response?.summary?.vendasTotal as number | null),
      helper: 'Soma no período',
      color: 'text-gray-900'
    },
    {
      label: 'Cesto médio',
      value: formatEuro(response?.summary?.cestoMedio as number | null),
      helper: 'Média no período',
      color: 'text-gray-900'
    },
    {
      label: 'Nº de clientes',
      value: formatNumber(response?.summary?.clientesTotal as number | null),
      helper: 'Soma no período',
      color: 'text-gray-900'
    },
    {
      label: 'Margem',
      value: formatPercent(response?.summary?.margemPct as number | null),
      helper: 'Média no período',
      color: 'text-gray-900'
    },
    {
      label: '% Seca',
      value: formatPercent(response?.summary?.secaPct as number | null),
      helper: 'Média no período',
      color: 'text-gray-900'
    },
    {
      label: '% Fresca',
      value: formatPercent(response?.summary?.frescaPct as number | null),
      helper: 'Média no período',
      color: 'text-gray-900'
    },
    {
      label: 'Stock',
      value: formatEuro(response?.summary?.stockTotal as number | null),
      helper: 'Soma no período',
      color: 'text-gray-900'
    },
    {
      label: 'Produtividade',
      value: formatNumber(response?.summary?.produtividade as number | null, 2),
      helper: 'Média no período',
      color: 'text-gray-900'
    },
    {
      label: 'Custos com pessoal',
      value: formatEuro(response?.summary?.custosPessoal as number | null),
      helper: 'Soma no período',
      color: 'text-gray-900'
    },
    {
      label: 'Margem seminet',
      value: formatPercent(response?.summary?.margemSeminetPct as number | null),
      helper: 'Média no período',
      color: 'text-gray-900'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500">DOT Team Leader & Admin</p>
            <h1 className="text-3xl font-bold text-gray-900">Analítica</h1>
            <p className="text-gray-600">Indicadores diários e mensais sempre em base de dados</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <Calendar size={16} />
            {lastSnapshotDate ? `Última atualização: ${lastSnapshotDate}` : 'Sem dados no período selecionado'}
          </div>
        </div>

        <form onSubmit={handleFilter} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            type="date"
            label="Data início"
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
          />
          <Input
            type="date"
            label="Data fim"
            value={endDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
          />
          <div className="flex items-end">
            <Button type="submit" className="w-full" disabled={loading}>
              <RefreshCw size={16} className="mr-2" />
              Atualizar
            </Button>
          </div>
        </form>

        {loading ? (
          <div className="bg-white border border-gray-100 rounded-lg p-6 text-gray-500">A carregar...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {metricCards.map((card) => (
                <div key={card.label} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-500">{card.label}</p>
                    <BarChart3 size={16} className="text-gray-400" />
                  </div>
                  <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                  <p className="text-xs text-gray-400 mt-1">{card.helper}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Série temporal</h2>
                <p className="text-sm text-gray-500">Todos os snapshots</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">Data</th>
                      <th className="px-3 py-2 text-center font-semibold text-gray-600">Tipo</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-600">% evolução</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-600">Variação €</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-600">Vendas</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-600">Cesto médio</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-600">Clientes</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-600">% Seca</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-600">% Fresca</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-600">Produtividade</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-600">Custos pessoal</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-600">Margem seminet</th>
                      {userIsAdmin && <th className="px-3 py-2 text-center font-semibold text-gray-600">Ações</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {series.length === 0 && (
                      <tr>
                        <td colSpan={userIsAdmin ? 13 : 12} className="px-3 py-4 text-center text-gray-500">Sem dados para o período selecionado.</td>
                      </tr>
                    )}
                    {series.map((row: AnalyticsKpi) => (
                      <tr key={`${row.periodType}-${row.periodDate}-${row.storeId || 'all'}`} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-700">{new Date(row.periodDate).toLocaleDateString('pt-PT')}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${row.periodType === 'DAILY' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                            {row.periodType === 'DAILY' ? 'Diário' : 'Mensal'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">{formatPercent(row.vendasEvolucaoPct)}</td>
                        <td className="px-3 py-2 text-right">{formatEuro(row.variacaoAbsolutaEur)}</td>
                        <td className="px-3 py-2 text-right">{formatEuro(row.vendasTotal)}</td>
                        <td className="px-3 py-2 text-right">{formatEuro(row.cestoMedio)}</td>
                        <td className="px-3 py-2 text-right">{formatNumber(row.clientesTotal)}</td>
                        <td className="px-3 py-2 text-right">{formatPercent(row.secaPct)}</td>
                        <td className="px-3 py-2 text-right">{formatPercent(row.frescaPct)}</td>
                        <td className="px-3 py-2 text-right">{formatNumber(row.produtividade, 2)}</td>
                        <td className="px-3 py-2 text-right">{formatEuro(row.custosPessoal)}</td>
                        <td className="px-3 py-2 text-right">{formatPercent(row.margemSeminetPct)}</td>
                        {userIsAdmin && (
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => setDeleteConfirm({ open: true, id: row.id })}
                              className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:bg-red-50 rounded"
                              title="Apagar snapshot"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {userIsAdmin && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Atualização diária</p>
                      <h3 className="text-lg font-semibold text-gray-900">Vendas e margem</h3>
                    </div>
                  </div>
                  <form className="space-y-3" onSubmit={handleDailySubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        type="date"
                        label="Data"
                        value={dailyForm.periodDate}
                        onChange={(e) => setDailyForm({ ...dailyForm, periodDate: e.target.value })}
                      />
                      <Input
                        type="number"
                        label="Store ID (opcional)"
                        value={dailyForm.storeId}
                        onChange={(e) => setDailyForm({ ...dailyForm, storeId: e.target.value })}
                      />
                      <Input label="% evolução de vendas" value={dailyForm.vendas_evolucao_pct} onChange={(e) => setDailyForm({ ...dailyForm, vendas_evolucao_pct: e.target.value })} />
                      <Input label="Variação absoluta (€)" value={dailyForm.variacao_absoluta_eur} onChange={(e) => setDailyForm({ ...dailyForm, variacao_absoluta_eur: e.target.value })} />
                      <Input label="Vendas" value={dailyForm.vendas_total} onChange={(e) => setDailyForm({ ...dailyForm, vendas_total: e.target.value })} />
                      <Input label="Cesto médio" value={dailyForm.cesto_medio} onChange={(e) => setDailyForm({ ...dailyForm, cesto_medio: e.target.value })} />
                      <Input label="Nº de clientes" value={dailyForm.clientes_total} onChange={(e) => setDailyForm({ ...dailyForm, clientes_total: e.target.value })} />
                      <Input label="Margem (%)" value={dailyForm.margem_pct} onChange={(e) => setDailyForm({ ...dailyForm, margem_pct: e.target.value })} />
                      <Input label="% Seca" value={dailyForm.seca_pct} onChange={(e) => setDailyForm({ ...dailyForm, seca_pct: e.target.value })} />
                      <Input label="% Fresca" value={dailyForm.fresca_pct} onChange={(e) => setDailyForm({ ...dailyForm, fresca_pct: e.target.value })} />
                      <Input label="Stock (€)" value={dailyForm.stock_total} onChange={(e) => setDailyForm({ ...dailyForm, stock_total: e.target.value })} />
                    </div>
                    <Button type="submit" disabled={savingDaily}>
                      {savingDaily ? 'A guardar...' : 'Guardar snapshot diário'}
                    </Button>
                  </form>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Atualização mensal</p>
                      <h3 className="text-lg font-semibold text-gray-900">Produtividade, custos e margem seminet</h3>
                    </div>
                  </div>
                  <form className="space-y-3" onSubmit={handleMonthlySubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        type="month"
                        label="Mês"
                        value={monthlyForm.periodMonth}
                        onChange={(e) => setMonthlyForm({ ...monthlyForm, periodMonth: e.target.value })}
                      />
                      <div />
                      <Input label="Produtividade" value={monthlyForm.produtividade} onChange={(e) => setMonthlyForm({ ...monthlyForm, produtividade: e.target.value })} />
                      <Input label="Custos com pessoal (€)" value={monthlyForm.custos_pessoal} onChange={(e) => setMonthlyForm({ ...monthlyForm, custos_pessoal: e.target.value })} />
                      <Input label="Margem seminet (%)" value={monthlyForm.margem_seminet_pct} onChange={(e) => setMonthlyForm({ ...monthlyForm, margem_seminet_pct: e.target.value })} />
                    </div>
                    <Button type="submit" disabled={savingMonthly}>
                      {savingMonthly ? 'A guardar...' : 'Guardar snapshot mensal'}
                    </Button>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <ConfirmDialog
        open={deleteConfirm.open}
        title="Apagar snapshot"
        message="Tem a certeza que deseja apagar este snapshot? Esta ação não pode ser desfeita."
        confirmText="Apagar"
        cancelText="Cancelar"
        onConfirm={handleDeleteSnapshot}
        onCancel={() => setDeleteConfirm({ open: false, id: null })}
        loading={deleting}
      />
    </div>
  );
};
