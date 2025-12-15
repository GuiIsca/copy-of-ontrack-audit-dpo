import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { auditId, sectionId } = req.query;
    let queryText = 'SELECT * FROM action_plans WHERE 1=1';
    const params = [];
    
    if (auditId) {
      queryText += ' AND audit_id = $' + (params.length + 1);
      params.push(auditId);
    }
    
    if (sectionId) {
      queryText += ' AND section_id = $' + (params.length + 1);
      params.push(sectionId);
    }
    
    queryText += ' ORDER BY section_id, due_date';
    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching actions:', error);
    res.status(500).json({ error: 'Failed to fetch actions' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { auditId, storeId, sectionId, criteriaId, title, description, responsible, dueDate, aderenteId, createdBy } = req.body;
    const result = await query(
      `INSERT INTO action_plans (audit_id, store_id, section_id, criteria_id, title, description, responsible, due_date, aderente_id, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [auditId, storeId || null, sectionId || null, criteriaId || null, title, description, responsible, dueDate, aderenteId || null, createdBy]
    );
    console.log('Action created:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating action:', error);
    res.status(500).json({ error: 'Failed to create action', details: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, description, status, progress, completedDate } = req.body;
    const result = await query(
      `UPDATE action_plans 
       SET title = COALESCE($1, title), description = COALESCE($2, description),
           status = COALESCE($3, status), progress = COALESCE($4, progress),
           completed_date = COALESCE($5, completed_date)
       WHERE id = $6 RETURNING *`,
      [title, description, status, progress, completedDate, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Action not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update action' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM action_plans WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Action not found' });
    res.json({ message: 'Action deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete action' });
  }
});

export default router;
