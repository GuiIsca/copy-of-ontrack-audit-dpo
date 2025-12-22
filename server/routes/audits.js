import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// Get all audits
router.get('/', async (req, res) => {
  try {
    const { userId, storeId } = req.query;
    let queryText = 'SELECT * FROM audits';
    const params = [];
    
    if (userId) {
      queryText += ' WHERE dot_operacional_id = $1';
      params.push(userId);
    } else if (storeId) {
      queryText += ' WHERE store_id = $1';
      params.push(storeId);
    }
    
    queryText += ' ORDER BY dtstart DESC';
    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get audits error:', error);
    res.status(500).json({ error: 'Failed to fetch audits' });
  }
});

// Get audit by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM audits WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Audit not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit' });
  }
});

// Create audit
router.post('/', async (req, res) => {
  try {
    const { storeId, dotUserId, checklistId, dtstart, status, createdBy, visitSourceType } = req.body;
    
    // Mark existing SCHEDULED audits for same store/day as REPLACED
    const dtDate = new Date(dtstart);
    const startOfDay = new Date(dtDate.getFullYear(), dtDate.getMonth(), dtDate.getDate()).toISOString();
    const endOfDay = new Date(dtDate.getFullYear(), dtDate.getMonth(), dtDate.getDate() + 1).toISOString();
    
    const existingAudits = await query(
      `SELECT id FROM audits WHERE store_id = $1 AND dtstart >= $2 AND dtstart < $3 AND status = 'SCHEDULED'`,
      [storeId, startOfDay, endOfDay]
    );
    
    if (existingAudits.rows.length > 0) {
      const idsToReplace = existingAudits.rows.map(r => r.id);
      await query(
        `UPDATE audits SET status = 'REPLACED' WHERE id = ANY($1)`,
        [idsToReplace]
      );
      console.log(`Auditorias substituídas: ${idsToReplace.join(', ')}`);
    }
    
    // Insert with visit_source_type if provided
    const result = await query(
      `INSERT INTO audits (store_id, dot_operacional_id, checklist_id, dtstart, status, created_by, visit_source_type) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [storeId, dotUserId || null, checklistId || 1, dtstart, status || 'SCHEDULED', createdBy, visitSourceType || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create audit error:', error);
    res.status(500).json({ error: 'Failed to create audit' });
  }
});

// Update audit
router.put('/:id', async (req, res) => {
  try {
    const { status, dtend, finalScore } = req.body;
    console.log('PUT /api/audits/:id', { id: req.params.id, status, dtend, finalScore });
    const result = await query(
      `UPDATE audits 
       SET status = COALESCE($1, status), 
           dtend = COALESCE($2, dtend),
           final_score = COALESCE($3, final_score)
       WHERE id = $4 RETURNING *`,
      [status, dtend, finalScore, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Audit not found' });
    }
    console.log('Audit updated successfully:', result.rows[0].id);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('PUT /api/audits/:id error:', error);
    res.status(500).json({ error: 'Failed to update audit', details: error.message });
  }
});

// Delete audit
router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM audits WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Audit not found' });
    }
    res.json({ message: 'Audit deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete audit' });
  }
});

export default router;
