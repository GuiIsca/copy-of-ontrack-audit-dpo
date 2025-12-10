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
    const { auditId, sectionId, rating, actionPlan, responsible, dueDate } = req.body;
    console.log('POST /api/section-evaluations received:', { auditId, sectionId, rating, actionPlan, responsible, dueDate });
    
    const result = await query(
      `INSERT INTO section_evaluations (audit_id, section_id, rating, action_plan, responsible, due_date) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       ON CONFLICT (audit_id, section_id) 
       DO UPDATE SET rating = $3, action_plan = $4, responsible = $5, due_date = $6 
       RETURNING *`,
      [auditId, sectionId, rating, actionPlan, responsible, dueDate]
    );
    
    console.log('Section evaluation saved successfully:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error saving section evaluation:', error);
    res.status(500).json({ error: 'Failed to save section evaluation', details: error.message });
  }
});

export default router;
