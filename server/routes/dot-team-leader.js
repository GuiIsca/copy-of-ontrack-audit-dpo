import express from 'express';
import multer from 'multer';
import { query } from '../db/index.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Map CSV tipo to DB enum (case-insensitive)
const tipoMap = {
  'auditoria': 'AUDITORIA',
  'formacao': 'FORMACAO',
  'acompanhamento': 'ACOMPANHAMENTO',
  'outros': 'OUTROS'
};

function parseDatePtBR(dateStr) {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts.map(p => p.trim());
  const d = Number(dd), m = Number(mm), y = Number(yyyy);
  if (!d || !m || !y) return null;
  const jsDate = new Date(y, m - 1, d);
  if (isNaN(jsDate.getTime())) return null;
  return jsDate.toISOString();
}

function parseTimePtBR(timeStr) {
  const parts = timeStr.split(':');
  if (parts.length !== 2) return null;
  const [hh, mm] = parts.map(p => p.trim());
  const h = Number(hh), m = Number(mm);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return { hours: h, minutes: m };
}

function combineDateAndTime(dateStr, timeStr) {
  const dateParts = dateStr.split('/');
  if (dateParts.length !== 3) return null;
  const [dd, mm, yyyy] = dateParts.map(p => p.trim());
  const timeParts = timeStr.split(':');
  if (timeParts.length !== 2) return null;
  const [hh, mins] = timeParts.map(p => p.trim());
  
  const d = Number(dd), mo = Number(mm), y = Number(yyyy);
  const h = Number(hh), m = Number(mins);
  
  if (!d || !mo || !y || h < 0 || h > 23 || m < 0 || m > 59) return null;
  
  const jsDate = new Date(y, mo - 1, d, h, m, 0);
  if (isNaN(jsDate.getTime())) return null;
  return jsDate.toISOString();
}

function parseCsvSemicolon(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];
  const header = lines[0].split(';').map(h => h.trim().toLowerCase());
  const dataLines = lines.slice(1);
  return dataLines.map((line, idx) => {
    const cols = line.split(';');
    const row = {};
    header.forEach((h, i) => {
      row[h] = (cols[i] ?? '').trim();
    });
    row.__line = idx + 2;
    return row;
  });
}

