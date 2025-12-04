import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { auditId } = req.query;
    if (!auditId) return res.status(400).json({ error: 'auditId required' });

    // Join with users to enrich comments with username and primary role
    const result = await query(
      `SELECT c.id, c.audit_id, c.user_id, c.content, c.is_internal, c.created_at, c.updated_at,
              u.fullname AS username,
              COALESCE(u.roles[1], 'ADERENTE') AS user_role
       FROM audit_comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.audit_id = $1
       ORDER BY c.created_at`,
      [auditId]
    );

    // Map DB fields to client expected shape
    const rows = result.rows.map(r => ({
      id: r.id,
      audit_id: r.audit_id,
      user_id: r.user_id,
      comment: r.content,
      isInternal: r.is_internal,
      timestamp: r.created_at,
      username: r.username,
      userRole: (r.user_role || 'ADERENTE').toUpperCase()
    }));

    res.json(rows);
  } catch (error) {
    console.error('Fetch comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { auditId, userId, content, isInternal } = req.body;
    if (!auditId || !userId || !content) {
      console.error('Create comment validation error:', { auditId, userId, contentLength: content?.length, isInternal });
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const result = await query(
      `INSERT INTO audit_comments (audit_id, user_id, content, is_internal) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [auditId, userId, content, isInternal || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

export default router;
