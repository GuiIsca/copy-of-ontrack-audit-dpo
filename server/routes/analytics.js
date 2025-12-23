import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

const NUMERIC_FIELDS = [
  'vendas_total',
  'vendas_evolucao_pct',
  'variacao_absoluta_eur',
  'seca_pct',
  'fresca_pct',
  'cesto_medio',
  'clientes_total',
  'margem_pct',
  'stock_total',
  'produtividade',
  'custos_pessoal',
  'margem_seminet_pct'
];

const SUM_FIELDS = ['vendas_total', 'variacao_absoluta_eur', 'clientes_total', 'stock_total', 'custos_pessoal'];
const AVG_FIELDS = ['vendas_evolucao_pct', 'seca_pct', 'fresca_pct', 'cesto_medio', 'margem_pct', 'produtividade', 'margem_seminet_pct'];

const parseDate = (value, fallback) => {
  if (!value) return fallback;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? fallback : d;
};

// GET /api/analytics?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&periodType=DAILY|MONTHLY&storeId=123
router.get('/', async (req, res) => {
  try {
    const periodType = req.query.periodType ? req.query.periodType.toString().toUpperCase() : null;
    const storeId = req.query.storeId ? Number(req.query.storeId) : null;

    const defaultEnd = new Date();
    const defaultStart = new Date();
    defaultStart.setDate(defaultEnd.getDate() - 30);

    const startDate = parseDate(req.query.startDate, defaultStart);
    const endDate = parseDate(req.query.endDate, defaultEnd);

    const params = [startDate, endDate];
    let periodFilter = '';
    let storeFilter = '';
    
    if (periodType) {
      params.push(periodType);
      periodFilter = `AND period_type = $${params.length}`;
    }
    
    if (storeId) {
      params.push(storeId);
      storeFilter = `AND (store_id = $${params.length})`;
    }

    const result = await query(
      `SELECT * FROM analytics_kpis 
       WHERE period_date BETWEEN $1 AND $2
         ${periodFilter}
         ${storeFilter}
       ORDER BY period_date ASC`,
      params
    );

    const rows = result.rows;

    const summary = {};

    SUM_FIELDS.forEach((field) => {
      summary[field] = rows
        .map((r) => Number(r[field] ?? 0))
        .reduce((acc, val) => acc + (Number.isFinite(val) ? val : 0), 0);
    });

    AVG_FIELDS.forEach((field) => {
      const values = rows
        .map((r) => r[field])
        .filter((v) => v !== null && v !== undefined && v !== '')
        .map((v) => Number(v))
        .filter((v) => Number.isFinite(v));
      summary[field] = values.length > 0
        ? values.reduce((acc, val) => acc + val, 0) / values.length
        : null;
    });

    // Last available snapshot in the range (useful for %-based indicators)
    const lastSnapshot = rows.length > 0 ? rows[rows.length - 1] : null;

    res.json({
      series: rows,
      summary,
      lastSnapshot,
      meta: {
        periodType,
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
        storeId: storeId || null
      }
    });
  } catch (error) {
    console.error('Analytics GET error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// POST /api/analytics -> upsert a single KPI snapshot (used by Admin uploads)
router.post('/', async (req, res) => {
  try {
    const {
      periodType,
      periodDate,
      storeId = null,
      source = 'manual',
      uploadedBy,
      ...metrics
    } = req.body;

    if (!periodType || !periodDate) {
      return res.status(400).json({ error: 'periodType and periodDate are required' });
    }

    const periodTypeUpper = periodType.toString().toUpperCase();
    const values = NUMERIC_FIELDS.map((f) => (metrics[f] !== undefined && metrics[f] !== null ? metrics[f] : null));

    const insertQuery = `
      INSERT INTO analytics_kpis (
        period_type, period_date, store_id,
        ${NUMERIC_FIELDS.join(', ')}
      ) VALUES (
        $1, $2, $3,
        ${NUMERIC_FIELDS.map((_, idx) => `$${idx + 4}`).join(', ')}
      )
      ON CONFLICT (period_type, period_date, store_id)
      DO UPDATE SET ${NUMERIC_FIELDS.map((f) => `${f} = COALESCE(EXCLUDED.${f}, analytics_kpis.${f})`).join(', ')}, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const insertParams = [periodTypeUpper, periodDate, storeId, ...values];
    const saved = await query(insertQuery, insertParams);

    // Log the upload window (for traceability) using the same date as start/end when single-day
    await query(
      `INSERT INTO analytics_imports (period_type, period_start, period_end, source, uploaded_by, payload)
       VALUES ($1, $2, $2, $3, $4, $5)`,
      [periodTypeUpper, periodDate, source, uploadedBy || null, metrics || null]
    );

    res.status(201).json(saved.rows[0]);
  } catch (error) {
    console.error('Analytics POST error:', error);
    res.status(500).json({ error: 'Failed to save analytics snapshot', details: error.message });
  }
});

// POST /api/analytics/batch -> bulk insert/update for a period window
router.post('/batch', async (req, res) => {
  try {
    const { periodType, items, source = 'manual', uploadedBy, periodStart, periodEnd } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items must be a non-empty array' });
    }
    const periodTypeUpper = (periodType || 'DAILY').toString().toUpperCase();

    const savedRows = [];
    for (const item of items) {
      const values = NUMERIC_FIELDS.map((f) => (item[f] !== undefined ? item[f] : null));
      const params = [periodTypeUpper, item.periodDate, item.storeId || null, ...values];
      const upsert = await query(
        `INSERT INTO analytics_kpis (
          period_type, period_date, store_id, ${NUMERIC_FIELDS.join(', ')}
        ) VALUES (
          $1, $2, $3, ${NUMERIC_FIELDS.map((_, idx) => `$${idx + 4}`).join(', ')}
        )
        ON CONFLICT (period_type, period_date, store_id)
        DO UPDATE SET ${NUMERIC_FIELDS.map((f) => `${f} = EXCLUDED.${f}`).join(', ')}, updated_at = CURRENT_TIMESTAMP
        RETURNING *`,
        params
      );
      savedRows.push(upsert.rows[0]);
    }

    await query(
      `INSERT INTO analytics_imports (period_type, period_start, period_end, source, uploaded_by, payload)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        periodTypeUpper,
        periodStart || items[0]?.periodDate,
        periodEnd || items[items.length - 1]?.periodDate,
        source,
        uploadedBy || null,
        items
      ]
    );

    return res.status(201).json({ saved: savedRows.length, items: savedRows });
  } catch (error) {
    console.error('Analytics batch error:', error);
    res.status(500).json({ error: 'Failed to save analytics batch' });
  }
});

// DELETE /api/analytics/:id -> delete a single KPI snapshot
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM analytics_kpis WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Analytics snapshot not found' });
    }
    
    res.json({ message: 'Analytics snapshot deleted successfully', id: result.rows[0].id });
  } catch (error) {
    console.error('Analytics delete error:', error);
    res.status(500).json({ error: 'Failed to delete analytics snapshot' });
  }
});

export default router;