// Accept both JSON body { csv } and file upload with field name 'file'
router.post('/import-visitas', upload.single('file'), async (req, res) => {
  try {
    let csv = req.body?.csv;
    if (req.file && req.file.buffer) {
      csv = req.file.buffer.toString('utf8');
    }
    if (!csv || typeof csv !== 'string') {
      return res.status(400).json({ error: 'Missing CSV content (provide json {csv} or upload a file)' });
    }

    const rows = parseCsvSemicolon(csv);
    
    if (rows.length === 0) {
      return res.status(400).json({ error: 'CSV appears empty' });
    }

    const results = { imported: 0, createdVisitIds: [], errors: [] };

    for (const r of rows) {
      try {
        const tipoRaw = r.tipo?.trim();
        const dot = r.dot?.trim();
        const numeroLoja = r.numero_loja?.trim();
        const dataStr = r.data?.trim();
        const horaInicio = r.hora_inicio?.trim();
        const horaFim = r.hora_fim?.trim();
        const titulo = r.titulo?.trim();
        const texto = r.texto?.trim();

        // Validate required fields
        if (!tipoRaw || !dot || !numeroLoja || !dataStr || !horaInicio) {
          const erro = 'Missing required fields (tipo, dot, numero_loja, data, hora_inicio)';
          results.errors.push({ line: r.__line, message: erro });
          continue;
        }

        const tipo = tipoMap[tipoRaw.toLowerCase()] || tipoRaw.toUpperCase();
        
        // Validate tipo
        if (!['AUDITORIA', 'FORMACAO', 'ACOMPANHAMENTO', 'OUTROS'].includes(tipo)) {
          const erro = `Invalid tipo: ${tipoRaw}`;
          results.errors.push({ line: r.__line, message: erro });
          continue;
        }

        // Lookup DOT Operacional user by email
        const userRes = await query('SELECT id FROM users WHERE email = $1', [dot]);
        if (userRes.rows.length === 0) {
          const erro = `DOT user not found: ${dot}`;
          results.errors.push({ line: r.__line, message: erro });
          continue;
        }
        const userId = userRes.rows[0].id;

        // Lookup store by numero field
        const storeRes = await query('SELECT id, dot_operacional_id FROM stores WHERE numero = $1', [numeroLoja]);
        if (storeRes.rows.length === 0) {
          const erro = `Store not found: ${numeroLoja}`;
          results.errors.push({ line: r.__line, message: erro });
          continue;
        }
        const storeId = storeRes.rows[0].id;
        const storeDotId = storeRes.rows[0].dot_operacional_id;

        // Validate that store is assigned to this DOT
        if (storeDotId && Number(storeDotId) !== Number(userId)) {
          const erro = `Loja ${numeroLoja} não está atribuída ao DOT ${dot}`;
          results.errors.push({ line: r.__line, message: erro });
          continue;
        }

        // Combine date + hora_inicio
        const dtstart = combineDateAndTime(dataStr, horaInicio);
        if (!dtstart) {
          const erro = `Invalid date or hora_inicio: ${dataStr} ${horaInicio}`;
          console.warn(`  ❌ ${erro}`);
          results.errors.push({ line: r.__line, message: erro });
          continue;
        }

        // For AUDITORIA: only dtstart, no titulo/texto/dtend
        if (tipo === 'AUDITORIA') {
          // Check for duplicates (same store, same DOT, same day)
          const dtDate = new Date(dtstart);
          const startOfDay = new Date(dtDate.getFullYear(), dtDate.getMonth(), dtDate.getDate()).toISOString();
          const endOfDay = new Date(dtDate.getFullYear(), dtDate.getMonth(), dtDate.getDate() + 1).toISOString();

          const dupAudit = await query(
            `SELECT id FROM audits WHERE store_id = $1 AND dot_operacional_id = $2 AND dtstart >= $3 AND dtstart < $4`,
            [storeId, userId, startOfDay, endOfDay]
          );
          if (dupAudit.rows.length > 0) {
            const erro = `Duplicado: já existe Auditoria para DOT ${dot} na loja ${numeroLoja} em ${dataStr}`;
            results.errors.push({ line: r.__line, message: erro });
            continue;
          }

          const insAudit = await query(
            `INSERT INTO audits (store_id, dot_operacional_id, checklist_id, dtstart, status, created_by)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [storeId, userId, 1, dtstart, 'SCHEDULED', userId]
          );
          console.log(`  ✨ Auditoria criada: id=${insAudit.rows[0].id}`);
          results.imported += 1;
          results.createdVisitIds.push(insAudit.rows[0].id);
        } 
        // For other tipos: insere em visits com titulo, texto e dtend
        else {
          // Validate hora_fim for visits
          if (!horaFim) {
            const erro = `Missing hora_fim for ${tipoRaw}`;
            results.errors.push({ line: r.__line, message: erro });
            continue;
          }

          const dtend = combineDateAndTime(dataStr, horaFim);
          if (!dtend) {
            const erro = `Invalid hora_fim: ${horaFim}`;
            results.errors.push({ line: r.__line, message: erro });
            continue;
          }

          // Validate dtstart < dtend
          if (new Date(dtstart) >= new Date(dtend)) {
            const erro = `hora_inicio must be before hora_fim`;
            results.errors.push({ line: r.__line, message: erro });
            continue;
          }

          // Check for duplicates
          const dtDate = new Date(dtstart);
          const startOfDay = new Date(dtDate.getFullYear(), dtDate.getMonth(), dtDate.getDate()).toISOString();
          const endOfDay = new Date(dtDate.getFullYear(), dtDate.getMonth(), dtDate.getDate() + 1).toISOString();

          const duplicateCheck = await query(
            `SELECT id FROM visits 
             WHERE store_id = $1 AND user_id = $2 AND type = $3 
             AND dtstart >= $4 AND dtstart < $5`,
            [storeId, userId, tipo, startOfDay, endOfDay]
          );
          if (duplicateCheck.rows.length > 0) {
            const erro = `Duplicado: já existe ${tipoRaw} para DOT ${dot} na loja ${numeroLoja} em ${dataStr}`;
            results.errors.push({ line: r.__line, message: erro });
            continue;
          }

          const ins = await query(
            `INSERT INTO visits (store_id, user_id, type, title, description, dtstart, dtend, status, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING id`,
            [storeId, userId, tipo, titulo || '', texto || '', dtstart, dtend, 'SCHEDULED', userId]
          );
          results.imported += 1;
          results.createdVisitIds.push(ins.rows[0].id);
        }
      } catch (rowErr) {
        results.errors.push({ line: r.__line, message: String(rowErr?.message || rowErr) });
      }
    }
    
    return res.json(results);
  } catch (error) {
    console.error('Import visitas error:', error);
    return res.status(500).json({ error: 'Failed to import visitas' });
  }
});

export default router;