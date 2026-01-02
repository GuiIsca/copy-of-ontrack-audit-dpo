import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// Get section evaluations for an audit
router.get('/', async (req, res) => {
  try {
    const { auditId } = req.query;
    if (!auditId) return res.status(400).json({ error: 'auditId required' });
    const result = await query('SELECT * FROM section_evaluations WHERE audit_id = $1', [auditId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching section evaluations:', error);
    res.status(500).json({ error: 'Failed to fetch section evaluations' });
  }
});

// Save or update section evaluation
router.post('/', async (req, res) => {
  try {
    const { auditId, sectionId, rating, actionPlan, responsible, dueDate, aderenteId, storeId, createdBy } = req.body;
    console.log('POST /api/section-evaluations received:', { auditId, sectionId, rating, actionPlan, responsible, dueDate, aderenteId, storeId });
    console.log(`[LOG] dueDate recebido:`, dueDate, `| Tipo:`, typeof dueDate);
    
    const result = await query(
      `INSERT INTO section_evaluations (audit_id, section_id, rating, action_plan, responsible, due_date, aderente_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       ON CONFLICT (audit_id, section_id) 
       DO UPDATE SET rating = $3, action_plan = $4, responsible = $5, due_date = $6, aderente_id = $7 
       RETURNING *`,
      [auditId, sectionId, rating, actionPlan, responsible, dueDate, aderenteId || null]
    );
    
    console.log('Section evaluation saved successfully:', result.rows[0]);
    if (result.rows[0]) {
      console.log(`[LOG] due_date persistido no banco:`, result.rows[0].due_date, `| Tipo:`, typeof result.rows[0].due_date);
    }
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error saving section evaluation:', error);
    res.status(500).json({ error: 'Failed to save section evaluation', details: error.message });
  }
});

export default router;
